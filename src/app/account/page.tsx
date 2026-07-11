import { createClient } from "@/lib/supabase/server";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, first_name, last_name, family_branch, role")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Mon compte</h1>
      <AccountForm
        email={profile?.email ?? user?.email ?? null}
        firstName={profile?.first_name ?? null}
        lastName={profile?.last_name ?? null}
        familyBranch={profile?.family_branch ?? null}
        role={profile?.role ?? "guest"}
      />
    </div>
  );
}
