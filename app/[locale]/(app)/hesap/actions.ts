"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import type { ActionState } from "@/lib/actions/types";
import { getProfile, requireUser } from "@/lib/auth";
import { CONSENT_VERSION } from "@/lib/consent";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const localeSchema = z.enum(["tr", "en"]);
const checkbox = z.union([z.literal("on"), z.null()]).transform((v) => v === "on");

const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(60)
    .transform((v) => v || null),
  locale: localeSchema,
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    display_name: formData.get("display_name") ?? "",
    locale: formData.get("locale"),
  });
  const before = await getProfile();
  const uiLocale = before?.locale ?? "tr";
  const tc = await getTranslations({ locale: uiLocale, namespace: "common" });
  if (!parsed.success) return { error: tc("genericError") };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { error: tc("genericError") };
  if (parsed.data.locale !== uiLocale) return redirect({ href: "/hesap", locale: parsed.data.locale });
  return { ok: true, message: tc("saved") };
}

const consentSchema = z.object({ analytics: checkbox, marketing: checkbox });

export async function updateConsents(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const profile = await getProfile();
  const tc = await getTranslations({ locale: profile?.locale ?? "tr", namespace: "common" });
  const parsed = consentSchema.safeParse({ analytics: formData.get("analytics"), marketing: formData.get("marketing") });
  if (!parsed.success || !profile) return { error: tc("genericError") };

  // Log only what changed; the profile follows via a database trigger.
  const changes = (["analytics", "marketing"] as const)
    .filter((kind) => parsed.data[kind] !== profile[`${kind}_consent`])
    .map((kind) => ({ user_id: user.id, kind, version: CONSENT_VERSION, granted: parsed.data[kind] }));
  if (changes.length) {
    const supabase = await createClient();
    const { error } = await supabase.from("consent_events").insert(changes);
    if (error) return { error: tc("genericError") };
  }
  return { ok: true, message: tc("saved") };
}

export async function signOut(formData: FormData): Promise<void> {
  const locale = localeSchema.catch("tr").parse(formData.get("locale"));
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect({ href: "/giris", locale });
}

// Accepts the confirmation word in either language, ignoring case and the dotted İ.
const CONFIRM_WORDS = new Set(["SİL", "SIL", "DELETE"]);

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const profile = await getProfile();
  const locale = profile?.locale ?? "tr";
  const t = await getTranslations({ locale, namespace: "account" });
  const tc = await getTranslations({ locale, namespace: "common" });

  const word = z.string().trim().max(20).catch("").parse(formData.get("confirm"));
  if (!CONFIRM_WORDS.has(word.toLocaleUpperCase("tr")) && !CONFIRM_WORDS.has(word.toUpperCase())) {
    return { fieldErrors: { confirm: t("deleteMismatch") } };
  }

  const admin = createAdminClient();
  // Any statement PDF still waiting to be read. The bucket arrives in phase 3; until then this finds nothing.
  const { data: files } = await admin.storage.from("statements").list(user.id, { limit: 1000 });
  if (files?.length) {
    await admin.storage.from("statements").remove(files.map((f) => `${user.id}/${f.name}`));
  }
  // Deleting the auth user cascades to every table (see the migration).
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: tc("genericError") };

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return redirect({ href: { pathname: "/giris", query: { deleted: "1" } }, locale });
}
