import { differenceInCalendarDays, parseISO } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AggregatedStay = {
  houseId: string | null;
  startISO: string;
  // Checkout day (exclusive end of the postgres daterange).
  endISO: string;
  participantIds: string[];
  bookedByUserId: string;
  isCurrent: boolean;
  daysAway: number;
};

function parseRange(range: string): { start: string; end: string } | null {
  const match = range.match(/\[(.+),(.+)\)/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

type ParsedBooking = {
  id: string;
  user_id: string;
  room_id: string;
  start: string;
  end: string;
  created_at: string;
};

async function fetchParsedBookings(supabase: SupabaseClient): Promise<{
  bookings: ParsedBooking[];
  houseByRoom: Map<string, string>;
}> {
  const [{ data: bookings }, { data: rooms }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, user_id, room_id, date_range, status, created_at")
      .eq("status", "confirmed")
      .order("created_at", { ascending: true }),
    supabase.from("rooms").select("id, house_id"),
  ]);

  const houseByRoom = new Map((rooms ?? []).map((r) => [r.id, r.house_id as string]));

  const parsed = (bookings ?? [])
    .map((b) => {
      const range = parseRange(b.date_range as string);
      if (!range) return null;
      return {
        id: b.id as string,
        user_id: b.user_id as string,
        room_id: b.room_id as string,
        start: range.start,
        end: range.end,
        created_at: b.created_at as string,
      };
    })
    .filter((b): b is ParsedBooking => b !== null);

  return { bookings: parsed, houseByRoom };
}

// Groups a flat list of bookings into distinct "stays" — every booking that
// overlaps another's dates (any house/room) counts as the same trip, so a
// week booked across two bedrooms by different people reads as one stay,
// not two.
function groupIntoStays(
  bookings: ParsedBooking[],
  houseByRoom: Map<string, string>,
): AggregatedStay[] {
  const todayISO = new Date().toISOString().slice(0, 10);
  const sorted = [...bookings].sort((a, b) => a.start.localeCompare(b.start));
  const used = new Set<string>();
  const stays: AggregatedStay[] = [];

  for (const anchor of sorted) {
    if (used.has(anchor.id)) continue;
    const overlapping = sorted.filter(
      (b) => !used.has(b.id) && rangesOverlap(anchor.start, anchor.end, b.start, b.end),
    );
    overlapping.forEach((b) => used.add(b.id));

    const participantIds = Array.from(new Set(overlapping.map((b) => b.user_id)));
    const earliestBooking = [...overlapping].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    )[0];
    const isCurrent = anchor.start <= todayISO && anchor.end > todayISO;
    const daysAway =
      anchor.start > todayISO
        ? Math.max(differenceInCalendarDays(parseISO(anchor.start), parseISO(todayISO)), 0)
        : 0;

    stays.push({
      houseId: houseByRoom.get(anchor.room_id) ?? null,
      startISO: anchor.start,
      endISO: anchor.end,
      participantIds,
      bookedByUserId: earliestBooking.user_id,
      isCurrent,
      daysAway,
    });
  }

  return stays;
}

// The "next stay" shown on the homepage: whichever confirmed booking is
// happening right now, or if none, the soonest one coming up.
export async function getNextStay(
  supabase: SupabaseClient,
): Promise<AggregatedStay | null> {
  const todayISO = new Date().toISOString().slice(0, 10);
  const { bookings, houseByRoom } = await fetchParsedBookings(supabase);
  const relevant = bookings.filter((b) => b.end > todayISO);
  const stays = groupIntoStays(relevant, houseByRoom);
  return stays[0] ?? null;
}

// Every distinct stay (past, current, and future), most recent first —
// used to let someone add a memory for any stay, not just the next one.
export async function getAllStays(supabase: SupabaseClient): Promise<AggregatedStay[]> {
  const { bookings, houseByRoom } = await fetchParsedBookings(supabase);
  return groupIntoStays(bookings, houseByRoom).sort((a, b) =>
    b.startISO.localeCompare(a.startISO),
  );
}
