import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PiMapPinBold, PiClockBold, PiUsersBold, PiCurrencyInrBold,
  PiCaretRightBold, PiCaretLeftBold, PiCheckBold,
  PiArrowCounterClockwiseBold, PiNavigationArrowBold, PiSpinnerBold,
  PiCarBold, PiCalendarBold
} from 'react-icons/pi';
import { MapView, LocationSearch } from '../components/maps';
import type { MapMarker } from '../components/maps';
import { useAuthStore } from '../hooks/useStore';
import { createRide } from '../lib/api';
import { calculateRoute, reverseGeocode, formatDistance, formatDuration, getUserLocation } from '../lib/maps';
import type { RouteInfo } from '../lib/maps';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

const steps = ['Route', 'Schedule', 'Details', 'Confirm'];

export default function CreateRide() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [autoLocating, setAutoLocating] = useState(false);

  const [from, setFrom] = useState<{ name: string; coords: [number, number]; eLoc?: string } | null>(null);
  const [to, setTo] = useState<{ name: string; coords: [number, number]; eLoc?: string } | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState(30);

  // Auto-detect user location on page load
  useEffect(() => {
    let cancelled = false;
    async function autoDetectLocation() {
      setAutoLocating(true);
      try {
        const coords = await getUserLocation();
        if (cancelled) return;
        const address = await reverseGeocode(coords[0], coords[1]);
        if (cancelled) return;
        setFrom({ name: address, coords });
        console.log('📍 Auto-detected location:', address, coords);
      } catch (e) {
        console.warn('Auto-location failed:', e);
      } finally {
        if (!cancelled) setAutoLocating(false);
      }
    }
    autoDetectLocation();
    return () => { cancelled = true; };
  }, []);

  const calcRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    setLoadingRoute(true);
    try {
      const result = await calculateRoute(start, end);
      setRoute(result);
    } catch {
      setRoute({ distance: 0, duration: 0, geometry: [start, end] });
    } finally { setLoadingRoute(false); }
  }, []);

  const handleFromSelect = useCallback(async (loc: { name: string; coordinates: [number, number]; eLoc?: string }) => {
    setFrom({ name: loc.name, coords: loc.coordinates, eLoc: loc.eLoc });
    if (to) await calcRoute(loc.coordinates, to.coords);
  }, [to, calcRoute]);

  const handleToSelect = useCallback(async (loc: { name: string; coordinates: [number, number]; eLoc?: string }) => {
    setTo({ name: loc.name, coords: loc.coordinates, eLoc: loc.eLoc });
    if (from) await calcRoute(from.coords, loc.coordinates);
  }, [from, calcRoute]);

  const handleMapClick = useCallback(async (latlng: { lat: number; lng: number }) => {
    const coords: [number, number] = [latlng.lat, latlng.lng];
    const address = await reverseGeocode(latlng.lat, latlng.lng);
    if (!from) {
      setFrom({ name: address, coords });
    } else if (!to) {
      setTo({ name: address, coords });
      await calcRoute(from.coords, coords);
    }
  }, [from, to, calcRoute]);

  const handleFromDrag = useCallback(async (latlng: { lat: number; lng: number }) => {
    const coords: [number, number] = [latlng.lat, latlng.lng];
    const address = await reverseGeocode(latlng.lat, latlng.lng);
    setFrom({ name: address, coords });
    if (to) await calcRoute(coords, to.coords);
  }, [to, calcRoute]);

  const handleToDrag = useCallback(async (latlng: { lat: number; lng: number }) => {
    const coords: [number, number] = [latlng.lat, latlng.lng];
    const address = await reverseGeocode(latlng.lat, latlng.lng);
    setTo({ name: address, coords });
    if (from) await calcRoute(from.coords, coords);
  }, [from, calcRoute]);

  const handleClearRoute = () => { setFrom(null); setTo(null); setRoute(null); };

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = [];
    if (from) m.push({ id: 'from', position: from.coords, type: 'pickup', popup: `Pickup: ${from.name}`, draggable: true, onDragEnd: handleFromDrag });
    if (to) m.push({ id: 'to', position: to.coords, type: 'drop', popup: `Drop: ${to.name}`, draggable: true, onDragEnd: handleToDrag });
    return m;
  }, [from, to, handleFromDrag, handleToDrag]);

  const handleSubmit = async () => {
    if (!user || !from || !to || !date || !time) return;
    setSubmitting(true);
    try {
      await createRide({
        driver_id: user.id,
        from_location: { lat: from.coords[0], lng: from.coords[1], address: from.name },
        to_location: { lat: to.coords[0], lng: to.coords[1], address: to.name },
        departure_time: `${date}T${time}:00`,
        seats_available: seats,
        price_per_seat: price,
        route_polyline: route ? JSON.stringify(route.geometry) : undefined,
      });
      navigate('/driver');
    } catch { console.error('Failed to create ride'); }
    finally { setSubmitting(false); }
  };

  const canNext = step === 0 ? from && to : step === 1 ? date && time : step === 2 ? seats > 0 && price > 0 : true;

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(180deg, ${T.bg}, ${T.gray100})`, fontFamily:"'Inter', sans-serif" }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px 48px' }}>
        {/* Header */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.text, fontFamily:FONT.heading, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ padding:8, borderRadius:12, background:`linear-gradient(135deg,${T.navy50},${T.gold50})`, display:'flex' }}>
              <PiCarBold size={22} color={T.navy}/>
            </div>
            Create a Ride
          </h1>
          <p style={{ fontSize:14, color:T.textSec, marginTop:4 }}>Offer a ride to your campus community</p>
        </motion.div>

        {/* Steps indicator */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display:'flex', alignItems:'center', flex:1 }}>
              <div style={{
                width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:700, flexShrink:0, transition:'all 0.3s',
                background: i < step ? T.green : i === step ? T.blue : T.gray200,
                color: i <= step ? 'white' : T.muted,
                boxShadow: i === step ? `0 4px 12px ${T.blue}40` : 'none',
              }}>
                {i < step ? <PiCheckBold size={14}/> : i + 1}
              </div>
              <span style={{ marginLeft:8, fontSize:13, fontWeight:500, color: i === step ? T.blue : T.muted, display: 'none' }}>{s}</span>
              {i < steps.length - 1 && (
                <div style={{ flex:1, height:2, margin:'0 10px', borderRadius:1, background: i < step ? T.green : T.gray200, transition:'all 0.5s' }}/>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>

            {/* Step 0: Route */}
            {step === 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'2fr 3fr', gap:20 }}>
                <div style={{ background:T.surface, borderRadius:20, padding:24, border:`1px solid ${T.border}`, boxShadow:'0 4px 16px rgba(27,43,75,0.04)' }}>
                  <h2 style={{ fontSize:17, fontWeight:700, color:T.text, marginBottom:16, fontFamily:FONT.heading }}>Select Route</h2>
                  {autoLocating && (
                    <div style={{ marginBottom:10, padding:'10px 14px', borderRadius:12, background:'rgba(20, 184, 166, 0.1)', display:'flex', alignItems:'center', gap:8, fontSize:13, color:T.green }}>
                      <div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}><PiSpinnerBold size={14}/></div>
                      Detecting your location via GPS...
                    </div>
                  )}
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <LocationSearch label="Pickup Point" placeholder={autoLocating ? "Detecting GPS location..." : "Search or click map..."} icon="pickup" onLocationSelect={handleFromSelect} value={from?.name || ''} disabled={autoLocating}/>
                    <LocationSearch label="Drop Point" placeholder="Search or click map..." icon="drop" onLocationSelect={handleToSelect} value={to?.name || ''}/>
                  </div>

                  {route && route.distance > 0 && (
                    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                      style={{ marginTop:16, padding:'16px 18px', borderRadius:14, background:'rgba(27,43,75,0.1)', border:'1px solid rgba(27,43,75,0.3)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                        <div>
                          <p style={{ fontSize:10, fontWeight:600, color:T.muted, textTransform:'uppercase' }}>Distance</p>
                          <p style={{ fontSize:18, fontWeight:800, color:T.navy, fontFamily:FONT.heading }}>{formatDistance(route.distance)}</p>
                        </div>
                        <div style={{ width:1, height:32, background:'#C7B6F6' }}/>
                        <div>
                          <p style={{ fontSize:10, fontWeight:600, color:T.muted, textTransform:'uppercase' }}>Est. Time</p>
                          <p style={{ fontSize:18, fontWeight:800, color:T.navy, fontFamily:FONT.heading }}>{formatDuration(+route.duration)}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {loadingRoute && (
                    <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8, fontSize:13, color:T.muted }}>
                      <div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}><PiSpinnerBold size={14}/></div>
                      Calculating route...
                    </div>
                  )}

                  <div style={{ display:'flex', gap:8, marginTop:14 }}>
                    {(from || to) && (
                      <motion.button whileTap={{ scale:0.95 }} onClick={handleClearRoute}
                        style={{ padding:'8px 14px', borderRadius:10, border:`1px solid ${T.border}`, background:T.gray100,
                          color:T.textSec, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                        <PiArrowCounterClockwiseBold size={14}/> Clear
                      </motion.button>
                    )}
                  </div>

                  {!from && !to && (
                    <p style={{ fontSize:11, color:T.muted, marginTop:12, display:'flex', alignItems:'center', gap:4 }}>
                      <PiNavigationArrowBold size={12}/> Tip: Click on the map to set points
                    </p>
                  )}
                </div>

                <div style={{ borderRadius:20, overflow:'hidden', border:`1px solid ${T.border}` }}>
                  <MapView markers={markers} route={route?.geometry} onMapClick={step === 0 ? handleMapClick : undefined} height="420px" zoom={14} center={from?.coords}/>
                </div>
              </div>
            )}

            {/* Step 1: Schedule */}
            {step === 1 && (
              <div style={{ maxWidth: 580, margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: T.surface, borderRadius: 24, padding: '32px', border: `1px solid ${T.border}`, boxShadow: '0 12px 48px rgba(27,43,75,0.08)', position: 'relative', overflow: 'hidden' }}>
                  
                  {/* Decorative background elements */}
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: 'radial-gradient(circle, rgba(27,43,75,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, position: 'relative' }}>
                    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}
                      style={{ padding: 12, borderRadius: 16, background: 'rgba(27,43,75,0.1)', display: 'flex', boxShadow: '0 4px 12px rgba(27,43,75,0.1)' }}>
                      <PiCalendarBold size={24} color={T.navy} />
                    </motion.div>
                    <div>
                      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, fontFamily: FONT.heading }}>Schedule Your Ride</h2>
                      <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>Select departure date and time</p>
                    </div>
                  </div>

                  {/* Custom Date Selector */}
                  <div style={{ marginBottom: 32, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Date</label>
                      <span style={{ fontSize: 13, color: T.navy, fontWeight: 600 }}>
                        {date ? new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, margin: '0 -10px', padding: '0 10px' }} className="hide-scrollbar">
                      {[...Array(7)].map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        const dateStr = d.toISOString().split('T')[0];
                        const isSelected = date === dateStr;
                        const isToday = i === 0;
                        const isTomorrow = i === 1;
                        return (
                          <motion.button key={dateStr} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setDate(dateStr)}
                            style={{
                              flex: '0 0 auto', padding: '12px 16px', borderRadius: 16, cursor: 'pointer',
                              border: isSelected ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                              background: isSelected ? T.heroGrad : T.gray100,
                              color: isSelected ? 'white' : T.text,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                              boxShadow: isSelected ? T.shadow3 : 'none',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              minWidth: 70,
                            }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.8)' : T.textSec, textTransform: 'uppercase' }}>
                              {isToday ? 'Today' : isTomorrow ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: FONT.heading }}>{d.getDate()}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Time Selector */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Select Time
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10, marginBottom: 16 }}>
                      {['08:00', '10:00', '12:00', '14:00', '17:00', '19:00'].map((t) => {
                        const isSelected = time === t;
                        return (
                          <motion.button key={t} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setTime(t)}
                            style={{
                              padding: '10px 0', borderRadius: 12, cursor: 'pointer',
                              border: isSelected ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                              background: isSelected ? T.heroGrad : T.surface,
                              color: isSelected ? 'white' : T.textSec,
                              fontWeight: 700, fontSize: 14, fontFamily: FONT.heading,
                              boxShadow: isSelected ? T.shadow2 : 'none',
                              transition: 'all 0.2s',
                            }}>
                            {t}
                          </motion.button>
                        );
                      })}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                      <div style={{ flex: 1, height: 1, background: T.border }} />
                      <span style={{ fontSize: 12, color: T.muted, fontWeight: 600, textTransform: 'uppercase' }}>OR CUSTOM TIME</span>
                      <div style={{ flex: 1, height: 1, background: T.border }} />
                    </div>

                    <div style={{ marginTop: 16, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <PiClockBold size={20} color={time ? T.navy : T.muted} />
                      </div>
                      <input type="time" value={time} onChange={e => setTime(e.target.value)}
                        style={{
                          width: '100%', padding: '16px 16px 16px 48px', borderRadius: 16,
                          border: `2px solid ${time ? T.navy : T.border}`,
                          background: time ? T.navy50 : T.gray100, color: T.text, fontSize: 16, fontWeight: 700,
                          outline: 'none', fontFamily: FONT.heading, transition: 'all 0.3s', cursor: 'pointer',
                          boxShadow: time ? `0 4px 16px ${T.navy}15` : 'none',
                        }} />
                    </div>
                  </div>

                  {/* Interactive Preview */}
                  <AnimatePresence>
                    {date && time && (
                      <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{
                          marginTop: 28, padding: '20px 24px', borderRadius: 20,
                          background: T.heroGrad, color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          boxShadow: '0 12px 32px rgba(27,43,75,0.2)', position: 'relative', overflow: 'hidden'
                        }}>
                        <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
                          <PiCarBold size={120} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 2 }}>
                          <motion.div initial={{ rotate: -90 }} animate={{ rotate: 0 }} transition={{ delay: 0.2, type: "spring" }}
                            style={{ padding: 12, borderRadius: 14, background: 'rgba(27,43,75,0.08)', display: 'flex', backdropFilter: 'blur(10px)' }}>
                            <PiClockBold size={24} color={T.green} />
                          </motion.div>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Departure Confirmed</p>
                            <p style={{ fontSize: 18, fontWeight: 800, fontFamily: FONT.heading }}>
                              {(() => { try { const d = new Date(`${date}T${time}`); return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); } catch { return `${date} at ${time}`; } })()}
                            </p>
                          </div>
                        </div>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} style={{ position: 'relative', zIndex: 2 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${T.green}60` }}>
                            <PiCheckBold size={20} color="white" />
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div style={{ maxWidth:520, margin:'0 auto', background:T.surface, borderRadius:20, padding:28, border:`1px solid ${T.border}`, boxShadow:'0 4px 16px rgba(27,43,75,0.04)' }}>
                <h2 style={{ fontSize:17, fontWeight:700, color:T.text, marginBottom:18, fontFamily:FONT.heading }}>Ride Details</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.textSec, marginBottom:10 }}>Seats Available</label>
                    <div style={{ display:'flex', gap:10 }}>
                      {[1,2,3,4].map(s => (
                        <motion.button key={s} whileTap={{ scale:0.9 }} onClick={() => setSeats(s)}
                          style={{
                            flex:1, padding:'16px 12px', borderRadius:14, border:`2px solid ${seats === s ? T.blue : T.border}`,
                            background: seats === s ? T.blue50 : T.gray100, fontSize:18, fontWeight:800, cursor:'pointer',
                            color: seats === s ? T.blue : T.muted, transition:'all 0.3s', fontFamily:FONT.heading,
                          }}>
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.textSec, marginBottom:6 }}>Price per Seat (₹)</label>
                    <div style={{ position:'relative' }}>
                      <PiCurrencyInrBold size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:T.muted }}/>
                      <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={1}
                        style={{ width:'100%', padding:'14px 16px 14px 42px', borderRadius:14, border:`1.5px solid ${T.border}`, background:T.gray100,
                          color:T.text, fontSize:14, outline:'none', fontFamily:'inherit', transition:'all 0.3s' }}/>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, maxWidth:800, margin:'0 auto' }}>
                <div style={{ background:T.surface, borderRadius:20, padding:24, border:`1px solid ${T.border}`, boxShadow:'0 4px 16px rgba(27,43,75,0.04)' }}>
                  <h2 style={{ fontSize:17, fontWeight:700, color:T.text, marginBottom:16, fontFamily:FONT.heading }}>Confirm Ride</h2>
                  <div style={{ padding:'16px 18px', borderRadius:14, background:T.gray100, display:'flex', flexDirection:'column', gap:12, fontSize:13 }}>
                    {[
                      { l:'From', v:from?.name },
                      { l:'To', v:to?.name },
                      ...(route && route.distance > 0 ? [{ l:'Distance', v:formatDistance(route.distance) }] : []),
                      { l:'When', v:`${date} at ${time}` },
                      { l:'Seats', v:String(seats) },
                      { l:'Price/Seat', v:`₹${price}`, accent:true },
                    ].map((r, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ color:T.muted }}>{r.l}</span>
                        <span style={{ fontWeight:600, color: r.accent ? T.blue : T.text, maxWidth:'55%', textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.v}</span>
                      </div>
                    ))}
                    <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12, display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontWeight:600, color:T.text }}>Total earnings</span>
                      <span style={{ fontWeight:800, color:T.green, fontSize:16, fontFamily:FONT.heading }}>₹{price * seats}</span>
                    </div>
                  </div>
                </div>
                <div style={{ borderRadius:20, overflow:'hidden', border:`1px solid ${T.border}` }}>
                  <MapView markers={markers} route={route?.geometry} height="300px" showLocateButton={false}/>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:28, maxWidth:800, margin:'28px auto 0' }}>
          <motion.button whileTap={{ scale:0.95 }}
            onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
            style={{
              padding:'12px 22px', borderRadius:12, border:`1px solid ${T.border}`, background:T.gray100,
              color: step === 0 ? T.muted : T.textSec, fontSize:14, fontWeight:600, cursor: step === 0 ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', gap:6, opacity: step === 0 ? 0.5 : 1,
            }}>
            <PiCaretLeftBold size={16}/> Back
          </motion.button>

          {step < 3 ? (
            <motion.button whileHover={{ scale: canNext ? 1.03 : 1 }} whileTap={{ scale: canNext ? 0.95 : 1 }}
              onClick={() => setStep(step + 1)} disabled={!canNext}
              style={{
                padding:'12px 28px', borderRadius:12, border:'none',
                background: canNext ? `linear-gradient(135deg, ${T.blue}, ${T.blue})` : T.gray200,
                color: canNext ? 'white' : T.muted, fontSize:14, fontWeight:700, cursor: canNext ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center', gap:6, boxShadow: canNext ? '0 6px 16px rgba(27,43,75,0.2)' : 'none',
              }}>
              Next <PiCaretRightBold size={16}/>
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale:1.03, boxShadow:'0 12px 28px rgba(27,43,75,0.25)' }} whileTap={{ scale:0.95 }}
              onClick={handleSubmit} disabled={submitting}
              style={{
                padding:'12px 28px', borderRadius:12, border:'none',
                background:`linear-gradient(135deg, ${T.blue}, ${T.blue})`,
                color:'white', fontSize:14, fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center', gap:8, boxShadow:'0 6px 16px rgba(27,43,75,0.2)',
                opacity: submitting ? 0.7 : 1,
              }}>
              {submitting ? (
                <><div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}><PiSpinnerBold size={16}/></div> Creating...</>
              ) : (
                <>Create Ride <PiCheckBold size={16}/></>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
