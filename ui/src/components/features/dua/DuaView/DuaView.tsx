"use client";

// Page dyal d-dou3a: ad3iya mn l-Qur2an w s-Sunna (ba7t, catégories, favoris, 3eddad, 9raya mkebbra),
// aw9at l-ijaba (m7souba mn aw9at s-salat), adab d-dou3a, w deftar khass (kay-b9a f had l-jihaz).
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Heart, Copy, Maximize2, X, ChevronLeft, ChevronRight, Plus, Check, Trash2, MoonStar, BellRing, Sunset, Sparkles, CalendarHeart,
  ArrowDownToDot, RotateCcw, NotebookPen, ScrollText,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { useToast } from "@/components/common/Toast/Toast";
import { useLocalState } from "@/lib/localStore";
import { DUAS, DUA_CATS, Dua, DuaCat } from "@/lib/duas";
import { FARD, timesForDate } from "@/lib/prayerTimes";
import { DEFAULT_IQAMA, toPrayerInput, useSalatSettings } from "@/lib/salatStore";
import styles from "./DuaView.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;
const DAY = 86_400_000;
const NO_FAVS: string[] = [];
interface Entry { id: number; text: string; createdAt: string; answeredAt: string | null }
const NO_ENTRIES: Entry[] = [];
const stripAr = (x: string) => x.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ۝]/g, "").replace(/[ٱأإآ]/g, "ا").toLowerCase();

export const DuaView = () => {
  const { t, lang, formatDate } = useI18n();
  const toast = useToast();
  const [favs, setFavs] = useLocalState<string[]>("ltd.dua.fav", NO_FAVS);
  const [journal, setJournal] = useLocalState<Entry[]>("ltd.dua.journal", NO_ENTRIES);
  const [settings] = useSalatSettings();
  const [cat, setCat] = useState<DuaCat | "all">("all");
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [focus, setFocus] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const locale = lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-FR";

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id); }, []);

  const tr = (d: Dua) => (lang === "en" ? d.en : d.fr);
  const shown = useMemo(() => {
    const q = stripAr(query.trim());
    return DUAS.filter((d) => (cat === "all" || d.cats.includes(cat)) && (!favOnly || favs.includes(d.id))
      && (!q || stripAr(d.ar).includes(q) || d.fr.toLowerCase().includes(q) || d.en.toLowerCase().includes(q) || d.src.toLowerCase().includes(q)));
  }, [cat, query, favOnly, favs]);

  const toggleFav = (id: string) => setFavs((l) => (l.includes(id) ? l.filter((x) => x !== id) : [id, ...l]));
  const copy = async (d: Dua) => {
    const text = `${d.ar}${lang === "ar" ? "" : `\n\n${tr(d)}`}\n\n— ${lang === "ar" ? d.srcAr : d.src}`;
    try { await navigator.clipboard.writeText(text); toast(t("common.copied")); } catch { /* bloqué */ }
  };
  const bump = (id: string) => setCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));

  // Dou3a dyal l-la7da: kaytbeddel 4 merrat f n-nhar
  const moment = DUAS[(Math.floor(now / DAY) * 4 + Math.floor(new Date(now).getHours() / 6)) % DUAS.length];

  // ---------- Aw9at l-ijaba (mn aw9at s-salat) ----------
  const input = toPrayerInput(settings);
  const base = new Date(now);
  const yT = timesForDate(new Date(now - DAY), input), tT = timesForDate(base, input), nT = timesForDate(new Date(now + DAY), input);
  const fmt = (ms: number | null | undefined) => ms == null ? "—" : new Date(ms).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: !settings.h24, timeZone: input.timeZone });
  const ms = (x: Date | null | undefined) => x?.getTime() ?? null;
  const fajrToday = ms(tT.fajr), beforeFajr = fajrToday != null && now < fajrToday;
  const nightStart = beforeFajr ? ms(yT.maghrib) : ms(tT.maghrib);
  const nightEnd = beforeFajr ? fajrToday : ms(nT.fajr);
  const thirdStart = nightStart != null && nightEnd != null ? nightStart + ((nightEnd - nightStart) * 2) / 3 : null;
  const seq = [...FARD.map((p) => ({ p, at: ms(tT[p]) })), { p: "fajr" as const, at: ms(nT.fajr) }].filter((e): e is { p: typeof FARD[number]; at: number } => e.at != null);
  const nextAdhan = seq.find((e) => e.at > now);
  const lastAdhan = [...seq].reverse().find((e) => e.at <= now);
  const betweenNow = !!lastAdhan && now - lastAdhan.at < (settings.iqama[lastAdhan.p] ?? DEFAULT_IQAMA[lastAdhan.p]) * 60_000;
  const maghrib = ms(tT.maghrib), asr = ms(tT.asr);
  const isFriday = base.getDay() === 5;
  const times: { icon: React.ElementType; title: DictKey; desc: string; active: boolean }[] = [
    { icon: MoonStar, title: "dua.times.lastThird", desc: t("dua.times.lastThird.d", { from: fmt(thirdStart), to: fmt(nightEnd) }), active: thirdStart != null && nightEnd != null && now >= thirdStart && now < nightEnd },
    { icon: BellRing, title: "dua.times.adhan", desc: nextAdhan ? t("dua.times.adhan.d", { p: t(`salat.p.${nextAdhan.p}` as DictKey), time: fmt(nextAdhan.at) }) : "—", active: betweenNow },
    { icon: ArrowDownToDot, title: "dua.times.sujud", desc: t("dua.times.sujud.d"), active: false },
    { icon: CalendarHeart, title: "dua.times.friday", desc: t("dua.times.friday.d", { time: fmt(maghrib) }), active: isFriday && asr != null && maghrib != null && now >= asr && now < maghrib },
    { icon: Sunset, title: "dua.times.iftar", desc: t("dua.times.iftar.d", { time: fmt(maghrib) }), active: maghrib != null && Math.abs(now - maghrib) < 10 * 60_000 },
  ];

  // ---------- Deftar ----------
  const addEntry = () => {
    const text = draft.trim();
    if (!text) return;
    setJournal((l) => [{ id: Date.now(), text, createdAt: new Date().toISOString(), answeredAt: null }, ...l]);
    setDraft("");
  };
  const toggleAnswered = (id: number) => setJournal((l) => l.map((e) => (e.id === id ? { ...e, answeredAt: e.answeredAt ? null : new Date().toISOString() } : e)));
  const removeEntry = (id: number) => setJournal((l) => l.filter((e) => e.id !== id));
  const answered = journal.filter((e) => e.answeredAt).length;

  // ---------- 9raya mkebbra ----------
  const focused = focus != null ? shown[Math.min(focus, shown.length - 1)] : null;
  const total = shown.length;
  const step = (dlt: number) => setFocus((i) => (i == null || shown.length === 0 ? i : (i + dlt + shown.length) % shown.length));
  useEffect(() => {
    if (focus == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(null);
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const dlt = (e.key === "ArrowRight") === (lang === "ar") ? -1 : 1;
        setFocus((i) => (i == null || total === 0 ? i : (i + dlt + total) % total));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, total, lang]);

  return (
    <div className={styles.page}>
      {/* ===== Hero ===== */}
      <section className={styles.hero}>
        <div className={styles.heroTxt}>
          <motion.span className={`quran-text ${styles.kicker}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>{t("dua.kicker")}</motion.span>
          <motion.h1 className={`${styles.title} gold-text`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease: EASE }}>{t("dua.title")}</motion.h1>
          <motion.p className={styles.sub} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.16, ease: EASE }}>{t("dua.subtitle")}</motion.p>
        </div>
        <motion.article className={`glass-panel nour-border ${styles.moment}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2, ease: EASE }}>
          <span className={styles.momentGlow} aria-hidden />
          <span className={styles.label}><Sparkles size={13} /> {t("dua.moment")}</span>
          <p className={`quran-text ${styles.momentAr}`}>{moment.ar}</p>
          {lang !== "ar" && <p className={styles.tr}>{tr(moment)}</p>}
          <footer>
            <cite>{lang === "ar" ? moment.srcAr : moment.src}</cite>
            <button className="icon-btn" onClick={() => copy(moment)} aria-label={t("common.copy")} title={t("common.copy")}><Copy size={15} /></button>
          </footer>
        </motion.article>
      </section>

      {/* ===== Aw9at l-ijaba ===== */}
      <section>
        <h2 className={styles.h2}>{t("dua.times")}</h2>
        <div className={styles.times}>
          {times.map((x, i) => (
            <motion.div key={x.title} className={`glass-panel fx-card ${styles.timeCard} ${x.active ? styles.timeOn : ""}`}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}>
              <span className={styles.timeIcon}><x.icon size={19} className="fx-icon" /></span>
              <strong>{t(x.title)}</strong>
              <small>{x.desc}</small>
              {x.active && <span className={styles.nowTag}>{t("dua.times.now")}</span>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Ad3iya ===== */}
      <section>
        <div className={styles.listHead}>
          <h2 className={styles.h2}>{t("dua.count", { n: shown.length })}</h2>
          <div className={styles.tools}>
            <label className={styles.search}>
              <Search size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("dua.search")} aria-label={t("dua.search")} />
              {query && <button onClick={() => setQuery("")} aria-label={t("common.close")}><X size={14} /></button>}
            </label>
            <button className={`btn-ghost ${favOnly ? styles.on : ""}`} onClick={() => setFavOnly((v) => !v)} aria-pressed={favOnly}>
              <Heart size={15} fill={favOnly ? "currentColor" : "none"} /> {t("dua.favOnly")} · {favs.length}
            </button>
          </div>
        </div>
        <div className={styles.cats} role="tablist">
          {(["all", ...DUA_CATS] as const).map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} className={cat === c ? styles.catOn : ""} onClick={() => setCat(c)}>
              {cat === c && <motion.span layoutId="duaCat" className={styles.catPill} transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span>{t(`dua.cat.${c}` as DictKey)}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? <p className={`glass-panel ${styles.empty}`}>{t("dua.empty")}</p> : (
          <div className={styles.grid}>
            {shown.map((d, i) => {
              const fav = favs.includes(d.id);
              return (
                <motion.article key={d.id} className={`glass-panel fx-card ${styles.card}`}
                  initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }} transition={{ duration: 0.5, delay: (i % 2) * 0.06, ease: EASE }}>
                  <div className={styles.cardTags}>
                    {d.cats.map((c) => <span key={c}>{t(`dua.cat.${c}` as DictKey)}</span>)}
                  </div>
                  <p className={`quran-text ${styles.ar}`}>{d.ar}</p>
                  {lang !== "ar" && <p className={styles.tr}>{tr(d)}</p>}
                  <footer>
                    <cite>{lang === "ar" ? d.srcAr : d.src}</cite>
                    <div className={styles.cardBtns}>
                      <button className={`${styles.counter} ${counts[d.id] ? styles.counterOn : ""}`} onClick={() => bump(d.id)} aria-label={`${t("dua.counter")}: ${counts[d.id] ?? 0}`} title={t("dua.counter")}>
                        {counts[d.id] ?? 0}
                      </button>
                      <motion.button whileTap={{ scale: 0.8 }} className={`icon-btn ${fav ? styles.favOn : ""}`} onClick={() => toggleFav(d.id)} aria-pressed={fav} aria-label={t("dua.fav")} title={t("dua.fav")}>
                        <Heart size={15} fill={fav ? "currentColor" : "none"} />
                      </motion.button>
                      <button className="icon-btn" onClick={() => copy(d)} aria-label={t("common.copy")} title={t("common.copy")}><Copy size={15} /></button>
                      <button className="icon-btn" onClick={() => setFocus(i)} aria-label={t("dua.focus")} title={t("dua.focus")}><Maximize2 size={15} /></button>
                    </div>
                  </footer>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== Deftar + Adab ===== */}
      <div className={styles.row}>
        <section className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}>
            <h2><NotebookPen size={20} /> {t("dua.journal")}</h2>
            <small>{t("dua.journal.stats", { n: journal.length - answered, a: answered })}</small>
          </header>
          <form className={styles.form} onSubmit={(e) => { e.preventDefault(); addEntry(); }}>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("dua.journal.placeholder")} rows={3} maxLength={600} aria-label={t("dua.journal.placeholder")}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addEntry(); }} />
            <button className="btn-gold" type="submit" disabled={!draft.trim()}><Plus size={16} /> {t("dua.journal.add")}</button>
          </form>
          <small className={styles.hint}>{t("dua.journal.hint")}</small>
          {journal.length === 0 ? <p className={styles.muted}>{t("dua.journal.empty")}</p> : (
            <ul className={styles.entries}>
              <AnimatePresence initial={false}>
                {journal.map((e) => (
                  <motion.li key={e.id} layout className={`${styles.entry} ${e.answeredAt ? styles.entryDone : ""}`}
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                    <motion.button whileTap={{ scale: 0.8 }} className={`${styles.check} ${e.answeredAt ? styles.checkOn : ""}`} onClick={() => toggleAnswered(e.id)}
                      aria-pressed={!!e.answeredAt} aria-label={t("dua.journal.mark")} title={t("dua.journal.mark")}>
                      {e.answeredAt ? <Check size={15} /> : <RotateCcw size={13} />}
                    </motion.button>
                    <div>
                      <p>{e.text}</p>
                      <small>{formatDate(e.createdAt)}{e.answeredAt && <> · <b>{t("dua.journal.answered")}</b></>}</small>
                    </div>
                    <button className="icon-btn" onClick={() => removeEntry(e.id)} aria-label={t("profile.delete")} title={t("profile.delete")}><Trash2 size={14} /></button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>

        <section className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}><h2><ScrollText size={20} /> {t("dua.adab")}</h2></header>
          <ol className={styles.adab}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <motion.li key={n} initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: n * 0.05, ease: EASE }}>
                <b>{n}</b><span>{t(`dua.adab.${n}` as DictKey)}</span>
              </motion.li>
            ))}
          </ol>
        </section>
      </div>

      {/* ===== 9raya mkebbra ===== */}
      <AnimatePresence>
        {focused && (
          <motion.div className={styles.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFocus(null)}>
            <motion.div className={styles.reader} role="dialog" aria-modal="true" aria-label={t("dua.focus")} onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.4, ease: EASE }}>
              <button className={`icon-btn ${styles.readerX}`} onClick={() => setFocus(null)} aria-label={t("common.close")}><X size={17} /></button>
              <AnimatePresence mode="wait">
                <motion.div key={focused.id} className={styles.readerBody} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                  <p className={`quran-text ${styles.readerAr}`}>{focused.ar}</p>
                  {lang !== "ar" && <p className={styles.readerTr}>{tr(focused)}</p>}
                  <cite>{lang === "ar" ? focused.srcAr : focused.src}</cite>
                </motion.div>
              </AnimatePresence>
              <div className={styles.readerBar}>
                <button className="icon-btn" onClick={() => step(-1)} aria-label={t("salat.hadith.prev")}><ChevronLeft size={18} className={styles.flip} /></button>
                <button className={styles.bigCount} onClick={() => bump(focused.id)} aria-label={`${t("dua.counter")}: ${counts[focused.id] ?? 0}`}>
                  <strong>{counts[focused.id] ?? 0}</strong><small>{t("dua.counter")}</small>
                </button>
                <button className="icon-btn" onClick={() => step(1)} aria-label={t("salat.hadith.next")}><ChevronRight size={18} className={styles.flip} /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
