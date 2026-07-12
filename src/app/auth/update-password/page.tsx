import HeroCarousel from "../../HeroCarousel";
import { getHeroImages } from "@/lib/heroImages";
import UpdatePasswordCard from "./UpdatePasswordCard";

// Reached from an invite or "forgot password" email. Supabase's link logs
// the visitor in via a one-time token embedded in the URL (the browser
// client picks it up automatically on load), then the card below just
// asks for a new password to finish setting up the account.
export default function UpdatePasswordPage() {
  const heroImages = getHeroImages();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-10 p-4 text-center">
      <HeroCarousel images={heroImages} />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative z-10">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg sm:text-5xl">
          L&apos;Île d&apos;Yeu
        </h1>
        <p className="mt-3 text-lg text-white drop-shadow-lg">
          Tout ce qu&apos;il faut savoir pour nos vacances, en un seul
          endroit.
        </p>
      </div>

      <UpdatePasswordCard />
    </div>
  );
}
