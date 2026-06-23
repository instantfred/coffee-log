import { BrewForm } from "@/components/brew-form";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

export default async function NewBrewPage() {
  const supabase = await createClient();
  const { data: coffees } = await supabase
    .from("coffees")
    .select("id, name, roaster")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Nueva preparación" backHref="/brews" />
      <BrewForm coffees={coffees ?? []} />
    </>
  );
}
