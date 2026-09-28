"use client";

/**
 * IntroFilm — first-load experience. A dark, branded screen (logo + tagline)
 * holds immediately, and the film is revealed via a clip-path zoom ONLY once it
 * is actually playing — so a slow buffer or a near-white poster frame can never
 * flash a blank white screen (the launch poster is ~233/255 bright). If autoplay
 * is blocked or the video errors, the branded screen simply hands off to the
 * site. Plays once per session; Skip always reachable; reduced-motion skips it.
 *
 * Skiper 67 clip-path reveal pattern.
 */

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import Logo from "@/components/common/Logo";

export function IntroFilm({
  src = "/launch.mp4",
  onDone,
}: {
  src?: string;
  poster?: string;
  onDone: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(onDone, 460);
  }, [onDone]);

  // Try to start playback as soon as we can.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
  }, []);

  // If the film never starts (autoplay blocked / slow), don't trap the visitor:
  // hand off to the site after a short, branded beat. Hard cap once playing.
  useEffect(() => {
    if (playing) {
      const hard = window.setTimeout(finish, 22000);
      return () => window.clearTimeout(hard);
    }
    const bail = window.setTimeout(finish, 4200);
    return () => window.clearTimeout(bail);
  }, [playing, finish]);

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#0A1428]"
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.46, ease: "easeInOut" }}
      style={{ pointerEvents: leaving ? "none" : "auto" }}
    >
      {/* radiant brand backdrop (visible behind the logo before the film opens) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 30%, #16294A 0%, #0A1428 60%, #070E1C 100%)",
        }}
      />

      {/* film — revealed via clip-path ONLY when actually playing */}
      <motion.div
        initial={{ clipPath: "inset(46% 46% 46% 46% round 26px)", opacity: 0 }}
        animate={
          playing
            ? { clipPath: "inset(0% 0% 0% 0% round 0px)", opacity: 1 }
            : { clipPath: "inset(46% 46% 46% 46% round 26px)", opacity: 0 }
        }
        transition={{ duration: 1.05, type: "spring", stiffness: 90, damping: 20 }}
        className="absolute inset-0"
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          playsInline
          preload="auto"
          onPlaying={() => setPlaying(true)}
          onEnded={finish}
          onError={() => window.setTimeout(finish, 800)}
          className="size-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A1428]/40 via-transparent to-[#0A1428]/20" />
      </motion.div>

      {/* branded logo screen — holds until the film is playing (never white) */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.12 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-10 flex flex-col items-center gap-5 text-center"
          >
            <Logo size={80} light />
            <div className="font-display text-[clamp(1.75rem,6vw,3rem)] font-extrabold leading-none tracking-tight text-white">
              Ride<span className="text-accent">Mitra</span>
            </div>
            <p className="max-w-[22ch] text-sm font-medium uppercase tracking-[0.2em] text-white/50">
              Share the ride · Skip the wait
            </p>
            <span className="mt-2 h-1 w-20 overflow-hidden rounded-full bg-white/12">
              <motion.span
                className="block h-full w-1/2 rounded-full bg-accent"
                animate={{ x: ["-100%", "240%"] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={finish}
        aria-label="Skip intro"
        className="absolute right-5 top-[max(20px,env(safe-area-inset-top))] z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 font-sans text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
      >
        Skip <X className="size-3.5" />
      </button>
    </motion.div>
  );
}

export default IntroFilm;
