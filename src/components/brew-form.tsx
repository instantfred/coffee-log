"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createBrew, type BrewFormState } from "@/app/(app)/brews/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  BREW_METHODS,
  computeRatio,
  formatRatio,
  GRIND_SIZES,
  METHODS_BY_KEY,
  type MethodKey,
} from "@/lib/domain";

type CoffeeOption = { id: string; name: string; roaster: string | null };

function nowLocalInput() {
  // datetime-local needs "YYYY-MM-DDTHH:mm" in local time.
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Guardando…" : "Guardar preparación"}
    </Button>
  );
}

export function BrewForm({ coffees }: { coffees: CoffeeOption[] }) {
  const router = useRouter();
  const [state, formAction] = useActionState<BrewFormState, FormData>(
    createBrew,
    {},
  );
  const [method, setMethod] = useState<MethodKey>("v60");
  const [dose, setDose] = useState("");
  const [water, setWater] = useState("");

  const ratio = computeRatio(Number(dose), Number(water));
  const hint = METHODS_BY_KEY[method];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <section className="flex flex-col gap-4">
        <Field label="Método" htmlFor="method">
          <Select
            id="method"
            name="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as MethodKey)}
          >
            {BREW_METHODS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Café" htmlFor="coffee_id" hint="Opcional — elige de tu biblioteca.">
          <Select id="coffee_id" name="coffee_id" defaultValue="">
            <option value="">— Sin asignar —</option>
            {coffees.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.roaster ? ` · ${c.roaster}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Fecha y hora" htmlFor="brewed_at">
          <Input
            id="brewed_at"
            name="brewed_at"
            type="datetime-local"
            defaultValue={nowLocalInput()}
          />
        </Field>
      </section>

      {/* Recipe */}
      <section className="rounded-3xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Receta</h2>
          <div className="text-right">
            <div className="text-xs text-muted">Ratio</div>
            <div className="font-mono text-lg font-semibold text-accent">
              {formatRatio(ratio)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Café (g)" htmlFor="dose_g">
            <Input
              id="dose_g"
              name="dose_g"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="18"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
            />
          </Field>
          <Field label="Agua (g)" htmlFor="water_g">
            <Input
              id="water_g"
              name="water_g"
              type="number"
              inputMode="decimal"
              step="1"
              placeholder="288"
              value={water}
              onChange={(e) => setWater(e.target.value)}
            />
          </Field>
          <Field
            label="Temp. (°C)"
            htmlFor="water_temp_c"
            hint={`Típico ~93°C`}
          >
            <Input
              id="water_temp_c"
              name="water_temp_c"
              type="number"
              inputMode="decimal"
              step="0.5"
              placeholder="93"
            />
          </Field>
          <Field label="Molienda" htmlFor="grind_size" hint={hint.grindHint}>
            <Select id="grind_size" name="grind_size" defaultValue={hint.grindHint}>
              <option value="">—</option>
              {GRIND_SIZES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Tiempo de extracción">
            <div className="flex items-center gap-2">
              <Input
                name="time_minutes"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="min"
                aria-label="Minutos"
              />
              <span className="text-muted">:</span>
              <Input
                name="time_seconds"
                type="number"
                inputMode="numeric"
                min="0"
                max="59"
                placeholder="seg"
                aria-label="Segundos"
              />
            </div>
          </Field>
        </div>
      </section>

      {/* Result */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">Resultado</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Calificación (1–10)" htmlFor="rating">
            <Input
              id="rating"
              name="rating"
              type="number"
              inputMode="numeric"
              min="1"
              max="10"
              placeholder="8"
            />
          </Field>
          <Field label="Satisfacción (1–5)" htmlFor="satisfaction">
            <Input
              id="satisfaction"
              name="satisfaction"
              type="number"
              inputMode="numeric"
              min="1"
              max="5"
              placeholder="4"
            />
          </Field>
        </div>
        <Field label="Notas de sabor" htmlFor="flavor_notes">
          <Textarea
            id="flavor_notes"
            name="flavor_notes"
            placeholder="Chocolate, caramelo, acidez cítrica…"
          />
        </Field>
        <Field label="Comentarios" htmlFor="comments">
          <Textarea
            id="comments"
            name="comments"
            placeholder="¿Qué cambiarías la próxima vez?"
          />
        </Field>
      </section>

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
