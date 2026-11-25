// O quadro do Trello manda no status: mover o card atualiza o banco; "Agendado" com data vira sessão.
import { lerAcao } from './trello.mjs';

export const SESSAO_HORAS_PADRAO = 3;

async function sessaoMarcada(db, fichaId) {
  const [s] = await db.rest(`/sessoes?select=id,inicio&ficha_id=eq.${fichaId}&status=eq.marcada&limit=1`);
  return s || null;
}

async function marcarSessao(db, fichaId, inicio, horas) {
  const atual = await sessaoMarcada(db, fichaId);
  if (atual) {
    if (new Date(atual.inicio).getTime() === new Date(inicio).getTime()) return 'mantida';
    await db.rest(`/sessoes?id=eq.${atual.id}`, { metodo: 'PATCH', corpo: { inicio }, prefer: 'return=minimal' });
    return 'atualizada';
  }
  await db.rest('/sessoes', { metodo: 'POST', corpo: [{ ficha_id: fichaId, inicio, duracao_horas: horas }], prefer: 'return=minimal' });
  return 'criada';
}

/**
 * @param {object} acao  campo "action" do webhook do Trello
 * @returns {Promise<string>} o que aconteceu (vai para o log e para os testes)
 */
export async function aplicarAcao(acao, { db, trello, estudioId, horasPadrao = SESSAO_HORAS_PADRAO }) {
  const lida = lerAcao(acao);
  if (!lida) return 'ignorada';

  const [ficha] = await db.rest(`/fichas?select=id,status&trello_card_id=eq.${encodeURIComponent(lida.cardId)}&estudio_id=eq.${estudioId}&limit=1`);
  if (!ficha) return 'card sem ficha';

  // só mudou a data do card
  if (lida.mudouData) {
    if (ficha.status !== 'agendado' || !lida.due) return 'data ignorada';
    return `sessão ${await marcarSessao(db, ficha.id, new Date(lida.due).toISOString(), horasPadrao)}`;
  }

  if (lida.status !== ficha.status) {
    await db.rest(`/fichas?id=eq.${ficha.id}`, { metodo: 'PATCH', corpo: { status: lida.status }, prefer: 'return=minimal' });
  }

  if (lida.status === 'agendado') {
    const card = await trello.buscarCard(lida.cardId);
    if (!card.due) {
      await trello.comentar(lida.cardId, 'Coloca a data e a hora no card (Datas → Entrega) que a sessão entra na agenda sozinha.');
      return 'agendado sem data';
    }
    return `status agendado, sessão ${await marcarSessao(db, ficha.id, new Date(card.due).toISOString(), horasPadrao)}`;
  }

  if (['perdido', 'arquivado'].includes(lida.status)) {
    await db.rest(`/sessoes?ficha_id=eq.${ficha.id}&status=eq.marcada`, { metodo: 'PATCH', corpo: { status: 'cancelada' }, prefer: 'return=minimal' });
  }
  return `status ${lida.status}`;
}
