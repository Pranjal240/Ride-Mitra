"use client";

/**
 * ParallaxGallery — a pinned, full-viewport gallery whose columns drift at
 * different speeds while the section is in view. Ported from Skiper 30
 * (Parallax_002, Skiper UI): the outer section is tall, an inner sticky pane
 * fills the screen, and framer-motion's useScroll (driven by the ambient Lenis
 * from <SmoothScroll> — no nested instance) parallaxes the columns.
 *
 * Fed with the project's colored RidePosters (no external photos). Reduced
 * motion → a calm static grid, no pinning.
 *
 * Skiper UI — free tier requires attribution. https://skiper-ui.com
 */

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import React, { useRef } from "react";

import { RidePoster, type PosterTone, type RideKind } from "@/components/ui/ride-illustrations";
import { cn } from "@/lib/utils";

export type ParallaxItem = { tone: PosterTone; kind: RideKind; title: string; eyebrow?: string };

function Column({ items, y, className }: { items: ParallaxItem[]; y: MotionValue<string>; className?: string }) {
  return (
    <motion.div style={{ y }} className={cn("flex w-1/2 flex-col gap-[1.4vw] md:w-1/4", className)}>
      {items.map((it, i) => (
        <div key={i} className="relative h-[38vh] min-h-[220px] w-full shrink-0">
          <RidePoster tone={it.tone} kind={it.kind} title={it.title} eyebrow={it.eyebrow} />
        </div>
      ))}
    </motion.div>
  );
}

export function ParallaxGallery({ items }: { items: ParallaxItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // gentle drift within the pinned viewport
  const y1 = useTransform(scrollYProgress, [0, 1], ["2%", "-14%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["-8%", "-32%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const y4 = useTransform(scrollYProgress, [0, 1], ["-6%", "-26%"]);
  const zero = useTransform(scrollYProgress, [0, 1], ["0%", "0%"]);

  const cols: ParallaxItem[][] = [[], [], [], []];
  items.forEach((it, i) => cols[i % 4].push(it));

  if (reduce) {
    return (
      <div className="grid w-full grid-cols-2 gap-3 px-4 md:grid-cols-4">
        {items.map((it, i) => (
          <div key={i} className="h-56">
            <RidePoster tone={it.tone} kind={it.kind} title={it.title} eyebrow={it.eyebrow} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height: "230vh" }}>
      <div className="sticky top-0 flex h-screen w-full items-center gap-[1.4vw] overflow-hidden px-[1.4vw]">
        <Column items={cols[0]} y={y1} className="-mt-[18%]" />
        <Column items={cols[1]} y={y2} className="-mt-[34%]" />
        <Column items={cols[2]} y={y3} className="hidden -mt-[10%] md:flex" />
        <Column items={cols[3]} y={y4} className="hidden -mt-[28%] md:flex" />
      </div>
    </div>
  );
}

export default ParallaxGallery;
