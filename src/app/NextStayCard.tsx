import Link from "next/link";
import { formatDateRangeFr } from "@/lib/formatDateRange";
import type { AggregatedStay } from "@/lib/nextStay";

export default function NextStayCard({
  stay,
  bookedByName,
}: {
  stay: AggregatedStay | null;
  bookedByName: string | null;
}) {
  if (!stay) {
    return (
      <Link
        href="/bookings"
        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-teal"
      >
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <CalendarIcon /> Prochain séjour
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Aucun séjour prévu — réservez vos prochaines vacances.
        </p>
      </Link>
    );
  }

  return (
    <Link
      href="/bookings"
      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-teal"
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <CalendarIcon /> Prochain séjour
      </p>

      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900">
          {formatDateRangeFr(stay.startISO, stay.endISO)}
        </p>
        {bookedByName && (
          <p className="mt-1 text-base font-medium text-slate-700">
            Réservé par {bookedByName}
          </p>
        )}
      </div>
    </Link>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3" y="4.5" width="14" height="12" rx="1.5" />
      <path d="M3 8h14M7 3v3M13 3v3" strokeLinecap="round" />
    </svg>
  );
}
