import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PiMagnifyingGlassBold, PiClockBold, PiCarBold, PiUsersBold, PiXBold, PiMapPinBold, PiStarBold, PiBookmarkSimpleBold, PiBookmarkSimpleFill } from 'react-icons/pi';
import { MapView, LocationSearch } from '../components/maps';
import type { MapMarker } from '../components/maps';
import { getRides, saveRoute } from '../lib/api';
import toast from 'react-hot-toast';
import { calculateRoute, reverseGeocode, getUserLocation, getDistance, formatDistance, formatDuration } from '../lib/maps';
import type { Ride } from '../types';
import { format } from 'date-fns';
import { useAuthStore } from '../hooks/useStore';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

const ROUTE_COLORS = [T.navy, T.green, T.red, T.orange, T.gold, T.navyLight];

interface RideWithRoute extends Ride {
  routeCoords?: [number, number][];
}

export default function RideSearch() {
  const [rides, setRides] = useState<RideWithRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
  const [toCoords, setToCoords] = useState<[number, number] | null>(null);
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [highlightedRide, setHighlightedRide] = useState<string | null>(null);
  const [searchRoute, setSearchRoute] = useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [activeInput, setActiveInput] = useState<'from' | 'to'>('from');
  const [autoLocating, setAutoLocating] = useState(false);

  // Calculate user's search route
  useEffect(() => {
    async function calcUserRoute() {
      if (fromCoords && toCoords) {
        try {
          const route = await calculateRoute(
            { lat: fromCoords[0], lng: fromCoords[1] },
            { lat: toCoords[0], lng: toCoords[1] }
          );
          setSearchRoute(route.geometry || null);
          const km = typeof route.distance === 'number' ? route.distance : getDistance(fromCoords, toCoords);
          const mins = typeof route.duration === 'number' ? route.duration : Math.max(1, Math.round(km * 2.4));
          setRouteInfo({ distanceKm: km, durationMin: mins });
        } catch {
          setSearchRoute(null);
          const km = getDistance(fromCoords, toCoords);
          setRouteInfo({ distanceKm: km, durationMin: Math.max(1, Math.round(km * 2.4)) });
        }
      } else {
        setSearchRoute(null);
        setRouteInfo(null);
      }
    }
    calcUserRoute();
  }, [fromCoords, toCoords]);

  const handleMapClick = async (latlng: { lat: number; lng: number }) => {
    const coords: [number, number] = [latlng.lat, latlng.lng];
    try {
      const address = await reverseGeocode(latlng.lat, latlng.lng);
      if (activeInput === 'from') {
        setFromCoords(coords);
        setFromName(address);
        setActiveInput('to');
      } else {
        setToCoords(coords);
        setToName(address);
        setActiveInput('from');
      }
    } catch {
      // Fallback if geocoding fails
      if (activeInput === 'from') {
        setFromCoords(coords);
        setFromName(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
        setActiveInput('to');
      } else {
        setToCoords(coords);
        setToName(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
        setActiveInput('from');
      }
    }
  };

  useEffect(() => {
    loadRides();
    
    // Auto location
    async function initLocation() {
      if (!fromCoords && !fromName) {
        setAutoLocating(true);
        try {
          const [lat, lng] = await getUserLocation();
          setFromCoords([lat, lng]);
          try {
            const address = await reverseGeocode(lat, lng);
            setFromName(address || 'Current Location');
          } catch {
            setFromName('Current Location');
          }
          setActiveInput('to'); // Auto-focus the To field
        } catch { /* ignore if denied */ }
        finally { setAutoLocating(false); }
      }
    }
    initLocation();
  }, []);

  const { user } = useAuthStore();
  const containerHeight = user ? 'calc(100vh - 64px)' : '100vh';

  async function loadRides() {
    setLoading(true);
    try {
      const data = await getRides({ status: 'active' });
      const ridesWithRoutes = await Promise.all(
        data.slice(0, 6).map(async (ride) => {
          if (ride.from_location && ride.to_location) {
            try {
              const route = await calculateRoute(ride.from_location, ride.to_location);
              return { ...ride, routeCoords: route.geometry };
            } catch { return ride; }
          }
          return ride;
        })
      );
      setRides([...ridesWithRoutes, ...data.slice(6)]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    return rides.filter((r) => {
      // Date filter
      let matchDate = true;
      if (dateFilter) matchDate = r.departure_time.startsWith(dateFilter);
      if (!matchDate) return false;

      // Distance filter: If user provided a location, ride must be within 10km radius
      let matchFrom = true;
      let matchTo = true;

      if (fromCoords && (fromCoords[0] !== 0 || fromCoords[1] !== 0) && r.from_location) {
        const d = getDistance(fromCoords, [r.from_location.lat, r.from_location.lng]);
        matchFrom = d <= 10;
      } else if (fromName) {
        // Fallback to text match if no valid coords
        matchFrom = (r.from_location?.address || '').toLowerCase().includes(fromName.toLowerCase());
      }

      if (toCoords && (toCoords[0] !== 0 || toCoords[1] !== 0) && r.to_location) {
        const d = getDistance(toCoords, [r.to_location.lat, r.to_location.lng]);
        matchTo = d <= 10;
      } else if (toName) {
        // Fallback to text match if no valid coords
        matchTo = (r.to_location?.address || '').toLowerCase().includes(toName.toLowerCase());
      }

      return matchFrom && matchTo;
    });
  }, [rides, fromCoords, toCoords, fromName, toName, dateFilter]);

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = [];
    
    // Only show ride markers if a ride is explicitly highlighted
    if (highlightedRide) {
      const ride = filtered.find((r) => r.id === highlightedRide);
      if (ride) {
        if (ride.from_location) {
          m.push({ id: `${ride.id}-from`, position: [ride.from_location.lat, ride.from_location.lng], type: 'pickup', popup: `${ride.driver?.full_name || 'Driver'} — Pickup` });
        }
        if (ride.to_location) {
          m.push({ id: `${ride.id}-to`, position: [ride.to_location.lat, ride.to_location.lng], type: 'drop', popup: `${ride.driver?.full_name || 'Driver'} — Drop` });
        }
      }
    } else {
      // If no ride is highlighted, just show the user's search pins
      if (fromCoords) m.push({ id: 'user-from', position: fromCoords, type: 'pickup', popup: 'Search Pickup' });
      if (toCoords) m.push({ id: 'user-to', position: toCoords, type: 'drop', popup: 'Search Dropoff' });
    }

    return m;
  }, [filtered, fromCoords, toCoords, highlightedRide]);

  const allRoutes = useMemo(() => {
    return filtered
      .filter((r) => r.routeCoords && r.routeCoords.length > 0)
      .map((r, idx) => ({ id: r.id, coords: r.routeCoords!, color: ROUTE_COLORS[idx % ROUTE_COLORS.length], highlighted: highlightedRide === r.id }));
  }, [filtered, highlightedRide]);

  const primaryRoute = useMemo(() => {
    // Priority 1: Show the specific ride's route if the user is hovering over it
    if (highlightedRide) {
      const found = allRoutes.find((r) => r.id === highlightedRide);
      if (found) return found.coords;
    }
    // Priority 2: Show the user's calculated A -> B route based on search inputs
    if (searchRoute) return searchRoute;
    
    // Do NOT show random rides if nothing is selected
    return undefined;
  }, [allRoutes, highlightedRide, searchRoute]);

  const hasFilters = fromName || toName || dateFilter;

  return (
    <div style={{
      minHeight:'100vh',
      background:'radial-gradient(ellipse at top, #152240 0%, #0A1128 60%, #050914 100%)',
      color:'white',
    }}>
      <div className="mobile-search-layout" style={{ display:'flex', height:containerHeight, overflow:'hidden', position:'relative' }}>
        {/* Sidebar */}
        <div className="mobile-search-sidebar" style={{
          width:440, minWidth:360, flexShrink:0, overflowY:'auto',
          background:'linear-gradient(180deg, rgba(21,34,64,0.6), rgba(10,17,40,0.6))',
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          borderRight:'1px solid rgba(255,255,255,0.08)',
          padding:'24px 20px', position:'relative', zIndex:2,
        }}>
          {/* Title */}
          <div style={{ marginBottom:22 }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:7,
              padding:'4px 12px', borderRadius:100,
              background:`${T.gold}22`, border:`1px solid ${T.gold}55`, marginBottom:10,
            }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:T.gold, boxShadow:`0 0 8px ${T.gold}` }} className="ring-pulse"/>
              <span style={{ fontSize:10, color:T.gold, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase' }}>
                Rider · JC Bose UST
              </span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:900, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.02em' }}>
              Find a <span style={{ background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Ride</span>
            </h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginTop:4 }}>Search live rides headed your way.</p>
          </div>

          {/* Search inputs */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
            <div onClick={() => setActiveInput('from')} style={{ borderRadius:12, border: activeInput === 'from' ? `2px solid ${T.navy}` : '2px solid transparent', transition:'all 0.2s' }}>
              <LocationSearch
                placeholder={autoLocating ? "Detecting GPS location..." : "From where? (or click map)"}
                icon="pickup"
                onLocationSelect={(loc) => { setFromCoords(loc.coordinates); setFromName(loc.name); setActiveInput('to'); }}
                value={fromName}
                disabled={autoLocating}
              />
            </div>
            <div onClick={() => setActiveInput('to')} style={{ borderRadius:12, border: activeInput === 'to' ? `2px solid ${T.navy}` : '2px solid transparent', transition:'all 0.2s' }}>
              <LocationSearch
                placeholder="To where? (or click map)"
                icon="drop"
                onLocationSelect={(loc) => { setToCoords(loc.coordinates); setToName(loc.name); }}
                value={toName}
              />
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={async () => {
                  setAutoLocating(true);
                  try {
                    const coords = await getUserLocation();
                    const address = await reverseGeocode(coords[0], coords[1]);
                    if (activeInput === 'to') { setToCoords(coords); setToName(address); setActiveInput('from'); }
                    else { setFromCoords(coords); setFromName(address); setActiveInput('to'); }
                  } catch {}
                  finally { setAutoLocating(false); }
                }}
                disabled={autoLocating}
                style={{
                  display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px',
                  borderRadius:100, border:`1px solid ${T.blue}44`,
                  background:`${T.blue}18`, color:T.blue,
                  fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  transition:'all 0.2s', opacity: autoLocating ? 0.6 : 1,
                }}>
                <PiMapPinBold size={12}/> {autoLocating ? 'Locating…' : `Use my location as ${activeInput === 'to' ? 'drop' : 'pickup'}`}
              </motion.button>
              {(fromCoords || toCoords) && (
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={() => { const fc = fromCoords, fn = fromName; setFromCoords(toCoords); setFromName(toName); setToCoords(fc); setToName(fn); }}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px',
                    borderRadius:100, border:'1px solid rgba(255,255,255,0.12)',
                    background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.75)',
                    fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  }}>
                  ⇅ Swap pickup ↔ drop
                </motion.button>
              )}
              <SaveRouteButton fromCoords={fromCoords} toCoords={toCoords} fromName={fromName} toName={toName} />
            </div>
          </div>

          {/* Route summary — shortest distance + ETA */}
          {routeInfo && (
            <motion.div
              initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
              style={{
                display:'flex', alignItems:'center', gap:12, padding:'14px 16px', marginBottom:18,
                borderRadius:16, border:`1px solid ${T.gold}55`,
                background:'linear-gradient(135deg, rgba(200,149,108,0.14), rgba(255,255,255,0.03))',
                backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              }}>
              <div style={{
                width:38, height:38, borderRadius:12,
                background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, color:'white',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 8px 20px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)`, flexShrink:0,
              }}>
                <PiMapPinBold size={16}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:1.5, fontWeight:700 }}>Shortest route</p>
                <p style={{ fontSize:15, fontWeight:900, color:'white', fontFamily:FONT.heading, marginTop:3, letterSpacing:'-0.01em' }}>
                  {formatDistance(routeInfo.distanceKm)} · <span style={{ background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{formatDuration(routeInfo.durationMin)}</span>
                </p>
              </div>
              <span style={{
                fontSize:10, fontWeight:800, letterSpacing:1, textTransform:'uppercase',
                padding:'3px 10px', borderRadius:100,
                background:`${T.green}22`, color:T.green, border:`1px solid ${T.green}55`,
              }}>Live</span>
            </motion.div>
          )}

          {/* Date Selector (Horizontal Scroll) */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Select Date</label>
              {hasFilters && (
                <motion.button whileTap={{ scale:0.9 }}
                  onClick={() => { setFromName(''); setToName(''); setDateFilter(''); setFromCoords(null); setToCoords(null); }}
                  style={{ fontSize:11, color:T.red, background:`${T.red}18`, border:`1px solid ${T.red}44`, borderRadius:100, padding:'4px 10px', cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                  <PiXBold size={11}/> Clear
                </motion.button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, margin: '0 -10px', padding: '0 10px' }} className="hide-scrollbar">
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                onClick={() => setDateFilter('')}
                style={{
                  flex: '0 0 auto', padding: '10px 16px', borderRadius: 14, cursor: 'pointer',
                  border: !dateFilter ? `1.5px solid ${T.gold}` : '1px solid rgba(255,255,255,0.1)',
                  background: !dateFilter ? `linear-gradient(135deg, ${T.gold}, ${T.goldDark})` : 'rgba(255,255,255,0.04)',
                  color: !dateFilter ? 'white' : 'rgba(255,255,255,0.75)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: !dateFilter ? `0 8px 20px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)` : 'none',
                  transition: 'all 0.2s', minWidth: 60, fontSize:13, fontWeight:800,
                }}>
                Any
              </motion.button>
              {[...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                const isSelected = dateFilter === dateStr;
                const isToday = i === 0;
                const isTomorrow = i === 1;
                return (
                  <motion.button key={dateStr} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setDateFilter(dateStr)}
                    style={{
                      flex: '0 0 auto', padding: '8px 14px', borderRadius: 14, cursor: 'pointer',
                      border: isSelected ? `1.5px solid ${T.gold}` : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? `linear-gradient(135deg, ${T.gold}, ${T.goldDark})` : 'rgba(255,255,255,0.04)',
                      color: isSelected ? 'white' : 'rgba(255,255,255,0.85)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      boxShadow: isSelected ? `0 8px 20px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)` : 'none',
                      transition: 'all 0.2s', minWidth: 60,
                    }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {isToday ? 'Today' : isTomorrow ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, fontFamily: FONT.heading }}>{d.getDate()}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Results count */}
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, marginBottom:12, letterSpacing:1.5, textTransform:'uppercase' }}>
            {loading ? 'Searching…' : `${filtered.length} ride${filtered.length !== 1 ? 's' : ''} found`}
          </p>

          {/* Ride cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} style={{
                  height:120, borderRadius:18,
                  background:'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                  backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite',
                  border:'1px solid rgba(255,255,255,0.06)',
                }}/>
              ))
            ) : filtered.length === 0 ? (
              <div style={{
                borderRadius:22, padding:'56px 24px', textAlign:'center',
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                position:'relative', overflow:'hidden',
              }}>
                <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:`radial-gradient(circle, ${T.gold}33, transparent 70%)`, filter:'blur(24px)' }}/>
                <div style={{
                  position:'relative', width:72, height:72, borderRadius:20,
                  background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                  display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px',
                  boxShadow:`0 12px 30px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
                }}>
                  <PiCarBold size={30} color="white"/>
                </div>
                <h3 style={{ fontSize:18, fontWeight:800, color:'white', fontFamily:FONT.heading, letterSpacing:'-0.01em' }}>No Rides Found</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginTop:6 }}>Try adjusting your search or check back later.</p>
              </div>
            ) : (
              filtered.map((ride, i) => (
                <motion.div key={ride.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  onMouseEnter={() => setHighlightedRide(ride.id)} onMouseLeave={() => setHighlightedRide(null)}>
                  <Link to={`/rides/${ride.id}`} style={{ textDecoration:'none' }}>
                    <motion.div whileHover={{ y:-4 }}
                      className="bento"
                      style={{
                        background: highlightedRide === ride.id
                          ? 'linear-gradient(135deg, rgba(200,149,108,0.14), rgba(255,255,255,0.04))'
                          : 'rgba(255,255,255,0.04)',
                        borderRadius:18, padding:18,
                        border: highlightedRide === ride.id ? `1.5px solid ${T.gold}66` : '1px solid rgba(255,255,255,0.08)',
                        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                        cursor:'pointer', transition:'all 0.3s',
                      }}>
                      {/* Driver row */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                        <div style={{
                          width:40, height:40, borderRadius:12, flexShrink:0,
                          background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'white', fontSize:14, fontWeight:800, fontFamily:FONT.heading,
                          boxShadow:`0 6px 14px ${T.gold}55`,
                        }}>
                          {(ride.driver?.full_name || 'D')[0]}
                        </div>
                        <div style={{ minWidth:0, flex:1 }}>
                          <p style={{ fontWeight:700, color:'white', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {ride.driver?.full_name || 'Driver'}
                          </p>
                          <p style={{ fontSize:11, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:4, marginTop:1 }}>
                            <PiClockBold size={10}/> {format(new Date(ride.departure_time), 'EEE, MMM dd · h:mm a')}
                          </p>
                        </div>
                        <span style={{
                          padding:'3px 10px', borderRadius:100, fontSize:10, fontWeight:800,
                          background:`${T.green}22`, color:T.green, border:`1px solid ${T.green}55`,
                          textTransform:'uppercase', letterSpacing:1,
                        }}>{ride.status}</span>
                      </div>

                      {/* Route */}
                      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:T.green, flexShrink:0, boxShadow:`0 0 6px ${T.green}` }}/>
                          <span style={{ color:'rgba(255,255,255,0.75)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ride.from_location?.address || 'Start'}</span>
                        </div>
                        <div style={{ width:1, height:10, background:'rgba(255,255,255,0.15)', marginLeft:3 }}/>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:T.gold, flexShrink:0, boxShadow:`0 0 6px ${T.gold}` }}/>
                          <span style={{ color:'rgba(255,255,255,0.75)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ride.to_location?.address || 'End'}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:4 }}>
                          <PiUsersBold size={12}/> {ride.seats_available} seat{ride.seats_available!==1?'s':''}
                        </span>
                        <span style={{
                          fontWeight:900, fontSize:16, fontFamily:FONT.heading,
                          background:`linear-gradient(135deg, ${T.gold}, #F5C99B)`,
                          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                        }}>
                          ₹{ride.price_per_seat}<span style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.5)', WebkitTextFillColor:'rgba(255,255,255,0.5)' }}>/seat</span>
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div className="mobile-search-map" style={{ flex:1, position:'relative' }}>
          <MapView
            markers={markers}
            route={primaryRoute}
            onMapClick={handleMapClick}
            height="100%"
            fullscreen
          />
        </div>
      </div>
    </div>
  );
}

function SaveRouteButton({ fromCoords, toCoords, fromName, toName }: { fromCoords: [number, number] | null; toCoords: [number, number] | null; fromName: string; toName: string }) {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const ready = user && fromCoords && toCoords && fromName && toName;
  if (!ready) return null;
  const doSave = async () => {
    if (!user || !fromCoords || !toCoords) return;
    setSaving(true);
    try {
      await saveRoute(
        user.id,
        { lat: fromCoords[0], lng: fromCoords[1], address: fromName },
        { lat: toCoords[0], lng: toCoords[1], address: toName },
        undefined,
      );
      setSaved(true);
      toast.success('Route saved');
    } catch (e: any) {
      toast.error(e.message || 'Could not save');
    } finally { setSaving(false); }
  };
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      disabled={saving || saved}
      onClick={doSave}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
        borderRadius: 100, border: `1px solid ${T.gold}66`,
        background: saved ? `${T.gold}30` : `${T.gold}18`,
        color: T.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>
      {saved ? <PiBookmarkSimpleFill size={12} /> : <PiBookmarkSimpleBold size={12} />}
      {saved ? 'Saved' : (saving ? 'Saving…' : 'Save route')}
    </motion.button>
  );
}
