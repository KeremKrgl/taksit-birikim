import "server-only";
import { cache } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  display_name: string | null;
  locale: "tr" | "en";
  plan: "free" | "premium";
  premium_until: string | null;
  heavy_month_threshold_kurus: number | null;
  referral_code: string;
  kvkk_notice_version: string | null;
  abroad_transfer_version: string | null;
  analytics_consent: boolean;
  marketing_consent: boolean;
  push_consent: boolean;
  onboarded_at: string | null;
};

const PROFILE_COLUMNS =
  "id, display_name, locale, plan, premium_until, heavy_month_threshold_kurus, referral_code, kvkk_notice_version, abroad_transfer_version, analytics_consent, marketing_consent, push_consent, onboarded_at";

/** The signed-in user's id and email, verified from the JWT. Null when signed out. */
export const getUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) return null;
  return { id: sub, email: (data.claims.email as string | undefined) ?? null };
});

/** Use at the top of every server action and private page. */
export async function requireUser() {
  const user = await getUser();
  if (!user) return redirect({ href: "/giris", locale: await getLocale() });
  return user;
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).single();
  if (error) throw new Error(`Profile could not be loaded: ${error.message}`);
  return data as Profile;
});
