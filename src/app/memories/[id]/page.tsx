import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  parseMemoryRange,
  seasonLabel,
  seasonIcon,
  memoryPhotoUrl,
} from "@/lib/memories";
import { formatDateRangeFr } from "@/lib/formatDateRange";
import DeleteMemoryButton from "../DeleteMemoryButton";
import ParticipantAvatars from "../ParticipantAvatars";

type Profile = { id: string; first_name: string | null; family_branch: string | null };

export default async function MemoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: memory }, { data: { user } }] = await Promise.all([
    supabase
      .from("memories")
      .select(
        "id, house_id, date_range, google_photos_url, cover_photo_path, anecdote, weather_summary, participant_ids, other_guests_count, created_by, created_at",
      )
      .eq("id", id)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!memory) notFound();

  const range = parseMemoryRange(memory.date_range);
  if (!range) notFound();

  const profileIds = Array.from(
    new Set([...memory.participant_ids, memory.created_by].filter(Boolean)),
  ) as string[];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, first_name, family_branch").in("id", profileIds)
    : { data: [] as Profile[] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

  const participants = memory.participant_ids
    .map((pid: string) => profileById.get(pid))
    .filter((p: Profile | undefined): p is Profile => !!p);
  const totalParticipants = participants.length + (memory.other_guests_count ?? 0);
  const bookedByName = memory.created_by
    ? profileById.get(memory.created_by)?.first_name ?? null
    : null;

  const photoUrl = memoryPhotoUrl(supabase, memory.cover_photo_path);
  // Any logged-in member can attempt to edit — RLS (author or host) is the
  // real gate, enforced server-side when the edit is actually submitted.
  const canEdit = !!user;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <Link href="/memories" className="text-sm text-slate-500 hover:underline">
        ← Souvenirs
      </Link>

      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>{seasonIcon(range.start)}</span>
          {seasonLabel(range.start)}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">
          {seasonLabel(range.start)}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoCard label="Dates" value={formatDateRangeFr(range.start, range.end)} />
        <InfoCard label="Organisé par" value={bookedByName ?? "—"} />
        <InfoCard label="Météo" value={memory.weather_summary ?? "—"} />
        <InfoCard label="Participants" value={`${totalParticipants} participant${totalParticipants > 1 ? "s" : ""}`} />
      </div>

      {(participants.length > 0 || memory.other_guests_count > 0) && (
        <div className="flex flex-wrap items-center gap-3">
          {participants.length > 0 && <ParticipantAvatars people={participants} size="md" />}
          <p className="text-sm text-slate-600">
            {participants.map((p: Profile) => p.first_name).filter(Boolean).join(", ")}
            {memory.other_guests_count > 0 &&
              (participants.length > 0
                ? ` et ${memory.other_guests_count} autre${memory.other_guests_count > 1 ? "s" : ""} invité${memory.other_guests_count > 1 ? "s" : ""}`
                : `${memory.other_guests_count} invité${memory.other_guests_count > 1 ? "s" : ""}`)}
          </p>
        </div>
      )}

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
        {photoUrl ? (
          <Image src={photoUrl} alt="" fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-sage to-brand-mint" />
        )}
      </div>

      {memory.anecdote && (
        <blockquote className="border-l-4 border-brand-sage pl-4 text-lg italic text-slate-700">
          &ldquo;{memory.anecdote}&rdquo;
        </blockquote>
      )}

      <div className="flex flex-wrap gap-3">
        {memory.google_photos_url && (
          <a
            href={memory.google_photos_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal-dark"
          >
            🖼 Voir l&apos;album Google Photos ↗
          </a>
        )}
        {canEdit && (
          <Link
            href={`/memories/${memory.id}/edit`}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-teal"
          >
            ✏️ Modifier le souvenir
          </Link>
        )}
        {canEdit && <DeleteMemoryButton memoryId={memory.id} />}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
