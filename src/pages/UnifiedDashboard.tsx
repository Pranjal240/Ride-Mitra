import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PiMagnifyingGlassBold, PiCalendarCheckBold, PiCarBold, PiTrendUpBold,
  PiLeafBold, PiStarBold, PiWarningBold, PiArrowRightBold, PiClockBold,
  PiUsersBold, PiShieldCheckBold, PiMapPinBold, PiLightningBold,
  PiNavigationArrowBold, PiChatCircleBold, PiPlusBold, PiGlobeBold,
  PiBellBold, PiTrashBold, PiCheckBold, PiXBold
} from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { getRides, getBookings, getDriverBookingRequests, updateBooking, deleteRide } from '../lib/api';
import { updateProfile } from '../lib/auth';
import type { Ride, Booking } from '../types';
import { format } from 'date-fns';
import { useRealtimeNotifications } from '../hooks/useRealtime';
import SOSModal from '../components/common/SOSModal';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

export default function UnifiedDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Rider state
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  
  // Driver state
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [deletingRide, setDeletingRide] = useState<string | null>(null);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergency_contact_phone || '');
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [aRides, mBookings, mRides, reqs] = await Promise.all([
          getRides({ status: 'active' }),
          getBookings(user.id),
          getRides({ driver_id: user.id }),
          getDriverBookingRequests(user.id)
        ]);
        setAvailableRides(aRides.filter(r => r.driver_id !== user.id).slice(0, 4));
        setMyBookings(mBookings.slice(0, 3));
        setMyRides(mRides.filter(r => r.status === 'active' || r.status === 'completed'));
        setBookingRequests(reqs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  useRealtimeNotifications(user?.id);

  const handleDeleteRide = async (rideId: string) => {
    if (!window.confirm('Are you sure you want to delete this ride? All associated bookings will be cancelled.')) return;
    setDeletingRide(rideId);
    try {
      await deleteRide(rideId);
      setMyRides(prev => prev.filter(r => r.id !== rideId));
      setBookingRequests(prev => prev.map(b => b.ride_id === rideId ? { ...b, status: 'cancelled' } : b));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeletingRide(null);
    }
  };

  const handleBookingAction = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    setProcessingBooking(bookingId);
    try {
      await updateBooking(bookingId, { status });
      setBookingRequests(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessingBooking(null);
    }
  };

  const hour = time.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const timeStr = format(time, 'h:mm a');

  const stats = [
    { label:'Booked', value: myBookings.length, icon:<PiCarBold size={20}/>, grad:'linear-gradient(135deg,#6C3CE1,#8B5CF6)' },
    { label:'Offered', value: myRides.length, icon:<PiTrendUpBold size={20}/>, grad:'linear-gradient(135deg,#14B8A6,#06B6D4)' },
    { label:'Requests', value: bookingRequests.filter(b=>b.status==='pending').length, icon:<PiBellBold size={20}/>, grad:'linear-gradient(135deg,#F59E0B,#FBBF24)' },
  ];

  const quickLinks = [
    { label:'Find Ride', icon:<PiMagnifyingGlassBold size={22}/>, to:'/rides/search', grad:`linear-gradient(135deg,${T.blue},${T.blueDark})` },
    { label:'Offer Ride', icon:<PiPlusBold size={22}/>, to:'/rides/create', grad:`linear-gradient(135deg,${T.green},#059669)` },
    { label:'My Bookings', icon:<PiCalendarCheckBold size={22}/>, to:'/bookings', grad:`linear-gradient(135deg,${T.blue},${T.blueDark})` },
  ];

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ minHeight:'100vh', background:T.bg }}>
      {/* ── Hero Banner ── */}
      <div style={{
        background:T.heroGrad,
        padding:'48px 24px 64px', position:'relative', overflow:'hidden',
      }}>
        <motion.div animate={{ scale:[1,1.3,1], opacity:[0.08,0.15,0.08] }} transition={{ duration:6,repeat:Infinity }}
          style={{ position:'absolute', top:'-20%', right:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, #8B5CF6 0%, transparent 70%)', filter:'blur(40px)' }}/>
        
        <div style={{ maxWidth:1200, margin:'0 auto', position:'relative', zIndex:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div>
              <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
                style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(27,43,75,0.08)', padding:'6px 14px', borderRadius:20, backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.9)', fontSize:13, fontWeight:600, marginBottom:16 }}>
                <PiClockBold size={16}/> {timeStr}
              </motion.div>
              <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
                style={{ fontSize:32, fontWeight:800, color:'#FFF', fontFamily:FONT.heading, margin:'0 0 8px', letterSpacing:'-0.5px' }}>
                {greeting}, {user?.full_name?.split(' ')[0] || 'User'}! 👋
              </motion.h1>
              <motion.p initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}
                style={{ fontSize:16, color:'rgba(255,255,255,0.7)', margin:0, maxWidth:400 }}>
                Manage your rides and bookings from one place.
              </motion.p>
            </div>
            
            <div style={{ display:'flex', gap:12 }}>
              {stats.map((s,i) => (
                <motion.div key={i} initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.2+i*0.1 }}
                  style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'16px 20px', minWidth:120 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                    <div style={{ background:s.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{s.icon}</div>
                    {s.label}
                  </div>
                  <div style={{ fontSize:28, fontWeight:800, color:'#FFF', fontFamily:FONT.heading }}>
                    {s.value}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'-32px auto 0', padding:'0 24px 64px', position:'relative', zIndex:20 }}>
        
        {/* Quick Links */}
        <div className="mobile-grid-stack" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:40 }}>
          {quickLinks.map((link,i)=>(
            <motion.div key={i} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3+i*0.1 }}>
              <Link to={link.to} style={{ textDecoration:'none', display:'block' }}>
                <motion.div whileHover={{ y:-4, boxShadow:'0 12px 24px rgba(0,0,0,0.06)' }}
                  style={{ background:T.surface, borderRadius:20, padding:20, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:link.grad, display:'flex', alignItems:'center', justifyContent:'center', color:'#FFF', boxShadow:'0 8px 16px rgba(0,0,0,0.1)' }}>
                    {link.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:T.text }}>{link.label}</div>
                  </div>
                  <PiArrowRightBold color={T.muted}/>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mobile-grid-stack" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24 }}>
          {/* Left Column: Requests & My Rides (Driver context) */}
          <div>
            {bookingRequests.length > 0 && (
              <div style={{ marginBottom:32 }}>
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
                            <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${T.navy50},${T.gold50})`,
                              display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                              {rider?.profile_photo ? (
                                <img src={rider.profile_photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                              ) : (
                                <span style={{ fontSize:16, fontWeight:700, color:T.blue }}>{(rider?.full_name || 'R')[0]}</span>
                              )}
                            </div>
                            <div>
                              <p style={{ fontSize:14, fontWeight:700, color:T.text }}>{rider?.full_name || 'Rider'}</p>
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
                            <span style={{ fontSize:13, fontWeight:700, color:T.blue }}>₹{b.total_price}</span>
                            <span style={{ fontSize:12, color:T.muted }}>• {b.seats_booked} seat{b.seats_booked !== 1 ? 's' : ''}</span>
                          </div>
                          {isPending && (
                            <div style={{ display:'flex', gap:8 }}>
                              <motion.button whileTap={{ scale:0.9 }} onClick={() => handleBookingAction(b.id, 'confirmed')} disabled={processingBooking === b.id}
                                style={{ padding:'6px 16px', borderRadius:10, border:'none', background:T.green, color:'white', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                                <PiCheckBold size={12}/> Accept
                              </motion.button>
                              <motion.button whileTap={{ scale:0.9 }} onClick={() => handleBookingAction(b.id, 'cancelled')} disabled={processingBooking === b.id}
                                style={{ padding:'6px 16px', borderRadius:10, border:`1px solid ${T.red}30`, background:T.redLight, color:T.red, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
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
            )}

            <div style={{ marginBottom:32 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <h2 style={{ fontSize:20, fontWeight:700, color:T.text, fontFamily:FONT.heading, display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ padding:6, borderRadius:8, background:T.greenLight, color:T.green, display:'flex' }}><PiCarBold size={16}/></div>
                  Rides Offered
                </h2>
              </div>
              
              {loading ? <div style={{ height:100, background:T.surface, borderRadius:20, animation:'pulse 1.5s infinite' }}/> : myRides.length === 0 ? (
                <div style={{ background:T.surface, borderRadius:20, padding:'40px 24px', border:`1px solid ${T.border}`, textAlign:'center' }}>
                  <p style={{ color:T.textSec, fontSize:14 }}>You haven't offered any rides yet.</p>
                </div>
              ) : (
                <div className="mobile-grid-stack" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
                  {myRides.map((ride,i)=>(
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
              )}
            </div>
          </div>

          {/* Right Column: Upcoming Bookings & Alerts */}
          <div>
            <div style={{ marginBottom:32 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <h2 style={{ fontSize:20, fontWeight:700, color:T.text, fontFamily:FONT.heading, display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ padding:6, borderRadius:8, background:T.navy50, color:T.navy, display:'flex' }}><PiCalendarCheckBold size={16}/></div>
                  My Bookings
                </h2>
                <Link to="/bookings" style={{ color:T.navy, fontSize:13, fontWeight:600, textDecoration:'none' }}>View All</Link>
              </div>

              {loading ? <div style={{ height:120, background:T.surface, borderRadius:20, animation:'pulse 1.5s infinite' }}/> : myBookings.length === 0 ? (
                <div style={{ background:T.surface, borderRadius:20, padding:24, border:`1px solid ${T.border}`, textAlign:'center' }}>
                  <div style={{ width:48, height:48, borderRadius:'50%', background:T.gray100, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:T.muted }}>
                    <PiCalendarCheckBold size={24}/>
                  </div>
                  <p style={{ color:T.textSec, fontSize:14, marginBottom:16 }}>No upcoming trips.</p>
                  <Link to="/rides/search" style={{ padding:'8px 16px', background:T.navy, color:'#FFF', borderRadius:8, fontSize:13, fontWeight:600, textDecoration:'none', display:'inline-block' }}>Find a Ride</Link>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {myBookings.map((b,i) => {
                    const ride = (b as any).ride;
                    const driver = ride?.driver;
                    return (
                      <motion.div key={b.id} initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.2+i*0.1 }}>
                        <Link to={`/tracking/${ride?.id}`} style={{ textDecoration:'none' }}>
                          <motion.div whileHover={{ x:4 }} style={{ background:T.surface, borderRadius:16, padding:16, border:`1px solid ${T.border}`, borderLeft:`4px solid ${T.blue}` }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                              <span style={{ fontSize:12, fontWeight:700, color:T.blue }}>{format(new Date(ride?.departure_time || new Date()), 'MMM dd, h:mm a')}</span>
                              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background: b.status==='confirmed'?T.greenLight:T.orangeLight, color: b.status==='confirmed'?T.green:T.orange, fontWeight:700, textTransform:'uppercase' }}>{b.status}</span>
                            </div>
                            <div style={{ fontSize:13, color:T.text, fontWeight:600, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                              To {ride?.to_location?.address}
                            </div>
                            <div style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6 }}>
                              <img src={driver?.profile_photo || ''} alt="" style={{ width:20, height:20, borderRadius:'50%', background:T.gray200 }}/>
                              With {driver?.full_name || 'Driver'}
                            </div>
                          </motion.div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.5 }}
              style={{ background:'linear-gradient(135deg, #FEF2F2, #FFF1F2)', borderRadius:20, padding:24, border:`1px solid #FECDD3`, position:'relative', overflow:'hidden' }}>
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

            {/* Emergency Contact */}
            <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.6 }}
              style={{ background:T.surface, borderRadius:20, padding:24, border:`1px solid ${T.border}`, marginTop:20, boxShadow:'0 4px 16px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:FONT.heading, marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                <PiWarningBold color={T.red} size={16}/> Emergency Contact
              </h3>
              <p style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>
                Receives SOS alerts with your live location.
              </p>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  type="tel"
                  placeholder="+91..."
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  style={{ flex:1, padding:'10px 14px', borderRadius:12, border:`1px solid ${T.border}`, background:T.gray100, fontSize:13, outline:'none' }}
                />
                <button
                  onClick={async () => {
                    if (!user) return;
                    setSavingContact(true);
                    try {
                      await updateProfile(user.id, { emergency_contact_phone: emergencyPhone });
                      alert('Contact saved!');
                    } catch (e) { alert('Error saving contact'); }
                    setSavingContact(false);
                  }}
                  disabled={savingContact || emergencyPhone === user?.emergency_contact_phone}
                  style={{ padding:'10px 16px', borderRadius:12, border:'none', background:T.red, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', opacity: (savingContact || emergencyPhone === user?.emergency_contact_phone) ? 0.7 : 1 }}
                >
                  {savingContact ? '...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </motion.div>
  );
}
