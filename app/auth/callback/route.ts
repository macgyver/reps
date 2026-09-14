import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  let { searchParams, origin } = new URL(request.url);
  let code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (code) {
    let supabase = await createClient();
    let { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not sign you in`);
}
