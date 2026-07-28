import { notFound } from "next/navigation";
import { updateBrew } from "@/app/(app)/brews/actions";
import { BrewForm } from "@/components/brew-form";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Brew } from "@/lib/types";

export default async function EditBrewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: brew } = await supabase
    .from("brews")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!brew) notFound();

  // Active coffees, plus this brew's assigned coffee even if it's finished, so
  // the current selection is never silently dropped when editing.
  let coffeeQuery = supabase
    .from("coffees")
    .select("id, name, roaster, finished")
    .order("created_at", { ascending: false });
  coffeeQuery = brew.coffee_id
    ? coffeeQuery.or(`finished.eq.false,id.eq.${brew.coffee_id}`)
    : coffeeQuery.eq("finished", false);
  const { data: coffees } = await coffeeQuery;

  return (
    <>
      <PageHeader title="Editar preparación" backHref={`/brews/${id}`} />
      <BrewForm coffees={coffees ?? []} action={updateBrew} brew={brew as Brew} />
    </>
  );
}
