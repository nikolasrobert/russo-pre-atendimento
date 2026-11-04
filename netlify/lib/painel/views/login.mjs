import { esc } from '../seguranca.mjs';
import { csrf } from './componentes.mjs';

export function login({ token, email = '', erro = '', demo = false }) {
  return `<div class="row justify-content-center"><div class="col-12 col-sm-9 col-md-6 col-lg-4">
  <div class="card"><div class="card-body p-4">
    <h1 class="h4 mb-1">Entrar</h1>
    <p class="text-body-secondary mb-4">Painel das fichas de orçamento.</p>
    ${erro ? `<div class="alert alert-danger" role="alert">${esc(erro)}</div>` : ''}
    ${demo ? '<div class="alert alert-info small" role="note">Modo demonstração: demo@painel.local / demo1234</div>' : ''}
    <form method="post" action="/painel/entrar">
      ${csrf(token)}
      <div class="mb-3"><label class="form-label" for="email">E-mail</label>
        <input class="form-control" type="email" id="email" name="email" value="${esc(email)}" required autocomplete="username"></div>
      <div class="mb-4"><label class="form-label" for="senha">Senha</label>
        <input class="form-control" type="password" id="senha" name="senha" required autocomplete="current-password"></div>
      <button class="btn btn-primary w-100" type="submit">Entrar</button>
    </form>
  </div></div>
</div></div>`;
}
