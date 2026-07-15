import Link from "next/link";
import type { CurrentWeather } from "@/lib/weather";

// Beaufort wind scale (km/h thresholds → force number + French name).
const BEAUFORT_SCALE: { max: number; force: number; label: string }[] = [
  { max: 1, force: 0, label: "Calme" },
  { max: 5, force: 1, label: "Très légère brise" },
  { max: 11, force: 2, label: "Légère brise" },
  { max: 19, force: 3, label: "Petite brise" },
  { max: 28, force: 4, label: "Jolie brise" },
  { max: 38, force: 5, label: "Bonne brise" },
  { max: 49, force: 6, label: "Vent frais" },
  { max: 61, force: 7, label: "Grand frais" },
  { max: 74, force: 8, label: "Coup de vent" },
  { max: 88, force: 9, label: "Fort coup de vent" },
  { max: 102, force: 10, label: "Tempête" },
  { max: 117, force: 11, label: "Violente tempête" },
  { max: Infinity, force: 12, label: "Ouragan" },
];

function beaufort(kmh: number | null) {
  if (kmh === null) return null;
  const entry = BEAUFORT_SCALE.find((b) => kmh <= b.max) ?? BEAUFORT_SCALE[BEAUFORT_SCALE.length - 1];
  return entry;
}

export default function WeatherCard({ weather }: { weather: CurrentWeather | null }) {
  const wind = weather ? beaufort(weather.windKmh) : null;

  return (
    <Link
      href="/weather"
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-teal"
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <ThermoIcon /> Météo du jour
      </p>

      {weather ? (
        <>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900">
                {weather.tempC}°
              </span>
              <span className="text-sm text-slate-500">C</span>
            </div>
            {wind && (
              <span className="text-4xl font-bold text-slate-900">
                Force {wind.force}
              </span>
            )}
          </div>
          <p className="mt-1 text-base font-medium text-slate-700">
            {weather.label} · L&apos;Île d&apos;Yeu
          </p>
          <div className="mt-3 space-y-0.5 text-xs text-slate-500">
            {weather.high !== null && weather.low !== null && (
              <p>↑{weather.high}° ↓{weather.low}°</p>
            )}
            {wind && <p>Vent : {wind.label}</p>}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Météo indisponible pour le moment.</p>
      )}
    </Link>
  );
}

function ThermoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M9 11.5V4.5a1 1 0 1 1 2 0v7a3 3 0 1 1-2 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
