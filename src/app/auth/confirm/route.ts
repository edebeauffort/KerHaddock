import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Reached from the link inside the invite / "forgot password" emails once
// their templates are customized (see README section 2.7) to point here
// instead of Supabase's default confirmation link. Verifying the token
// server-side and setting the session via cookies here — rather than
// relying on Supabase's own hosted redirect — means this no longer depends
// on the redirectTo/Redirect-URLs-allow-list matching exactly, which was
// the cause of invite/reset links landing back on the plain login screen.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/auth/update-password";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Lien invalide ou expiré. Demandez-en un nouveau.")}`,
  );
}
