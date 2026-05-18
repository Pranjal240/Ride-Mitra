import T, { FONT } from '../../lib/theme';

/** Inline SVG logo — Deep Navy + Gold */
export default function Logo({ size = 36, light = false }: { size?: number; light?: boolean }) {
  const bg = light ? 'rgba(255,255,255,0.95)' : T.navy;
  const accent = T.navy;
  const gold = T.gold;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="23" fill={bg} stroke={light ? T.gold : accent} strokeWidth="2" />
      {/* Car body */}
      <path d="M12 28h24v4c0 1.1-.9 2-2 2H14c-1.1 0-2-.9-2-2v-4z" fill={light ? T.navy : T.gold} />
      <path d="M14 28l3-8h14l3 8" fill={bg} stroke={light ? T.navy : T.gold} strokeWidth="1.5" />
      {/* Windows */}
      <path d="M18.5 22h4.5v6h-6.5l2-6z" fill={`${T.navy}20`} />
      <path d="M25 22h4.5l2 6H25v-6z" fill={`${T.navy}15`} />
      {/* Wheels */}
      <circle cx="17" cy="32" r="2.5" fill={bg} stroke={gold} strokeWidth="1.5" />
      <circle cx="31" cy="32" r="2.5" fill={bg} stroke={gold} strokeWidth="1.5" />
      {/* Map pin */}
      <path d="M24 8c-2.8 0-5 2.2-5 5 0 3.5 5 8 5 8s5-4.5 5-8c0-2.8-2.2-5-5-5z" fill={gold} />
      <circle cx="24" cy="13" r="2" fill={bg} />
    </svg>
  );
}

export function LogoText({ light = false }: { light?: boolean }) {
  return (
    <span style={{
      fontFamily: FONT.heading,
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: light ? 'white' : T.navy,
      whiteSpace: 'nowrap'
    }}>
      Ride<span style={{ color: T.gold }}>Mitra</span>
    </span>
  );
}
