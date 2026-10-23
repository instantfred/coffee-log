import { notFound } from "next/navigation";
import { z } from "zod";
import { copyBrewRecipe } from "@/lib/brew-recipe";
import type { Brew, Grinder } from "@/lib/types";
import { BrewForm } from "@/components/brew-form";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

export default async function NewBrewPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const supabase = await createClient();
  const { data: coffees } = await supabase
    .from("coffees")
    .select("id, name, roaster")
    .eq("finished", false)
    .order("created_at", { ascending: false });

  const { data: grinders, error: grinderError } = await supabase.from("grinders").select("*").eq("archived", false).order("name");
  if (grinderError) throw new Error("No se pudieron cargar los moledores. Verifica la migración de la base de datos.");

  let source: Brew | undefined;
  if (from) {
    if (!z.uuid().safeParse(from).success) notFound();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();
    const { data, error } = await supabase.from("brews").select("*").eq("id", from).eq("user_id", user.id).maybeSingle();
    if (error || !data) notFound();
    source = data as Brew;
  }
  const recipe = source ? copyBrewRecipe(source, coffees ?? [], (grinders ?? []) as Grinder[]) : undefined;
  const missingCoffee = source?.coffee_id && !recipe?.coffee_id;
  const missingGrinder = source?.grinder_id && !recipe?.grinder_id;

  return (
    <>
      <PageHeader title="Nueva preparación" backHref="/brews" />
      {source && <div role="status" className="reveal mb-5 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm">
        <p className="font-medium">Una nueva taza, la misma base.</p>
        <p className="mt-1 text-xs text-muted">Copiamos la receta. La fecha y el resultado corresponden a tu nueva preparación.</p>
        {(missingCoffee || missingGrinder) && <p className="mt-2 text-xs text-primary">{missingCoffee ? "El café original ya no está disponible. Elige otro. " : ""}{missingGrinder ? "El moledor original no está disponible o cambió su tipo de ajuste. Revisa la molienda y elige uno disponible." : ""}</p>}
      </div>}
      <BrewForm key={from ?? "new"} recipe={recipe} grinders={grinders ?? []} coffees={coffees ?? []} />
    </>
  );
}
