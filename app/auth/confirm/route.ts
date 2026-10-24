import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { homeForSignedInUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["email", "magiclink", "signup"];

// Magic links land here. Uses token_hash (see README: email template), so the link
// also works when the email opens in a different browser than the one that asked for it.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(await homeForSignedInUser(supabase), request.url));
  }
  return NextResponse.redirect(new URL("/giris?error=link", request.url));
}
