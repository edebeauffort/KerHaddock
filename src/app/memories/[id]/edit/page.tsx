import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    .select("id, google_photos_url, anecdote")
    .eq("id", id)
    .single();

  if (!memory) notFound();

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Modifier le souvenir</h1>
      <EditMemoryForm
        memoryId={memory.id}
        initialGooglePhotosUrl={memory.google_photos_url}
        initialAnecdote={memory.anecdote}
      />
    </div>
  );
}
