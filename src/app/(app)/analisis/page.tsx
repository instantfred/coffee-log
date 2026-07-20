import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge, Card } from "@/components/ui/card";
import { analyzeBrews, type MethodStat, type Range } from "@/lib/analysis";
import { formatRatio, formatTime, methodEmoji, methodName, ratingTone } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import type { BrewWithCoffee } from "@/lib/types";

export default async function AnalisisPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brews")
    .select("*, coffee:coffees(id, name, roaster, process)")
    .order("brewed_at", { ascending: false });

  const brews = (data ?? []) as unknown as BrewWithCoffee[];
  const a = analyzeBrews(brews);

  if (!a.hasEnoughData) {
    const remaining = Math.max(0, 3 - a.ratedBrews);
    return (
      <>
        <PageHeader title="Análisis" />
        <EmptyState
          emoji="🔬"
          title="Aún no hay suficientes datos"
          description={
            remaining > 0
              ? `Registra ${remaining} preparación(es) más con calificación y empezaré a encontrar tus patrones.`
              : "Califica algunas preparaciones y aquí verás tus patrones."
          }
          actionLabel="Registrar preparación"
          actionHref="/brews/new"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Análisis"
        subtitle={`Basado en ${a.ratedBrews} preparaciones calificadas`}
      />

      <div className="flex flex-col gap-6">
        {/* ── Headlines: the "aha" observations ── */}
        {a.headlines.length > 0 && (
          <section className="flex flex-col gap-2.5">
            {a.headlines.map((h) => (
              <Card
                key={h.id}
                className="flex items-start gap-3 p-4"
              >
                <span className="text-xl leading-none">{h.icon}</span>
                <p className="text-sm leading-relaxed">{h.text}</p>
              </Card>
            ))}
          </section>
        )}

        {/* ── Per-method breakdown ── */}
        {a.methods.length > 0 && (
          <section>
            <h2 className="mb-2.5 text-sm font-semibold">Por método</h2>
            <div className="flex flex-col gap-2.5">
              {a.methods.map((m) => (
                <MethodCard key={m.method} m={m} />
              ))}
            </div>
          </section>
        )}

        {/* ── Process ranking ── */}
        {a.processes.length > 0 && (
          <section>
            <h2 className="mb-2.5 text-sm font-semibold">Por proceso</h2>
            <Card className="flex flex-col gap-3">
              {a.processes.map((p) => (
                <RatingBar key={p.key} label={p.key} avg={p.avgRating} count={p.count} />
              ))}
            </Card>
          </section>
        )}

        {/* ── Coffee ranking ── */}
        {a.coffees.length > 0 && (
          <section>
            <h2 className="mb-2.5 text-sm font-semibold">Tus cafés mejor calificados</h2>
            <Card className="flex flex-col gap-3">
              {a.coffees.map((c) => (
                <RatingBar key={c.id} label={c.key} avg={c.avgRating} count={c.count} />
              ))}
            </Card>
          </section>
        )}

        <p className="px-1 text-center text-xs text-muted">
          Las observaciones se afinan con cada preparación que registras.
        </p>
      </div>
    </>
  );
}

function MethodCard({ m }: { m: MethodStat }) {
  const chips: { label: string; value: string }[] = [];
  if (m.ratio) chips.push({ label: "Ratio", value: rangeStr(m.ratio, formatRatio) });
  if (m.temp) chips.push({ label: "Temp.", value: rangeStr(m.temp, (n) => `${Math.round(n)}°C`) });
  if (m.time) chips.push({ label: "Tiempo", value: rangeStr(m.time, formatTime) });
  if (m.topGrind) chips.push({ label: "Molienda", value: m.topGrind.value });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted text-lg">
          {methodEmoji(m.method)}
        </span>
        <div className="flex-1">
          <div className="font-medium">{methodName(m.method)}</div>
          <div className="text-xs text-muted">
            {m.count} preparaciones
            {m.consistency != null && ` · consistencia ±${m.consistency}`}
          </div>
        </div>
        {m.avgRating != null && (
          <Badge tone={ratingTone(Math.round(m.avgRating))} className="text-sm">
            {m.avgRating}
          </Badge>
        )}
      </div>

      {chips.length > 0 ? (
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-1.5 text-xs text-muted">
            Punto dulce (tus mejores {m.bestCupCount} tazas)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span
                key={c.label}
                className="rounded-full bg-surface-muted px-2.5 py-1 text-xs"
              >
                <span className="text-muted">{c.label}: </span>
                <span className="font-medium">{c.value}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        m.ratedCount < 3 && (
          <p className="mt-2 text-xs text-muted">
            Registra más {methodName(m.method)} para ver su punto dulce.
          </p>
        )
      )}
    </Card>
  );
}

function RatingBar({
  label,
  avg,
  count,
}: {
  label: string;
  avg: number;
  count: number;
}) {
  const pct = Math.max(4, Math.min(100, (avg / 10) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="ml-2 shrink-0 text-muted">
          {avg} <span className="text-xs">· {count}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function rangeStr(r: Range, fmt: (n: number) => string): string {
  return r.min === r.max ? fmt(r.avg) : `${fmt(r.min)}–${fmt(r.max)}`;
}
