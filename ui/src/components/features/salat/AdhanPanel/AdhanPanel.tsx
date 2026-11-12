"use client";

// Options dyal l-adhan: s-sawt (m3a istima3), sawt khass l l-fajr, volume, s-salawat li 3lihom tanbih,
// tadkir 9bel l-we9t, l-i9ama — w l-écran li kay-ban mli kay-dkhol l-we9t.
import React, { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Square, Volume2, Check, BellRing, X, Minus, Plus } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { ADHAN_VOICES, DUA_AFTER_ADHAN, getPlayingAdhan, playAdhan, stopAdhan, subscribeAdhan } from "@/lib/adhan";
import { FARD, PrayerId } from "@/lib/prayerTimes";
import { DEFAULT_IQAMA, SalatSettings } from "@/lib/salatStore";
import styles from "./AdhanPanel.module.css";

const PRE = [0, 5, 10, 15, 30];
const EASE = [0.22, 1, 0.36, 1] as const;

export const useAdhanPlaying = () => useSyncExternalStore(subscribeAdhan, getPlayingAdhan, () => null);

export const AdhanPanel = ({ settings, onChange }: { settings: SalatSettings; onChange: (p: Partial<SalatSettings>) => void }) => {
  const { t } = useI18n();
  const playing = useAdhanPlaying();
  // Mli n-khrjou mn l-page s-sawt kay-w9ef
  useEffect(() => stopAdhan, []);

  const label = (id: string) => id === "chime" ? t("adhan.voice.chime") : id === "local" ? t("adhan.voice.local")
    : id === "custom" ? t("adhan.voice.custom") : t("adhan.voice.n", { n: id.slice(1) });
  const preview = (id: string) => {
    if (playing === id) { stopAdhan(); return; }
    playAdhan(id, { volume: settings.volume, customUrl: settings.customUrl, maxSeconds: 30 });
  };
  const enabled = (p: PrayerId) => settings.alertFor[p] !== false;

  return (
    <section className={`glass-panel ${styles.panel}`}>
      <header className={styles.head}>
        <div>
          <h2><BellRing size={20} /> {t("adhan.title")}</h2>
          <p>{t("adhan.subtitle")}</p>
        </div>
      </header>

      <span className={styles.label}>{t("adhan.voice")}</span>
      <div className={styles.voices}>
        {ADHAN_VOICES.map((v) => {
          const on = settings.voice === v.id;
          return (
            <div key={v.id} className={`fx-card ${styles.voice} ${on ? styles.voiceOn : ""}`}>
              <button className={styles.voicePick} onClick={() => onChange({ voice: v.id })} aria-pressed={on}>
                <span className={styles.radio}>{on && <Check size={12} />}</span>
                <strong>{label(v.id)}</strong>
              </button>
              <button className={`${styles.voicePlay} ${playing === v.id ? styles.playing : ""}`} onClick={() => preview(v.id)}
                aria-label={`${playing === v.id ? t("adhan.stop") : t("adhan.play")} · ${label(v.id)}`} title={playing === v.id ? t("adhan.stop") : t("adhan.play")}>
                {playing === v.id ? <Square size={13} /> : <Play size={13} />}
                {playing === v.id && <span className={styles.eq} aria-hidden><i /><i /><i /></span>}
              </button>
            </div>
          );
        })}
      </div>
      {settings.voice === "local" && <small className={styles.hint}>{t("adhan.voice.localHint")}</small>}
      {settings.voice === "custom" && (
        <input className={styles.url} type="url" inputMode="url" placeholder="https://…/adhan.mp3" value={settings.customUrl}
          aria-label={t("adhan.voice.customHint")} onChange={(e) => onChange({ customUrl: e.target.value })} />
      )}

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="adhan-fajr">{t("adhan.fajr")}</label>
          <select id="adhan-fajr" value={settings.fajrVoice} onChange={(e) => onChange({ fajrVoice: e.target.value })}>
            <option value="same">{t("adhan.fajr.same")}</option>
            {ADHAN_VOICES.filter((v) => v.kind !== "custom").map((v) => <option key={v.id} value={v.id}>{label(v.id)}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="adhan-volume">{t("adhan.volume")} <b>{Math.round(settings.volume * 100)}%</b></label>
          <div className={styles.volume}>
            <Volume2 size={16} />
            <input id="adhan-volume" type="range" min={0} max={1} step={0.05} value={settings.volume}
              style={{ ["--p" as string]: `${settings.volume * 100}%` }} onChange={(e) => onChange({ volume: Number(e.target.value) })} />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>{t("adhan.for")}</span>
          <div className={styles.chips}>
            {FARD.map((p) => (
              <button key={p} className={enabled(p) ? styles.chipOn : ""} aria-pressed={enabled(p)}
                onClick={() => onChange({ alertFor: { ...settings.alertFor, [p]: !enabled(p) } })}>{t(`salat.p.${p}` as DictKey)}</button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>{t("adhan.pre")}</span>
          <div className={styles.chips}>
            {PRE.map((n) => (
              <button key={n} className={settings.preMin === n ? styles.chipOn : ""} aria-pressed={settings.preMin === n} onClick={() => onChange({ preMin: n })}>
                {n === 0 ? t("adhan.pre.off") : t("adhan.pre.min", { n })}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>{t("adhan.iqama")} · {t("adhan.iqama.after")}</span>
          <div className={styles.iqama}>
            {FARD.map((p) => {
              const v = settings.iqama[p] ?? DEFAULT_IQAMA[p];
              const set = (n: number) => onChange({ iqama: { ...settings.iqama, [p]: Math.max(0, Math.min(60, n)) } });
              return (
                <div key={p}>
                  <small>{t(`salat.p.${p}` as DictKey)}</small>
                  <span>
                    <button onClick={() => set(v - 1)} aria-label={`${t(`salat.p.${p}` as DictKey)} −1`}><Minus size={12} /></button>
                    <b>{v}</b>
                    <button onClick={() => set(v + 1)} aria-label={`${t(`salat.p.${p}` as DictKey)} +1`}><Plus size={12} /></button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>&nbsp;</span>
          <div className={styles.toggles}>
            {([["showIqama", "adhan.iqama.show"], ["fadeIn", "adhan.fadeIn"], ["vibrate", "adhan.vibrate"]] as const).map(([k, l]) => (
              <button key={k} className={styles.toggle} onClick={() => onChange({ [k]: !settings[k] })} aria-pressed={settings[k]}>
                <span>{t(l)}</span><i className={settings[k] ? styles.swOn : ""}><b /></i>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className={styles.note}>{t("adhan.sourceNote")}</p>
    </section>
  );
};

/** L-écran li kay-ban mli kay-dkhol we9t s-salat: smiya, i9ama, dou3a ba3d l-adhan, w bouton d l-i9af */
export const AdhanRinging = ({ prayer, time, iqama, onClose }: { prayer: string | null; time: string; iqama: string | null; onClose: () => void }) => {
  const { t } = useI18n();
  const playing = useAdhanPlaying();
  useEffect(() => {
    if (!prayer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prayer, onClose]);

  return (
    <AnimatePresence>
      {prayer && (
        <motion.div className={styles.ringScrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className={styles.ring} role="dialog" aria-modal="true" aria-label={t("salat.alert.title", { p: prayer })} onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }} transition={{ duration: 0.5, ease: EASE }}>
            <span className={styles.ringWaves} aria-hidden><i /><i /><i /></span>
            <button className={`icon-btn ${styles.ringX}`} onClick={onClose} aria-label={t("adhan.ring.close")}><X size={17} /></button>
            <span className={`quran-text ${styles.ringAr}`}>حَيَّ عَلَى الصَّلَاةِ</span>
            <h2>{t("salat.alert.title", { p: prayer })}</h2>
            <strong className={styles.ringTime}>{time}</strong>
            {iqama && <span className={styles.ringIqama}>{t("adhan.ring.iqama", { time: iqama })}</span>}
            <div className={styles.ringDua}>
              <small>{t("adhan.ring.dua")}</small>
              <p className="quran-text">{DUA_AFTER_ADHAN}</p>
              <cite>البخاري 614</cite>
            </div>
            <div className={styles.ringBtns}>
              {playing && <button className="btn-ghost" onClick={stopAdhan}><Square size={15} /> {t("adhan.stop")}</button>}
              <button className="btn-gold" onClick={onClose}>{t("adhan.ring.close")}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
