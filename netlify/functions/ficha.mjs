// Recebe a ficha do site (POST /api/ficha) e entrega para o controller em netlify/lib/ficha/receber.mjs.
//
// Variáveis no Netlify:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ESTUDIO_ID, TATUADOR_ID   obrigatórias
//   TRELLO_CHAVE, TRELLO_TOKEN, TRELLO_LISTA_NOVAS                      card no Trello
//   TRELLO_ETIQUETA_QUENTE, TRELLO_ETIQUETA_MORNA, TRELLO_ETIQUETA_FRIA  etiquetas (opcionais)
//   N8N_WEBHOOK_URL, AVISO_TOKEN                                        aviso no WhatsApp pelo n8n
import { receberFicha } from '../lib/ficha/receber.mjs';
import { Supabase } from '../lib/supabase.mjs';
import { Trello } from '../lib/trello.mjs';

const json = (status, obj) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export async function processar(req, { env, fetch = globalThis.fetch, agora, uuid, log = console }) {
  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido.' });
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.ESTUDIO_ID || !env.TATUADOR_ID) {
    log.error('ficha sem configuração do Supabase');
    return json(503, { erro: 'Ficha fora do ar por configuração. Me chama no direct.' });
  }

  let form;
  try { form = await req.formData(); } catch { return json(400, { erro: 'Não consegui ler o envio. Tenta de novo.' }); }

  const db = new Supabase({ url: env.SUPABASE_URL, chave: env.SUPABASE_SERVICE_ROLE_KEY, fetch });
  const trello = env.TRELLO_CHAVE && env.TRELLO_TOKEN ? new Trello({ chave: env.TRELLO_CHAVE, token: env.TRELLO_TOKEN, fetch }) : null;

  try {
    const { status, corpo } = await receberFicha(form, { db, trello, env, origem: new URL(req.url).origin, agora, uuid, fetch, log });
    return json(status, corpo);
  } catch (e) {
    log.error('ficha não foi gravada', e.message);
    return json(502, { erro: 'A ficha não foi gravada. Suas respostas continuam aí: tenta de novo em um minuto.' });
  }
}

export default (req) => processar(req, { env: process.env });

export const config = { path: '/api/ficha' };
