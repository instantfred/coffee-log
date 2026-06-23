import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Coffee } from "@/lib/types";

export default async function CoffeesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coffees")
    .select("*")
    .order("created_at", { ascending: false });

  const coffees = (data ?? []) as Coffee[];

  return (
    <>
      <PageHeader
        title="Cafés"
        subtitle={coffees.length ? `${coffees.length} en tu biblioteca` : undefined}
        action={
          <Button asChild size="sm">
            <Link href="/coffees/new">
              <Plus className="h-4 w-4" /> Nuevo
            </Link>
          </Button>
        }
      />

      {coffees.length === 0 ? (
        <EmptyState
          emoji="🫘"
          title="Tu biblioteca está vacía"
          description="Agrega los cafés que tienes en casa para asociarlos a tus preparaciones."
          actionLabel="Agregar café"
          actionHref="/coffees/new"
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {coffees.map((c) => (
            <Link
              key={c.id}
              href={`/coffees/${c.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-muted"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.name}</div>
                <div className="mt-0.5 truncate text-xs text-muted">
                  {[c.roaster, c.origin_country, c.region]
                    .filter(Boolean)
                    .join(" · ") || "Sin detalles"}
                </div>
                {c.process && (
                  <Badge tone="accent" className="mt-2">
                    {c.process}
                  </Badge>
                )}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
