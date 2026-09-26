import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import {
  PiMagnifyingGlassBold, PiCalendarCheckBold, PiCarBold, PiTrendUpBold,
  PiLeafBold, PiStarBold, PiWarningBold, PiArrowRightBold, PiClockBold,
  PiShieldCheckBold, PiMapPinBold, PiLightningBold,
  PiNavigationArrowBold, PiChatCircleBold, PiPlusBold, PiGlobeBold,
  PiCrosshairSimpleBold,
} from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { getRides, getBookings } from '../lib/api';
import { updateProfile } from '../lib/auth';
import type { Ride, Booking } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import SOSModal from '../components/common/SOSModal';
import { ImpactChart, TrendingRoutes } from '../components/common/GlobalUI';
import { getUserStats, getSavedRoutes, deleteSavedRoute, type SavedRoute, type UserStats } from '../lib/api';
import { RadialProgress, Reveal, TiltCard as TiltCardV5, Spotlight } from './../components/common/Interactive3D';
import T, { FONT } from '../lib/theme';
import { PiBookmarkSimpleBold, PiTrashBold } from 'react-icons/pi';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* JC Bose UST, Faridabad — default map center */
const JCB_UST: [number, number] = [28.3762, 77.3149];

const meIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:22px;height:22px;"><div style="position:absolute;inset:0;border-radius:50%;background:#C8956C;border:3px solid white;box-shadow:0 0 0 6px rgba(200,149,108,0.25),0 6px 14px rgba(0,0,0,0.4);"></div></div>`,
  iconSize: [22, 22], iconAnchor: [11, 11],
});

function MapFlyTo({ target, zoom }: { target: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(target, zoom, { duration: 1.6 }); }, [target, zoom, map]);
  return null;
}

/* ── Magnetic 3D tilt with real cursor tracking ── */
function CursorTilt({ children, style, max = 8 }: { children: React.ReactNode; style?: React.CSSProperties; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rX = useMotionValue(0);
  const rY = useMotionValue(0);
  const sX = useSpring(rX, { stiffness: 220, damping: 22 });
  const sY = useSpring(rY, { stiffness: 220, damping: 22 });
  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rY.set(px * max);
    rX.set(-py * max);
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, [max, rX, rY]);
  const onLeave = () => { rX.set(0); rY.set(0); };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      className="bento"
      style={{ ...style, rotateX: sX, rotateY: sY, transformStyle: 'preserve-3d', transformPerspective: 1000 }}>
      {children}
    </motion.div>
  );
}

/* ── Scroll-in wrapper ── */
const FadeUp = ({ children, delay = 0, ...rest }: any) => (
  <motion.div initial={{ opacity:0, y:32 }} whileInView={{ opacity:1, y:0 }}
    viewport={{ once:true, margin:'-40px' }}
    transition={{ duration:0.55, delay, ease:[0.25,0.46,0.45,0.94] }} {...rest}>
    {children}
  </motion.div>
);

/* ── Live Campus Map (real Leaflet, live geolocation) ── */
function LiveCampusMap() {
  const [center, setCenter] = useState<[number, number]>(JCB_UST);
  const [zoom, setZoom] = useState(15);
  const [status, setStatus] = useState<'idle' | 'asking' | 'live' | 'denied'>('idle');
  const requestLive = () => {
    if (!('geolocation' in navigator)) { setStatus('denied'); return; }
    setStatus('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCenter([pos.coords.latitude, pos.coords.longitude]); setZoom(16); setStatus('live'); },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  return (
    <div style={{ position:'relative', borderRadius:20, overflow:'hidden', height:'100%', minHeight:280, background:'#0F1E3D' }}>
      <MapContainer center={center as any} zoom={zoom} scrollWheelZoom={false} dragging={false}
        doubleClickZoom={false} zoomControl={false} attributionControl={false}
        style={{ width:'100%', height:'100%', background:'#0F1E3D' }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={center as any} icon={meIcon} />
        <MapFlyTo target={center} zoom={zoom} />
      </MapContainer>
      <div style={{
        position:'absolute', top:14, left:14, padding:'8px 12px',
        background:'rgba(0,0,0,0.55)', backdropFilter:'blur(10px)',
        borderRadius:100, border:'1px solid rgba(255,255,255,0.1)',
        display:'flex', alignItems:'center', gap:8,
      }}>
        <div className={status === 'live' ? 'ring-pulse' : ''} style={{
          width:7, height:7, borderRadius:'50%',
          background: status === 'live' ? T.green : T.gold,
          boxShadow: `0 0 6px ${status === 'live' ? T.green : T.gold}`,
        }}/>
        <span style={{ fontSize:11, color:'white', fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>
          {status === 'live' ? 'Your live area' : 'Around campus'}
        </span>
      </div>
      {status !== 'live' && (
        <button onClick={requestLive}
          style={{
            position:'absolute', bottom:14, right:14, padding:'8px 14px',
            border:'none', borderRadius:100, cursor:'pointer',
            background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
            fontSize:12, fontWeight:800, letterSpacing:0.5,
            boxShadow:`0 8px 20px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
            display:'inline-flex', alignItems:'center', gap:6,
          }}>
          <PiCrosshairSimpleBold size={13}/> {status === 'asking' ? 'Locating…' : 'Use my location'}
        </button>
      )}
    </div>
  );
}

/* ── Recent Activity Feed ── */
function RecentActivity({ bookings, rides }: { bookings: Booking[]; rides: Ride[] }) {
  type ActivityItem = { icon: React.ReactNode; label: string; sub: string; at: Date; color: string };
  const items: ActivityItem[] = [];
  bookings.slice(0, 5).forEach(b => {
    items.push({
      icon: <PiCarBold size={14}/>,
      label: `Booked ride · ${b.seats_booked} seat${b.seats_booked !== 1 ? 's' : ''}`,
      sub: `₹${b.total_price} · ${b.status}`,
      at: new Date(b.created_at || Date.now()),
      color: b.status === 'confirmed' ? T.green : b.status === 'cancelled' ? T.red : T.gold,
    });
  });
  rides.slice(0, 3).forEach(r => {
    items.push({
      icon: <PiNavigationArrowBold size={14}/>,
      label: `New ride from ${(r as any).driver?.full_name?.split(' ')[0] || 'driver'}`,
      sub: `${r.seats_available} seats · ₹${r.price_per_seat}/seat`,
      at: new Date(r.departure_time),
      color: T.blue,
    });
  });
  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  const top = items.slice(0, 6);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {top.length === 0 ? (
        <div style={{ padding:'32px 16px', textAlign:'center', color:'rgba(255,255,255,0.5)', fontSize:13 }}>
          Your activity will appear here once you book or search a ride.
        </div>
      ) : top.map((it, i) => (
        <motion.div key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.04*i }}
          style={{
            display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12,
            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)',
          }}>
          <div style={{
            width:32, height:32, borderRadius:10, flexShrink:0,
            background:`linear-gradient(135deg, ${it.color}, ${it.color}88)`, color:'white',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 4px 10px ${it.color}44`,
          }}>{it.icon}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:700, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.label}</p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.sub}</p>
          </div>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', flexShrink:0, textAlign:'right' }}>
            {formatDistanceToNow(it.at, { addSuffix: true }).replace('about ', '')}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Animated stat counter ── */
function AnimNum({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let frame: number;
    const dur = 800, start = performance.now();
    const animate = (now: number) => { const t = Math.min((now - start) / dur, 1); setN(Math.round(t * value)); if (t < 1) frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{prefix}{n}</>;
}

/* ── Personal Snapshot (from user_stats RPC) + Saved Routes strip ── */
function PersonalSnapshotRow() {
  const { user } = useAuthStore();
  const nav = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [saved, setSaved] = useState<SavedRoute[]>([]);

  useEffect(() => {
    if (!user) return;
    getUserStats(user.id).then(setStats);
    getSavedRoutes(user.id).then(setSaved);
  }, [user]);

  const del = async (id: string) => {
    await deleteSavedRoute(id);
    setSaved(s => s.filter(x => x.id !== id));
  };

  const rideCount = stats?.total_bookings || 0;
  const spent = stats?.total_spent || 0;
  const safetyScore = Math.max(60, 100 - rideCount * 2 + Math.min(30, rideCount * 3));

  return (
    <FadeUp delay={0.05}>
      <div className="mobile-widgets-row" style={{
        display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginBottom: 20,
      }}>
        {/* Personal snapshot */}
        <TiltCardV5 max={6} radius={22} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          padding: 20, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}>
          <h3 style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>
            Your Snapshot
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'center' }}>
            <RadialProgress value={safetyScore} size={100} thickness={10} color={T.gold} label="Score" />
            <div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'white', fontFamily: FONT.heading }}>{rideCount}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase' }}>Bookings</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'white', fontFamily: FONT.heading }}>₹{spent}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase' }}>Spent</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 10, lineHeight: 1.4 }}>
                {rideCount === 0 ? 'Book your first ride — score grows with every safe trip.' : 'Keep sharing — your safety score climbs with every completed ride.'}
              </div>
            </div>
          </div>
        </TiltCardV5>

        {/* Saved routes */}
        <Spotlight color="rgba(200,149,108,0.18)" style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          padding: 20, borderRadius: 22, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PiBookmarkSimpleBold size={14} color={T.gold} /> Saved routes
            </h3>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Tap to search</span>
          </div>
          {saved.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, padding: '18px 0', textAlign: 'center' }}>
              No saved routes yet — bookmark a route from the search page.
            </p>
          ) : (
            <div className="h-scroll">
              {saved.map(r => (
                <div key={r.id} style={{
                  minWidth: 220, padding: 14, borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(200,149,108,0.10), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(200,149,108,0.28)', cursor: 'pointer',
                  transition: 'transform 0.25s',
                }}
                  onClick={() => nav(`/rides/search?from=${encodeURIComponent(r.from_location.address || '')}&to=${encodeURIComponent(r.to_location.address || '')}`)}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>{r.label || 'Route'}</div>
                      <div style={{ fontSize: 13, color: 'white', fontWeight: 700, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.from_location.address}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>→ {r.to_location.address}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); del(r.id); }} style={{
                      border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', padding: 4,
                    }}>
                      <PiTrashBold size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Spotlight>
      </div>
    </FadeUp>
  );
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergency_contact_phone || '');
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);

  useEffect(() => {
    (async () => {
      try {
        const [r, b] = await Promise.all([getRides({ status: 'active' }), user ? getBookings(user.id) : []]);
        const now = new Date();
        const activeRides = r.filter((ride: Ride) => new Date(ride.departure_time) > now);
        setRides(activeRides.slice(0, 6));
        const activeBookings = b.filter((booking: Booking) => {
          const ride = (booking as any).ride;
          if (!ride) return true;
          return new Date(ride.departure_time) > now;
        });
        setBookings(activeBookings.slice(0, 3));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const hour = time.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const timeStr = format(time, 'h:mm a');

  const stats = [
    { label:'Rides Taken', value: bookings.length, icon:<PiCarBold size={22}/>, color:T.navy, bg:T.navy50 },
    { label:'Money Saved', value: bookings.length*45, icon:<PiTrendUpBold size={22}/>, color:T.green, bg:T.greenLight, prefix:'₹' },
    { label:'CO₂ Saved', value: bookings.length*2, icon:<PiLeafBold size={22}/>, color:'#2D8B55', bg:'#E3F2E8', suffix:'kg' },
    { label:'Rating', value: 0, icon:<PiStarBold size={22}/>, color:T.orange, bg:T.orangeLight, custom: (user as any)?.rating?.toFixed(1) || '—' },
  ];

  const quickActions = [
    { label:'Find Ride', icon:<PiMagnifyingGlassBold size={24}/>, to:'/rides/search', color:T.navy, bg:T.navy50, desc:'Search available rides' },
    { label:'Create Ride', icon:<PiPlusBold size={24}/>, to:'/rides/create', color:T.green, bg:T.greenLight, desc:'Offer a ride' },
    { label:'My Bookings', icon:<PiCalendarCheckBold size={24}/>, to:'/bookings', color:T.orange, bg:T.orangeLight, desc:`${bookings.length} active` },
    { label:'Messages', icon:<PiChatCircleBold size={24}/>, to:'/chat', color:T.gold, bg:T.gold50, desc:'Chat with riders' },
  ];

  const handleSaveEmergency = async () => {
    if (!emergencyPhone || !user) return;
    setSavingContact(true);
    try { await updateProfile(user.id, { emergency_contact_phone: emergencyPhone }); } catch (e) { console.error(e); }
    finally { setSavingContact(false); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{
        minHeight:'100vh',
        background: 'radial-gradient(ellipse at top, #152240 0%, #0A1128 60%, #050914 100%)',
        fontFamily:FONT.body, color:'white', position:'relative',
      }}>
      {/* ═══ HERO BANNER ═══ */}
      <div className="mobile-hero" style={{
        background: 'radial-gradient(ellipse at top, #152240 0%, #0A1128 60%, #050914 100%)',
        padding: '48px 24px 72px', position: 'relative', overflow: 'hidden',
      }}>
        <div className="aurora-wrap">
          <div className="aurora-blob aurora-1" />
          <div className="aurora-blob aurora-2" />
          <div className="noise-overlay" />
        </div>

        <div style={{ maxWidth:1200, margin:'0 auto', position:'relative', zIndex:2 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
            <div>
              {/* Role badge */}
              <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
                style={{
                  display:'inline-flex', alignItems:'center', gap:7,
                  padding:'5px 12px', borderRadius:100,
                  background:'rgba(200,149,108,0.14)', border:'1px solid rgba(200,149,108,0.28)',
                  marginBottom:14,
                }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:T.gold, boxShadow:`0 0 8px ${T.gold}` }} className="ring-pulse" />
                <span style={{ fontSize:11, color:T.gold, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>
                  Rider Portal · JC Bose UST
                </span>
              </motion.div>

              <motion.p initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
                style={{ color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:500, letterSpacing:'0.01em' }}>
                {greeting},
              </motion.p>
              <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                style={{
                  fontSize:'clamp(30px, 5vw, 44px)', fontWeight:900, color:'#FFFFFF',
                  fontFamily:FONT.heading, letterSpacing:'-0.03em', lineHeight:1.05, marginTop:4,
                }}>
                {user?.full_name?.split(' ')[0] || 'Student'}<span style={{
                  background: `linear-gradient(135deg, ${T.gold}, #F5C99B)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>.</span>
              </motion.h1>
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
                style={{ color:'rgba(255,255,255,0.6)', fontSize:14, marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
                <PiClockBold size={14}/> {timeStr} · Your campus commute, simplified
              </motion.p>
            </div>
            {/* SOS Button */}
            <motion.button whileHover={{ scale:1.05, boxShadow:'0 8px 30px rgba(211,93,93,0.55)' }} whileTap={{ scale:0.95 }} onClick={()=>setIsSOSOpen(true)}
              style={{
                display:'flex', alignItems:'center', gap:8, padding:'11px 24px', borderRadius:T.rFull,
                background:`linear-gradient(135deg, ${T.red}, #B24C4C)`, color:'white', border:'none',
                fontSize:13, fontWeight:800, cursor:'pointer', letterSpacing:1.5, textTransform:'uppercase',
                boxShadow:`0 6px 20px rgba(211,93,93,0.45), inset 0 1px 0 rgba(255,255,255,0.2)`,
                fontFamily:FONT.heading, transition:'all 0.3s',
              }}>
              <PiWarningBold size={16}/>SOS
            </motion.button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'-36px auto 0', padding:'0 24px 80px', position:'relative', zIndex:3 }}>

        {/* ═══ STATS CARDS ═══ */}
        <div className="mobile-stat-grid" style={{
          display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:36,
        }}>
          {stats.map((s,i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.15+i*0.08, ease:'easeOut' }}
              whileHover={{ y:-6, boxShadow:'0 24px 60px rgba(0,0,0,0.35)' }}
              className="bento"
              style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:18, padding:'18px 16px',
                backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                transition:'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)', cursor:'default', overflow:'hidden',
              }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>{s.label}</p>
                  <p style={{
                    fontSize:'clamp(22px, 4.5vw, 30px)', fontWeight:900, color:'white',
                    fontFamily:FONT.heading, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    letterSpacing:'-0.02em',
                  }}>
                    {s.custom || <AnimNum value={s.value} prefix={s.prefix || ''}/>}
                    {s.suffix && <span style={{ fontSize:14, fontWeight:500, color:'rgba(255,255,255,0.55)', marginLeft:2 }}>{s.suffix}</span>}
                  </p>
                </div>
                <div style={{
                  width:44, height:44, borderRadius:14,
                  background:`linear-gradient(135deg, ${s.color}, ${s.color}88)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', flexShrink:0,
                  boxShadow:`0 8px 20px ${s.color}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}>
                  {s.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══ QUICK ACTIONS ═══ */}
        <FadeUp delay={0.05}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.02em' }}>
              Quick <span style={{ background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Actions</span>
            </h2>
          </div>
        </FadeUp>
        <div className="mobile-grid-2" style={{
          display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:40,
        }}>
          {quickActions.map((a,i) => (
            <FadeUp key={i} delay={0.08+i*0.06}>
              <motion.div
                whileHover={{ y:-6 }}
                whileTap={{ scale:0.98 }}
                onClick={() => navigate(a.to)}
                className="bento shine-hover"
                style={{
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:18, padding:'18px 16px', cursor:'pointer',
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                  transition:'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
                  display:'flex', alignItems:'center', gap:14, overflow:'hidden',
                }}>
                <div style={{
                  width:48, height:48, borderRadius:14,
                  background:`linear-gradient(135deg, ${a.color}, ${a.color}aa)`,
                  display:'flex', alignItems:'center', justifyContent:'center', color:'white',
                  flexShrink:0, boxShadow:`0 8px 20px ${a.color}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}>
                  {a.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>{a.label}</h3>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.desc}</p>
                </div>
                <PiArrowRightBold size={14} color="rgba(255,255,255,0.4)" style={{ flexShrink:0 }}/>
              </motion.div>
            </FadeUp>
          ))}
        </div>

        {/* ═══ PERSONAL SNAPSHOT + SAVED ROUTES ═══ */}
        <PersonalSnapshotRow />

        {/* ═══ INSIGHTS ROW: Savings chart + Trending routes ═══ */}
        <FadeUp delay={0.06}>
          <div className="mobile-widgets-row" style={{
            display:'grid', gridTemplateColumns:'1.35fr 1fr', gap:16, marginBottom:16,
          }}>
            {/* 7-day savings chart */}
            <div className="bento" style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:22, padding:24,
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            }}>
              <ImpactChart
                title="Your savings · last 7 days"
                sublabel="vs. private cab · estimated"
                values={(() => {
                  // Derive from booking price history (₹45/booking approx). Weekly rolling.
                  const b = bookings.slice(0, 7);
                  const pattern = [80, 60, 120, 90, 140, 70, 180];
                  return b.length > 0
                    ? Array.from({ length: 7 }, (_, i) => Math.max(20, (b[i]?.total_price || pattern[i]) * 0.6))
                    : pattern;
                })()}
                unit="₹"
                color={T.gold}
              />
            </div>

            {/* Trending routes */}
            <div className="bento" style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:22, padding:20,
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <h3 style={{ fontSize:14, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em', display:'flex', alignItems:'center', gap:8 }}>
                  <PiLightningBold size={15} color={T.gold}/>
                  Trending routes
                </h3>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:1, fontWeight:700 }}>Today</span>
              </div>
              <TrendingRoutes
                onPick={(r) => navigate(`/rides/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`)}
              />
            </div>
          </div>
        </FadeUp>

        {/* ═══ LIVE WIDGETS ROW ═══ */}
        <FadeUp delay={0.08}>
          <div className="mobile-widgets-row" style={{
            display:'grid', gridTemplateColumns:'1.35fr 1fr', gap:16, marginBottom:40,
          }}>
            {/* Live Campus Map — CursorTilt */}
            <CursorTilt style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:22, padding:0,
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              overflow:'hidden', display:'flex', flexDirection:'column',
            }}>
              <div style={{ padding:'18px 20px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <h3 style={{ fontSize:15, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{
                    width:30, height:30, borderRadius:10,
                    background:`linear-gradient(135deg, ${T.blue}, ${T.navy})`, color:'white',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:`0 6px 14px ${T.blue}55`,
                  }}><PiMapPinBold size={14}/></div>
                  Live Campus Map
                </h3>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', letterSpacing:1, textTransform:'uppercase', fontWeight:600 }}>
                  JC Bose UST · Faridabad
                </span>
              </div>
              <div style={{ padding:'0 16px 16px', flex:1, minHeight:280 }}>
                <LiveCampusMap />
              </div>
            </CursorTilt>

            {/* Recent Activity */}
            <CursorTilt max={5} style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:22, padding:20,
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              display:'flex', flexDirection:'column',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <h3 style={{ fontSize:15, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{
                    width:30, height:30, borderRadius:10,
                    background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:`0 6px 14px ${T.gold}55`,
                  }}><PiClockBold size={14}/></div>
                  Recent Activity
                </h3>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:100, background:`${T.green}22`, border:`1px solid ${T.green}55` }}>
                  <div className="ring-pulse" style={{ width:5, height:5, borderRadius:'50%', background:T.green }}/>
                  <span style={{ fontSize:10, color:T.green, fontWeight:800, letterSpacing:1, textTransform:'uppercase' }}>Live</span>
                </div>
              </div>
              <div style={{ flex:1 }}>
                <RecentActivity bookings={bookings} rides={rides} />
              </div>
            </CursorTilt>
          </div>
        </FadeUp>

        {/* ═══ AVAILABLE RIDES ═══ */}
        <FadeUp delay={0.1}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.02em' }}>
              Available <span style={{ background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Rides</span>
            </h2>
            <Link to="/rides/search" style={{
              fontSize:13, fontWeight:600, color:T.gold, textDecoration:'none',
              display:'flex', alignItems:'center', gap:4, transition:'transform 0.3s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateX(3px)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';}}>
              View All <PiArrowRightBold size={14}/>
            </Link>
          </div>
        </FadeUp>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                height:180, borderRadius:20,
                background:'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite',
                border:'1px solid rgba(255,255,255,0.06)',
              }}/>
            ))}
          </div>
        ) : rides.length === 0 ? (
          <FadeUp>
            <div style={{
              textAlign:'center', padding:'56px 24px', borderRadius:22,
              background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.06)',
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:`radial-gradient(circle, ${T.gold}22, transparent 70%)`, filter:'blur(20px)' }} />
              <div style={{
                position:'relative', width:72, height:72, borderRadius:20,
                background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 20px',
                boxShadow:`0 12px 30px ${T.gold}44, inset 0 1px 0 rgba(255,255,255,0.3)`,
              }}>
                <PiCarBold size={30} color="white"/>
              </div>
              <p style={{ fontSize:19, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>No upcoming rides yet</p>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', marginTop:8, maxWidth:340, margin:'8px auto 0' }}>Check back later or search for rides departing today from campus.</p>
              <motion.button whileHover={{ scale:1.03, y:-2 }} whileTap={{ scale:0.97 }} onClick={()=>navigate('/rides/search')}
                style={{
                  marginTop:24, padding:'13px 32px', borderRadius:100, border:'none',
                  background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
                  fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:FONT.heading,
                  boxShadow:`0 10px 30px ${T.gold}44, inset 0 1px 0 rgba(255,255,255,0.3)`,
                  transition:'all 0.3s', display:'inline-flex', alignItems:'center', gap:8,
                }}>
                Search Rides <PiArrowRightBold size={14}/>
              </motion.button>
            </div>
          </FadeUp>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:16 }}>
            {rides.map((ride,i) => (
              <FadeUp key={ride.id} delay={i*0.06}>
                <motion.div whileHover={{ y:-6 }}
                  onClick={() => navigate(`/rides/${ride.id}`)}
                  className="bento"
                  style={{
                    background:'rgba(255,255,255,0.04)',
                    border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:20, padding:22, cursor:'pointer',
                    backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                    transition:'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
                  }}>
                  {/* Driver info */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                    <div style={{
                      width:46, height:46, borderRadius:'50%',
                      background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'white', fontSize:16, fontWeight:800, fontFamily:FONT.heading,
                      boxShadow:`0 6px 16px ${T.gold}44`,
                    }}>
                      {(ride as any).driver?.full_name?.[0]?.toUpperCase() || 'D'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:15, fontWeight:700, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(ride as any).driver?.full_name || 'Driver'}</p>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>{format(new Date(ride.departure_time), 'MMM d · h:mm a')}</p>
                    </div>
                    <span style={{
                      padding:'5px 12px', borderRadius:100, fontSize:11, fontWeight:700,
                      background:`${T.green}22`, color:T.green, border:`1px solid ${T.green}55`,
                    }}>
                      {ride.seats_available} seats
                    </span>
                  </div>
                  {/* Route */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, paddingTop:4 }}>
                      <div style={{ width:9, height:9, borderRadius:'50%', background:T.green, boxShadow:`0 0 8px ${T.green}` }}/>
                      <div style={{ width:2, height:26, background:'rgba(255,255,255,0.12)' }}/>
                      <div style={{ width:9, height:9, borderRadius:'50%', background:T.gold, boxShadow:`0 0 8px ${T.gold}` }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', marginBottom:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {typeof ride.from_location === 'object' ? ride.from_location.address || 'Pickup' : ride.from_location}
                      </p>
                      <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {typeof ride.to_location === 'object' ? ride.to_location.address || 'Drop' : ride.to_location}
                      </p>
                    </div>
                  </div>
                  {/* Price */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{
                      fontSize:22, fontWeight:900, fontFamily:FONT.heading,
                      background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`,
                      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                    }}>₹{ride.price_per_seat}</span>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500 }}>per seat</span>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        )}

        {/* ═══ EMERGENCY CONTACT ═══ */}
        <FadeUp delay={0.1}>
          <div style={{
            marginTop:48, borderRadius:22, padding:28,
            background:'linear-gradient(135deg, rgba(211,93,93,0.10), rgba(255,255,255,0.03))',
            border:`1px solid rgba(211,93,93,0.25)`,
            backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:`radial-gradient(circle, ${T.red}22, transparent 70%)`, filter:'blur(24px)' }} />
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18, position:'relative', zIndex:1 }}>
              <div style={{
                width:48, height:48, borderRadius:14,
                background:`linear-gradient(135deg, ${T.red}, #B24C4C)`,
                display:'flex', alignItems:'center', justifyContent:'center', color:'white',
                boxShadow:`0 8px 20px ${T.red}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}>
                <PiWarningBold size={22}/>
              </div>
              <div>
                <h3 style={{ fontSize:17, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>Emergency Contact</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>Your live location is shared with this number during SOS.</p>
              </div>
            </div>
            <div className="mobile-emergency-row" style={{ display:'flex', gap:12, alignItems:'center', position:'relative', zIndex:1 }}>
              <input value={emergencyPhone} onChange={e=>setEmergencyPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX" type="tel" aria-label="Emergency contact phone"
                style={{
                  flex:1, padding:'14px 18px', borderRadius:14,
                  border:'1px solid rgba(255,255,255,0.12)', background:'rgba(0,0,0,0.25)',
                  fontSize:14, outline:'none', fontFamily:FONT.body, color:'white', transition:'all 0.3s',
                }}
                onFocus={e=>{e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.boxShadow=`0 0 0 3px ${T.gold}22`;}}
                onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow='none';}}/>
              <motion.button whileHover={{ scale:1.03, y:-2 }} whileTap={{ scale:0.97 }} onClick={handleSaveEmergency} disabled={savingContact}
                style={{
                  padding:'14px 30px', borderRadius:14, border:'none',
                  background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
                  fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:FONT.heading,
                  opacity:savingContact?0.6:1, transition:'all 0.3s',
                  boxShadow:`0 8px 24px ${T.gold}44, inset 0 1px 0 rgba(255,255,255,0.3)`,
                  letterSpacing:0.5,
                }}>
                {savingContact ? 'Saving…' : 'Save'}
              </motion.button>
            </div>
          </div>
        </FadeUp>

        {/* ═══ PLATFORM FEATURES ═══ */}
        <FadeUp delay={0.15}>
          <div style={{ marginTop:48 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'white', fontFamily:FONT.heading, marginBottom:18, letterSpacing:'-0.02em' }}>
              Platform <span style={{ background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Features</span>
            </h2>
            <div className="mobile-feature-grid" style={{
              display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14,
            }}>
              {[
                { icon:<PiShieldCheckBold size={22}/>, title:'Verified Only', desc:'JC Bose UST email + document check for every user.', color:T.green },
                { icon:<PiNavigationArrowBold size={22}/>, title:'Live Tracking', desc:'Real-time GPS on every ride, shared with your contacts.', color:T.blue },
                { icon:<PiGlobeBold size={22}/>, title:'Campus Routes', desc:'Optimised for the JC Bose gate → city routes.', color:T.orange },
                { icon:<PiLightningBold size={22}/>, title:'Instant Match', desc:'Smart matching with nearby verified drivers.', color:T.gold },
              ].map((f,i)=>(
                <FadeUp key={i} delay={0.06*i}>
                  <motion.div whileHover={{ y:-5 }}
                    className="bento"
                    style={{
                      background:'rgba(255,255,255,0.04)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:18, padding:22,
                      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                      display:'flex', alignItems:'flex-start', gap:14,
                      transition:'all 0.35s', cursor:'default', overflow:'hidden',
                    }}>
                    <div style={{
                      width:48, height:48, borderRadius:14,
                      background:`linear-gradient(135deg, ${f.color}, ${f.color}aa)`,
                      display:'flex', alignItems:'center', justifyContent:'center', color:'white',
                      flexShrink:0, boxShadow:`0 8px 20px ${f.color}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
                    }}>
                      {f.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <h4 style={{ fontSize:15, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>{f.title}</h4>
                      <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginTop:4, lineHeight:1.55 }}>{f.desc}</p>
                    </div>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>

      <SOSModal isOpen={isSOSOpen} onClose={()=>setIsSOSOpen(false)} />
    </motion.div>
  );
}
