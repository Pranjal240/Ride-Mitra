"use client";

/**
 * IntroFilm — first-load motion graphic.
 *
 * Rendered through a PORTAL to <body> so it escapes the landing's Lenis
 * (SmoothScroll) wrapper and the route's AnimatedPage `filter` animation — both
 * establish a containing block for `position: fixed`, which otherwise stretched
 * this overlay to the FULL PAGE HEIGHT (you'd scroll past white to find the film
 * playing somewhere in the middle). At <body> level `fixed inset-0` is the true
 * viewport, so the film fills exactly one screen.
 *
 * No loading screen: the film plays immediately over a dark backdrop (never a
 * white flash). PC/landscape → whole 16:9 film fit to screen (contain, never a
 * zoomed crop). Mobile/portrait → rotated 90deg + cover to fill the screen.
 * Muted + autoplay + playsInline, Skip always reachable, plays once per session.
 */

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

  // lock body scroll while the film owns the screen
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (ready) {
      const hard = window.setTimeout(finish, 24000);
      return () => window.clearTimeout(hard);
    }
    const bail = window.setTimeout(finish, 6000);
    return () => window.clearTimeout(bail);
  }, [ready, finish]);

  const overlay = (
    <motion.div
      className="fixed inset-0 z-[2147483000] flex items-center justify-center overflow-hidden bg-[#070E1C]"
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
        className="absolute right-5 top-[max(20px,env(safe-area-inset-top))] z-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 font-sans text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
      >
        Skip <X className="size-3.5" />
      </button>

      <style>{`
        /* PC / landscape: whole 16:9 film fit to the screen — never a zoomed
           crop; any leftover space is the dark backdrop, never white. */
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
           viewport so it fills the whole portrait screen (cover-crop, no bars). */
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

  if (typeof document === "undefined") return overlay;
  return createPortal(overlay, document.body);
}

export default IntroFilm;
