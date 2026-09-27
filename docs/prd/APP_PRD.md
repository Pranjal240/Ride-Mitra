# Ride Mitra — Mobile App PRD (React Native + Expo)

> **Status:** Active spec for a **new** mobile app (does not exist yet in this repo).
> **Companion build prompt:** [`docs/prompts/APP_BUILD_PROMPT.md`](../prompts/APP_BUILD_PROMPT.md)
> **Sister spec (website):** [`docs/prd/WEBSITE_PRD.md`](./WEBSITE_PRD.md) — read it for the shared product story, data model, and feature intent. This doc covers only what is app-specific.

---

## 1. Overview

Build the **Ride Mitra mobile app** for **J.C. Bose University of Science & Technology, YMCA (Faridabad)** — the native companion to the website. Same product, same Supabase backend, same design system; native-first execution. Stack chosen for **maximum reuse**: **React Native + Expo (TypeScript)** so it shares TypeScript types, the Supabase client pattern, and the matching logic with the web app.

**Reuse target:** import/adapt `src/types/index.ts` and the `src/lib/api.ts` / `src/lib/maps.ts` logic from the web repo (extract shared code into a small local package or copy-with-attribution). The backend (Supabase Postgres/Auth/Realtime/Edge Functions, Mappls maps, Razorpay) is unchanged and shared.

---

## 2. Platform Foundations

| Concern | Decision |
|---|---|
| Framework | Expo (managed workflow), TypeScript, Expo Router (file-based) |
| Navigation | Bottom tab bar (**≤5 items**) + native stack; deep links for every key screen |
| State/data | zustand + the shared Supabase client; TanStack Query optional for caching |
| Maps | `react-native-maps` (or Mappls RN SDK); reuse polyline decode + distance helpers from web `maps.ts` |
| Animation | **Reanimated 3 + Gesture Handler** (native equivalents of framer-motion/Lenis) |
| Video | `expo-video` (or `expo-av`) for the intro film |
| Icons | `lucide-react-native` (one family, SVG, no emoji as icons) |
| Auth | Supabase Google OAuth via `expo-auth-session` / `expo-web-browser` |
| Payments | Razorpay React Native SDK (INR) |
| Notifications | `expo-notifications` (push) |
| Location | `expo-location` incl. background updates for live tracking |
| Permissions | Location, camera (doc verification), notifications, microphone/camera (VC) — request with rationale, handle denial gracefully |

---

## 3. Design System

Reuse the **same visual language** as the website. Run `ui-ux-pro-max` with the React Native stack flag so guidance is native-appropriate:
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
  "university campus carpooling mobile app trust-first mobility" \
  --design-system --persist -p "Ride Mitra App"
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "list performance navigation safe-area" --stack react-native
```
Keep tokens (color, type scale, spacing, radii) aligned with the website's `MASTER.md` so the two products feel like one brand. Follow the skill's App-UI checklist (touch targets ≥44pt, safe areas, light/dark parity, haptics, press feedback).

---

## 4. Native equivalents of the 6 provided components

The web components are React/DOM; recreate their **experience** natively (don't try to run DOM code in RN):

| Web component | Native realization |
|---|---|
| **SmoothInput** (Skiper106) | Custom `TextInput` wrapper with a Reanimated animated caret/underline + spring; used as the default input on every screen. No DialKit. |
| **HoverExpand 001/002** (Skiper52/53) | Native gallery: horizontal expanding row on tablets/landscape, vertical press-to-expand accordion on phones, using Reanimated layout animations + Gesture Handler (hover→press). |
| **ScrollAnimation_002** (Skiper31) | Scroll-linked reveals via Reanimated `useAnimatedScrollHandler` / `interpolate` on a scroll `Animated.ScrollView` (Lenis is web-only). |
| **VideoPlayer clip-path popover** (Skiper67) | Intro film via `expo-video` with a shared-element / scale-from-source transition (Reanimated). |
| **Skiper39** (traffic/crowd hero) | Recreate the traffic-crowd hero as a native animated illustration/Lottie or Reanimated scene; same "everyone's waiting → carpool solves it" metaphor. |

Source components can be pulled/adapted via the **`21st-registry`** skill and `mcp__21st__*` tools where a suitable RN component exists; otherwise implement with Reanimated.

---

## 5. Intro / loading motion-graphic

Same requirement as web: **logo → short intro film** explaining Ride Mitra, on app open. Generate with **`/brag`** (reads the project; 15–25s). Ship as an **Expo splash → video** sequence (splash logo animates, then plays the film with a Skip control), reduced-motion → static poster. Store the asset in the app's `assets/`.

---

## 6. Screen map (mirrors web routes, native patterns)

Bottom tabs (≤5): **Home** · **Rides** (search/offer) · **Trips** (bookings + live tracking) · **Chat** · **Profile**. Plus stacked screens:
- Onboarding + role picker + Google sign-in → role-based home.
- **Rider home** (stats, live map, trending/saved routes).
- **Ride search** (current+destination inputs, **corridor/direction matching**, results with vehicle/seats/price/ETA) → **ride detail/book** (seat picker, **bargaining**, Razorpay) → **live tracking** (map + ETA + SOS + VC) → **in-ride chat**.
- **Driver home** + **offer ride** wizard (route w/ polyline, schedule, vehicle, seats, **capped price band**) + **verification** (camera doc upload).
- **Admin**: minimal mobile console for the sole admin (SOS alerts, moderation, announcements) — full console stays on web.
- **Profile**, notifications, legal.

---

## 7. Feature requirements (app-specific emphasis)

Shared feature intent is defined in `WEBSITE_PRD.md` §6. App-specific must-haves:
- **Hardcoded sole admin** `pranjalmishra2409@gmail.com` — client constant + **Supabase RLS/edge enforcement** (identical rule to web; server is the real gate).
- **Corridor/direction matching** — same algorithm as web (point-to-polyline + direction/order), reusing shared helpers.
- **Vehicle type / seats / capped pricing band / bargaining** — same rules; native pickers.
- **Background live location** for drivers (`expo-location` background task) feeding `live_locations`.
- **SOS + emergency connect** — hardware-assisted: trigger writes `sos_alerts` with real GPS, sends via `send-sos` edge fn, and offers a **native emergency phone call** to the saved contact; SOS reachable from anywhere (persistent affordance / long-press).
- **Live VC support** — WebRTC via `react-native-webrtc`, signaling over **Supabase Realtime**; camera/mic permissions; text-chat fallback.
- **Push notifications** for booking requests, accepts, ride start, SOS.
- **Haptics** on key confirmations; native share for ride/route.
- **Uber API discarded** (optional cab-fare reference only, if available).

---

## 8. Non-functional
- Adaptive across phone/tablet/foldable/landscape (use `android-adaptive` guidance).
- Safe-area compliance for headers, tab bar, SOS/CTA bars; no content under notch/gesture bar.
- Light/dark parity; reduced-motion + dynamic type support without layout breakage.
- Offline messaging + degraded modes on slow networks.
- 60fps lists (virtualize), input latency <100ms, tap feedback <100ms.
- Play Store policy & permissions hygiene (use `android-play-policy-insights`); Android Intent security for any deep-link handlers.

---

## 9. Acceptance criteria
1. Expo TS app runs on Android (and iOS if targeted) from a clean checkout.
2. Design system persisted (`--stack react-native`) and aligned with web `MASTER.md`.
3. Native SmoothInput is the default input; the 5 other component experiences recreated natively.
4. Intro film generated via `/brag`, plays splash→video with skip + reduced-motion fallback.
5. Corridor/direction matching works against shared Supabase `rides.route_polyline`.
6. Sole admin `pranjalmishra2409@gmail.com` enforced client + server-side.
7. Capped pricing band + bargaining + Razorpay (INR) working.
8. SOS with real GPS + native call + edge-fn dispatch; WebRTC VC with text fallback.
9. Background driver tracking + push notifications functioning.
10. Safe areas, touch targets ≥44pt, light/dark parity, reduced-motion — all verified per the `ui-ux-pro-max` App-UI checklist.
