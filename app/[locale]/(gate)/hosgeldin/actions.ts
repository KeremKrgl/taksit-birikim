"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import type { ActionState } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const welcomeSchema = z.object({
  locale: z.enum(["tr", "en"]).catch("tr"),
  display_name: z
    .string()
    .trim()
    .max(60)
    .transform((v) => v || null),
});

export async function finishWelcome(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = welcomeSchema.safeParse({
    locale: formData.get("locale"),
    display_name: formData.get("display_name") ?? "",
  });
  const locale = parsed.success ? parsed.data.locale : "tr";
  const tc = await getTranslations({ locale, namespace: "common" });
  if (!parsed.success) return { error: tc("genericError") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.display_name, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: tc("genericError") };
  return redirect({ href: "/", locale });
}
