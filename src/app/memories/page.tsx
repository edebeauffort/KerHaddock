import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllMemories, memoryPhotoUrl } from "@/lib/memories";
import { getNextStay } from "@/lib/nextStay";
import { parseMemoryRange } from "@/lib/memories";
import MemoryCard from "./MemoryCard";
import NoMemoryCard from "./NoMemoryCard";

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Souvenirs</h1>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {memories.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              photoUrl={memoryPhotoUrl(supabase, m.cover_photo_path)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
