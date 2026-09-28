"use client";

/**
 * SocialFlipButton — a row of tiles that flip from a letter to an icon on hover
 * (adapted from the provided SocialFlipButton), re-skinned for the dark footer.
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { FaInstagram, FaWhatsapp, FaXTwitter, FaEnvelope, FaGithub } from "react-icons/fa6";

import { cn } from "@/lib/utils";

export type SocialItem = { letter: string; icon: React.ReactNode; label: string; href: string };

const DEFAULT: SocialItem[] = [
  { letter: "I", icon: <FaInstagram />, label: "Instagram", href: "#" },
  { letter: "W", icon: <FaWhatsapp />, label: "WhatsApp", href: "#" },
  { letter: "X", icon: <FaXTwitter />, label: "X", href: "#" },
  { letter: "M", icon: <FaEnvelope />, label: "Email", href: "mailto:hello@ridemitra.app" },
  { letter: "G", icon: <FaGithub />, label: "GitHub", href: "https://github.com/Pranjal240/Ride-Mitra" },
];

export function SocialFlipButton({ items = DEFAULT, className }: { items?: SocialItem[]; className?: string }) {
  const [hovered, setHovered] = useState(false);
  const [tip, setTip] = useState<number | null>(null);

  return (
    <div
      className={cn("flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 p-2", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setTip(null);
      }}
    >
      {items.map((it, i) => (
        <a
          key={i}
          href={it.href}
          target={it.href.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer"
          aria-label={it.label}
          onMouseEnter={() => setTip(i)}
          onMouseLeave={() => setTip(null)}
          className="relative h-9 w-9 shrink-0"
          style={{ perspective: "800px" }}
        >
          <AnimatePresence>
            {hovered && tip === i && (
              <motion.span
                initial={{ opacity: 0, y: 6, x: "-50%" }}
                animate={{ opacity: 1, y: -34, x: "-50%" }}
                exit={{ opacity: 0, y: 6, x: "-50%" }}
                className="absolute left-1/2 z-20 whitespace-nowrap rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-navy"
              >
                {it.label}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span
            className="relative block h-full w-full"
            animate={{ rotateY: hovered ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 15, delay: i * 0.06 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <span
              className="absolute inset-0 grid place-items-center rounded-lg bg-white/10 text-sm font-bold text-white"
              style={{ backfaceVisibility: "hidden" }}
            >
              {it.letter}
            </span>
            <span
              className="absolute inset-0 grid place-items-center rounded-lg bg-accent text-navy"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              {it.icon}
            </span>
          </motion.span>
        </a>
      ))}
    </div>
  );
}

export default SocialFlipButton;
