import React from 'react';

export default function EvidenceMeter({
  level = 'none', // 'none' | 'some' | 'strong' | 0 | 1 | 2
  unverified = false,
  className = '',
}) {
  const normLevel = typeof level === 'string' ? level.toLowerCase().trim() : level === 2 ? 'strong' : level === 1 ? 'some' : 'none';

  let filledCount = 0;
  let label = 'None';

  if (!unverified) {
    if (normLevel === 'strong' || normLevel === '2') {
      filledCount = 2;
      label = 'Strong';
    } else if (normLevel === 'some' || normLevel === '1') {
      filledCount = 1;
      label = 'Some';
    } else {
      filledCount = 0;
      label = 'None';
    }
  } else {
    filledCount = 0;
    label = 'None';
  }

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        {/* Box 1 */}
        <span
          className={`w-2.5 h-2.5 border border-ink ${
            filledCount >= 1 ? 'bg-ink' : 'bg-transparent'
          }`}
        />
        {/* Box 2 */}
        <span
          className={`w-2.5 h-2.5 border border-ink ${
            filledCount === 2 ? 'bg-ink' : 'bg-transparent'
          }`}
        />
      </span>
      <span className="text-sm font-medium text-ink tabular-nums">
        {label}
      </span>
      {unverified && (
        <span className="text-xs px-1.5 py-0.5 rounded-xs bg-bad-bg text-bad font-medium border border-bad/30">
          Unverified
        </span>
      )}
    </div>
  );
}
