-- 메시지에 카메라 촬영 사진 1장 (최신 메시지에만, 별도 앨범 없음)
alter table public.calendars
  add column if not exists shared_message_photo text;

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'calendars'
  and column_name = 'shared_message_photo';
