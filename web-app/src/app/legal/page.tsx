import SpeakWarningMockup from '../../components/SpeakWarningMockup';

export const metadata = {
  title: 'Legal — PeckerHeckler',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

export default function LegalPage() {
  return (
    <main style={main}>
      <h1 style={h1}>Legal</h1>

      {/* ── Disclaimer ─────────────────────────────────────────── */}
      <Section title="Disclaimer">
        <p style={p}>
          Pursuant to the Migratory Bird Treaty Act, 16 U.S.C. § 703(a), harassing
          a woodpecker is a federal crime.{' '}
          <strong style={{ color: '#111111' }}>Pecker Heckler is not a woodpecker harassment tool.</strong>{' '}
          It is a woodpecker deterrent tool. We condemn
          woodpecker harassment in all forms.
        </p>
      </Section>

      {/* ── Gunsight ───────────────────────────────────────────── */}
      <Section title="Gunsight in Logo">
        <p style={p}>
          The gunsight in our logo is figurative and not intended to imply or
          encourage any shooting of woodpeckers. In fact, in the household studied
          during our beta program, introduction of a Pecker Heckler actually{' '}
          <strong style={{ color: '#111111' }}>
            reduced woodpecker shooting incidents by over 50%.
          </strong>
        </p>
      </Section>

      {/* ── Verbal Harassment ──────────────────────────────────── */}
      <Section title="User Verbal Harassment of Woodpeckers">
        <p style={p}>
          Our terms of use and user interface (shown below) prohibit users from
          harassing woodpeckers. Users are responsible for their own actions when
          speaking directly with woodpeckers, not Pecker Heckler.
        </p>

        {/* Phone mockup of the warning screen */}
        <div style={mockupWrapper}>
          <SpeakWarningMockup />
        </div>

      </Section>

      <footer style={footer}>
        <a href="/" style={backLink}>← Back to PeckerHeckler</a>
      </footer>
    </main>
  );
}

/* ---- styles ---- */

const main: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '40px 24px 80px',
  display: 'flex',
  flexDirection: 'column',
  gap: 48,
};

const h1: React.CSSProperties = {
  fontSize: '3.5rem',
  fontFamily: 'var(--font-display), sans-serif',
  fontWeight: 400,
  margin: 0,
  color: '#111111',
  letterSpacing: 2,
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const sectionTitle: React.CSSProperties = {
  fontSize: '1.6rem',
  fontFamily: 'var(--font-display), sans-serif',
  fontWeight: 400,
  color: '#111111',
  margin: 0,
  paddingBottom: 6,
  borderBottom: '1px solid #dddddd',
  letterSpacing: 1,
};

const p: React.CSSProperties = {
  color: '#444444',
  fontSize: 15,
  lineHeight: 1.7,
  margin: 0,
};

const mockupWrapper: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '16px 0',
};

const quote: React.CSSProperties = {
  background: '#f0f0f0',
  borderLeft: '4px solid #dc2626',
  borderRadius: '0 12px 12px 0',
  margin: 0,
  padding: '20px 24px',
};

const ul: React.CSSProperties = {
  margin: '0',
  paddingLeft: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const li: React.CSSProperties = {
  color: '#444444',
  fontSize: 15,
  lineHeight: 1.6,
};

const backLink: React.CSSProperties = {
  color: '#cc2020',
  textDecoration: 'none',
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: 18,
  letterSpacing: 1,
};

const footer: React.CSSProperties = {
  borderTop: '1px solid #f0f0f0',
  paddingTop: 24,
};
