"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const numberOrNull = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

const brewSchema = z.object({
  method: z.string().trim().min(1, "Elige un método."),
  coffee_id: z.preprocess(emptyToNull, z.string().uuid().nullable()),
  brewed_at: z.preprocess(emptyToNull, z.string().nullable()),
  dose_g: numberOrNull,
  water_g: numberOrNull,
  water_temp_c: numberOrNull,
  total_time_seconds: numberOrNull,
  grind_size: z.preprocess(emptyToNull, z.string().trim().nullable()),
  rating: numberOrNull,
  satisfaction: numberOrNull,
  flavor_notes: z.preprocess(emptyToNull, z.string().trim().nullable()),
  comments: z.preprocess(emptyToNull, z.string().trim().nullable()),
});

export type BrewFormState = { error?: string };

/** Combine separate minutes/seconds inputs into total seconds before validating. */
function withDerivedFields(formData: FormData): Record<string, unknown> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const min = Number(raw.time_minutes ?? "");
  const sec = Number(raw.time_seconds ?? "");
  const hasTime =
    (raw.time_minutes && raw.time_minutes.trim() !== "") ||
    (raw.time_seconds && raw.time_seconds.trim() !== "");
  return {
    ...raw,
    total_time_seconds: hasTime
      ? String((Number.isFinite(min) ? min : 0) * 60 + (Number.isFinite(sec) ? sec : 0))
      : "",
  };
}

export async function createBrew(
  _prev: BrewFormState,
  formData: FormData,
): Promise<BrewFormState> {
  const parsed = brewSchema.safeParse(withDerivedFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { brewed_at, ...rest } = parsed.data;
  const { error } = await supabase.from("brews").insert({
    ...rest,
    // ratio is a generated column — never written from here.
    brewed_at: brewed_at ? new Date(brewed_at).toISOString() : new Date().toISOString(),
    user_id: user.id,
  });

  if (error) return { error: "No se pudo guardar la preparación. Intenta de nuevo." };

  revalidatePath("/brews");
  revalidatePath("/");
  redirect("/brews");
}

export async function updateBrew(
  _prev: BrewFormState,
  formData: FormData,
): Promise<BrewFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el identificador de la preparación." };

  const parsed = brewSchema.safeParse(withDerivedFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { brewed_at, ...rest } = parsed.data;
  const { error } = await supabase
    .from("brews")
    .update({
      ...rest,
      // ratio is a generated column — never written from here.
      ...(brewed_at ? { brewed_at: new Date(brewed_at).toISOString() } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error)
    return { error: "No se pudo actualizar la preparación. Intenta de nuevo." };

  revalidatePath("/brews");
  revalidatePath("/");
  revalidatePath(`/brews/${id}`);
  redirect(`/brews/${id}`);
}

export async function deleteBrew(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("brews").delete().eq("id", id);

  revalidatePath("/brews");
  revalidatePath("/");
  redirect("/brews");
}
