# Backlog por sprint

Cada um faz commit da própria frente, em branch separada, ao longo das sprints. Marque `[x]` quando terminar.

## Sprint 2 · até 27/10 · Negócio e base técnica

- [x] Caio Sperandio: concorrentes, diferencial, riscos, custos e planos ([sprint-2.md](analise/sprint-2.md))
- [x] Nikolas Robert: arquitetura, MVC, rotas e protótipo das telas
- [x] Elson Ramos: esquema do banco e dados de exemplo ([supabase/](../supabase/))
- [ ] Todos: clonar o repositório, rodar `npm install` e `npm test`, e fazer um primeiro commit

## Sprint 3, parte 1 · até 05/11 · Itens Must

**Elson Ramos: banco no ar**

- [ ] Criar o projeto no Supabase e rodar a migration e o seed
- [ ] Bucket `fichas` privado no Storage
- [ ] Documentar no README como cada um conecta ao banco de teste

**Nikolas Robert: função da ficha gravando no Supabase**

- [ ] `netlify/functions/lib/db.mjs` com o acesso ao Supabase (chave de serviço só no servidor)
- [ ] `ficha.mjs` salvando cliente, ficha e fotos no Supabase no lugar do Netlify Blobs
- [ ] Validação no servidor com mensagens em português
- [ ] `arquivo.mjs` devolvendo URL assinada do Storage

**Álvaro de Vargas: quadro no Trello**

- [ ] Quadro modelo com as colunas Novas, Em conversa, Orçamento enviado, Agendado e Fechado
- [ ] n8n criando o card com etiqueta de temperatura, no lugar do card do Notion
- [ ] Guardar o `trello_card_id` na ficha

**Matheus de Oliveira Fragoso: ficha**

- [ ] Ajustar o envio da ficha para os campos do banco
- [ ] Testar a ficha em pelo menos três celulares diferentes

**Caio Sperandio: documento**

- [ ] Juntar as Sprints 1 e 2 no PDF de análise

## Sprint 3, parte 2 · até 11/11 · Itens Should

**Álvaro de Vargas: sincronização**

- [ ] Webhook do Trello no n8n: card movido atualiza o `status`; card arquivado marca `arquivado`

**Elson Ramos: pontuação**

- [ ] Pontuação gravada na ficha, com os motivos, seguindo [referencia/pontuacao.md](../referencia/pontuacao.md)

**Arthur de França: sessões e resumo**

- [ ] Card na coluna Agendado cria a sessão no banco (data do card)
- [ ] Resumo diário das 9h lendo o Supabase no lugar do Notion

**Nikolas Robert: WhatsApp**

- [ ] Aviso da ficha quente com link para o card do Trello

**Matheus de Oliveira Fragoso: interface**

- [ ] Revisar contraste, tamanho de toque e textos de erro da ficha

## Sprint 4 · 24 e 26/11 · Entrega final

- [ ] Nikolas: ficha nova no ar, com domínio próprio se der tempo
- [ ] Caio: documento de análise em PDF
- [ ] Todos: slides do pitch, ensaio cronometrado, cada um explica a própria frente
