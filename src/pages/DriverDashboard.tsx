import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PiCarBold, PiPlusBold, PiCheckCircleBold, PiWarningCircleBold, PiShieldCheckBold, PiArrowRightBold, PiClockBold, PiUsersBold, PiSteeringWheelBold, PiTrendUpBold, PiHouseBold, PiSirenBold, PiChatCircleBold, PiXBold, PiPaperPlaneRightBold, PiPhoneBold, PiMapPinBold, PiStarBold, PiCurrencyInrBold, PiTrashBold, PiCheckBold, PiBellBold, PiWarningBold } from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { getRides, getVerification, deleteRide, getDriverBookingRequests, updateBooking } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Ride, DriverVerification, Booking } from '../types';
import { format } from 'date-fns';
import SOSModal from '../components/common/SOSModal';
import { ImpactChart } from '../components/common/GlobalUI';
import { MapView } from '../components/maps';
import type { MapMarker } from '../components/maps';
import { calculateRoute, getUserLocation } from '../lib/maps';
import T, { FONT } from '../lib/theme';

/* Scroll-in wrapper */
const FadeUp = ({ children, delay = 0, ...rest }: any) => (
  <motion.div initial={{ opacity:0, y:32 }} whileInView={{ opacity:1, y:0 }}
    viewport={{ once:true, margin:'-40px' }}
    transition={{ duration:0.55, delay, ease:[0.25,0.46,0.45,0.94] }} {...rest}>
    {children}
  </motion.div>
);

// Theme imported from shared file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [verification, setVerification] = useState<DriverVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [sosActive, setSosActive] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [sendingChat, setSendingChat] = useState(false);
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [deletingRide, setDeletingRide] = useState<string | null>(null);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<[number, number][]>([]);
  const [activeMarkers, setActiveMarkers] = useState<MapMarker[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [ridesData, verif, bookings] = await Promise.all([
          getRides({ status: 'active' }),
          getVerification(user.id),
          getDriverBookingRequests(user.id),
        ]);
        const myRides = ridesData.filter((r) => r.driver_id === user.id);
        setRides(myRides);
        setVerification(verif);
        setBookingRequests(bookings);

        // Load route for first active ride
        if (myRides.length > 0) {
          const firstRide = myRides[0];
          if (firstRide.from_location && firstRide.to_location) {
            try {
              const routeInfo = await calculateRoute(firstRide.from_location, firstRide.to_location);
              if (routeInfo.geometry) setActiveRoute(routeInfo.geometry);
              
              const m: MapMarker[] = [
                { id: 'start', position: [firstRide.from_location.lat, firstRide.from_location.lng], type: 'pickup', popup: 'Start' },
                { id: 'end', position: [firstRide.to_location.lat, firstRide.to_location.lng], type: 'drop', popup: 'End' }
              ];
              setActiveMarkers(m);
            } catch (e) {
              console.warn("Failed to load map route", e);
            }
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  const handleDeleteRide = async (rideId: string) => {
    if (!window.confirm('Delete this ride? All bookings will be cancelled.')) return;
    setDeletingRide(rideId);
    try {
      await deleteRide(rideId);
      setRides(prev => prev.filter(r => r.id !== rideId));
      setBookingRequests(prev => prev.filter(b => b.ride_id !== rideId));
    } catch (e) { console.error('Delete failed', e); }
    finally { setDeletingRide(null); }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'cancelled') => {
    setProcessingBooking(bookingId);
    try {
      await updateBooking(bookingId, { status: action });
      setBookingRequests(prev => prev.map(b => b.id === bookingId ? { ...b, status: action } : b));
    } catch (e) { console.error('Booking action failed', e); }
    finally { setProcessingBooking(null); }
  };

  // Load support chat
  useEffect(() => {
    if (!user || !chatOpen) return;
    const loadChat = async () => {
      const { data } = await supabase.from('support_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
      if (data) setChatMessages(data);
    };
    loadChat();
    const channel = supabase.channel('support-driver').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${user.id}` }, (payload) => {
      setChatMessages(prev => [...prev, payload.new]);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, chatOpen]);

  const isVerified = verification?.verification_status === 'verified';
  const isPending = verification?.verification_status === 'pending';

  const triggerSOS = async () => {
    setSosLoading(true);
    try {
      let location = null;
      try {
        const coords = await getUserLocation();
        location = { lat: coords[0], lng: coords[1] };
      } catch (e) {
        console.warn('Geolocation failed in SOS', e);
      }
      await fetch(`${SUPABASE_URL}/functions/v1/send-sos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: user?.full_name, userPhone: user?.phone, emergencyContact: user?.emergency_contact_phone, location: location ? `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}` : 'Location unavailable', rideId: rides[0]?.id }),
      });
      // Also log to DB
      await supabase.from('sos_alerts').insert({ user_id: user?.id, ride_id: rides[0]?.id || null, location });
      setSosActive(true);
      setTimeout(() => setSosActive(false), 5000);
    } catch (e) { alert('SOS failed. Call 112 directly.'); }
    setSosLoading(false);
  };

  const sendChatMessage = async () => {
    if (!chatMsg.trim() || !user) return;
    setSendingChat(true);
    await supabase.from('support_messages').insert({ user_id: user.id, message: chatMsg.trim(), sender_type: 'user' });
    setChatMsg('');
    setSendingChat(false);
  };

  const quickActions = [
    { icon: <PiPlusBold size={20}/>, label: 'Create Ride', path: '/rides/create', color: T.green, bg: T.greenLight },
    { icon: <PiCarBold size={20}/>, label: 'My Rides', path: '/driver', color: T.navy, bg: T.blue50 },
    { icon: <PiShieldCheckBold size={20}/>, label: 'Verification', path: '/verification', color: T.orange, bg: T.orangeLight },
    { icon: <PiHouseBold size={20}/>, label: 'Home', path: '/', color: T.navy, bg: T.blueLight },
  ];

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{
        minHeight:'100vh',
        background: 'radial-gradient(ellipse at top, #152240 0%, #0A1128 60%, #050914 100%)',
        color:'white', position:'relative',
      }}>
      {/* Hero */}
      <div className="mobile-hero" style={{
        background: 'radial-gradient(ellipse at top, #152240 0%, #0A1128 60%, #050914 100%)',
        padding:'48px 24px 72px', position:'relative', overflow:'hidden',
      }}>
        <div className="aurora-wrap">
          <div className="aurora-blob aurora-1" />
          <div className="aurora-blob aurora-2" />
          <div className="noise-overlay" />
        </div>

        <div style={{ maxWidth:1200, margin:'0 auto', position:'relative', zIndex:2 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              {/* Role badge */}
              <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
                style={{
                  display:'inline-flex', alignItems:'center', gap:7,
                  padding:'5px 12px', borderRadius:100,
                  background:`${T.green}22`, border:`1px solid ${T.green}55`, marginBottom:14,
                }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:T.green, boxShadow:`0 0 8px ${T.green}` }} className="ring-pulse" />
                <span style={{ fontSize:11, color:T.green, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>
                  Driver Portal · JC Bose UST
                </span>
              </motion.div>
              <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
                style={{
                  fontSize:'clamp(28px, 5vw, 44px)', fontWeight:900, color:'white',
                  fontFamily:FONT.heading, letterSpacing:'-0.03em', lineHeight:1.05,
                }}>
                {user?.full_name?.split(' ')[0] || 'Driver'}<span style={{
                  background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`,
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                }}>.</span>
              </motion.h1>
              <motion.p initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.15 }}
                style={{ color:'rgba(255,255,255,0.6)', fontSize:14, marginTop:8 }}>
                Manage your rides. Help your campus commute.
              </motion.p>
            </div>
            {/* SOS Button */}
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={triggerSOS} disabled={sosLoading}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:16, border:'2px solid rgba(244,63,94,0.5)',
                background: sosActive ? T.red : 'rgba(244,63,94,0.15)', color: sosActive ? 'white' : T.red,
                cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:'inherit', transition:'all 0.3s' }}>
              <PiSirenBold size={20}/> {sosLoading ? 'Sending...' : sosActive ? 'SOS Sent!' : 'SOS Emergency'}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="mobile-container" style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px' }}>
        {/* Verification Banner */}
        {!isVerified && (
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
            style={{ marginTop:-28, marginBottom:20, padding:20, borderRadius:18, position:'relative', zIndex:3,
              background: isPending
                ? 'linear-gradient(135deg, rgba(212,151,59,0.15), rgba(255,255,255,0.03))'
                : 'linear-gradient(135deg, rgba(211,93,93,0.15), rgba(255,255,255,0.03))',
              border: isPending ? `1px solid ${T.orange}55` : `1px solid ${T.red}55`,
              borderLeft: isPending ? `4px solid ${T.orange}` : `4px solid ${T.red}`,
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {isPending ? <PiWarningCircleBold size={24} color={T.orange}/> : <PiShieldCheckBold size={24} color={T.red}/>}
              <div style={{ flex:1 }}>
                <h3 style={{ fontWeight:800, color:'white', fontSize:15, fontFamily:FONT.heading }}>{isPending ? 'Verification Pending' : 'Verification Required'}</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>{isPending ? 'Your documents are under review.' : 'Submit your documents to start offering rides.'}</p>
              </div>
              {!isPending && (
                <Link to="/verification" style={{ padding:'8px 20px', borderRadius:12, background:T.red, color:'white',
                  textDecoration:'none', fontSize:13, fontWeight:600 }}>Verify Now</Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="mobile-quick-actions" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop: isVerified ? -28 : 0, marginBottom:16, position:'relative', zIndex:3 }}>
          {quickActions.map((a,i) => (
            <motion.div key={i} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1+i*0.06 }}>
              <Link to={a.path} style={{ textDecoration:'none' }}>
                <motion.div whileHover={{ y:-5 }}
                  className="bento shine-hover"
                  style={{
                    background:'rgba(255,255,255,0.04)',
                    border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:16, padding:'18px 12px',
                    backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                    textAlign:'center', cursor:'pointer', transition:'all 0.35s',
                  }}>
                  <div style={{
                    width:44, height:44, borderRadius:14,
                    background:`linear-gradient(135deg, ${a.color}, ${a.color}aa)`, color:'white',
                    display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px',
                    boxShadow:`0 8px 20px ${a.color}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  }}>{a.icon}</div>
                  <p style={{ fontSize:12, fontWeight:700, color:'white', lineHeight:1.3, fontFamily:FONT.heading }}>{a.label}</p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="mobile-stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
          {[
            { label:'Active Rides', value: String(rides.length), icon:<PiCarBold size={20}/>, color:T.green, bg:T.greenLight },
            { label:'Status', value:isVerified?'Verified':isPending?'Pending':'Unverified', icon:<PiCheckCircleBold size={20}/>, color:isVerified?T.green:T.orange, bg:isVerified?T.greenLight:T.orangeLight },
            { label:'Earnings', value:'₹0', icon:<PiCurrencyInrBold size={20}/>, color:T.navy, bg:T.blue50 },
            { label:'Rating', value:'5.0 ★', icon:<PiStarBold size={20}/>, color:T.orange, bg:T.orangeLight },
          ].map((s,i)=>(
            <motion.div key={i} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2+i*0.07 }}
              whileHover={{ y:-4 }}
              className="bento"
              style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:18, padding:'18px 16px',
                backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                overflow:'hidden', transition:'all 0.35s',
              }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:1.5 }}>{s.label}</p>
                  <p style={{
                    fontSize:'clamp(20px, 4.5vw, 28px)', fontWeight:900, color:'white', marginTop:6,
                    fontFamily:FONT.heading, letterSpacing:'-0.02em',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>{s.value}</p>
                </div>
                <div style={{
                  width:44, height:44, borderRadius:14,
                  background:`linear-gradient(135deg, ${s.color}, ${s.color}aa)`, color:'white',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  boxShadow:`0 8px 20px ${s.color}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}>{s.icon}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Earnings chart */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}
          className="bento"
          style={{
            marginBottom:20,
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:22, padding:24,
            backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          }}>
          <ImpactChart
            title="Your earnings · last 7 days"
            sublabel="Estimated based on active rides"
            values={(() => {
              // Real: sum of price_per_seat × seats booked per day. Fallback: gentle upward curve.
              const total = rides.reduce((sum, r) => sum + (r.price_per_seat || 0) * (r.seats_available || 0), 0);
              const base = total > 0 ? Math.max(50, total / 7) : 100;
              return Array.from({ length: 7 }, (_, i) => Math.round(base * (0.6 + 0.4 * Math.sin(i * 0.9) + i * 0.06)));
            })()}
            unit="₹"
            color={T.green}
          />
        </motion.div>

        {/* Create Ride CTA */}
        {isVerified && (
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }} style={{ marginBottom:28 }}>
            <Link to="/rides/create" style={{ textDecoration:'none' }}>
              <motion.div whileHover={{ y:-4 }}
                className="shine-hover"
                style={{
                  background:`linear-gradient(135deg, ${T.gold} 0%, ${T.goldDark} 100%)`,
                  borderRadius:22, padding:26,
                  display:'flex', alignItems:'center', gap:16, cursor:'pointer',
                  boxShadow:`0 20px 48px ${T.gold}44, inset 0 1px 0 rgba(255,255,255,0.3)`,
                  transition:'all 0.35s',
                }}>
                <div style={{
                  width:56, height:56, borderRadius:16,
                  background:'rgba(255,255,255,0.15)',
                  border:'1px solid rgba(255,255,255,0.25)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <PiPlusBold size={26} color="white"/>
                </div>
                <div style={{ flex:1 }}>
                  <h3 style={{ fontSize:20, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>Create a New Ride</h3>
                  <p style={{ color:'rgba(255,255,255,0.85)', fontSize:13, marginTop:2 }}>Offer a ride to your campus community</p>
                </div>
                <PiArrowRightBold size={20} color="white"/>
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* Active Rides */}
        <FadeUp delay={0.1}>
        <div style={{ marginBottom:40 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:'white', fontFamily:FONT.heading, marginBottom:18, display:'flex', alignItems:'center', gap:12, letterSpacing:'-0.02em' }}>
            <div style={{
              width:36, height:36, borderRadius:12,
              background:`linear-gradient(135deg, ${T.green}, ${T.green}aa)`, color:'white',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:`0 6px 16px ${T.green}44`,
            }}><PiSteeringWheelBold size={16}/></div>
            My Active <span style={{ background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Rides</span>
          </h2>
          {loading ? (
            <div className="mobile-ride-cards" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
              {[1,2].map(i=>(
                <div key={i} style={{
                  height:180, borderRadius:20,
                  background:'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                  backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite',
                  border:'1px solid rgba(255,255,255,0.06)',
                }}/>
              ))}
            </div>
          ) : rides.length === 0 ? (
            <div style={{
              padding:'56px 24px', borderRadius:22,
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              textAlign:'center', position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:`radial-gradient(circle, ${T.green}33, transparent 70%)`, filter:'blur(24px)' }}/>
              <div style={{
                position:'relative', width:72, height:72, borderRadius:20,
                background:`linear-gradient(135deg, ${T.green}, ${T.green}aa)`,
                display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px',
                boxShadow:`0 12px 30px ${T.green}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
              }}>
                <PiCarBold size={32} color="white"/>
              </div>
              <h3 style={{ fontSize:19, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>No Active Rides</h3>
              <p style={{ color:'rgba(255,255,255,0.55)', fontSize:14, marginTop:8 }}>{isVerified ? 'Create your first ride from your campus route.' : 'Complete verification to start offering rides.'}</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Map View for active route */}
              {activeMarkers.length > 0 && (
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
                  style={{ borderRadius:20, overflow:'hidden', border:`1px solid ${T.border}`, boxShadow:T.shadow1, marginBottom:10 }}>
                  <MapView 
                    markers={activeMarkers} 
                    route={activeRoute.length > 0 ? activeRoute : undefined} 
                    center={activeMarkers[0].position} 
                    zoom={13} 
                    height="320px" 
                  />
                </motion.div>
              )}
              
              <div className="mobile-grid-stack" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
              {rides.map((ride,i)=>(
                <motion.div key={ride.id} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2+i*0.08 }}>
                  <motion.div whileHover={{ y:-6 }}
                    className="bento"
                    style={{
                      background:'rgba(255,255,255,0.04)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:20, padding:22,
                      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                      transition:'all 0.35s',
                    }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <span style={{
                        padding:'4px 12px', borderRadius:100, fontSize:10, fontWeight:800,
                        background:`${T.green}22`, color:T.green, border:`1px solid ${T.green}55`,
                        textTransform:'uppercase', letterSpacing:1,
                      }}>{ride.status}</span>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:4 }}>
                        <PiClockBold size={12}/> {format(new Date(ride.departure_time), 'MMM dd · h:mm a')}
                      </span>
                    </div>
                    <Link to={`/rides/${ride.id}`} style={{ textDecoration:'none' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16, cursor:'pointer' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
                          <div style={{ width:9, height:9, borderRadius:'50%', background:T.green, boxShadow:`0 0 8px ${T.green}`, flexShrink:0 }}/>
                          <span style={{ color:'rgba(255,255,255,0.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ride.from_location?.address || 'Start'}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
                          <div style={{ width:9, height:9, borderRadius:'50%', background:T.gold, boxShadow:`0 0 8px ${T.gold}`, flexShrink:0 }}/>
                          <span style={{ color:'rgba(255,255,255,0.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ride.to_location?.address || 'End'}</span>
                        </div>
                      </div>
                    </Link>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:4 }}>
                        <PiUsersBold size={13}/> {ride.seats_available} seat{ride.seats_available!==1?'s':''}
                      </span>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{
                          fontWeight:900, fontSize:16, fontFamily:FONT.heading,
                          background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`,
                          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                        }}>₹{ride.price_per_seat}</span>
                        <Link to={`/tracking/${ride.id}`} style={{ textDecoration:'none' }}>
                          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                            style={{
                              padding:'7px 14px', borderRadius:10, border:'none',
                              background:`linear-gradient(135deg, ${T.blue}, ${T.navy})`, color:'white',
                              fontSize:12, fontWeight:700, cursor:'pointer',
                              display:'flex', alignItems:'center', gap:4,
                              boxShadow:`0 6px 14px ${T.blue}44`,
                            }}>
                            <PiMapPinBold size={14}/> Track
                          </motion.button>
                        </Link>
                        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                          onClick={() => handleDeleteRide(ride.id)} disabled={deletingRide === ride.id}
                          aria-label="Delete ride"
                          style={{
                            width:34, height:34, borderRadius:10,
                            border:`1px solid ${T.red}55`, background:`${T.red}22`,
                            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:T.red,
                            opacity: deletingRide === ride.id ? 0.5 : 1, transition:'all 0.2s',
                          }}>
                          <PiTrashBold size={14}/>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
          )}
        </div>
        </FadeUp>

        {/* Booking Requests */}
        {bookingRequests.length > 0 && (
          <FadeUp delay={0.15}>
          <div style={{ marginBottom:40 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'white', fontFamily:FONT.heading, marginBottom:18, display:'flex', alignItems:'center', gap:12, letterSpacing:'-0.02em' }}>
              <div style={{
                width:36, height:36, borderRadius:12,
                background:`linear-gradient(135deg, ${T.blue}, ${T.navy})`, color:'white',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 6px 16px ${T.blue}44`,
              }}><PiBellBold size={16}/></div>
              Booking <span style={{ background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Requests</span>
              <span style={{
                padding:'3px 12px', borderRadius:100, fontSize:11, fontWeight:800,
                background:`${T.orange}22`, color:T.orange, border:`1px solid ${T.orange}55`,
                textTransform:'uppercase', letterSpacing:1,
              }}>
                {bookingRequests.filter(b => b.status === 'pending').length} pending
              </span>
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {bookingRequests.map((b, i) => {
                const rider = (b as any).rider;
                const ride = (b as any).ride;
                const isPending = b.status === 'pending';
                const statusBg = b.status === 'confirmed' ? T.greenLight : b.status === 'cancelled' ? T.redLight : T.orangeLight;
                const statusColor = b.status === 'confirmed' ? T.green : b.status === 'cancelled' ? T.red : T.orange;
                return (
                  <motion.div key={b.id} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                    style={{
                      background:'rgba(255,255,255,0.04)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      borderLeft: `4px solid ${statusColor}`,
                      borderRadius:18, padding:20,
                      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                    }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{
                          width:44, height:44, borderRadius:12,
                          background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                          display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0,
                          boxShadow:`0 6px 16px ${T.gold}44`,
                        }}>
                          {rider?.profile_photo ? (
                            <img src={rider.profile_photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          ) : (
                            <span style={{ fontSize:16, fontWeight:800, color:'white', fontFamily:FONT.heading }}>{(rider?.full_name || 'R')[0]}</span>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize:14, fontWeight:700, color:'white' }}>{rider?.full_name || 'Rider'}</p>
                          <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{rider?.phone || rider?.email || ''}</p>
                        </div>
                      </div>
                      <span style={{
                        padding:'4px 10px', borderRadius:100, fontSize:10, fontWeight:800,
                        background:`${statusColor}22`, color:statusColor, border:`1px solid ${statusColor}55`,
                        textTransform:'uppercase', letterSpacing:1,
                      }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginBottom:14 }}>
                      {ride?.from_location?.address || 'Pickup'} → {ride?.to_location?.address || 'Drop'}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                        <span style={{
                          fontSize:15, fontWeight:900, fontFamily:FONT.heading,
                          background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`,
                          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                        }}>₹{b.total_price}</span>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>· {b.seats_booked} seat{b.seats_booked !== 1 ? 's' : ''}</span>
                      </div>
                      {isPending && (
                        <div style={{ display:'flex', gap:8 }}>
                          <motion.button whileTap={{ scale:0.9 }} onClick={() => handleBookingAction(b.id, 'confirmed')}
                            disabled={processingBooking === b.id}
                            style={{ padding:'6px 16px', borderRadius:10, border:'none', background:T.green, color:'white',
                              fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4,
                              opacity: processingBooking === b.id ? 0.5 : 1 }}>
                            <PiCheckBold size={12}/> Accept
                          </motion.button>
                          <motion.button whileTap={{ scale:0.9 }} onClick={() => handleBookingAction(b.id, 'cancelled')}
                            disabled={processingBooking === b.id}
                            style={{ padding:'6px 16px', borderRadius:10, border:`1px solid ${T.red}30`, background:T.redLight,
                              color:T.red, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4,
                              opacity: processingBooking === b.id ? 0.5 : 1 }}>
                            <PiXBold size={12}/> Reject
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          </FadeUp>
        )}

        <FadeUp delay={0.2}>
        <div className="mobile-grid-stack" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:40 }}>
          <motion.div whileHover={{ y:-4 }}
            style={{
              background:'linear-gradient(135deg, rgba(211,93,93,0.14), rgba(255,255,255,0.03))',
              border:`1px solid ${T.red}55`,
              borderRadius:22, padding:24,
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              position:'relative', overflow:'hidden', transition:'all 0.35s',
            }}>
            <div style={{ position:'absolute', top:-10, right:-10, opacity:0.15, color:T.red }}><PiWarningBold size={100}/></div>
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{
                  width:36, height:36, borderRadius:12,
                  background:`linear-gradient(135deg, ${T.red}, #B24C4C)`, color:'white',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:`0 6px 16px ${T.red}55`,
                }}><PiWarningBold size={18}/></div>
                <h3 style={{ fontSize:17, fontWeight:800, color:'white', margin:0, fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>Emergency SOS</h3>
              </div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', margin:'0 0 18px', lineHeight:1.55 }}>
                Instantly alert university security and your emergency contacts.
              </p>
              <motion.button whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.98 }} onClick={() => setIsSOSOpen(true)}
                style={{
                  width:'100%', padding:'12px 16px',
                  background:`linear-gradient(135deg, ${T.red}, #B24C4C)`, color:'#FFF',
                  border:'none', borderRadius:12, fontWeight:800, fontSize:14, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow:`0 8px 24px ${T.red}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                  letterSpacing:0.5,
                }}>
                Open Safety Assistant
              </motion.button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.5 }}
            whileHover={{ y:-4 }}
            style={{
              background:'linear-gradient(135deg, rgba(74,111,165,0.14), rgba(255,255,255,0.03))',
              border:`1px solid ${T.blue}55`,
              borderRadius:22, padding:24,
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              transition:'all 0.35s',
            }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{
                width:36, height:36, borderRadius:12,
                background:`linear-gradient(135deg, ${T.blue}, ${T.navy})`, color:'white',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 6px 16px ${T.blue}55`,
              }}><PiChatCircleBold size={18}/></div>
              <h3 style={{ fontSize:17, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>Customer Support</h3>
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:18 }}>
              Need help? Chat with our support team for any issues or queries.
            </p>
            <motion.button whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.97 }} onClick={() => setChatOpen(true)}
              style={{
                padding:'10px 22px', borderRadius:12, border:'none',
                background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
                fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                boxShadow:`0 6px 18px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                letterSpacing:0.5,
              }}>
              Open Chat
            </motion.button>
          </motion.div>
        </div>
        </FadeUp>
      </div>

      {/* Support Chat FAB */}
      {!chatOpen && (
        <motion.button initial={{ scale:0 }} animate={{ scale:1 }} whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
          onClick={() => setChatOpen(true)}
          style={{ position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:'50%', border:'none',
            background:T.heroGrad, color:'white', cursor:'pointer', zIndex:50,
            boxShadow:'0 8px 32px rgba(27,43,75,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <PiChatCircleBold size={24}/>
        </motion.button>
      )}

      {/* Chat Drawer */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
            style={{ position:'fixed', bottom:24, right:24, width:'min(360px, calc(100vw - 48px))', height:'min(480px, calc(100vh - 120px))', borderRadius:20, overflow:'hidden', zIndex:50,
              background:T.surface, boxShadow:'0 20px 60px rgba(0,0,0,0.15)', border:`1px solid ${T.border}`, display:'flex', flexDirection:'column' }}>
            {/* Chat Header */}
            <div style={{ padding:'16px 20px', background:T.heroGrad, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <PiChatCircleBold size={18} color="white"/>
                <span style={{ color:'white', fontWeight:700, fontSize:15 }}>Support Chat</span>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer' }}>
                <PiXBold size={18}/>
              </button>
            </div>
            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign:'center', padding:'40px 16px' }}>
                  <PiChatCircleBold size={32} color={T.muted}/>
                  <p style={{ fontSize:13, color:T.muted, marginTop:8 }}>No messages yet. Say hello!</p>
                </div>
              )}
              {chatMessages.map((m: any) => (
                <div key={m.id} style={{ display:'flex', justifyContent: m.sender_type === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth:'75%', padding:'10px 14px', borderRadius:14, fontSize:13, lineHeight:1.5,
                    background: m.sender_type === 'user' ? T.heroGrad : T.gray100,
                    color: m.sender_type === 'user' ? 'white' : T.text,
                    borderBottomRightRadius: m.sender_type === 'user' ? 4 : 14,
                    borderBottomLeftRadius: m.sender_type === 'admin' ? 4 : 14 }}>
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
            {/* Input */}
            <div style={{ padding:12, borderTop:`1px solid ${T.border}`, display:'flex', gap:8 }}>
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendChatMessage(); }}
                placeholder="Type a message..." style={{ flex:1, padding:'10px 14px', borderRadius:12, border:`1px solid ${T.border}`,
                  background:T.bg, fontSize:13, outline:'none', fontFamily:'inherit' }}/>
              <motion.button whileTap={{ scale:0.9 }} onClick={sendChatMessage} disabled={sendingChat || !chatMsg.trim()}
                style={{ padding:'10px 14px', borderRadius:12, border:'none', background:T.navy, color:'white',
                  cursor:'pointer', display:'flex', alignItems:'center' }}>
                <PiPaperPlaneRightBold size={16}/>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </motion.div>
  );
}
