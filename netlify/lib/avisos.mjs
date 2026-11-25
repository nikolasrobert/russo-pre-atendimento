// Avisos no WhatsApp. A função monta o conteúdo; o n8n só recebe e manda pela API da Meta
// (o token do WhatsApp fica na credencial do n8n, não aqui).

// Regras da Meta para variável de modelo: sem quebra de linha, sem tab, sem 4 espaços seguidos.
export function limpar(texto, max) {
  const v = String(texto ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim();
  return v.length > max ? `${v.slice(0, max - 1)}…` : (v || '-');
}

const PRAZO_CURTO = {
  'Sem pressa · quero fazer bem feito': 'sem pressa',
  'Nos próximos 30 dias': '30 dias',
  'Tenho data marcada': 'data marcada',
};

// shortLink do card a partir da URL curta (https://trello.com/c/AbCd1234)
export const linkCurto = (url) => (String(url || '').match(/trello\.com\/c\/([A-Za-z0-9]+)/) || [])[1] || '';

export function avisoDaFicha({ ficha, cliente, cardUrl = '' }) {
  const primeiroNome = cliente.nome.split(' ')[0];
  const titulo = [primeiroNome, ficha.faixa_investimento.replace(/^R\$ ?/, 'R$'), PRAZO_CURTO[ficha.prazo] || ficha.prazo, ficha.local_corpo].join(' · ');
  const detalhes = [ficha.tamanho, ficha.cor, ficha.cobertura ? 'cobertura' : '', `nota ${ficha.pontuacao}`].filter(Boolean).join(' · ');
  return {
    tipo: 'ficha',
    temperatura: ficha.temperatura,
    params: [limpar(titulo, 120), limpar(ficha.ideia, 300), limpar(detalhes, 200)],
    botao: linkCurto(cardUrl),
    texto: [
      `${ficha.temperatura === 'quente' ? '🔥 Ficha quente' : `Ficha ${ficha.temperatura}`}: ${titulo}`,
      '',
      `Ideia: ${ficha.ideia}`,
      `Detalhes: ${detalhes}`,
      '',
      cardUrl ? `Abrir card: ${cardUrl}` : 'Card no Trello não foi criado: veja no painel.',
    ].join('\n'),
  };
}

// manda para o webhook do n8n; erro aqui nunca derruba a ficha (ela já está salva)
export async function enviarAviso(aviso, { url, token, fetch = globalThis.fetch }) {
  if (!url) return { enviado: false, motivo: 'sem N8N_WEBHOOK_URL' };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { 'x-aviso-token': token } : {}) },
      body: JSON.stringify(aviso),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return { enviado: false, motivo: `n8n respondeu ${r.status}` };
    return { enviado: true };
  } catch (e) {
    return { enviado: false, motivo: e && e.name === 'TimeoutError' ? 'n8n demorou' : 'n8n fora do ar' };
  }
}
