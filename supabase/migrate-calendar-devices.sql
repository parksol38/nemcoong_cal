-- 기기(접속) 등록 이력
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.calendar_devices (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.calendars(id) on delete cascade,
  -- 브라우저 localStorage에 저장된 기기 고유 ID
  device_id text not null,
  display_name text not null default '',
  -- 예: iPhone, Android 폰, Windows PC, Mac
  device_label text not null default '기타 기기',
  user_agent text default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (calendar_id, device_id)
);

create index if not exists calendar_devices_calendar_idx
  on public.calendar_devices (calendar_id, created_at asc);

alter table public.calendar_devices enable row level security;

drop policy if exists "devices_select" on public.calendar_devices;
drop policy if exists "devices_insert" on public.calendar_devices;
drop policy if exists "devices_update" on public.calendar_devices;

create policy "devices_select" on public.calendar_devices
  for select using (true);

create policy "devices_insert" on public.calendar_devices
  for insert with check (true);

create policy "devices_update" on public.calendar_devices
  for update using (true);
