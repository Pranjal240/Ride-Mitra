import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo, { LogoText } from '../components/common/Logo';
import { PiArrowLeftBold } from 'react-icons/pi';
import T, { FONT } from '../lib/theme';

export default function Terms() {
  return (
    <div style={{ minHeight:'100vh',background:T.bg }}>
      <nav style={{ padding:'16px 24px',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',gap:16,background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:10 }}>
        <Link to="/" style={{ display:'flex',alignItems:'center',gap:8,textDecoration:'none',color:'#0F172A' }}><PiArrowLeftBold size={18}/> <Logo size={28}/> <LogoText/></Link>
      </nav>
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} style={{ maxWidth:720,margin:'0 auto',padding:'48px 24px 80px' }}>
        <h1 style={{ fontSize:32,fontWeight:800,color:T.dark,fontFamily:FONT.heading }}>Terms of Service</h1>
        <p style={{ color:T.muted,fontSize:13,marginTop:4 }}>Last updated: May 2026</p>
        <div style={{ marginTop:32,color:T.gray,lineHeight:1.8,fontSize:15 }}>
          <Section t="1. Eligibility">RideMitra is exclusively for students, faculty, and staff of JC Bose University of Science & Technology (YMCA), Faridabad. You must have a valid @jcboseust.ac.in email to register.</Section>
          <Section t="2. Account Responsibilities">You are responsible for maintaining the confidentiality of your account. Sharing accounts or credentials is prohibited. Report unauthorized access immediately.</Section>
          <Section t="3. Driver Requirements">Drivers must possess a valid driving license, vehicle registration, and insurance. All documents must be verified through our platform before offering rides.</Section>
          <Section t="4. Ride Conduct">Users must maintain respectful behavior during rides. Harassment, discrimination, or any form of misconduct will result in immediate account suspension.</Section>
          <Section t="5. Payments">Payments are processed securely through Razorpay. Fares are agreed upon before booking. Cancellation fees may apply as per our cancellation policy.</Section>
          <Section t="6. Safety">All users agree to use the SOS feature responsibly. False emergency reports may result in account termination. We share ride details with emergency contacts when SOS is activated.</Section>
          <Section t="7. Liability">RideMitra facilitates connections between riders and drivers. We are not a transportation company and are not liable for incidents during rides. Users participate at their own risk.</Section>
          <Section t="8. Modifications">We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms.</Section>
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
