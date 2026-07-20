/**
 * Domain model for Coffee Log.
 *
 * Brewing methods, processes and roast levels live here as plain data so that
 * adding a new method later is a one-line change (the rest of the app reads
 * from these tables). Method *keys* are also stored in the database, so treat
 * them as stable identifiers.
 */

export type MethodKey =
  | "v60"
  | "chemex"
  | "kalita"
  | "origami"
  | "aeropress"
  | "french_press"
  | "clever"
  | "espresso"
  | "moka_pot"
  | "cold_brew"
  | "siphon"
  | "turkish";

export interface BrewMethod {
  key: MethodKey;
  name: string;
  /** Short 2–3 char label shown in the round method icon. */
  abbr: string;
  /** Typical coffee:water ratio range, used only as a gentle hint in the UI. */
  typicalRatio: [number, number];
  /** Typical total brew time in seconds, used only as metadata. */
  typicalTime: [number, number];
  grindHint: string;
}

// Ordered pour-over → immersion → pressure/stovetop → cold → specialty.
// Keys are stable identifiers stored in the DB — never rename an existing one.
export const BREW_METHODS: BrewMethod[] = [
  { key: "v60", name: "V60", abbr: "V60", typicalRatio: [15, 17], typicalTime: [150, 210], grindHint: "Media-fina" },
  { key: "chemex", name: "Chemex", abbr: "CHX", typicalRatio: [15, 17], typicalTime: [210, 300], grindHint: "Media-gruesa" },
  { key: "kalita", name: "Kalita Wave", abbr: "KAL", typicalRatio: [15, 17], typicalTime: [180, 240], grindHint: "Media" },
  { key: "origami", name: "Origami", abbr: "ORI", typicalRatio: [15, 16], typicalTime: [150, 210], grindHint: "Media-fina" },
  { key: "aeropress", name: "AeroPress", abbr: "AP", typicalRatio: [12, 16], typicalTime: [60, 150], grindHint: "Media-fina" },
  { key: "french_press", name: "French Press", abbr: "FP", typicalRatio: [15, 18], typicalTime: [240, 300], grindHint: "Gruesa" },
  { key: "clever", name: "Clever Dripper", abbr: "CLV", typicalRatio: [15, 17], typicalTime: [120, 240], grindHint: "Media" },
  { key: "espresso", name: "Espresso", abbr: "ESP", typicalRatio: [2, 2.5], typicalTime: [25, 32], grindHint: "Extra fina" },
  { key: "moka_pot", name: "Moka Pot", abbr: "MOK", typicalRatio: [10, 13], typicalTime: [240, 360], grindHint: "Fina" },
  { key: "cold_brew", name: "Cold Brew", abbr: "CB", typicalRatio: [8, 12], typicalTime: [43200, 86400], grindHint: "Extra gruesa" },
  { key: "siphon", name: "Sifón", abbr: "SIF", typicalRatio: [15, 17], typicalTime: [90, 180], grindHint: "Media" },
  { key: "turkish", name: "Turco", abbr: "TUR", typicalRatio: [10, 12], typicalTime: [120, 180], grindHint: "Extra fina" },
];

export const METHODS_BY_KEY: Record<MethodKey, BrewMethod> = Object.fromEntries(
  BREW_METHODS.map((m) => [m.key, m]),
) as Record<MethodKey, BrewMethod>;

export function methodName(key: string): string {
  return METHODS_BY_KEY[key as MethodKey]?.name ?? key;
}

/** Short label for the round method icon (falls back to the first 3 chars). */
export function methodAbbr(key: string): string {
  return METHODS_BY_KEY[key as MethodKey]?.abbr ?? key.slice(0, 3).toUpperCase();
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

/** Whole days elapsed since an ISO date (null if no date or in the future). */
export function daysSince(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return null;
  const diff = Math.floor((Date.now() - then) / 86_400_000);
  return diff >= 0 ? diff : null;
}

/** Human freshness label for a roast date, e.g. "hoy", "hace 8 días". */
export function freshnessLabel(isoDate: string | null | undefined): string | null {
  const d = daysSince(isoDate);
  if (d == null) return null;
  if (d === 0) return "tostado hoy";
  if (d === 1) return "tostado ayer";
  return `tostado hace ${d} días`;
}

/** Map a 1–10 rating to a semantic colour token. */
export function ratingTone(rating: number | null | undefined): "good" | "mid" | "bad" | "muted" {
  if (rating == null) return "muted";
  if (rating >= 8) return "good";
  if (rating >= 6) return "mid";
  return "bad";
}
