import { motion } from 'framer-motion';
import { PiShieldWarningBold, PiArrowLeftBold } from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

export default function PendingAdmin() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(180deg, ${T.bg}, ${T.gray100})`, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'Inter', sans-serif" }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:T.surface, borderRadius:24, padding:40, maxWidth:480, width:'100%', textAlign:'center', border:`1px solid ${T.border}`, boxShadow:'0 24px 48px rgba(0,0,0,0.04)' }}>
        
        <div style={{ width:80, height:80, borderRadius:24, background:T.orangeLight, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', color:T.orange }}>
          <PiShieldWarningBold size={40}/>
        </div>
        
        <h1 style={{ fontSize:28, fontWeight:800, color:T.text, fontFamily:FONT.heading, marginBottom:12 }}>Admin Approval Pending</h1>
        <p style={{ color:T.textSec, fontSize:15, lineHeight:1.6, marginBottom:32 }}>
          Your account is currently waiting for approval from an existing administrator. You will be notified once your admin privileges are granted.
        </p>

        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={handleLogout}
          style={{ width:'100%', padding:'16px', borderRadius:16, border:`1px solid ${T.border}`, background:T.surface, color:T.text, fontWeight:700, fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <PiArrowLeftBold size={18}/> Return to Login
        </motion.button>
      </motion.div>
    </div>
  );
}
