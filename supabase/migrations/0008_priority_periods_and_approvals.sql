-- Priority booking periods per family branch, and an approval workflow for
-- bookings that land in another branch's period. Run this once in the
-- Supabase SQL editor.

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

alter table public.priority_periods enable row level security;

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

-- Bookings gain a "pending" status: created when someone books dates that
-- fall inside another branch's priority period, until a member of that
-- branch approves it. pending_branches records which branch(es) need to
-- sign off; approved_by/approved_at are just an audit trail.
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.bookings'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%';

  if cname is not null then
    execute format('alter table public.bookings drop constraint %I', cname);
  end if;
end $$;

alter table public.bookings add constraint bookings_status_check
  check (status in ('confirmed', 'cancelled', 'pending'));

alter table public.bookings add column if not exists pending_branches text[];
alter table public.bookings add column if not exists approved_by uuid references auth.users (id);
alter table public.bookings add column if not exists approved_at timestamptz;

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
  );

-- replace_booking() needs to know the new status/pending_branches too, so
-- editing a pending (or priority-period-colliding) stay keeps that state
-- instead of silently reconfirming it.
drop function if exists public.replace_booking(uuid[], uuid[], date, date, int, text);

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

-- Fix: an UPDATE policy with only USING (no WITH CHECK) applies the USING
-- clause to the post-update row too — which would block the approval itself
-- from ever setting status to 'confirmed'. Give it an explicit WITH CHECK
-- that only re-verifies the approver's branch, not the resulting status.
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
