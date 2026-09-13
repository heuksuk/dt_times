create table public.game2_sessions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'playing' check (status in ('ready', 'playing', 'finished')),
  current_round integer not null default 0 check (current_round >= 0),
  scores jsonb not null default '{"DO":0,"GAE":0,"GEOL":0,"YUT":0,"MO":0}'::jsonb,
  revealed jsonb not null default '{}'::jsonb,
  fully_revealed jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index game2_sessions_created_at_idx on public.game2_sessions (created_at desc);

create table public.game2_score_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game2_sessions (id) on delete cascade,
  team public.animal_team not null,
  points smallint not null check (points in (-3, -1, 1, 3)),
  reason text not null check (reason in ('letter', 'phrase', 'undo')),
  round_index integer not null check (round_index >= 0),
  reverts_event_id uuid references public.game2_score_events (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create index game2_score_events_session_created_idx on public.game2_score_events (session_id, created_at desc);
create unique index game2_score_events_one_undo_idx on public.game2_score_events (reverts_event_id) where reverts_event_id is not null;

create or replace function public.game2_add_score(
  p_session_id uuid,
  p_team public.animal_team,
  p_points smallint,
  p_reason text,
  p_round_index integer,
  p_version integer
) returns public.game2_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  current_session public.game2_sessions;
  next_scores jsonb;
begin
  if p_points not in (1, 3) or p_reason not in ('letter', 'phrase') then
    raise exception 'invalid score';
  end if;

  select * into current_session from public.game2_sessions where id = p_session_id for update;
  if not found or current_session.version <> p_version then raise exception 'version conflict'; end if;

  next_scores := jsonb_set(
    current_session.scores,
    array[p_team::text],
    to_jsonb(coalesce((current_session.scores ->> p_team::text)::integer, 0) + p_points)
  );

  update public.game2_sessions
  set scores = next_scores, version = version + 1, updated_at = timezone('utc', now())
  where id = p_session_id
  returning * into current_session;

  insert into public.game2_score_events (session_id, team, points, reason, round_index)
  values (p_session_id, p_team, p_points, p_reason, p_round_index);
  return current_session;
end;
$$;

create or replace function public.game2_undo_score(p_session_id uuid, p_version integer)
returns public.game2_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  current_session public.game2_sessions;
  target public.game2_score_events;
  next_score integer;
begin
  select * into current_session from public.game2_sessions where id = p_session_id for update;
  if not found or current_session.version <> p_version then raise exception 'version conflict'; end if;

  select event.* into target
  from public.game2_score_events event
  where event.session_id = p_session_id
    and event.points > 0
    and not exists (select 1 from public.game2_score_events undo where undo.reverts_event_id = event.id)
  order by event.created_at desc
  limit 1;
  if not found then raise exception 'nothing to undo'; end if;

  next_score := coalesce((current_session.scores ->> target.team::text)::integer, 0) - target.points;
  if next_score < 0 then raise exception 'invalid score'; end if;

  update public.game2_sessions
  set scores = jsonb_set(scores, array[target.team::text], to_jsonb(next_score)),
      version = version + 1,
      updated_at = timezone('utc', now())
  where id = p_session_id
  returning * into current_session;

  insert into public.game2_score_events (session_id, team, points, reason, round_index, reverts_event_id)
  values (p_session_id, target.team, -target.points, 'undo', target.round_index, target.id);
  return current_session;
end;
$$;

alter table public.game2_sessions enable row level security;
alter table public.game2_score_events enable row level security;

revoke all on function public.game2_add_score(uuid, public.animal_team, smallint, text, integer, integer) from public, anon, authenticated;
revoke all on function public.game2_undo_score(uuid, integer) from public, anon, authenticated;
grant execute on function public.game2_add_score(uuid, public.animal_team, smallint, text, integer, integer) to service_role;
grant execute on function public.game2_undo_score(uuid, integer) to service_role;
