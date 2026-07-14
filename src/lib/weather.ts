// House coordinates — Anse de Ker Châlon, Île d'Yeu. Same spot used by the
// Météo page's marine forecast.
export const HOUSE_LAT = 46.69;
export const HOUSE_LON = -2.307;

// WMO weather codes (used by every Open-Meteo endpoint) collapsed down to
// a short French label + a simple mood used to pick an icon.
type WeatherMood = "sun" | "cloud" | "rain" | "storm" | "snow" | "fog";

const WMO_CODES: Record<number, { label: string; mood: WeatherMood }> = {
  0: { label: "Ensoleillé", mood: "sun" },
  1: { label: "Plutôt dégagé", mood: "sun" },
  2: { label: "Partiellement nuageux", mood: "cloud" },
  3: { label: "Couvert", mood: "cloud" },
  45: { label: "Brouillard", mood: "fog" },
  48: { label: "Brouillard givrant", mood: "fog" },
  51: { label: "Bruine légère", mood: "rain" },
  53: { label: "Bruine", mood: "rain" },
  55: { label: "Bruine forte", mood: "rain" },
  61: { label: "Pluie légère", mood: "rain" },
  63: { label: "Pluie", mood: "rain" },
  65: { label: "Pluie forte", mood: "rain" },
  71: { label: "Neige légère", mood: "snow" },
  73: { label: "Neige", mood: "snow" },
  75: { label: "Neige forte", mood: "snow" },
  80: { label: "Averses légères", mood: "rain" },
  81: { label: "Averses", mood: "rain" },
  82: { label: "Averses violentes", mood: "rain" },
  95: { label: "Orage", mood: "storm" },
  96: { label: "Orage avec grêle", mood: "storm" },
  99: { label: "Orage violent", mood: "storm" },
};

function describeCode(code: number | undefined) {
  if (code === undefined) return { label: "Météo indisponible", mood: "cloud" as WeatherMood };
  return WMO_CODES[code] ?? { label: "Météo indisponible", mood: "cloud" as WeatherMood };
}

export type CurrentWeather = {
  tempC: number;
  label: string;
  mood: WeatherMood;
  high: number | null;
  low: number | null;
  windKmh: number | null;
};

// Today's conditions for the homepage weather card — current temperature,
// a short French condition label, and today's high/low.
export async function getCurrentWeather(): Promise<CurrentWeather | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${HOUSE_LAT}&longitude=${HOUSE_LON}` +
        `&current=temperature_2m,weather_code,wind_speed_10m` +
        `&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis&forecast_days=1`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current;
    if (!current) return null;
    const { label, mood } = describeCode(current.weather_code);
    return {
      tempC: Math.round(current.temperature_2m),
      label,
      mood,
      high: data.daily?.temperature_2m_max?.[0] != null ? Math.round(data.daily.temperature_2m_max[0]) : null,
      low: data.daily?.temperature_2m_min?.[0] != null ? Math.round(data.daily.temperature_2m_min[0]) : null,
      windKmh: current.wind_speed_10m != null ? Math.round(current.wind_speed_10m) : null,
    };
  } catch {
    return null;
  }
}

// A one-line weather snapshot for a past date range, captured once when a
// memory is created (via Open-Meteo's historical archive) rather than
// re-fetched on every page view. Uses the middle day of the stay as a
// representative sample. Returns null for future dates or on failure.
export async function getHistoricalWeatherSummary(
  startISO: string,
  endISO: string,
): Promise<string | null> {
  try {
    const start = new Date(`${startISO}T00:00:00`);
    const end = new Date(`${endISO}T00:00:00`);
    if (start.getTime() >= Date.now()) return null;
    const midMs = start.getTime() + (end.getTime() - start.getTime()) / 2;
    const mid = new Date(midMs).toISOString().slice(0, 10);

    const res = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${HOUSE_LAT}&longitude=${HOUSE_LON}` +
        `&start_date=${mid}&end_date=${mid}` +
        `&daily=temperature_2m_max,weather_code&timezone=Europe%2FParis`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const temp = data.daily?.temperature_2m_max?.[0];
    const code = data.daily?.weather_code?.[0];
    if (temp == null) return null;
    const { label } = describeCode(code);
    return `${Math.round(temp)}°C, ${label.toLowerCase()}`;
  } catch {
    return null;
  }
}
