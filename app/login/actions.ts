"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithMagicLink(formData: FormData) {
  let email = formData.get("email");
  if (typeof email !== "string" || !email) {
    redirect("/login?error=Enter a valid email address");
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
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?sent=1");
}
