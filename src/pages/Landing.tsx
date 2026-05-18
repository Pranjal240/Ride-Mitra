import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PiShieldCheckBold, PiMapPinBold, PiCarBold, PiLightningBold, PiNavigationArrowBold, PiArrowRightBold, PiClockBold, PiUsersBold, PiGraduationCapBold, PiLockBold, PiStarBold, PiChatCircleBold } from 'react-icons/pi';
import Logo, { LogoText } from '../components/common/Logo';
import T, { FONT } from '../lib/theme';
import { useGlobalScrollReveal, useScrollReveal, useCountUp, useParallax } from '../hooks/useScrollAnimation';
import { LocationSearch } from '../components/maps';

/* ── Splash ── */
function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
      style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        background:T.heroGrad }}>
      <motion.div initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ duration:0.6 }}>
        <Logo size={100} light />
      </motion.div>
      <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.5 }}>
        <LogoText light />
      </motion.div>
      <motion.p initial={{ opacity:0 }} animate={{ opacity:0.7 }} transition={{ delay:0.8 }}
        style={{ color:'rgba(255,255,255,0.7)',fontSize:14,marginTop:8,fontFamily:FONT.body }}>Campus Carpooling</motion.p>
      <div style={{ width:180,height:3,background:'rgba(255,255,255,0.15)',borderRadius:10,marginTop:28,overflow:'hidden' }}>
        <motion.div initial={{ x:'-100%' }} animate={{ x:'250%' }} transition={{ duration:1,repeat:Infinity,ease:'easeInOut' }}
          style={{ height:'100%',width:'40%',background:T.gold,borderRadius:10 }} />
      </div>
    </motion.div>
  );
}

/* ── Button ── */
function Btn({ variant='primary', children, style:s, ...p }: any) {
  const base: any = { display:'inline-flex',alignItems:'center',gap:8,padding:'13px 30px',borderRadius:14,fontSize:15,fontWeight:600,
    cursor:'pointer',fontFamily:FONT.body,transition:'all 0.35s',border:'none',letterSpacing:'-0.01em' };
  const v: Record<string,any> = {
    primary:{ background:T.heroGrad,color:'white',boxShadow:`0 4px 16px rgba(27,43,75,0.25)` },
    gold:{ background:T.goldGrad,color:'white',boxShadow:`0 4px 16px rgba(200,149,108,0.3)` },
    ghost:{ background:'transparent',color:T.navy,border:`1.5px solid ${T.gray200}` },
    white:{ background:'white',color:T.navy,boxShadow:'0 4px 14px rgba(0,0,0,0.08)' },
    whiteOutline:{ background:'transparent',color:'white',border:'2px solid rgba(255,255,255,0.6)' },
  };
  return (
    <motion.button whileHover={{ scale:1.03,y:-2 }} whileTap={{ scale:0.97 }}
      style={{ ...base,...v[variant],...s }} {...p}>
      {children}
    </motion.button>
  );
}

/* ── Animated Counter ── */
function StatNum({ target, label, icon }: { target:number; label:string; icon:React.ReactNode }) {
  const { ref, visible } = useScrollReveal(0.3);
  const count = useCountUp(target, 1400, visible);
  return (
    <div ref={ref} style={{ textAlign:'center' }}>
      <div style={{ width:52,height:52,borderRadius:14,background:T.gold50,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',color:T.gold }}>
        {icon}
      </div>
      <p style={{ fontSize:36,fontWeight:800,fontFamily:FONT.heading,color:T.navy }}>{count}+</p>
      <p style={{ fontSize:14,color:T.gray,marginTop:4 }}>{label}</p>
    </div>
  );
}

/* ══════════ LANDING PAGE ══════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [splash, setSplash] = useState(() => !sessionStorage.getItem('splash_shown'));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const parallaxOffset = useParallax(0.2);

  // Activate scroll animations after mount
  useGlobalScrollReveal();

  const handleSearch = () => {
    if (from.trim() || to.trim()) navigate(`/rides?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    else navigate('/rides');
  };

  const handleSplashDone = () => { setSplash(false); sessionStorage.setItem('splash_shown','1'); };

  return (
    <>
      <AnimatePresence>{splash && <Splash onDone={handleSplashDone}/>}</AnimatePresence>

      <div style={{ minHeight:'100vh', background:T.bg, overflow:'hidden' }}>

        {/* ═══════════ TOP HEADER ═══════════ */}
        <header className="mobile-padding" style={{ 
          position:'absolute', top:0, left:0, right:0, padding:'20px 40px', 
          display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:10,
          background: 'linear-gradient(180deg, rgba(10, 18, 40, 0.7) 0%, rgba(10, 18, 40, 0) 100%)',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Logo size={32} light />
            <LogoText light />
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Btn variant="whiteOutline" style={{ 
              padding:'10px 24px', 
              fontSize:15, 
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }} onClick={() => navigate('/login')}>
              <PiLockBold size={16} /> Log In
            </Btn>
          </motion.div>
        </header>

        {/* ═══════════ HERO ═══════════ */}
        <section style={{ position:'relative', minHeight:'92vh', display:'flex', alignItems:'center', overflow:'hidden' }}>
          {/* Deep navy background */}
          <div style={{ position:'absolute', inset:0, background:T.heroGrad, zIndex:0 }} />
          {/* Subtle geometric pattern */}
          <div style={{ position:'absolute', inset:0, opacity:0.04,
            backgroundImage:'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize:'32px 32px', zIndex:1 }} />
          {/* Gold accent orb */}
          <motion.div animate={{ scale:[1,1.15,1], opacity:[0.08,0.15,0.08] }} transition={{ duration:8,repeat:Infinity }}
            style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
              background:`radial-gradient(circle, ${T.gold}40, transparent 70%)`, top:'-5%', right:'10%', zIndex:1 }} />
          {/* Small floating shapes */}
          <motion.div animate={{ y:[-10,10,-10], rotate:[0,180,360] }} transition={{ duration:14,repeat:Infinity }}
            style={{ position:'absolute', top:'20%', right:'25%', width:20, height:20, borderRadius:4, border:'2px solid rgba(200,149,108,0.2)', zIndex:1, transform:'rotate(45deg)' }} />
          <motion.div animate={{ y:[8,-8,8] }} transition={{ duration:6,repeat:Infinity }}
            style={{ position:'absolute', bottom:'30%', left:'15%', width:8, height:8, borderRadius:'50%', background:T.gold, opacity:0.25, zIndex:1 }} />

          {/* Content */}
          <div className="mobile-grid-stack mobile-reverse" style={{ position:'relative', zIndex:2, width:'100%', maxWidth:1200, margin:'0 auto', padding:'0 24px',
            display:'grid', gridTemplateColumns:'1fr 400px', gap:60, alignItems:'center' }}>

            {/* Left: Copy */}
            <motion.div initial={{ opacity:0,y:40 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.8, delay:splash?2.4:0.1 }}>
              {/* Tag */}
              <motion.div initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:splash?2.6:0.3 }}
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:T.rFull,
                  background:'rgba(200,149,108,0.15)', border:'1px solid rgba(200,149,108,0.25)', marginBottom:24 }}>
                <PiGraduationCapBold size={14} color={T.gold} />
                <span style={{ fontSize:13, color:T.gold, fontWeight:600 }}>JC Bose University (YMCA), Faridabad</span>
              </motion.div>

              <h1 style={{ fontSize:'clamp(36px,5vw,56px)', fontWeight:800, color:'white', lineHeight:1.1,
                fontFamily:FONT.heading, letterSpacing:'-0.02em' }}>
                Your Campus<br/>
                <span style={{ color:T.gold }}>Ride Network</span>
              </h1>

              <p style={{ fontSize:17, color:'rgba(255,255,255,0.6)', marginTop:16, maxWidth:440, lineHeight:1.7 }}>
                Safe, affordable carpooling exclusively for university students. Find rides, share costs, and travel together.
              </p>

              <div style={{ display:'flex', gap:12, marginTop:32, flexWrap:'wrap' }}>
                <Btn variant="gold" onClick={() => navigate('/rides')}>
                  <PiNavigationArrowBold size={16}/> Find a Ride <PiArrowRightBold size={14}/>
                </Btn>
                <Btn variant="whiteOutline" onClick={() => navigate('/login')}>
                  <PiCarBold size={16}/> Offer a Ride
                </Btn>
              </div>

              {/* Trust badges */}
              <div style={{ display:'flex', gap:20, marginTop:36 }}>
                {[
                  { icon:<PiShieldCheckBold size={14}/>, t:'Verified Students' },
                  { icon:<PiMapPinBold size={14}/>, t:'Live Tracking' },
                  { icon:<PiLockBold size={14}/>, t:'Secure Payments' },
                ].map((b,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.65)', fontSize:13 }}>
                    <span style={{ color:T.gold }}>{b.icon}</span> {b.t}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Search Card */}
            <motion.div initial={{ opacity:0,y:30,scale:0.95 }} animate={{ opacity:1,y:0,scale:1 }}
              transition={{ duration:0.7, delay:splash?2.8:0.4 }}
              style={{ background:'white', borderRadius:20, padding:32, boxShadow:'0 24px 64px rgba(0,0,0,0.15)',
                border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:24 }}>
                <div style={{ width:36,height:36,borderRadius:10,background:T.navy50,display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <PiMapPinBold size={18} color={T.navy}/>
                </div>
                <h3 style={{ fontSize:18,fontWeight:700,color:T.dark,fontFamily:FONT.heading }}>Where are you going?</h3>
              </div>

              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                <LocationSearch
                  placeholder="From — e.g. YMCA Campus Gate"
                  icon="pickup"
                  onLocationSelect={(loc) => setFrom(loc.name)}
                  value={from}
                />
                <LocationSearch
                  placeholder="To — e.g. Faridabad Station"
                  icon="drop"
                  onLocationSelect={(loc) => setTo(loc.name)}
                  value={to}
                />

                <motion.button whileHover={{ scale:1.02,boxShadow:`0 8px 28px rgba(27,43,75,0.25)` }} whileTap={{ scale:0.97 }}
                  onClick={handleSearch}
                  style={{ width:'100%',padding:'14px',borderRadius:14,border:'none',background:T.heroGrad,
                    color:'white',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:FONT.body,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:4,transition:'all 0.3s' }}>
                  Search Rides <PiArrowRightBold size={14}/>
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Wave separator */}
          <div style={{ position:'absolute',bottom:0,left:0,right:0,zIndex:3 }}>
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display:'block',width:'100%',height:80 }}>
              <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill={T.bg}/>
            </svg>
          </div>
        </section>

        {/* ═══════════ FEATURES ═══════════ */}
        <section className="mobile-padding" style={{ padding:'80px 24px 60px', maxWidth:1000, margin:'0 auto' }}>
          <div className="reveal mobile-grid-stack" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64,height:64,margin:'0 auto 16px',background:T.navy50,color:T.navy,borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <PiGraduationCapBold size={32}/>
              </div>
              <h3 style={{ fontSize:20,fontWeight:800,color:T.dark,fontFamily:FONT.heading,marginBottom:8 }}>Campus Exclusive</h3>
              <p style={{ fontSize:15,color:T.gray,lineHeight:1.5 }}>Available only to verified university students and faculty for maximum safety.</p>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64,height:64,margin:'0 auto 16px',background:T.gold50,color:T.goldDark,borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <PiCarBold size={32}/>
              </div>
              <h3 style={{ fontSize:20,fontWeight:800,color:T.dark,fontFamily:FONT.heading,marginBottom:8 }}>Cost Effective</h3>
              <p style={{ fontSize:15,color:T.gray,lineHeight:1.5 }}>Split fuel costs directly with your peers. No hidden surge pricing or platform fees.</p>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64,height:64,margin:'0 auto 16px',background:T.greenLight,color:T.green,borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <PiShieldCheckBold size={32}/>
              </div>
              <h3 style={{ fontSize:20,fontWeight:800,color:T.dark,fontFamily:FONT.heading,marginBottom:8 }}>Live SOS Tracking</h3>
              <p style={{ fontSize:15,color:T.gray,lineHeight:1.5 }}>Every ride is GPS tracked with an emergency SOS button linked to your contacts.</p>
            </div>
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section className="mobile-padding" style={{ padding:'60px 24px 80px', background:'white' }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:48 }}>
              <span style={{ fontSize:13,fontWeight:600,color:T.gold,textTransform:'uppercase',letterSpacing:2 }}>Simple & Secure</span>
              <h2 style={{ fontSize:36,fontWeight:800,color:T.dark,marginTop:8,fontFamily:FONT.heading }}>
                How It <span style={{ color:T.gold }}>Works</span>
              </h2>
              <p style={{ color:T.gray,fontSize:16,marginTop:8,maxWidth:500,margin:'8px auto 0' }}>
                Three simple steps to start sharing rides with your campus community
              </p>
            </div>

            <div className="reveal-stagger mobile-grid-stack" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:28 }}>
              {[
                { num:'01', title:'Sign Up', desc:'Register with your university email. Quick verification keeps the community safe.', icon:<PiGraduationCapBold size={28}/>, color:T.navy },
                { num:'02', title:'Find or Create', desc:'Search available rides or create your own. Set your route, time, and seats.', icon:<PiNavigationArrowBold size={28}/>, color:T.gold },
                { num:'03', title:'Travel Together', desc:'Book your seat, track in real-time, and share the journey safely.', icon:<PiCarBold size={28}/>, color:T.green },
              ].map((step,i) => (
                <motion.div key={i} whileHover={{ y:-8, boxShadow:T.shadow3 }}
                  style={{ padding:32, borderRadius:20, background:T.bg, border:`1px solid ${T.border}`,
                    transition:'all 0.4s', cursor:'default', position:'relative', overflow:'hidden' }}>
                  {/* Step number watermark */}
                  <span style={{ position:'absolute',top:10,right:14,fontSize:72,fontWeight:900,
                    color:i===0?T.navy:i===1?T.gold:T.green,
                    fontFamily:FONT.heading,lineHeight:1,opacity:0.12 }}>{step.num}</span>
                  <div style={{ width:56,height:56,borderRadius:16,background:i===0?T.navy50:i===1?T.gold50:T.greenLight,
                    display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,color:step.color,position:'relative',zIndex:1 }}>
                    {step.icon}
                  </div>
                  <h3 style={{ fontSize:20,fontWeight:700,color:T.dark,marginBottom:8,fontFamily:FONT.heading,position:'relative',zIndex:1 }}>{step.title}</h3>
                  <p style={{ fontSize:14,color:T.gray,lineHeight:1.7,position:'relative',zIndex:1 }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FEATURES ═══════════ */}
        <section className="mobile-padding" style={{ padding:'80px 24px', background:T.bg }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:48 }}>
              <span style={{ fontSize:13,fontWeight:600,color:T.gold,textTransform:'uppercase',letterSpacing:2 }}>Why Choose Us</span>
              <h2 style={{ fontSize:36,fontWeight:800,color:T.dark,marginTop:8,fontFamily:FONT.heading }}>
                Built for <span style={{ color:T.navy }}>Campus Life</span>
              </h2>
            </div>

            <div className="reveal-stagger mobile-grid-stack" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }}>
              {[
                { icon:<PiLightningBold size={22}/>, title:'Instant Matching', desc:'Find rides departing within minutes. Real-time availability updates.', accent:T.gold },
                { icon:<PiMapPinBold size={22}/>, title:'Live GPS Tracking', desc:'Track your ride in real-time. Share location with emergency contacts.', accent:T.green },
                { icon:<PiShieldCheckBold size={22}/>, title:'Verified Community', desc:'Only verified university email holders. Document-verified drivers.', accent:T.navy },
                { icon:<PiChatCircleBold size={22}/>, title:'In-Ride Chat', desc:'Coordinate pickup points with your driver through secure messaging.', accent:T.navyLight },
              ].map((f,i) => (
                <motion.div key={i} whileHover={{ y:-4, boxShadow:T.shadow2 }}
                  style={{ display:'flex', gap:16, padding:24, borderRadius:16, background:'white', border:`1px solid ${T.border}`,
                    transition:'all 0.35s', cursor:'default' }}>
                  <div style={{ width:48,height:48,borderRadius:12,background:`${f.accent}12`,flexShrink:0,
                    display:'flex',alignItems:'center',justifyContent:'center',color:f.accent }}>
                    {f.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize:16,fontWeight:700,color:T.dark,marginBottom:4,fontFamily:FONT.heading }}>{f.title}</h4>
                    <p style={{ fontSize:14,color:T.gray,lineHeight:1.6 }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ CTA BANNER ═══════════ */}
        <section className="reveal-scale mobile-padding" style={{ padding:'0 24px', marginBottom:80 }}>
          <div className="mobile-padding" style={{ maxWidth:1000, margin:'0 auto', borderRadius:24, background:T.heroGrad, padding:'60px 48px',
            position:'relative', overflow:'hidden', textAlign:'center' }}>
            {/* Decorative shapes */}
            <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', border:'2px solid rgba(200,149,108,0.15)',
              top:-60, right:-40 }} />
            <div style={{ position:'absolute', width:120, height:120, borderRadius:'50%', background:'rgba(200,149,108,0.08)',
              bottom:-30, left:-20 }} />

            <h2 style={{ fontSize:32, fontWeight:800, color:'white', fontFamily:FONT.heading, position:'relative', zIndex:1 }}>
              Ready to ride <span style={{ color:T.gold }}>smarter</span>?
            </h2>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:16, marginTop:8, maxWidth:420, margin:'8px auto 0', position:'relative', zIndex:1 }}>
              Join the campus community that's saving money and reducing emissions together.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:28, position:'relative', zIndex:1 }}>
              <Btn variant="gold" onClick={() => navigate('/login')}>Get Started <PiArrowRightBold size={14}/></Btn>
              <Btn variant="whiteOutline" onClick={() => navigate('/rides')}>Browse Rides</Btn>
            </div>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer style={{ background:T.navy, padding:'48px 24px 32px', color:'rgba(255,255,255,0.7)' }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16, paddingBottom:24,
              borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Logo size={28} light /> <LogoText light />
              </div>
              <div style={{ display:'flex', gap:20 }}>
                {[
                  { to:'/privacy', label:'Privacy' },
                  { to:'/terms', label:'Terms' },
                ].map(l => (
                  <Link key={l.to} to={l.to} style={{ color:'rgba(255,255,255,0.6)',fontSize:13,textDecoration:'none',transition:'color 0.3s' }}
                    onMouseEnter={e=>{e.currentTarget.style.color=T.gold;}}
                    onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.6)';}}>{l.label}</Link>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:20, flexWrap:'wrap', gap:8 }}>
              <p style={{ fontSize:13 }}>© 2026 RideMitra — JC Bose University (YMCA)</p>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>Built with ❤️ for campus safety</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
