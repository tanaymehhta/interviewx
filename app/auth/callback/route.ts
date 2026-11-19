// GET /auth/callback: finishes the email link, makes sure a profile row exists, then routes the person.
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/components/account/shared";

const OTP_TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const expired = () => go(`/signin?error=expired${next ? `&next=${encodeURIComponent(next)}` : ""}`);

  const code = searchParams.get("code"), tokenHash = searchParams.get("token_hash"), type = searchParams.get("type");
  const supabase = await createClient();
  if (code) {
    if ((await supabase.auth.exchangeCodeForSession(code)).error) return expired();
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    if ((await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType })).error) return expired();
  } else {
    return expired();
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return expired();

  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  const { data: profile } = await supabase.from("profiles").select("theme, onboarded").eq("id", user.id).maybeSingle();

  (await cookies()).set("theme", profile?.theme === "dark" ? "dark" : "light", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return go(next ?? (profile?.onboarded ? "/jobs" : "/start"));
}
