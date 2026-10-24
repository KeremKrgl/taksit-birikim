import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NoticeContent } from "@/components/legal/notice-content";
import { CONSENT_VERSION } from "@/lib/consent";

export async function generateMetadata({ params }: PageProps<"/[locale]/aydinlatma-metni">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notice" });
  return { title: t("title") };
}

export default async function NoticePage({ params }: PageProps<"/[locale]/aydinlatma-metni">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notice");
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">v{CONSENT_VERSION}</p>
      <p className="mt-4 rounded-lg border border-warning/40 bg-card p-3 text-sm font-medium text-warning">{t("draft")}</p>
      <div className="mt-8">
        <NoticeContent locale={locale} />
      </div>
    </main>
  );
}
