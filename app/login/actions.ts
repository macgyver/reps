"use server";

import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string } | { sent: true } | null;

export async function signInWithMagicLink(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  let email = formData.get("email");
  if (typeof email !== "string" || !email) {
    return { error: "Enter a valid email address" };
  }

  let supabase = await createClient();
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { sent: true };
}
