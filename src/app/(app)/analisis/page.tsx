import Link from "next/link";
import { AnalysisExplorer } from "@/components/analysis-explorer";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { analyzeBrews } from "@/lib/analysis";
import { methodName } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import type { BrewWithCoffee } from "@/lib/types";

export default async function AnalisisPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("brews")
    .select("*, coffee:coffees(id, name, roaster, process)")
    .order("brewed_at", { ascending: false });
  if (error) throw new Error("No se pudieron cargar las preparaciones para el análisis.");
  const brews = (data ?? []) as unknown as BrewWithCoffee[];
  const a = analyzeBrews(brews);
  const recent = brews.filter((b) => b.rating != null).slice(0, 10);
  const good = recent.filter((b) => b.rating! >= 8).length;

  return <>
    <PageHeader title="Análisis" subtitle="Descubre qué repetir y sigue la evolución de tus recetas." />
    {brews.length === 0 ? <EmptyState emoji="🔬" title="Tu primera taza es el comienzo" description="Registra una preparación y califícala para empezar a explorar tus recetas." actionLabel="Registrar preparación" actionHref="/brews/new" /> :
      <div className="flex flex-col gap-6">
        {recent.length > 0 && <Card className="py-4"><p className="text-sm"><strong>{good} de tus últimas {recent.length} preparaciones calificadas</strong> recibieron 8 o más.</p><p className="mt-1 text-xs text-muted">{a.ratedBrews} de {a.totalBrews} preparaciones tienen calificación.{recent.length < 3 ? " Una primera referencia; sigue registrando para comparar." : ""}</p></Card>}
        <AnalysisExplorer brews={brews} />
        {a.methods.length > 0 && <section>
          <h2 className="mb-2 text-sm font-semibold">Qué métodos disfrutas</h2>
          <p className="mb-3 text-xs text-muted">Promedios de tu historial; los cafés y recetas pueden ser distintos.</p>
          <Card className="flex flex-col gap-4">{a.methods.map((m) => {
            const rated = brews.filter((b) => b.method === m.method && b.rating != null);
            return <div key={m.method}><RatingBar label={methodName(m.method)} avg={m.avgRating} detail={`${m.ratedCount} calificadas de ${m.count}`} />
              {rated.length > 0 && <div className="mt-2 flex h-2 overflow-hidden rounded-full" role="img" aria-label={`Distribución: ${rated.filter((b) => b.rating! < 5).length} notas de 1 a 4, ${rated.filter((b) => b.rating! >= 5 && b.rating! < 8).length} de 5 a 7, ${rated.filter((b) => b.rating! >= 8).length} de 8 a 10`}>
                {[[1, 4, "bg-bad"], [5, 7, "bg-mid"], [8, 10, "bg-good"]].map(([min, max, color]) => <span key={min} className={String(color)} style={{ width: `${rated.filter((b) => b.rating! >= Number(min) && b.rating! <= Number(max)).length / rated.length * 100}%` }} />)}
              </div>}
            </div>;
          })}<p className="text-xs text-muted">Distribución: rojo 1–4 · ámbar 5–7 · verde 8–10. Con pocos registros, el promedio es una referencia inicial.</p></Card>
        </section>}
        {a.coffees.length > 0 && <section><h2 className="mb-3 text-sm font-semibold">Tus cafés mejor calificados</h2><Card className="flex flex-col gap-4">{a.coffees.map((c) => <Link key={c.id} href={`/coffees/${c.id}`} className="rounded focus-visible:outline-2 focus-visible:outline-accent"><RatingBar label={c.key} avg={c.avgRating} detail={`${c.count} preparaciones calificadas · Ver café →`} /></Link>)}</Card></section>}
        {a.processes.length > 0 && <section><h2 className="mb-3 text-sm font-semibold">Lo que sugieren tus gustos por proceso</h2><Card className="flex flex-col gap-4">{a.processes.map((p) => {
          const coffees = new Set(brews.filter((b) => b.coffee?.process === p.key && b.rating != null).map((b) => b.coffee!.id)).size;
          return <RatingBar key={p.key} label={p.key} avg={p.avgRating} detail={`${p.count} preparaciones calificadas · ${coffees} ${coffees === 1 ? "café" : "cafés"}`} />;
        })}<p className="text-xs text-muted">Un solo café puede influir mucho en un proceso. Estas comparaciones describen tu historial y no aíslan el efecto del proceso.</p></Card></section>}
        <p className="text-center text-xs text-muted">Los rankings de cafés y procesos incluyen al menos 2 preparaciones calificadas por grupo.</p>
      </div>}
  </>;
}

function RatingBar({ label, avg, detail }: { label: string; avg: number | null; detail: string }) {
  return <div><div className="flex items-start justify-between gap-3"><span className="text-sm font-medium">{label}</span><span className="shrink-0 text-sm">{avg == null ? "Sin nota" : `${avg}/10`}</span></div><p className="mt-1 text-xs text-muted">{detail}</p></div>;
}
