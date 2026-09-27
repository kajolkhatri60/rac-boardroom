import React from 'react';
import { Info, AlertTriangle, AlertCircle } from 'lucide-react';

export default function Banner({
  variant = 'info',
  message,
  children,
  action,
  className = '',
}) {
  const configs = {
    info: {
      border: 'border-ink/20',
      bg: 'bg-[#EDF3FA]',
      text: 'text-ink',
      icon: <Info className="w-4 h-4 shrink-0 text-ink" aria-hidden="true" />,
    },
    warn: {
      border: 'border-warn/30',
      bg: 'bg-warn-bg',
      text: 'text-warn',
      icon: <AlertTriangle className="w-4 h-4 shrink-0 text-warn" aria-hidden="true" />,
    },
    bad: {
      border: 'border-bad/30',
      bg: 'bg-bad-bg',
      text: 'text-bad',
      icon: <AlertCircle className="w-4 h-4 shrink-0 text-bad" aria-hidden="true" />,
    },
  };

  const config = configs[variant] || configs.info;
  const isAlert = variant === 'bad' || variant === 'warn';

  return (
    <div
      role={isAlert ? 'alert' : 'status'}
      className={`w-full p-3.5 rounded border ${config.border} ${config.bg} flex items-start justify-between gap-3 text-sm ${config.text} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5">{config.icon}</span>
        <div className="font-medium leading-snug">
          {message || children}
        </div>
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
