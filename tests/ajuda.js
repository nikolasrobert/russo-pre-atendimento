// Ajudantes dos testes: carregar módulos .mjs e simular o fetch (Supabase, Trello e n8n) sem rede.
const path = require('path');
const { pathToFileURL } = require('url');

const carregar = (arq) => import(pathToFileURL(path.join(__dirname, '..', arq)).href);

// rotas: [[metodo, regex da URL, (url, opt, corpo) => resposta]]
function fetchFalso(rotas = []) {
  const chamadas = [];
  const fetch = async (url, opt = {}) => {
    const metodo = opt.method || 'GET';
    let corpo = opt.body;
    if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch { /* texto */ } }
    const c = { url: decodeURIComponent(String(url)), metodo, headers: opt.headers || {}, corpo };
    chamadas.push(c);
    const rota = rotas.find(([m, re]) => m === metodo && re.test(c.url));
    const r = rota ? await rota[2](c) : { status: 200, json: [] };
    const status = r.status || 200;
    return {
      ok: status < 400,
      status,
      json: async () => r.json,
      text: async () => (typeof r.json === 'string' ? r.json : JSON.stringify(r.json ?? '')),
    };
  };
  return { fetch, chamadas, de: (re, metodo) => chamadas.filter((c) => re.test(c.url) && (!metodo || c.metodo === metodo)) };
}

const ENV = {
  SUPABASE_URL: 'https://abc.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_teste',
  ESTUDIO_ID: '00000000-0000-0000-0000-000000000001',
  TATUADOR_ID: '00000000-0000-0000-0000-000000000101',
  TRELLO_CHAVE: 'chave-trello',
  TRELLO_TOKEN: 'token-trello',
  TRELLO_LISTA_NOVAS: 'lista-novas',
  TRELLO_ETIQUETA_QUENTE: 'et-quente',
  TRELLO_ETIQUETA_MORNA: 'et-morna',
  TRELLO_ETIQUETA_FRIA: 'et-fria',
  N8N_WEBHOOK_URL: 'https://n8n.exemplo/webhook/russo-avisos',
  AVISO_TOKEN: 'token-aviso',
};

const silencioso = { log: () => {}, error: () => {} };

module.exports = { carregar, fetchFalso, ENV, silencioso };
