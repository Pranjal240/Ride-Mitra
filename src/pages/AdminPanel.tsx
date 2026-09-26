import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PiUsersBold, PiCarBold, PiCurrencyInrBold, PiShieldCheckBold, PiWarningBold,
  PiTrendUpBold, PiChatCircleTextBold, PiFlagBold, PiClipboardTextBold,
  PiMegaphoneBold, PiCheckCircleBold, PiXCircleBold, PiMagnifyingGlassBold,
  PiPlusCircleBold, PiListChecksBold, PiSirenBold, PiPaperPlaneRightBold,
  PiIdentificationCardBold, PiClockCounterClockwiseBold,
} from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import {
  getAdminAnalytics, getActiveSOSAlerts, getPendingVerifications,
  resolveSOSAlert, updateVerificationStatus, searchUsers,
  getAllRidesAdmin, forceCancelRide, getOpenReports, resolveReport,
  getAnnouncements, createAnnouncement, deactivateAnnouncement,
  getSupportThreads, replySupport, markSupportRead, getAdminLogs,
  banUser, unbanUser, getBannedUsers,
  type AdminAnalytics, type Announcement,
} from '../lib/api';
import T, { FONT } from '../lib/theme';
import { ImpactChart } from '../components/common/GlobalUI';
import {
  TiltCard, Reveal, RadialProgress, AnimatedCounter, Spotlight,
  RippleButton,
} from '../components/common/Interactive3D';
import { format, formatDistanceToNow } from 'date-fns';

/* ─── Tab pill row ─── */
type TabKey =
  | 'overview' | 'users' | 'drivers' | 'rides' | 'alerts'
  | 'reports' | 'support' | 'announcements' | 'audit';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <PiTrendUpBold size={14} /> },
  { key: 'users', label: 'Users', icon: <PiUsersBold size={14} /> },
  { key: 'drivers', label: 'Drivers', icon: <PiIdentificationCardBold size={14} /> },
  { key: 'rides', label: 'Rides', icon: <PiCarBold size={14} /> },
  { key: 'alerts', label: 'SOS', icon: <PiSirenBold size={14} /> },
  { key: 'reports', label: 'Reports', icon: <PiFlagBold size={14} /> },
  { key: 'support', label: 'Support', icon: <PiChatCircleTextBold size={14} /> },
  { key: 'announcements', label: 'Announce', icon: <PiMegaphoneBold size={14} /> },
  { key: 'audit', label: 'Audit', icon: <PiClipboardTextBold size={14} /> },
];

/* ═══════════ MAIN ═══════════ */
export default function AdminPanel() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('overview');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const a = await getAdminAnalytics();
      if (a) setAnalytics(a);
    } finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #152240 0%, #0A1128 60%, #050914 100%)',
      color: 'white', fontFamily: FONT.body, position: 'relative',
    }}>
      {/* Hero */}
      <div style={{
        background: 'radial-gradient(ellipse at top, #152240 0%, #0A1128 60%, #050914 100%)',
        padding: '40px 24px 60px', position: 'relative', overflow: 'hidden',
      }}>
        <div className="aurora-wrap">
          <div className="aurora-blob aurora-1" />
          <div className="aurora-blob aurora-2" />
          <div className="noise-overlay" />
        </div>
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px 12px', borderRadius: 100,
              background: `${T.red}22`, border: `1px solid ${T.red}55`, marginBottom: 14,
            }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.red, boxShadow: `0 0 8px ${T.red}` }} className="ring-pulse" />
            <span style={{ fontSize: 11, color: '#F5A5A5', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Admin Console · JC Bose UST
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: 'white',
              fontFamily: FONT.heading, letterSpacing: '-0.03em', lineHeight: 1.05,
            }}>
            Command<span className="text-gradient-gold"> Center.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
            Live safety monitoring, driver verification, and platform operations.
          </motion.p>

          {/* Tab row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 22 }}>
            <div className="tab-pills h-scroll" style={{ maxWidth: '100%', overflowX: 'auto' }}>
              {TABS.map(t => (
                <button key={t.key} className={`tab-pill ${tab === t.key ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {t.icon}{t.label}
                  {t.key === 'alerts' && analytics && analytics.kpi.active_alerts > 0 && (
                    <span style={{ marginLeft: 4, background: T.red, color: 'white', borderRadius: 100, padding: '1px 6px', fontSize: 9, fontWeight: 900 }}>
                      {analytics.kpi.active_alerts}
                    </span>
                  )}
                  {t.key === 'drivers' && analytics && analytics.kpi.pending_verifications > 0 && (
                    <span style={{ marginLeft: 4, background: T.orange, color: 'white', borderRadius: 100, padding: '1px 6px', fontSize: 9, fontWeight: 900 }}>
                      {analytics.kpi.pending_verifications}
                    </span>
                  )}
                  {t.key === 'reports' && analytics && analytics.kpi.open_reports > 0 && (
                    <span style={{ marginLeft: 4, background: T.red, color: 'white', borderRadius: 100, padding: '1px 6px', fontSize: 9, fontWeight: 900 }}>
                      {analytics.kpi.open_reports}
                    </span>
                  )}
                  {t.key === 'support' && analytics && analytics.kpi.open_support > 0 && (
                    <span style={{ marginLeft: 4, background: T.blue, color: 'white', borderRadius: 100, padding: '1px 6px', fontSize: 9, fontWeight: 900 }}>
                      {analytics.kpi.open_support}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, margin: '-28px auto 0', padding: '0 20px 60px', position: 'relative', zIndex: 3 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
            {tab === 'overview' && <OverviewTab loading={loading} data={analytics} />}
            {tab === 'users' && <UsersTab admin={user?.id || ''} onChange={refresh} />}
            {tab === 'drivers' && <DriversTab admin={user?.id || ''} onChange={refresh} />}
            {tab === 'rides' && <RidesTab admin={user?.id || ''} />}
            {tab === 'alerts' && <AlertsTab admin={user?.id || ''} onChange={refresh} />}
            {tab === 'reports' && <ReportsTab admin={user?.id || ''} onChange={refresh} />}
            {tab === 'support' && <SupportTab admin={user?.id || ''} />}
            {tab === 'announcements' && <AnnouncementsTab admin={user?.id || ''} />}
            {tab === 'audit' && <AuditTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  OVERVIEW
 * ──────────────────────────────────────────────────────────── */
function StatTile({ icon, label, value, color, format: fmt }: { icon: React.ReactNode; label: string; value: number; color: string; format?: (n: number) => string }) {
  return (
    <Reveal>
      <TiltCard max={7} radius={20} style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: 18, height: '100%',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${color}, ${color}aa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: `0 8px 20px ${color}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}>{icon}</div>
        </div>
        <p style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 900, color: 'white', fontFamily: FONT.heading, letterSpacing: '-0.02em' }}>
          <AnimatedCounter value={value} format={fmt} />
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>{label}</p>
      </TiltCard>
    </Reveal>
  );
}

function OverviewTab({ loading, data }: { loading: boolean; data: AdminAnalytics | null }) {
  if (loading || !data) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 14 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            height: 120, borderRadius: 20,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
            backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
          }} />
        ))}
      </div>
    );
  }

  const k = data.kpi;
  const completeRate = k.total_bookings === 0 ? 0 : Math.round((k.paid_bookings / k.total_bookings) * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <StatTile icon={<PiUsersBold size={20} />} label="Total users" value={k.total_users} color={T.blue} />
        <StatTile icon={<PiIdentificationCardBold size={20} />} label="Drivers" value={k.drivers} color={T.green} />
        <StatTile icon={<PiCarBold size={20} />} label="Active rides" value={k.active_rides} color={T.gold} />
        <StatTile icon={<PiCheckCircleBold size={20} />} label="Completed" value={k.completed_rides} color="#7BB88F" />
        <StatTile icon={<PiCurrencyInrBold size={20} />} label="Revenue" value={k.total_revenue} color={T.gold} format={(n) => `₹${n.toFixed(0)}`} />
        <StatTile icon={<PiShieldCheckBold size={20} />} label="Pending KYC" value={k.pending_verifications} color={T.orange} />
      </div>

      {/* Chart + Ratings + Route top */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 340px)', gap: 16 }} className="mobile-grid-stack">
        <TiltCard max={4} radius={22} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          padding: 20, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}>
          <ImpactChart
            title="Platform activity · last 14 days"
            sublabel="Bookings created per day"
            values={data.series.map(s => s.bookings)}
            unit=""
            color={T.blue}
          />
        </TiltCard>

        <TiltCard max={6} radius={22} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          padding: 20, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <h3 style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Booking completion</h3>
          <RadialProgress value={completeRate} size={140} thickness={12} color={T.gold} label="Paid" sub={`${k.paid_bookings} / ${k.total_bookings}`} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18, width: '100%' }}>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{k.avg_rating.toFixed(2)}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase' }}>Avg rating</div>
            </div>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{k.total_reviews}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase' }}>Reviews</div>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* Top routes + queues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Spotlight color="rgba(200,149,108,0.15)" style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          padding: 20, borderRadius: 22, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}>
          <h3 style={{ fontSize: 14, color: 'white', fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, display: 'grid', placeItems: 'center' }}>
              <PiCarBold size={12} color="white" />
            </div>
            Top routes
          </h3>
          {data.top_routes.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No rides yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.top_routes.map((r, i) => (
                <div key={i} style={{
                  padding: '10px 12px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ minWidth: 24, height: 24, borderRadius: 8, background: `${T.gold}22`, color: T.gold, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.from_label} → {r.to_label}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.gold }}>{r.ride_count}×</div>
                </div>
              ))}
            </div>
          )}
        </Spotlight>

        <Spotlight color="rgba(74,111,165,0.15)" style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          padding: 20, borderRadius: 22, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}>
          <h3 style={{ fontSize: 14, color: 'white', fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: `linear-gradient(135deg, ${T.blue}, ${T.navy})`, display: 'grid', placeItems: 'center' }}>
              <PiListChecksBold size={12} color="white" />
            </div>
            Queues
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Active SOS alerts', v: k.active_alerts, color: k.active_alerts ? T.red : T.green },
              { label: 'Pending verifications', v: k.pending_verifications, color: k.pending_verifications ? T.orange : T.green },
              { label: 'Open ride reports', v: k.open_reports, color: k.open_reports ? T.red : T.green },
              { label: 'Unread support msgs', v: k.open_support, color: k.open_support ? T.blue : T.green },
              { label: 'Banned users', v: k.banned, color: T.gray },
              { label: 'Cancelled rides', v: k.cancelled_rides, color: T.gray },
            ].map((r, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{r.label}</span>
                <span style={{
                  padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 900,
                  background: `${r.color}22`, color: r.color, border: `1px solid ${r.color}55`,
                }}>{r.v}</span>
              </div>
            ))}
          </div>
        </Spotlight>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  USERS
 * ──────────────────────────────────────────────────────────── */
function UsersTab({ admin, onChange }: { admin: string; onChange: () => void }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [banned, setBanned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBanned, setShowBanned] = useState(false);

  const load = async () => {
    setLoading(true);
    const [r, b] = await Promise.all([searchUsers(q), getBannedUsers()]);
    setRows(r); setBanned(b); setLoading(false);
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);

  const bannedIds = useMemo(() => new Set(banned.map(b => b.user_id)), [banned]);

  const handleBan = async (id: string) => {
    const reason = prompt('Reason for ban?');
    if (!reason) return;
    await banUser(id, reason, admin);
    await load(); onChange();
  };
  const handleUnban = async (id: string) => {
    if (!confirm('Unban this user?')) return;
    await unbanUser(id, admin);
    await load(); onChange();
  };

  const list = showBanned ? banned.map(b => ({ ...b.user, banned_reason: b.reason, banned_at: b.banned_at })) : rows;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="frosted-section" style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 12,
            background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <PiMagnifyingGlassBold size={16} color="rgba(255,255,255,0.5)" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search name, email, phone…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'white', fontSize: 14, fontFamily: FONT.body,
              }} />
          </div>
          <div className="tab-pills">
            <button className={`tab-pill ${!showBanned ? 'active' : ''}`} onClick={() => setShowBanned(false)}>All</button>
            <button className={`tab-pill ${showBanned ? 'active' : ''}`} onClick={() => setShowBanned(true)}>Banned</button>
          </div>
        </div>
      </div>

      <div className="frosted-section" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Loading…</div>
        ) : list.length === 0 ? (
          <div style={{ padding: 40, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 13 }}>No users found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {list.map((u: any) => {
              const isBanned = bannedIds.has(u.id);
              return (
                <div key={u.id} style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14,
                  padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', alignItems: 'center',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: u.profile_photo ? `url(${u.profile_photo}) center/cover` : `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                    color: 'white', display: 'grid', placeItems: 'center', fontWeight: 900,
                    boxShadow: `0 4px 12px ${T.gold}44`,
                  }}>
                    {!u.profile_photo && (u.full_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.full_name || '(no name)'}
                      {isBanned && <span style={{ marginLeft: 8, background: `${T.red}22`, color: T.red, padding: '1px 8px', borderRadius: 100, fontSize: 10, fontWeight: 900, border: `1px solid ${T.red}55` }}>BANNED</span>}
                      {u.user_type && <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', padding: '1px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{u.user_type}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{u.email} · {u.phone || '—'}</div>
                    {showBanned && u.banned_reason && (
                      <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>Reason: {u.banned_reason} · {formatDistanceToNow(new Date(u.banned_at), { addSuffix: true })}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {isBanned ? (
                      <button onClick={() => handleUnban(u.id)} style={pillBtn(T.green)}>Unban</button>
                    ) : (
                      <button onClick={() => handleBan(u.id)} style={pillBtn(T.red)}>Ban</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const pillBtn = (color: string): React.CSSProperties => ({
  padding: '6px 12px', borderRadius: 8, border: `1px solid ${color}55`,
  background: `${color}22`, color, fontSize: 11, fontWeight: 800, cursor: 'pointer',
});

/* ────────────────────────────────────────────────────────────
 *  DRIVERS / VERIFICATIONS
 * ──────────────────────────────────────────────────────────── */
function DriversTab({ admin, onChange }: { admin: string; onChange: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setRows(await getPendingVerifications());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handle = async (id: string, status: 'verified' | 'rejected') => {
    await updateVerificationStatus(id, status, admin);
    await load(); onChange();
  };

  return (
    <div className="frosted-section" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 18, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'white', fontFamily: FONT.heading, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg, ${T.orange}, ${T.gold})`, display: 'grid', placeItems: 'center' }}>
            <PiShieldCheckBold size={14} color="white" />
          </div>
          Pending driver verifications
        </h3>
      </div>
      {loading ? (
        <div style={{ padding: 24, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 40, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 13 }}>All caught up — no pending requests.</div>
      ) : (
        <div>
          {rows.map((v: any) => (
            <div key={v.id} style={{
              padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                  color: 'white', display: 'grid', placeItems: 'center', fontWeight: 900, fontFamily: FONT.heading, flexShrink: 0,
                  boxShadow: `0 4px 12px ${T.gold}44`,
                }}>
                  {v.user?.full_name?.[0] || '?'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: 'white', fontWeight: 700 }}>{v.user?.full_name || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{v.user?.email}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>License · <b style={{ color: 'white' }}>{v.license_number}</b></span>
                    {v.vehicle_type && <span>Vehicle · {v.vehicle_type} {v.vehicle_number}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {v.license_photo && (
                  <a href={v.license_photo} target="_blank" rel="noreferrer" style={{ ...pillBtn(T.blue), textDecoration: 'none' }}>Docs</a>
                )}
                <button onClick={() => handle(v.id, 'verified')} style={pillBtn(T.green)}>Verify</button>
                <button onClick={() => handle(v.id, 'rejected')} style={pillBtn(T.red)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  RIDES
 * ──────────────────────────────────────────────────────────── */
function RidesTab({ admin }: { admin: string }) {
  const [status, setStatus] = useState<string>('active');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setRows(await getAllRidesAdmin(status));
    setLoading(false);
  };
  useEffect(() => { load(); }, [status]);

  const doCancel = async (id: string) => {
    const reason = prompt('Reason to force-cancel this ride?');
    if (!reason) return;
    await forceCancelRide(id, admin, reason);
    await load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="tab-pills">
          {['active', 'completed', 'cancelled'].map(s => (
            <button key={s} className={`tab-pill ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s.toUpperCase()}</button>
          ))}
        </div>
      </div>
      <div className="frosted-section" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 13 }}>No {status} rides.</div>
        ) : (
          <div>
            {rows.map(r => (
              <div key={r.id} style={{
                padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.from_location?.address || 'Unknown'} → {r.to_location?.address || 'Unknown'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                    {format(new Date(r.departure_time), 'MMM d, HH:mm')} · {r.seats_available} seats · ₹{r.price_per_seat}/seat · Driver: {r.driver?.full_name || '—'}
                  </div>
                </div>
                {status === 'active' && (
                  <button onClick={() => doCancel(r.id)} style={pillBtn(T.red)}>Cancel</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  ALERTS (SOS)
 * ──────────────────────────────────────────────────────────── */
function AlertsTab({ admin, onChange }: { admin: string; onChange: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); setRows(await getActiveSOSAlerts()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const resolve = async (id: string) => { await resolveSOSAlert(id, admin); await load(); onChange(); };

  return (
    <div className="frosted-section" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 18, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'white', fontFamily: FONT.heading, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg, ${T.red}, #B24C4C)`, display: 'grid', placeItems: 'center' }} className="ring-pulse">
            <PiSirenBold size={14} color="white" />
          </div>
          Active SOS alerts
        </h3>
      </div>
      {loading ? (
        <div style={{ padding: 24, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 40, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 13 }}>No active alerts — everyone's safe.</div>
      ) : (
        <div>
          {rows.map(a => (
            <div key={a.id} style={{
              padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>{a.user?.full_name || 'Unknown user'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                  {a.location ? (
                    <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${a.location.lat}&mlon=${a.location.lng}#map=17/${a.location.lat}/${a.location.lng}`}
                       style={{ color: T.gold, textDecoration: 'none' }}>
                      Map · {a.location.lat.toFixed(4)}, {a.location.lng.toFixed(4)}
                    </a>
                  ) : 'No location'}
                  {' · '} {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </div>
                {a.message && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>"{a.message}"</div>}
              </div>
              <button onClick={() => resolve(a.id)} style={{ ...pillBtn(T.green), padding: '8px 14px' }}>Resolve</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  REPORTS
 * ──────────────────────────────────────────────────────────── */
function ReportsTab({ admin, onChange }: { admin: string; onChange: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); setRows(await getOpenReports()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const act = async (id: string, status: 'reviewed' | 'dismissed' | 'action_taken') => {
    await resolveReport(id, admin, status); await load(); onChange();
  };

  return (
    <div className="frosted-section" style={{ padding: 0, overflow: 'hidden' }}>
      {loading ? (
        <div style={{ padding: 24, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 40, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 13 }}>No open reports.</div>
      ) : (
        <div>
          {rows.map(r => (
            <div key={r.id} style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>
                {r.reporter?.full_name || 'Someone'} reported {r.reported?.full_name || 'a user'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                {r.ride?.from_location?.address && ` · Ride: ${r.ride.from_location.address} → ${r.ride.to_location?.address}`}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 8, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {r.reason}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button onClick={() => act(r.id, 'action_taken')} style={pillBtn(T.red)}>Take action</button>
                <button onClick={() => act(r.id, 'reviewed')} style={pillBtn(T.blue)}>Mark reviewed</button>
                <button onClick={() => act(r.id, 'dismissed')} style={pillBtn(T.gray)}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  SUPPORT INBOX
 * ──────────────────────────────────────────────────────────── */
function SupportTab({ admin }: { admin: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); setRows(await getSupportThreads()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, { user: any; messages: any[]; unread: number }>();
    for (const r of rows) {
      const key = r.user_id;
      if (!map.has(key)) map.set(key, { user: r.user, messages: [], unread: 0 });
      const g = map.get(key)!;
      g.messages.push(r);
      if (r.sender_type === 'user' && !r.is_read) g.unread++;
    }
    return Array.from(map.values()).sort((a, b) => (b.unread - a.unread) || (new Date(b.messages[0].created_at).getTime() - new Date(a.messages[0].created_at).getTime()));
  }, [rows]);

  const send = async () => {
    if (!reply.trim() || !selectedUser) return;
    await replySupport(selectedUser.id, admin, reply.trim());
    await markSupportRead(selectedUser.id);
    setReply('');
    await load();
  };

  const openThread = async (u: any) => {
    setSelectedUser(u);
    await markSupportRead(u.id);
    await load();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', gap: 14 }} className="mobile-grid-stack">
      <div className="frosted-section" style={{ padding: 0, overflow: 'hidden', maxHeight: 620 }}>
        <div style={{ padding: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: 13, color: 'white', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>Threads</h3>
        </div>
        {loading ? (
          <div style={{ padding: 20, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Loading…</div>
        ) : grouped.length === 0 ? (
          <div style={{ padding: 28, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 13 }}>No support conversations.</div>
        ) : (
          <div style={{ overflowY: 'auto', maxHeight: 560 }}>
            {grouped.map((g) => (
              <button key={g.user?.id || Math.random()} onClick={() => openThread(g.user)} style={{
                width: '100%', textAlign: 'left', cursor: 'pointer',
                padding: '12px 14px', border: 'none', background: selectedUser?.id === g.user?.id ? 'rgba(200,149,108,0.08)' : 'transparent',
                borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: g.user?.profile_photo ? `url(${g.user.profile_photo}) center/cover` : `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                  color: 'white', display: 'grid', placeItems: 'center', fontWeight: 900,
                }}>{!g.user?.profile_photo && (g.user?.full_name?.[0] || '?')}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.user?.full_name || g.user?.email || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {g.messages[0]?.message}
                  </div>
                </div>
                {g.unread > 0 && (
                  <span style={{ background: T.blue, color: 'white', borderRadius: 100, padding: '1px 8px', fontSize: 10, fontWeight: 900 }}>{g.unread}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="frosted-section" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 480 }}>
        {selectedUser ? (
          <>
            <div style={{ padding: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, color: 'white', fontWeight: 800 }}>{selectedUser.full_name || 'User'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{selectedUser.email}</div>
            </div>
            <div style={{ flex: 1, padding: 16, overflowY: 'auto', maxHeight: 420, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped.find(g => g.user?.id === selectedUser.id)?.messages.slice().reverse().map((m: any) => (
                <div key={m.id} style={{
                  alignSelf: m.sender_type === 'admin' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '10px 14px', borderRadius: 14,
                  background: m.sender_type === 'admin' ? `linear-gradient(135deg, ${T.gold}, ${T.goldDark})` : 'rgba(255,255,255,0.05)',
                  border: m.sender_type === 'admin' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.message}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                    {m.sender_type} · {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8 }}>
              <input value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="Type a reply…"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: 14, outline: 'none',
                }} />
              <RippleButton onClick={send} style={{
                padding: '10px 16px', borderRadius: 12,
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                color: 'white', fontWeight: 800, fontSize: 13,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <PiPaperPlaneRightBold size={14} /> Send
              </RippleButton>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            Select a thread to start replying.
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  ANNOUNCEMENTS
 * ──────────────────────────────────────────────────────────── */
function AnnouncementsTab({ admin }: { admin: string }) {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical' | 'success'>('info');
  const [audience, setAudience] = useState<'all' | 'students' | 'drivers' | 'admins'>('all');
  const [posting, setPosting] = useState(false);

  const load = async () => setRows(await getAnnouncements());
  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    try {
      await createAnnouncement({ title: title.trim(), body: body.trim(), severity, audience }, admin);
      setTitle(''); setBody('');
      await load();
    } finally { setPosting(false); }
  };

  const disable = async (id: string) => {
    if (!confirm('Deactivate this announcement?')) return;
    await deactivateAnnouncement(id, admin);
    await load();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="mobile-grid-stack">
      <div className="frosted-section">
        <h3 style={{ fontSize: 14, color: 'white', fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, display: 'grid', placeItems: 'center' }}>
            <PiPlusCircleBold size={13} color="white" />
          </div>
          New announcement
        </h3>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
          style={inputStyle} />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message body" rows={4}
          style={{ ...inputStyle, marginTop: 8, resize: 'vertical', fontFamily: FONT.body }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <div className="tab-pills">
            {(['info', 'success', 'warning', 'critical'] as const).map(s => (
              <button key={s} className={`tab-pill ${severity === s ? 'active' : ''}`} onClick={() => setSeverity(s)}>{s}</button>
            ))}
          </div>
          <div className="tab-pills">
            {(['all', 'students', 'drivers', 'admins'] as const).map(a => (
              <button key={a} className={`tab-pill ${audience === a ? 'active' : ''}`} onClick={() => setAudience(a)}>{a}</button>
            ))}
          </div>
        </div>
        <RippleButton onClick={post} disabled={posting || !title.trim() || !body.trim()} style={{
          marginTop: 12, padding: '10px 18px', borderRadius: 12,
          background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
          color: 'white', fontWeight: 800, fontSize: 13,
        }}>
          {posting ? 'Posting…' : 'Publish announcement'}
        </RippleButton>
      </div>

      <div className="frosted-section">
        <h3 style={{ fontSize: 14, color: 'white', fontWeight: 800, marginBottom: 14 }}>Live announcements</h3>
        {rows.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', padding: 20 }}>Nothing published.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(a => {
              const color = a.severity === 'critical' ? T.red : a.severity === 'warning' ? T.orange : a.severity === 'success' ? T.green : T.blue;
              return (
                <div key={a.id} style={{ padding: 12, borderRadius: 12, background: `${color}12`, border: `1px solid ${color}44` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'white', fontWeight: 800 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{a.body}</div>
                    </div>
                    <button onClick={() => disable(a.id)} style={pillBtn(T.red)}>Off</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <span className="chip" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>{a.severity}</span>
                    <span className="chip">{a.audience}</span>
                    <span className="chip">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 12,
  background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', fontSize: 14, outline: 'none', fontFamily: FONT.body,
};

/* ────────────────────────────────────────────────────────────
 *  AUDIT LOGS
 * ──────────────────────────────────────────────────────────── */
function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); setRows(await getAdminLogs(200)); setLoading(false); };
  useEffect(() => { load(); }, []);

  return (
    <div className="frosted-section" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 14, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <PiClockCounterClockwiseBold size={16} color={T.gold} />
        <h3 style={{ fontSize: 13, color: 'white', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>Admin action log</h3>
      </div>
      {loading ? (
        <div style={{ padding: 24, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 30, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No activity logged yet.</div>
      ) : (
        <div style={{ maxHeight: 640, overflowY: 'auto' }}>
          {rows.map(r => (
            <div key={r.id} style={{
              padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'white' }}>
                  <b>{r.admin?.full_name || 'Admin'}</b> · <span style={{ color: T.gold }}>{r.action}</span>
                </div>
                {r.details && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(r.details)}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
