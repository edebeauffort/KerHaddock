const VIEWSURF_EMBED_URL = "https://pv.viewsurf.com/id/1000/a/media/c/4730";

export default function WebcamPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Webcam</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">L&apos;Île d&apos;Yeu — Le Port</h2>
        <div className="aspect-video w-full overflow-hidden rounded bg-slate-100">
          <iframe
            title="ViewSurf webcam — Île d'Yeu, Le Port"
            src={VIEWSURF_EMBED_URL}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Si la vidéo ne s&apos;affiche pas ci-dessus (certains sites
          bloquent l&apos;intégration), ouvrez-la directement :{" "}
          <a
            href={VIEWSURF_EMBED_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-900 underline"
          >
            ViewSurf — Île d&apos;Yeu, Le Port →
          </a>
        </p>
      </div>
    </div>
  );
}
