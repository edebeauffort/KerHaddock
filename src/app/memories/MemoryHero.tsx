import Link from "next/link";
import { parseMemoryRange, seasonLabel, seasonIcon, type MemoryRow } from "@/lib/memories";
import { formatDateRangeFr } from "@/lib/formatDateRange";
import ParticipantAvatars from "./ParticipantAvatars";
import MemoryMosaic from "./MemoryMosaic";

type Person = { id: string; first_name: string | null; family_branch: string | null };

// Big featured card for the most recent memory — photo fills the card,
// title/anecdote/participants sit on a dark gradient at the bottom.
export default function MemoryHero({
  memory,
  photoUrls,
  participants,
}: {
  memory: MemoryRow;
  photoUrls: string[];
  participants: Person[];
}) {
  const range = parseMemoryRange(memory.date_range);
  if (!range) return null;

  return (
    <Link
      href={`/memories/${memory.id}`}
      className="group relative block h-80 w-full overflow-hidden rounded-2xl sm:h-96"
    >
      <MemoryMosaic photoUrls={photoUrls} imageClassName="transition group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/80">
          <span>{seasonIcon(range.start)}</span>
          {formatDateRangeFr(range.start, range.end)}
        </p>
        <h3 className="mt-1 text-2xl font-bold sm:text-3xl">
          {seasonLabel(range.start)}
        </h3>
        {memory.anecdote && (
          <p className="mt-2 max-w-2xl text-sm text-white/90 line-clamp-2 sm:text-base">
            {memory.anecdote}
          </p>
        )}
        {participants.length > 0 && (
          <div className="mt-3">
            <ParticipantAvatars people={participants} />
          </div>
        )}
      </div>
    </Link>
  );
}
