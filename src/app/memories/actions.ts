"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHistoricalWeatherSummary } from "@/lib/weather";

export type MemoryActionState = {
  error?: string;
  success?: boolean;
  memoryId?: string;
};

export async function createMemory(
  _prevState: MemoryActionState,
  formData: FormData,
): Promise<MemoryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const houseId = (formData.get("houseId") as string) || null;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const participantIds = formData.getAll("participantIds") as string[];
  const otherGuestsCount = Math.max(0, Number(formData.get("otherGuestsCount")) || 0);
  const googlePhotosUrl = (formData.get("googlePhotosUrl") as string)?.trim() || null;
  const anecdote = (formData.get("anecdote") as string)?.trim() || null;
  const coverPhoto = formData.get("coverPhoto") as File | null;

  if (!startDate || !endDate) {
    return { error: "Dates de séjour manquantes." };
  }

  let coverPhotoPath: string | null = null;
  if (coverPhoto && coverPhoto.size > 0) {
    const ext = coverPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("memories")
      .upload(path, coverPhoto, {
        contentType: coverPhoto.type || undefined,
        upsert: false,
      });
    if (uploadError) {
      return { error: `Échec de l'envoi de la photo : ${uploadError.message}` };
    }
    coverPhotoPath = path;
  }

  const weatherSummary = await getHistoricalWeatherSummary(startDate, endDate);

  const { data, error } = await supabase
    .from("memories")
    .insert({
      house_id: houseId,
      date_range: `[${startDate},${endDate})`,
      google_photos_url: googlePhotosUrl,
      cover_photo_path: coverPhotoPath,
      anecdote,
      weather_summary: weatherSummary,
      participant_ids: participantIds,
      other_guests_count: otherGuestsCount,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/memories");
  return { success: true, memoryId: data.id };
}

export async function updateMemory(
  _prevState: MemoryActionState,
  formData: FormData,
): Promise<MemoryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const memoryId = formData.get("memoryId") as string;
  const startDate = (formData.get("startDate") as string) || "";
  const endDate = (formData.get("endDate") as string) || "";
  const googlePhotosUrl = (formData.get("googlePhotosUrl") as string)?.trim() || null;
  const anecdote = (formData.get("anecdote") as string)?.trim() || null;
  const otherGuestsCount = Math.max(0, Number(formData.get("otherGuestsCount")) || 0);
  const coverPhoto = formData.get("coverPhoto") as File | null;

  if (!startDate || !endDate) {
    return { error: "Dates de séjour manquantes." };
  }

  const update: Record<string, unknown> = {
    date_range: `[${startDate},${endDate})`,
    google_photos_url: googlePhotosUrl,
    anecdote,
    other_guests_count: otherGuestsCount,
    weather_summary: await getHistoricalWeatherSummary(startDate, endDate),
  };

  if (coverPhoto && coverPhoto.size > 0) {
    const ext = coverPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("memories")
      .upload(path, coverPhoto, {
        contentType: coverPhoto.type || undefined,
        upsert: false,
      });
    if (uploadError) {
      return { error: `Échec de l'envoi de la photo : ${uploadError.message}` };
    }
    update.cover_photo_path = path;
  }

  const { error } = await supabase
    .from("memories")
    .update(update)
    .eq("id", memoryId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/memories");
  revalidatePath(`/memories/${memoryId}`);
  return { success: true, memoryId };
}

export async function deleteMemory(
  _prevState: MemoryActionState,
  formData: FormData,
): Promise<MemoryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const memoryId = formData.get("memoryId") as string;
  if (!memoryId) return { error: "Souvenir introuvable." };

  const { data: memory } = await supabase
    .from("memories")
    .select("cover_photo_path")
    .eq("id", memoryId)
    .single();

  // RLS silently filters out rows the caller isn't allowed to touch rather
  // than erroring, so an empty `data` means "not permitted", not "already
  // gone" — .select() on the delete is what makes that distinguishable.
  const { data: deleted, error } = await supabase
    .from("memories")
    .delete()
    .eq("id", memoryId)
    .select("id");

  if (error) return { error: error.message };
  if (!deleted || deleted.length === 0) {
    return { error: "Vous ne pouvez supprimer que vos propres souvenirs (ou être hôte)." };
  }

  // Best-effort cleanup — a leftover file in storage isn't worth failing the
  // whole delete over.
  if (memory?.cover_photo_path) {
    await supabase.storage.from("memories").remove([memory.cover_photo_path]);
  }

  revalidatePath("/");
  revalidatePath("/memories");
  return { success: true };
}
