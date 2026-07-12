import HeroCarousel from "../HeroCarousel";
import { getHeroImages } from "@/lib/heroImages";
import { login, requestPasswordReset } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; resetError?: string }>;
}) {
  const { error, reset, resetError } = await searchParams;
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

      <div className="relative z-10 w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-6 text-left shadow-xl">
        <p className="text-sm text-slate-500">
          Connectez-vous avec le compte créé par un administrateur.
        </p>

        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded border border-slate-300 p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              name="password"
              required
              className="mt-1 w-full rounded border border-slate-300 p-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {reset && (
            <p className="text-sm text-green-600">
              Consultez vos e-mails pour le lien de réinitialisation.
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded bg-brand-teal px-4 py-2 text-white hover:bg-brand-teal-dark"
          >
            Se connecter
          </button>
        </form>

        <form action={requestPasswordReset} className="space-y-2 border-t border-slate-100 pt-4">
          <label className="block text-sm font-medium">
            Mot de passe oublié ?
          </label>
          <input
            type="email"
            name="email"
            placeholder="vous@exemple.com"
            required
            className="w-full rounded border border-slate-300 p-2 text-sm"
          />
          {resetError && (
            <p className="text-sm text-red-600">
              Échec de l&apos;envoi : {resetError}
            </p>
          )}
          <button type="submit" className="text-sm text-slate-500 underline">
            Envoyer le lien de réinitialisation
          </button>
        </form>
      </div>
    </div>
  );
}
