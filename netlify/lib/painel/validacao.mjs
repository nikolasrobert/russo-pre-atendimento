// Validação da ficha no servidor. Devolve os dados limpos ou as mensagens de erro, em português.
import {
  CIDADES_GV, OUTRA_CIDADE, EXPERIENCIAS, LOCAIS, TAMANHOS, CORES, FAIXAS, PRAZOS, PRAZO_COM_DATA,
  ORIGENS, ORIGEM_INDICACAO, STATUS,
} from './opcoes.mjs';

const texto = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');
const textoLongo = (v) => String(v ?? '').trim().replace(/\r\n/g, '\n');
const marcado = (v) => v === 'on' || v === 'true' || v === '1' || v === true;

// "1.500,50" ou "1500.50" → 1500.5
function lerValor(v) {
  const s = String(v ?? '').trim().replace(/^R\$\s*/i, '');
  if (!s) return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(s)) return NaN;
  const normal = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return Number(normal);
}

function hojeISO(agora) {
  return new Date(agora).toISOString().slice(0, 10);
}

/**
 * @param {Record<string,string>} entrada  campos do formulário (FormData → objeto)
 * @param {{ agora?: number }} opcoes
 * @returns {{ dados: object, erros: Record<string,string>, valores: object }}
 */
export function validarFicha(entrada, { agora = Date.now() } = {}) {
  const erros = {};
  const v = {
    nome: texto(entrada.nome),
    instagram: texto(entrada.instagram).replace(/^@/, ''),
    whatsapp: String(entrada.whatsapp ?? '').replace(/\D/g, ''),
    cidade: texto(entrada.cidade),
    cidade_outra: texto(entrada.cidade_outra),
    experiencia: texto(entrada.experiencia),
    ideia: textoLongo(entrada.ideia),
    local_corpo: texto(entrada.local_corpo),
    tamanho: texto(entrada.tamanho),
    cor: texto(entrada.cor),
    cobertura: marcado(entrada.cobertura),
    faixa_investimento: texto(entrada.faixa_investimento),
    prazo: texto(entrada.prazo),
    data_limite: texto(entrada.data_limite),
    origem: texto(entrada.origem),
    indicado_por: texto(entrada.indicado_por),
    tem_foto_local: marcado(entrada.tem_foto_local),
    tem_referencia: marcado(entrada.tem_referencia),
    status: texto(entrada.status) || 'novo',
    valor_orcamento: texto(entrada.valor_orcamento),
    observacoes: textoLongo(entrada.observacoes),
  };

  // cliente
  if (!v.nome) erros.nome = 'Informe o nome do cliente.';
  else if (v.nome.length < 2 || v.nome.length > 100) erros.nome = 'O nome precisa ter entre 2 e 100 caracteres.';

  if (!v.instagram) erros.instagram = 'Informe o @ do Instagram.';
  else if (!/^[A-Za-z0-9._]{1,30}$/.test(v.instagram)) erros.instagram = 'Use só letras, números, ponto e sublinhado (até 30).';

  if (!v.whatsapp) erros.whatsapp = 'Informe o WhatsApp com DDD.';
  else if (v.whatsapp.length < 10 || v.whatsapp.length > 13) erros.whatsapp = 'O WhatsApp precisa ter DDD: de 10 a 13 números.';

  let cidade = v.cidade;
  let regiao = 'grande_vitoria';
  if (!v.cidade) erros.cidade = 'Escolha a cidade.';
  else if (v.cidade === OUTRA_CIDADE) {
    regiao = 'fora';
    cidade = v.cidade_outra;
    if (!v.cidade_outra) erros.cidade_outra = 'Escreva qual é a cidade.';
    else if (v.cidade_outra.length > 80) erros.cidade_outra = 'Nome de cidade muito longo.';
  } else if (!CIDADES_GV.includes(v.cidade)) erros.cidade = 'Escolha uma cidade da lista.';

  // pedido
  if (!EXPERIENCIAS.includes(v.experiencia)) erros.experiencia = 'Escolha uma opção.';

  if (!v.ideia) erros.ideia = 'Descreva a ideia da tatuagem.';
  else if (v.ideia.length < 10) erros.ideia = 'Descreva a ideia com pelo menos 10 caracteres.';
  else if (v.ideia.length > 2000) erros.ideia = 'A ideia pode ter no máximo 2.000 caracteres.';

  if (!LOCAIS.includes(v.local_corpo)) erros.local_corpo = 'Escolha o local do corpo.';
  if (!TAMANHOS.includes(v.tamanho)) erros.tamanho = 'Escolha o tamanho.';
  if (v.cor && !CORES.includes(v.cor)) erros.cor = 'Escolha uma opção da lista.';
  if (!FAIXAS.includes(v.faixa_investimento)) erros.faixa_investimento = 'Escolha a faixa de investimento.';

  if (!PRAZOS.includes(v.prazo)) erros.prazo = 'Escolha o prazo.';
  let dataLimite = null;
  if (v.prazo === PRAZO_COM_DATA) {
    if (!v.data_limite) erros.data_limite = 'Informe a data marcada.';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(v.data_limite) || Number.isNaN(Date.parse(v.data_limite))) erros.data_limite = 'Data inválida.';
    else if (v.data_limite < hojeISO(agora)) erros.data_limite = 'A data marcada não pode estar no passado.';
    else dataLimite = v.data_limite;
  }

  if (!ORIGENS.includes(v.origem)) erros.origem = 'Escolha como o cliente chegou.';
  let indicadoPor = null;
  if (v.origem === ORIGEM_INDICACAO) {
    if (!v.indicado_por) erros.indicado_por = 'Informe quem indicou.';
    else if (v.indicado_por.length > 80) erros.indicado_por = 'Máximo de 80 caracteres.';
    else indicadoPor = v.indicado_por;
  }

  // atendimento
  if (!Object.hasOwn(STATUS, v.status)) erros.status = 'Status inválido.';

  const valor = lerValor(v.valor_orcamento);
  if (Number.isNaN(valor)) erros.valor_orcamento = 'Use um valor como 1.500,00.';
  else if (valor !== null && (valor <= 0 || valor > 100000)) erros.valor_orcamento = 'O valor precisa ser maior que zero e até R$ 100.000.';

  if (v.observacoes.length > 2000) erros.observacoes = 'As observações podem ter no máximo 2.000 caracteres.';

  const dados = {
    cliente: { nome: v.nome, instagram: v.instagram.toLowerCase(), whatsapp: v.whatsapp, cidade, regiao },
    ficha: {
      experiencia: v.experiencia,
      ideia: v.ideia,
      local_corpo: v.local_corpo,
      tamanho: v.tamanho,
      cor: v.cor || null,
      cobertura: v.cobertura,
      faixa_investimento: v.faixa_investimento,
      prazo: v.prazo,
      data_limite: dataLimite,
      origem: v.origem,
      indicado_por: indicadoPor,
      tem_foto_local: v.tem_foto_local,
      tem_referencia: v.tem_referencia,
      status: v.status,
      valor_orcamento: valor,
      observacoes: v.observacoes || null,
    },
  };

  return { dados, erros, valores: v };
}

// valores para preencher o formulário de edição a partir do que está no banco
export function valoresDaFicha(f) {
  const gv = CIDADES_GV.includes(f.cliente.cidade);
  return {
    nome: f.cliente.nome,
    instagram: f.cliente.instagram,
    whatsapp: f.cliente.whatsapp,
    cidade: gv ? f.cliente.cidade : OUTRA_CIDADE,
    cidade_outra: gv ? '' : f.cliente.cidade,
    experiencia: f.experiencia,
    ideia: f.ideia,
    local_corpo: f.local_corpo,
    tamanho: f.tamanho,
    cor: f.cor || '',
    cobertura: !!f.cobertura,
    faixa_investimento: f.faixa_investimento,
    prazo: f.prazo,
    data_limite: f.data_limite || '',
    origem: f.origem || '',
    indicado_por: f.indicado_por || '',
    tem_foto_local: !!f.tem_foto_local,
    tem_referencia: !!f.tem_referencia,
    status: f.status,
    valor_orcamento: f.valor_orcamento == null ? '' : Number(f.valor_orcamento).toFixed(2).replace('.', ','),
    observacoes: f.observacoes || '',
  };
}
