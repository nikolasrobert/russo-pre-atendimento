// Abre uma foto da ficha: gera um link assinado de 5 minutos no Storage e redireciona.
// O caminho tem o id da ficha (UUID), então só abre quem tem o link do card.
import { Supabase } from '../lib/supabase.mjs';
import { BUCKET } from '../lib/ficha/receber.mjs';

export const CAMINHO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(local|referencia|cobertura)-\d{1,2}\.(jpg|png|webp|heic|heif|gif)$/;

export async function processar(req, { env, fetch = globalThis.fetch }) {
  const caminho = decodeURIComponent(new URL(req.url).pathname.replace(/^\/arquivo\//, ''));
  if (req.method !== 'GET' || !CAMINHO.test(caminho)) return new Response('não encontrado', { status: 404 });
  try {
    const db = new Supabase({ url: env.SUPABASE_URL, chave: env.SUPABASE_SERVICE_ROLE_KEY, fetch });
    const url = await db.urlAssinada(BUCKET, caminho, 300);
    return new Response(null, { status: 302, headers: { location: url, 'cache-control': 'no-store', 'x-robots-tag': 'noindex', 'referrer-policy': 'no-referrer' } });
  } catch {
    return new Response('não encontrado', { status: 404 });
  }
}

export default (req) => processar(req, { env: process.env });

export const config = { path: '/arquivo/*' };
