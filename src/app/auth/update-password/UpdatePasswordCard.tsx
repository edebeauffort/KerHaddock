"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordCard() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">(
    "checking",
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // The invite/recovery link puts a one-time token in the URL. The
    // Supabase browser client parses it automatically on load and fires
    // this event once a session has been established from it.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        (event === "SIGNED_IN" && session)
      ) {
        setStatus("ready");
      }
    });

    // Fallback in case the event already fired before this component
    // mounted (or the SDK settles on a session without emitting it).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("ready");
    });

    // If nothing has established a session after a few seconds, the link
    // was almost certainly invalid or already used.
    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "invalid" : current));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative z-10 w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-6 text-left shadow-xl">
      {status === "checking" && (
        <p className="text-sm text-slate-500">Vérification du lien…</p>
      )}

      {status === "invalid" && (
        <>
          <h2 className="text-lg font-semibold text-slate-900">
            Lien invalide ou expiré
          </h2>
          <p className="text-sm text-slate-500">
            Ce lien d&apos;invitation ou de réinitialisation n&apos;est plus
            valide. Demandez-en un nouveau depuis la page de connexion.
          </p>
          <a
            href="/login"
            className="block w-full rounded bg-brand-teal px-4 py-2 text-center text-white hover:bg-brand-teal-dark"
          >
            Retour à la connexion
          </a>
        </>
      )}

      {status === "ready" && (
        <>
          <h2 className="text-lg font-semibold text-slate-900">
            Choisissez votre mot de passe
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-brand-teal px-4 py-2 text-white hover:bg-brand-teal-dark disabled:opacity-50"
            >
              {submitting ? "Enregistrement…" : "Valider"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
