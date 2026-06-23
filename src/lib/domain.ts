/**
 * Domain model for Coffee Log.
 *
 * Brewing methods, processes and roast levels live here as plain data so that
 * adding a new method later is a one-line change (the rest of the app reads
 * from these tables). Method *keys* are also stored in the database, so treat
 * them as stable identifiers.
 */

export type MethodKey = "v60" | "french_press" | "moka_pot";

export interface BrewMethod {
  key: MethodKey;
  name: string;
  emoji: string;
  /** Typical coffee:water ratio range, used only as a gentle hint in the UI. */
  typicalRatio: [number, number];
  /** Typical total brew time in seconds, shown as a hint. */
  typicalTime: [number, number];
  grindHint: string;
}

export const BREW_METHODS: BrewMethod[] = [
  {
    key: "v60",
    name: "V60",
    emoji: "🫗",
    typicalRatio: [15, 17],
    typicalTime: [150, 210],
    grindHint: "Media-fina",
  },
  {
    key: "french_press",
    name: "French Press",
    emoji: "🪤",
    typicalRatio: [15, 18],
    typicalTime: [240, 300],
    grindHint: "Gruesa",
  },
  {
    key: "moka_pot",
    name: "Moka Pot",
    emoji: "🟤",
    typicalRatio: [10, 13],
    typicalTime: [240, 360],
    grindHint: "Fina",
  },
];

export const METHODS_BY_KEY: Record<MethodKey, BrewMethod> = Object.fromEntries(
  BREW_METHODS.map((m) => [m.key, m]),
) as Record<MethodKey, BrewMethod>;

export function methodName(key: string): string {
  return METHODS_BY_KEY[key as MethodKey]?.name ?? key;
}

export function methodEmoji(key: string): string {
  return METHODS_BY_KEY[key as MethodKey]?.emoji ?? "☕";
}

export const PROCESSES = [
  "Lavado",
  "Natural",
  "Honey",
  "Anaeróbico",
  "Otro",
] as const;

export const ROAST_LEVELS = [
  "Claro",
  "Medio-claro",
  "Medio",
  "Medio-oscuro",
  "Oscuro",
] as const;

export const GRIND_SIZES = [
  "Extra fina",
  "Fina",
  "Media-fina",
  "Media",
  "Media-gruesa",
  "Gruesa",
  "Extra gruesa",
] as const;

/** Compute a coffee:water ratio as the water-per-gram-of-coffee value (e.g. 16 → 1:16). */
export function computeRatio(doseG: number, waterG: number): number | null {
  if (!doseG || doseG <= 0 || !waterG || waterG <= 0) return null;
  return waterG / doseG;
}

/** Format a ratio number as a "1:16.0" string. */
export function formatRatio(ratio: number | null | undefined): string {
  if (ratio == null || !isFinite(ratio)) return "—";
  return `1:${ratio.toFixed(1)}`;
}

/** Format seconds as m:ss. */
export function formatTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || totalSeconds < 0) return "—";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Map a 1–10 rating to a semantic colour token. */
export function ratingTone(rating: number | null | undefined): "good" | "mid" | "bad" | "muted" {
  if (rating == null) return "muted";
  if (rating >= 8) return "good";
  if (rating >= 6) return "mid";
  return "bad";
}
