// Ficha pública → Supabase → Trello → aviso. Tudo com fetch simulado, sem rede.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar, fetchFalso, ENV, silencioso } = require('./ajuda');

const ID = '11111111-2222-4333-8444-555555555555';
const AGORA = Date.parse('2026-11-26T13:00:00Z');

// as respostas exatamente como o site/index.html manda
function respostas(extra = {}) {
  const base = {
    'Como te chamo?': 'Marcos Lima',
    'Seu @ do Instagram': '@Marcos.Lima',
    'WhatsApp': '(27) 99999-1111',
    'De onde você vem?': 'Vila Velha',
    'É sua primeira tatuagem?': 'Tenho uma ou duas',
    'Me conta a ideia': 'Uma cobra enrolada num punhal, old school com sombra pesada, pegando a coxa de frente.',
    'Onde no corpo?': 'Coxa',
    'Tamanho aproximado': '15 a 25 cm',
    'É cobertura de uma tattoo antiga?': 'Não',
    'Preto e cinza ou colorido?': 'Preto e cinza',
    'Quanto você tem pra investir nesse projeto?': 'R$ 2.000 a 4.000',
    'Quando você quer fazer?': 'Nos próximos 30 dias',
    'Quando você consegue vir?': ['Sábado', 'Sou flexível'],
    'Como você chegou até mim?': 'Indicação',
    'Quem te indicou?': 'Ana',
    'Combinado?': ['1', '2', '3', '4'],
    ...extra,
  };
  return Object.entries(base).filter(([, v]) => v !== undefined).map(([label, value]) => ({ label, value }));
}

function envio({ extra, site = '', fotos = ['local', 'ref'] } = {}) {
  const fd = new FormData();
  fd.append('respostas', JSON.stringify(respostas(extra)));
  fd.append('site', site);
  if (fotos.includes('local')) fd.append('arquivo:Foto do local', new File([new Uint8Array(2048)], 'fotoLocal-1.jpg', { type: 'image/jpeg' }));
  if (fotos.includes('ref')) fd.append('arquivo:Referências', new File([new Uint8Array(1024)], 'refs-1.jpg', { type: 'image/jpeg' }));
  fd.append('arquivo:Referências', new File(['x'], 'virus.exe', { type: 'application/octet-stream' }));
  return new Request('https://ficha.exemplo/api/ficha', { method: 'POST', body: fd });
}

function rotas({ trelloFalha = false } = {}) {
  return fetchFalso([
    ['POST', /\/rest\/v1\/clientes/, (c) => ({ status: 201, json: [{ id: 'cli-1', ...c.corpo[0] }] })],
    ['POST', /\/rest\/v1\/fichas$/, () => ({ status: 201, json: null })],
    ['POST', /\/storage\/v1\/object\/fichas\//, () => ({ status: 200, json: { Key: 'ok' } })],
    ['POST', /\/rest\/v1\/fotos/, () => ({ status: 201, json: null })],
    ['PATCH', /\/rest\/v1\/fichas\?id=eq\./, () => ({ status: 204 })],
    ['POST', /api\.trello\.com\/1\/cards$/, () => (trelloFalha ? { status: 500, json: 'fora' } : { json: { id: 'card-1', shortUrl: 'https://trello.com/c/AbCd1234' } })],
    ['POST', /n8n\.exemplo/, () => ({ json: { ok: true } })],
  ]);
}

async function enviar(req, f = rotas(), env = ENV) {
  const { processar } = await carregar('netlify/functions/ficha.mjs');
  const res = await processar(req, { env, fetch: f.fetch, agora: AGORA, uuid: () => ID, log: silencioso });
  return { res, corpo: await res.json(), f };
}

test('ficha válida grava cliente, ficha com nota e fotos no Supabase', async () => {
  const { res, corpo, f } = await enviar(envio());
  assert.equal(res.status, 200);
  assert.deepEqual(corpo, { ok: true, id: ID });

  const [cli] = f.de(/\/rest\/v1\/clientes/, 'POST');
  assert.match(cli.url, /on_conflict=estudio_id,instagram/);
  assert.deepEqual(cli.corpo, [{ nome: 'Marcos Lima', instagram: 'marcos.lima', whatsapp: '27999991111', cidade: 'Vila Velha', regiao: 'grande_vitoria', estudio_id: ENV.ESTUDIO_ID }]);

  const [ficha] = f.de(/\/rest\/v1\/fichas$/, 'POST')[0].corpo;
  assert.equal(ficha.id, ID);
  assert.equal(ficha.cliente_id, 'cli-1');
  assert.equal(ficha.tatuador_id, ENV.TATUADOR_ID);
  assert.equal(ficha.canal, 'site');
  assert.equal(ficha.status, 'novo');
  assert.deepEqual(ficha.disponibilidade, ['Sábado', 'Sou flexível']);
  // indicação +2, referência +2, foto do local +2, faixa alta +3, 30 dias +1
  assert.equal(ficha.pontuacao, 10);
  assert.equal(ficha.temperatura, 'quente');
  assert.ok(!('valor_orcamento' in ficha), 'quem preenche a ficha não define orçamento');

  const uploads = f.de(/\/storage\/v1\/object\/fichas\//);
  assert.deepEqual(uploads.map((u) => u.url.split('/fichas/')[1]), [`${ID}/local-1.jpg`, `${ID}/referencia-2.jpg`]);
  assert.equal(uploads[0].headers['x-upsert'], 'false');
  assert.deepEqual(f.de(/\/rest\/v1\/fotos/)[0].corpo.map((x) => x.tipo), ['local', 'referencia']);  // o .exe foi descartado
});

test('chave de serviço vai só no cabeçalho, nunca na URL', async () => {
  const { f } = await enviar(envio());
  for (const c of f.de(/supabase\.co/)) {
    assert.ok(!c.url.includes(ENV.SUPABASE_SERVICE_ROLE_KEY));
    assert.equal(c.headers.apikey, ENV.SUPABASE_SERVICE_ROLE_KEY);
  }
  const [card] = f.de(/api\.trello\.com/);
  assert.ok(!card.url.includes('token-trello'));
  assert.match(card.headers.authorization, /oauth_token="token-trello"/);
});

test('card no Trello nasce em Novas, com a etiqueta e a temperatura escrita', async () => {
  const { f } = await enviar(envio());
  const [card] = f.de(/api\.trello\.com\/1\/cards$/);
  assert.equal(card.corpo.idList, 'lista-novas');
  assert.equal(card.corpo.idLabels, 'et-quente');
  assert.match(card.corpo.name, /^🔥 QUENTE 10 · Marcos Lima · Coxa$/);
  assert.match(card.corpo.desc, /\*\*Por que quente:\*\* \+2 veio por indicação/);
  assert.match(card.corpo.desc, new RegExp(`https://ficha\\.exemplo/arquivo/${ID}/local-1\\.jpg`));
  const [patch] = f.de(/\/rest\/v1\/fichas\?id=eq\./, 'PATCH');
  assert.deepEqual(patch.corpo, { trello_card_id: 'card-1', trello_card_url: 'https://trello.com/c/AbCd1234' });
});

test('aviso vai para o n8n com o token e o link curto do card', async () => {
  const { f } = await enviar(envio());
  const [aviso] = f.de(/n8n\.exemplo/);
  assert.equal(aviso.headers['x-aviso-token'], 'token-aviso');
  assert.equal(aviso.corpo.tipo, 'ficha');
  assert.equal(aviso.corpo.temperatura, 'quente');
  assert.equal(aviso.corpo.botao, 'AbCd1234');
  assert.equal(aviso.corpo.params[0], 'Marcos · R$2.000 a 4.000 · 30 dias · Coxa');
  for (const p of aviso.corpo.params) assert.doesNotMatch(p, /[\n\t]| {4}/);  // regra da Meta
});

test('Trello fora do ar não perde a ficha: ela fica gravada e o aviso sai sem link', async () => {
  const { res, f } = await enviar(envio(), rotas({ trelloFalha: true }));
  assert.equal(res.status, 200);
  assert.equal(f.de(/\/rest\/v1\/fichas$/, 'POST').length, 1);
  const [aviso] = f.de(/n8n\.exemplo/);
  assert.equal(aviso.corpo.botao, '');
  assert.match(aviso.corpo.texto, /veja no painel/);
});

test('validação no servidor: resposta inválida volta 422 em português e nada é gravado', async () => {
  const casos = [
    [{ 'WhatsApp': '1234' }, /DDD/],
    [{ 'Seu @ do Instagram': 'eu <script>' }, /letras, números/],
    [{ 'Onde no corpo?': 'Lua' }, /local do corpo/],
    [{ 'Quando você quer fazer?': 'Tenho data marcada', 'Qual a data?': '2026-11-01' }, /passado/],
    [{ 'Combinado?': ['1', '2'] }, /combinado/],
    [{ 'Quem te indicou?': undefined }, /quem indicou/],
  ];
  for (const [extra, msg] of casos) {
    const { res, corpo, f } = await enviar(envio({ extra }));
    assert.equal(res.status, 422, JSON.stringify(extra));
    assert.match(corpo.erro, msg);
    assert.equal(f.de(/supabase\.co/).length, 0, 'nada gravado');
  }
  const semFoto = await enviar(envio({ fotos: ['ref'] }));
  assert.equal(semFoto.res.status, 422);
  assert.match(semFoto.corpo.erro, /foto do local/);
});

test('cidade fora da Grande Vitória usa o nome digitado; cobertura sem foto perde 2 pontos', async () => {
  const { f } = await enviar(envio({ extra: {
    'De onde você vem?': 'Fora da Grande Vitória', 'Qual cidade?': 'Linhares',
    'É cobertura de uma tattoo antiga?': 'Sim', 'Há quanto tempo ela foi feita?': '1 a 5 anos',
  } }));
  assert.deepEqual(f.de(/\/rest\/v1\/clientes/)[0].corpo[0].regiao, 'fora');
  assert.equal(f.de(/\/rest\/v1\/clientes/)[0].corpo[0].cidade, 'Linhares');
  const [ficha] = f.de(/\/rest\/v1\/fichas$/, 'POST')[0].corpo;
  assert.equal(ficha.cobertura, true);
  assert.deepEqual(ficha.extras, { idade_cobertura: '1 a 5 anos' });
  assert.equal(ficha.pontuacao, 8);
  assert.match(ficha.motivos, /-2 cobertura sem foto/);
});

test('honeypot preenchido responde ok e não grava nada', async () => {
  const { res, f } = await enviar(envio({ site: 'http://spam' }));
  assert.equal(res.status, 200);
  assert.equal(f.chamadas.length, 0);
});

test('sem Supabase configurado a ficha avisa; GET é recusado', async () => {
  const { processar } = await carregar('netlify/functions/ficha.mjs');
  const r1 = await processar(envio(), { env: {}, log: silencioso });
  assert.equal(r1.status, 503);
  const r2 = await processar(new Request('https://ficha.exemplo/api/ficha'), { env: ENV, log: silencioso });
  assert.equal(r2.status, 405);
});

test('banco fora do ar: 502 com mensagem para tentar de novo', async () => {
  const f = fetchFalso([['POST', /clientes/, () => ({ status: 503, json: 'down' })]]);
  const { res, corpo } = await enviar(envio(), f);
  assert.equal(res.status, 502);
  assert.match(corpo.erro, /tenta de novo/);
});

test('foto: só caminho válido vira link assinado de 5 minutos', async () => {
  const { processar } = await carregar('netlify/functions/arquivo.mjs');
  const f = fetchFalso([['POST', /\/storage\/v1\/object\/sign\/fichas\//, (c) => ({ json: { signedURL: `/object/sign/fichas/${ID}/local-1.jpg?token=abc`, pedido: c.corpo } })]]);
  const ok = await processar(new Request(`https://ficha.exemplo/arquivo/${ID}/local-1.jpg`), { env: ENV, fetch: f.fetch });
  assert.equal(ok.status, 302);
  assert.equal(ok.headers.get('location'), `https://abc.supabase.co/storage/v1/object/sign/fichas/${ID}/local-1.jpg?token=abc`);
  assert.deepEqual(f.chamadas[0].corpo, { expiresIn: 300 });
  for (const ruim of ['../segredo.txt', `${ID}/../../x.jpg`, 'nao-uuid/local-1.jpg', `${ID}/local-1.exe`]) {
    const r = await processar(new Request(`https://ficha.exemplo/arquivo/${encodeURIComponent(ruim)}`), { env: ENV, fetch: f.fetch });
    assert.equal(r.status, 404, ruim);
  }
});
