import Link from "next/link";

const VIEWSURF_EMBED_URL = "https://pv.viewsurf.com/id/1000/a/media/c/4730";

export default function WebcamCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Link
        href="/webcam"
        className="flex items-center justify-between px-5 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-brand-teal-dark"
      >
        Webcam
        <span className="flex items-center gap-1 text-[10px] font-medium normal-case text-white">
          <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Live
          </span>
        </span>
      </Link>
      <Link href="/webcam" className="mt-3 block aspect-video w-full bg-slate-100">
        <iframe
          title="Webcam — Île d'Yeu, Le Port"
          src={VIEWSURF_EMBED_URL}
          className="h-full w-full border-0"
          allow="autoplay; fullscreen"
        />
      </Link>
    </div>
  );
}
