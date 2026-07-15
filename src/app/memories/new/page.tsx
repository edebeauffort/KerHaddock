import { createClient } from "@/lib/supabase/server";
import { getAllStays, type AggregatedStay } from "@/lib/nextStay";
import { getAllMemories, parseMemoryRange } from "@/lib/memories";
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

  const [stays, memories, { data: houses }, { data: profiles }] = await Promise.all([
    getAllStays(supabase),
    getAllMemories(supabase),
    supabase.from("houses").select("id, name").order("name"),
    supabase.from("profiles").select("id, first_name, family_branch").order("first_name"),
  ]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const hasMemory = (s: AggregatedStay) =>
    memories.some((m) => {
      const range = parseMemoryRange(m.date_range);
      return range && rangesOverlap(s.startISO, s.endISO, range.start, range.end);
    });

  // Default dates: the stay you're currently on, else your most recent past
  // stay, else a blank calendar — but dates stay freely editable either way,
  // so this is just a convenience prefill, not a constraint.
  const availableStays = stays.filter((s) => !hasMemory(s));
  const currentStay = availableStays.find((s) => s.isCurrent);
  const mostRecentPastStay = !currentStay
    ? availableStays.find((s) => s.endISO <= todayISO)
    : undefined;
  // Explicit deep-link from a homepage/archive "no memory yet" prompt for a
  // specific stay takes priority over the general default chain.
  const startParamStay = start ? stays.find((s) => s.startISO === start) : undefined;
  const defaultStay = startParamStay ?? currentStay ?? mostRecentPastStay;

  return (
    <NewMemoryStepper
      allProfiles={(profiles ?? []) as Profile[]}
      initialHouseId={defaultStay?.houseId ?? houses?.[0]?.id ?? null}
      initialStartISO={defaultStay?.startISO ?? ""}
      initialEndISO={defaultStay?.endISO ?? ""}
      initialParticipantIds={defaultStay?.participantIds ?? []}
    />
  );
}
