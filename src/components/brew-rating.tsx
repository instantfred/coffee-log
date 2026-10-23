"use client";

import { ChevronDown, Star } from "lucide-react";
import { useRef, useState } from "react";

export function BrewRating({ initialRating }: { initialRating?: number | null }) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);

  function choose(value: number | null) {
    setRating(value);
    details.current?.removeAttribute("open");
    summary.current?.focus();
  }

  return (
    <details
      ref={details}
      className="group rounded-3xl border border-[#d9baa3]/60 bg-gradient-to-br from-[#fffaf4] to-[#f3e6d9] shadow-[var(--shadow-card)]"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          details.current?.removeAttribute("open");
          summary.current?.focus();
        }
      }}
    >
      <summary ref={summary} className="flex min-h-20 cursor-pointer list-none items-center gap-3 rounded-3xl px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-accent shadow-sm">
          <Star className="h-5 w-5" fill={rating != null ? "currentColor" : "none"} strokeWidth={1.5} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Tu calificación</span>
          <span className="block text-xs text-muted">{rating == null ? "¿Qué tal estuvo esta taza?" : "Un recuerdo de cómo la disfrutaste"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-primary">
          {rating == null ? <span className="rounded-full border border-primary/15 bg-white/70 px-3 py-2 text-xs font-semibold">Calificar</span> : <span><span className="font-mono text-2xl font-semibold tracking-tight">{rating}</span><span className="ml-0.5 text-xs text-muted">/10</span></span>}
          <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <input type="hidden" name="rating" value={rating ?? ""} />
      <div className="reveal mx-4 mb-4 border-t border-primary/10 pt-3">
        <p className="mb-2 text-xs text-muted">Elige una nota del 1 al 10</p>
        <div role="group" aria-label="Calificación de la taza" className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} de 10`}
              aria-pressed={rating === value}
              onClick={() => choose(value)}
              className={`min-h-11 rounded-xl border text-sm font-semibold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${rating === value ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-primary/10 bg-white/70 text-primary hover:border-primary/40 hover:bg-white"}`}
            >{value}</button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted"><span>No me gustó</span><span>Mi taza ideal</span></div>
        {rating != null && <button type="button" onClick={() => choose(null)} className="mt-2 min-h-9 text-xs text-primary underline underline-offset-4">Quitar calificación</button>}
        <p className="mt-1 text-[10px] text-muted">Opcional · puedes dejarla para después.</p>
      </div>
    </details>
  );
}
