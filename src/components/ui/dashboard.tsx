"use client";

/** Shared dashboard primitives (tone tiles, count-up, sparkbars, score ring). */

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { BadgeTone } from "./primitives";

export const TONE_TILE: Record<BadgeTone, string> = {
  neutral: "bg-muted text-foreground",
  accent: "bg-accent-soft text-accent-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function toneTile(tone: BadgeTone, extra?: string) {
  return cn("grid place-items-center rounded-2xl", TONE_TILE[tone], extra);
}

export function CountUp({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [n, setN] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      setN(value);
      return;
    }
    let frame: number;
    const dur = 700;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      setN(Math.round(t * value));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);
  return (
    <>
      {prefix}
      {n}
    </>
  );
}

export function ScoreRing({ value, size = 96 }: { value: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }} className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--rm-muted)" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--rm-accent)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
      />
      <text
        x="50"
        y="50"
        transform="rotate(90 50 50)"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-mono"
        style={{ fontSize: 22, fontWeight: 700 }}
      >
        {value}
      </text>
    </svg>
  );
}

export function Sparkbars({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className={cn("flex h-28 items-end gap-2", className)}>
      {values.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${(v / max) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="flex-1 rounded-t-md bg-gradient-to-t from-accent/40 to-accent"
          title={`${Math.round(v)}`}
        />
      ))}
    </div>
  );
}
