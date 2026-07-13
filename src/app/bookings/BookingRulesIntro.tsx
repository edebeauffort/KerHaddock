"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { branchColor } from "@/lib/branchColors";

type Period = {
  family_branch: string;
  year: number;
  date_range: string;
};

// Postgres returns daterange as e.g. "[2026-07-05,2026-07-19)".
function parseRange(range: string) {
  const match = range.match(/\[([\d-]+),([\d-]+)\)/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

function formatShortFr(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function InfoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

// Client component so the year switcher is instant (filters the already-
// fetched `periods` — every year, not just the current one — in the
// browser instead of round-tripping to the server). It also nudges the
// URL via router.replace so the timeline/list sections further down the
// page (which do still read the year from the server) stay in sync.
export default function BookingRulesIntro({
  periods,
  year,
}: {
  periods: Period[];
  year: number;
}) {
  const router = useRouter();
  const [displayYear, setDisplayYear] = useState(year);

  // Keep in sync if the year prop changes for a reason other than this
  // component's own buttons (e.g. browser back/forward).
  useEffect(() => {
    setDisplayYear(year);
  }, [year]);

  function changeYear(next: number) {
    setDisplayYear(next);
    router.replace(`/bookings?year=${next}`, { scroll: false });
  }

  const periodsThisYear = periods
    .filter((p) => p.year === displayYear)
    .map((p) => ({ ...p, range: parseRange(p.date_range) }))
    .filter((p): p is Period & { range: { start: string; end: string } } =>
      Boolean(p.range),
    )
    .sort((a, b) => a.range.start.localeCompare(b.range.start));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Saison {displayYear}
          </h2>
          <p className="text-sm text-slate-500">
            Priorités en vigueur pour juillet et août
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeYear(displayYear - 1)}
            aria-label="Année précédente"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            ‹
          </button>
          <span className="min-w-[3.5rem] text-center text-sm font-semibold text-slate-900">
            {displayYear}
          </span>
          <button
            type="button"
            onClick={() => changeYear(displayYear + 1)}
            aria-label="Année suivante"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            ›
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Périodes de priorité
        </p>

        {periodsThisYear.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {periodsThisYear.map((p) => {
              const color = branchColor(p.family_branch);
              return (
                <div
                  key={`${p.family_branch}-${p.year}`}
                  className="rounded-xl border p-3"
                  style={{
                    backgroundColor: `${color.light}40`,
                    borderColor: color.light,
                  }}
                >
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ color: color.dark }}
                  >
                    {p.family_branch}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatShortFr(p.range.start)} – {formatShortFr(p.range.end)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Aucune période prioritaire définie pour {displayYear} (un hôte
            peut en définir depuis la page Utilisateurs).
          </p>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-100 p-3.5 text-sm text-slate-600">
        <span className="mt-0.5 shrink-0 text-slate-400">
          <InfoIcon />
        </span>
        <p>
          Chaque branche familiale a une quinzaine prioritaire en
          juillet-août, définie chaque année par un hôte. Vous pouvez
          réserver n&apos;importe quelle date libre — mais si vos dates
          tombent pendant la période prioritaire d&apos;une autre branche,
          votre demande sera mise en attente jusqu&apos;à ce qu&apos;un
          membre de cette famille l&apos;approuve.
        </p>
      </div>
    </div>
  );
}
