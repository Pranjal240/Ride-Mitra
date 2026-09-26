/**
 * Interactive3D — premium interactive primitives.
 * Real perspective tilt, magnetic buttons, spotlight cards, gradient orbs,
 * scroll-reveal, animated counters, scramble text, ripple hover.
 * All powered by framer-motion + native CSS (no heavy 3D libs).
 */
import { useRef, useCallback, useEffect, useState, useMemo, type ReactNode, type CSSProperties, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useInView, AnimatePresence } from 'framer-motion';
import T from '../../lib/theme';

/* ────────────────────────────────────────────────────────────
 *  Perspective Tilt Card — real 3D rotation + shine + parallax content
 * ──────────────────────────────────────────────────────────── */
export function TiltCard({
  children, style, className, max = 12, glare = true, layers = false, radius = 22,
}: {
  children: ReactNode; style?: CSSProperties; className?: string;
  max?: number; glare?: boolean; layers?: boolean; radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rX = useMotionValue(0);
  const rY = useMotionValue(0);
  const sX = useSpring(rX, { stiffness: 260, damping: 26, mass: 0.8 });
  const sY = useSpring(rY, { stiffness: 260, damping: 26, mass: 0.8 });
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rY.set((px - 0.5) * max);
    rX.set(-(py - 0.5) * max);
    setPos({ x: px * 100, y: py * 100 });
    if (layers) {
      el.style.setProperty('--tilt-mx', `${(px - 0.5) * 24}px`);
      el.style.setProperty('--tilt-my', `${(py - 0.5) * 24}px`);
    }
  }, [max, rX, rY, layers]);

  const onLeave = useCallback(() => {
    rX.set(0); rY.set(0); setPos({ x: 50, y: 50 });
    const el = ref.current; if (!el) return;
    if (layers) {
      el.style.setProperty('--tilt-mx', `0px`);
      el.style.setProperty('--tilt-my', `0px`);
    }
  }, [rX, rY, layers]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        ...style,
        rotateX: sX,
        rotateY: sY,
        transformStyle: 'preserve-3d',
        transformPerspective: 1200,
        borderRadius: radius,
        position: 'relative',
        willChange: 'transform',
      }}
    >
      {children}
      {glare && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: radius,
          pointerEvents: 'none', overflow: 'hidden',
          background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.14), transparent 40%)`,
          mixBlendMode: 'overlay',
        }} />
      )}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  Magnetic Button — pulls toward cursor
 * ──────────────────────────────────────────────────────────── */
export function Magnetic({
  children, strength = 0.35, className, style,
}: { children: ReactNode; strength?: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  };
  const onLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.div
      ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      className={className} style={{ ...style, x: sx, y: sy, display: 'inline-block' }}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  Spotlight — cursor-following radial glow on any card
 * ──────────────────────────────────────────────────────────── */
export function Spotlight({
  children, className, style, color = 'rgba(200,149,108,0.22)', radius = 22,
}: {
  children: ReactNode; className?: string; style?: CSSProperties; color?: string; radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState({ x: -100, y: -100, opacity: 0 });
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    setP({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 });
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setP(v => ({ ...v, opacity: 1 }))}
      onMouseLeave={() => setP(v => ({ ...v, opacity: 0 }))}
      className={className}
      style={{ ...style, position: 'relative', borderRadius: radius, overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(500px circle at ${p.x}px ${p.y}px, ${color}, transparent 45%)`,
        opacity: p.opacity, transition: 'opacity 300ms',
      }} />
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  Gradient Border — animated conic gradient border
 * ──────────────────────────────────────────────────────────── */
export function GradientBorder({
  children, style, className, radius = 22, colors = [T.gold, T.blue, T.gold],
}: {
  children: ReactNode; style?: CSSProperties; className?: string; radius?: number; colors?: string[];
}) {
  const grad = `conic-gradient(from 0deg, ${colors.join(', ')}, ${colors[0]})`;
  return (
    <div className={className} style={{
      ...style, position: 'relative', borderRadius: radius, padding: 1,
      background: grad, backgroundSize: '200% 200%', animation: 'conicSpin 6s linear infinite',
    }}>
      <div style={{
        borderRadius: radius - 1,
        background: 'linear-gradient(180deg, rgba(21,34,64,0.95), rgba(10,17,40,0.95))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'relative', zIndex: 1,
      }}>
        {children}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  AnimatedCounter — counts from 0 to value on view
 * ──────────────────────────────────────────────────────────── */
export function AnimatedCounter({
  value, duration = 1600, prefix = '', suffix = '', format = (n: number) => n.toFixed(0),
  style,
}: {
  value: number; duration?: number; prefix?: string; suffix?: string;
  format?: (n: number) => string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);
  return (
    <span ref={ref} style={style}>{prefix}{format(display)}{suffix}</span>
  );
}

/* ────────────────────────────────────────────────────────────
 *  Reveal — staggered fade-up on scroll
 * ──────────────────────────────────────────────────────────── */
export function Reveal({
  children, delay = 0, y = 20, className, style,
}: { children: ReactNode; delay?: number; y?: number; className?: string; style?: CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  Scramble Text — letters shuffle in on view
 * ──────────────────────────────────────────────────────────── */
export function Scramble({
  text, className, style, delay = 0,
}: { text: string; className?: string; style?: CSSProperties; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [display, setDisplay] = useState(' '.repeat(text.length));
  useEffect(() => {
    if (!inView) return;
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!<>-_\\/[]{}—=+*^?#';
    let frame = 0;
    const to = setTimeout(() => {
      const iv = setInterval(() => {
        frame++;
        let out = '';
        for (let i = 0; i < text.length; i++) {
          const reveal = frame / 2 > i;
          if (reveal) out += text[i];
          else if (text[i] === ' ') out += ' ';
          else out += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        setDisplay(out);
        if (frame / 2 > text.length) clearInterval(iv);
      }, 40);
    }, delay);
    return () => clearTimeout(to);
  }, [inView, text, delay]);
  return <span ref={ref} className={className} style={style}>{display}</span>;
}

/* ────────────────────────────────────────────────────────────
 *  ParticleField — SVG dot grid that reacts to cursor
 * ──────────────────────────────────────────────────────────── */
export function ParticleField({
  color = 'rgba(200,149,108,0.55)', density = 30, height = 380,
}: { color?: string; density?: number; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const dots = useMemo(() => Array.from({ length: density * density }).map((_, i) => ({
    x: (i % density) / (density - 1),
    y: Math.floor(i / density) / (density - 1),
  })), [density]);
  const [m, setM] = useState({ x: -1, y: -1 });
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    setM({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  };
  return (
    <svg
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setM({ x: -1, y: -1 })}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      style={{ width: '100%', height, position: 'absolute', inset: 0, pointerEvents: 'auto' }}
    >
      {dots.map((d, i) => {
        const dx = m.x - d.x;
        const dy = m.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const near = Math.max(0, 1 - dist * 6);
        const r = 0.003 + near * 0.006;
        return (
          <circle
            key={i}
            cx={d.x} cy={d.y} r={r}
            fill={color}
            opacity={0.15 + near * 0.7}
          />
        );
      })}
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
 *  OrbitGlobe — SVG globe with orbiting dots
 * ──────────────────────────────────────────────────────────── */
export function OrbitGlobe({ size = 280 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="g-core" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(200,149,108,0.35)" />
            <stop offset="60%" stopColor="rgba(74,111,165,0.12)" />
            <stop offset="100%" stopColor="rgba(10,17,40,0)" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#g-core)" />
        {/* longitudes */}
        {[0, 30, 60, 90, 120, 150].map(a => (
          <ellipse key={a} cx="100" cy="100" rx="80" ry="30"
            transform={`rotate(${a} 100 100)`}
            fill="none" stroke="rgba(200,149,108,0.28)" strokeWidth="0.6" />
        ))}
        {/* latitudes */}
        {[15, 40, 65].map(r => (
          <ellipse key={r} cx="100" cy="100" rx="80" ry={r}
            fill="none" stroke="rgba(74,111,165,0.35)" strokeWidth="0.5" />
        ))}
        {/* main equator (highlight) */}
        <ellipse cx="100" cy="100" rx="80" ry="80" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
        {/* orbiting dot */}
        <g style={{ transformOrigin: '100px 100px', animation: 'orbit-spin 12s linear infinite' }}>
          <circle cx="180" cy="100" r="3" fill={T.gold}>
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </g>
        <g style={{ transformOrigin: '100px 100px', animation: 'orbit-spin 20s linear infinite reverse' }}>
          <circle cx="100" cy="20" r="2.5" fill="#F5C99B" />
        </g>
        <g style={{ transformOrigin: '100px 100px', animation: 'orbit-spin 30s linear infinite' }}>
          <circle cx="100" cy="180" r="2" fill={T.blue} />
        </g>
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  Marquee — horizontal ticker
 * ──────────────────────────────────────────────────────────── */
export function Marquee({ items, speed = 40 }: { items: (string | ReactNode)[]; speed?: number }) {
  const list = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', mask: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
      <div style={{
        display: 'inline-flex', gap: 40, whiteSpace: 'nowrap', paddingRight: 40,
        animation: `marquee-scroll ${speed}s linear infinite`,
      }}>
        {list.map((it, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  RippleButton — expanding ripple on click
 * ──────────────────────────────────────────────────────────── */
export function RippleButton({
  children, onClick, style, className, disabled,
}: { children: ReactNode; onClick?: () => void; style?: CSSProperties; className?: string; disabled?: boolean }) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const idRef = useRef(0);
  return (
    <button
      onClick={(e) => {
        if (disabled) return;
        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
        const r = { id: ++idRef.current, x: e.clientX - rect.left, y: e.clientY - rect.top };
        setRipples(rs => [...rs, r]);
        setTimeout(() => setRipples(rs => rs.filter(x => x.id !== r.id)), 700);
        onClick?.();
      }}
      className={className}
      disabled={disabled}
      style={{
        position: 'relative', overflow: 'hidden', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
      {ripples.map(r => (
        <span key={r.id} style={{
          position: 'absolute', left: r.x, top: r.y, width: 8, height: 8,
          borderRadius: '50%', pointerEvents: 'none', transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.35)',
          animation: 'ripple-expand 700ms ease-out forwards',
        }} />
      ))}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────
 *  ScrollProgress — top-of-page scroll indicator
 * ──────────────────────────────────────────────────────────── */
export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setP(total > 0 ? h.scrollTop / total : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 200,
      pointerEvents: 'none', background: 'rgba(255,255,255,0.05)',
    }}>
      <div style={{
        width: `${p * 100}%`, height: '100%',
        background: `linear-gradient(90deg, ${T.gold}, #F5C99B, ${T.gold})`,
        boxShadow: `0 0 12px ${T.gold}`,
        transition: 'width 60ms linear',
      }} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  StepFlow3D — 3-step process card with orbit connectors
 * ──────────────────────────────────────────────────────────── */
export function StepFlow3D({ steps, accent = T.gold }: { steps: { icon: ReactNode; title: string; body: string }[]; accent?: string }) {
  return (
    <div className="mobile-step-flow" style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 18, position: 'relative' }}>
      {steps.map((s, i) => (
        <Reveal key={i} delay={i * 0.08}>
          <TiltCard max={9} radius={20} style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.09)',
            padding: '22px 20px', height: '100%',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14, marginBottom: 14,
              background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              boxShadow: `0 10px 26px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
            }}>
              {s.icon}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, letterSpacing: 3, color: `${accent}dd`, fontWeight: 800 }}>0{i + 1}</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>{s.title}</h3>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 1.55 }}>{s.body}</p>
          </TiltCard>
        </Reveal>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  AnnouncementBar — top-of-app banner from admin
 * ──────────────────────────────────────────────────────────── */
export function AnnouncementBar({ title, body, severity = 'info', onDismiss }: {
  title: string; body: string; severity?: 'info' | 'warning' | 'critical' | 'success'; onDismiss?: () => void;
}) {
  const color = severity === 'critical' ? T.red : severity === 'warning' ? T.orange : severity === 'success' ? T.green : T.blue;
  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
      style={{
        position: 'sticky', top: 0, zIndex: 90,
        background: `linear-gradient(90deg, ${color}22, ${color}0a)`,
        border: `1px solid ${color}44`,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div className="ring-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color: 'white', fontWeight: 800, fontSize: 13, marginRight: 8 }}>{title}</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{body}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px',
        }}>×</button>
      )}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  RadialProgress — animated SVG radial for scores/percent
 * ──────────────────────────────────────────────────────────── */
export function RadialProgress({
  value, size = 120, thickness = 10, color = T.gold, label, sub, colorTrack = 'rgba(255,255,255,0.08)',
}: {
  value: number; size?: number; thickness?: number; color?: string;
  label?: string; sub?: string; colorTrack?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dashOffset = c - (clamped / 100) * c;
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colorTrack} strokeWidth={thickness} />
        <circle
          ref={ref}
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={c}
          strokeDashoffset={inView ? dashOffset : c}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)', filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: 'white', textAlign: 'center',
      }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 900, letterSpacing: '-0.03em', color, textShadow: `0 0 12px ${color}55` }}>{Math.round(clamped)}</span>
        {label && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>{label}</span>}
        {sub && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  KineticText — words rise like tickertape
 * ──────────────────────────────────────────────────────────── */
export function KineticText({ text, style }: { text: string; style?: CSSProperties }) {
  const words = text.split(' ');
  return (
    <span style={{ display: 'inline-block', ...style }}>
      {words.map((w, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'baseline' }}>
          <motion.span
            initial={{ y: '110%' }} animate={{ y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'inline-block', paddingRight: 8 }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
 *  ActivityDrawer — slide-out notifications panel
 * ──────────────────────────────────────────────────────────── */
export function ActivityDrawer({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199, backdropFilter: 'blur(4px)' }}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 92vw)', zIndex: 200,
              background: 'linear-gradient(180deg, rgba(21,34,64,0.98), rgba(10,17,40,0.98))',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '-24px 0 60px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <div style={{
              padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h3 style={{ color: 'white', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</h3>
              <button onClick={onClose} style={{
                border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.75)', cursor: 'pointer', width: 30, height: 30, borderRadius: 8,
                fontSize: 16, lineHeight: 1,
              }}>×</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default {
  TiltCard, Magnetic, Spotlight, GradientBorder, AnimatedCounter, Reveal, Scramble,
  ParticleField, OrbitGlobe, Marquee, RippleButton, ScrollProgress, StepFlow3D,
  AnnouncementBar, RadialProgress, KineticText, ActivityDrawer,
};
