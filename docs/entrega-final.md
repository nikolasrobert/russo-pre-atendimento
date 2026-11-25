# Entrega final · Sprint 4 (26/11)

## O que está pronto

| Item | Onde | Como provar na apresentação |
| --- | --- | --- |
| Ficha pública mobile-first | `site/index.html` | Alguém da turma preenche pelo celular |
| Ficha gravando no banco, com validação no servidor | `netlify/lib/ficha/` | Ficha aparece no painel na hora |
| Fotos em bucket privado, link assinado de 5 min | `netlify/functions/arquivo.mjs` | Abrir a foto pelo card |
| Pontuação quente, morna e fria com motivos | `netlify/lib/painel/pontuacao.mjs` | Etiqueta e motivos no card |
| Card no Trello em "Novas", com etiqueta | `netlify/lib/trello.mjs` | Card aparece no quadro |
| Mover o card atualiza o status | `netlify/functions/trello.mjs` | Mover e atualizar o painel |
| "Agendado" com data cria a sessão; "Perdido" cancela | `netlify/lib/quadro.mjs` | Sessão aparece no detalhe da ficha |
| Resumo diário às 9h | `netlify/functions/resumo.mjs` | Mostrar no log ou no WhatsApp |
| Aviso de ficha quente no WhatsApp | `n8n/workflow.json` | Celular do Nikolas na mão |
| Painel com CRUD, Bootstrap, CSRF e `esc()` | `netlify/lib/painel/` | Login, editar, excluir |
| Banco com RLS, testado no Supabase real | `supabase/migrations/` | Elson mostra as tabelas |
| Testes automatizados | `tests/` | `npm test` |
| Documento de análise em PDF | `docs/analise/` | Entregue ao professor |

## Demonstração (4 min · Matheus e Nikolas)

1. Mostrar o QR code da ficha no slide. Alguém da turma preenche com uma foto qualquer.
2. Nikolas mostra, ao mesmo tempo: card em "Novas" no Trello, a ficha no painel e o aviso no WhatsApp.
3. Álvaro põe a data no card e arrasta para "Agendado". Arthur atualiza o detalhe da ficha no painel: a sessão aparece.

## Plano B (se a internet ou alguma conta falhar)

1. **Sem n8n/WhatsApp:** a ficha e o card continuam funcionando; mostrar o log da função `ficha` com "aviso não saiu".
2. **Sem Trello:** a ficha grava e aparece no painel; mudar o status pelo painel (editar → status).
3. **Sem internet:** rodar local com `PAINEL_DEMO=1 netlify dev` e mostrar o painel com os dados de exemplo; rodar `npm test` ao vivo.
4. **Último recurso:** os vídeos e os prints que estão nos slides.

Ensaiar a demonstração inteira **antes** da aula, com o celular que vai receber o aviso.

## Perguntas prováveis na defesa

| Pergunta | Quem responde | Resposta curta |
| --- | --- | --- |
| Por que não CodeIgniter e MySQL? | Nikolas | O professor aceitou a troca. Netlify Functions faz o papel do controller, o Supabase é Postgres com RLS e Storage, e a ficha real do cliente já rodava nessa base. |
| Onde está o MVC? | Nikolas | Model: `supabase/` e os stores; View: `site/` e `netlify/lib/painel/views/`; Controller: as funções e `app.mjs`. |
| Como evitam SQL injection? | Elson | Não montamos SQL: a API do Supabase recebe filtros já separados e a busca tira os caracteres especiais. O banco tem `check` em cada campo. |
| E XSS? | Matheus | Todo valor passa por `esc()` antes de ir para o HTML e o painel tem CSP sem script inline. |
| E CSRF? | Arthur | Token no cookie e no formulário; POST sem os dois iguais leva 403. |
| Um estúdio vê os dados do outro? | Elson | Não. RLS por `estudio_id`; testamos com um segundo estúdio e ele viu zero fichas. |
| E se o Trello cair? | Álvaro | A ficha é gravada primeiro; o card falha sozinho e fica no log. Nada se perde. |
| Alguém pode forjar o webhook do Trello? | Álvaro | Não: conferimos a assinatura HMAC que o Trello manda em cada chamada. |
| As fotos ficam públicas? | Matheus | Não. Bucket privado; cada abertura gera um link que vale 5 minutos. |
| Quanto custa para rodar? | Caio | No começo, quase nada: Netlify, Supabase e Trello no plano grátis. Com clientes pagando, ~R$ 190/mês fixos (Supabase Pro e n8n) e ~R$ 35/mês por tatuador. |
| Quanto vocês cobrariam? | Caio | R$ 97/mês + R$ 497 de implantação por tatuador; R$ 297/mês + R$ 1.497 por estúdio. |
| E a LGPD? | Caio | A ficha não pede dado de saúde; só o necessário para orçar. Fotos em bucket privado. |
| Como testaram? | Arthur | `npm test`: ficha, validação, Trello, sessões, resumo, n8n e painel, sem rede. E um teste no banco real. |
