import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  let supabase = await createClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
