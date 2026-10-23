"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so the app is installable and works offline.
 * Production only — a SW in dev caches aggressively and fights HMR.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // A worker installed by an earlier production run can still control dev
      // and serve stale CSS at stable /_next/static/ URLs. Retire only our worker.
      const isOurWorker = (worker: ServiceWorker | null | undefined) => {
        if (!worker) return false;
        const url = new URL(worker.scriptURL);
        return url.origin === window.location.origin && url.pathname === "/sw.js";
      };
      void (async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        const controlled = isOurWorker(navigator.serviceWorker.controller);
        const owned = controlled || isOurWorker(registration?.active) || isOurWorker(registration?.waiting) || isOurWorker(registration?.installing);
        if (!owned) return;
        if (registration) await registration.unregister();
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((key) => key.startsWith("coffee-log-")).map((key) => caches.delete(key)));
        }
        // Unregistering takes effect on navigation, not on the current document.
        if (controlled) window.location.reload();
      })().catch(() => {
        // Development remains usable if browser settings block cache access.
      });
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app still works online.
      });
    };

    // In a hydrated app the effect often runs *after* window "load" has already
    // fired, so a plain load listener would never trigger — register now if the
    // document is ready, otherwise wait for load.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
