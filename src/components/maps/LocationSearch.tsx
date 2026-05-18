import { useState, useEffect, useRef, useCallback } from 'react';
import { PiMapPinBold, PiNavigationArrowBold, PiClockBold, PiXBold, PiSpinnerBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import {
  getUserLocation,
  reverseGeocode,
  getRecentSearches,
  addRecentSearch,
  resolveELocClientSide,
} from '../../lib/maps';
import type { GeoSearchResult } from '../../lib/maps';
import T, { FONT } from '../../lib/theme';

/* ── Location Search (Mappls Atlas REST API primary, Nominatim fallback) ── */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Progressive Nominatim geocoder — tries full address, then simplified fragments
async function nominatimResolve(query: string): Promise<[number, number] | null> {
  try {
    const params = new URLSearchParams({ q: query, format: 'json', countrycodes: 'in', limit: '1' });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'RideMitra/1.0', 'Accept-Language': 'en' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (lat >= 6 && lat <= 38 && lng >= 67 && lng <= 98) return [lat, lng];
      }
    }
  } catch { /* ignore */ }
  return null;
}

// Gemini AI geocoder — handles obscure POIs that Nominatim can't find
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
async function geminiGeocode(placeName: string, placeAddress: string): Promise<[number, number] | null> {
  if (!GEMINI_KEY) return null;
  try {
    const query = placeAddress ? `${placeName}, ${placeAddress}` : placeName;
    const prompt = `What are the GPS coordinates of "${query}" in India? Return ONLY JSON: {"lat":number,"lng":number}. No other text.`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 100 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    const lat = parseFloat(parsed.lat);
    const lng = parseFloat(parsed.lng);
    if (lat >= 6 && lat <= 38 && lng >= 67 && lng <= 98) {
      console.log(`✅ Gemini resolved: "${query}" → [${lat}, ${lng}]`);
      return [lat, lng];
    }
  } catch { /* Gemini failed */ }
  return null;
}

async function resolveELocCoords(eLoc: string, name: string, address: string): Promise<[number, number] | null> {
  if (!eLoc && !address && !name) return null;

  // Run proxy + client-side Nominatim in parallel for speed
  const proxyPromise = (async (): Promise<[number, number] | null> => {
    if (!SUPABASE_URL) return null;
    try {
      const url = `${SUPABASE_URL}/functions/v1/mappls-proxy?action=resolve&eloc=${encodeURIComponent(eLoc || '')}&name=${encodeURIComponent(name)}&address=${encodeURIComponent(address)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.resolved && data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          if (lat >= 6 && lat <= 38 && lng >= 67 && lng <= 98) return [lat, lng];
        }
      }
    } catch { /* proxy failed */ }
    return null;
  })();

  // Client-side: progressive Nominatim resolution
  const nominatimPromise = (async (): Promise<[number, number] | null> => {
    if (address) {
      const r = await nominatimResolve(address);
      if (r) { console.log(`✅ Nominatim full address: "${address}" → [${r[0]}, ${r[1]}]`); return r; }
    }
    if (address) {
      const parts = address.split(',').map(p => p.trim());
      for (let i = 1; i < Math.min(parts.length - 1, 4); i++) {
        const fragment = parts.slice(i).join(', ');
        const r = await nominatimResolve(fragment);
        if (r) { console.log(`✅ Nominatim fragment: "${fragment}" → [${r[0]}, ${r[1]}]`); return r; }
      }
    }
    if (name) {
      const r = await nominatimResolve(name + ' India');
      if (r) { console.log(`✅ Nominatim name: "${name}" → [${r[0]}, ${r[1]}]`); return r; }
    }
    return null;
  })();

  // Attempt 1: Mappls JS SDK (instant if loaded)
  const clientCoords = await resolveELocClientSide(eLoc || '', name);
  if (clientCoords) return clientCoords;

  // Attempt 2: Race between proxy (Nominatim+Gemini) and client-side Nominatim
  const results = await Promise.allSettled([proxyPromise, nominatimPromise]);
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) return r.value;
  }

  // Attempt 3: Direct client-side Gemini (if proxy also failed)
  const geminiResult = await geminiGeocode(name, address);
  if (geminiResult) return geminiResult;

  return null;
}

async function searchPlaces(query: string, userLat?: number, userLng?: number): Promise<GeoSearchResult[]> {
  const lat = userLat || 28.3670;
  const lng = userLng || 77.3240;

  // 1. PRIMARY: Mappls Atlas REST API via Supabase proxy (OAuth-authenticated, most accurate)
  //    This is how Uber/Ola/Rapido do it — server-side REST API, not browser JS plugins.
  if (SUPABASE_URL) {
    try {
      const proxyUrl = `${SUPABASE_URL}/functions/v1/mappls-proxy?query=${encodeURIComponent(query)}&location=${lat},${lng}&action=autosuggest`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const suggestions = data.suggestedLocations || [];
        
        if (suggestions.length > 0) {
          // Parse raw results safely
          const rawResults: GeoSearchResult[] = suggestions.map((item: any) => {
            const lat = parseFloat(item.latitude);
            const lng = parseFloat(item.longitude);
            return {
              name: item.placeName || 'Unknown',
              coordinates: [isNaN(lat) ? 0 : lat, isNaN(lng) ? 0 : lng] as [number, number],
              address: item.placeAddress || '',
              city: item.city || '',
              country: 'India',
              eLoc: item.eLoc || '',
            };
          });

          // Eagerly resolve any results with [0,0] coordinates via eLoc
          // Resolve top 4 in parallel for speed (most users click top results)
          const resolvePromises = rawResults.slice(0, 4).map(async (r) => {
            if (r.coordinates[0] === 0 && r.coordinates[1] === 0 && r.eLoc) {
              const coords = await resolveELocCoords(r.eLoc, r.name, r.address || '');
              if (coords) {
                r.coordinates = coords;
                console.log(`✅ Resolved eLoc ${r.eLoc} → [${coords[0]}, ${coords[1]}] for "${r.name}"`);
              }
            }
            return r;
          });

          const resolvedResults = await Promise.all(resolvePromises);
          
          // Add remaining unresolved results (items 5+) as-is
          const remaining = rawResults.slice(4);
          const allResults = [...resolvedResults, ...remaining];

          // Filter: only keep results with valid India coordinates OR valid eLoc (can still resolve on select)
          const filtered = allResults.filter((r) => {
            const [la, ln] = r.coordinates;
            if (la >= 6 && la <= 38 && ln >= 67 && ln <= 98) return true;
            if (la === 0 && ln === 0 && r.eLoc) return true; // Will resolve on select
            return false;
          });

          if (filtered.length > 0) {
            console.log(`✅ Mappls Atlas returned ${filtered.length} results for "${query}"`);
            return filtered;
          }
        }
      }
    } catch (e) {
      console.warn('Mappls Atlas proxy search failed, falling back to Nominatim:', e);
    }
  }

  // 2. FALLBACK: Nominatim (OpenStreetMap) — less accurate for Indian POIs but always available
  console.log(`🔄 Using Nominatim fallback for "${query}"`);
  return searchNominatim(query, lat, lng);
}


async function searchNominatim(
  query: string, userLat: number, userLng: number
): Promise<GeoSearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      countrycodes: 'in',
      limit: '8',
      addressdetails: '1'
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'RideMitra/1.0' }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data || [])
      .map((feat: any) => {
        const lat = parseFloat(feat.lat);
        const lng = parseFloat(feat.lon);
        if (lat < 6 || lat > 38 || lng < 67 || lng > 98) return null;
        
        return {
          name: feat.name || feat.display_name.split(',')[0],
          coordinates: [lat, lng] as [number, number],
          address: feat.display_name,
          city: feat.address?.city || feat.address?.town || feat.address?.county || '',
          country: 'India',
        };
      })
      .filter(Boolean) as GeoSearchResult[];
  } catch (e) {
    console.warn('Nominatim autocomplete error:', e);
    return [];
  }
}

/* ── Design tokens ── */
// Theme imported from shared file

export interface LocationSearchProps {
  placeholder?: string;
  onLocationSelect: (location: { name: string; coordinates: [number, number]; eLoc?: string }) => void;
  value?: string;
  icon?: 'pickup' | 'drop' | 'default';
  label?: string;
  disabled?: boolean;
}

export default function LocationSearch({
  placeholder = 'Search location...',
  onLocationSelect,
  value = '',
  icon = 'default',
  label,
  disabled = false,
}: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getUserLocation().then(c => setUserCoords(c)).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setQuery(value); }, [value]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setResults([]);
      setShowDropdown(value.length > 0 || focused);
      return;
    }
    setShowDropdown(true);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchPlaces(value, userCoords?.[0], userCoords?.[1]);
        setResults(data);
      } catch (err) {
        console.error('Location search failed:', err);
        setResults([]);
      } finally { setLoading(false); }
    }, 300);
  }, [focused, userCoords]);

  const handleSelectResult = async (result: GeoSearchResult) => {
    setQuery(result.name);
    setShowDropdown(false);
    setResults([]);
    setFocused(false);
    
    let finalCoords = result.coordinates;

    // If coordinates are 0,0, resolve via our multi-strategy resolver
    if (finalCoords[0] === 0 && finalCoords[1] === 0) {
      setLoading(true);
      
      const resolved = await resolveELocCoords(result.eLoc || '', result.name, result.address || '');
      if (resolved) {
        finalCoords = resolved;
        console.log(`✅ Resolved on select: [${resolved[0]}, ${resolved[1]}] for "${result.name}"`);
      }
      
      setLoading(false);
    }
    
    // If still 0,0, proceed anyway — RideSearch will fallback to text-based filtering
    if (finalCoords[0] === 0 && finalCoords[1] === 0) {
      console.warn('⚠️ Could not resolve GPS coords for:', result.name, '- using text-based filtering');
    }

    addRecentSearch({ name: result.name, coordinates: finalCoords, eLoc: result.eLoc });
    onLocationSelect({ name: result.name, coordinates: finalCoords, eLoc: result.eLoc });
  };

  const handleUseCurrentLocation = async () => {
    setLocatingCurrent(true);
    try {
      const coords = await getUserLocation();
      setUserCoords(coords);
      const address = await reverseGeocode(coords[0], coords[1]);
      setQuery(address);
      setShowDropdown(false);
      addRecentSearch({ name: address, coordinates: coords });
      onLocationSelect({ name: address, coordinates: coords });
    } catch { console.error('Failed to get current location'); }
    finally { setLocatingCurrent(false); }
  };

  const handleClear = () => {
    setQuery(''); setResults([]); setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setFocused(true);
    if (query.length >= 2 && results.length > 0) setShowDropdown(true);
    else if (query.length === 0) setShowDropdown(true);
  };

  const dotColor = icon === 'pickup' ? T.green : icon === 'drop' ? T.red : T.blue;
  const recentSearches = getRecentSearches();

  return (
    <div style={{ position:'relative', width:'100%' }} ref={containerRef}>
      {label && (
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:T.text, marginBottom:6 }}>{label}</label>
      )}
      <div style={{ position:'relative' }}>
        {/* Dot / Icon */}
        <div style={{
          position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', zIndex:2,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {icon === 'default' ? (
            <PiMapPinBold size={16} color={focused ? T.blue : T.muted}/>
          ) : (
            <div style={{ width:10, height:10, borderRadius:'50%', background:dotColor, boxShadow:`0 0 8px ${dotColor}40`, transition:'all 0.3s' }}/>
          )}
        </div>

        {/* Input */}
        <input ref={inputRef} type="text" value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={handleFocus} placeholder={placeholder} disabled={disabled}
          style={{
            width:'100%', padding:'14px 42px 14px 38px', borderRadius:14,
            border:`1.5px solid ${focused ? T.blue : T.border}`,
            background: focused ? T.surface : T.gray100,
            color:T.text, fontSize:14, outline:'none', fontFamily:"'Inter', sans-serif",
            transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: focused ? `0 0 0 3px rgba(27,43,75,0.08), 0 4px 16px rgba(27,43,75,0.06)` : '0 1px 3px rgba(0,0,0,0.04)',
            opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text',
          }}/>

        {/* Right side */}
        <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center' }}>
          {loading ? (
            <div style={{ animation:'spin-slow 0.8s linear infinite', color:T.navy, display:'flex' }}><PiSpinnerBold size={16}/></div>
          ) : query.length > 0 ? (
            <button onClick={handleClear} aria-label="Clear" style={{
              padding:4, borderRadius:8, border:'none', background:'transparent', cursor:'pointer',
              color:T.muted, transition:'all 0.2s', display:'flex',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=T.redLight;e.currentTarget.style.color=T.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.muted;}}>
              <PiXBold size={14}/>
            </button>
          ) : (
            <PiMagnifyingGlassBold size={14} color={T.muted}/>
          )}
        </div>
      </div>

      {/* ── Dropdown ── */}
      {showDropdown && !disabled && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:60,
          background:T.surface, borderRadius:16, border:`1px solid ${T.border}`,
          boxShadow:'0 16px 48px rgba(15,23,42,0.12), 0 4px 12px rgba(27,43,75,0.06)',
          maxHeight:340, overflowY:'auto', overflowX:'hidden',
          animation:'slideDown 0.2s ease',
        }}>
          {/* Current location */}
          <button onClick={handleUseCurrentLocation} disabled={locatingCurrent} style={{
            width:'100%', textAlign:'left', padding:'14px 16px', border:'none', background:'none',
            cursor:'pointer', display:'flex', alignItems:'center', gap:10, fontSize:14, fontWeight:500,
            color:T.navy, borderBottom:`1px solid ${T.gray200}`, transition:'background 0.2s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${T.navy50}20`;}}
          onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
            <div style={{ width:32, height:32, borderRadius:10, background:T.blue50, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {locatingCurrent
                ? <div style={{ animation:'spin-slow 0.8s linear infinite', display:'flex' }}><PiSpinnerBold size={16} color={T.navy}/></div>
                : <PiNavigationArrowBold size={16} color={T.navy}/>}
            </div>
            <div>
              <span style={{ fontWeight:600 }}>{locatingCurrent ? 'Getting location...' : 'Use current location'}</span>
              <p style={{ fontSize:11, color:T.muted, marginTop:1 }}>Auto-detect via GPS</p>
            </div>
          </button>

          {/* Loading */}
          {loading && (
            <div style={{ padding:'18px 16px', textAlign:'center', color:T.muted, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <div style={{ animation:'spin-slow 0.8s linear infinite', display:'flex' }}><PiSpinnerBold size={14}/></div>
              Searching nearby places...
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && results.map((result, idx) => (
            <button key={`r-${idx}`} onClick={() => handleSelectResult(result)} style={{
              width:'100%', textAlign:'left', padding:'12px 16px', border:'none', background:'none',
              cursor:'pointer', display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:T.text,
              transition:'background 0.15s', borderBottom: idx < results.length - 1 ? `1px solid ${T.gray100}` : 'none',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=T.gray100;}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
              <div style={{ width:28, height:28, borderRadius:8, background:T.gray200, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                <PiMapPinBold size={14} color={T.textSec}/>
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13 }}>{result.name}</p>
                {(result.city || result.address) && (
                  <p style={{ fontSize:11, color:T.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>
                    {result.city || result.address}
                  </p>
                )}
              </div>
            </button>
          ))}

          {/* No results */}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div style={{ padding:'24px 16px', textAlign:'center', color:T.muted, fontSize:13 }}>
              <PiMagnifyingGlassBold size={24} style={{ marginBottom:8, opacity:0.3, display:'inline-block' }}/>
              <p style={{ fontWeight:500 }}>No places found for "{query}"</p>
              <p style={{ fontSize:11, marginTop:4 }}>Try a different or more specific name</p>
            </div>
          )}

          {/* Recent searches */}
          {!loading && query.length === 0 && recentSearches.length > 0 && (
            <>
              <div style={{ padding:'8px 16px', fontSize:10, fontWeight:700, color:T.muted, textTransform:'uppercase', letterSpacing:1, background:T.gray100 }}>
                Recent Searches
              </div>
              {recentSearches.map((search, idx) => (
                <button key={`rec-${idx}`}
                  onClick={() => handleSelectResult({ name: search.name, coordinates: search.coordinates, address: search.name, eLoc: search.eLoc })}
                  style={{
                    width:'100%', textAlign:'left', padding:'10px 16px', border:'none', background:'none',
                    cursor:'pointer', display:'flex', alignItems:'center', gap:10, fontSize:13, color:T.textSec,
                    transition:'background 0.15s',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background=T.gray100;}}
                  onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
                  <PiClockBold size={14} color={T.muted}/>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{search.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
