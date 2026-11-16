// Aswat dyal l-film — m-sno3in b l-7sab (bla mousi9a, bla fichiers): ambiance, whoosh, impacts, perles, étincelles...
// Kol sawt howa dalla sghira kat-kteb f buffer stéréo; f l-akher réverbération khfifa + limiteur -> WAV 48 kHz.
import { writeFileSync } from "node:fs";

const SR = 48000;

export function renderAudio({ duration, events }, outWav) {
  const N = Math.ceil((duration + 0.5) * SR);
  const L = new Float32Array(N), R = new Float32Array(N), AL = new Float32Array(N), AR = new Float32Array(N);
  let seed = 20240501;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const noise = () => rnd() * 2 - 1;
  /** Filtre à état variable (Chamberlin): kay-t7emmel t-tebdil dyal f f kol échantillon */
  const svf = () => { let lp = 0, bp = 0; return (x, f, q) => { const g = 2 * Math.sin((Math.PI * Math.min(f, SR / 6.5)) / SR); const hp = x - lp - q * bp; bp += g * hp; lp += g * bp; return { lp, bp, hp }; }; };
  /** Kay-zid sawt: fn(tt, u) -> échantillon mono; pan mn -1 (iser) l +1 (imen) */
  const add = (t, dur, fn, { gain = 1, pan = 0, panTo = null, send = 0 } = {}) => {
    const i0 = Math.floor(t * SR), n = Math.floor(dur * SR);
    for (let i = 0; i < n; i++) {
      const j = i0 + i;
      if (j < 0 || j >= N) continue;
      const u = i / n, p = panTo == null ? pan : pan + (panTo - pan) * u;
      const gl = Math.cos(((p + 1) * Math.PI) / 4), gr = Math.sin(((p + 1) * Math.PI) / 4);
      const s = fn(i / SR, u) * gain;
      L[j] += s * gl; R[j] += s * gr;
      if (send) { AL[j] += s * gl * send; AR[j] += s * gr * send; }
    }
  };
  const TAU = Math.PI * 2;

  const V = {
    // Ambiance: nfes ghamed (bruit brun + sinus bass kay-tnefsou) + "hwa" rqi9 l-fo9
    drone(t, dur) {
      let brown = 0; const f1 = svf(), f2 = svf(), f3 = svf();
      add(t, dur, (tt) => {
        brown = (brown + noise() * 0.04) * 0.995;
        const env = Math.min(1, tt / 2.5) * Math.min(1, (dur - tt) / 2.2);
        const low = f1(brown * 6, 140, 0.9).lp * 0.5;
        const tones = 0.03 * Math.sin(TAU * 55 * tt) * (0.7 + 0.3 * Math.sin(TAU * 0.07 * tt)) + 0.02 * Math.sin(TAU * 82.4 * tt) * (0.7 + 0.3 * Math.sin(TAU * 0.05 * tt + 1))
          + 0.015 * Math.sin(TAU * 220 * tt) * (0.5 + 0.5 * Math.sin(TAU * 0.031 * tt)) + 0.01 * Math.sin(TAU * 329.6 * tt) * (0.5 + 0.5 * Math.sin(TAU * 0.043 * tt + 2));
        const air = f2(noise(), 5200, 0.6).hp * 0.007 * (0.6 + 0.4 * Math.sin(TAU * 0.11 * tt));
        return (low * 0.085 + tones + air) * env;
      }, { gain: 1 });
      // "Ri7" dyal l-fada: bruit f bande kay-t7errek b chwiya mn jiha l jiha (masmou3 7tta f tilifoun)
      add(t, dur, (tt) => {
        const env = Math.min(1, tt / 3) * Math.min(1, (dur - tt) / 2.2);
        return f3(noise(), 560 + 380 * Math.sin(TAU * 0.045 * tt) + 170 * Math.sin(TAU * 0.13 * tt + 1), 0.42).bp * 0.024 * (0.55 + 0.45 * Math.sin(TAU * 0.06 * tt + 2)) * env;
      }, { gain: 1, pan: -0.55, panTo: 0.55, send: 0.3 });
    },
    // Whoosh: bruit f bande kat-tla3 (wla kat-hbet) w kay-douz mn jiha l jiha
    whoosh(t, a = 1) {
      const fl = svf(), dir = rnd() < 0.5 ? 1 : -1;
      add(t - 0.12, 0.72, (tt, u) => fl(noise(), 380 * Math.pow(9, u), 0.32).bp * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 2), { gain: 0.72 * a, pan: -0.75 * dir, panTo: 0.75 * dir, send: 0.25 });
    },
    whooshUp(t) {
      const fl = svf();
      add(t, 0.5, (tt, u) => fl(noise(), 220 * Math.pow(26, u), 0.3).bp * Math.pow(u, 2.2) * (u < 0.96 ? 1 : (1 - u) / 0.04), { gain: 0.8, send: 0.2 });
    },
    // Boom: sub kay-hbet + nefkha dyal bruit + dnab f la réverbération
    boom(t) {
      let ph = 0; const fl = svf();
      add(t, 2.6, (tt) => { const f = 30 + 66 * Math.exp(-tt * 8); ph += (TAU * f) / SR; return Math.sin(ph) * Math.exp(-tt * 1.7) + fl(noise(), 190, 0.8).lp * Math.exp(-tt * 13) * 0.9 + noise() * Math.exp(-tt * 260) * 0.35; }, { gain: 0.8, send: 0.4 });
    },
    impact(t) {
      let ph = 0; const fl = svf();
      add(t, 1.1, (tt) => { const f = 42 + 54 * Math.exp(-tt * 13); ph += (TAU * f) / SR; return Math.sin(ph) * Math.exp(-tt * 4.2) + fl(noise(), 900, 0.5).bp * Math.exp(-tt * 38) * 0.35; }, { gain: 0.55, send: 0.25 });
    },
    // Hit: darba qsira l les cuts sra3 (sub + ma3den)
    hit(t, i = 0) {
      let ph = 0; const m = 1 + (i % 7) * 0.06;
      add(t, 0.5, (tt) => { const f = 56 + 74 * Math.exp(-tt * 30); ph += (TAU * f) / SR; return Math.sin(ph) * Math.exp(-tt * 9) * 0.85 + (Math.sin(TAU * 1900 * m * tt) + Math.sin(TAU * 2870 * m * tt) + Math.sin(TAU * 4100 * m * tt)) * Math.exp(-tt * 40) * 0.07 + noise() * Math.exp(-tt * 75) * 0.2; }, { gain: 0.62, pan: (i % 2 ? 0.2 : -0.2), send: 0.18 });
    },
    riser(t, dur = 2) {
      const fl = svf(); let ph = 0;
      add(t, dur, (tt, u) => { ph += (TAU * 90 * Math.pow(8, u)) / SR; return fl(noise(), 240 * Math.pow(30, u), 0.28).bp * Math.pow(u, 1.8) * 0.9 + Math.sin(ph) * 0.1 * u; }, { gain: 0.66, pan: -0.4, panTo: 0.4, send: 0.3 });
    },
    swell(t, dur = 1.2) {
      const fl = svf();
      add(t, dur, (tt, u) => (Math.sin(TAU * 62 * tt) + 0.5 * Math.sin(TAU * 124 * tt)) * Math.pow(u, 2.4) * 0.5 + fl(noise(), 400 + 900 * u, 0.6).lp * Math.pow(u, 2) * 0.25, { gain: 0.5, send: 0.2 });
    },
    tick(t, i = 0) {
      add(t, 0.05, (tt) => Math.sin(TAU * (2300 + (i % 9) * 60) * tt) * Math.exp(-tt * 170), { gain: 0.4, pan: ((i % 5) - 2) * 0.18, send: 0.1 });
    },
    pop(t, i = 0) {
      const f0 = 480 * (1 + (i % 9) * 0.075); let ph = 0;
      add(t, 0.1, (tt, u) => { ph += (TAU * f0 * (1 + 1.4 * u)) / SR; return Math.sin(ph) * Math.exp(-tt * 52) + noise() * Math.exp(-tt * 300) * 0.25; }, { gain: 0.56, pan: ((i % 5) - 2) * 0.2, send: 0.14 });
    },
    // Perle dyal tasbih: click dyal l-khcheb, kay-tla3 b chwiya m3a l-3add
    bead(t, i = 0) {
      const f = 860 * Math.pow(1.013, i), fl = svf();
      add(t, 0.08, (tt) => Math.sin(TAU * f * tt) * Math.exp(-tt * 90) * 0.55 + fl(noise(), 2600, 0.4).bp * Math.exp(-tt * 180) * 0.6 + Math.sin(TAU * 180 * tt) * Math.exp(-tt * 120) * 0.3, { gain: 0.8, pan: i % 2 ? 0.25 : -0.25, send: 0.16 });
    },
    // Étincelle: partiels ma3daniyin kay-tfaw b chwiya
    shimmer(t) {
      const ps = [2093, 2637, 3136, 3951, 4699, 6272].map((f, j) => ({ f: f * (1 + (rnd() - 0.5) * 0.01), d: 2.0 + j * 0.55, p: rnd() * TAU }));
      add(t, 1.9, (tt) => { let s = 0; for (const p of ps) s += Math.sin(TAU * p.f * tt + p.p) * Math.exp(-tt * p.d); return (s / 6) * (0.75 + 0.25 * Math.sin(TAU * 7 * tt)); }, { gain: 0.3, pan: -0.3, panTo: 0.3, send: 0.55 });
    },
    glitch(t, dur = 0.25) {
      let hold = 0, c = 0; const step = Math.floor(SR / 900);
      add(t, dur, (tt) => { if (c++ % step === 0) hold = noise(); return hold * (Math.sin(TAU * 31 * tt) > 0 ? 1 : 0.15); }, { gain: 0.24, pan: rnd() - 0.5 });
    },
    paper(t) {
      const fl = svf();
      add(t, 0.4, (tt, u) => fl(noise(), 1800 + 3600 * u, 0.5).bp * Math.pow(Math.sin(Math.PI * u), 1.5) * (0.6 + 0.4 * Math.sin(u * 46)), { gain: 0.48, pan: -0.5, panTo: 0.5, send: 0.1 });
    },
    // Compteur: tektaka sri3a (kat-bda mzerba w kat-thedden) m3a r-r9em li kay-tla3
    count(t, dur = 1.5) {
      const n = Math.max(8, Math.round(dur * 17));
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1), f = 1500 + 1300 * u;
        add(t + dur * Math.pow(u, 1.9), 0.035, (tt) => Math.sin(TAU * f * tt) * Math.exp(-tt * 210) + noise() * Math.exp(-tt * 900) * 0.3, { gain: 0.24, pan: i % 2 ? 0.3 : -0.3, send: 0.08 });
      }
    },
    // Jaras khfif (partiels machi mousi9iyin) — l-wa9t dyal s-sala
    chime(t) {
      const f = 932;
      add(t, 2.8, (tt) => (Math.sin(TAU * f * tt) * Math.exp(-tt * 2.1) + 0.45 * Math.sin(TAU * f * 2.76 * tt) * Math.exp(-tt * 4.5) + 0.25 * Math.sin(TAU * f * 5.4 * tt) * Math.exp(-tt * 9)) * Math.min(1, tt * 400), { gain: 0.17, pan: -0.15, send: 0.6 });
    },
    // Boussole: tnin kay-tmayel w kay-tbet b7al l-ibra dyal l-9ibla
    wobble(t, dur = 2.4) {
      let ph = 0;
      add(t, dur, (tt, u) => { const f = 340 * (1 + 0.55 * Math.exp(-3.2 * u) * Math.cos(10 * u)); ph += (TAU * f) / SR; return (Math.sin(ph) + 0.3 * Math.sin(2 * ph)) * Math.pow(1 - u, 1.4) * Math.min(1, tt * 60); }, { gain: 0.13, pan: 0.35, send: 0.4 });
    },
    // Vague: nqitat kay-tel3ou wa7da mora wa7da (l-khanat dyal l-activité)
    run(t, dur = 0.9) {
      const n = 18;
      for (let i = 0; i < n; i++) { const f = 880 * Math.pow(1.047, i); add(t + (dur * i) / n, 0.1, (tt) => Math.sin(TAU * f * tt) * Math.exp(-tt * 55), { gain: 0.11, pan: -0.6 + (1.2 * i) / (n - 1), send: 0.25 }); }
    },
    // "Sawt" dyal t-tasmi3: nbadat b7al klam (formants kay-t7errkou), machi kalam 7a9i9i
    voice(t, dur = 3) {
      const f1 = svf(), f2 = svf(); let ph = 0;
      add(t, dur, (tt, u) => {
        ph += (TAU * (118 + 14 * Math.sin(TAU * 0.7 * tt))) / SR;
        const src = (Math.sin(ph) > 0 ? 1 : -1) * 0.5 + Math.sin(ph) * 0.5;
        const syl = Math.pow(Math.abs(Math.sin(TAU * 2.3 * tt)), 0.6);
        const a = f1(src, 520 + 260 * Math.sin(TAU * 1.1 * tt), 0.25).bp + f2(src, 1500 + 500 * Math.sin(TAU * 0.8 * tt + 1), 0.25).bp * 0.6;
        return a * syl * Math.min(1, u * 8) * Math.min(1, (1 - u) * 6);
      }, { gain: 0.1, pan: 0.25, send: 0.3 });
    },
  };

  for (const e of events) { const fn = V[e.k]; if (fn) fn(e.t, e.a); }

  // ---- Réverbération (Schroeder: 4 peignes + 2 passe-tout) 3la l-bus auxiliaire ----
  const reverb = (x, offs) => {
    const combs = [1687, 1601, 2053, 2251].map((d) => ({ buf: new Float32Array(d + offs), i: 0, lp: 0 }));
    const aps = [347, 113].map((d) => ({ buf: new Float32Array(d + offs), i: 0 }));
    const out = new Float32Array(x.length);
    for (let n = 0; n < x.length; n++) {
      let s = 0;
      for (const c of combs) { const y = c.buf[c.i]; c.lp = y * 0.6 + c.lp * 0.4; c.buf[c.i] = x[n] + c.lp * 0.83; c.i = (c.i + 1) % c.buf.length; s += y; }
      s *= 0.25;
      for (const a of aps) { const y = a.buf[a.i]; const v = s + y * 0.5; a.buf[a.i] = v; a.i = (a.i + 1) % a.buf.length; s = y - v * 0.5; }
      out[n] = s;
    }
    return out;
  };
  const WL = reverb(AL, 0), WR = reverb(AR, 23);
  let peak = 0;
  for (let n = 0; n < N; n++) {
    L[n] = Math.tanh((L[n] + WL[n] * 0.5) * 1.6); R[n] = Math.tanh((R[n] + WR[n] * 0.5) * 1.6);
    peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
  }
  const norm = peak > 0 ? 0.8 / peak : 1;   // marge l l-encodage AAC (bla clipping)

  const wav = Buffer.alloc(44 + N * 4);
  wav.write("RIFF", 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write("WAVEfmt ", 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(N * 4, 40);
  for (let n = 0; n < N; n++) { wav.writeInt16LE(Math.round(L[n] * norm * 32767), 44 + n * 4); wav.writeInt16LE(Math.round(R[n] * norm * 32767), 46 + n * 4); }
  writeFileSync(outWav, wav);
  return { samples: N, peak: +(peak * norm).toFixed(3) };
}
