-- Adds a plain headcount for guests who aren't family members with an
-- account (so a memory's participant count isn't limited to people in the
-- Utilisateurs list). Run this once in the Supabase SQL editor.

alter table public.memories add column if not exists other_guests_count int not null default 0;

-- PostgREST caches the schema; without this, the API can keep returning
-- "Could not find the 'other_guests_count' column" for a few minutes (or
-- until the next auto-reload) even though the column now exists.
notify pgrst, 'reload schema';
