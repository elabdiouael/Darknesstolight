// Les programmes dyal l-mouraja3a (presets) — l-user y9der ybeddel kolchi f "Personnalisé"
import { HifdPlan, HifdPreset } from "@/services/api/khatmaService";

export const PRESETS: Record<Exclude<HifdPreset, "CUSTOM">, Omit<HifdPlan, "method" | "preset">> = {
  INTENSIVE: { dailyNew: 5, dailyReview: 50, intervalFactor: 0.7, maxInterval: 30, passThreshold: 90, manzilDays: 5, recentDays: 10, hintWords: 0 },
  BALANCED: { dailyNew: 3, dailyReview: 25, intervalFactor: 1, maxInterval: 60, passThreshold: 85, manzilDays: 7, recentDays: 7, hintWords: 1 },
  LIGHT: { dailyNew: 2, dailyReview: 15, intervalFactor: 1.4, maxInterval: 120, passThreshold: 75, manzilDays: 14, recentDays: 5, hintWords: 2 },
};

export const DEFAULT_PLAN: HifdPlan = { method: "SM2", preset: "BALANCED", ...PRESETS.BALANCED };

/** Les intervalles (b l-iyam) ila kol mouraja3a mzyana (quality 4) — bach l-user ychouf chno ghadi ytra */
export const previewIntervals = (p: HifdPlan, steps = 6): number[] => {
  // MANZIL: Sabqi (kol nhar) f l-iyam l-oula, mn be3d dawra dyal Manzil
  if (p.method === "MANZIL") {
    return Array.from({ length: steps }, (_, i) => (i < 3 ? 1 : p.manzilDays));
  }
  // SM-2 m3a quality 4 (ease kayb9a 2.5)
  const out: number[] = [];
  let interval = 0;
  for (let rep = 1; rep <= steps; rep++) {
    if (rep === 1) interval = 1;
    else if (rep === 2) interval = Math.max(2, Math.round(6 * p.intervalFactor));
    else interval = Math.round(interval * 2.5);
    interval = Math.min(p.maxInterval, Math.max(1, interval));
    out.push(interval);
  }
  return out;
};