# Russo · Pré-atendimento para tatuadores

O cliente preenche uma ficha pelo celular: ideia, local do corpo, tamanho, faixa de investimento e fotos. A ficha é salva no banco e pontuada como quente, morna ou fria. Em seguida vira um card no quadro do tatuador no Trello, e as fichas quentes chegam na hora no WhatsApp dele.

O cliente real é o tatuador Vinicius Russo ([@russo.tattooer](https://instagram.com/russo.tattooer)), de Vila Velha (ES). A ficha dele está no ar em https://ficha-russo.netlify.app. Este repositório é o trabalho de Desenvolvimento Web do IFES construído em cima dessa base.

## Integrantes

| Integrante | Frente |
| --- | --- |
| Caio Sperandio | Análise e negócio: viabilidade, preço e documento em PDF |
| Elson Ramos | Banco no Supabase: tabelas, regras e dados de exemplo |
| Álvaro de Vargas | Integração com o Trello: card, colunas e sincronização de status |
| Arthur de França | Sessões e resumo diário |
| Matheus de Oliveira Fragoso | Ficha pública, upload de fotos e interface responsiva |
| Nikolas Robert | Arquitetura, funções do Netlify, n8n, WhatsApp e deploy |

Turma: ____

## Situação

| Sprint | Data | Situação |
| --- | --- | --- |
| 1 · Análise e planejamento | 22/10 | Entregue: [docs/analise/sprint-1.md](docs/analise/sprint-1.md) |
| 2 · Negócio e base técnica | 27/10 | Entregue: [docs/analise/sprint-2.md](docs/analise/sprint-2.md) |
| 3 · Funcionalidades | 05/11 e 11/11 | A fazer |
| 4 · Entrega final | 24/11 e 26/11 | A fazer |

O que cada um faz em cada sprint: [docs/backlog.md](docs/backlog.md). Roteiro de cada apresentação: [docs/cronograma.md](docs/cronograma.md).

## Tecnologias

| Parte | Tecnologia |
| --- | --- |
| Ficha pública (View) | HTML, CSS e JavaScript puros, mobile-first, no Netlify |
| API (Controller) | Netlify Functions em Node.js 20 |
| Banco e fotos (Model) | Supabase: Postgres, Storage e regras de acesso por linha (RLS) |
| Automação | n8n |
| Painel do tatuador | Trello |
| Aviso | WhatsApp Cloud API |

## Como rodar

Requisitos: Node.js 20 ou mais novo e o [Netlify CLI](https://docs.netlify.com/cli/get-started/).

```bash
git clone https://github.com/nikolasrobert/russo-pre-atendimento.git
cd russo-pre-atendimento
npm install
npm test            # testes da função e da pontuação
netlify dev         # ficha em http://localhost:8888
```

Variáveis de ambiente (no painel do Netlify ou num `.env` que nunca vai para o Git):

| Variável | Para quê |
| --- | --- |
| `SUPABASE_URL` | Endereço do projeto no Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço, usada só dentro das funções |
| `N8N_WEBHOOK_URL` | Webhook do n8n que pontua e distribui a ficha |
| `FICHA_TOKEN` | Opcional: segredo conferido pelo n8n |

## Como criar o banco

1. Crie um projeto em https://supabase.com.
2. No SQL Editor, rode [supabase/migrations/0001_schema.sql](supabase/migrations/0001_schema.sql). Ele cria as 6 tabelas, as regras de acesso e o bucket de fotos.
3. Para ter dados de teste, rode [supabase/seed.sql](supabase/seed.sql).

Com o [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase db push` aplica a migration e `supabase db reset` recria o banco com o seed.

As tabelas estão descritas em [docs/modelo-de-dados.md](docs/modelo-de-dados.md).

## Estrutura (MVC)

```
site/                 View: a ficha do cliente
netlify/functions/    Controller: recebe, valida e salva (ficha.mjs, arquivo.mjs)
supabase/             Model: tabelas, regras e dados de exemplo
n8n/                  Controller de integração: pontua, cria o card no Trello e avisa no WhatsApp
whatsapp/             Modelos de mensagem para aprovar na Meta
docs/                 Análise de cada sprint, modelo de dados, backlog e cronograma
referencia/           Regras de pontuação e o quadro antigo do Notion
tests/                Testes automatizados (node --test)
```

## Rotas

| Método | Rota | Onde | O que faz |
| --- | --- | --- | --- |
| GET | `/` | Netlify | Abre a ficha |
| POST | `/api/ficha` | Função | Valida, salva no Supabase e chama o n8n |
| GET | `/arquivo/:ficha/:foto` | Função | Link temporário da foto |
| POST | `/webhook/russo-tattoer` | n8n | Pontua, cria o card no Trello e avisa no WhatsApp |
| POST | `/webhook/trello` | n8n | Card movido: atualiza o status no banco |
| CRON | todo dia às 9h | n8n | Resumo das fichas pendentes no WhatsApp |

## Como contribuir

1. Crie uma branch por tarefa: `git checkout -b feat/trello-sync`.
2. Faça commits pequenos, em português: `feat(trello): cria card com etiqueta de temperatura`.
3. Abra um pull request e peça revisão de outra pessoa do grupo.

O barema avalia commits de todos os integrantes ao longo das sprints, então cada um faz commit da própria frente.
