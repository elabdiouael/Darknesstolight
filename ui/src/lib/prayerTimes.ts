// 7sab dyal aw9at s-salat (falaki, bla API — khdam offline) + l-qibla.
// L-algorithme howa dyal PrayTimes (praytimes.org): maw9i3 ch-chems -> zawaya dyal l-fajr / l-3icha / l-3asr.

export type PrayerId = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
export const PRAYERS: PrayerId[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
/** S-salawat l-khams (bla chourou9) */
export const FARD: Exclude<PrayerId, "sunrise">[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export type MethodId = "morocco" | "mwl" | "egypt" | "makkah" | "isna" | "karachi";
/** fajr / isha: zawiya t7t l-ofo9 — ishaMin: d9aye9 mn ba3d l-maghrib (Umm al-Qura) */
export const METHODS: Record<MethodId, { fajr: number; isha?: number; ishaMin?: number }> = {
  morocco: { fajr: 19, isha: 17 },
  mwl: { fajr: 18, isha: 17 },
  egypt: { fajr: 19.5, isha: 17.5 },
  makkah: { fajr: 18.5, ishaMin: 90 },
  isna: { fajr: 15, isha: 15 },
  karachi: { fajr: 18, isha: 18 },
};
export const METHOD_IDS = Object.keys(METHODS) as MethodId[];

export type AsrSchool = "standard" | "hanafi";

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const sin = (d: number) => Math.sin(rad(d));
const cos = (d: number) => Math.cos(rad(d));
const tan = (d: number) => Math.tan(rad(d));
const fix = (a: number, b: number) => { const x = a - b * Math.floor(a / b); return x < 0 ? x + b : x; };

const julian = (y: number, m: number, d: number) => {
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
};

const sunPosition = (jd: number) => {
  const D = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * D, 360);
  const q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360);
  const e = 23.439 - 0.00000036 * D;
  const RA = deg(Math.atan2(cos(e) * sin(L), cos(L))) / 15;
  return { declination: deg(Math.asin(sin(e) * sin(L))), equation: q / 15 - fix(RA, 24) };
};

/** Décalage (b s-sway3) dyal fuseau horaire f had n-nhar — kay-7seb 7ta l-heure d'été */
export const tzOffsetHours = (date: Date, timeZone?: string): number => {
  if (!timeZone) return -date.getTimezoneOffset() / 60;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
    }).formatToParts(date);
    const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
    return Math.round((asUtc - date.getTime()) / 60000) / 60;
  } catch {
    return -date.getTimezoneOffset() / 60;
  }
};

export interface PrayerInput {
  lat: number; lng: number; method: MethodId; asr: AsrSchool;
  /** Ta3dil b d-d9aye9 l kol salat (bach t-wafe9 l-masjid dyalek) */
  offsets?: Partial<Record<PrayerId, number>>;
  timeZone?: string;
}

/** Aw9at n-nhar b s-sway3 l-ma7alliya (float, 0..24). NaN ila ch-chems ma kat-wselch l z-zawiya (3ard 3ali bezzaf). */
export const computeTimes = (y: number, m: number, d: number, input: PrayerInput): Record<PrayerId, number> => {
  const { lat, lng } = input;
  const cfg = METHODS[input.method];
  const jDate = julian(y, m, d) - lng / (15 * 24);
  const tz = tzOffsetHours(new Date(Date.UTC(y, m - 1, d, 12)), input.timeZone);

  const midDay = (t: number) => fix(12 - sunPosition(jDate + t).equation, 24);
  const angleTime = (angle: number, t: number, ccw = false) => {
    const decl = sunPosition(jDate + t).declination;
    const x = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
    const h = deg(Math.acos(x)) / 15;
    return midDay(t) + (ccw ? -h : h);
  };
  const asrTime = (factor: number, t: number) => {
    const decl = sunPosition(jDate + t).declination;
    return angleTime(-deg(Math.atan(1 / (factor + tan(Math.abs(lat - decl))))), t);
  };

  // Jouj dawrat: l-wla b ta9dir, t-tanya b l-we9t l-ma7soub (aktar di99a)
  let t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, maghrib: 18, isha: 18 };
  for (let i = 0; i < 2; i++) {
    const p = { fajr: t.fajr / 24, sunrise: t.sunrise / 24, dhuhr: t.dhuhr / 24, asr: t.asr / 24, maghrib: t.maghrib / 24, isha: t.isha / 24 };
    const maghrib = angleTime(0.833, p.maghrib);
    t = {
      fajr: angleTime(cfg.fajr, p.fajr, true),
      sunrise: angleTime(0.833, p.sunrise, true),
      dhuhr: midDay(p.dhuhr),
      asr: asrTime(input.asr === "hanafi" ? 2 : 1, p.asr),
      maghrib,
      isha: cfg.ishaMin ? maghrib + cfg.ishaMin / 60 : angleTime(cfg.isha ?? 17, p.isha),
    };
  }
  const out = {} as Record<PrayerId, number>;
  for (const id of PRAYERS) out[id] = t[id] + tz - lng / 15 + (input.offsets?.[id] ?? 0) / 60;
  return out;
};

/** Aw9at n-nhar ka Date (b s-sa3a dyal l-jihaz) */
export const timesForDate = (date: Date, input: PrayerInput): Record<PrayerId, Date | null> => {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const hours = computeTimes(y, m, d, input);
  // Ila l-madina f fuseau akhor: kan-rej3ou l s-sa3a dyal l-jihaz
  const shift = tzOffsetHours(date) - tzOffsetHours(date, input.timeZone);
  const out = {} as Record<PrayerId, Date | null>;
  for (const id of PRAYERS) {
    const h = hours[id];
    out[id] = Number.isFinite(h) ? new Date(new Date(y, m - 1, d).getTime() + (h + shift) * 3_600_000) : null;
  }
  return out;
};

export const KAABA = { lat: 21.4225, lng: 39.8262 };

/** Ittijah l-qibla (b d-darajat mn ch-chamal, m3a 3a9arib s-sa3a) */
export const qiblaBearing = (lat: number, lng: number): number => {
  const dl = rad(KAABA.lng - lng);
  const y = Math.sin(dl);
  const x = Math.cos(rad(lat)) * Math.tan(rad(KAABA.lat)) - Math.sin(rad(lat)) * Math.cos(dl);
  return fix(deg(Math.atan2(y, x)), 360);
};

/** L-masafa l Mekka b km (haversine) */
export const distanceToKaaba = (lat: number, lng: number): number => {
  const a = Math.sin(rad(KAABA.lat - lat) / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(KAABA.lat)) * Math.sin(rad(KAABA.lng - lng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export interface City { id: string; name: string; ar: string; lat: number; lng: number; tz: string; method: MethodId }
export const CITIES: City[] = [
  { id: "casablanca", name: "Casablanca", ar: "الدار البيضاء", lat: 33.5731, lng: -7.5898, tz: "Africa/Casablanca", method: "morocco" },
  { id: "rabat", name: "Rabat", ar: "الرباط", lat: 34.0209, lng: -6.8416, tz: "Africa/Casablanca", method: "morocco" },
  { id: "fes", name: "Fès", ar: "فاس", lat: 34.0181, lng: -5.0078, tz: "Africa/Casablanca", method: "morocco" },
  { id: "marrakech", name: "Marrakech", ar: "مراكش", lat: 31.6295, lng: -7.9811, tz: "Africa/Casablanca", method: "morocco" },
  { id: "tanger", name: "Tanger", ar: "طنجة", lat: 35.7595, lng: -5.834, tz: "Africa/Casablanca", method: "morocco" },
  { id: "agadir", name: "Agadir", ar: "أكادير", lat: 30.4278, lng: -9.5981, tz: "Africa/Casablanca", method: "morocco" },
  { id: "meknes", name: "Meknès", ar: "مكناس", lat: 33.8935, lng: -5.5473, tz: "Africa/Casablanca", method: "morocco" },
  { id: "oujda", name: "Oujda", ar: "وجدة", lat: 34.6814, lng: -1.9086, tz: "Africa/Casablanca", method: "morocco" },
  { id: "tetouan", name: "Tétouan", ar: "تطوان", lat: 35.5889, lng: -5.3626, tz: "Africa/Casablanca", method: "morocco" },
  { id: "laayoune", name: "Laâyoune", ar: "العيون", lat: 27.1253, lng: -13.1625, tz: "Africa/Casablanca", method: "morocco" },
  { id: "makkah", name: "Makkah", ar: "مكة المكرمة", lat: 21.4225, lng: 39.8262, tz: "Asia/Riyadh", method: "makkah" },
  { id: "madinah", name: "Madinah", ar: "المدينة المنورة", lat: 24.4672, lng: 39.6111, tz: "Asia/Riyadh", method: "makkah" },
  { id: "alger", name: "Alger", ar: "الجزائر", lat: 36.7538, lng: 3.0588, tz: "Africa/Algiers", method: "mwl" },
  { id: "tunis", name: "Tunis", ar: "تونس", lat: 36.8065, lng: 10.1815, tz: "Africa/Tunis", method: "mwl" },
  { id: "cairo", name: "Le Caire", ar: "القاهرة", lat: 30.0444, lng: 31.2357, tz: "Africa/Cairo", method: "egypt" },
  { id: "istanbul", name: "Istanbul", ar: "إسطنبول", lat: 41.0082, lng: 28.9784, tz: "Europe/Istanbul", method: "mwl" },
  { id: "dubai", name: "Dubaï", ar: "دبي", lat: 25.2048, lng: 55.2708, tz: "Asia/Dubai", method: "makkah" },
  { id: "paris", name: "Paris", ar: "باريس", lat: 48.8566, lng: 2.3522, tz: "Europe/Paris", method: "mwl" },
  { id: "bruxelles", name: "Bruxelles", ar: "بروكسل", lat: 50.8503, lng: 4.3517, tz: "Europe/Brussels", method: "mwl" },
  { id: "madrid", name: "Madrid", ar: "مدريد", lat: 40.4168, lng: -3.7038, tz: "Europe/Madrid", method: "mwl" },
  { id: "london", name: "London", ar: "لندن", lat: 51.5074, lng: -0.1278, tz: "Europe/London", method: "mwl" },
  { id: "newyork", name: "New York", ar: "نيويورك", lat: 40.7128, lng: -74.006, tz: "America/New_York", method: "isna" },
  { id: "montreal", name: "Montréal", ar: "مونتريال", lat: 45.5017, lng: -73.5673, tz: "America/Toronto", method: "isna" },
  { id: "jakarta", name: "Jakarta", ar: "جاكرتا", lat: -6.2088, lng: 106.8456, tz: "Asia/Jakarta", method: "mwl" },
];
