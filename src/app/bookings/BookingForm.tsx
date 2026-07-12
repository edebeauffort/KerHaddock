"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { createBooking, type BookingActionState } from "./actions";
import { isRoomFree, type BookedRange } from "./availability";
import { WHOLE_HOUSE_IMAGES, ROOM_IMAGES } from "@/lib/bookingOptionImages";

type Room = {
  id: string;
  name: string;
  capacity: number;
  bookedRanges: BookedRange[];
};

type House = {
  id: string;
  name: string;
  rooms: Room[];
};

type PriorityPeriod = {
  family_branch: string;
  year: number;
  date_range: string;
};

const initialState: BookingActionState = {};

function fmt(date: Date) {
  return format(date, "yyyy-MM-dd");
}

// Display-only full-month French format (e.g. "9 juillet 2026"), separate
// from the ISO value used for the underlying <input type="date"> and form
// submission.
function fmtFr(date: Date) {
  return format(date, "d MMMM yyyy", { locale: fr });
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Postgres returns daterange as e.g. "[2026-07-05,2026-07-19)".
function parseDateRangeString(range: string) {
  const match = range.match(/\[([\d-]+),([\d-]+)\)/);
  if (!match) return null;
  return {
    start: new Date(`${match[1]}T00:00:00`),
    end: new Date(`${match[2]}T00:00:00`),
  };
}

// One shared calendar for both houses. Pick your dates (by clicking the
// calendar or typing them in directly) and party size, then choose one or
// more booking options below — a whole house, or any combination of
// independent bedrooms (even across both houses at once).
export default function BookingForm({
  houses,
  priorityPeriods,
  ownFamilyBranch,
}: {
  houses: House[];
  priorityPeriods: PriorityPeriod[];
  ownFamilyBranch: string | null;
}) {
  // Arrival is the check-in date; departure is the checkout date (exclusive
  // upper bound, matching the daterange stored in the database) — clicking
  // or typing a date always sets one of these directly, never a "night".
  const [arrival, setArrival] = useState<Date | undefined>();
  const [departure, setDeparture] = useState<Date | undefined>();
  const [guestCount, setGuestCount] = useState(1);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedWholeHouseIds, setSelectedWholeHouseIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState(
    createBooking,
    initialState,
  );

  // The last actually-booked night (inclusive) — what availability checks
  // need, as opposed to the exclusive checkout date used everywhere else.
  const lastNight = departure ? addDays(departure, -1) : undefined;
  const nights =
    arrival && departure ? differenceInCalendarDays(departure, arrival) : null;

  // Any change to the search (dates or party size) hides the previous
  // availability results — you have to hit "Voir les disponibilités" again
  // to see results for the new search.
  useEffect(() => {
    setShowAvailability(false);
  }, [arrival, departure, guestCount]);

  const allRooms = useMemo(() => houses.flatMap((h) => h.rooms), [houses]);

  // The calendar only greys out (and strikes through) a day once every
  // bedroom in every house is taken — otherwise there's still something
  // bookable, you just need to look at the options below.
  const isDayGloballyUnavailable = (date: Date) =>
    allRooms.length > 0 &&
    allRooms.every((room) =>
      room.bookedRanges.some((r) => date >= r.from && date <= r.to),
    );

  function resetSelection() {
    setSelectedWholeHouseIds(new Set());
    setSelectedRoomIds(new Set());
  }

  // Fully custom click handling (rather than react-day-picker's built-in
  // range auto-logic) so the start date can always be changed — clicking
  // again after a complete range starts a fresh selection, and clicking a
  // date at or before the current arrival moves the start date instead of
  // being ignored.
  function handleDayClick(day: Date) {
    if (!arrival || (arrival && departure)) {
      setArrival(day);
      setDeparture(undefined);
    } else if (day <= arrival) {
      setArrival(day);
    } else {
      setDeparture(day);
    }
    resetSelection();
  }

  function handleArrivalInput(value: string) {
    if (!value) {
      setArrival(undefined);
      resetSelection();
      return;
    }
    const next = new Date(`${value}T00:00:00`);
    setArrival(next);
    if (departure && departure <= next) setDeparture(undefined);
    resetSelection();
  }

  function handleDepartureInput(value: string) {
    if (!value) {
      setDeparture(undefined);
      resetSelection();
      return;
    }
    const next = new Date(`${value}T00:00:00`);
    if (arrival && next <= arrival) return;
    setDeparture(next);
    resetSelection();
  }

  function toggleWholeHouse(house: House) {
    setSelectedWholeHouseIds((prev) => {
      const next = new Set(prev);
      if (next.has(house.id)) next.delete(house.id);
      else next.add(house.id);
      return next;
    });
    // Picking the whole house supersedes any individually picked bedroom in
    // that same house.
    const roomIdsInHouse = new Set(house.rooms.map((r) => r.id));
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      for (const id of next) {
        if (roomIdsInHouse.has(id)) next.delete(id);
      }
      return next;
    });
  }

  function toggleRoom(house: House, room: Room) {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(room.id)) next.delete(room.id);
      else next.add(room.id);
      return next;
    });
    // Picking a specific bedroom drops that house's "whole house" pick, if
    // any — you're now choosing bedrooms individually for that house.
    setSelectedWholeHouseIds((prev) => {
      if (!prev.has(house.id)) return prev;
      const next = new Set(prev);
      next.delete(house.id);
      return next;
    });
  }

  const finalRoomIds = useMemo(() => {
    const ids = new Set<string>(selectedRoomIds);
    for (const house of houses) {
      if (selectedWholeHouseIds.has(house.id)) {
        for (const room of house.rooms) ids.add(room.id);
      }
    }
    return Array.from(ids);
  }, [houses, selectedWholeHouseIds, selectedRoomIds]);

  const selectionSummary = useMemo(() => {
    const parts: string[] = [];
    for (const house of houses) {
      if (selectedWholeHouseIds.has(house.id)) {
        parts.push(`${house.name} (entière)`);
      } else {
        for (const room of house.rooms) {
          if (selectedRoomIds.has(room.id)) parts.push(room.name);
        }
      }
    }
    return parts;
  }, [houses, selectedWholeHouseIds, selectedRoomIds]);

  // Branches (other than your own) whose priority period overlaps the
  // chosen dates — shown as a warning before you pick any room, since
  // booking here will need that branch's approval.
  const overlappingBranches = useMemo(() => {
    if (!arrival || !departure) return [];
    const branches = new Set<string>();
    for (const period of priorityPeriods) {
      if (period.family_branch === ownFamilyBranch) continue;
      const parsed = parseDateRangeString(period.date_range);
      if (!parsed) continue;
      if (arrival < parsed.end && parsed.start < departure) {
        branches.add(period.family_branch);
      }
    }
    return Array.from(branches);
  }, [arrival, departure, priorityPeriods, ownFamilyBranch]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
        <div className="overflow-x-auto">
          <DayPicker
            mode="range"
            selected={{ from: arrival, to: departure }}
            onDayClick={handleDayClick}
            disabled={(date) =>
              date < startOfToday() || isDayGloballyUnavailable(date)
            }
            modifiers={{ unavailable: isDayGloballyUnavailable }}
            modifiersClassNames={{ unavailable: "rdp-day_unavailable" }}
            numberOfMonths={2}
            className="hh-calendar mx-auto"
          />
        </div>

        <div className="space-y-3">
          {/* Airbnb-style date/guest picker */}
          <div className="rounded-2xl border border-slate-300 bg-white">
            <div className="grid grid-cols-2 divide-x divide-slate-300">
              <label className="block px-4 py-2.5">
                <span className="block text-[10px] font-bold tracking-wide text-slate-900">
                  ARRIVÉE
                </span>
                <input
                  type="date"
                  value={arrival ? fmt(arrival) : ""}
                  onChange={(e) => handleArrivalInput(e.target.value)}
                  className="mt-0.5 block w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none"
                  aria-label="Arrivée"
                />
              </label>
              <label className="block px-4 py-2.5">
                <span className="block text-[10px] font-bold tracking-wide text-slate-900">
                  DÉPART
                </span>
                <input
                  type="date"
                  value={departure ? fmt(departure) : ""}
                  min={arrival ? fmt(addDays(arrival, 1)) : undefined}
                  onChange={(e) => handleDepartureInput(e.target.value)}
                  className="mt-0.5 block w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none"
                  aria-label="Départ"
                />
              </label>
            </div>

            <div className="relative border-t border-slate-300">
              <button
                type="button"
                onClick={() => setGuestPickerOpen((o) => !o)}
                className="block w-full px-4 py-2.5 text-left"
              >
                <span className="block text-[10px] font-bold tracking-wide text-slate-900">
                  VOYAGEURS
                </span>
                <span className="mt-0.5 block text-sm text-slate-700">
                  {guestCount} voyageur{guestCount > 1 ? "s" : ""}
                </span>
              </button>

              {guestPickerOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Fermer"
                    onClick={() => setGuestPickerOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div className="absolute inset-x-4 top-full z-20 mt-1 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Voyageurs</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                          disabled={guestCount <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm">{guestCount}</span>
                        <button
                          type="button"
                          onClick={() => setGuestCount((c) => c + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {arrival && departure ? (
            <div>
              {nights !== null && (
                <p className="text-2xl font-bold text-slate-900">
                  {nights} nuit{nights > 1 ? "s" : ""}
                </p>
              )}
              <p className="text-sm text-slate-600">
                {fmtFr(arrival)} → {fmtFr(departure)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Sélectionnez vos dates d&apos;arrivée et de départ dans le
              calendrier ou saisissez-les directement.
            </p>
          )}

          {overlappingBranches.length > 0 && (
            <div className="rounded-md border border-brand-sage bg-brand-cream p-3 text-sm text-slate-800">
              Attention : ces dates tombent pendant la période prioritaire de
              la famille {overlappingBranches.join(", ")}. Votre réservation
              nécessitera l&apos;approbation d&apos;un membre de cette famille
              avant d&apos;être confirmée.
            </div>
          )}
        </div>
      </div>

      {arrival && departure && !showAvailability && (
        <div className="mt-6 flex justify-center border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowAvailability(true)}
            className="rounded-full bg-brand-teal px-8 py-3 text-base font-semibold text-white hover:bg-brand-teal-dark"
          >
            Voir les disponibilités
          </button>
        </div>
      )}

      {arrival && departure && showAvailability && (
        <div className="mt-6 space-y-6 border-t border-slate-100 pt-4">
          {houses.map((house) => {
            const wholeHouseFree = house.rooms.every((room) =>
              isRoomFree(room, arrival, lastNight!),
            );
            const wholeHouseCapacity = house.rooms.reduce(
              (sum, r) => sum + r.capacity,
              0,
            );
            const wholeHouseAvailable =
              wholeHouseFree && wholeHouseCapacity >= guestCount;
            const wholeHouseImage = WHOLE_HOUSE_IMAGES[house.name];
            const wholeHouseSelected = selectedWholeHouseIds.has(house.id);

            return (
              <div key={house.id}>
                <h3 className="mb-2 text-base font-semibold">{house.name}</h3>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  <OptionButton
                    label={`${house.name} entière`}
                    sublabel={`Couchages : ${wholeHouseCapacity}`}
                    image={wholeHouseImage}
                    selected={wholeHouseSelected}
                    available={wholeHouseAvailable}
                    unavailableReason={
                      !wholeHouseFree
                        ? "Pas entièrement libre"
                        : "Capacité insuffisante"
                    }
                    onClick={() => toggleWholeHouse(house)}
                  />

                  {house.rooms.map((room) => {
                    // Bedrooms are only gated by date conflicts — capacity
                    // is shown (couchages) but doesn't hide/disable the
                    // option, since you might be splitting a larger group
                    // across several rooms.
                    const available = isRoomFree(room, arrival, lastNight!);
                    const selected = selectedRoomIds.has(room.id);

                    return (
                      <OptionButton
                        key={room.id}
                        label={room.name}
                        sublabel={`Couchages : ${room.capacity}`}
                        image={ROOM_IMAGES[room.name]}
                        selected={selected}
                        available={available}
                        unavailableReason="Déjà réservée"
                        onClick={() => toggleRoom(house, room)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          <form action={formAction} className="space-y-3 border-t border-slate-100 pt-4">
            <input type="hidden" name="startDate" value={fmt(arrival)} />
            <input type="hidden" name="endDate" value={fmt(departure)} />
            <input type="hidden" name="guestCount" value={guestCount} />
            {finalRoomIds.map((id) => (
              <input key={id} type="hidden" name="roomIds" value={id} />
            ))}

            {selectionSummary.length > 0 && (
              <p className="text-sm text-slate-600">
                Sélection : {selectionSummary.join(", ")}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium">
                Notes (facultatif)
              </label>
              <textarea
                name="notes"
                rows={2}
                className="mt-1 w-full rounded border border-slate-300 p-2"
              />
            </div>

            {state.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}
            {state.success && !state.pending && (
              <p className="text-sm text-green-600">Réservation confirmée.</p>
            )}
            {state.success && state.pending && (
              <p className="text-sm font-medium text-slate-700">
                Ces dates tombent pendant la période prioritaire d&apos;une
                autre branche familiale. Votre demande a été envoyée pour
                approbation.
              </p>
            )}

            <button
              type="submit"
              disabled={pending || finalRoomIds.length === 0}
              className="rounded bg-brand-teal px-4 py-2 text-white hover:bg-brand-teal-dark disabled:opacity-50"
            >
              {pending ? "Réservation…" : "Réserver"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function OptionButton({
  label,
  sublabel,
  image,
  selected,
  available,
  unavailableReason,
  onClick,
}: {
  label: string;
  sublabel: string;
  image?: string;
  selected: boolean;
  available: boolean;
  unavailableReason: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onClick}
      className={`group relative aspect-square overflow-hidden rounded-lg border-2 text-left transition ${
        selected
          ? "border-brand-teal ring-2 ring-brand-teal"
          : "border-slate-200"
      } ${!available ? "cursor-not-allowed opacity-50" : "hover:border-slate-400"}`}
      style={
        image
          ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {!image && <div className="absolute inset-0 bg-slate-200" />}
      <div
        className={`absolute inset-0 ${
          available ? "bg-black/35" : "bg-black/50"
        }`}
      />
      {!available && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-8deg] rounded bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {unavailableReason}
          </span>
        </div>
      )}
      {selected && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-xs font-bold text-white">
          ✓
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2 text-white">
        <p className="text-lg font-bold leading-tight drop-shadow">{label}</p>
        <p className="text-sm opacity-90 drop-shadow">{sublabel}</p>
      </div>
    </button>
  );
}
