import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getProfile, requireUser } from "@/lib/auth";
import { hasCurrentConsent } from "@/lib/consent";
import { ConsentForm } from "./consent-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/onay">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "consent" });
  return { title: t("title") };
}

export default async function ConsentPage({ params }: PageProps<"/[locale]/onay">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser();
  const profile = await getProfile();
  if (profile && hasCurrentConsent(profile)) return redirect({ href: profile.onboarded_at ? "/" : "/hosgeldin", locale });

  const t = await getTranslations("consent");
  return (
    <main id="main" className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("intro")}</p>
      <p className="mt-4">
        <Link href="/aydinlatma-metni" target="_blank" className="font-medium text-primary underline underline-offset-4">
          {t("readNotice")}
        </Link>
      </p>
      <div className="mt-8">
        <ConsentForm locale={locale} />
      </div>
    </main>
  );
}
