import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PiMagnifyingGlassBold, PiCalendarCheckBold, PiCarBold, PiTrendUpBold,
  PiLeafBold, PiStarBold, PiWarningBold, PiArrowRightBold, PiClockBold,
  PiUsersBold, PiShieldCheckBold, PiMapPinBold, PiLightningBold,
  PiNavigationArrowBold, PiChatCircleBold, PiPlusBold, PiGlobeBold,
} from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { getRides, getBookings } from '../lib/api';
import { updateProfile } from '../lib/auth';
import type { Ride, Booking } from '../types';
import { format } from 'date-fns';
import SOSModal from '../components/common/SOSModal';
import T, { FONT } from '../lib/theme';

/* ── Scroll-in wrapper ── */
const FadeUp = ({ children, delay = 0, ...rest }: any) => (
  <motion.div initial={{ opacity:0, y:32 }} whileInView={{ opacity:1, y:0 }}
    viewport={{ once:true, margin:'-40px' }}
    transition={{ duration:0.55, delay, ease:[0.25,0.46,0.45,0.94] }} {...rest}>
    {children}
  </motion.div>
);

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
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ minHeight:'100vh', background:T.bg, fontFamily:FONT.body }}>
      {/* ═══ HERO BANNER ═══ */}
      <div className="mobile-hero" style={{ background:T.heroGrad, padding:'44px 24px 64px', position:'relative', overflow:'hidden' }}>
        {/* Background decorations */}
        <motion.div animate={{ scale:[1,1.2,1] }} transition={{ duration:12,repeat:Infinity }}
          style={{ position:'absolute',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(200,149,108,0.1),transparent)',top:'-15%',right:'-5%' }}/>
        <div style={{ position:'absolute',inset:0,opacity:0.03,backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',backgroundSize:'28px 28px' }}/>
        <motion.div animate={{ y:[-6,6,-6] }} transition={{ duration:7,repeat:Infinity }}
          style={{ position:'absolute',top:'30%',right:'18%',width:14,height:14,borderRadius:3,border:'2px solid rgba(200,149,108,0.2)',transform:'rotate(45deg)' }}/>

        <div style={{ maxWidth:1200,margin:'0 auto',position:'relative',zIndex:2 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16 }}>
            <div>
              <motion.p initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }}
                style={{ color:'rgba(255,255,255,0.75)',fontSize:14,fontWeight:500,letterSpacing:'0.01em' }}>{greeting}</motion.p>
              <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
                style={{ fontSize:'clamp(28px,4vw,36px)',fontWeight:800,color:'#FFFFFF',fontFamily:FONT.heading,marginTop:6 }}>
                {user?.full_name?.split(' ')[0] || 'Student'} <span style={{ color:T.gold }}>👋</span>
              </motion.h1>
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
                style={{ color:'rgba(255,255,255,0.65)',fontSize:14,marginTop:6,display:'flex',alignItems:'center',gap:6 }}>
                <PiClockBold size={14}/> {timeStr} • Your campus commute, simplified
              </motion.p>
            </div>
            {/* SOS Button */}
            <motion.button whileHover={{ scale:1.05,boxShadow:'0 8px 24px rgba(211,93,93,0.45)' }} whileTap={{ scale:0.95 }} onClick={()=>setIsSOSOpen(true)}
              style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 24px',borderRadius:T.rFull,
                background:T.red,color:'white',border:'none',fontSize:14,fontWeight:700,cursor:'pointer',
                boxShadow:`0 4px 14px rgba(211,93,93,0.4)`,fontFamily:FONT.heading,transition:'all 0.3s' }}>
              <PiWarningBold size={18}/>SOS
            </motion.button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200,margin:'-36px auto 0',padding:'0 24px 60px',position:'relative',zIndex:2 }}>
        {/* ═══ STATS CARDS ═══ */}
        <div className="mobile-stat-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:28 }}>
          {stats.map((s,i) => (
            <motion.div key={i} initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.15+i*0.08,ease:'easeOut' }}
              whileHover={{ y:-6,boxShadow:T.shadow3 }}
              style={{ background:'white',borderRadius:16,padding:'16px 14px',boxShadow:T.shadow2,border:`1px solid ${T.border}`,
                transition:'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',cursor:'default',overflow:'hidden' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:8 }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ fontSize:12,color:T.textSec,fontWeight:500,marginBottom:6 }}>{s.label}</p>
                  <p style={{ fontSize:'clamp(20px, 4.5vw, 28px)',fontWeight:800,color:T.dark,fontFamily:FONT.heading,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {s.custom || <AnimNum value={s.value} prefix={s.prefix || ''}/>}
                    {s.suffix && <span style={{ fontSize:14,fontWeight:500,color:T.textSec,marginLeft:2 }}>{s.suffix}</span>}
                  </p>
                </div>
                <div style={{ width:42,height:42,borderRadius:12,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',color:s.color,flexShrink:0 }}>
                  {s.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══ QUICK ACTIONS ═══ */}
        <FadeUp delay={0.05}>
          <h2 style={{ fontSize:20,fontWeight:700,color:T.dark,fontFamily:FONT.heading,marginBottom:16 }}>Quick Actions</h2>
        </FadeUp>
        <div className="mobile-grid-2" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:32 }}>
          {quickActions.map((a,i) => (
            <FadeUp key={i} delay={0.08+i*0.06}>
              <motion.div whileHover={{ y:-5,boxShadow:T.shadow3,borderColor:T.gold }} whileTap={{ scale:0.98 }}
                onClick={() => navigate(a.to)}
                style={{ background:'white',borderRadius:16,padding:'16px 14px',boxShadow:T.shadow1,border:`1.5px solid ${T.border}`,
                  cursor:'pointer',transition:'all 0.35s',display:'flex',alignItems:'center',gap:12,overflow:'hidden' }}>
                <div style={{ width:44,height:44,borderRadius:12,background:a.bg,display:'flex',alignItems:'center',justifyContent:'center',color:a.color,flexShrink:0 }}>
                  {a.icon}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <h3 style={{ fontSize:14,fontWeight:700,color:T.dark,fontFamily:FONT.heading }}>{a.label}</h3>
                  <p style={{ fontSize:11,color:T.textSec,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.desc}</p>
                </div>
                <PiArrowRightBold size={14} color={T.grayLight} style={{ flexShrink:0 }}/>
              </motion.div>
            </FadeUp>
          ))}
        </div>

        {/* ═══ UPCOMING RIDES ═══ */}
        <FadeUp delay={0.1}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
            <h2 style={{ fontSize:20,fontWeight:700,color:T.dark,fontFamily:FONT.heading }}>Available Rides</h2>
            <Link to="/rides/search" style={{ fontSize:13,fontWeight:600,color:T.gold,textDecoration:'none',display:'flex',alignItems:'center',gap:4,transition:'color 0.3s' }}
              onMouseEnter={e=>{e.currentTarget.style.color=T.goldDark;}}
              onMouseLeave={e=>{e.currentTarget.style.color=T.gold;}}>
              View All <PiArrowRightBold size={14}/>
            </Link>
          </div>
        </FadeUp>

        {loading ? (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16 }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height:160,borderRadius:18 }}/>
            ))}
          </div>
        ) : rides.length === 0 ? (
          <FadeUp>
            <div style={{ textAlign:'center',padding:'52px 24px',background:'white',borderRadius:20,border:`1px solid ${T.border}`,boxShadow:T.shadow1 }}>
              <div style={{ width:64,height:64,borderRadius:18,background:T.navy50,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                <PiCarBold size={28} color={T.navy}/>
              </div>
              <p style={{ fontSize:17,fontWeight:700,color:T.dark,fontFamily:FONT.heading }}>No upcoming rides available</p>
              <p style={{ fontSize:14,color:T.textSec,marginTop:6 }}>Check back later or create your own ride</p>
              <motion.button whileHover={{ scale:1.03,boxShadow:T.shadow3 }} whileTap={{ scale:0.97 }} onClick={()=>navigate('/rides/search')}
                style={{ marginTop:20,padding:'12px 28px',borderRadius:14,background:T.heroGrad,color:'white',border:'none',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:FONT.heading,transition:'all 0.3s' }}>
                Search Rides <PiArrowRightBold size={14} style={{ verticalAlign:'middle',marginLeft:4 }}/>
              </motion.button>
            </div>
          </FadeUp>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16 }}>
            {rides.map((ride,i) => (
              <FadeUp key={ride.id} delay={i*0.06}>
                <motion.div whileHover={{ y:-5,boxShadow:T.shadow3,borderColor:T.gold }}
                  onClick={() => navigate(`/rides/${ride.id}`)}
                  style={{ background:'white',borderRadius:18,padding:22,boxShadow:T.shadow2,border:`1.5px solid ${T.border}`,
                    cursor:'pointer',transition:'all 0.35s' }}>
                  {/* Driver info */}
                  <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
                    <div style={{ width:44,height:44,borderRadius:'50%',background:T.heroGrad,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:16,fontWeight:700 }}>
                      {(ride as any).driver?.full_name?.[0]?.toUpperCase() || 'D'}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:15,fontWeight:600,color:T.dark }}>{(ride as any).driver?.full_name || 'Driver'}</p>
                      <p style={{ fontSize:12,color:T.textSec }}>{format(new Date(ride.departure_time), 'MMM d • h:mm a')}</p>
                    </div>
                    <span style={{ padding:'5px 12px',borderRadius:T.rFull,fontSize:11,fontWeight:700,background:T.greenLight,color:T.green }}>
                      {ride.seats_available} seats
                    </span>
                  </div>
                  {/* Route */}
                  <div style={{ display:'flex',alignItems:'flex-start',gap:10,marginBottom:14 }}>
                    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:2,paddingTop:4 }}>
                      <div style={{ width:8,height:8,borderRadius:'50%',background:T.green }}/>
                      <div style={{ width:2,height:24,background:T.gray200 }}/>
                      <div style={{ width:8,height:8,borderRadius:'50%',background:T.red }}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13,fontWeight:600,color:T.dark,marginBottom:8 }}>{typeof ride.from_location === 'object' ? ride.from_location.address || 'Pickup' : ride.from_location}</p>
                      <p style={{ fontSize:13,fontWeight:600,color:T.dark }}>{typeof ride.to_location === 'object' ? ride.to_location.address || 'Drop' : ride.to_location}</p>
                    </div>
                  </div>
                  {/* Price */}
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:12,borderTop:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:20,fontWeight:800,color:T.navy,fontFamily:FONT.heading }}>₹{ride.price_per_seat}</span>
                    <span style={{ fontSize:12,color:T.textSec,fontWeight:500 }}>per seat</span>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        )}

        {/* ═══ EMERGENCY CONTACT ═══ */}
        <FadeUp delay={0.1}>
          <div style={{ marginTop:40,background:'white',borderRadius:20,padding:28,boxShadow:T.shadow2,border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16 }}>
              <div style={{ width:44,height:44,borderRadius:14,background:T.redLight,display:'flex',alignItems:'center',justifyContent:'center',color:T.red }}>
                <PiWarningBold size={22}/>
              </div>
              <div>
                <h3 style={{ fontSize:16,fontWeight:700,color:T.dark,fontFamily:FONT.heading }}>Emergency Contact</h3>
                <p style={{ fontSize:13,color:T.textSec }}>Your live location will be shared with this number during SOS</p>
              </div>
            </div>
            <div className="mobile-emergency-row" style={{ display:'flex',gap:12,alignItems:'center' }}>
              <input value={emergencyPhone} onChange={e=>setEmergencyPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX" type="tel"
                style={{ flex:1,padding:'13px 16px',borderRadius:12,border:`1.5px solid ${T.border}`,background:T.gray100,
                  fontSize:14,outline:'none',fontFamily:FONT.body,color:T.dark,transition:'all 0.3s' }}/>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={handleSaveEmergency} disabled={savingContact}
                style={{ padding:'13px 28px',borderRadius:12,background:T.heroGrad,color:'white',border:'none',fontSize:14,fontWeight:700,
                  cursor:'pointer',fontFamily:FONT.heading,opacity:savingContact?0.6:1,transition:'all 0.3s',boxShadow:T.shadow2 }}>
                {savingContact ? 'Saving...' : 'Save'}
              </motion.button>
            </div>
          </div>
        </FadeUp>

        {/* ═══ FEATURES ═══ */}
        <FadeUp delay={0.15}>
          <div style={{ marginTop:40 }}>
            <h2 style={{ fontSize:20,fontWeight:700,color:T.dark,fontFamily:FONT.heading,marginBottom:16 }}>Platform Features</h2>
            <div className="mobile-feature-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14 }}>
              {[
                { icon:<PiShieldCheckBold size={20}/>, title:'Verified Drivers', desc:'University ID verified for safety', color:T.green, bg:T.greenLight },
                { icon:<PiNavigationArrowBold size={20}/>, title:'Live Tracking', desc:'Real-time GPS tracking on every ride', color:T.navy, bg:T.navy50 },
                { icon:<PiGlobeBold size={20}/>, title:'Campus Routes', desc:'Optimized for university commute', color:T.orange, bg:T.orangeLight },
                { icon:<PiLightningBold size={20}/>, title:'Instant Match', desc:'Smart matching with nearby drivers', color:T.gold, bg:T.gold50 },
              ].map((f,i)=>(
                <FadeUp key={i} delay={0.06*i}>
                  <motion.div whileHover={{ y:-4,boxShadow:T.shadow2,borderColor:T.gold }}
                    style={{ background:'white',borderRadius:16,padding:22,border:`1.5px solid ${T.border}`,display:'flex',alignItems:'flex-start',gap:14,transition:'all 0.35s',cursor:'default' }}>
                    <div style={{ width:44,height:44,borderRadius:12,background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',color:f.color,flexShrink:0 }}>
                      {f.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize:15,fontWeight:700,color:T.dark,fontFamily:FONT.heading }}>{f.title}</h4>
                      <p style={{ fontSize:13,color:T.textSec,marginTop:4,lineHeight:1.6 }}>{f.desc}</p>
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
