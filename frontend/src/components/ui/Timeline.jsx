import React from 'react';

export default function Timeline({
  events = [],
  children,
  className = '',
}) {
  return (
    <div className={`relative pl-6 space-y-6 ${className}`}>
      {/* Continuous vertical line */}
      <div
        className="absolute top-2 bottom-2 left-[7px] w-px bg-rule"
        aria-hidden="true"
      />

      {events.length > 0
        ? events.map((item, idx) => (
            <div key={item.id || idx} className="relative flex items-start gap-3">
              {/* Dot on line */}
              <div
                className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-paper bg-ink shrink-0 ring-2 ring-rule"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <h4 className="text-sm font-medium text-text leading-snug">
                    {item.title}
                  </h4>
                  {item.timestamp && (
                    <span className="text-xs text-muted tabular-nums whitespace-nowrap">
                      {item.timestamp}
                    </span>
                  )}
                </div>
                {item.actor && (
                  <p className="text-xs text-muted mt-0.5">
                    by {item.actor}
                  </p>
                )}
                {item.description && (
                  <p className="text-xs text-muted mt-1 leading-normal">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))
        : children}
    </div>
  );
}

Timeline.Item = function TimelineItem({
  title,
  timestamp,
  actor,
  description,
  children,
}) {
  return (
    <div className="relative flex items-start gap-3">
      <div
        className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-paper bg-ink shrink-0 ring-2 ring-rule"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h4 className="text-sm font-medium text-text leading-snug">
            {title}
          </h4>
          {timestamp && (
            <span className="text-xs text-muted tabular-nums whitespace-nowrap">
              {timestamp}
            </span>
          )}
        </div>
        {actor && (
          <p className="text-xs text-muted mt-0.5">
            by {actor}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted mt-1 leading-normal">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};
