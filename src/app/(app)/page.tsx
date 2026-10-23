import { ArrowUpRight, Coffee, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { BrewRow } from "@/components/brew-row";
import { EmptyState } from "@/components/empty-state";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
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
        <div className="flex items-center gap-3">
          <div className="gradient-coffee flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[var(--shadow-soft)]">
            <Logo className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Coffee Log</h1>
            <p className="text-xs text-muted">Tu diario de café</p>
          </div>
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

      <section className="ritual-hero reveal mb-6 rounded-[2rem] p-6 text-[#fff8ee]">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#edcbb4]">Un momento para ti</span>
          <div aria-hidden="true" className="relative flex h-14 w-14 items-end justify-center">
            <span className="steam absolute left-5 top-0 h-4 w-1 rounded-full bg-[#edcbb4]/50" />
            <span className="steam steam-late absolute right-5 top-0 h-4 w-1 rounded-full bg-[#edcbb4]/50" />
            <Coffee className="h-10 w-10 text-[#edcbb4]" strokeWidth={1.2} />
          </div>
        </div>
        <h2 className="max-w-64 text-3xl font-semibold leading-tight tracking-tight">¿Qué preparamos hoy?</h2>
        <p className="mt-3 max-w-64 text-sm leading-relaxed text-[#edcbb4]">Tu próxima taza favorita empieza con un pequeño ritual.</p>
        <Button asChild variant="accent" className="mt-5">
          <Link href="/brews/new"><Plus className="h-4 w-4" /> Preparar una taza <ArrowUpRight className="h-4 w-4" /></Link>
        </Button>
      </section>
      {brews.length > 0 && <section className="mb-6">
        <div className="mb-2.5 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /><h2 className="text-sm font-semibold">Tu última taza</h2></div>
        <BrewRow brew={brews[0]} />
      </section>}
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
          <div className="stagger grid grid-cols-2 gap-3">
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
            <div className="stagger flex flex-col gap-2.5">
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
