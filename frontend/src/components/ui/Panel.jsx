import React from 'react';

export default function Panel({
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClassName = 'p-6',
}) {
  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <div className={`bg-paper border border-rule rounded-[6px] overflow-hidden ${className}`}>
      {hasHeader && (
        <div className="px-6 py-4 border-b border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-paper">
          <div>
            {title && (
              <h2 className="text-[17px] font-semibold text-text tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-muted mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={bodyClassName}>
        {children}
      </div>
    </div>
  );
}
