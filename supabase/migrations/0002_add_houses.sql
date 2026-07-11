-- Run this in the Supabase SQL editor if you already ran the original
-- schema.sql (i.e. you already have rooms/bookings). It adds a "houses"
-- table and links each existing room to one. Safe to re-run.

create table if not exists public.houses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.houses enable row level security;

drop policy if exists "Members can view houses" on public.houses;
create policy "Members can view houses" on public.houses
  for select using (auth.uid() is not null);

alter table public.rooms add column if not exists house_id uuid references public.houses (id) on delete cascade;

-- Create the two houses if they don't exist yet.
-- EDIT THESE NAMES to match your real houses before running.
insert into public.houses (name, description)
select * from (values
  ('Maison principale', 'The main house'),
  ('Maison annexe', 'The second house')
) as seed(name, description)
where not exists (select 1 from public.houses);

-- Attach every existing room that has no house yet to the first house
-- (edit the room names below if you'd rather assign them individually).
update public.rooms
set house_id = (select id from public.houses order by created_at limit 1)
where house_id is null;

-- Add a couple of starter bedrooms for the second house.
-- EDIT/ADD rows here to match its real bedrooms, then delete this block
-- once you've entered the real ones (or just edit them later in Table Editor).
insert into public.rooms (house_id, name, capacity, description)
select (select id from public.houses order by created_at desc limit 1), r.name, r.capacity, r.description
from (values
  ('Chambre 1', 2, null::text),
  ('Chambre 2', 2, null::text)
) as r(name, capacity, description)
where not exists (
  select 1 from public.rooms
  where house_id = (select id from public.houses order by created_at desc limit 1)
);

-- Once every room has a house_id (check with the query below), lock it down:
-- select name from public.rooms where house_id is null;
-- alter table public.rooms alter column house_id set not null;
