import React from 'react';

// Vocabulary categories from UI guide section 2 & 9:
// ok: Shortlisted, Verified, Evidenced, Connected, Completed, Published, Strong
// warn: Under review, In progress, Pending, Partial, Needs attention, Interview scheduled, Scheduled, Some
// bad: Rejected, Not shortlisted, Failed, Missing, Errors, Disconnected, Unverified
// neutral: Draft, Queued, Submitted, Closed

const STATUS_CONFIGS = {
  // ok statuses
  published: { text: 'text-ok', bg: 'bg-ok-bg', dot: 'bg-ok' },
  shortlisted: { text: 'text-ok', bg: 'bg-ok-bg', dot: 'bg-ok' },
  completed: { text: 'text-ok', bg: 'bg-ok-bg', dot: 'bg-ok' },
  verified: { text: 'text-ok', bg: 'bg-ok-bg', dot: 'bg-ok' },
  evidenced: { text: 'text-ok', bg: 'bg-ok-bg', dot: 'bg-ok' },
  connected: { text: 'text-ok', bg: 'bg-ok-bg', dot: 'bg-ok' },
  strong: { text: 'text-ok', bg: 'bg-ok-bg', dot: 'bg-ok' },

  // warn statuses
  'under review': { text: 'text-warn', bg: 'bg-warn-bg', dot: 'bg-warn' },
  'in progress': { text: 'text-warn', bg: 'bg-warn-bg', dot: 'bg-warn' },
  scheduled: { text: 'text-warn', bg: 'bg-warn-bg', dot: 'bg-warn' },
  'interview scheduled': { text: 'text-warn', bg: 'bg-warn-bg', dot: 'bg-warn' },
  pending: { text: 'text-warn', bg: 'bg-warn-bg', dot: 'bg-warn' },
  partial: { text: 'text-warn', bg: 'bg-warn-bg', dot: 'bg-warn' },
  'needs attention': { text: 'text-warn', bg: 'bg-warn-bg', dot: 'bg-warn' },
  some: { text: 'text-warn', bg: 'bg-warn-bg', dot: 'bg-warn' },

  // bad statuses
  'not shortlisted': { text: 'text-bad', bg: 'bg-bad-bg', dot: 'bg-bad' },
  rejected: { text: 'text-bad', bg: 'bg-bad-bg', dot: 'bg-bad' },
  failed: { text: 'text-bad', bg: 'bg-bad-bg', dot: 'bg-bad' },
  missing: { text: 'text-bad', bg: 'bg-bad-bg', dot: 'bg-bad' },
  errors: { text: 'text-bad', bg: 'bg-bad-bg', dot: 'bg-bad' },
  disconnected: { text: 'text-bad', bg: 'bg-bad-bg', dot: 'bg-bad' },
  unverified: { text: 'text-bad', bg: 'bg-bad-bg', dot: 'bg-bad' },

  // neutral / muted statuses
  draft: { text: 'text-muted', bg: 'bg-desk', dot: 'bg-muted' },
  queued: { text: 'text-muted', bg: 'bg-desk', dot: 'bg-muted' },
  submitted: { text: 'text-ink', bg: 'bg-desk', dot: 'bg-ink' },
  closed: { text: 'text-muted', bg: 'bg-desk', dot: 'bg-muted' },
  'interview completed': { text: 'text-ink', bg: 'bg-desk', dot: 'bg-ink' },
};

export default function StatusTag({ status, label, variant, className = '' }) {
  const normStatus = (status || label || '').toLowerCase().trim();
  const explicitVariant = variant
    ? variant === 'ok'
      ? { text: 'text-ok', bg: 'bg-ok-bg', dot: 'bg-ok' }
      : variant === 'warn'
      ? { text: 'text-warn', bg: 'bg-warn-bg', dot: 'bg-warn' }
      : variant === 'bad'
      ? { text: 'text-bad', bg: 'bg-bad-bg', dot: 'bg-bad' }
      : { text: 'text-muted', bg: 'bg-desk', dot: 'bg-muted' }
    : null;

  const config = explicitVariant || STATUS_CONFIGS[normStatus] || {
    text: 'text-text',
    bg: 'bg-desk',
    dot: 'bg-muted',
  };

  const displayText = label || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text} select-none border border-transparent ${className}`}
    >
      <span className={`w-2 h-2 rounded-xs shrink-0 ${config.dot}`} aria-hidden="true" />
      <span>{displayText}</span>
    </span>
  );
}
