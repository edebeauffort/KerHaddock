import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllStays, type AggregatedStay } from "@/lib/nextStay";
import { getAllMemories, parseMemoryRange } from "@/lib/memories";
import { formatDateRangeFr, monthYearLabel } from "@/lib/formatDateRange";
import NewMemoryStepper from "./NewMemoryStepper";

type Profile = { id: string; first_name: string | null; family_branch: string | null };

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

export default async function NewMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start } = await searchParams;
  const supabase = await createClient();

  const [stays, memories] = await Promise.all([
    getAllStays(supabase),
    getAllMemories(supabase),
  ]);

  const staysWithoutMemory = stays.filter(
    (s) =>
      !memories.some((m) => {
        const range = parseMemoryRange(m.date_range);
        return range && rangesOverlap(s.startISO, s.endISO, range.start, range.end);
      }),
  );

  if (staysWithoutMemory.length === 0) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Tous les séjours ont déjà leur souvenir
        </h1>
        <p className="text-sm text-slate-500">
          {stays.length === 0
            ? "Un souvenir se rattache à un séjour réservé — réservez d'abord vos dates."
            : "Chaque séjour réservé a déjà un souvenir associé."}
        </p>
        <Link
          href={stays.length === 0 ? "/bookings" : "/memories"}
          className="inline-block rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal-dark"
        >
          {stays.length === 0 ? "Aller aux réservations" : "Voir les souvenirs"}
        </Link>
      </div>
    );
  }

  const selected: AggregatedStay | undefined =
    (start && staysWithoutMemory.find((s) => s.startISO === start)) ||
    (staysWithoutMemory.length === 1 ? staysWithoutMemory[0] : undefined);

  if (!selected) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Quel séjour ?</h1>
        <p className="text-sm text-slate-500">
          Choisissez le séjour pour lequel ajouter un souvenir.
        </p>
        <ul className="space-y-2">
          {staysWithoutMemory.map((s) => (
            <li key={s.startISO}>
              <Link
                href={`/memories/new?start=${s.startISO}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition hover:border-brand-teal hover:bg-brand-mint/10"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    {monthYearLabel(s.startISO)}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {formatDateRangeFr(s.startISO, s.endISO)}
                  </span>
                </span>
                <span className="text-slate-400">›</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, family_branch")
    .in("id", selected.participantIds);

  return (
    <NewMemoryStepper
      houseId={selected.houseId}
      startISO={selected.startISO}
      endISO={selected.endISO}
      participants={(profiles ?? []) as Profile[]}
    />
  );
}
