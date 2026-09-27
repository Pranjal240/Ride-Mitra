import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import {
  PiCarBold, PiArrowRightBold, PiGraduationCapBold, PiShieldCheckBold,
  PiChatCircleBold, PiCurrencyInrBold, PiLeafBold, PiLightningBold,
  PiPlayCircleBold, PiCheckCircleFill, PiCrosshairSimpleBold, PiMapPinBold,
  PiNavigationArrowBold, PiDownloadSimpleBold, PiAndroidLogoBold, PiDeviceMobileBold,
  PiXBold,
} from 'react-icons/pi';
import Logo, { LogoText } from '../components/common/Logo';
import T, { FONT } from '../lib/theme';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { QRCodeSVG } from 'qrcode.react';

/* Map markers */
const pickupIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#5B9A6F;border:3px solid white;box-shadow:0 0 0 4px rgba(91,154,111,0.35),0 4px 10px rgba(0,0,0,0.35);"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10],
});
const meIcon = L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#4A6FA5;border:3px solid white;box-shadow:0 0 0 6px rgba(74,111,165,0.25),0 6px 14px rgba(0,0,0,0.4);"></div>`,
  iconSize: [22, 22], iconAnchor: [11, 11],
});

const JCB_UST: [number, number] = [28.3762, 77.3149];
const APK_URL = 'https://github.com/Pranjal240/Ride-Mitra/releases/latest/download/RideMitra.apk';

/* ══════════════ INTRO VIDEO (the loading screen) ══════════════
   The first thing a visitor sees on a fresh session: the launch film,
   full screen, muted, with a Skip. Dismisses on Skip or when it ends. */
function IntroVideo({ onDone }: { onDone: () => void }) {
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Fade out on our own, then unmount — no framer exit (that can stall when the
  // tab isn't active). CSS opacity + a timer always completes.
  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(onDone, 400);
  }, [onDone]);
  // Never trap the user: dismiss if the film never starts, and hard-cap length.
  useEffect(() => {
    const hard = window.setTimeout(finish, 24000);
    return () => window.clearTimeout(hard);
  }, [finish]);
  useEffect(() => {
    if (ready) return;
    const stall = window.setTimeout(finish, 6000);
    return () => window.clearTimeout(stall);
  }, [ready, finish]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100000, background: '#07101F',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        opacity: leaving ? 0 : 1, transition: 'opacity 0.4s ease',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      <video
        src="/launch.mp4"
        poster="/launch-poster.jpg"
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlay={(e) => { setReady(true); e.currentTarget.play().catch(() => {}); }}
        onPlaying={() => setReady(true)}
        onEnded={finish}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />

      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ position: 'relative', width: 104, height: 104, display: 'grid', placeItems: 'center' }}>
            <div style={{
              position: 'absolute', width: '100%', height: '100%', background: T.gold, opacity: 0.9,
              borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%', animation: 'rm-morph 3.2s ease-in-out infinite',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}><Logo size={58} light /></div>
          </div>
        </div>
      )}

      <button
        onClick={finish}
        aria-label="Skip intro"
        style={{
          position: 'absolute', top: 'max(20px, env(safe-area-inset-top))', right: 20,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 18px', minHeight: 44, borderRadius: 100, cursor: 'pointer',
          background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)',
          color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: FONT.body,
        }}
      >
        Skip <PiXBold size={13} />
      </button>
    </div>
  );
}

/* ══════════════ WORD REVEAL (clean, per-word fade-up) ══════════════ */
function WordReveal({ text, delay = 0, active = true, style }: { text: string; delay?: number; active?: boolean; style?: React.CSSProperties }) {
  return (
    <span>
      {text.split(' ').map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: '0.35em' }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: '0.35em' }}
          transition={{ delay: delay + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'inline-block', marginRight: '0.28em', ...style }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

/* ══════════════ REVEAL (fade-up on scroll) ══════════════ */
function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════ MAGNETIC BUTTON (cursor-follow, flat) ══════════════ */
function MagneticButton({ children, onClick, variant = 'primary', style: extraStyle }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.6 });
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    x.set((e.clientX - r.left - r.width / 2) * 0.35);
    y.set((e.clientY - r.top - r.height / 2) * 0.35);
  };
  const onLeave = () => { x.set(0); y.set(0); };
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 30px',
    borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
    fontFamily: FONT.body, border: 'none', letterSpacing: '-0.01em', minHeight: 48,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: T.gold, color: '#20130A' },
    ghost: { background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.28)' },
  };
  return (
    <motion.button ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}
      whileTap={{ scale: 0.96 }} style={{ ...base, ...variants[variant], x: sx, y: sy, ...extraStyle }}>
      {children}
    </motion.button>
  );
}

/* ══════════════ LIVE MAP ══════════════ */
function MapFlyTo({ target, zoom }: { target: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(target, zoom, { duration: 1.6, easeLinearity: 0.25 }); }, [target, zoom, map]);
  return null;
}
function LiveMap() {
  const [center, setCenter] = useState<[number, number]>(JCB_UST);
  const [zoom, setZoom] = useState(15);
  const [locStatus, setLocStatus] = useState<'idle' | 'asking' | 'live' | 'denied'>('idle');
  const requestLive = () => {
    if (!('geolocation' in navigator)) { setLocStatus('denied'); return; }
    setLocStatus('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCenter([pos.coords.latitude, pos.coords.longitude]); setZoom(16); setLocStatus('live'); },
      () => setLocStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  const label = locStatus === 'live' ? 'You' : 'JC Bose UST';
  const sublabel = locStatus === 'live' ? 'Live location' : locStatus === 'denied' ? 'Location denied — campus view' : 'Campus view';
  return (
    <div style={{
      position: 'relative', borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '4 / 3', background: '#0F1E3D',
    }}>
      <MapContainer center={center as any} zoom={zoom} scrollWheelZoom={false} dragging={false}
        doubleClickZoom={false} zoomControl={false} attributionControl={false}
        style={{ width: '100%', height: '100%', background: '#0F1E3D' }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        <Marker position={center as any} icon={locStatus === 'live' ? meIcon : pickupIcon} />
        <MapFlyTo target={center} zoom={zoom} />
      </MapContainer>
      <div style={{
        position: 'absolute', top: 12, left: 12, padding: '8px 12px', background: '#fff',
        borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: locStatus === 'live' ? T.green : T.gold }} />
        <div>
          <div style={{ fontSize: 10, color: T.gray, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{sublabel}</div>
          <div style={{ fontSize: 13, color: T.navy, fontWeight: 800, fontFamily: FONT.heading, lineHeight: 1.2 }}>{label}</div>
        </div>
      </div>
      {locStatus !== 'live' && (
        <button onClick={requestLive} aria-label="Use my live location" style={{
          position: 'absolute', bottom: 12, right: 12, padding: '9px 14px', background: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: FONT.body, minHeight: 40,
        }}>
          <PiCrosshairSimpleBold size={14} color={T.gold} />
          {locStatus === 'asking' ? 'Locating…' : 'Use my location'}
        </button>
      )}
    </div>
  );
}

/* ══════════════ SCROLL PROGRESS (flat gold bar) ══════════════ */
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setP(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'transparent', zIndex: 60 }}>
      <div style={{ height: '100%', width: `${p}%`, background: T.gold, transition: 'width 0.1s' }} />
    </div>
  );
}

/* ══════════════ FEATURE CARD (flat, hover-lift) ══════════════ */
function FeatureCard({ icon, tint, title, body }: { icon: React.ReactNode; tint: string; title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      whileHover={{ y: -5 }}
      style={{
        padding: 26, borderRadius: 16, background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)', height: '100%',
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 12, background: `${tint}22`,
        border: `1px solid ${tint}55`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: tint, marginBottom: 16,
      }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: FONT.heading, marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{body}</p>
    </motion.div>
  );
}

const FEATURES = [
  { icon: <PiShieldCheckBold size={22} />, tint: T.gold, title: 'Verified drivers only', body: 'University email + document check for every driver. You always know who you ride with.' },
  { icon: <PiNavigationArrowBold size={22} />, tint: T.blue, title: 'Real-time GPS tracking', body: 'Watch your ride move live, and auto-share your ETA with emergency contacts.' },
  { icon: <PiCurrencyInrBold size={22} />, tint: T.green, title: 'Split fuel, no surge', body: 'No commission, no surge pricing — just the fuel cost divided fairly between riders.' },
  { icon: <PiChatCircleBold size={22} />, tint: T.blue, title: 'In-ride chat', body: 'Coordinate pickup without ever sharing your phone number.' },
  { icon: <PiLightningBold size={22} />, tint: T.red, title: 'One-tap SOS', body: 'An emergency alert with your live location, sent to your trusted contacts instantly.' },
  { icon: <PiLeafBold size={22} />, tint: T.green, title: 'Greener campus', body: 'Fewer cars at the gate means less traffic and lower fuel bills for everyone.' },
];

const STEPS = [
  { n: '01', icon: <PiGraduationCapBold size={22} />, title: 'Verify with campus email', body: 'Sign in with your JC Bose UST email or Google. One-time OTP — no paperwork.' },
  { n: '02', icon: <PiNavigationArrowBold size={22} />, title: 'Find or offer a ride', body: 'Search by route and time, or offer seats on trips you are already making.' },
  { n: '03', icon: <PiCarBold size={22} />, title: 'Track, chat, arrive', body: 'Live GPS, in-app chat, one-tap SOS. Pay in-app, split at the pump.' },
];

const STATS = [
  { v: '100%', label: 'Verified drivers', note: 'Licence + college ID checked' },
  { v: '100%', label: 'Rides tracked', note: 'Live GPS + one-tap SOS' },
  { v: 'Campus', label: 'Only access', note: '@jcboseust.ac.in required' },
  { v: '₹0', label: 'Surge & fees', note: 'Split real fuel cost only' },
];

/* ══════════════════════════════════════════════════════════════════════
   LANDING
   ══════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(() => {
    try {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
      return !sessionStorage.getItem('intro_done_v1');
    } catch { return false; }
  });
  const endIntro = () => { setShowIntro(false); try { sessionStorage.setItem('intro_done_v1', '1'); } catch {} };
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const goPortal = () => navigate('/portal');
  const downloadApp = () => window.open(APK_URL, '_blank', 'noopener');
  const heroReady = !showIntro;

  const navLink: React.CSSProperties = { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' };

  return (
    <>
      {showIntro && <IntroVideo onDone={endIntro} />}
      <ScrollProgress />

      <div style={{ minHeight: '100vh', background: '#0F1A33', color: 'white', overflow: 'hidden', position: 'relative' }}>

        {/* HEADER */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '16px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(13,22,42,0.92)', borderBottom: '1px solid rgba(255,255,255,0.07)',
        }} className="mobile-padding">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Logo size={32} light /><LogoText light />
          </Link>
          <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="mobile-hide">
            <a href="#features" style={navLink} onMouseEnter={e => (e.currentTarget.style.color = 'white')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>Features</a>
            <a href="#how" style={navLink} onMouseEnter={e => (e.currentTarget.style.color = 'white')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>How it works</a>
            <a href="#safety" style={navLink} onMouseEnter={e => (e.currentTarget.style.color = 'white')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>Safety</a>
            <a href="#download" style={{ color: T.gold, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}><PiAndroidLogoBold size={15} /> Get the app</a>
          </nav>
          <button onClick={goPortal} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            background: T.gold, color: '#20130A', border: 'none', display: 'flex', alignItems: 'center', gap: 6, minHeight: 42,
          }}>
            Sign In <PiArrowRightBold size={12} />
          </button>
        </header>

        {/* HERO */}
        <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 24px 80px' }} className="mobile-padding">
          <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 60, alignItems: 'center' }} className="mobile-grid-stack">
            {/* Left */}
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={heroReady ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1, duration: 0.5 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 100, background: 'rgba(200,149,108,0.12)', border: '1px solid rgba(200,149,108,0.25)', marginBottom: 26 }}>
                <PiShieldCheckBold size={13} color={T.gold} />
                <span style={{ fontSize: 12, color: T.gold, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Built for JC Bose UST</span>
              </motion.div>
              <h1 style={{ fontSize: 'clamp(44px, 8vw, 82px)', fontWeight: 900, color: 'white', lineHeight: 1.03, fontFamily: FONT.heading, letterSpacing: '-0.035em', marginBottom: 22 }}>
                <WordReveal text="Every trip." delay={0.1} active={heroReady} />
                <br />
                <WordReveal text="Shared." delay={0.3} active={heroReady} style={{ color: T.gold }} />{' '}
                <WordReveal text="Safer." delay={0.45} active={heroReady} />
              </h1>
              <motion.p initial={{ opacity: 0, y: 12 }} animate={heroReady ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.75, duration: 0.5 }}
                style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 500, marginBottom: 34 }}>
                Carpooling built only for JC Bose University students and staff. Verified accounts, live tracking on every ride, and fares split at the pump. No surge. No strangers.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={heroReady ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.9, duration: 0.5 }}
                style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 36 }}>
                <MagneticButton onClick={downloadApp} style={{ background: '#FFFFFF', color: T.navy, padding: '17px 30px', fontSize: 16 }}>
                  <PiAndroidLogoBold size={20} /> Download the app
                </MagneticButton>
                <MagneticButton onClick={goPortal}>Get Started <PiArrowRightBold size={16} /></MagneticButton>
                <MagneticButton variant="ghost" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
                  <PiPlayCircleBold size={18} /> How it works
                </MagneticButton>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={heroReady ? { opacity: 1 } : {}} transition={{ delay: 1.1, duration: 0.5 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {[{ c: T.green, t: 'Verified campus email' }, { c: T.gold, t: 'Live GPS + SOS' }, { c: T.blue, t: 'No commission, no surge' }].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.c }} />{b.t}
                  </div>
                ))}
              </motion.div>
            </div>
            {/* Right — flat live map card */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={heroReady ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: 20, borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: T.green }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Live Map</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>JC Bose UST · Faridabad</span>
                </div>
                <LiveMap />
                <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <PiMapPinBold size={16} color={T.gold} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                    Real routes from your gate to your destination. Grant location access to see rides matched around you.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CAMPUS BAND */}
        <div style={{ padding: '26px 24px', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', textAlign: 'center' }}>
          <PiGraduationCapBold size={20} color={T.gold} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: FONT.heading }}>
            Exclusively for JC Bose University of Science &amp; Technology, YMCA · Faridabad
          </div>
        </div>

        {/* FEATURES */}
        <section id="features" style={{ padding: '90px 24px 70px' }} className="mobile-padding">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Reveal style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 48px' }}>
              <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Everything you need</div>
              <h2 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 14 }}>
                Built for the way students move.
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                Not a taxi app with a student sticker. Every feature is designed for campus life — verified, tracked, and priced fairly.
              </p>
            </Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{ padding: '70px 24px', background: 'rgba(255,255,255,0.015)' }} className="mobile-padding">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Reveal style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ fontSize: 12, color: T.green, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>3 steps · 60 seconds</div>
              <h2 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.03em' }}>
                Your first ride is <span style={{ color: T.gold }}>minutes away.</span>
              </h2>
            </Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.06}>
                  <div style={{ padding: 26, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(200,149,108,0.16)', border: `1px solid ${T.gold}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gold }}>{s.icon}</div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: T.gold, letterSpacing: 1 }}>{s.n}</span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: FONT.heading, marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* SAFETY / STATS */}
        <section id="safety" style={{ padding: '70px 24px' }} className="mobile-padding">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Reveal style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 12, color: '#F5A5A5', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Safety by design</div>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.03em' }}>
                Every safeguard, <span style={{ color: T.gold }}>verified.</span>
              </h2>
            </Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {STATS.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.05}>
                  <div style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                    <div style={{ fontSize: 40, fontWeight: 900, color: T.gold, fontFamily: FONT.heading, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 12, fontFamily: FONT.heading }}>{s.label}</div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{s.note}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARISON */}
        <section style={{ padding: '30px 24px 70px' }} className="mobile-padding">
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <Reveal style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.03em' }}>
                RideMitra vs. everything else.
              </h2>
            </Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} className="compare-table">
              {[
                ['', 'RideMitra', 'Cab apps'],
                ['Verified students only', true, false],
                ['Split fuel — no surge', true, false],
                ['Live tracking + SOS', true, 'basic'],
                ['In-ride chat', true, false],
                ['No commission fee', true, false],
                ['Campus route matching', true, false],
              ].map((row, i) => (
                row.map((cell, j) => (
                  <div key={`${i}-${j}`} style={{
                    padding: '16px 18px', background: i === 0 ? '#16233F' : '#111d38',
                    fontSize: 14, fontWeight: i === 0 || j === 0 ? 700 : 500,
                    fontFamily: i === 0 || j === 0 ? FONT.heading : FONT.body,
                    color: i === 0 ? T.gold : j === 0 ? 'white' : 'rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: j === 0 ? 'flex-start' : 'center',
                    letterSpacing: i === 0 ? 1 : 0, textTransform: i === 0 ? 'uppercase' : 'none',
                  }}>
                    {typeof cell === 'boolean'
                      ? (cell ? <PiCheckCircleFill size={20} color={T.green} /> : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>—</span>)
                      : cell === 'basic' ? <span style={{ fontSize: 12, color: T.orange, fontWeight: 700 }}>Basic</span> : cell}
                  </div>
                ))
              ))}
            </div>
          </div>
        </section>

        {/* SEE IT IN MOTION */}
        <section id="motion" style={{ padding: '40px 24px 20px' }} className="mobile-padding">
          <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: T.gold, textTransform: 'uppercase', marginBottom: 12 }}>See it in motion</div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 26, fontFamily: FONT.heading, lineHeight: 1.08 }}>
              Campus rides, in twenty seconds.
            </h2>
            <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', background: '#0F1A33' }}>
              <video src="/launch.mp4" poster="/launch-poster.jpg" autoPlay muted loop playsInline preload="auto"
                onCanPlay={(e) => { e.currentTarget.play().catch(() => {}); }}
                style={{ width: '100%', display: 'block', aspectRatio: '16 / 9', objectFit: 'cover' }} />
            </div>
          </div>
        </section>

        {/* GET THE APP */}
        <section id="download" style={{ padding: '40px 24px 20px' }} className="mobile-padding">
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 40, padding: 'clamp(32px, 5vw, 52px)', borderRadius: 24, background: '#16233F', border: '1px solid rgba(200,149,108,0.25)' }}>
              <div style={{ flex: '1 1 320px', minWidth: 280 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 100, background: 'rgba(200,149,108,0.14)', border: '1px solid rgba(200,149,108,0.3)', marginBottom: 18 }}>
                  <PiDeviceMobileBold size={13} color={T.gold} />
                  <span style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: 1.5 }}>ANDROID APP · v1.0</span>
                </div>
                <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 14 }}>
                  Take Ride Mitra<br /><span style={{ color: T.gold }}>with you.</span>
                </h2>
                <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 440, marginBottom: 24 }}>
                  Install the app for live tracking, one-tap SOS and upfront fares on the move. Free · works on Android 7.0 and up.
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <a href={APK_URL} download style={{ textDecoration: 'none' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', borderRadius: 12, background: T.gold, color: '#20130A', fontSize: 16, fontWeight: 800, fontFamily: FONT.body }}>
                      <PiDownloadSimpleBold size={19} /> Download APK
                    </span>
                  </a>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>~86 MB · direct install</span>
                </div>
              </div>
              <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
                <div style={{ padding: 14, borderRadius: 16, background: '#FFFFFF', display: 'inline-block' }}>
                  <QRCodeSVG value={APK_URL} size={132} fgColor={T.navy} bgColor="#FFFFFF" level="M" />
                </div>
                <div style={{ marginTop: 12, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Scan to install on your phone</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '80px 24px 100px' }} className="mobile-padding">
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ padding: 'clamp(44px, 8vw, 72px) 40px', borderRadius: 24, textAlign: 'center', background: '#16233F', border: '1px solid rgba(200,149,108,0.22)' }}>
              <h2 style={{ fontSize: 'clamp(32px, 6vw, 54px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: 18 }}>
                Your ride is <span style={{ color: T.gold }}>waiting.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.6 }}>
                Verify your JC Bose UST account and start sharing rides across campus in minutes.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <MagneticButton onClick={goPortal}>Choose Your Portal <PiArrowRightBold size={16} /></MagneticButton>
                <MagneticButton variant="ghost" onClick={() => navigate('/rides')}>Browse Rides</MagneticButton>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: '36px 24px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0B1428' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Logo size={28} light /><LogoText light />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 12 }}>© 2026 · Made for JC Bose UST</span>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none' }}>Privacy</Link>
              <Link to="/terms" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none' }}>Terms</Link>
              <a href="mailto:hello@ridemitra.app" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none' }}>Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
