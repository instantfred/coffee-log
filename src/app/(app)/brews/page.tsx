import Link from "next/link";
import { Plus } from "lucide-react";
import { BrewRow } from "@/components/brew-row";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { BrewWithCoffee } from "@/lib/types";

export default async function BrewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brews")
    .select("*, coffee:coffees(id, name, roaster, process)")
    .order("brewed_at", { ascending: false });

  const brews = (data ?? []) as unknown as BrewWithCoffee[];

  return (
    <>
      <PageHeader
        title="Registros"
        subtitle={brews.length ? `${brews.length} preparaciones` : undefined}
        action={
          <Button asChild size="sm">
            <Link href="/brews/new">
              <Plus className="h-4 w-4" /> Nueva
            </Link>
          </Button>
        }
      />

      {brews.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="Aún no hay preparaciones"
          description="Registra tu primera taza para empezar a construir tu historial."
          actionLabel="Registrar preparación"
          actionHref="/brews/new"
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {brews.map((brew) => (
            <BrewRow key={brew.id} brew={brew} />
          ))}
        </div>
      )}
    </>
  );
}
