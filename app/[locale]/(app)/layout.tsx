import { setRequestLocale } from "next-intl/server";
import { BottomNav } from "@/components/app/bottom-nav";
import { redirect } from "@/i18n/navigation";
import { getProfile, requireUser } from "@/lib/auth";
import { hasCurrentConsent } from "@/lib/consent";

// Every screen in here needs a signed-in user who has accepted the current notice.
export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser();
  const profile = await getProfile();
  if (!profile || !hasCurrentConsent(profile)) return redirect({ href: "/onay", locale });
  if (!profile.onboarded_at) return redirect({ href: "/hosgeldin", locale });

  return (
    <>
      <main id="main" className="mx-auto max-w-md px-4 pb-28 pt-6">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
