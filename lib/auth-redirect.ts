import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { localizedPath } from "@/lib/redirect-path";

/** Where to land right after signing in: the home page in the user's saved language. */
export async function homeForSignedInUser(supabase: SupabaseClient): Promise<string> {
  const { data: claims } = await supabase.auth.getClaims();
  const sub = claims?.claims?.sub;
  if (!sub) return "/giris";
  const { data } = await supabase.from("profiles").select("locale").eq("id", sub).single();
  return localizedPath("/", data?.locale ?? "tr");
}
