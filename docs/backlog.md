# Backlog por sprint

Cada um faz commit da própria frente, em branch separada, ao longo das sprints. Marque `[x]` quando terminar.

## Sprint 2 · até 27/10 · Negócio e base técnica

- [x] Caio Sperandio: concorrentes, diferencial, riscos, custos e planos ([sprint-2.md](analise/sprint-2.md))
- [x] Nikolas Robert: arquitetura, MVC, rotas e protótipo das telas
- [x] Elson Ramos: esquema do banco e dados de exemplo ([supabase/](../supabase/))
- [ ] Todos: clonar o repositório, rodar `npm install` e `npm test`, e fazer um primeiro commit

## Sprint 3, parte 1 · até 05/11 · Itens Must

**Elson Ramos: banco no ar**

- [x] Criar o projeto no Supabase e rodar a migration e o seed
- [x] Bucket `fichas` privado no Storage
- [x] Documentar como conectar ao banco ([deploy.md](deploy.md))

**Nikolas Robert: função da ficha gravando no Supabase**

- [x] `netlify/lib/supabase.mjs` com o acesso ao Supabase (chave de serviço só no servidor)
- [x] `ficha.mjs` salvando cliente, ficha e fotos no Supabase no lugar do Netlify Blobs
- [x] Validação no servidor com mensagens em português
- [x] `arquivo.mjs` devolvendo URL assinada do Storage

**Álvaro de Vargas: quadro no Trello**

- [x] Quadro modelo com as colunas Novas, Em conversa, Orçamento enviado, Agendado, Fechado e Perdido (`npm run trello:quadro`)
- [x] Card criado com etiqueta de temperatura, no lugar do card do Notion (pela função, não pelo n8n: dá para testar)
- [x] Guardar o `trello_card_id` na ficha

**Matheus de Oliveira Fragoso: ficha**

- [x] Ajustar o envio da ficha para os campos do banco
- [ ] Testar a ficha em pelo menos três celulares diferentes ([tarefa do Matheus](tarefas-integrantes.md))

**Caio Sperandio: documento**

- [x] Juntar as Sprints 1 e 2 no PDF de análise (revisão: [tarefa do Caio](tarefas-integrantes.md))

## Sprint 3, parte 2 · até 11/11 · Itens Should

**Álvaro de Vargas: sincronização**

- [x] Webhook do Trello (`/api/trello`): card movido atualiza o `status`; card arquivado marca `arquivado`

**Elson Ramos: pontuação**

- [x] Pontuação gravada na ficha, com os motivos, seguindo [referencia/pontuacao.md](../referencia/pontuacao.md)

**Arthur de França: sessões e resumo**

- [x] Card na coluna Agendado cria a sessão no banco (data do card)
- [x] Resumo diário das 9h lendo o Supabase no lugar do Notion

**Nikolas Robert: WhatsApp**

- [x] Aviso da ficha quente com link para o card do Trello

**Matheus de Oliveira Fragoso: interface**

- [ ] Revisar contraste, tamanho de toque e textos de erro da ficha

## Sprint 4 · 24 e 26/11 · Entrega final

- [ ] Nikolas: ficha nova no ar ([deploy.md](deploy.md))
- [x] Caio: documento de análise em PDF (revisar e subir)
- [ ] Todos: ensaio cronometrado com os slides, cada um explica a própria frente
- [ ] Todos: um commit da própria parte ([tarefas-integrantes.md](tarefas-integrantes.md))
