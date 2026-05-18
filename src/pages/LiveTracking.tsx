import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PiArrowLeftBold, PiWarningBold, PiPhoneBold, PiChatCircleBold,
  PiNavigationArrowBold, PiClockBold, PiShieldCheckBold, PiSpinnerBold,
} from 'react-icons/pi';
import { MapView } from '../components/maps';
import type { MapMarker } from '../components/maps';
import { useAuthStore } from '../hooks/useStore';
import { useRealtimeLocation } from '../hooks/useRealtime';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { getRideById, createSOSAlert } from '../lib/api';
import { calculateRoute, formatDuration, formatDistance } from '../lib/maps';
import type { Ride } from '../types';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

export default function LiveTracking() {
  const { rideId } = useParams<{ rideId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [sosing, setSosing] = useState(false);
  const [eta, setEta] = useState<{ distance: number; duration: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  const realtimeLocation = useRealtimeLocation(rideId || '');
  const isDriver = ride?.driver_id === user?.id;
  useLocationTracking(rideId, user?.id, isDriver && ride?.status === 'in_progress');

  useEffect(() => {
    async function load() {
      if (!rideId) return;
      try { setRide(await getRideById(rideId)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [rideId]);

  const fromLat = ride?.from_location?.lat || 28.6139;
  const fromLng = ride?.from_location?.lng || 77.209;
  const toLat = ride?.to_location?.lat || 28.63;
  const toLng = ride?.to_location?.lng || 77.22;
  const driverLat = realtimeLocation?.lat || fromLat;
  const driverLng = realtimeLocation?.lng || fromLng;

  useEffect(() => {
    async function updateRoute() {
      try {
        const result = await calculateRoute([driverLat, driverLng], [toLat, toLng]);
        setRouteCoords(result.geometry);
        setEta({ distance: result.distance, duration: +result.duration });
      } catch {
        setRouteCoords([[driverLat, driverLng], [toLat, toLng]]);
      }
    }
    if (ride) updateRoute();
  }, [driverLat, driverLng, toLat, toLng, ride]);

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = [];
    m.push({ id: 'driver', position: [driverLat, driverLng], type: 'vehicle', vehicleType: 'car', popup: `${ride?.driver?.full_name || 'Driver'} — ${realtimeLocation ? 'Live' : 'Last known'}` });
    m.push({ id: 'pickup', position: [fromLat, fromLng], type: 'pickup', popup: `Pickup: ${ride?.from_location?.address || 'Start'}` });
    m.push({ id: 'drop', position: [toLat, toLng], type: 'drop', popup: `Drop: ${ride?.to_location?.address || 'Destination'}` });
    return m;
  }, [driverLat, driverLng, fromLat, fromLng, toLat, toLng, ride, realtimeLocation]);

  const handleSOS = async () => {
    if (!user || !rideId) return;
    setSosing(true);
    try {
      await createSOSAlert({ user_id: user.id, ride_id: rideId, location: { lat: driverLat, lng: driverLng }, message: 'Emergency SOS' });
    } catch { console.error('SOS failed'); }
    finally { setSosing(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
        <div style={{ animation:'spin-slow 0.8s linear infinite', color:T.navy, display:'flex' }}><PiSpinnerBold size={28}/></div>
        <p style={{ fontSize:13, color:T.muted }}>Loading ride...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'Inter', sans-serif" }}>
      <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
        {/* Header bar */}
        <div style={{
          padding:'10px 16px', background:'rgba(255,255,255,0.92)', backdropFilter:'blur(16px)',
          borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
        }}>
          <motion.button whileHover={{ x:-2 }} whileTap={{ scale:0.9 }}
            onClick={() => navigate(-1)}
            style={{ display:'flex', alignItems:'center', gap:6, color:T.textSec, fontSize:13, fontWeight:500, background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <PiArrowLeftBold size={16}/> Back
          </motion.button>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{
              width:8, height:8, borderRadius:'50%', background: realtimeLocation ? T.green : T.muted,
              boxShadow: realtimeLocation ? `0 0 8px ${T.green}80` : 'none',
            }}/>
            <span style={{
              padding:'4px 12px', borderRadius:8, fontSize:11, fontWeight:700,
              background: realtimeLocation ? T.greenLight : T.gray100,
              color: realtimeLocation ? T.green : T.muted,
            }}>
              {realtimeLocation ? 'Live Tracking' : 'Waiting for driver'}
            </span>
          </div>
          <motion.button whileTap={{ scale:0.9 }}
            onClick={() => navigate(`/chat/${rideId}`)}
            style={{ padding:'6px 14px', borderRadius:10, border:`1px solid ${T.border}`, background:T.gray100,
              color:T.textSec, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <PiChatCircleBold size={14}/> Chat
          </motion.button>
        </div>

        {/* Map (70%) */}
        <div style={{ flex:7, position:'relative', minHeight:0 }}>
          <AnimatePresence>
            {eta && realtimeLocation && (
              <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}
                style={{
                  position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', zIndex:1000,
                  padding:'8px 18px', borderRadius:12, background:'rgba(253,251,247,0.95)', backdropFilter:'blur(12px)',
                  border:`1px solid ${T.border}`, boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
                  display:'flex', alignItems:'center', gap:8, fontSize:13,
                }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:T.green, boxShadow:`0 0 6px ${T.green}80` }}/>
                <PiClockBold size={13} color={T.navy}/>
                <span style={{ fontWeight:600, color:T.text }}>Driver is {formatDuration(eta.duration)} away</span>
                <span style={{ color:T.muted }}>•</span>
                <span style={{ color:T.muted, fontSize:11 }}>{formatDistance(eta.distance)}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <MapView center={[driverLat, driverLng]} zoom={14} markers={markers} route={routeCoords} height="100%" fullscreen showLocateButton={false}/>
        </div>

        {/* Driver info panel (30%) */}
        <motion.div initial={{ y:50, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.2 }}
          style={{ flex:3, background:T.surface, borderTop:`1px solid ${T.border}`, overflowY:'auto' }}>
          <div style={{ padding:'16px 20px', maxWidth:640, margin:'0 auto' }}>
            {/* Driver info */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{
                width:52, height:52, borderRadius:14, background:'rgba(27,43,75,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0,
              }}>
                {ride?.driver?.profile_photo ? (
                  <img src={ride.driver.profile_photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                ) : (
                  <span style={{ fontSize:20, fontWeight:700, color:T.blue }}>{(ride?.driver?.full_name || 'D')[0]}</span>
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <h3 style={{ fontSize:17, fontWeight:700, color:T.text, fontFamily:FONT.heading, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {ride?.driver?.full_name || 'Driver'}
                </h3>
                <p style={{ fontSize:12, color:T.muted, display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                  <PiNavigationArrowBold size={11}/> Heading to your destination
                </p>
              </div>
              <span style={{
                padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700,
                background: realtimeLocation ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                color: realtimeLocation ? T.green : T.orange,
              }}>{realtimeLocation ? 'Online' : 'Offline'}</span>
            </div>

            {/* Route summary */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, background:T.gray100, marginBottom:14 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:T.green, boxShadow:`0 0 5px ${T.green}40` }}/>
                <div style={{ width:1, height:16, background:T.border }}/>
                <div style={{ width:8, height:8, borderRadius:'50%', background:T.red, boxShadow:`0 0 5px ${T.red}40` }}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ marginBottom:8 }}>
                  <p style={{ fontSize:10, fontWeight:700, color:T.muted, textTransform:'uppercase', letterSpacing:0.5 }}>PICKUP</p>
                  <p style={{ fontSize:13, color:T.text, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ride?.from_location?.address || 'Start'}</p>
                </div>
                <div>
                  <p style={{ fontSize:10, fontWeight:700, color:T.muted, textTransform:'uppercase', letterSpacing:0.5 }}>DROP</p>
                  <p style={{ fontSize:13, color:T.text, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ride?.to_location?.address || 'Destination'}</p>
                </div>
              </div>
              {eta && (
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontSize:18, fontWeight:800, color:T.navy, fontFamily:FONT.heading }}>{formatDuration(eta.duration)}</p>
                  <p style={{ fontSize:11, color:T.muted }}>{formatDistance(eta.distance)}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              <a href={`tel:${ride?.driver?.phone || ''}`} style={{ textDecoration:'none' }}>
                <motion.button whileTap={{ scale:0.9 }}
                  style={{ width:'100%', padding:'12px', borderRadius:12, border:`1px solid ${T.border}`, background:T.gray100,
                    color:T.textSec, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <PiPhoneBold size={16}/> Call
                </motion.button>
              </a>
              <motion.button whileTap={{ scale:0.9 }} onClick={() => navigate(`/chat/${rideId}`)}
                style={{ padding:'12px', borderRadius:12, border:`1px solid ${T.border}`, background:T.gray100,
                  color:T.textSec, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <PiChatCircleBold size={16}/> Message
              </motion.button>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.9 }} onClick={handleSOS} disabled={sosing}
                style={{
                  padding:'12px', borderRadius:12, border:'none',
                  background:`linear-gradient(135deg, ${T.red}, #EF4444)`, color:'white',
                  fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  boxShadow:'0 4px 12px rgba(244,63,94,0.3)', opacity: sosing ? 0.6 : 1,
                }}>
                {sosing ? <div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}><PiSpinnerBold size={16}/></div> : <PiWarningBold size={16}/>}
                SOS
              </motion.button>
            </div>

            {/* Speed */}
            {realtimeLocation && realtimeLocation.speed > 0 && (
              <div style={{ marginTop:10, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:11, color:T.muted }}>
                <PiShieldCheckBold size={12}/> Speed: {Math.round(realtimeLocation.speed * 3.6)} km/h
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
