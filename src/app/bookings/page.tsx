import { addDays, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getBookingHeroImages } from "@/lib/bookingHeroImages";
import BookingsHero from "./BookingsHero";
import BookingRulesIntro from "./BookingRulesIntro";
import SeasonTimeline from "./SeasonTimeline";
import NewBookingSection from "./NewBookingSection";
import StayListItem from "./StayListItem";
import HouseRules from "./HouseRules";

function formatRange(range: string) {
  // Postgres daterange comes back as a string like "[2026-07-10,2026-07-17)"
  const match = range.match(/\[(.+),(.+)\)/);
  if (!match) return range;
  return `${match[1]} → ${match[2]}`;
}

function parseDateRange(range: string): { from: Date; to: Date } | null {
  const match = range.match(/\[(.+),(.+)\)/);
  if (!match) return null;
  return {
    from: parseISO(match[1]),
    // Last actually-booked night: the stored end date is the checkout day.
    to: addDays(parseISO(match[2]), -1),
  };
}

// Like parseDateRange, but returns the raw arrival/checkout dates (no -1 day
// adjustment) — what the edit form's date inputs should be pre-filled with.
function parseExactRange(range: string): { start: Date; end: Date } | null {
  const match = range.match(/\[(.+),(.+)\)/);
  if (!match) return null;
  return { start: parseISO(match[1]), end: parseISO(match[2]) };
}

type BookingRow = {
  id: string;
  room_id: string;
  user_id: string;
  date_range: string;
  guest_count: number;
  notes: string | null;
  created_at: string;
  status?: string;
  pending_branches?: string[] | null;
};

type RoomRow = { id: string; name: string; capacity: number; house_id: string };
type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  family_branch: string | null;
};

// Builds the room list (with each room's already-booked ranges) for one
// house, optionally excluding a set of booking ids from the "booked" tally —
// used so editing a stay doesn't treat its own current rooms as unavailable.
function buildHouseRooms(
  houseId: string,
  rooms: RoomRow[],
  bookings: BookingRow[],
  excludeBookingIds: string[] = [],
) {
  return rooms
    .filter((r) => r.house_id === houseId)
    .map((room) => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      bookedRanges: bookings
        .filter(
          (b) => b.room_id === room.id && !excludeBookingIds.includes(b.id),
        )
        .map((b) => parseDateRange(b.date_range))
        .filter((r): r is { from: Date; to: Date } => r !== null),
    }));
}

// Bookings for the whole house (or several bedrooms at once) are stored as
// one row per bedroom (inserted together). Group them back up for display
// so they read as a single stay.
function groupBookings(
  bookings: BookingRow[],
  rooms: RoomRow[],
  profiles: ProfileRow[],
) {
  const groups = new Map<
    string,
    {
      houseId: string;
      userId: string;
      dateRange: string;
      guestCount: number;
      notes: string | null;
      roomNames: string[];
      roomIds: string[];
      bookingIds: string[];
      bookedBy: string;
      bookerBranch: string | null;
      pendingBranches: string[];
    }
  >();

  for (const booking of bookings) {
    const room = rooms.find((r) => r.id === booking.room_id);
    if (!room) continue;
    const bookerProfile = profiles.find((p) => p.id === booking.user_id);
    const bookedBy =
      bookerProfile && (bookerProfile.first_name || bookerProfile.last_name)
        ? `${bookerProfile.first_name ?? ""} ${bookerProfile.last_name ?? ""}`.trim()
        : "Un membre de la famille";
    const key = `${room.house_id}::${booking.user_id}::${booking.date_range}::${booking.created_at}`;
    const existing = groups.get(key);
    if (existing) {
      existing.roomNames.push(room.name);
      existing.roomIds.push(room.id);
      existing.bookingIds.push(booking.id);
    } else {
      groups.set(key, {
        houseId: room.house_id,
        userId: booking.user_id,
        dateRange: booking.date_range,
        guestCount: booking.guest_count,
        notes: booking.notes,
        roomNames: [room.name],
        roomIds: [room.id],
        bookingIds: [booking.id],
        bookedBy,
        bookerBranch: bookerProfile?.family_branch ?? null,
        pendingBranches: booking.pending_branches ?? [],
      });
    }
  }

  return Array.from(groups.values());
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getFullYear();
  const selectedYear = Number(yearParam) || currentYear;

  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // None of these queries depend on each other, so fire them all at once
  // instead of waiting on each round-trip in turn — on a real network (as
  // opposed to localhost), doing this sequentially can easily add a second
  // or more to the page load.
  const [
    { data: houses },
    { data: rooms },
    { data: bookings },
    { data: pendingRows },
    { data: profiles },
    { data: myProfile },
    { data: priorityPeriods },
  ] = await Promise.all([
    supabase.from("houses").select("id, name").order("created_at"),
    supabase.from("rooms").select("id, name, capacity, house_id").order("name"),
    supabase
      .from("bookings")
      .select("id, room_id, user_id, date_range, guest_count, notes, created_at, status, pending_branches")
      .eq("status", "confirmed")
      .order("date_range"),
    supabase
      .from("bookings")
      .select("id, room_id, user_id, date_range, guest_count, notes, created_at, status, pending_branches")
      .eq("status", "pending")
      .order("date_range"),
    supabase.from("profiles").select("id, first_name, last_name, family_branch"),
    supabase
      .from("profiles")
      .select("family_branch")
      .eq("id", currentUser?.id ?? "")
      .single(),
    supabase
      .from("priority_periods")
      .select("family_branch, year, date_range")
      .order("year")
      .order("family_branch"),
  ]);

  const bookingHeroImages = getBookingHeroImages();

  const groupedBookings = groupBookings(
    bookings ?? [],
    rooms ?? [],
    profiles ?? [],
  );

  const groupedPending = groupBookings(
    pendingRows ?? [],
    rooms ?? [],
    profiles ?? [],
  );

  // Confirmed bookings for the selected year only — drives both the season
  // timeline and the "Réservations {year}" list below it. Pending requests
  // stay unfiltered (they need action regardless of which year you're
  // currently browsing).
  const bookingsThisYear = groupedBookings.filter((g) => {
    const range = parseExactRange(g.dateRange);
    return range ? range.start.getFullYear() === selectedYear : false;
  });

  const timelineBookings = bookingsThisYear.map((g) => {
    const range = parseExactRange(g.dateRange)!;
    return {
      label: g.bookedBy,
      branch: g.bookerBranch,
      start: range.start,
      end: range.end,
    };
  });

  const timelinePeriods = (priorityPeriods ?? [])
    .filter((p) => p.year === selectedYear)
    .map((p) => {
      const match = p.date_range.match(/\[([\d-]+),([\d-]+)\)/);
      return match
        ? { family_branch: p.family_branch, start: match[1], end: match[2] }
        : null;
    })
    .filter((p): p is { family_branch: string; start: string; end: string } => p !== null)
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="w-full">
      <BookingsHero images={bookingHeroImages} />

      <div className="mx-auto w-full max-w-5xl space-y-10 p-6">
        <BookingRulesIntro periods={priorityPeriods ?? []} year={selectedYear} />

      <SeasonTimeline
        periods={timelinePeriods}
        bookings={timelineBookings}
        year={selectedYear}
      />

      {houses && houses.length > 0 ? (
        <NewBookingSection
          houses={houses.map((house) => ({
            id: house.id,
            name: house.name,
            rooms: buildHouseRooms(house.id, rooms ?? [], bookings ?? []),
          }))}
          priorityPeriods={priorityPeriods ?? []}
          ownFamilyBranch={myProfile?.family_branch ?? null}
        />
      ) : (
        <p className="text-sm text-slate-500">
          Aucune maison configurée pour le moment.
        </p>
      )}

      {groupedPending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Demandes en attente
          </h2>
          <ul className="space-y-3">
            {groupedPending.map((group, i) => {
              const house = houses?.find((h) => h.id === group.houseId);
              const houseRoomCount = (rooms ?? []).filter(
                (r) => r.house_id === group.houseId,
              ).length;
              const isWholeHouse = group.roomNames.length === houseRoomCount;
              const canApprove =
                !!myProfile?.family_branch &&
                group.pendingBranches.includes(myProfile.family_branch);
              const exactRange = parseExactRange(group.dateRange);

              return (
                <StayListItem
                  key={i}
                  houseName={house?.name ?? "Maison"}
                  isWholeHouse={isWholeHouse}
                  roomNames={group.roomNames}
                  dateRangeLabel={formatRange(group.dateRange)}
                  guestCount={group.guestCount}
                  notes={group.notes}
                  bookedBy={group.bookedBy}
                  bookerBranch={group.bookerBranch}
                  isOwn={currentUser?.id === group.userId}
                  bookingIds={group.bookingIds}
                  editRooms={buildHouseRooms(
                    group.houseId,
                    rooms ?? [],
                    bookings ?? [],
                    group.bookingIds,
                  )}
                  initialStart={exactRange?.start ?? new Date()}
                  initialEnd={exactRange?.end ?? new Date()}
                  initialRoomIds={group.roomIds}
                  pendingBranches={group.pendingBranches}
                  canApprove={canApprove}
                />
              );
            })}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Réservations {selectedYear}
        </h2>
        {bookingsThisYear.length === 0 && (
          <p className="text-sm text-slate-500">
            Aucune réservation pour {selectedYear}.
          </p>
        )}
        <ul className="space-y-3">
          {bookingsThisYear.map((group, i) => {
            const house = houses?.find((h) => h.id === group.houseId);
            const houseRoomCount = (rooms ?? []).filter(
              (r) => r.house_id === group.houseId,
            ).length;
            const isWholeHouse = group.roomNames.length === houseRoomCount;
            const exactRange = parseExactRange(group.dateRange);

            return (
              <StayListItem
                key={i}
                houseName={house?.name ?? "Maison"}
                isWholeHouse={isWholeHouse}
                roomNames={group.roomNames}
                dateRangeLabel={formatRange(group.dateRange)}
                guestCount={group.guestCount}
                notes={group.notes}
                bookedBy={group.bookedBy}
                bookerBranch={group.bookerBranch}
                isOwn={currentUser?.id === group.userId}
                bookingIds={group.bookingIds}
                editRooms={buildHouseRooms(
                  group.houseId,
                  rooms ?? [],
                  bookings ?? [],
                  group.bookingIds,
                )}
                initialStart={exactRange?.start ?? new Date()}
                initialEnd={exactRange?.end ?? new Date()}
                initialRoomIds={group.roomIds}
              />
            );
          })}
        </ul>
      </div>

        <HouseRules />
      </div>
    </div>
  );
}
