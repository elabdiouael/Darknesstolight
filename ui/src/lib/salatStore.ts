"use client";

// Réglages w suivi dyal s-salat (localStorage)
import { useLocalState } from "./localStore";
import { dayKey } from "./adhkarStore";
import { AsrSchool, CITIES, FARD, MethodId, PrayerId, PrayerInput } from "./prayerTimes";

export interface SalatSettings {
  cityId: string;
  /** Position GPS (ila kant, kat-ghleb l-madina) */
  coords: { lat: number; lng: number } | null;
  method: MethodId;
  asr: AsrSchool;
  offsets: Partial<Record<PrayerId, number>>;
  alert: boolean;
  h24: boolean;
  // ---- Adhan ----
  voice: string;                 // id mn ADHAN_VOICES
  fajrVoice: string;             // "same" wla id akhor l l-fajr
  volume: number;                // 0..1
  customUrl: string;
  fadeIn: boolean;
  vibrate: boolean;
  /** S-salawat li 3lihom tanbih (par défaut kolhom) */
  alertFor: Partial<Record<PrayerId, boolean>>;
  /** Tadkir 9bel l-we9t b d-d9aye9 (0 = bla) */
  preMin: number;
  showIqama: boolean;
  /** L-i9ama: d9aye9 mn ba3d l-adhan */
  iqama: Partial<Record<PrayerId, number>>;
}

export const DEFAULT_IQAMA: Record<string, number> = { fajr: 20, dhuhr: 15, asr: 15, maghrib: 5, isha: 15 };

export const DEFAULT_SALAT: SalatSettings = {
  cityId: "casablanca", coords: null, method: "morocco", asr: "standard", offsets: {}, alert: false, h24: true,
  voice: "chime", fajrVoice: "same", volume: 0.8, customUrl: "", fadeIn: true, vibrate: true, alertFor: {}, preMin: 0, showIqama: true, iqama: {},
};

export const useSalatSettings = () => {
  const [stored, setStored] = useLocalState<Partial<SalatSettings>>("ltd.salat.settings", DEFAULT_SALAT);
  const settings: SalatSettings = { ...DEFAULT_SALAT, ...stored };
  const update = (p: Partial<SalatSettings>) => setStored((s) => ({ ...DEFAULT_SALAT, ...s, ...p }));
  return [settings, update] as const;
};

/** Mn les réglages l l-input dyal l-7sab */
export const toPrayerInput = (s: SalatSettings): PrayerInput & { label: string; labelAr: string } => {
  const city = CITIES.find((c) => c.id === s.cityId) ?? CITIES[0];
  if (s.coords) return { lat: s.coords.lat, lng: s.coords.lng, method: s.method, asr: s.asr, offsets: s.offsets, label: "", labelAr: "" };
  return { lat: city.lat, lng: city.lng, timeZone: city.tz, method: s.method, asr: s.asr, offsets: s.offsets, label: city.name, labelAr: city.ar };
};

/** Suivi: f kol nhar, s-salawat li t-sellaw */
export const useSalatLog = () => {
  const [log, setLog] = useLocalState<Record<string, string[]>>("ltd.salat.log", {});
  const has = (day: string, p: string) => (log[day] ?? []).includes(p);
  const toggle = (day: string, p: string) =>
    setLog((l) => {
      const cur = l[day] ?? [];
      return { ...l, [day]: cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p] };
    });
  /** Ayam kamlin (5/5) mtab3in — l-yawm ila ma kmelch ma kay-9te3ch s-série */
  const streak = (() => {
    let n = 0;
    const d = new Date();
    const full = (k: string) => FARD.every((p) => (log[k] ?? []).includes(p));
    if (!full(dayKey(d))) d.setDate(d.getDate() - 1);
    while (full(dayKey(d)) && n < 3650) { n += 1; d.setDate(d.getDate() - 1); }
    return n;
  })();
  return { log, has, toggle, streak };
};
