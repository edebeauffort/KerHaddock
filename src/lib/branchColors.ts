import { FAMILY_BRANCHES } from "./familyBranches";

// Each branch gets one color from the site palette, paired with a darker
// shade of the same hue for use anywhere white text sits directly on top
// (avatar circles, timeline segments) — the palette hexes themselves are
// too light for that to stay readable.
const PALETTE: { light: string; dark: string }[] = [
  { light: "#f5f0bb", dark: "#6e6c54" }, // cream
  { light: "#c4dfaa", dark: "#6c7b5e" }, // mint
  { light: "#90c8ac", dark: "#567867" }, // sage
  { light: "#73a9ad", dark: "#5b8c90" }, // teal
];

const FALLBACK = { light: "#e2e8f0", dark: "#475569" }; // slate, for any branch not in the fixed list

const BRANCH_COLORS: Record<string, { light: string; dark: string }> =
  Object.fromEntries(
    FAMILY_BRANCHES.map((branch, i) => [branch, PALETTE[i % PALETTE.length]]),
  );

export function branchColor(branch: string): { light: string; dark: string } {
  return BRANCH_COLORS[branch] ?? FALLBACK;
}

// Strips the "de "/"d'" particle so the initial reflects the family
// surname — "de Beauffort" -> "B", "d'Harcourt" -> "H".
export function branchInitial(branch: string): string {
  const stripped = branch.replace(/^de\s+|^d['’]/i, "");
  return stripped.charAt(0).toUpperCase() || "?";
}


// Avatars are colored per-person, not per-branch — two siblings from the
// same family branch would otherwise render as visually identical circles
// (same hue), distinguishable only by their initial. A larger palette
// hashed from the person's id keeps colors stable across the site while
// spreading them out more than the 4-branch palette above allows.
const AVATAR_PALETTE: { light: string; dark: string }[] = [
  { light: "#f5f0bb", dark: "#6e6c54" }, // cream
  { light: "#c4dfaa", dark: "#6c7b5e" }, // mint
  { light: "#90c8ac", dark: "#567867" }, // sage
  { light: "#73a9ad", dark: "#5b8c90" }, // teal
  { light: "#f0c9a0", dark: "#8a5a34" }, // terracotta
  { light: "#cbd8e6", dark: "#4a6178" }, // dusty blue
  { light: "#e0c8dc", dark: "#7a4f72" }, // plum
  { light: "#f2dfa0", dark: "#8a6d24" }, // mustard
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function avatarColor(personId: string): { light: string; dark: string } {
  return AVATAR_PALETTE[hashString(personId) % AVATAR_PALETTE.length];
}
