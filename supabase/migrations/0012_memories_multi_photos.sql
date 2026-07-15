-- Up to 3 photos per memory (one "big" cover + two smaller ones), instead
-- of a single cover photo. Existing single-photo memories are backfilled
-- so they keep showing their photo in the new layout.

alter table public.memories add column if not exists photo_paths text[] not null default '{}';

update public.memories
set photo_paths = array[cover_photo_path]
where cover_photo_path is not null and photo_paths = '{}';

notify pgrst, 'reload schema';
