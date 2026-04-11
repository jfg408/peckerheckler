'use client';
import Script from 'next/script';

export default function TwemojiInit() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/twemoji@14/dist/twemoji.min.js"
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        (window as any).twemoji?.parse(document.body, { folder: 'svg', ext: '.svg' });
      }}
    />
  );
}
