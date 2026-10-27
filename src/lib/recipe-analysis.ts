import { buildRecipes } from "@/lib/evolution";
import type { BrewWithCoffee } from "@/lib/types";

/** Keep comparisons within one coffee and method. Ties prefer the newest cup. */
export function analyzeRecipe(brews: BrewWithCoffee[], coffeeId: string, method: string) {
  const list = brews.filter((b) => b.coffee?.id === coffeeId && b.method === method);
  const group = buildRecipes(list)[0] ?? null;
  const attempts = group?.attempts ?? [];
  const rated = attempts.filter((a) => a.brew.rating != null);
  const best = [...rated].reverse().sort((a, b) => b.brew.rating! - a.brew.rating!)[0]?.brew ?? null;
  const latest = attempts.at(-1)?.brew ?? null;
  const previous = attempts.at(-2)?.brew ?? null;
  return { group, best, latest, previous, ratedCount: rated.length };
}
