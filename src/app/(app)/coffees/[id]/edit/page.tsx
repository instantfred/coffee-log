import { notFound } from "next/navigation";
import { updateCoffee } from "@/app/(app)/coffees/actions";
import { CoffeeForm } from "@/components/coffee-form";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Coffee } from "@/lib/types";

export default async function EditCoffeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: coffee } = await supabase
    .from("coffees")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!coffee) notFound();

  return (
    <>
      <PageHeader title="Editar café" backHref={`/coffees/${id}`} />
      <CoffeeForm action={updateCoffee} coffee={coffee as Coffee} />
    </>
  );
}
