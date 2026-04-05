// Loading spinner and skeleton components
import React from 'react';

export function Spinner({ size = 'md' }) {
  return <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} />;
}

export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="loading-page">
      <Spinner />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{message}</p>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton" style={{ height: 20, width: '60%', borderRadius: 4 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, width: `${80 - i * 15}%`, borderRadius: 4 }} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}
