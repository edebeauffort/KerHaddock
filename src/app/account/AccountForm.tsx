"use client";

import { useActionState } from "react";
import { updateOwnProfile, type AccountActionState } from "./actions";
import { FAMILY_BRANCHES } from "@/lib/familyBranches";

const initialState: AccountActionState = {};

const ROLE_LABELS: Record<string, string> = {
  host: "Hôte",
  guest: "Invité",
};

export default function AccountForm({
  email,
  firstName,
  lastName,
  familyBranch,
  role,
}: {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  familyBranch: string | null;
  role: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateOwnProfile,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-4"
    >
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email ?? ""}
          disabled
          className="mt-1 w-full rounded border border-slate-200 bg-slate-50 p-2 text-slate-500"
        />
        <p className="mt-1 text-xs text-slate-400">
          L&apos;email de connexion ne peut pas être modifié ici.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Prénom</label>
          <input
            type="text"
            name="firstName"
            defaultValue={firstName ?? ""}
            required
            className="mt-1 w-full rounded border border-slate-300 p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Nom</label>
          <input
            type="text"
            name="lastName"
            defaultValue={lastName ?? ""}
            required
            className="mt-1 w-full rounded border border-slate-300 p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Branche familiale</label>
        <select
          name="familyBranch"
          defaultValue={familyBranch ?? ""}
          className="mt-1 w-full rounded border border-slate-300 p-2"
        >
          <option value="">— Choisir —</option>
          {FAMILY_BRANCHES.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Rôle</label>
        <input
          type="text"
          value={ROLE_LABELS[role] ?? role}
          disabled
          className="mt-1 w-full rounded border border-slate-200 bg-slate-50 p-2 text-slate-500"
        />
        <p className="mt-1 text-xs text-slate-400">
          Seul un hôte peut changer les rôles (page Utilisateurs).
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-green-600">Profil mis à jour.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
