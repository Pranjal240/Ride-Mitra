import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PiCalendarCheckBold, PiCarBold, PiClockBold, PiMapPinBold, PiXBold, PiArrowRightBold, PiMagnifyingGlassBold, PiNavigationArrowBold, PiCheckCircleBold, PiWarningCircleBold } from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { getBookings, updateBooking } from '../lib/api';
import type { Booking } from '../types';
import { format } from 'date-fns';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: T.greenLight, color: T.green, label: 'Confirmed' },
  pending: { bg: T.orangeLight, color: T.orange, label: 'Pending' },
  completed: { bg: T.blueLight, color: T.navy, label: 'Completed' },
  cancelled: { bg: T.redLight, color: T.red, label: 'Cancelled' },
};

export default function Bookings() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try { setBookings(await getBookings(user.id)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await updateBooking(id, { status: 'cancelled' });
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch (e) { console.error('Failed to cancel', e); }
    finally { setCancellingId(null); }
  };

  const filtered = bookings.filter((b) => {
    if (tab === 'upcoming') return b.status === 'pending' || b.status === 'confirmed';
    if (tab === 'completed') return b.status === 'completed';
    return b.status === 'cancelled';
  });

  const counts = {
    upcoming: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const tabs = [
    { key: 'upcoming' as const, label: 'Upcoming', count: counts.upcoming, icon: <PiClockBold size={14}/>, color: T.navy },
    { key: 'completed' as const, label: 'Completed', count: counts.completed, icon: <PiCheckCircleBold size={14}/>, color: T.green },
    { key: 'cancelled' as const, label: 'Cancelled', count: counts.cancelled, icon: <PiXBold size={14}/>, color: T.red },
  ];

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(180deg, ${T.bg}, ${T.gray100})`, fontFamily:"'Inter', sans-serif" }}>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 20px 48px' }}>
        {/* Header */}
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:28, fontWeight:800, color:T.text, fontFamily:FONT.heading, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ padding:8, borderRadius:12, background:`linear-gradient(135deg,${T.navy50},${T.gold50})`, display:'flex' }}>
              <PiCalendarCheckBold size={22} color={T.navy}/>
            </div>
            My Bookings
          </h1>
          <p style={{ fontSize:14, color:T.textSec, marginTop:4 }}>Track and manage your ride bookings</p>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="mobile-tab-bar"
          style={{ display:'flex', gap:8, marginBottom:24, padding:4, borderRadius:16, background:'rgba(255,255,255,0.6)', backdropFilter:'blur(10px)', border:`1px solid ${T.border}` }}>
          {tabs.map(t => (
            <motion.button key={t.key} whileTap={{ scale:0.97 }} onClick={() => setTab(t.key)}
              style={{
                flex:1, padding:'10px 14px', borderRadius:12, border:'none', cursor:'pointer',
                background: tab === t.key ? T.surface : 'transparent',
                boxShadow: tab === t.key ? '0 4px 12px rgba(27,43,75,0.08)' : 'none',
                color: tab === t.key ? t.color : T.muted, fontSize:13, fontWeight:600,
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}>
              {t.icon}
              {t.label}
              <span style={{
                padding:'1px 7px', borderRadius:8, fontSize:10, fontWeight:700,
                background: tab === t.key ? `${t.color}15` : T.gray100,
                color: tab === t.key ? t.color : T.muted,
              }}>{t.count}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background:T.surface, borderRadius:18, padding:22, border:`1px solid ${T.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                    <div style={{ height:12, width:80, background:T.gray200, borderRadius:6, animation:'pulse 1.5s infinite' }}/>
                    <div style={{ height:10, width:100, background:T.gray100, borderRadius:6, animation:'pulse 1.5s infinite' }}/>
                  </div>
                  <div style={{ height:10, width:'70%', background:T.gray100, borderRadius:6, marginBottom:8, animation:'pulse 1.5s infinite' }}/>
                  <div style={{ height:10, width:'50%', background:T.gray100, borderRadius:6, animation:'pulse 1.5s infinite' }}/>
                </div>
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
              style={{ background:T.surface, borderRadius:24, padding:'60px 24px', textAlign:'center', border:`1px solid ${T.border}`, boxShadow:'0 8px 24px rgba(0,0,0,0.04)' }}>
              <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(135deg,${T.navy50},${T.gold50})`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <PiCalendarCheckBold size={32} color={T.navy}/>
              </div>
              <h3 style={{ fontSize:18, fontWeight:700, color:T.text, fontFamily:FONT.heading }}>No {tab} bookings</h3>
              <p style={{ fontSize:13, color:T.textSec, marginTop:6, maxWidth:300, margin:'6px auto 20px' }}>
                {tab === 'upcoming' ? 'Start by finding a ride to book!' : `Your ${tab} bookings will appear here.`}
              </p>
              {tab === 'upcoming' && (
                <Link to="/rides/search" style={{ textDecoration:'none' }}>
                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    style={{ padding:'12px 28px', borderRadius:12, border:'none', background:`linear-gradient(135deg, ${T.blue}, ${T.blue})`,
                      color:'white', fontSize:14, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8,
                      boxShadow:'0 8px 20px rgba(27,43,75,0.25)' }}>
                    <PiMagnifyingGlassBold size={16}/> Find a Ride <PiArrowRightBold size={14}/>
                  </motion.button>
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {filtered.map((b, i) => {
                const sc = statusConfig[b.status] || statusConfig.pending;
                return (
                  <motion.div key={b.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:i * 0.04, type:'spring', stiffness:200 }}
                    whileHover={{ y:-3, boxShadow:'0 12px 32px rgba(27,43,75,0.08)' }}
                    style={{
                      background:`linear-gradient(145deg, ${T.surface}, ${T.gray100})`, borderRadius:18,
                      padding:20, border:`1px solid ${T.border}`, cursor:'default', transition:'all 0.3s',
                    }}>
                    {/* Top row */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <span style={{ padding:'4px 12px', borderRadius:8, fontSize:11, fontWeight:700, background:sc.bg, color:sc.color, textTransform:'uppercase', letterSpacing:0.5 }}>
                        {sc.label}
                      </span>
                      <span style={{ fontSize:12, color:T.muted, display:'flex', alignItems:'center', gap:4 }}>
                        <PiClockBold size={12}/> {format(new Date(b.created_at), 'MMM dd, h:mm a')}
                      </span>
                    </div>

                    {/* Route info */}
                    <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
                      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:T.green, flexShrink:0, boxShadow:`0 0 6px ${T.green}40` }}/>
                          <span style={{ fontSize:13, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {(b.ride as any)?.from_location?.address || 'Pickup location'}
                          </span>
                        </div>
                        <div style={{ width:1, height:8, background:T.border, marginLeft:3 }}/>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:T.red, flexShrink:0, boxShadow:`0 0 6px ${T.red}40` }}/>
                          <span style={{ fontSize:13, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {(b.ride as any)?.to_location?.address || 'Drop location'}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <p style={{ fontSize:20, fontWeight:800, color:T.navy, fontFamily:FONT.heading }}>₹{b.total_price}</p>
                        <p style={{ fontSize:11, color:T.muted }}>{b.seats_booked} seat{b.seats_booked !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <div style={{ display:'flex', gap:10, paddingTop:14, borderTop:`1px solid ${T.gray200}` }}>
                        {b.status === 'confirmed' && (
                          <Link to={`/tracking/${b.ride_id}`} style={{ flex:1, textDecoration:'none' }}>
                            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                              style={{ width:'100%', padding:'10px 16px', borderRadius:10, border:'none',
                                background:`linear-gradient(135deg, ${T.blue}, ${T.blue})`, color:'white', fontSize:13,
                                fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                                boxShadow:'0 4px 12px rgba(27,43,75,0.2)' }}>
                              <PiNavigationArrowBold size={14}/> Track Live
                            </motion.button>
                          </Link>
                        )}
                        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                          onClick={() => handleCancel(b.id)} disabled={cancellingId === b.id}
                          style={{
                            padding:'10px 16px', borderRadius:10, border:`1px solid ${T.red}30`,
                            background:T.redLight, color:T.red, fontSize:13, fontWeight:600,
                            cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                            opacity: cancellingId === b.id ? 0.6 : 1,
                          }}>
                          <PiXBold size={14}/> {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
