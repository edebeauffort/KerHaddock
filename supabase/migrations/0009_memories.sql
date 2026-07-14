-- Family memories: one entry per stay, with a cover photo, an optional
-- Google Photos album link, and a short anecdote. Run this once in the
-- Supabase SQL editor.

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  house_id uuid references public.houses (id) on delete cascade,
  date_range daterange not null,
  google_photos_url text,
  -- Path of the cover photo inside the "memories" Storage bucket (not a
  -- full URL) — kept relative so it survives a project URL change.
  cover_photo_path text,
  anecdote text,
  -- Snapshot of the day's weather, captured once at creation time via the
  -- Open-Meteo archive API — cheaper and more honest than re-fetching
  -- "historical" weather on every page view.
  weather_summary text,
  -- Snapshot of who was there, taken from the overlapping bookings at
  -- creation time. Kept as a plain array (not a join table) since a
  -- memory's participant list is fixed history, not something that should
  -- silently change if a booking is edited later.
  participant_ids uuid[] not null default '{}',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),

  -- One memory per stay — keeps "no memory yet" detection on the homepage
  -- a simple existence check instead of picking among duplicates.
  exclude using gist (house_id with =, date_range with &&)
);

alter table public.memories enable row level security;

drop policy if exists "Members can view memories" on public.memories;
create policy "Members can view memories" on public.memories
  for select using (auth.uid() is not null);

drop policy if exists "Members can create memories" on public.memories;
create policy "Members can create memories" on public.memories
  for insert with check (auth.uid() is not null);

-- Anyone can add a memory, but only its author or a host can edit/remove it
-- afterwards.
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

-- Storage bucket for cover photos. Public read (like every other photo in
-- this app — nothing on this site is secret beyond "you need the link" —
-- but writes require a logged-in family member.
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
