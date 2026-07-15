"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getHistoricalWeatherSummary } from "@/lib/weather";

export type MemoryActionState = {
  error?: string;
  success?: boolean;
  memoryId?: string;
};

const PHOTO_SLOTS = ["photo1", "photo2", "photo3"] as const;

// Uploads whichever of the 3 named photo slots have a real file attached,
// returning their storage paths in slot order. A per-slot index suffix
// keeps the 3 uploads from colliding when they land in the same
// millisecond (Date.now() alone isn't unique enough for 3 uploads fired
// back to back).
async function uploadPhotoSlots(
  supabase: SupabaseClient,
  formData: FormData,
  userId: string,
): Promise<{ paths: (string | null)[]; error?: string }> {
  const paths: (string | null)[] = [];
  for (let i = 0; i < PHOTO_SLOTS.length; i++) {
    const file = formData.get(PHOTO_SLOTS[i]) as File | null;
    if (!file || file.size === 0) {
      paths.push(null);
      continue;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${Date.now()}-${i}.${ext}`;
    const { error } = await supabase.storage
      .from("memories")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) {
      return { paths, error: `Échec de l'envoi de la photo : ${error.message}` };
    }
    paths.push(path);
  }
  return { paths };
}

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

  if (!startDate || !endDate) {
    return { error: "Dates de séjour manquantes." };
  }

  const { paths, error: uploadError } = await uploadPhotoSlots(supabase, formData, user.id);
  if (uploadError) return { error: uploadError };
  // Slots are positional in the picker (1 = big cover), but stored
  // compacted — an empty middle slot shouldn't leave a gap.
  const photoPaths = paths.filter((p): p is string => !!p);

  const weatherSummary = await getHistoricalWeatherSummary(startDate, endDate);

  const { data, error } = await supabase
    .from("memories")
    .insert({
      house_id: houseId,
      date_range: `[${startDate},${endDate})`,
      google_photos_url: googlePhotosUrl,
      cover_photo_path: photoPaths[0] ?? null,
      photo_paths: photoPaths,
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
  const participantIds = formData.getAll("participantIds") as string[];
  const googlePhotosUrl = (formData.get("googlePhotosUrl") as string)?.trim() || null;
  const anecdote = (formData.get("anecdote") as string)?.trim() || null;
  const otherGuestsCount = Math.max(0, Number(formData.get("otherGuestsCount")) || 0);

  if (!startDate || !endDate) {
    return { error: "Dates de séjour manquantes." };
  }

  const { data: existing } = await supabase
    .from("memories")
    .select("photo_paths, cover_photo_path")
    .eq("id", memoryId)
    .single();
  const existingPaths: (string | null)[] = existing?.photo_paths?.length
    ? existing.photo_paths
    : existing?.cover_photo_path
      ? [existing.cover_photo_path]
      : [];

  const { paths: newPaths, error: uploadError } = await uploadPhotoSlots(supabase, formData, user.id);
  const removedPaths: string[] = [];
  // Per slot: a new upload replaces it, an explicit "clear" flag empties
  // it, otherwise the existing photo (if any) stays as-is.
  const mergedPaths = PHOTO_SLOTS.map((_slot, i) => {
    if (newPaths[i]) {
      if (existingPaths[i]) removedPaths.push(existingPaths[i] as string);
      return newPaths[i];
    }
    const isCleared = formData.get(`clearPhoto${i + 1}`) === "1";
    if (isCleared) {
      if (existingPaths[i]) removedPaths.push(existingPaths[i] as string);
      return null;
    }
    return existingPaths[i] ?? null;
  });
  if (uploadError) return { error: uploadError };

  const photoPaths = mergedPaths.filter((p): p is string => !!p);

  const update: Record<string, unknown> = {
    date_range: `[${startDate},${endDate})`,
    participant_ids: participantIds,
    google_photos_url: googlePhotosUrl,
    anecdote,
    other_guests_count: otherGuestsCount,
    weather_summary: await getHistoricalWeatherSummary(startDate, endDate),
    cover_photo_path: photoPaths[0] ?? null,
    photo_paths: photoPaths,
  };

  const { error } = await supabase
    .from("memories")
    .update(update)
    .eq("id", memoryId);

  if (error) return { error: error.message };

  if (removedPaths.length > 0) {
    await supabase.storage.from("memories").remove(removedPaths);
  }

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
    .select("cover_photo_path, photo_paths")
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

  // Best-effort cleanup — leftover files in storage aren't worth failing
  // the whole delete over.
  const allPaths = Array.from(
    new Set([...(memory?.photo_paths ?? []), memory?.cover_photo_path].filter((p): p is string => !!p)),
  );
  if (allPaths.length > 0) {
    await supabase.storage.from("memories").remove(allPaths);
  }

  revalidatePath("/");
  revalidatePath("/memories");
  return { success: true };
}
