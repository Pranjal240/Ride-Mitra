import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PiMagnifyingGlassBold, PiHouseBold, PiCarBold, PiPlusBold,
  PiCalendarCheckBold, PiUserBold, PiSignOutBold, PiCommandBold,
  PiArrowElbowDownLeftBold, PiChatCircleBold, PiShieldCheckBold, PiXBold,
  PiBellBold,
} from 'react-icons/pi';
import { useAuthStore } from '../../hooks/useStore';
import T, { FONT } from '../../lib/theme';

/* ══════════════════════════════════════════════════════
   1. GLOBAL CURSOR SPOTLIGHT
   GPU-accelerated soft radial glow that follows the cursor
   ══════════════════════════════════════════════════════ */
export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    let raf = 0;
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let mx = tx, my = ty;
    const handleMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    const tick = () => {
      mx += (tx - mx) * 0.12;
      my += (ty - my) * 0.12;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${mx - 300}px, ${my - 300}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener('mousemove', handleMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0, left: 0, width: 600, height: 600,
        pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(200,149,108,0.10) 0%, rgba(200,149,108,0.04) 30%, transparent 70%)',
        zIndex: 1,
        mixBlendMode: 'screen',
        willChange: 'transform',
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════
   2. COMMAND PALETTE (Cmd/Ctrl + K)
   ══════════════════════════════════════════════════════ */
type Action = {
  id: string;
  title: string;
  hint: string;
  keywords: string;
  icon: React.ReactNode;
  run: () => void;
  section: string;
  color?: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const actions: Action[] = useMemo(() => {
    if (!user) return [];
    const list: Action[] = [
      { id: 'home', title: 'Go to Dashboard', hint: 'Home', keywords: 'home dashboard', icon: <PiHouseBold size={16} />, run: () => navigate('/'), section: 'Navigate', color: T.blue },
      { id: 'find', title: 'Find a Ride', hint: 'Search available rides', keywords: 'find search ride', icon: <PiMagnifyingGlassBold size={16} />, run: () => navigate('/rides/search'), section: 'Rides', color: T.gold },
      { id: 'book', title: 'My Bookings', hint: 'View your booked rides', keywords: 'bookings my rides', icon: <PiCalendarCheckBold size={16} />, run: () => navigate('/bookings'), section: 'Rides', color: T.green },
      { id: 'chat', title: 'Messages', hint: 'Open in-ride chat', keywords: 'chat message', icon: <PiChatCircleBold size={16} />, run: () => navigate('/chat'), section: 'Rides', color: T.blue },
      { id: 'profile', title: 'Profile Settings', hint: 'Edit your profile', keywords: 'profile account settings', icon: <PiUserBold size={16} />, run: () => navigate('/profile'), section: 'Account', color: T.blue },
      { id: 'logout', title: 'Sign Out', hint: 'End your session', keywords: 'logout sign out exit', icon: <PiSignOutBold size={16} />, run: async () => { await logout(); navigate('/'); }, section: 'Account', color: T.red },
    ];
    if (user.user_type === 'driver' || user.user_type === 'both') {
      list.push(
        { id: 'create', title: 'Create Ride', hint: 'Offer a new ride', keywords: 'create new ride offer', icon: <PiPlusBold size={16} />, run: () => navigate('/rides/create'), section: 'Driver', color: T.green },
        { id: 'verify', title: 'Verification', hint: 'Submit driver documents', keywords: 'verification documents license', icon: <PiShieldCheckBold size={16} />, run: () => navigate('/verification'), section: 'Driver', color: T.gold },
      );
    }
    if (user.user_type === 'admin') {
      list.push(
        { id: 'admin', title: 'Admin Console', hint: 'Manage the platform', keywords: 'admin panel console', icon: <PiShieldCheckBold size={16} />, run: () => navigate('/admin'), section: 'Admin', color: T.red },
      );
    }
    return list;
  }, [user, navigate, logout]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return actions;
    return actions.filter(a =>
      a.title.toLowerCase().includes(term) ||
      a.hint.toLowerCase().includes(term) ||
      a.keywords.toLowerCase().includes(term)
    );
  }, [actions, q]);

  useEffect(() => { setCursor(0); }, [q]);

  const runIdx = (i: number) => {
    const item = filtered[i]; if (!item) return;
    setOpen(false);
    setTimeout(() => item.run(), 40);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); runIdx(cursor); }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(5, 9, 20, 0.7)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '10vh 20px 20px',
          }}>
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.2, 0.9, 0.25, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 640, borderRadius: 20,
              background: 'linear-gradient(180deg, rgba(21,34,64,0.98), rgba(10,17,40,0.98))',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
            {/* Search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <PiMagnifyingGlassBold size={18} color="rgba(255,255,255,0.55)" />
              <input
                ref={inputRef}
                value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
                placeholder="Search actions, pages, features…"
                aria-label="Command search"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'white', fontSize: 15, fontFamily: FONT.body,
                }} />
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '4px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              }}>
                <PiCommandBold size={10} />K
              </span>
            </div>
            {/* Results */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: 8 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                  No matches for “{q}”
                </div>
              ) : (
                (() => {
                  const grouped: Record<string, Action[]> = {};
                  filtered.forEach(a => {
                    if (!grouped[a.section]) grouped[a.section] = [];
                    grouped[a.section].push(a);
                  });
                  let flatIdx = -1;
                  return Object.entries(grouped).map(([section, items]) => (
                    <div key={section} style={{ marginBottom: 6 }}>
                      <div style={{ padding: '10px 12px 6px', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>
                        {section}
                      </div>
                      {items.map(a => {
                        flatIdx += 1;
                        const active = flatIdx === cursor;
                        const idx = flatIdx;
                        return (
                          <button key={a.id}
                            onMouseEnter={() => setCursor(idx)}
                            onClick={() => runIdx(idx)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 12px', border: 'none', borderRadius: 12,
                              background: active ? 'rgba(200,149,108,0.15)' : 'transparent',
                              cursor: 'pointer', textAlign: 'left', color: 'white',
                              transition: 'background 0.15s',
                            }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                              background: `linear-gradient(135deg, ${a.color || T.gold}, ${a.color || T.goldDark})`,
                              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: `0 4px 10px ${a.color || T.gold}55`,
                            }}>{a.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{a.title}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{a.hint}</div>
                            </div>
                            {active && (
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <PiArrowElbowDownLeftBold size={11} /> Enter
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ));
                })()
              )}
            </div>
            {/* Footer hint */}
            <div style={{
              padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: 'rgba(255,255,255,0.45)',
              letterSpacing: 0.5,
            }}>
              <span>↑ ↓ navigate · ↵ select · esc close</span>
              <span>RideMitra · JC Bose UST</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════
   3. MOBILE BOTTOM NAV BAR (≤768px)
   ══════════════════════════════════════════════════════ */
export function MobileBottomNav() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!user || !isMobile) return null;

  const navItems = user.user_type === 'admin'
    ? [
        { path: '/admin', label: 'Home', icon: <PiHouseBold size={18} /> },
        { path: '/admin/users', label: 'Users', icon: <PiUserBold size={18} /> },
        { path: '/admin/verification', label: 'Verify', icon: <PiShieldCheckBold size={18} /> },
        { path: '/profile', label: 'Me', icon: <PiUserBold size={18} /> },
      ]
    : user.user_type === 'driver'
    ? [
        { path: '/driver', label: 'Home', icon: <PiHouseBold size={18} /> },
        { path: '/rides/create', label: 'Create', icon: <PiPlusBold size={18} /> },
        { path: '/driver', label: 'Rides', icon: <PiCarBold size={18} /> },
        { path: '/profile', label: 'Me', icon: <PiUserBold size={18} /> },
      ]
    : [
        { path: '/student', label: 'Home', icon: <PiHouseBold size={18} /> },
        { path: '/rides/search', label: 'Search', icon: <PiMagnifyingGlassBold size={18} /> },
        { path: '/bookings', label: 'Trips', icon: <PiCalendarCheckBold size={18} /> },
        { path: '/profile', label: 'Me', icon: <PiUserBold size={18} /> },
      ];

  const isActive = (p: string) => location.pathname === p;
  const roleAccent = user.user_type === 'admin' ? T.red : user.user_type === 'driver' ? T.green : T.blue;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
      background: 'rgba(5, 9, 20, 0.9)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', gap: 4, justifyContent: 'space-around',
      boxShadow: '0 -8px 30px rgba(0,0,0,0.4)',
    }}>
      {navItems.map((item, i) => {
        const active = isActive(item.path);
        return (
          <button key={i} onClick={() => navigate(item.path)}
            aria-label={item.label}
            style={{
              flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 4px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: active ? `${roleAccent}22` : 'transparent',
              color: active ? roleAccent : 'rgba(255,255,255,0.55)',
              transition: 'all 0.25s cubic-bezier(0.25,0.9,0.25,1)',
              fontFamily: FONT.body,
            }}>
            <div style={{ transform: active ? 'translateY(-2px)' : 'none', transition: 'transform 0.25s' }}>
              {item.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>{item.label}</span>
            {active && (
              <div style={{
                position: 'absolute', top: 6, width: 4, height: 4, borderRadius: '50%',
                background: roleAccent, boxShadow: `0 0 6px ${roleAccent}`,
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* ══════════════════════════════════════════════════════
   4. COMMAND-K HINT PILL (bottom-right on desktop)
   ══════════════════════════════════════════════════════ */
export function CommandHint() {
  const { user } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('cmdk_dismissed') === '1'; } catch { return false; }
  });
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (!user || isMobile || dismissed) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 35,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 100,
        background: 'rgba(21,34,64,0.9)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)',
        fontSize: 12, fontWeight: 600, fontFamily: FONT.body,
        boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
        cursor: 'default',
      }}>
      Press
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 2,
        padding: '3px 8px', borderRadius: 6,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'white', fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
      }}>
        <PiCommandBold size={10} />K
      </span>
      to search
      <button onClick={() => { setDismissed(true); try { sessionStorage.setItem('cmdk_dismissed', '1'); } catch {} }}
        aria-label="Dismiss hint"
        style={{
          marginLeft: 4, padding: 2, borderRadius: 6, border: 'none',
          background: 'transparent', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', display: 'flex',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'white')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
        <PiXBold size={12} />
      </button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════
   5. SAVINGS / IMPACT MINI-CHART (SVG, animated)
   ══════════════════════════════════════════════════════ */
export function ImpactChart({ title, values, unit, color = T.gold, sublabel }: {
  title: string; values: number[]; unit: string; color?: string; sublabel?: string;
}) {
  const max = Math.max(...values, 1);
  const w = 260, h = 90;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => `${i * step},${h - (v / max) * (h - 12) - 6}`).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const total = values.reduce((a, b) => a + b, 0);
  const trend = values.length >= 2 ? values[values.length - 1] - values[values.length - 2] : 0;
  const trendPct = values[values.length - 2] > 0 ? Math.round((trend / values[values.length - 2]) * 100) : 0;
  const uid = useRef(`chart-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>{title}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{
              fontSize: 26, fontWeight: 900, color: 'white',
              fontFamily: FONT.heading, letterSpacing: '-0.02em',
            }}>{unit}{total.toLocaleString()}</span>
            {trendPct !== 0 && (
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                background: `${trend >= 0 ? T.green : T.red}22`,
                color: trend >= 0 ? T.green : T.red,
                border: `1px solid ${trend >= 0 ? T.green : T.red}55`,
              }}>{trend >= 0 ? '↑' : '↓'} {Math.abs(trendPct)}%</span>
            )}
          </div>
          {sublabel && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{sublabel}</p>}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', maxHeight: 90 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#grad-${uid})`}>
          <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
        </polygon>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 2px 6px ${color}88)` }}>
          <animate attributeName="stroke-dasharray" from="0 800" to="800 0" dur="1.2s" fill="freeze" />
        </polyline>
        {values.map((v, i) => (
          <circle key={i} cx={i * step} cy={h - (v / max) * (h - 12) - 6} r={i === values.length - 1 ? 3.5 : 2}
            fill={color}
            opacity={i === values.length - 1 ? 1 : 0.5}>
            <animate attributeName="opacity" from="0" to={i === values.length - 1 ? 1 : 0.5} dur="0.8s" begin={`${0.1 * i}s`} fill="freeze" />
          </circle>
        ))}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   6. TRENDING ROUTES WIDGET
   ══════════════════════════════════════════════════════ */
type TrendingRoute = { from: string; to: string; ridesToday: number; avgPrice: number };
export function TrendingRoutes({ onPick }: { onPick?: (r: TrendingRoute) => void }) {
  const routes: TrendingRoute[] = [
    { from: 'YMCA Gate', to: 'Faridabad Station', ridesToday: 12, avgPrice: 30 },
    { from: 'Sector 12', to: 'Bata Chowk Metro', ridesToday: 9, avgPrice: 25 },
    { from: 'Ballabhgarh', to: 'YMCA Campus', ridesToday: 7, avgPrice: 45 },
    { from: 'NIT 5', to: 'YMCA Hostel Gate', ridesToday: 5, avgPrice: 20 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {routes.map((r, i) => (
        <motion.button key={i}
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
          whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
          onClick={() => onPick?.(r)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
            textAlign: 'left', fontFamily: FONT.body,
          }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 12, fontFamily: FONT.heading,
            boxShadow: `0 4px 10px ${T.gold}44`,
          }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.from} → {r.to}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
              {r.ridesToday} rides today · avg ₹{r.avgPrice}
            </p>
          </div>
          <PiBellBold size={12} color="rgba(255,255,255,0.35)" />
        </motion.button>
      ))}
    </div>
  );
}
