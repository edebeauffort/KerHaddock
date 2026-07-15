-- Multiple memories can now share overlapping (or identical) dates — e.g.
-- different family branches, or several stays that happened to overlap,
-- each want their own memory entry. Drops whichever exclusion constraint
-- Postgres auto-named when the memories table was created, without having
-- to guess the exact name. Run this once in the Supabase SQL editor.

do $$
declare
  con record;
begin
  for con in
    select conname
    from pg_constraint
    where conrelid = 'public.memories'::regclass
      and contype = 'x'
  loop
    execute format('alter table public.memories drop constraint %I', con.conname);
  end loop;
end $$;

notify pgrst, 'reload schema';
