"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addDays, format } from "date-fns";
import { FAMILY_BRANCHES } from "@/lib/familyBranches";

export type PriorityPeriodActionState = {
  error?: string;
  success?: boolean;
};

async function requireHost() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Vous devez être connecté." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "host") {
    return { ok: false as const, error: "Réservé aux hôtes." };
  }

  return { ok: true as const };
}

// One fortnight (14 nights, matching the daterange's exclusive upper bound).
const FORTNIGHT_NIGHTS = 14;

export async function setPriorityPeriod(
  _prevState: PriorityPeriodActionState,
  formData: FormData,
): Promise<PriorityPeriodActionState> {
  const check = await requireHost();
  if (!check.ok) return { error: check.error };

  const familyBranch = formData.get("familyBranch") as string;
  const year = Number(formData.get("year"));
  const startDate = formData.get("startDate") as string;

  if (!familyBranch || !(FAMILY_BRANCHES as readonly string[]).includes(familyBranch)) {
    return { error: "Branche familiale invalide." };
  }

  if (!year || !startDate) {
    return { error: "Choisissez une année et une date de début." };
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = addDays(start, FORTNIGHT_NIGHTS);
  const endDate = format(end, "yyyy-MM-dd");

  const supabase = await createClient();
  const { error } = await supabase.from("priority_periods").upsert(
    {
      family_branch: familyBranch,
      year,
      date_range: `[${startDate},${endDate})`,
    },
    { onConflict: "family_branch,year" },
  );

  if (error) {
    // 23P01 = exclusion_violation — overlaps another branch's period that year.
    if (error.code === "23P01") {
      return {
        error: "Ces dates chevauchent la période prioritaire d'une autre branche.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deletePriorityPeriod(
  _prevState: PriorityPeriodActionState,
  formData: FormData,
): Promise<PriorityPeriodActionState> {
  const check = await requireHost();
  if (!check.ok) return { error: check.error };

  const id = formData.get("id") as string;
  if (!id) return { error: "Rien à supprimer." };

  const supabase = await createClient();
  const { error } = await supabase.from("priority_periods").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
