// Painel do tatuador (CRUD das fichas). Rotas em /painel e /painel/*.
//
// Variáveis no Netlify:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   banco (a chave fica só aqui, nunca no navegador)
//   ESTUDIO_ID, TATUADOR_ID                   de quem são as fichas
//   PAINEL_EMAIL, PAINEL_SENHA_HASH           login (gere o hash com: npm run senha -- "sua senha")
//   SESSAO_SEGREDO                            texto aleatório longo, assina o cookie de sessão
//   PAINEL_DEMO=1                             opcional: usa dados de exemplo em memória, sem Supabase
import { randomBytes } from 'node:crypto';
import { processar } from '../lib/painel/app.mjs';
import { FichaModel } from '../lib/painel/models/ficha-model.mjs';
import { SupabaseStore } from '../lib/painel/stores/supabase.mjs';
import { MemoriaStore, exemplos } from '../lib/painel/stores/memoria.mjs';
import { gerarHashSenha } from '../lib/painel/seguranca.mjs';

let demo = null;  // no modo demonstração, os dados vivem enquanto a função estiver de pé

function montar(env) {
  if (env.PAINEL_DEMO === '1') {
    demo ??= {
      model: new FichaModel(new MemoriaStore(exemplos())),
      senhaHash: gerarHashSenha('demo1234'),
      segredo: randomBytes(32).toString('hex'),
    };
    return {
      model: demo.model,
      config: {
        demo: true,
        email: env.PAINEL_EMAIL || 'demo@painel.local',
        senhaHash: env.PAINEL_SENHA_HASH || demo.senhaHash,
        segredo: env.SESSAO_SEGREDO || demo.segredo,
      },
    };
  }

  const faltando = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ESTUDIO_ID', 'TATUADOR_ID', 'PAINEL_EMAIL', 'PAINEL_SENHA_HASH', 'SESSAO_SEGREDO']
    .filter((k) => !env[k]);
  if (faltando.length) throw new Error(`variáveis faltando: ${faltando.join(', ')}`);

  return {
    model: new FichaModel(new SupabaseStore({
      url: env.SUPABASE_URL, chave: env.SUPABASE_SERVICE_ROLE_KEY, estudioId: env.ESTUDIO_ID, tatuadorId: env.TATUADOR_ID,
    })),
    config: { demo: false, email: env.PAINEL_EMAIL, senhaHash: env.PAINEL_SENHA_HASH, segredo: env.SESSAO_SEGREDO },
  };
}

export default async (req) => {
  let partes;
  try {
    partes = montar(process.env);
  } catch (e) {
    console.error('painel sem configuração:', e.message);
    return new Response('Painel fora do ar: configuração incompleta.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  return processar(req, partes);
};

export const config = { path: ['/painel', '/painel/*'] };
