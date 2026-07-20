"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCoffee, type CoffeeFormState } from "@/app/(app)/coffees/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PROCESSES, ROAST_LEVELS } from "@/lib/domain";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Guardando…" : "Guardar café"}
    </Button>
  );
}

export function CoffeeForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<CoffeeFormState, FormData>(
    createCoffee,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nombre" htmlFor="name">
        <Input id="name" name="name" placeholder="Finca La Esperanza" required />
      </Field>
      <Field label="Tostador" htmlFor="roaster">
        <Input id="roaster" name="roaster" placeholder="Tostaduría local" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="País de origen" htmlFor="origin_country">
          <Input id="origin_country" name="origin_country" placeholder="Colombia" />
        </Field>
        <Field label="Región" htmlFor="region">
          <Input id="region" name="region" placeholder="Huila" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Proceso" htmlFor="process">
          <Select id="process" name="process" defaultValue="">
            <option value="">—</option>
            {PROCESSES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nivel de tueste" htmlFor="roast_level">
          <Select id="roast_level" name="roast_level" defaultValue="">
            <option value="">—</option>
            {ROAST_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Fecha de tueste"
        htmlFor="roast_date"
        hint="La frescura importa — verás cuántos días lleva tostado."
      >
        <Input id="roast_date" name="roast_date" type="date" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha de compra" htmlFor="purchase_date">
          <Input id="purchase_date" name="purchase_date" type="date" />
        </Field>
        <Field label="Fecha de apertura" htmlFor="open_date">
          <Input id="open_date" name="open_date" type="date" />
        </Field>
      </div>

      <Field label="Notas" htmlFor="notes">
        <Textarea id="notes" name="notes" placeholder="Notas del tostador, altitud, varietal…" />
      </Field>

      {state.error && (
        <p className="rounded-2xl bg-bad/10 px-4 py-3 text-sm text-bad">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <div className="flex-1">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
