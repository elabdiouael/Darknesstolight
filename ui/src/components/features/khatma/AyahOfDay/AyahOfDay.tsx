"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, PenLine, Loader2, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { SURAHS, TOTAL_AYAHS } from "@/lib/quran";
import { ayahAudioUrl, DEFAULT_RECITER, fetchChapter, Verse } from "@/services/quran/quranText";
import { khawatirService } from "@/services/api/khatmaService";
import { useToast } from "@/components/common/Toast/Toast";
import styles from "./AyahOfDay.module.css";

/** Aya wa7da kol nhar (nfsha l-ga3 n-nass f nfs n-nhar) — deterministic mn t-tarikh */
const ayahForToday = () => {
  const day = Math.floor(Date.now() / 86_400_000);
  let g = ((day * 2654435761) % TOTAL_AYAHS + TOTAL_AYAHS) % TOTAL_AYAHS + 1;
  for (const s of SURAHS) {
    if (g <= s.verses) return { surah: s, ayah: g };
    g -= s.verses;
  }
  return { surah: SURAHS[0], ayah: 1 };
};

export const AyahOfDay = () => {
  const { t, lang, surahName } = useI18n();
  const toast = useToast();
  const { surah, ayah } = useMemo(() => ayahForToday(), []);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [playing, setPlaying] = useState(false);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    fetchChapter(surah.id, lang)
      .then((c) => alive && setVerse(c.verses.find((v) => v.id === ayah) ?? null))
      .catch(() => {});
    return () => { alive = false; };
  }, [surah.id, ayah, lang]);

  useEffect(() => () => audio.current?.pause(), []);

  const toggle = () => {
    if (!audio.current) {
      audio.current = new Audio(ayahAudioUrl(surah.id, ayah, DEFAULT_RECITER));
      audio.current.onended = () => setPlaying(false);
    }
    if (playing) { audio.current.pause(); setPlaying(false); }
    else audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await khawatirService.add(surah.id, ayah, draft.trim());
      toast(t("toast.khatira"));
      setDraft("");
      setWriting(false);
    } catch {
      toast(t("common.error"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section
      className={`glass-panel nour-border ${styles.card}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className={styles.ornament} aria-hidden>۞</span>
      <header className={styles.head}>
        <span className={styles.kicker}><Sparkles size={14} /> {t("home.ayahOfDay")}</span>
        <span className={styles.ref}>{surahName(surah)} · {ayah}</span>
      </header>

      {verse ? (
        <>
          <p className={`quran-text ${styles.ar}`}>{verse.text}</p>
          {verse.translation && <p className={styles.trans}>{verse.translation}</p>}
        </>
      ) : (
        <div className={styles.skel}><span /><span /></div>
      )}

      <div className={styles.actions}>
        <button className="btn-ghost" onClick={toggle} disabled={!verse}>
          {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? t("audio.pause") : t("audio.play")}
        </button>
        <button className="btn-ghost" onClick={() => setWriting((v) => !v)}>
          <PenLine size={16} /> {t("sheet.khatira")}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {writing && (
          <motion.div className={styles.write} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <textarea className={styles.textarea} value={draft} maxLength={2000} autoFocus
              placeholder={t("sheet.khatira.ph")} onChange={(e) => setDraft(e.target.value)} />
            <button className="btn-gold" onClick={save} disabled={!draft.trim() || saving}>
              {saving ? <Loader2 size={16} className={styles.spin} /> : <PenLine size={16} />} {t("sheet.khatira.save")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};