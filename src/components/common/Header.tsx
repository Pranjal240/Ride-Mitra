import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PiHouseBold, PiMagnifyingGlassBold, PiCarBold, PiBellBold, PiUserBold, PiSignOutBold, PiListBold, PiXBold, PiShieldCheckBold, PiCaretDownBold, PiMapPinBold, PiPlusBold } from 'react-icons/pi';
import { useAuthStore, useNotificationStore } from '../../hooks/useStore';
import Logo, { LogoText } from './Logo';
import T, { FONT } from '../../lib/theme';

/* Brand Tokens */
// Theme imported from shared file

export default function Header() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => { await logout(); navigate('/'); };

  const navItems = user
    ? user.user_type === 'admin'
      ? [
          { label: 'Dashboard', path: '/admin', icon: <PiHouseBold size={18}/> },
          { label: 'Users', path: '/admin/users', icon: <PiUserBold size={18}/> },
          { label: 'Verification', path: '/admin/verification', icon: <PiShieldCheckBold size={18}/> },
        ]
      : user.user_type === 'driver'
        ? [
            { label: 'Dashboard', path: '/driver', icon: <PiHouseBold size={18}/> },
            { label: 'Create Ride', path: '/rides/create', icon: <PiPlusBold size={18}/> },
            { label: 'My Rides', path: '/driver', icon: <PiCarBold size={18}/> },
          ]
        : [
            { label: 'Dashboard', path: '/student', icon: <PiHouseBold size={18}/> },
            { label: 'Find Ride', path: '/rides/search', icon: <PiMagnifyingGlassBold size={18}/> },
            { label: 'My Bookings', path: '/bookings', icon: <PiCarBold size={18}/> },
          ]
    : [];

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header style={{
      position:'sticky', top:0, zIndex:40,
      background:'rgba(255,255,255,0.82)', backdropFilter:'blur(16px)',
      borderBottom:`1px solid ${T.border}`,
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
          {/* Logo */}
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <Logo size={32}/><LogoText/>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display:'flex', alignItems:'center', gap:4 }} className="desktop-nav">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}
                style={{
                  display:'flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:12,
                  fontSize:13, fontWeight:600, textDecoration:'none', transition:'all 0.3s',
                  fontFamily:'inherit',
                  ...(isActive(item.path)
                    ? { background:T.navy, color:'white', boxShadow:'0 4px 14px rgba(27,43,75,0.25)' }
                    : { color:T.textSec }),
                }}
                onMouseEnter={e => {
                  if(!isActive(item.path)) {
                    e.currentTarget.style.background=T.navy50;
                    e.currentTarget.style.color=T.navy;
                  }
                }}
                onMouseLeave={e => {
                  if(!isActive(item.path)) {
                    e.currentTarget.style.background='transparent';
                    e.currentTarget.style.color=T.textSec;
                  }
                }}>
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {/* Bell */}
            <button onClick={()=>setProfileOpen(false)}
              style={{ position:'relative', padding:10, borderRadius:12, border:'none', background:'transparent',
                cursor:'pointer', color:T.textSec, transition:'all 0.3s' }}
              onMouseEnter={e=>{e.currentTarget.style.background=T.navy50;e.currentTarget.style.color=T.navy;}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.textSec;}}>
              <PiBellBold size={20}/>
              {unreadCount > 0 && (
                <span style={{ position:'absolute', top:2, right:2, width:18, height:18, background:T.red,
                  color:'white', fontSize:10, fontWeight:700, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'pulse 2s infinite' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <div style={{ position:'relative' }}>
              <button onClick={()=>setProfileOpen(!profileOpen)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:14, border:'none',
                  background:'transparent', cursor:'pointer', transition:'all 0.3s' }}
                onMouseEnter={e=>{e.currentTarget.style.background=T.navy50;}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt="" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:`2px solid ${T.gold}` }}/>
                ) : (
                  <div style={{ width:34, height:34, borderRadius:'50%', background:T.heroGrad,
                    display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:13, fontWeight:700 }}>
                    {initials}
                  </div>
                )}
                <PiCaretDownBold size={12} color={T.muted}/>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity:0,y:10,scale:0.95 }} animate={{ opacity:1,y:0,scale:1 }} exit={{ opacity:0,y:10,scale:0.95 }}
                    style={{ position:'absolute', right:0, marginTop:8, width:240, background:T.surface, borderRadius:16,
                      boxShadow:T.shadow3, border:`1px solid ${T.border}`, overflow:'hidden', zIndex:50 }}>
                    <div style={{ padding:16, borderBottom:`1px solid ${T.border}`, background:`linear-gradient(135deg,${T.bg},${T.navy50})` }}>
                      <p style={{ fontWeight:700, color:T.text, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {user.full_name || 'User'}
                      </p>
                      <p style={{ fontSize:11, color:T.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {user.email}
                      </p>
                      <span style={{ display:'inline-block', marginTop:6, padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600,
                        background: user.user_type==='admin' ? T.redLight : user.user_type==='driver' ? T.blueLight : T.blue50,
                        color: user.user_type==='admin' ? T.red : user.user_type==='driver' ? T.blueDark : T.blue }}>
                        {user.user_type}
                      </span>
                    </div>
                    <div style={{ padding:6 }}>
                      <Link to="/profile" onClick={()=>setProfileOpen(false)}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12,
                          fontSize:13, color:T.textSec, textDecoration:'none', transition:'all 0.3s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background=T.blue50;e.currentTarget.style.color=T.navy;}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.textSec;}}>
                        <PiUserBold size={16}/> My Profile
                      </Link>
                      <button onClick={handleLogout}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12,
                          fontSize:13, color:T.red, border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', transition:'all 0.3s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background=T.redLight;}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                        <PiSignOutBold size={16}/> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile toggle */}
            <button onClick={()=>setMenuOpen(!menuOpen)}
              style={{ display:'none', padding:10, borderRadius:12, border:'none', background:'transparent',
                cursor:'pointer', color:T.textSec }} className="mobile-toggle">
              {menuOpen ? <PiXBold size={20}/> : <PiListBold size={20}/>}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }}
              style={{ overflow:'hidden', paddingBottom:16 }}>
              {navItems.map(item => (
                <Link key={item.path} to={item.path} onClick={()=>setMenuOpen(false)}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12,
                    fontSize:14, fontWeight:600, textDecoration:'none', transition:'all 0.3s',
                    ...(isActive(item.path)
                      ? { background:T.navy, color:'white' }
                      : { color:T.textSec }),
                  }}>
                  {item.icon} {item.label}
                </Link>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
