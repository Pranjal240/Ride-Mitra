import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from './hooks/useStore';
import { useRealtimeNotifications } from './hooks/useRealtime';
import { ToastContainer } from './components/common';
import Header from './components/common/Header';
import { CommandPalette, MobileBottomNav, CommandHint } from './components/common/GlobalUI';
import LiveAnnouncements from './components/common/LiveAnnouncements';
import { ScrollProgress } from './components/common/Interactive3D';
import AuthCallback from './components/auth/AuthCallback';

/* ---- Pages ---- */
import Landing from './pages/Landing';
import RolePortal from './pages/RolePortal';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import DriverDashboard from './pages/DriverDashboard';
import UnifiedDashboard from './pages/UnifiedDashboard';
import AdminPanel from './pages/AdminPanel';
import PendingAdmin from './pages/PendingAdmin';
import RideSearch from './pages/RideSearch';
import CreateRide from './pages/CreateRide';
import BookRide from './pages/BookRide';
import Bookings from './pages/Bookings';
import LiveTracking from './pages/LiveTracking';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Verification from './pages/Verification';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import T from './lib/theme';
import { cleanupPastRides } from './lib/api';

/* ---- Protected Route ---- */
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuthStore();
  if (loading) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background: '#0F1A33',
    }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{ width: 48, height: 48, border: `3px solid rgba(200,149,108,0.2)`, borderTopColor: T.gold, borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
        <p style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 12, fontFamily: "'Poppins',sans-serif", letterSpacing: 2, textTransform: 'uppercase' }}>Loading</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  if (roles && user.user_type && !roles.includes(user.user_type) && user.user_type !== 'both') return <Navigate to="/" replace />;
  return <>{children}</>;
}

/* ---- Animated Route Wrapper ---- */
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const { user, initialize } = useAuthStore();
  const location = useLocation();

  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => { cleanupPastRides().catch(() => {}); }, []);

  useRealtimeNotifications(user?.id);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <ScrollProgress />
      {user && <LiveAnnouncements />}
      {user && <Header />}
      <CommandPalette />
      <CommandHint />
      <MobileBottomNav />
      <ToastContainer />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/" element={user ? <Navigate to={user.user_type === 'admin' ? '/admin' : user.user_type === 'pending_admin' ? '/pending-admin' : user.user_type === 'both' ? '/unified' : user.user_type === 'driver' ? '/driver' : '/student'} /> : <AnimatedPage><Landing /></AnimatedPage>} />
          <Route path="/portal" element={user ? <Navigate to="/" /> : <AnimatedPage><RolePortal /></AnimatedPage>} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<AnimatedPage><PrivacyPolicy /></AnimatedPage>} />
          <Route path="/terms" element={<AnimatedPage><Terms /></AnimatedPage>} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><AnimatedPage><StudentDashboard /></AnimatedPage></ProtectedRoute>} />
          <Route path="/rides" element={<AnimatedPage><RideSearch /></AnimatedPage>} />
          <Route path="/rides/search" element={<AnimatedPage><RideSearch /></AnimatedPage>} />
          <Route path="/rides/:id" element={<AnimatedPage><BookRide /></AnimatedPage>} />
          <Route path="/rides/:id/book" element={<AnimatedPage><BookRide /></AnimatedPage>} />
          <Route path="/bookings" element={<ProtectedRoute roles={['student']}><AnimatedPage><Bookings /></AnimatedPage></ProtectedRoute>} />
          <Route path="/tracking/:rideId" element={<ProtectedRoute><AnimatedPage><LiveTracking /></AnimatedPage></ProtectedRoute>} />
          <Route path="/chat/:rideId" element={<ProtectedRoute><AnimatedPage><Chat /></AnimatedPage></ProtectedRoute>} />

          {/* Driver */}
          <Route path="/driver" element={<ProtectedRoute roles={['driver']}><AnimatedPage><DriverDashboard /></AnimatedPage></ProtectedRoute>} />
          <Route path="/rides/create" element={<ProtectedRoute roles={['driver']}><AnimatedPage><CreateRide /></AnimatedPage></ProtectedRoute>} />
          <Route path="/verification" element={<ProtectedRoute roles={['driver']}><AnimatedPage><Verification /></AnimatedPage></ProtectedRoute>} />

          {/* Unified */}
          <Route path="/unified" element={<ProtectedRoute roles={['both']}><AnimatedPage><UnifiedDashboard /></AnimatedPage></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AnimatedPage><AdminPanel /></AnimatedPage></ProtectedRoute>} />
          <Route path="/pending-admin" element={<ProtectedRoute roles={['pending_admin']}><AnimatedPage><PendingAdmin /></AnimatedPage></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/profile" element={<ProtectedRoute><AnimatedPage><Profile /></AnimatedPage></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
