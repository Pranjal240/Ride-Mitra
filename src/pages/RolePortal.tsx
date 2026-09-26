import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PiSmileyBold, PiSteeringWheelBold, PiShieldStarBold,
  PiArrowRightBold, PiArrowLeftBold, PiCheckCircleBold,
} from 'react-icons/pi';
import Logo, { LogoText } from '../components/common/Logo';
import T, { FONT } from '../lib/theme';

type Role = {
  key: 'student' | 'driver' | 'admin';
  title: string;
  tag: string;
  desc: string;
  perks: string[];
  color: string;
  colorDark: string;
  icon: React.ReactNode;
};

const ROLES: Role[] = [
  {
    key: 'student',
    title: 'Rider',
    tag: 'For JC Bose UST students',
    desc: 'Find safe, affordable rides with verified drivers from your campus.',
    perks: ['Search & book rides', 'Live tracking + SOS', 'Split fares fairly'],
    color: '#4A6FA5',
    colorDark: '#2C4A7C',
    icon: <PiSmileyBold size={44} />,
  },
  {
    key: 'driver',
    title: 'Driver',
    tag: 'For campus car owners',
    desc: 'Offer seats on trips you\'re already making. Cover fuel, meet peers.',
    perks: ['Post rides in seconds', 'Verified passenger requests', 'Auto payouts'],
    color: '#C8956C',
    colorDark: '#A67A50',
    icon: <PiSteeringWheelBold size={44} />,
  },
  {
    key: 'admin',
    title: 'Admin',
    tag: 'Staff access',
    desc: 'University & safety officers manage verifications and SOS alerts.',
    perks: ['Driver verification', 'SOS command center', 'Community reports'],
    color: '#5B9A6F',
    colorDark: '#3F7A55',
    icon: <PiShieldStarBold size={44} />,
  },
];

/* Aurora bg — smaller footprint version */
function Aurora() {
  return (
    <div className="aurora-wrap">
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
      <div className="noise-overlay" />
    </div>
  );
}

export default function RolePortal() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<Role['key'] | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const goToLogin = (role: Role['key']) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #152240 0%, #0A1128 60%, #050914 100%)',
      color: 'white', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <Aurora />

      {/* Header */}
      <header style={{
        position: 'relative', zIndex: 5,
        padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }} className="mobile-padding">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Logo size={32} light /><LogoText light />
        </Link>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
          fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.3s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
          <PiArrowLeftBold size={13} /> Back
        </Link>
      </header>

      {/* Main */}
      <main style={{
        position: 'relative', zIndex: 5,
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 24px 60px', maxWidth: 1200, margin: '0 auto', width: '100%',
      }}>
        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px',
            borderRadius: 100, background: 'rgba(200,149,108,0.12)',
            border: '1px solid rgba(200,149,108,0.25)', marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
              Choose your portal
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 900, color: 'white',
            fontFamily: FONT.heading, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 14,
          }}>
            How will you use <span style={{
              background: `linear-gradient(135deg, ${T.gold}, #F5C99B)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>RideMitra?</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            Each portal is designed for what you do. Pick one — you can always switch later.
          </p>
        </motion.div>

        {/* Role cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
        }} className="mobile-grid-stack">
          {ROLES.map((role, i) => (
            <motion.div key={role.key}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease: [0.25, 1, 0.3, 1] }}
              onMouseEnter={() => setHovered(role.key)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => goToLogin(role.key)}
              style={{
                position: 'relative', borderRadius: 28, padding: 32,
                background: hovered === role.key
                  ? `linear-gradient(135deg, ${role.color}22, ${role.colorDark}18)`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hovered === role.key ? `${role.color}66` : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer',
                transition: 'all 0.5s cubic-bezier(0.25, 1, 0.3, 1)',
                transform: hovered === role.key ? 'translateY(-8px)' : 'translateY(0)',
                boxShadow: hovered === role.key
                  ? `0 30px 60px ${role.color}30, inset 0 1px 0 rgba(255,255,255,0.08)`
                  : '0 10px 30px rgba(0,0,0,0.2)',
                overflow: 'hidden',
              }}>
              {/* Glow orb */}
              <div style={{
                position: 'absolute', top: -80, right: -80, width: 220, height: 220, borderRadius: '50%',
                background: `radial-gradient(circle, ${role.color}55, transparent 70%)`,
                filter: 'blur(30px)',
                opacity: hovered === role.key ? 0.9 : 0.4,
                transition: 'opacity 0.5s',
              }} />

              {/* Icon */}
              <div style={{
                position: 'relative', zIndex: 2,
                width: 84, height: 84, borderRadius: 22,
                background: `linear-gradient(135deg, ${role.color}, ${role.colorDark})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', marginBottom: 24,
                boxShadow: `0 16px 40px ${role.color}40, inset 0 1px 0 rgba(255,255,255,0.3)`,
                transition: 'transform 0.5s',
                transform: hovered === role.key ? 'scale(1.05) rotate(-3deg)' : 'scale(1)',
              }}>
                {role.icon}
              </div>

              {/* Tag */}
              <div style={{ position: 'relative', zIndex: 2, marginBottom: 6 }}>
                <span style={{
                  fontSize: 11, color: role.color, fontWeight: 700,
                  letterSpacing: 1.5, textTransform: 'uppercase',
                }}>{role.tag}</span>
              </div>

              {/* Title */}
              <h3 style={{
                position: 'relative', zIndex: 2,
                fontSize: 32, fontWeight: 900, color: 'white',
                fontFamily: FONT.heading, letterSpacing: '-0.02em', marginBottom: 12,
              }}>
                {role.title}
              </h3>

              {/* Desc */}
              <p style={{
                position: 'relative', zIndex: 2,
                fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, marginBottom: 24,
              }}>{role.desc}</p>

              {/* Perks */}
              <ul style={{ position: 'relative', zIndex: 2, listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {role.perks.map((p) => (
                  <li key={p} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 13, color: 'rgba(255,255,255,0.75)',
                  }}>
                    <PiCheckCircleBold size={16} color={role.color} />
                    {p}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div style={{
                position: 'relative', zIndex: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: 14,
                background: hovered === role.key ? role.color : 'rgba(255,255,255,0.06)',
                color: 'white', fontSize: 14, fontWeight: 700,
                transition: 'all 0.4s',
                boxShadow: hovered === role.key ? `0 8px 24px ${role.color}50` : 'none',
              }}>
                <span>Continue as {role.title}</span>
                <PiArrowRightBold size={16} style={{
                  transform: hovered === role.key ? 'translateX(4px)' : 'translateX(0)',
                  transition: 'transform 0.4s',
                }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          style={{
            textAlign: 'center', marginTop: 40, fontSize: 13, color: 'rgba(255,255,255,0.45)',
          }}>
          Not sure which one? <Link to="/login?role=student" style={{ color: T.gold, textDecoration: 'none', fontWeight: 600 }}>Start as a Rider</Link> — you can offer rides later.
        </motion.p>
      </main>
    </div>
  );
}
