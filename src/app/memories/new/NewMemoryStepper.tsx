"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { addDays, addMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { createMemory, type MemoryActionState } from "../actions";

type Person = { id: string; first_name: string | null; family_branch: string | null };

const initialState: MemoryActionState = {};

function fmt(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function NewMemoryStepper({
  allProfiles,
  initialHouseId,
  initialStartISO,
  initialEndISO,
  initialParticipantIds,
}: {
  allProfiles: Person[];
  initialHouseId: string | null;
  initialStartISO: string;
  initialEndISO: string;
  initialParticipantIds: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [arrival, setArrival] = useState<Date | undefined>(
    initialStartISO ? new Date(`${initialStartISO}T00:00:00`) : undefined,
  );
  const [departure, setDeparture] = useState<Date | undefined>(
    initialEndISO ? new Date(`${initialEndISO}T00:00:00`) : undefined,
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    (initialStartISO ? new Date(`${initialStartISO}T00:00:00`) : undefined) ?? new Date(),
  );
  const [participantIds, setParticipantIds] = useState<string[]>(initialParticipantIds);
  const [otherGuestsCount, setOtherGuestsCount] = useState(0);

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

  function openCalendar() {
    setCalendarMonth(arrival ?? departure ?? new Date());
    setCalendarOpen(true);
  }

  function toggleParticipant(id: string) {
    setParticipantIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  // Same custom range-click logic as the booking calendar: clicking again
  // after a complete range starts fresh, and clicking at/before the current
  // arrival moves the start date instead of being ignored. Unlike bookings,
  // past dates are allowed here — memories are usually about past stays.
  function handleDayClick(day: Date) {
    if (!arrival || (arrival && departure)) {
      setArrival(day);
      setDeparture(undefined);
    } else if (day <= arrival) {
      setArrival(day);
    } else {
      setDeparture(day);
      setCalendarOpen(false);
    }
  }

  function handleArrivalInput(value: string) {
    if (!value) {
      setArrival(undefined);
      return;
    }
    const next = new Date(`${value}T00:00:00`);
    setArrival(next);
    if (departure && departure <= next) setDeparture(undefined);
  }

  function handleDepartureInput(value: string) {
    if (!value) {
      setDeparture(undefined);
      return;
    }
    const next = new Date(`${value}T00:00:00`);
    if (arrival && next <= arrival) return;
    setDeparture(next);
  }

  const startDate = arrival ? fmt(arrival) : "";
  const endDate = departure ? fmt(departure) : "";
  const datesReady = !!arrival && !!departure;

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Nouveau souvenir</h1>

      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? "bg-brand-teal" : "bg-slate-200"}`}
          />
        ))}
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="houseId" value={initialHouseId ?? ""} />
        <input type="hidden" name="startDate" value={startDate} />
        <input type="hidden" name="endDate" value={endDate} />
        <input type="hidden" name="otherGuestsCount" value={otherGuestsCount} />
        {participantIds.map((id) => (
          <input key={id} type="hidden" name="participantIds" value={id} />
        ))}

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Étape {step} sur 4
        </p>

        {/* Step 1 — dates & participants */}
        <div className={step === 1 ? "space-y-4" : "hidden"}>
          <h2 className="text-xl font-semibold text-slate-900">Séjour</h2>

          <div>
            <div className="rounded-2xl border border-slate-300 bg-white">
              <div className="grid grid-cols-2 divide-x divide-slate-300">
                <label className="block px-4 py-2.5">
                  <span className="block text-[10px] font-bold tracking-wide text-slate-900">
                    ARRIVÉE
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleArrivalInput(e.target.value)}
                    onFocus={openCalendar}
                    onClick={openCalendar}
                    className="mt-0.5 block w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none"
                    aria-label="Arrivée"
                  />
                </label>
                <label className="block px-4 py-2.5">
                  <span className="block text-[10px] font-bold tracking-wide text-slate-900">
                    DÉPART
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    min={arrival ? fmt(addDays(arrival, 1)) : undefined}
                    onChange={(e) => handleDepartureInput(e.target.value)}
                    onFocus={openCalendar}
                    onClick={openCalendar}
                    className="mt-0.5 block w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none"
                    aria-label="Départ"
                  />
                </label>
              </div>
            </div>

            {calendarOpen && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((m) => addMonths(m, -1))}
                    aria-label="Mois précédent"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-brand-teal"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                    aria-label="Mois suivant"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-brand-teal"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarOpen(false)}
                    aria-label="Fermer le calendrier"
                    className="ml-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
                  >
                    ×
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <DayPicker
                    mode="range"
                    locale={fr}
                    weekStartsOn={1}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    hideNavigation
                    selected={{ from: arrival, to: departure }}
                    onDayClick={handleDayClick}
                    numberOfMonths={2}
                    className="hh-calendar mx-auto"
                  />
                </div>
              </div>
            )}
          </div>

          {allProfiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Participants</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {allProfiles.map((p) => {
                  const checked = participantIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleParticipant(p.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        checked
                          ? "border-brand-teal bg-brand-teal text-white"
                          : "border-slate-300 bg-white text-slate-600 hover:border-brand-teal"
                      }`}
                    >
                      {p.first_name ?? "?"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2.5">
            <span className="text-sm font-medium text-slate-700">Autres invités</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOtherGuestsCount((c) => Math.max(0, c - 1))}
                disabled={otherGuestsCount <= 0}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 disabled:opacity-30"
              >
                −
              </button>
              <span className="w-4 text-center text-sm">{otherGuestsCount}</span>
              <button
                type="button"
                onClick={() => setOtherGuestsCount((c) => c + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!datesReady}
            className="w-full rounded-full bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-40"
          >
            Continuer
          </button>
        </div>

        {/* Step 2 — cover photo */}
        <div className={step === 2 ? "space-y-3" : "hidden"}>
          <h2 className="text-xl font-semibold text-slate-900">Photo de couverture</h2>
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

        {/* Step 3 — Google Photos album link */}
        <div className={step === 3 ? "space-y-3" : "hidden"}>
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
              onClick={() => setStep(4)}
              className="rounded-full bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal-dark"
            >
              Continuer
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

        {/* Step 4 — anecdote */}
        <div className={step === 4 ? "space-y-3" : "hidden"}>
          <h2 className="text-xl font-semibold text-slate-900">Anecdote</h2>

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
              onClick={() => setStep(3)}
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
