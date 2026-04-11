import AppMockup from '../components/AppMockup';

export default function HomePage() {
  return (
    <>
    <nav style={nav}>
      <a href="/shop" style={navLink}>Shop</a>
      <a href="/legal" style={navLink}>Legal</a>
    </nav>
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
            { icon: '🎙️', title: 'Detect',   body: 'An outdoor mic continuously listens for the distinctive burst-drumming pattern of a woodpecker.' },
            { icon: '📲', title: 'Alert',    body: 'The moment one is detected, your phone gets a notification and the response screen opens instantly.' },
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

    </main>
    </>
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
  marginBottom: 4,
  padding: '0 32px',
  boxSizing: 'border-box' as const,
};

const tagline: React.CSSProperties = {
  fontSize: 'clamp(3rem, 8vw, 5.5rem)',
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

const nav: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  padding: '16px 24px',
  zIndex: 100,
  display: 'flex',
  gap: 24,
};

const navLink: React.CSSProperties = {
  color: '#cc2020',
  textDecoration: 'none',
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: '1.1rem',
  letterSpacing: 1,
};
