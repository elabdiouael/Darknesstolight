"use client";

// Wrapper dyal Web Speech API (SpeechRecognition) b l-3arbiya + niveau dyal l-mic (bach l-orb y-t7errek m3a s-sawt)
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface RecResult { isFinal: boolean; 0: { transcript: string } }
interface RecEvent { resultIndex: number; results: ArrayLike<RecResult> }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecCtor = new () => Recognition;

const getCtor = (): RecCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const noopSubscribe = () => () => {};

/** Wach l-navigateur kay-supporti l-reconnaissance vocale (Chrome, Edge, Safari) */
export const useSpeechSupported = () => useSyncExternalStore(noopSubscribe, () => !!getCtor(), () => false);

export type SpeechError = "denied" | "network" | "nospeech" | "other";

interface Options {
  lang?: string;
  onText: (text: string) => void;   // transcript kaml (final + interim)
  onEnd: () => void;                // l-reconnaissance wqfat (silence, stop...)
}

export const useSpeech = ({ lang = "ar-SA", onText, onEnd }: Options) => {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechError | null>(null);
  const rec = useRef<Recognition | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const raf = useRef(0);
  const levelEl = useRef<HTMLElement | null>(null);
  const handlers = useRef({ onText, onEnd });

  useEffect(() => { handlers.current = { onText, onEnd }; });

  const stopMeter = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    levelEl.current?.style.setProperty("--lvl", "0");
  }, []);

  // Niveau dyal s-sawt -> CSS var --lvl (0..1) f l-element (bla re-render)
  const startMeter = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(s).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let smooth = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        smooth = smooth * 0.75 + Math.min(1, rms * 4) * 0.25;
        levelEl.current?.style.setProperty("--lvl", smooth.toFixed(3));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* l-meter machi daroori — l-reconnaissance t9der tkhdem bla bih */
    }
  }, []);

  const stop = useCallback(() => {
    rec.current?.stop();
    stopMeter();
  }, [stopMeter]);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) { setError("other"); return; }
    rec.current?.abort();
    setError(null);
    const r = new Ctor();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript + " ";
      handlers.current.onText(text.trim());
    };
    r.onerror = (e) => {
      setError(e.error === "not-allowed" || e.error === "service-not-allowed" ? "denied"
        : e.error === "network" ? "network" : e.error === "no-speech" ? "nospeech" : e.error === "aborted" ? null : "other");
    };
    r.onend = () => {
      setListening(false);
      stopMeter();
      if (rec.current === r) rec.current = null;
      handlers.current.onEnd();
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
      startMeter();
    } catch {
      setError("other");
    }
  }, [lang, startMeter, stopMeter]);

  // Cleanup mli l-composant kaytsedd
  useEffect(() => () => {
    const r = rec.current;
    rec.current = null;
    if (r) { r.onend = null; r.abort(); }
    stopMeter();
  }, [stopMeter]);

  // Ref callback: l-element li kayt-7rek m3a s-sawt (CSS var --lvl)
  const attachMeter = useCallback((el: HTMLElement | null) => { levelEl.current = el; }, []);

  return { listening, error, start, stop, attachMeter };
};