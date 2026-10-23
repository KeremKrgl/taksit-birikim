import { Check } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/giris">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: t("title") };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/giris">) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getUser()) return redirect({ href: "/", locale });

  const { error, deleted } = await searchParams;
  const t = await getTranslations("login");
  const tc = await getTranslations("common");
  const notice = deleted ? t("deleted") : error === "link" ? t("linkExpired") : error ? tc("genericError") : null;

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{tc("appName")}</p>
      <h1 className="mt-2 text-3xl font-bold">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>

      {notice ? (
        <p role="status" className="mt-6 rounded-lg border border-border bg-card p-3 text-sm">
          {notice}
        </p>
      ) : null}

      <div className="mt-8">
        <LoginForm locale={locale} />
      </div>

      <section className="mt-10" aria-labelledby="promises">
        <h2 id="promises" className="text-base font-semibold">
          {t("promises.title")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(["noBank", "noCardNumber", "delete"] as const).map((k) => (
            <li key={k} className="flex gap-2">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              {t(`promises.${k}`)}
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto flex justify-between pt-10 text-sm">
        <Link href="/aydinlatma-metni" className="text-primary underline underline-offset-4">
          {t("noticeLink")}
        </Link>
        <Link href="/giris" locale={locale === "tr" ? "en" : "tr"} className="text-muted-foreground underline underline-offset-4">
          {locale === "tr" ? "English" : "Türkçe"}
        </Link>
      </footer>
    </main>
  );
}
