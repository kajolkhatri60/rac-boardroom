import React from 'react';
import { Link } from 'react-router-dom';

export default function PageHeader({
  breadcrumbs = [],
  title,
  reference,
  actions,
  className = '',
}) {
  return (
    <div className={`mb-6 space-y-2 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center flex-wrap gap-1.5 text-[13px] text-muted">
            {breadcrumbs.map((item, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <li key={idx} className="inline-flex items-center gap-1.5">
                  {idx > 0 && <span className="text-muted/60" aria-hidden="true">/</span>}
                  {item.href && !isLast ? (
                    <Link
                      to={item.href}
                      className="hover:text-ink transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-text font-medium' : ''}>
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-[22px] sm:text-[28px] text-text tracking-tight leading-snug">
            {title}
          </h1>
          {reference && (
            <p className="text-xs text-muted font-mono mt-1">
              {reference}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
