# Regras de pontuação

Regra usada na versão que está no ar (`integracoes/n8n/code/normaliza.js`). No CodeIgniter 4 ela vira a classe `app/Libraries/Pontuacao.php`, com teste em `tests/unit/PontuacaoTest.php`.

| Condição | Pontos | Motivo |
| --- | --- | --- |
| Experiência = "Você já me tatuou" | +3 | já é cliente |
| Origem = Indicação | +2 | veio por indicação |
| Mandou foto de referência ou link | +2 | mandou referência |
| Mandou foto do local | +2 | mandou foto do local |
| Faixa "R$ 2.000 a 4.000" ou "Acima de R$ 4.000" | +3 | faixa alta |
| Faixa "R$ 1.000 a 2.000" | +2 | faixa média |
| Faixa "R$ 500 a 1.000" | +1 | faixa inicial |
| Prazo = "Tenho data marcada" | +2 | tem data marcada |
| Prazo = "Nos próximos 30 dias" | +1 | quer nos próximos 30 dias |
| Ideia com mais de 120 caracteres | +1 | descreveu bem a ideia |
| Ideia com menos de 40 caracteres | −1 | ideia vaga |
| Cobertura sem foto da tattoo atual | −2 | cobertura sem foto |
| Faixa "Até R$ 500" com tamanho 15 a 25 cm, mais de 25 cm ou fechamento | −2 | orçamento incompatível com o tamanho |

**Temperatura:** 8 pontos ou mais = quente · de 4 a 7 = morna · até 3 = fria.

Cuidado ao comparar faixas por texto: "R$ 1.000 a 2.000" contém "2.000" e não pode cair na faixa alta. Compare pelo começo da faixa.

Atenção: na versão no ar, a regra do orçamento incompatível procura "15", "25" ou "fechamento" no tamanho, e por isso também pega "10 a 15 cm". Decidir na Sprint 3 se isso fica ou se corrige.

Casos para o teste (ideia entre 40 e 120 caracteres, quando não dito):

| Entrada | Pontos | Temperatura |
| --- | --- | --- |
| Já é cliente, indicação, foto do local, R$ 2.000 a 4.000 | 10 | quente |
| Primeira tattoo, Instagram, foto do local, R$ 1.000 a 2.000, próximos 30 dias | 5 | morna |
| Primeira tattoo, sem foto do local, ideia de 20 caracteres, até R$ 500, fechamento | −3 | fria |
