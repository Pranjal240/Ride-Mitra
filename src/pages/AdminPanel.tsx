import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  ClipboardList,
  Clock,
  Flag,
  IdCard,
  IndianRupee,
  ListChecks,
  Megaphone,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  Siren,
  TrendingUp,
  Users,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { useAuthStore } from "@/hooks/useStore";
import {
  getAdminAnalytics,
  getActiveSOSAlerts,
  getPendingVerifications,
  resolveSOSAlert,
  updateVerificationStatus,
  searchUsers,
  getAllRidesAdmin,
  forceCancelRide,
  getOpenReports,
  resolveReport,
  getAnnouncements,
  createAnnouncement,
  deactivateAnnouncement,
  getSupportThreads,
  replySupport,
  markSupportRead,
  getAdminLogs,
  banUser,
  unbanUser,
  getBannedUsers,
  type AdminAnalytics,
  type Announcement,
} from "@/lib/api";
import { roleLabel } from "@/lib/roles";
import { SmoothInput } from "@/components/ui/smooth-input";
import { Badge, Button, Container, PageShell, Panel, buttonVariants, type BadgeTone } from "@/components/ui/primitives";
import { CountUp, ScoreRing, Sparkbars, toneTile } from "@/components/ui/dashboard";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

type TabKey = "overview" | "users" | "drivers" | "rides" | "alerts" | "reports" | "support" | "announcements" | "audit";

const TABS: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <TrendingUp className="size-4" /> },
  { key: "users", label: "Users", icon: <Users className="size-4" /> },
  { key: "drivers", label: "Verify", icon: <IdCard className="size-4" /> },
  { key: "rides", label: "Rides", icon: <Car className="size-4" /> },
  { key: "alerts", label: "SOS", icon: <Siren className="size-4" /> },
  { key: "reports", label: "Reports", icon: <Flag className="size-4" /> },
  { key: "support", label: "Support", icon: <MessageSquareText className="size-4" /> },
  { key: "announcements", label: "Announce", icon: <Megaphone className="size-4" /> },
  { key: "audit", label: "Audit", icon: <ClipboardList className="size-4" /> },
];

const empty = (m: string) => <p className="py-10 text-center text-sm text-muted-foreground">{m}</p>;

export default function AdminPanel() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<TabKey>("overview");
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const a = await getAdminAnalytics();
      if (a) setAnalytics(a);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const badgeFor = (key: TabKey) => {
    if (!analytics) return 0;
    const k = analytics.kpi;
    return key === "alerts" ? k.active_alerts : key === "drivers" ? k.pending_verifications : key === "reports" ? k.open_reports : key === "support" ? k.open_support : 0;
  };

  if (!user) return null;

  return (
    <PageShell>
      <Container size="full">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-light p-7 text-white sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-danger/15 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-danger" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">Admin console · JC Bose UST</span>
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Command <span className="text-accent">center.</span>
            </h1>
            <p className="mt-2 text-sm text-white/60">Live safety monitoring, verification, and platform operations.</p>
          </div>
        </div>

        {/* tabs */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const count = badgeFor(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  tab === t.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {t.icon}
                {t.label}
                {count > 0 && <span className="rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {tab === "overview" && <OverviewTab loading={loading} data={analytics} />}
              {tab === "users" && <UsersTab admin={user?.id || ""} onChange={refresh} />}
              {tab === "drivers" && <DriversTab admin={user?.id || ""} onChange={refresh} />}
              {tab === "rides" && <RidesTab admin={user?.id || ""} />}
              {tab === "alerts" && <AlertsTab admin={user?.id || ""} onChange={refresh} />}
              {tab === "reports" && <ReportsTab admin={user?.id || ""} onChange={refresh} />}
              {tab === "support" && <SupportTab admin={user?.id || ""} />}
              {tab === "announcements" && <AnnouncementsTab admin={user?.id || ""} />}
              {tab === "audit" && <AuditTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </PageShell>
  );
}

function StatTile({ icon, label, value, tone, format: fmt }: { icon: ReactNode; label: string; value: number; tone: BadgeTone; format?: (n: number) => string }) {
  return (
    <Panel>
      <span className={toneTile(tone, "size-10 [&>svg]:size-5")} aria-hidden>
        {icon}
      </span>
      <p className="mt-3 font-mono text-2xl font-bold text-foreground">{fmt ? fmt(value) : <CountUp value={value} />}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    </Panel>
  );
}

function OverviewTab({ loading, data }: { loading: boolean; data: AdminAnalytics | null }) {
  if (loading || !data)
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-muted" />
        ))}
      </div>
    );
  const k = data.kpi;
  const completeRate = k.total_bookings === 0 ? 0 : Math.round((k.paid_bookings / k.total_bookings) * 100);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile icon={<Users />} label="Total users" value={k.total_users} tone="info" />
        <StatTile icon={<IdCard />} label="Service providers" value={k.drivers} tone="success" />
        <StatTile icon={<Car />} label="Active rides" value={k.active_rides} tone="accent" />
        <StatTile icon={<ShieldCheck />} label="Completed" value={k.completed_rides} tone="success" />
        <StatTile icon={<IndianRupee />} label="Revenue" value={k.total_revenue} tone="accent" format={(n) => `₹${n.toFixed(0)}`} />
        <StatTile icon={<ShieldCheck />} label="Pending KYC" value={k.pending_verifications} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Panel>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-display font-bold text-foreground">Platform activity · last 14 days</h3>
            <span className="text-xs text-muted-foreground">Bookings / day</span>
          </div>
          <Sparkbars values={data.series.map((s) => s.bookings)} className="mt-4" />
        </Panel>
        <Panel className="flex flex-col items-center">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Booking completion</h3>
          <ScoreRing value={completeRate} size={140} />
          <div className="mt-4 grid w-full grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
              <div className="font-mono text-xl font-bold text-foreground">{k.avg_rating.toFixed(2)}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Avg rating</div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
              <div className="font-mono text-xl font-bold text-foreground">{k.total_reviews}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Reviews</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h3 className="mb-3 flex items-center gap-2 font-display font-bold text-foreground">
            <Car className="size-4 text-accent" /> Top routes
          </h3>
          {data.top_routes.length === 0 ? (
            empty("No rides yet")
          ) : (
            <div className="space-y-2">
              {data.top_routes.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                  <span className="grid size-6 place-items-center rounded-lg bg-accent-soft font-mono text-xs font-bold text-accent-strong">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {r.from_label} → {r.to_label}
                  </span>
                  <span className="font-mono text-xs font-bold text-accent-strong">{r.ride_count}×</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel>
          <h3 className="mb-3 flex items-center gap-2 font-display font-bold text-foreground">
            <ListChecks className="size-4 text-accent" /> Queues
          </h3>
          <div className="space-y-2">
            {[
              { label: "Active SOS alerts", v: k.active_alerts, tone: (k.active_alerts ? "danger" : "success") as BadgeTone },
              { label: "Pending verifications", v: k.pending_verifications, tone: (k.pending_verifications ? "warning" : "success") as BadgeTone },
              { label: "Open ride reports", v: k.open_reports, tone: (k.open_reports ? "danger" : "success") as BadgeTone },
              { label: "Unread support", v: k.open_support, tone: (k.open_support ? "info" : "success") as BadgeTone },
              { label: "Banned users", v: k.banned, tone: "neutral" as BadgeTone },
              { label: "Cancelled rides", v: k.cancelled_rides, tone: "neutral" as BadgeTone },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
                <span className="text-sm text-foreground">{r.label}</span>
                <Badge tone={r.tone}>{r.v}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function pill(variant: "success" | "danger" | "info" | "neutral") {
  const map = {
    success: "border-success/40 bg-success-soft text-success",
    danger: "border-danger/40 bg-danger-soft text-danger",
    info: "border-info/40 bg-info-soft text-info",
    neutral: "border-border bg-muted text-muted-foreground",
  };
  return cn("rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors", map[variant]);
}

function UsersTab({ admin, onChange }: { admin: string; onChange: () => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [banned, setBanned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBanned, setShowBanned] = useState(false);

  const load = async () => {
    setLoading(true);
    const [r, b] = await Promise.all([searchUsers(q), getBannedUsers()]);
    setRows(r);
    setBanned(b);
    setLoading(false);
  };
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const bannedIds = useMemo(() => new Set(banned.map((b) => b.user_id)), [banned]);
  const handleBan = async (id: string) => {
    const reason = prompt("Reason for ban?");
    if (!reason) return;
    await banUser(id, reason, admin);
    await load();
    onChange();
  };
  const handleUnban = async (id: string) => {
    if (!confirm("Unban this user?")) return;
    await unbanUser(id, admin);
    await load();
    onChange();
  };
  const list = showBanned ? banned.map((b) => ({ ...b.user, banned_reason: b.reason, banned_at: b.banned_at })) : rows;

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <SmoothInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" wrapperClassName="py-2.5" aria-label="Search users" />
        </div>
        <div className="flex gap-1 rounded-xl border border-border p-1">
          <button type="button" onClick={() => setShowBanned(false)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", !showBanned ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            All
          </button>
          <button type="button" onClick={() => setShowBanned(true)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", showBanned ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            Banned
          </button>
        </div>
      </Panel>

      <Panel inset="none" className="divide-y divide-border overflow-hidden">
        {loading ? empty("Loading…") : list.length === 0 ? empty("No users found.") : list.map((u: any) => {
          const isBanned = bannedIds.has(u.id);
          return (
            <div key={u.id} className="flex items-center gap-3 p-4">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-strong bg-cover bg-center font-display font-bold text-white"
                style={u.profile_photo ? { backgroundImage: `url(${u.profile_photo})` } : undefined}
              >
                {!u.profile_photo && (u.full_name?.[0] || u.email?.[0] || "?").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold text-foreground">
                  {u.full_name || "(no name)"}
                  {isBanned && <Badge tone="danger">Banned</Badge>}
                  {u.user_type && <Badge tone="neutral">{roleLabel(u.user_type)}</Badge>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email} · {u.phone || "—"}
                </p>
                {showBanned && u.banned_reason && (
                  <p className="mt-1 text-xs text-danger">
                    Reason: {u.banned_reason} · {formatDistanceToNow(new Date(u.banned_at), { addSuffix: true })}
                  </p>
                )}
              </div>
              {isBanned ? (
                <button type="button" onClick={() => handleUnban(u.id)} className={pill("success")}>
                  Unban
                </button>
              ) : (
                <button type="button" onClick={() => handleBan(u.id)} className={pill("danger")}>
                  Ban
                </button>
              )}
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

function DriversTab({ admin, onChange }: { admin: string; onChange: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setRows(await getPendingVerifications());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const handle = async (id: string, status: "verified" | "rejected") => {
    let reason: string | undefined;
    if (status === "rejected") {
      const input = prompt("Reason for rejection (will be shown to the applicant):");
      if (!input) return; // cancelled
      reason = input;
    }
    await updateVerificationStatus(id, status, admin, reason);
    await load();
    onChange();
  };
  return (
    <Panel inset="none" className="divide-y divide-border overflow-hidden">
      <h3 className="flex items-center gap-2 p-4 font-display font-bold text-foreground">
        <ShieldCheck className="size-4 text-accent" /> Pending verifications
      </h3>
      {loading ? empty("Loading…") : rows.length === 0 ? empty("All caught up — no pending requests.") : rows.map((v: any) => (
        <div key={v.id} className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-strong font-display font-bold text-white">{v.user?.full_name?.[0] || "?"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{v.user?.full_name || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">{v.user?.email}</p>
              <p className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Licence · <b className="text-foreground">{v.license_number}</b></span>
                {v.vehicle_type && <span>Vehicle · {v.vehicle_type} {v.vehicle_number}</span>}
                {v.vehicle_model && <span>Model · {v.vehicle_model}</span>}
                {v.vehicle_color && <span>Color · {v.vehicle_color}</span>}
                {v.college_id && <span>College ID · {v.college_id}</span>}
              </p>
            </div>
          </div>
          {/* Document thumbnails */}
          {(v.license_photo || v.vehicle_photo || v.id_card_photo) && (
            <div className="flex flex-wrap gap-2">
              {v.license_photo && (
                <a href={v.license_photo} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-border">
                  <img src={v.license_photo} alt="Licence" className="h-20 w-28 object-cover transition-transform group-hover:scale-105" />
                  <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">Licence</p>
                </a>
              )}
              {v.vehicle_photo && (
                <a href={v.vehicle_photo} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-border">
                  <img src={v.vehicle_photo} alt="Vehicle" className="h-20 w-28 object-cover transition-transform group-hover:scale-105" />
                  <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">Vehicle</p>
                </a>
              )}
              {v.id_card_photo && (
                <a href={v.id_card_photo} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-border">
                  <img src={v.id_card_photo} alt="ID Card" className="h-20 w-28 object-cover transition-transform group-hover:scale-105" />
                  <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">College ID</p>
                </a>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => handle(v.id, "verified")} className={pill("success")}>
              ✓ Verify
            </button>
            <button type="button" onClick={() => handle(v.id, "rejected")} className={pill("danger")}>
              ✕ Reject
            </button>
          </div>
        </div>
      ))}
    </Panel>
  );
}

function RidesTab({ admin }: { admin: string }) {
  const [status, setStatus] = useState("active");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setRows(await getAllRidesAdmin(status));
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  const doCancel = async (id: string) => {
    const reason = prompt("Reason to force-cancel this ride?");
    if (!reason) return;
    await forceCancelRide(id, admin, reason);
    await load();
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        {["active", "completed", "cancelled"].map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} className={cn("flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize", status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {s}
          </button>
        ))}
      </div>
      <Panel inset="none" className="divide-y divide-border overflow-hidden">
        {loading ? empty("Loading…") : rows.length === 0 ? empty(`No ${status} rides.`) : rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {r.from_location?.address || "Unknown"} → {r.to_location?.address || "Unknown"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {format(new Date(r.departure_time), "MMM d, HH:mm")} · {r.seats_available} seats · ₹{r.price_per_seat}/seat · {r.driver?.full_name || "—"}
              </p>
            </div>
            {status === "active" && (
              <button type="button" onClick={() => doCancel(r.id)} className={pill("danger")}>
                Cancel
              </button>
            )}
          </div>
        ))}
      </Panel>
    </div>
  );
}

function AlertsTab({ admin, onChange }: { admin: string; onChange: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setRows(await getActiveSOSAlerts());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const resolve = async (id: string) => {
    await resolveSOSAlert(id, admin);
    await load();
    onChange();
  };
  return (
    <Panel inset="none" className="divide-y divide-border overflow-hidden">
      <h3 className="flex items-center gap-2 p-4 font-display font-bold text-foreground">
        <Siren className="size-4 text-danger" /> Active SOS alerts
      </h3>
      {loading ? empty("Loading…") : rows.length === 0 ? empty("No active alerts — everyone's safe.") : rows.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{a.user?.full_name || "Unknown user"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {a.location ? (
                <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${a.location.lat}&mlon=${a.location.lng}#map=17/${a.location.lat}/${a.location.lng}`} className="font-semibold text-accent-strong hover:underline">
                  Map · {a.location.lat.toFixed(4)}, {a.location.lng.toFixed(4)}
                </a>
              ) : (
                "No location"
              )}{" "}
              · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
            </p>
            {a.message && <p className="mt-1.5 text-sm text-foreground">“{a.message}”</p>}
          </div>
          <button type="button" onClick={() => resolve(a.id)} className={pill("success")}>
            Resolve
          </button>
        </div>
      ))}
    </Panel>
  );
}

function ReportsTab({ admin, onChange }: { admin: string; onChange: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setRows(await getOpenReports());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const act = async (id: string, status: "reviewed" | "dismissed" | "action_taken") => {
    await resolveReport(id, admin, status);
    await load();
    onChange();
  };
  return (
    <Panel inset="none" className="divide-y divide-border overflow-hidden">
      {loading ? empty("Loading…") : rows.length === 0 ? empty("No open reports.") : rows.map((r) => (
        <div key={r.id} className="p-4">
          <p className="text-sm font-semibold text-foreground">
            {r.reporter?.full_name || "Someone"} reported {r.reported?.full_name || "a user"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
            {r.ride?.from_location?.address && ` · ${r.ride.from_location.address} → ${r.ride.to_location?.address}`}
          </p>
          <p className="mt-2 rounded-xl border border-border bg-muted/40 p-3 text-sm text-foreground">{r.reason}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => act(r.id, "action_taken")} className={pill("danger")}>
              Take action
            </button>
            <button type="button" onClick={() => act(r.id, "reviewed")} className={pill("info")}>
              Reviewed
            </button>
            <button type="button" onClick={() => act(r.id, "dismissed")} className={pill("neutral")}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </Panel>
  );
}

function SupportTab({ admin }: { admin: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setRows(await getSupportThreads());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const grouped = useMemo(() => {
    const map = new Map<string, { user: any; messages: any[]; unread: number }>();
    for (const r of rows) {
      const key = r.user_id;
      if (!map.has(key)) map.set(key, { user: r.user, messages: [], unread: 0 });
      const g = map.get(key)!;
      g.messages.push(r);
      if (r.sender_type === "user" && !r.is_read) g.unread++;
    }
    return Array.from(map.values()).sort((a, b) => b.unread - a.unread || new Date(b.messages[0].created_at).getTime() - new Date(a.messages[0].created_at).getTime());
  }, [rows]);
  const send = async () => {
    if (!reply.trim() || !selectedUser) return;
    await replySupport(selectedUser.id, admin, reply.trim());
    await markSupportRead(selectedUser.id);
    setReply("");
    await load();
  };
  const openThread = async (u: any) => {
    setSelectedUser(u);
    await markSupportRead(u.id);
    await load();
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Panel inset="none" className="max-h-[620px] overflow-hidden">
        <h3 className="border-b border-border p-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Threads</h3>
        <div className="max-h-[560px] divide-y divide-border overflow-y-auto">
          {loading ? empty("Loading…") : grouped.length === 0 ? empty("No support conversations.") : grouped.map((g) => (
            <button
              key={g.user?.id || Math.random()}
              type="button"
              onClick={() => openThread(g.user)}
              className={cn("flex w-full items-center gap-2.5 p-3 text-left transition-colors hover:bg-muted", selectedUser?.id === g.user?.id && "bg-accent-soft/40")}
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-strong bg-cover bg-center font-bold text-white"
                style={g.user?.profile_photo ? { backgroundImage: `url(${g.user.profile_photo})` } : undefined}
              >
                {!g.user?.profile_photo && (g.user?.full_name?.[0] || "?")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{g.user?.full_name || g.user?.email || "Unknown"}</p>
                <p className="truncate text-xs text-muted-foreground">{g.messages[0]?.message}</p>
              </div>
              {g.unread > 0 && <Badge tone="info">{g.unread}</Badge>}
            </button>
          ))}
        </div>
      </Panel>

      <Panel inset="none" className="flex min-h-[480px] flex-col">
        {selectedUser ? (
          <>
            <div className="border-b border-border p-3.5">
              <p className="font-semibold text-foreground">{selectedUser.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
            <div className="flex max-h-[420px] flex-1 flex-col gap-2.5 overflow-y-auto p-4">
              {grouped
                .find((g) => g.user?.id === selectedUser.id)
                ?.messages.slice()
                .reverse()
                .map((m: any) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                      m.sender_type === "admin" ? "self-end bg-primary text-primary-foreground" : "self-start border border-border bg-muted text-foreground",
                    )}
                  >
                    <p>{m.message}</p>
                    <p className={cn("mt-1 text-[10px]", m.sender_type === "admin" ? "text-white/60" : "text-muted-foreground")}>
                      {m.sender_type} · {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3">
              <SmoothInput value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a reply…" wrapperClassName="flex-1" aria-label="Reply" />
              <Button size="md" onClick={send} className="!px-3.5" icon={<Send className="size-4" />}>
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Select a thread to reply.</div>
        )}
      </Panel>
    </div>
  );
}

function AnnouncementsTab({ admin }: { admin: string }) {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical" | "success">("info");
  const [audience, setAudience] = useState<"all" | "students" | "drivers" | "admins">("all");
  const [posting, setPosting] = useState(false);
  const load = async () => setRows(await getAnnouncements());
  useEffect(() => {
    load();
  }, []);
  const post = async () => {
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    try {
      await createAnnouncement({ title: title.trim(), body: body.trim(), severity, audience }, admin);
      setTitle("");
      setBody("");
      await load();
    } finally {
      setPosting(false);
    }
  };
  const disable = async (id: string) => {
    if (!confirm("Deactivate this announcement?")) return;
    await deactivateAnnouncement(id, admin);
    await load();
  };
  const sevTone = (s: string): BadgeTone => (s === "critical" ? "danger" : s === "warning" ? "warning" : s === "success" ? "success" : "info");
  const AUD_LABEL: Record<string, string> = { all: "all", students: "users", drivers: "service", admins: "admins" };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel>
        <h3 className="mb-4 flex items-center gap-2 font-display font-bold text-foreground">
          <Megaphone className="size-4 text-accent" /> New announcement
        </h3>
        <div className="space-y-3">
          <SmoothInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Title" />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message body"
            rows={4}
            className="w-full resize-y rounded-2xl border border-border bg-muted2 px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex flex-wrap gap-2">
            {(["info", "success", "warning", "critical"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSeverity(s)} className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize", severity === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "students", "drivers", "admins"] as const).map((a) => (
              <button key={a} type="button" onClick={() => setAudience(a)} className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold", audience === a ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
                {AUD_LABEL[a]}
              </button>
            ))}
          </div>
          <Button onClick={post} loading={posting} disabled={!title.trim() || !body.trim()}>
            Publish announcement
          </Button>
        </div>
      </Panel>
      <Panel>
        <h3 className="mb-4 font-display font-bold text-foreground">Live announcements</h3>
        {rows.length === 0 ? (
          empty("Nothing published.")
        ) : (
          <div className="space-y-3">
            {rows.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  </div>
                  <button type="button" onClick={() => disable(a.id)} className={pill("danger")}>
                    Off
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Badge tone={sevTone(a.severity)}>{a.severity}</Badge>
                  <Badge tone="neutral">{a.audience}</Badge>
                  <Badge tone="neutral">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setRows(await getAdminLogs(200));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <Panel inset="none" className="overflow-hidden">
      <h3 className="flex items-center gap-2 border-b border-border p-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Clock className="size-4 text-accent" /> Admin action log
      </h3>
      {loading ? empty("Loading…") : rows.length === 0 ? empty("No activity logged yet.") : (
        <div className="max-h-[640px] divide-y divide-border overflow-y-auto">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-foreground">
                  <b>{r.admin?.full_name || "Admin"}</b> · <span className="text-accent-strong">{r.action}</span>
                </p>
                {r.details && <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{JSON.stringify(r.details)}</p>}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
