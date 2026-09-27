# Hyperframes Composition Brief: Ride Mitra

## Objective
Create a short launch-style brag video introducing Ride Mitra — the closed carpool network for J.C. Bose University (YMCA, Faridabad).

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `/home/user/Ride-Mitra`
- Primary files read: `src/pages/Landing.tsx` (hero copy), `src/components/common/Logo.tsx` (brand mark), `src/index.css` (design tokens)
- Product name: Ride Mitra
- Tagline / strongest claim: "Share the ride. Skip the wait." · "Ride Mitra simply puts them in the same car."
- Key UI or visual moment to recreate: the ivory hero with the two-tone headline; the ride-booking flow on a route map; the car-and-map-pin logo
- Copy that must appear verbatim:
  - "Share the ride." / "Skip the wait."
  - "JC Bose University · YMCA Faridabad"
  - "The carpool network built only for J.C. Bose University students & staff."
  - "Ride as a User." / "Offer seats as a Service."
  - "Verified campus ID" / "Live-tracked trips" / "One-tap SOS"
  - "Ride Mitra" / "Your campus, carpooled."

## Creative Direction
- Tone preset: app-store
- Creative direction: calm, trust-first campus product launch — editorial, unhurried, premium
- Interpretation: clean feature-card reveals, generous ivory space, one primary thing at a time, smooth slides not hard cuts
- Angle: everyone's heading the same way in separate cars; Ride Mitra puts them in the same one. Show the real hero, the real booking flow, the two roles, the trust story, the logo.
- Hook: the site's hero headline builds letter by letter — "Share the ride." then gold "Skip the wait."
- Outro / punchline: logo locks in, "Your campus, carpooled."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign (stay on the real palette + fonts)

## Visual Identity
- Background: `#F7F5F1` (ivory)
- Text: `#17223B` (navy ink) / `#1B2B4B` (primary navy)
- Accent: `#C8956C` (gold); strong `#A67A50`; soft `#F5E6D3`
- Display font: Bricolage Grotesque (Google Fonts; extra-bold, tracking -0.03em)
- Body font: Plus Jakarta Sans; mono JetBrains Mono for price/data
- Visual references: two-tone hero headline, eyebrow pill, ride card, route map with pins, car+pin logo, "Ride" navy / "Mitra" gold wordmark

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 4.0s — headline "Share the ride." / gold "Skip the wait." builds; campus eyebrow pill
2. What it is — 3.5s — logo + wordmark + "The carpool network built only for J.C. Bose University students & staff."
3. Booking flow — 4.0s — route draws, ride card slides in, cursor taps "Book seat", confirms (centerpiece)
4. Two roles — 3.0s — "Ride as a User." + "Offer seats as a Service." cards, one by one
5. Safe by design — 3.0s — three trust chips on the beat grid
6. Logo outro — 2.5s — logo slam + "Ride Mitra" + "Your campus, carpooled."

## Audio
- Audio role: sparse professional accents over a clean upbeat bed
- Audio arc: warm fade-in under hero → steady through flow/roles → build through trust chips → one bell on logo → fade out
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: start 0, volume ~0.32, fade-in 0.8s, fade-out 1.8s under outro
- Music cue guidance: bundled preset (120.19 BPM). Beat-lock the outro logo slam to 17.52s strong cue. Beat-grid the three trust chips to 15.02 / 16.02 / 17.02.
- Audio-reactive treatment: subtle intent only; RMS-extraction helper not installed in this environment → use a gentle deterministic glow pulse instead and document (do not block render).
- Audio-coupled moments:
  - Scene 1 headline settle — soft drop
  - Scene 3 card slide + cursor tap — card-slide + click
  - Scene 4 role cards — drop per card
  - Scene 5 trust chips — drop per chip on beat grid
  - Scene 6 logo — impact bell on the strong cue
- SFX selection guidance: `interface/drop_001`/`drop_002` for pop-ins, `casino/card-slide-1` for the ride card, `interface/click_001` for the tap, `impact/impactBell_heavy_000` for outro. All 0.65–0.75, motion-aligned.
- SFX analysis guidance: `.claude/skills/brag/assets/sfx/sfx-analysis.md` — prefer low high-frequency-risk files for repeated/polished moments.
- Exact SFX choice: chosen after the animation exists; copied into `brag-output/composition/assets/sfx/`.
- Audio files: music + chosen SFX copied into `brag-output/composition/assets/`.

## Hyperframes Instructions
Single-file composition (`index.html`), one paused root timeline registered on `window.__timelines["root"]`, GSAP from cdn.jsdelivr.net. Scenes are `.clip` full-frame divs with `data-start`/`data-duration`; all motion driven by the root timeline at absolute times (seek-safe: only `set`/`to`/`fromTo` on opacity/x/y/scale/rotation). Deterministic only — no `Date.now()`, `Math.random()`, or network fetches beyond the CDN/font links. Keep every text element readable (navy on ivory; gold only on large display type or as non-text decoration). Run `hyperframes check` before render.

Requirements:
- Show at least one real UI/copy/visual element from the source project (the hero, the ride card, the logo — all present).
- Keep all text readable in the final render.
- Keep the video within 15–25 seconds (20s).
- Include the planned music/SFX layer.
- Treat cue metadata as optional hints; readability and pacing win.
- 1 major beat-lock (outro logo, 17.52s); trust chips snap to the beat grid.
