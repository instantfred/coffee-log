"use client";

import { useState } from "react";
import Link from "next/link";
import { RecipeEvolution } from "@/components/recipe-evolution";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { formatGrind, formatRatio, formatTime, methodName } from "@/lib/domain";
import { analyzeRecipe } from "@/lib/recipe-analysis";
import type { BrewWithCoffee } from "@/lib/types";

export function AnalysisExplorer({ brews }: { brews: BrewWithCoffee[] }) {
  const coffees = [...new Map(brews.flatMap((b) => b.coffee ? [[b.coffee.id, b.coffee] as const] : [])).values()];
  const [coffeeId, setCoffeeId] = useState(coffees[0]?.id ?? "");
  const methods = [...new Set(brews.filter((b) => b.coffee?.id === coffeeId).map((b) => b.method))];
  const [selectedMethod, setMethod] = useState(methods[0] ?? "");
  const method = methods.includes(selectedMethod) ? selectedMethod : methods[0] ?? "";
  const { group, best, latest, previous, ratedCount } = analyzeRecipe(brews, coffeeId, method);
  if (!coffees.length) return <Card><p className="text-sm text-muted">Asocia un café a tus preparaciones para comparar recetas y seguir su evolución.</p><Link className="mt-3 inline-block text-sm underline" href="/brews">Ver preparaciones</Link></Card>;

  return <section className="flex flex-col gap-4" aria-label="Explorar recetas">
    <div><h2 className="font-semibold">Tu receta, intento a intento</h2><p className="mt-1 text-sm text-muted">Compara preparaciones del mismo café y método.</p></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Café" htmlFor="analysis-coffee"><Select id="analysis-coffee" value={coffeeId} onChange={(e) => setCoffeeId(e.target.value)}>{coffees.map((c) => <option key={c.id} value={c.id}>{c.name}{c.roaster ? ` · ${c.roaster}` : ""}</option>)}</Select></Field>
      <Field label="Método" htmlFor="analysis-method"><Select id="analysis-method" value={method} onChange={(e) => setMethod(e.target.value)}>{methods.map((m) => <option key={m} value={m}>{methodName(m)}</option>)}</Select></Field>
    </div>
    <Card className="border-accent/30">
      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Tu receta para repetir</h3>{best && <Badge tone="accent">{best.rating}/10</Badge>}</div>
      {best ? <>
        <p className="mt-1 text-xs text-muted">La mejor calificada entre {ratedCount} {ratedCount === 1 ? "preparación calificada" : "preparaciones calificadas"}. {ratedCount < 3 ? "Aún tienes pocos registros para comparar." : "En caso de empate, mostramos la más reciente."}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {([
            ["Café / agua", `${best.dose_g == null ? "—" : `${best.dose_g} g`} / ${best.water_g == null ? "—" : `${best.water_g} g`}`],
            ["Ratio", formatRatio(best.ratio)], ["Temperatura", best.water_temp_c == null ? "—" : `${best.water_temp_c} °C`],
            ["Tiempo", formatTime(best.total_time_seconds)], ["Molienda", formatGrind(best)],
          ]).map(([label, value]) => <div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="mt-0.5 font-medium">{value}</dd></div>)}
        </dl>
        <div className="mt-5 flex flex-wrap gap-2"><Button asChild size="sm" variant="accent"><Link href={`/brews/new?from=${best.id}`}>Repetir receta</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/brews/${best.id}`}>Ver preparación</Link></Button></div>
      </> : <p className="mt-2 text-sm text-muted">Califica una preparación de esta receta para identificar tu favorita.</p>}
    </Card>
    {latest && <Card>
      <h3 className="text-sm font-semibold">Tu último intento</h3>
      <p className="mt-2 text-sm">{previous ? `${previous.rating ?? "Sin nota"} → ${latest.rating ?? "Sin nota"}` : latest.rating != null ? `${latest.rating}/10` : "Sin calificar"}{previous && <span className="text-muted"> · anterior → último</span>}</p>
      {best && latest.id !== best.id && <>
        <p className="mt-1 text-xs text-muted">Tu mejor preparación recibió {best.rating}/10.</p>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="mb-2 text-left font-medium">Mejor receta frente al último intento</caption><thead><tr><th className="py-2">Parámetro</th><th>Mejor</th><th>Último</th></tr></thead><tbody>
          {([
            ["Ratio", formatRatio(best.ratio), formatRatio(latest.ratio)],
            ["Temperatura", best.water_temp_c == null ? "—" : `${best.water_temp_c} °C`, latest.water_temp_c == null ? "—" : `${latest.water_temp_c} °C`],
            ["Tiempo", formatTime(best.total_time_seconds), formatTime(latest.total_time_seconds)],
            ["Molienda", formatGrind(best), formatGrind(latest)],
          ]).map(([label, before, after]) => <tr key={label} className="border-t border-border"><th className="py-2 pr-2 font-normal text-muted">{label}</th><td className="pr-2">{before}</td><td className={before !== after ? "font-semibold" : ""}>{after}</td></tr>)}
        </tbody></table></div>
      </>}
      {group && group.attempts.at(-1)!.changes.length > 0 && <div className="mt-3"><p className="text-xs text-muted">Cambios frente al intento anterior:</p><ul className="mt-1 space-y-1 text-xs">{group.attempts.at(-1)!.changes.map((c) => <li key={c.label}>{c.label}: {c.from} → {c.to}</li>)}</ul></div>}
      <Link className="mt-3 inline-block text-sm underline" href={`/brews/${latest.id}`}>{latest.rating == null ? "Calificar preparación" : "Ver último intento"}</Link>
    </Card>}
    {group && <Card>
      <h3 className="mb-3 text-sm font-semibold">Evolución de tus calificaciones</h3>
      <TrendChart brews={group.attempts.map((a) => a.brew)} />
      <p className="mb-4 mt-2 text-xs text-muted">Cada punto es una preparación calificada. Los huecos indican intentos sin nota. Los cambios registrados describen lo que hiciste; no prueban qué causó el resultado.</p>
      <details><summary className="cursor-pointer text-sm font-medium">Ver intentos y cambios ({group.attempts.length})</summary><div className="mt-4"><RecipeEvolution groups={[group]} /></div></details>
    </Card>}
  </section>;
}

function TrendChart({ brews }: { brews: BrewWithCoffee[] }) {
  const x = (i: number) => brews.length === 1 ? 160 : 30 + i * 270 / (brews.length - 1);
  const y = (rating: number) => 120 - (rating - 1) * 11;
  return <svg viewBox="0 0 320 148" className="w-full text-accent" role="img" aria-label={`Calificaciones por intento: ${brews.map((b, i) => `${i + 1}: ${b.rating ?? "sin nota"}`).join(", ")}`}>
    {[1, 5, 10].map((r) => <g key={r}><line x1="25" x2="310" y1={y(r)} y2={y(r)} stroke="currentColor" opacity="0.12" /><text x="4" y={y(r) + 4} fontSize="10" fill="currentColor">{r}</text></g>)}
    {brews.map((b, i) => <g key={b.id}>
      {i > 0 && b.rating != null && brews[i - 1].rating != null && <line x1={x(i - 1)} y1={y(brews[i - 1].rating!)} x2={x(i)} y2={y(b.rating)} stroke="currentColor" strokeWidth="2" />}
      {b.rating != null && <circle cx={x(i)} cy={y(b.rating)} r="4" fill="currentColor"><title>Intento {i + 1}: {b.rating}/10</title></circle>}
      {(i === 0 || i === brews.length - 1) && <text x={x(i)} y="143" textAnchor="middle" fontSize="10" fill="currentColor">#{i + 1}</text>}
    </g>)}
  </svg>;
}
