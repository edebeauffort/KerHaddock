"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Family members are invited by an admin from the Supabase dashboard;
  // this just lets them set/reset their own password afterwards. The
  // redirectTo must also be added to Supabase's Redirect URLs allow list
  // (Authentication -> URL Configuration) or Supabase silently ignores it.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/update-password`,
  });

  if (error) {
    // Surface it instead of always claiming success — the most common
    // cause is Supabase's built-in mailer, which caps ALL auth emails
    // (invite + reset + confirmation combined) at 2/hour and is meant for
    // testing only. See the README's "Set up email" section for how to
    // switch to a custom SMTP provider (Resend) and lift that limit.
    console.error("resetPasswordForEmail failed:", error.message);
    redirect(`/login?resetError=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?reset=1");
}
