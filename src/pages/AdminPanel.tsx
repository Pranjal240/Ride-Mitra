import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PiUsersBold, PiCarBold, PiCurrencyInrBold, PiShieldCheckBold, PiWarningBold, PiTrendUpBold } from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { getAdminStats, getActiveSOSAlerts, getPendingVerifications, resolveSOSAlert, updateVerificationStatus } from '../lib/api';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

interface StatCardProps { label: string; value: string | number; icon: React.ReactNode; bg: string; color: string; }
function StatCard({ label, value, icon, bg, color }: StatCardProps) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} whileHover={{ y:-4, boxShadow:'0 12px 28px rgba(27,43,75,0.08)' }}
      style={{ background:`linear-gradient(145deg, ${T.surface}, ${T.gray100})`, borderRadius:16, padding:'16px 14px', border:`1px solid ${T.border}`, transition:'all 0.3s', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>
          {icon}
        </div>
        <PiTrendUpBold size={14} color={T.muted}/>
      </div>
      <p style={{ fontSize:'clamp(18px, 4vw, 24px)', fontWeight:800, color:T.text, fontFamily:FONT.heading, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</p>
      <p style={{ fontSize:11, color:T.muted, marginTop:2 }}>{label}</p>
    </motion.div>
  );
}

export default function AdminPanel() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ totalUsers: 0, activeRides: 0, totalRevenue: 0, pendingVerifications: 0, activeAlerts: 0 });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, a, p] = await Promise.all([getAdminStats(), getActiveSOSAlerts(), getPendingVerifications()]);
        setStats(s); setAlerts(a); setPending(p);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleResolveAlert = async (id: string) => {
    if (!user) return;
    setProcessingId(id);
    try {
      await resolveSOSAlert(id, user.id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      setStats(s => ({ ...s, activeAlerts: s.activeAlerts - 1 }));
    } catch (e) {
      console.error(e);
      alert('Failed to resolve alert');
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    if (!user) return;
    setProcessingId(id);
    try {
      await updateVerificationStatus(id, status, user.id);
      setPending(prev => prev.filter(p => p.id !== id));
      setStats(s => ({ ...s, pendingVerifications: s.pendingVerifications - 1 }));
    } catch (e) {
      console.error(e);
      alert('Failed to update verification');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(180deg, ${T.bg}, ${T.gray100})`, fontFamily:"'Inter', sans-serif" }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px 48px' }}>
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:28, fontWeight:800, color:T.text, fontFamily:FONT.heading, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ padding:8, borderRadius:12, background:'rgba(27,43,75,0.1)', display:'flex' }}>
              <PiShieldCheckBold size={22} color={T.navy}/>
            </div>
            Admin Dashboard
          </h1>
          <p style={{ fontSize:14, color:T.textSec, marginTop:4 }}>Monitor and manage the Ride Mitra platform</p>
        </motion.div>

        {/* SOS Alert Banner */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {alerts.map(alert => (
              <motion.div key={alert.id} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                style={{ padding:'16px 20px', borderRadius:16, background:'rgba(255, 51, 102, 0.1)', border:'1.5px solid rgba(255, 51, 102, 0.4)',
                  display:'flex', alignItems:'center', justifyContent: 'space-between', gap:12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:T.redLight, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <PiWarningBold size={20} color={T.red}/>
                  </div>
                  <div>
                    <h3 style={{ fontSize:14, fontWeight:700, color:'#991B1B' }}>🚨 SOS Alert from {alert.user?.full_name || 'Unknown User'}</h3>
                    <p style={{ fontSize:12, color:'#DC2626' }}>{alert.location ? `Lat: ${alert.location.lat}, Lng: ${alert.location.lng}` : 'No location provided'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleResolveAlert(alert.id)}
                  disabled={processingId === alert.id}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#991B1B', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', opacity: processingId === alert.id ? 0.5 : 1 }}>
                  Resolve
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="mobile-stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:14, marginBottom:28 }}>
          {loading ? (
            [1,2,3,4].map(i => (
              <div key={i} style={{ background:T.surface, borderRadius:18, padding:22, border:`1px solid ${T.border}` }}>
                <div style={{ height:42, width:42, background:T.gray200, borderRadius:12, marginBottom:14, animation:'pulse 1.5s infinite' }}/>
                <div style={{ height:20, width:60, background:T.gray200, borderRadius:6, marginBottom:6, animation:'pulse 1.5s infinite' }}/>
                <div style={{ height:10, width:100, background:T.gray100, borderRadius:6, animation:'pulse 1.5s infinite' }}/>
              </div>
            ))
          ) : (
            <>
              <StatCard label="Total Users" value={stats.totalUsers} icon={<PiUsersBold size={22}/>} bg={T.navy50} color={T.navy}/>
              <StatCard label="Active Rides" value={stats.activeRides} icon={<PiCarBold size={22}/>} bg={T.greenLight} color={T.green}/>
              <StatCard label="Revenue" value={`₹${stats.totalRevenue}`} icon={<PiCurrencyInrBold size={22}/>} bg={T.orangeLight} color={T.orange}/>
              <StatCard label="Pending Verifications" value={stats.pendingVerifications} icon={<PiShieldCheckBold size={22}/>} bg={T.redLight} color={T.red}/>
            </>
          )}
        </div>

        {/* Two-column layout */}
        <div className="mobile-admin-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
          {/* Pending Verifications */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
            style={{ background:T.surface, borderRadius:20, padding:24, border:`1px solid ${T.border}`, boxShadow:'0 4px 16px rgba(27,43,75,0.04)' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:16, fontFamily:FONT.heading }}>Pending Verifications</h3>
            {pending.length === 0 ? (
              <p style={{ color:T.muted, fontSize:13, padding:'16px 0' }}>No pending verifications</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {pending.slice(0, 5).map((v: any) => (
                  <div key={v.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14, background:T.gray100 }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:T.blue50, display:'flex', alignItems:'center', justifyContent:'center',
                      color:T.navy, fontWeight:700, fontSize:14, flexShrink:0 }}>
                      {v.user?.full_name?.[0] || '?'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, color:T.text, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.user?.full_name || 'Unknown'}</p>
                      <p style={{ fontSize:11, color:T.muted }}>License: {v.license_number}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleVerify(v.id, 'verified')} disabled={processingId === v.id} style={{ padding:'4px 8px', borderRadius:6, background:T.green, color:'white', border:'none', fontSize:11, fontWeight:700, cursor:'pointer' }}>Verify</button>
                      <button onClick={() => handleVerify(v.id, 'rejected')} disabled={processingId === v.id} style={{ padding:'4px 8px', borderRadius:6, background:T.red, color:'white', border:'none', fontSize:11, fontWeight:700, cursor:'pointer' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Platform Overview */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
            style={{ background:T.surface, borderRadius:20, padding:24, border:`1px solid ${T.border}`, boxShadow:'0 4px 16px rgba(27,43,75,0.04)' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:16, fontFamily:FONT.heading }}>Platform Overview</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:14, background:'linear-gradient(135deg, #FEF2F2, #FFF1F2)' }}>
                <span style={{ fontSize:13, fontWeight:500, color:T.text }}>Active SOS Alerts</span>
                <span style={{ padding:'3px 12px', borderRadius:8, fontSize:12, fontWeight:700,
                  background: alerts.length > 0 ? T.redLight : T.greenLight,
                  color: alerts.length > 0 ? T.red : T.green }}>{alerts.length}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:14, background:T.gray100 }}>
                <span style={{ fontSize:13, fontWeight:500, color:T.text }}>Total Rides Today</span>
                <span style={{ padding:'3px 12px', borderRadius:8, fontSize:12, fontWeight:700, background:T.navy50, color:T.blue }}>{stats.activeRides}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:14, background:'linear-gradient(135deg, #D1FAE5, #ECFDF5)' }}>
                <span style={{ fontSize:13, fontWeight:500, color:T.text }}>Revenue Today</span>
                <span style={{ padding:'3px 12px', borderRadius:8, fontSize:12, fontWeight:700, background:T.greenLight, color:T.green }}>₹{stats.totalRevenue}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
