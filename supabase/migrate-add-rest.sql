-- 비번(rest) 근무 유형 추가
-- Supabase SQL Editor에서 실행하세요.

alter table public.shifts
  drop constraint if exists shifts_shift_type_check;

alter table public.shifts
  add constraint shifts_shift_type_check
  check (shift_type in ('day', 'night', 'overnight', 'rest', 'off'));
