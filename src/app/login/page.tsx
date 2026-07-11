import { login, requestPasswordReset } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">L&apos;Île d&apos;Yeu</h1>
          <p className="text-sm text-slate-500">
            Connectez-vous avec le compte créé par un administrateur.
          </p>
        </div>

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
            className="w-full rounded bg-slate-900 px-4 py-2 text-white"
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
          <button type="submit" className="text-sm text-slate-500 underline">
            Envoyer le lien de réinitialisation
          </button>
        </form>
      </div>
    </div>
  );
}
