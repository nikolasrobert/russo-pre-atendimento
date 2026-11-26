# Consultas de demonstração no Supabase
Projeto: russo-pre-atendimento · Responsável: Elson Ramos
## 1. Fichas por temperatura
```sql
select temperatura, count(*) from fichas group by 1 order by 2 desc;
```
Resultado:
(cole aqui a tabela que apareceu)
O que mostra: quantas fichas chegaram quentes, mornas e frias.
## 2. O que cada estúdio enxerga (regra de acesso)
```sql
select e.nome, count(f.id) from estudios e left join fichas f on f.estudio_id = e.id
group by 1;
```
Resultado:
(cole aqui a tabela que apareceu)
O que mostra: cada estúdio só tem as próprias fichas; um estúdio não vê as fichas do
outro.
## 3. Sessões marcadas com o nome do cliente
```sql
select c.nome, s.inicio, s.duracao_horas from sessoes s join fichas f on f.id =
s.ficha_id join clientes c on c.id = f.cliente_id where s.status = 'marcada';
```
Resultado:
(cole aqui a tabela que apareceu)
O que mostra: as tatuagens já agendadas, com data e duração.
