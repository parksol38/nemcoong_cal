-- ============================================================
-- 공유 메시지: 이미 있는 calendars 테이블에 칸만 추가
-- (새 테이블 생성이 안 될 때 쓰는 방식)
-- Supabase SQL Editor에서 이 파일 전체를 실행 → Run
-- ============================================================

alter table public.calendars
  add column if not exists shared_message text not null default '';

alter table public.calendars
  add column if not exists shared_message_by text not null default '';

alter table public.calendars
  add column if not exists shared_message_at timestamptz;

alter table public.calendars
  add column if not exists shared_message_history jsonb not null default '[]'::jsonb;

-- API가 새 컬럼을 바로 인식하도록 스키마 새로고침
notify pgrst, 'reload schema';

-- 아래가 Success / 컬럼 이름이 보이면 성공입니다
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'calendars'
  and column_name like 'shared_message%'
order by column_name;
