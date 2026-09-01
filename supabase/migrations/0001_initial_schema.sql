-- 단일 행사 전용 스키마입니다. event 테이블은 의도적으로 두지 않습니다.
create extension if not exists "pgcrypto";

create type public.animal_team as enum ('DO', 'GAE', 'GEOL', 'YUT', 'MO');

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  client_token uuid not null unique,
  name varchar(20) not null check (char_length(btrim(name)) between 2 and 20),
  answers jsonb not null,
  scores jsonb not null,
  initial_team public.animal_team not null,
  current_team public.animal_team not null,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index participants_current_team_idx on public.participants (current_team);
create index participants_submitted_at_idx on public.participants (submitted_at);

create table public.team_moves (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete restrict,
  from_team public.animal_team not null,
  to_team public.animal_team not null,
  moved_at timestamptz not null default timezone('utc', now()),
  check (from_team <> to_team)
);

create index team_moves_participant_id_idx on public.team_moves (participant_id);
create index team_moves_moved_at_idx on public.team_moves (moved_at);

-- 참여자는 테이블에 직접 접근하지 않고, 검증된 Next.js 서버 API를 통해서만 제출합니다.
alter table public.participants enable row level security;
alter table public.team_moves enable row level security;
