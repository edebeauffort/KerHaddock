"use client";

import { useActionState } from "react";
import { approveBooking, type BookingActionState } from "./actions";

const initialState: BookingActionState = {};

export default function ApproveStayButton({
  bookingIds,
}: {
  bookingIds: string[];
}) {
  const [state, formAction, pending] = useActionState(
    approveBooking,
    initialState,
  );

  return (
    <form action={formAction} className="mt-1">
      {bookingIds.map((id) => (
        <input key={id} type="hidden" name="bookingIds" value={id} />
      ))}
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-amber-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
      >
        {pending ? "Approbation…" : "Approuver"}
      </button>
    </form>
  );
}
