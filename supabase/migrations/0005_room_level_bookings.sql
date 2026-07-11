-- Adds back per-bedroom bookings on top of houses: you can now book the
-- whole house (all its bedrooms) or just specific bedrooms, and a house's
-- calendar day is only unavailable once every one of its bedrooms is taken.
-- Run this once in the Supabase SQL editor.
--
-- Any existing whole-house booking (from 0004) is expanded into one row per
-- bedroom in that house, so nothing is lost.

alter table public.bookings add column if not exists room_id uuid references public.rooms (id) on delete cascade;

-- house_id is still NOT NULL at this point from the 0004 migration; relax
-- that so the expansion insert below (which doesn't set house_id) works.
-- The column gets dropped entirely a few statements down anyway.
alter table public.bookings alter column house_id drop not null;

insert into public.bookings (room_id, user_id, date_range, guest_count, status, notes, created_at)
select r.id, b.user_id, b.date_range, b.guest_count, b.status, b.notes, b.created_at
from public.bookings b
join public.rooms r on r.house_id = b.house_id
where b.room_id is null;

delete from public.bookings where room_id is null;

alter table public.bookings alter column room_id set not null;

-- Drop the old house-level exclusion constraint (auto-named, so look it up).
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

alter table public.bookings drop column if exists house_id;

-- New rule: a bedroom can't be double-booked for overlapping dates.
-- Booking every bedroom in a house for the same dates is how "whole house"
-- is represented, and it's naturally blocked if any one of them is taken.
alter table public.bookings add constraint bookings_room_date_range_excl
  exclude using gist (room_id with =, date_range with &&) where (status = 'confirmed');
