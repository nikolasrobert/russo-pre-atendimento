// Resumo diário das 9h: o que está esperando o tatuador hoje, lido do Supabase.
import { limpar } from './avisos.mjs';

const DIA = 86400000;
const FUSO = -3 * 3600000;  // Brasília, sem horário de verão desde 2019
const MARCA = { quente: '🔥', morna: '🟠', fria: '🔵' };

// começo e fim do dia de hoje em Brasília, em ISO (UTC)
export function janelaDeHoje(agora = Date.now()) {
  const local = new Date(agora + FUSO);
  const inicio = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - FUSO;
  return { inicio: new Date(inicio).toISOString(), fim: new Date(inicio + DIA).toISOString() };
}

const hora = (iso) => new Date(new Date(iso).getTime() + FUSO).toISOString().slice(11, 16);
const primeiro = (nome) => String(nome || 'Sem nome').split(' ')[0];

export async function buscarDados(db, estudioId, agora = Date.now()) {
  const { inicio, fim } = janelaDeHoje(agora);
  const base = { estudio_id: `eq.${estudioId}` };
  const novas = new URLSearchParams({ ...base, select: 'id,temperatura,pontuacao,local_corpo,criado_em,cliente:clientes!inner(nome)', status: 'eq.novo', order: 'pontuacao.desc,criado_em.asc' });
  const orcados = new URLSearchParams({ ...base, select: 'id,atualizado_em,cliente:clientes!inner(nome)', status: 'eq.orcamento_enviado', atualizado_em: `lt.${new Date(agora - 5 * DIA).toISOString()}`, order: 'atualizado_em.asc' });
  const sessoes = new URLSearchParams({ select: 'inicio,duracao_horas,ficha:fichas!inner(estudio_id,local_corpo,cliente:clientes!inner(nome))', status: 'eq.marcada', 'ficha.estudio_id': `eq.${estudioId}`, order: 'inicio.asc' });
  sessoes.append('inicio', `gte.${inicio}`);
  sessoes.append('inicio', `lt.${fim}`);
  const [n, o, s] = await Promise.all([db.rest(`/fichas?${novas}`), db.rest(`/fichas?${orcados}`), db.rest(`/sessoes?${sessoes}`)]);
  return { novas: n, orcados: o, sessoes: s };
}

// devolve null quando o dia está limpo: aí não manda nada
export function montarResumo({ novas = [], orcados = [], sessoes = [] }, { agora = Date.now(), quadroUrl = '' } = {}) {
  if (!novas.length && !orcados.length && !sessoes.length) return null;
  const dias = (iso) => Math.floor((agora - new Date(iso).getTime()) / DIA);

  const linhaNova = (f) => `${MARCA[f.temperatura] || ''}${primeiro(f.cliente && f.cliente.nome)} (${f.local_corpo})${dias(f.criado_em) >= 2 ? ` ${dias(f.criado_em)}d` : ''}`;
  const linhaOrcado = (f) => `${primeiro(f.cliente && f.cliente.nome)} (${dias(f.atualizado_em)}d)`;
  const linhaSessao = (s) => `${hora(s.inicio)} ${primeiro(s.ficha && s.ficha.cliente && s.ficha.cliente.nome)}`;

  const listaNovas = novas.map(linhaNova).join(' · ') || 'nenhuma';
  const listaOrcados = orcados.map(linhaOrcado).join(' · ') || 'ninguém';
  const listaSessoes = sessoes.map(linhaSessao).join(' · ') || 'nenhuma';
  const quadro = (String(quadroUrl).match(/trello\.com\/b\/([A-Za-z0-9]+)/) || [])[1] || '';

  return {
    tipo: 'resumo',
    // mesma ordem do modelo resumo_diario: quantidade, novas, sessões de hoje, orçados parados
    params: [String(novas.length), limpar(listaNovas, 400), limpar(listaSessoes, 200), limpar(listaOrcados, 200)],
    botao: quadro,
    texto: [
      `Bom dia. Fichas esperando resposta: ${novas.length}`,
      novas.map(linhaNova).join('\n') || 'nenhuma',
      '',
      `Sessões hoje: ${listaSessoes}`,
      `Orçados pra cutucar: ${listaOrcados}`,
      quadroUrl ? `\nQuadro: ${quadroUrl}` : '',
    ].join('\n').trim(),
  };
}
