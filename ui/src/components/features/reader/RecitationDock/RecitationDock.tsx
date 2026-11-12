"use client";

import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward, X, Repeat, Repeat1, Gauge } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { getSurah } from "@/lib/quran";
import { ayahAudioUrl } from "@/services/quran/quranText";
import { ReciterPicker } from "../ReciterPicker/ReciterPicker";
import styles from "./RecitationDock.module.css";

export interface RecitationHandle { playFrom: (ayah: number) => void }

interface Props {
  ref?: React.Ref<RecitationHandle>;
  surah: number;
  reciter: string;
  onReciterChange: (id: string) => void;
  onAyah: (ayah: number | null) => void; // l-aya li kat-t9ra daba (highlight)
}

/**
 * Tilawa mtwasla dyal s-sourate: aya b aya, b preload dyal li jaya,
 * ikhtiyar l-9ari2, w "lecture continue" (kaydouz l-aya li moraha b rasso).
 * L-parent kay-bda t-tilawa b ref.playFrom(ayah) (mn event handler, bla effects).
 */
export const RecitationDock = ({ ref, surah, reciter, onReciterChange, onAyah }: Props) => {
  const { t, surahName } = useI18n();
  const meta = getSurah(surah);
  const audio = useRef<HTMLAudioElement | null>(null);
  const preload = useRef<HTMLAudioElement | null>(null);
  const [ayah, setAyah] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [auto, setAuto] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState(1);   // ch7al mn merra kat-t3awed kol aya (hifd)
  const state = useRef({ ayah: null as number | null, auto: true, reciter, speed: 1, repeat: 1, left: 1 });
  const playRef = useRef<(n: number) => void>(() => {});

  const setCurrent = useCallback((n: number | null) => {
    state.current.ayah = n;
    setAyah(n);
    onAyah(n);
  }, [onAyah]);

  const play = useCallback((n: number) => {
    if (n < 1 || n > meta.verses) { setPlaying(false); return; }
    if (!audio.current) {
      const a = new Audio();
      // Mli kat-sali aya -> li moraha (ila "lecture continue")
      a.addEventListener("ended", () => {
        const st = state.current;
        const cur = st.ayah;
        // Tikrar: n3awdo nfs l-aya 9bel ma ndouzo
        if (cur && st.left > 1) {
          st.left -= 1;
          a.currentTime = 0;
          a.play().catch(() => setPlaying(false));
          return;
        }
        if (st.auto && cur && cur < meta.verses) playRef.current(cur + 1);
        else setPlaying(false);
      });
      audio.current = a;
    }
    if (!preload.current) preload.current = new Audio();
    const r = state.current.reciter;
    audio.current.src = ayahAudioUrl(surah, n, r);
    audio.current.playbackRate = state.current.speed;
    state.current.left = state.current.repeat;
    audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    setCurrent(n);
    // Preload dyal l-aya jaya bach ma ykounch silence twil
    if (n < meta.verses) { preload.current.src = ayahAudioUrl(surah, n + 1, r); preload.current.load(); }
  }, [surah, meta.verses, setCurrent]);

  useEffect(() => { playRef.current = play; }, [play]);
  useImperativeHandle(ref, () => ({ playFrom: play }), [play]);

  // Unmount (bdel s-sourate / khrej) -> wqef l-audio
  useEffect(() => () => { audio.current?.pause(); audio.current = null; preload.current = null; }, []);

  const toggle = () => {
    const a = audio.current;
    if (!a || !ayah) return;
    if (playing) { a.pause(); setPlaying(false); }
    else a.play().then(() => setPlaying(true)).catch(() => {});
  };

  const stop = () => {
    audio.current?.pause();
    setPlaying(false);
    setCurrent(null);
  };

  const toggleAuto = () => {
    state.current.auto = !auto;
    setAuto(!auto);
  };

  const changeReciter = (id: string) => {
    state.current.reciter = id;
    onReciterChange(id);
    // N3awdo nfs l-aya b l-9ari2 jdid
    if (ayah) play(ayah);
  };

  const SPEEDS = [1, 1.25, 1.5, 0.75];
  const REPEATS = [1, 2, 3, 5, 10];
  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    state.current.speed = next;
    if (audio.current) audio.current.playbackRate = next;
    setSpeed(next);
  };
  const cycleRepeat = () => {
    const next = REPEATS[(REPEATS.indexOf(repeat) + 1) % REPEATS.length];
    state.current.repeat = next;
    state.current.left = next;
    setRepeat(next);
  };

  const progress = ayah ? (ayah / meta.verses) * 100 : 0;

  return (
    <AnimatePresence>
      {ayah !== null && (
        <motion.div
          className={styles.dock}
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <div className={styles.bar}><motion.i animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} /></div>

          <div className={`${styles.disc} ${playing ? styles.spinning : ""}`} aria-hidden />

          <div className={styles.info}>
            <strong>{surahName(meta)}</strong>
            <small>{t("common.ayah")} {ayah} / {meta.verses}</small>
          </div>

          <div className={styles.controls} dir="ltr">
            <button className={styles.ctl} onClick={() => ayah > 1 && play(ayah - 1)} aria-label="prev"><SkipBack size={16} /></button>
            <button className={`${styles.ctl} ${styles.main}`} onClick={toggle} aria-label={playing ? t("audio.pause") : t("audio.play")}>
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button className={styles.ctl} onClick={() => ayah < meta.verses && play(ayah + 1)} aria-label="next"><SkipForward size={16} /></button>
          </div>

          <button className={`${styles.ctl} ${auto ? styles.on : ""}`} onClick={toggleAuto} title={t("audio.auto")} aria-pressed={auto}>
            <Repeat size={15} />
          </button>
          <button className={`${styles.pill} ${repeat > 1 ? styles.pillOn : ""}`} onClick={cycleRepeat} title={t("audio.repeat")}>
            <Repeat1 size={14} /> {repeat}×
          </button>
          <button className={`${styles.pill} ${styles.hideXs} ${speed !== 1 ? styles.pillOn : ""}`} onClick={cycleSpeed} title={t("audio.speed")}>
            <Gauge size={14} /> {speed}×
          </button>

          <ReciterPicker value={reciter} onChange={changeReciter} compact />

          <button className={styles.ctl} onClick={stop} aria-label={t("audio.stop")}><X size={16} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};