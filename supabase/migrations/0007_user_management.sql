-- Adds real user management: host/guest roles, first/last name, email
-- (mirrored from auth.users for easy display), and a family branch. Run
-- this once in the Supabase SQL editor.

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists family_branch text;

-- Backfill email for existing rows (this SQL editor session can read
-- auth.users directly; the app itself never can from the browser).
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Drop the old role check (was 'admin'/'member') — look it up rather than
-- guessing its auto-generated name, since it must go before the values
-- below are updated to 'host'/'guest'.
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%';

  if cname is not null then
    execute format('alter table public.profiles drop constraint %I', cname);
  end if;
end $$;

update public.profiles set role = 'host' where role = 'admin';
update public.profiles set role = 'guest' where role = 'member';

alter table public.profiles alter column role set default 'guest';
alter table public.profiles add constraint profiles_role_check
  check (role in ('host', 'guest'));

alter table public.profiles drop constraint if exists profiles_family_branch_check;
alter table public.profiles add constraint profiles_family_branch_check
  check (family_branch is null or family_branch in (
    'de Beauffort', 'de Meester', 'd''Harcourt', 'de Laminne'
  ));

-- Hosts can manage everyone's profile (not just their own).
drop policy if exists "Hosts can update any profile" on public.profiles;
create policy "Hosts can update any profile" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'host'
    )
  );

-- New family members are invited via the Supabase Auth admin API with
-- first_name/last_name/family_branch/role in the invite metadata — pick
-- those up (and mirror the email) when the profile row is auto-created.
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

-- Make Edouard a host to start (fills in name/branch only if not already set).
update public.profiles
set role = 'host',
    first_name = coalesce(first_name, 'Edouard'),
    last_name = coalesce(last_name, 'de Beauffort'),
    family_branch = coalesce(family_branch, 'de Beauffort')
where email = 'e.debeauffort@gmail.com';
