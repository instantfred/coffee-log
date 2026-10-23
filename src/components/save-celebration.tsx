"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

export function SaveCelebration({ updated = false }: { updated?: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("saved");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    const timer = window.setTimeout(() => setVisible(false), 6000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return <div role="status" className="save-celebration mb-5 flex items-center gap-3 rounded-2xl border border-good/20 bg-[#edf6ee] p-4 text-foreground">
    <span className="success-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-good text-white"><Check className="h-5 w-5" /></span>
    <div className="flex-1"><p className="text-sm font-semibold">{updated ? "Tu receta, un paso más cerca" : "Tu taza quedó registrada ☕"}</p><p className="text-xs text-muted">{updated ? "Los cambios están guardados." : "Cada taza tiene algo que enseñarte."}</p></div>
    <button type="button" onClick={() => setVisible(false)} aria-label="Cerrar confirmación" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-good/10"><X className="h-4 w-4" /></button>
  </div>;
}
