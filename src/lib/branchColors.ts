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
