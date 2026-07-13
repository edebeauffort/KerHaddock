import { addDays } from "date-fns";
import { FAMILY_BRANCHES } from "@/lib/familyBranches";
import { branchColor } from "@/lib/branchColors";

type PeriodInput = { family_branch: string; start: string; end: string };
type BookingInput = { label: string; branch: string | null; start: Date; end: Date };

function formatFr(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function formatFrShort(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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

// Complement of a set of booked intervals within [rangeStart, rangeEnd] —
// used to show "Libre" (free) slots in the mobile calendar-style column.
function freeGaps(
  bookings: BookingInput[],
  rangeStart: Date,
  rangeEnd: Date,
  minDays: number,
) {
  const sorted = [...bookings].sort((a, b) => a.start.getTime() - b.start.getTime());
  const gaps: { start: Date; end: Date }[] = [];
  let cursor = rangeStart;
  for (const b of sorted) {
    if (b.start.getTime() > cursor.getTime()) {
      gaps.push({ start: cursor, end: b.start });
    }
    if (b.end.getTime() > cursor.getTime()) {
      cursor = b.end;
    }
  }
  if (cursor.getTime() < rangeEnd.getTime()) {
    gaps.push({ start: cursor, end: rangeEnd });
  }
  const minMs = minDays * 24 * 60 * 60 * 1000;
  return gaps.filter((g) => g.end.getTime() - g.start.getTime() >= minMs);
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
  const laneOf = new Map<BookingInput, number>();
  for (const booking of sortedBookings) {
    const laneIdx = lanes.findIndex((l) => l[l.length - 1].end <= booking.start);
    if (laneIdx >= 0) {
      lanes[laneIdx].push(booking);
      laneOf.set(booking, laneIdx);
    } else {
      lanes.push([booking]);
      laneOf.set(booking, lanes.length - 1);
    }
  }
  const laneCount = Math.max(lanes.length, 1);

  // Mobile: two synchronized columns sharing the same vertical date scale —
  // priority periods on the left, a Google-Calendar-like column of booked
  // slots (plus "Libre" gaps and month markers) on the right.
  const totalDays = totalMs / (24 * 60 * 60 * 1000);
  const pxPerDay = Math.min(30, Math.max(6, 900 / totalDays));
  const mobileHeight = Math.round(totalDays * pxPerDay);
  const gaps = freeGaps(bookings, rangeStart, rangeEnd, 1);

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Calendrier estival
      </p>

      {/* Mobile: two-column synchronized view — periods left, bookings
          calendar right */}
      <div className="sm:hidden">
        <div
          className="relative"
          style={{ height: `${mobileHeight}px` }}
        >
          {months.map((m, i) => (
            <div
              key={i}
              className="absolute inset-x-0 z-20 flex justify-center"
              style={{ top: `${m.pct}%` }}
            >
              <span className="-translate-y-1/2 rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                {m.label}
              </span>
            </div>
          ))}

          {/* Left column: priority periods */}
          <div className="absolute inset-y-0 left-0 w-[26%]">
            {periods.map((p, i) => {
              const s = new Date(`${p.start}T00:00:00`);
              const e = new Date(`${p.end}T00:00:00`);
              const color = branchColor(p.family_branch);
              return (
                <div
                  key={i}
                  className="absolute inset-x-0 flex flex-col justify-center gap-0.5 overflow-hidden rounded-lg border px-1.5 py-1"
                  style={{
                    top: `${pct(s)}%`,
                    height: `${Math.max(pct(e) - pct(s), 0)}%`,
                    minHeight: "48px",
                    backgroundColor: `${color.light}40`,
                    borderColor: color.light,
                  }}
                >
                  <span
                    className="w-fit rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                    style={{ backgroundColor: color.dark }}
                  >
                    P{i + 1}
                  </span>
                  <span
                    className="truncate text-xs font-semibold"
                    style={{ color: color.dark }}
                  >
                    {p.family_branch}
                  </span>
                  <span className="truncate text-[10px] text-slate-600">
                    {formatFrShort(s)} – {formatFrShort(e)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right column: booked slots + free gaps */}
          <div className="absolute inset-y-0 left-[30%] right-0">
            {gaps.map((g, i) => (
              <div
                key={`gap-${i}`}
                className="absolute inset-x-0 flex items-center rounded-lg border border-dashed border-slate-200 px-2"
                style={{
                  top: `${pct(g.start)}%`,
                  height: `${Math.max(pct(g.end) - pct(g.start), 0)}%`,
                  minHeight: "32px",
                }}
              >
                <span className="text-[10px] font-medium text-slate-400">
                  Libre
                </span>
              </div>
            ))}
            {sortedBookings.map((b, i) => {
              const color = branchColor(b.branch ?? "");
              const laneIdx = laneOf.get(b) ?? 0;
              return (
                <div
                  key={`booking-${i}`}
                  className="absolute flex flex-col justify-center gap-0.5 overflow-hidden rounded-lg border px-1.5 py-1"
                  style={{
                    top: `${pct(b.start)}%`,
                    height: `${Math.max(pct(b.end) - pct(b.start), 0)}%`,
                    minHeight: "44px",
                    left: `calc(${(laneIdx / laneCount) * 100}% + 2px)`,
                    width: `calc(${100 / laneCount}% - 4px)`,
                    backgroundColor: `${color.light}40`,
                    borderColor: color.light,
                  }}
                >
                  <span
                    className="truncate text-xs font-semibold"
                    style={{ color: color.dark }}
                  >
                    {b.label}
                  </span>
                  <span className="truncate text-[10px] text-slate-600">
                    {formatFrShort(b.start)} – {formatFrShort(b.end)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: horizontal bar */}
      <div className="hidden sm:block">
        <div className="relative mb-1 h-4 text-xs capitalize text-slate-500">
          {months.map((m, i) => (
            <span key={i} className="absolute" style={{ left: `${m.pct}%` }}>
              {m.label}
            </span>
          ))}
        </div>

        <div className="relative h-12 w-full rounded-lg bg-slate-100">
          {periods.map((p, i) => {
            const s = new Date(`${p.start}T00:00:00`);
            const e = new Date(`${p.end}T00:00:00`);
            const color = branchColor(p.family_branch);
            return (
              <div
                key={i}
                title={`${p.family_branch} — Période ${i + 1} (${formatFr(s)} – ${formatFr(e)})`}
                className="absolute inset-y-0 z-10 flex items-center justify-center whitespace-nowrap border-r border-white/60 px-1.5 text-xs font-bold last:border-r-0 first:rounded-l-lg last:rounded-r-lg"
                style={{
                  left: `${pct(s)}%`,
                  width: `${Math.max(pct(e) - pct(s), 0)}%`,
                  backgroundColor: `${color.light}40`,
                  color: color.dark,
                }}
              >
                {p.family_branch}
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
                    className="absolute flex h-7 items-center overflow-hidden truncate rounded-full border px-3 text-xs font-semibold"
                    style={{
                      left: `${pct(b.start)}%`,
                      width: `${Math.max(pct(b.end) - pct(b.start), 8)}%`,
                      top: `${laneIdx * 34}px`,
                      backgroundColor: `${color.light}40`,
                      borderColor: color.light,
                      color: color.dark,
                    }}
                  >
                    {b.label}
                  </div>
                );
              }),
            )}
          </div>
        )}
      </div>

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
