"use client";

import { useState } from "react";
import CancelStayButton from "./CancelStayButton";
import EditStayForm from "./EditStayForm";
import ApproveStayButton from "./ApproveStayButton";
import type { BookedRange } from "./availability";

type Room = { id: string; name: string; capacity: number; bookedRanges: BookedRange[] };

export default function StayListItem({
  houseName,
  isWholeHouse,
  roomNames,
  dateRangeLabel,
  guestCount,
  notes,
  bookedBy,
  isOwn,
  bookingIds,
  editRooms,
  initialStart,
  initialEnd,
  initialRoomIds,
  pendingBranches,
  canApprove,
}: {
  houseName: string;
  isWholeHouse: boolean;
  roomNames: string[];
  dateRangeLabel: string;
  guestCount: number;
  notes: string | null;
  bookedBy: string;
  isOwn: boolean;
  bookingIds: string[];
  editRooms: Room[];
  initialStart: Date;
  initialEnd: Date;
  initialRoomIds: string[];
  // Present (non-empty) only for a stay awaiting approval.
  pendingBranches?: string[];
  canApprove?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const isPending = !!pendingBranches && pendingBranches.length > 0;

  return (
    <li
      className={`rounded border p-3 text-sm ${
        isPending ? "border-brand-sage bg-brand-cream" : "border-slate-200 bg-white"
      }`}
    >
      <span className="font-medium">
        {houseName} —{" "}
        {isWholeHouse ? "maison entière" : roomNames.join(", ")}
      </span>{" "}
      — {dateRangeLabel} · {guestCount} voyageur(s)
      <p className="mt-1 text-slate-500">
        Réservé par {bookedBy}
        {notes && ` — ${notes}`}
      </p>

      {isPending && (
        <p className="mt-1 text-slate-700">
          En attente d&apos;approbation de {pendingBranches!.join(", ")}
        </p>
      )}

      {isOwn && !editing && (
        <div className="mt-1 flex gap-3">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-slate-600 underline"
          >
            Modifier ce séjour
          </button>
          <CancelStayButton bookingIds={bookingIds} />
        </div>
      )}

      {isOwn && editing && (
        <EditStayForm
          houseName={houseName}
          rooms={editRooms}
          bookingIds={bookingIds}
          initialStart={initialStart}
          initialEnd={initialEnd}
          initialRoomIds={initialRoomIds}
          initialGuestCount={guestCount}
          initialNotes={notes}
          onClose={() => setEditing(false)}
        />
      )}

      {!isOwn && canApprove && (
        <div className="mt-1">
          <ApproveStayButton bookingIds={bookingIds} />
        </div>
      )}
    </li>
  );
}
