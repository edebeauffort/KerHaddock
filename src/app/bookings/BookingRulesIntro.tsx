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

function formatFr(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// Server component — just formats and lists whatever priority_periods rows
// it's given, grouped by year.
export default function BookingRulesIntro({ periods }: { periods: Period[] }) {
  const years = Array.from(new Set(periods.map((p) => p.year))).sort();

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <h2 className="mb-1 text-base font-semibold text-slate-900">
        Comment fonctionne la réservation
      </h2>
      <p>
        Chaque branche familiale a une quinzaine prioritaire en juillet-août,
        différente chaque année. Vous pouvez réserver n&apos;importe quelle date
        libre ci-dessous — mais si vos dates tombent pendant la période
        prioritaire d&apos;une autre branche, votre demande sera mise en
        attente jusqu&apos;à ce qu&apos;un membre de cette famille l&apos;approuve
        (vous recevrez un email dès que ce sera fait).
      </p>

      {years.length > 0 ? (
        <div className="mt-3 space-y-3">
          {years.map((year) => (
            <div key={year}>
              <p className="font-medium text-slate-900">{year}</p>
              <ul className="mt-1 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                {periods
                  .filter((p) => p.year === year)
                  .map((p) => {
                    const range = parseRange(p.date_range);
                    return (
                      <li key={`${p.family_branch}-${p.year}`}>
                        <span className="font-medium">{p.family_branch}</span>
                        {range && (
                          <>
                            {" "}
                            — du {formatFr(range.start)} au {formatFr(range.end)}
                          </>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-slate-500">
          Aucune période prioritaire définie pour le moment (un hôte peut en
          définir depuis la page Utilisateurs).
        </p>
      )}
    </div>
  );
}
