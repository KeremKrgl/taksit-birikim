"use client";

import { Share } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

const DISMISS_KEY = "install-prompt-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const noSubscribe = () => () => {};

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false; // Storage blocked: show the prompt, just don't remember the choice.
  }
}

/** Offers "add to home screen": a button on Android/Chrome, written steps on iPhone. */
export function InstallPrompt() {
  const t = useTranslations("install");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [closed, setClosed] = useState(false);
  // Read once from the browser; on the server all three are false, so nothing renders there.
  const ios = useSyncExternalStore(noSubscribe, () => /iphone|ipad|ipod/i.test(navigator.userAgent), () => false);
  const installed = useSyncExternalStore(noSubscribe, isStandalone, () => true);
  const dismissed = useSyncExternalStore(noSubscribe, readDismissed, () => true);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (closed || installed || dismissed || (!ios && !deferred)) return null;

  const dismiss = () => {
    setClosed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <aside className="rounded-lg border border-border bg-secondary p-4 text-secondary-foreground">
      <h2 className="font-semibold">{t("title")}</h2>
      <p className="mt-1 text-sm">{t("body")}</p>
      {ios ? (
        <p className="mt-2 flex items-start gap-2 text-sm">
          <Share aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("iosSteps")}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {deferred ? (
          <Button
            size="sm"
            onClick={async () => {
              await deferred.prompt();
              setDeferred(null);
              setClosed(true);
            }}
          >
            {t("button")}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={dismiss}>
          {t("dismiss")}
        </Button>
      </div>
    </aside>
  );
}
