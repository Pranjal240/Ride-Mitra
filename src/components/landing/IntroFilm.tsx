"use client";

/**
 * IntroFilm — first-load experience: the Ride Mitra logo "opens" into the intro
 * film via a clip-path zoom (Skiper 67 pattern), plays once per session, then
 * reveals the site. Skip is always reachable; prefers-reduced-motion skips the
 * film entirely (handled by the caller, which shows the poster instead).
 *
 * Point `src` at the /brag-generated film (public/launch.mp4).
 */

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import Logo from "@/components/common/Logo";

export function IntroFilm({
  src = "/launch.mp4",
  poster = "/launch-poster.jpg",
  onDone,
}: {
  src?: string;
  poster?: string;
  onDone: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [opened, setOpened] = useState(false);

  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(onDone, 420);
  }, [onDone]);

  // Open the clip-path shortly after mount so the logo reads first.
  useEffect(() => {
    const t = window.setTimeout(() => setOpened(true), 520);
    return () => window.clearTimeout(t);
  }, []);

  // Never trap the visitor: hard cap + stall fallback.
  useEffect(() => {
    const hard = window.setTimeout(finish, 24000);
    return () => window.clearTimeout(hard);
  }, [finish]);
  useEffect(() => {
    if (ready) return;
    const stall = window.setTimeout(finish, 6500);
    return () => window.clearTimeout(stall);
  }, [ready, finish]);

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-[#07101F]"
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.42, ease: "easeInOut" }}
      style={{ pointerEvents: leaving ? "none" : "auto" }}
    >
      {/* logo, visible before the film opens */}
      <AnimatePresence>
        {!opened && (
          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-10 flex flex-col items-center gap-4"
          >
            <Logo size={72} light />
            <span className="font-display text-2xl font-extrabold tracking-tight text-white">
              Ride<span className="text-accent">Mitra</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* film opens from the logo via clip-path (Skiper 67 pattern) */}
      <motion.div
        initial={{ clipPath: "inset(44% 44% 44% 44% round 24px)", opacity: 0 }}
        animate={
          opened
            ? { clipPath: "inset(0% 0% 0% 0% round 0px)", opacity: 1 }
            : { clipPath: "inset(44% 44% 44% 44% round 24px)", opacity: 0 }
        }
        transition={{ duration: 1, type: "spring", stiffness: 90, damping: 20 }}
        className="absolute inset-0"
        style={{
          // poster fills the frame the instant the clip-path opens, so the morph
          // never flashes empty dark bars while the video buffers.
          backgroundImage: `url(${poster})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <video
          src={src}
          poster={poster}
          autoPlay
          muted
          playsInline
          preload="auto"
          onCanPlay={(e) => {
            setReady(true);
            e.currentTarget.play().catch(() => {});
          }}
          onPlaying={() => setReady(true)}
          onEnded={finish}
          className="size-full object-cover"
        />
      </motion.div>

      <button
        onClick={finish}
        aria-label="Skip intro"
        className="absolute right-5 top-[max(20px,env(safe-area-inset-top))] z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 font-sans text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/25"
      >
        Skip <X className="size-3.5" />
      </button>
    </motion.div>
  );
}

export default IntroFilm;
