"use client";

import { useState } from "react";
import Image from "next/image";

// Inline full-size photo viewer for the memory detail page — no modal.
// Shows the complete, uncropped photo (object-contain, letterboxed rather
// than cropped) with left/right arrows and a counter when there's more
// than one, right in the page flow.
export default function MemoryPhotoViewer({ photoUrls }: { photoUrls: string[] }) {
  const [index, setIndex] = useState(0);

  if (photoUrls.length === 0) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-sage to-brand-mint" />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900">
      <Image src={photoUrls[index]} alt="" fill className="object-contain" />

      {photoUrls.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length)}
            aria-label="Photo précédente"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white hover:bg-black/60"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % photoUrls.length)}
            aria-label="Photo suivante"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white hover:bg-black/60"
          >
            ›
          </button>
          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white">
            {index + 1} / {photoUrls.length}
          </p>
        </>
      )}
    </div>
  );
}
