import Image from "next/image";

// Full-bleed banner across the top of the booking page — one photo,
// edge-to-edge (not confined to the page's centered max-width), with a
// dark overlay and the page title on top. Falls back to a plain
// brand-colored gradient if no photo has been added yet (see
// src/lib/bookingHeroImages.ts).
export default function BookingsHero({ images }: { images: string[] }) {
  const image = images[0];

  return (
    <div className="relative h-64 w-full sm:h-80">
      {image ? (
        <Image src={image} alt="" fill priority className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-sage to-brand-mint" />
      )}

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/90">
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
