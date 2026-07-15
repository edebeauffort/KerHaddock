"use client";

import { useRef, useState } from "react";

// One placeholder in the 3-photo picker grid (1 big "cover" slot + 2
// smaller ones) — shown empty as a dashed camera-icon box, filled with a
// preview once a photo is chosen (or, in the edit form, pre-filled with the
// existing photo). Fully self-contained: manages its own preview/clear
// state and talks to the surrounding <form> purely through plain <input>
// elements, no parent wiring needed.
//
// `clearFieldName`, if given, adds a hidden "this slot was cleared" flag
// input alongside the file input — the edit form uses this to tell the
// server to drop an existing photo the file input itself can't express
// (an empty file input just means "no change", not "remove").
export default function PhotoSlot({
  id,
  name,
  big = false,
  initialPreview = null,
  clearFieldName,
}: {
  id: string;
  name: string;
  big?: boolean;
  initialPreview?: string | null;
  clearFieldName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialPreview);
  const [cleared, setCleared] = useState(false);

  function handleClear() {
    setPreview(null);
    setCleared(true);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={`relative ${big ? "row-span-2" : ""}`}>
      <label
        htmlFor={id}
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center"
        style={
          preview
            ? { backgroundImage: `url(${preview})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        {!preview && (
          <>
            <span className={big ? "text-2xl" : "text-lg"}>📷</span>
            {big && <span className="text-sm text-slate-500">Photo principale</span>}
          </>
        )}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setPreview(URL.createObjectURL(file));
            setCleared(false);
          }
        }}
      />
      {clearFieldName && <input type="hidden" name={clearFieldName} value={cleared ? "1" : ""} />}
      {preview && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Retirer la photo"
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
        >
          ×
        </button>
      )}
    </div>
  );
}
