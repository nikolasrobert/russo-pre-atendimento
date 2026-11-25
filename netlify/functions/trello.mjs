// Webhook do Trello (/api/trello): card movido atualiza o status; "Agendado" com data cria a sessão.
//
// Variáveis: TRELLO_CHAVE, TRELLO_TOKEN, TRELLO_SEGREDO (segredo do app, confere a assinatura),
//            TRELLO_CALLBACK_URL (a mesma URL cadastrada no webhook), SUPABASE_*, ESTUDIO_ID,
//            SESSAO_HORAS_PADRAO (opcional, padrão 3)
import { Supabase } from '../lib/supabase.mjs';
import { Trello, assinaturaValida } from '../lib/trello.mjs';
import { aplicarAcao, SESSAO_HORAS_PADRAO } from '../lib/quadro.mjs';

const texto = (status, t) => new Response(t, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

export async function processar(req, { env, fetch = globalThis.fetch, log = console }) {
  // o Trello faz um HEAD na URL antes de aceitar o cadastro do webhook
  if (req.method === 'HEAD' || req.method === 'GET') return texto(200, 'ok');
  if (req.method !== 'POST') return texto(405, 'método não permitido');

  const corpo = await req.text();
  if (!assinaturaValida(corpo, env.TRELLO_CALLBACK_URL || '', env.TRELLO_SEGREDO, req.headers.get('x-trello-webhook'))) {
    log.error('webhook do Trello com assinatura inválida');
    return texto(401, 'assinatura inválida');
  }

  let acao;
  try { acao = JSON.parse(corpo).action; } catch { return texto(400, 'json inválido'); }

  try {
    const resultado = await aplicarAcao(acao, {
      db: new Supabase({ url: env.SUPABASE_URL, chave: env.SUPABASE_SERVICE_ROLE_KEY, fetch }),
      trello: new Trello({ chave: env.TRELLO_CHAVE, token: env.TRELLO_TOKEN, fetch }),
      estudioId: env.ESTUDIO_ID,
      horasPadrao: Number(env.SESSAO_HORAS_PADRAO) || SESSAO_HORAS_PADRAO,
    });
    log.log('trello:', resultado);
    return texto(200, resultado);
  } catch (e) {
    // 200 mesmo assim: o erro fica no log e o Trello não fica reenviando sem parar
    log.error('trello: falhou', e.message);
    return texto(200, 'erro registrado');
  }
}

export default (req) => processar(req, { env: process.env });

export const config = { path: '/api/trello' };
