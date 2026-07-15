"use client";

import { useState } from "react";

// Inline full-size photo viewer for the memory detail page — no modal.
// Uses a plain <img> (not next/image) sized at full width with natural
// height, rather than a fixed aspect-ratio box: that's what lets each
// photo show completely, at full width, with no cropping and no
// letterboxing bars regardless of its own aspect ratio. Left/right arrows
// and a counter float on top when there's more than one photo.
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
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element -- natural
          intrinsic sizing (full width, auto height) needs a plain <img>;
          next/image requires either known dimensions or a fixed-size
          parent, which is exactly the letterboxing this avoids. */}
      <img src={photoUrls[index]} alt="" className="block w-full" />

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
