import Link from "next/link";
import HeroCarousel from "./HeroCarousel";
import { getHeroImages } from "@/lib/heroImages";

const CARDS = [
  {
    href: "/bookings",
    title: "Réservations",
    description: "Consultez les disponibilités et réservez votre séjour.",
    ready: true,
  },
  {
    href: "/weather",
    title: "Météo",
    description: "Vent, vagues et prévisions pour la maison.",
    ready: true,
  },
  {
    href: "/gallery",
    title: "Galerie",
    description: "Photos de famille des vacances passées.",
    ready: false,
  },
  {
    href: "/tips",
    title: "Astuces",
    description: "Règles de la maison, bons plans, recommandations.",
    ready: false,
  },
  {
    href: "/restaurants",
    title: "Restaurants",
    description: "Nos adresses préférées sur une carte.",
    ready: false,
  },
  {
    href: "/webcam",
    title: "Webcam",
    description: "Vue en direct près de la maison.",
    ready: true,
  },
];

export default function Home() {
  const heroImages = getHeroImages();

  return (
    // Photo(s) cover the whole section (however tall it needs to be);
    // title, subtitle and the feature cards all sit on top, not below it.
    // Add one or more photos to public/hero/ (any filenames) for an
    // auto-advancing carousel, or a single public/homepage.jpg for a
    // static background.
    <div className="relative min-h-screen w-full">
      <HeroCarousel images={heroImages} />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16 text-center text-white">
        <div>
          <h1 className="text-4xl font-bold drop-shadow-lg sm:text-5xl">
            L&apos;Île d&apos;Yeu
          </h1>
          <p className="mt-3 text-lg drop-shadow-lg">
            Tout ce qu&apos;il faut savoir pour nos vacances, en un seul
            endroit.
          </p>
        </div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-white/30 bg-white/10 p-4 text-left text-white shadow-lg backdrop-blur-xl transition hover:border-brand-mint hover:bg-brand-mint/40"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-semibold">{card.title}</h2>
                {!card.ready && (
                  <span className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-xs text-white/90">
                    bientôt disponible
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
