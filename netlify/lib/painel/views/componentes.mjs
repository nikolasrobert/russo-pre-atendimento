// Pedaços de HTML reaproveitados pelas views. Todo valor dinâmico passa por esc().
import { esc, CAMPO_CSRF } from '../seguranca.mjs';
import { STATUS, TEMPERATURAS, REGIOES } from '../opcoes.mjs';

export const csrf = (token) => `<input type="hidden" name="${CAMPO_CSRF}" value="${esc(token)}">`;

const invalido = (erro) => (erro ? ' is-invalid' : '');
const feedback = (nome, erro) => (erro ? `<div class="invalid-feedback" id="erro-${esc(nome)}">${esc(erro)}</div>` : '');
const descrito = (nome, erro) => (erro ? ` aria-describedby="erro-${esc(nome)}"` : '');

export function campoTexto({ nome, rotulo, valor = '', erro, tipo = 'text', obrigatorio = false, extra = '', ajuda = '', grupo = '' }) {
  return `<div class="mb-3"${grupo}>
  <label class="form-label" for="${esc(nome)}">${esc(rotulo)}${obrigatorio ? ' <span class="text-danger" aria-hidden="true">*</span>' : ''}</label>
  <input class="form-control${invalido(erro)}" type="${esc(tipo)}" id="${esc(nome)}" name="${esc(nome)}" value="${esc(valor)}"${obrigatorio ? ' required' : ''}${descrito(nome, erro)} ${extra}>
  ${ajuda ? `<div class="form-text">${esc(ajuda)}</div>` : ''}${feedback(nome, erro)}
</div>`;
}

export function campoTextarea({ nome, rotulo, valor = '', erro, obrigatorio = false, linhas = 4, extra = '' }) {
  return `<div class="mb-3">
  <label class="form-label" for="${esc(nome)}">${esc(rotulo)}${obrigatorio ? ' <span class="text-danger" aria-hidden="true">*</span>' : ''}</label>
  <textarea class="form-control${invalido(erro)}" id="${esc(nome)}" name="${esc(nome)}" rows="${Number(linhas)}"${obrigatorio ? ' required' : ''}${descrito(nome, erro)} ${extra}>${esc(valor)}</textarea>
  ${feedback(nome, erro)}
</div>`;
}

// opcoes: array de textos (valor = texto) ou objeto { valor: texto }
export function campoSelect({ nome, rotulo, opcoes, valor = '', erro, obrigatorio = false, vazio = 'Escolha…', grupo = '' }) {
  const pares = Array.isArray(opcoes) ? opcoes.map((o) => [o, o]) : Object.entries(opcoes);
  const itens = pares.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(valor) ? ' selected' : ''}>${esc(t)}</option>`).join('');
  return `<div class="mb-3"${grupo}>
  <label class="form-label" for="${esc(nome)}">${esc(rotulo)}${obrigatorio ? ' <span class="text-danger" aria-hidden="true">*</span>' : ''}</label>
  <select class="form-select${invalido(erro)}" id="${esc(nome)}" name="${esc(nome)}"${obrigatorio ? ' required' : ''}${descrito(nome, erro)}>
    ${vazio !== null ? `<option value="">${esc(vazio)}</option>` : ''}${itens}
  </select>
  ${feedback(nome, erro)}
</div>`;
}

export function campoCheck({ nome, rotulo, marcado = false }) {
  return `<div class="form-check mb-2">
  <input class="form-check-input" type="checkbox" id="${esc(nome)}" name="${esc(nome)}"${marcado ? ' checked' : ''}>
  <label class="form-check-label" for="${esc(nome)}">${esc(rotulo)}</label>
</div>`;
}

export function badgeTemperatura(f) {
  const cor = { quente: 'text-bg-danger', morna: 'text-bg-warning', fria: 'text-bg-info' }[f.temperatura] || 'text-bg-secondary';
  return `<span class="badge ${cor}">${esc(TEMPERATURAS[f.temperatura] || f.temperatura)} · ${esc(f.pontuacao)}</span>`;
}

export function badgeStatus(f) {
  const cor = {
    novo: 'text-bg-primary', em_conversa: 'text-bg-light', orcamento_enviado: 'text-bg-light',
    agendado: 'text-bg-success', fechado: 'text-bg-success', perdido: 'text-bg-secondary', arquivado: 'text-bg-secondary',
  }[f.status] || 'text-bg-secondary';
  return `<span class="badge ${cor}">${esc(STATUS[f.status] || f.status)}</span>`;
}

export const nomeRegiao = (r) => REGIOES[r] || r;

export function dataBR(iso) {
  if (!iso) return '';
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function moeda(v) {
  if (v === null || v === undefined || v === '') return '';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const resumir = (t, n = 80) => {
  const s = String(t || '');
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};
