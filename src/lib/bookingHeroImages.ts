import fs from "node:fs";
import path from "node:path";

// One photo for the full-width banner at the top of the booking page. Add
// yours to public/bookings-hero/ (any filename, jpg/jpeg/png/webp) — the
// first one alphabetically is used. None yet is fine too, it falls back to
// a plain brand-colored gradient.
export function getBookingHeroImages(): string[] {
  const dir = path.join(process.cwd(), "public", "bookings-hero");
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();
    return files.slice(0, 1).map((f) => `/bookings-hero/${f}`);
  } catch {
    return [];
  }
}
