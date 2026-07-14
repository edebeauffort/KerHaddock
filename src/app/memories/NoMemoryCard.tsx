import Link from "next/link";
import { formatDateRangeFr, monthYearLabel } from "@/lib/formatDateRange";

export default function NoMemoryCard({
  startISO,
  endISO,
}: {
  startISO: string;
  endISO: string;
}) {
  return (
    <Link
      href={`/memories/new?start=${startISO}`}
      className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 transition hover:border-brand-teal hover:bg-brand-mint/10"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
        +
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">
          {monthYearLabel(startISO)} — pas encore de souvenir
        </p>
        <p className="text-xs text-slate-500">
          Ajoutez des photos et une anecdote de votre séjour ({formatDateRangeFr(startISO, endISO)})
        </p>
      </div>
      <span className="shrink-0 text-slate-400">›</span>
    </Link>
  );
}
