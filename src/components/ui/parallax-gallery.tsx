"use client";

/**
 * ParallaxGallery — full-bleed columns that drift at different speeds as the
 * section scrolls. Ported from Skiper 30 (Parallax_002, Skiper UI). Uses the
 * ambient Lenis from <SmoothScroll> (does NOT spin up its own instance) via
 * framer-motion's useScroll. Reduced-motion → a calm static grid.
 *
 * Fed with colored RidePosters (this project's illustrated language) instead of
 * photos, so it stays on-brand and needs no external assets.
 *
 * Skiper UI — free tier requires attribution. https://skiper-ui.com
 */

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import React, { useRef } from "react";

import { RidePoster, type PosterTone, type RideKind } from "@/components/ui/ride-illustrations";
import { cn } from "@/lib/utils";

export type ParallaxItem = { tone: PosterTone; kind: RideKind; title: string; eyebrow?: string };

function Column({
  items,
  y,
  className,
}: {
  items: ParallaxItem[];
  y: MotionValue<number>;
  className?: string;
}) {
  return (
    <motion.div style={{ y }} className={cn("relative flex w-1/2 flex-col gap-[2vw] md:w-1/4", className)}>
      {items.map((it, i) => (
        <div key={i} className="relative h-[26vw] max-h-[300px] min-h-[200px] w-full">
          <RidePoster tone={it.tone} kind={it.kind} title={it.title} eyebrow={it.eyebrow} />
        </div>
      ))}
    </motion.div>
  );
}

export function ParallaxGallery({ items }: { items: ParallaxItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // four drift speeds
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 240]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 420]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const zero = useTransform(scrollYProgress, [0, 1], [0, 0]);

  // distribute items across 4 columns
  const cols: ParallaxItem[][] = [[], [], [], []];
  items.forEach((it, i) => cols[i % 4].push(it));

  return (
    <div
      ref={ref}
      className="relative box-border flex w-full gap-[2vw] overflow-hidden bg-[#EFE9DF] p-[2vw]"
      style={{ height: reduce ? "auto" : "150vh" }}
    >
      <Column items={cols[0]} y={reduce ? zero : y1} className="-top-[10%]" />
      <Column items={cols[1]} y={reduce ? zero : y2} className="-top-[28%]" />
      <Column items={cols[2]} y={reduce ? zero : y3} className="hidden -top-[6%] md:flex" />
      <Column items={cols[3]} y={reduce ? zero : y4} className="hidden -top-[22%] md:flex" />
    </div>
  );
}

export default ParallaxGallery;
