-- 근무 변경 알림 로그
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.shift_change_logs (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.calendars(id) on delete cascade,
  -- 뱃지를 표시할 날짜 (패턴 입력 시 시작일만)
  date date not null,
  kind text not null check (kind in ('single', 'pattern')),
  from_type text,
  to_type text,
  note text default '',
  pattern_days integer,
  updated_by text default '',
  summary text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists shift_change_logs_calendar_date_idx
  on public.shift_change_logs (calendar_id, date, created_at desc);

alter table public.shift_change_logs enable row level security;

drop policy if exists "change_logs_select" on public.shift_change_logs;
drop policy if exists "change_logs_insert" on public.shift_change_logs;
drop policy if exists "change_logs_delete" on public.shift_change_logs;

create policy "change_logs_select" on public.shift_change_logs
  for select using (true);

create policy "change_logs_insert" on public.shift_change_logs
  for insert with check (true);

create policy "change_logs_delete" on public.shift_change_logs
  for delete using (true);

do $$
begin
  alter publication supabase_realtime add table public.shift_change_logs;
exception
  when duplicate_object then null;
end $$;
