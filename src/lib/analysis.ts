/**
 * Coffee Log — analysis engine.
 *
 * Pure, deterministic functions that turn a user's brew history into useful
 * observations ("your best V60s land between 1:15 and 1:16"). No DB or React
 * coupling, so this is easy to unit-test.
 *
 * Guiding principle: never invent a trend from thin data. Every insight has a
 * minimum-sample guard and reports the sample size it is based on.
 */

import { formatRatio, methodName } from "@/lib/domain";
import type { BrewWithCoffee } from "@/lib/types";

// ── Tunables ────────────────────────────────────────────────────────────────
const MIN_GLOBAL = 3; // brews needed before we analyze anything
const MIN_METHOD = 3; // rated brews for a method to get a sweet-spot breakdown
const MIN_RANKING = 2; // brews for a coffee/process to enter a ranking
const MIN_BEST = 3; // "best cups" sample size for a sweet spot
const GOOD_RATING = 8; // a cup is "good" from here up (out of 10)

// ── Types ─────────────────────────────────────────────────────────────────
export interface Range {
  min: number;
  max: number;
  avg: number;
  count: number;
}

export interface MethodStat {
  method: string;
  count: number;
  ratedCount: number;
  avgRating: number | null;
  /** Population std-dev of ratings — lower means more consistent. */
  consistency: number | null;
  bestCupCount: number;
  ratio: Range | null;
  temp: Range | null;
  time: Range | null;
  topGrind: { value: string; count: number } | null;
}

export interface GroupStat {
  key: string;
  count: number;
  avgRating: number;
}

export interface Headline {
  id: string;
  icon: string;
  text: string;
  tone: "good" | "accent" | "muted";
}

export interface AnalysisResult {
  totalBrews: number;
  ratedBrews: number;
  hasEnoughData: boolean;
  headlines: Headline[];
  methods: MethodStat[];
  processes: GroupStat[];
  coffees: (GroupStat & { id: string })[];
  bestMethod: MethodStat | null;
  mostConsistentMethod: MethodStat | null;
}

// ── Small stats helpers ─────────────────────────────────────────────────────
function mean(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function rangeOf(values: (number | null | undefined)[]): Range | null {
  const xs = values.filter(
    (v): v is number => v != null && Number.isFinite(v),
  );
  if (xs.length === 0) return null;
  return { min: Math.min(...xs), max: Math.max(...xs), avg: mean(xs), count: xs.length };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Ratings present, as numbers. */
function ratings(brews: BrewWithCoffee[]): number[] {
  return brews
    .map((b) => b.rating)
    .filter((r): r is number => r != null);
}

/**
 * The user's better cups within a set: those rated >= GOOD_RATING, falling back
 * to the top ~40% by rating when there aren't enough high scorers yet.
 */
function bestCups(brews: BrewWithCoffee[]): BrewWithCoffee[] {
  const rated = brews.filter((b) => b.rating != null);
  const good = rated.filter((b) => (b.rating ?? 0) >= GOOD_RATING);
  if (good.length >= MIN_BEST) return good;
  const take = Math.max(MIN_BEST, Math.ceil(rated.length * 0.4));
  return [...rated]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, Math.min(rated.length, take));
}

function topGrind(
  brews: BrewWithCoffee[],
): { value: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const b of brews) {
    if (b.grind_size) counts.set(b.grind_size, (counts.get(b.grind_size) ?? 0) + 1);
  }
  let best: { value: string; count: number } | null = null;
  for (const [value, count] of counts) {
    if (!best || count > best.count) best = { value, count };
  }
  return best;
}

// ── Per-dimension aggregations ──────────────────────────────────────────────
function methodStats(brews: BrewWithCoffee[]): MethodStat[] {
  const byMethod = new Map<string, BrewWithCoffee[]>();
  for (const b of brews) {
    const arr = byMethod.get(b.method) ?? [];
    arr.push(b);
    byMethod.set(b.method, arr);
  }

  const stats: MethodStat[] = [];
  for (const [method, list] of byMethod) {
    const rs = ratings(list);
    const enough = rs.length >= MIN_METHOD;
    const best = enough ? bestCups(list) : [];
    stats.push({
      method,
      count: list.length,
      ratedCount: rs.length,
      avgRating: rs.length ? round1(mean(rs)) : null,
      consistency: rs.length >= 2 ? round1(stdev(rs)) : null,
      bestCupCount: best.length,
      ratio: enough ? rangeOf(best.map((b) => b.ratio)) : null,
      temp: enough ? rangeOf(best.map((b) => b.water_temp_c)) : null,
      time: enough ? rangeOf(best.map((b) => b.total_time_seconds)) : null,
      topGrind: enough ? topGrind(best) : null,
    });
  }

  // Highest average first; methods without a rating sink to the bottom.
  return stats.sort((a, b) => (b.avgRating ?? -1) - (a.avgRating ?? -1));
}

function groupStats(
  brews: BrewWithCoffee[],
  keyFn: (b: BrewWithCoffee) => string | null | undefined,
): GroupStat[] {
  const groups = new Map<string, number[]>();
  for (const b of brews) {
    const key = keyFn(b);
    if (!key || b.rating == null) continue;
    const arr = groups.get(key) ?? [];
    arr.push(b.rating);
    groups.set(key, arr);
  }
  return [...groups.entries()]
    .filter(([, rs]) => rs.length >= MIN_RANKING)
    .map(([key, rs]) => ({ key, count: rs.length, avgRating: round1(mean(rs)) }))
    .sort((a, b) => b.avgRating - a.avgRating);
}

function coffeeStats(
  brews: BrewWithCoffee[],
): (GroupStat & { id: string })[] {
  const groups = new Map<string, { name: string; ratings: number[] }>();
  for (const b of brews) {
    if (!b.coffee || b.rating == null) continue;
    const g = groups.get(b.coffee.id) ?? { name: b.coffee.name, ratings: [] };
    g.ratings.push(b.rating);
    groups.set(b.coffee.id, g);
  }
  return [...groups.entries()]
    .filter(([, g]) => g.ratings.length >= MIN_RANKING)
    .map(([id, g]) => ({
      id,
      key: g.name,
      count: g.ratings.length,
      avgRating: round1(mean(g.ratings)),
    }))
    .sort((a, b) => b.avgRating - a.avgRating);
}

// ── Natural-language headlines ──────────────────────────────────────────────
function rangeText(r: Range, fmt: (n: number) => string): string {
  return r.min === r.max
    ? `alrededor de ${fmt(r.avg)}`
    : `entre ${fmt(r.min)} y ${fmt(r.max)}`;
}

const tempFmt = (n: number) => `${Math.round(n)}°C`;

function buildHeadlines(
  methods: MethodStat[],
  processes: GroupStat[],
  coffees: (GroupStat & { id: string })[],
  bestMethod: MethodStat | null,
  mostConsistent: MethodStat | null,
  allBest: BrewWithCoffee[],
): Headline[] {
  const out: Headline[] = [];

  if (bestMethod && bestMethod.avgRating != null) {
    out.push({
      id: "best-method",
      icon: "☕",
      tone: "good",
      text: `Tu método mejor puntuado es ${methodName(bestMethod.method)}: ${bestMethod.avgRating} de promedio en ${bestMethod.ratedCount} preparaciones.`,
    });
  }

  if (bestMethod?.ratio) {
    out.push({
      id: "ratio-sweet-spot",
      icon: "🎯",
      tone: "accent",
      text: `Tus mejores ${methodName(bestMethod.method)} tienen un ratio ${rangeText(bestMethod.ratio, formatRatio)}.`,
    });
  }

  const bestTemp = rangeOf(allBest.map((b) => b.water_temp_c));
  if (bestTemp && bestTemp.count >= MIN_BEST) {
    out.push({
      id: "temp-sweet-spot",
      icon: "🌡️",
      tone: "accent",
      text: `Obtienes mejores resultados con agua ${rangeText(bestTemp, tempFmt)}.`,
    });
  }

  if (processes.length >= 2) {
    const [top, second] = processes;
    if (top.avgRating > second.avgRating) {
      out.push({
        id: "process",
        icon: "🫘",
        tone: "good",
        text: `Tus cafés de proceso ${top.key.toLowerCase()} promedian ${top.avgRating}, por encima de los de proceso ${second.key.toLowerCase()} (${second.avgRating}).`,
      });
    }
  }

  if (coffees.length >= 1) {
    const c = coffees[0];
    out.push({
      id: "best-coffee",
      icon: "⭐",
      tone: "good",
      text: `Tu café mejor calificado es ${c.key}: ${c.avgRating} de promedio en ${c.count} preparaciones.`,
    });
  }

  if (
    mostConsistent &&
    mostConsistent.consistency != null &&
    (methods.filter((m) => m.consistency != null).length >= 2)
  ) {
    out.push({
      id: "consistency",
      icon: "📏",
      tone: "muted",
      text: `Tu método más consistente es ${methodName(mostConsistent.method)} (variación de ±${mostConsistent.consistency} puntos).`,
    });
  }

  return out;
}

// ── Public entry point ──────────────────────────────────────────────────────
export function analyzeBrews(brews: BrewWithCoffee[]): AnalysisResult {
  const ratedBrews = brews.filter((b) => b.rating != null).length;
  const hasEnoughData = brews.length >= MIN_GLOBAL && ratedBrews >= MIN_GLOBAL;

  const methods = methodStats(brews);
  const processes = groupStats(brews, (b) => b.coffee?.process ?? null);
  const coffees = coffeeStats(brews);

  const eligible = methods.filter(
    (m) => m.ratedCount >= MIN_METHOD && m.avgRating != null,
  );
  const bestMethod = eligible[0] ?? null;
  const mostConsistentMethod =
    eligible.length >= 2
      ? [...eligible]
          .filter((m) => m.consistency != null)
          .sort(
            (a, b) =>
              (a.consistency ?? Infinity) - (b.consistency ?? Infinity) ||
              (b.avgRating ?? 0) - (a.avgRating ?? 0),
          )[0] ?? null
      : null;

  const allBest = bestCups(brews);

  const headlines = hasEnoughData
    ? buildHeadlines(
        methods,
        processes,
        coffees,
        bestMethod,
        mostConsistentMethod,
        allBest,
      )
    : [];

  return {
    totalBrews: brews.length,
    ratedBrews,
    hasEnoughData,
    headlines,
    methods,
    processes,
    coffees: coffees.slice(0, 5),
    bestMethod,
    mostConsistentMethod,
  };
}
