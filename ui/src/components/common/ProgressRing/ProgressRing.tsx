"use client";

import React, { useId } from "react";
import { motion } from "framer-motion";

interface Props {
  value: number;        // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}

/** Halqa dyal progress b gradient dhahabi w glow */
export const ProgressRing = ({ value, size = 92, stroke = 6, color = "#ecd08a", children }: Props) => {
  const id = useId().replace(/:/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff4d6" />
            <stop offset="60%" stopColor={color} />
            <stop offset="100%" stopColor="#b8922f" />
          </linearGradient>
          <filter id={`f${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,244,214,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#g${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * v) / 100 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          filter={`url(#f${id})`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
};