// Resumo das 9h e mensagem do n8n.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { carregar, fetchFalso, ENV, silencioso } = require('./ajuda');

const AGORA = Date.parse('2026-11-26T12:00:00Z');  // 9h em Brasília
const dias = (n) => new Date(AGORA - n * 86400000).toISOString();

test('janela de "hoje" é o dia em Brasília, não em UTC', async () => {
  const { janelaDeHoje } = await carregar('netlify/lib/resumo.mjs');
  assert.deepEqual(janelaDeHoje(Date.parse('2026-11-27T01:30:00Z')), { inicio: '2026-11-26T03:00:00.000Z', fim: '2026-11-27T03:00:00.000Z' });
});

test('resumo lista as novas (quentes primeiro), as sessões do dia e os orçados parados', async () => {
  const { montarResumo } = await carregar('netlify/lib/resumo.mjs');
  const r = montarResumo({
    novas: [
      { temperatura: 'quente', local_corpo: 'Coxa', criado_em: dias(0), cliente: { nome: 'Marcos Lima' } },
      { temperatura: 'fria', local_corpo: 'Mão', criado_em: dias(3), cliente: { nome: 'Lucas' } },
    ],
    orcados: [{ atualizado_em: dias(6), cliente: { nome: 'Ana Souza' } }],
    sessoes: [{ inicio: '2026-11-26T17:00:00Z', ficha: { cliente: { nome: 'Bia Rocha' } } }],
  }, { agora: AGORA, quadroUrl: 'https://trello.com/b/QwEr1234/atendimento' });
  assert.equal(r.tipo, 'resumo');
  assert.deepEqual(r.params, ['2', '🔥Marcos (Coxa) · 🔵Lucas (Mão) 3d', '14:00 Bia', 'Ana (6d)']);
  assert.equal(r.botao, 'QwEr1234');
  assert.match(r.texto, /Sessões hoje: 14:00 Bia/);
});

test('dia limpo não manda nada', async () => {
  const { montarResumo } = await carregar('netlify/lib/resumo.mjs');
  assert.equal(montarResumo({ novas: [], orcados: [], sessoes: [] }), null);
});

test('a função agendada consulta o banco filtrando o estúdio e manda pro n8n', async () => {
  const { rodar } = await carregar('netlify/functions/resumo.mjs');
  const f = fetchFalso([
    ['GET', /\/fichas\?.*status=eq\.novo/, () => ({ json: [{ temperatura: 'morna', local_corpo: 'Braço', criado_em: dias(1), cliente: { nome: 'Carla' } }] })],
    ['GET', /\/fichas\?/, () => ({ json: [] })],
    ['GET', /\/sessoes\?/, () => ({ json: [] })],
  ]);
  const r = await rodar({ env: ENV, fetch: f.fetch, agora: AGORA, log: silencioso });
  assert.equal(r, 'enviado');
  for (const c of f.de(/\/rest\/v1\/fichas/)) assert.match(c.url, new RegExp(`estudio_id=eq\\.${ENV.ESTUDIO_ID}`));
  const [s] = f.de(/\/rest\/v1\/sessoes/);
  assert.match(s.url, /inicio=gte\.2026-11-26T03:00:00\.000Z&inicio=lt\.2026-11-27T03:00:00\.000Z/);
  assert.match(s.url, /ficha\.estudio_id=eq\./);
  const [orc] = f.de(/status=eq\.orcamento_enviado/);
  assert.match(orc.url, /atualizado_em=lt\.2026-11-21T12:00:00\.000Z/);
  assert.equal(f.de(/n8n\.exemplo/)[0].corpo.params[0], '1');
});

// n8n: o Code node roda aqui com $input e $env simulados
const codigo = fs.readFileSync(path.join(__dirname, '..', 'n8n', 'code', 'mensagem.js'), 'utf8');
const rodarNode = (body, env = {}) => new Function('$input', '$env', codigo)({ first: () => ({ json: { body } }) }, env)[0].json;
const WA = { WA_PHONE_NUMBER_ID: '123', WA_PARA: '+55 (27) 99999-0000' };

test('n8n: ficha quente vira modelo ficha_quente com o botão do card', () => {
  const r = rodarNode({ tipo: 'ficha', temperatura: 'quente', params: ['a', 'b', 'c'], botao: 'AbCd1234', texto: 't' }, WA);
  assert.equal(r.enviar, true);
  assert.equal(r.url, 'https://graph.facebook.com/v23.0/123/messages');
  assert.equal(r.waBody.to, '5527999990000');
  assert.equal(r.waBody.template.name, 'ficha_quente');
  assert.deepEqual(r.waBody.template.components[1].parameters, [{ type: 'text', text: 'AbCd1234' }]);
});

test('n8n: ficha morna só avisa no modo demonstração; resumo sempre avisa', () => {
  assert.equal(rodarNode({ tipo: 'ficha', temperatura: 'morna', params: [] }, WA).enviar, false);
  assert.equal(rodarNode({ tipo: 'ficha', temperatura: 'morna', params: [] }, { ...WA, WA_AVISAR_TODAS: 'sim' }).enviar, true);
  const r = rodarNode({ tipo: 'resumo', params: ['1', 'x', 'y', 'z'] }, WA);
  assert.equal(r.enviar, true);
  assert.equal(r.waBody.template.name, 'resumo_diario');
});

test('n8n: modo texto (número de teste da Meta) manda o texto livre; sem destinatário não envia', () => {
  const r = rodarNode({ tipo: 'ficha', temperatura: 'quente', texto: 'Ficha quente: Marcos' }, { ...WA, WA_MODO: 'texto' });
  assert.deepEqual(r.waBody.text, { preview_url: false, body: 'Ficha quente: Marcos' });
  assert.equal(rodarNode({ tipo: 'ficha', temperatura: 'quente' }, { WA_PHONE_NUMBER_ID: '1' }).enviar, false);
  // $env bloqueado no n8n não quebra o node
  const bloqueado = new Proxy({}, { get() { throw new Error('access to env vars denied'); } });
  assert.equal(new Function('$input', '$env', codigo)({ first: () => ({ json: { body: {} } }) }, bloqueado)[0].json.enviar, false);
});
