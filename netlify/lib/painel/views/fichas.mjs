// Views das fichas: lista, detalhe, formulário e confirmação de exclusão.
import { esc } from '../seguranca.mjs';
import {
  CIDADES_GV, OUTRA_CIDADE, EXPERIENCIAS, LOCAIS, TAMANHOS, CORES, FAIXAS, PRAZOS, ORIGENS,
  STATUS, TEMPERATURAS, REGIOES,
} from '../opcoes.mjs';
import {
  csrf, campoTexto, campoTextarea, campoSelect, campoCheck, badgeTemperatura, badgeStatus,
  nomeRegiao, dataBR, moeda, resumir,
} from './componentes.mjs';

const link = (id, sufixo = '') => `/painel/fichas/${encodeURIComponent(id)}${sufixo}`;

// só vira link se for mesmo um card do Trello
const linkTrello = (url) => (/^https:\/\/trello\.com\/c\/[A-Za-z0-9]+/.test(String(url || ''))
  ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Abrir card</a>` : '—');

function sessaoMarcada(f) {
  const s = (f.sessoes || []).find((x) => x.status === 'marcada');
  if (!s) return '—';
  const quando = new Date(new Date(s.inicio).getTime() - 3 * 3600000).toISOString();
  return `${esc(quando.slice(8, 10))}/${esc(quando.slice(5, 7))} às ${esc(quando.slice(11, 16))} · ${esc(String(s.duracao_horas).replace('.', ','))}h`;
}

// ---------------------------------------------------------------------------
// LISTA (Read)
// ---------------------------------------------------------------------------
export function lista({ fichas, filtros, resumo }) {
  const filtrando = filtros.status || filtros.temperatura || filtros.regiao || filtros.busca;

  const linhas = fichas.map((f) => `<tr>
  <td><a class="link-light fw-semibold" href="${link(f.id)}">${esc(f.cliente.nome)}</a><div class="small text-body-secondary">@${esc(f.cliente.instagram)}</div></td>
  <td class="d-none d-lg-table-cell">${esc(resumir(f.ideia, 60))}</td>
  <td>${esc(f.local_corpo)}</td>
  <td>${badgeTemperatura(f)}</td>
  <td>${badgeStatus(f)}</td>
  <td class="d-none d-lg-table-cell">${esc(dataBR(f.criado_em))}</td>
  <td class="text-end text-nowrap">
    <a class="btn btn-sm btn-outline-light" href="${link(f.id, '/editar')}">Editar</a>
    <a class="btn btn-sm btn-outline-danger" href="${link(f.id, '/excluir')}">Excluir</a>
  </td>
</tr>`).join('');

  const cartoes = fichas.map((f) => `<a class="list-group-item list-group-item-action py-3" href="${link(f.id)}">
  <div class="d-flex justify-content-between align-items-start gap-2">
    <div><div class="fw-semibold">${esc(f.cliente.nome)}</div><div class="small text-body-secondary">${esc(f.local_corpo)} · ${esc(dataBR(f.criado_em))}</div></div>
    <div class="text-end">${badgeTemperatura(f)}<div class="mt-1">${badgeStatus(f)}</div></div>
  </div>
</a>`).join('');

  const vazio = `<div class="text-center py-5 border border-secondary-subtle rounded">
  <p class="mb-3">${filtrando ? 'Nenhuma ficha com esses filtros.' : 'Nenhuma ficha ainda.'}</p>
  ${filtrando ? '<a class="btn btn-outline-light" href="/painel">Limpar filtros</a>' : '<a class="btn btn-primary" href="/painel/fichas/nova">Cadastrar a primeira</a>'}
</div>`;

  return `<div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
  <div>
    <h1 class="h3 mb-1">Fichas</h1>
    <p class="text-body-secondary mb-0">${esc(resumo.total)} no total · ${esc(resumo.novas)} novas · <span class="text-danger-emphasis">${esc(resumo.quentes)} quentes em aberto</span></p>
  </div>
</div>

<form class="row g-2 mb-4" method="get" action="/painel" role="search">
  <div class="col-12 col-md-4"><label class="visually-hidden" for="busca">Buscar</label>
    <input class="form-control" id="busca" name="busca" placeholder="Buscar por nome ou @" value="${esc(filtros.busca)}"></div>
  <div class="col-6 col-md-2"><label class="visually-hidden" for="f-status">Status</label>
    <select class="form-select" id="f-status" name="status"><option value="">Todo status</option>${Object.entries(STATUS).map(([v, t]) => `<option value="${esc(v)}"${filtros.status === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
  <div class="col-6 col-md-2"><label class="visually-hidden" for="f-temperatura">Temperatura</label>
    <select class="form-select" id="f-temperatura" name="temperatura"><option value="">Toda temperatura</option>${Object.entries(TEMPERATURAS).map(([v, t]) => `<option value="${esc(v)}"${filtros.temperatura === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
  <div class="col-12 col-md-2"><label class="visually-hidden" for="f-regiao">Região</label>
    <select class="form-select" id="f-regiao" name="regiao"><option value="">Toda região</option>${Object.entries(REGIOES).map(([v, t]) => `<option value="${esc(v)}"${filtros.regiao === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
  <div class="col-12 col-md-2 d-grid"><button class="btn btn-outline-light" type="submit">Filtrar</button></div>
</form>

${fichas.length ? `<div class="table-responsive d-none d-md-block">
<table class="table table-hover align-middle">
  <caption class="visually-hidden">Fichas de orçamento</caption>
  <thead><tr><th scope="col">Cliente</th><th scope="col" class="d-none d-lg-table-cell">Ideia</th><th scope="col">Local</th><th scope="col">Temperatura</th><th scope="col">Status</th><th scope="col" class="d-none d-lg-table-cell">Entrou em</th><th scope="col" class="text-end">Ações</th></tr></thead>
  <tbody>${linhas}</tbody>
</table>
</div>
<div class="list-group d-md-none">${cartoes}</div>` : vazio}`;
}

// ---------------------------------------------------------------------------
// DETALHE (Read)
// ---------------------------------------------------------------------------
const item = (rotulo, valor) => `<dt class="col-sm-4 text-body-secondary fw-normal">${esc(rotulo)}</dt><dd class="col-sm-8">${valor}</dd>`;

export function detalhe({ ficha: f }) {
  return `<nav aria-label="breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="/painel">Fichas</a></li><li class="breadcrumb-item active" aria-current="page">${esc(f.cliente.nome)}</li></ol></nav>
<div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
  <div><h1 class="h3 mb-2">${esc(f.cliente.nome)}</h1><div class="d-flex gap-2">${badgeTemperatura(f)} ${badgeStatus(f)}</div></div>
  <div class="d-flex gap-2">
    <a class="btn btn-outline-light" href="${link(f.id, '/editar')}">Editar</a>
    <a class="btn btn-outline-danger" href="${link(f.id, '/excluir')}">Excluir</a>
  </div>
</div>
<div class="row g-4">
  <div class="col-12 col-lg-7">
    <section class="card mb-4"><div class="card-body">
      <h2 class="h5 card-title mb-3">A ideia</h2>
      <p class="ideia mb-0">${esc(f.ideia)}</p>
    </div></section>
    <section class="card"><div class="card-body">
      <h2 class="h5 card-title mb-3">Pedido</h2>
      <dl class="row mb-0">
        ${item('Local do corpo', esc(f.local_corpo))}
        ${item('Tamanho', esc(f.tamanho))}
        ${item('Cor', esc(f.cor || '—'))}
        ${item('Cobertura', f.cobertura ? 'Sim' : 'Não')}
        ${item('Investimento', esc(f.faixa_investimento))}
        ${item('Prazo', esc(f.prazo) + (f.data_limite ? ` · ${esc(dataBR(f.data_limite))}` : ''))}
        ${item('Experiência', esc(f.experiencia))}
        ${item('Chegou por', f.indicado_por ? `Indicação de ${esc(f.indicado_por)}` : esc(f.origem || '—'))}
      </dl>
    </div></section>
  </div>
  <div class="col-12 col-lg-5">
    <section class="card mb-4"><div class="card-body">
      <h2 class="h5 card-title mb-3">Cliente</h2>
      <dl class="row mb-0">
        ${item('Instagram', `@${esc(f.cliente.instagram)}`)}
        ${item('WhatsApp', esc(f.cliente.whatsapp))}
        ${item('Cidade', esc(f.cliente.cidade))}
        ${item('Região', esc(nomeRegiao(f.cliente.regiao)))}
      </dl>
    </div></section>
    <section class="card mb-4"><div class="card-body">
      <h2 class="h5 card-title mb-3">Atendimento</h2>
      <dl class="row mb-0">
        ${item('Sessão', sessaoMarcada(f))}
        ${item('Trello', linkTrello(f.trello_card_url))}
        ${item('Orçamento', esc(moeda(f.valor_orcamento) || '—'))}
        ${item('Observações', esc(f.observacoes || '—'))}
        ${item('Entrou em', esc(dataBR(f.criado_em)))}
      </dl>
    </div></section>
    <section class="card"><div class="card-body">
      <h2 class="h5 card-title mb-2">Por que essa nota</h2>
      <p class="mb-0 text-body-secondary">${esc(f.motivos || 'Sem pontos.')}</p>
    </div></section>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// FORMULÁRIO (Create e Update)
// ---------------------------------------------------------------------------
export function formulario({ valores = {}, erros = {}, token, id = null }) {
  const v = (k) => valores[k] ?? '';
  const e = (k) => erros[k];
  const total = Object.keys(erros).length;
  const acao = id ? link(id) : '/painel/fichas';
  const titulo = id ? 'Editar ficha' : 'Nova ficha';

  return `<nav aria-label="breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="/painel">Fichas</a></li><li class="breadcrumb-item active" aria-current="page">${esc(titulo)}</li></ol></nav>
<h1 class="h3 mb-4">${esc(titulo)}</h1>
${total ? `<div class="alert alert-danger" role="alert"><strong>Confira ${total === 1 ? 'o campo marcado' : `os ${total} campos marcados`}.</strong> Nada foi salvo ainda.</div>` : ''}
<form method="post" action="${esc(acao)}" class="needs-validation" novalidate>
  ${csrf(token)}
  <div class="row g-4">
    <div class="col-12 col-lg-6">
      <fieldset class="card"><div class="card-body">
        <legend class="h5 mb-3">Cliente</legend>
        ${campoTexto({ nome: 'nome', rotulo: 'Nome', valor: v('nome'), erro: e('nome'), obrigatorio: true, extra: 'maxlength="100" autocomplete="off"' })}
        ${campoTexto({ nome: 'instagram', rotulo: 'Instagram', valor: v('instagram'), erro: e('instagram'), obrigatorio: true, extra: 'maxlength="31" placeholder="@perfil" autocomplete="off"' })}
        ${campoTexto({ nome: 'whatsapp', rotulo: 'WhatsApp', valor: v('whatsapp'), erro: e('whatsapp'), tipo: 'tel', obrigatorio: true, extra: 'placeholder="(27) 99999-9999" inputmode="tel"', ajuda: 'Com DDD.' })}
        ${campoSelect({ nome: 'cidade', rotulo: 'Cidade', opcoes: [...CIDADES_GV, OUTRA_CIDADE], valor: v('cidade'), erro: e('cidade'), obrigatorio: true })}
        ${campoTexto({ nome: 'cidade_outra', rotulo: 'Qual cidade?', valor: v('cidade_outra'), erro: e('cidade_outra'), extra: 'maxlength="80"', grupo: ` data-mostrar-se="cidade=${esc(OUTRA_CIDADE)}"` })}
      </div></fieldset>
    </div>
    <div class="col-12 col-lg-6">
      <fieldset class="card"><div class="card-body">
        <legend class="h5 mb-3">Atendimento</legend>
        ${campoSelect({ nome: 'status', rotulo: 'Status', opcoes: STATUS, valor: v('status') || 'novo', erro: e('status'), obrigatorio: true, vazio: null })}
        ${campoTexto({ nome: 'valor_orcamento', rotulo: 'Valor do orçamento (R$)', valor: v('valor_orcamento'), erro: e('valor_orcamento'), extra: 'inputmode="decimal" placeholder="1.500,00"' })}
        ${campoTextarea({ nome: 'observacoes', rotulo: 'Observações', valor: v('observacoes'), erro: e('observacoes'), linhas: 4, extra: 'maxlength="2000"' })}
      </div></fieldset>
    </div>
    <div class="col-12">
      <fieldset class="card"><div class="card-body">
        <legend class="h5 mb-3">Pedido</legend>
        ${campoTextarea({ nome: 'ideia', rotulo: 'A ideia, nas palavras do cliente', valor: v('ideia'), erro: e('ideia'), obrigatorio: true, linhas: 4, extra: 'minlength="10" maxlength="2000"' })}
        <div class="row">
          <div class="col-12 col-md-6">${campoSelect({ nome: 'local_corpo', rotulo: 'Local do corpo', opcoes: LOCAIS, valor: v('local_corpo'), erro: e('local_corpo'), obrigatorio: true })}</div>
          <div class="col-12 col-md-6">${campoSelect({ nome: 'tamanho', rotulo: 'Tamanho', opcoes: TAMANHOS, valor: v('tamanho'), erro: e('tamanho'), obrigatorio: true })}</div>
          <div class="col-12 col-md-6">${campoSelect({ nome: 'faixa_investimento', rotulo: 'Faixa de investimento', opcoes: FAIXAS, valor: v('faixa_investimento'), erro: e('faixa_investimento'), obrigatorio: true })}</div>
          <div class="col-12 col-md-6">${campoSelect({ nome: 'cor', rotulo: 'Cor', opcoes: CORES, valor: v('cor'), erro: e('cor'), vazio: 'Não informou' })}</div>
          <div class="col-12 col-md-6">${campoSelect({ nome: 'prazo', rotulo: 'Prazo', opcoes: PRAZOS, valor: v('prazo'), erro: e('prazo'), obrigatorio: true })}</div>
          <div class="col-12 col-md-6">${campoTexto({ nome: 'data_limite', rotulo: 'Data marcada', valor: v('data_limite'), erro: e('data_limite'), tipo: 'date', grupo: ' data-mostrar-se="prazo=Tenho data marcada"' })}</div>
          <div class="col-12 col-md-6">${campoSelect({ nome: 'experiencia', rotulo: 'Experiência com tatuagem', opcoes: EXPERIENCIAS, valor: v('experiencia'), erro: e('experiencia'), obrigatorio: true })}</div>
          <div class="col-12 col-md-6">${campoSelect({ nome: 'origem', rotulo: 'Como chegou', opcoes: ORIGENS, valor: v('origem'), erro: e('origem'), obrigatorio: true })}</div>
          <div class="col-12 col-md-6">${campoTexto({ nome: 'indicado_por', rotulo: 'Quem indicou', valor: v('indicado_por'), erro: e('indicado_por'), extra: 'maxlength="80"', grupo: ' data-mostrar-se="origem=Indicação"' })}</div>
        </div>
        ${campoCheck({ nome: 'cobertura', rotulo: 'É cobertura de uma tattoo antiga', marcado: !!valores.cobertura })}
        ${campoCheck({ nome: 'tem_foto_local', rotulo: 'Cliente mandou foto do local', marcado: !!valores.tem_foto_local })}
        ${campoCheck({ nome: 'tem_referencia', rotulo: 'Cliente mandou referência', marcado: !!valores.tem_referencia })}
      </div></fieldset>
    </div>
  </div>
  <div class="d-flex gap-2 mt-4">
    <button class="btn btn-primary" type="submit">${id ? 'Salvar alterações' : 'Cadastrar ficha'}</button>
    <a class="btn btn-outline-light" href="${id ? link(id) : '/painel'}">Cancelar</a>
  </div>
</form>`;
}

// ---------------------------------------------------------------------------
// CONFIRMAÇÃO DE EXCLUSÃO (Delete)
// ---------------------------------------------------------------------------
export function confirmarExclusao({ ficha: f, token }) {
  return `<div class="row justify-content-center"><div class="col-12 col-md-8 col-lg-6">
  <div class="card border-danger"><div class="card-body p-4">
    <h1 class="h4 mb-3">Excluir a ficha de ${esc(f.cliente.nome)}?</h1>
    <p class="text-body-secondary">${esc(resumir(f.ideia, 140))}</p>
    <p class="mb-4">A ficha some do painel e não dá para desfazer. O cadastro do cliente continua.</p>
    <form method="post" action="${link(f.id, '/excluir')}" class="d-flex gap-2">
      ${csrf(token)}
      <button class="btn btn-danger" type="submit">Excluir ficha</button>
      <a class="btn btn-outline-light" href="${link(f.id)}">Cancelar</a>
    </form>
  </div></div>
</div></div>`;
}
