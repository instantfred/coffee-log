import type { Brew, Grinder } from "@/lib/types";

export type BrewRecipe = Pick<Brew, "method" | "coffee_id" | "dose_g" | "water_g" | "water_temp_c" | "total_time_seconds" | "grinder_id" | "grind_clicks" | "grind_size">;

/** Copy recipe inputs only, keeping unavailable equipment out of new brews. */
export function copyBrewRecipe(brew: Brew, coffees: { id: string }[], grinders: Grinder[]): BrewRecipe {
  const grinder = grinders.find((g) => g.id === brew.grinder_id && !g.archived);
  const sameSystem = grinder && (grinder.grind_type === "clicks") === (brew.grind_clicks != null);
  return {
    method: brew.method,
    coffee_id: coffees.some((c) => c.id === brew.coffee_id) ? brew.coffee_id : null,
    dose_g: brew.dose_g,
    water_g: brew.water_g,
    water_temp_c: brew.water_temp_c,
    total_time_seconds: brew.total_time_seconds,
    grinder_id: sameSystem ? grinder.id : null,
    grind_clicks: sameSystem && grinder.grind_type === "clicks" ? brew.grind_clicks : null,
    grind_size: brew.grind_size,
  };
}
