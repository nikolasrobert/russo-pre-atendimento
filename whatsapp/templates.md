# Modelos de mensagem (WhatsApp Cloud API)

Cadastrar no Gerenciador do WhatsApp → Modelos. Categoria **Utilidade**, idioma **Português (BR)**. A Meta pede um exemplo para cada variável.

Quem monta os parâmetros é o código (`netlify/lib/avisos.mjs` e `netlify/lib/resumo.mjs`), já seguindo as regras da Meta: variável sem quebra de linha, sem tab e sem 4 espaços seguidos, e o texto não começa nem termina numa variável. O n8n só envia.

Na demonstração, com o número de teste da Meta, use `WA_MODO=texto` no n8n: vai a mensagem em texto livre e não precisa de modelo aprovado (vale dentro da janela de 24h depois de o tatuador mandar um "oi" para o número de teste).

## `ficha_quente`

```
🔥 Ficha quente: {{1}}

Ideia: {{2}}
Detalhes: {{3}}

A nota e os motivos estão no card.
```

Botão de link "Abrir card", URL dinâmica `https://trello.com/c/{{1}}` (o código manda o link curto do card).

Exemplo do que aparece na tela bloqueada: `🔥 Ficha quente: Marcos · R$2.000 a 4.000 · 30 dias · Coxa`

## `resumo_diario`

```
Bom dia. Fichas esperando resposta: {{1}}

{{2}}

Sessões hoje: {{3}}
Orçados pra cutucar: {{4}}

Tudo no quadro do Trello.
```

Botão de link "Abrir quadro", URL dinâmica `https://trello.com/b/{{1}}`. Só sai se tiver alguma pendência.

## Custo

Desde 1º/out/2026 a Meta cobra todo modelo de Utilidade no Brasil: cerca de R$ 0,035 (US$ 0,0068) por mensagem. Com 30 avisos e 30 resumos por mês, uns R$ 2. Se a Meta reclassificar como Marketing, sobe para ~R$ 0,32 cada; por isso os textos são secos.
