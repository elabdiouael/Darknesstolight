"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/common/Input/Input";
import { LangSwitcher } from "@/components/common/LangSwitcher/LangSwitcher";
import { authService } from "@/services/api/authService";
import { useI18n } from "@/i18n/I18nProvider";
import { useHydrated } from "@/lib/useHydrated";
import styles from "./AuthForm.module.css";

export const AuthForm = () => {
  const router = useRouter();
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const hydrated = useHydrated();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = isLogin
        ? await authService.login({ email: formData.email, password: formData.password })
        : await authService.register(formData);
      localStorage.setItem("token", res.token);
      router.push("/home");
    } catch {
      setError(t("auth.error"));
      setBusy(false);
    }
  };

  if (!hydrated) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-panel nour-border ${styles.formContainer}`}
    >
      <div className={styles.lang}><LangSwitcher /></div>

      <motion.p className={`quran-text ${styles.verse}`} animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 5, repeat: Infinity }}>
        ٱللَّهُ نُورُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ
      </motion.p>

      <AnimatePresence mode="wait">
        <motion.h2 key={isLogin ? "l" : "r"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className={`${styles.title} gold-text`}>
          {isLogin ? t("auth.welcome") : t("auth.create")}
        </motion.h2>
      </AnimatePresence>
      <p className={styles.subtitle}>{t("auth.subtitle")}</p>

      {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.error}>{error}</motion.p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <AnimatePresence initial={false}>
          {!isLogin && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <Input
                label={t("auth.username")}
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Input
          label={t("auth.email")}
          type="email"
          placeholder="nom@mail.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <Input
          label={t("auth.password")}
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />

        <button type="submit" className="btn-gold" disabled={busy} style={{ marginTop: 8 }}>
          {busy && <Loader2 size={18} className={styles.spin} />}
          {isLogin ? t("auth.login") : t("auth.register")}
        </button>
      </form>

      <p className={styles.toggleText} onClick={() => { setIsLogin(!isLogin); setError(""); }}>
        {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
        <span>{isLogin ? t("auth.register") : t("auth.login")}</span>
      </p>
    </motion.div>
  );
};