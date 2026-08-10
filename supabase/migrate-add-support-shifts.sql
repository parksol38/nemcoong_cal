-- 주간자원 / 야간자원 근무유형 + 시작·종료 시간
-- Supabase SQL Editor에서 실행하세요.

alter table public.shifts
  drop constraint if exists shifts_shift_type_check;

alter table public.shifts
  add constraint shifts_shift_type_check
  check (
    shift_type in (
      'day',
      'night',
      'overnight',
      'rest',
      'off',
      'day_support',
      'night_support'
    )
  );

alter table public.shifts
  add column if not exists start_time text;

alter table public.shifts
  add column if not exists end_time text;

notify pgrst, 'reload schema';
