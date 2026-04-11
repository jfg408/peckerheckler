/* Renders a phone-shaped mockup of the "Speak directly" harassment warning screen. */
export default function SpeakWarningMockup() {
  const bullets = [
    'Threatening language',
    'Any reference to home addresses, family names, or other veiled threats',
    'Any non-consensual dialogue of a sexual nature',
  ];

  return (
    <div style={phone}>
      <div style={notch} />
      <div style={screen}>
        <p style={headline}>⚠️  Legal Notice</p>
        <p style={body}>
          You are about to speak directly with the woodpecker.
          <br /><br />
          Harassment of a woodpecker is a federal crime and is prohibited by
          our terms of use. Please refrain from:
        </p>
        {bullets.map((b) => (
          <div key={b} style={bulletRow}>
            <span style={bullet}>•</span>
            <span style={bulletText}>{b}</span>
          </div>
        ))}
        <p style={footer}>
          Pecker Heckler is not responsible for your speech. You are.
        </p>
        <div style={proceedBtn}>I understand — proceed</div>
        <div style={cancelBtn}>Cancel</div>
      </div>
      <div style={homeBar} />
    </div>
  );
}

const phone: React.CSSProperties = {
  width: 300,
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
  width: 80, height: 20, background: '#f5f5f5', borderRadius: 10, marginBottom: 4,
};
const screen: React.CSSProperties = {
  width: '100%', padding: '12px 16px 8px',
  display: 'flex', flexDirection: 'column', gap: 10,
};
const headline: React.CSSProperties = {
  margin: 0, color: '#111111', fontSize: 18, fontWeight: 900,
};
const body: React.CSSProperties = {
  margin: 0, color: '#555555', fontSize: 12, lineHeight: 1.6,
};
const bulletRow: React.CSSProperties = {
  display: 'flex', gap: 8, paddingLeft: 4,
};
const bullet: React.CSSProperties = {
  color: '#dc2626', fontSize: 14, flexShrink: 0,
};
const bulletText: React.CSSProperties = {
  color: '#111111', fontSize: 12, lineHeight: 1.5,
};
const footer: React.CSSProperties = {
  margin: '4px 0 0', color: '#555555', fontSize: 11, fontStyle: 'italic',
};
const proceedBtn: React.CSSProperties = {
  background: '#cc2020', borderRadius: 10, padding: '10px 0',
  textAlign: 'center', color: '#f5f5f5',
  fontFamily: 'var(--font-display), sans-serif', fontSize: 18, letterSpacing: 1, marginTop: 4,
};
const cancelBtn: React.CSSProperties = {
  textAlign: 'center', color: '#555555',
  fontFamily: 'var(--font-display), sans-serif', fontSize: 16, letterSpacing: 1, padding: '8px 0',
};
const homeBar: React.CSSProperties = {
  width: 80, height: 4, background: '#cccccc', borderRadius: 2, marginTop: 8,
};
