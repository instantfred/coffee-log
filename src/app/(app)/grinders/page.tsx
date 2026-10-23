import Link from "next/link";
import { deleteGrinder } from "@/app/(app)/grinders/actions";
import { ConfirmDelete } from "@/components/confirm-delete";
import { GrinderForm } from "@/components/grinder-form";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Grinder } from "@/lib/types";

export default async function GrindersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("grinders").select("*").eq("archived", false).order("name");
  return (
    <>
      <PageHeader title="Mis moledores" subtitle="Configura cómo registras tu molienda." backHref="/library" />
      <div className="flex flex-col gap-5">
        {error ? <p role="alert" className="text-sm text-bad">No se pudieron cargar los moledores. Verifica que la migración de la base de datos esté aplicada.</p> : <>
          {data.length ? <div className="flex flex-col gap-2.5">{(data as Grinder[]).map((g) => (
            <Card key={g.id}>
              <div className="font-medium">{g.name}</div>
              <div className="text-xs text-muted">{g.grind_type === "clicks" ? "Ajuste por clics" : "Molienda general"}</div>
              <div className="mt-3 flex items-center gap-3">
                <Link href={`/grinders/${g.id}/edit`} className="text-sm font-medium text-primary hover:underline">Editar</Link>
                <ConfirmDelete action={deleteGrinder} id={g.id} triggerLabel="Eliminar" title={`¿Eliminar ${g.name}?`} description="Dejará de aparecer al registrar preparaciones. Tus registros anteriores conservarán el moledor y la molienda utilizados." />
              </div>
            </Card>
          ))}</div> : <p className="text-sm text-muted">Todavía no tienes moledores. Registra el primero para usarlo en tus preparaciones.</p>}
          <GrinderForm />
          <Link href="/brews/new" className="text-sm font-medium text-primary hover:underline">Registrar preparación →</Link>
        </>}
      </div>
    </>
  );
}
