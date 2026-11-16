"use client";

// Dashboard dyal l-profil: KPIs, activité (heatmap + 7 ayam), rythme dyal l-khatmat, analyse dyal l-hifd,
// kharita dyal 30 juz2, jalons w "insights". Les données: serveur (khatmat, hifd, khawatir, me)
// + localStorage (historique dyal l-adhkar, journal dyal l-9raya, favoris).
import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Flame, CheckCircle2, Brain, PenLine, HandHeart, Clock, RotateCcw, TrendingUp, TrendingDown, Check, Lock,
  Trophy, Users, Award, BookOpen, Star, Lightbulb,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { HifdSurah, Khatira, Khatma, Me } from "@/services/api/khatmaService";
import { useLocalState } from "@/lib/localStore";
import { dayKey } from "@/lib/adhkarStore";
import { useReadingLog } from "@/lib/readingLog";
import { useFavorites } from "@/lib/readerPrefs";
import { TOTAL_AYAHS, getSurah, globalIndex, juzOf, khatmaProgress } from "@/lib/quran";
import { getTemplate } from "@/lib/templates";
import { CountUp } from "@/components/common/Motion/Motion";
import { ProgressRing } from "@/components/common/ProgressRing/ProgressRing";
import styles from "./ProfileDashboard.module.css";

type Metric = "dhikr" | "minutes" | "ayahs";
const METRICS: Metric[] = ["dhikr", "minutes", "ayahs"];
const WEEKS = 16;
const DAY = 86_400_000;
const EASE = [0.22, 1, 0.36, 1] as const;
const NO_HISTORY: Record<string, number> = {};

const RANKS = [
  { latin: "Mubtadi’", ar: "مبتدئ" }, { latin: "Tālib", ar: "طالب" }, { latin: "Qāri’", ar: "قارئ" },
  { latin: "Murattil", ar: "مرتّل" }, { latin: "Hāfiz", ar: "حافظ" }, { latin: "Murabbī", ar: "مربٍّ" },
];

/** Niveau mn les points Nour: seuil dyal niveau n = 50·(n−1)² */
export const levelOf = (points: number) => {
  const level = Math.floor(Math.sqrt(Math.max(0, points) / 50)) + 1;
  const base = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return { level, next, toNext: next - points, pct: ((points - base) / (next - base)) * 100, rank: RANKS[Math.min(Math.floor((level - 1) / 3), RANKS.length - 1)] };
};

interface Props { me: Me | null; list: Khatma[]; hifd: HifdSurah[]; khawatir: Khatira[] }

export const ProfileDashboard = ({ me, list, hifd, khawatir }: Props) => {
  const { t, lang, surahName, formatDate } = useI18n();
  const [history] = useLocalState<Record<string, number>>("ltd.adhkar.history", NO_HISTORY);
  const { log } = useReadingLog();
  const favorites = useFavorites();
  const [metric, setMetric] = useState<Metric>("dhikr");
  const [now] = useState(() => Date.now());
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const heatRef = useRef<HTMLDivElement>(null);
  const locale = lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-FR";

  const valueOf = useMemo(() => (key: string, m: Metric) => {
    if (m === "dhikr") return history[key] ?? 0;
    const d = log[key];
    if (!d) return 0;
    return m === "minutes" ? Math.round(d.seconds / 60) : d.ayahs;
  }, [history, log]);
  const isActive = useMemo(() => (key: string) => (history[key] ?? 0) > 0 || !!log[key] && (log[key].seconds > 30 || log[key].ayahs > 0), [history, log]);

  // ---------- Heatmap: 16 semaines, l-3moud = semaine (lundi -> dimanche) ----------
  const heat = useMemo(() => {
    const today = new Date(now);
    today.setHours(12, 0, 0, 0);
    const monday = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY - (WEEKS - 1) * 7 * DAY);
    const cols = Array.from({ length: WEEKS }, (_, c) => Array.from({ length: 7 }, (_, r) => {
      const d = new Date(monday.getTime() + (c * 7 + r) * DAY);
      if (d.getTime() > today.getTime()) return null;
      const key = dayKey(d);
      return { key, date: d, value: valueOf(key, metric), active: isActive(key) };
    }));
    const flat = cols.flat().filter((c): c is NonNullable<typeof c> => !!c);
    const max = Math.max(1, ...flat.map((c) => c.value));
    return { cols, max, activeDays: flat.filter((c) => c.active).length };
  }, [now, metric, valueOf, isActive]);

  // ---------- 7 ayam l-akhra ----------
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * DAY);
    const key = dayKey(d);
    return { key, date: d, value: valueOf(key, metric), today: i === 6 };
  }), [now, metric, valueOf]);
  const weekMax = Math.max(1, ...week.map((w) => w.value));
  const weekTotal = week.reduce((s, w) => s + w.value, 0);
  const readMin7 = useMemo(() => Array.from({ length: 7 }, (_, i) => log[dayKey(new Date(now - i * DAY))]?.seconds ?? 0).reduce((a, b) => a + b, 0) / 60, [log, now]);

  // ---------- Rythme dyal l-khatmat ----------
  const pace = useMemo(() => list.filter((k) => !k.completed).map((k) => {
    const started = khatmaProgress(k.currentSurah, k.currentAyah) > 0;
    const g = started ? globalIndex(k.currentSurah, k.currentAyah) : 0;
    const elapsed = Math.max(1, Math.ceil((now - new Date(k.startedAt).getTime()) / DAY));
    const perDay = TOTAL_AYAHS / Math.max(1, k.targetDays);
    const expected = Math.min(TOTAL_AYAHS, perDay * elapsed);
    const delta = Math.round((g - expected) / perDay);
    const left = k.targetDays - elapsed;
    const need = Math.ceil((TOTAL_AYAHS - g) / Math.max(1, left));
    const rate = g / elapsed;
    const eta = rate > 0 ? new Date(now + ((TOTAL_AYAHS - g) / rate) * DAY).toISOString() : null;
    return { k, pct: (g / TOTAL_AYAHS) * 100, expectedPct: (expected / TOTAL_AYAHS) * 100, delta, need, eta, tpl: getTemplate(k.template) };
  }), [list, now]);

  // ---------- Hifd ----------
  const hifdTotal = hifd.reduce((s, h) => s + h.count, 0);
  const dueTotal = hifd.reduce((s, h) => s + h.due, 0);
  const scored = hifd.filter((h) => h.avgScore != null);
  const avgScore = scored.length ? scored.reduce((s, h) => s + (h.avgScore ?? 0) * h.count, 0) / Math.max(1, scored.reduce((s, h) => s + h.count, 0)) : null;
  const topHifd = useMemo(() => [...hifd].sort((a, b) => b.count - a.count).slice(0, 5), [hifd]);

  // ---------- Juz ----------
  const featured = useMemo(() => [...list].sort((a, b) =>
    khatmaProgress(b.currentSurah, b.currentAyah, b.completed) - khatmaProgress(a.currentSurah, a.currentAyah, a.completed))[0], [list]);
  const featuredStarted = featured ? khatmaProgress(featured.currentSurah, featured.currentAyah, featured.completed) > 0 : false;
  const currentJuz = featured && featuredStarted ? juzOf(featured.currentSurah, featured.currentAyah) : 0;

  // ---------- Jalons ----------
  const points = me?.nourPoints ?? 0;
  const streak = me?.currentStreak ?? 0;
  const completedCount = list.filter((k) => k.completed).length;
  const lifetimeDhikr = useMemo(() => Object.values(history).reduce((s, v) => s + v, 0), [history]);
  const badges = [
    { id: "first", icon: Trophy, cur: completedCount, goal: 1 },
    { id: "streak7", icon: Flame, cur: streak, goal: 7 },
    { id: "streak30", icon: Flame, cur: streak, goal: 30 },
    { id: "points1k", icon: Sparkles, cur: points, goal: 1000 },
    { id: "points10k", icon: Star, cur: points, goal: 10000 },
    { id: "hifd100", icon: Brain, cur: hifdTotal, goal: 100 },
    { id: "hifd500", icon: Award, cur: hifdTotal, goal: 500 },
    { id: "khawatir10", icon: PenLine, cur: khawatir.length, goal: 10 },
    { id: "dhikr1k", icon: HandHeart, cur: lifetimeDhikr, goal: 1000 },
    { id: "shared", icon: Users, cur: list.some((k) => k.members.length > 1) ? 1 : 0, goal: 1 },
  ];
  const unlocked = badges.filter((b) => b.cur >= b.goal).length;

  // ---------- Insights ----------
  const insights = useMemo(() => {
    const out: string[] = [];
    const last30 = Array.from({ length: 30 }, (_, i) => new Date(now - i * DAY));
    const active30 = last30.filter((d) => isActive(dayKey(d)));
    if (active30.length >= 3) {
      const byDay = new Array(7).fill(0) as number[];
      active30.forEach((d) => { byDay[d.getDay()] += 1; });
      const best = byDay.indexOf(Math.max(...byDay));
      // 2024-01-07 = dimanche -> smeya dyal n-nhar b l-lougha
      const dayName = new Date(2024, 0, 7 + best).toLocaleDateString(locale, { weekday: "long" });
      out.push(t("dash.insight.bestDay", { day: dayName }));
    }
    if (active30.length > 0) out.push(t("dash.insight.consistency", { n: active30.length }));
    const dhikrDays = Object.values(history).filter((v) => v > 0);
    if (dhikrDays.length > 0) out.push(t("dash.insight.avg", { n: `${Math.round(lifetimeDhikr / dhikrDays.length)} ${t("dash.metric.dhikr").toLowerCase()}` }));
    if (dueTotal > 0) out.push(t("dash.insight.due", { n: dueTotal }));
    return out;
  }, [now, isActive, history, lifetimeDhikr, dueTotal, t, locale]);

  const lv = levelOf(points);
  const kpis = [
    { icon: Sparkles, label: t("common.points"), value: points },
    { icon: Flame, label: t("common.streak"), value: streak },
    { icon: CheckCircle2, label: t("profile.filter.done"), value: completedCount },
    { icon: BookOpen, label: t("dash.kpi.active"), value: list.length - completedCount },
    { icon: Brain, label: t("home.stat.hifd"), value: hifdTotal },
    { icon: RotateCcw, label: t("dash.kpi.due"), value: dueTotal },
    { icon: PenLine, label: t("dash.kpi.khawatir"), value: khawatir.length },
    { icon: HandHeart, label: t("dash.kpi.dhikr"), value: lifetimeDhikr },
    { icon: Clock, label: t("dash.kpi.readTime"), value: Math.round(readMin7), unit: t("dash.min") },
    { icon: Star, label: t("dash.kpi.fav"), value: favorites.list.length },
  ];

  const fmtDay = (d: Date) => d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
  const showTip = (e: React.PointerEvent, text: string) => {
    const box = heatRef.current?.getBoundingClientRect();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (box) setTip({ x: r.left - box.left + r.width / 2, y: r.top - box.top, text });
  };

  return (
    <section className={styles.dash}>
      <div className={styles.head}>
        <div>
          <h2>{t("dash.title")}</h2>
          <p>{t("dash.subtitle")}</p>
        </div>
        {/* Filtre wa7ed l-fo9: kay-7kem f l-heatmap w f 7 ayam */}
        <div className={styles.seg} role="tablist" aria-label={t("dash.activity")}>
          {METRICS.map((m) => (
            <button key={m} role="tab" aria-selected={metric === m} className={metric === m ? styles.segOn : ""} onClick={() => setMetric(m)}>
              {metric === m && <motion.span layoutId="dashMetric" className={styles.segPill} transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span>{t(`dash.metric.${m}` as DictKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Niveau + KPIs ===== */}
      <div className={styles.topRow}>
        <motion.div className={`glass-panel fx-card ${styles.level}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}>
          <ProgressRing value={lv.pct} size={128} stroke={8}>
            <div className={styles.lvNum}><small>{t("dash.level", { n: "" }).trim()}</small><strong><CountUp value={lv.level} /></strong></div>
          </ProgressRing>
          <div className={styles.lvText}>
            <span className={styles.rank}>{lang === "ar" ? lv.rank.ar : lv.rank.latin}</span>
            <span className={`quran-text ${styles.rankAr}`}>{lang === "ar" ? lv.rank.latin : lv.rank.ar}</span>
            <div className={styles.lvBar}><motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: lv.pct / 100 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: EASE }} /></div>
            <small>{t("dash.toNext", { n: lv.toNext.toLocaleString(locale), l: lv.level + 1 })}</small>
          </div>
        </motion.div>

        <div className={`fx-rail2 ${styles.kpis}`}>
          {kpis.map((k, i) => (
            <motion.div key={k.label} className={`glass-panel fx-card ${styles.kpi}`}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: EASE }}>
              <k.icon size={18} className="fx-icon" />
              <strong><CountUp value={k.value} />{k.unit && <small> {k.unit}</small>}</strong>
              <span>{k.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ===== Activité ===== */}
      <div className={styles.row2}>
        <div className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}>
            <h3>{t("dash.activity")} · {t(`dash.metric.${metric}` as DictKey)}</h3>
            <small>{t("dash.activity.sub", { n: heat.activeDays })}</small>
          </header>
          <div className={styles.heatWrap} ref={heatRef} onPointerLeave={() => setTip(null)}>
            <div className={styles.heat} style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
              {heat.cols.map((col, c) => (
                <div key={c} className={styles.heatCol}>
                  {col.map((cell, r) => cell ? (
                    <span key={r} className={styles.cell} data-l={cell.value === 0 ? 0 : Math.max(1, Math.ceil((cell.value / heat.max) * 4))}
                      aria-label={`${fmtDay(cell.date)}: ${cell.value}`}
                      onPointerEnter={(e) => showTip(e, `${fmtDay(cell.date)} · ${cell.value.toLocaleString(locale)}`)} />
                  ) : <span key={r} className={styles.cellEmpty} />)}
                </div>
              ))}
            </div>
            {tip && <span className={styles.tip} style={{ left: tip.x, top: tip.y }}>{tip.text}</span>}
          </div>
          <div className={styles.heatLegend}>
            <span>{t("dash.less")}</span>
            {[0, 1, 2, 3, 4].map((l) => <i key={l} className={styles.cell} data-l={l} />)}
            <span>{t("dash.more")}</span>
          </div>
        </div>

        <div className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}>
            <h3>{t("dash.week")}</h3>
            <small>{t("dash.week.total", { n: weekTotal.toLocaleString(locale) })}</small>
          </header>
          <div className={styles.bars}>
            {week.map((w, i) => (
              <div key={w.key} className={styles.barCol} aria-label={`${fmtDay(w.date)}: ${w.value}`}>
                <span className={`${styles.barVal} ${w.today || w.value === weekMax && w.value > 0 ? styles.barValOn : ""}`}>{w.value.toLocaleString(locale)}</span>
                <div className={styles.barTrack}>
                  <motion.i className={w.today ? styles.barToday : ""} initial={{ scaleY: 0 }} whileInView={{ scaleY: Math.max(w.value / weekMax, w.value > 0 ? 0.04 : 0) }}
                    viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.05, ease: EASE }} />
                </div>
                <small className={w.today ? styles.barDayOn : ""}>{w.date.toLocaleDateString(locale, { weekday: "short" })}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Rythme + Hifd ===== */}
      <div className={styles.row2}>
        <div className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}><h3>{t("dash.pace")}</h3></header>
          {pace.length === 0 ? <p className={styles.muted}>{t("dash.pace.empty")}</p> : (
            <ul className={styles.paceList}>
              {pace.map(({ k, pct, expectedPct, delta, need, eta, tpl }, i) => {
                const state = delta >= 1 ? "ahead" : delta <= -1 ? "behind" : "onTrack";
                const Icon = state === "ahead" ? TrendingUp : state === "behind" ? TrendingDown : Check;
                return (
                  <motion.li key={k.id} className={styles.paceItem} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}>
                    <div className={styles.paceTop}>
                      <strong>{tpl.glyph} {k.title}</strong>
                      <span className={`${styles.chip} ${styles[`chip_${state}`]}`}>
                        <Icon size={13} />
                        {state === "onTrack" ? t("dash.pace.onTrack") : t(`dash.pace.${state}` as DictKey, { n: Math.abs(delta) })}
                      </span>
                    </div>
                    <div className={styles.paceTrack} title={`${t("dash.pace.expected")}: ${expectedPct.toFixed(1)}%`}>
                      <motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: pct / 100 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }} />
                      <b style={{ insetInlineStart: `${Math.min(100, expectedPct)}%` }} aria-label={t("dash.pace.expected")} />
                    </div>
                    <div className={styles.paceMeta}>
                      <span>{pct.toFixed(1)}% · {t("dash.pace.need", { n: need })}</span>
                      {eta && <span>{t("dash.pace.eta", { date: formatDate(eta) })}</span>}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
          <p className={styles.paceLegend}><i /> {t("dash.pace.expected")}</p>
        </div>

        <div className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}><h3>{t("dash.hifd")}</h3></header>
          <div className={styles.hifdTop}>
            <ProgressRing value={(hifdTotal / TOTAL_AYAHS) * 100} size={104} stroke={7} color="#5fd3a0">
              <div className={styles.hifdNum}><strong><CountUp value={hifdTotal} /></strong><small>{t("dash.hifd.of")}</small></div>
            </ProgressRing>
            <dl className={styles.hifdFacts}>
              <div><dt>{t("dash.hifd.surahs")}</dt><dd>{hifd.length}</dd></div>
              <div><dt>{t("dash.kpi.due")}</dt><dd>{dueTotal}</dd></div>
              <div><dt>{t("dash.hifd.avg")}</dt><dd>{avgScore == null ? "—" : avgScore > 5 ? `${Math.round(avgScore)}%` : avgScore.toFixed(1)}</dd></div>
            </dl>
          </div>
          {topHifd.length > 0 && (
            <>
              <span className={styles.subLabel}>{t("dash.hifd.top")}</span>
              <ul className={styles.hbars}>
                {topHifd.map((h, i) => {
                  const s = getSurah(h.surah);
                  return (
                    <li key={h.surah} title={`${h.count} / ${s.verses}`}>
                      <span>{surahName(s)}</span>
                      <div><motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: h.count / s.verses }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.06, ease: EASE }} /></div>
                      <b>{h.count}/{s.verses}</b>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* ===== Juz + Insights ===== */}
      <div className={styles.row2}>
        <div className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}>
            <h3>{t("dash.juz")}</h3>
            {featured && <small>{featured.title}</small>}
          </header>
          <div className={styles.juzGrid}>
            {Array.from({ length: 30 }, (_, i) => {
              const j = i + 1;
              const state = featured?.completed || (currentJuz > 0 && j < currentJuz) ? "done" : j === currentJuz ? "current" : "todo";
              return (
                <motion.span key={j} className={`${styles.juz} ${styles[`juz_${state}`]}`} title={`${t("common.juz")} ${j} · ${t(`dash.juz.${state}` as DictKey)}`}
                  initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.015, ease: EASE }}>
                  {state === "done" ? <Check size={13} /> : j}
                </motion.span>
              );
            })}
          </div>
          <div className={styles.juzLegend}>
            <span><i className={`${styles.juz} ${styles.juz_done}`}><Check size={9} /></i>{t("dash.juz.done")}</span>
            <span><i className={`${styles.juz} ${styles.juz_current}`} />{t("dash.juz.current")}</span>
            <span><i className={`${styles.juz} ${styles.juz_todo}`} />{t("dash.juz.todo")}</span>
          </div>
        </div>

        <div className={`glass-panel ${styles.panel} ${styles.insights}`}>
          <header className={styles.panelHead}><h3><Lightbulb size={18} /> {t("dash.insights")}</h3></header>
          {insights.length === 0 ? <p className={styles.muted}>{t("dash.insight.none")}</p> : (
            <ul>
              {insights.map((s, i) => (
                <motion.li key={s} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}>{s}</motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ===== Jalons ===== */}
      <div className={`glass-panel ${styles.panel}`}>
        <header className={styles.panelHead}>
          <h3>{t("dash.badges")}</h3>
          <small>{t("dash.badges.count", { n: unlocked, t: badges.length })}</small>
        </header>
        <div className={`fx-rail2 ${styles.badges}`}>
          {badges.map((b, i) => {
            const on = b.cur >= b.goal;
            return (
              <motion.div key={b.id} className={`fx-card ${styles.badge} ${on ? styles.badgeOn : ""}`}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.03, ease: EASE }}>
                <span className={styles.badgeIcon}>{on ? <b.icon size={20} className="fx-icon" /> : <Lock size={16} />}</span>
                <strong>{t(`dash.badge.${b.id}` as DictKey)}</strong>
                <div className={styles.badgeBar}><i style={{ transform: `scaleX(${Math.min(1, b.cur / b.goal)})` }} /></div>
                <small>{Math.min(b.cur, b.goal).toLocaleString(locale)} / {b.goal.toLocaleString(locale)}</small>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
