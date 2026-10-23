"use client";

import { useActionState } from "react";
import type { Grinder } from "@/lib/types";
import { createGrinder, updateGrinder } from "@/app/(app)/grinders/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

export function GrinderForm({ grinder }: { grinder?: Grinder }) {
  const [state, action, pending] = useActionState(grinder ? updateGrinder : createGrinder, {});
  return (
    <form action={action} className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
      {grinder && <input type="hidden" name="id" value={grinder.id} />}
      <h2 className="text-sm font-semibold">{grinder ? "Editar moledor" : "Registrar moledor"}</h2>
      <Field label="Nombre" htmlFor="name">
        <Input id="name" name="name" defaultValue={grinder?.name ?? ""} required maxLength={100} placeholder="Por ejemplo: Timemore C2" />
      </Field>
      <Field label="Tipo de molienda" htmlFor="grind_type" hint="Las nuevas preparaciones usarán este ajuste. Las anteriores conservarán su tipo de molienda.">
        <Select id="grind_type" name="grind_type" defaultValue={grinder?.grind_type ?? "general"}>
          <option value="general">General (fina, media, gruesa…)</option>
          <option value="clicks">Clics</option>
        </Select>
      </Field>
      {state.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-primary">{state.success}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar moledor"}</Button>
    </form>
  );
}
