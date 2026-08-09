-- 달력별 잠금 비밀번호 + 버전 (관리자 초기화용)
-- Supabase SQL Editor에서 실행하세요.

alter table public.calendars
  add column if not exists app_password text not null default '930308';

alter table public.calendars
  add column if not exists password_version integer not null default 1;

-- 기존 행에 값이 비어 있으면 기본값 보정
update public.calendars
set app_password = '930308'
where app_password is null or btrim(app_password) = '';

update public.calendars
set password_version = 1
where password_version is null or password_version < 1;

notify pgrst, 'reload schema';

select id, share_code, app_password, password_version
from public.calendars
order by created_at;
