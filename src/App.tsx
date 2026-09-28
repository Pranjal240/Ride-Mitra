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
import AppBackground from './components/ui/app-background';
import ErrorBoundary from './components/common/ErrorBoundary';
import { KineticTextLoader } from './components/ui/kinetic-loader';

/* ---- Pages ---- */
import Landing from './pages/Landing';
import RolePortal from './pages/RolePortal';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import ServiceDashboard from './pages/ServiceDashboard';
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
import { cleanupPastRides } from './lib/api';
import { dashboardPath } from './lib/roles';

/* ---- Protected Route ---- */
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuthStore();
  if (loading) return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <KineticTextLoader text="Loading" className="scale-90 sm:scale-100" />
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
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
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
    <div style={{ minHeight: '100vh', background: 'transparent', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      {/* app-wide animated grid backdrop — behind every route */}
      <AppBackground />
      <ScrollProgress />
      {user && <LiveAnnouncements />}
      {user && <Header />}
      <CommandPalette />
      <CommandHint />
      <MobileBottomNav />
      <ToastContainer />
      <ErrorBoundary resetKey={location.pathname}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/" element={user ? <Navigate to={dashboardPath(user.user_type)} /> : <AnimatedPage><Landing /></AnimatedPage>} />
          <Route path="/portal" element={user ? <Navigate to="/" /> : <AnimatedPage><RolePortal /></AnimatedPage>} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<AnimatedPage><PrivacyPolicy /></AnimatedPage>} />
          <Route path="/terms" element={<AnimatedPage><Terms /></AnimatedPage>} />

          {/* User (rider) */}
          <Route path="/user" element={<ProtectedRoute roles={['student', 'both']}><AnimatedPage><UserDashboard /></AnimatedPage></ProtectedRoute>} />
          <Route path="/student" element={<Navigate to="/user" replace />} />
          <Route path="/rides" element={<AnimatedPage><RideSearch /></AnimatedPage>} />
          <Route path="/rides/search" element={<AnimatedPage><RideSearch /></AnimatedPage>} />
          <Route path="/rides/:id" element={<AnimatedPage><BookRide /></AnimatedPage>} />
          <Route path="/rides/:id/book" element={<AnimatedPage><BookRide /></AnimatedPage>} />
          <Route path="/bookings" element={<ProtectedRoute roles={['student']}><AnimatedPage><Bookings /></AnimatedPage></ProtectedRoute>} />
          <Route path="/tracking/:rideId" element={<ProtectedRoute><AnimatedPage><LiveTracking /></AnimatedPage></ProtectedRoute>} />
          <Route path="/chat/:rideId" element={<ProtectedRoute><AnimatedPage><Chat /></AnimatedPage></ProtectedRoute>} />

          {/* Service (offers rides) */}
          <Route path="/service" element={<ProtectedRoute roles={['driver', 'both']}><AnimatedPage><ServiceDashboard /></AnimatedPage></ProtectedRoute>} />
          <Route path="/driver" element={<Navigate to="/service" replace />} />
          <Route path="/rides/create" element={<ProtectedRoute roles={['driver']}><AnimatedPage><CreateRide /></AnimatedPage></ProtectedRoute>} />
          <Route path="/verification" element={<ProtectedRoute roles={['driver']}><AnimatedPage><Verification /></AnimatedPage></ProtectedRoute>} />

          {/* Unified role folded into the User dashboard */}
          <Route path="/unified" element={<Navigate to="/user" replace />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AnimatedPage><AdminPanel /></AnimatedPage></ProtectedRoute>} />
          <Route path="/pending-admin" element={<ProtectedRoute roles={['pending_admin']}><AnimatedPage><PendingAdmin /></AnimatedPage></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/profile" element={<ProtectedRoute><AnimatedPage><Profile /></AnimatedPage></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      </ErrorBoundary>
    </div>
  );
}
