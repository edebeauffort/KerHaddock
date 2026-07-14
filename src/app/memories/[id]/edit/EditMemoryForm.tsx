"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { updateMemory, type MemoryActionState } from "../../actions";

const initialState: MemoryActionState = {};

export default function EditMemoryForm({
  memoryId,
  initialGooglePhotosUrl,
  initialAnecdote,
}: {
  memoryId: string;
  initialGooglePhotosUrl: string | null;
  initialAnecdote: string | null;
}) {
  const router = useRouter();
  const [anecdote, setAnecdote] = useState(initialAnecdote ?? "");
  const [state, formAction, pending] = useActionState(
    async (prev: MemoryActionState, formData: FormData) => {
      const result = await updateMemory(prev, formData);
      if (result.success) router.push(`/memories/${memoryId}`);
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="memoryId" value={memoryId} />

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Lien de l&apos;album Google Photos
        </label>
        <input
          type="url"
          name="googlePhotosUrl"
          defaultValue={initialGooglePhotosUrl ?? ""}
          placeholder="https://photos.google.com/album/..."
          className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-brand-teal focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Nouvelle photo de couverture{" "}
          <span className="font-normal text-slate-400">(optionnel — laissez vide pour garder l&apos;actuelle)</span>
        </label>
        <input
          type="file"
          name="coverPhoto"
          accept="image/*"
          className="mt-1 w-full text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Anecdote</label>
        <textarea
          name="anecdote"
          maxLength={300}
          rows={5}
          value={anecdote}
          onChange={(e) => setAnecdote(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-brand-teal focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-slate-400">{anecdote.length}/300</p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
