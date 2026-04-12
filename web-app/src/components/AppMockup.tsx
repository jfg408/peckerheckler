/* Renders a phone-shaped mockup of the incident response screen. */
export default function AppMockup() {
  const options: { icon: string; iconImg?: string; label: string; sub: string; accent: string; subBold?: boolean; subColor?: string; noSpeaker?: boolean }[] = [
    { icon: '🦅', label: 'Hawk',   sub: 'Recommended',      accent: '#cc2020', subBold: true, subColor: '#16a34a' },
    { icon: '', iconImg: 'https://flagcdn.com/us.svg', label: 'Eagle', sub: 'For variety',  accent: '#aa1818' },
    { icon: '🐻‍❄️', label: 'Polar Bear',                      sub: 'Unexpected',       accent: '#d97706' },
    { icon: '👻', label: 'Banshee',                          sub: 'Not recommended',  accent: '#7c3aed' },
    { icon: '🎤', label: 'Speak directly to the woodpecker', sub: 'Not recommended',  accent: '#6b4c9a', noSpeaker: true },
  ];

  return (
    <div style={phone}>
      {/* notch */}
      <div style={notch} />

      {/* screen content */}
      <div style={screen}>
        <p style={headline}>WOODPECKER<br />DETECTED!</p>
        <p style={sub}>Choose your champion</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((o) => (
            <div key={o.label} style={{ ...optionCard, borderLeftColor: o.accent }}>
              <div style={optionRow}>
                <span style={optionLabel}>
                  {o.iconImg
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={o.iconImg} alt="" style={flagIcon} />
                    : <span style={optionIcon}>{o.icon}</span>
                  }{'  '}{o.label}
                </span>
                {!o.noSpeaker && <span style={speakerIcon}>🔊</span>}
              </div>
              <span style={{
                ...optionSub,
                fontWeight: o.subBold ? 700 : 400,
                color: o.subColor ?? '#555555',
              }}>{o.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* home bar */}
      <div style={homeBar} />
    </div>
  );
}

/* ---- styles ---- */

const phone: React.CSSProperties = {
  width: 280,
  background: '#e8e8e8',
  borderRadius: 40,
  padding: '16px 8px 20px',
  boxShadow: '0 0 0 6px #dcdcdc, 0 0 0 8px #e8e8e8, 0 24px 64px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  userSelect: 'none',
};

const notch: React.CSSProperties = {
  width: 80,
  height: 20,
  background: '#f5f5f5',
  borderRadius: 10,
  marginBottom: 4,
};

const screen: React.CSSProperties = {
  width: '100%',
  padding: '16px 16px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const headline: React.CSSProperties = {
  margin: 0,
  color: '#111111',
  fontSize: 28,
  fontFamily: 'var(--font-display), sans-serif',
  fontWeight: 400,
  textAlign: 'center',
  lineHeight: 1.1,
  letterSpacing: 1,
};

const sub: React.CSSProperties = {
  margin: 0,
  color: '#555555',
  fontSize: 16,
  fontFamily: 'var(--font-display), sans-serif',
  letterSpacing: 1,
  textAlign: 'center',
};

const optionCard: React.CSSProperties = {
  background: '#dcdcdc',
  borderRadius: 10,
  padding: '12px 14px',
  borderLeft: '4px solid',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const optionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const speakerIcon: React.CSSProperties = {
  fontSize: 14,
  filter: 'brightness(0) opacity(0.45)',
  flexShrink: 0,
};

const optionIcon: React.CSSProperties = {
  fontFamily: 'system-ui, sans-serif',
};

const flagIcon: React.CSSProperties = {
  height: '1em',
  width: '1em',
  verticalAlign: '-0.15em',
  display: 'inline-block',
};

const optionLabel: React.CSSProperties = {
  color: '#111111',
  fontSize: 18,
  fontFamily: 'var(--font-display), sans-serif',
  fontWeight: 400,
  letterSpacing: 1,
};

const optionSub: React.CSSProperties = {
  color: '#555555',
  fontSize: 11,
  fontStyle: 'italic',
};

const homeBar: React.CSSProperties = {
  width: 80,
  height: 4,
  background: '#cccccc',
  borderRadius: 2,
  marginTop: 8,
};
