import Image from "next/image";

// Full-width banner across the top of the booking page: up to 3 photos
// side by side (fewer is fine, it adapts), with a dark overlay and the
// page title on top. Falls back to a plain brand-colored gradient if no
// photos have been added yet (see src/lib/bookingHeroImages.ts).
export default function BookingsHero({ images }: { images: string[] }) {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl sm:h-80">
      {images.length > 0 ? (
        <div className="absolute inset-0 flex">
          {images.map((src, i) => (
            <div key={src} className="relative h-full flex-1">
              <Image
                src={src}
                alt=""
                fill
                priority={i === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-sage to-brand-mint" />
      )}

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/90">
          Réservation
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white drop-shadow-lg sm:text-4xl">
          L&apos;Île d&apos;Yeu
        </h1>
        <p className="mt-1 max-w-lg text-sm text-white/90 drop-shadow sm:text-base">
          Agenda partagé des maisons familiales · règles de priorité
          saisonnières
        </p>
      </div>
    </div>
  );
}
