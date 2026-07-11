"use client";

import { useActionState } from "react";
import { createUser, type UserActionState } from "./actions";
import { FAMILY_BRANCHES } from "@/lib/familyBranches";

const initialState: UserActionState = {};

export default function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    createUser,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-lg font-semibold">Inviter quelqu&apos;un</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Prénom</label>
          <input
            type="text"
            name="firstName"
            required
            className="mt-1 w-full rounded border border-slate-300 p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Nom</label>
          <input
            type="text"
            name="lastName"
            required
            className="mt-1 w-full rounded border border-slate-300 p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          name="email"
          required
          className="mt-1 w-full rounded border border-slate-300 p-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">
            Branche familiale
          </label>
          <select
            name="familyBranch"
            defaultValue=""
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
          <select
            name="role"
            defaultValue="guest"
            className="mt-1 w-full rounded border border-slate-300 p-2"
          >
            <option value="guest">Invité</option>
            <option value="host">Hôte</option>
          </select>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-green-600">
          Invitation envoyée par email.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer l'invitation"}
      </button>
    </form>
  );
}
