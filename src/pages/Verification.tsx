import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PiUploadBold, PiFileTextBold, PiCarBold, PiShieldCheckBold, PiCheckCircleBold, PiClockBold, PiSpinnerBold, PiMotorcycleBold } from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { submitVerification, getVerification } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { DriverVerification } from '../types';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

function FormInput({ label, value, onChange, placeholder, icon, disabled }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; icon: React.ReactNode; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.textSec, marginBottom:6 }}>{label}</label>
      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color: focused ? T.blue : T.muted, transition:'color 0.3s', display:'flex' }}>
          {icon}
        </div>
        <input value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width:'100%', padding:'14px 16px 14px 42px', borderRadius:14,
            border:`1.5px solid ${focused ? T.blue : T.border}`, background: disabled ? T.gray100 : T.surface,
            color:T.text, fontSize:14, outline:'none', fontFamily:'inherit',
            transition:'all 0.3s', boxShadow: focused ? `0 0 0 3px rgba(27,43,75,0.08)` : 'none',
          }}/>
      </div>
    </div>
  );
}

export default function Verification() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<DriverVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const v = await getVerification(user.id);
      if (v) {
        setVerification(v);
        setLicenseNumber(v.license_number);
        setVehicleType(v.vehicle_type || 'car');
        setVehicleNumber(v.vehicle_number || '');
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !licenseNumber) return;
    setSubmitting(true);
    try {
      let licensePhotoUrl: string | undefined;
      if (licenseFile) {
        const ext = licenseFile.name.split('.').pop();
        const path = `${user.id}/license.${ext}`;
        await supabase.storage.from('driver-documents').upload(path, licenseFile, { upsert: true });
        const { data } = supabase.storage.from('driver-documents').getPublicUrl(path);
        licensePhotoUrl = data.publicUrl;
      }
      const v = await submitVerification({
        user_id: user.id, license_number: licenseNumber, vehicle_type: vehicleType,
        vehicle_number: vehicleNumber, license_photo: licensePhotoUrl,
      });
      setVerification(v);
    } catch (e) { console.error('Submission failed', e); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ animation:'spin-slow 0.8s linear infinite', color:T.navy, display:'flex' }}><PiSpinnerBold size={32}/></div>
    </div>
  );

  const statusColors = {
    pending: { bg:T.orangeLight, color:T.orange, label:'Pending Review' },
    verified: { bg:T.greenLight, color:T.green, label:'Verified ✓' },
    rejected: { bg:T.redLight, color:T.red, label:'Rejected' },
  };

  const vehicleOptions = [
    { key:'car', emoji:'🚗', label:'Car' },
    { key:'bike', emoji:'🏍️', label:'Bike' },
    { key:'auto', emoji:'🛺', label:'Auto' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(180deg, ${T.bg}, ${T.gray100})`, fontFamily:"'Inter', sans-serif" }}>
      <div style={{ maxWidth:640, margin:'0 auto', padding:'32px 20px 48px' }}>
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:28, fontWeight:800, color:T.text, fontFamily:FONT.heading, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ padding:8, borderRadius:12, background:`linear-gradient(135deg,${T.navy50},${T.greenLight})`, display:'flex' }}>
              <PiShieldCheckBold size={22} color={T.navy}/>
            </div>
            Driver Verification
          </h1>
          <p style={{ fontSize:14, color:T.textSec, marginTop:4 }}>Submit your documents to start offering rides</p>
        </motion.div>

        {/* Status Badge */}
        {verification && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', borderRadius:16,
              background:T.surface, border:`1px solid ${T.border}`, marginBottom:18, boxShadow:'0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
              background: verification.verification_status === 'verified' ? T.greenLight : T.orangeLight }}>
              {verification.verification_status === 'verified' ? <PiCheckCircleBold size={20} color={T.green}/> : <PiClockBold size={20} color={T.orange}/>}
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:600, color:T.text }}>Status</p>
              <span style={{ padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:700,
                ...(statusColors[verification.verification_status] || statusColors.pending) }}>
                {(statusColors[verification.verification_status] || statusColors.pending).label}
              </span>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          style={{ background:T.surface, borderRadius:22, padding:28, border:`1px solid ${T.border}`, boxShadow:'0 8px 24px rgba(27,43,75,0.04)' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <FormInput label="License Number *" value={licenseNumber} onChange={setLicenseNumber} placeholder="DL-XXXXXXXXXX" icon={<PiFileTextBold size={16}/>}/>

            {/* Vehicle Type */}
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8 }}>Vehicle Type</label>
              <div style={{ display:'flex', gap:10 }}>
                {vehicleOptions.map(v => (
                  <motion.button key={v.key} whileTap={{ scale:0.95 }} onClick={() => setVehicleType(v.key)}
                    style={{
                      flex:1, padding:'14px 12px', borderRadius:14, border:`2px solid ${vehicleType === v.key ? T.blue : T.border}`,
                      background: vehicleType === v.key ? T.blue50 : T.gray100, cursor:'pointer',
                      fontSize:13, fontWeight:600, color: vehicleType === v.key ? T.blue : T.textSec,
                      transition:'all 0.3s', textTransform:'capitalize',
                    }}>
                    <span style={{ fontSize:20, display:'block', marginBottom:4 }}>{v.emoji}</span>
                    {v.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <FormInput label="Vehicle Number" value={vehicleNumber} onChange={setVehicleNumber} placeholder="HR-XX-XX-XXXX" icon={<PiCarBold size={16}/>}/>

            {/* File upload */}
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8 }}>License Photo</label>
              <label style={{
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8,
                padding:'28px 16px', border:`2px dashed ${licenseFile ? T.blue : T.border}`, borderRadius:16,
                background: licenseFile ? `${T.navy50}10` : T.gray100, cursor:'pointer', transition:'all 0.3s',
              }}>
                {licenseFile ? <PiCheckCircleBold size={28} color={T.green}/> : <PiUploadBold size={28} color={T.muted}/>}
                <span style={{ fontSize:13, color: licenseFile ? T.text : T.muted, fontWeight: licenseFile ? 600 : 400 }}>
                  {licenseFile ? licenseFile.name : 'Click to upload license photo'}
                </span>
                <input type="file" accept="image/*" onChange={(e) => setLicenseFile(e.target.files?.[0] || null)} style={{ display:'none' }}/>
              </label>
            </div>

            {/* Submit */}
            <motion.button whileHover={{ scale:1.02, boxShadow:'0 12px 32px rgba(27,43,75,0.25)' }} whileTap={{ scale:0.97 }}
              onClick={handleSubmit} disabled={submitting || verification?.verification_status === 'verified'}
              style={{
                width:'100%', padding:'16px', borderRadius:14, border:'none', marginTop:6,
                background: verification?.verification_status === 'verified'
                  ? `linear-gradient(135deg, ${T.green}, ${T.green})`
                  : `linear-gradient(135deg, ${T.blue}, ${T.blue})`,
                color:'white', fontSize:15, fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow:'0 8px 20px rgba(27,43,75,0.2)', transition:'all 0.3s',
                opacity: (submitting || verification?.verification_status === 'verified') ? 0.7 : 1,
              }}>
              {submitting ? (
                <><div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}><PiSpinnerBold size={18}/></div> Submitting...</>
              ) : verification?.verification_status === 'verified' ? (
                <><PiCheckCircleBold size={18}/> Already Verified</>
              ) : (
                <><PiShieldCheckBold size={18}/> {verification ? 'Update Documents' : 'Submit for Verification'}</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
