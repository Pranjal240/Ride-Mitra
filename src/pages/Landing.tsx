import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bike,
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
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { Field } from "@/components/ui/smooth-input";
import { HoverExpandGallery, type GalleryItem } from "@/components/ui/hover-expand";
import { ScrollReveal, Reveal, RevealGroup, RevealItem } from "@/components/ui/scroll-reveal";
import { VideoReveal } from "@/components/ui/video-reveal";
import { TrafficHero } from "@/components/ui/traffic-hero";
import {
  Badge,
  Button,
  buttonVariants,
  Container,
  Eyebrow,
  Panel,
  SectionHeading,
  type BadgeTone,
} from "@/components/ui/primitives";
import { CursorGlow, Magnetic, MagneticButton, MouseParallax } from "@/components/ui/cursor";
import LiveMap from "@/components/landing/LiveMap";
import IntroFilm from "@/components/landing/IntroFilm";
import LandingHeader from "@/components/landing/LandingHeader";
import Logo from "@/components/common/Logo";
import { cn } from "@/lib/utils";

const APK_URL =
  "https://github.com/Pranjal240/Ride-Mitra/releases/latest/download/RideMitra.apk";

/* ── On-load character reveal for the hero headline ──────────── */
function HeroTitle() {
  const reduce = useReducedMotion();
  const lines: { text: string; accent?: boolean }[] = [
    { text: "Share the ride." },
    { text: "Skip the wait.", accent: true },
  ];

  return (
    <h1 className="font-display text-[clamp(2.75rem,9vw,7rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-foreground">
      {lines.map((line, li) => {
        const chars = [...line.text];
        return (
          <span key={li} className={cn("block", line.accent && "text-accent")}>
            {chars.map((ch, ci) =>
              reduce ? (
                <span key={ci}>{ch}</span>
              ) : (
                <motion.span
                  key={ci}
                  className="inline-block"
                  initial={{ opacity: 0, y: "0.6em", rotateX: -40 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    delay: 0.15 + li * 0.28 + ci * 0.028,
                    duration: 0.62,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ transformOrigin: "bottom" }}
                >
                  {ch === " " ? " " : ch}
                </motion.span>
              ),
            )}
          </span>
        );
      })}
    </h1>
  );
}

/* ── Hero route search (SmoothInput showcase) ────────────────── */
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
      className="flex w-full max-w-2xl flex-col gap-2.5 rounded-3xl border border-border bg-card p-2.5 shadow-md sm:flex-row sm:items-center"
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

const STEPS: GalleryItem[] = [
  {
    tag: "01",
    title: "Verify with campus email",
    caption: "Sign in with your JC Bose UST Google account. One-time check — no paperwork.",
    icon: <GraduationCap />,
  },
  {
    tag: "02",
    title: "Match on your corridor",
    caption: "We surface only rides already travelling your route, in your direction.",
    icon: <Route />,
  },
  {
    tag: "03",
    title: "Agree the fare",
    caption: "A fair, distance-capped price. Counter-offer if you like — no surge, ever.",
    icon: <Wallet />,
  },
  {
    tag: "04",
    title: "Track, chat, arrive",
    caption: "Live GPS the whole way, in-app chat, one-tap SOS. Split at the pump.",
    icon: <Navigation />,
  },
];

const VEHICLES: GalleryItem[] = [
  { tag: "4 seats", title: "Car pool", caption: "Split a full car four ways on the long campus run.", icon: <Car /> },
  { tag: "1 pillion", title: "Bike pool", caption: "Beat the Mathura Road jam on two wheels.", icon: <Bike /> },
  { tag: "Group", title: "Society runs", caption: "Recurring rides for the same colony, same schedule.", icon: <Users /> },
];

const STATS = [
  { v: "100%", label: "Drivers verified", note: "Licence + college ID" },
  { v: "100%", label: "Rides tracked", note: "Live GPS + SOS" },
  { v: "₹0", label: "Surge & commission", note: "Split real fuel only" },
  { v: "1", label: "Campus, closed", note: "@jcboseust.ac.in" },
];

const TONE_TILE: Record<BadgeTone, string> = {
  neutral: "bg-muted text-foreground",
  accent: "bg-accent-soft text-accent-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

const COMPARE: [string, boolean | "basic", boolean][] = [
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
      return !sessionStorage.getItem("rm_intro_v2");
    } catch {
      return false;
    }
  });
  const endIntro = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem("rm_intro_v2", "1");
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <SmoothScroll>
      {showIntro && <IntroFilm onDone={endIntro} />}
      <LandingHeader />

      <main className="overflow-x-hidden bg-background text-foreground">
        {/* ── HERO — name anchored to the corner, full-bleed map below ── */}
        <section className="relative overflow-hidden">
          {/* name block, pulled to the top-left corner */}
          <div className="relative pt-24 pb-10 sm:pt-28">
            <CursorGlow size={520} />
            <Container size="7xl" className="relative z-10">
              <MouseParallax intensity={16} className="max-w-5xl">
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

                <div className="mt-6">
                  <HeroTitle />
                </div>
              </MouseParallax>

              {/* compact supporting row, left-aligned under the name */}
              <div className="mt-7 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                <motion.p
                  initial={reduce ? undefined : { opacity: 0, y: 16 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.95, duration: 0.6 }}
                  className="max-w-xl text-lg leading-relaxed text-muted-foreground"
                >
                  The closed carpool network built only for JC Bose University students and
                  staff — verified faces, live-tracked trips, fares split at the pump.
                  <span className="font-semibold text-foreground"> No surge. No strangers.</span>
                </motion.p>

                <motion.div
                  initial={reduce ? undefined : { opacity: 0, y: 16 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 1.05, duration: 0.6 }}
                  className="flex shrink-0 flex-wrap items-center gap-3"
                >
                  <MagneticButton size="lg" onClick={() => navigate("/portal")} icon={<Car className="size-4" />}>
                    Find a ride
                  </MagneticButton>
                  <MagneticButton size="lg" variant="secondary" onClick={() => navigate("/portal")}>
                    Offer a ride <ArrowRight className="size-4" />
                  </MagneticButton>
                </motion.div>
              </div>

              <motion.div
                initial={reduce ? undefined : { opacity: 0 }}
                animate={reduce ? undefined : { opacity: 1 }}
                transition={{ delay: 1.15, duration: 0.6 }}
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
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
                transition={{ delay: 1.25, duration: 0.6 }}
                className="mt-8"
              >
                <HeroSearch />
              </motion.div>
            </Container>
          </div>

          {/* full-bleed live map, edge to edge under the name */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 24 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8 }}
            className="relative w-screen"
          >
            <LiveMap className="h-[62vh] min-h-[460px] w-full border-y border-border" />
          </motion.div>
        </section>

        {/* ── SCROLL STATEMENT ─────────────────────────────── */}
        <section className="py-24 sm:py-32">
          <Container size="6xl" className="text-center">
            <ScrollReveal
              as="h2"
              text="Same route. Same time. Share the ride."
              accent={["Share", "the", "ride."]}
              className="mx-auto max-w-4xl text-[clamp(2rem,6vw,4.5rem)] font-extrabold leading-[1.02] tracking-tight text-foreground"
            />
            <Reveal delay={0.1}>
              <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
                Hundreds of students leave the same colonies for the same gate every morning.
                Ride Mitra simply puts them in the same car.
              </p>
            </Reveal>
          </Container>
        </section>

        {/* ── TRAFFIC METAPHOR ─────────────────────────────── */}
        <section className="bg-muted/40 py-8">
          <TrafficHero
            eyebrow="The daily wait"
            title={
              <>
                Everyone&apos;s stuck in the same jam.
                <span className="text-accent"> Why ride it alone?</span>
              </>
            }
            subtitle="One rider per car means more cars at the gate, longer waits, and a bigger fuel bill for everyone. Pool the trip and the road clears — for you and the whole campus."
            actions={
              <>
                <MagneticButton onClick={() => navigate("/portal")}>Start pooling</MagneticButton>
                <VideoReveal src="/launch.mp4" poster="/launch-poster.jpg">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[15px] font-semibold text-foreground transition-colors hover:border-accent">
                    <Play className="size-4 fill-current" /> Watch the film
                  </span>
                </VideoReveal>
              </>
            }
          />
        </section>

        {/* ── HOW IT WORKS (hover-expand) ──────────────────── */}
        <section id="how" className="py-20 sm:py-28">
          <Container size="7xl">
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="4 steps · 60 seconds"
                title={<>Your first ride is minutes away.</>}
                description="Hover a step to open it — on your phone, just tap."
                className="mb-12"
              />
            </Reveal>
            <HoverExpandGallery items={STEPS} defaultActive={0} />
          </Container>
        </section>

        {/* ── VEHICLE TYPES (hover-expand) ─────────────────── */}
        <section className="bg-muted/40 py-20 sm:py-28">
          <Container size="7xl">
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="However you travel"
                title="A pool for every kind of trip."
                className="mb-12"
              />
            </Reveal>
            <HoverExpandGallery items={VEHICLES} defaultActive={0} />
          </Container>
        </section>

        {/* ── TRUST / SAFETY BENTO ─────────────────────────── */}
        <section id="safety" className="py-20 sm:py-28">
          <Container size="7xl">
            <Reveal>
              <SectionHeading
                eyebrow="Safety by design"
                title={<>Trust is the whole point.</>}
                description="A university-governed network where every safeguard is on by default — not an upsell."
                className="mb-12 max-w-2xl"
              />
            </Reveal>

            <div className="grid gap-4 md:grid-cols-6">
              <Panel className="md:col-span-4 md:row-span-2 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-navy to-navy-light text-white" inset="lg">
                <div>
                  <Badge tone="accent" icon={<ShieldCheck />}>
                    Verified community
                  </Badge>
                  <h3 className="mt-5 font-display text-2xl font-bold sm:text-3xl">
                    Every face is a verified JC Bose UST student or staff member.
                  </h3>
                  <p className="mt-3 max-w-md text-white/70">
                    Licence and college-ID checks for drivers, campus email for everyone. You
                    always know exactly who you&apos;re riding with.
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {STATS.map((s) => (
                    <div key={s.label}>
                      <div className="font-mono text-2xl font-semibold tabular-nums text-accent sm:text-3xl">
                        {s.v}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">{s.label}</div>
                      <div className="text-xs text-white/55">{s.note}</div>
                    </div>
                  ))}
                </div>
              </Panel>

              {[
                {
                  icon: <Navigation className="size-5" />,
                  tone: "info" as const,
                  title: "Live GPS on every ride",
                  body: "Watch the trip move in real time and auto-share your ETA with trusted contacts.",
                },
                {
                  icon: <Zap className="size-5" />,
                  tone: "danger" as const,
                  title: "One-tap SOS",
                  body: "An emergency alert with your live location, always one tap away.",
                },
                {
                  icon: <MessageCircle className="size-5" />,
                  tone: "accent" as const,
                  title: "Chat & video support",
                  body: "Coordinate pickup — and reach live support — without sharing your number.",
                },
                {
                  icon: <Clock className="size-5" />,
                  tone: "success" as const,
                  title: "Fair, capped fares",
                  body: "Distance-based price bands with room to bargain. No surge, no commission.",
                },
              ].map((c) => (
                <Panel key={c.title} hover className="md:col-span-2">
                  <span
                    className={cn(
                      "inline-grid size-11 place-items-center rounded-2xl [&>svg]:size-5",
                      TONE_TILE[c.tone],
                    )}
                    aria-hidden
                  >
                    {c.icon}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-foreground">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{c.body}</p>
                </Panel>
              ))}
            </div>
          </Container>
        </section>

        {/* ── COMPARISON ───────────────────────────────────── */}
        <section id="compare" className="bg-muted/40 py-20 sm:py-28">
          <Container size="5xl">
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="Why Ride Mitra"
                title={<>Not a cab app with a student sticker.</>}
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
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-[1.6fr_0.7fr_0.7fr] items-center px-5 py-4 sm:grid-cols-[2fr_1fr_1fr] sm:px-8",
                      i % 2 === 1 && "bg-muted/50",
                    )}
                  >
                    <span className="pr-3 text-sm font-medium text-foreground">{row[0]}</span>
                    <span className="flex justify-center">
                      <Check className="size-5 text-success" />
                    </span>
                    <span className="flex justify-center text-muted-foreground">
                      {row[2] ? <Check className="size-5 text-success" /> : <span className="text-lg">—</span>}
                    </span>
                  </div>
                ))}
              </Panel>
            </Reveal>
          </Container>
        </section>

        {/* ── SEE IT IN MOTION (VideoReveal) ───────────────── */}
        <section className="py-20 sm:py-28">
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
              <VideoReveal src="/launch.mp4" poster="/launch-poster.jpg" className="group block">
                <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border shadow-lg">
                  <img
                    src="/launch-poster.jpg"
                    alt="Ride Mitra film"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 grid place-items-center bg-navy/30">
                    <span className="grid size-16 place-items-center rounded-full bg-accent text-navy shadow-xl">
                      <Play className="size-6 fill-current" />
                    </span>
                  </div>
                </div>
              </VideoReveal>
            </Reveal>
          </Container>
        </section>

        {/* ── GET THE APP ──────────────────────────────────── */}
        <section id="get-app" className="py-20 sm:py-28">
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
                    <Magnetic>
                      <a
                        href={APK_URL}
                        download
                        className={cn(buttonVariants({ variant: "accent", size: "lg" }))}
                      >
                        <Download className="size-4" /> Download APK
                      </a>
                    </Magnetic>
                    <span className="font-mono text-xs text-muted-foreground">
                      ~86 MB · direct install
                    </span>
                  </div>
                </div>
                <div className="justify-self-center text-center">
                  <div className="inline-block rounded-3xl border border-border bg-card p-4 shadow-md">
                    <QRCodeSVG value={APK_URL} size={148} fgColor="#1B2B4B" bgColor="#FFFFFF" level="M" />
                  </div>
                  <div className="mt-3 text-sm font-medium text-muted-foreground">
                    Scan to install
                  </div>
                </div>
              </div>
            </Panel>
          </Container>
        </section>

        {/* ── CLOSING CTA ──────────────────────────────────── */}
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
                  <div className="mt-9 flex flex-wrap justify-center gap-3">
                    <MagneticButton size="lg" variant="accent" onClick={() => navigate("/portal")}>
                      Choose your portal <ArrowRight className="size-4" />
                    </MagneticButton>
                    <MagneticButton
                      size="lg"
                      variant="secondary"
                      className="border-white/25 text-white hover:border-accent hover:text-accent"
                      onClick={() => navigate("/rides")}
                    >
                      Browse rides
                    </MagneticButton>
                  </div>
                </RevealItem>
              </RevealGroup>
            </div>
          </Container>
        </section>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <footer className="border-t border-border py-10">
          <Container size="7xl" className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Logo size={30} />
              <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
                Ride<span className="text-accent">Mitra</span>
              </span>
              <span className="ml-3 text-sm text-muted-foreground">
                © {year} · Made for JC Bose UST
              </span>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="transition-colors hover:text-foreground">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-foreground">
                Terms
              </Link>
              <a href="mailto:hello@ridemitra.app" className="transition-colors hover:text-foreground">
                Contact
              </a>
            </nav>
          </Container>
        </footer>
      </main>
    </SmoothScroll>
  );
}
