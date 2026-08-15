-- ============================================================
-- v2 배포용 안전 마이그레이션 (Supabase SQL Editor → Run)
-- ✓ shifts / change_logs / 비밀번호 / 근무 패턴 데이터는 건드리지 않음
-- ✓ calendars 에 컬럼만 추가·기본값 설정
-- ✓ 메시지 이력(shared_message_history)만 비움 (최신 메시지 칸은 유지)
-- ============================================================

-- 1) 직군 테마 (기존 달력은 police 기본값)
alter table public.calendars
  add column if not exists agency text not null default 'police'
  check (agency in ('police', 'fire'));

update public.calendars
set agency = case
  when shift_pattern like 'fire_%' then 'fire'
  when shift_pattern like 'police_%' then 'police'
  else agency
end;

-- 2) 공유 메시지 (calendars 컬럼 — 별도 테이블 없음)
alter table public.calendars
  add column if not exists shared_message text not null default '';

alter table public.calendars
  add column if not exists shared_message_by text not null default '';

alter table public.calendars
  add column if not exists shared_message_at timestamptz;

alter table public.calendars
  add column if not exists shared_message_history jsonb not null default '[]'::jsonb;

-- 3) 메시지 사진 (카메라 촬영 1장, 최신만)
alter table public.calendars
  add column if not exists shared_message_photo text;

-- 4) 메시지 이력만 비우기 (근무·변경 로그와 무관)
update public.calendars
set shared_message_history = '[]'::jsonb;

-- 5) 기기 중복 정리 (최근 접속 1건만 유지)
delete from public.calendar_devices d
using public.calendar_devices newer
where d.calendar_id = newer.calendar_id
  and d.device_id = newer.device_id
  and d.id <> newer.id
  and d.last_seen_at <= newer.last_seen_at;

delete from public.calendar_devices d
using public.calendar_devices newer
where d.calendar_id = newer.calendar_id
  and lower(trim(d.display_name)) = lower(trim(newer.display_name))
  and d.device_label = newer.device_label
  and d.id <> newer.id
  and d.last_seen_at <= newer.last_seen_at;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'calendar_devices_calendar_id_device_id_key'
  ) then
    alter table public.calendar_devices
      add constraint calendar_devices_calendar_id_device_id_key
      unique (calendar_id, device_id);
  end if;
end $$;

notify pgrst, 'reload schema';

-- 확인
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'calendars'
  and column_name in ('agency', 'shared_message', 'shared_message_photo', 'shared_message_history')
order by column_name;
