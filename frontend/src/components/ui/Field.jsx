import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Field({
  label,
  id,
  hint,
  error,
  optional = false,
  children,
  className = '',
}) {
  const generatedId = id || React.useId();
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  // Clone single input element if valid to automatically attach id and aria attributes
  let childContent = children;
  if (React.isValidElement(children)) {
    childContent = React.cloneElement(children, {
      id: children.props.id || generatedId,
      'aria-invalid': error ? 'true' : undefined,
      'aria-describedby': children.props['aria-describedby'] || describedBy,
    });
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex flex-col gap-0.5">
          <label
            htmlFor={generatedId}
            className="text-sm font-medium text-text select-none"
          >
            {label}
            {optional && (
              <span className="text-muted font-normal text-xs ml-1.5">
                (optional)
              </span>
            )}
          </label>
          {hint && (
            <p id={hintId} className="text-xs text-muted leading-tight">
              {hint}
            </p>
          )}
        </div>
      )}

      {childContent}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="inline-flex items-center gap-1.5 text-xs text-bad font-medium mt-1"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
