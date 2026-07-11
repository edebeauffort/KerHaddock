"use client";

import { useActionState, useEffect, useState } from "react";
import { cancelBooking, type BookingActionState } from "./actions";

const initialState: BookingActionState = {};

export default function CancelStayButton({
  bookingIds,
}: {
  bookingIds: string[];
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    cancelBooking,
    initialState,
  );

  useEffect(() => {
    if (state.success) setConfirmOpen(false);
  }, [state.success]);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="text-xs text-red-600 underline"
      >
        Annuler ce séjour
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
              Annuler ce séjour ?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Cette action libère les dates réservées. Elle ne peut pas être
              annulée.
            </p>

            {state.error && (
              <p className="mt-2 text-xs text-red-600">{state.error}</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Retour
              </button>
              <form action={formAction}>
                {bookingIds.map((id) => (
                  <input key={id} type="hidden" name="bookingIds" value={id} />
                ))}
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {pending ? "Annulation…" : "Oui, annuler ce séjour"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
