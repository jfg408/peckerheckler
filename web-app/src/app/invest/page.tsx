'use client';
import { useState } from 'react';

export default function InvestPage() {
  const [email, setEmail]               = useState('');
  const [notes, setNotes]               = useState('');
  const [investmentSize, setInvestmentSize] = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [done, setDone]                 = useState(false);

  async function handleSubmit() {
    if (!email) return;
    setSubmitting(true);
    await fetch('https://x3gce4pfb6kowdfxlibexi7dbm0ckhmz.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        productId: 'invest',
        notes: notes || undefined,
        investmentSize: investmentSize ? Number(investmentSize.replace(/\D/g, '')) : undefined,
      }),
    });
    setSubmitting(false);
    setDone(true);
  }

  return (
    <main style={main}>
      <h1 style={h1}>Invest</h1>

      <div style={body}>
        <p style={p}>
          Believe it or not, we are still accepting new investors to bring us to mass production.
        </p>

        <p style={p}>
          This is your chance to have a real impact on the world. How can we live in an age of
          sustainable abundance when we are not safe in our own homes?
        </p>

        <p style={p}>
          Based on take rates in our initial testing area (upper market Lake Tahoe mountain real
          estate) we estimate a <strong style={strong}>25–50% household take rate globally</strong>,
          which would translate to a TAM of{' '}
          <strong style={strong}>$650 billion in hardware revenue alone</strong>, plus{' '}
          <strong style={strong}>$100B+ of annual subscriptions</strong>. Don&apos;t miss this
          opportunity.
        </p>

        {done ? (
          <p style={confirmed}>You&apos;re on the list. We&apos;ll be in touch.</p>
        ) : (
          <div style={form}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <div style={amountRow}>
              <span style={currencyLabel}>$</span>
              <input
                type="number"
                placeholder="Intended investment size (min $50k)"
                value={investmentSize}
                onChange={(e) => setInvestmentSize(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                min={0}
              />
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={notesStyle}
              rows={3}
            />
            <button style={submitting ? ctaDisabled : cta} onClick={handleSubmit} disabled={submitting}>
              {submitting ? '...' : 'Sign Me Up'}
            </button>
          </div>
        )}
      </div>

      <footer style={footer}>
        <a href="/" style={backLink}>← Back to PeckerHeckler</a>
      </footer>
    </main>
  );
}

/* ---- styles ---- */

const main: React.CSSProperties = {
  maxWidth: 680,
  margin: '0 auto',
  padding: '40px 24px 80px',
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
};

const h1: React.CSSProperties = {
  fontSize: '3.5rem',
  fontFamily: 'var(--font-display), sans-serif',
  fontWeight: 400,
  margin: 0,
  color: '#111111',
  letterSpacing: 2,
};

const body: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const p: React.CSSProperties = {
  fontSize: 16,
  color: '#444444',
  lineHeight: 1.75,
  margin: 0,
};

const strong: React.CSSProperties = {
  color: '#111111',
};

const form: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #cccccc',
  fontSize: 15,
  outline: 'none',
};

const amountRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const currencyLabel: React.CSSProperties = {
  fontSize: 16,
  color: '#555555',
  fontWeight: 600,
};

const notesStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #cccccc',
  fontSize: 15,
  outline: 'none',
  resize: 'vertical' as const,
  fontFamily: 'inherit',
};

const cta: React.CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 0,
  background: '#cc2020',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: '1.3rem',
  letterSpacing: 2,
};

const ctaDisabled: React.CSSProperties = {
  ...cta,
  background: '#999999',
  cursor: 'default',
};

const confirmed: React.CSSProperties = {
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: '1.2rem',
  letterSpacing: 1,
  color: '#16a34a',
  margin: 0,
};

const footer: React.CSSProperties = {
  borderTop: '1px solid #dddddd',
  paddingTop: 24,
};

const backLink: React.CSSProperties = {
  color: '#cc2020',
  textDecoration: 'none',
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: 18,
  letterSpacing: 1,
};
