"use client";

/**
 * AppBackground — the single, app-wide animated backdrop.
 *
 * Mounted ONCE at the App root (outside every route + outside Lenis) so the
 * cursor-reactive WaveGrid lives behind the WHOLE UI, not just the landing hero.
 * One WebGL context for the entire app (cheaper than per-page instances), it
 * survives route changes and pauses itself when the tab is hidden.
 *
 * Pages render on translucent surfaces so this shows through in the gaps; the
 * veil keeps text readable over the moving grid. Skips under reduced-motion /
 * no-WebGL (WaveGridBackground renders nothing → the ivory body shows).
 */

import { WaveGridBackground } from "@/components/ui/wave-grid-background";

export function AppBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20 h-screen w-screen"
      >
        {/* deeper warm tones so the cubes actually read against the ivory page
            (ivory-on-ivory was near-invisible), cursor-reactive across the app */}
        <WaveGridBackground
          className="h-full w-full"
          colorBase="#D9CCB4"
          colorHigh="#C8956C"
          sceneBg="#EFE7D7"
        />
      </div>
      {/* base readability veil — light so the grid stays clearly alive across the
          whole UI (dense pages add their own frost via PageShell) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen bg-white/15"
      />
    </>
  );
}

export default AppBackground;
