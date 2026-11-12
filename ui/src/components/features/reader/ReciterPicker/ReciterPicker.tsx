"use client";

// Ikhtiyar l-9ari2: ga3 l-9orra2 disponibles (backend), recherche, aperçu b sawt, groupes (tilawa / traduction audio)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Check, ChevronDown, Mic2, Pause, Play, Search } from "lucide-react";
import { Modal } from "@/components/common/Modal/Modal";
import { useI18n } from "@/i18n/I18nProvider";
import { useReciters } from "@/lib/useReciters";
import { ayahAudioUrl, normalizeReciter, Reciter } from "@/services/quran/quranText";
import styles from "./ReciterPicker.module.css";

interface Props {
  value: string;
  onChange: (id: string) => void;
  compact?: boolean;   // bouton sghir (dock)
}

const initials = (r: Reciter) => r.englishName.replace(/^(Sheikh|Abdul|Abu)\s+/i, "").slice(0, 2).toUpperCase();
/** Couleur stable l kol 9ari2 (hue mn l-id) */
const hueOf = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export const reciterLabel = (r: Reciter | undefined, lang: string) =>
  !r ? "—" : lang === "ar" ? r.name : r.englishName;

export const ReciterPicker = ({ value, onChange, compact = false }: Props) => {
  const { t, lang } = useI18n();
  const reciters = useReciters();
  const [open, setOpen] = useState(false);
  const id = normalizeReciter(value);
  const current = reciters.find((r) => r.id === id);

  return (
    <>
      <button type="button" className={`${styles.trigger} ${compact ? styles.compact : ""}`} onClick={() => setOpen(true)}
        title={t("audio.reciter")} aria-label={t("audio.reciter")}>
        <span className={styles.avatar} style={{ ["--h" as string]: hueOf(id) }}>{current ? initials(current) : <Mic2 size={14} />}</span>
        {!compact && <span className={styles.tName}>{reciterLabel(current, lang)}</span>}
        <ChevronDown size={14} />
      </button>
      {/* Portal: l-parent (dock / panneau) 3endo transform -> "position: fixed" ma kaykhdemch mzyan dakhel */}
      {typeof document !== "undefined" && createPortal(
        <Modal open={open} onClose={() => setOpen(false)} title={t("audio.reciter")} width={620}>
          {open && <PickerBody reciters={reciters} value={id} onPick={(r) => { onChange(r); setOpen(false); }} />}
        </Modal>,
        document.body,
      )}
    </>
  );
};

const PickerBody = ({ reciters, value, onPick }: { reciters: Reciter[]; value: string; onPick: (id: string) => void }) => {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"ar" | "other">("ar");
  const [preview, setPreview] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audio.current?.pause(), []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return reciters
      .filter((r) => (tab === "ar" ? r.language === "ar" : r.language !== "ar"))
      .filter((r) => !s || r.englishName.toLowerCase().includes(s) || r.name.includes(q.trim()) || r.id.includes(s));
  }, [reciters, q, tab]);

  const others = reciters.filter((r) => r.language !== "ar").length;

  const togglePreview = (id: string) => {
    if (!audio.current) {
      audio.current = new Audio();
      audio.current.onended = () => setPreview(null);
    }
    if (preview === id) { audio.current.pause(); setPreview(null); return; }
    // Aperçu: Al-Fatiha, aya 2
    audio.current.src = ayahAudioUrl(1, 2, id);
    audio.current.play().then(() => setPreview(id)).catch(() => setPreview(null));
  };

  return (
    <div className={styles.body}>
      <label className={styles.search}>
        <Search size={16} />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("reciter.search")} />
        <span className={styles.count}>{reciters.length}</span>
      </label>
      {others > 0 && (
        <div className={styles.tabs}>
          {(["ar", "other"] as const).map((k) => (
            <button key={k} className={tab === k ? styles.tabOn : ""} onClick={() => setTab(k)}>
              {tab === k && <motion.span layoutId="recTab" className={styles.tabPill} />}
              <span>{t(k === "ar" ? "reciter.recitations" : "reciter.translations")}</span>
            </button>
          ))}
        </div>
      )}
      <ul className={styles.list}>
        {list.map((r, i) => {
          const on = r.id === value;
          return (
            <motion.li key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.02 }}>
              <div className={`${styles.item} ${on ? styles.itemOn : ""}`}>
                <button className={styles.pick} onClick={() => onPick(r.id)}>
                  <span className={styles.avatar} style={{ ["--h" as string]: hueOf(r.id) }}>{initials(r)}</span>
                  <span className={styles.names}>
                    <strong>{lang === "ar" ? r.name : r.englishName}</strong>
                    <small>{lang === "ar" ? r.englishName : r.name} · {r.language.toUpperCase()}</small>
                  </span>
                  {on && <Check size={16} className={styles.check} />}
                </button>
                <button className={`icon-btn ${preview === r.id ? styles.playing : ""}`} onClick={() => togglePreview(r.id)}
                  aria-label={t("reciter.preview")} title={t("reciter.preview")}>
                  {preview === r.id ? <Pause size={15} /> : <Play size={15} />}
                </button>
              </div>
            </motion.li>
          );
        })}
        {list.length === 0 && <li className={styles.empty}>—</li>}
      </ul>
    </div>
  );
};