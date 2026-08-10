-- 교육·초과 등 추가 근무시간
-- Supabase SQL Editor에서 실행하세요.

alter table public.shifts
  add column if not exists extra_hours numeric not null default 0;

notify pgrst, 'reload schema';
