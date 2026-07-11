"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserActionState = {
  error?: string;
  success?: boolean;
};

// Every action re-checks the caller is a host itself — never trust the UI,
// since a server action can be invoked directly regardless of what's shown.
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

  return { ok: true as const, userId: user.id };
}

export async function createUser(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const check = await requireHost();
  if (!check.ok) return { error: check.error };

  const email = (formData.get("email") as string)?.trim();
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const familyBranch = (formData.get("familyBranch") as string) || null;
  const role = (formData.get("role") as string) || "guest";

  if (!email || !firstName || !lastName) {
    return { error: "L'email, le prénom et le nom sont requis." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      first_name: firstName,
      last_name: lastName,
      family_branch: familyBranch,
      role,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // handle_new_user() already sets these from the invite metadata above —
  // this is just belt-and-braces in case that ever falls out of sync.
  if (data.user) {
    await admin
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        family_branch: familyBranch,
        role,
      })
      .eq("id", data.user.id);
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUser(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const check = await requireHost();
  if (!check.ok) return { error: check.error };

  const userId = formData.get("userId") as string;
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const familyBranch = (formData.get("familyBranch") as string) || null;
  const role = formData.get("role") as string;

  if (!userId || !firstName || !lastName) {
    return { error: "Le prénom et le nom sont requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      family_branch: familyBranch,
      role,
    })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const check = await requireHost();
  if (!check.ok) return { error: check.error };

  const userId = formData.get("userId") as string;

  if (userId === check.userId) {
    return { error: "Vous ne pouvez pas vous supprimer vous-même." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
