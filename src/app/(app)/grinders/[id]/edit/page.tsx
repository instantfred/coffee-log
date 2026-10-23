import { notFound } from "next/navigation";
import { GrinderForm } from "@/components/grinder-form";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Grinder } from "@/lib/types";

export default async function EditGrinderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("grinders").select("*").eq("id", id).eq("archived", false).maybeSingle();
  if (!data) notFound();
  return <>
    <PageHeader title="Editar moledor" backHref="/grinders" />
    <GrinderForm grinder={data as Grinder} />
  </>;
}
