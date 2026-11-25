// Trello pela API REST, só com fetch. Chave e token vão no cabeçalho Authorization, nunca na URL.
import { createHmac } from 'node:crypto';
import { iguais } from './painel/seguranca.mjs';

const API = 'https://api.trello.com/1';

export class Trello {
  constructor({ chave, token, fetch = globalThis.fetch }) {
    if (!chave || !token) throw new Error('Trello não configurado');
    this.auth = `OAuth oauth_consumer_key="${chave}", oauth_token="${token}"`;
    this.fetch = fetch;
  }

  async pedir(metodo, caminho, corpo) {
    const r = await this.fetch(`${API}${caminho}`, {
      method: metodo,
      headers: { authorization: this.auth, accept: 'application/json', ...(corpo ? { 'content-type': 'application/json' } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`Trello ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
    return r.json();
  }

  criarCard({ idList, nome, descricao, idLabels = [] }) {
    return this.pedir('POST', '/cards', { idList, name: nome, desc: descricao, idLabels: idLabels.join(','), pos: 'top' });
  }

  buscarCard(id) {
    return this.pedir('GET', `/cards/${encodeURIComponent(id)}?fields=name,due,idList,closed,shortUrl`);
  }

  comentar(id, texto) {
    return this.pedir('POST', `/cards/${encodeURIComponent(id)}/actions/comments`, { text: texto });
  }
}

const TEMPERATURA = { quente: '🔥 QUENTE', morna: '🟠 MORNA', fria: '🔵 FRIA' };

// título e descrição do card (Markdown do Trello). A temperatura vai escrita, não só na cor da etiqueta.
export function textoDoCard({ ficha, cliente, fotos = [], linkPainel = '' }) {
  const nome = `${TEMPERATURA[ficha.temperatura] || ficha.temperatura} ${ficha.pontuacao} · ${cliente.nome} · ${ficha.local_corpo}`;
  const linhas = [
    `**Ideia:** ${ficha.ideia}`,
    '',
    `**Local:** ${ficha.local_corpo} · ${ficha.tamanho}${ficha.cobertura ? ' · cobertura' : ''}`,
    `**Cor:** ${ficha.cor || '—'}`,
    `**Investimento:** ${ficha.faixa_investimento}`,
    `**Prazo:** ${ficha.prazo}${ficha.data_limite ? ` (${ficha.data_limite.split('-').reverse().join('/')})` : ''}`,
    `**Disponibilidade:** ${(ficha.disponibilidade || []).join(', ') || '—'}`,
    `**Chegou por:** ${ficha.indicado_por ? `indicação de ${ficha.indicado_por}` : ficha.origem || '—'}`,
    '',
    `**Cliente:** ${cliente.nome} · @${cliente.instagram} · WhatsApp ${cliente.whatsapp} · ${cliente.cidade}`,
    '',
    `**Por que ${ficha.temperatura}:** ${ficha.motivos || 'sem pontos'}`,
  ];
  if (ficha.link_referencia) linhas.push(`**Pasta de referências:** ${ficha.link_referencia}`);
  if (fotos.length) {
    linhas.push('', '**Fotos:**');
    for (const f of fotos) linhas.push(`- ${f.tipo}: ${f.url}`);
  }
  if (linkPainel) linhas.push('', `Abrir no painel: ${linkPainel}`);
  linhas.push('', 'Para virar sessão: mova para "Agendado" com a data preenchida no card.');
  return { nome: nome.slice(0, 160), descricao: linhas.join('\n').slice(0, 16000) };
}

// nome da coluna do quadro → status no banco
const COLUNAS = {
  'novas': 'novo',
  'em conversa': 'em_conversa',
  'orcamento enviado': 'orcamento_enviado',
  'agendado': 'agendado',
  'fechado': 'fechado',
  'perdido': 'perdido',
};
export function statusDaColuna(nome) {
  const chave = String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  return COLUNAS[chave] || null;
}

// O Trello assina cada chamada do webhook: base64(HMAC-SHA1(segredo do app, corpo + URL de retorno))
export function assinaturaTrello(corpo, urlRetorno, segredo) {
  return createHmac('sha1', segredo).update(corpo + urlRetorno).digest('base64');
}
export function assinaturaValida(corpo, urlRetorno, segredo, recebida) {
  if (!segredo || !recebida) return false;
  return iguais(assinaturaTrello(corpo, urlRetorno, segredo), String(recebida));
}

// O que o movimento do card significa para o banco
export function lerAcao(acao) {
  if (!acao || acao.type !== 'updateCard' || !acao.data || !acao.data.card) return null;
  const { card, old = {}, listAfter } = acao.data;
  if (card.closed === true && old.closed === false) return { cardId: card.id, status: 'arquivado' };
  if (listAfter) {
    const status = statusDaColuna(listAfter.name);
    return status ? { cardId: card.id, status, coluna: listAfter.name } : null;
  }
  if (Object.hasOwn(old, 'due')) return { cardId: card.id, mudouData: true, due: card.due || null };
  return null;
}
