import Image from "next/image";
import Link from "next/link";
import { parseMemoryRange, type MemoryRow } from "@/lib/memories";
import ParticipantAvatars from "./ParticipantAvatars";

type Person = { id: string; first_name: string | null; family_branch: string | null };

// A small "this week, N years ago" reminder — deliberately kept much
// smaller than a regular memory card, with the cover photo as a thumbnail
// (instead of a generic pin icon) and the participants who were there.
export default function SeasonalHighlightCard({
  memory,
  photoUrl,
  participants,
}: {
  memory: MemoryRow;
  photoUrl: string | null;
  participants: Person[];
}) {
  const range = parseMemoryRange(memory.date_range);
  if (!range) return null;

  const yearsAgo = new Date().getFullYear() - new Date(`${range.start}T00:00:00`).getFullYear();
  if (yearsAgo <= 0) return null;

  return (
    <Link
      href={`/memories/${memory.id}`}
      className="flex items-center gap-4 rounded-xl border border-brand-sage bg-brand-mint/15 p-3 transition hover:border-brand-teal"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-28 sm:w-28">
        {photoUrl ? (
          <Image src={photoUrl} alt="" fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-sage to-brand-mint" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">
          Cette semaine, il y a {yearsAgo} an{yearsAgo > 1 ? "s" : ""}
        </p>
        {memory.anecdote && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{memory.anecdote}</p>
        )}
        {participants.length > 0 && (
          <div className="mt-1.5">
            <ParticipantAvatars people={participants} />
          </div>
        )}
      </div>
      <span className="ml-auto shrink-0 text-slate-400">›</span>
    </Link>
  );
}
