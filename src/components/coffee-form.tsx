"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCoffee, type CoffeeFormState } from "@/app/(app)/coffees/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PROCESSES, ROAST_LEVELS } from "@/lib/domain";
import type { Coffee } from "@/lib/types";

type CoffeeAction = (
  prev: CoffeeFormState,
  formData: FormData,
) => Promise<CoffeeFormState>;

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar café"}
    </Button>
  );
}

export function CoffeeForm({
  action = createCoffee,
  coffee,
}: {
  action?: CoffeeAction;
  coffee?: Coffee;
}) {
  const router = useRouter();
  const isEdit = !!coffee;
  const [state, formAction] = useActionState<CoffeeFormState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isEdit && <input type="hidden" name="id" value={coffee.id} />}

      <Field label="Nombre" htmlFor="name">
        <Input id="name" name="name" placeholder="Finca La Esperanza" required defaultValue={coffee?.name ?? ""} />
      </Field>
      <Field label="Tostador" htmlFor="roaster">
        <Input id="roaster" name="roaster" placeholder="Tostaduría local" defaultValue={coffee?.roaster ?? ""} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="País de origen" htmlFor="origin_country">
          <Input id="origin_country" name="origin_country" placeholder="Colombia" defaultValue={coffee?.origin_country ?? ""} />
        </Field>
        <Field label="Región" htmlFor="region">
          <Input id="region" name="region" placeholder="Huila" defaultValue={coffee?.region ?? ""} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Proceso" htmlFor="process">
          <Select id="process" name="process" defaultValue={coffee?.process ?? ""}>
            <option value="">—</option>
            {PROCESSES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nivel de tueste" htmlFor="roast_level">
          <Select id="roast_level" name="roast_level" defaultValue={coffee?.roast_level ?? ""}>
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
        <Input id="roast_date" name="roast_date" type="date" defaultValue={coffee?.roast_date ?? ""} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha de compra" htmlFor="purchase_date">
          <Input id="purchase_date" name="purchase_date" type="date" defaultValue={coffee?.purchase_date ?? ""} />
        </Field>
        <Field label="Fecha de apertura" htmlFor="open_date">
          <Input id="open_date" name="open_date" type="date" defaultValue={coffee?.open_date ?? ""} />
        </Field>
      </div>

      <Field label="Notas" htmlFor="notes">
        <Textarea id="notes" name="notes" placeholder="Notas del tostador, altitud, varietal…" defaultValue={coffee?.notes ?? ""} />
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
          <SubmitButton isEdit={isEdit} />
        </div>
      </div>
    </form>
  );
}
