import fs from "node:fs";
import path from "node:path";

// Looks for photos in public/hero/ (any of jpg/jpeg/png/webp) to drive the
// homepage carousel. Add as many as you like — no code changes needed,
// they're picked up automatically, in filename order. Falls back to the
// single public/homepage.jpg (if present) so existing setups keep working.
export function getHeroImages(): string[] {
  const dir = path.join(process.cwd(), "public", "hero");
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();
    if (files.length > 0) return files.map((f) => `/hero/${f}`);
  } catch {
    // public/hero doesn't exist yet — fall through to the legacy single image.
  }

  const legacy = path.join(process.cwd(), "public", "homepage.jpg");
  return fs.existsSync(legacy) ? ["/homepage.jpg"] : [];
}
