"use client";

import { useActionState, useMemo, useState } from "react";
import {
  setPriorityPeriod,
  deletePriorityPeriod,
  type PriorityPeriodActionState,
} from "./priority-periods-actions";
import { FAMILY_BRANCHES } from "@/lib/familyBranches";

type Period = {
  id: string;
  family_branch: string;
  year: number;
  date_range: string;
};

const initialState: PriorityPeriodActionState = {};

// Postgres returns daterange as e.g. "[2026-07-05,2026-07-19)" — we only
// need the start date to prefill the form and the end date to display it.
function parseRange(range: string) {
  const match = range.match(/\[([\d-]+),([\d-]+)\)/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

function formatFr(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function BranchRow({ branch, period, year }: { branch: string; period?: Period; year: number }) {
  const [state, formAction, pending] = useActionState(setPriorityPeriod, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deletePriorityPeriod,
    initialState,
  );

  const range = period ? parseRange(period.date_range) : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{branch}</h3>
        {range && (
          <span className="text-sm text-slate-600">
            Du {formatFr(range.start)} au {formatFr(range.end)} {year}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="familyBranch" value={branch} />
          <input type="hidden" name="year" value={year} />
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Date de début (14 nuits)
            </label>
            <input
              type="date"
              name="startDate"
              defaultValue={range?.start}
              required
              className="mt-1 rounded border border-slate-300 p-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {pending ? "Enregistrement…" : range ? "Mettre à jour" : "Définir"}
          </button>
        </form>

        {period && (
          <form action={deleteAction}>
            <input type="hidden" name="id" value={period.id} />
            <button
              type="submit"
              disabled={deletePending}
              className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
            >
              {deletePending ? "Suppression…" : "Supprimer"}
            </button>
          </form>
        )}
      </div>

      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {deleteState.error && (
        <p className="mt-2 text-sm text-red-600">{deleteState.error}</p>
      )}
    </div>
  );
}

export default function PriorityPeriodsManager({ periods }: { periods: Period[] }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const years = useMemo(
    () => [currentYear, currentYear + 1, currentYear + 2],
    [currentYear],
  );

  const periodsForYear = useMemo(
    () => periods.filter((p) => p.year === year),
    [periods, year],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Périodes prioritaires</h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded border border-slate-300 p-1 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-slate-600">
        Chaque branche familiale peut avoir une quinzaine prioritaire en juillet-août.
        Une réservation d&apos;une autre branche sur ces dates devra être approuvée par
        un membre de la famille concernée.
      </p>

      <div className="space-y-3">
        {FAMILY_BRANCHES.map((branch) => (
          <BranchRow
            key={branch}
            branch={branch}
            year={year}
            period={periodsForYear.find((p) => p.family_branch === branch)}
          />
        ))}
      </div>
    </div>
  );
}
