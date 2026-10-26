# Integrações

O n8n é o controller de integração: recebe a ficha da função do Netlify, pontua, cria o card no Trello e avisa no WhatsApp. Também escuta o Trello para manter o status da ficha em dia no banco.

## Fluxos

| Fluxo | Gatilho | O que faz |
| --- | --- | --- |
| Ficha nova | `POST /webhook/russo-tattoer`, chamado pela função | Pontua, grava a pontuação no Supabase, cria o card no Trello e avisa no WhatsApp se a ficha for quente |
| Card movido | Webhook do Trello (`POST /webhook/trello`) | Atualiza `status` da ficha; card arquivado vira `arquivado` |
| Resumo diário | Todo dia às 9h | Busca as fichas pendentes no Supabase e manda o resumo no WhatsApp |

## Formato que a função manda para o n8n

O formato é o que o fluxo já entende:

```json
{
  "eventType": "FORM_RESPONSE",
  "data": {
    "responseId": "uuid-da-ficha",
    "createdAt": "2026-11-11T14:00:00Z",
    "fields": [
      { "label": "Como te chamo?", "value": "Ana" },
      { "label": "Quanto você tem pra investir nesse projeto?", "value": "R$ 1.000 a 2.000" }
    ]
  }
}
```

Os `label` são os títulos das perguntas da ficha. A lista completa está em [n8n/code/normaliza.js](../n8n/code/normaliza.js).

## Trello

- Um workspace por cliente nosso, com um quadro por tatuador.
- Colunas: Novas, Em conversa, Orçamento enviado, Agendado, Fechado, Perdido.
- Etiquetas: QUENTE, MORNA e FRIA, sempre com a pontuação no texto, não só a cor.
- O n8n usa os nodes nativos "Trello" (criar card) e "Trello Trigger" (card movido). A credencial fica no n8n.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `n8n/workflow.json` | Fluxo atual (ainda com o Notion; a troca para Trello e Supabase é da Sprint 3) |
| `n8n/code/*.js` | Código dos nodes de código, em arquivos separados para revisão (`npm run sync` copia para o workflow) |
| `whatsapp/templates.md` | Modelos de mensagem do WhatsApp para aprovar na Meta |
