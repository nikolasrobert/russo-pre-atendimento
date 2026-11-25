# Tarefa de cada integrante para a entrega final

Cada um faz **um commit da própria parte**, numa branch própria, e abre um pull request. São tarefas pequenas e reais: cada uma testa ou documenta a frente que a pessoa apresenta no dia 26.

## Antes de começar (uma vez só)

1. Aceite o convite do repositório no GitHub (chega por e-mail).
2. No terminal:

```bash
git clone https://github.com/nikolasrobert/russo-pre-atendimento.git
cd russo-pre-atendimento
git config user.name "Seu Nome"
git config user.email "seu-email-do-github"
npm test        # tem que terminar com "fail 0"
```

3. Para cada tarefa:

```bash
git checkout -b <nome-da-branch>
# faça a tarefa
git add <arquivos>
git commit -m "<mensagem>"
git push -u origin <nome-da-branch>
```

Depois abra o pull request no GitHub e peça para outra pessoa do grupo aprovar.

Quem não tem Git instalado pode fazer pelo site: no GitHub, abra o arquivo → lápis (Edit) → "Create a new branch" → Propose changes.

## As tarefas

### Elson Ramos · banco

- **Branch:** `docs/banco-consultas`
- **O quê:** entrar no Supabase (convite do Nikolas), rodar no SQL Editor as 3 consultas abaixo e colar o resultado de cada uma em `docs/banco-consultas.md`, com uma frase explicando o que ela mostra.

```sql
-- 1. fichas por temperatura
select temperatura, count(*) from fichas group by 1 order by 2 desc;
-- 2. a regra de acesso: o que cada estúdio enxerga
select e.nome, count(f.id) from estudios e left join fichas f on f.estudio_id = e.id group by 1;
-- 3. sessões marcadas com o nome do cliente
select c.nome, s.inicio, s.duracao_horas from sessoes s join fichas f on f.id = s.ficha_id join clientes c on c.id = f.cliente_id where s.status = 'marcada';
```

- **Commit:** `docs(banco): consultas de demonstração no Supabase`

### Álvaro de Vargas · Trello

- **Branch:** `docs/quadro-trello`
- **O quê:** com o quadro criado pelo Nikolas, mover um card por todas as colunas e conferir no painel que o status mudou em cada uma. Registrar em `docs/quadro-trello.md` uma tabela "coluna → status que apareceu no painel" e um print do quadro (salvo em `docs/img/quadro.png`).
- **Commit:** `docs(trello): teste das colunas e do status no painel`

### Arthur de França · sessões

- **Branch:** `test/sessao-sem-data`
- **O quê:** em `tests/trello.test.js` existe o teste "Agendado sem data". Acrescentar um teste novo: **card movido para "Fechado" não cancela a sessão marcada** (só "Perdido" e arquivar cancelam). Rodar `npm test` e ver passar.
- **Dica:** copie o teste "Perdido e card arquivado cancelam a sessão marcada" e troque a coluna para `Fechado`; confira que não houve PATCH em `/sessoes`.
- **Commit:** `test(sessoes): fechar o card não cancela a sessão`

### Matheus de Oliveira Fragoso · ficha no celular

- **Branch:** `docs/testes-celular`
- **O quê:** preencher a ficha publicada em 3 celulares diferentes e registrar em `docs/testes-celular.md`: aparelho, sistema, navegador, se a foto subiu, se o card chegou e qualquer problema de layout.
- **Commit:** `docs(teste): ficha testada em 3 celulares`

### Caio Sperandio · documento de análise

- **Branch:** `docs/analise-pdf`
- **O quê:** revisar o PDF `docs/analise/Analise-Sprints-1-e-2.pdf` (números de preço, concorrentes, persona). Se achar erro, corrigir em `docs/analise/sprint-1.md` ou `sprint-2.md`. Subir o PDF final em `docs/analise/`.
- **Commit:** `docs(analise): documento de análise revisado`

### Nikolas Robert · deploy

- **Branch:** `main` (já tem os commits do código)
- **O quê:** push do repositório, deploy no Netlify, quadro e webhook do Trello, n8n ([deploy.md](deploy.md)). Depois, revisar e aprovar os pull requests do grupo.

## Prazo

Tudo aprovado até a manhã do dia 26, para o histórico do GitHub mostrar o commit de cada um na apresentação.
