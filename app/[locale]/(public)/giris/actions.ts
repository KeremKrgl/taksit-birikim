"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SITE_URL } from "@/lib/env";
import type { ActionState } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";

const localeSchema = z.enum(["tr", "en"]).catch("tr");

const magicLinkSchema = z.object({
  email: z.email().max(254),
  locale: localeSchema,
});

export async function sendMagicLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = magicLinkSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    locale: formData.get("locale"),
  });
  const t = await getTranslations({ locale: localeSchema.parse(formData.get("locale")), namespace: "login" });
  if (!parsed.success) return { fieldErrors: { email: t("invalidEmail") } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/confirm`,
      // Stored on the new user and copied to the profile, so emails go out in the right language.
      data: { locale: parsed.data.locale },
    },
  });
  if (error) {
    const tc = await getTranslations({ locale: parsed.data.locale, namespace: "common" });
    return { error: tc("genericError") };
  }
  return { ok: true, message: t("linkSent", { email: parsed.data.email }) };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const locale = localeSchema.parse(formData.get("locale"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${SITE_URL}/auth/callback`, queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) redirect(locale === "en" ? "/en/giris?error=oauth" : "/giris?error=oauth");
  redirect(data.url);
}
