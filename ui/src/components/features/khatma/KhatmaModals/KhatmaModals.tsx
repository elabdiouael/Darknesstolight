"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Crown, Link2, Loader2 } from "lucide-react";
import { Modal } from "@/components/common/Modal/Modal";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { TEMPLATE_LIST, TemplateId, getTemplate } from "@/lib/templates";
import { Khatma, khatmaService } from "@/services/api/khatmaService";
import { useToast } from "@/components/common/Toast/Toast";
import styles from "./KhatmaModals.module.css";

/* ===================== Création ===================== */
export const CreateKhatmaModal = ({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (k: Khatma) => void;
}) => {
  const { t } = useI18n();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<TemplateId>("fajr");
  const [days, setDays] = useState(30);
  const [custom, setCustom] = useState(false);
  const [busy, setBusy] = useState(false);

  const pick = (id: TemplateId) => {
    setTemplate(id);
    if (!custom) setDays(getTemplate(id).defaultDays);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const k = await khatmaService.create({ title: title.trim() || t(`tpl.${template}` as DictKey), template, targetDays: days });
      onCreated(k);
      setTitle("");
      onClose();
    } catch {
      toast(t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  };

  const presets = [7, 15, 30, 60];
  const tpl = getTemplate(template);

  return (
    <Modal open={open} onClose={onClose} title={t("create.title")} width={640}>
      <form onSubmit={submit} className={styles.form}>
        <label className={styles.label}>{t("create.name")}</label>
        <input
          className={styles.input}
          value={title}
          maxLength={60}
          placeholder={t("create.namePh")}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <label className={styles.label}>{t("create.template")}</label>
        <div className={styles.templates}>
          {TEMPLATE_LIST.map((tp) => (
            <motion.button
              type="button"
              key={tp.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => pick(tp.id)}
              className={`${styles.tpl} ${template === tp.id ? styles.tplOn : ""}`}
              style={{
                background: `radial-gradient(120% 100% at 100% 0%, ${tp.glow}, transparent 60%), linear-gradient(150deg, ${tp.from}, ${tp.to})`,
                ["--acc" as string]: tp.accent,
              }}
            >
              <span className={styles.tplGlyph} style={{ color: tp.accent }}>{tp.glyph}</span>
              <strong>{t(`tpl.${tp.id}` as DictKey)}</strong>
              <small>{t(`tpl.${tp.id}.desc` as DictKey)}</small>
              {template === tp.id && (
                <motion.span layoutId="tplCheck" className={styles.tplCheck}><Check size={14} /></motion.span>
              )}
            </motion.button>
          ))}
        </div>

        <label className={styles.label}>{t("create.goal")}</label>
        <div className={styles.chips}>
          {presets.map((p) => (
            <button
              type="button"
              key={p}
              className={`${styles.chip} ${!custom && days === p ? styles.chipOn : ""}`}
              onClick={() => { setCustom(false); setDays(p); }}
            >
              {p} {t("common.days")}
            </button>
          ))}
          <button type="button" className={`${styles.chip} ${custom ? styles.chipOn : ""}`} onClick={() => setCustom(true)}>
            {t("create.custom")}
          </button>
          {custom && (
            <input
              type="number" min={1} max={365}
              className={`${styles.input} ${styles.days}`}
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
            />
          )}
        </div>
        <p className={styles.pace} style={{ color: tpl.accent }}>
          ≈ {t("card.pace", { n: Math.ceil(6236 / days) })}
        </p>

        <button className="btn-gold" disabled={busy} type="submit" style={{ width: "100%", marginTop: 8 }}>
          {busy ? <Loader2 size={18} className={styles.spin} /> : null}
          {t("create.submit")}
        </button>
      </form>
    </Modal>
  );
};

/* ===================== Rejoindre ===================== */
const toChars = (code: string) =>
  code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6).padEnd(6, " ").split("").map((x) => x.trim());

export const JoinKhatmaModal = ({ open, onClose, onJoined, initialCode = "" }: {
  open: boolean; onClose: () => void; onJoined: (k: Khatma) => void; initialCode?: string;
}) => {
  const { t } = useI18n();
  // L-form kat-tmonta m3a kol ouverture -> state jdid (bla reset f effect)
  return (
    <Modal open={open} onClose={onClose} title={t("join.title")} width={480}>
      <JoinForm initialCode={initialCode} onClose={onClose} onJoined={onJoined} />
    </Modal>
  );
};

const JoinForm = ({ initialCode, onClose, onJoined }: {
  initialCode: string; onClose: () => void; onJoined: (k: Khatma) => void;
}) => {
  const { t } = useI18n();
  const toast = useToast();
  const [chars, setChars] = useState<string[]>(() => toChars(initialCode));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setAt = (i: number, v: string) => {
    const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length > 1) {
      // Paste dyal code kaml
      setChars(toChars(clean));
      refs.current[Math.min(clean.length, 5)]?.focus();
      return;
    }
    const next = [...chars];
    next[i] = clean;
    setChars(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const code = chars.join("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      const k = await khatmaService.join(code);
      toast(t("join.ok", { title: k.title }));
      onJoined(k);
      onClose();
    } catch {
      setError(t("join.notFound"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <p className={styles.muted}>{t("join.text")}</p>
      <div className={styles.codeRow} dir="ltr">
        {chars.map((c, i) => (
          <motion.input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            className={`${styles.codeBox} ${c ? styles.codeFilled : ""}`}
            value={c}
            inputMode="text"
            autoComplete="off"
            maxLength={6}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !c && i > 0) refs.current[i - 1]?.focus(); }}
            animate={error ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button className="btn-gold" disabled={busy || code.length !== 6} type="submit" style={{ width: "100%" }}>
        {busy ? <Loader2 size={18} className={styles.spin} /> : null}
        {t("join.submit")}
      </button>
    </form>
  );
};

/* ===================== Partage ===================== */
export const ShareKhatmaModal = ({ open, onClose, khatma, onUpdated }: {
  open: boolean; onClose: () => void; khatma: Khatma | null; onUpdated: (k: Khatma) => void;
}) => {
  const { t } = useI18n();
  const toast = useToast();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    if (open && khatma && !khatma.inviteCode) {
      khatmaService.share(khatma.id).then(onUpdated).catch(() => toast(t("common.error"), "error"));
    }
  }, [open, khatma, onUpdated, toast, t]);

  const code = khatma?.inviteCode;
  const link = code && typeof window !== "undefined" ? `${window.location.origin}/khatma?join=${code}` : "";

  const copy = async (what: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(what === "code" ? code ?? "" : link);
      setCopied(what);
      setTimeout(() => setCopied(null), 1600);
    } catch { /* clipboard bloqué */ }
  };

  const tpl = getTemplate(khatma?.template);

  return (
    <Modal open={open} onClose={onClose} title={t("share.title")} width={520}>
      <p className={styles.muted}>{t("share.text")}</p>

      <div className={styles.codeShow} style={{ ["--acc" as string]: tpl.accent, ["--glow" as string]: tpl.glow }} dir="ltr">
        {code ? code.split("").map((c, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 14, rotateX: -90 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 20 }}>{c}</motion.span>
        )) : <Loader2 className={styles.spin} />}
      </div>

      <div className={styles.shareBtns}>
        <button className="btn-gold" onClick={() => copy("code")} disabled={!code}>
          {copied === "code" ? <Check size={16} /> : <Copy size={16} />}
          {copied === "code" ? t("common.copied") : t("common.copy")}
        </button>
        <button className="btn-ghost" onClick={() => copy("link")} disabled={!code}>
          {copied === "link" ? <Check size={16} /> : <Link2 size={16} />}
          {copied === "link" ? t("common.copied") : t("share.link")}
        </button>
      </div>

      {khatma && (
        <>
          <h4 className={styles.label} style={{ marginTop: 26 }}>{t("share.members")} · {khatma.members.length}</h4>
          <ul className={styles.members}>
            {khatma.members.map((m) => (
              <li key={m.id}>
                <span className={styles.avatar}>{m.username.slice(0, 1).toUpperCase()}</span>
                <span>{m.username}</span>
                {m.owner && <span className={styles.owner}><Crown size={12} /> {t("share.owner")}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
};