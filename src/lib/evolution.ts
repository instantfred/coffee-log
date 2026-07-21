/**
 * Recipe evolution.
 *
 * A "recipe" is a (coffee + method) pair. Given a coffee's brews, we group them
 * by method and, within each group, order attempts chronologically and compute
 * what changed between consecutive attempts — so the user can see how dialing in
 * a recipe moved the score.
 *
 * Pure and deterministic (no DB/React), like analysis.ts.
 */

import { formatRatio, formatTime } from "@/lib/domain";
import type { BrewWithCoffee } from "@/lib/types";

export interface AttemptChange {
  label: string;
  from: string;
  to: string;
  direction: "up" | "down" | "change";
}

export interface RecipeAttempt {
  brew: BrewWithCoffee;
  /** 1-based position within the recipe. */
  number: number;
  /** What changed versus the previous attempt (empty for the first). */
  changes: AttemptChange[];
  isBest: boolean;
}

export interface RecipeGroup {
  method: string;
  attempts: RecipeAttempt[];
  /** Ratings in order, null where unrated — the progression (e.g. 6 → 7 → 9). */
  trend: (number | null)[];
  bestRating: number | null;
  ratingDelta: number | null;
}

const tempFmt = (n: number) => `${Math.round(n)}°C`;

function numChange(
  label: string,
  prev: number | null | undefined,
  curr: number | null | undefined,
  fmt: (n: number) => string,
): AttemptChange | null {
  if (prev == null || curr == null) return null;
  if (Math.abs(prev - curr) < 1e-9) return null;
  return { label, from: fmt(prev), to: fmt(curr), direction: curr > prev ? "up" : "down" };
}

function changesBetween(prev: BrewWithCoffee, curr: BrewWithCoffee): AttemptChange[] {
  const out: AttemptChange[] = [];
  const ratio = numChange("Ratio", prev.ratio, curr.ratio, formatRatio);
  if (ratio) out.push(ratio);
  const temp = numChange("Temp.", prev.water_temp_c, curr.water_temp_c, tempFmt);
  if (temp) out.push(temp);
  const time = numChange("Tiempo", prev.total_time_seconds, curr.total_time_seconds, formatTime);
  if (time) out.push(time);
  const dose = numChange("Café", prev.dose_g, curr.dose_g, (n) => `${n} g`);
  if (dose) out.push(dose);
  if (prev.grind_size && curr.grind_size && prev.grind_size !== curr.grind_size) {
    out.push({ label: "Molienda", from: prev.grind_size, to: curr.grind_size, direction: "change" });
  }
  return out;
}

export function buildRecipes(brews: BrewWithCoffee[]): RecipeGroup[] {
  const byMethod = new Map<string, BrewWithCoffee[]>();
  for (const b of brews) {
    const arr = byMethod.get(b.method) ?? [];
    arr.push(b);
    byMethod.set(b.method, arr);
  }

  const groups: RecipeGroup[] = [];
  for (const [method, list] of byMethod) {
    // Oldest → newest, so the timeline reads as a progression.
    const ordered = [...list].sort(
      (a, b) => new Date(a.brewed_at).getTime() - new Date(b.brewed_at).getTime(),
    );

    const rated = ordered.filter((b) => b.rating != null);
    const bestRating = rated.length
      ? Math.max(...rated.map((b) => b.rating as number))
      : null;
    let bestMarked = false;

    const attempts: RecipeAttempt[] = ordered.map((brew, i) => {
      const isBest = !bestMarked && brew.rating != null && brew.rating === bestRating;
      if (isBest) bestMarked = true;
      return {
        brew,
        number: i + 1,
        changes: i > 0 ? changesBetween(ordered[i - 1], brew) : [],
        isBest,
      };
    });

    const trend = ordered.map((b) => b.rating);
    const firstRated = rated[0]?.rating ?? null;
    const lastRated = rated[rated.length - 1]?.rating ?? null;
    const ratingDelta =
      firstRated != null && lastRated != null && rated.length >= 2
        ? lastRated - firstRated
        : null;

    groups.push({ method, attempts, trend, bestRating, ratingDelta });
  }

  // Recipes with more attempts (more to learn from) first.
  return groups.sort((a, b) => b.attempts.length - a.attempts.length);
}
