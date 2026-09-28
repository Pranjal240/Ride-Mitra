"use client";

/**
 * AnimatedFooter — a cinematic footer: a giant wordmark whose characters unmask
 * from the bottom as it scrolls into view, over a cursor-reactive glow. Adapted
 * from the provided AnimatedFooter idea (its ASCII-hand version needs source
 * images we don't ship, so this keeps the reveal + interactivity, image-free).
 */

import { motion, useReducedMotion } from "framer-motion";
import React, { useRef } from "react";

import { cn } from "@/lib/utils";

export function AnimatedFooter({
  word = "RIDE MITRA",
  children,
  className,
}: {
  word?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const glowX = useRef(0);

  return (
    <footer
      ref={ref}
      onMouseMove={(e) => {
        if (reduce || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        glowX.current = e.clientX - r.left;
        ref.current.style.setProperty("--gx", `${glowX.current}px`);
        ref.current.style.setProperty("--gy", `${e.clientY - r.top}px`);
      }}
      className={cn("relative isolate bg-navy text-white lg:pb-0", className)}
    >
      {/* Overscroll blocker for mobile */}
      <div className="absolute top-full left-0 right-0 h-[50vh] bg-navy lg:hidden" />
      
      {/* Glow clipping container */}
      <div className="relative overflow-hidden w-full">
      {/* cursor glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(420px circle at var(--gx,50%) var(--gy,40%), rgba(200,149,108,0.28), transparent 60%)",
        }}
      />

      {/* content row */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-wrap items-start justify-between gap-8 px-6 py-10">
        {children}
      </div>
      </div>
    </footer>
  );
}

export default AnimatedFooter;
