"use client";

import { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import CancelStayButton from "./CancelStayButton";
import EditStayForm from "./EditStayForm";
import ApproveStayButton from "./ApproveStayButton";
import { branchColor, branchInitial } from "@/lib/branchColors";
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
  bookerBranch,
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
  bookerBranch: string | null;
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
  const nights = Math.max(differenceInCalendarDays(initialEnd, initialStart), 0);
  const color = branchColor(bookerBranch ?? "");
  const initial = bookerBranch
    ? branchInitial(bookerBranch)
    : bookedBy.charAt(0).toUpperCase() || "?";

  return (
    <li className="relative rounded-xl border border-slate-200 bg-white p-4">
      {isPending && (
        <span className="absolute right-4 top-4 rounded-full border border-brand-sage bg-brand-cream px-2.5 py-1 text-xs font-medium text-slate-800">
          ⚠ Accord {pendingBranches!.join(", ")} requis
        </span>
      )}

      <div className="flex items-start gap-3 pr-8">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color.dark }}
        >
          {initial}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{bookedBy}</p>
          <p className="text-sm text-slate-600">
            {dateRangeLabel} · {nights} nuit{nights > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {houseName} — {isWholeHouse ? "maison entière" : roomNames.join(", ")}
            {" · "}
            {guestCount} voyageur{guestCount > 1 ? "s" : ""}
            {notes && ` — ${notes}`}
          </p>
        </div>

        {isOwn && !editing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              aria-label="Modifier ce séjour"
              title="Modifier ce séjour"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
            <CancelStayButton bookingIds={bookingIds} />
          </div>
        )}
      </div>

      {isOwn && editing && (
        <div className="mt-3">
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
        </div>
      )}

      {!isOwn && canApprove && (
        <div className="mt-2 pl-12">
          <ApproveStayButton bookingIds={bookingIds} />
        </div>
      )}
    </li>
  );
}
