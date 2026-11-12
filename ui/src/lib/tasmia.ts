// Tasmi3: n-comparew chno 9al l-user (Speech-to-text) m3a l-aya l-asliya (Uthmani)
// L-moqarana kat-koun 3la l-kelmat, b tolérance (l-imla2 l-3othmani ≠ l-imla2 l-3adi dyal STT)

export type WordStatus = "ok" | "close" | "wrong" | "missed" | "pending";

export interface WordResult {
  word: string;        // l-kelma l-asliya (Uthmani, b tashkil)
  status: WordStatus;
  heard?: string;      // chno sma3 l-STT (ila ghalat)
}

export interface TasmiaResult {
  words: WordResult[];
  extra: string[];     // kelmat zaydin (ma kaynach f l-aya)
  accuracy: number;    // 0..100
  reached: number;     // ch7al mn kelma wselna (bach n-tab3o live)
  mistakes: number;
}

// Tashkil + 3alamat l-wa9f + tatweel
const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ࣓-ࣿ]/g;

/** Normalisation: n-7aydo t-tashkil w n-wa7do l-7orouf li kayt-ktbo b ktar mn chkel */
export const normalize = (s: string): string =>
  s
    .replace(/ٱ/g, "ا") // alef wasla
    .replace(MARKS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    .replace(/[^ء-ي\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const tokenize = (s: string): string[] => normalize(s).split(" ").filter(Boolean);

/** Kelmat l-aya (Uthmani) b chkel dyalhom, bla 3alamat l-wa9f bo7dhom */
export const ayahWords = (text: string): string[] =>
  text.split(/\s+/).filter((w) => normalize(w).length > 0);

const lev = (a: string, b: string): number => {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
};

const ratio = (a: string, b: string) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);

/** Tachabouh bin 2 kelmat (0..1). L-alef kat-tktb/kat-t7ayed f l-3othmani -> n-jarbo bla alef */
export const similarity = (a: string, b: string): number => {
  if (!a || !b) return 0;
  const noAlef = (x: string) => x.replace(/ا/g, "");
  const noWaw = (x: string) => noAlef(x).replace(/و/g, "");
  return Math.max(ratio(a, b), ratio(noAlef(a), noAlef(b)) - 0.02, ratio(noWaw(a), noWaw(b)) - 0.06);
};

const OK = 0.82;
const CLOSE = 0.6;

type Op = { kind: "match"; i: number; j: number; len: number; sim: number } | { kind: "miss"; i: number } | { kind: "extra"; j: number };

/**
 * Alignment (Needleman-Wunsch) bin kelmat l-aya (ref) w chno t-sma3 (hyp).
 * `partial`: l-user mazal kay9ra -> l-kelmat li mazal ma wselnalhomch ma kat-t7sebch "missed".
 */
export const compare = (ayahText: string, heard: string, partial = false): TasmiaResult => {
  const words = ayahWords(ayahText);
  const ref = words.map(normalize);
  const hyp = tokenize(heard);
  const m = ref.length, n = hyp.length;

  const INF = 1e9;
  const cost: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(INF));
  const back: (Op | null)[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
  cost[0][0] = 0;
  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      const c = cost[i][j];
      if (c >= INF) continue;
      const relax = (ni: number, nj: number, v: number, op: Op) => {
        if (v < cost[ni][nj]) { cost[ni][nj] = v; back[ni][nj] = op; }
      };
      if (i < m) relax(i + 1, j, c + 1, { kind: "miss", i });
      if (j < n) relax(i, j + 1, c + 0.9, { kind: "extra", j });
      if (i < m && j < n) {
        const s = similarity(ref[i], hyp[j]);
        relax(i + 1, j + 1, c + (1 - s) * 1.6, { kind: "match", i, j, len: 1, sim: s });
        // STT kay-9sem kelma wa7da f 2 (ex: يَـٰٓأَيُّهَا -> يا ايها)
        if (j + 1 < n) {
          const s2 = similarity(ref[i], hyp[j] + hyp[j + 1]);
          if (s2 > s) relax(i + 1, j + 2, c + (1 - s2) * 1.6 + 0.05, { kind: "match", i, j, len: 2, sim: s2 });
        }
      }
    }
  }

  // F l-mode live: n-khtaro a7san blasa f ref (prefix) li tsali fiha l-kalam
  let endI = m;
  if (partial && n > 0) {
    let best = INF;
    for (let i = 0; i <= m; i++) {
      const v = cost[i][n] + (m - i) * 0.001;
      if (v < best) { best = v; endI = i; }
    }
  } else if (partial) {
    endI = 0;
  }

  const result: WordResult[] = words.map((w) => ({ word: w, status: "pending" as WordStatus }));
  const extra: string[] = [];
  let i = endI, j = n;
  while (i > 0 || j > 0) {
    const op = back[i][j];
    if (!op) break;
    if (op.kind === "miss") { result[op.i].status = "missed"; i--; }
    else if (op.kind === "extra") { extra.unshift(hyp[op.j]); j--; }
    else {
      const heardW = hyp.slice(op.j, op.j + op.len).join(" ");
      result[op.i] = {
        word: words[op.i],
        status: op.sim >= OK ? "ok" : op.sim >= CLOSE ? "close" : "wrong",
        heard: op.sim >= OK ? undefined : heardW,
      };
      i--; j -= op.len;
    }
  }
  if (!partial) result.forEach((r) => { if (r.status === "pending") r.status = "missed"; });

  const scored = partial ? result.slice(0, endI) : result;
  const pts = scored.reduce((s, r) => s + (r.status === "ok" ? 1 : r.status === "close" ? 0.6 : 0), 0);
  const penalty = Math.min(extra.length * 0.5, scored.length * 0.3);
  const accuracy = scored.length ? Math.max(0, Math.round(((pts - penalty) / (partial ? scored.length : m)) * 100)) : 0;
  const mistakes = result.filter((r) => r.status === "wrong" || r.status === "missed").length + extra.length;

  return { words: result, extra, accuracy, reached: endI, mistakes };
};

/** Accuracy -> quality SM-2 (0..5), m3a seuil dyal l-programme */
export const qualityFromAccuracy = (acc: number, pass: number): number => {
  if (acc >= 98) return 5;
  if (acc >= Math.max(pass, 88)) return 4;
  if (acc >= pass) return 3;
  if (acc >= pass - 20) return 2;
  if (acc >= 30) return 1;
  return 0;
};