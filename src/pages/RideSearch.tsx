import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PiMagnifyingGlassBold, PiClockBold, PiCarBold, PiUsersBold, PiXBold, PiMapPinBold, PiStarBold } from 'react-icons/pi';
import { MapView, LocationSearch } from '../components/maps';
import type { MapMarker } from '../components/maps';
import { getRides } from '../lib/api';
import { calculateRoute, reverseGeocode, getUserLocation, getDistance } from '../lib/maps';
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
        } catch { setSearchRoute(null); }
      } else {
        setSearchRoute(null);
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
    <div style={{ minHeight:'100vh', background:T.bg }}>
      <div className="mobile-search-layout" style={{ display:'flex', height:containerHeight, overflow:'hidden' }}>
        {/* Sidebar */}
        <div className="mobile-search-sidebar" style={{ width:440, minWidth:360, flexShrink:0, overflowY:'auto', background:`linear-gradient(180deg,${T.gray100},${T.gray100})`, borderRight:`1px solid ${T.border}`, padding:'24px 20px' }}>
          {/* Title */}
          <div style={{ marginBottom:20 }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:T.text, fontFamily:FONT.heading, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ padding:6, borderRadius:8, background:T.blue50, color:T.navy, display:'flex' }}><PiMagnifyingGlassBold size={16}/></div>
              Find a Ride
            </h1>
            <p style={{ fontSize:13, color:T.textSec, marginTop:4 }}>Search for rides headed your way</p>
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
          </div>

          {/* Date Selector (Horizontal Scroll) */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Date</label>
              {hasFilters && (
                <motion.button whileTap={{ scale:0.9 }}
                  onClick={() => { setFromName(''); setToName(''); setDateFilter(''); setFromCoords(null); setToCoords(null); }}
                  style={{ fontSize:12, color:T.red, background:'none', border:'none', cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                  <PiXBold size={12}/> Clear Filters
                </motion.button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, margin: '0 -10px', padding: '0 10px' }} className="hide-scrollbar">
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                onClick={() => setDateFilter('')}
                style={{
                  flex: '0 0 auto', padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
                  border: !dateFilter ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                  background: !dateFilter ? T.heroGrad : T.surface,
                  color: !dateFilter ? 'white' : T.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: !dateFilter ? T.shadow2 : 'none', transition: 'all 0.2s', minWidth: 60,
                  fontSize:13, fontWeight:700
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
                      flex: '0 0 auto', padding: '8px 12px', borderRadius: 12, cursor: 'pointer',
                      border: isSelected ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                      background: isSelected ? T.heroGrad : T.surface,
                      color: isSelected ? 'white' : T.text,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      boxShadow: isSelected ? T.shadow2 : 'none', transition: 'all 0.2s', minWidth: 60,
                    }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.8)' : T.textSec, textTransform: 'uppercase' }}>
                      {isToday ? 'Today' : isTomorrow ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, fontFamily: FONT.heading }}>{d.getDate()}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Results count */}
          <p style={{ fontSize:11, color:T.muted, fontWeight:600, marginBottom:12, letterSpacing:0.5, textTransform:'uppercase' }}>
            {loading ? 'Searching...' : `${filtered.length} ride${filtered.length !== 1 ? 's' : ''} found`}
          </p>

          {/* Ride cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} style={{ background:T.surface, borderRadius:16, padding:20, border:`1px solid ${T.border}` }}>
                  <div style={{ height:14, width:'50%', background:T.gray200, borderRadius:8, marginBottom:10, animation:'pulse 1.5s infinite' }}/>
                  <div style={{ height:10, width:'80%', background:T.gray100, borderRadius:6, marginBottom:6, animation:'pulse 1.5s infinite' }}/>
                  <div style={{ height:10, width:'60%', background:T.gray100, borderRadius:6, animation:'pulse 1.5s infinite' }}/>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{ background:T.surface, borderRadius:20, padding:'48px 20px', textAlign:'center', border:`1px solid ${T.border}` }}>
                <div style={{ width:60, height:60, borderRadius:16, background:`linear-gradient(135deg,${T.navy50},${T.gold50})`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <PiCarBold size={28} color={T.navy}/>
                </div>
                <h3 style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:FONT.heading }}>No Rides Found</h3>
                <p style={{ fontSize:13, color:T.textSec, marginTop:4 }}>Try adjusting your search or check back later.</p>
              </div>
            ) : (
              filtered.map((ride, i) => (
                <motion.div key={ride.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  onMouseEnter={() => setHighlightedRide(ride.id)} onMouseLeave={() => setHighlightedRide(null)}>
                  <Link to={`/rides/${ride.id}`} style={{ textDecoration:'none' }}>
                    <motion.div whileHover={{ y:-4, boxShadow:'0 12px 32px rgba(27,43,75,0.1)' }}
                      style={{ background: highlightedRide === ride.id ? `linear-gradient(145deg,#FFFFFF,${T.navy50})` : `linear-gradient(145deg,#FFFFFF,${T.gray100})`,
                        borderRadius:16, padding:18, border: highlightedRide === ride.id ? `1.5px solid ${T.blue}40` : `1px solid ${T.border}`,
                        cursor:'pointer', transition:'all 0.3s' }}>
                      {/* Driver row */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${T.navy50},${T.gold50})`,
                          display:'flex', alignItems:'center', justifyContent:'center', color:T.navy, fontSize:14, fontWeight:700, flexShrink:0 }}>
                          {(ride.driver?.full_name || 'D')[0]}
                        </div>
                        <div style={{ minWidth:0, flex:1 }}>
                          <p style={{ fontWeight:600, color:T.text, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {ride.driver?.full_name || 'Driver'}
                          </p>
                          <p style={{ fontSize:11, color:T.muted, display:'flex', alignItems:'center', gap:3 }}>
                            <PiClockBold size={10}/> {format(new Date(ride.departure_time), 'EEE, MMM dd • h:mm a')}
                          </p>
                        </div>
                        <span style={{ padding:'3px 10px', borderRadius:8, background:T.greenLight, color:T.green, fontSize:10, fontWeight:600 }}>{ride.status}</span>
                      </div>

                      {/* Route */}
                      <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:T.green, flexShrink:0, boxShadow:`0 0 5px ${T.green}40` }}/>
                          <span style={{ color:T.textSec, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ride.from_location?.address || 'Start'}</span>
                        </div>
                        <div style={{ width:1, height:8, background:T.border, marginLeft:3 }}/>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:T.red, flexShrink:0, boxShadow:`0 0 5px ${T.red}40` }}/>
                          <span style={{ color:T.textSec, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ride.to_location?.address || 'End'}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:10, borderTop:`1px solid ${T.border}` }}>
                        <span style={{ fontSize:11, color:T.muted, display:'flex', alignItems:'center', gap:4 }}>
                          <PiUsersBold size={12}/> {ride.seats_available} seat{ride.seats_available!==1?'s':''}
                        </span>
                        <span style={{ fontWeight:700, color:T.navy, fontSize:15, fontFamily:FONT.heading }}>
                          ₹{ride.price_per_seat}<span style={{ fontSize:11, fontWeight:400, color:T.muted }}>/seat</span>
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
