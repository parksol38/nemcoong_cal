-- ============================================================
-- ???? ?? ?? ? Supabase ???
-- Supabase SQL Editor?? ? ?? ??? ?????.
-- ============================================================

-- ?? ??
create table if not exists public.calendars (
  id uuid primary key default gen_random_uuid(),
  name text not null default '?? ?????',
  share_code text not null unique,
  created_at timestamptz not null default now()
);

-- ??? ??
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.calendars(id) on delete cascade,
  date date not null,
  -- day: 주간, night: 야간, overnight: 심야, rest: 비번, off: 휴무
  -- day_support: 주간자원, night_support: 야간자원
  shift_type text not null check (
    shift_type in (
      'day',
      'night',
      'overnight',
      'rest',
      'off',
      'day_support',
      'night_support'
    )
  ),
  note text default '',
  start_time text, -- HH:mm (?? ???)
  end_time text,   -- HH:mm (?? ???)
  updated_by text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (calendar_id, date)
);

create index if not exists shifts_calendar_date_idx
  on public.shifts (calendar_id, date);

-- updated_at ?? ??
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shifts_set_updated_at on public.shifts;
create trigger shifts_set_updated_at
  before update on public.shifts
  for each row
  execute function public.set_updated_at();

-- RLS: ?? ??? ?? ?? ?? (??? ?? ??)
alter table public.calendars enable row level security;
alter table public.shifts enable row level security;

drop policy if exists "calendars_select" on public.calendars;
drop policy if exists "calendars_insert" on public.calendars;
drop policy if exists "calendars_update" on public.calendars;
drop policy if exists "shifts_select" on public.shifts;
drop policy if exists "shifts_insert" on public.shifts;
drop policy if exists "shifts_update" on public.shifts;
drop policy if exists "shifts_delete" on public.shifts;

create policy "calendars_select" on public.calendars
  for select using (true);

create policy "calendars_insert" on public.calendars
  for insert with check (true);

create policy "calendars_update" on public.calendars
  for update using (true);

create policy "shifts_select" on public.shifts
  for select using (true);

create policy "shifts_insert" on public.shifts
  for insert with check (true);

create policy "shifts_update" on public.shifts
  for update using (true);

create policy "shifts_delete" on public.shifts
  for delete using (true);

-- Realtime ?? ??? (?? ??? ?? ??? ? ? ?? ? ???? ???)
do $$
begin
  alter publication supabase_realtime add table public.shifts;
exception
  when duplicate_object then null;
end $$;


-- (???) ???? ??? ???? migrate-change-logs.sql ????

