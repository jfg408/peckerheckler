'use client';
import { useState } from 'react';

const products = [
  {
    id: 'device',
    name: 'PeckerHeckler',
    description: 'The real deal. Weatherproof, high powered, fully-integrated, long battery. Mounts to any exterior surface. Not available yet.',
    price: '$600',
    image: '/device-shop.png',
    tag: null,
    comingSoon: true,
  },
  {
    id: 'proto',
    name: 'PeckerHeckler Proto',
    description: 'The prototype. Not weatherproof. Powered (cord). You could probably mount it to an exterior surface.',
    price: '$100',
    image: '/prototype-photo.jpg',
    tag: null,
    comingSoon: false,
  },
  {
    id: 'subscription',
    name: 'PeckerHeckler App Subscription',
    description: 'Required to operate your device. Includes real-time detection alerts, predator sound library, and direct-speak mode.',
    price: '$100 / year',
    image: '/logo-original.png',
    tag: 'Required',
    comingSoon: false,
  },
  {
    id: 'merch',
    name: 'PeckerHeckler Merch',
    description: 'Wear your commitment to woodpecker deterrence. Coming soon.',
    price: 'TBD',
    image: '/logo-original.png',
    tag: null,
    comingSoon: true,
  },
  {
    id: 'giftcard',
    name: 'Give the Gift of Pecker Heckler',
    description: 'A gift card for your pecked friends and family.',
    price: '$700',
    image: '/logo-original.png',
    tag: null,
    comingSoon: false,
  },
];

type NotifyPhase = 'idle' | 'input' | 'done';

export default function ShopContent() {
  const [notifyStates, setNotifyStates] = useState<Record<string, NotifyPhase>>({});
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function notifyPhase(productId: string): NotifyPhase {
    return notifyStates[productId] ?? 'idle';
  }

  async function handleNotify(productId: string) {
    if (notifyPhase(productId) === 'idle') {
      setNotifyStates((s) => ({ ...s, [productId]: 'input' }));
      setEmail('');
      setNotes('');
      return;
    }
    if (!email) return;
    setSubmitting(true);
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, productId, notes: notes || undefined }),
    });
    setSubmitting(false);
    setNotifyStates((s) => ({ ...s, [productId]: 'done' }));
  }

  return (
    <main style={main}>
      <h1 style={h1}>Shop</h1>

      <p style={policy}>
        Our{' '}
        <strong style={{ color: '#111111' }}>
          sell you the razor, sell you the blade
        </strong>{' '}
        policy means you receive clear, non-zero pricing for the end-to-end pecker-heckling process.
      </p>

      <div style={grid}>
        {products.map((p) => (
          <div key={p.id} style={card}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt={p.name}
              style={p.id === 'device' || p.id === 'proto' ? productImage : logoImage}
            />
            <div style={cardBody}>
              <div style={cardHeader}>
                <span style={productName}>{p.name}</span>
                {p.tag && <span style={tagBadge}>{p.tag}</span>}
              </div>
              <p style={description}>{p.description}</p>
              <div style={cardFooter}>
                <span style={priceTag}>{p.price}</span>
                {p.comingSoon ? (
                  notifyPhase(p.id) === 'done' ? (
                    <span style={confirmedText}>You&apos;re on the list!</span>
                  ) : notifyPhase(p.id) === 'input' ? (
                    <div style={notifyForm}>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNotify(p.id)}
                        style={emailInput}
                        autoFocus
                      />
                      <textarea
                        placeholder="Notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={notesInput}
                        rows={2}
                      />
                      <div style={buyBtn} onClick={() => handleNotify(p.id)}>
                        {submitting ? '...' : 'Submit'}
                      </div>
                    </div>
                  ) : (
                    <div style={notifyBtn} onClick={() => handleNotify(p.id)}>Notify Me</div>
                  )
                ) : (
                  <div style={buyBtn}>Add to cart</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer style={footer}>
        <a href="/" style={backLink}>← Back to PeckerHeckler</a>
      </footer>
    </main>
  );
}

/* ---- styles ---- */

const main: React.CSSProperties = {
  maxWidth: 860,
  margin: '0 auto',
  padding: '40px 24px 80px',
  display: 'flex',
  flexDirection: 'column',
  gap: 40,
};

const h1: React.CSSProperties = {
  fontSize: '3.5rem',
  fontFamily: 'var(--font-display), sans-serif',
  fontWeight: 400,
  margin: 0,
  color: '#111111',
  letterSpacing: 2,
};

const policy: React.CSSProperties = {
  fontSize: 15,
  color: '#555555',
  lineHeight: 1.7,
  margin: 0,
  maxWidth: 620,
};

const grid: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const card: React.CSSProperties = {
  background: '#ebebeb',
  borderRadius: 16,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'row',
};

const productImage: React.CSSProperties = {
  width: 200,
  height: 200,
  objectFit: 'cover',
  flexShrink: 0,
};

const logoImage: React.CSSProperties = {
  width: 200,
  height: 200,
  objectFit: 'cover',
  objectPosition: 'center',
  flexShrink: 0,
  background: '#ffffff',
};

const cardBody: React.CSSProperties = {
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flex: 1,
};

const cardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
};

const productName: React.CSSProperties = {
  fontSize: '1.5rem',
  fontFamily: 'var(--font-display), sans-serif',
  fontWeight: 400,
  color: '#111111',
  letterSpacing: 1,
};

const tagBadge: React.CSSProperties = {
  background: '#cc2020',
  color: '#ffffff',
  fontSize: 11,
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 4,
  letterSpacing: 0.5,
  textTransform: 'uppercase' as const,
};

const description: React.CSSProperties = {
  color: '#555555',
  fontSize: 14,
  lineHeight: 1.6,
  margin: 0,
  flex: 1,
};

const cardFooter: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 12,
  marginTop: 4,
};

const priceTag: React.CSSProperties = {
  fontSize: '1.4rem',
  fontFamily: 'var(--font-display), sans-serif',
  color: '#111111',
  letterSpacing: 1,
};

const buyBtn: React.CSSProperties = {
  background: '#cc2020',
  color: '#ffffff',
  padding: '8px 20px',
  borderRadius: 8,
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: '1rem',
  letterSpacing: 1,
  cursor: 'pointer',
};

const notifyBtn: React.CSSProperties = {
  ...buyBtn,
  background: '#999999',
  cursor: 'pointer',
};

const notifyForm: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  alignItems: 'flex-end',
};

const emailInput: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #cccccc',
  fontSize: 14,
  outline: 'none',
  width: 240,
  alignSelf: 'stretch',
};

const notesInput: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #cccccc',
  fontSize: 14,
  outline: 'none',
  width: 240,
  resize: 'vertical' as const,
  fontFamily: 'inherit',
  alignSelf: 'stretch',
};

const confirmedText: React.CSSProperties = {
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: '1rem',
  letterSpacing: 1,
  color: '#16a34a',
};

const backLink: React.CSSProperties = {
  color: '#cc2020',
  textDecoration: 'none',
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: 18,
  letterSpacing: 1,
};

const footer: React.CSSProperties = {
  borderTop: '1px solid #dddddd',
  paddingTop: 24,
};
