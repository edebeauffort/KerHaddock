"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { updateBooking, type BookingActionState } from "./actions";
import { isRoomFree, type BookedRange } from "./availability";

type Room = {
  id: string;
  name: string;
  capacity: number;
  bookedRanges: BookedRange[]; // excludes this stay's own current booking
};

const initialState: BookingActionState = {};

function toInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function EditStayForm({
  houseName,
  rooms,
  bookingIds,
  initialStart,
  initialEnd,
  initialRoomIds,
  initialGuestCount,
  initialNotes,
  onClose,
}: {
  houseName: string;
  rooms: Room[];
  bookingIds: string[];
  initialStart: Date;
  initialEnd: Date; // checkout date
  initialRoomIds: string[];
  initialGuestCount: number;
  initialNotes: string | null;
  onClose: () => void;
}) {
  const [startDate, setStartDate] = useState(toInputValue(initialStart));
  const [endDate, setEndDate] = useState(toInputValue(initialEnd));
  const [mode, setMode] = useState<"house" | "rooms">(
    initialRoomIds.length === rooms.length ? "house" : "rooms",
  );
  const [checkedRoomIds, setCheckedRoomIds] = useState<string[]>(initialRoomIds);
  const [state, formAction, pending] = useActionState(
    updateBooking,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const freeRooms = useMemo(() => {
    if (!startDate || !endDate) return rooms;
    const from = new Date(startDate);
    const lastNight = new Date(new Date(endDate).getTime() - 86400000);
    return rooms.filter((room) => isRoomFree(room, from, lastNight));
  }, [rooms, startDate, endDate]);

  const allRoomsFree = freeRooms.length === rooms.length;
  const effectiveMode = allRoomsFree ? mode : "rooms";
  const selectedRoomIds =
    effectiveMode === "house"
      ? rooms.map((r) => r.id)
      : checkedRoomIds.filter((id) => freeRooms.some((r) => r.id === id));

  return (
    <form
      action={formAction}
      className="mt-2 space-y-3 rounded border border-slate-200 bg-slate-50 p-3"
    >
      <p className="text-xs font-medium text-slate-600">
        Modification de votre séjour à {houseName}
      </p>

      {bookingIds.map((id) => (
        <input key={id} type="hidden" name="oldBookingIds" value={id} />
      ))}
      {selectedRoomIds.map((id) => (
        <input key={id} type="hidden" name="roomIds" value={id} />
      ))}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium">Arrivée</label>
          <input
            type="date"
            name="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="mt-1 w-full rounded border border-slate-300 p-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Départ</label>
          <input
            type="date"
            name="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="mt-1 w-full rounded border border-slate-300 p-1.5 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={effectiveMode === "house"}
            disabled={!allRoomsFree}
            onChange={() => setMode("house")}
          />
          Maison entière
          {!allRoomsFree && (
            <span className="text-slate-400">
              (pas entièrement libre à ces dates)
            </span>
          )}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={effectiveMode === "rooms"}
            onChange={() => setMode("rooms")}
          />
          Chambres spécifiques
        </label>
      </div>

      {effectiveMode === "rooms" && (
        <div className="space-y-1 rounded border border-slate-100 bg-white p-2">
          {rooms.map((room) => {
            const free = freeRooms.some((r) => r.id === room.id);
            return (
              <label
                key={room.id}
                className={`flex items-center gap-2 text-sm ${
                  !free ? "text-slate-300" : ""
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!free}
                  checked={checkedRoomIds.includes(room.id)}
                  onChange={(e) =>
                    setCheckedRoomIds((prev) =>
                      e.target.checked
                        ? [...prev, room.id]
                        : prev.filter((id) => id !== room.id),
                    )
                  }
                />
                {room.name} (couchages : {room.capacity})
                {!free && " — réservée"}
              </label>
            );
          })}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium">Voyageurs</label>
        <input
          type="number"
          name="guestCount"
          min={1}
          defaultValue={initialGuestCount}
          className="mt-1 w-20 rounded border border-slate-300 p-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium">Notes</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={initialNotes ?? ""}
          className="mt-1 w-full rounded border border-slate-300 p-1.5 text-sm"
        />
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && !state.pending && (
        <p className="text-xs text-green-600">Mis à jour — fermeture…</p>
      )}
      {state.success && state.pending && (
        <p className="text-xs text-amber-600">
          Ces dates tombent dans la période prioritaire d&apos;une autre branche —
          demande envoyée pour approbation. Fermeture…
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || selectedRoomIds.length === 0}
          className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-300 px-3 py-1.5 text-xs"
        >
          Annuler la modification
        </button>
      </div>
    </form>
  );
}
