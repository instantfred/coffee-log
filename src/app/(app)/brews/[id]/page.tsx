import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBrew } from "@/app/(app)/brews/actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import {
  formatRatio,
  formatTime,
  methodAbbr,
  methodName,
  ratingTone,
} from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import type { BrewWithCoffee } from "@/lib/types";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-muted px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}

export default async function BrewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("brews")
    .select("*, coffee:coffees(id, name, roaster, process)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const brew = data as unknown as BrewWithCoffee;

  return (
    <>
      <PageHeader
        title={methodName(brew.method)}
        subtitle={format(new Date(brew.brewed_at), "EEEE d 'de' MMMM, HH:mm", {
          locale: es,
        })}
        backHref="/brews"
      />

      <div className="flex flex-col gap-4">
        <Card className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-sm font-bold tracking-tight text-primary">
            {methodAbbr(brew.method)}
          </div>
          <div className="flex-1">
            {brew.coffee ? (
              <Link href={`/coffees/${brew.coffee.id}`} className="font-medium hover:underline">
                {brew.coffee.name}
              </Link>
            ) : (
              <span className="text-muted">Café sin asignar</span>
            )}
            {brew.coffee?.roaster && (
              <div className="text-xs text-muted">{brew.coffee.roaster}</div>
            )}
          </div>
          {brew.rating != null && (
            <div className="text-right">
              <Badge tone={ratingTone(brew.rating)} className="text-base">
                {brew.rating}/10
              </Badge>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Café" value={brew.dose_g != null ? `${brew.dose_g} g` : "—"} />
          <Stat label="Agua" value={brew.water_g != null ? `${brew.water_g} g` : "—"} />
          <Stat label="Ratio" value={formatRatio(brew.ratio)} />
          <Stat
            label="Temperatura"
            value={brew.water_temp_c != null ? `${brew.water_temp_c}°C` : "—"}
          />
          <Stat label="Tiempo" value={formatTime(brew.total_time_seconds)} />
          <Stat label="Molienda" value={brew.grind_size ?? "—"} />
        </div>

        {(brew.flavor_notes || brew.comments || brew.satisfaction != null) && (
          <Card className="flex flex-col gap-3">
            {brew.satisfaction != null && (
              <div>
                <div className="text-xs text-muted">Satisfacción</div>
                <div className="font-medium">{brew.satisfaction}/5</div>
              </div>
            )}
            {brew.flavor_notes && (
              <div>
                <div className="text-xs text-muted">Notas de sabor</div>
                <p className="mt-0.5 text-sm leading-relaxed">{brew.flavor_notes}</p>
              </div>
            )}
            {brew.comments && (
              <div>
                <div className="text-xs text-muted">Comentarios</div>
                <p className="mt-0.5 text-sm leading-relaxed">{brew.comments}</p>
              </div>
            )}
          </Card>
        )}

        <form action={deleteBrew}>
          <input type="hidden" name="id" value={brew.id} />
          <Button type="submit" variant="ghost" className="w-full text-bad">
            <Trash2 className="h-4 w-4" /> Eliminar preparación
          </Button>
        </form>
      </div>
    </>
  );
}
