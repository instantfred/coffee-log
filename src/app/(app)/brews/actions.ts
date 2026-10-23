"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GRIND_SIZES, localInputToIso } from "@/lib/domain";
import type { Brew } from "@/lib/types";
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
  grinder_id: z.preprocess(emptyToNull, z.string().uuid().nullable()),
  grind_size: z.preprocess(emptyToNull, z.enum(GRIND_SIZES).nullable()),
  grind_clicks: z.preprocess(emptyToNull, z.coerce.number().int().min(0).max(2147483647).nullable()),
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
    grinder_id: raw.grinder_id ?? "",
    grind_size: raw.grind_size ?? "",
    grind_clicks: raw.grind_clicks ?? "",
    total_time_seconds: hasTime
      ? String((Number.isFinite(min) ? min : 0) * 60 + (Number.isFinite(sec) ? sec : 0))
      : "",
  };
}

/** Resolve settings from the authenticated user's grinder, never a client-supplied type. */
async function resolveGrind(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, values: z.infer<typeof brewSchema>, existing?: Brew) {
  if (!values.grinder_id) {
    return { data: { grinder_id: null, grinder_name: null, grind_clicks: null, grind_size: values.grind_size } };
  }
  const { data: grinder, error } = await supabase.from("grinders").select("id, name, grind_type, archived").eq("id", values.grinder_id).eq("user_id", userId).maybeSingle();
  const sameGrinder = !!existing?.grinder_id && existing.grinder_id === values.grinder_id;
  if (error || !grinder || (grinder.archived && !sameGrinder)) return { error: "El moledor seleccionado no está disponible." };
  const grindType = sameGrinder ? (existing.grind_clicks != null ? "clicks" : "general") : grinder.grind_type;
  if (grindType === "clicks" && values.grind_clicks == null) {
    return { error: "Indica la cantidad de clics del moledor." };
  }
  return { data: {
    grinder_id: grinder.id,
    grinder_name: sameGrinder ? existing.grinder_name : grinder.name,
    grind_clicks: grindType === "clicks" ? values.grind_clicks : null,
    grind_size: grindType === "general" ? values.grind_size : null,
  } };
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

  const grind = await resolveGrind(supabase, user.id, parsed.data);
  if (grind.error) return { error: grind.error };
  const { brewed_at, ...rest } = parsed.data;
  const { error } = await supabase.from("brews").insert({
    ...rest,
    ...grind.data,
    // ratio is a generated column — never written from here.
    brewed_at: brewed_at ? localInputToIso(brewed_at) : new Date().toISOString(),
    user_id: user.id,
  });

  if (error) return { error: "No se pudo guardar la preparación. Intenta de nuevo." };

  revalidatePath("/brews");
  revalidatePath("/");
  redirect("/brews?saved=created");
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

  const { data: existing, error: existingError } = await supabase.from("brews").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (existingError || !existing) return { error: "La preparación no está disponible." };
  const grind = await resolveGrind(supabase, user.id, parsed.data, existing as Brew);
  if (grind.error) return { error: grind.error };
  const { brewed_at, ...rest } = parsed.data;
  const { error } = await supabase
    .from("brews")
    .update({
      ...rest,
      ...grind.data,
      // Satisfaction is historical; the simplified form no longer edits it.
      satisfaction: existing.satisfaction,
      // ratio is a generated column — never written from here.
      ...(brewed_at ? { brewed_at: localInputToIso(brewed_at) } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error)
    return { error: "No se pudo actualizar la preparación. Intenta de nuevo." };

  revalidatePath("/brews");
  revalidatePath("/");
  revalidatePath(`/brews/${id}`);
  redirect(`/brews/${id}?saved=updated`);
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
