-- Lets a stay's dates/bedrooms/guest count be edited atomically: the old
-- booking rows are deleted and the new ones inserted inside a single
-- database transaction. If the new dates/bedrooms aren't actually free, the
-- whole edit is rolled back and your original booking is left untouched
-- (rather than deleting the old one and then failing to create the new one).
-- Run this once in the Supabase SQL editor.

-- There was no DELETE policy on bookings yet (only select/insert/update),
-- so without this the function below would silently delete nothing.
drop policy if exists "Members can delete their own bookings" on public.bookings;
create policy "Members can delete their own bookings" on public.bookings
  for delete using (auth.uid() = user_id);

create or replace function public.replace_booking(
  old_booking_ids uuid[],
  new_room_ids uuid[],
  new_start date,
  new_end date,
  new_guest_count int,
  new_notes text
) returns void
language plpgsql
security invoker
as $$
begin
  delete from public.bookings
  where id = any(old_booking_ids) and user_id = auth.uid();

  insert into public.bookings (room_id, user_id, date_range, guest_count, notes)
  select room_id, auth.uid(), daterange(new_start, new_end), new_guest_count, new_notes
  from unnest(new_room_ids) as room_id;
end;
$$;

grant execute on function public.replace_booking(uuid[], uuid[], date, date, int, text) to authenticated;
