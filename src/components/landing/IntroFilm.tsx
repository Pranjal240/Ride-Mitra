"use client";

/**
 * IntroFilm — first-load motion graphic. No loading screen: the film plays
 * immediately, full-bleed, over a dark backdrop (so there is never a white
 * flash before the first frame paints).
 *
 *  • PC / landscape  → the 16:9 film fills the viewport (object-cover).
 *  • Mobile/portrait → the landscape film is rotated 90° and sized to the
 *    viewport so it fills the whole portrait screen edge-to-edge (shown in
 *    landscape orientation, cropped via cover — no black bars).
 *
 * Plays once per session, muted + autoplay + playsInline, Skip always
 * reachable, and reduced-motion skips it entirely.
 */

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function IntroFilm({
  src = "/launch.mp4",
  onDone,
}: {
  src?: string;
  onDone: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(onDone, 420);
  }, [onDone]);

  // Kick off playback as early as possible.
  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  // Never trap the visitor: if the film can't start (autoplay blocked / slow),
  // hand off shortly; once playing, a generous hard cap ends it.
  useEffect(() => {
    if (ready) {
      const hard = window.setTimeout(finish, 24000);
      return () => window.clearTimeout(hard);
    }
    const bail = window.setTimeout(finish, 6000);
    return () => window.clearTimeout(bail);
  }, [ready, finish]);

  return (
    <motion.div
      className="fixed inset-0 z-[120] overflow-hidden bg-[#070E1C]"
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.42, ease: "easeInOut" }}
      style={{ pointerEvents: leaving ? "none" : "auto" }}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlay={(e) => {
          (e.currentTarget as HTMLVideoElement).play().catch(() => {});
          setReady(true);
        }}
        onPlaying={() => setReady(true)}
        onEnded={finish}
        onError={() => window.setTimeout(finish, 600)}
        className="intro-film-video"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.35s ease" }}
      />

      <button
        onClick={finish}
        aria-label="Skip intro"
        className="absolute right-5 top-[max(20px,env(safe-area-inset-top))] z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 font-sans text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
      >
        Skip <X className="size-3.5" />
      </button>

      <style>{`
        /* PC / landscape: show the WHOLE 16:9 film fit to the screen — never a
           zoomed crop. On a non-16:9 window the extra space is the dark backdrop
           (cinematic bars), so no stray white/zoom can ever appear. */
        .intro-film-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #070E1C;
          will-change: transform;
        }
        /* Portrait phones: rotate the landscape film 90deg and size it to the
           viewport so it fills the whole portrait screen in landscape
           orientation (cover-crop, no bars). */
        @media (orientation: portrait) {
          .intro-film-video {
            inset: auto;
            top: 50%;
            left: 50%;
            width: 100vh;
            height: 100vw;
            object-fit: cover;
            transform: translate(-50%, -50%) rotate(90deg);
            transform-origin: center center;
          }
        }
      `}</style>
    </motion.div>
  );
}

export default IntroFilm;
