// Progress Bar component
import React from 'react';
import { calcProgress } from '../../utils';

export default function ProgressBar({ current, target, height = 8, showLabel = false, color }) {
  const pct = calcProgress(current, target);

  return (
    <div>
      <div className="progress-bar-container" style={{ height }}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${pct}%`,
            background: color || 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
          }}
        />
      </div>
      {showLabel && (
        <div className="progress-bar-label" style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          marginTop: 4,
        }}>
          <span>{current} / {target}</span>
          <span>{pct}%</span>
        </div>
      )}
    </div>
  );
}
