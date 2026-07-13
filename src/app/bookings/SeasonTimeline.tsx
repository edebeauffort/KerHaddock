import { addDays } from "date-fns";
import { FAMILY_BRANCHES } from "@/lib/familyBranches";
import { branchColor, branchInitial } from "@/lib/branchColors";

type PeriodInput = { family_branch: string; start: string; end: string };
type BookingInput = { label: string; branch: string | null; start: Date; end: Date };

function formatFr(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function monthLabels(
  rangeStart: Date,
  rangeEnd: Date,
  pct: (d: Date) => number,
) {
  const labels: { label: string; pct: number }[] = [];
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  let guard = 0;
  while (cursor <= rangeEnd && guard < 24) {
    const labelDate = cursor < rangeStart ? rangeStart : cursor;
    labels.push({
      label: cursor.toLocaleDateString("fr-FR", { month: "long" }),
      pct: pct(labelDate),
    });
    cursor.setMonth(cursor.getMonth() + 1);
    guard += 1;
  }
  return labels;
}

// A visual season overview: priority periods as a colored bar, confirmed
// bookings laid out below it as pills positioned by date (simple greedy
// lane assignment so overlapping stays don't collide).
export default function SeasonTimeline({
  periods,
  bookings,
  year,
}: {
  periods: PeriodInput[];
  bookings: BookingInput[];
  year: number;
}) {
  if (periods.length === 0 && bookings.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Rien à afficher sur la frise pour {year}.
      </p>
    );
  }

  const allDates: Date[] = [
    ...periods.flatMap((p) => [
      new Date(`${p.start}T00:00:00`),
      new Date(`${p.end}T00:00:00`),
    ]),
    ...bookings.flatMap((b) => [b.start, b.end]),
  ];
  const rangeStart = addDays(
    new Date(Math.min(...allDates.map((d) => d.getTime()))),
    -2,
  );
  const rangeEnd = addDays(
    new Date(Math.max(...allDates.map((d) => d.getTime()))),
    2,
  );
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();

  if (totalMs <= 0) {
    return (
      <p className="text-sm text-slate-500">
        Rien à afficher sur la frise pour {year}.
      </p>
    );
  }

  const pct = (d: Date) =>
    ((d.getTime() - rangeStart.getTime()) / totalMs) * 100;

  const months = monthLabels(rangeStart, rangeEnd, pct);

  // Greedy lane assignment: earliest-starting stays first, each dropped
  // into the first lane whose last stay has already ended.
  const sortedBookings = [...bookings].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const lanes: BookingInput[][] = [];
  for (const booking of sortedBookings) {
    const lane = lanes.find((l) => l[l.length - 1].end <= booking.start);
    if (lane) {
      lane.push(booking);
    } else {
      lanes.push([booking]);
    }
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Calendrier estival
      </p>

      <div className="relative mb-1 h-4 text-xs capitalize text-slate-500">
        {months.map((m, i) => (
          <span key={i} className="absolute" style={{ left: `${m.pct}%` }}>
            {m.label}
          </span>
        ))}
      </div>

      <div className="relative h-9 w-full overflow-hidden rounded-full bg-slate-100">
        {periods.map((p, i) => {
          const s = new Date(`${p.start}T00:00:00`);
          const e = new Date(`${p.end}T00:00:00`);
          const color = branchColor(p.family_branch);
          return (
            <div
              key={i}
              title={`${p.family_branch} — Période ${i + 1} (${formatFr(s)} – ${formatFr(e)})`}
              className="absolute inset-y-0 flex items-center justify-center overflow-hidden text-xs font-bold text-white"
              style={{
                left: `${pct(s)}%`,
                width: `${Math.max(pct(e) - pct(s), 0)}%`,
                backgroundColor: color.dark,
              }}
            >
              {branchInitial(p.family_branch)}
              {i + 1}
            </div>
          );
        })}
      </div>

      {lanes.length > 0 && (
        <div
          className="relative mt-3"
          style={{ height: `${lanes.length * 34}px` }}
        >
          {lanes.map((lane, laneIdx) =>
            lane.map((b, bi) => {
              const color = branchColor(b.branch ?? "");
              return (
                <div
                  key={`${laneIdx}-${bi}`}
                  title={`${b.label} — du ${formatFr(b.start)} au ${formatFr(b.end)}`}
                  className="absolute flex h-7 items-center overflow-hidden truncate rounded-full px-3 text-xs font-semibold text-white"
                  style={{
                    left: `${pct(b.start)}%`,
                    width: `${Math.max(pct(b.end) - pct(b.start), 8)}%`,
                    top: `${laneIdx * 34}px`,
                    backgroundColor: color.dark,
                  }}
                >
                  {b.label}
                </div>
              );
            }),
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
        {FAMILY_BRANCHES.map((branch) => {
          const color = branchColor(branch);
          return (
            <span key={branch} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color.dark }}
              />
              {branch}
            </span>
          );
        })}
      </div>
    </div>
  );
}
