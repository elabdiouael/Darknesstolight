"use client";

// Page /adhkar: dhikr du moment, stats (l-yawm, série, 7 ayam), catégories (dyal l-app + dyalek),
// bibliothèque (ga3 l-adhkar), misbaha, favoris
import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Check, Flame, Heart, LayoutGrid, Library, Pencil, Plus, Sparkles, Trophy, UserRound } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { ADHKAR, AdhkarCategory, Dhikr, pick } from "@/lib/adhkar";
import { useAdhkarFavorites, useAdhkarProgress } from "@/lib/adhkarStore";
import { CustomCategory, isCustom, useAllCategories, useCustomAdhkar } from "@/lib/adhkarCustom";
import { CountUp, Tilt3D } from "@/components/common/Motion/Motion";
import { AdhkarNow, CATEGORY_ICONS } from "../AdhkarNow/AdhkarNow";
import { Misbaha } from "../Misbaha/Misbaha";
import { AdhkarLibrary } from "../AdhkarLibrary/AdhkarLibrary";
import { CategoryEditor } from "../CategoryEditor/CategoryEditor";
import styles from "./AdhkarHome.module.css";

type Tab = "categories" | "library" | "mine";

const EASE = [0.22, 1, 0.36, 1] as const;

export const AdhkarHome = () => {
  const { t, lang } = useI18n();
  const progress = useAdhkarProgress();
  const fav = useAdhkarFavorites();
  const custom = useCustomAdhkar();
  const all = useAllCategories();
  const [tab, setTab] = useState<Tab>("categories");
  const [editor, setEditor] = useState<{ open: boolean; initial: CustomCategory | null; seed: Dhikr | null }>({ open: false, initial: null, seed: null });
  const openNew = (seed: Dhikr | null = null) => setEditor({ open: true, initial: null, seed });
  const openEdit = (c: CustomCategory) => setEditor({ open: true, initial: c, seed: null });
  const maxWeek = Math.max(1, ...progress.week.map((w) => w.value));
  const locale = lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-FR";

  const stats = [
    { icon: Sparkles, value: progress.todayTotal, label: t("adhkar.stat.today") },
    { icon: Flame, value: progress.streak, label: t("adhkar.stat.streak") },
    { icon: Trophy, value: progress.completedToday, label: t("adhkar.stat.done"), suffix: `/${ADHKAR.length}` },
    { icon: Award, value: progress.lifetime, label: t("adhkar.stat.lifetime") },
  ];

  const favItems = fav.list.map((k) => {
    const [c, i] = k.split(":");
    const cat = all.find((x) => x.id === c);
    const idx = cat?.items.findIndex((d) => d.id === i) ?? -1;
    return cat && idx >= 0 ? { cat, item: cat.items[idx], idx } : null;
  }).filter(Boolean) as { cat: AdhkarCategory; item: Dhikr; idx: number }[];

  const TABS: { id: Tab; icon: React.ElementType; label: string; count?: number }[] = [
    { id: "categories", icon: LayoutGrid, label: t("adhkar.categories"), count: all.length },
    { id: "library", icon: Library, label: t("library.title"), count: all.reduce((n, c) => n + c.items.length, 0) },
    { id: "mine", icon: UserRound, label: t("custom.mineTab"), count: custom.list.length },
  ];

  return (
    <div className={styles.page}>
      {/* ===== Hero ===== */}
      <section className={styles.hero}>
        <div className={styles.heroTxt}>
          <motion.span className={`quran-text ${styles.kicker}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            فَاذْكُرُونِي أَذْكُرْكُمْ
          </motion.span>
          <motion.h1 className={`${styles.title} gold-text`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease: EASE }}>
            {t("adhkar.title")}
          </motion.h1>
          <motion.p className={styles.sub} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.16, ease: EASE }}>
            {t("adhkar.subtitle")}
          </motion.p>
        </div>

        <motion.div className={styles.stats} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.24, ease: EASE }}>
          {stats.map((s) => (
            <div key={s.label} className={`glass-panel fx-card ${styles.stat}`}>
              <s.icon size={18} />
              <strong><CountUp value={s.value} />{s.suffix && <small>{s.suffix}</small>}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      <div className={styles.nowRow}>
        <AdhkarNow />
        {/* 7 ayam l-akhra */}
        <div className={`glass-panel fx-card ${styles.week}`}>
          <span className={styles.weekTitle}>{t("adhkar.week")}</span>
          <div className={styles.bars}>
            {progress.week.map((w, i) => (
              <div key={w.date} className={styles.barCol} title={`${w.value}`}>
                <motion.i className={w.date === progress.today ? styles.barToday : ""}
                  initial={{ height: 0 }} animate={{ height: `${Math.max(6, (w.value / maxWeek) * 100)}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.06, ease: EASE }} />
                <small>{new Date(`${w.date}T12:00:00`).toLocaleDateString(locale, { weekday: "narrow" })}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Tabs: catégories / bibliothèque / dyali ===== */}
      <section>
        <div className={styles.tabs} role="tablist">
          {TABS.map((tb) => (
            <button key={tb.id} role="tab" aria-selected={tab === tb.id} className={`${styles.tab} ${tab === tb.id ? styles.tabOn : ""}`} onClick={() => setTab(tb.id)}>
              {tab === tb.id && <motion.span layoutId="adhkarTab" className={styles.tabPill} transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className={styles.tabInner}><tb.icon size={16} /> {tb.label} <small>{tb.count}</small></span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE }}>
            {tab === "categories" && (
              <div className={`fx-rail ${styles.grid}`}>
                {ADHKAR.map((c, i) => <CatCard key={c.id} c={c} i={i} onEdit={openEdit} />)}
                {custom.list.map((c, i) => <CatCard key={c.id} c={c} i={ADHKAR.length + i} onEdit={openEdit} />)}
                <NewCard onClick={() => openNew()} />
              </div>
            )}
            {tab === "library" && <AdhkarLibrary onCreateWith={(d) => openNew(d)} />}
            {tab === "mine" && (
              custom.list.length === 0 ? (
                <div className={`glass-panel ${styles.mineEmpty}`}>
                  <span className={`quran-text ${styles.mineAr}`}>وَاذْكُر رَّبَّكَ كَثِيرًا</span>
                  <p>{t("custom.empty")}</p>
                  <button className="btn-gold" onClick={() => openNew()}><Plus size={16} /> {t("custom.new")}</button>
                </div>
              ) : (
                <div className={`fx-rail ${styles.grid}`}>
                  {custom.list.map((c, i) => <CatCard key={c.id} c={c} i={i} onEdit={openEdit} />)}
                  <NewCard onClick={() => openNew()} />
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <Misbaha />

      {/* ===== Favoris ===== */}
      <section>
        <h2 className={styles.h2}><Heart size={20} /> {t("adhkar.favorites")}</h2>
        {favItems.length === 0 ? (
          <p className={`glass-panel ${styles.empty}`}>{t("adhkar.favorites.empty")}</p>
        ) : (
          <div className={`fx-rail ${styles.favs}`}>
            {favItems.map(({ cat, item, idx }) => (
              <Link key={`${cat.id}:${item.id}`} href={`/adhkar/${cat.id}?i=${idx}`} className={`glass-panel fx-card ${styles.fav}`} style={{ ["--h" as string]: cat.hue }}>
                <span className={styles.favCat}>{pick(cat.title, lang)} · ×{item.count}</span>
                <p className="quran-text">{item.ar}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <CategoryEditor open={editor.open} initial={editor.initial} seed={editor.seed}
        onClose={() => setEditor((e) => ({ ...e, open: false }))}
        onSave={custom.save} onDelete={custom.remove} />
    </div>
  );
};

/** Carte dyal catégorie (3D tilt) */
const CatCard = ({ c, i, onEdit }: { c: AdhkarCategory; i: number; onEdit: (c: CustomCategory) => void }) => {
  const { t, lang } = useI18n();
  const progress = useAdhkarProgress();
  const p = progress.catProgress(c);
  const Icon = CATEGORY_ICONS[c.icon];
  const done = p.pct >= 100;
  const mine = isCustom(c);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: Math.min(i, 8) * 0.05, ease: EASE }} className={styles.catWrap}>
      <Tilt3D className={styles.tilt} max={9} depth={24}>
        <Link href={`/adhkar/${c.id}`} className={`fx-card ${styles.cat} ${done ? styles.catDone : ""}`} style={{ ["--h" as string]: c.hue }}>
          <span className={styles.catShine} aria-hidden />
          <span className={styles.catIcon}><Icon size={22} /></span>
          {done && <span className={styles.catCheck}><Check size={14} /></span>}
          {mine && <span className={styles.mineTag}>{t("custom.mine")}</span>}
          <strong>{pick(c.title, lang)}</strong>
          {lang !== "ar" && !mine && <span className={`quran-text ${styles.catAr}`}>{c.title.ar}</span>}
          {pick(c.desc, lang) && <p>{pick(c.desc, lang)}</p>}
          <footer>
            <span>{t("adhkar.items", { n: c.items.length })}</span>
            <span>{p.items}/{c.items.length}</span>
          </footer>
          <span className={styles.catBar}><motion.i initial={{ width: 0 }} animate={{ width: `${p.pct}%` }} transition={{ duration: 1.2, ease: EASE }} /></span>
        </Link>
      </Tilt3D>
      {mine && (
        <button className={styles.editBtn} onClick={() => onEdit(c as CustomCategory)} aria-label={t("custom.edit")} title={t("custom.edit")}>
          <Pencil size={14} />
        </button>
      )}
    </motion.div>
  );
};

const NewCard = ({ onClick }: { onClick: () => void }) => {
  const { t } = useI18n();
  return (
    <motion.button className={styles.newCard} onClick={onClick} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
      <span className={styles.newIcon}><Plus size={26} /></span>
      <strong>{t("custom.new")}</strong>
      <small>{t("custom.newHint")}</small>
    </motion.button>
  );
};