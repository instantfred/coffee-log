"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type GrinderFormState = { error?: string; success?: string };

const schema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre del moledor.").max(100, "Usa un máximo de 100 caracteres."),
  grind_type: z.enum(["clicks", "general"]),
});

export async function createGrinder(_prev: GrinderFormState, formData: FormData): Promise<GrinderFormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("grinders").insert({ ...parsed.data, user_id: user.id });
  if (error) return { error: "No se pudo guardar el moledor. Intenta de nuevo." };
  revalidatePath("/grinders");
  revalidatePath("/brews/new");
  return { success: "Moledor registrado." };
}

export async function updateGrinder(_prev: GrinderFormState, formData: FormData): Promise<GrinderFormState> {
  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!id.success || !parsed.success) return { error: "Revisa el nombre y el tipo de molienda." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("grinders").update(parsed.data)
    .eq("id", id.data).eq("user_id", user.id).eq("archived", false).select("id").maybeSingle();
  if (error || !data) return { error: "No se pudo actualizar el moledor." };
  revalidatePath("/grinders");
  revalidatePath("/brews", "layout");
  redirect("/grinders");
}

export async function deleteGrinder(formData: FormData): Promise<void> {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) throw new Error("El identificador del moledor no es válido.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Keep the row for historical foreign keys, but remove it from all active pickers.
  const { data, error } = await supabase.from("grinders").update({ archived: true })
    .eq("id", id.data).eq("user_id", user.id).eq("archived", false).select("id").maybeSingle();
  if (error || !data) throw new Error("No se pudo eliminar el moledor. Intenta de nuevo.");
  revalidatePath("/grinders");
  revalidatePath("/brews", "layout");
  redirect("/grinders");
}
