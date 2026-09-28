"use client";

/**
 * PopButton — a tactile 3D "push" button (adapted from the provided PopButton),
 * re-skinned to the Ride Mitra palette (navy face, clay/gold stacked shadow).
 * Presses down on hover/active. Works as <button> or as a link via `as`.
 */

import React from "react";

import { cn } from "@/lib/utils";

type PopButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  download?: boolean;
};

const base = cn(
  "group relative inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5",
  "font-sans text-sm font-bold uppercase tracking-wide text-white",
  "bg-navy border-2 border-navy",
  "transition-all duration-150 ease-[cubic-bezier(0,0,0.58,1)]",
  "shadow-[0_10px_0_-2px_#C8956C,0_10px_0_0_#8A5A2B,0_18px_0_0_rgba(200,149,108,0.35)]",
  "hover:-translate-y-0.5 hover:bg-navy-light hover:shadow-[0_12px_0_-2px_#C8956C,0_12px_0_0_#8A5A2B,0_22px_0_0_rgba(200,149,108,0.3)]",
  "active:translate-y-2.5 active:shadow-[0_0_0_-2px_#C8956C,0_0_0_0_#8A5A2B,0_0_0_0_rgba(200,149,108,0.2)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
);

export function PopButton({ className, children, href, download, ...props }: PopButtonProps) {
  if (href) {
    return (
      <a href={href} download={download} className={cn(base, className)}>
        {children}
      </a>
    );
  }
  return (
    <button className={cn(base, className)} {...props}>
      {children}
    </button>
  );
}

export default PopButton;
