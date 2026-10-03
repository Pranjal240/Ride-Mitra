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
  const [needsTap, setNeedsTap] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const leavingRef = useRef(false);

  const finish = useCallback(() => {
    if (leavingRef.current) return; // prevent double-fire
    leavingRef.current = true;
    setLeaving(true);
    window.setTimeout(onDone, 420);
  }, [onDone]);

  /** Attempt to play the video with resilient retry — never gives up on
   *  stalls or transient pauses, only surrenders if the browser truly
   *  blocks autoplay (then shows a Tap-to-play prompt). */
  const tryPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || leavingRef.current) return;
    v.playbackRate = 1.35;
    const p = v.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        setReady(true);
        setNeedsTap(false);
      }).catch((err: unknown) => {
        // NotAllowedError = autoplay policy blocked us — needs a user gesture.
        // Everything else (AbortError, network) just means try again shortly.
        const name = (err as { name?: string })?.name;
        if (name === "NotAllowedError") {
          setNeedsTap(true);
        } else {
          window.setTimeout(() => tryPlay(), 350);
        }
      });
    }
  }, []);

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
    const t = window.setTimeout(tryPlay, 80);
    return () => window.clearTimeout(t);
  }, [tryPlay]);

  // If the browser pauses us mid-way (tab backgrounded, visibility throttle,
  // or Chrome's power saver), resume as soon as the page is visible again.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [tryPlay]);

  // Hard bail only if the video completely fails to buffer within 10s
  // (not on transient stalls). Then also a 24s cap once playing so a stuck
  // decoder can't pin the intro overlay to the screen forever.
  useEffect(() => {
    if (ready) {
      const hard = window.setTimeout(finish, 24000);
      return () => window.clearTimeout(hard);
    }
    const bail = window.setTimeout(() => {
      const v = videoRef.current;
      // Only bail if the browser hasn't even reached HAVE_CURRENT_DATA.
      if (!v || v.readyState < 2) finish();
    }, 10000);
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
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        onLoadedMetadata={(e) => {
          // Set rate as soon as the duration is known — before play() —
          // so even the first paint uses 1.35x cadence.
          (e.currentTarget as HTMLVideoElement).playbackRate = 1.35;
        }}
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
          setReady(true);
          setNeedsTap(false);
        }}
        onPlaying={() => setReady(true)}
        onPause={() => {
          // Chrome's power saver / tab-visibility throttling pauses the
          // video mid-play. Resume immediately unless we're intentionally
          // tearing down the intro.
          if (!leavingRef.current) tryPlay();
        }}
        onEnded={finish}
        onError={() => window.setTimeout(finish, 400)}
        className="intro-film-video"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.35s ease" }}
      />

      {/* Autoplay-blocked fallback: user tap required (iOS low-power mode,
          data-saver, some mobile browsers). Shown only when play() rejects
          with NotAllowedError. */}
      {needsTap && !leaving && (
        <button
          type="button"
          onClick={tryPlay}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-navy/40 text-white backdrop-blur-sm"
          aria-label="Tap to play intro"
        >
          <span className="grid size-20 place-items-center rounded-full border-2 border-white/70 bg-white/15">
            <svg viewBox="0 0 24 24" className="size-9 fill-current"><path d="M8 5v14l11-7z" /></svg>
          </span>
          <span className="mt-4 text-sm font-semibold uppercase tracking-[0.18em]">Tap to play</span>
        </button>
      )}

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
