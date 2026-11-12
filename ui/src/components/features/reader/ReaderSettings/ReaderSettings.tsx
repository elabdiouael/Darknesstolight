"use client";

// Réglages dyal l-mushaf: 9 thèmes (émeraude, madina, parchemin, sépia, andalous, rose, lapis, kiswa, nuit), taille, interligne, tajweed (+ légende),
// double page, survol des mots, repères (hizb / sajda)
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, Check, RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { HideMode, MushafFont, MushafTheme, PageFlip, ReaderPrefs } from "@/lib/readerPrefs";
import styles from "./ReaderSettings.module.css";

const THEMES: { id: MushafTheme; paper: string; ink: string; frame: string }[] = [
  { id: "emerald", paper: "linear-gradient(160deg,#0c3a29,#04110b)", ink: "#f5eedb", frame: "#d4af37" },
  { id: "madina", paper: "linear-gradient(160deg,#fefaee,#f1e5c6)", ink: "#1a1408", frame: "#1f7a55" },
  { id: "parchment", paper: "linear-gradient(160deg,#fbf3df,#ead9b2)", ink: "#23180a", frame: "#a8801f" },
  { id: "sepia", paper: "linear-gradient(160deg,#efe1c4,#d9c29a)", ink: "#3a2814", frame: "#8a6424" },
  { id: "andalus", paper: "linear-gradient(160deg,#fbf4e7,#ecdcc0)", ink: "#9a3f1c", frame: "#1c6f6a" },
  { id: "rose", paper: "linear-gradient(160deg,#fdf2ef,#efdad4)", ink: "#8c3b4a", frame: "#b07a5a" },
  { id: "lapis", paper: "linear-gradient(160deg,#0f2655,#050d24)", ink: "#f3d98a", frame: "#d9b45a" },
  { id: "kiswa", paper: "linear-gradient(160deg,#141412,#000)", ink: "#ffd875", frame: "#e0b84a" },
  { id: "night", paper: "linear-gradient(160deg,#0d0d10,#000)", ink: "#e9e3d2", frame: "#8f7d4b" },
];

/** Qawa3id t-tajweed (alquran.cloud) — l-alwan f globals.css (.tj-x) */
export const TAJWEED_RULES = ["h", "l", "s", "n", "p", "m", "o", "q", "a", "u", "i", "f", "c", "w", "g"] as const;

const FONTS: MushafFont[] = ["uthmani", "naskh"];
const FLIPS: PageFlip[] = ["book", "slide", "fade", "none"];
const HIDES: HideMode[] = ["off", "first", "all"];
const ALIGNS: ReaderPrefs["align"][] = ["justify", "center"];

export const ReaderSettings = ({ prefs, onChange, onReset, canSpread }: {
  prefs: ReaderPrefs; onChange: (p: Partial<ReaderPrefs>) => void; onReset: () => void; canSpread: boolean;
}) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // L-panel kay-b9a dakhel l-écran fin ma kan l-bouton (limn / lisr / mobile)
  const [shift, setShift] = useState(0);
  const toggle = () => {
    if (!open && box.current) {
      const r = box.current.getBoundingClientRect();
      const w = Math.min(380, window.innerWidth - 24);
      const left = Math.max(12, Math.min(r.right - w, window.innerWidth - w - 12));
      setShift(left - r.left);
    }
    setOpen((v) => !v);
  };
  const box = useRef<HTMLDivElement>(null);

  // Click barra -> ysedd
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  type Toggle = { key: keyof ReaderPrefs; label: DictKey; hidden?: boolean };
  const pageToggles: Toggle[] = [
    { key: "spread", label: "settings.spread", hidden: !canSpread },
    { key: "narrow", label: "settings.narrow" },
    { key: "ornaments", label: "settings.ornaments" },
    { key: "ayahNumbers", label: "settings.ayahNumbers" },
    { key: "markers", label: "settings.markers" },
    { key: "ayahLines", label: "settings.ayahLines" },
  ];
  const aidToggles: Toggle[] = [
    { key: "tajweed", label: "settings.tajweed" },
    { key: "wordHover", label: "settings.wordHover" },
    { key: "spotlight", label: "settings.spotlight" },
    { key: "dimRead", label: "settings.dimRead" },
  ];
  const comfortToggles: Toggle[] = [
    { key: "autoNight", label: "settings.autoNight" },
    { key: "wakeLock", label: "settings.wakeLock" },
    { key: "tapZones", label: "settings.tapZones" },
    { key: "flipSound", label: "settings.flipSound" },
    { key: "inlineTr", label: "settings.inlineTr" },
  ];
  const renderToggles = (list: Toggle[]) => (
    <div className={styles.toggles}>
      {list.filter((x) => !x.hidden).map((x) => (
        <button key={x.key} className={styles.toggle} onClick={() => onChange({ [x.key]: !prefs[x.key] } as Partial<ReaderPrefs>)} aria-pressed={!!prefs[x.key]}>
          <span>{t(x.label)}</span>
          <i className={prefs[x.key] ? styles.swOn : ""}><b /></i>
        </button>
      ))}
    </div>
  );
  /** Choix b chips (segment) */
  const chips = <T extends string>(label: DictKey, prefix: string, options: T[], value: T, set: (v: T) => void) => (
    <div className={styles.choice}>
      <span>{t(label)}</span>
      <div className={styles.chips}>
        {options.map((o) => (
          <button key={o} className={value === o ? styles.chipOn : ""} onClick={() => set(o)} aria-pressed={value === o}>
            {t(`${prefix}.${o}` as DictKey)}
          </button>
        ))}
      </div>
    </div>
  );
  const slider = (label: DictKey, value: number, min: number, max: number, step: number, show: string, set: (v: number) => void) => (
    <label className={styles.slider}>
      <span>{t(label)} <b>{show}</b></span>
      <input type="range" min={min} max={max} step={step} value={value}
        style={{ ["--p" as string]: `${((value - min) / (max - min)) * 100}%` }}
        onChange={(e) => set(Number(e.target.value))} />
    </label>
  );

  return (
    <div className={styles.wrap} ref={box}>
      <button className={`btn-ghost ${open ? styles.on : ""}`} onClick={toggle} aria-expanded={open}>
        <SlidersHorizontal size={16} /> <span className={styles.hideSm}>{t("settings.title")}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className={styles.panel} role="dialog" aria-label={t("settings.title")} style={{ left: shift, right: "auto" }}
            initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            <span className={styles.label}>{t("settings.theme")}</span>
            <div className={styles.themes}>
              {THEMES.map((th) => (
                <button key={th.id} className={`${styles.theme} ${prefs.theme === th.id ? styles.themeOn : ""}`}
                  onClick={() => onChange({ theme: th.id })} style={{ background: th.paper, color: th.ink, borderColor: th.frame }}>
                  <span className="quran-text">بِسْمِ</span>
                  <small>{t(`settings.theme.${th.id}` as DictKey)}</small>
                  {prefs.theme === th.id && <i style={{ background: th.frame }}><Check size={11} /></i>}
                </button>
              ))}
            </div>

            <span className={styles.label}>{t("settings.section.text")}</span>
            {chips("settings.font", "settings.font", FONTS, prefs.font, (font) => onChange({ font }))}
            {chips("settings.align", "settings.align", ALIGNS, prefs.align, (align) => onChange({ align }))}
            {slider("settings.size", prefs.fontSize, 1.4, 3.6, 0.1, `${Math.round(prefs.fontSize * 16)}px`, (fontSize) => onChange({ fontSize }))}
            {slider("settings.lineHeight", prefs.lineHeight, 1.8, 3.2, 0.05, prefs.lineHeight.toFixed(2), (lineHeight) => onChange({ lineHeight }))}
            {slider("settings.brightness", prefs.brightness, 0.45, 1, 0.05, `${Math.round(prefs.brightness * 100)}%`, (brightness) => onChange({ brightness }))}

            <span className={styles.label}>{t("settings.section.page")}</span>
            {chips("settings.flip", "settings.flip", FLIPS, prefs.flip, (flip) => onChange({ flip }))}
            {renderToggles(pageToggles)}

            <span className={styles.label}>{t("settings.section.aids")}</span>
            {chips("settings.hide", "settings.hide", HIDES, prefs.hide, (hide) => onChange({ hide }))}
            {renderToggles(aidToggles)}
            {slider("settings.autoSpeed", prefs.autoSpeed, 8, 90, 2, `${prefs.autoSpeed}`, (autoSpeed) => onChange({ autoSpeed }))}

            <span className={styles.label}>{t("settings.section.comfort")}</span>
            {slider("settings.wordSpacing", prefs.wordSpacing, 0, 0.6, 0.05, `${prefs.wordSpacing.toFixed(2)} em`, (wordSpacing) => onChange({ wordSpacing }))}
            {slider("settings.pagePad", prefs.pagePad, 0, 80, 4, `${prefs.pagePad}px`, (pagePad) => onChange({ pagePad }))}
            {renderToggles(comfortToggles)}

            <AnimatePresence>
              {prefs.tajweed && (
                <motion.div className={styles.legend} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  {TAJWEED_RULES.map((r) => (
                    <span key={r}><i className={`tj-dot tj-${r}`} /> {t(`tajweed.${r}` as DictKey)}</span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <p className={styles.keys}>{t("settings.shortcuts")}</p>
            <button className={`btn-ghost ${styles.reset}`} onClick={onReset}><RotateCcw size={14} /> {t("settings.reset")}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};