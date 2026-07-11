import { createClient } from "@/lib/supabase/server";
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

  const { data: users } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, family_branch, role")
    .order("created_at");

  const { data: priorityPeriods } = await supabase
    .from("priority_periods")
    .select("id, family_branch, year, date_range")
    .order("year");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 p-6">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>
      <UsersManager users={users ?? []} currentUserId={user!.id} />
      <PriorityPeriodsManager periods={priorityPeriods ?? []} />
    </div>
  );
}
