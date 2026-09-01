// worker.js - 静态资源托管 + API 代理 + CAS 登录代理
const ALLOWED_HOSTS = ['jwgl.whu.edu.cn', 'cas.whu.edu.cn'];
const ALLOWED_ORIGIN = 'https://ham-web.vercel.app';
const FRONTEND_URL = 'https://ham-web.vercel.app';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') return corsResponse();
    if (url.pathname === '/health') return new Response('OK', { headers: corsHeaders() });
    if (url.pathname.startsWith('/api/cas/')) return handleCasProxy(request, url);
    if (url.pathname.startsWith('/api/')) return handleApiProxy(request, url);
    return new Response('Not Found', { status: 404, headers: corsHeaders() });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://ham-web.vercel.app',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cookie, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

function corsResponse() { return new Response(null, { headers: corsHeaders() }); }

async function handleCasProxy(request, url) {
  const targetPath = url.pathname.replace('/api/cas', '') + url.search;
  const targetUrl = `https://cas.whu.edu.cn${targetPath}`;
  const headers = new Headers(request.headers);
  headers.set('Host', 'cas.whu.edu.cn');
  headers.set('Referer', 'https://cas.whu.edu.cn/');
  headers.delete('origin');
  headers.delete('content-length');

  try {
    const targetUrlObj = new URL(request.url);
    const ticket = url.searchParams.get('ticket');
    const isLoginPath = url.pathname.includes('/login') || url.pathname.includes('/authserver/login');

    // 1. 如果是 ticket 验证请求
    if (url.searchParams.get('ticket') && url.pathname.includes('/login')) {
      return proxyToCas(request, url);
    }

    // 2. 正常 CAS 登录页面代理
    const casResp = await fetch(`https://cas.whu.edu.cn${url.pathname.replace('/api/cas', '') + url.search}`, {
      method: request.method,
      headers: { Host: 'cas.whu.edu.cn', Referer: 'https://cas.whu.edu.cn/', Cookie: request.headers.get('Cookie') || '' },
      body: ['GET', 'HEAD'].includes(request.method) ? null : await request.text(),
      redirect: 'manual',
    });

    // 检查 CAS 登录成功后的重定向
    const casLocation = casResp.headers.get('Location');
    if (casLocation && casLocation.includes('ticket=')) {
      const ticketMatch = casLocation.match(/ticket=([^&]+)/);
      if (ticketMatch) {
        return new Response(null, { 
          status: 302, 
          headers: { 'Location': `https://ham-web.vercel.app?ticket=${ticketMatch[1]}`, 'Access-Control-Allow-Origin': 'https://ham-web.vercel.app', 'Access-Control-Allow-Credentials': 'true' }
        });
      }
    }

    // 常规代理响应
    return addCorsHeaders(new Response(casResp.body, { status: casResp.status, statusText: casResp.statusText, headers: casResp.headers }));
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
    const resp = await fetch(`https://${targetHost}${targetPath}`, {
      method: request.method,
      headers: { Host: targetHost, Referer: `https://${targetHost}/`, Cookie: request.headers.get('Cookie') || '' },
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
      const newHeaders = new Headers();
      newHeaders.set('set-cookie', fixedCookies);
      corsHeaders().forEach((v, k) => newHeaders.set(k, v));
      for (const [k, v] of Object.entries(corsHeaders())) {
        if (!respHeaders.has(k)) respHeaders.set(k, v);
      }
      return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: newHeaders });
    }

    const newHeaders = new Headers();
    Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v));
    for (const [k, v] of Object.entries(corsHeaders())) newHeaders.set(k, v);
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: newHeaders });
  } catch (err) {
    return new Response(`Proxy Error: ${err.message}`, { status: 502, headers: corsHeaders() });
  }
}