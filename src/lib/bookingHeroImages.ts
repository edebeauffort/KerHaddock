import fs from "node:fs";
import path from "node:path";

// Up to 3 photos for the banner at the top of the booking page. Add yours
// to public/bookings-hero/ (any filenames, jpg/jpeg/png/webp) — picked up
// automatically in filename order. Fewer than 3 (including zero) is fine,
// the banner adapts; extras beyond 3 are ignored.
export function getBookingHeroImages(): string[] {
  const dir = path.join(process.cwd(), "public", "bookings-hero");
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();
    return files.slice(0, 3).map((f) => `/bookings-hero/${f}`);
  } catch {
    return [];
  }
}
