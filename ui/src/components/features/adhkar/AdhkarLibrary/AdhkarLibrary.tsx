"use client";

// Bibliothèque: ga3 l-adhkar dyal ga3 les catégories f blasa wa7da — recherche, filtre, fadl, masdar,
// favoris, w "zid l catégorie dyali"
import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, ChevronDown, FolderPlus, Heart, Play, Plus, Search, Sparkles, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/components/common/Toast/Toast";
import { AdhkarCategory, Dhikr, pick, pickTr } from "@/lib/adhkar";
import { useAdhkarFavorites } from "@/lib/adhkarStore";
import { isCustom, useAllCategories, useCustomAdhkar } from "@/lib/adhkarCustom";
import { CATEGORY_ICONS } from "../AdhkarNow/AdhkarNow";
import styles from "./AdhkarLibrary.module.css";

interface Props {
  onCreateWith: (d: Dhikr) => void;   // "Nouvelle catégorie" b had d-dhikr
}

export const AdhkarLibrary = ({ onCreateWith }: Props) => {
  const { t, lang } = useI18n();
  const all = useAllCategories();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all
      .filter((c) => filter === "all" || c.id === filter)
      .map((c) => ({
        cat: c,
        items: c.items
          .map((d, idx) => ({ d, idx }))
          .filter(({ d }) => {
            if (!s) return true;
            const hay = `${d.ar} ${d.tr.fr} ${d.tr.en} ${d.fadl?.fr ?? ""} ${d.fadl?.en ?? ""} ${d.src}`.toLowerCase();
            return hay.includes(s) || d.ar.includes(q.trim());
          }),
      }))
      .filter((g) => g.items.length > 0);
  }, [all, q, filter]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <label className={styles.search}>
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("library.search")} />
          {q && <button onClick={() => setQ("")} aria-label="clear"><X size={14} /></button>}
          <span className={styles.count}>{total}</span>
        </label>
        <div className={styles.filters}>
          <button className={filter === "all" ? styles.fOn : ""} onClick={() => setFilter("all")}>{t("library.all")}</button>
          {all.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon];
            return (
              <button key={c.id} className={filter === c.id ? styles.fOn : ""} onClick={() => setFilter(c.id)} style={{ ["--h" as string]: c.hue }}>
                <Icon size={13} /> {pick(c.title, lang)}
              </button>
            );
          })}
        </div>
      </div>

      {groups.length === 0 && <p className={`glass-panel ${styles.empty}`}>{t("library.empty")}</p>}

      {groups.map(({ cat, items }) => (
        <Group key={cat.id} cat={cat} items={items} onCreateWith={onCreateWith} />
      ))}
    </div>
  );
};

const Group = ({ cat, items, onCreateWith }: { cat: AdhkarCategory; items: { d: Dhikr; idx: number }[]; onCreateWith: (d: Dhikr) => void }) => {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(true);
  const Icon = CATEGORY_ICONS[cat.icon];
  return (
    <section className={styles.group} style={{ ["--h" as string]: cat.hue }}>
      <header className={styles.gHead}>
        <button className={styles.gToggle} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className={styles.gIcon}><Icon size={18} /></span>
          <span className={styles.gTitle}>
            <strong>{pick(cat.title, lang)}</strong>
            <small>{t("adhkar.items", { n: items.length })}{isCustom(cat) ? ` · ${t("custom.mine")}` : ""}</small>
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={18} /></motion.span>
        </button>
        <Link href={`/adhkar/${cat.id}`} className={styles.gGo}><Play size={14} /> {t("adhkar.start")}</Link>
      </header>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ol className={styles.list} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            {items.map(({ d, idx }) => <Row key={d.id} cat={cat} d={d} idx={idx} onCreateWith={onCreateWith} />)}
          </motion.ol>
        )}
      </AnimatePresence>
    </section>
  );
};

const Row = ({ cat, d, idx, onCreateWith }: { cat: AdhkarCategory; d: Dhikr; idx: number; onCreateWith: (d: Dhikr) => void }) => {
  const { t, lang } = useI18n();
  const toast = useToast();
  const fav = useAdhkarFavorites();
  const custom = useCustomAdhkar();
  const [expanded, setExpanded] = useState(false);
  const [fadl, setFadl] = useState(false);
  // Menu f portal (position fixed) bach ma yt9ta3ch b overflow dyal l-groupe
  const [menu, setMenu] = useState<{ top: number; right: number } | null>(null);
  const isFav = fav.has(cat.id, d.id);
  const tr = lang !== "ar" ? pickTr(d, lang) : "";
  const targets = custom.list.filter((c) => c.id !== cat.id);

  return (
    <li className={styles.row}>
      <span className={styles.idx}>{idx + 1}</span>
      <div className={styles.body}>
        <p className={`quran-text ${styles.ar} ${expanded ? styles.arOpen : ""}`} onClick={() => setExpanded((v) => !v)}>{d.ar}</p>
        {tr && <p className={styles.tr}>{tr}</p>}
        <div className={styles.meta}>
          <span className={styles.times}>×{d.count}</span>
          {d.src && <span className={styles.src}><BookOpenText size={12} /> {d.src}</span>}
          {d.fadl && (
            <button className={`${styles.chip} ${fadl ? styles.chipOn : ""}`} onClick={() => setFadl((v) => !v)}><Sparkles size={12} /> {t("adhkar.fadl")}</button>
          )}
        </div>
        <AnimatePresence>
          {d.fadl && fadl && (
            <motion.div className={styles.fadl} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div>
                {lang !== "ar" && <p>{pick(d.fadl, lang)}</p>}
                <p className="quran-text">{d.fadl.ar}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className={styles.actions}>
        <Link href={`/adhkar/${cat.id}?i=${idx}`} className="icon-btn" title={t("adhkar.start")} aria-label={t("adhkar.start")}><Play size={15} /></Link>
        <motion.button whileTap={{ scale: 0.8 }} className={`icon-btn ${isFav ? styles.favOn : ""}`} onClick={() => fav.toggle(cat.id, d.id)}
          title={t("studio.favorite")} aria-pressed={isFav}>
          <Heart size={15} fill={isFav ? "currentColor" : "none"} />
        </motion.button>
        <div className={styles.menuWrap}>
          <button className={`icon-btn ${menu ? styles.menuOn : ""}`} title={t("library.addTo")} aria-expanded={!!menu}
            onClick={(e) => {
              if (menu) { setMenu(null); return; }
              const r = e.currentTarget.getBoundingClientRect();
              setMenu({ top: Math.max(12, Math.min(r.top, window.innerHeight - 60 - (targets.length + 2) * 38)), right: window.innerWidth - r.left + 8 });
            }}>
            <FolderPlus size={15} />
          </button>
          {typeof document !== "undefined" && createPortal(
            <AnimatePresence>
              {menu && (
                <>
                  <div className={styles.menuScrim} onClick={() => setMenu(null)} />
                  <motion.div className={styles.menu} style={{ top: menu.top, right: menu.right }}
                    initial={{ opacity: 0, x: 8, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 8, scale: 0.96 }}>
                    <span className={styles.menuTitle}>{t("library.addTo")}</span>
                    {targets.map((c) => (
                      <button key={c.id} onClick={() => { custom.addItem(c.id, d); setMenu(null); toast(t("custom.addedTo", { cat: pick(c.title, lang) })); }}>
                        <span className={styles.dot} style={{ ["--h" as string]: c.hue }} /> {pick(c.title, lang)}
                      </button>
                    ))}
                    <button className={styles.menuNew} onClick={() => { setMenu(null); onCreateWith(d); }}>
                      <Plus size={14} /> {t("custom.new")}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body,
          )}
        </div>
      </div>
    </li>
  );
};