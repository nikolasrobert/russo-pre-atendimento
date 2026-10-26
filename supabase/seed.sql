-- Dados de exemplo (fictícios) para testar o banco e o quadro.

insert into estudios (id, nome, cidade, plano) values
  ('00000000-0000-0000-0000-000000000001', 'Estúdio Exemplo', 'Vila Velha', 'tatuador');

insert into tatuadores (id, estudio_id, nome, whatsapp) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Tatuador Exemplo', '5527900000000');

insert into clientes (id, estudio_id, nome, instagram, whatsapp, cidade, regiao) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'Ana Exemplo',   'ana.exemplo',   '27900000001', 'Vitória',          'grande_vitoria'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'Bruno Exemplo', 'bruno.exemplo', '27900000002', 'Serra',            'grande_vitoria'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'Carla Exemplo', 'carla.exemplo', '31900000003', 'Belo Horizonte',   'fora');

insert into fichas (id, estudio_id, tatuador_id, cliente_id, experiencia, ideia, local_corpo, tamanho, cor,
                    faixa_investimento, prazo, data_limite, disponibilidade, origem, indicado_por, pontuacao, temperatura, status) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201',
   'Você já me tatuou', 'Uma serpente em ornamental subindo pelo antebraço, fechando no punho.', 'Antebraço (interno)', '10 a 15 cm', 'Preto e cinza',
   'R$ 2.000 a 4.000', 'Tenho data marcada', current_date + 20, '{Sábado}', 'Indicação', 'Carla', 12, 'quente', 'novo'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202',
   'É a primeira', 'Quero algo na costela.', 'Costela', 'Fechamento (braço · perna · costas)', 'Confio em você',
   'Até R$ 500', 'Sem pressa · quero fazer bem feito', null, '{Sou flexível}', 'Instagram', null, -3, 'fria', 'novo'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203',
   'Tenho uma ou duas', 'Lettering com o nome da minha avó na lateral da mão, letra fina.', 'Mão', 'Até 5 cm', 'Preto e cinza',
   'R$ 1.000 a 2.000', 'Nos próximos 30 dias', null, '{Tarde de semana}', 'Instagram', null, 5, 'morna', 'em_conversa');

-- Ana e Carla mandaram foto do local (+2 na pontuação de cada uma)
insert into fotos (ficha_id, caminho, tipo) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000301/local-1.jpg', 'local'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000303/local-1.jpg', 'local');

insert into sessoes (ficha_id, inicio, duracao_horas, valor_sinal) values
  ('00000000-0000-0000-0000-000000000301', now() + interval '20 days', 4, 300);
