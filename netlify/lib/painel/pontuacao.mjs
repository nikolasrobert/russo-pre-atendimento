// Pontuação da ficha: mesma regra do n8n (n8n/code/normaliza.js), documentada em referencia/pontuacao.md.

// semFotoDaCobertura: só a ficha do site sabe se a foto da tattoo antiga chegou
export function pontuar(f, { semFotoDaCobertura = false } = {}) {
  let pontos = 0;
  const motivos = [];
  const somar = (p, motivo) => { pontos += p; motivos.push(`${p > 0 ? '+' : ''}${p} ${motivo}`); };

  const faixa = String(f.faixa_investimento || '');
  const tamanho = String(f.tamanho || '');
  const ideia = String(f.ideia || '');

  if (f.experiencia === 'Você já me tatuou') somar(3, 'já é cliente');
  if (f.origem === 'Indicação') somar(2, 'veio por indicação');
  if (f.tem_referencia) somar(2, 'mandou referência');
  if (f.tem_foto_local) somar(2, 'mandou foto do local');

  // compara pelo começo da faixa: "R$ 1.000 a 2.000" contém "2.000" e não pode virar faixa alta
  if (/acima/i.test(faixa) || /2\.?000 a 4/i.test(faixa)) somar(3, 'faixa alta');
  else if (/1\.?000 a 2/i.test(faixa)) somar(2, 'faixa média');
  else if (/500 a 1/i.test(faixa)) somar(1, 'faixa inicial');

  if (f.prazo === 'Tenho data marcada') somar(2, 'tem data marcada');
  else if (f.prazo === 'Nos próximos 30 dias') somar(1, 'quer nos próximos 30 dias');

  if (ideia.length > 120) somar(1, 'descreveu bem a ideia');
  if (ideia.length > 0 && ideia.length < 40) somar(-1, 'ideia vaga');
  if (f.cobertura && semFotoDaCobertura) somar(-2, 'cobertura sem foto da tattoo atual');
  if (/at[ée] R\$ ?500/i.test(faixa) && /(15|25|fechamento)/i.test(tamanho)) somar(-2, 'orçamento x tamanho incompatível');

  const temperatura = pontos >= 8 ? 'quente' : pontos >= 4 ? 'morna' : 'fria';
  return { pontuacao: pontos, temperatura, motivos: motivos.join(' · ') };
}
