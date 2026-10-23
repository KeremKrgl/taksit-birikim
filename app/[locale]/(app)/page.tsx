import { CreditCard } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InstallPrompt } from "@/components/app/install-prompt";
import { Card } from "@/components/ui/card";
import { getProfile } from "@/lib/auth";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const profile = await getProfile();
  const name = profile?.display_name;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{name ? t("greeting", { name }) : t("greetingNoName")}</h1>
      <Card className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <CreditCard aria-hidden className="size-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">{t("emptyTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
        <p className="mt-4 text-sm font-medium text-primary">{t("comingSoon")}</p>
      </Card>
      <InstallPrompt />
    </div>
  );
}
