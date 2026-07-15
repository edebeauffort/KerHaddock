import type { SupabaseClient } from "@supabase/supabase-js";

export type MemoryRow = {
  id: string;
  house_id: string | null;
  date_range: string;
  google_photos_url: string | null;
  cover_photo_path: string | null;
  photo_paths: string[];
  anecdote: string | null;
  weather_summary: string | null;
  participant_ids: string[];
  other_guests_count: number;
  created_by: string | null;
  created_at: string;
};

export function parseMemoryRange(range: string): { start: string; end: string } | null {
  const match = range.match(/\[(.+),(.+)\)/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

export function memoryPhotoUrl(
  supabase: SupabaseClient,
  path: string | null,
): string | null {
  if (!path) return null;
  return supabase.storage.from("memories").getPublicUrl(path).data.publicUrl;
}

// Public URLs for every photo on a memory, in slot order (the first one is
// the "big" cover photo). Falls back to the legacy single cover_photo_path
// for memories saved before multi-photo support existed.
export function memoryPhotoUrls(
  supabase: SupabaseClient,
  memory: Pick<MemoryRow, "photo_paths" | "cover_photo_path">,
): string[] {
  const paths = memory.photo_paths?.length
    ? memory.photo_paths
    : memory.cover_photo_path
      ? [memory.cover_photo_path]
      : [];
  return paths
    .map((path) => memoryPhotoUrl(supabase, path))
    .filter((url): url is string => !!url);
}

// French season label from a start date, matching how the reference design
// groups memories ("Summer 2025", "Christmas 2024", "Easter 2025"...).
export function seasonLabel(startISO: string): string {
  const d = new Date(`${startISO}T00:00:00`);
  const month = d.getMonth(); // 0-11
  const year = d.getFullYear();
  if (month === 11) return `Noël ${year}`;
  if (month <= 1) return `Hiver ${year}`;
  if (month >= 2 && month <= 4) return `Printemps ${year}`;
  if (month >= 5 && month <= 7) return `Été ${year}`;
  return `Automne ${year}`;
}

export function seasonIcon(startISO: string): string {
  const month = new Date(`${startISO}T00:00:00`).getMonth();
  if (month === 11) return "\u{1F384}"; // christmas tree
  if (month <= 1) return "\u2744\uFE0F"; // snowflake
  if (month >= 2 && month <= 4) return "\u{1F33F}"; // herb/leaf
  if (month >= 5 && month <= 7) return "\u2600\uFE0F"; // sun
  return "\u{1F342}"; // fallen leaf
}

export async function getAllMemories(
  supabase: SupabaseClient,
): Promise<MemoryRow[]> {
  const { data } = await supabase
    .from("memories")
    .select(
      "id, house_id, date_range, google_photos_url, cover_photo_path, photo_paths, anecdote, weather_summary, participant_ids, other_guests_count, created_by, created_at",
    );
  const rows = (data ?? []) as MemoryRow[];
  return rows.sort((a, b) => {
    const ra = parseMemoryRange(a.date_range);
    const rb = parseMemoryRange(b.date_range);
    return (rb?.start ?? "").localeCompare(ra?.start ?? "");
  });
}

// A past memory whose stay falls in the same month-of-year window as the
// given date (typically the viewer's own next/current stay) — "last time
// we were here this season". Picks the most recent match.
export function findSeasonalHighlight(
  memories: MemoryRow[],
  aroundISO: string,
): MemoryRow | null {
  const target = new Date(`${aroundISO}T00:00:00`);
  const targetMonth = target.getMonth();
  const todayISO = new Date().toISOString().slice(0, 10);

  const candidates = memories.filter((m) => {
    const range = parseMemoryRange(m.date_range);
    if (!range || range.end >= todayISO) return false; // only past stays
    const start = new Date(`${range.start}T00:00:00`);
    // "Same period" = within one month either side of the target month.
    const diff = Math.abs(start.getMonth() - targetMonth);
    return diff <= 1 || diff >= 11;
  });

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.date_range.localeCompare(a.date_range))[0];
}
