// worker.js - 合并：静态资源托管 + API 代理
const ALLOWED_HOSTS = ['jwgl.whu.edu.cn', 'cas.whu.edu.cn'];
const ALLOWED_ORIGIN = 'https://ham-web.1845639127.workers.dev';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 1. 静态资源优先（前端文件）
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return addCorsHeaders(assetResponse);
      }
    }
    
    // 2. API 代理
    if (url.pathname.startsWith('/api/')) {
      return handleApiProxy(request, url);
    }
    
    // 3. SPA 回退：返回 index.html
    if (env.ASSETS) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      const assetResponse = await env.ASSETS.fetch(indexRequest);
      return addCorsHeaders(assetResponse);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleApiProxy(request, url) {
  // CORS 预检
  if (request.method === 'OPTIONS') return corsResponse();
  
  const targetHost = url.searchParams.get('__host') || 'jwgl.whu.edu.cn';
  if (!['jwgl.whu.edu.cn', 'cas.whu.edu.cn'].includes(targetHost)) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders() });
  }
  
  const targetPath = url.pathname.replace('/api', '') + url.search.replace(/[?&]__host=[^&]*/, '');
  const targetUrl = `https://${targetHost}${targetPath}`;
  
  const headers = new Headers(request.headers);
  headers.set('Host', targetHost);
  headers.set('Referer', `https://${targetHost}/`);
  headers.delete('origin');
  headers.delete('content-length');
  
  try {
    const resp = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? null : await request.text(),
      redirect: 'manual',
    });
    
    const respHeaders = new Headers(resp.headers);
    respHeaders.set('Access-Control-Expose-Headers', 'Set-Cookie, Content-Length');
    
    const cookies = resp.headers.get('set-cookie');
    if (cookies) {
      const fixedCookies = cookies.split(', ').map(c => 
        c.replace(/;\s*Domain=[^;]+/gi, '').replace(/;\s*Secure/gi, '; Secure; SameSite=None')
      ).join(', ');
      respHeaders.set('set-cookie', fixedCookies);
    }
    
    Object.entries(corsHeaders()).forEach(([k, v]) => respHeaders.set(k, v));
    
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: respHeaders });
  } catch (err) {
    return new Response(`Proxy Error: ${err.message}`, { status: 502, headers: corsHeaders() });
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cookie, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

function corsResponse() { return new Response(null, { headers: corsHeaders() }); }

function addCorsHeaders(response) {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
}