// Kept in one place — matches the check constraint on profiles.family_branch
// in supabase/schema.sql. Update both together if this ever changes.
export const FAMILY_BRANCHES = [
  "de Beauffort",
  "de Meester",
  "d'Harcourt",
  "de Laminne",
] as const;
