# Sprint 2 · Negócio e base técnica

Apresentação: 27/10/2026, por Caio Sperandio (negócio) e Nikolas Robert (técnica). Este documento entra no PDF de análise do fim do trabalho.

## 1. Ajustes pedidos na Sprint 1

| Ponto | Antes | Agora |
| --- | --- | --- |
| Persona | O próprio Russo | O tatuador que não quer ser atendente. O Russo é o nosso cliente |
| Público-alvo | Tatuadores autônomos | Tatuadores sem ninguém no atendimento, ou com um atendimento que não funciona |
| Base técnica | CodeIgniter 4 | A stack que já está no ar: Netlify + n8n |
| Banco | MySQL | Supabase (Postgres na nuvem, com as fotos) |
| Painel | Notion | Trello, alimentado pelo n8n |

A persona e o público revisados estão em [sprint-1.md](sprint-1.md).

## 2. Viabilidade

### Concorrentes

Consultados nos sites oficiais em 26/10/2026.

| Produto | Preço por mês | O que faz | O que falta |
| --- | --- | --- | --- |
| [InkAgenda](https://www.inkagenda.app/) | R$ 29,90 a 99,90 | Agenda, caixa, lembretes no WhatsApp | Orçamento online |
| [Inker](https://inker.me/blog/inker-app-como-funciona) | R$ 49,90 | Formulário de orçamento, CRM, modelos de mensagem | O tatuador monta tudo sozinho |
| [TattFlow](https://www.tattflow.com.br/) | R$ 49,90 (promoção de lançamento) | Link de orçamento, agenda, CRM, financeiro | Mais um sistema para aprender |
| [Tattoo Studio](https://tattoostudio.com.br/) | R$ 149,90 + R$ 49,90 do WhatsApp automático | Gestão de estúdio com até 5 tatuadores | Pesado para quem trabalha sozinho |
| [Inkcloser](https://inkcloser.app/) | R$ 120 a 240 | Assistente de IA que responde no WhatsApp | Um robô fala pelo tatuador |
| DM manual | R$ 0 | Nada | É o problema |

### Diferencial

- **Implantação feita por nós:** a ficha é escrita do jeito que o tatuador fala, e o quadro fica pronto no primeiro dia.
- **Nada novo para aprender:** usa Instagram, WhatsApp e Trello, que tem app de celular e plano grátis.
- **Prioriza quem vai fechar:** cada ficha chega pontuada como quente, morna ou fria.
- **Não é robô:** quem responde continua sendo o tatuador; o sistema só organiza.
- **Já tem um cliente real usando:** o Russo.

### Modelo de receita

Implantação, cobrada uma vez, mais uma mensalidade. Vendemos por tatuador ou para o estúdio inteiro.

### Riscos

| Risco | Como respondemos |
| --- | --- |
| Concorrentes a R$ 49,90 | Vender serviço pronto, não software |
| A Meta mudou a cobrança do WhatsApp em outubro de 2026 | Aviso na hora só para ficha quente; o resto vai no resumo diário |
| O tatuador desconfia de automação | A ficha fala como ele, e quem responde é ele |
| O Supabase grátis pausa após 7 dias sem uso ([fonte](https://automationatlas.io/answers/supabase-free-tier-limits-2026/)) | Plano Pro (US$ 25/mês) quando tiver clientes pagando |

### Conclusão

O produto é viável:

- o custo por cliente é baixo, porque o começo usa planos gratuitos;
- a margem cobre os custos fixos com 4 clientes;
- já existe um cliente real validando o produto.

## 3. Estimativa de preço

### Custos

| Item | Custo | Como chegamos |
| --- | --- | --- |
| Desenvolvimento | R$ 7.200, uma vez | 120 h × R$ 60/h (premissa do grupo) |
| Ficha (Netlify) | R$ 0 | Plano grátis |
| Banco e fotos (Supabase) | R$ 0 no começo; US$ 25/mês (~R$ 140) com clientes | Grátis até 500 MB |
| Automação (n8n) | R$ 50/mês | Servidor próprio (premissa) |
| Painel (Trello) | R$ 0 | [Plano grátis](https://costbench.com/software/project-management/trello/free-plan/): cartões ilimitados, 10 quadros por workspace |
| WhatsApp | ~R$ 5/mês por cliente | ~150 avisos × R$ 0,035 ([InkAgenda](https://www.inkagenda.app/)) |
| Domínio .com.br | R$ 40/ano | [Registro.br](https://guiaferramentasdigitais.com.br/guias/como-registrar-dominio-brasil/) |
| Suporte e ajustes | R$ 30/mês por tatuador | 30 min × R$ 60/h |

Os custos fixos somam ~R$ 190/mês (n8n e Supabase Pro, com câmbio de R$ 5,60 por dólar). O custo variável é de ~R$ 35/mês por tatuador.

### Planos

| Plano | Implantação | Mensalidade | Margem por mês |
| --- | --- | --- | --- |
| Tatuador | R$ 497 | R$ 97 | ~R$ 62 |
| Estúdio, até 5 tatuadores | R$ 1.497 | R$ 297 (+ R$ 39 por tatuador extra) | ~R$ 212 |

**Por que esse preço:**

- Fica entre os sistemas de R$ 49,90, em que o tatuador monta tudo sozinho, e a IA de R$ 120 a 240.
- Contratar uma recepcionista custaria pelo menos o [salário mínimo de 2026](https://www.band.com.br/band-vale/noticias/salario-minimo-sobe-para-r-1621-a-partir-de-janeiro-de-2026-202512250915), R$ 1.621, sem encargos.

**Ponto de equilíbrio:**

- 4 tatuadores cobrem os R$ 190 fixos.
- 10 clientes (8 tatuadores e 2 estúdios) somam R$ 6.970 em implantações, perto dos R$ 7.200 do desenvolvimento.

## 4. Modelagem do banco

Seis tabelas no Supabase: `estudios`, `tatuadores`, `clientes`, `fichas`, `fotos` e `sessoes`. Detalhes em [modelo-de-dados.md](../modelo-de-dados.md). O SQL está em [supabase/migrations/0001_schema.sql](../../supabase/migrations/0001_schema.sql).

## 5. Estrutura MVC

| Camada | O que é | Arquivos |
| --- | --- | --- |
| Model | Os dados e as regras: tabelas, chaves, checagens e permissões | `supabase/migrations/`, `supabase/seed.sql` |
| View | O que cada pessoa vê: a ficha no celular do cliente, o quadro e o aviso do tatuador | `site/index.html`, quadro no Trello, modelos em `whatsapp/` |
| Controller | Recebe o pedido, valida, chama o Model e responde | `netlify/functions/ficha.mjs`, `netlify/functions/arquivo.mjs`, `n8n/workflow.json` |

A ficha nunca fala direto com o banco. Tudo passa pela função, que valida os dados e mantém a chave do Supabase fora do navegador.

## 6. Rotas

| Método | Rota | Onde | O que faz |
| --- | --- | --- | --- |
| GET | `/` | Netlify | Abre a ficha |
| POST | `/api/ficha` | Função | Valida, salva no Supabase e chama o n8n |
| GET | `/arquivo/:ficha/:foto` | Função | Link temporário da foto |
| POST | `/webhook/russo-tattoer` | n8n | Pontua, cria o card no Trello e avisa no WhatsApp |
| POST | `/webhook/trello` | n8n | Card movido: atualiza o status no banco |
| CRON | todo dia às 9h | n8n | Resumo das fichas pendentes no WhatsApp |

## 7. Protótipo das telas

- **Ficha do cliente:** é a que está no ar (`site/index.html`, https://ficha-russo.netlify.app). Tem uma pergunta por tela, quase todas de toque, e as fotos são comprimidas no próprio celular.
- **Quadro do tatuador no Trello:** colunas Novas, Em conversa, Orçamento enviado, Agendado e Fechado. Cada card leva a etiqueta de temperatura com a pontuação.
- **Aviso no WhatsApp:** mostra temperatura, nome, local, tamanho, faixa e um link para o card.

## 8. Próxima sprint (05/11 e 11/11)

- Função `/api/ficha` gravando no Supabase (hoje grava no Netlify Blobs).
- n8n criando o card no Trello no lugar do Notion, e o webhook do Trello atualizando o status.
- Agenda de sessões e resumo diário lendo o banco.
- Teste real com o nosso cliente.
