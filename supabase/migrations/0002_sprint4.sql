-- Sprint 4 · ficha gravando no banco, card no Trello e sessões criadas pelo quadro.

-- link do card no Trello, para o aviso do WhatsApp e o painel abrirem direto
alter table fichas add column trello_card_url text;

-- respostas da ficha que não têm coluna própria (idade da tattoo coberta, vídeo do local...)
alter table fichas add column extras jsonb not null default '{}'::jsonb;

-- de onde a ficha veio: o site público ou o cadastro à mão no painel
alter table fichas add column canal text not null default 'site' check (canal in ('site', 'painel'));

-- uma ficha tem no máximo uma sessão marcada por vez:
-- mover o card de novo para "Agendado" atualiza a mesma sessão em vez de duplicar
create unique index sessoes_uma_marcada_por_ficha on sessoes (ficha_id) where status = 'marcada';

-- funções com search_path fixo (recomendação do Supabase)
alter function marcar_atualizacao() set search_path = public;

-- meu_estudio() só faz sentido para quem está logado
revoke execute on function meu_estudio() from public, anon;
grant execute on function meu_estudio() to authenticated;
