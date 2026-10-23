import { BrewForm } from "@/components/brew-form";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

export default async function NewBrewPage() {
  const supabase = await createClient();
  const { data: coffees } = await supabase
    .from("coffees")
    .select("id, name, roaster")
    .eq("finished", false)
    .order("created_at", { ascending: false });

  const { data: grinders, error: grinderError } = await supabase.from("grinders").select("*").eq("archived", false).order("name");
  if (grinderError) throw new Error("No se pudieron cargar los moledores. Verifica la migración de la base de datos.");

  return (
    <>
      <PageHeader title="Nueva preparación" backHref="/brews" />
      <BrewForm grinders={grinders ?? []} coffees={coffees ?? []} />
    </>
  );
}
