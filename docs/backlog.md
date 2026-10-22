# Backlog por sprint

Cada um faz commit da própria frente, em branch separada, ao longo das sprints. Marque `[x]` quando terminar.

## Sprint 2 · até 27/10 · Negócio e base técnica

**Nikolas: base do CodeIgniter 4** (primeira tarefa da sprint; os outros dependem dela)

O repositório já tem arquivos, então o CI4 é criado numa pasta temporária e copiado para cá:

```bash
composer create-project codeigniter4/appstarter ../ci4-base
cp -rn ../ci4-base/. .     # não sobrescreve README nem .gitignore
rm -rf ../ci4-base
composer install
cp env .env
php spark serve            # abre a página de boas-vindas do CI4
```

- [ ] CI4 instalado e rodando, `.env` fora do Git
- [ ] Filtro `csrf` ativo em todas as rotas (`app/Config/Filters.php`)
- [ ] Rotas agrupadas e nomeadas em `app/Config/Routes.php`; auto-routing desligado
- [ ] Layout base (`app/Views/layouts/`)

**Elson: banco**

- [ ] Migrations de `usuarios`, `clientes`, `atendimentos`, `fotos` e `sessoes` ([modelo de dados](modelo-de-dados.md))
- [ ] `UsuarioSeeder`, `ExemploSeeder` e `DatabaseSeeder`
- [ ] Models com `allowedFields`, `useTimestamps`, `validationRules` e `validationMessages` em português

**Caio: negócio**

- [ ] Concorrentes com preço e fonte (ponto de partida: InkDesk, Tattoo Studio Pro, Koalendar, Vagaro, agenda no WhatsApp e DM manual)
- [ ] Diferencial, modelo de receita (assinatura mensal), riscos e conclusão de viabilidade
- [ ] Número de estúdios de tatuagem no ES (CNAE 9609-2/06)
- [ ] Estimativa de preço: horas × valor/hora, hospedagem PHP, domínio, custo por mensagem do WhatsApp, manutenção e margem
- [ ] `docs/analise/sprint-2.md`

**Álvaro, Arthur e Matheus**

- [ ] Instalar o projeto na própria máquina seguindo o README e fazer um primeiro commit (pode ser correção no README)
- [ ] Ler o [modelo de dados](modelo-de-dados.md) e a [ficha original](../referencia/ficha-original.html)

## Sprint 3, parte 1 · até 05/11 · CRUDs (itens Must)

**Nikolas: login**

- [ ] `Auth` controller: `GET /entrar`, `POST /entrar`, `POST /sair`, com `password_verify`
- [ ] Filtro `auth` no grupo de rotas `painel`

**Álvaro: CRUD das fichas**

- [ ] `GET /painel` lista com filtro por status e região
- [ ] `GET /painel/atendimentos/(:num)` detalhe com fotos
- [ ] `GET .../(:num)/editar` e `POST .../(:num)` para status, valor do orçamento e observações
- [ ] `POST .../(:num)/excluir` com confirmação

**Arthur: CRUD de clientes**

- [ ] Listar, criar, editar e excluir (excluir só por POST)
- [ ] Busca por nome ou Instagram

**Elson: validação**

- [ ] Mensagens de erro em português em todos os formulários
- [ ] Validações condicionais (data só com "Tenho data marcada", indicação só com "Indicação")

**Matheus: interface do painel**

- [ ] Layout responsivo com Bootstrap 5, HTML semântico (`header`, `nav`, `main`, `table` com `caption` e `th scope`)

**Todos**

- [ ] `esc()` em toda saída, `csrf_field()` em todo formulário

## Sprint 3, parte 2 · até 11/11 · Ficha e integração (itens Should)

**Matheus: ficha pública**

- [ ] View da ficha a partir de `referencia/ficha-original.html`, CSS e JS em `public/assets/`
- [ ] Envio para `POST /ficha` com o token CSRF, resposta em JSON com erros em português
- [ ] Upload de fotos em `writable/uploads/fichas/{id}/`, só imagens, até 5 MB cada

**Elson: pontuação**

- [ ] `app/Libraries/Pontuacao.php` seguindo [referencia/pontuacao.md](../referencia/pontuacao.md)
- [ ] Teste `tests/unit/PontuacaoTest.php`

**Arthur: sessões**

- [ ] Agendar, remarcar e cancelar sessões de uma ficha

**Nikolas: integração**

- [ ] `app/Libraries/AvisoN8n.php` ([integracoes/README.md](../integracoes/README.md))
- [ ] Rota protegida `GET /painel/fotos/(:num)` para servir as fotos

**Álvaro**

- [ ] Ordenar a lista por temperatura (quentes primeiro) e ajustes de responsividade

**Caio**

- [ ] Roteiro do pitch e primeira versão dos slides finais

## Sprint 4 · 24 e 26/11 · Entrega final

- [ ] Nikolas: deploy em hospedagem PHP (+2 de bônus)
- [ ] Caio: documento de análise em PDF (Sprints 1 e 2 juntas)
- [ ] Todos: slides do pitch, ensaio cronometrado, cada um explica a própria frente
