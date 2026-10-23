import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { MethodIcon } from "@/components/method-icon";
import { Badge } from "@/components/ui/card";
import { formatRatio, methodName, ratingTone, wallDate } from "@/lib/domain";
import type { BrewWithCoffee } from "@/lib/types";

export function BrewRow({ brew }: { brew: BrewWithCoffee }) {
  return (
    <Link
      href={`/brews/${brew.id}`}
      className="brew-card interactive-card flex items-center gap-3 rounded-3xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3e5d8] text-[11px] font-bold tracking-tight text-primary">
        <MethodIcon method={brew.method} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">
            {brew.coffee?.name ?? methodName(brew.method)}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          <span>{methodName(brew.method)}</span>
          {brew.ratio != null && <span>· {formatRatio(brew.ratio)}</span>}
          <span>· {format(wallDate(brew.brewed_at), "d MMM", { locale: es })}</span>
        </div>
        {brew.flavor_notes && <div className="mt-2 flex flex-wrap gap-1">
          {brew.flavor_notes.split(/[,;·]/).map((note) => note.trim()).filter(Boolean).slice(0, 3).map((note, i) => <span key={i} className="max-w-32 truncate rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-primary">{note}</span>)}
        </div>}
      </div>
      {brew.rating != null && (
        <Badge tone={ratingTone(brew.rating)} className="shrink-0 text-sm">
          <span className="text-base font-bold">{brew.rating}</span><span className="text-[10px] opacity-75">/10</span>
        </Badge>
      )}
    </Link>
  );
}
