// Meta dyal l-Mushaf (Hafs): rob3 l-a7zab (240) w sajadat t-tilawa (15). Source: quran-meta (Tanzil), MIT.
import { globalIndex } from "./quran";

/** Index global (1..6236) dyal awel aya f kol rob3 hizb */
const HIZB_QUARTERS: number[] = [
  1, 33, 51, 67, 82, 99, 113, 131, 149, 165, 184, 196, 210, 226, 240, 250, 260, 270, 279, 290, 308, 326, 345,
  368, 386, 406, 426, 446, 464, 479, 494, 505, 517, 529, 551, 567, 581, 593, 607, 628, 641, 656, 670, 681,
  696, 710, 720, 736, 751, 766, 778, 802, 825, 848, 863, 884, 900, 916, 930, 940, 955, 985, 1001, 1019, 1042,
  1071, 1096, 1110, 1125, 1143, 1161, 1182, 1201, 1221, 1236, 1254, 1269, 1281, 1295, 1310, 1328, 1346, 1357,
  1375, 1390, 1417, 1435, 1454, 1479, 1497, 1514, 1534, 1557, 1581, 1603, 1626, 1649, 1673, 1697, 1712, 1726,
  1742, 1760, 1778, 1803, 1852, 1902, 1931, 1952, 1976, 1991, 2012, 2030, 2052, 2079, 2099, 2128, 2157, 2172,
  2191, 2215, 2239, 2272, 2309, 2349, 2403, 2431, 2459, 2484, 2512, 2534, 2566, 2596, 2614, 2633, 2655, 2674,
  2709, 2748, 2792, 2812, 2826, 2844, 2856, 2876, 2908, 2933, 2984, 3043, 3113, 3160, 3186, 3215, 3241, 3264,
  3281, 3303, 3328, 3341, 3366, 3386, 3410, 3440, 3463, 3491, 3514, 3534, 3551, 3564, 3584, 3593, 3616, 3630,
  3652, 3675, 3701, 3733, 3765, 3810, 3871, 3933, 3991, 4022, 4066, 4090, 4111, 4134, 4154, 4174, 4199, 4227,
  4243, 4265, 4285, 4299, 4323, 4349, 4382, 4431, 4485, 4511, 4531, 4555, 4578, 4601, 4613, 4626, 4657, 4706,
  4759, 4810, 4855, 4902, 4980, 5054, 5091, 5105, 5118, 5137, 5157, 5178, 5192, 5218, 5230, 5242, 5272, 5324,
  5394, 5448, 5495, 5552, 5610, 5673, 5759, 5830, 5885, 5949, 6024, 6091, 6155,
];

/** Index global dyal ayat s-sajda */
const SAJDAS = new Set<number>([
  1160, 1722, 1951, 2138, 2308, 2613, 2672, 2915, 3185, 3518, 3994, 4256, 4846, 5905, 6125,
]);

const QUARTER_STARTS = new Map<number, number>(HIZB_QUARTERS.map((g, i) => [g, i]));

export interface QuarterInfo { hizb: number; quarter: number } // hizb 1..60, quarter 0..3

/** Rob3 l-hizb li fih l-aya */
export const quarterOf = (surah: number, ayah: number): QuarterInfo => {
  const g = globalIndex(surah, ayah);
  let lo = 0, hi = HIZB_QUARTERS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (HIZB_QUARTERS[mid] <= g) lo = mid; else hi = mid - 1;
  }
  return { hizb: Math.floor(lo / 4) + 1, quarter: lo % 4 };
};

/** Ila had l-aya kat-bda rob3 jdid -> {hizb, quarter}, sinon null */
export const quarterStart = (surah: number, ayah: number): QuarterInfo | null => {
  const i = QUARTER_STARTS.get(globalIndex(surah, ayah));
  return i === undefined ? null : { hizb: Math.floor(i / 4) + 1, quarter: i % 4 };
};

export const isSajda = (surah: number, ayah: number) => SAJDAS.has(globalIndex(surah, ayah));