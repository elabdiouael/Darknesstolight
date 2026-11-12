// Lecteur "mot à mot" fiable:
//  - kol kelma 3endha <audio> dyalha (préchargé) -> ma kaybqach race bin src w play()
//  - token: kol action jdida kat-annuler l-9dima (ma kaybqawch jouj sequences m3a ba3d -> tartib dima s7i7)
//  - ila audio dyal kelma ma kaynach / fshel -> kan9raw l-moqta3 dyalha mn tilawat l-aya kamla (segments)
//  - lecture synchronisée: tilawa kamla + highlight dyal kol kelma f wa9tha
import { AyahWords } from "@/services/quran/quranText";

type Result = "ok" | "fail" | "cancel";
export type PlayerMode = "idle" | "words" | "sync";

interface Callbacks {
  onActive: (index: number | null) => void;
  onMode: (mode: PlayerMode) => void;
  onFallback?: (index: number) => void;
  onProgress?: (ratio: number) => void;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class WordPlayer {
  private token = 0;
  private cache = new Map<string, HTMLAudioElement>();
  private verse: HTMLAudioElement | null = null;
  private raf = 0;

  constructor(private data: AyahWords, private cb: Callbacks) {}

  get hasSync() {
    return !!this.data.verseAudio && this.data.segments.length > 0;
  }

  /** Préchargement dyal ga3 l-kelmat (w l-aya) bach ma ykounch silence bin kelma w kelma */
  preload() {
    this.data.words.forEach((w) => { if (w.audio) this.el(w.audio); });
    if (this.hasSync) this.verseEl();
  }

  private el(url: string) {
    let a = this.cache.get(url);
    if (!a) {
      a = new Audio();
      a.preload = "auto";
      a.src = url;
      this.cache.set(url, a);
    }
    return a;
  }

  private verseEl() {
    if (!this.verse && this.data.verseAudio) {
      this.verse = new Audio();
      this.verse.preload = "auto";
      this.verse.src = this.data.verseAudio;
    }
    return this.verse;
  }

  /** Kaywqef kolchi w kay-annuler ay sequence */
  stop() {
    this.token += 1;
    cancelAnimationFrame(this.raf);
    this.cache.forEach((a) => a.pause());
    this.verse?.pause();
    this.cb.onActive(null);
    this.cb.onMode("idle");
    this.cb.onProgress?.(0);
  }

  destroy() {
    this.stop();
    this.cache.forEach((a) => { a.removeAttribute("src"); a.load(); });
    this.cache.clear();
    if (this.verse) { this.verse.removeAttribute("src"); this.verse.load(); }
    this.verse = null;
  }

  /** Kelma wa7da (click) */
  async playOne(index: number, speed = 1) {
    this.stop();
    const t = ++this.token;
    this.cb.onMode("words");
    await this.playIndex(index, t, speed);
    if (t === this.token) { this.cb.onActive(null); this.cb.onMode("idle"); }
  }

  /** Ga3 l-kelmat b t-tartib (b tikrar dyal kol kelma) */
  async playAll(from = 0, repeat = 1, speed = 1) {
    this.stop();
    const t = ++this.token;
    this.cb.onMode("words");
    const n = this.data.words.length;
    for (let i = from; i < n; i++) {
      for (let r = 0; r < repeat; r++) {
        if (t !== this.token) return;
        const res = await this.playIndex(i, t, speed);
        if (res === "cancel" || t !== this.token) return;
        await wait(repeat > 1 ? 260 : 90);
      }
      this.cb.onProgress?.((i + 1) / n);
    }
    if (t === this.token) { this.cb.onActive(null); this.cb.onMode("idle"); this.cb.onProgress?.(0); }
  }

  /** Tilawa kamla m3a highlight dyal l-kelma li kat-t9ra */
  playSync(speed = 1) {
    const v = this.verseEl();
    if (!v || !this.hasSync) return;
    this.stop();
    const t = ++this.token;
    this.cb.onMode("sync");
    const segs = this.data.segments;
    const indexOfPos = new Map(this.data.words.map((w, i) => [w.position, i]));
    v.playbackRate = speed;
    v.currentTime = 0;
    let last = -1;
    const loop = () => {
      if (t !== this.token) return;
      const ms = v.currentTime * 1000;
      const seg = segs.find((s) => ms >= s.start && ms < s.end);
      const idx = seg ? indexOfPos.get(seg.position) ?? -1 : -1;
      if (idx !== last && idx >= 0) { last = idx; this.cb.onActive(idx); }
      if (v.duration) this.cb.onProgress?.(v.currentTime / v.duration);
      if (v.ended) { this.cb.onActive(null); this.cb.onMode("idle"); this.cb.onProgress?.(0); return; }
      this.raf = requestAnimationFrame(loop);
    };
    v.play().then(() => { this.raf = requestAnimationFrame(loop); }).catch(() => {
      if (t === this.token) { this.cb.onMode("idle"); this.cb.onActive(null); }
    });
  }

  // ------------------------------------------------------------------

  private async playIndex(i: number, t: number, speed: number): Promise<Result> {
    const w = this.data.words[i];
    if (!w) return "fail";
    this.cb.onActive(i);
    if (w.audio) {
      const res = await this.playElement(this.el(w.audio), t, speed);
      if (res !== "fail") return res;
    }
    // Fallback: moqta3 mn tilawat l-aya
    const seg = this.data.segments.find((s) => s.position === w.position);
    if (seg) {
      this.cb.onFallback?.(i);
      return this.playSegment(seg.start, seg.end, t, speed);
    }
    await wait(450);
    return t === this.token ? "fail" : "cancel";
  }

  private playElement(a: HTMLAudioElement, t: number, speed: number): Promise<Result> {
    return new Promise<Result>((resolve) => {
      let settled = false;
      const finish = (r: Result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        clearTimeout(startTimer);
        a.removeEventListener("playing", onPlaying);
        a.removeEventListener("ended", onEnded);
        a.removeEventListener("error", onError);
        a.removeEventListener("pause", onPause);
        resolve(r);
      };
      const onEnded = () => finish("ok");
      const onError = () => finish("fail");
      // "pause" kayji 7ta 9bel "ended": ghir ila t-annula (token tbeddel) n7sbouha cancel
      const onPause = () => { if (t !== this.token) finish("cancel"); };
      // Ila l-kelma ma bdatch f 3.5s (réseau t9il) -> fallback dghya, bla ma ywe9ef l-enchaînement
      const onPlaying = () => clearTimeout(startTimer);
      a.addEventListener("playing", onPlaying);
      a.addEventListener("ended", onEnded);
      a.addEventListener("error", onError);
      a.addEventListener("pause", onPause);
      const startTimer = setTimeout(() => { a.pause(); finish("fail"); }, 3500);
      // Sécurité: 7ta kelma ma kat-fout 8s
      const timer = setTimeout(() => { a.pause(); finish("fail"); }, 8000);
      try { a.currentTime = 0; } catch { /* mazal ma tchargach */ }
      a.playbackRate = speed;
      if (a.error) { finish("fail"); return; }
      a.play().catch(() => finish(t === this.token ? "fail" : "cancel"));
    });
  }

  private playSegment(startMs: number, endMs: number, t: number, speed: number): Promise<Result> {
    const v = this.verseEl();
    if (!v) return Promise.resolve("fail");
    return new Promise<Result>((resolve) => {
      v.playbackRate = speed;
      let done = false;
      const end = (r: Result) => {
        if (done) return;
        done = true;
        clearTimeout(loadTimer);
        v.removeEventListener("pause", onPause);
        v.removeEventListener("loadedmetadata", begin);
        v.removeEventListener("error", onErr);
        resolve(r);
      };
      // stop() kay-annuler l-raf -> pause hiya li kat-sedd l-promise
      const onPause = () => { if (t !== this.token) end("cancel"); };
      const onErr = () => end("fail");
      v.addEventListener("pause", onPause);
      v.addEventListener("error", onErr);
      // L-audio dyal l-aya ma tchargach f 4s -> nfoutou had l-kelma
      const loadTimer = setTimeout(() => { if (v.readyState < 1) end("fail"); }, 4000);
      const begin = () => {
        if (done) return;
        clearTimeout(loadTimer);
        v.currentTime = startMs / 1000;
        v.play().then(() => {
          const tick = () => {
            if (t !== this.token) { end("cancel"); return; }
            if (v.currentTime * 1000 >= endMs || v.ended) { end("ok"); v.pause(); return; }
            this.raf = requestAnimationFrame(tick);
          };
          this.raf = requestAnimationFrame(tick);
        }).catch(() => end(t === this.token ? "fail" : "cancel"));
      };
      if (v.readyState >= 1) begin();
      else v.addEventListener("loadedmetadata", begin, { once: true });
    });
  }
}