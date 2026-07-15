import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllMemories, memoryPhotoUrls, parseMemoryRange, type MemoryRow } from "@/lib/memories";
import { getNextStay } from "@/lib/nextStay";
import MemoryCard from "./MemoryCard";
import NoMemoryCard from "./NoMemoryCard";

type Profile = { id: string; first_name: string | null; family_branch: string | null };

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

// Memories arrive already sorted most-recent-first; group them by the year
// their stay started, keeping that same order both across and within years.
function groupByYear(memories: MemoryRow[]): [number, MemoryRow[]][] {
  const groups = new Map<number, MemoryRow[]>();
  for (const m of memories) {
    const range = parseMemoryRange(m.date_range);
    const year = range ? new Date(`${range.start}T00:00:00`).getFullYear() : 0;
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(m);
  }
  return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
}

export default async function MemoriesArchivePage() {
  const supabase = await createClient();
  const [memories, stay] = await Promise.all([
    getAllMemories(supabase),
    getNextStay(supabase),
  ]);

  const hasMemoryForStay =
    !!stay &&
    memories.some((m) => {
      const range = parseMemoryRange(m.date_range);
      return range && rangesOverlap(stay.startISO, stay.endISO, range.start, range.end);
    });

  // Participant profiles for every memory shown here, fetched once.
  const participantIds = Array.from(new Set(memories.flatMap((m) => m.participant_ids)));
  const { data: memoryProfiles } = participantIds.length
    ? await supabase.from("profiles").select("id, first_name, family_branch").in("id", participantIds)
    : { data: [] as Profile[] };
  const profileById = new Map((memoryProfiles ?? []).map((p) => [p.id, p as Profile]));
  const participantsFor = (ids: string[]) =>
    ids.map((id) => profileById.get(id)).filter((p): p is Profile => !!p);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Livre d&apos;or</h1>
          <p className="mt-1 text-sm text-slate-500">
            L&apos;histoire de L&apos;Île d&apos;Yeu, séjour après séjour.
          </p>
        </div>
        <Link
          href="/memories/new"
          className="shrink-0 rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-teal-dark"
        >
          + Ajouter un souvenir
        </Link>
      </div>

      {stay && !hasMemoryForStay && (
        <NoMemoryCard startISO={stay.startISO} endISO={stay.endISO} />
      )}

      {memories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Aucun souvenir pour le moment.
        </p>
      ) : (
        <div className="space-y-8">
          {groupByYear(memories).map(([year, yearMemories]) => (
            <div key={year}>
              <div className="mb-4 flex items-center gap-4">
                <h2 className="text-xl font-bold text-slate-900">{year}</h2>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {yearMemories.map((m) => (
                  <MemoryCard
                    key={m.id}
                    memory={m}
                    photoUrls={memoryPhotoUrls(supabase, m)}
                    participants={participantsFor(m.participant_ids)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
