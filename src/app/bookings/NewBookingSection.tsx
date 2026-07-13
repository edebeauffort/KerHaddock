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
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Réservations
        </h2>
        <button
          type="button"
          onClick={() => setDesktopOpen((o) => !o)}
          className="hidden items-center gap-1.5 rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal-dark sm:flex"
        >
          <span className="text-base leading-none">{desktopOpen ? "×" : "+"}</span>
          {desktopOpen ? "Fermer" : "Nouvelle réservation"}
        </button>
      </div>

      {desktopOpen && (
        <div className="hidden sm:block">
          <BookingForm
            houses={houses}
            priorityPeriods={priorityPeriods}
            ownFamilyBranch={ownFamilyBranch}
          />
        </div>
      )}

      {/* Mobile: floating action button + bottom-sheet modal */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Nouvelle réservation"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand-teal px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-brand-teal-dark sm:hidden"
      >
        <span className="text-lg leading-none">+</span>
        Nouvelle réservation
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-8 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Nouvelle réservation
              </h3>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              >
                ×
              </button>
            </div>
            <BookingForm
              houses={houses}
              priorityPeriods={priorityPeriods}
              ownFamilyBranch={ownFamilyBranch}
            />
          </div>
        </div>
      )}
    </div>
  );
}
