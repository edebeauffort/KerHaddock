-- Moves bookings from being per-bedroom to per-house: a family group books
-- the whole house for a date range (who sleeps where gets sorted out in
-- person, not through the app). Run this once in the Supabase SQL editor —
-- it carries over any existing bookings to the right house automatically.

alter table public.bookings add column if not exists house_id uuid references public.houses (id) on delete cascade;

update public.bookings b
set house_id = r.house_id
from public.rooms r
where b.room_id = r.id and b.house_id is null;

alter table public.bookings alter column house_id set not null;

-- Drop the old per-bedroom exclusion constraint. Postgres auto-names it, so
-- we look it up rather than guessing (there's only ever one exclusion
-- constraint on this table).
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.bookings'::regclass and contype = 'x';

  if cname is not null then
    execute format('alter table public.bookings drop constraint %I', cname);
  end if;
end $$;

alter table public.bookings drop column if exists room_id;

-- New rule: the whole house can't be double-booked for overlapping dates.
alter table public.bookings add constraint bookings_house_date_range_excl
  exclude using gist (house_id with =, date_range with &&) where (status = 'confirmed');
