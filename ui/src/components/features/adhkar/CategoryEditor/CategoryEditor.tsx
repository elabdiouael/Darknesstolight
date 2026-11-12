"use client";

// Éditeur dyal catégorie personnelle: smiya, wasf, icône, loun, w l-adhkar (zid / beddel / rtteb b drag / msa7),
// + zid mn l-bibliothèque dyal l-app
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, Reorder, useDragControls } from "framer-motion";
import { BookPlus, Check, GripVertical, Minus, Plus, Search, Trash2 } from "lucide-react";
import { Modal } from "@/components/common/Modal/Modal";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/components/common/Toast/Toast";
import { ADHKAR, Dhikr, pick } from "@/lib/adhkar";
import { blankCategory, blankDhikr, copyDhikr, CUSTOM_HUES, CUSTOM_ICONS, CustomCategory } from "@/lib/adhkarCustom";
import { CATEGORY_ICONS } from "../AdhkarNow/AdhkarNow";
import styles from "./CategoryEditor.module.css";

interface Props {
  open: boolean;
  initial: CustomCategory | null;     // null = jdida
  seed?: Dhikr | null;                // dhikr bach nbdaw bih (mn l-bibliothèque)
  onClose: () => void;
  onSave: (c: CustomCategory) => void;
  onDelete?: (id: string) => void;
}

export const CategoryEditor = ({ open, initial, seed, onClose, onSave, onDelete }: Props) => {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={initial ? t("custom.edit") : t("custom.new")} width={680}>
      {open && <Editor key={initial?.id ?? "new"} initial={initial} seed={seed ?? null} onClose={onClose} onSave={onSave} onDelete={onDelete} />}
    </Modal>
  );
};

const Editor = ({ initial, seed, onClose, onSave, onDelete }: Omit<Props, "open"> & { seed: Dhikr | null }) => {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [draft, setDraft] = useState<CustomCategory>(() => {
    if (initial) return { ...initial, items: initial.items.map((d) => ({ ...d, tr: { ...d.tr } })) };
    const c = blankCategory();
    c.items = seed ? [copyDhikr(seed)] : [blankDhikr()];
    return c;
  });
  const [picker, setPicker] = useState(false);
  const [q, setQ] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const title = draft.title.fr;
  const setTitle = (v: string) => setDraft((d) => ({ ...d, title: { fr: v, en: v, ar: v } }));
  const setDesc = (v: string) => setDraft((d) => ({ ...d, desc: { fr: v, en: v, ar: v } }));
  const updateItem = (id: string, patch: Partial<Dhikr>) =>
    setDraft((d) => ({ ...d, items: d.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const removeItem = (id: string) => setDraft((d) => ({ ...d, items: d.items.filter((x) => x.id !== id) }));
  const addBlank = () => setDraft((d) => ({ ...d, items: [...d.items, blankDhikr()] }));
  const addFrom = (src: Dhikr) => {
    setDraft((d) => ({ ...d, items: [...d.items.filter((x) => x.ar.trim()), copyDhikr(src)] }));
    toast(t("custom.added"));
  };

  // Bibliothèque: recherche f l-3arbiya, traduction w smiyat l-catégories
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out: { cat: string; d: Dhikr }[] = [];
    ADHKAR.forEach((c) => c.items.forEach((d) => {
      const hay = `${d.ar} ${d.tr.fr} ${d.tr.en} ${c.title.fr} ${c.title.en} ${c.title.ar}`.toLowerCase();
      if (!s || hay.includes(s) || d.ar.includes(q.trim())) out.push({ cat: pick(c.title, lang), d });
    }));
    return out.slice(0, 40);
  }, [q, lang]);

  const valid = title.trim().length > 0 && draft.items.some((d) => d.ar.trim());

  const save = () => {
    if (!valid) return;
    onSave({ ...draft, items: draft.items.filter((d) => d.ar.trim()).map((d) => ({ ...d, count: Math.max(1, d.count || 1) })) });
    toast(t("custom.saved"));
    onClose();
  };

  const Icon = CATEGORY_ICONS[draft.icon];

  return (
    <div className={styles.wrap} style={{ ["--h" as string]: draft.hue }}>
      {/* ---- Aperçu + smiya ---- */}
      <div className={styles.top}>
        <motion.span className={styles.preview} key={`${draft.icon}-${draft.hue}`} initial={{ scale: 0.8, rotate: -8 }} animate={{ scale: 1, rotate: 0 }}>
          <Icon size={28} />
        </motion.span>
        <div className={styles.fields}>
          <input className={styles.title} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("custom.titlePh")} maxLength={60} autoFocus />
          <input className={styles.desc} value={draft.desc.fr} onChange={(e) => setDesc(e.target.value)} placeholder={t("custom.descPh")} maxLength={140} />
        </div>
      </div>

      <div className={styles.pickers}>
        <div className={styles.icons}>
          {CUSTOM_ICONS.map((ic) => {
            const I = CATEGORY_ICONS[ic];
            return (
              <button key={ic} className={draft.icon === ic ? styles.on : ""} onClick={() => setDraft((d) => ({ ...d, icon: ic }))} aria-label={ic}>
                <I size={16} />
              </button>
            );
          })}
        </div>
        <div className={styles.hues}>
          {CUSTOM_HUES.map((h) => (
            <button key={h} className={draft.hue === h ? styles.hueOn : ""} style={{ ["--hh" as string]: h }}
              onClick={() => setDraft((d) => ({ ...d, hue: h }))} aria-label={`hue ${h}`} />
          ))}
        </div>
      </div>

      {/* ---- Adhkar (drag bach t-rtteb) ---- */}
      <div className={styles.listHead}>
        <strong>{t("custom.items")} <small>{draft.items.length}</small></strong>
        <div className={styles.listBtns}>
          <button className="btn-ghost" onClick={() => setPicker((v) => !v)}><BookPlus size={15} /> {t("custom.fromLibrary")}</button>
          <button className="btn-ghost" onClick={addBlank}><Plus size={15} /> {t("custom.addDhikr")}</button>
        </div>
      </div>

      <AnimatePresence>
        {picker && (
          <motion.div className={styles.picker} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <label className={styles.search}><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("library.search")} /></label>
            <ul className={styles.results}>
              {results.map(({ cat, d }, i) => (
                <li key={`${cat}-${d.id}-${i}`}>
                  <button onClick={() => addFrom(d)}>
                    <span className={`quran-text ${styles.rAr}`}>{d.ar}</span>
                    <small>{cat} · ×{d.count}</small>
                    <Plus size={15} className={styles.rPlus} />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <Reorder.Group axis="y" values={draft.items} onReorder={(items) => setDraft((d) => ({ ...d, items }))} className={styles.items}>
        {draft.items.map((d, i) => (
          <ItemRow key={d.id} d={d} index={i} onChange={(p) => updateItem(d.id, p)} onRemove={() => removeItem(d.id)} />
        ))}
      </Reorder.Group>

      {/* ---- Footer ---- */}
      <footer className={styles.foot}>
        {initial && onDelete && (
          confirmDel ? (
            <button className={styles.danger} onClick={() => { onDelete(initial.id); onClose(); }}><Trash2 size={15} /> {t("custom.confirmDelete")}</button>
          ) : (
            <button className={styles.dangerGhost} onClick={() => setConfirmDel(true)}><Trash2 size={15} /> {t("profile.delete")}</button>
          )
        )}
        <span className={styles.spacer} />
        <button className="btn-ghost" onClick={onClose}>{t("common.cancel")}</button>
        <button className="btn-gold" onClick={save} disabled={!valid}><Check size={16} /> {t("common.save")}</button>
      </footer>
    </div>
  );
};

const ItemRow = ({ d, index, onChange, onRemove }: { d: Dhikr; index: number; onChange: (p: Partial<Dhikr>) => void; onRemove: () => void }) => {
  const { t } = useI18n();
  const controls = useDragControls();
  return (
    <Reorder.Item value={d} dragListener={false} dragControls={controls} className={styles.item}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.8)" }}>
      <div className={styles.itemSide}>
        <button className={styles.grip} onPointerDown={(e) => controls.start(e)} aria-label="drag"><GripVertical size={16} /></button>
        <span className={styles.num}>{index + 1}</span>
      </div>
      <div className={styles.itemBody}>
        <textarea className={`quran-text ${styles.ar}`} dir="rtl" value={d.ar} onChange={(e) => onChange({ ar: e.target.value })}
          placeholder="سُبْحَانَ اللَّهِ وَبِحَمْدِهِ" rows={2} />
        <div className={styles.itemRow}>
          <div className={styles.count}>
            <button onClick={() => onChange({ count: Math.max(1, d.count - 1) })} aria-label="-"><Minus size={13} /></button>
            <input type="number" min={1} max={10000} value={d.count}
              onChange={(e) => onChange({ count: Math.max(1, Math.min(10000, Number(e.target.value) || 1)) })} />
            <button onClick={() => onChange({ count: Math.min(10000, d.count + 1) })} aria-label="+"><Plus size={13} /></button>
          </div>
          {[33, 100].map((n) => (
            <button key={n} className={`${styles.quick} ${d.count === n ? styles.on : ""}`} onClick={() => onChange({ count: n })}>×{n}</button>
          ))}
          <span className={styles.spacer} />
          <button className={`icon-btn ${styles.del}`} onClick={onRemove} aria-label={t("profile.delete")}><Trash2 size={15} /></button>
        </div>
        <input className={styles.note} value={d.tr.fr} onChange={(e) => onChange({ tr: { fr: e.target.value, en: e.target.value } })}
          placeholder={t("custom.notePh")} maxLength={300} />
        <input className={styles.note} value={d.src} onChange={(e) => onChange({ src: e.target.value })}
          placeholder={t("custom.srcPh")} maxLength={80} />
      </div>
    </Reorder.Item>
  );
};