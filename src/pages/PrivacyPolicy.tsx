import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo, { LogoText } from '../components/common/Logo';
import { PiArrowLeftBold } from 'react-icons/pi';
import T, { FONT } from '../lib/theme';

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight:'100vh',background:T.bg }}>
      <nav style={{ padding:'16px 24px',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',gap:16,background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:10 }}>
        <Link to="/" style={{ display:'flex',alignItems:'center',gap:8,textDecoration:'none',color:'#0F172A' }}><PiArrowLeftBold size={18}/> <Logo size={28}/> <LogoText/></Link>
      </nav>
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} style={{ maxWidth:720,margin:'0 auto',padding:'48px 24px 80px' }}>
        <h1 style={{ fontSize:32,fontWeight:800,color:T.dark,fontFamily:FONT.heading }}>Privacy Policy</h1>
        <p style={{ color:T.muted,fontSize:13,marginTop:4 }}>Last updated: May 2026</p>
        <div style={{ marginTop:32,color:T.gray,lineHeight:1.8,fontSize:15 }}>
          <Section t="1. Information We Collect">We collect information you provide when registering: name, university email, phone number, and profile photo. For drivers, we additionally collect license details, vehicle information, and verification documents.</Section>
          <Section t="2. How We Use Your Information">Your data is used to: facilitate ride matching, verify university affiliation, process payments via Razorpay, enable real-time ride tracking, send notifications, and improve our services.</Section>
          <Section t="3. Data Sharing">We do not sell your data. Information is shared only with: your ride partner (limited profile info), payment processors (Razorpay), and university administration if required for safety investigations.</Section>
          <Section t="4. Location Data">Live location is collected only during active rides for tracking purposes. Drivers share location while offering rides. You can disable location sharing at any time.</Section>
          <Section t="5. Data Security">All data is encrypted in transit (TLS) and at rest. We use Supabase with Row Level Security (RLS) to ensure users can only access their own data.</Section>
          <Section t="6. Your Rights">You may request data deletion by contacting us. You can update your profile information at any time through the app settings.</Section>
          <Section t="7. Contact">For privacy concerns, email: privacy@ridemitra.in or contact the student IT helpdesk at JC Bose University (YMCA), Faridabad.</Section>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ t, children }: { t:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:24 }}>
      <h3 style={{ fontSize:17,fontWeight:700,color:T.dark,marginBottom:6,fontFamily:FONT.heading }}>{t}</h3>
      <p>{children}</p>
    </div>
  );
}
