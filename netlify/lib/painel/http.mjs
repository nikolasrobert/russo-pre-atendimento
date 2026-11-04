// Respostas HTTP do painel, com os cabeçalhos de segurança, e leitura de cookies.

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://cdn.jsdelivr.net",
  "style-src 'self' https://cdn.jsdelivr.net",
  "img-src 'self' data:",
  "font-src 'self' https://cdn.jsdelivr.net",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join('; ');

const SEGURANCA = {
  'content-security-policy': CSP,
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'cache-control': 'no-store',
};

export function lerCookies(req) {
  const saida = {};
  for (const parte of String(req.headers.get('cookie') || '').split(';')) {
    const i = parte.indexOf('=');
    if (i > 0) saida[parte.slice(0, i).trim()] = decodeURIComponent(parte.slice(i + 1).trim());
  }
  return saida;
}

export function cookie(nome, valor, { https = true, maxAge, httpOnly = true } = {}) {
  const partes = [`${nome}=${encodeURIComponent(valor)}`, 'Path=/painel', 'SameSite=Strict'];
  if (httpOnly) partes.push('HttpOnly');
  if (https) partes.push('Secure');
  if (maxAge !== undefined) partes.push(`Max-Age=${maxAge}`);
  return partes.join('; ');
}

function montar(status, corpo, extras = {}, cookies = []) {
  const headers = new Headers({ ...SEGURANCA, ...extras });
  for (const c of cookies) headers.append('set-cookie', c);
  return new Response(corpo, { status, headers });
}

export const html = (status, corpo, cookies = []) =>
  montar(status, corpo, { 'content-type': 'text/html; charset=utf-8' }, cookies);

// 303: depois de um POST, o navegador volta com GET (padrão Post/Redirect/Get)
export const redirecionar = (local, cookies = []) => montar(303, null, { location: local }, cookies);
