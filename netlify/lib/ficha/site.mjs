// Traduz as respostas da ficha pública (site/index.html) para os campos do banco
// e valida com a MESMA regra do painel (netlify/lib/painel/validacao.mjs).
import { validarFicha } from '../painel/validacao.mjs';
import { OUTRA_CIDADE } from '../painel/opcoes.mjs';

// título da pergunta no site → campo do formulário do painel
export const PERGUNTAS = {
  'Como te chamo?': 'nome',
  'Seu @ do Instagram': 'instagram',
  'WhatsApp': 'whatsapp',
  'De onde você vem?': 'cidade',
  'Qual cidade?': 'cidade_outra',
  'É sua primeira tatuagem?': 'experiencia',
  'Me conta a ideia': 'ideia',
  'Link de pasta / Pinterest': 'link_referencia',
  'Onde no corpo?': 'local_corpo',
  'Tamanho aproximado': 'tamanho',
  'É cobertura de uma tattoo antiga?': 'cobertura',
  'Há quanto tempo ela foi feita?': 'idade_cobertura',
  'Preto e cinza ou colorido?': 'cor',
  'Quanto você tem pra investir nesse projeto?': 'faixa_investimento',
  'Quando você quer fazer?': 'prazo',
  'Qual a data?': 'data_limite',
  'Quando você consegue vir?': 'disponibilidade',
  'Como você chegou até mim?': 'origem',
  'Quem te indicou?': 'indicado_por',
  'Combinado?': 'combinado',
  'Vídeo do local': 'video',
};

// título do campo de arquivo no site → tipo da foto no banco
export const ARQUIVOS = {
  'Foto do local': 'local',
  'Referências': 'referencia',
  'Foto da tattoo que vai ser coberta': 'cobertura',
};

const FORA = 'Fora da Grande Vitória';
const TOTAL_COMBINADOS = 4;
const DISPONIBILIDADES = ['Manhã de semana', 'Tarde de semana', 'Sábado', 'Dia inteiro, sem pressa', 'Sou flexível'];

/**
 * @param {Array<{label:string, value:string|string[]}>} respostas  o que o site manda
 * @param {{ fotos?: Record<string, number>, agora?: number }} opcoes  quantas fotos de cada tipo chegaram
 */
export function lerFichaDoSite(respostas, { fotos = {}, agora = Date.now() } = {}) {
  const r = {};
  for (const item of respostas || []) {
    const campo = item && PERGUNTAS[String(item.label || '').trim()];
    if (campo) r[campo] = item.value;
  }
  const lista = (v) => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);
  const um = (v) => (Array.isArray(v) ? v.join(', ') : String(v ?? ''));

  const linkRef = um(r.link_referencia).trim();
  const entrada = {
    nome: um(r.nome),
    instagram: um(r.instagram),
    whatsapp: um(r.whatsapp),
    cidade: um(r.cidade) === FORA ? OUTRA_CIDADE : um(r.cidade),
    cidade_outra: um(r.cidade_outra),
    experiencia: um(r.experiencia),
    ideia: um(r.ideia),
    local_corpo: um(r.local_corpo),
    tamanho: um(r.tamanho),
    cobertura: /^sim/i.test(um(r.cobertura).trim()) ? 'true' : '',
    cor: um(r.cor),
    faixa_investimento: um(r.faixa_investimento),
    prazo: um(r.prazo),
    data_limite: um(r.data_limite),
    origem: um(r.origem),
    indicado_por: um(r.indicado_por),
    tem_foto_local: (fotos.local || 0) > 0 ? 'true' : '',
    tem_referencia: (fotos.referencia || 0) > 0 || /^https?:\/\//i.test(linkRef) ? 'true' : '',
    status: 'novo',
  };

  const { dados, erros } = validarFicha(entrada, { agora });

  // regras que só existem na ficha pública
  if (lista(r.combinado).length < TOTAL_COMBINADOS) erros.combinado = 'Marque todos os itens do combinado.';
  if (!dados.ficha.tem_foto_local) erros.foto_local = 'Mande uma foto do local.';
  if (linkRef && !/^https?:\/\/\S{3,500}$/i.test(linkRef)) erros.link_referencia = 'O link de referência precisa começar com http.';

  const disponibilidade = lista(r.disponibilidade).filter((d) => DISPONIBILIDADES.includes(d));
  if (!disponibilidade.length) erros.disponibilidade = 'Marque quando você consegue vir.';

  const extras = {};
  if (r.idade_cobertura) extras.idade_cobertura = um(r.idade_cobertura).slice(0, 80);
  if (r.video) extras.video = um(r.video).slice(0, 120);

  dados.ficha = {
    ...dados.ficha,
    disponibilidade,
    link_referencia: linkRef && !erros.link_referencia ? linkRef : null,
    extras,
    canal: 'site',
  };
  // quem preenche a ficha não escolhe status nem orçamento
  delete dados.ficha.valor_orcamento;
  delete dados.ficha.observacoes;

  return { dados, erros, semFotoDaCobertura: dados.ficha.cobertura && !(fotos.cobertura > 0) };
}

// primeira mensagem de erro, para mostrar na tela da ficha
export function primeiroErro(erros) {
  return Object.values(erros)[0] || '';
}
