// Segurança do painel: escape de saída, CSRF, sessão assinada e senha com scrypt.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// ---------------------------------------------------------------------------
// esc(): todo valor que vem do banco ou do usuário passa por aqui antes de ir pro HTML.
// ---------------------------------------------------------------------------
const MAPA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };

export function esc(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/[&<>"'`]/g, (c) => MAPA[c]);
}

// comparação em tempo constante, para não vazar informação pelo tempo de resposta
export function iguais(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  if (x.length !== y.length || x.length === 0) return false;
  return timingSafeEqual(x, y);
}

// ---------------------------------------------------------------------------
// CSRF: token aleatório num cookie HttpOnly + o mesmo token num campo escondido do formulário.
// Um site de fora não consegue ler o cookie, então não consegue montar um POST válido.
// ---------------------------------------------------------------------------
export const CAMPO_CSRF = '_csrf';
export const COOKIE_CSRF = 'painel_csrf';

export function novoTokenCsrf() {
  return randomBytes(32).toString('hex');
}

export function csrfValido(tokenDoCookie, tokenDoFormulario) {
  return iguais(tokenDoCookie, tokenDoFormulario);
}

// ---------------------------------------------------------------------------
// Sessão: cookie com { email, exp } assinado com HMAC-SHA256.
// ---------------------------------------------------------------------------
export const COOKIE_SESSAO = 'painel_sessao';
const DURACAO_MS = 8 * 60 * 60 * 1000;  // 8 horas

const b64 = (s) => Buffer.from(s).toString('base64url');
const assinar = (dados, segredo) => createHmac('sha256', segredo).update(dados).digest('base64url');

export function criarSessao(email, segredo, agora = Date.now()) {
  const dados = b64(JSON.stringify({ email, exp: agora + DURACAO_MS }));
  return `${dados}.${assinar(dados, segredo)}`;
}

export function lerSessao(valor, segredo, agora = Date.now()) {
  if (!valor || !segredo) return null;
  const [dados, assinatura] = String(valor).split('.');
  if (!dados || !assinatura || !iguais(assinar(dados, segredo), assinatura)) return null;
  try {
    const sessao = JSON.parse(Buffer.from(dados, 'base64url').toString());
    return sessao.exp > agora ? sessao : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Senha: guardada só como hash scrypt no formato scrypt$<sal>$<hash>.
// Gere com: npm run senha -- "a senha"
// ---------------------------------------------------------------------------
export function gerarHashSenha(senha) {
  const sal = randomBytes(16).toString('hex');
  const hash = scryptSync(String(senha), sal, 64).toString('hex');
  return `scrypt$${sal}$${hash}`;
}

export function senhaConfere(senha, guardado) {
  const [tipo, sal, hash] = String(guardado || '').split('$');
  if (tipo !== 'scrypt' || !sal || !hash) return false;
  const tentativa = scryptSync(String(senha ?? ''), sal, 64).toString('hex');
  return iguais(tentativa, hash);
}
