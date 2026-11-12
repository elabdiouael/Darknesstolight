"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, AlertCircle } from "lucide-react";
import styles from "./Toast.module.css";

type Kind = "nour" | "error";
interface ToastItem { id: number; text: string; kind: Kind }

const Ctx = createContext<(text: string, kind?: Kind) => void>(() => {});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((text: string, kind: Kind = "nour") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, text, kind }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3800);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className={styles.stack} aria-live="polite">
        <AnimatePresence>
          {items.map((i) => (
            <motion.div
              key={i.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.92, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, scale: 0.96, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`${styles.toast} ${i.kind === "error" ? styles.error : ""}`}
            >
              {i.kind === "error" ? <AlertCircle size={18} /> : <Sparkles size={18} />}
              <span>{i.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
};

export const useToast = () => useContext(Ctx);