'use client';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/',       label: 'Home'   },
  { href: '/shop',   label: 'Shop'   },
  { href: '/invest', label: 'Invest' },
  { href: '/legal',  label: 'Legal'  },
];

export default function Nav() {
  const pathname = usePathname();
  const visible = links.filter((l) => l.href !== pathname);

  return (
    <nav style={nav}>
      {visible.map((l) => (
        <a key={l.href} href={l.href} style={link}>{l.label}</a>
      ))}
    </nav>
  );
}

const nav: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  padding: '16px 24px',
  zIndex: 100,
  display: 'flex',
  gap: 24,
};

const link: React.CSSProperties = {
  color: '#cc2020',
  textDecoration: 'none',
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: '1.1rem',
  letterSpacing: 1,
};
