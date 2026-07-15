import Link from "next/link";
import { parseMemoryRange, seasonLabel, seasonIcon, type MemoryRow } from "@/lib/memories";
import { formatDateRangeFr } from "@/lib/formatDateRange";
import ParticipantAvatars from "./ParticipantAvatars";
import MemoryMosaic from "./MemoryMosaic";

type Person = { id: string; first_name: string | null; family_branch: string | null };

// Small grid card used in the archive grid and the homepage's "recent
// memories" row: cover photo, season + dates, title, one-line anecdote.
export default function MemoryCard({
  memory,
  photoUrls,
  participants = [],
}: {
  memory: MemoryRow;
  photoUrls: string[];
  participants?: Person[];
}) {
  const range = parseMemoryRange(memory.date_range);
  if (!range) return null;

  return (
    <Link
      href={`/memories/${memory.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        <MemoryMosaic photoUrls={photoUrls} imageClassName="transition group-hover:scale-105" />
        {memory.google_photos_url && (
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            Album
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>{seasonIcon(range.start)}</span>
          {formatDateRangeFr(range.start, range.end)}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">
          {seasonLabel(range.start)}
        </h3>
        {memory.anecdote && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{memory.anecdote}</p>
        )}
        {participants.length > 0 && (
          <div className="mt-2">
            <ParticipantAvatars people={participants} />
          </div>
        )}
      </div>
    </Link>
  );
}
