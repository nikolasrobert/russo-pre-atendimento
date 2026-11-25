// Cria o quadro do tatuador no Trello com as colunas e as etiquetas que o sistema usa,
// e imprime as variáveis para colar no Netlify.
//
// Uso:  TRELLO_CHAVE=... TRELLO_TOKEN=... npm run trello:quadro -- "Atendimento · Russo"
// (chave e token em https://trello.com/power-ups/admin → sua integração → Chave de API)
import { Trello } from '../netlify/lib/trello.mjs';

const nome = process.argv[2] || 'Atendimento · Tatuador';
const { TRELLO_CHAVE, TRELLO_TOKEN } = process.env;
if (!TRELLO_CHAVE || !TRELLO_TOKEN) {
  console.error('Defina TRELLO_CHAVE e TRELLO_TOKEN no terminal antes de rodar.');
  process.exit(1);
}

const COLUNAS = ['Novas', 'Em conversa', 'Orçamento enviado', 'Agendado', 'Fechado', 'Perdido'];
const ETIQUETAS = [['QUENTE', 'red'], ['MORNA', 'orange'], ['FRIA', 'blue']];

const t = new Trello({ chave: TRELLO_CHAVE, token: TRELLO_TOKEN });
const quadro = await t.pedir('POST', '/boards/', { name: nome, defaultLists: false, defaultLabels: false });

const listas = {};
for (const [i, coluna] of COLUNAS.entries()) {
  const l = await t.pedir('POST', '/lists', { name: coluna, idBoard: quadro.id, pos: (i + 1) * 1000 });
  listas[coluna] = l.id;
}
const etiquetas = {};
for (const [texto, cor] of ETIQUETAS) {
  const e = await t.pedir('POST', '/labels', { name: texto, color: cor, idBoard: quadro.id });
  etiquetas[texto] = e.id;
}

console.log(`\nQuadro criado: ${quadro.shortUrl}\n\nCole no Netlify (Site configuration → Environment variables):\n`);
console.log(`TRELLO_QUADRO_ID=${quadro.id}`);
console.log(`TRELLO_QUADRO_URL=${quadro.shortUrl}`);
console.log(`TRELLO_LISTA_NOVAS=${listas.Novas}`);
console.log(`TRELLO_ETIQUETA_QUENTE=${etiquetas.QUENTE}`);
console.log(`TRELLO_ETIQUETA_MORNA=${etiquetas.MORNA}`);
console.log(`TRELLO_ETIQUETA_FRIA=${etiquetas.FRIA}`);
console.log('\nDepois do deploy, cadastre o webhook: npm run trello:webhook -- <TRELLO_QUADRO_ID> https://SEU-SITE/api/trello');
