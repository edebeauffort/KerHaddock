-- Deleting a user from Utilisateurs can fail with a foreign key violation
-- if that user ever created a memory or approved a priority-period
-- booking: memories.created_by and bookings.approved_by reference
-- auth.users without an ON DELETE behavior, so Postgres blocks the delete
-- rather than leaving a dangling reference. Switches both to
-- ON DELETE SET NULL — the memory/booking itself is kept, only the
-- "created by" / "approved by" attribution is cleared. (profiles.id and
-- bookings.user_id already cascade correctly and aren't affected.)

do $$
declare
  con record;
begin
  for con in
    select conname
    from pg_constraint
    where conrelid = 'public.memories'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) like '%(created_by)%'
  loop
    execute format('alter table public.memories drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.memories
  add constraint memories_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete set null;

do $$
declare
  con record;
begin
  for con in
    select conname
    from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) like '%(approved_by)%'
  loop
    execute format('alter table public.bookings drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.bookings
  add constraint bookings_approved_by_fkey
  foreign key (approved_by) references auth.users (id) on delete set null;
