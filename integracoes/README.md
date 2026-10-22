# Integrações

O aviso no WhatsApp continua no n8n, como na versão que está no ar. O CodeIgniter 4 só precisa avisar o n8n depois de salvar uma ficha.

## Como o CI4 chama o n8n (Sprint 3, parte 2)

1. Depois de salvar a ficha, o controller chama uma classe `app/Libraries/AvisoN8n.php`.
2. Ela faz um `POST` para a URL do `.env` (`N8N_WEBHOOK_URL`) usando o `CURLRequest` do CodeIgniter.
3. O corpo segue o formato que o fluxo já entende:

```json
{
  "eventType": "FORM_RESPONSE",
  "data": {
    "responseId": "123",
    "createdAt": "2026-11-11T14:00:00Z",
    "fields": [
      { "label": "Como te chamo?", "value": "Ana" },
      { "label": "Quanto você tem pra investir nesse projeto?", "value": "R$ 1.000 a 2.000" }
    ]
  }
}
```

Os `label` são os mesmos títulos das perguntas da ficha. A lista completa está em `n8n/code/normaliza.js`.

4. Se o n8n estiver fora do ar, a ficha continua salva; o erro só vai para o log (`log_message('error', ...)`).

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `n8n/workflow.json` | Fluxo para importar no n8n: recebe a ficha, pontua e avisa no WhatsApp; resumo diário às 9h |
| `n8n/code/*.js` | Código dos nodes de código do fluxo, em arquivos separados para revisão |
| `whatsapp/templates.md` | Modelos de mensagem do WhatsApp para aprovar na Meta |

Na versão em CI4, o card do Notion deixa de ser necessário: o painel substitui o Notion. O node "Criar card no Notion" pode ser desligado no n8n.
