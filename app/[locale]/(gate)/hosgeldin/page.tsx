import { CalendarClock, ChartColumn, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InstallPrompt } from "@/components/app/install-prompt";
import { redirect } from "@/i18n/navigation";
import { getProfile, requireUser } from "@/lib/auth";
import { hasCurrentConsent } from "@/lib/consent";
import { WelcomeForm } from "./welcome-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/hosgeldin">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "welcome" });
  return { title: t("title") };
}

export default async function WelcomePage({ params }: PageProps<"/[locale]/hosgeldin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser();
  const profile = await getProfile();
  if (!profile || !hasCurrentConsent(profile)) return redirect({ href: "/onay", locale });
  if (profile.onboarded_at) return redirect({ href: "/", locale });

  const t = await getTranslations("welcome");
  const points = [
    { icon: CalendarClock, text: t("point1") },
    { icon: ChartColumn, text: t("point2") },
    { icon: TrendingUp, text: t("point3") },
  ];
  return (
    <main id="main" className="mx-auto max-w-md space-y-8 px-5 py-10">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("intro")}</p>
        <ul className="mt-5 space-y-4">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="pt-2">{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <InstallPrompt />
      <WelcomeForm locale={locale} defaultName={profile.display_name ?? ""} />
    </main>
  );
}
