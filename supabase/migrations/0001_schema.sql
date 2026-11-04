-- Russo · Pré-atendimento para tatuadores
-- Esquema do banco no Supabase (Postgres).
-- Cada estúdio só enxerga os próprios dados (RLS por estudio_id).
-- As funções do Netlify e o n8n usam a chave de serviço, que ignora o RLS e nunca vai para o navegador.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table estudios (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (char_length(nome) between 2 and 100),
  cidade      text not null,
  plano       text not null default 'tatuador' check (plano in ('tatuador', 'estudio')),
  criado_em   timestamptz not null default now()
);

create table tatuadores (
  id                     uuid primary key default gen_random_uuid(),
  estudio_id             uuid not null references estudios (id) on delete cascade,
  nome                   text not null check (char_length(nome) between 2 and 100),
  whatsapp               text not null check (whatsapp ~ '^[0-9]{12,13}$'),
  trello_board_id        text,
  trello_lista_novas_id  text,
  user_id                uuid unique,  -- usuário do Supabase Auth, para o login
  criado_em              timestamptz not null default now()
);

create table clientes (
  id          uuid primary key default gen_random_uuid(),
  estudio_id  uuid not null references estudios (id) on delete cascade,
  nome        text not null check (char_length(nome) between 2 and 100),
  instagram   text not null check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  whatsapp    text not null check (whatsapp ~ '^[0-9]{10,13}$'),
  cidade      text not null,
  regiao      text not null check (regiao in ('grande_vitoria', 'fora')),
  criado_em   timestamptz not null default now(),
  unique (estudio_id, instagram)
);

create table fichas (
  id                  uuid primary key default gen_random_uuid(),
  estudio_id          uuid not null references estudios (id) on delete cascade,
  tatuador_id         uuid not null references tatuadores (id),
  cliente_id          uuid not null references clientes (id),
  experiencia         text not null,
  ideia               text not null check (char_length(ideia) >= 10),
  link_referencia     text,
  local_corpo         text not null,
  tamanho             text not null,
  cobertura           boolean not null default false,
  cor                 text,
  faixa_investimento  text not null,
  prazo               text not null,
  data_limite         date,
  disponibilidade     text[] not null default '{}',
  origem              text,
  indicado_por        text,
  tem_foto_local      boolean not null default false,  -- usado na ficha cadastrada à mão pelo painel
  tem_referencia      boolean not null default false,
  pontuacao           integer not null default 0,
  temperatura         text not null check (temperatura in ('quente', 'morna', 'fria')),
  motivos             text,
  status              text not null default 'novo'
                        check (status in ('novo', 'em_conversa', 'orcamento_enviado', 'agendado', 'fechado', 'perdido', 'arquivado')),
  valor_orcamento     numeric(10, 2) check (valor_orcamento > 0),
  observacoes         text check (char_length(observacoes) <= 2000),
  trello_card_id      text unique,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  check (prazo <> 'Tenho data marcada' or data_limite is not null),
  check (origem is distinct from 'Indicação' or indicado_por is not null)
);

create table fotos (
  id         uuid primary key default gen_random_uuid(),
  ficha_id   uuid not null references fichas (id) on delete cascade,
  caminho    text not null,  -- caminho dentro do bucket "fichas" do Storage
  tipo       text not null check (tipo in ('local', 'referencia', 'cobertura')),
  criado_em  timestamptz not null default now()
);

create table sessoes (
  id             uuid primary key default gen_random_uuid(),
  ficha_id       uuid not null references fichas (id) on delete cascade,
  inicio         timestamptz not null,
  duracao_horas  numeric(3, 1) not null check (duracao_horas between 0.5 and 12),
  valor_sinal    numeric(10, 2) check (valor_sinal > 0),
  status         text not null default 'marcada' check (status in ('marcada', 'realizada', 'remarcada', 'cancelada')),
  criado_em      timestamptz not null default now()
);

create index fichas_estudio_status_idx on fichas (estudio_id, status);
create index fichas_tatuador_idx on fichas (tatuador_id);
create index fotos_ficha_idx on fotos (ficha_id);
create index sessoes_ficha_idx on sessoes (ficha_id);

-- atualizado_em sempre em dia
create function marcar_atualizacao() returns trigger
language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger fichas_atualizado_em
  before update on fichas
  for each row execute function marcar_atualizacao();

-- ---------------------------------------------------------------------------
-- Segurança por linha (RLS)
-- O tatuador logado só vê o estúdio dele.
-- ---------------------------------------------------------------------------

create function meu_estudio() returns uuid
language sql stable security definer set search_path = public as $$
  select estudio_id from tatuadores where user_id = auth.uid()
$$;

alter table estudios   enable row level security;
alter table tatuadores enable row level security;
alter table clientes   enable row level security;
alter table fichas     enable row level security;
alter table fotos      enable row level security;
alter table sessoes    enable row level security;

create policy "estudio: ver o meu" on estudios
  for select to authenticated using (id = meu_estudio());

create policy "tatuadores: ver os do meu estudio" on tatuadores
  for select to authenticated using (estudio_id = meu_estudio());

create policy "clientes: ler e editar os do meu estudio" on clientes
  for all to authenticated using (estudio_id = meu_estudio()) with check (estudio_id = meu_estudio());

create policy "fichas: ler e editar as do meu estudio" on fichas
  for all to authenticated using (estudio_id = meu_estudio()) with check (estudio_id = meu_estudio());

create policy "fotos: ver as do meu estudio" on fotos
  for select to authenticated
  using (exists (select 1 from fichas f where f.id = fotos.ficha_id and f.estudio_id = meu_estudio()));

create policy "sessoes: ler e editar as do meu estudio" on sessoes
  for all to authenticated
  using (exists (select 1 from fichas f where f.id = sessoes.ficha_id and f.estudio_id = meu_estudio()))
  with check (exists (select 1 from fichas f where f.id = sessoes.ficha_id and f.estudio_id = meu_estudio()));

-- ---------------------------------------------------------------------------
-- Storage: bucket privado para as fotos (link só por URL assinada)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('fichas', 'fichas', false)
on conflict (id) do nothing;
