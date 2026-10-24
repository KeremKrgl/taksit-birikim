"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { clearOfflineData } from "@/components/app/service-worker-register";
import { SubmitButton } from "@/components/app/submit-button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/types";
import { deleteAccount, signOut, updateConsents, updateProfile } from "./actions";

export function ProfileForm({ name, locale }: { name: string; locale: string }) {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const [state, action] = useActionState(updateProfile, initialActionState);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="display_name">{t("nameLabel")}</Label>
        <Input id="display_name" name="display_name" autoComplete="given-name" maxLength={60} defaultValue={name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="locale">{t("languageLabel")}</Label>
        <select
          id="locale"
          name="locale"
          defaultValue={locale}
          className="block min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="tr">{t("languageTr")}</option>
          <option value="en">{t("languageEn")}</option>
        </select>
      </div>
      <FormMessage message={state.error} />
      <FormMessage message={state.message} tone="success" />
      <SubmitButton pendingLabel={tc("saving")}>{tc("save")}</SubmitButton>
    </form>
  );
}

export function ConsentsForm({ analytics, marketing }: { analytics: boolean; marketing: boolean }) {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const [state, action] = useActionState(updateConsents, initialActionState);
  return (
    <form action={action} className="space-y-4">
      <CheckboxField id="analytics" name="analytics" defaultChecked={analytics} label={t("analytics")} />
      <CheckboxField id="marketing" name="marketing" defaultChecked={marketing} label={t("marketing")} />
      <FormMessage message={state.error} />
      <FormMessage message={state.message} tone="success" />
      <SubmitButton variant="outline" pendingLabel={tc("saving")}>
        {tc("save")}
      </SubmitButton>
    </form>
  );
}

export function DeleteAccountForm() {
  const t = useTranslations("account");
  const [state, action] = useActionState(async (prev: typeof initialActionState, formData: FormData) => {
    await clearOfflineData();
    return deleteAccount(prev, formData);
  }, initialActionState);
  const err = state.fieldErrors?.confirm;
  const word = t("deleteWord");
  return (
    <form action={action} className="space-y-3">
      <Label htmlFor="confirm">{t("deleteConfirmLabel", { word })}</Label>
      <Input
        id="confirm"
        name="confirm"
        autoComplete="off"
        autoCapitalize="characters"
        required
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? "confirm-error" : undefined}
      />
      {err ? (
        <p id="confirm-error" role="alert" className="text-sm font-medium text-destructive">
          {err}
        </p>
      ) : null}
      <FormMessage message={state.error} />
      <SubmitButton variant="destructive" size="full" pendingLabel={t("deleting")}>
        {t("deleteButton")}
      </SubmitButton>
    </form>
  );
}

export function SignOutForm({ locale }: { locale: string }) {
  const t = useTranslations("account");
  return (
    <form
      action={async (formData) => {
        await clearOfflineData();
        await signOut(formData);
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton variant="outline" size="full" pendingLabel={t("signOut")}>
        {t("signOut")}
      </SubmitButton>
    </form>
  );
}
