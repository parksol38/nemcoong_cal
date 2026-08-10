-- 오후(이브닝) 근무유형 추가
-- [폐기] 경찰·소방 전용으로 전환됨.
-- 대신 migrate-public-safety-only.sql 을 실행하세요.
-- Supabase SQL Editor에서 실행하세요.

alter table public.shifts
  drop constraint if exists shifts_shift_type_check;

alter table public.shifts
  add constraint shifts_shift_type_check
  check (
    shift_type in (
      'day',
      'evening',
      'night',
      'overnight',
      'rest',
      'off',
      'day_support',
      'night_support'
    )
  );

notify pgrst, 'reload schema';
