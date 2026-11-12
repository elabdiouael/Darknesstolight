"use client";

// Configuration dyal l-programme dyal l-mouraja3a: tari9a (SM-2 / Manzil), preset, w kol réglage b slider
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Check, Layers, Loader2 } from "lucide-react";
import { Modal } from "@/components/common/Modal/Modal";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { useToast } from "@/components/common/Toast/Toast";
import { PRESETS, previewIntervals } from "@/lib/hifdPlans";
import { HifdMethod, HifdPlan, HifdPreset, hifdService } from "@/services/api/khatmaService";
import styles from "./HifdPlanModal.module.css";

interface Props { open: boolean; plan: HifdPlan; onClose: () => void; onSaved: (p: HifdPlan) => void }

export const HifdPlanModal = ({ open, plan, onClose, onSaved }: Props) => {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t("plan.title")} width={680}>
      {/* key: form jdida b l-plan l-7ali kol merra t-t7el */}
      {open && <PlanForm key={JSON.stringify(plan)} plan={plan} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
};

type NumKey = "dailyNew" | "dailyReview" | "intervalFactor" | "maxInterval" | "passThreshold" | "manzilDays" | "recentDays" | "hintWords";

const SLIDERS: { key: NumKey; min: number; max: number; step: number; only?: HifdMethod; fmt?: (v: number) => string }[] = [
  { key: "dailyNew", min: 1, max: 20, step: 1 },
  { key: "dailyReview", min: 5, max: 150, step: 5 },
  { key: "passThreshold", min: 50, max: 100, step: 5, fmt: (v) => `${v}%` },
  { key: "hintWords", min: 0, max: 3, step: 1 },
  { key: "intervalFactor", min: 0.5, max: 2, step: 0.1, only: "SM2", fmt: (v) => `×${v.toFixed(1)}` },
  { key: "maxInterval", min: 7, max: 180, step: 1, only: "SM2" },
  { key: "recentDays", min: 1, max: 30, step: 1, only: "MANZIL" },
  { key: "manzilDays", min: 3, max: 30, step: 1, only: "MANZIL" },
];

const PlanForm = ({ plan, onClose, onSaved }: Omit<Props, "open">) => {
  const { t } = useI18n();
  const toast = useToast();
  const [p, setP] = useState<HifdPlan>(plan);
  const [busy, setBusy] = useState(false);

  const setPreset = (preset: HifdPreset) => {
    if (preset === "CUSTOM") setP((x) => ({ ...x, preset }));
    else setP((x) => ({ ...x, preset, ...PRESETS[preset] }));
  };
  const setNum = (k: NumKey, v: number) => setP((x) => ({ ...x, [k]: v, preset: "CUSTOM" }));

  const save = async () => {
    setBusy(true);
    try {
      const saved = await hifdService.updatePlan(p);
      onSaved(saved);
      toast(t("plan.saved"));
      onClose();
    } catch {
      toast(t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  };

  const ladder = previewIntervals(p);

  return (
    <div className={styles.form}>
      <label className={styles.label}>{t("plan.method")}</label>
      <div className={styles.methods}>
        {(["SM2", "MANZIL"] as HifdMethod[]).map((m) => (
          <motion.button key={m} type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
            className={`${styles.method} ${p.method === m ? styles.on : ""}`} onClick={() => setP((x) => ({ ...x, method: m }))}>
            <span className={styles.mIcon}>{m === "SM2" ? <Brain size={20} /> : <Layers size={20} />}</span>
            <strong>{t(`plan.method.${m}` as DictKey)}</strong>
            <small>{t(`plan.method.${m}.desc` as DictKey)}</small>
            {p.method === m && <motion.span layoutId="methodCheck" className={styles.check}><Check size={13} /></motion.span>}
          </motion.button>
        ))}
      </div>

      <label className={styles.label}>{t("plan.preset")}</label>
      <div className={styles.chips}>
        {(["INTENSIVE", "BALANCED", "LIGHT", "CUSTOM"] as HifdPreset[]).map((pr) => (
          <button key={pr} type="button" className={`${styles.chip} ${p.preset === pr ? styles.chipOn : ""}`} onClick={() => setPreset(pr)}>
            {t(`plan.preset.${pr}` as DictKey)}
          </button>
        ))}
      </div>

      <div className={styles.sliders}>
        {SLIDERS.filter((s) => !s.only || s.only === p.method).map((s) => {
          const v = p[s.key];
          const pct = ((v - s.min) / (s.max - s.min)) * 100;
          return (
            <label key={s.key} className={styles.slider}>
              <span className={styles.sHead}>
                <span>{t(`plan.${s.key}` as DictKey)}</span>
                <strong>{s.fmt ? s.fmt(v) : v}</strong>
              </span>
              <input type="range" min={s.min} max={s.max} step={s.step} value={v}
                style={{ ["--p" as string]: `${pct}%` }}
                onChange={(e) => setNum(s.key, Number(e.target.value))} />
              <small>{t(`plan.${s.key}.desc` as DictKey)}</small>
            </label>
          );
        })}
      </div>

      <div className={styles.preview}>
        <span className={styles.label}>{t("plan.preview")}</span>
        <div className={styles.ladder}>
          {ladder.map((d, i) => (
            <motion.span key={`${i}-${d}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <i>{i + 1}</i>{d}{t("plan.dayShort")}
            </motion.span>
          ))}
        </div>
      </div>

      <button className="btn-gold" onClick={save} disabled={busy} style={{ width: "100%" }}>
        {busy ? <Loader2 size={18} className="spin-anim" /> : <Check size={18} />} {t("common.save")}
      </button>
    </div>
  );
};