"use client";

// Misbaha (sub7a) numérique: 33 7abba f dayra, objectif (33 / 99 / 100 / 1000 / ∞), tours w total
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Infinity as InfinityIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { MISBAHA_PHRASES } from "@/lib/adhkar";
import { buzz, useAdhkarProgress, useMisbaha } from "@/lib/adhkarStore";
import { useCelebrate } from "@/components/common/Celebration/Celebration";
import styles from "./Misbaha.module.css";

const TARGETS = [33, 99, 100, 1000, 0]; // 0 = bla 7add
const BEADS = 33;
const SIZE = 280;
const R = 122;

export const Misbaha = () => {
  const { t } = useI18n();
  const [s, setS] = useMisbaha();
  const progress = useAdhkarProgress();
  const celebrate = useCelebrate();
  const [pulse, setPulse] = useState(0);
  const phrase = MISBAHA_PHRASES.find((p) => p.id === s.phrase) ?? MISBAHA_PHRASES[0];
  // 7abbat mcha3lin: dayra dyal 33 (kat3awed)
  const lit = s.count === 0 ? 0 : ((s.count - 1) % BEADS) + 1;

  const tap = (e: React.MouseEvent | React.KeyboardEvent) => {
    const next = s.count + 1;
    const round = s.target > 0 && next >= s.target;
    setS({ ...s, count: round ? 0 : next, rounds: s.rounds + (round ? 1 : 0), total: s.total + 1 });
    progress.addFree(1);
    setPulse(e.timeStamp);
    if (round) {
      buzz([30, 60, 30]);
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      celebrate({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    } else buzz(10);
  };

  const reset = () => setS({ ...s, count: 0, rounds: 0 });

  return (
    <section className={`glass-panel ${styles.wrap}`}>
      <header className={styles.head}>
        <div>
          <h2>{t("adhkar.misbaha")}</h2>
          <p>{t("adhkar.misbaha.desc")}</p>
        </div>
        <button className="icon-btn" onClick={reset} title={t("adhkar.reset")} aria-label={t("adhkar.reset")}><RotateCcw size={16} /></button>
      </header>

      <div className={styles.phrases} dir="rtl">
        {MISBAHA_PHRASES.map((p) => (
          <button key={p.id} className={`quran-text ${s.phrase === p.id ? styles.on : ""}`} onClick={() => setS({ ...s, phrase: p.id, count: 0 })}>
            {p.ar}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        <button className={styles.dial} onClick={tap} aria-label={t("adhkar.misbaha.tap")}
          onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); tap(e); } }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.beads} aria-hidden>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(236,208,138,0.12)" strokeWidth="1.5" />
            {Array.from({ length: BEADS }).map((_, i) => {
              const a = (i / BEADS) * Math.PI * 2 - Math.PI / 2;
              const on = i < lit;
              return (
                <circle key={i} cx={SIZE / 2 + Math.cos(a) * R} cy={SIZE / 2 + Math.sin(a) * R} r={on ? 7.5 : 6}
                  className={on ? styles.beadOn : styles.bead} />
              );
            })}
          </svg>
          <AnimatePresence>
            {pulse > 0 && <motion.span key={pulse} className={styles.ripple} initial={{ scale: 0.6, opacity: 0.7 }} animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} aria-hidden />}
          </AnimatePresence>
          <span className={styles.center}>
            <span className={`quran-text ${styles.phrase}`}>{phrase.ar}</span>
            <motion.strong key={s.count} initial={{ scale: 1.25, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
              {s.count}
            </motion.strong>
            <small>{s.target ? `/ ${s.target}` : "∞"}</small>
          </span>
        </button>

        <div className={styles.side}>
          <span className={styles.label}>{t("adhkar.misbaha.target")}</span>
          <div className={styles.targets}>
            {TARGETS.map((n) => (
              <button key={n} className={s.target === n ? styles.on : ""} onClick={() => setS({ ...s, target: n, count: 0 })}>
                {n === 0 ? <InfinityIcon size={14} /> : n}
              </button>
            ))}
          </div>
          <div className={styles.kpis}>
            <div><strong>{s.rounds}</strong><span>{t("adhkar.misbaha.rounds")}</span></div>
            <div><strong>{s.total.toLocaleString()}</strong><span>{t("adhkar.misbaha.total")}</span></div>
          </div>
          <p className={styles.hint}>{t("adhkar.misbaha.tap")}</p>
        </div>
      </div>
    </section>
  );
};