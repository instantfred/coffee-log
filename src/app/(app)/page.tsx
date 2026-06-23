import { LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { BrewRow } from "@/components/brew-row";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { methodName } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import type { BrewWithCoffee } from "@/lib/types";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 truncate text-2xl font-semibold tracking-tight">
        {value}
      </div>
      {sub && <div className="truncate text-xs text-muted">{sub}</div>}
    </Card>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brews")
    .select("*, coffee:coffees(id, name, roaster, process)")
    .order("brewed_at", { ascending: false });

  const brews = (data ?? []) as unknown as BrewWithCoffee[];

  // ── Lightweight stats (deeper analysis comes in a later milestone) ──
  const rated = brews.filter((b) => b.rating != null);
  const avg =
    rated.length > 0
      ? (rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length).toFixed(1)
      : "—";

  const methodCounts = brews.reduce<Record<string, number>>((acc, b) => {
    acc[b.method] = (acc[b.method] ?? 0) + 1;
    return acc;
  }, {});
  const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0];

  const bestBrew = rated.reduce<BrewWithCoffee | null>(
    (best, b) => (!best || (b.rating ?? 0) > (best.rating ?? 0) ? b : best),
    null,
  );

  return (
    <>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coffee Log</h1>
          <p className="text-sm text-muted">Tu diario de café ☕</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </header>

      {brews.length === 0 ? (
        <EmptyState
          emoji="☕"
          title="Bienvenido a Coffee Log"
          description="Registra tu primera preparación y empieza a descubrir cómo te gusta tu café."
          actionLabel="Registrar mi primera taza"
          actionHref="/brews/new"
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Preparaciones" value={String(brews.length)} />
            <StatCard label="Puntuación media" value={avg} sub="sobre 10" />
            <StatCard
              label="Método favorito"
              value={topMethod ? methodName(topMethod[0]) : "—"}
              sub={topMethod ? `${topMethod[1]} preparaciones` : undefined}
            />
            <StatCard
              label="Mejor taza"
              value={bestBrew?.rating != null ? `${bestBrew.rating}/10` : "—"}
              sub={bestBrew?.coffee?.name ?? undefined}
            />
          </div>

          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Historial reciente</h2>
              <Link href="/brews" className="text-sm text-primary hover:underline">
                Ver todo
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {brews.slice(0, 5).map((b) => (
                <BrewRow key={b.id} brew={b} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
