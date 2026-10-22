# Russo · Painel de pré-atendimento

Sistema web em **CodeIgniter 4** para um tatuador organizar os pedidos de orçamento que chegam pelo Instagram. O cliente preenche uma ficha pelo celular (ideia, local do corpo, tamanho, faixa de investimento e fotos). O tatuador vê as fichas num painel, já pontuadas como quentes, mornas ou frias, e recebe um aviso no WhatsApp.

O cliente real é o tatuador Vinicius Russo ([@russo.tattooer](https://instagram.com/russo.tattooer)), de Vila Velha (ES). Uma primeira versão, feita com HTML, Netlify, n8n e Notion, já está no ar. Este repositório é a reconstrução em CodeIgniter 4 para o trabalho de Desenvolvimento Web.

## Integrantes

| Integrante | Frente |
| --- | --- |
| Caio Sperandio | Análise e negócio: viabilidade, preço e documento em PDF |
| Elson | Banco: migrations, seeders e Models com validação |
| Álvaro | Painel: CRUD das fichas, com filtros |
| Arthur | CRUD de clientes e agenda de sessões |
| Matheus | Ficha pública, upload de fotos e interface responsiva |
| Nikolas Robert | Arquitetura, login, integração com WhatsApp e deploy |

Turma: ____

## Situação

| Sprint | Data | Situação |
| --- | --- | --- |
| 1 · Análise e planejamento | 22/10 | Entregue: [docs/analise/sprint-1.md](docs/analise/sprint-1.md) |
| 2 · Negócio e base técnica | 27/10 | Em andamento |
| 3 · Funcionalidades | 05/11 e 11/11 | A fazer |
| 4 · Entrega final | 24/11 e 26/11 | A fazer |

O que cada um faz em cada sprint: [docs/backlog.md](docs/backlog.md). Roteiro de cada apresentação: [docs/cronograma.md](docs/cronograma.md).

## Tecnologias

- PHP 8.2 ou mais novo, com as extensões `intl`, `mbstring`, `mysqlnd` e `fileinfo`
- CodeIgniter 4 (instalado pelo Composer)
- MySQL 8 ou MariaDB 10.6+
- CSS próprio na ficha pública (visual "papel de decalque") e Bootstrap 5 no painel
- n8n e WhatsApp Cloud API para o aviso ao tatuador

## Instalação

> A base do CodeIgniter 4 entra na Sprint 2. Os passos abaixo valem a partir dela.

```bash
git clone https://github.com/nikolasrobert/russo-painel-ci4.git
cd russo-painel-ci4
composer install
cp env .env
```

No `.env`, ajuste:

```ini
CI_ENVIRONMENT = development
app.baseURL = 'http://localhost:8080/'

database.default.hostname = localhost
database.default.database = russo_painel
database.default.username = root
database.default.password =
database.default.DBDriver = MySQLi

# senha do usuário do painel criado pelo seeder
PAINEL_SENHA_INICIAL = troque-esta-senha

# opcional: aviso no WhatsApp (Sprint 3)
N8N_WEBHOOK_URL =
```

O `.env` nunca vai para o Git.

## Como criar o banco

```sql
CREATE DATABASE russo_painel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
php spark migrate
php spark db:seed DatabaseSeeder
```

As tabelas e os campos estão descritos em [docs/modelo-de-dados.md](docs/modelo-de-dados.md).

## Como rodar

```bash
php spark serve
```

- Ficha pública: http://localhost:8080/
- Painel: http://localhost:8080/painel (login `russo@exemplo.com` com a senha de `PAINEL_SENHA_INICIAL`)

## Estrutura

```
app/                 código do CodeIgniter 4 (Controllers, Models, Views, Database)
docs/analise/        documento de análise de cada sprint
docs/                modelo de dados, backlog e cronograma
referencia/          a versão que já está no ar: ficha, regras de pontuação e campos
integracoes/n8n/     fluxo do n8n que manda o aviso no WhatsApp
integracoes/whatsapp/ modelos de mensagem do WhatsApp
```

## Como contribuir

1. Crie uma branch por tarefa: `git checkout -b feat/crud-clientes`.
2. Faça commits pequenos, em português: `feat(clientes): listagem com busca`.
3. Abra um pull request e peça revisão de outra pessoa do grupo.

O barema avalia commits de todos os integrantes ao longo das sprints, então cada um faz commit da própria frente.
