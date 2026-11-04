// Testa o painel (CRUD das fichas) de ponta a ponta, com o banco em memória.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

const lib = (arq) => import(pathToFileURL(path.join(__dirname, '..', 'netlify', 'lib', 'painel', arq)).href);

async function montar() {
  const { processar } = await lib('app.mjs');
  const { FichaModel } = await lib('models/ficha-model.mjs');
  const { MemoriaStore, exemplos } = await lib('stores/memoria.mjs');
  const { gerarHashSenha } = await lib('seguranca.mjs');
  const store = new MemoriaStore(exemplos());
  const config = { email: 'russo@exemplo.com', senhaHash: gerarHashSenha('senha-forte-123'), segredo: 'x'.repeat(64), atrasoErro: 0 };
  const deps = { model: new FichaModel(store), config };

  // navegador simulado: guarda os cookies entre as requisições
  const jar = {};
  async function pedir(caminho, { metodo = 'GET', form, semCookies = false } = {}) {
    const headers = {};
    if (!semCookies && Object.keys(jar).length) headers.cookie = Object.entries(jar).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ');
    let body;
    if (form) { body = new URLSearchParams(form); headers['content-type'] = 'application/x-www-form-urlencoded'; }
    const res = await processar(new Request(`https://painel.exemplo${caminho}`, { method: metodo, headers, body }), deps);
    for (const c of res.headers.getSetCookie()) {
      const [par, ...attrs] = c.split('; ');
      const [k, v] = [par.slice(0, par.indexOf('=')), decodeURIComponent(par.slice(par.indexOf('=') + 1))];
      if (attrs.includes('Max-Age=0')) delete jar[k]; else jar[k] = v;
    }
    return { res, texto: await res.text() };
  }
  const token = () => jar.painel_csrf;
  async function entrar() {
    await pedir('/painel/entrar');
    return pedir('/painel/entrar', { metodo: 'POST', form: { _csrf: token(), email: 'russo@exemplo.com', senha: 'senha-forte-123' } });
  }
  return { store, pedir, token, entrar, jar };
}

const fichaValida = (extra = {}) => ({
  nome: 'Diego Teste', instagram: '@diego.teste', whatsapp: '(27) 99888-7766', cidade: 'Vila Velha', cidade_outra: '',
  experiencia: 'Tenho uma ou duas', ideia: 'Uma onça em blackwork no antebraço, olhando para o punho.',
  local_corpo: 'Antebraço (externo)', tamanho: '10 a 15 cm', cor: 'Preto e cinza', faixa_investimento: 'R$ 1.000 a 2.000',
  prazo: 'Nos próximos 30 dias', data_limite: '', origem: 'Instagram', indicado_por: '', tem_foto_local: 'on',
  status: 'novo', valor_orcamento: '', observacoes: '', ...extra,
});

test('sem login, qualquer página manda para a tela de entrar', async () => {
  const { pedir } = await montar();
  const { res } = await pedir('/painel');
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/painel/entrar');
});

test('senha errada não entra e não diz qual campo errou', async () => {
  const { pedir, token } = await montar();
  await pedir('/painel/entrar');
  const { res, texto } = await pedir('/painel/entrar', { metodo: 'POST', form: { _csrf: token(), email: 'russo@exemplo.com', senha: 'errada' } });
  assert.equal(res.status, 401);
  assert.match(texto, /E-mail ou senha incorretos/);
});

test('login certo cria sessão HttpOnly, Secure e SameSite=Strict', async () => {
  const { entrar } = await montar();
  const { res } = await entrar();
  assert.equal(res.status, 303);
  const sessao = res.headers.getSetCookie().find((c) => c.startsWith('painel_sessao='));
  assert.match(sessao, /HttpOnly/); assert.match(sessao, /Secure/); assert.match(sessao, /SameSite=Strict/);
});

test('POST sem token CSRF é recusado com 403', async () => {
  const { pedir, entrar, store } = await montar();
  await entrar();
  const antes = store.fichas.length;
  const { res } = await pedir('/painel/fichas', { metodo: 'POST', form: fichaValida() });
  assert.equal(res.status, 403);
  assert.equal(store.fichas.length, antes);
});

test('POST com token CSRF de outro navegador é recusado', async () => {
  const { pedir, entrar } = await montar();
  await entrar();
  const { res } = await pedir('/painel/fichas', { metodo: 'POST', form: fichaValida({ _csrf: 'f'.repeat(64) }) });
  assert.equal(res.status, 403);
});

test('CREATE: ficha válida é salva com pontuação e cliente limpo', async () => {
  const { pedir, entrar, token, store } = await montar();
  await entrar();
  const { res } = await pedir('/painel/fichas', { metodo: 'POST', form: fichaValida({ _csrf: token() }) });
  assert.equal(res.status, 303);
  const nova = store.fichas.at(-1);
  const cliente = store.clientes.find((c) => c.id === nova.cliente_id);
  assert.equal(cliente.instagram, 'diego.teste');
  assert.equal(cliente.whatsapp, '27998887766');
  assert.equal(cliente.regiao, 'grande_vitoria');
  assert.equal(nova.pontuacao, 5);          // foto (+2), faixa média (+2), 30 dias (+1)
  assert.equal(nova.temperatura, 'morna');
  assert.equal(res.headers.get('location'), `/painel/fichas/${nova.id}`);
});

test('validação: campos inválidos voltam com mensagens em português e nada é salvo', async () => {
  const { pedir, entrar, token, store } = await montar();
  await entrar();
  const antes = store.fichas.length;
  const { res, texto } = await pedir('/painel/fichas', { metodo: 'POST', form: fichaValida({
    _csrf: token(), nome: '', instagram: 'nome com espaço', whatsapp: '123', ideia: 'curta', prazo: 'Tenho data marcada',
    data_limite: '2020-01-01', origem: 'Indicação', indicado_por: '', valor_orcamento: '-5', local_corpo: 'Joelho',
  }) });
  assert.equal(res.status, 422);
  assert.equal(store.fichas.length, antes);
  for (const msg of ['Informe o nome do cliente.', 'Use só letras, números, ponto e sublinhado', 'O WhatsApp precisa ter DDD',
    'pelo menos 10 caracteres', 'não pode estar no passado', 'Informe quem indicou.', 'Use um valor como 1.500,00.', 'Escolha o local do corpo.']) {
    assert.ok(texto.includes(msg), `faltou a mensagem: ${msg}`);
  }
  assert.match(texto, /is-invalid/);
});

test('esc(): HTML digitado aparece como texto, nunca como código', async () => {
  const { pedir, entrar, token, store } = await montar();
  await entrar();
  const ataque = '<script>alert(1)</script> "aspas" & \'apóstrofo\'';
  await pedir('/painel/fichas', { metodo: 'POST', form: fichaValida({ _csrf: token(), ideia: ataque, nome: '<img src=x onerror=alert(1)>' }) });
  const nova = store.fichas.at(-1);
  for (const pagina of ['/painel', `/painel/fichas/${nova.id}`, `/painel/fichas/${nova.id}/editar`, `/painel/fichas/${nova.id}/excluir`]) {
    const { texto } = await pedir(pagina);
    assert.ok(!texto.includes('<script>alert(1)</script>'), `script cru em ${pagina}`);
    assert.ok(!texto.includes('<img src=x'), `img cru em ${pagina}`);
    assert.ok(texto.includes('&lt;img src=x onerror=alert(1)&gt;'), `nome escapado em ${pagina}`);
  }
  // e o que volta no formulário com erro também é escapado
  const { texto } = await pedir('/painel/fichas', { metodo: 'POST', form: fichaValida({ _csrf: token(), nome: '"><script>x</script>', whatsapp: '1' }) });
  assert.ok(!texto.includes('"><script>x</script>'));
});

test('READ: lista mostra as fichas, quentes primeiro, e os filtros funcionam', async () => {
  const { pedir, entrar } = await montar();
  await entrar();
  const { texto } = await pedir('/painel');
  assert.ok(texto.indexOf('Ana Exemplo') < texto.indexOf('Carla Exemplo'));
  assert.ok(texto.indexOf('Carla Exemplo') < texto.indexOf('Bruno Exemplo'));
  const fora = (await pedir('/painel?regiao=fora')).texto;
  assert.ok(fora.includes('Carla Exemplo') && !fora.includes('Ana Exemplo'));
  const busca = (await pedir('/painel?busca=%40bruno')).texto;
  assert.ok(busca.includes('Bruno Exemplo') && !busca.includes('Ana Exemplo'));
  const lixo = (await pedir('/painel?status=%27%3Bdrop')).texto;  // filtro desconhecido é ignorado
  assert.ok(lixo.includes('Ana Exemplo'));
});

test('UPDATE: editar muda status e valor e recalcula a nota', async () => {
  const { pedir, entrar, token, store } = await montar();
  await entrar();
  const id = '00000000-0000-4000-8000-000000000302';
  const { res } = await pedir(`/painel/fichas/${id}`, { metodo: 'POST', form: fichaValida({
    _csrf: token(), nome: 'Bruno Exemplo', instagram: 'bruno.exemplo', status: 'orcamento_enviado', valor_orcamento: '1.250,50',
    faixa_investimento: 'R$ 2.000 a 4.000', prazo: 'Tenho data marcada', data_limite: '2099-12-31',
  }) });
  assert.equal(res.status, 303);
  const f = store.fichas.find((x) => x.id === id);
  assert.equal(f.status, 'orcamento_enviado');
  assert.equal(f.valor_orcamento, 1250.5);
  assert.equal(f.pontuacao, 7);           // foto (+2), faixa alta (+3), data marcada (+2)
  assert.equal(f.temperatura, 'morna');
});

test('DELETE: só por POST com CSRF; GET mostra a confirmação', async () => {
  const { pedir, entrar, token, store } = await montar();
  await entrar();
  const id = '00000000-0000-4000-8000-000000000303';
  const conf = await pedir(`/painel/fichas/${id}/excluir`);
  assert.equal(conf.res.status, 200);
  assert.match(conf.texto, /Excluir a ficha de Carla Exemplo/);
  assert.ok(store.fichas.some((f) => f.id === id), 'GET não pode apagar');
  const { res } = await pedir(`/painel/fichas/${id}/excluir`, { metodo: 'POST', form: { _csrf: token() } });
  assert.equal(res.status, 303);
  assert.ok(!store.fichas.some((f) => f.id === id));
  const depois = await pedir(`/painel/fichas/${id}`);
  assert.equal(depois.res.status, 404);
});

test('id inválido e rota inexistente dão 404; método errado dá 405', async () => {
  const { pedir, entrar } = await montar();
  await entrar();
  assert.equal((await pedir('/painel/fichas/1%27%20or%201=1')).res.status, 404);
  assert.equal((await pedir('/painel/nao-existe')).res.status, 404);
  assert.equal((await pedir('/painel/fichas', { metodo: 'GET' })).res.status, 405);
});

test('toda resposta leva cabeçalhos de segurança', async () => {
  const { pedir } = await montar();
  const { res } = await pedir('/painel/entrar');
  assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('sair apaga a sessão', async () => {
  const { pedir, entrar, token, jar } = await montar();
  await entrar();
  await pedir('/painel/sair', { metodo: 'POST', form: { _csrf: token() } });
  assert.equal(jar.painel_sessao, undefined);
  assert.equal((await pedir('/painel')).res.status, 303);
});

test('SupabaseStore monta as chamadas REST com filtro por estúdio e chave só no cabeçalho', async () => {
  const { SupabaseStore } = await lib('stores/supabase.mjs');
  const chamadas = [];
  const fetch = async (url, opt) => { chamadas.push({ url: decodeURIComponent(url), opt }); return { ok: true, status: 200, json: async () => [{ id: 'x' }] }; };
  const s = new SupabaseStore({ url: 'https://abc.supabase.co/', chave: 'chave-servico', estudioId: 'e1', tatuadorId: 't1', fetch });
  await s.listarFichas({ status: 'novo', regiao: 'fora', busca: '@ana*,)' });
  const lista = chamadas[0];
  assert.match(lista.url, /^https:\/\/abc\.supabase\.co\/rest\/v1\/fichas\?/);
  assert.match(lista.url, /estudio_id=eq\.e1/);
  assert.match(lista.url, /status=eq\.novo/);
  assert.match(lista.url, /cliente\.regiao=eq\.fora/);
  assert.match(lista.url, /cliente\.or=\(nome\.ilike\.\*@ana\*,instagram\.ilike\.\*ana\*\)/);  // * , ) da busca foram removidos
  assert.equal(lista.opt.headers.apikey, 'chave-servico');
  assert.ok(!lista.url.includes('chave-servico'));
  await s.inserirFicha({ ideia: 'x' });
  assert.deepEqual(JSON.parse(chamadas[1].opt.body), [{ ideia: 'x', estudio_id: 'e1', tatuador_id: 't1' }]);
  await s.excluirFicha('id1');
  assert.equal(chamadas[2].opt.method, 'DELETE');
  assert.match(chamadas[2].url, /id=eq\.id1&estudio_id=eq\.e1/);
});
