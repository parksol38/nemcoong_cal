-- 교대 유형 + 달력 소유자(생성 기기)
-- Supabase SQL Editor에서 실행하세요.

alter table public.calendars
  add column if not exists shift_pattern text not null default 'police_5_3_10';

alter table public.calendars
  add column if not exists owner_device_id text;

notify pgrst, 'reload schema';
