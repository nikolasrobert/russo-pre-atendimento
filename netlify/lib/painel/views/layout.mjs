// Layout comum: Bootstrap 5, menu e mensagens. Todo valor dinâmico passa por esc().
import { esc } from '../seguranca.mjs';
import { csrf } from './componentes.mjs';

const BOOTSTRAP = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist';

const MENSAGENS = {
  criada: ['success', 'Ficha criada.'],
  atualizada: ['success', 'Ficha atualizada.'],
  excluida: ['success', 'Ficha excluída.'],
  saiu: ['info', 'Você saiu do painel.'],
  entrou: ['success', 'Bem-vindo de volta.'],
};

export function layout({ titulo, corpo, logado = false, token = '', flash = '' }) {
  const aviso = MENSAGENS[flash];
  return `<!doctype html>
<html lang="pt-BR" data-bs-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(titulo)} · Painel Russo</title>
<link rel="stylesheet" href="${BOOTSTRAP}/css/bootstrap.min.css" crossorigin="anonymous">
<link rel="stylesheet" href="/assets/painel.css">
</head>
<body>
<nav class="navbar border-bottom border-secondary-subtle mb-4">
  <div class="container">
    <a class="navbar-brand marca" href="/painel">Russo <span class="text-body-secondary fs-6">· painel</span></a>
    ${logado ? `<div class="d-flex gap-2">
      <a class="btn btn-primary btn-sm" href="/painel/fichas/nova">Nova ficha</a>
      <form method="post" action="/painel/sair" class="m-0">${csrf(token)}<button class="btn btn-outline-light btn-sm" type="submit">Sair</button></form>
    </div>` : ''}
  </div>
</nav>
<main class="container pb-5">
${aviso ? `<div class="alert alert-${aviso[0]} alert-dismissible fade show" role="status">${esc(aviso[1])}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button></div>` : ''}
${corpo}
</main>
<script src="${BOOTSTRAP}/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
<script src="/assets/painel.js"></script>
</body>
</html>`;
}

export function paginaErro({ titulo, mensagem, logado = false, token = '' }) {
  return layout({
    titulo, logado, token,
    corpo: `<div class="py-5 text-center">
  <h1 class="h3 mb-3">${esc(titulo)}</h1>
  <p class="text-body-secondary mb-4">${esc(mensagem)}</p>
  <a class="btn btn-outline-light" href="/painel">Voltar para as fichas</a>
</div>`,
  });
}
