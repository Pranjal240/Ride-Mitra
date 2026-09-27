# Ride Mitra — Mobile App Build Prompt (paste-ready, local Claude Code)

> Paste this into a **local Claude Code** session to build the Ride Mitra mobile app. Self-contained: names the skills to invoke, the stack, the build order, and how to reuse the web backend. Full requirements: [`docs/prd/APP_PRD.md`](../prd/APP_PRD.md). Read it and the website PRD first.

---

## Role & mission

You are a senior mobile engineer building the **Ride Mitra** app — the native companion to the Ride Mitra website — for **J.C. Bose University of Science & Technology, YMCA (Faridabad)**, a university-exclusive carpooling platform. Build with **React Native + Expo (TypeScript)** for maximum reuse of the web app's TypeScript types, Supabase client, and matching logic. Same backend, same design language, native-first UX.

---

## Skills to use
- **`ui-ux-pro-max`** — design system + `--stack react-native` implementation guidance (run first).
- **`21st-registry`** + `mcp__21st__*` tools — source/adapt React Native components where suitable.
- **`/brag`** (or `/brag-slim`) — generate the intro motion-graphic film.
- **`android-adaptive`, `android-play-policy-insights`, `android-android-intent-security`, `android-testing-setup`** — platform polish, store compliance, deep-link security, and test scaffolding.

## Execution order

### Phase 0 — Design system
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
  "university campus carpooling mobile app trust-first mobility" \
  --design-system --persist -p "Ride Mitra App"
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "list performance navigation safe-area" --stack react-native
```
Align tokens with the website's `design-system/MASTER.md` so both products feel like one brand.

### Phase 1 — Scaffold
Create an Expo (TS) app with **Expo Router**. Install: `react-native-reanimated`, `react-native-gesture-handler`, `react-native-maps` (or Mappls RN SDK), `expo-video`, `expo-location`, `expo-notifications`, `expo-auth-session`, `expo-web-browser`, `@supabase/supabase-js`, `zustand`, `lucide-react-native`, `react-native-webrtc`, Razorpay RN SDK, `expo-haptics`.

### Phase 2 — Shared code & backend
Reuse the web repo's `src/types/index.ts` and adapt `src/lib/api.ts` / `src/lib/maps.ts` (polyline decode, distance/bearing). Configure the Supabase client with the same URL/anon key pattern (env). Do not redesign the schema — reuse `users`, `rides`, `bookings`, `live_locations`, `sos_alerts`, `messages`, etc.

### Phase 3 — Component experiences (native)
Recreate the 6 provided components natively (see `APP_PRD.md` §4): SmoothInput (Reanimated caret) as default input; HoverExpand gallery (horizontal/tablet + vertical/phone via Gesture Handler + layout animations); scroll-linked reveals (`useAnimatedScrollHandler`); intro VideoReveal (`expo-video` + scale-from-source); traffic-crowd hero (Lottie/Reanimated). No DOM/DialKit/Lenis (web-only).

### Phase 4 — Intro film
Run `/brag`; ship as Expo splash → video with Skip + reduced-motion poster fallback.

### Phase 5 — Screens & features
Build the tab map (Home · Rides · Trips · Chat · Profile) + stacked screens per `APP_PRD.md` §6. Implement:
- **Corridor/direction matching** (shared algorithm vs `rides.route_polyline`).
- **Hardcoded sole admin** `pranjalmishra2409@gmail.com` — client constant + Supabase RLS/edge enforcement.
- Vehicle/seats/**capped price band**/**bargaining**; Razorpay (INR).
- **Background driver location** → `live_locations`; live tracking map + ETA.
- **SOS + emergency connect**: real GPS → `sos_alerts` + `send-sos` edge fn + native emergency call; always reachable.
- **Live VC** via `react-native-webrtc` + Supabase Realtime signaling; text-chat fallback.
- Push notifications; haptics; native share. Uber discarded (optional fare reference only).

### Phase 6 — Hardening
Safe areas, ≥44pt targets, light/dark parity, reduced-motion, dynamic type. Run `android-play-policy-insights` for store compliance and `android-android-intent-security` on deep-link handlers. Add tests via `android-testing-setup`.

## Guardrails
- Server (Supabase RLS) is the authoritative admin/permission gate — never trust the client.
- SVG icons only (lucide-react-native); no emoji as icons; tokens not raw hex.
- Request permissions with rationale; handle denial gracefully; respect system gestures/safe areas.

## Definition of done
Matches [`APP_PRD.md` §9 Acceptance Criteria](../prd/APP_PRD.md#9-acceptance-criteria). App runs from a clean checkout on Android; core flows (sign-in → search/offer → book/bargain → pay → track → SOS/VC) work end-to-end against the shared Supabase backend.
