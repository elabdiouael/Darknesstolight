"use client";

// Page dyal l-7ifd: plan dyal l-youm (Sabaq + mouraja3a), tasmi3 b s-sawt, programme configurable
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Brain, CalendarCheck, Gauge, Mic, Pause, Play, Settings2, Sparkles, Target, Layers } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { HifdPlan, HifdSurah, HifdToday, ReviewGroup, hifdService } from "@/services/api/khatmaService";
import { ayahAudioUrl, DEFAULT_RECITER } from "@/services/quran/quranText";
import { getSurah } from "@/lib/quran";
import { KhatmaOrb3D } from "@/components/three/KhatmaOrb3D/KhatmaOrb3D";
import { CountUp, Magnetic } from "@/components/common/Motion/Motion";
import { ProgressRing } from "@/components/common/ProgressRing/ProgressRing";
import { TasmiaItem } from "../TasmiaSession/TasmiaSession";
import { TasmiaModal, loadPlanCached } from "../TasmiaModal/TasmiaModal";
import { HifdPlanModal } from "../HifdPlanModal/HifdPlanModal";
import styles from "./HifdView.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.8, ease: EASE } }),
};

const GROUP_TONE: Record<ReviewGroup, string> = { WEAK: "#ff9d8f", DUE: "#ecd08a", SABQI: "#5fd3a0", MANZIL: "#9fc3ff" };
const range = (surah: number, from: number, to: number): TasmiaItem[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => ({ surah, ayah: from + i }));

const scoreTone = (s: number | null) => (s == null ? "var(--text-dim)" : s >= 90 ? "#5fd3a0" : s >= 70 ? "#ecd08a" : "#ff9d8f");

export const HifdView = () => {
  const { t, surahName } = useI18n();
  const [today, setToday] = useState<HifdToday | null>(null);
  const [surahs, setSurahs] = useState<HifdSurah[]>([]);
  const [session, setSession] = useState<{ items: TasmiaItem[]; title: string } | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  const reload = useCallback(() => {
    Promise.all([hifdService.today(), hifdService.summary()])
      .then(([td, s]) => { setToday(td); setSurahs(s); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([hifdService.today(), hifdService.summary()])
      .then(([td, s]) => { if (alive) { setToday(td); setSurahs(s); } })
      .catch(() => { /* ignore */ });
    return () => { alive = false; audio.current?.pause(); };
  }, []);

  // Sabaq: n-sem3o l-ayat wa7da mor wa7da
  const playSabaq = () => {
    const sb = today?.sabaq;
    if (!sb) return;
    if (playing) { audio.current?.pause(); setPlaying(false); return; }
    let ayah = sb.fromAyah;
    if (!audio.current) audio.current = new Audio();
    audio.current.onended = () => {
      ayah += 1;
      const el = audio.current;
      if (!el || ayah > sb.toAyah) { setPlaying(false); return; }
      el.src = ayahAudioUrl(sb.surah, ayah, DEFAULT_RECITER);
      el.play().catch(() => setPlaying(false));
    };
    audio.current.src = ayahAudioUrl(sb.surah, ayah, DEFAULT_RECITER);
    audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const onPlanSaved = (p: HifdPlan) => {
    loadPlanCached(true);
    setToday((td) => (td ? { ...td, plan: p } : td));
    reload();
  };

  if (!today) {
    return (
      <div className={styles.page}>
        <div className={styles.skelHero} />
        <div className={styles.skelRow}><span /><span /></div>
      </div>
    );
  }

  const { plan, items, sabaq } = today;
  const remaining = items.length;
  const goal = today.doneToday + remaining;
  const dailyPct = goal ? (today.doneToday / goal) * 100 : 100;
  const scored = surahs.filter((s) => s.avgScore != null);
  const avg = scored.length ? Math.round(scored.reduce((s, x) => s + (x.avgScore ?? 0) * x.count, 0) / scored.reduce((s, x) => s + x.count, 0)) : 0;

  const groups = (plan.method === "MANZIL" ? ["SABQI", "MANZIL"] : ["WEAK", "DUE"]) as ReviewGroup[];

  const stats = [
    { icon: Brain, label: t("hifd.stat.memorized"), value: today.memorized, suffix: "" },
    { icon: Target, label: t("hifd.stat.due"), value: today.dueTotal, suffix: "" },
    { icon: CalendarCheck, label: t("hifd.stat.done"), value: today.doneToday, suffix: "" },
    { icon: Gauge, label: t("hifd.stat.avg"), value: avg, suffix: "%" },
  ];

  return (
    <div className={styles.page}>
      {/* ===== Hero ===== */}
      <section className={styles.heroWrap}>
        <div className={styles.hero}>
          <motion.button custom={0} variants={fadeUp} initial="hidden" animate="show" className={styles.planPill} onClick={() => setPlanOpen(true)}>
            {plan.method === "MANZIL" ? <Layers size={14} /> : <Brain size={14} />}
            {t(`plan.method.${plan.method}` as DictKey)} · {t(`plan.preset.${plan.preset}` as DictKey)}
            <Settings2 size={14} />
          </motion.button>
          <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show" className={`${styles.title} gold-text`}>
            {t("hifd.title")}
          </motion.h1>
          <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show" className={styles.sub}>{t("hifd.subtitle")}</motion.p>
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className={styles.ctas}>
            <Magnetic>
              <button className="btn-gold" disabled={!remaining}
                onClick={() => setSession({ items: items.map((i) => ({ surah: i.surah, ayah: i.ayah })), title: t("hifd.queue.title") })}>
                <Mic size={18} /> {remaining ? t("hifd.start", { n: remaining }) : t("hifd.allDone")}
              </button>
            </Magnetic>
            <Magnetic strength={0.25}>
              <button className="btn-ghost" onClick={() => setPlanOpen(true)}><Settings2 size={17} /> {t("hifd.settings")}</button>
            </Magnetic>
          </motion.div>
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className={styles.stats}>
            {stats.map((s) => (
              <div key={s.label} className={`glass-panel fx-card ${styles.stat}`}>
                <s.icon size={18} />
                <strong><CountUp value={s.value} />{s.suffix && <small>{s.suffix}</small>}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div className={styles.orbCol} initial={{ opacity: 0, scale: 0.8, rotate: 8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.4, delay: 0.2, ease: EASE }}>
          <KhatmaOrb3D progress={dailyPct} juz={Math.round((dailyPct / 100) * 30)} accent="#5fd3a0">
            <div className={styles.orbPct}><CountUp value={today.doneToday} /><small>/{goal}</small></div>
            <div className={styles.orbMeta}>{t("hifd.today")}</div>
          </KhatmaOrb3D>
        </motion.div>
      </section>

      {/* ===== Sabaq ===== */}
      <motion.section custom={5} variants={fadeUp} initial="hidden" animate="show" className={`glass-panel nour-border ${styles.sabaq}`}>
        <span className={styles.sabaqGlyph} aria-hidden>۞</span>
        <div className={styles.sabaqTxt}>
          <span className={styles.kicker}><Sparkles size={13} /> {t("hifd.sabaq")}</span>
          {sabaq ? (
            <>
              <h2>{surahName(getSurah(sabaq.surah))} <em>· {sabaq.fromAyah === sabaq.toAyah ? sabaq.fromAyah : `${sabaq.fromAyah} → ${sabaq.toAyah}`}</em></h2>
              <p>{t("hifd.sabaq.desc", { n: sabaq.toAyah - sabaq.fromAyah + 1 })}</p>
            </>
          ) : <p>{t("hifd.sabaq.none")}</p>}
        </div>
        {sabaq && (
          <>
            <span className={`quran-text ${styles.sabaqAr}`}>{getSurah(sabaq.surah).ar}</span>
            <div className={styles.sabaqBtns}>
              <button className="btn-ghost" onClick={playSabaq}>{playing ? <Pause size={16} /> : <Play size={16} />} {t("hifd.sabaq.listen")}</button>
              <button className="btn-gold" onClick={() => setSession({ items: range(sabaq.surah, sabaq.fromAyah, sabaq.toAyah), title: t("hifd.sabaq") })}>
                <Mic size={16} /> {t("hifd.sabaq.tasmia")}
              </button>
            </div>
          </>
        )}
      </motion.section>

      {/* ===== File dyal l-mouraja3a ===== */}
      <section>
        <div className={styles.sectionHead}><h2>{t("hifd.queue.title")}</h2></div>
        {remaining === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`glass-panel ${styles.empty}`}>
            <span className="quran-text">وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا</span>
            <p>{today.memorized ? t("hifd.queue.empty") : t("hifd.empty.text")}</p>
          </motion.div>
        ) : (
          <div className={`fx-rail ${styles.groups}`}>
            {groups.map((g, gi) => {
              const list = items.filter((i) => i.group === g);
              return (
                <motion.article key={g} className={`glass-panel fx-card ${styles.group}`} style={{ ["--tone" as string]: GROUP_TONE[g] }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + gi * 0.08, duration: 0.6, ease: EASE }}>
                  <header>
                    <span className={styles.gDot} />
                    <div>
                      <h3>{t(`hifd.group.${g}` as DictKey)} <small>{list.length}</small></h3>
                      <p>{t(`hifd.group.${g}.desc` as DictKey)}</p>
                    </div>
                  </header>
                  {list.length === 0 ? <p className={styles.muted}>—</p> : (
                    <div className={styles.chips}>
                      {list.slice(0, 40).map((i) => (
                        <span key={`${i.surah}:${i.ayah}`} className={styles.chipA} style={{ ["--sc" as string]: scoreTone(i.lastScore) }}
                          title={i.lastScore != null ? `${i.lastScore}%` : ""}>
                          {getSurah(i.surah).translit} {i.ayah}
                        </span>
                      ))}
                      {list.length > 40 && <span className={styles.more}>+{list.length - 40}</span>}
                    </div>
                  )}
                  <button className="btn-ghost" disabled={!list.length}
                    onClick={() => setSession({ items: list.map((i) => ({ surah: i.surah, ayah: i.ayah })), title: t(`hifd.group.${g}` as DictKey) })}>
                    <Mic size={15} /> {t("hifd.group.review")}
                  </button>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== Souwar ===== */}
      {surahs.length > 0 && (
        <section>
          <div className={styles.sectionHead}><h2>{t("hifd.surahs")}</h2></div>
          <div className={styles.surahGrid}>
            {surahs.map((h, i) => {
              const s = getSurah(h.surah);
              const pct = (h.count / s.verses) * 100;
              return (
                <motion.div key={h.surah} className={`glass-panel nour-border fx-card ${styles.surahCard}`}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.05 }}>
                  <ProgressRing value={pct} size={62} stroke={5} color="#5fd3a0"><span className={styles.ringPct}>{Math.round(pct)}%</span></ProgressRing>
                  <div className={styles.sInfo}>
                    <strong>{surahName(s)}</strong>
                    <small>{h.fromAyah} → {h.toAyah} · {h.count}/{s.verses}</small>
                    <span className={styles.badges}>
                      {h.avgScore != null && <i style={{ color: scoreTone(h.avgScore) }}>{t("hifd.avg", { n: h.avgScore })}</i>}
                      {h.due > 0 && <i className={styles.due}>{t("profile.hifd.due", { n: h.due })}</i>}
                    </span>
                  </div>
                  <span className={`quran-text ${styles.sAr}`}>{s.ar}</span>
                  <button className="icon-btn" title={t("hifd.surah.tasmia")} aria-label={t("hifd.surah.tasmia")}
                    onClick={() => setSession({ items: range(h.surah, h.fromAyah, h.toAyah), title: surahName(s) })}>
                    <Mic size={17} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <TasmiaModal open={!!session} items={session?.items ?? []} title={session?.title} onClose={() => setSession(null)} onDone={reload} />
      <HifdPlanModal open={planOpen} plan={plan} onClose={() => setPlanOpen(false)} onSaved={onPlanSaved} />
    </div>
  );
};