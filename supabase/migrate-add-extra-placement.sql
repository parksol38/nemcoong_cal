-- 추가시간을 근무 시작 전 / 종료 후로 나눠 저장 (야간수당 22~06 겹침 계산용)
-- Supabase SQL Editor에서 실행하세요.

alter table public.shifts
  add column if not exists extra_before_hours numeric not null default 0;

alter table public.shifts
  add column if not exists extra_after_hours numeric not null default 0;

notify pgrst, 'reload schema';
