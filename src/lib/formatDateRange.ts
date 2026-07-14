import { format } from "date-fns";
import { fr } from "date-fns/locale";

// "18 – 22 avr. 2025" / "23 déc. 2024 – 2 jan. 2025" when the range spans
// two months (or years).
export function formatDateRangeFr(startISO: string, endISO: string) {
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${format(start, "d", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
  }
  return `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
}

// "Juillet 2026" — used for an upcoming/current stay that has no memory
// (published memories) yet, so it reads as a placeholder, not a season name.
export function monthYearLabel(startISO: string) {
  const start = new Date(`${startISO}T00:00:00`);
  const label = format(start, "MMMM yyyy", { locale: fr });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
