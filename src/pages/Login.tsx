import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PiShieldCheckBold, PiMapPinBold, PiCheckCircleBold, PiArrowLeftBold, PiGoogleLogoBold, PiPhoneBold, PiEnvelopeBold, PiUserBold } from 'react-icons/pi';
import { RiAdminLine, RiCarLine, RiUserSmileLine } from 'react-icons/ri';
import { useAuthStore } from '../hooks/useStore';
import { supabase } from '../lib/supabase';
import Logo, { LogoText } from '../components/common/Logo';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

type Role = 'student' | 'driver' | 'admin';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as Role) || 'student';
  const [role, setRole] = useState<Role>(
    ['student', 'driver', 'admin'].includes(initialRole) ? initialRole : 'student'
  );
  useEffect(() => {
    const r = searchParams.get('role') as Role;
    if (r && ['student', 'driver', 'admin'].includes(r)) setRole(r);
  }, [searchParams]);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['','','','','','']);
  const [otpHash, setOtpHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'choose'|'otp'>('choose');
  const { setSelectedRole } = useAuthStore();
  const navigate = useNavigate();

  async function handleGoogle() {
    setLoading(true);
    setSelectedRole(role);
    localStorage.setItem('selectedRole', role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { alert(error.message); setLoading(false); }
  }

  async function handleSendOtp() {
    if (!phone || phone.length < 10) return alert('Enter a valid 10-digit phone number');
    setLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpHash(data.otp_hash);
      setStep('otp');
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    const code = otp.join('');
    if (code.length < 6) return alert('Enter 6-digit OTP');
    setLoading(true);
    try {
      if (btoa(code) === otpHash) {
        setSelectedRole(role);
        localStorage.setItem('selectedRole', role);
        const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
        if (error) throw error;
        navigate('/');
      } else {
        alert('Invalid OTP. Please try again.');
      }
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  }

  function handleOtpInput(idx: number, val: string) {
    if (val.length > 1) return;
    const n = [...otp]; n[idx] = val; setOtp(n);
    if (val && idx < 5) document.getElementById(`otp-${idx+1}`)?.focus();
  }
  function handleOtpKey(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) document.getElementById(`otp-${idx-1}`)?.focus();
  }

  const tabs: { key: Role; label: string; icon: React.ReactNode; color: string }[] = [
    { key:'student', label:'Rider', icon:<RiUserSmileLine size={16}/>, color:T.blue },
    { key:'driver', label:'Driver', icon:<RiCarLine size={16}/>, color:T.green },
    { key:'admin', label:'Admin', icon:<RiAdminLine size={16}/>, color:T.red },
  ];

  const roleTheme: Record<Role, { title: string; accent: string; sub: string; badges: { t: string; color: string; icon: React.ReactNode }[] }> = {
    student: {
      title: 'Sign in as a Rider',
      accent: T.blue,
      sub: 'Search verified drivers, split fares, and track every trip live from your JC Bose UST portal.',
      badges: [
        { t:'Verified campus email only', color:T.green, icon:<PiShieldCheckBold size={16}/> },
        { t:'Live ride tracking + SOS', color:T.blue, icon:<PiMapPinBold size={16}/> },
        { t:'Split fares at the pump', color:T.green, icon:<PiCheckCircleBold size={16}/> },
      ],
    },
    driver: {
      title: 'Sign in as a Driver',
      accent: T.green,
      sub: 'Offer seats on trips you\'re already making. Cover fuel, meet peers, and get paid instantly.',
      badges: [
        { t:'Vehicle & licence verification', color:T.green, icon:<PiShieldCheckBold size={16}/> },
        { t:'Post rides in under a minute', color:T.blue, icon:<PiMapPinBold size={16}/> },
        { t:'Instant in-app payouts', color:T.green, icon:<PiCheckCircleBold size={16}/> },
      ],
    },
    admin: {
      title: 'Sign in as Admin',
      accent: T.red,
      sub: 'University staff dashboard — driver verification, SOS command centre, and community reports.',
      badges: [
        { t:'Verify new driver documents', color:T.red, icon:<PiShieldCheckBold size={16}/> },
        { t:'Respond to live SOS alerts', color:T.red, icon:<PiMapPinBold size={16}/> },
        { t:'Community & ride audit logs', color:T.red, icon:<PiCheckCircleBold size={16}/> },
      ],
    },
  };
  const rt = roleTheme[role];

  return (
    <div style={{ minHeight:'100vh', display:'flex', position:'relative', overflow:'hidden', overflowX:'hidden' }}>
      {/* Left Gradient Panel */}
      <div className="mobile-hide" style={{ flex:'1 1 50%', background:T.heroGrad,
        display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 48px', position:'relative', overflow:'hidden' }}>
        {/* Animated orbs */}
        <motion.div animate={{ scale:[1,1.3,1], opacity:[0.1,0.2,0.1] }} transition={{ duration:8,repeat:Infinity }}
          style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.1),transparent 70%)', top:'-10%', right:'-10%' }}/>
        <motion.div animate={{ scale:[1,1.2,1], opacity:[0.08,0.15,0.08] }} transition={{ duration:12,repeat:Infinity }}
          style={{ position:'absolute', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.08),transparent 70%)', bottom:'10%', left:'-5%' }}/>
        {/* Grid pattern */}
        <div style={{ position:'absolute', inset:0, opacity:0.03, backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize:'28px 28px' }}/>
        {/* Floating shapes */}
        <motion.div animate={{ y:[-15,15,-15], rotate:[0,90,0] }} transition={{ duration:10,repeat:Infinity }}
          style={{ position:'absolute', top:'18%', right:'20%', width:40, height:40, borderRadius:10, border:'2px solid rgba(255,255,255,0.08)', transform:'rotate(45deg)' }}/>
        <motion.div animate={{ y:[10,-10,10] }} transition={{ duration:6,repeat:Infinity }}
          style={{ position:'absolute', bottom:'30%', right:'35%', width:8, height:8, borderRadius:'50%', background:T.orange, opacity:0.4 }}/>
        <motion.div animate={{ x:[-10,10,-10] }} transition={{ duration:8,repeat:Infinity }}
          style={{ position:'absolute', top:'60%', left:'15%', width:12, height:12, borderRadius:'50%', background:T.red, opacity:0.3 }}/>

        <motion.div initial={{ opacity:0,y:30 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.8 }} style={{ position:'relative', zIndex:2 }}>
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.6)', textDecoration:'none', fontSize:13, marginBottom:36, transition:'all 0.3s' }}
            onMouseEnter={e=>{e.currentTarget.style.color='white';}} onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.6)';}}>
            <PiArrowLeftBold size={14}/> Back to Home
          </Link>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:7, padding:'5px 12px', borderRadius:100,
            background: `${rt.accent}22`, border: `1px solid ${rt.accent}55`, marginBottom:20,
          }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: rt.accent, boxShadow:`0 0 8px ${rt.accent}` }}/>
            <span style={{ fontSize:11, color:'white', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>
              JC Bose UST · {role === 'student' ? 'Rider' : role === 'driver' ? 'Driver' : 'Admin'} Portal
            </span>
          </div>
          <h1 key={role} style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, color:'white', lineHeight:1.15, fontFamily:FONT.heading, animation: 'slideUp 0.5s cubic-bezier(0.2, 0.9, 0.25, 1)' }}>
            {rt.title.split(' as ')[0]} as<br/>
            <span style={{ color: rt.accent }}>
              a {rt.title.split(' as ')[1] || 'user'}
            </span>
          </h1>
          <p key={`sub-${role}`} style={{ color:'rgba(255,255,255,0.65)', fontSize:15, marginTop:14, maxWidth:340, lineHeight:1.7, animation: 'slideUp 0.6s cubic-bezier(0.2, 0.9, 0.25, 1)' }}>
            {rt.sub}
          </p>
        </motion.div>

        {/* Feature badges */}
        <motion.div key={`badges-${role}`} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}
          style={{ display:'flex', flexDirection:'column', gap:10, marginTop:36, position:'relative', zIndex:2 }}>
          {rt.badges.map((f,i)=>(
            <motion.div key={i} initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.6+i*0.1 }}
              whileHover={{ x:6, background:'rgba(27,43,75,0.08)' }}
              style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'10px 16px', borderRadius:12, width:'fit-content',
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.06)', transition:'all 0.3s', cursor:'default' }}>
              <div style={{ color:f.color }}>{f.icon}</div>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>{f.t}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right — Login Card */}
      <div className="mobile-login-right" style={{ flex:'1 1 50%', display:'flex', alignItems:'center', justifyContent:'center', padding:40, background:T.bg, position:'relative', overflowX:'hidden' }}>
        {/* Subtle bg blob */}
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle,${T.blue50},transparent 70%)`, top:'10%', right:'10%', pointerEvents:'none' }}/>

        <motion.div initial={{ opacity:0,scale:0.95,y:20 }} animate={{ opacity:1,scale:1,y:0 }} transition={{ duration:0.6,delay:0.2 }}
          className="mobile-login-card"
          style={{ width:'100%', maxWidth:420, background:T.surface, borderRadius:24, overflow:'hidden',
            boxShadow:`0 20px 60px rgba(27,43,75,0.08)`, border:`1px solid ${T.border}`, position:'relative', zIndex:2 }}>

          {/* Card header — role-accent gradient */}
          <div className="mobile-login-header" style={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${rt.accent} 140%)`,
            padding:'28px 32px', textAlign:'center', position:'relative', overflow:'hidden',
            transition: 'background 0.4s',
          }}>
            <div style={{ position:'absolute', width:120, height:120, borderRadius:'50%', background:`${rt.accent}22`, top:-40, right:-30, filter:'blur(20px)' }}/>
            <div style={{ position:'absolute', width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.06)', bottom:-24, left:20, filter:'blur(16px)' }}/>
            <motion.div initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ delay:0.3 }}>
              <Logo size={44} light/>
            </motion.div>
            <motion.h2 key={`h2-${role}`} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.15 }}
              style={{ color:'white', fontSize:22, fontWeight:700, marginTop:8, fontFamily:FONT.heading }}>
              {role === 'student' ? 'Rider Sign In' : role === 'driver' ? 'Driver Sign In' : 'Admin Sign In'}
            </motion.h2>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
              style={{ color:'rgba(255,255,255,0.6)', fontSize:12, marginTop:2, letterSpacing:1.5 }}>JC BOSE UNIVERSITY · YMCA</motion.p>
          </div>

          {/* Role tabs */}
          <div className="mobile-login-tabs" style={{ display:'flex', padding:'0 32px', borderBottom:`1px solid ${T.border}` }}>
            {tabs.map(t=>(
              <motion.button key={t.key} whileTap={{ scale:0.95 }} onClick={()=>setRole(t.key)}
                style={{ flex:1, padding:'14px 0', fontSize:13, fontWeight:600, cursor:'pointer', border:'none',
                  borderBottom: role===t.key ? `2px solid ${t.color}` : '2px solid transparent',
                  background:'transparent', color: role===t.key ? t.color : T.muted, transition:'all 0.3s', fontFamily:'inherit',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {t.icon} {t.label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity:0,x:step==='otp'?20:-20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:step==='otp'?-20:20 }}
              className="mobile-login-body"
              style={{ padding:'24px 32px 32px' }}>

              {step === 'choose' ? (<>
                {/* Google */}
                <motion.button whileHover={{ scale:1.01, boxShadow:`0 6px 24px rgba(27,43,75,0.1)` }} whileTap={{ scale:0.98 }}
                  onClick={handleGoogle} disabled={loading}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'13px', borderRadius:14,
                    border:`1.5px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:14, fontWeight:600, color:T.text,
                    transition:'all 0.3s', fontFamily:'inherit' }}>
                  {loading ? <Spin/> : <PiGoogleLogoBold size={18} color="#4285F4"/>}
                  Continue with Google
                </motion.button>

                {/* Divider */}
                <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
                  <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${T.border})` }}/>
                  <span style={{ fontSize:12, color:T.muted, whiteSpace:'nowrap' }}>or with phone</span>
                  <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${T.border},transparent)` }}/>
                </div>

                {/* Phone input */}
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ padding:'12px 10px', borderRadius:12, background:T.bg, fontSize:14, fontWeight:600, color:T.text, border:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>+91</div>
                  <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="Phone Number" maxLength={10} aria-label="Phone number"
                    style={{ flex:1, padding:'12px 14px', borderRadius:12, border:`1px solid ${T.border}`, background:T.bg, fontSize:14, outline:'none', color:T.text, fontFamily:'inherit', transition:'all 0.3s' }}
                    onFocus={e=>{e.currentTarget.style.borderColor=T.navy;e.currentTarget.style.boxShadow=`0 0 0 3px ${T.navy}18`;}}
                    onBlur={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow='none';}}/>
                </div>

                <motion.button whileHover={{ scale:1.02, boxShadow:`0 8px 24px ${T.navy}30` }} whileTap={{ scale:0.97 }}
                  onClick={handleSendOtp} disabled={loading||phone.length<10}
                  style={{ width:'100%', padding:'14px', borderRadius:14, border:'none',
                    background: phone.length>=10 ? `linear-gradient(135deg, ${rt.accent}, ${T.navy})` : T.border,
                    cursor: phone.length>=10?'pointer':'not-allowed', fontSize:14, fontWeight:700, color:'white', marginTop:12, fontFamily:'inherit',
                    transition:'all 0.3s', opacity: phone.length>=10?1:0.5 }}>
                  {loading ? <Spin light/> : <>Send OTP <PiPhoneBold size={14} style={{marginLeft:4}}/></>}
                </motion.button>
              </>) : (<>
                {/* OTP step */}
                <button onClick={()=>{setStep('choose');setOtp(['','','','','','']);}}
                  style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, color:T.navy, background:'none', border:'none', cursor:'pointer', marginBottom:16, fontFamily:'inherit' }}>
                  <PiArrowLeftBold size={14}/> Change number
                </button>
                <p style={{ fontSize:14, color:T.textSec, marginBottom:4 }}>OTP sent to <strong style={{color:T.text}}>+91 {phone}</strong></p>
                <p style={{ fontSize:12, color:T.muted, marginBottom:16 }}>Enter the 6-digit verification code</p>
                <div className="mobile-otp-row" style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:16 }}>
                  {otp.map((d,i)=>(
                    <motion.input key={i} id={`otp-${i}`} value={d} onChange={e=>handleOtpInput(i,e.target.value)}
                      onKeyDown={e=>handleOtpKey(i,e)} maxLength={1} aria-label={`OTP digit ${i+1}`}
                      initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.06 }}
                      className="mobile-otp-input"
                      style={{ width:48, height:54, textAlign:'center', fontSize:22, fontWeight:700, borderRadius:14,
                        border:`1.5px solid ${T.border}`, background:T.bg, outline:'none', color:T.text, fontFamily:'inherit', transition:'all 0.3s' }}
                      onFocus={e=>{e.currentTarget.style.borderColor=T.navy;e.currentTarget.style.boxShadow=`0 0 0 3px ${T.navy}18`;}}
                      onBlur={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow='none';}}/>
                  ))}
                </div>
                <motion.button whileHover={{ scale:1.02, boxShadow:`0 8px 28px ${T.dark}25` }} whileTap={{ scale:0.97 }}
                  onClick={handleVerifyOtp} disabled={loading||otp.join('').length<6}
                  style={{ width:'100%', padding:'14px', borderRadius:14, border:'none',
                    background:`linear-gradient(135deg, ${rt.accent}, ${T.navy})`,
                    cursor:'pointer', fontSize:15, fontWeight:700, color:'white', fontFamily:'inherit', transition:'all 0.3s' }}>
                  {loading ? <Spin light/> : 'Verify & Login'}
                </motion.button>
                <button onClick={handleSendOtp} style={{ width:'100%', marginTop:10, background:'none', border:'none', color:T.navy, fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:500, transition:'all 0.3s' }}
                  onMouseEnter={e=>{e.currentTarget.style.textDecoration='underline';}}
                  onMouseLeave={e=>{e.currentTarget.style.textDecoration='none';}}>
                  Resend OTP
                </button>
              </>)}

              <p style={{ fontSize:11, color:T.muted, textAlign:'center', marginTop:20 }}>
                <PiEnvelopeBold size={11} style={{verticalAlign:'middle',marginRight:4}}/>Only @jcboseust.ac.in emails allowed
              </p>
              <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:12 }}>
                <Link to="/terms" style={{ fontSize:12, color:T.textSec, textDecoration:'none', transition:'color 0.3s' }}
                  onMouseEnter={e=>{e.currentTarget.style.color=T.navy;}} onMouseLeave={e=>{e.currentTarget.style.color=T.textSec;}}>
                  Terms of Service
                </Link>
                <Link to="/privacy" style={{ fontSize:12, color:T.textSec, textDecoration:'none', transition:'color 0.3s' }}
                  onMouseEnter={e=>{e.currentTarget.style.color=T.navy;}} onMouseLeave={e=>{e.currentTarget.style.color=T.textSec;}}>
                  Privacy Policy
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function Spin({ light }: { light?: boolean }) {
  return <div style={{ width:18, height:18, border:`2px solid ${light?'white':T.blue}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin-slow 0.7s linear infinite' }}/>;
}
