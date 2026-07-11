// House coordinates — Anse de Ker Châlon, Île d'Yeu.
const LAT = 46.69;
const LON = -2.307;

type MarineForecast = {
  hourly?: {
    time: string[];
    wave_height?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
  };
};

async function getForecast(): Promise<MarineForecast | null> {
  try {
    const res = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&hourly=wave_height&forecast_days=1`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function WeatherPage() {
  const forecast = await getForecast();
  const nextWave = forecast?.hourly?.wave_height?.find((v) => v !== null);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Météo</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">
          Hauteur des vagues (Open-Meteo)
        </h2>
        <p className="text-sm text-slate-600">
          {nextWave !== undefined
            ? `Hauteur des vagues actuelle près de la maison : ${nextWave} m`
            : "Prévisions indisponibles pour le moment."}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          API marine gratuite, sans clé — d&apos;autres variables (vent,
          période de houle, température de l&apos;eau) sont disponibles sur
          open-meteo.com/en/docs/marine-weather-api si besoin.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">
          Carte des vents et des vagues (Windy)
        </h2>
        <div className="aspect-video w-full overflow-hidden rounded">
          <iframe
            title="Prévisions Windy"
            src={`https://embed.windy.com/embed2.html?lat=${LAT}&lon=${LON}&detailLat=${LAT}&detailLon=${LON}&width=650&height=450&zoom=10&level=surface&overlay=wind&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`}
            className="h-full w-full border-0"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-1 text-lg font-semibold">Bulletin marine détaillé</h2>
        <p className="mb-2 text-sm text-slate-600">
          Meteoconsult ne propose pas d&apos;API publique ni de widget
          intégrable, donc ce lien redirige plutôt vers leur site.
        </p>
        <a
          href="https://marine.meteoconsult.fr/meteo-marine/bulletin-detaille/mouillage-764/previsions-meteo-anse-de-ker-chalon-aujourdhui"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-slate-900 underline"
        >
          Consulter le bulletin du jour sur Meteoconsult →
        </a>
      </div>
    </div>
  );
}
