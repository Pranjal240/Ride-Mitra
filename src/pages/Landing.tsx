import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import {
  ArrowRight,
  Car,
  Check,
  Clock,
  Download,
  GraduationCap,
  IndianRupee,
  MapPin,
  MessageCircle,
  Navigation,
  Play,
  Route,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { Field } from "@/components/ui/smooth-input";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/scroll-reveal";
import { VideoReveal } from "@/components/ui/video-reveal";
import { TextRoll } from "@/components/ui/text-roll";
import { Marquee } from "@/components/ui/marquee";
import { CrowdCanvas } from "@/components/ui/crowd-canvas";
import { RidePoster } from "@/components/ui/ride-illustrations";
import { type RideSlide } from "@/components/ui/ride-carousel";
import { PopButton } from "@/components/ui/pop-button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { MorphText } from "@/components/ui/morph-text";
import { AnimatedFooter } from "@/components/ui/animated-footer";
import { SocialFlipButton } from "@/components/ui/social-flip-button";
import {
  Badge,
  Button,
  Container,
  Eyebrow,
  Panel,
  SectionHeading,
} from "@/components/ui/primitives";
import { CursorGlow } from "@/components/ui/cursor";
import LiveMap from "@/components/landing/LiveMap";
import IntroFilm from "@/components/landing/IntroFilm";
import LandingHeader from "@/components/landing/LandingHeader";
import Logo from "@/components/common/Logo";
import { cn } from "@/lib/utils";

const APK_URL =
  "https://github.com/Pranjal240/Ride-Mitra/releases/latest/download/RideMitra.apk";

/* ── 3D tilt-to-cursor wrapper (used by the steps timeline) ── */
function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 12);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 12);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Hover-expand row of colored posters (Skiper HoverExpand: smooth
      collapse/open morphism — the active card grows, the rest shrink). Fills
      the page edge-to-edge. Used for both the ride types and the corridors. ── */
function HoverExpandRides({ slides, tall }: { slides: RideSlide[]; tall?: boolean }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  return (
    <div
      className="mx-auto flex w-full max-w-none gap-2.5 px-4 sm:px-6 lg:gap-3.5 lg:px-10"
      onMouseLeave={() => setActive(-1)}
    >
      {slides.map((s, i) => (
        <motion.div
          key={i}
          role="button"
          tabIndex={0}
          onMouseEnter={() => setActive(i)}
          onFocus={() => setActive(i)}
          onClick={() => setActive(i)}
          animate={reduce ? undefined : { flexGrow: active === i ? 3.2 : 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "min-w-0 flex-1 basis-0 cursor-pointer outline-none",
            tall ? "h-[24rem] sm:h-[30rem]" : "h-[22rem] sm:h-[27rem]",
          )}
          style={{ flexGrow: active === i ? 3.2 : 1 }}
        >
          <RidePoster
            tone={s.tone}
            kind={s.kind}
            eyebrow={s.eyebrow}
            title={s.title}
            caption={active === i ? s.caption : undefined}
            className={cn(
              "transition-shadow duration-500",
              active === i ? "shadow-2xl ring-1 ring-black/5" : "shadow-md",
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ── Hero route search (SmoothInput showcase) ── */
function HeroSearch() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate("/rides");
      }}
      className="flex w-full max-w-2xl flex-col gap-2.5 rounded-3xl border border-border bg-card p-2.5 text-left shadow-md sm:flex-row sm:items-center"
    >
      <div className="sm:flex-1">
        <Field
          aria-label="Pickup point"
          placeholder="From your gate…"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          icon={<Navigation className="size-4" />}
          wrapperClassName="border-transparent bg-muted2"
        />
      </div>
      <div className="sm:flex-1">
        <Field
          aria-label="Destination"
          placeholder="Where to?"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          icon={<MapPin className="size-4" />}
          wrapperClassName="border-transparent bg-muted2"
        />
      </div>
      <Button type="submit" size="lg" variant="accent" className="shrink-0" icon={<Route className="size-4" />}>
        Find rides
      </Button>
    </form>
  );
}

/* How pooling works — four steps */
const STEPS = [
  { n: "01", icon: <GraduationCap className="size-5" />, title: "Verify with campus email", body: "Sign in with your JC Bose UST Google account. One-time check — no paperwork." },
  { n: "02", icon: <Route className="size-5" />, title: "Match on your corridor", body: "We surface only rides already travelling your route, in your direction." },
  { n: "03", icon: <Wallet className="size-5" />, title: "Agree the fare", body: "A fair, distance-capped price. Counter-offer if you like — no surge, ever." },
  { n: "04", icon: <Navigation className="size-5" />, title: "Track, chat, arrive", body: "Live GPS the whole way, in-app chat, one-tap SOS. Split at the pump." },
];

/* Ride types — varied colored posters for the carousel */
const RIDE_SLIDES: RideSlide[] = [
  { tone: "navy", kind: "car", eyebrow: "4 seats", title: "Car pool", caption: "Split a full car four ways on the long campus run." },
  { tone: "clay", kind: "scooter", eyebrow: "1 pillion", title: "Scooter pool", caption: "Nip through the Mathura Road jam on two wheels." },
  { tone: "sage", kind: "bike", eyebrow: "1 pillion", title: "Bike pool", caption: "A quick lift to the gate — fuel split fairly." },
  { tone: "sky", kind: "suv", eyebrow: "6 seats", title: "Society run", caption: "Recurring rides for the same colony, same schedule." },
  { tone: "plum", kind: "car", eyebrow: "Weekends", title: "One-off trip", caption: "Heading home for the break? Fill the empty seats." },
  { tone: "gold", kind: "suv", eyebrow: "Staff", title: "Faculty pool", caption: "Same department, same hours — ride in together." },
];

const MARQUEE = [
  "VERIFIED @jcboseust.ac.in",
  "SPLIT THE FUEL",
  "NO SURGE, EVER",
  "LIVE-TRACKED TRIPS",
  "ONE-TAP SOS",
  "CORRIDOR MATCHING",
  "STUDENTS & STAFF ONLY",
];

const STATS = [
  { num: 100, prefix: "", suffix: "%", label: "Drivers verified", note: "Licence + college ID" },
  { num: 100, prefix: "", suffix: "%", label: "Rides tracked", note: "Live GPS + SOS" },
  { num: 0, prefix: "₹", suffix: "", label: "Surge & commission", note: "Split real fuel only" },
  { num: 1, prefix: "", suffix: "", label: "Campus, closed", note: "@jcboseust.ac.in" },
];

/* Trust pillars — hover-expand cards (collapse/open morphism). The verified
   card carries the stats and opens widest by default. */
type TrustCard = {
  tone: string;
  icon: ReactNode;
  title: string;
  body: string;
  stats?: typeof STATS;
};
const TRUST_CARDS: TrustCard[] = [
  { tone: "navy", icon: <ShieldCheck className="size-6" />, title: "Every face is verified", body: "Licence and college-ID checks for drivers, campus email for everyone — you always know exactly who you're riding with.", stats: STATS },
  { tone: "sky", icon: <Navigation className="size-6" />, title: "Live GPS on every ride", body: "Watch the trip move in real time and auto-share your ETA with trusted contacts." },
  { tone: "clay", icon: <Zap className="size-6" />, title: "One-tap SOS", body: "An emergency alert with your live location — always one tap away." },
  { tone: "sage", icon: <MessageCircle className="size-6" />, title: "Chat & video support", body: "Coordinate pickup and reach live support without sharing your number." },
  { tone: "plum", icon: <Clock className="size-6" />, title: "Fair, capped fares", body: "Distance-based price bands with room to bargain. No surge, no commission." },
];

const TRUST_BG: Record<string, string> = {
  navy: "bg-gradient-to-br from-navy to-navy-light text-white",
  sky: "bg-[#2C4A7C] text-white",
  clay: "bg-[#C8956C] text-[#2A1A0E]",
  sage: "bg-[#3E6E5A] text-white",
  plum: "bg-[#5B4B6E] text-white",
};

/* ── Trust hover-expand row (Skiper HoverExpand morphism) ── */
function TrustExpand() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  return (
    <div
      className="mx-auto flex w-full max-w-none flex-col gap-3 px-4 sm:px-6 lg:h-[28rem] lg:flex-row lg:gap-3.5 lg:px-10"
      onMouseLeave={() => setActive(0)}
    >
      {TRUST_CARDS.map((c, i) => {
        const isActive = active === i;
        return (
          <motion.div
            key={c.title}
            role="button"
            tabIndex={0}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            animate={reduce ? undefined : { flexGrow: isActive ? 3 : 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ flexGrow: isActive ? 3 : 1 }}
            className={cn(
              "group relative min-w-0 flex-1 basis-0 cursor-pointer overflow-hidden rounded-[1.75rem] p-7 outline-none transition-shadow duration-500",
              isActive ? "shadow-2xl" : "shadow-md",
              TRUST_BG[c.tone],
            )}
          >
            <motion.span
              aria-hidden
              animate={reduce ? undefined : { y: isActive ? [0, -5, 0] : 0 }}
              transition={{ duration: 3.4, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
              className="inline-grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur [&>svg]:size-6"
            >
              {c.icon}
            </motion.span>
            <h3 className="mt-5 font-display text-xl font-bold leading-tight">{c.title}</h3>
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  initial={reduce ? undefined : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                >
                  <p className="mt-3 max-w-md text-sm leading-relaxed opacity-85">{c.body}</p>
                  {c.stats && (
                    <div className="mt-7 grid max-w-md grid-cols-2 gap-5">
                      {c.stats.map((s) => (
                        <div key={s.label}>
                          <div className="font-mono text-2xl font-semibold text-accent sm:text-3xl">
                            <AnimatedNumber value={s.num} prefix={s.prefix} suffix={s.suffix} />
                          </div>
                          <div className="mt-1 text-sm font-semibold">{s.label}</div>
                          <div className="text-xs opacity-60">{s.note}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

const COMPARE: [string, boolean, boolean][] = [
  ["Verified students & staff only", true, false],
  ["Corridor + direction matching", true, false],
  ["Split fuel — no surge, no commission", true, false],
  ["Live tracking + one-tap SOS", true, false],
  ["In-ride chat & video support", true, false],
  ["Fare bargaining within a fair band", true, false],
];

export default function Landing() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [showIntro, setShowIntro] = useState(() => {
    try {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
      if (sessionStorage.getItem("rm_intro_v2")) return false;
      // Mark it the MOMENT we decide to show it, so navigating back to "/" (or any
      // remount) never replays the film — it plays only on the true first load.
      sessionStorage.setItem("rm_intro_v2", "1");
      return true;
    } catch {
      return false;
    }
  });
  const endIntro = () => setShowIntro(false);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <>
      {/* The animated grid backdrop is now mounted app-wide in App.tsx
          (<AppBackground />) so it lives behind every route, not just here. */}
      <SmoothScroll>
        {showIntro && <IntroFilm onDone={endIntro} />}

        <LandingHeader />

        <main className="relative z-0 overflow-x-hidden text-foreground">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden pt-24 sm:pt-28">
          <CursorGlow size={420} />

          {/* flanking posters (lg+) */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden lg:block">
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 30 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute left-[2.5vw] top-[46%] w-[14vw] max-w-[200px] -translate-y-1/2 -rotate-6"
            >
              <div className="h-[290px]">
                <RidePoster tone="clay" kind="scooter" eyebrow="2 wheels" title="Scooter pool" />
              </div>
            </motion.div>
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 30 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="absolute right-[2.5vw] top-[46%] w-[14vw] max-w-[200px] -translate-y-1/2 rotate-6"
            >
              <div className="h-[290px]">
                <RidePoster tone="navy" kind="car" eyebrow="4 seats" title="Car pool" />
              </div>
            </motion.div>
          </div>

          <Container size="6xl" className="relative z-10 flex flex-col items-center pb-12 text-center">
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 12 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-sm"
            >
              <ShieldCheck className="size-3.5 text-accent" />
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                JC Bose University · YMCA Faridabad
              </span>
            </motion.div>

            <h1 className="mt-6 font-display text-[clamp(1.9rem,9vw,7rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-foreground">
              <TextRoll as="span" center animateOnView className="block">
                Share the ride.
              </TextRoll>
              <TextRoll as="span" center animateOnView className="mt-1 block text-accent">
                Skip the wait.
              </TextRoll>
            </h1>

            <motion.p
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
            >
              The closed carpool network built only for JC Bose University students and staff —
              verified faces, live-tracked trips, fares split at the pump.
              <span className="font-semibold text-foreground"> No surge. No strangers.</span>
            </motion.p>

            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-3"
            >
              <PopButton size="lg" onClick={() => navigate("/portal")}>
                <Car className="size-4" /> Find a ride
              </PopButton>
              <PopButton size="lg" variant="secondary" onClick={() => navigate("/portal")}>
                Offer a ride <ArrowRight className="size-4" />
              </PopButton>
            </motion.div>

            <motion.p
              initial={reduce ? undefined : { opacity: 0 }}
              animate={reduce ? undefined : { opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.6 }}
              className="mt-5 text-base font-medium text-muted-foreground"
            >
              The pool built for{" "}
              <MorphText words={["students", "staff", "faculty", "you"]} textClassName="font-extrabold" /> at
              JC Bose UST.
            </motion.p>

            <motion.div
              initial={reduce ? undefined : { opacity: 0 }}
              animate={reduce ? undefined : { opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
            >
              {[
                { icon: <ShieldCheck className="size-4 text-success" />, t: "Verified campus ID" },
                { icon: <Navigation className="size-4 text-accent" />, t: "Live GPS + SOS" },
                { icon: <IndianRupee className="size-4 text-info" />, t: "No surge, no commission" },
              ].map((c, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  {c.icon}
                  {c.t}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mt-8 w-full max-w-2xl"
            >
              <HeroSearch />
            </motion.div>

            <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3 lg:hidden">
              <div className="h-40">
                <RidePoster tone="clay" kind="scooter" eyebrow="2 wheels" title="Scooter" />
              </div>
              <div className="h-40">
                <RidePoster tone="navy" kind="car" eyebrow="4 seats" title="Car pool" />
              </div>
            </div>
          </Container>

          <div className="mt-4 w-full border-y border-border bg-navy py-3.5">
            <Marquee
              speed={34}
              items={MARQUEE.map((m) => (
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                  {m}
                </span>
              ))}
            />
          </div>
        </section>

        {/* ── LIVE MAP — full-bleed campus band ── */}
        <section className="relative w-full">
          <LiveMap className="h-[52vh] min-h-[380px] w-full border-b border-border" />
        </section>

        {/* ── THE DAILY WAIT — heading + crowd in ONE compact panel ── */}
        <section className="relative w-full overflow-hidden">
          <div className="relative h-[62vh] min-h-[480px] w-full">
            <CrowdCanvas className="absolute inset-0" />
            {/* top fade so the heading reads over the crowd */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-3/4 bg-gradient-to-b from-white via-white/85 to-transparent" />
            <div className="absolute inset-x-0 top-0 px-6 pt-16 text-center sm:pt-20">
              <Eyebrow>The daily wait</Eyebrow>
              <Reveal>
                <h2 className="mx-auto mt-3 max-w-4xl font-display text-[clamp(1.75rem,5vw,3.5rem)] font-extrabold leading-[1.03] tracking-tight text-foreground">
                  Everyone&apos;s on the same road.
                  <span className="text-accent"> Why ride it alone?</span>
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                  Hundreds leave the same colonies for the same gate every morning. Pool the trip and
                  the road clears — for you and the whole campus.
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <PopButton onClick={() => navigate("/portal")}>Start pooling</PopButton>
                  <VideoReveal src="/launch.mp4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-[15px] font-semibold text-foreground transition-colors hover:border-accent">
                      <Play className="size-4 fill-current" /> Watch the film
                    </span>
                  </VideoReveal>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── A POOL FOR EVERY TRIP — full-bleed colored carousel (moved up) ── */}
        <section className="overflow-hidden py-20 sm:py-24">
          <Container size="7xl">
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="However you travel"
                title="A pool for every kind of trip."
                description="Car, scooter, bike or the weekend society run — hover a card to open it."
                className="mb-12"
              />
            </Reveal>
          </Container>
          <Reveal>
            <HoverExpandRides slides={RIDE_SLIDES} />
          </Reveal>
        </section>

        {/* ── TRUST — rebuilt: big navy statement + animated colored pillars ── */}
        <section id="safety" className="py-20 sm:py-28">
          <Container size="7xl">
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="Safety by design"
                title="Trust is the whole point."
                description="A university-governed network where every safeguard is on by default — not an upsell."
                className="mb-12"
              />
            </Reveal>
          </Container>

          <Reveal>
            <TrustExpand />
          </Reveal>
        </section>

        {/* ── COMPARISON ── */}
        <section id="compare" className="py-20 sm:py-28">
          <Container size="5xl">
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="Why Ride Mitra"
                title="Not a cab app with a student sticker."
                className="mb-12"
              />
            </Reveal>
            <Reveal delay={0.1}>
              <Panel inset="none" className="overflow-hidden">
                <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr] items-center bg-navy px-5 py-4 text-white sm:grid-cols-[2fr_1fr_1fr] sm:px-8">
                  <span className="font-display text-sm font-bold uppercase tracking-wide text-accent">
                    Ride Mitra vs. cab apps
                  </span>
                  <span className="text-center font-display text-sm font-bold">Ride Mitra</span>
                  <span className="text-center text-sm font-semibold text-white/60">Cab apps</span>
                </div>
                {COMPARE.map((row, i) => (
                  <motion.div
                    key={i}
                    initial={reduce ? undefined : { opacity: 0, x: -18 }}
                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "group grid grid-cols-[1.6fr_0.7fr_0.7fr] items-center px-5 py-4 transition-colors hover:bg-accent-soft/50 sm:grid-cols-[2fr_1fr_1fr] sm:px-8",
                      i % 2 === 1 && "bg-muted/50",
                    )}
                  >
                    <span className="pr-3 text-sm font-medium text-foreground">{row[0]}</span>
                    <span className="flex justify-center">
                      <motion.span
                        initial={reduce ? undefined : { scale: 0, rotate: -30 }}
                        whileInView={reduce ? undefined : { scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 320, damping: 16, delay: i * 0.07 + 0.15 }}
                        className="grid size-7 place-items-center rounded-full bg-success-soft text-success"
                      >
                        <Check className="size-4" strokeWidth={3} />
                      </motion.span>
                    </span>
                    <span className="flex justify-center text-muted-foreground">
                      {row[2] ? <Check className="size-5 text-success" /> : <span className="text-lg">—</span>}
                    </span>
                  </motion.div>
                ))}
              </Panel>
            </Reveal>
          </Container>
        </section>

        {/* ── HOW IT WORKS — 3D tilt steps, connected (moved near the bottom) ── */}
        <section id="how" className="py-20 sm:py-28">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="4 steps · 60 seconds"
                title="Your first ride is minutes away."
                description="Move your cursor over a step — no app-store detour, just verify and go."
                className="mb-14"
              />
            </Reveal>
            <div className="relative">
              {/* connecting line (lg) */}
              <div
                aria-hidden
                className="absolute left-0 right-0 top-[46px] hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent lg:block"
              />
              <RevealGroup className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((s) => (
                  <RevealItem key={s.n}>
                    <TiltCard className="group h-full [transform-style:preserve-3d]">
                      <div className="relative h-full overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl">
                        {/* giant watermark number */}
                        <span className="pointer-events-none absolute -right-3 -top-6 select-none font-display text-[7rem] font-extrabold leading-none text-muted/60 transition-colors duration-300 group-hover:text-accent-soft">
                          {s.n}
                        </span>
                        {/* hover gradient wash */}
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 opacity-0 transition-opacity duration-300 group-hover:from-accent/5 group-hover:to-transparent group-hover:opacity-100" />
                        <motion.span
                          aria-hidden
                          animate={reduce ? undefined : { y: [0, -5, 0] }}
                          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                          className="relative grid size-13 place-items-center rounded-2xl bg-navy text-white shadow-md transition-colors group-hover:bg-accent group-hover:text-navy [&>svg]:size-6"
                        >
                          {s.icon}
                        </motion.span>
                        <h3 className="relative mt-6 font-display text-lg font-bold text-foreground">{s.title}</h3>
                        <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                      </div>
                    </TiltCard>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </Container>
        </section>

        {/* ── SEE IT IN MOTION — branded dark thumbnail (no white poster) ── */}
        <section className="py-16 sm:py-20">
          <Container size="6xl">
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="See it in motion"
                title="Campus rides, in twenty seconds."
                className="mb-10"
              />
            </Reveal>
            <Reveal delay={0.1}>
              <VideoReveal src="/launch.mp4" className="group block">
                <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-navy to-navy-light shadow-lg">
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-navy shadow-xl transition-transform group-hover:scale-110">
                        <Play className="size-6 fill-current" />
                      </span>
                      <p className="mt-4 font-display text-xl font-bold text-white">
                        Ride<span className="text-accent">Mitra</span> — the film
                      </p>
                      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-white/50">
                        20 seconds · no sound needed
                      </p>
                    </div>
                  </div>
                </div>
              </VideoReveal>
            </Reveal>
          </Container>
        </section>

        {/* ── GET THE APP ── */}
        <section id="get-app" className="py-16 sm:py-20">
          <Container size="6xl">
            <Panel inset="none" className="overflow-hidden border-accent/30">
              <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.3fr_0.7fr]">
                <div>
                  <Badge tone="accent" icon={<Download />}>
                    Android app · v1.0
                  </Badge>
                  <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                    Take Ride Mitra <span className="text-accent">with you.</span>
                  </h2>
                  <p className="mt-4 max-w-md text-muted-foreground">
                    Live tracking, one-tap SOS and upfront fares on the move. Free — works on
                    Android 7.0 and up.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <PopButton variant="accent" size="lg" href={APK_URL} download>
                      <Download className="size-4" /> Download APK
                    </PopButton>
                    <span className="font-mono text-xs text-muted-foreground">~86 MB · direct install</span>
                  </div>
                </div>
                <div className="justify-self-center text-center">
                  <a href={APK_URL} download className="inline-block rounded-3xl border border-border bg-card p-4 shadow-md transition-transform hover:scale-105">
                    <QRCodeSVG value={APK_URL} size={148} fgColor="#1B2B4B" bgColor="#FFFFFF" level="M" />
                  </a>
                  <div className="mt-3 text-sm font-medium text-muted-foreground">Scan to install</div>
                </div>
              </div>
            </Panel>
          </Container>
        </section>

        {/* ── CLOSING CTA ── */}
        <section className="pb-28 pt-4">
          <Container size="6xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-light px-6 py-20 text-center text-white sm:py-24">
              <RevealGroup className="relative z-10">
                <RevealItem>
                  <h2 className="mx-auto max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                    Your ride is <span className="text-accent">waiting.</span>
                  </h2>
                </RevealItem>
                <RevealItem>
                  <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
                    Verify your JC Bose UST account and start sharing rides across campus in minutes.
                  </p>
                </RevealItem>
                <RevealItem>
                  <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                    <PopButton variant="accent" size="lg" onClick={() => navigate("/portal")}>
                      Choose your portal <ArrowRight className="size-4" />
                    </PopButton>
                    <PopButton variant="secondary" size="lg" onClick={() => navigate("/rides")}>
                      Browse rides
                    </PopButton>
                  </div>
                </RevealItem>
              </RevealGroup>
            </div>
          </Container>
        </section>

        {/* ── FOOTER ── */}
        <AnimatedFooter>
          <div className="flex items-center gap-2.5">
            <Logo size={32} light />
            <span className="font-display text-lg font-extrabold tracking-tight text-white">
              Ride<span className="text-accent">Mitra</span>
            </span>
            <span className="ml-3 text-sm text-white/55">© {year} · Made for JC Bose UST</span>
          </div>
          <div className="flex flex-col items-start gap-4 sm:items-end">
            <SocialFlipButton />
            <nav className="flex gap-6 text-sm text-white/70">
              <Link to="/privacy" className="transition-colors hover:text-accent">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-accent">
                Terms
              </Link>
              <a href="mailto:hello@ridemitra.app" className="transition-colors hover:text-accent">
                Contact
              </a>
            </nav>
          </div>
        </AnimatedFooter>
        </main>
      </SmoothScroll>
    </>
  );
}
