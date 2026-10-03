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
 * zoomed crop). Mobile/portrait → rotated 90deg + contain so the full frame is
 * visible with letterbox bars that read as cinematic, not cropped.
 *
 * Dismissal persists in localStorage (device-level), so reload/login/new-tab
 * never re-triggers the film. Only the explicit ?intro=1 URL flag re-plays it.
 *
 * Playback is tuned for low latency: metadata-only preload (not a blocking full
 * download), play triggered on loadeddata (first frame) rather than
 * canplaythrough — the film starts the moment the first frame is decoded
 * instead of waiting for the entire file to buffer.
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
  const retryCountRef = useRef(0);

  const finish = useCallback(() => {
    if (leaving) return; // prevent double-fire
    setLeaving(true);
    window.setTimeout(onDone, 420);
  }, [onDone, leaving]);

  /** Attempt to play the video with retry logic for mobile browsers */
  const tryPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setReady(true);
        })
        .catch(() => {
          // Mobile browsers often block autoplay on first attempt — retry
          // up to 3 times with a small delay
          if (retryCountRef.current < 3) {
            retryCountRef.current += 1;
            window.setTimeout(tryPlay, 300);
          } else {
            // After 3 retries, skip the intro entirely
            finish();
          }
        });
    }
  }, [finish]);

  // lock body scroll while the film owns the screen
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Kick off playback once mounted
  useEffect(() => {
    // Small delay lets the browser settle after mount, improving autoplay
    // reliability on mobile Chrome/Safari
    const t = window.setTimeout(tryPlay, 80);
    return () => window.clearTimeout(t);
  }, [tryPlay]);

  useEffect(() => {
    if (ready) {
      const hard = window.setTimeout(finish, 24000);
      return () => window.clearTimeout(hard);
    }
    // Increased bail timeout for slower mobile connections — gives the video
    // more time to buffer before we skip
    const bail = window.setTimeout(finish, 8000);
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
        poster="/launch-poster.jpg"
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        onLoadedData={(e) => {
          // First frame decoded — start playback immediately. Waiting for
          // canplaythrough stalled the whole page on slower connections
          // because the browser blocks while buffering the full file.
          const el = e.currentTarget as HTMLVideoElement;
          // Snappier intro: 1.35x makes it feel punchy on low-end devices
          // where the raw frame rate is below the source's.
          el.playbackRate = 1.35;
          el.play().catch(() => {});
          setReady(true);
        }}
        onPlay={(e) => {
          // In case the browser resets playbackRate on autoplay resume
          // (iOS Safari does this), re-apply.
          (e.currentTarget as HTMLVideoElement).playbackRate = 1.35;
        }}
        onPlaying={() => setReady(true)}
        onStalled={() => {
          // If playback stalls (slow network / low-end device), bail quickly
          // rather than freeze the page under a dark overlay.
          window.setTimeout(finish, 1200);
        }}
        onEnded={finish}
        onError={() => window.setTimeout(finish, 400)}
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
        }
        /* Portrait phones: rotate the landscape film 90deg into portrait
           orientation and use CONTAIN so the full frame stays visible — any
           leftover space is the dark backdrop (reads cinematic, not cropped). */
        @media (orientation: portrait) {
          .intro-film-video {
            inset: auto;
            top: 50%;
            left: 50%;
            width: 100vh;
            height: 100vw;
            object-fit: contain;
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
