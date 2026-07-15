import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseMemoryRange, memoryPhotoUrl } from "@/lib/memories";
import EditMemoryForm from "./EditMemoryForm";

export default async function EditMemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: memory } = await supabase
    .from("memories")
    .select("id, date_range, google_photos_url, anecdote, other_guests_count, cover_photo_path")
    .eq("id", id)
    .single();

  if (!memory) notFound();

  const range = parseMemoryRange(memory.date_range);
  const coverPhotoUrl = memoryPhotoUrl(supabase, memory.cover_photo_path);

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Modifier le souvenir</h1>
      <EditMemoryForm
        memoryId={memory.id}
        initialStartISO={range?.start ?? ""}
        initialEndISO={range?.end ?? ""}
        initialGooglePhotosUrl={memory.google_photos_url}
        initialAnecdote={memory.anecdote}
        initialOtherGuestsCount={memory.other_guests_count ?? 0}
        initialCoverPhotoUrl={coverPhotoUrl}
      />
    </div>
  );
}
