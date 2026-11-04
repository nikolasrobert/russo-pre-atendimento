// Controller do painel: rotas, sessão, CSRF e chamadas ao Model. Sem acesso direto ao banco.
import {
  CAMPO_CSRF, COOKIE_CSRF, COOKIE_SESSAO, novoTokenCsrf, csrfValido, criarSessao, lerSessao, senhaConfere, iguais,
} from './seguranca.mjs';
import { validarFicha, valoresDaFicha } from './validacao.mjs';
import { lerCookies, cookie, html, redirecionar } from './http.mjs';
import { layout, paginaErro } from './views/layout.mjs';
import { login } from './views/login.mjs';
import { lista, detalhe, formulario, confirmarExclusao } from './views/fichas.mjs';

const ROTAS = [
  ['GET', /^\/painel\/?$/, 'listar'],
  ['GET', /^\/painel\/entrar$/, 'telaEntrar'],
  ['POST', /^\/painel\/entrar$/, 'entrar'],
  ['POST', /^\/painel\/sair$/, 'sair'],
  ['GET', /^\/painel\/fichas\/nova$/, 'nova'],
  ['POST', /^\/painel\/fichas$/, 'criar'],
  ['GET', /^\/painel\/fichas\/([^/]+)$/, 'ver'],
  ['GET', /^\/painel\/fichas\/([^/]+)\/editar$/, 'editar'],
  ['POST', /^\/painel\/fichas\/([^/]+)$/, 'atualizar'],
  ['GET', /^\/painel\/fichas\/([^/]+)\/excluir$/, 'confirmarExcluir'],
  ['POST', /^\/painel\/fichas\/([^/]+)\/excluir$/, 'excluir'],
];

const PUBLICAS = new Set(['telaEntrar', 'entrar']);
const formParaObjeto = (fd) => Object.fromEntries([...fd.keys()].map((k) => [k, fd.get(k)]));

/**
 * @param {Request} req
 * @param {{ model: import('./models/ficha-model.mjs').FichaModel, config: object, agora?: number }} deps
 */
export async function processar(req, { model, config, agora = Date.now() }) {
  const url = new URL(req.url);
  const https = url.protocol === 'https:';
  const cookies = lerCookies(req);
  const novosCookies = [];

  // CSRF: garante um token por navegador
  let token = cookies[COOKIE_CSRF];
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    token = novoTokenCsrf();
    novosCookies.push(cookie(COOKIE_CSRF, token, { https }));
  }

  const sessao = lerSessao(cookies[COOKIE_SESSAO], config.segredo, agora);
  const flash = cookies.painel_flash || '';
  if (flash) novosCookies.push(cookie('painel_flash', '', { https, maxAge: 0 }));

  const pagina = (status, titulo, corpo) => html(status, layout({ titulo, corpo, logado: !!sessao, token, flash }), novosCookies);
  const erro = (status, titulo, mensagem) => html(status, paginaErro({ titulo, mensagem, logado: !!sessao, token }), novosCookies);
  const ir = (local, aviso) => redirecionar(local, aviso ? [...novosCookies, cookie('painel_flash', aviso, { https, maxAge: 30 })] : novosCookies);

  // rota
  const caminho = url.pathname.replace(/\/+$/, '') || '/painel';
  let acao = null; let param = null; let metodoErrado = false;
  for (const [metodo, padrao, nome] of ROTAS) {
    const m = caminho.match(padrao);
    if (!m) continue;
    if (metodo !== req.method) { metodoErrado = true; continue; }
    acao = nome; param = m[1] ? decodeURIComponent(m[1]) : null;
    break;
  }
  if (!acao) {
    return metodoErrado
      ? erro(405, 'Ação não permitida', 'Essa ação só funciona pelo botão do painel.')
      : erro(404, 'Página não encontrada', 'Esse endereço não existe no painel.');
  }

  // login obrigatório
  if (!sessao && !PUBLICAS.has(acao)) return ir('/painel/entrar');
  if (sessao && acao === 'telaEntrar') return ir('/painel');

  // todo POST precisa do token CSRF certo
  let form = {};
  if (req.method === 'POST') {
    try { form = formParaObjeto(await req.formData()); }
    catch { return erro(400, 'Envio inválido', 'Não consegui ler o formulário. Tente de novo.'); }
    if (!csrfValido(cookies[COOKIE_CSRF], form[CAMPO_CSRF])) {
      return erro(403, 'Sessão expirada', 'Por segurança, recarregue a página e envie de novo.');
    }
  }

  try {
    switch (acao) {
      case 'telaEntrar':
        return pagina(200, 'Entrar', login({ token, demo: config.demo }));

      case 'entrar': {
        const email = String(form.email || '').trim().toLowerCase();
        const ok = iguais(email, String(config.email || '').toLowerCase()) && senhaConfere(form.senha, config.senhaHash);
        if (!ok) {
          await new Promise((r) => setTimeout(r, config.atrasoErro ?? 400));
          return pagina(401, 'Entrar', login({ token, email, erro: 'E-mail ou senha incorretos.', demo: config.demo }));
        }
        const sess = cookie(COOKIE_SESSAO, criarSessao(email, config.segredo, agora), { https, maxAge: 8 * 3600 });
        const novoToken = cookie(COOKIE_CSRF, novoTokenCsrf(), { https });  // token novo a cada login
        return redirecionar('/painel', [sess, novoToken, cookie('painel_flash', 'entrou', { https, maxAge: 30 })]);
      }

      case 'sair':
        return redirecionar('/painel/entrar', [
          cookie(COOKIE_SESSAO, '', { https, maxAge: 0 }),
          cookie('painel_flash', 'saiu', { https, maxAge: 30 }),
        ]);

      case 'listar': {
        const q = Object.fromEntries(url.searchParams);
        const filtros = model.filtrosLimpos(q);
        const fichas = await model.listar(filtros);
        const todas = filtros.status || filtros.temperatura || filtros.regiao || filtros.busca ? await model.listar({}) : fichas;
        return pagina(200, 'Fichas', lista({ fichas, filtros, resumo: model.resumo(todas) }));
      }

      case 'nova':
        return pagina(200, 'Nova ficha', formulario({ token, valores: { status: 'novo' } }));

      case 'criar': {
        const { dados, erros, valores } = validarFicha(form, { agora });
        if (Object.keys(erros).length) return pagina(422, 'Nova ficha', formulario({ token, valores, erros }));
        const salva = await model.criar(dados);
        return ir(`/painel/fichas/${salva.id}`, 'criada');
      }

      case 'ver': {
        const ficha = await model.buscar(param);
        if (!ficha) return erro(404, 'Ficha não encontrada', 'Ela pode ter sido excluída.');
        return pagina(200, ficha.cliente.nome, detalhe({ ficha }));
      }

      case 'editar': {
        const ficha = await model.buscar(param);
        if (!ficha) return erro(404, 'Ficha não encontrada', 'Ela pode ter sido excluída.');
        return pagina(200, 'Editar ficha', formulario({ token, id: ficha.id, valores: valoresDaFicha(ficha) }));
      }

      case 'atualizar': {
        if (!model.idValido(param)) return erro(404, 'Ficha não encontrada', 'Ela pode ter sido excluída.');
        const { dados, erros, valores } = validarFicha(form, { agora });
        if (Object.keys(erros).length) return pagina(422, 'Editar ficha', formulario({ token, id: param, valores, erros }));
        const salva = await model.atualizar(param, dados);
        if (!salva) return erro(404, 'Ficha não encontrada', 'Ela pode ter sido excluída.');
        return ir(`/painel/fichas/${param}`, 'atualizada');
      }

      case 'confirmarExcluir': {
        const ficha = await model.buscar(param);
        if (!ficha) return erro(404, 'Ficha não encontrada', 'Ela pode ter sido excluída.');
        return pagina(200, 'Excluir ficha', confirmarExclusao({ ficha, token }));
      }

      case 'excluir': {
        const ok = await model.excluir(param);
        if (!ok) return erro(404, 'Ficha não encontrada', 'Ela pode ter sido excluída.');
        return ir('/painel', 'excluida');
      }
    }
  } catch (e) {
    console.error('painel', acao, e && e.message);
    return erro(500, 'Algo deu errado', 'Não consegui falar com o banco agora. Tente de novo em instantes.');
  }
  return erro(404, 'Página não encontrada', 'Esse endereço não existe no painel.');
}
