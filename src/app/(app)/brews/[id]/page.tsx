import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, Clock3, Pencil, Repeat2, Settings2, Star, Thermometer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBrew } from "@/app/(app)/brews/actions";
import { SaveCelebration } from "@/components/save-celebration";
import { ConfirmDelete } from "@/components/confirm-delete";
import { MethodIcon } from "@/components/method-icon";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { formatGrind, formatRatio, formatTime, methodName, wallDate } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import type { BrewWithCoffee } from "@/lib/types";

export default async function BrewDetailPage({ params, searchParams }: {
  searchParams: Promise<{ saved?: string }>;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("brews").select("*, coffee:coffees(id, name, roaster, process)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const brew = data as unknown as BrewWithCoffee;
  const flavors = brew.flavor_notes?.split(/[,;·\n]/).map((note) => note.trim()).filter(Boolean) ?? [];

  return <>
    {saved === "updated" && <SaveCelebration updated />}
    <PageHeader title="Tu taza" backHref="/brews" action={
      <Button asChild variant="outline" size="sm"><Link href={`/brews/${brew.id}/edit`}><Pencil className="h-4 w-4" /> Editar</Link></Button>
    } />
    <div className="flex flex-col gap-4">
      <section className="ritual-hero reveal rounded-[2rem] p-6 text-[#fff8ee]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[#edcbb4]">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><MethodIcon method={brew.method} /></span>
            {methodName(brew.method)}
          </div>
          <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-2">
            {brew.rating != null ? <div className="flex items-center gap-1.5"><Star aria-hidden="true" className="h-3.5 w-3.5 text-[#edcbb4]" fill="currentColor" /><span className="text-2xl font-semibold">{brew.rating}<span className="ml-0.5 text-xs font-normal text-[#edcbb4]">/10</span></span><span className="sr-only">Calificación</span></div> : <span className="text-xs text-[#edcbb4]">Sin calificar</span>}
          </div>
        </div>
        <h2 className="mt-6 break-words text-3xl font-semibold leading-tight tracking-tight">
          {brew.coffee ? <Link href={`/coffees/${brew.coffee.id}`} className="decoration-white/40 underline-offset-4 hover:underline">{brew.coffee.name}</Link> : "Café sin asignar"}
        </h2>
        {brew.coffee?.roaster && <p className="mt-2 text-sm text-[#edcbb4]">{brew.coffee.roaster}</p>}
        <p className="mt-5 border-t border-white/15 pt-4 text-xs text-[#edcbb4]">{format(wallDate(brew.brewed_at), "EEEE d 'de' MMMM, HH:mm", { locale: es })}</p>
      </section>

      <Card className="reveal">
        <h2 className="text-xs font-semibold uppercase tracking-[.16em] text-muted">La receta</h2>
        <div className="my-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <div><p className="text-[10px] text-muted">Café</p><p className="font-mono text-xl font-semibold">{brew.dose_g ?? "—"}<span className="ml-1 text-xs font-normal text-muted">g</span></p></div>
          <ArrowRight aria-hidden="true" className="h-4 w-4 text-accent" />
          <div><p className="text-[10px] text-muted">Agua</p><p className="font-mono text-xl font-semibold">{brew.water_g ?? "—"}<span className="ml-1 text-xs font-normal text-muted">g</span></p></div>
          <span className="rounded-xl bg-accent/10 px-3 py-2 font-mono text-sm font-semibold text-accent">{formatRatio(brew.ratio)}</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-4 text-sm">
          <div className="flex items-center gap-2"><Thermometer aria-hidden="true" className="h-4 w-4 text-accent" /><span><span className="sr-only">Temperatura: </span>{brew.water_temp_c != null ? `${brew.water_temp_c} °C` : "Sin temperatura"}</span></div>
          <div className="flex items-center gap-2"><Clock3 aria-hidden="true" className="h-4 w-4 text-accent" /><span><span className="sr-only">Tiempo: </span>{formatTime(brew.total_time_seconds)}</span></div>
          <div className="flex w-full items-start gap-2"><Settings2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span className="break-words"><span className="sr-only">Moledor y molienda: </span>{formatGrind(brew)}</span></div>
        </div>
      </Card>

      <Button asChild size="lg" variant="accent" className="w-full"><Link href={`/brews/new?from=${brew.id}`}><Repeat2 className="h-4 w-4" /> Preparar de nuevo</Link></Button>
      <p className="-mt-2 text-center text-xs text-muted">La misma receta, una nueva oportunidad de disfrutarla.</p>

      {(flavors.length > 0 || brew.comments || brew.satisfaction != null) && <Card className="flex flex-col gap-5">
        {flavors.length > 0 && <div><h2 className="mb-3 text-xs font-semibold uppercase tracking-[.12em] text-muted">En esta taza</h2><div className="flex flex-wrap gap-2">{flavors.map((note, index) => <Badge key={index} tone="accent" className="max-w-full whitespace-normal break-words px-3 py-1.5">{note}</Badge>)}</div></div>}
        {brew.comments && <div><h2 className="mb-2 text-xs font-semibold text-muted">Tus comentarios</h2><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{brew.comments}</p></div>}
        {brew.satisfaction != null && <p className="text-xs text-muted">Satisfacción registrada: {brew.satisfaction}/5</p>}
      </Card>}
      <ConfirmDelete action={deleteBrew} id={brew.id} triggerLabel="Eliminar preparación" title="¿Eliminar esta preparación?" description="Se borrará de forma permanente. Esta acción no se puede deshacer." />
    </div>
  </>;
}
