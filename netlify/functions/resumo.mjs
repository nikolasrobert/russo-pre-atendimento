// Resumo diário, todo dia às 9h de Brasília (12h UTC): função agendada do Netlify.
// Lê o Supabase e manda para o n8n, que entrega no WhatsApp.
//
// Variáveis: SUPABASE_*, ESTUDIO_ID, N8N_WEBHOOK_URL, AVISO_TOKEN, TRELLO_QUADRO_URL (opcional)
import { Supabase } from '../lib/supabase.mjs';
import { buscarDados, montarResumo } from '../lib/resumo.mjs';
import { enviarAviso } from '../lib/avisos.mjs';

export async function rodar({ env, fetch = globalThis.fetch, agora = Date.now(), log = console }) {
  const db = new Supabase({ url: env.SUPABASE_URL, chave: env.SUPABASE_SERVICE_ROLE_KEY, fetch });
  const resumo = montarResumo(await buscarDados(db, env.ESTUDIO_ID, agora), { agora, quadroUrl: env.TRELLO_QUADRO_URL });
  if (!resumo) { log.log('resumo: dia limpo, nada enviado'); return 'dia limpo'; }
  const r = await enviarAviso(resumo, { url: env.N8N_WEBHOOK_URL, token: env.AVISO_TOKEN, fetch });
  log.log('resumo:', r.enviado ? 'enviado' : r.motivo);
  return r.enviado ? 'enviado' : r.motivo;
}

export default async () => {
  await rodar({ env: process.env });
  return new Response('ok');
};

export const config = { schedule: '0 12 * * *' };
