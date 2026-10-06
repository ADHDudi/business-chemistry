import React from 'react';

// JUS-467: the in-app Bond logo. Sized by `.brand-icon` in src/index.css
// (80px mobile / 96px from 640px) so it never depends on the Tailwind CDN.
export default function BrandIcon({ className = '' }: { className?: string }) {
  return (
    <img
      src="/bond-icon.svg"
      alt="Bond"
      width={96}
      height={96}
      draggable={false}
      className={`brand-icon ${className}`.trim()}
    />
  );
}
