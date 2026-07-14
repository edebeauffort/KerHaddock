import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import UsersManager from "./UsersManager";
import PriorityPeriodsManager from "./PriorityPeriodsManager";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  if (myProfile?.role !== "host") {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <p className="text-sm text-slate-600">
          Cette page est réservée aux hôtes.
        </p>
      </div>
    );
  }

  // Independent queries — fire together instead of waiting on each in turn.
  const admin = createAdminClient();
  const [{ data: users }, { data: priorityPeriods }, { data: authUsers }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email, family_branch, role")
        .order("created_at"),
      supabase
        .from("priority_periods")
        .select("id, family_branch, year, date_range")
        .order("year"),
      // Auth admin API — the only place "has this invite actually been
      // completed" lives, since it's not part of our own profiles table.
      // A user counts as active once they've signed in at least once,
      // which in this app only happens after they follow the invite link
      // and set a password on /auth/update-password.
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const activeById = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.last_sign_in_at !== null]),
  );
  const usersWithStatus = (users ?? []).map((u) => ({
    ...u,
    active: activeById.get(u.id) ?? false,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 p-6">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>
      <UsersManager users={usersWithStatus} currentUserId={user!.id} />
      <PriorityPeriodsManager periods={priorityPeriods ?? []} />
    </div>
  );
}
