"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/app/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/types";
import { finishWelcome } from "./actions";

export function WelcomeForm({ locale, defaultName }: { locale: string; defaultName: string }) {
  const t = useTranslations("welcome");
  const tc = useTranslations("common");
  const [state, action] = useActionState(finishWelcome, initialActionState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <Label htmlFor="display_name">{t("nameLabel")}</Label>
      <Input
        id="display_name"
        name="display_name"
        autoComplete="given-name"
        maxLength={60}
        defaultValue={defaultName}
        placeholder={t("namePlaceholder")}
      />
      <FormMessage message={state.error} />
      <SubmitButton size="full" pendingLabel={tc("saving")} className="mt-3">
        {t("start")}
      </SubmitButton>
    </form>
  );
}
