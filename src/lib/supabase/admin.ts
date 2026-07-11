import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client authenticated with the service role key.
 * Bypasses Row Level Security and can call the Auth admin API
 * (invite/delete users) — this is what lets a host create and remove
 * accounts. Only ever import this from server actions/route handlers.
 *
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser (no NEXT_PUBLIC_
 * prefix — that's intentional, don't add one).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
