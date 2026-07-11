-- Replaces the placeholder houses/rooms with your real ones. Run this in
-- the Supabase SQL editor regardless of whether you already ran
-- 0002_add_houses.sql or not — it's safe either way.
--
-- NOTE: this deletes any rooms/houses matching the old placeholder names
-- (and, via cascade, any bookings made against them). That's expected
-- during setup, before real family bookings exist. If you're not sure,
-- check first:
--   select * from bookings;
-- should show 0 rows before running this.

create table if not exists public.houses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Make sure `name` is unique even if this table already existed from an
-- earlier run without that constraint (this is what ON CONFLICT below needs).
create unique index if not exists houses_name_key on public.houses (name);

alter table public.houses enable row level security;

drop policy if exists "Members can view houses" on public.houses;
create policy "Members can view houses" on public.houses
  for select using (auth.uid() is not null);

alter table public.rooms add column if not exists house_id uuid references public.houses (id) on delete cascade;

-- Remove old placeholder houses/rooms (from the build-plan seed data).
delete from public.rooms
where house_id is not null
   or name in ('Chambre bleue', 'Chambre des enfants', 'Suite parentale', 'Chambre 1', 'Chambre 2');

delete from public.houses
where name in ('Maison principale', 'Maison annexe');

-- Create the real houses.
insert into public.houses (name)
values ('Grande maison'), ('Petite maison')
on conflict (name) do nothing;

-- Create the real bedrooms. Capacity defaults to 2 (4 for the dortoir) —
-- edit these anytime in Table Editor, no need to re-run this script.
insert into public.rooms (house_id, name, capacity)
select h.id, r.name, r.capacity
from (values
  ('Grande maison', 'Chambre Daddy & Grany', 2),
  ('Grande maison', 'Chambre du fond', 2),
  ('Grande maison', 'Chambre meteo Beaufort', 2),
  ('Grande maison', 'Chambre aux phares', 2),
  ('Petite maison', 'Chambre aux poissons', 2),
  ('Petite maison', 'Dortoir', 4)
) as r(house_name, name, capacity)
join public.houses h on h.name = r.house_name
where not exists (
  select 1 from public.rooms existing
  where existing.house_id = h.id and existing.name = r.name
);
