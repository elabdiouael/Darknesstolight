// Text dyal l-Quran (Uthmani) + traduction mn CDN jsDelivr (quran-json, CC-BY-4.0)
// + tafasir, traductions, mot à mot, tajweed w l-9orra2 via l-backend (/quran, public + cache Redis)
import { Lang } from "@/i18n/dictionaries";
import { apiClient } from "@/services/api/axiosConfig";
import { globalIndex } from "@/lib/quran";

const CDN = "https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters";

export interface Verse { id: number; text: string; translation?: string; transliteration?: string }
export interface Chapter { id: number; name: string; transliteration: string; total_verses: number; verses: Verse[] }

/** Cache dyal promises (kat-tms7 ila fshlat bach n3awdo) */
const memo = <T,>(cache: Map<string, Promise<T>>, key: string, make: () => Promise<T>): Promise<T> => {
  if (!cache.has(key)) {
    const p = make();
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return cache.get(key)!;
};

const chapterCache = new Map<string, Promise<Chapter>>();

export const fetchChapter = (surah: number, lang: Lang): Promise<Chapter> => {
  // F l-3arbiya ma kayn7tajch traduction
  const path = lang === "ar" ? `${CDN}/${surah}.json` : `${CDN}/${lang}/${surah}.json`;
  return memo(chapterCache, path, () => fetch(path).then((r) => {
    if (!r.ok) throw new Error("quran fetch failed");
    return r.json() as Promise<Chapter>;
  }));
};

// ---------- Tafasir (b surah) ----------
export const DEFAULT_TAFSIR = "ar.muyassar";
const tafsirCache = new Map<string, Promise<Record<number, string>>>();

export const fetchTafsir = (surah: number, edition: string = DEFAULT_TAFSIR): Promise<Record<number, string>> =>
  memo(tafsirCache, `${surah}:${edition}`, () =>
    apiClient.get(`/quran/surah/${surah}/tafsir/${edition}`).then((r) => {
      const map: Record<number, string> = {};
      const ayahs: { numberInSurah: number; text: string }[] = r.data?.data?.ayahs ?? [];
      ayahs.forEach((a) => { map[a.numberInSurah] = a.text; });
      return map;
    }));

// ---------- Editions (tafsir / translation) ----------
export interface Edition { identifier: string; language: string; name: string; englishName: string; direction?: string }
const editionsCache = new Map<string, Promise<Edition[]>>();

export const fetchEditions = (type: "tafsir" | "translation"): Promise<Edition[]> =>
  memo(editionsCache, type, () =>
    apiClient.get(`/quran/editions/${type}`).then((r) => (r.data?.data ?? []) as Edition[]));

/** Aya wa7da f ktar mn edition (traductions / tafasir) */
export interface AyahEdition { edition: Edition; text: string }
const ayahEdCache = new Map<string, Promise<AyahEdition[]>>();

export const fetchAyahEditions = (surah: number, ayah: number, editions: string[]): Promise<AyahEdition[]> => {
  const list = editions.slice(0, 6).join(",");
  return memo(ayahEdCache, `${surah}:${ayah}:${list}`, () =>
    apiClient.get(`/quran/ayah/${surah}/${ayah}/editions/${list}`).then((r) =>
      ((r.data?.data ?? []) as { edition: Edition; text: string }[]).map((d) => ({ edition: d.edition, text: d.text }))));
};

// ---------- Mot à mot (quran.com v4 via backend) ----------
export interface Word { position: number; text: string; translation: string; transliteration: string; audio: string | null }
/** Timing dyal kol kelma f tilawat l-aya kamla (ms) */
export interface WordSegment { position: number; start: number; end: number }
export interface AyahWords { words: Word[]; verseAudio: string | null; segments: WordSegment[] }

const wordsCache = new Map<string, Promise<AyahWords>>();
const WORD_AUDIO = "https://audio.qurancdn.com/";
const VERSE_AUDIO = "https://verses.quran.com/";

/** "wbw/002_255_001.mp3" / "//verses..." / "https://..." -> URL kamla */
const absUrl = (u: string | null | undefined, base: string): string | null => {
  if (!u) return null;
  if (/^https?:\/\//.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  return base + u.replace(/^\//, "");
};

/** Segments: [kelma, debut, fin] (wla [x, kelma, debut, fin] f l-format l-9dim) */
const parseSegments = (raw: unknown): WordSegment[] => {
  if (!Array.isArray(raw)) return [];
  const segs = (raw as unknown[])
    .filter((s): s is number[] => Array.isArray(s) && s.length >= 3 && s.every((n) => typeof n === "number"))
    .map((s) => ({ position: s[s.length - 3], start: s[s.length - 2], end: s[s.length - 1] }))
    .filter((s) => s.end > s.start);
  // Ila l-index kaybda b 0 -> n-rddoh 1-based b7al "position" dyal l-kelmat
  if (segs.length && Math.min(...segs.map((s) => s.position)) === 0) segs.forEach((s) => { s.position += 1; });
  return segs.sort((a, b) => a.start - b.start);
};

export const fetchWords = (surah: number, ayah: number, lang: Lang): Promise<AyahWords> => {
  const l = lang === "ar" ? "en" : lang === "fr" ? "fr" : "en";
  return memo(wordsCache, `${surah}:${ayah}:${l}`, () =>
    apiClient.get(`/quran/ayah/${surah}/${ayah}/words`, { params: { language: l } }).then((r) => {
      type Raw = { position?: number; char_type_name: string; text_uthmani?: string; text?: string; audio_url?: string | null;
        translation?: { text?: string }; transliteration?: { text?: string } };
      const verse = r.data?.verse ?? {};
      const raw: Raw[] = verse.words ?? [];
      const words = raw
        .map((w, i) => ({ w, i }))
        .filter(({ w }) => w.char_type_name === "word")
        // Tartib b "position" (machi b tartib dyal JSON) — ila makaynach, n-khdmo b l-index
        .sort((a, b) => (a.w.position ?? a.i + 1) - (b.w.position ?? b.i + 1))
        .map(({ w, i }) => ({
          position: w.position ?? i + 1,
          text: w.text_uthmani ?? w.text ?? "",
          translation: w.translation?.text ?? "",
          transliteration: w.transliteration?.text ?? "",
          audio: absUrl(w.audio_url, WORD_AUDIO),
        }));
      return {
        words,
        verseAudio: absUrl(verse.audio?.url, VERSE_AUDIO),
        segments: parseSegments(verse.audio?.segments),
      };
    }));
};

// ---------- Tajweed (alquran.cloud "quran-tajweed") ----------
export type TajweedSeg = { text: string; rule?: string };
const tajweedCache = new Map<string, Promise<Record<number, TajweedSeg[]>>>();
const BASMALA_START = "بِسْمِ";

/** "[h:1[ٱ]للَّهِ" -> [{text:"ٱ", rule:"h"}, {text:"للَّهِ"}] */
export const parseTajweed = (raw: string): TajweedSeg[] => {
  const out: TajweedSeg[] = [];
  const re = /\[([a-z])(?::\d+)?\[([^\]]*)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    if (m.index > last) out.push({ text: raw.slice(last, m.index) });
    out.push({ text: m[2], rule: m[1] });
    last = re.lastIndex;
  }
  if (last < raw.length) out.push({ text: raw.slice(last) });
  return out;
};

export const fetchTajweed = (surah: number): Promise<Record<number, TajweedSeg[]>> =>
  memo(tajweedCache, String(surah), () =>
    apiClient.get(`/quran/surah/${surah}/tafsir/quran-tajweed`).then((r) => {
      const map: Record<number, TajweedSeg[]> = {};
      const ayahs: { numberInSurah: number; text: string }[] = r.data?.data?.ayahs ?? [];
      ayahs.forEach((a) => {
        let raw = a.text;
        // L-basmala kat-ji m3a aya 1 (ghir l-Fatiha w At-Tawba) -> n7aydoha
        if (a.numberInSurah === 1 && surah !== 1 && surah !== 9 && raw.startsWith(BASMALA_START)) {
          raw = raw.split(" ").slice(4).join(" ");
        }
        map[a.numberInSurah] = parseTajweed(raw);
      });
      return map;
    }));

// ---------- 9orra2 (audio aya b aya, alquran.cloud CDN) ----------
export interface Reciter { id: string; name: string; englishName: string; language: string; url: string }

const CDN_AUDIO = "https://cdn.islamic.network/quran/audio";

/** Ila l-backend ma jawbch: chi 9orra2 m3roufin (128 kbps) */
export const FALLBACK_RECITERS: Reciter[] = [
  { id: "ar.alafasy", name: "مشاري العفاسي", englishName: "Alafasy", language: "ar", url: `${CDN_AUDIO}/128/ar.alafasy/{n}.mp3` },
  { id: "ar.husary", name: "محمود خليل الحصري", englishName: "Husary", language: "ar", url: `${CDN_AUDIO}/128/ar.husary/{n}.mp3` },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي", englishName: "Minshawi", language: "ar", url: `${CDN_AUDIO}/128/ar.minshawi/{n}.mp3` },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي", englishName: "Maher Al Muaiqly", language: "ar", url: `${CDN_AUDIO}/128/ar.mahermuaiqly/{n}.mp3` },
  { id: "ar.abdurrahmaansudais", name: "عبدالرحمن السديس", englishName: "Abdurrahmaan As-Sudais", language: "ar", url: `${CDN_AUDIO}/192/ar.abdurrahmaansudais/{n}.mp3` },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد المرتل", englishName: "Abdul Basit", language: "ar", url: `${CDN_AUDIO}/192/ar.abdulbasitmurattal/{n}.mp3` },
  { id: "ar.saoodshuraym", name: "سعود الشريم", englishName: "Saood bin Ibraaheem Ash-Shuraym", language: "ar", url: `${CDN_AUDIO}/64/ar.saoodshuraym/{n}.mp3` },
  { id: "ar.hudhaify", name: "علي بن عبدالرحمن الحذيفي", englishName: "Hudhaify", language: "ar", url: `${CDN_AUDIO}/128/ar.hudhaify/{n}.mp3` },
];

export const DEFAULT_RECITER = "ar.alafasy";

const templates = new Map<string, string>(FALLBACK_RECITERS.map((r) => [r.id, r.url]));
let recitersPromise: Promise<Reciter[]> | null = null;

/** Ga3 l-9orra2 disponibles (merra wa7da, cache) */
export const loadReciters = (): Promise<Reciter[]> => {
  if (!recitersPromise) {
    recitersPromise = apiClient.get<Reciter[]>("/quran/reciters/audio")
      .then((r) => {
        const list = (r.data ?? []).filter((x) => x?.id && x?.url);
        if (!list.length) return FALLBACK_RECITERS;
        list.forEach((x) => templates.set(x.id, x.url));
        return list;
      })
      .catch(() => { recitersPromise = null; return FALLBACK_RECITERS; });
  }
  return recitersPromise;
};

/** Les anciens ids (everyayah, ex "Alafasy_128kbps") -> ar.alafasy */
export const normalizeReciter = (id: string | null | undefined) => (id && id.includes(".") ? id : DEFAULT_RECITER);

/** Audio dyal kol aya */
export const ayahAudioUrl = (surah: number, ayah: number, reciter: string = DEFAULT_RECITER) => {
  const id = normalizeReciter(reciter);
  const tpl = templates.get(id) ?? `${CDN_AUDIO}/128/${id}/{n}.mp3`;
  return tpl.replace("{n}", String(globalIndex(surah, ayah)));
};