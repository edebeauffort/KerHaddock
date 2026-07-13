const RULES = [
  {
    title: "Périodes prioritaires",
    description:
      "Chaque branche familiale a une quinzaine prioritaire en juillet-août, définie chaque année par un hôte depuis la page Utilisateurs.",
  },
  {
    title: "Réservation hors priorité",
    description:
      "Toute réservation qui tombe pendant la période prioritaire d'une autre branche nécessite l'accord explicite de cette branche avant d'être confirmée.",
  },
  {
    title: "Dates libres",
    description:
      "En dehors des quatre périodes prioritaires (hors saison, juin, septembre…), les dates sont ouvertes à tous, sans restriction.",
  },
  {
    title: "Conflits de dates",
    description:
      "Deux séjours ne peuvent jamais se chevaucher sur la même chambre — la base de données refuse automatiquement toute date déjà prise.",
  },
];

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function HouseRules() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-xl font-bold text-slate-900">Règles de la maison</h2>

      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        {RULES.map((rule) => (
          <div key={rule.title} className="flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-mint text-slate-800">
              <CheckIcon />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{rule.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">
                {rule.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
