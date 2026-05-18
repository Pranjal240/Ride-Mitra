import { useState } from 'react';
import { motion } from 'framer-motion';
import { PiCameraBold, PiFloppyDiskBold, PiUserBold, PiPhoneBold, PiEnvelopeBold, PiShieldCheckBold, PiSpinnerBold } from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { updateProfile } from '../lib/auth';
import { supabase } from '../lib/supabase';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

function InputField({ label, value, onChange, placeholder, icon, disabled }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; icon: React.ReactNode; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.textSec, marginBottom:6, letterSpacing:0.3 }}>{label}</label>
      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color: focused ? T.blue : T.muted, transition:'color 0.3s', display:'flex' }}>
          {icon}
        </div>
        <input value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width:'100%', padding:'14px 16px 14px 42px', borderRadius:14,
            border:`1.5px solid ${focused ? T.blue : T.border}`,
            background: disabled ? T.gray100 : T.surface,
            color: disabled ? T.muted : T.text, fontSize:14, outline:'none', fontFamily:'inherit',
            transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: focused ? `0 0 0 3px rgba(27,43,75,0.08)` : 'none',
            opacity: disabled ? 0.7 : 1,
          }}/>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergency_contact_phone || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateProfile(user.id, { full_name: fullName, phone, emergency_contact_phone: emergencyContact, profile_complete: 50 });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error('Failed to update', e); }
    finally { setSaving(false); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const updated = await updateProfile(user.id, { profile_photo: publicUrl });
      setUser(updated);
    } catch (e) { console.error('Upload failed', e); }
    finally { setUploading(false); }
  };

  if (!user) return null;

  const completion = user.profile_complete || 0;

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(180deg, ${T.bg}, ${T.gray100})`, fontFamily:"'Inter', sans-serif" }}>
      <div style={{ maxWidth:600, margin:'0 auto', padding:'32px 20px 48px' }}>
        {/* Header */}
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:28, fontWeight:800, color:T.text, fontFamily:FONT.heading, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ padding:8, borderRadius:12, background:`linear-gradient(135deg,${T.navy50},${T.gold50})`, display:'flex' }}>
              <PiUserBold size={22} color={T.navy}/>
            </div>
            My Profile
          </h1>
        </motion.div>

        {/* Avatar Card */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          style={{ background:T.surface, borderRadius:24, padding:32, border:`1px solid ${T.border}`,
            boxShadow:'0 8px 32px rgba(27,43,75,0.06)', marginBottom:20 }}>

          {/* Avatar */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
            <div style={{ position:'relative' }}>
              <div style={{
                width:96, height:96, borderRadius:24, overflow:'hidden',
                background:`linear-gradient(135deg,${T.navy50},${T.gold50})`, display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 8px 24px rgba(27,43,75,0.12)', border:`3px solid ${T.surface}`,
              }}>
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt={user.full_name || ''} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                ) : (
                  <PiUserBold size={40} color={T.navy}/>
                )}
              </div>
              <label style={{
                position:'absolute', bottom:-4, right:-4, width:32, height:32, borderRadius:10,
                background:`linear-gradient(135deg, ${T.blue}, ${T.blue})`, color:'white',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                boxShadow:'0 4px 12px rgba(27,43,75,0.3)', transition:'all 0.2s',
              }}>
                {uploading ? (
                  <div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}><PiSpinnerBold size={14}/></div>
                ) : (
                  <PiCameraBold size={14}/>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:'none' }}/>
              </label>
            </div>
            <h2 style={{ fontSize:20, fontWeight:700, color:T.text, marginTop:14, fontFamily:FONT.heading }}>
              {user.full_name || 'User'}
            </h2>
            <p style={{ fontSize:13, color:T.muted, display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
              <PiEnvelopeBold size={12}/> {user.email}
            </p>
          </div>

          {/* Form */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <InputField label="Full Name" value={fullName} onChange={setFullName} icon={<PiUserBold size={16}/>}/>
            <InputField label="Email" value={user.email} disabled icon={<PiEnvelopeBold size={16}/>}/>
            <InputField label="Phone Number" value={phone} onChange={setPhone} placeholder="+91 XXXXX XXXXX" icon={<PiPhoneBold size={16}/>}/>
            <InputField label="Emergency Contact (For SOS)" value={emergencyContact} onChange={setEmergencyContact} placeholder="+91 XXXXX XXXXX" icon={<PiShieldCheckBold size={16}/>}/>
          </div>

          {/* Save Button */}
          <motion.button whileHover={{ scale:1.02, boxShadow:'0 10px 28px rgba(27,43,75,0.25)' }} whileTap={{ scale:0.97 }}
            onClick={handleSave} disabled={saving}
            style={{
              width:'100%', padding:'14px', borderRadius:14, border:'none', marginTop:24,
              background: saved ? `linear-gradient(135deg, ${T.green}, ${T.green})` : `linear-gradient(135deg, ${T.blue}, ${T.blue})`,
              color:'white', fontSize:14, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow: saved ? '0 8px 20px rgba(20,184,166,0.25)' : '0 8px 20px rgba(27,43,75,0.2)',
              transition:'all 0.4s', opacity: saving ? 0.7 : 1,
            }}>
            {saving ? (
              <><div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}><PiSpinnerBold size={16}/></div> Saving...</>
            ) : saved ? (
              <><PiShieldCheckBold size={16}/> Saved!</>
            ) : (
              <><PiFloppyDiskBold size={16}/> Save Changes</>
            )}
          </motion.button>

          {/* Progress */}
          <div style={{ marginTop:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:12, color:T.textSec }}>Profile completion</span>
              <span style={{ fontSize:13, fontWeight:700, color:T.blue }}>{completion}%</span>
            </div>
            <div style={{ width:'100%', height:6, borderRadius:10, background:T.gray200, overflow:'hidden' }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${completion}%` }} transition={{ duration:1.2, ease:'easeOut' }}
                style={{ height:'100%', borderRadius:10, background:`linear-gradient(90deg, ${T.blue}, ${T.blue})` }}/>
            </div>
          </div>
        </motion.div>

        {/* Security badge */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', borderRadius:16,
            background:'rgba(255,255,255,0.6)', backdropFilter:'blur(10px)', border:`1px solid ${T.border}` }}>
          <div style={{ width:36, height:36, borderRadius:10, background:T.greenLight, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <PiShieldCheckBold size={18} color={T.green}/>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:T.text }}>University Verified</p>
            <p style={{ fontSize:11, color:T.muted }}>Your account is verified via JC Bose UST email</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
