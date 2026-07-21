import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { methodName, ratingTone } from "@/lib/domain";
import type { AttemptChange, RecipeGroup } from "@/lib/evolution";

function ChangePill({ change }: { change: AttemptChange }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[11px]">
      <span className="text-muted">{change.label}</span>
      <span className="font-medium">
        {change.from} → {change.to}
      </span>
      {change.direction === "up" && <ArrowUp className="h-3 w-3 text-muted" />}
      {change.direction === "down" && <ArrowDown className="h-3 w-3 text-muted" />}
    </span>
  );
}

function TrendBadge({ delta }: { delta: number | null }) {
  if (delta == null || delta === 0) return null;
  const positive = delta > 0;
  return (
    <Badge tone={positive ? "good" : "bad"}>
      {positive ? "+" : ""}
      {delta} pts
    </Badge>
  );
}

export function RecipeEvolution({ groups }: { groups: RecipeGroup[] }) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g.method}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{methodName(g.method)}</h3>
              <p className="mt-0.5 font-mono text-xs text-muted">
                {g.trend.map((r) => r ?? "—").join("  →  ")}
              </p>
            </div>
            <TrendBadge delta={g.ratingDelta} />
          </div>

          <ol className="flex flex-col">
            {g.attempts.map((a, i) => {
              const last = i === g.attempts.length - 1;
              return (
                <li key={a.brew.id} className="flex gap-3">
                  {/* Timeline rail */}
                  <div className="flex flex-col items-center">
                    <div
                      className={
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold " +
                        (a.isBest
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface-muted text-muted")
                      }
                    >
                      {a.number}
                    </div>
                    {!last && <div className="w-px flex-1 bg-border" />}
                  </div>

                  {/* Attempt card */}
                  <Link
                    href={`/brews/${a.brew.id}`}
                    className="mb-3 flex-1 rounded-2xl border border-border bg-surface p-3.5 transition-colors hover:bg-surface-muted"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {format(new Date(a.brew.brewed_at), "d MMM yyyy", { locale: es })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {a.isBest && (
                          <Badge tone="accent" className="gap-0.5">
                            <Star className="h-3 w-3 fill-current" /> Mejor
                          </Badge>
                        )}
                        {a.brew.rating != null ? (
                          <Badge tone={ratingTone(a.brew.rating)}>{a.brew.rating}/10</Badge>
                        ) : (
                          <span className="text-xs text-muted">sin calificar</span>
                        )}
                      </div>
                    </div>

                    {a.changes.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-muted">vs. anterior:</span>
                        {a.changes.map((c) => (
                          <ChangePill key={c.label} change={c} />
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
