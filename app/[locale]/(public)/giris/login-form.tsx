"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/app/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/types";
import { sendMagicLink, signInWithGoogle } from "./actions";

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("login");
  const [state, action] = useActionState(sendMagicLink, initialActionState);

  if (state.ok) {
    return (
      <div role="status" className="space-y-2 rounded-lg border border-border bg-secondary p-4 text-secondary-foreground">
        <p className="font-medium">{state.message}</p>
        <p className="text-sm">{t("linkSentHint")}</p>
      </div>
    );
  }

  const emailError = state.fieldErrors?.email;
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-3" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder={t("emailPlaceholder")}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError ? (
          <p id="email-error" role="alert" className="text-sm font-medium text-destructive">
            {emailError}
          </p>
        ) : null}
        <FormMessage message={state.error} />
        <SubmitButton size="full" pendingLabel={t("sending")}>
          {t("sendLink")}
        </SubmitButton>
      </form>

      <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        {t("or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="locale" value={locale} />
        <SubmitButton variant="outline" size="full" pendingLabel={t("sending")}>
          <GoogleMark />
          {t("google")}
        </SubmitButton>
      </form>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}
