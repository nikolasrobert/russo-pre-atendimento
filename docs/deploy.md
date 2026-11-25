# Como colocar no ar

Ordem: banco → GitHub → Netlify → Trello → n8n → teste. Cada login e cada chave é feito por quem é dono da conta; nenhuma chave vai para o Git, para o chat ou para o slide.

## 1. Banco no Supabase (feito)

Projeto **russo-pre-atendimento**, região São Paulo: `https://ydaiuvqtcmjvqzuiuwyl.supabase.co`.

- Migrations aplicadas: `0001_schema.sql` (6 tabelas, RLS, bucket `fichas` privado) e `0002_sprint4.sql` (link do card, extras, canal e uma sessão marcada por ficha).
- Seed aplicado: 1 estúdio, 1 tatuador, 3 clientes, 3 fichas, 2 fotos e 1 sessão (tudo fictício).
- Testado no banco real: ficha completa gravada, trigger de `atualizado_em`, bloqueio de sessão duplicada, `anon` sem acesso e um segundo estúdio sem ver as fichas do primeiro.

Falta só **pegar a chave de serviço**: Supabase → Project Settings → API Keys → `secret` (ou, em Legacy API Keys, a `service_role`). Ela vai direto no Netlify como `SUPABASE_SERVICE_ROLE_KEY`.

Para dar acesso ao grupo: Supabase → Organization → Team → Invite (Elson pelo menos, para mostrar as tabelas na apresentação).

## 2. GitHub

```bash
# dentro da pasta do projeto (veio no russo-pre-atendimento.zip, já com o histórico)
git remote add origin https://github.com/nikolasrobert/russo-pre-atendimento.git
git push -u origin main
```

Crie o repositório vazio antes em github.com/new. Depois: Settings → Collaborators → convidar os 5 integrantes (cada um faz o commit da própria tarefa: [tarefas-integrantes.md](tarefas-integrantes.md)).

## 3. Netlify

1. app.netlify.com → Add new project → Import from Git → o repositório. Build: nada a configurar (o `netlify.toml` já diz que o site é a pasta `site/` e as funções estão em `netlify/functions/`).
2. Site configuration → Environment variables, cadastre as variáveis do [.env.example](../.env.example):

| Variável | De onde vem |
| --- | --- |
| `SUPABASE_URL` | já está no `.env.example` |
| `SUPABASE_SERVICE_ROLE_KEY` | passo 1 |
| `ESTUDIO_ID`, `TATUADOR_ID` | já estão no `.env.example` (são os do seed) |
| `PAINEL_EMAIL` | o e-mail que vai entrar no painel |
| `PAINEL_SENHA_HASH` | `npm run senha -- "uma senha forte"` |
| `SESSAO_SEGREDO` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `TRELLO_*` | passo 4 |
| `N8N_WEBHOOK_URL`, `AVISO_TOKEN` | passo 5 |

3. Deploys → Trigger deploy. Abra `https://SEU-SITE.netlify.app` (ficha) e `/painel` (login).

Sem Trello e sem n8n configurados a ficha já funciona: grava no banco e aparece no painel. Os dois são acrescentados depois.

## 4. Trello

1. https://trello.com/power-ups/admin → New → crie uma integração (nome: Pré-atendimento) → **Chave de API**. Na mesma página: gere o **Token** (link "Token") e copie o **Segredo**.
2. No terminal, na pasta do projeto:

```bash
TRELLO_CHAVE=... TRELLO_TOKEN=... npm run trello:quadro -- "Atendimento · Russo"
```

Ele cria o quadro com as colunas Novas, Em conversa, Orçamento enviado, Agendado, Fechado e Perdido e as etiquetas QUENTE, MORNA e FRIA, e imprime as variáveis `TRELLO_QUADRO_ID`, `TRELLO_QUADRO_URL`, `TRELLO_LISTA_NOVAS` e `TRELLO_ETIQUETA_*`.

3. Cadastre no Netlify: essas variáveis, mais `TRELLO_CHAVE`, `TRELLO_TOKEN`, `TRELLO_SEGREDO` e `TRELLO_CALLBACK_URL=https://SEU-SITE.netlify.app/api/trello`. Faça um novo deploy.
4. Com o site no ar, cadastre o webhook:

```bash
TRELLO_CHAVE=... TRELLO_TOKEN=... npm run trello:webhook -- <TRELLO_QUADRO_ID> https://SEU-SITE.netlify.app/api/trello
```

5. Convide o grupo para o quadro (Álvaro e Arthur movem os cards na apresentação).

## 5. n8n e WhatsApp

1. No n8n: Workflows → Import from file → [n8n/workflow.json](../n8n/workflow.json).
2. Credencial **Header Auth** do node "Aviso da função": nome `x-aviso-token`, valor = um texto aleatório. O mesmo texto vai no Netlify como `AVISO_TOKEN`.
3. Credencial **Header Auth** do node "Mandar no WhatsApp": nome `Authorization`, valor `Bearer <token do WhatsApp>`.
4. Variáveis do n8n (ou o bloco `CFG` no node "Montar mensagem"): `WA_PHONE_NUMBER_ID`, `WA_PARA` (o WhatsApp que recebe), `WA_MODO=texto` e `WA_AVISAR_TODAS=sim` para a demonstração.
5. Ative o workflow e copie a URL de produção do webhook para o Netlify como `N8N_WEBHOOK_URL`.

Número de teste da Meta: em developers.facebook.com → seu app → WhatsApp → API Setup. O número que vai receber precisa estar na lista de destinatários e mandar um "oi" para o número de teste antes da apresentação (abre a janela de 24h para o texto livre).

## 6. Teste de ponta a ponta

1. Preencha a ficha no celular com uma foto.
2. Em segundos: card em **Novas** no Trello, ficha no `/painel`, aviso no WhatsApp.
3. Coloque uma data no card e mova para **Agendado**: a sessão aparece no detalhe da ficha no painel.
4. Mova para **Perdido**: a sessão vira cancelada.

Se algo falhar: Netlify → Logs → Functions (`ficha`, `trello`, `resumo`). Toda falha de Trello ou de aviso fica registrada ali sem perder a ficha.
