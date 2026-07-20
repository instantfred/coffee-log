"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so the app is installable and works offline.
 * Production only — a SW in dev caches aggressively and fights HMR.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

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
