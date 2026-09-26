import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  PiMapPinBold, PiCarBold, PiLightningBold, PiNavigationArrowBold,
  PiArrowRightBold, PiGraduationCapBold, PiShieldCheckBold,
  PiChatCircleBold, PiCurrencyInrBold, PiLeafBold, PiClockCountdownBold,
  PiSparkleBold, PiPlayCircleBold, PiCheckCircleFill, PiCrosshairSimpleBold,
  PiDownloadSimpleBold, PiAndroidLogoBold, PiDeviceMobileBold,
} from 'react-icons/pi';
import { QRCodeSVG } from 'qrcode.react';
import Logo, { LogoText } from '../components/common/Logo';
import T, { FONT } from '../lib/theme';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ParticleField, OrbitGlobe, StepFlow3D, RadialProgress,
  Reveal, Scramble, Magnetic, TiltCard as TiltCardV5, Spotlight,
} from '../components/common/Interactive3D';

/* Fix default marker icon paths (Vite bundling) */
const pickupIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#5B9A6F;border:3px solid white;box-shadow:0 0 0 4px rgba(91,154,111,0.35),0 4px 10px rgba(0,0,0,0.35);"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10],
});
const meIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:22px;height:22px;"><div style="position:absolute;inset:0;border-radius:50%;background:#4A6FA5;border:3px solid white;box-shadow:0 0 0 6px rgba(74,111,165,0.25),0 6px 14px rgba(0,0,0,0.4);"></div></div>`,
  iconSize: [22, 22], iconAnchor: [11, 11],
});

/* JC Bose University of Science and Technology, YMCA, Faridabad */
const JCB_UST: [number, number] = [28.3762, 77.3149];

/* Android app download — always resolves to the latest GitHub release asset. */
const APK_URL = 'https://github.com/Pranjal240/Ride-Mitra/releases/latest/download/RideMitra.apk';

/* ══════════════ AURORA BACKGROUND ══════════════ */
// Aurora (radial orbs + starfield) removed for a clean, flat background.
function Aurora() {
  return null;
}

/* ══════════════ SPLASH ══════════════ */
function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 1900); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#0F1A33', padding: '24px',
        // safe-area padding so it sits right on notched phones
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.86, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', width: 116, height: 116, display: 'grid', placeItems: 'center' }}
      >
        {/* liquid gold blob morphing behind the mark */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          background: T.gold, opacity: 0.92,
          borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%',
          animation: 'rm-morph 3.2s ease-in-out infinite',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size={64} light />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        style={{ marginTop: 22 }}
      >
        <LogoText light />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.5 }}
        style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8, letterSpacing: 3, textTransform: 'uppercase' }}
      >
        Campus Ride Network
      </motion.p>
    </motion.div>
  );
}

/* ══════════════ MAGNETIC BUTTON ══════════════
   Cursor-follow magnetism (desktop) — flat colours, no gradient/glow.
   On touch devices there's no pointer, so it simply rests in place. */
function MagneticButton({ children, onClick, variant = 'primary', style: extraStyle }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.6 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left - r.width / 2) * 0.35);
    y.set((e.clientY - r.top - r.height / 2) * 0.35);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 30px',
    borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
    fontFamily: FONT.body, border: 'none', letterSpacing: '-0.01em',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: T.gold, color: '#20130A' },
    ghost: {
      background: 'transparent', color: 'white',
      border: '1px solid rgba(255,255,255,0.28)',
    },
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      style={{ ...base, ...variants[variant], x: sx, y: sy, ...extraStyle }}
    >
      {children}
    </motion.button>
  );
}

/* ══════════════ 3D TILT CARD ══════════════ */
function TiltCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{ ...style, rotateX, rotateY, transformStyle: 'preserve-3d' }}>
      {children}
    </motion.div>
  );
}

/* ══════════════ WORD REVEAL ══════════════ */
function WordReveal({ text, delay = 0, className, style }: { text: string; delay?: number; className?: string; style?: React.CSSProperties }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="word-reveal" style={{ marginRight: '0.28em' }}>
          <span style={{ animationDelay: `${delay + i * 0.08}s`, ...style }}>{w}</span>
        </span>
      ))}
    </span>
  );
}

/* ══════════════ COUNT-UP ══════════════ */
function useCountUp(target: number, duration = 1500, active = false) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return n;
}


/* ══════════════ REAL LIVE MAP ══════════════
   Real OpenStreetMap tiles. Defaults to JC Bose UST campus,
   upgrades to the user's actual location if they grant permission. */
function MapFlyTo({ target, zoom }: { target: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(target, zoom, { duration: 1.8, easeLinearity: 0.25 });
  }, [target, zoom, map]);
  return null;
}

function LiveMap({ compact = false }: { compact?: boolean }) {
  const [center, setCenter] = useState<[number, number]>(JCB_UST);
  const [zoom, setZoom] = useState(15);
  const [locStatus, setLocStatus] = useState<'idle' | 'asking' | 'live' | 'denied'>('idle');

  const requestLive = () => {
    if (!('geolocation' in navigator)) { setLocStatus('denied'); return; }
    setLocStatus('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setZoom(16);
        setLocStatus('live');
      },
      () => setLocStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const label = locStatus === 'live' ? 'You' : 'JC Bose UST';
  const sublabel = locStatus === 'live'
    ? 'Live location'
    : locStatus === 'denied'
    ? 'Location denied — campus view'
    : 'Campus view';

  return (
    <div style={{
      position: 'relative', borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      aspectRatio: compact ? '16 / 10' : '4 / 3',
      background: '#0F1E3D',
    }}>
      <MapContainer
        center={center as any}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: '#0F1E3D' }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <Marker position={center as any} icon={locStatus === 'live' ? meIcon : pickupIcon} />
        <MapFlyTo target={center} zoom={zoom} />
      </MapContainer>

      {/* Location pill */}
      <div style={{
        position: 'absolute', top: 14, left: 14, padding: '9px 13px',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: locStatus === 'live' ? T.green : T.gold,
          boxShadow: `0 0 8px ${locStatus === 'live' ? T.green : T.gold}`,
        }} className={locStatus === 'live' ? 'ring-pulse' : ''} />
        <div>
          <div style={{ fontSize: 10, color: T.gray, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            {sublabel}
          </div>
          <div style={{ fontSize: 13, color: T.navy, fontWeight: 800, fontFamily: FONT.heading, lineHeight: 1.2 }}>
            {label}
          </div>
        </div>
      </div>

      {/* Use live location button */}
      {locStatus !== 'live' && (
        <button
          onClick={requestLive}
          aria-label="Use my live location"
          style={{
            position: 'absolute', bottom: 14, right: 14, padding: '9px 14px',
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
            border: 'none', borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: FONT.body,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <PiCrosshairSimpleBold size={14} color={T.gold} />
          {locStatus === 'asking' ? 'Locating…' : 'Use my location'}
        </button>
      )}
    </div>
  );
}

/* ══════════════ SCROLL PROGRESS ══════════════ */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      setProgress(pct);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'transparent', zIndex: 100 }}>
      <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${T.gold}, #F5C99B)`, transition: 'width 0.1s' }} />
    </div>
  );
}

/* ══════════════ BENTO CARD (spotlight follow) ══════════════ */
function BentoCard({ children, style, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);
  return (
    <div ref={ref} onMouseMove={onMove} className={`bento ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ══════════════ CAMPUS BAND ══════════════ */
function CampusBand() {
  return (
    <div style={{
      padding: '28px 24px', background: 'rgba(255,255,255,0.03)',
      borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', textAlign: 'center',
    }}>
      <PiGraduationCapBold size={22} color={T.gold} />
      <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: FONT.heading, letterSpacing: '-0.01em' }}>
        Exclusively for JC Bose University of Science &amp; Technology, YMCA · Faridabad
      </div>
    </div>
  );
}

/* ══════════════ FEATURE BENTO (large) ══════════════ */
function FeatureBento() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gridAutoRows: 'minmax(140px, auto)',
      gap: 16, maxWidth: 1200, margin: '0 auto',
    }} className="feature-bento">
      {/* Large — live tracking */}
      <BentoCard style={{
        gridColumn: 'span 4', gridRow: 'span 2', padding: 32, borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(27,43,75,0.9), rgba(15,26,51,0.9))',
        border: '1px solid rgba(255,255,255,0.06)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }} className="bento-live">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: 'rgba(91,154,111,0.15)', border: '1px solid rgba(91,154,111,0.3)', marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
            <span style={{ fontSize: 11, color: T.green, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Live</span>
          </div>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: 'white', fontFamily: FONT.heading, marginBottom: 10, letterSpacing: '-0.02em' }}>Real-Time GPS Tracking</h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 380, lineHeight: 1.6 }}>Watch your ride move in real time. Auto-share ETA with emergency contacts.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <LiveMap compact />
        </div>
      </BentoCard>

      {/* Verified */}
      <BentoCard style={{
        gridColumn: 'span 2', padding: 24, borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(200,149,108,0.12), rgba(200,149,108,0.03))',
        border: '1px solid rgba(200,149,108,0.15)', color: 'white',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(200,149,108,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: T.gold }}>
          <PiShieldCheckBold size={22} />
        </div>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: 'white', fontFamily: FONT.heading, marginBottom: 6 }}>Verified Only</h4>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>University email + document check for every driver.</p>
      </BentoCard>

      {/* Cost */}
      <BentoCard style={{
        gridColumn: 'span 2', padding: 24, borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(91,154,111,0.12), rgba(91,154,111,0.03))',
        border: '1px solid rgba(91,154,111,0.15)', color: 'white',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(91,154,111,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: T.green }}>
          <PiCurrencyInrBold size={22} />
        </div>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: 'white', fontFamily: FONT.heading, marginBottom: 6 }}>Split Fuel</h4>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>No surge, no fees. Just fuel divided evenly.</p>
      </BentoCard>

      {/* Chat */}
      <BentoCard style={{
        gridColumn: 'span 2', padding: 24, borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(74,111,165,0.12), rgba(74,111,165,0.03))',
        border: '1px solid rgba(74,111,165,0.15)', color: 'white',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(74,111,165,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: T.blue }}>
          <PiChatCircleBold size={22} />
        </div>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: 'white', fontFamily: FONT.heading, marginBottom: 6 }}>In-Ride Chat</h4>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>Coordinate pickup without sharing phone numbers.</p>
      </BentoCard>

      {/* SOS */}
      <BentoCard style={{
        gridColumn: 'span 2', padding: 24, borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(211,93,93,0.12), rgba(211,93,93,0.03))',
        border: '1px solid rgba(211,93,93,0.15)', color: 'white',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(211,93,93,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: T.red }}>
          <PiLightningBold size={22} />
        </div>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: 'white', fontFamily: FONT.heading, marginBottom: 6 }}>One-Tap SOS</h4>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>Emergency alert with live location to your contacts.</p>
      </BentoCard>

      {/* Sustainability - full width */}
      <BentoCard style={{
        gridColumn: 'span 6', padding: 32, borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(15,30,60,0.9), rgba(30,20,55,0.9))',
        border: '1px solid rgba(255,255,255,0.06)', color: 'white',
        display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' as const,
      }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${T.green}, #7BB88F)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, boxShadow: '0 12px 30px rgba(91,154,111,0.35)' }}>
          <PiLeafBold size={32} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h4 style={{ fontSize: 22, fontWeight: 800, color: 'white', fontFamily: FONT.heading, marginBottom: 6, letterSpacing: '-0.02em' }}>Shared rides. Cleaner campus.</h4>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>Fewer cars on the campus route means less traffic at the gate and lower fuel bills for everyone.</p>
        </div>
      </BentoCard>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [splash, setSplash] = useState(() => !sessionStorage.getItem('splash_shown'));
  const handleSplashDone = () => { setSplash(false); sessionStorage.setItem('splash_shown', '1'); };
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const goPortal = () => navigate('/portal');
  const downloadApp = () => window.open(APK_URL, '_blank', 'noopener');

  return (
    <>
      <AnimatePresence>{splash && <Splash onDone={handleSplashDone} />}</AnimatePresence>
      <ScrollProgress />

      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #152240 0%, #0A1128 60%, #050914 100%)',
        color: 'white', overflow: 'hidden', position: 'relative',
      }}>

        {/* ═══════════ HEADER ═══════════ */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          padding: '18px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(5,9,20,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }} className="mobile-padding">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Logo size={32} light /><LogoText light />
          </Link>
          <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="mobile-hide">
            <a href="#features" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>Features</a>
            <a href="#how" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>How it works</a>
            <a href="#safety" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>Safety</a>
            <a href="#download" style={{ color: T.gold, fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.3s', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}><PiAndroidLogoBold size={15} /> Get the app</a>
          </nav>
          <button onClick={goPortal} style={{
            padding: '10px 22px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            background: T.gold, color: 'white', border: 'none',
            boxShadow: '0 6px 20px rgba(200,149,108,0.35)', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Sign In <PiArrowRightBold size={12} />
          </button>
        </header>

        {/* ═══════════ HERO ═══════════ */}
        <section style={{
          position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center',
          padding: '120px 24px 80px', overflow: 'hidden',
        }} className="mobile-padding">
          <Aurora />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.55, pointerEvents: 'none' }}>
            <ParticleField density={26} height={800} color="rgba(200,149,108,0.45)" />
          </div>
          <div style={{
            position: 'absolute', top: '15%', right: '-90px', opacity: 0.45,
            pointerEvents: 'none', zIndex: 1,
          }} className="mobile-hide float-slow">
            <OrbitGlobe size={340} />
          </div>

          <div style={{
            position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', width: '100%',
            display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 60, alignItems: 'center',
          }} className="mobile-grid-stack">

            {/* Left */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: splash ? 0 : 1, y: splash ? 20 : 0 }}
                transition={{ delay: splash ? 0 : 0.1, duration: 0.6 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px',
                  borderRadius: 100, background: 'rgba(200,149,108,0.12)',
                  border: '1px solid rgba(200,149,108,0.25)', marginBottom: 28,
                }}>
                <PiShieldCheckBold size={13} color={T.gold} />
                <span style={{ fontSize: 12, color: T.gold, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                  Built for JC Bose UST
                </span>
              </motion.div>

              <h1 style={{
                fontSize: 'clamp(44px, 8vw, 84px)', fontWeight: 900, color: 'white',
                lineHeight: 1.02, fontFamily: FONT.heading, letterSpacing: '-0.035em', marginBottom: 24,
              }} className="chrom">
                {!splash && <>
                  <WordReveal text="Every trip." delay={0.1} />
                  <br />
                  <WordReveal text="Shared." delay={0.35} style={{ color: T.gold }} />
                  {' '}
                  <WordReveal text="Safer." delay={0.5} />
                </>}
              </h1>

              <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: splash ? 0 : 1, y: splash ? 15 : 0 }}
                transition={{ delay: splash ? 0 : 0.9, duration: 0.6 }}
                style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, maxWidth: 500, marginBottom: 36 }}>
                Carpooling built only for JC Bose University students and staff. Verified campus
                accounts, live tracking on every ride, and fares split at the pump. No surge. No strangers.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: splash ? 0 : 1, y: splash ? 15 : 0 }}
                transition={{ delay: splash ? 0 : 1.05, duration: 0.6 }}
                style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}>
                <MagneticButton
                  onClick={downloadApp}
                  style={{ background: '#FFFFFF', color: T.navy, padding: '17px 34px', fontSize: 16 }}
                >
                  <PiAndroidLogoBold size={20} /> Download the app
                </MagneticButton>
                <MagneticButton onClick={goPortal}>
                  Get Started <PiArrowRightBold size={16} />
                </MagneticButton>
                <MagneticButton variant="ghost" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
                  <PiPlayCircleBold size={18} /> See how it works
                </MagneticButton>
              </motion.div>

              {/* Trust row */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: splash ? 0 : 1 }}
                transition={{ delay: splash ? 0 : 1.3, duration: 0.6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { c: T.green, t: 'Verified campus email required' },
                  { c: T.gold, t: 'Live GPS + one-tap SOS' },
                  { c: T.blue, t: 'No commission, no surge' },
                ].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.c }} />
                    {b.t}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — 3D floating panel */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: splash ? 0 : 1, y: splash ? 40 : 0, scale: splash ? 0.9 : 1 }}
              transition={{ delay: splash ? 0 : 0.7, duration: 0.9, ease: [0.25, 1, 0.3, 1] }}
              style={{ position: 'relative', perspective: 1400 }}>
              <TiltCard style={{ willChange: 'transform' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(27,43,75,0.7), rgba(15,26,51,0.7))',
                  padding: 24, borderRadius: 28,
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(20px)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.green, boxShadow: `0 0 10px ${T.green}` }} className="ring-pulse" />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Live Map</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>JC Bose UST · Faridabad</span>
                  </div>
                  <LiveMap />
                  <div style={{ display: 'flex', gap: 10, marginTop: 18, padding: '16px 0 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <PiMapPinBold size={16} color={T.gold} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
                      Real routes from your gate to your destination. Grant location access to see rides matched around you.
                    </p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: splash ? 0 : 0.4 }} transition={{ delay: splash ? 0 : 1.6 }}
            style={{
              position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
              fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3,
            }} className="mobile-hide">
            Scroll
            <div style={{ width: 1, height: 30, background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)' }} />
          </motion.div>
        </section>

        {/* ═══════════ CAMPUS BAND ═══════════ */}
        <CampusBand />

        {/* ═══════════ FEATURE BENTO ═══════════ */}
        <section id="features" style={{ padding: '80px 24px 100px' }} className="mobile-padding">
          <div style={{ textAlign: 'center', marginBottom: 60, maxWidth: 720, margin: '0 auto 60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: 'rgba(200,149,108,0.1)', border: '1px solid rgba(200,149,108,0.2)', marginBottom: 20 }}>
              <span style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Everything you need</span>
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
              Built for the way<br />students actually move.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
              Not a taxi app with a student sticker. Every feature is designed for campus life — verified, tracked, and priced fairly.
            </p>
          </div>
          <FeatureBento />
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section id="how" style={{ padding: '100px 24px', position: 'relative', background: 'linear-gradient(180deg, transparent, rgba(200,149,108,0.03), transparent)' }} className="mobile-padding">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: 'rgba(91,154,111,0.12)', border: '1px solid rgba(91,154,111,0.25)', marginBottom: 20 }}>
                <span style={{ fontSize: 11, color: T.green, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>3 steps · 60 seconds</span>
              </div>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.03em' }}>
                Your first ride is <span style={{
                  color: T.gold,
                }}>minutes away.</span>
              </h2>
            </div>

            <StepFlow3D
              accent={T.gold}
              steps={[
                { icon: <PiGraduationCapBold size={20} />, title: 'Verify with campus email', body: 'Sign in with your JC Bose UST email or Google. One-time OTP — no paperwork.' },
                { icon: <PiNavigationArrowBold size={20} />, title: 'Find or offer a ride', body: 'Search by route and time. Offer seats on trips you\'re already making.' },
                { icon: <PiCarBold size={20} />, title: 'Track, chat, arrive', body: 'Live GPS, in-app chat, one-tap SOS. Pay in-app, split at the pump.' },
              ]}
            />
          </div>
        </section>

        {/* ═══════════ SAFETY PROMISE ═══════════ */}
        <section id="safety" style={{ padding: '100px 24px', position: 'relative' }} className="mobile-padding">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: 'rgba(211,93,93,0.12)', border: '1px solid rgba(211,93,93,0.25)', marginBottom: 20 }}>
                  <span style={{ fontSize: 11, color: '#F5A5A5', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Safety by design</span>
                </div>
                <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  Every safeguard, <Scramble text="verified." style={{
                    color: T.gold,
                  }} />
                </h2>
              </div>
            </Reveal>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18,
            }}>
              {[
                { pct: 100, label: 'Verified drivers', sub: 'License + college ID', color: T.gold, note: 'No un-checked driver ever ships on RideMitra.' },
                { pct: 100, label: 'Every ride tracked', sub: 'Live GPS · SOS one-tap', color: T.green, note: 'Location streams to admin during every trip.' },
                { pct: 100, label: 'Campus-only', sub: '@jcboseust.ac.in required', color: T.blue, note: 'Nobody outside the college can create an account.' },
                { pct: 0, label: 'Surge fees', sub: 'Split at the pump', color: T.red, note: 'Riders only split real fuel cost — never a commission.' },
              ].map((s, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <TiltCardV5 max={9} radius={22} style={{
                    padding: 24,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                    height: '100%',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14 }}>
                      <RadialProgress value={s.pct} size={92} thickness={9} color={s.color} label={s.pct === 0 ? 'Zero' : `${s.pct}%`} />
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.01em' }}>{s.label}</h3>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>{s.sub}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>{s.note}</p>
                  </TiltCardV5>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ COMPARISON ═══════════ */}
        <section style={{ padding: '80px 24px' }} className="mobile-padding">
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.03em' }}>
                RideMitra vs. everything else.
              </h2>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 1,
              background: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
            }} className="compare-table">
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
                    padding: '18px 20px', background: i === 0 ? 'rgba(200,149,108,0.06)' : 'rgba(15,26,51,0.5)',
                    fontSize: 14, fontWeight: i === 0 || j === 0 ? 700 : 500,
                    fontFamily: i === 0 || j === 0 ? FONT.heading : FONT.body,
                    color: i === 0 ? T.gold : j === 0 ? 'white' : 'rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: j === 0 ? 'flex-start' : 'center',
                    letterSpacing: i === 0 ? 1 : 0, textTransform: i === 0 ? 'uppercase' : 'none',
                  }}>
                    {typeof cell === 'boolean' ? (
                      cell
                        ? <PiCheckCircleFill size={20} color={T.green} />
                        : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>—</span>
                    ) : cell === 'basic' ? (
                      <span style={{ fontSize: 12, color: T.orange, fontWeight: 700 }}>Basic</span>
                    ) : cell}
                  </div>
                ))
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ SEE IT IN MOTION ═══════════ */}
        <section id="motion" style={{ padding: '80px 24px 20px' }} className="mobile-padding">
          <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: T.gold, textTransform: 'uppercase', marginBottom: 12 }}>
              See it in motion
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 28, fontFamily: FONT.heading, lineHeight: 1.08 }}>
              Campus rides, in twenty seconds.
            </h2>
            <div style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', background: '#0F1A33' }}>
              <video
                src="/launch.mp4"
                poster="/launch-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onCanPlay={(e) => { e.currentTarget.play().catch(() => {}); }}
                onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}
                style={{ width: '100%', display: 'block', aspectRatio: '16 / 9', objectFit: 'cover' }}
              />
            </div>
          </div>
        </section>

        {/* ═══════════ GET THE APP ═══════════ */}
        <section id="download" style={{ padding: '40px 24px 20px' }} className="mobile-padding">
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
              gap: 40, padding: 'clamp(32px, 5vw, 56px)', borderRadius: 32,
              background: 'linear-gradient(135deg, rgba(27,43,75,0.75), rgba(9,15,30,0.85))',
              border: '1px solid rgba(200,149,108,0.25)', boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
            }}>
              <div style={{ flex: '1 1 320px', minWidth: 280 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 100,
                  background: 'rgba(200,149,108,0.14)', border: '1px solid rgba(200,149,108,0.3)', marginBottom: 18,
                }}>
                  <PiDeviceMobileBold size={13} color={T.gold} />
                  <span style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: 1.5 }}>ANDROID APP · v1.0</span>
                </div>
                <h2 style={{
                  fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: 'white',
                  fontFamily: FONT.heading, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 14,
                }}>
                  Take Ride Mitra<br />
                  <span style={{ color: T.gold,}}>
                    with you.
                  </span>
                </h2>
                <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 440, marginBottom: 26 }}>
                  Install the app for live tracking, one-tap SOS and upfront fares on the move. Free · works on Android 7.0 and up.
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <a href={APK_URL} download style={{ textDecoration: 'none' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 30px', borderRadius: 100,
                      background: T.gold, color: 'white',
                      fontSize: 16, fontWeight: 800, fontFamily: FONT.body,
                      boxShadow: '0 14px 36px rgba(200,149,108,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                    }}>
                      <PiDownloadSimpleBold size={19} /> Download APK
                    </span>
                  </a>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>~86 MB · direct install</span>
                </div>
              </div>

              <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
                <div style={{ padding: 14, borderRadius: 20, background: '#FFFFFF', display: 'inline-block', boxShadow: '0 12px 30px rgba(0,0,0,0.25)' }}>
                  <QRCodeSVG value={APK_URL} size={132} fgColor={T.navy} bgColor="#FFFFFF" level="M" />
                </div>
                <div style={{ marginTop: 12, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  Scan to install on your phone
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ CTA ═══════════ */}
        <section style={{ padding: '100px 24px 120px' }} className="mobile-padding">
          <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
            <div style={{
              padding: 'clamp(48px, 8vw, 80px) 40px', borderRadius: 32, textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(200,149,108,0.15), rgba(27,43,75,0.6))',
              border: '1px solid rgba(200,149,108,0.25)', position: 'relative', overflow: 'hidden',
              boxShadow: '0 40px 100px rgba(200,149,108,0.15)',
            }}>
              <Aurora />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 100,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 24,
                }}>
                  <PiClockCountdownBold size={13} color={T.gold} />
                  <span style={{ fontSize: 12, color: 'white', fontWeight: 600, letterSpacing: 1 }}>Sign in with your @jcboseust.ac.in email</span>
                </div>
                <h2 style={{
                  fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 900, color: 'white',
                  fontFamily: FONT.heading, letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: 20,
                }}>
                  Your ride is<br />
                  <span style={{
                    color: T.gold,
                  }}>waiting.</span>
                </h2>
                <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.6 }}>
                  Verify your JC Bose UST account and start sharing rides across campus in minutes.
                </p>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <MagneticButton onClick={goPortal}>
                    Choose Your Portal <PiArrowRightBold size={16} />
                  </MagneticButton>
                  <MagneticButton variant="ghost" onClick={() => navigate('/rides')}>
                    Browse Rides
                  </MagneticButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer style={{
          padding: '40px 24px 32px', borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(5,9,20,0.6)',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Logo size={28} light /><LogoText light />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 12 }}>© 2026 · Made for JC Bose UST</span>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none', transition: 'color 0.3s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>Privacy</Link>
              <Link to="/terms" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none', transition: 'color 0.3s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>Terms</Link>
              <a href="mailto:hello@ridemitra.app" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none', transition: 'color 0.3s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
