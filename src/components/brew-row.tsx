import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { formatRatio, methodEmoji, methodName, ratingTone } from "@/lib/domain";
import type { BrewWithCoffee } from "@/lib/types";

export function BrewRow({ brew }: { brew: BrewWithCoffee }) {
  return (
    <Link
      href={`/brews/${brew.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 transition-colors hover:bg-surface-muted"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-xl">
        {methodEmoji(brew.method)}
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
          <span>· {format(new Date(brew.brewed_at), "d MMM", { locale: es })}</span>
        </div>
      </div>
      {brew.rating != null && (
        <Badge tone={ratingTone(brew.rating)} className="shrink-0 text-sm">
          {brew.rating}
        </Badge>
      )}
    </Link>
  );
}
