// Cliente do Supabase: respostas sem corpo não podem quebrar a gravação.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar } = require('./ajuda');

test('POST com return=minimal (201 sem corpo) não quebra e devolve null', async () => {
  const { Supabase } = await carregar('netlify/lib/supabase.mjs');
  const fetch = async () => new Response(null, { status: 201 });
  const db = new Supabase({ url: 'https://x.supabase.co', chave: 'sb_secret_teste', fetch });
  assert.equal(await db.rest('/fichas', { metodo: 'POST', corpo: [{}], prefer: 'return=minimal' }), null);
});

test('resposta com corpo continua vindo como JSON', async () => {
  const { Supabase } = await carregar('netlify/lib/supabase.mjs');
  const fetch = async () => new Response('[{"id":1}]', { status: 201 });
  const db = new Supabase({ url: 'https://x.supabase.co', chave: 'sb_secret_teste', fetch });
  assert.deepEqual(await db.rest('/clientes', { metodo: 'POST', corpo: [{}] }), [{ id: 1 }]);
});
