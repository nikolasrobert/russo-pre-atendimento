# Integrações

Desde a Sprint 4, a lógica das integrações está em **código testado** (Netlify Functions). O n8n ficou só com o envio do WhatsApp, porque é lá que fica a credencial da Meta.

## Fluxos

| Fluxo | Gatilho | Onde | O que faz |
| --- | --- | --- | --- |
| Ficha nova | `POST /api/ficha` | `netlify/functions/ficha.mjs` | Valida, pontua, grava no Supabase, sobe as fotos, cria o card em "Novas" e pede o aviso |
| Card movido | Webhook do Trello em `/api/trello` | `netlify/functions/trello.mjs` | Atualiza o `status`; "Agendado" com data cria ou remarca a sessão; "Perdido" e arquivar cancelam |
| Resumo diário | Todo dia às 9h de Brasília | `netlify/functions/resumo.mjs` | Lê novas, sessões de hoje e orçados parados há 5 dias e pede o aviso |
| Aviso | `POST /webhook/russo-avisos` | `n8n/workflow.json` | Monta a mensagem e manda pela WhatsApp Cloud API |

## O que a função manda para o n8n

```json
{
  "tipo": "ficha",
  "temperatura": "quente",
  "params": ["Marcos · R$2.000 a 4.000 · 30 dias · Coxa", "Uma cobra enrolada num punhal…", "15 a 25 cm · Preto e cinza · nota 10"],
  "botao": "AbCd1234",
  "texto": "🔥 Ficha quente: … (versão em texto livre, para o número de teste)"
}
```

No resumo, `tipo` é `"resumo"`, `params` são [quantidade, novas, sessões de hoje, orçados parados] e `botao` é o id curto do quadro. O cabeçalho `x-aviso-token` precisa bater com a credencial do n8n.

## Trello

- Um quadro por tatuador, criado com `npm run trello:quadro`.
- Colunas: Novas, Em conversa, Orçamento enviado, Agendado, Fechado, Perdido. O código reconhece a coluna pelo nome (com ou sem acento).
- Etiquetas: QUENTE, MORNA e FRIA, e a temperatura também vai escrita no título do card.
- O webhook é cadastrado com `npm run trello:webhook` e cada chamada é conferida pela assinatura HMAC do Trello (`TRELLO_SEGREDO`).

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `netlify/lib/trello.mjs` | Cliente do Trello, texto do card, colunas e assinatura |
| `netlify/lib/quadro.mjs` | Regras do quadro: status e sessões |
| `netlify/lib/resumo.mjs` | Consulta e texto do resumo |
| `netlify/lib/avisos.mjs` | Texto do aviso e envio para o n8n |
| `n8n/workflow.json` e `n8n/code/mensagem.js` | Fluxo do n8n (`npm run sync` copia o código para o workflow) |
| `whatsapp/templates.md` | Modelos de mensagem para aprovar na Meta |
| `referencia/n8n-notion/` | O fluxo antigo, com o Notion, que roda hoje para o Russo |
