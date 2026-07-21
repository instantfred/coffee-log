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

  const [{ data: brew }, { data: coffees }] = await Promise.all([
    supabase.from("brews").select("*").eq("id", id).maybeSingle(),
    supabase.from("coffees").select("id, name, roaster").order("created_at", { ascending: false }),
  ]);

  if (!brew) notFound();

  return (
    <>
      <PageHeader title="Editar preparación" backHref={`/brews/${id}`} />
      <BrewForm coffees={coffees ?? []} action={updateBrew} brew={brew as Brew} />
    </>
  );
}
