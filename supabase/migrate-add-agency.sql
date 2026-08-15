-- 달력 직군(경찰/소방) — UI 테마·공유 시 구분
-- Supabase SQL Editor에서 실행하세요.

alter table public.calendars
  add column if not exists agency text not null default 'police'
  check (agency in ('police', 'fire'));

update public.calendars
set agency = case
  when shift_pattern like 'police_%' then 'police'
  else agency
end
where agency = 'police';

notify pgrst, 'reload schema';
