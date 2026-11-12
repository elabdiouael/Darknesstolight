"use client";

// Session dyal adhkar: carte b carte (focus) wla liste, compteur b touch, fadl + masdar, favoris, partage,
// passage automatique, vibration, taille dyal l-khatt, w ihtifal mli tkemmel l-categorie
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, Copy, Heart, LayoutList, RotateCcw, Settings2, Share2, Sparkles, Square, BookOpenText, Pencil,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/components/common/Toast/Toast";
import { useCelebrate } from "@/components/common/Celebration/Celebration";
import { AdhkarCategory, Dhikr, pick, pickTr } from "@/lib/adhkar";
import { AdhkarPrefs, buzz, useAdhkarFavorites, useAdhkarPrefs, useAdhkarProgress } from "@/lib/adhkarStore";
import { isCustom, useAllCategories, useCategory, useCustomAdhkar } from "@/lib/adhkarCustom";
import { CATEGORY_ICONS } from "../AdhkarNow/AdhkarNow";
import { CategoryEditor } from "../CategoryEditor/CategoryEditor";
import styles from "./AdhkarSession.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;

export const AdhkarSession = ({ id, start }: { id: string; start: number | null }) => {
  const { t } = useI18n();
  const cat = useCategory(id);
  if (!cat) {
    return (
      <div className={`glass-panel ${styles.notFound}`}>
        <p>{t("adhkar.notFound")}</p>
        <Link href="/adhkar" className="btn-ghost"><ArrowLeft size={16} /> {t("adhkar.back")}</Link>
      </div>
    );
  }
  return <Session cat={cat} start={start} />;
};

const Session = ({ cat, start }: { cat: AdhkarCategory; start: number | null }) => {
  const { t, lang } = useI18n();
  const toast = useToast();
  const celebrate = useCelebrate();
  const progress = useAdhkarProgress();
  const fav = useAdhkarFavorites();
  const [prefs, setPrefs] = useAdhkarPrefs();
  const items = cat.items;
  const n = items.length;
  const isDone = (i: number) => progress.get(cat.id, items[i].id) >= items[i].count;

  // Bda mn l-param ?i= wla mn awel dhikr ma-tkemmelch
  const [rawIdx, setIdx] = useState(() => {
    if (start != null && start >= 0 && start < n) return start;
    const first = items.findIndex((d) => progress.get(cat.id, d.id) < d.count);
    return first < 0 ? 0 : first;
  });
  // Ila t-beddlat l-catégorie (msa7ti dhikr) -> index dima f l-7dod
  const idx = Math.min(rawIdx, Math.max(0, n - 1));
  const [dir, setDir] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const custom = useCustomAdhkar();
  const all = useAllCategories();
  const p = progress.catProgress(cat);
  const allDone = p.pct >= 100;
  const Icon = CATEGORY_ICONS[cat.icon];

  const go = (to: number) => {
    if (to < 0 || to >= n || to === idx) return;
    setDir(to > idx ? 1 : -1);
    setIdx(to);
  };

  const nextIncomplete = (from: number) => {
    for (let k = 1; k <= n; k++) {
      const j = (from + k) % n;
      if (!isDone(j)) return j;
    }
    return -1;
  };

  /** +1 l dhikr i */
  const count = (i: number, e?: { clientX: number; clientY: number }) => {
    const d = items[i];
    const cur = progress.get(cat.id, d.id);
    if (cur >= d.count) {
      if (prefs.haptics) buzz([6, 30, 6]);
      return;
    }
    const next = progress.inc(cat.id, d.id, d.count);
    if (next < d.count) { if (prefs.haptics) buzz(8); return; }

    // Dhikr tkemmel
    if (prefs.haptics) buzz([20, 40, 30]);
    const remaining = items.filter((x, j) => j !== i && progress.get(cat.id, x.id) < x.count).length;
    if (remaining === 0) {
      celebrate({ big: true, title: t("adhkar.complete.title"), subtitle: pick(cat.title, lang) });
      return;
    }
    if (e) celebrate({ x: e.clientX, y: e.clientY });
    if (prefs.autoNext && prefs.view === "focus") {
      const j = nextIncomplete(i);
      if (j >= 0) setTimeout(() => { setDir(j > i ? 1 : -1); setIdx(j); }, 650);
    }
  };

  // Clavier: espace / entrée = +1, ← → = navigation
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keys.current = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, select, button, a")) return;
      if (prefs.view !== "focus") return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); count(idx); }
      const rtl = lang === "ar";
      if (e.key === "ArrowRight") go(rtl ? idx - 1 : idx + 1);
      if (e.key === "ArrowLeft") go(rtl ? idx + 1 : idx - 1);
    };
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const reset = () => {
    progress.resetCategory(cat.id);
    setDir(-1);
    setIdx(0);
    toast(t("adhkar.resetDone"));
  };

  const nextCat = all[(all.findIndex((c) => c.id === cat.id) + 1) % all.length];

  const editor = isCustom(cat) ? (
    <CategoryEditor open={editing} initial={cat} onClose={() => setEditing(false)} onSave={custom.save}
      onDelete={(cid) => { router.push("/adhkar"); custom.remove(cid); }} />
  ) : null;

  return (
    <div className={styles.page} style={{ ["--h" as string]: cat.hue }}>
      {editor}
      {/* ===== Header ===== */}
      <header className={`glass-panel ${styles.head}`}>
        <div className={styles.headRow}>
          <Link href="/adhkar" className={styles.back}><ArrowLeft size={16} /> {t("adhkar.back")}</Link>
          <div className={styles.headTools}>
            <div className={styles.seg}>
              <button className={prefs.view === "focus" ? styles.segOn : ""} onClick={() => setPrefs({ view: "focus" })} title={t("adhkar.view.focus")}>
                <Square size={14} /> <span>{t("adhkar.view.focus")}</span>
              </button>
              <button className={prefs.view === "list" ? styles.segOn : ""} onClick={() => setPrefs({ view: "list" })} title={t("adhkar.view.list")}>
                <LayoutList size={14} /> <span>{t("adhkar.view.list")}</span>
              </button>
            </div>
            <div className={styles.settingsWrap}>
              <button className={`icon-btn ${settingsOpen ? styles.toolOn : ""}`} onClick={() => setSettingsOpen((v) => !v)} aria-expanded={settingsOpen} title={t("settings.title")}>
                <Settings2 size={16} />
              </button>
              <AnimatePresence>
                {settingsOpen && <SettingsPanel prefs={prefs} onChange={setPrefs} onClose={() => setSettingsOpen(false)} />}
              </AnimatePresence>
            </div>
            {isCustom(cat) && (
              <button className="icon-btn" onClick={() => setEditing(true)} title={t("custom.edit")} aria-label={t("custom.edit")}><Pencil size={15} /></button>
            )}
            <button className="icon-btn" onClick={reset} title={t("adhkar.reset")} aria-label={t("adhkar.reset")}><RotateCcw size={16} /></button>
          </div>
        </div>

        <div className={styles.titleRow}>
          <span className={styles.icon}><Icon size={26} /></span>
          <div className={styles.titleTxt}>
            <h1>{pick(cat.title, lang)}</h1>
            <p>{pick(cat.desc, lang)}</p>
          </div>
          <div className={styles.pctBox}>
            <strong>{Math.round(p.pct)}<small>%</small></strong>
            <span>{p.items}/{n}</span>
          </div>
        </div>
        <div className={styles.bar}><motion.i animate={{ width: `${p.pct}%` }} transition={{ duration: 0.6, ease: EASE }} /></div>
        {cat.intro && <p className={`${styles.intro} ${lang === "ar" ? "quran-text" : ""}`}>{pick(cat.intro, lang)}</p>}
      </header>

      {/* ===== Fin ===== */}
      <AnimatePresence>
        {allDone && (
          <motion.section className={styles.complete} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
            <span className={styles.completeIcon}><Sparkles size={26} /></span>
            <div>
              <h2>{t("adhkar.complete.title")}</h2>
              <p>{t("adhkar.complete.text", { cat: pick(cat.title, lang) })}</p>
            </div>
            <div className={styles.completeBtns}>
              <Link href={`/adhkar/${nextCat.id}`} className="btn-gold">{pick(nextCat.title, lang)} <ChevronRight size={16} className={styles.flip} /></Link>
              <button className="btn-ghost" onClick={reset}><RotateCcw size={15} /> {t("adhkar.complete.again")}</button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {prefs.view === "focus" ? (
        <>
          {/* Chips: dhikr b dhikr */}
          <div className={styles.chips}>
            {items.map((d, i) => (
              <button key={d.id} onClick={() => go(i)} aria-label={`${i + 1}`}
                className={`${styles.chip} ${i === idx ? styles.chipOn : ""} ${isDone(i) ? styles.chipDone : ""}`}>
                {isDone(i) ? <Check size={12} /> : i + 1}
              </button>
            ))}
          </div>

          <div className={styles.stage}>
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div key={items[idx].id} custom={dir}
                initial={{ opacity: 0, x: dir * 60, rotateY: dir * -8, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, rotateY: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: dir * -60, rotateY: dir * 8, filter: "blur(6px)" }}
                transition={{ duration: 0.45, ease: EASE }}
                style={{ transformPerspective: 1600 }}>
                <DhikrCard cat={cat} d={items[idx]} index={idx} total={n} prefs={prefs}
                  value={progress.get(cat.id, items[idx].id)} fav={fav.has(cat.id, items[idx].id)}
                  onFav={() => fav.toggle(cat.id, items[idx].id)} onCount={(e) => count(idx, e)} />
              </motion.div>
            </AnimatePresence>
          </div>

          <nav className={styles.nav}>
            <button className="btn-ghost" disabled={idx === 0} onClick={() => go(idx - 1)}><ChevronLeft size={16} className={styles.flip} /> {t("adhkar.prev")}</button>
            <span className={styles.navNum}>{idx + 1} / {n}</span>
            <button className="btn-ghost" disabled={idx === n - 1} onClick={() => go(idx + 1)}>{t("adhkar.next")} <ChevronRight size={16} className={styles.flip} /></button>
          </nav>
        </>
      ) : (
        <div className={styles.list}>
          {items.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, ease: EASE }}>
              <DhikrCard cat={cat} d={d} index={i} total={n} prefs={prefs} compact
                value={progress.get(cat.id, d.id)} fav={fav.has(cat.id, d.id)}
                onFav={() => fav.toggle(cat.id, d.id)} onCount={(e) => count(i, e)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================ Carte ============================ */

const DhikrCard = ({ cat, d, index, total, prefs, value, fav, onFav, onCount, compact = false }: {
  cat: AdhkarCategory; d: Dhikr; index: number; total: number; prefs: AdhkarPrefs; value: number;
  fav: boolean; onFav: () => void; onCount: (e?: { clientX: number; clientY: number }) => void; compact?: boolean;
}) => {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [fadlOpen, setFadlOpen] = useState(false);
  const [taps, setTaps] = useState<{ id: number; x: number; y: number }[]>([]);
  const done = value >= d.count;
  const pct = Math.min(100, (value / d.count) * 100);

  const tap = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = e.timeStamp;
    setTaps((l) => [...l.slice(-4), { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setTaps((l) => l.filter((x) => x.id !== id)), 700);
    onCount({ clientX: e.clientX, clientY: e.clientY });
  };

  const tr = lang !== "ar" ? pickTr(d, lang) : "";
  const text = `${d.ar}${tr ? `\n\n${tr}` : ""}${d.src ? `\n\n— ${d.src}` : ""}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast(t("common.copied")); } catch { /* bloqué */ }
  };
  const share = async () => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) { try { await nav.share({ text, title: pick(cat.title, lang) }); } catch { /* annulé */ } }
    else copy();
  };

  return (
    <article className={`${styles.card} ${compact ? styles.cardCompact : ""} ${done ? styles.cardDone : ""}`}>
      <div className={styles.cardTop}>
        <span className={styles.idx}>{index + 1} / {total}</span>
        <span className={styles.times}>×{d.count}</span>
        <span className={styles.spacer} />
        <motion.button whileTap={{ scale: 0.8 }} className={`icon-btn ${fav ? styles.favOn : ""}`} onClick={onFav} aria-pressed={fav} title={t("studio.favorite")}>
          <Heart size={15} fill={fav ? "currentColor" : "none"} />
        </motion.button>
        <button className="icon-btn" onClick={copy} title={t("common.copy")}><Copy size={15} /></button>
        <button className="icon-btn" onClick={share} title={t("adhkar.share")}><Share2 size={15} /></button>
      </div>

      {/* Zone dyal l-comptage: touch f ay blasa */}
      <div className={styles.tapZone} onClick={tap} role="button" tabIndex={-1} aria-label={t("adhkar.tapToCount")}>
        {taps.map((x) => <span key={x.id} className={styles.tapRipple} style={{ left: x.x, top: x.y }} aria-hidden />)}
        <p className={`quran-text ${styles.ar}`} style={{ fontSize: `${compact ? prefs.fontSize * 0.82 : prefs.fontSize}rem` }}>{d.ar}</p>
        {tr && prefs.showTr && <p className={styles.tr}>{tr}</p>}
      </div>

      <div className={styles.cardBottom}>
        <button className={`${styles.counter} ${done ? styles.counterDone : ""}`} onClick={(e) => onCount({ clientX: e.clientX, clientY: e.clientY })}
          aria-label={t("adhkar.tapToCount")}>
          <CountRing pct={pct} size={compact ? 64 : 92} />
          <span className={styles.counterNum}>
            {done ? <Check size={compact ? 22 : 30} /> : <><strong>{value}</strong><small>/{d.count}</small></>}
          </span>
        </button>
        <div className={styles.meta}>
          <span className={styles.state}>{done ? t("adhkar.done") : t("adhkar.remaining", { n: d.count - value })}</span>
          {d.src && <span className={styles.src}><BookOpenText size={13} /> {d.src}</span>}
          {d.fadl && (
            <button className={`${styles.fadlBtn} ${fadlOpen ? styles.fadlOn : ""}`} onClick={() => setFadlOpen((v) => !v)} aria-expanded={fadlOpen}>
              <Sparkles size={14} /> {t("adhkar.fadl")}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {d.fadl && fadlOpen && (
          <motion.div className={styles.fadl} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}>
            <div className={styles.fadlInner}>
              {lang !== "ar" && <p>{pick(d.fadl, lang)}</p>}
              <p className={`quran-text ${styles.fadlAr}`}>{d.fadl.ar}</p>
              {d.src && <small>— {d.src}</small>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!compact && !done && <p className={styles.hint}>{t("adhkar.tapToCount")}</p>}
    </article>
  );
};

/** Halqa sghira dyal l-3add (spring sri3) */
const CountRing = ({ pct, size }: { pct: number; size: number }) => {
  const stroke = size > 70 ? 6 : 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className={styles.ring} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,244,214,0.1)" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
        className={styles.ringFill} strokeDasharray={c}
        initial={false} animate={{ strokeDashoffset: c - (c * pct) / 100 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} />
    </svg>
  );
};

/* ============================ Réglages ============================ */

const SettingsPanel = ({ prefs, onChange, onClose }: { prefs: AdhkarPrefs; onChange: (p: Partial<AdhkarPrefs>) => void; onClose: () => void }) => {
  const { t, lang } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!box.current?.parentElement?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const toggles: { key: "showTr" | "autoNext" | "haptics"; label: string; hidden?: boolean }[] = [
    { key: "showTr", label: t("adhkar.translation"), hidden: lang === "ar" },
    { key: "autoNext", label: t("adhkar.autoNext") },
    { key: "haptics", label: t("adhkar.haptics") },
  ];

  return (
    <motion.div ref={box} className={styles.settings} initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.22, ease: EASE }}>
      <label className={styles.slider}>
        <span>{t("adhkar.fontSize")} <b>{Math.round(prefs.fontSize * 16)}px</b></span>
        <input type="range" min={1.2} max={3} step={0.1} value={prefs.fontSize}
          style={{ ["--p" as string]: `${((prefs.fontSize - 1.2) / 1.8) * 100}%` }}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })} />
      </label>
      {toggles.filter((x) => !x.hidden).map((x) => (
        <button key={x.key} className={styles.toggle} onClick={() => onChange({ [x.key]: !prefs[x.key] })} aria-pressed={prefs[x.key]}>
          <span>{x.label}</span>
          <i className={prefs[x.key] ? styles.swOn : ""}><b /></i>
        </button>
      ))}
    </motion.div>
  );
};