"use client";

import { Coffee, LoaderCircle } from "lucide-react";
import { BrewRating } from "@/components/brew-rating";
import { BrewDateInput } from "@/components/brew-date-input";
import { MethodIcon } from "@/components/method-icon";
import Link from "next/link";
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
import type { Brew, Grinder } from "@/lib/types";

type CoffeeOption = {
  id: string;
  name: string;
  roaster: string | null;
  finished?: boolean;
};
type BrewAction = (prev: BrewFormState, formData: FormData) => Promise<BrewFormState>;

const str = (v: number | null | undefined) => (v != null ? String(v) : "");

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Guardando tu taza…</> : <><Coffee className="h-4 w-4" /> {isEdit ? "Guardar cambios" : "Guardar preparación"}</>}
    </Button>
  );
}

export function BrewForm({
  coffees,
  grinders,
  action = createBrew,
  brew,
}: {
  coffees: CoffeeOption[];
  grinders: Grinder[];
  action?: BrewAction;
  brew?: Brew;
}) {
  const router = useRouter();
  const isEdit = !!brew;
  const [state, formAction] = useActionState<BrewFormState, FormData>(action, {});
  const [method, setMethod] = useState<MethodKey>(
    (brew?.method as MethodKey) ?? "v60",
  );
  const [dose, setDose] = useState(str(brew?.dose_g));
  const [water, setWater] = useState(str(brew?.water_g));

  const [grinderId, setGrinderId] = useState(brew?.grinder_id ?? "");
  const grinder = grinders.find((g) => g.id === grinderId);
  // Existing recipes retain their original adjustment system after a grinder is edited.
  const grindType = brew?.grinder_id && grinderId === brew.grinder_id
    ? (brew.grind_clicks != null ? "clicks" : "general")
    : grinder?.grind_type;

  const ratio = computeRatio(Number(dose), Number(water));
  const hint = METHODS_BY_KEY[method];

  const totalTime = brew?.total_time_seconds ?? null;
  const initMinutes = totalTime != null ? Math.floor(totalTime / 60) : "";
  const initSeconds = totalTime != null ? totalTime % 60 : "";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {isEdit && <input type="hidden" name="id" value={brew.id} />}

      <section className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-3 text-sm font-medium">¿Cómo lo vas a preparar?</legend>
          <div className="grid grid-cols-3 gap-2">
            {BREW_METHODS.map((m) => <label key={m.key} className="selection-tile flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-1 py-3 text-center text-xs text-muted">
              <input className="sr-only" type="radio" name="method" value={m.key} checked={method === m.key} onChange={() => setMethod(m.key)} />
              <MethodIcon method={m.key} />
              <span className="font-medium">{m.name}</span>
            </label>)}
          </div>
        </fieldset>

        <Field label="Café" htmlFor="coffee_id" hint="Opcional — elige de tu biblioteca.">
          <Select id="coffee_id" name="coffee_id" defaultValue={brew?.coffee_id ?? ""}>
            <option value="">— Sin asignar —</option>
            {coffees.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.roaster ? ` · ${c.roaster}` : ""}
                {c.finished ? " (acabado)" : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Fecha y hora" htmlFor="brewed_at">
          <BrewDateInput brewedAt={brew?.brewed_at} />
        </Field>
      </section>

      {/* Recipe */}
      <section className="rounded-3xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Receta</h2>
          <div className="text-right">
            <div className="text-xs text-muted">Ratio</div>
            <div key={formatRatio(ratio)} className="reveal font-mono text-lg font-semibold text-accent">
              {formatRatio(ratio)}
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-2">
          <Field label="Moledor" htmlFor="grinder_id">
            <Select id="grinder_id" name="grinder_id" value={grinderId} onChange={(e) => setGrinderId(e.target.value)}>
              <option value="">— Sin asignar (molienda general) —</option>
              {grinders.map((g) => {
                const historical = g.id === brew?.grinder_id;
                const type = historical ? (brew.grind_clicks != null ? "clicks" : "general") : g.grind_type;
                return <option key={g.id} value={g.id}>
                  {historical ? brew.grinder_name ?? g.name : g.name}{g.archived ? " (eliminado)" : ""} · {type === "clicks" ? "Clics" : "General"}
                </option>;
              })}
            </Select>
          </Field>
          <Link href="/grinders" className="text-xs text-primary hover:underline">{grinders.filter((g) => !g.archived).length === 0 ? "Agregar mi primer moledor" : "Administrar moledores"}</Link>
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
          <Field label="Temp. (°C)" htmlFor="water_temp_c" hint="Típico ~93°C">
            <Input
              id="water_temp_c"
              name="water_temp_c"
              type="number"
              inputMode="decimal"
              step="0.5"
              placeholder="93"
              defaultValue={str(brew?.water_temp_c)}
            />
          </Field>
          {grindType === "clicks" ? (
            <Field key={`clicks-${grinderId}`} className="reveal" label="Molienda (clics)" htmlFor="grind_clicks" hint="Cantidad de clics desde cero.">
              <Input key={grinderId} id="grind_clicks" name="grind_clicks" type="number" inputMode="numeric" min="0" max="2147483647" step="1" required defaultValue={grinderId === brew?.grinder_id ? str(brew.grind_clicks) : ""} placeholder="24" />
            </Field>
          ) : (
            <Field key={`general-${grinderId}`} className="reveal" label="Molienda" htmlFor="grind_size" hint={hint.grindHint}>
              <Select
                key={grinderId}
                id="grind_size"
                name="grind_size"
                defaultValue={brew?.grind_size ?? hint.grindHint}
              >
                <option value="">—</option>
                {GRIND_SIZES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
          )}
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
                defaultValue={initMinutes}
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
                defaultValue={initSeconds}
              />
            </div>
          </Field>
        </div>
      </section>

      {/* Result */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">Resultado</h2>
        <BrewRating initialRating={brew?.rating} />
        <Field label="Notas de sabor" htmlFor="flavor_notes">
          <Textarea
            id="flavor_notes"
            name="flavor_notes"
            placeholder="Chocolate, caramelo, acidez cítrica…"
            defaultValue={brew?.flavor_notes ?? ""}
          />
        </Field>
        <Field label="Comentarios" htmlFor="comments">
          <Textarea
            id="comments"
            name="comments"
            placeholder="¿Qué cambiarías la próxima vez?"
            defaultValue={brew?.comments ?? ""}
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
          <SubmitButton isEdit={isEdit} />
        </div>
      </div>
    </form>
  );
}
