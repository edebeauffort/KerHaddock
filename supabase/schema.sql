-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run later after edits — every statement is idempotent.

-- Needed for the exclusion constraint that prevents overlapping bookings.
create extension if not exists btree_gist;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  family_branch text check (family_branch is null or family_branch in (
    'de Beauffort', 'de Meester', 'd''Harcourt', 'de Laminne'
  )),
  role text not null default 'guest' check (role in ('host', 'guest')),
  created_at timestamptz not null default now()
);

-- A property. There are two: "the house" is really "one of two houses".
create table if not exists public.houses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  house_id uuid references public.houses (id) on delete cascade,
  name text not null,
  capacity int not null default 1,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date_range daterange not null,
  guest_count int not null default 1,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'pending')),
  notes text,
  created_at timestamptz not null default now(),
  -- Set when a booking falls inside another branch's priority period: the
  -- branch(es) that need to approve it before it becomes confirmed.
  pending_branches text[],
  approved_by uuid references auth.users (id),
  approved_at timestamptz,

  -- Booking is per bedroom. "Book the whole house" is done at the app layer
  -- by inserting one row per bedroom in the house for the same dates in a
  -- single statement, so it's all-or-nothing. This constraint is what makes
  -- availability real rather than cosmetic: the database refuses two
  -- confirmed bookings for the same bedroom whose dates overlap, even under
  -- concurrent requests — so a house's calendar day is only fully booked
  -- once every one of its bedrooms is taken. Pending bookings are excluded
  -- so a priority-period request doesn't block itself from being approved.
  exclude using gist (
    room_id with =,
    date_range with &&
  ) where (status = 'confirmed')
);

-- One fortnight per branch per year. The exclusion constraint means no two
-- branches (or years) can ever be given overlapping dates — enforced by the
-- database, not just the admin UI.
create table if not exists public.priority_periods (
  id uuid primary key default gen_random_uuid(),
  family_branch text not null check (family_branch in (
    'de Beauffort', 'de Meester', 'd''Harcourt', 'de Laminne'
  )),
  year int not null,
  date_range daterange not null,
  created_at timestamptz not null default now(),

  unique (family_branch, year),
  exclude using gist (date_range with &&)
);

-- Family memories: one entry per stay, with a cover photo, an optional
-- Google Photos album link, and a short anecdote.
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  house_id uuid references public.houses (id) on delete cascade,
  date_range daterange not null,
  google_photos_url text,
  cover_photo_path text,
  anecdote text,
  weather_summary text,
  participant_ids uuid[] not null default '{}',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),

  exclude using gist (house_id with =, date_range with &&)
);

-- --- Row Level Security: family members only, nothing public ---
alter table public.profiles enable row level security;
alter table public.houses enable row level security;
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;
alter table public.priority_periods enable row level security;
alter table public.memories enable row level security;

drop policy if exists "Members can view all profiles" on public.profiles;
create policy "Members can view all profiles" on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Hosts can update any profile" on public.profiles;
create policy "Hosts can update any profile" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'host'
    )
  );

drop policy if exists "Members can view houses" on public.houses;
create policy "Members can view houses" on public.houses
  for select using (auth.uid() is not null);

drop policy if exists "Members can view rooms" on public.rooms;
create policy "Members can view rooms" on public.rooms
  for select using (auth.uid() is not null);

drop policy if exists "Members can view all bookings" on public.bookings;
create policy "Members can view all bookings" on public.bookings
  for select using (auth.uid() is not null);

drop policy if exists "Members can create their own bookings" on public.bookings;
create policy "Members can create their own bookings" on public.bookings
  for insert with check (auth.uid() = user_id);

drop policy if exists "Members can update their own bookings" on public.bookings;
create policy "Members can update their own bookings" on public.bookings
  for update using (auth.uid() = user_id);

drop policy if exists "Members can delete their own bookings" on public.bookings;
create policy "Members can delete their own bookings" on public.bookings
  for delete using (auth.uid() = user_id);

-- Members of the relevant branch(es) need to see and approve pending
-- requests that aren't their own.
drop policy if exists "Members can approve pending bookings" on public.bookings;
create policy "Members can approve pending bookings" on public.bookings
  for update using (
    status = 'pending'
    and exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.family_branch = any (pending_branches)
    )
  )
  with check (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.family_branch = any (pending_branches)
    )
  );

drop policy if exists "Members can view priority periods" on public.priority_periods;
create policy "Members can view priority periods" on public.priority_periods
  for select using (auth.uid() is not null);

drop policy if exists "Hosts can insert priority periods" on public.priority_periods;
create policy "Hosts can insert priority periods" on public.priority_periods
  for insert with check (
    exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'host')
  );

drop policy if exists "Hosts can update priority periods" on public.priority_periods;
create policy "Hosts can update priority periods" on public.priority_periods
  for update using (
    exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'host')
  );

drop policy if exists "Hosts can delete priority periods" on public.priority_periods;
create policy "Hosts can delete priority periods" on public.priority_periods
  for delete using (
    exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'host')
  );

drop policy if exists "Members can view memories" on public.memories;
create policy "Members can view memories" on public.memories
  for select using (auth.uid() is not null);

drop policy if exists "Members can create memories" on public.memories;
create policy "Members can create memories" on public.memories
  for insert with check (auth.uid() is not null);

drop policy if exists "Author or host can update memories" on public.memories;
create policy "Author or host can update memories" on public.memories
  for update using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'host')
  );

drop policy if exists "Author or host can delete memories" on public.memories;
create policy "Author or host can delete memories" on public.memories
  for delete using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'host')
  );

-- Storage bucket for memory cover photos — public read (same trust model
-- as every other photo in this app), writes require a logged-in member.
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

drop policy if exists "Public can view memory photos" on storage.objects;
create policy "Public can view memory photos" on storage.objects
  for select using (bucket_id = 'memories');

drop policy if exists "Members can upload memory photos" on storage.objects;
create policy "Members can upload memory photos" on storage.objects
  for insert with check (bucket_id = 'memories' and auth.uid() is not null);

drop policy if exists "Members can update their own memory photos" on storage.objects;
create policy "Members can update their own memory photos" on storage.objects
  for update using (bucket_id = 'memories' and owner = auth.uid());

drop policy if exists "Members can delete their own memory photos" on storage.objects;
create policy "Members can delete their own memory photos" on storage.objects
  for delete using (bucket_id = 'memories' and owner = auth.uid());

-- Auto-create a profile row whenever a host invites a new family member —
-- first_name/last_name/family_branch/role come from the invite metadata.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, family_branch, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'family_branch',
    coalesce(new.raw_user_meta_data ->> 'role', 'guest')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets a stay's dates/bedrooms/guest count be edited atomically: old rows
-- deleted and new ones inserted in a single transaction, so a conflicting
-- edit rolls back cleanly instead of losing the original booking.
create or replace function public.replace_booking(
  old_booking_ids uuid[],
  new_room_ids uuid[],
  new_start date,
  new_end date,
  new_guest_count int,
  new_notes text,
  new_status text default 'confirmed',
  new_pending_branches text[] default null
) returns void
language plpgsql
security invoker
as $$
begin
  delete from public.bookings
  where id = any(old_booking_ids) and user_id = auth.uid();

  insert into public.bookings (room_id, user_id, date_range, guest_count, notes, status, pending_branches)
  select room_id, auth.uid(), daterange(new_start, new_end), new_guest_count, new_notes, new_status, new_pending_branches
  from unnest(new_room_ids) as room_id;
end;
$$;

grant execute on function public.replace_booking(uuid[], uuid[], date, date, int, text, text, text[]) to authenticated;

-- Houses & rooms — edit to match reality (capacities are placeholders).
insert into public.houses (name, description)
select * from (values
  ('Grande maison', null),
  ('Petite maison', null)
) as seed(name, description)
where not exists (select 1 from public.houses);

insert into public.rooms (house_id, name, capacity, description)
select h.id, r.name, r.capacity, r.description
from (values
  ('Grande maison', 'Chambre Daddy & Grany', 2, null),
  ('Grande maison', 'Chambre du fond', 2, null),
  ('Grande maison', 'Chambre meteo Beaufort', 2, null),
  ('Grande maison', 'Chambre aux phares', 2, null),
  ('Petite maison', 'Chambre aux poissons', 2, null),
  ('Petite maison', 'Dortoir', 4, null)
) as r(house_name, name, capacity, description)
join public.houses h on h.name = r.house_name
where not exists (select 1 from public.rooms);

-- First host account.
update public.profiles
set role = 'host',
    first_name = coalesce(first_name, 'Edouard'),
    last_name = coalesce(last_name, 'de Beauffort'),
    family_branch = coalesce(family_branch, 'de Beauffort')
where email = 'e.debeauffort@gmail.com';
