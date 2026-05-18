import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiWarningBold, PiXBold, PiChatCircleBold, PiPaperPlaneTiltBold } from 'react-icons/pi';
import { useAuthStore } from '../../hooks/useStore';
import { supabase } from '../../lib/supabase';
import T, { FONT } from '../../lib/theme';

// Theme imported from shared file

const QUICK_CHATS = [
  "My car broke down.",
  "I am feeling unsafe.",
  "Driver is taking wrong route.",
  "Medical emergency.",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rideId?: string;
}

export default function SOSModal({ isOpen, onClose, rideId }: Props) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<{sender:'user'|'ai', text:string}[]>([
    { sender: 'ai', text: 'RideMitra Safety Assistant. If this is an emergency, press the SOS button immediately.' }
  ]);
  const [loadingSOS, setLoadingSOS] = useState(false);

  if (!isOpen) return null;

  const handleQuickChat = (text: string) => {
    setMessages(prev => [...prev, { sender:'user', text }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { sender:'ai', text: 'We received your message. If you need immediate help, please press the Red SOS button.' }]);
    }, 1000);
  };

  const triggerEmergencySOS = async () => {
    setLoadingSOS(true);
    try {
      // Create SOS record in DB
      let locationText = 'Location unavailable';
      let lat = null, lng = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          locationText = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        } catch(e) {}
      }

      await supabase.from('sos_alerts').insert({
        user_id: user?.id,
        ride_id: rideId || null,
        location: lat && lng ? { lat, lng } : null,
        message: 'Emergency SOS triggered',
        status: 'active'
      });

      // Call Twilio edge function
      const res = await fetch(`https://hcmasdaadvlrbpxexucs.supabase.co/functions/v1/send-sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.full_name || 'A user',
          userPhone: user?.phone,
          emergencyContact: user?.emergency_contact_phone,
          location: locationText
        })
      });

      if (!res.ok) throw new Error('Failed to send SOS SMS');

      setMessages(prev => [...prev, { sender:'ai', text: '🚨 SOS Alert sent to authorities and your emergency contacts with your live location.' }]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingSOS(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
          style={{ background:T.surface, borderRadius:24, width:'100%', maxWidth:400, overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:'80vh', boxShadow:'0 24px 48px rgba(0,0,0,0.2)' }}>
          
          <div style={{ background:'linear-gradient(135deg, #FEF2F2, #FFF1F2)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #FECDD3' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, color:T.red }}>
              <PiWarningBold size={24}/>
              <h3 style={{ fontSize:18, fontWeight:800, margin:0, fontFamily:FONT.heading }}>Safety Assistant</h3>
            </div>
            <button onClick={onClose} style={{ background:'transparent', border:'none', color:T.red, cursor:'pointer', padding:4 }}>
              <PiXBold size={20}/>
            </button>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:12, background:T.bg }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.sender==='user'?'flex-end':'flex-start', maxWidth:'85%' }}>
                <div style={{ background: m.sender==='user'?T.blue:'#E0E7FF', color:m.sender==='user'?'#FFF':T.text, padding:'10px 14px', borderRadius:16, borderBottomRightRadius: m.sender==='user'?4:16, borderBottomLeftRadius: m.sender==='ai'?4:16, fontSize:14, lineHeight:1.5 }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding:16, background:T.surface, borderTop:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
              {QUICK_CHATS.map((c, i) => (
                <button key={i} onClick={() => handleQuickChat(c)}
                  style={{ padding:'6px 12px', borderRadius:20, border:`1px solid ${T.blue}30`, background:T.gray100, color:T.navy, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {c}
                </button>
              ))}
            </div>

            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={triggerEmergencySOS} disabled={loadingSOS}
              style={{ width:'100%', padding:'16px', borderRadius:16, border:'none', background:T.red, color:'#FFF', fontWeight:800, fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:'0 8px 24px rgba(244,63,94,0.3)' }}>
              {loadingSOS ? <span style={{ animation:'pulse 1s infinite' }}>Sending SOS...</span> : <><PiWarningBold size={20}/> Trigger Emergency SOS</>}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
