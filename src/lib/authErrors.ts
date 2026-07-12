/**
 * Supabase Auth returns its error messages in English, with no built-in
 * localization. This maps the handful of messages users can actually
 * trigger from this app's login/reset/invite flows to French, with a
 * generic fallback for anything unrecognized (so a raw English API string
 * never reaches the screen either way).
 */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Adresse e-mail non confirmée. Vérifiez votre boîte de réception.";
  }
  if (m.includes("user not found")) {
    return "Email ou mot de passe incorrect.";
  }
  if (m.includes("email rate limit")) {
    return "Trop de tentatives d'envoi d'e-mail. Réessayez plus tard.";
  }
  if (m.includes("for security purposes") || m.includes("rate limit")) {
    return "Veuillez patienter quelques instants avant de réessayer.";
  }
  if (m.includes("password") && (m.includes("character") || m.includes("least"))) {
    return "Le mot de passe est trop court (8 caractères minimum).";
  }
  if (m.includes("token") && (m.includes("expired") || m.includes("invalid"))) {
    return "Lien invalide ou expiré. Demandez-en un nouveau.";
  }
  if (m.includes("network") || m.includes("fetch failed")) {
    return "Problème de connexion. Vérifiez votre réseau et réessayez.";
  }

  return "Une erreur est survenue. Réessayez.";
}
