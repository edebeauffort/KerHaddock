import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getNextStay } from "@/lib/nextStay";
import { getCurrentWeather } from "@/lib/weather";
import { getHeroImages } from "@/lib/heroImages";
import {
  getAllMemories,
  memoryPhotoUrl,
  parseMemoryRange,
  findSeasonalHighlight,
} from "@/lib/memories";
import HeroCarousel from "./HeroCarousel";
import NextStayCard from "./NextStayCard";
import WeatherCard from "./WeatherCard";
import WebcamCard from "./WebcamCard";
import MemoryHero from "./memories/MemoryHero";
import MemoryCard from "./memories/MemoryCard";
import NoMemoryCard from "./memories/NoMemoryCard";
import SeasonalHighlightCard from "./memories/SeasonalHighlightCard";

type Profile = { id: string; first_name: string | null; family_branch: string | null };

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

export default async function Home() {
  const supabase = await createClient();

  const [stay, weather, memories] = await Promise.all([
    getNextStay(supabase),
    getCurrentWeather(),
    getAllMemories(supabase),
  ]);

  const { data: bookedByProfile } = stay
    ? await supabase
        .from("profiles")
        .select("id, first_name, family_branch")
        .eq("id", stay.bookedByUserId)
        .single()
    : { data: null as Profile | null };
  const bookedByName = bookedByProfile?.first_name ?? null;

  const hasMemoryForStay =
    !!stay &&
    memories.some((m) => {
      const range = parseMemoryRange(m.date_range);
      return range && rangesOverlap(stay.startISO, stay.endISO, range.start, range.end);
    });

  const heroMemory = memories[0] ?? null;
  const gridMemories = memories.slice(1, 7);
  const highlight = stay ? findSeasonalHighlight(memories, stay.startISO) : null;
  const showHighlight = highlight && highlight.id !== heroMemory?.id;

  // Participant profiles for every memory shown on this page, fetched once
  // (the highlight can point at a memory outside the first-7 grid slice).
  const memoryParticipantIds = Array.from(
    new Set([
      ...memories.slice(0, 7).flatMap((m) => m.participant_ids),
      ...(highlight?.participant_ids ?? []),
    ]),
  );
  const { data: memoryProfiles } = memoryParticipantIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, family_branch")
        .in("id", memoryParticipantIds)
    : { data: [] as Profile[] };
  const memoryProfileById = new Map((memoryProfiles ?? []).map((p) => [p.id, p as Profile]));
  const participantsFor = (ids: string[]) =>
    ids.map((id) => memoryProfileById.get(id)).filter((p): p is Profile => !!p);

  const heroImages = getHeroImages();

  return (
    <div className="w-full">
      {/* Hero carousel fills most of the first screen; page content starts
          just above the fold so it peeks into view on load, inviting a
          scroll rather than sitting on top of the photo. */}
      <div className="relative h-[88vh] min-h-[480px] w-full">
        <HeroCarousel images={heroImages} />
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-24 text-center sm:pb-32">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg sm:text-5xl">
            L&apos;Île d&apos;Yeu
          </h1>
          <p className="mt-3 max-w-xl text-lg text-white drop-shadow-lg">
            Tout ce qu&apos;il faut savoir sur nos vacances, en un seul
            endroit.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-10 p-6">
      {/* Pulled up over the hero so the cards sit roughly half on the
          photo, half below the fold. */}
      <div className="relative z-10 -mt-24 grid grid-cols-1 gap-4 sm:-mt-28 sm:grid-cols-3">
        <NextStayCard stay={stay} bookedByName={bookedByName} />
        <WeatherCard weather={weather} />
        <WebcamCard />
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Souvenirs</h2>
            <p className="mt-1 text-sm text-slate-500">
              L&apos;histoire de L&apos;Île d&apos;Yeu, séjour après séjour.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/memories/new"
              className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-teal-dark"
            >
              + Ajouter un souvenir
            </Link>
            {memories.length > 0 && (
              <Link
                href="/memories"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-brand-mint hover:text-slate-900"
              >
                Tout voir →
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {stay && !hasMemoryForStay && (
            <NoMemoryCard startISO={stay.startISO} endISO={stay.endISO} />
          )}

          {showHighlight && highlight && (
            <SeasonalHighlightCard
              memory={highlight}
              photoUrl={memoryPhotoUrl(supabase, highlight.cover_photo_path)}
              participants={participantsFor(highlight.participant_ids)}
            />
          )}

          {heroMemory ? (
            <MemoryHero
              memory={heroMemory}
              photoUrl={memoryPhotoUrl(supabase, heroMemory.cover_photo_path)}
              participants={participantsFor(heroMemory.participant_ids)}
            />
          ) : (
            !stay && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                Aucun souvenir pour le moment.
              </p>
            )
          )}

          {gridMemories.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {gridMemories.map((m) => (
                <MemoryCard
                  key={m.id}
                  memory={m}
                  photoUrl={memoryPhotoUrl(supabase, m.cover_photo_path)}
                  participants={participantsFor(m.participant_ids)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
