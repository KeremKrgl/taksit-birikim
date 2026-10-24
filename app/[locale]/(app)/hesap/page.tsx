import { Download } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getProfile, getUser } from "@/lib/auth";
import { ConsentsForm, DeleteAccountForm, ProfileForm, SignOutForm } from "./account-forms";

export async function generateMetadata({ params }: PageProps<"/[locale]/hesap">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("title") };
}

export default async function AccountPage({ params }: PageProps<"/[locale]/hesap">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {user.email ? <p className="mt-1 break-all text-muted-foreground">{t("signedInAs", { email: user.email })}</p> : null}
        <p className="mt-1 text-sm">
          {t("plan")}: <strong>{profile.plan === "premium" ? t("planPremium") : t("planFree")}</strong>
        </p>
      </header>

      <Card className="space-y-4">
        <CardTitle>{t("profileSection")}</CardTitle>
        <ProfileForm name={profile.display_name ?? ""} locale={profile.locale} />
      </Card>

      <Card className="space-y-4">
        <CardTitle>{t("consentsSection")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("consentsHelp")}</p>
        <ConsentsForm analytics={profile.analytics_consent} marketing={profile.marketing_consent} />
        <p className="text-sm text-muted-foreground">{t("abroadNote")}</p>
        <Link href="/aydinlatma-metni" className="text-sm font-medium text-primary underline underline-offset-4">
          {t("noticeLink")}
        </Link>
      </Card>

      <Card className="space-y-3">
        <CardTitle>{t("dataSection")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("exportHelp")}</p>
        {/* A plain link: the browser downloads the file the route returns. */}
        <a href="/api/export" download className={buttonVariants({ variant: "outline" })}>
          <Download aria-hidden className="size-5" />
          {t("export")}
        </a>
      </Card>

      <SignOutForm locale={locale} />

      <Card className="space-y-3 border-destructive/40">
        <CardTitle className="text-destructive">{t("deleteSection")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("deleteHelp")}</p>
        <DeleteAccountForm />
      </Card>
    </div>
  );
}
