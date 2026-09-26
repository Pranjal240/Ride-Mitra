import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PiMapPinBold, PiClockBold, PiUsersBold, PiStarBold, PiArrowLeftBold, PiMinusBold, PiPlusBold, PiCarBold, PiSpinnerBold, PiCheckCircleBold, PiNavigationArrowBold, PiSignInBold, PiLockBold } from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { getRideById, createBooking, getReviewsForUser, deleteRide } from '../lib/api';
import { MapView } from '../components/maps';
import type { MapMarker } from '../components/maps';
import { calculateRoute } from '../lib/maps';
import type { Ride, Review } from '../types';
import { format } from 'date-fns';
import T, { FONT } from '../lib/theme';

export default function BookRide() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [ride, setRide] = useState<Ride | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState(1);
  const [booking, setBooking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const r = await getRideById(id);
        setRide(r);
        if (r?.driver_id) {
          const rev = await getReviewsForUser(r.driver_id);
          setReviews(rev.slice(0, 3));
        }
        // Calculate route for map
        if (r?.from_location && r?.to_location) {
          try {
            const route = await calculateRoute(r.from_location, r.to_location);
            if (route.geometry) setRouteCoords(route.geometry);
          } catch { /* route calc failed, map still shows markers */ }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  // Map markers
  const markers = useMemo<MapMarker[]>(() => {
    if (!ride) return [];
    const m: MapMarker[] = [];
    if (ride.from_location) m.push({ id: 'from', position: [ride.from_location.lat, ride.from_location.lng], type: 'pickup', popup: `Pickup: ${ride.from_location.address || 'Start'}` });
    if (ride.to_location) m.push({ id: 'to', position: [ride.to_location.lat, ride.to_location.lng], type: 'drop', popup: `Drop: ${ride.to_location.address || 'End'}` });
    return m;
  }, [ride]);

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    if (!ride) return;
    setBooking(true);
    try {
      const total = seats * (ride.price_per_seat || 0);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: "INR",
        name: "Ride Mitra",
        description: `Booking ride from ${ride.from_location?.address} to ${ride.to_location?.address}`,
        handler: async function (response: any) {
          try {
            await createBooking({
              ride_id: ride.id, rider_id: user.id, seats_booked: seats,
              total_price: total, payment_status: 'paid', payment_id: response.razorpay_payment_id
            });
            navigate('/bookings');
          } catch (e) { console.error('Booking failed after payment', e); alert('Payment succeeded but booking failed. Contact support.'); }
        },
        prefill: { name: user.full_name || '', email: user.email || '', contact: user.phone || '' },
        theme: { color: T.navy }
      };
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        await new Promise<void>((resolve, reject) => { script.onload = () => resolve(); script.onerror = () => reject(new Error('Failed to load Razorpay')); document.body.appendChild(script); });
      }
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) { alert(response.error.description); setBooking(false); });
      rzp.open();
    } catch (e) { console.error('Booking initiation failed', e); alert('Could not initiate payment. Please try again.'); setBooking(false); }
  };

  const handleDeleteRide = async () => {
    if (!ride) return;
    if (!window.confirm('Delete this ride? All bookings will be cancelled.')) return;
    setDeleting(true);
    try { await deleteRide(ride.id); navigate(-1); } catch (e: any) { alert(e.message); setDeleting(false); }
  };

  const darkPageBg = 'radial-gradient(ellipse at top, #152240 0%, #0A1128 60%, #050914 100%)';

  if (loading) return (
    <div style={{ minHeight:'100vh', background:darkPageBg, padding:'32px 20px', color:'white' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{
            height: i === 1 ? 300 : 120, borderRadius: 20,
            background:'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
            backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite',
            border:'1px solid rgba(255,255,255,0.06)', marginBottom:16,
          }}/>
        ))}
      </div>
    </div>
  );

  if (!ride) return (
    <div style={{ minHeight:'100vh', background:darkPageBg, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
      <div style={{ textAlign:'center' }}>
        <PiCarBold size={48} color="rgba(255,255,255,0.4)"/>
        <h2 style={{ fontSize:22, fontWeight:800, color:'white', marginTop:12, fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>Ride not found</h2>
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={() => navigate('/rides/search')}
          style={{
            marginTop:16, padding:'11px 26px', borderRadius:100, border:'none',
            background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
            fontSize:13, fontWeight:800, cursor:'pointer',
            boxShadow:`0 8px 20px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
          }}>
          Find Rides
        </motion.button>
      </div>
    </div>
  );

  const totalPrice = seats * (ride.price_per_seat || 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 'New';
  const isOwner = user?.id === ride.driver_id;

  return (
    <div style={{ minHeight:'100vh', background:darkPageBg, color:'white', fontFamily:FONT.body }}>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 20px 48px' }}>
        {/* Back button */}
        <motion.button initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} whileHover={{ x:-3 }} whileTap={{ scale:0.95 }}
          onClick={() => navigate(-1)}
          style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.7)', fontSize:14, fontWeight:500, background:'none', border:'none', cursor:'pointer', marginBottom:20, padding:0 }}>
          <PiArrowLeftBold size={16}/> Back
        </motion.button>

        {/* Map Section */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ borderRadius:20, overflow:'hidden', marginBottom:20, border:'1px solid rgba(255,255,255,0.08)', boxShadow:T.shadow2 }}>
          <MapView
            markers={markers}
            route={routeCoords.length > 0 ? routeCoords : undefined}
            center={ride.from_location ? [ride.from_location.lat, ride.from_location.lng] : undefined}
            zoom={12}
            height="320px"
          />
        </motion.div>

        <div className="mobile-grid-stack" style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>
          {/* Left Column - Ride Details */}
          <div>
            {/* Driver Card */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.06 }}
              style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:22, padding:24, marginBottom:16,
                backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:56, height:56, borderRadius:16, background:T.heroGrad, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                  {ride.driver?.profile_photo ? (
                    <img src={ride.driver.profile_photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  ) : (
                    <span style={{ fontSize:22, fontWeight:700, color:'white' }}>{(ride.driver?.full_name || 'D')[0]}</span>
                  )}
                </div>
                <div style={{ flex:1 }}>
                  <h2 style={{ fontSize:18, fontWeight:700, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>{ride.driver?.full_name || 'Driver'}</h2>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                    <PiStarBold size={14} color={T.orange}/>
                    <span style={{ fontSize:14, fontWeight:600, color:'white' }}>{avgRating}</span>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>({reviews.length} reviews)</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Route Card */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:22, padding:24, marginBottom:16,
                backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              }}>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background:T.green, marginTop:3, flexShrink:0, boxShadow:`0 0 8px ${T.green}40` }}/>
                  <div>
                    <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:1 }}>FROM</p>
                    <p style={{ fontSize:14, fontWeight:600, color:'white' }}>{ride.from_location?.address || 'Start'}</p>
                  </div>
                </div>
                <div style={{ width:1.5, height:18, background:`linear-gradient(180deg, ${T.green}, ${T.red})`, marginLeft:5, borderRadius:1 }}/>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background:T.red, marginTop:3, flexShrink:0, boxShadow:`0 0 8px ${T.red}40` }}/>
                  <div>
                    <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:1 }}>TO</p>
                    <p style={{ fontSize:14, fontWeight:600, color:'white' }}>{ride.to_location?.address || 'End'}</p>
                  </div>
                </div>
              </div>

              {/* Date & Time & Seats info strip */}
              <div style={{ display:'flex', gap:16, marginTop:20, paddingTop:16, borderTop:`1px solid ${T.border}`, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:12, background:`${T.blue}22`, border:`1px solid ${T.blue}44` }}>
                  <PiClockBold size={16} color={T.navy}/>
                  <span style={{ fontSize:13, fontWeight:600, color:T.navy }}>{format(new Date(ride.departure_time), 'EEE, MMM dd')}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:12, background:`${T.gold}22`, border:`1px solid ${T.gold}44` }}>
                  <PiClockBold size={16} color={T.gold}/>
                  <span style={{ fontSize:13, fontWeight:600, color:T.goldDark }}>{format(new Date(ride.departure_time), 'h:mm a')}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:12, background:`${T.green}22`, border:`1px solid ${T.green}44` }}>
                  <PiUsersBold size={16} color={T.green}/>
                  <span style={{ fontSize:13, fontWeight:600, color:T.green }}>{ride.seats_available} seats</span>
                </div>
              </div>
            </motion.div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
                style={{
                  background:'rgba(255,255,255,0.04)', borderRadius:22, padding:24,
                  border:'1px solid rgba(255,255,255,0.08)',
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                }}>
                <h3 style={{ fontSize:16, fontWeight:800, color:'white', marginBottom:14, fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>Driver Reviews</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {reviews.map((r) => (
                    <div key={r.id} style={{ padding:'14px 16px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                        <div style={{ display:'flex', gap:1 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <PiStarBold key={i} size={12} color={i < r.rating ? T.gold : 'rgba(255,255,255,0.15)'}/>
                          ))}
                        </div>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginLeft:4 }}>{r.reviewer?.full_name}</span>
                      </div>
                      {r.comment && <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.5 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Booking Card (sticky) */}
          <div style={{ position:'sticky', top:88 }}>
            {isOwner ? (
              /* Driver viewing own ride */
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
                style={{
                  background:'linear-gradient(135deg, rgba(200,149,108,0.15), rgba(255,255,255,0.03))',
                  border:`1px solid ${T.gold}55`, borderRadius:22, padding:24,
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                  <div style={{
                    width:44, height:44, borderRadius:14,
                    background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:`0 8px 20px ${T.gold}55`,
                  }}><PiCarBold size={20}/></div>
                  <div>
                    <h3 style={{ fontSize:16, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>Your Ride</h3>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginTop:2 }}>Manage from your dashboard</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={() => navigate('/unified')}
                    style={{
                      flex:1, padding:'13px', borderRadius:12, border:'none',
                      background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
                      fontSize:14, fontWeight:800, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      boxShadow:`0 8px 20px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                    }}>
                    <PiStarBold size={16}/> Dashboard
                  </motion.button>
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={handleDeleteRide} disabled={deleting}
                    style={{
                      flex:1, padding:'13px', borderRadius:12,
                      border:`1px solid ${T.red}55`, background:`${T.red}22`, color:T.red,
                      fontSize:14, fontWeight:800, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    }}>
                    {deleting ? <div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}><PiSpinnerBold size={16}/></div> : 'Delete Ride'}
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              /* Rider booking form */
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
                style={{
                  background:'rgba(255,255,255,0.04)', borderRadius:22, padding:24,
                  border:'1px solid rgba(255,255,255,0.08)',
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                }}>
                <h3 style={{ fontSize:19, fontWeight:800, color:'white', marginBottom:20, fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>
                  Book Your <span style={{ background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Seat</span>
                </h3>

                {/* Seat selector */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                  <span style={{ fontSize:14, color:'rgba(255,255,255,0.7)' }}>Number of seats</span>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <motion.button whileTap={{ scale:0.85 }} onClick={() => setSeats(Math.max(1, seats - 1))}
                      aria-label="Decrease seats"
                      style={{
                        width:40, height:40, borderRadius:12,
                        border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)',
                        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                        color:'rgba(255,255,255,0.85)', transition:'all 0.2s',
                      }}>
                      <PiMinusBold size={14}/>
                    </motion.button>
                    <span style={{ fontSize:26, fontWeight:900, color:'white', width:32, textAlign:'center', fontFamily:FONT.heading, letterSpacing:'-0.02em' }}>{seats}</span>
                    <motion.button whileTap={{ scale:0.85 }} onClick={() => setSeats(Math.min(ride.seats_available || 4, seats + 1))}
                      aria-label="Increase seats"
                      style={{
                        width:40, height:40, borderRadius:12, border:'none',
                        background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
                        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                        boxShadow:`0 6px 14px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                        transition:'all 0.2s',
                      }}>
                      <PiPlusBold size={14}/>
                    </motion.button>
                  </div>
                </div>

                {/* Price per seat */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, fontSize:13, color:'rgba(255,255,255,0.7)' }}>
                  <span>Price per seat</span>
                  <span>₹{ride.price_per_seat}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, fontSize:13, color:'rgba(255,255,255,0.7)' }}>
                  <span>Seats × {seats}</span>
                  <span>₹{totalPrice}</span>
                </div>

                {/* Total */}
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'16px 20px', borderRadius:16, marginBottom:20, marginTop:12,
                  background:'linear-gradient(135deg, rgba(200,149,108,0.18), rgba(255,255,255,0.03))',
                  border:`1px solid ${T.gold}55`,
                }}>
                  <span style={{ fontSize:15, fontWeight:800, color:'white', letterSpacing:0.5 }}>Total</span>
                  <span style={{
                    fontSize:28, fontWeight:900, fontFamily:FONT.heading, letterSpacing:'-0.02em',
                    background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`,
                    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  }}>₹{totalPrice}</span>
                </div>

                {/* Info */}
                <div style={{
                  display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12,
                  background:`${T.green}18`, border:`1px solid ${T.green}44`, marginBottom:16,
                }}>
                  <PiCheckCircleBold size={16} color={T.green}/>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.75)' }}>Your request will be sent to the driver for confirmation</span>
                </div>

                {/* Book / Login Button */}
                {user ? (
                  <motion.button whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.97 }}
                    onClick={handleBook} disabled={booking}
                    style={{
                      width:'100%', padding:'16px', borderRadius:14, border:'none',
                      background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
                      fontSize:15, fontWeight:800, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      boxShadow:`0 12px 32px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                      transition:'all 0.3s', opacity: booking ? 0.7 : 1,
                      letterSpacing:0.5,
                    }}>
                    {booking ? (
                      <><div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}><PiSpinnerBold size={18}/></div> Processing…</>
                    ) : (
                      <><PiCheckCircleBold size={18}/> Request Booking</>
                    )}
                  </motion.button>
                ) : (
                  /* Not logged in — show login prompt */
                  <div>
                    <motion.button whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.97 }}
                      onClick={() => navigate('/login')}
                      style={{
                        width:'100%', padding:'16px', borderRadius:14, border:'none',
                        background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
                        fontSize:15, fontWeight:800, cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                        boxShadow:`0 12px 32px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                        transition:'all 0.3s', letterSpacing:0.5,
                      }}>
                      <PiSignInBold size={18}/> Sign In to Book
                    </motion.button>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', textAlign:'center', marginTop:10, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <PiLockBold size={12}/> Login required to finalize ride booking
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
