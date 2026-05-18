import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './hooks/useStore';
import { useRealtimeNotifications } from './hooks/useRealtime';
import { ToastContainer } from './components/common';
import Header from './components/common/Header';
import AuthCallback from './components/auth/AuthCallback';

/* ---- Pages ---- */
import Landing from './pages/Landing';
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
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:T.bg }}>
      <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:16 }}>
        <div style={{ width:40,height:40,border:`3px solid ${T.blue}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin-slow 0.8s linear infinite' }} />
        <p style={{ color:T.gray,fontWeight:500,fontSize:14 }}>Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  // Check if user has role. If they are 'both', they have access to driver and student roles.
  if (roles && user.user_type && !roles.includes(user.user_type) && user.user_type !== 'both') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, initialize } = useAuthStore();

  useEffect(() => { initialize(); }, [initialize]);
  // Auto-cleanup past rides on every app load
  useEffect(() => { cleanupPastRides(); }, []);

  /* Subscribe to realtime notifications once logged in */
  useRealtimeNotifications(user?.id);

  return (
    <div className="min-h-screen bg-beige-50 font-sans">
      {user && <Header />}
      <ToastContainer />
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public */}
          <Route path="/" element={user ? <Navigate to={user.user_type === 'admin' ? '/admin' : user.user_type === 'pending_admin' ? '/pending-admin' : user.user_type === 'both' ? '/unified' : user.user_type === 'driver' ? '/driver' : '/student'} /> : <Landing />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/rides" element={<RideSearch />} />
          <Route path="/rides/search" element={<RideSearch />} />
          <Route path="/rides/:id" element={<BookRide />} />
          <Route path="/rides/:id/book" element={<BookRide />} />
          <Route path="/bookings" element={<ProtectedRoute roles={['student']}><Bookings /></ProtectedRoute>} />
          <Route path="/tracking/:rideId" element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />
          <Route path="/chat/:rideId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

          {/* Driver */}
          <Route path="/driver" element={<ProtectedRoute roles={['driver']}><DriverDashboard /></ProtectedRoute>} />
          <Route path="/rides/create" element={<ProtectedRoute roles={['driver']}><CreateRide /></ProtectedRoute>} />
          <Route path="/verification" element={<ProtectedRoute roles={['driver']}><Verification /></ProtectedRoute>} />

          {/* Unified */}
          <Route path="/unified" element={<ProtectedRoute roles={['both']}><UnifiedDashboard /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="/pending-admin" element={<ProtectedRoute roles={['pending_admin']}><PendingAdmin /></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
