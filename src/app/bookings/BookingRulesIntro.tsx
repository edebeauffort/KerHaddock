import Link from "next/link";
import { branchColor, branchInitial } from "@/lib/branchColors";

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

// Server component — shows the intro blurb, a year switcher, and one card
// per family branch with that year's priority period (in chronological
// order within the season, labelled "Période 1, 2, 3…").
export default function BookingRulesIntro({
  periods,
  year,
}: {
  periods: Period[];
  year: number;
}) {
  const periodsThisYear = periods
    .filter((p) => p.year === year)
    .map((p) => ({ ...p, range: parseRange(p.date_range) }))
    .filter((p): p is Period & { range: { start: string; end: string } } =>
      Boolean(p.range),
    )
    .sort((a, b) => a.range.start.localeCompare(b.range.start));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Saison {year}</h2>
          <p className="text-sm text-slate-500">
            Priorités en vigueur pour juillet et août
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/bookings?year=${year - 1}`}
            aria-label="Année précédente"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            ‹
          </Link>
          <span className="min-w-[3.5rem] text-center text-sm font-semibold text-slate-900">
            {year}
          </span>
          <Link
            href={`/bookings?year=${year + 1}`}
            aria-label="Année suivante"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            ›
          </Link>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Chaque branche familiale a une quinzaine prioritaire en
        juillet-août, définie chaque année par un hôte. Vous pouvez réserver
        n&apos;importe quelle date libre — mais si vos dates tombent pendant
        la période prioritaire d&apos;une autre branche, votre demande sera
        mise en attente jusqu&apos;à ce qu&apos;un membre de cette famille
        l&apos;approuve.
      </p>

      {periodsThisYear.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Périodes de priorité
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {periodsThisYear.map((p, i) => {
              const color = branchColor(p.family_branch);
              return (
                <div
                  key={`${p.family_branch}-${p.year}`}
                  className="rounded-xl border p-3"
                  style={{
                    backgroundColor: `${color.light}55`,
                    borderColor: color.light,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: color.dark }}
                    >
                      {branchInitial(p.family_branch)}
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {p.family_branch}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Période {i + 1}
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatShortFr(p.range.start)} – {formatShortFr(p.range.end)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Aucune période prioritaire définie pour {year} (un hôte peut en
          définir depuis la page Utilisateurs).
        </p>
      )}
    </div>
  );
}
