# Brag Plan: Ride Mitra

## What is this app?
Ride Mitra is a closed carpooling network built only for J.C. Bose University of Science & Technology (YMCA, Faridabad) students and staff — verified faces, live-tracked trips, and fares split at the pump. Anyone from campus can ride (a **User**) or offer seats (a **Service**), from the same account.

## The angle
Everyone on campus is heading the same way at the same time — and doing it in separate cars, stuck in the same gate queue, paying separately for fuel. The video's premise is quiet and confident: *"Ride Mitra simply puts them in the same car."* It opens on the product's own hero line, shows the actual booking flow on a live-tracked route, names the two things you can do (ride as a User / offer seats as a Service), lands the trust story, and closes on the wordmark. It is unmistakably *this* product for *this* campus — not a generic ride-hailing ad.

## Hook (first 2-3 seconds)
The site's real hero headline builds on-screen, letter by letter, on ivory: **"Share the ride."** then, in gold, **"Skip the wait."** — with the campus eyebrow pill above it. The exact wordmark and typography a visitor sees on the landing page, so the video reads as the product itself.

## Key moments (the middle)
- **The booking flow, for real** — a route line draws from a pickup pin to the campus pin on a light map; a ride card slides in ("Sector 6 Gate → J.C. Bose UST · 3 seats · ₹40 · Aarav ★4.9 Verified"); a cursor taps **Book seat** and it confirms. This is the product *doing* its thing.
- **Two roles, one account** — two clean cards arrive one by one: **"Ride as a User."** and **"Offer seats as a Service."** — the corrected role model, stated plainly.
- **Trust, chip by chip** — three trust chips pop in on the beat: *Verified campus ID* (shield), *Live-tracked trips* (pin), *One-tap SOS* (alert).

## Outro / punchline
The Ride Mitra car-and-pin logo assembles, the wordmark locks in (**Ride** navy / **Mitra** gold), and the tagline lands: **"Your campus, carpooled."**

## User flow worth showing
Entry → key action → result, pulled straight from the app:
1. See a matching ride on the route map (RideSearch / LiveMap).
2. Tap **Book seat** on the ride card (BookRide).
3. Ride confirmed and live-tracked (LiveTracking).
The centerpiece (Scene 3) recreates exactly this — not a diagram of it.

## Tone
- Preset: app-store
- Creative direction: "calm, trust-first campus product launch — editorial, unhurried, premium"
- Interpretation: clean feature-card reveals, generous ivory space, one primary thing on screen at a time, smooth slides rather than hard cuts. Confidence through restraint; no gimmicks, no clutter.

## Format: landscape — 1920x1080
## Duration: 20 seconds

## Visual identity (from the project)
- Background: `#F7F5F1` (ivory)
- Accent: `#C8956C` (gold / terracotta); strong `#A67A50`; soft `#F5E6D3`
- Text: `#17223B` (navy ink); primary navy `#1B2B4B`
- Display font: Bricolage Grotesque (extra-bold, tight tracking)
- Body font: Plus Jakarta Sans; data/price in JetBrains Mono
- Strongest visual element: the ivory hero with the two-tone headline, and the car-and-map-pin logo mark

## Share copy (draft)
Ride Mitra is live for J.C. Bose University — the closed carpool network for students & staff. Verified faces, live-tracked trips, fares split at the pump. Share the ride, skip the wait.

## Audio direction
- Role: sparse, professional accents over a clean upbeat bed (app-store)
- Music: `happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` (120 BPM, upbeat, corporate-clean)
- Music treatment: start at 0, volume ~0.32, fade-in ~0.8s, fade-out ~1.8s under the outro logo
- Music cue guidance: bundled preset read (`.../cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`, tempo 120.19 BPM). Beat grid from 3.02s at ~0.5s spacing. Strong cues cluster 16–24s. **Lock the outro logo slam to the 17.52s strong cue.** Beat-grid the three trust chips to 15.02 / 16.02 / 17.02.
- Audio-reactive treatment: subtle intent (logo/card presence breathing). Note: the hyperframes-creative RMS-extraction helper is not installed in this environment, so true per-frame audio-reactivity is unavailable; a gentle deterministic glow pulse stands in and this is documented, not blocking.
- SFX posture: sparse, motion-matched, 0.65–0.75 volume. Soft `interface/drop_*` for card/label pop-ins, `casino/card-slide` for the ride card, `interface/click` for the cursor tap, `impact/impactBell_heavy_000` for the outro logo.
- Audio-coupled moments: headline settle, ride-card slide + cursor tap, role cards one-by-one, trust chips on the beat grid, outro logo on the strong cue.
- Restraint rule: no dense stacking, no strobing, no waveform/equalizer visuals; let the ivory space and the reveals breathe.

## Storyboard

### Scene 1 — Hook: "Share the ride." — 4.0s
Ivory frame. Eyebrow pill (top): "JC BOSE UNIVERSITY · YMCA FARIDABAD" in navy on soft-gold. Giant Bricolage headline builds character-by-character: "Share the ride." (navy) then "Skip the wait." (gold), then holds fully readable.
Sequential/interaction: yes — headline reveals per character, two lines staggered; then holds ~1.5s settled.
Audio intent: music enters warm and low; one soft drop when "Skip the wait." lands.
Audio-coupled idea: soft label pop on the eyebrow; gentle drop on the accent line settle.
Music: upbeat bed fading in.
Transition mood: soft → Scene 2

### Scene 2 — What it is — 3.5s
The Ride Mitra logo mark scales in above the wordmark "Ride Mitra" (Ride navy / Mitra gold). One line below: "The carpool network built only for J.C. Bose University students & staff."
Sequential/interaction: none — single confident reveal, long hold on the sentence (~2.3s settled).
Audio intent: a single clean reveal accent under the logo.
Audio-coupled idea: soft drop on logo appear.
Music: steady bed.
Transition mood: smooth slide → Scene 3

### Scene 3 — The booking flow (centerpiece) — 4.0s
Light route map. A route line draws from a pickup pin ("Sector 6 Gate") to the campus pin ("J.C. Bose UST"). A ride card slides in: "Sector 6 Gate → J.C. Bose UST", "3 seats", "₹40", driver chip "Aarav · ★ 4.9 · Verified". A cursor moves to "Book seat" and taps; button confirms to "Booked ✓".
Sequential/interaction: yes — route draws (0–1s), card slides in (~0.9s), cursor taps Book seat (~2.7s), confirm state (~3.1s).
Audio intent: card motion + a crisp click on the tap + a soft success tick on confirm.
Audio-coupled idea: card-slide sound; interface click on tap.
Music: steady bed.
Transition mood: smooth slide → Scene 4

### Scene 4 — Two roles, one account — 3.0s
Heading "One account. Two ways to move." Two cards arrive one by one: "Ride as a User." (navy card) and "Offer seats as a Service." (gold-outline card).
Sequential/interaction: yes — card 1 then card 2, ~0.5s apart, each held.
Audio intent: a soft drop per card.
Audio-coupled idea: drop on each card arrival.
Music: steady bed, lifting.
Transition mood: smooth slide → Scene 5

### Scene 5 — Safe by design — 3.0s
Heading "Safe by design." Three trust chips pop in one by one: "Verified campus ID" (shield), "Live-tracked trips" (map pin), "One-tap SOS" (alert).
Sequential/interaction: yes — chips beat-gridded to 15.02 / 16.02 / 17.02, each held on screen through the scene.
Audio intent: light tick per chip, building to the outro.
Audio-coupled idea: drop per chip on the beat grid.
Music: bed rising toward the strong cue.
Transition mood: soft lift → Scene 6

### Scene 6 — Logo outro — 2.5s
The car-and-map-pin logo assembles and pulses on the strong cue; wordmark "Ride Mitra" locks in; tagline "Your campus, carpooled." fades up; small line "J.C. Bose University · YMCA Faridabad".
Sequential/interaction: yes — logo slam beat-locked to 17.52s strong cue, then tagline.
Audio intent: one warm bell on the logo slam; music fades out under the hold.
Audio-coupled idea: impact bell on logo lock.
Music: final swell, then fade.
Transition mood: settle / end

**Music mood for this video:** upbeat, clean, corporate-adjacent — confident but calm.
**Audio summary:** A warm upbeat bed fades in under the hero, carries steady through the flow and roles with sparse motion-matched drops and one crisp booking click, builds through the trust chips on the beat grid, and pays off with a single warm bell on the logo before fading out.
