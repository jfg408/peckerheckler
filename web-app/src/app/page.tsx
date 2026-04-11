import AppMockup from '../components/AppMockup';

export default function HomePage() {
  return (
    <main style={main}>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pecker-heckler-protoype-with-brand-name.png" alt="PeckerHeckler device" style={logo} />
        <p style={tagline}>Detect &amp; DePeck</p>
        <p style={slogan}>The world&apos;s first AI-powered woodpecker deterrent</p>
      </section>

      {/* ── App mockup ──────────────────────────────────────────── */}
      <section style={{ ...section, alignItems: 'center' }}>
        <AppMockup />
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>How it works</h2>
        <div style={steps}>
          {[
            { icon: '🎙️', title: 'Detect',   body: 'Outdoor mic listens for woodpeckers.' },
            { icon: '📲', title: 'Alert',    body: 'Instant notification when one is detected.' },
            { icon: '🔊', title: 'Deter',    body: 'Choose how to defend your home.' },
          ].map((s) => (
            <div key={s.title} style={stepCard}>
              <span style={stepIcon}>{s.icon}</span>
              <h3 style={stepTitle}>{s.title}</h3>
              <p style={stepBody}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom nav ──────────────────────────────────────────── */}
      <div style={bottomNav}>
        <a href="/shop" style={bottomBtn}>Shop</a>
        <a href="/legal" style={bottomBtn}>Legal</a>
      </div>

    </main>
  );
}

/* ---- styles ---- */

const main: React.CSSProperties = {
  maxWidth: 820,
  margin: '0 auto',
  padding: '0 24px 64px',
  display: 'flex',
  flexDirection: 'column',
  gap: 64,
};

const hero: React.CSSProperties = {
  paddingTop: 80,
  textAlign: 'center',
};

const logo: React.CSSProperties = {
  width: 'clamp(360px, 72vw, 620px)',
  marginBottom: -24,
  padding: '0 32px',
  boxSizing: 'border-box' as const,
  transform: 'translateX(10px)',
};

const tagline: React.CSSProperties = {
  fontSize: 'clamp(2.55rem, 6.8vw, 4.675rem)',
  fontFamily: 'var(--font-display), sans-serif',
  fontWeight: 400,
  color: '#cc2020',
  margin: '0 0 4px',
  letterSpacing: 1,
};

const slogan: React.CSSProperties = {
  fontSize: 'clamp(1rem, 2.2vw, 1.55rem)',
  fontFamily: 'var(--font-display), sans-serif',
  letterSpacing: 1,
  color: '#666666',
  margin: 0,
};

const section: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const h2: React.CSSProperties = {
  fontSize: '2.2rem',
  fontFamily: 'var(--font-display), sans-serif',
  fontWeight: 400,
  margin: 0,
  color: '#111111',
  letterSpacing: 1,
};

const steps: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 16,
};

const stepCard: React.CSSProperties = {
  background: '#ebebeb',
  borderRadius: 16,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const stepIcon: React.CSSProperties  = { fontSize: 32 };
const stepTitle: React.CSSProperties = { margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-display), sans-serif', fontWeight: 400, color: '#111111', letterSpacing: 1 };
const stepBody: React.CSSProperties  = { margin: 0, color: '#555555', fontSize: 14, lineHeight: 1.6 };

const bottomNav: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  justifyContent: 'center',
};

const bottomBtn: React.CSSProperties = {
  flex: 1,
  maxWidth: 240,
  textAlign: 'center' as const,
  padding: '14px 0',
  borderRadius: 12,
  background: '#cc2020',
  color: '#ffffff',
  textDecoration: 'none',
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: '1.3rem',
  letterSpacing: 2,
};

