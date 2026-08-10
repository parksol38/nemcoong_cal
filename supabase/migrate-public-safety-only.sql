-- ============================================================
-- 경찰·소방 전용으로 정리
-- - 빈 달력(근무 0건) 삭제
-- - 타직군 패턴 ID → police_5_3_10
-- - evening 근무 행 삭제 후 CHECK에서 evening 제거
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1) 근무가 하나도 없는 빈 달력 삭제 (devices/logs 등은 cascade)
delete from public.calendars c
where not exists (
  select 1 from public.shifts s where s.calendar_id = c.id
);

-- 2) 허용 패턴이 아닌 shift_pattern 을 경찰 5조3으로 맞춤
update public.calendars
set shift_pattern = 'police_5_3_10'
where shift_pattern is null
   or shift_pattern not in (
     'police_5_3_10',
     'safety_4team_2shift',
     'safety_3team_2shift_station',
     'safety_21day_cycle',
     'alternate_duty',
     'manual'
   );

-- 3) evening 유형 행 제거 (경찰·소방 미사용)
delete from public.shifts where shift_type = 'evening';

-- 변경 로그에 남은 evening 참조는 조회용으로만 남김 (삭제 선택)
-- delete from public.shift_change_logs
-- where from_type = 'evening' or to_type = 'evening';

-- 4) shift_type CHECK 재정의 (evening 제외)
alter table public.shifts drop constraint if exists shifts_shift_type_check;

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
