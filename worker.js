// worker.js - 静态资源托管 + API 代理 + CAS 登录代理
const ALLOWED_HOSTS = ['jwgl.whu.edu.cn', 'cas.whu.edu.cn'];
// 允许的前端域名
const ALLOWED_ORIGIN = 'https://ham-web.vercel.app';
const FRONTEND_URL = 'https://ham-web.vercel.app';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 1. CORS 预检
    if (request.method === 'OPTIONS') return corsResponse();
    
    // 2. 健康检查
    if (url.pathname === '/health') return new Response('OK', { headers: corsHeaders() });
    
    // 3. CAS 登录代理
    if (url.pathname.startsWith('/api/cas/')) {
      return handleCasProxy(request, url);
    }
    
    // 4. API 代理
    if (url.pathname.startsWith('/api/')) {
      return handleApiProxy(request, url);
    }
    
    // 404
    return new Response('Not Found', { status: 404, headers: corsHeaders() });
  }
};

async function handleCasProxy(request, url) {
  const targetHost = 'cas.whu.edu.cn';
  const targetPath = url.pathname.replace('/api/cas', '') + url.search;
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
    
    // 检查 CAS 登录成功后的重定向（包含 ticket 参数）
    const location = resp.headers.get('Location');
    if (location && location.includes('ticket=')) {
      // CAS 登录成功，提取 ticket 并重定向回前端
      const ticketMatch = location.match(/ticket=([^&]+)/);
      if (ticketMatch) {
        const ticket = ticketMatch[1];
        const frontendUrl = `${FRONTEND_URL}?ticket=${ticket}`;
        const respHeaders = new Headers();
        respHeaders.set('Location', frontendUrl);
        respHeaders.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
        respHeaders.set('Access-Control-Allow-Credentials', 'true');
        return new Response(null, { status: 302, headers: respHeaders });
      }
    }
    
    const respHeaders = new Headers(resp.headers);
    // 关键：暴露 Location 头用于重定向
    respHeaders.set('Access-Control-Expose-Headers', 'Set-Cookie, Location, Content-Length');
    
    const cookies = resp.headers.get('set-cookie');
    if (cookies) {
      const fixedCookies = cookies.split(', ').map(c => 
        c.replace(/;\s*Domain=[^;]+/gi, '').replace(/;\s*Secure/gi, '; Secure; SameSite=None')
      ).join(', ');
      respHeaders.set('set-cookie', fixedCookies);
    }
    
    Object.entries(corsHeaders()).forEach(([k, v]) => respHeaders.set(k, v));
    
    return new Response(resp.body, { 
      status: resp.status, 
      statusText: resp.statusText, 
      headers: respHeaders 
    });
  } catch (err) {
    return new Response(`Proxy Error: ${err.message}`, { status: 502, headers: corsHeaders() });
  }
}

async function handleApiProxy(request, url) {
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
    respHeaders.set('Access-Control-Expose-Headers', 'Set-Cookie, Location, Content-Length');
    
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