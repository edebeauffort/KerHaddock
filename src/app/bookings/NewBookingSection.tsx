"use client";

import { useState } from "react";
import BookingForm from "./BookingForm";

type Room = {
  id: string;
  name: string;
  capacity: number;
  bookedRanges: { from: Date; to: Date }[];
};
type House = { id: string; name: string; rooms: Room[] };
type PriorityPeriod = { family_branch: string; year: number; date_range: string };

export default function NewBookingSection({
  houses,
  priorityPeriods,
  ownFamilyBranch,
}: {
  houses: House[];
  priorityPeriods: PriorityPeriod[];
  ownFamilyBranch: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Réservations
        </h2>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal-dark"
        >
          <span className="text-base leading-none">{open ? "×" : "+"}</span>
          {open ? "Fermer" : "Nouvelle réservation"}
        </button>
      </div>

      {open && (
        <BookingForm
          houses={houses}
          priorityPeriods={priorityPeriods}
          ownFamilyBranch={ownFamilyBranch}
        />
      )}
    </div>
  );
}
