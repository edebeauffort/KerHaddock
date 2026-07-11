"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AccountActionState = {
  error?: string;
  success?: boolean;
};

export async function updateOwnProfile(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté." };
  }

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const familyBranch = (formData.get("familyBranch") as string) || null;

  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont requis." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      family_branch: familyBranch,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  revalidatePath("/");
  return { success: true };
}
