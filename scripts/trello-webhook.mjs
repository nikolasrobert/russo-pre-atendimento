// Cadastra o webhook do quadro: o Trello passa a avisar /api/trello a cada card movido.
// Rode DEPOIS do deploy (o Trello testa a URL na hora do cadastro).
//
// Uso:  TRELLO_CHAVE=... TRELLO_TOKEN=... npm run trello:webhook -- <id do quadro> https://seu-site.netlify.app/api/trello
import { Trello } from '../netlify/lib/trello.mjs';

const [idQuadro, url] = process.argv.slice(2);
const { TRELLO_CHAVE, TRELLO_TOKEN } = process.env;
if (!TRELLO_CHAVE || !TRELLO_TOKEN || !idQuadro || !/^https:\/\/.+\/api\/trello$/.test(url || '')) {
  console.error('Uso: TRELLO_CHAVE=... TRELLO_TOKEN=... npm run trello:webhook -- <id do quadro> https://seu-site/api/trello');
  process.exit(1);
}

const t = new Trello({ chave: TRELLO_CHAVE, token: TRELLO_TOKEN });
const w = await t.pedir('POST', '/webhooks/', { idModel: idQuadro, callbackURL: url, description: 'Pré-atendimento: status e sessões' });
console.log(`Webhook ativo (${w.id}).`);
console.log(`Confira no Netlify: TRELLO_CALLBACK_URL=${url}`);
console.log('E TRELLO_SEGREDO = o "Segredo" da mesma página da chave de API (é ele que assina os avisos).');
