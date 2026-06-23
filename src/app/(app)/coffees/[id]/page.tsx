import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteCoffee } from "@/app/(app)/coffees/actions";
import { BrewRow } from "@/components/brew-row";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { BrewWithCoffee, Coffee } from "@/lib/types";

function Info({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function CoffeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: coffeeData }, { data: brewData }] = await Promise.all([
    supabase.from("coffees").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("brews")
      .select("*, coffee:coffees(id, name, roaster, process)")
      .eq("coffee_id", id)
      .order("brewed_at", { ascending: false }),
  ]);

  if (!coffeeData) notFound();
  const coffee = coffeeData as Coffee;
  const brews = (brewData ?? []) as unknown as BrewWithCoffee[];

  const rated = brews.filter((b) => b.rating != null);
  const avg =
    rated.length > 0
      ? (rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length).toFixed(1)
      : null;
  const best = rated.reduce<number | null>(
    (m, b) => (m == null || (b.rating ?? 0) > m ? b.rating : m),
    null,
  );

  const fmtDate = (d: string | null) =>
    d ? format(new Date(d), "d MMM yyyy", { locale: es }) : null;

  return (
    <>
      <PageHeader
        title={coffee.name}
        subtitle={coffee.roaster ?? undefined}
        backHref="/coffees"
      />

      <div className="flex flex-col gap-4">
        {coffee.process && (
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{coffee.process}</Badge>
            {coffee.roast_level && <Badge>{coffee.roast_level}</Badge>}
          </div>
        )}

        <Card className="divide-y divide-border py-1">
          <Info label="Origen" value={coffee.origin_country} />
          <Info label="Región" value={coffee.region} />
          <Info label="Comprado" value={fmtDate(coffee.purchase_date)} />
          <Info label="Abierto" value={fmtDate(coffee.open_date)} />
        </Card>

        {coffee.notes && (
          <Card>
            <div className="text-xs text-muted">Notas</div>
            <p className="mt-1 text-sm leading-relaxed">{coffee.notes}</p>
          </Card>
        )}

        {rated.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Preparaciones" value={String(brews.length)} />
            <Stat label="Promedio" value={avg ?? "—"} />
            <Stat label="Mejor" value={best != null ? String(best) : "—"} />
          </div>
        )}

        <section>
          <h2 className="mb-2.5 text-sm font-semibold">
            Preparaciones {brews.length > 0 && `(${brews.length})`}
          </h2>
          {brews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
              Todavía no has preparado este café.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {brews.map((b) => (
                <BrewRow key={b.id} brew={b} />
              ))}
            </div>
          )}
        </section>

        <form action={deleteCoffee}>
          <input type="hidden" name="id" value={coffee.id} />
          <Button type="submit" variant="ghost" className="w-full text-bad">
            <Trash2 className="h-4 w-4" /> Eliminar café
          </Button>
        </form>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-muted px-3 py-3 text-center">
      <div className="font-mono text-xl font-semibold">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted">{label}</div>
    </div>
  );
}
