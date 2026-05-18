import { useEffect, useState, useCallback, useRef } from 'react';
import { PiCrosshairBold, PiSpinnerBold, PiWarningBold, PiMapPinBold } from 'react-icons/pi';
import { getUserLocation, saveLastLocation } from '../../lib/maps';
import T, { FONT } from '../../lib/theme';

/* ── Types ── */
export interface MapMarker {
  id: string;
  position: [number, number]; // [lat, lng]
  type: 'current' | 'pickup' | 'drop' | 'vehicle';
  vehicleType?: 'bike' | 'car';
  popup?: string;
  draggable?: boolean;
  onDragEnd?: (latlng: { lat: number; lng: number }) => void;
}

export interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  route?: [number, number][];
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
  height?: string;
  fullscreen?: boolean;
  showLocateButton?: boolean;
  className?: string;
}

const MAPPLS_REST_KEY = import.meta.env.VITE_MAPPLS_API_KEY;

/* ── Design tokens ── */
// Theme imported from shared file

/* ── Global map instance for eLoc resolution ── */
let globalMapInstance: any = null;
export function getMapInstance(): any { return globalMapInstance; }
export function setMapInstance(map: any) { globalMapInstance = map; }

/* ── SDK Loader with OAuth token ── */
let sdkLoaded = false;
let sdkLoading = false;
let sdkCallbacks: (() => void)[] = [];

export function loadMapplsSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).mappls && sdkLoaded) { resolve(); return; }
    if (sdkLoading) { sdkCallbacks.push(() => resolve()); return; }

    sdkLoading = true;
    const apiKey = MAPPLS_REST_KEY;
    if (!apiKey) { reject(new Error('VITE_MAPPLS_API_KEY missing')); return; }

    console.log('🗺️ Loading Mappls SDK with key:', apiKey.substring(0, 8) + '...');

    (window as any).initMapplsMap = () => {
      console.log('✅ Mappls SDK loaded via callback');
      sdkLoaded = true;
      sdkLoading = false;
      resolve();
      sdkCallbacks.forEach(cb => cb());
      sdkCallbacks = [];
    };

    const script = document.createElement('script');
    script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?v=3.0&callback=initMapplsMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => { sdkLoading = false; reject(new Error('Mappls script load failed')); };
    document.head.appendChild(script);

    const pluginScript = document.createElement('script');
    pluginScript.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk_plugins?v=3.0&libraries=search,places`;
    pluginScript.async = true;
    pluginScript.defer = true;
    document.head.appendChild(pluginScript);

    // Polling fallback
    setTimeout(() => {
      if (!sdkLoaded && (window as any).mappls) {
        console.log('✅ Mappls detected via polling fallback');
        sdkLoaded = true; sdkLoading = false;
        resolve();
        sdkCallbacks.forEach(cb => cb());
        sdkCallbacks = [];
      }
    }, 6000);
  });
}

/* ── Marker icon helpers ── */
function getMarkerHTML(type: MapMarker['type'], vehicleType?: string): string {
  switch (type) {
    case 'current':
      return `<div style="width:18px;height:18px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 12px rgba(27,43,75,0.5)"></div>`;
    case 'pickup':
      return `<div style="width:28px;height:28px;border-radius:8px;background:#14B8A6;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(20,184,166,0.35)">A</div>`;
    case 'drop':
      return `<div style="width:28px;height:28px;border-radius:8px;background:#F43F5E;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(244,63,94,0.35)">B</div>`;
    case 'vehicle':
      return `<div style="width:36px;height:36px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.15);font-size:20px">${vehicleType === 'bike' ? '🏍️' : '🚗'}</div>`;
    default:
      return `<div style="width:12px;height:12px;border-radius:50%;background:#6C3CE1;border:2px solid white;box-shadow:0 2px 8px rgba(27,43,75,0.3)"></div>`;
  }
}

/* ── Unique ID counter ── */
let mapIdCounter = 0;

/* ── Main Component ── */
export default function MapView({
  center,
  zoom = 13,
  markers = [],
  route,
  onMapClick,
  height = '500px',
  fullscreen = false,
  showLocateButton = true,
  className = '',
}: MapViewProps) {
  const [mapContainerId] = useState(() => `mappls-map-${++mapIdCounter}`);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCenter, setUserCenter] = useState<[number, number]>(center || [28.3670, 77.3240]);
  const [locationResolved, setLocationResolved] = useState(!!center);

  useEffect(() => {
    if (center) { setUserCenter(center); setLocationResolved(true); return; }
    getUserLocation().then(loc => { setUserCenter(loc); setLocationResolved(true); })
      .catch(() => setLocationResolved(true));
  }, [center]);

  // Re-center map when user location resolves
  useEffect(() => {
    if (mapInstanceRef.current && mapReady && locationResolved) {
      try {
        mapInstanceRef.current.setCenter({ lat: userCenter[0], lng: userCenter[1] });
        mapInstanceRef.current.setZoom(zoom || 14);
      } catch (e) { console.warn('Re-center error:', e); }
    }
  }, [userCenter, mapReady, locationResolved]);

  // Initialize map
  useEffect(() => {
    let mounted = true;

    async function initMap() {
      try {
        await loadMapplsSDK();
        if (!mounted) return;

        // Wait for DOM to be ready
        await new Promise(r => setTimeout(r, 100));
        const el = document.getElementById(mapContainerId);
        if (!el || !mounted) return;

        const mappls = (window as any).mappls;
        if (!mappls?.Map) throw new Error('Mappls SDK not available');

        const mapInstance = new mappls.Map(mapContainerId, {
          center: { lat: userCenter[0], lng: userCenter[1] },
          zoom: zoom || 14,
          zoomControl: true,
          location: true,
          search: false,
          clickableIcons: false, // Prevents native POI popups from swallowing clicks
        });

        const onLoad = () => {
          if (!mounted) return;
          mapInstanceRef.current = mapInstance;
          setMapInstance(mapInstance); // Store globally for eLoc resolution
          setMapReady(true);
          setLoading(false);

          // Try to restrict to India bounds (if supported)
          try { mapInstance.setMaxBounds?.([[67.0, 6.0], [97.5, 37.5]]); } catch {} // Mapbox format: [lng, lat]
          try { mapInstance.setMinZoom?.(5); } catch {}

          if (onMapClick) {
            try {
              mapInstance.addListener('click', (e: any) => {
                const ll = e?.lngLat || e?.latlng;
                if (ll) onMapClick({ lat: ll.lat, lng: ll.lng });
              });
            } catch {}
          }
        };

        // Bind load event with fallback
        try {
          mapInstance.addListener('load', onLoad);
        } catch {
          setTimeout(onLoad, 3000);
        }

        // Safety timeout — if load event never fires
        setTimeout(() => {
          if (mounted && !mapReady && mapInstance) {
            onLoad();
          }
        }, 8000);
      } catch (err) {
        if (!mounted) return;
        console.error('Map init error:', err);
        setError('Unable to load map. Please check your connection.');
        setLoading(false);
      }
    }

    initMap();

    return () => {
      mounted = false;
      markersRef.current.forEach(m => { try { m.remove?.(); } catch {} });
      markersRef.current = [];
      if (polylineRef.current) { try { polylineRef.current.remove?.(); } catch {} }
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove?.(); } catch {}
        mapInstanceRef.current = null;
      }
      setMapReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update center
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    try { mapInstanceRef.current.setCenter?.({ lat: userCenter[0], lng: userCenter[1] }); } catch {}
  }, [userCenter, mapReady]);

  // Update markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const mappls = (window as any).mappls;
    console.log('🔷 Updating markers:', markers.length, 'mappls available:', !!mappls);

    markersRef.current.forEach(m => { try { m.remove?.(); m.setMap?.(null); } catch {} });
    markersRef.current = [];

    markers.forEach(marker => {
      try {
        const htmlContent = getMarkerHTML(marker.type, marker.vehicleType);
        
        let mWidth = 28, mHeight = 28;
        if (marker.type === 'current') { mWidth = 18; mHeight = 18; }
        else if (marker.type === 'vehicle') { mWidth = 36; mHeight = 36; }
        
        console.log('📍 Adding marker:', marker.type, marker.position);
        const mapMarker = new mappls.Marker({
          map: mapInstanceRef.current,
          position: { lat: marker.position[0], lng: marker.position[1] },
          html: htmlContent,
          width: mWidth,
          height: mHeight,
          draggable: marker.draggable || false,
        });

        if (marker.popup) {
          try {
            const popup = new mappls.InfoWindow({
              content: `<div style="padding:8px 14px;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;color:#0F172A;max-width:200px">${marker.popup}</div>`,
            });
            mapMarker.addListener?.('click', () => popup.open(mapInstanceRef.current, mapMarker));
          } catch (e) { console.warn('Popup error:', e); }
        }

        if (marker.draggable && marker.onDragEnd) {
          try {
            mapMarker.addListener?.('dragend', () => {
              const pos = mapMarker.getPosition?.();
              if (pos) marker.onDragEnd?.({ lat: pos.lat, lng: pos.lng });
            });
          } catch {}
        }

        markersRef.current.push(mapMarker);
      } catch (err) {
        console.warn('Marker error:', err);
      }
    });

    // Fit bounds to show all markers
    if (markers.length >= 2) {
      try {
        const lats = markers.map(m => m.position[0]);
        const lngs = markers.map(m => m.position[1]);
        const sw = { lat: Math.min(...lats) - 0.01, lng: Math.min(...lngs) - 0.01 };
        const ne = { lat: Math.max(...lats) + 0.01, lng: Math.max(...lngs) + 0.01 };
        mapInstanceRef.current.fitBounds([[sw.lng, sw.lat], [ne.lng, ne.lat]], { padding: 80, maxZoom: 16 });
        console.log('📐 fitBounds:', sw, ne);
      } catch (e) { console.warn('fitBounds error:', e); }
    } else if (markers.length === 1) {
      try {
        if (mapInstanceRef.current.setCenter) {
          // Mapbox GL JS (underlying Mappls) strictly requires [longitude, latitude] array,
          // OR a {lat, lng} object. Passing [lat, lng] throws the map to Siberia, causing a grey screen!
          mapInstanceRef.current.setCenter({ lat: markers[0].position[0], lng: markers[0].position[1] });
          mapInstanceRef.current.setZoom(15);
        }
      } catch {}
    }
  }, [markers, mapReady]);

  // Update route polyline
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const mappls = (window as any).mappls;

    if (polylineRef.current) { try { polylineRef.current.remove?.(); polylineRef.current.setMap?.(null); } catch {} }
    polylineRef.current = null;

    if (route && route.length >= 2) {
      console.log('🛣️ Drawing route polyline with', route.length, 'points');
      try {
        const path = route.map(p => ({ lat: p[0], lng: p[1] }));
        polylineRef.current = new mappls.Polyline({
          map: mapInstanceRef.current,
          path,
          strokeColor: T.blue,
          strokeWeight: 5,
          strokeOpacity: 0.85,
          fitbounds: true,
          fitboundOptions: { padding: 80, maxZoom: 16 },
        });
        console.log('✅ Polyline drawn successfully');
      } catch (e) {
        console.warn('Polyline error:', e);
        // Fallback: draw as basic line using L.polyline if available
        try {
          const path = route.map(p => [p[0], p[1]]);
          polylineRef.current = (window as any).L?.polyline?.(path, {
            color: T.navy, weight: 5, opacity: 0.85,
          })?.addTo?.(mapInstanceRef.current);
        } catch {}
      }
    }
  }, [route, mapReady]);

  const handleLocate = useCallback(async () => {
    setLocating(true);
    try {
      const loc = await getUserLocation();
      saveLastLocation(loc);
      setUserCenter(loc);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.setCenter?.([loc[0], loc[1]]);
          mapInstanceRef.current.setZoom?.(15);
        } catch {}
      }
    } catch {}
    finally { setLocating(false); }
  }, []);

  /* ── Error state ── */
  if (error) {
    return (
      <div className={className}
        style={{ height, display:'flex', alignItems:'center', justifyContent:'center',
          background:T.bg, borderRadius: fullscreen ? 0 : 20, border:`1px solid ${T.border}` }}>
        <div style={{ textAlign:'center', padding:24 }}>
          <PiWarningBold size={32} style={{ color: T.red, marginBottom: 8 }} />
          <p style={{ fontSize:14, color:T.muted, fontWeight:500 }}>{error}</p>
          <button onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
            style={{ marginTop:12, padding:'10px 24px', borderRadius:12, border:'none',
              background:`linear-gradient(135deg,${T.blue},${T.green})`, color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}
      style={{ height, position:'relative', borderRadius: fullscreen ? 0 : 20, overflow:'hidden', border: `1px solid ${T.border}` }}>
      {loading && (
        <div style={{ position:'absolute', inset:0, zIndex:10, background:T.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <div style={{ position:'relative', width:64, height:64 }}>
              <div style={{ position:'absolute', inset:0, background:T.navyLight, borderRadius:'50%', animation:'pulse 1.5s infinite', opacity:0.5 }} />
              <div style={{ position:'absolute', inset:16, background:T.navy, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:T.shadow2, zIndex:2 }}>
                <PiMapPinBold size={20} color="white" />
              </div>
            </div>
            <p style={{ fontSize:14, color:T.navy, fontWeight:700, fontFamily:FONT.heading, letterSpacing:0.5 }}>Loading Map Engine</p>
          </div>
        </div>
      )}

      <div id={mapContainerId} style={{ width:'100%', height:'100%' }}/>

      {showLocateButton && mapReady && (
        <button onClick={handleLocate} title="Center on my location"
          style={{ position:'absolute', bottom:20, right:20, zIndex:20,
            width:42, height:42, borderRadius:12,
            background:'rgba(253,251,247,0.95)', backdropFilter:'blur(8px)',
            border:`1px solid ${T.border}`, boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            color:T.navy, transition:'all 0.3s' }}
          onMouseEnter={e => { e.currentTarget.style.background = T.blue50; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,251,247,0.95)'; }}>
          {locating ? (
            <div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}>
              <PiSpinnerBold size={18}/>
            </div>
          ) : (
            <PiCrosshairBold size={20}/>
          )}
        </button>
      )}
    </div>
  );
}
