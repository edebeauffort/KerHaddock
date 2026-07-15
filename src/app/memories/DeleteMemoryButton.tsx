"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMemory, type MemoryActionState } from "./actions";

const initialState: MemoryActionState = {};

export default function DeleteMemoryButton({ memoryId }: { memoryId: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: MemoryActionState, formData: FormData) => {
      const result = await deleteMemory(prev, formData);
      if (result.success) router.push("/memories");
      return result;
    },
    initialState,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-red-600 hover:border-red-300 hover:bg-red-50"
      >
        🗑 Supprimer
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setConfirmOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">
              Supprimer ce souvenir ?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              La photo, l&apos;anecdote et le lien d&apos;album seront
              définitivement supprimés. Cette action ne peut pas être annulée.
            </p>

            {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Retour
              </button>
              <form action={formAction}>
                <input type="hidden" name="memoryId" value={memoryId} />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {pending ? "Suppression…" : "Oui, supprimer"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
