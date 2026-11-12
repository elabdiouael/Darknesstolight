"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/common/Modal/Modal";
import { useI18n } from "@/i18n/I18nProvider";
import { DEFAULT_PLAN } from "@/lib/hifdPlans";
import { HifdPlan, hifdService } from "@/services/api/khatmaService";
import { TasmiaItem, TasmiaSession } from "../TasmiaSession/TasmiaSession";

// Plan kayt-charja merra wa7da (cache) — l-modal kay-7tajo l-indices w s-seuil
let planCache: Promise<HifdPlan> | null = null;
export const loadPlanCached = (fresh = false) => {
  if (!planCache || fresh) {
    planCache = hifdService.plan().catch(() => { planCache = null; return DEFAULT_PLAN; });
  }
  return planCache;
};

interface Props {
  open: boolean;
  items: TasmiaItem[];
  title?: string;
  reciter?: string;
  onClose: () => void;
  onDone?: () => void;
}

export const TasmiaModal = ({ open, items, title, reciter, onClose, onDone }: Props) => {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={title ?? t("tasmia.title")} width={720}>
      {open && <PlanGate key={items.map((i) => `${i.surah}:${i.ayah}`).join(",")} items={items} reciter={reciter} onClose={onClose} onDone={onDone} />}
    </Modal>
  );
};

const PlanGate = ({ items, reciter, onClose, onDone }: Omit<Props, "open" | "title">) => {
  const [plan, setPlan] = useState<HifdPlan | null>(null);
  useEffect(() => {
    let alive = true;
    loadPlanCached().then((p) => alive && setPlan(p));
    return () => { alive = false; };
  }, []);
  if (!plan) return <div style={{ display: "grid", placeItems: "center", minHeight: 200 }}><Loader2 className="spin-anim" /></div>;
  return (
    <TasmiaSession items={items} hintWords={plan.hintWords} passThreshold={plan.passThreshold}
      reciter={reciter} onClose={onClose} onDone={onDone} />
  );
};