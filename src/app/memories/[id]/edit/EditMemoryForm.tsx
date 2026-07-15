"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { addDays, addMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { updateMemory, type MemoryActionState } from "../../actions";

const initialState: MemoryActionState = {};

function fmt(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function EditMemoryForm({
  memoryId,
  initialStartISO,
  initialEndISO,
  initialGooglePhotosUrl,
  initialAnecdote,
  initialOtherGuestsCount,
  initialCoverPhotoUrl,
}: {
  memoryId: string;
  initialStartISO: string;
  initialEndISO: string;
  initialGooglePhotosUrl: string | null;
  initialAnecdote: string | null;
  initialOtherGuestsCount: number;
  initialCoverPhotoUrl: string | null;
}) {
  const router = useRouter();
  const [anecdote, setAnecdote] = useState(initialAnecdote ?? "");
  const [otherGuestsCount, setOtherGuestsCount] = useState(initialOtherGuestsCount);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialCoverPhotoUrl);
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

  const [state, formAction, pending] = useActionState(
    async (prev: MemoryActionState, formData: FormData) => {
      const result = await updateMemory(prev, formData);
      if (result.success) router.push(`/memories/${memoryId}`);
      return result;
    },
    initialState,
  );

  function openCalendar() {
    setCalendarMonth(arrival ?? departure ?? new Date());
    setCalendarOpen(true);
  }

  // Same custom range-click logic as the creation stepper and the booking
  // calendar — clicking again after a complete range starts fresh, and
  // clicking at/before the current arrival moves the start date instead of
  // being ignored. Past dates are allowed, since memories are usually about
  // past stays.
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

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="memoryId" value={memoryId} />
      <input type="hidden" name="startDate" value={startDate} />
      <input type="hidden" name="endDate" value={endDate} />

      <div>
        <label className="block text-sm font-medium text-slate-700">Dates du séjour</label>
        <div className="mt-1 rounded-2xl border border-slate-300 bg-white">
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
        <label className="block text-sm font-medium text-slate-700">Photo de couverture</label>
        <label
          htmlFor="coverPhoto"
          className="mt-1 flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center"
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
        <p className="mt-1 text-xs text-slate-400">
          Choisissez une nouvelle photo pour remplacer l&apos;actuelle, ou laissez-la telle quelle.
        </p>
      </div>

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
      <input type="hidden" name="otherGuestsCount" value={otherGuestsCount} />

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
        className="w-full rounded-full bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
