// Quadro do Trello → banco: status, sessão e assinatura do webhook.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar, fetchFalso, ENV, silencioso } = require('./ajuda');

const URL_RETORNO = 'https://ficha.exemplo/api/trello';
const env = { ...ENV, TRELLO_SEGREDO: 'segredo-do-app', TRELLO_CALLBACK_URL: URL_RETORNO };
const FICHA = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

const mover = (coluna, extra = {}) => ({ action: { type: 'updateCard', data: { card: { id: 'card-1', name: 'x' }, listBefore: { name: 'Novas' }, listAfter: { name: coluna }, old: { idList: 'l0' }, ...extra } } });

async function chamar(evento, { statusAtual = 'novo', due = '2026-12-05T17:00:00.000Z', sessao = null, assinatura } = {}) {
  const { processar } = await carregar('netlify/functions/trello.mjs');
  const { assinaturaTrello } = await carregar('netlify/lib/trello.mjs');
  const f = fetchFalso([
    ['GET', /\/rest\/v1\/fichas\?select=id,status&trello_card_id=eq\.card-1/, () => ({ json: [{ id: FICHA, status: statusAtual }] })],
    ['GET', /\/rest\/v1\/sessoes\?/, () => ({ json: sessao ? [sessao] : [] })],
    ['GET', /api\.trello\.com\/1\/cards\/card-1/, () => ({ json: { id: 'card-1', due } })],
  ]);
  const corpo = JSON.stringify(evento);
  const req = new Request(URL_RETORNO, { method: 'POST', body: corpo, headers: { 'x-trello-webhook': assinatura ?? assinaturaTrello(corpo, URL_RETORNO, env.TRELLO_SEGREDO) } });
  const res = await processar(req, { env, fetch: f.fetch, log: silencioso });
  return { res, texto: await res.text(), f };
}

test('o Trello consegue validar a URL (HEAD) antes de cadastrar o webhook', async () => {
  const { processar } = await carregar('netlify/functions/trello.mjs');
  assert.equal((await processar(new Request(URL_RETORNO, { method: 'HEAD' }), { env })).status, 200);
});

test('assinatura errada é recusada e nada muda no banco', async () => {
  const { res, f } = await chamar(mover('Fechado'), { assinatura: 'falsa' });
  assert.equal(res.status, 401);
  assert.equal(f.chamadas.length, 0);
});

test('mover o card atualiza o status da ficha', async () => {
  const casos = [['Em conversa', 'em_conversa'], ['Orçamento enviado', 'orcamento_enviado'], ['Fechado', 'fechado'], ['ORCAMENTO ENVIADO', 'orcamento_enviado']];
  for (const [coluna, status] of casos) {
    const { texto, f } = await chamar(mover(coluna));
    assert.equal(texto, `status ${status}`);
    const [patch] = f.de(/\/rest\/v1\/fichas\?id=eq\./, 'PATCH');
    assert.deepEqual(patch.corpo, { status });
    assert.match(patch.url, new RegExp(FICHA));
  }
});

test('"Agendado" com data cria a sessão com a data do card', async () => {
  const { texto, f } = await chamar(mover('Agendado'));
  assert.equal(texto, 'status agendado, sessão criada');
  const [nova] = f.de(/\/rest\/v1\/sessoes$/, 'POST');
  assert.deepEqual(nova.corpo, [{ ficha_id: FICHA, inicio: '2026-12-05T17:00:00.000Z', duracao_horas: 3 }]);
});

test('"Agendado" sem data não cria sessão e comenta no card pedindo a data', async () => {
  const { texto, f } = await chamar(mover('Agendado'), { due: null });
  assert.equal(texto, 'agendado sem data');
  assert.equal(f.de(/\/rest\/v1\/sessoes$/, 'POST').length, 0);
  const [com] = f.de(/actions\/comments/);
  assert.match(com.corpo.text, /data/);
});

test('mover de novo para "Agendado" não duplica a sessão; mudar a data do card remarca', async () => {
  const sessao = { id: 's1', inicio: '2026-12-05T17:00:00+00:00' };
  const mesma = await chamar(mover('Agendado'), { statusAtual: 'agendado', sessao });
  assert.equal(mesma.texto, 'status agendado, sessão mantida');
  assert.equal(mesma.f.de(/sessoes/, 'POST').length, 0);

  const novaData = { action: { type: 'updateCard', data: { card: { id: 'card-1', due: '2026-12-08T13:00:00.000Z' }, old: { due: '2026-12-05T17:00:00.000Z' } } } };
  const { texto, f } = await chamar(novaData, { statusAtual: 'agendado', sessao });
  assert.equal(texto, 'sessão atualizada');
  assert.deepEqual(f.de(/\/rest\/v1\/sessoes\?id=eq\.s1/, 'PATCH')[0].corpo, { inicio: '2026-12-08T13:00:00.000Z' });
});

test('"Perdido" e card arquivado cancelam a sessão marcada', async () => {
  const perdido = await chamar(mover('Perdido'), { statusAtual: 'agendado' });
  assert.equal(perdido.texto, 'status perdido');
  assert.deepEqual(perdido.f.de(/\/rest\/v1\/sessoes\?ficha_id=eq\./, 'PATCH')[0].corpo, { status: 'cancelada' });

  const arquivar = { action: { type: 'updateCard', data: { card: { id: 'card-1', closed: true }, old: { closed: false } } } };
  const arq = await chamar(arquivar, { statusAtual: 'agendado' });
  assert.equal(arq.texto, 'status arquivado');
});

test('coluna desconhecida, comentário ou card sem ficha são ignorados', async () => {
  assert.equal((await chamar(mover('Ideias soltas'))).texto, 'ignorada');
  assert.equal((await chamar({ action: { type: 'commentCard', data: { card: { id: 'card-1' } } } })).texto, 'ignorada');
  const { processar } = await carregar('netlify/functions/trello.mjs');
  const { assinaturaTrello } = await carregar('netlify/lib/trello.mjs');
  const f = fetchFalso([['GET', /fichas/, () => ({ json: [] })]]);
  const corpo = JSON.stringify(mover('Fechado'));
  const res = await processar(new Request(URL_RETORNO, { method: 'POST', body: corpo, headers: { 'x-trello-webhook': assinaturaTrello(corpo, URL_RETORNO, env.TRELLO_SEGREDO) } }), { env, fetch: f.fetch, log: silencioso });
  assert.equal(await res.text(), 'card sem ficha');
});

test('nome das colunas aceita acento e maiúscula', async () => {
  const { statusDaColuna } = await carregar('netlify/lib/trello.mjs');
  assert.equal(statusDaColuna(' Orçamento Enviado '), 'orcamento_enviado');
  assert.equal(statusDaColuna('novas'), 'novo');
  assert.equal(statusDaColuna('Backlog'), null);
});
