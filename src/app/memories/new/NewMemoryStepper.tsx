"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createMemory, type MemoryActionState } from "../actions";
import { formatDateRangeFr, monthYearLabel } from "@/lib/formatDateRange";
import ParticipantAvatars from "../ParticipantAvatars";

type Person = { id: string; first_name: string | null; family_branch: string | null };

const initialState: MemoryActionState = {};
const STEP_TITLES = ["Album photo", "Photo de couverture", "Anecdote"];

export default function NewMemoryStepper({
  houseId,
  startISO,
  endISO,
  participants,
}: {
  houseId: string | null;
  startISO: string;
  endISO: string;
  participants: Person[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: MemoryActionState, formData: FormData) => {
      const result = await createMemory(prev, formData);
      if (result.success && result.memoryId) {
        router.push(`/memories/${result.memoryId}`);
      }
      return result;
    },
    initialState,
  );

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-6">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? "bg-brand-teal" : "bg-slate-200"}`}
          />
        ))}
      </div>

      <div>
        <p className="text-sm text-slate-500">{formatDateRangeFr(startISO, endISO)}</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {monthYearLabel(startISO)}
        </h1>
        {participants.length > 0 && (
          <div className="mt-2">
            <ParticipantAvatars people={participants} size="md" />
          </div>
        )}
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="houseId" value={houseId ?? ""} />
        <input type="hidden" name="startDate" value={startISO} />
        <input type="hidden" name="endDate" value={endISO} />
        {participants.map((p) => (
          <input key={p.id} type="hidden" name="participantIds" value={p.id} />
        ))}

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Étape {step} sur 3
        </p>

        {/* Step 1 — Google Photos album link */}
        <div className={step === 1 ? "space-y-3" : "hidden"}>
          <h2 className="text-xl font-semibold text-slate-900">Album photo</h2>
          <label className="block text-sm font-medium text-slate-700">
            Lien de l&apos;album Google Photos
          </label>
          <input
            type="url"
            name="googlePhotosUrl"
            placeholder="https://photos.google.com/album/..."
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-brand-teal focus:outline-none"
          />
          <p className="text-xs text-slate-500">
            Créez un album partagé sur Google Photos, puis collez le lien ici.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal-dark"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600"
            >
              Je n&apos;ai pas encore créé d&apos;album — passer cette étape
            </button>
          </div>
        </div>

        {/* Step 2 — cover photo */}
        <div className={step === 2 ? "space-y-3" : "hidden"}>
          <h2 className="text-xl font-semibold text-slate-900">
            Photo de couverture
          </h2>
          <label
            htmlFor="coverPhoto"
            className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center"
            style={
              coverPreview
                ? { backgroundImage: `url(${coverPreview})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            {!coverPreview && (
              <>
                <span className="text-2xl">📷</span>
                <span className="text-sm text-slate-500">Choisir une photo</span>
              </>
            )}
          </label>
          <input
            id="coverPhoto"
            type="file"
            name="coverPhoto"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setCoverPreview(URL.createObjectURL(file));
            }}
          />

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-full bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal-dark"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600"
            >
              Retour
            </button>
          </div>
        </div>

        {/* Step 3 — anecdote */}
        <div className={step === 3 ? "space-y-3" : "hidden"}>
          <h2 className="text-xl font-semibold text-slate-900">Anecdote</h2>

          {participants.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-1.5 text-xs font-medium text-slate-500">
                Participants — d&apos;après la réservation
              </p>
              <p className="text-sm text-slate-700">
                {participants.map((p) => p.first_name).filter(Boolean).join(", ")}
              </p>
            </div>
          )}

          <label className="block text-sm font-medium text-slate-700">
            Votre souvenir <span className="font-normal text-slate-400">(optionnel)</span>
          </label>
          <AnecdoteField />

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50"
            >
              {pending ? "Publication…" : "Publier le souvenir"}
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600"
            >
              Retour
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function AnecdoteField() {
  const [value, setValue] = useState("");
  return (
    <div>
      <textarea
        name="anecdote"
        maxLength={300}
        rows={5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Votre moment préféré, une anecdote, un souvenir particulier…"
        className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-brand-teal focus:outline-none"
      />
      <p className="mt-1 text-right text-xs text-slate-400">{value.length}/300</p>
    </div>
  );
}
