"use client";

// Réglages dyal l-9raya (persistés): thème, tajweed, double page, taille, interligne, traduction...
import { useLocalState } from "./localStore";

export type MushafTheme =
  | "emerald" | "parchment" | "sepia" | "night"
  | "madina" | "lapis" | "kiswa" | "andalus" | "rose";

/** Ga3 l-thèmes b t-tartib dyal l-affichage */
export const MUSHAF_THEMES: MushafTheme[] = ["emerald", "madina", "parchment", "sepia", "andalus", "rose", "lapis", "kiswa", "night"];

export interface ReaderPrefs {
  theme: MushafTheme;
  tajweed: boolean;
  spread: boolean;      // double page (desktop)
  fontSize: number;     // rem
  lineHeight: number;
  wordHover: boolean;   // highlight kelma b kelma
  markers: boolean;     // rob3 l-hizb, sajda...
  font: MushafFont;     // khatt: uthmani (Amiri Quran) / naskh (Amiri)
  align: "justify" | "center";
  flip: PageFlip;       // animation dyal t-teqlab dyal la page
  ayahLines: boolean;   // kol aya f ster
  spotlight: boolean;   // l-aya li t7t souris kat-ban, l-ba9i kay-ghber
  dimRead: boolean;     // li t9ra kay-ghber
  ornaments: boolean;   // cadre + zakharif
  ayahNumbers: boolean;
  narrow: boolean;      // page diy9a (ster 9sir = 9raya ashel)
  brightness: number;   // 0.45 .. 1
  autoSpeed: number;    // px / tanya (défilement auto)
  hide: HideMode;       // mode mémorisation: n-nass mkhbi 7ta t-click
  wordSpacing: number;  // em
  pagePad: number;      // px (hawamich)
  wakeLock: boolean;    // l-écran ma kay-tfach
  tapZones: boolean;    // click f l-7awachi kay-qleb la page
  flipSound: boolean;   // sawt dyal l-wr9a
  autoNight: boolean;   // thème "nuit" mn l-maghrib l l-fajr
  inlineTr: boolean;    // t-tarjama t7t kol aya
}

export type HideMode = "off" | "first" | "all";
export type HlColor = "gold" | "green" | "rose" | "blue";
export const HL_COLORS: HlColor[] = ["gold", "green", "rose", "blue"];

export type MushafFont = "uthmani" | "naskh";
export type PageFlip = "book" | "slide" | "fade" | "none";
export const MUSHAF_FONTS: Record<MushafFont, string> = {
  uthmani: '"Amiri Quran", "Amiri", serif',
  naskh: '"Amiri", "Amiri Quran", serif',
};

export const DEFAULT_PREFS: ReaderPrefs = {
  theme: "emerald", tajweed: false, spread: true, fontSize: 2.1, lineHeight: 2.35, wordHover: true, markers: true,
  font: "uthmani", align: "justify", flip: "book", ayahLines: false, spotlight: false, dimRead: false,
  ornaments: true, ayahNumbers: true, narrow: false, brightness: 1, autoSpeed: 28, hide: "off",
  wordSpacing: 0, pagePad: 0, wakeLock: false, tapZones: false, flipSound: false, autoNight: false, inlineTr: false,
};

export const useReaderPrefs = () => {
  const [stored, setStored] = useLocalState<Partial<ReaderPrefs>>("ltd.reader", DEFAULT_PREFS);
  const merged: ReaderPrefs = { ...DEFAULT_PREFS, ...stored };
  // Thème ma-b9ach (version 9dima) -> par défaut
  const prefs: ReaderPrefs = MUSHAF_THEMES.includes(merged.theme) ? merged : { ...merged, theme: DEFAULT_PREFS.theme };
  const update = (patch: Partial<ReaderPrefs>) => setStored((p) => ({ ...DEFAULT_PREFS, ...p, ...patch }));
  const reset = () => setStored(() => DEFAULT_PREFS);
  return [prefs, update, reset] as const;
};

/** Favoris: "surah:ayah" */
export const useFavorites = () => {
  const [list, setList] = useLocalState<string[]>("ltd.favorites", []);
  const has = (s: number, a: number) => list.includes(`${s}:${a}`);
  const toggle = (s: number, a: number) =>
    setList((l) => (l.includes(`${s}:${a}`) ? l.filter((x) => x !== `${s}:${a}`) : [`${s}:${a}`, ...l]));
  return { list, has, toggle };
};
/** Surlignage: "surah:ayah" -> lon */
export const useHighlights = () => {
  const [map, setMap] = useLocalState<Record<string, HlColor>>("ltd.highlights", {});
  const get = (s: number, a: number): HlColor | undefined => map[`${s}:${a}`];
  const set = (s: number, a: number, color: HlColor | null) =>
    setMap((m) => {
      const next = { ...m };
      if (color) next[`${s}:${a}`] = color; else delete next[`${s}:${a}`];
      return next;
    });
  return { map, get, set };
};
