"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import type { ActionState } from "@/lib/actions/types";
import { getProfile, requireUser } from "@/lib/auth";
import { CONSENT_VERSION } from "@/lib/consent";
import { createClient } from "@/lib/supabase/server";

const checkbox = z
  .union([z.literal("on"), z.null()])
  .transform((v) => v === "on");

const consentSchema = z.object({
  locale: z.enum(["tr", "en"]).catch("tr"),
  kvkk_notice: checkbox,
  abroad_transfer: checkbox,
  analytics: checkbox,
  marketing: checkbox,
});

export async function giveConsent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = consentSchema.safeParse({
    locale: formData.get("locale"),
    kvkk_notice: formData.get("kvkk_notice"),
    abroad_transfer: formData.get("abroad_transfer"),
    analytics: formData.get("analytics"),
    marketing: formData.get("marketing"),
  });
  const locale = parsed.success ? parsed.data.locale : "tr";
  const t = await getTranslations({ locale, namespace: "consent" });
  if (!parsed.success || !parsed.data.kvkk_notice || !parsed.data.abroad_transfer) {
    return { error: t("mustAccept") };
  }

  // Every choice is logged, including the optional ones the user left unticked.
  const supabase = await createClient();
  const { error } = await supabase.from("consent_events").insert(
    (["kvkk_notice", "abroad_transfer", "analytics", "marketing"] as const).map((kind) => ({
      user_id: user.id,
      kind,
      version: CONSENT_VERSION,
      granted: parsed.data[kind],
    })),
  );
  if (error) {
    const tc = await getTranslations({ locale, namespace: "common" });
    return { error: tc("genericError") };
  }

  const profile = await getProfile();
  return redirect({ href: profile?.onboarded_at ? "/" : "/hosgeldin", locale });
}
