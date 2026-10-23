"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // The app works without it; offline reading is the only thing lost.
    });
  }, []);
  return null;
}

/** Removes every page cached for offline reading. Call before signing out or deleting the account. */
export async function clearOfflineData() {
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: "clear-user-data" });
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("pages-")).map((k) => caches.delete(k)));
    }
  } catch {
    // Nothing cached, or storage is blocked: nothing to clear.
  }
}
