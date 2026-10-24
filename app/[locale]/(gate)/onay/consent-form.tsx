"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/app/submit-button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";
import { initialActionState } from "@/lib/actions/types";
import { giveConsent } from "./actions";

export function ConsentForm({ locale }: { locale: string }) {
  const t = useTranslations("consent");
  const tc = useTranslations("common");
  const [state, action] = useActionState(giveConsent, initialActionState);
  const req = <span className="text-sm text-muted-foreground"> ({tc("required")})</span>;
  const opt = <span className="text-sm text-muted-foreground"> ({tc("optional")})</span>;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <fieldset className="space-y-5">
        <legend className="sr-only">{t("title")}</legend>
        <CheckboxField id="kvkk_notice" name="kvkk_notice" required label={<>{t("kvkkLabel")}{req}</>} />
        <CheckboxField
          id="abroad_transfer"
          name="abroad_transfer"
          required
          label={<>{t("abroadLabel")}{req}</>}
          help={t("abroadHelp")}
        />
        <CheckboxField id="analytics" name="analytics" label={<>{t("analyticsLabel")}{opt}</>} help={t("analyticsHelp")} />
        <CheckboxField id="marketing" name="marketing" label={<>{t("marketingLabel")}{opt}</>} />
      </fieldset>
      <FormMessage message={state.error} />
      <SubmitButton size="full" pendingLabel={tc("saving")}>
        {t("submit")}
      </SubmitButton>
    </form>
  );
}
