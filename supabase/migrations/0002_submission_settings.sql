-- 단일 행사에서 설문 접수 상태를 관리합니다.
create table public.event_settings (
  id boolean primary key default true check (id),
  submissions_open boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.event_settings (id, submissions_open)
values (true, true)
on conflict (id) do nothing;

alter table public.event_settings enable row level security;
