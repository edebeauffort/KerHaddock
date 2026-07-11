"use client";

import { useActionState, useState } from "react";
import { updateUser, deleteUser, type UserActionState } from "./actions";
import { FAMILY_BRANCHES } from "@/lib/familyBranches";

type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  family_branch: string | null;
  role: string;
};

const initialState: UserActionState = {};

const ROLE_LABELS: Record<string, string> = {
  host: "Hôte",
  guest: "Invité",
};

export default function UserRow({
  user,
  isSelf,
}: {
  user: User;
  isSelf: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    updateUser,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteUser,
    initialState,
  );

  if (editing) {
    return (
      <li className="rounded border border-slate-200 bg-slate-50 p-3">
        <form action={updateAction} className="space-y-3">
          <input type="hidden" name="userId" value={user.id} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium">Prénom</label>
              <input
                type="text"
                name="firstName"
                defaultValue={user.first_name ?? ""}
                required
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium">Nom</label>
              <input
                type="text"
                name="lastName"
                defaultValue={user.last_name ?? ""}
                required
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium">
                Branche familiale
              </label>
              <select
                name="familyBranch"
                defaultValue={user.family_branch ?? ""}
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-sm"
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
              <label className="block text-xs font-medium">Rôle</label>
              <select
                name="role"
                defaultValue={user.role}
                disabled={isSelf}
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-sm"
              >
                <option value="guest">Invité</option>
                <option value="host">Hôte</option>
              </select>
              {isSelf && (
                <p className="mt-1 text-xs text-slate-400">
                  Vous ne pouvez pas changer votre propre rôle.
                </p>
              )}
            </div>
          </div>

          {updateState.error && (
            <p className="text-xs text-red-600">{updateState.error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updatePending}
              className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              {updatePending ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs"
            >
              Annuler
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white p-3 text-sm">
      <div>
        <span className="font-medium">
          {user.first_name} {user.last_name}
        </span>{" "}
        <span className="text-slate-500">
          — {user.email} — {user.family_branch ?? "branche non définie"} —{" "}
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-slate-600 underline"
        >
          Modifier
        </button>
        {!isSelf && (
          <form action={deleteAction}>
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              disabled={deletePending}
              onClick={(e) => {
                if (
                  !confirm(
                    `Supprimer ${user.first_name} ${user.last_name} ? Cela supprime aussi ses réservations.`,
                  )
                )
                  e.preventDefault();
              }}
              className="text-xs text-red-600 underline disabled:opacity-50"
            >
              {deletePending ? "Suppression…" : "Supprimer"}
            </button>
          </form>
        )}
      </div>
      {deleteState.error && (
        <p className="w-full text-xs text-red-600">{deleteState.error}</p>
      )}
    </li>
  );
}
