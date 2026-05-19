import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PiCarBold, PiPlusBold, PiCheckCircleBold, PiWarningCircleBold, PiShieldCheckBold, PiArrowRightBold, PiClockBold, PiUsersBold, PiSteeringWheelBold, PiTrendUpBold, PiHouseBold, PiSirenBold, PiChatCircleBold, PiXBold, PiPaperPlaneRightBold, PiPhoneBold, PiMapPinBold, PiStarBold, PiCalendarBold, PiCurrencyInrBold, PiTrashBold, PiCheckBold, PiBellBold, PiWarningBold } from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { getRides, getVerification, deleteRide, getDriverBookingRequests, updateBooking } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Ride, DriverVerification, Booking } from '../types';
import { format } from 'date-fns';
import SOSModal from '../components/common/SOSModal';
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
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ minHeight:'100vh', background:T.bg }}>
      {/* Hero */}
      <div className="mobile-hero" style={{ background:T.heroGrad, padding:'40px 24px 64px', position:'relative', overflow:'hidden' }}>
        <motion.div animate={{ rotate:[0,360] }} transition={{ duration:30,repeat:Infinity,ease:'linear' }}
          style={{ position:'absolute', top:-50, right:-30, width:180, height:180, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.05)' }}/>
        <motion.div animate={{ y:[-8,8,-8] }} transition={{ duration:6,repeat:Infinity }}
          style={{ position:'absolute', bottom:'20%', left:'12%', width:10, height:10, borderRadius:'50%', background:T.orange, opacity:0.4 }}/>
        <motion.div animate={{ x:[-5,5,-5] }} transition={{ duration:8,repeat:Infinity }}
          style={{ position:'absolute', top:'30%', right:'20%', width:6, height:6, borderRadius:'50%', background:T.red, opacity:0.3 }}/>

        <div style={{ maxWidth:1200, margin:'0 auto', position:'relative', zIndex:2 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
                style={{ fontSize:'clamp(26px,3.5vw,36px)', fontWeight:800, color:'white', fontFamily:FONT.heading }}>
                Welcome, Driver <span style={{ color:T.gold }}>{user?.full_name?.split(' ')[0] || ''}</span> 🚗
              </motion.h1>
              <motion.p initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.15 }}
                style={{ color:'rgba(255,255,255,0.7)', fontSize:15, marginTop:6 }}>Manage your rides and help your campus commute</motion.p>
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

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px' }}>
        {/* Verification Banner */}
        {!isVerified && (
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
            style={{ marginTop:-24, marginBottom:20, padding:20, borderRadius:16, position:'relative', zIndex:3,
              background: isPending ? T.gold50 : T.redLight,
              border: isPending ? `1px solid ${T.orange}30` : `1px solid ${T.red}30`,
              borderLeft: isPending ? `4px solid ${T.orange}` : `4px solid ${T.red}`,
            }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {isPending ? <PiWarningCircleBold size={24} color={T.orange}/> : <PiShieldCheckBold size={24} color={T.red}/>}
              <div style={{ flex:1 }}>
                <h3 style={{ fontWeight:700, color:T.text, fontSize:15 }}>{isPending ? 'Verification Pending' : 'Verification Required'}</h3>
                <p style={{ fontSize:13, color:T.textSec }}>{isPending ? 'Documents under review.' : 'Submit your documents to start offering rides.'}</p>
              </div>
              {!isPending && (
                <Link to="/verification" style={{ padding:'8px 20px', borderRadius:12, background:T.red, color:'white',
                  textDecoration:'none', fontSize:13, fontWeight:600 }}>Verify Now</Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="mobile-quick-actions" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop: isVerified ? -28 : 0, marginBottom:24, position:'relative', zIndex:3 }}>
          {quickActions.map((a,i) => (
            <motion.div key={i} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1+i*0.06 }}>
              <Link to={a.path} style={{ textDecoration:'none' }}>
                <motion.div whileHover={{ y:-4, boxShadow:'0 12px 32px rgba(0,0,0,0.08)' }}
                  style={{ background:T.surface, borderRadius:16, padding:'20px 16px', border:`1px solid ${T.border}`,
                    textAlign:'center', cursor:'pointer', transition:'all 0.3s' }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:a.bg, color:a.color,
                    display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>{a.icon}</div>
                  <p style={{ fontSize:13, fontWeight:600, color:T.text }}>{a.label}</p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="mobile-stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:28 }}>
          {[
            { label:'Active Rides', value: String(rides.length), icon:<PiCarBold size={20}/>, color:T.green, bg:T.greenLight },
            { label:'Status', value:isVerified?'Verified':isPending?'Pending':'Unverified', icon:<PiCheckCircleBold size={20}/>, color:isVerified?T.green:T.orange, bg:isVerified?T.greenLight:T.orangeLight },
            { label:'Earnings', value:'₹0', icon:<PiCurrencyInrBold size={20}/>, color:T.navy, bg:T.blue50 },
            { label:'Rating', value:'5.0 ★', icon:<PiStarBold size={20}/>, color:T.orange, bg:T.orangeLight },
          ].map((s,i)=>(
            <motion.div key={i} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2+i*0.07 }}
              style={{ background:T.surface, borderRadius:18, padding:22, border:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:11, color:T.muted, fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</p>
                  <p style={{ fontSize:26, fontWeight:800, color:T.text, marginTop:4, fontFamily:FONT.heading }}>{s.value}</p>
                </div>
                <div style={{ padding:10, borderRadius:12, background:s.bg, color:s.color }}>{s.icon}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Ride CTA */}
        {isVerified && (
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }} style={{ marginBottom:28 }}>
            <Link to="/rides/create" style={{ textDecoration:'none' }}>
              <motion.div whileHover={{ y:-4, boxShadow:'0 20px 48px rgba(20,184,166,0.2)' }}
                style={{ background:T.heroGrad, borderRadius:20, padding:24,
                  display:'flex', alignItems:'center', gap:16, cursor:'pointer' }}>
                <div style={{ width:56, height:56, borderRadius:16, background:T.gray200, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <PiPlusBold size={24} color="white"/>
                </div>
                <div style={{ flex:1 }}>
                  <h3 style={{ fontSize:20, fontWeight:700, color:'white', fontFamily:FONT.heading }}>Create a New Ride</h3>
                  <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>Offer a ride to your campus community</p>
                </div>
                <PiArrowRightBold size={20} color="rgba(255,255,255,0.7)"/>
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* Active Rides */}
        <FadeUp delay={0.1}>
        <div style={{ marginBottom:40 }}>
          <h2 style={{ fontSize:20, fontWeight:700, color:T.text, fontFamily:FONT.heading, marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ padding:6, borderRadius:8, background:T.greenLight, color:T.green, display:'flex' }}><PiSteeringWheelBold size={16}/></div>
            My Active Rides
          </h2>
          {loading ? (
            <div className="mobile-ride-cards" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
              {[1,2].map(i=>(
                <div key={i} style={{ background:T.surface, borderRadius:20, padding:24, border:`1px solid ${T.border}` }}>
                  <div style={{ height:16, width:'60%', background:T.blue50, borderRadius:8, marginBottom:12, animation:'pulse 1.5s infinite' }}/>
                  <div style={{ height:12, width:'100%', background:T.bg, borderRadius:6, marginBottom:8, animation:'pulse 1.5s infinite' }}/>
                  <div style={{ height:12, width:'70%', background:T.bg, borderRadius:6, animation:'pulse 1.5s infinite' }}/>
                </div>
              ))}
            </div>
          ) : rides.length === 0 ? (
            <div style={{ background:T.surface, borderRadius:20, padding:'52px 24px', border:`1px solid ${T.border}`, textAlign:'center', boxShadow:T.shadow1 }}>
              <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(135deg,${T.greenLight},${T.navy50})`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <PiCarBold size={32} color={T.green}/>
              </div>
              <h3 style={{ fontSize:18, fontWeight:700, color:T.text, fontFamily:FONT.heading }}>No Active Rides</h3>
              <p style={{ color:T.textSec, fontSize:14, marginTop:6 }}>{isVerified ? 'Create your first ride!' : 'Complete verification first.'}</p>
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
                  <motion.div whileHover={{ y:-6, boxShadow:'0 16px 40px rgba(20,184,166,0.1)' }}
                    style={{ background:T.surface, borderRadius:20, padding:24, border:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ padding:'4px 12px', borderRadius:8, background:T.greenLight, color:T.green, fontSize:11, fontWeight:600 }}>{ride.status}</span>
                      <span style={{ fontSize:12, color:T.muted, display:'flex', alignItems:'center', gap:3 }}>
                        <PiClockBold size={12}/> {format(new Date(ride.departure_time), 'MMM dd, h:mm a')}
                      </span>
                    </div>
                    <Link to={`/rides/${ride.id}`} style={{ textDecoration:'none' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14, cursor:'pointer' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:T.green }}/>
                          <span style={{ color:T.textSec }}>{ride.from_location?.address || 'Start'}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:T.red }}/>
                          <span style={{ color:T.textSec }}>{ride.to_location?.address || 'End'}</span>
                        </div>
                      </div>
                    </Link>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:`1px solid ${T.border}` }}>
                      <span style={{ fontSize:12, color:T.muted, display:'flex', alignItems:'center', gap:4 }}>
                        <PiUsersBold size={13}/> {ride.seats_available} seat{ride.seats_available!==1?'s':''}
                      </span>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontWeight:700, color:T.green, fontSize:16, fontFamily:FONT.heading }}>₹{ride.price_per_seat}/seat</span>
                        
                        <Link to={`/tracking/${ride.id}`} style={{ textDecoration:'none' }}>
                          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                            style={{ padding:'6px 12px', borderRadius:8, border:'none', background:T.navy, color:'white', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                            <PiMapPinBold size={14}/> Track
                          </motion.button>
                        </Link>

                        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                          onClick={() => handleDeleteRide(ride.id)} disabled={deletingRide === ride.id}
                          style={{ width:32, height:32, borderRadius:10, border:`1px solid ${T.red}30`, background:T.redLight,
                            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:T.red,
                            opacity: deletingRide === ride.id ? 0.5 : 1, transition:'all 0.2s' }}>
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
            <h2 style={{ fontSize:20, fontWeight:700, color:T.text, fontFamily:FONT.heading, marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ padding:6, borderRadius:8, background:T.blue50, color:T.navy, display:'flex' }}><PiBellBold size={16}/></div>
              Booking Requests
              <span style={{ padding:'2px 10px', borderRadius:8, fontSize:12, fontWeight:700, background:T.orangeLight, color:T.orange }}>
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
                    style={{ background:T.surface, borderRadius:18, padding:20, border:`1px solid ${T.border}`,
                      borderLeft: `4px solid ${statusColor}`, boxShadow:'0 2px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${T.blue50},${T.blueLight})`,
                          display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                          {rider?.profile_photo ? (
                            <img src={rider.profile_photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          ) : (
                            <span style={{ fontSize:16, fontWeight:700, color:T.blue }}>{(rider?.full_name || 'R')[0]}</span>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize:14, fontWeight:700, color:T.text }}>{rider?.full_name || 'Rider'}</p>
                          <p style={{ fontSize:11, color:T.muted }}>{rider?.phone || rider?.email || ''}</p>
                        </div>
                      </div>
                      <span style={{ padding:'4px 10px', borderRadius:8, fontSize:10, fontWeight:700, background:statusBg, color:statusColor, textTransform:'uppercase' }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>
                      {ride?.from_location?.address || 'Pickup'} → {ride?.to_location?.address || 'Drop'}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:T.navy, fontFamily:FONT.heading }}>₹{b.total_price}</span>
                        <span style={{ fontSize:12, color:T.muted }}>• {b.seats_booked} seat{b.seats_booked !== 1 ? 's' : ''}</span>
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
          <motion.div whileHover={{ y:-4,boxShadow:T.shadow2 }}
            style={{ background:`linear-gradient(135deg, ${T.redLight}, #FFF5F5)`, borderRadius:20, padding:24, border:`1px solid ${T.red}20`, position:'relative', overflow:'hidden', transition:'all 0.35s' }}>
            <div style={{ position:'absolute', top:-10, right:-10, opacity:0.1, color:T.red }}><PiWarningBold size={100}/></div>
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, color:T.red, marginBottom:8 }}>
                <PiWarningBold size={20}/>
                <h3 style={{ fontSize:16, fontWeight:700, margin:0, fontFamily:FONT.heading }}>Emergency SOS</h3>
              </div>
              <p style={{ fontSize:13, color:T.red, margin:'0 0 16px', lineHeight:1.5 }}>
                Instantly alert university security and your emergency contacts.
              </p>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => setIsSOSOpen(true)}
                style={{ width:'100%', padding:'12px', background:T.red, color:'#FFF', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 12px rgba(244,63,94,0.3)' }}>
                Open Safety Assistant
              </motion.button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.5 }}
            style={{ background:`linear-gradient(135deg,${T.blue50},${T.blueLight})`, borderRadius:20, padding:24, border:`1px solid ${T.gray200}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <PiChatCircleBold size={20} color={T.navy}/>
              <h3 style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:FONT.heading }}>Customer Support</h3>
            </div>
            <p style={{ fontSize:13, color:T.textSec, lineHeight:1.6, marginBottom:16 }}>
              Need help? Chat with our support team for any issues or queries.
            </p>
            <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={() => setChatOpen(true)}
              style={{ padding:'10px 20px', borderRadius:12, border:'none', background:T.navy, color:'white',
                fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
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
            style={{ position:'fixed', bottom:24, right:24, width:360, height:480, borderRadius:20, overflow:'hidden', zIndex:50,
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
