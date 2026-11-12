// Sawt l-adhan: 10 tasjilat (CDN dyal aladhan.com), fichier ma7alli, lien perso, wla jaras khfif (WebAudio).
// T-tasjilat m-ra9min ghir b l-ar9am: s-smiyat dyal l-mou2addinin ma m-2ekkdinch, donc ma ktebnahomch.

export interface AdhanVoice { id: string; url: string | null; kind: "tone" | "local" | "remote" | "custom" }

export const ADHAN_VOICES: AdhanVoice[] = [
  { id: "chime", url: null, kind: "tone" },
  ...Array.from({ length: 10 }, (_, i): AdhanVoice => ({ id: `a${i + 1}`, url: `https://cdn.aladhan.com/audio/adhans/a${i + 1}.mp3`, kind: "remote" })),
  { id: "local", url: "/audio/adhan.mp3", kind: "local" },
  { id: "custom", url: null, kind: "custom" },
];

let audio: HTMLAudioElement | null = null;
let fadeTimer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<(playing: string | null) => void>();
let playingId: string | null = null;
const setPlaying = (id: string | null) => { playingId = id; listeners.forEach((l) => l(id)); };

/** Bach l-UI t3ref chno kay-tle3 daba (bouton play / stop) */
export const subscribeAdhan = (l: (playing: string | null) => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const getPlayingAdhan = () => playingId;

/** Jaras khfif (3 naghamat) */
export const chime = (volume = 0.8) => {
  try {
    const ctx = new AudioContext();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const at = ctx.currentTime + i * 0.38;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.28 * volume), at + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
      o.connect(g).connect(ctx.destination);
      o.start(at); o.stop(at + 1.7);
    });
    setTimeout(() => ctx.close(), 3500);
  } catch { /* audio bloqué */ }
};

export const stopAdhan = () => {
  clearInterval(fadeTimer);
  if (audio) { audio.pause(); audio.src = ""; audio = null; }
  setPlaying(null);
};

export interface PlayOptions { volume?: number; customUrl?: string; fadeIn?: boolean; maxSeconds?: number }

/** Kay-tle3 s-sawt l-mokhtar. Ila l-fichier ma t-chargach (404, offline, autoplay mblo9i) kay-rje3 l l-jaras. */
export const playAdhan = (voiceId: string, opts: PlayOptions = {}) => {
  stopAdhan();
  const volume = Math.min(1, Math.max(0, opts.volume ?? 0.8));
  const voice = ADHAN_VOICES.find((v) => v.id === voiceId) ?? ADHAN_VOICES[0];
  const url = voice.kind === "custom" ? opts.customUrl?.trim() : voice.url;
  if (!url) { chime(volume); return; }

  const el = new Audio(url);
  audio = el;
  setPlaying(voiceId);
  el.volume = opts.fadeIn ? 0 : volume;
  el.onended = () => { if (audio === el) stopAdhan(); };
  el.onerror = () => { if (audio === el) { stopAdhan(); chime(volume); } };
  el.play().then(() => {
    if (opts.fadeIn) {
      // Tlou3 tadriji f 6 tawani
      let v = 0;
      fadeTimer = setInterval(() => {
        v = Math.min(volume, v + volume / 30);
        if (audio === el) el.volume = v;
        if (v >= volume) clearInterval(fadeTimer);
      }, 200);
    }
    if (opts.maxSeconds) setTimeout(() => { if (audio === el) stopAdhan(); }, opts.maxSeconds * 1000);
  }).catch(() => { if (audio === el) { stopAdhan(); chime(volume); } });
};

/** Dou3a ba3d l-adhan (البخاري 614) */
export const DUA_AFTER_ADHAN = "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ";
