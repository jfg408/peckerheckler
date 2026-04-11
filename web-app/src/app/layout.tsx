import type { Metadata } from 'next';
import { Bebas_Neue, Inter } from 'next/font/google';
import Nav from '../components/Nav';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-display' });
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'PeckerHeckler',
  description: 'WiFi-connected woodpecker detection and deterrent system.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${inter.variable}`}>
      <body style={{ margin: 0, background: '#f5f5f5', color: '#111111', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
