import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

export default function EmptyState({
  message = 'No records to display.',
  actionLabel,
  onAction,
  actionHref,
  actionComponent,
  className = '',
}) {
  return (
    <div
      className={`p-12 text-center flex flex-col items-center justify-center bg-paper rounded-[6px] border border-rule ${className}`}
    >
      <p className="text-sm text-muted max-w-md leading-normal mb-4">
        {message}
      </p>

      {actionComponent ? (
        actionComponent
      ) : actionHref && actionLabel ? (
        <Link to={actionHref}>
          <Button variant="primary">
            {actionLabel}
          </Button>
        </Link>
      ) : onAction && actionLabel ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
