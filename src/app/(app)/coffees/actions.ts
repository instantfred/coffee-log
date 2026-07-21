"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const coffeeSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  roaster: z.preprocess(emptyToNull, z.string().trim().nullable()),
  origin_country: z.preprocess(emptyToNull, z.string().trim().nullable()),
  region: z.preprocess(emptyToNull, z.string().trim().nullable()),
  process: z.preprocess(emptyToNull, z.string().trim().nullable()),
  roast_level: z.preprocess(emptyToNull, z.string().trim().nullable()),
  roast_date: z.preprocess(emptyToNull, z.string().nullable()),
  purchase_date: z.preprocess(emptyToNull, z.string().nullable()),
  open_date: z.preprocess(emptyToNull, z.string().nullable()),
  notes: z.preprocess(emptyToNull, z.string().trim().nullable()),
});

export type CoffeeFormState = { error?: string };

export async function createCoffee(
  _prev: CoffeeFormState,
  formData: FormData,
): Promise<CoffeeFormState> {
  const parsed = coffeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("coffees")
    .insert({ ...parsed.data, user_id: user.id });

  if (error) return { error: "No se pudo guardar el café. Intenta de nuevo." };

  revalidatePath("/coffees");
  redirect("/coffees");
}

export async function updateCoffee(
  _prev: CoffeeFormState,
  formData: FormData,
): Promise<CoffeeFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el identificador del café." };

  const parsed = coffeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("coffees")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo actualizar el café. Intenta de nuevo." };

  revalidatePath("/coffees");
  revalidatePath(`/coffees/${id}`);
  redirect(`/coffees/${id}`);
}

export async function deleteCoffee(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("coffees").delete().eq("id", id);

  revalidatePath("/coffees");
  redirect("/coffees");
}
