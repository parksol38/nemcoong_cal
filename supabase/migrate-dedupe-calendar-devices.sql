-- calendar_devices 중복 정리 + 유니크 제약 보강
-- Supabase SQL Editor에서 실행하세요.

-- 1) (calendar_id, device_id) 중복 행 제거 — 최근 접속 1건만 유지
delete from public.calendar_devices d
using public.calendar_devices newer
where d.calendar_id = newer.calendar_id
  and d.device_id = newer.device_id
  and d.id <> newer.id
  and d.last_seen_at <= newer.last_seen_at;

-- 2) 같은 이름·기기 라벨 중복(코드 재입력 등) — 최근 접속 1건만 유지
delete from public.calendar_devices d
using public.calendar_devices newer
where d.calendar_id = newer.calendar_id
  and lower(trim(d.display_name)) = lower(trim(newer.display_name))
  and d.device_label = newer.device_label
  and d.id <> newer.id
  and d.last_seen_at <= newer.last_seen_at;

-- 3) 유니크 제약 (없으면 추가)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'calendar_devices_calendar_id_device_id_key'
  ) then
    alter table public.calendar_devices
      add constraint calendar_devices_calendar_id_device_id_key
      unique (calendar_id, device_id);
  end if;
end $$;

notify pgrst, 'reload schema';
