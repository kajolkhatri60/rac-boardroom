import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none';

  const variants = {
    primary: 'bg-ink hover:bg-ink-strong text-white border border-transparent disabled:hover:bg-ink',
    secondary: 'bg-paper hover:bg-desk text-ink border border-rule disabled:hover:bg-paper',
    quiet: 'bg-transparent hover:bg-desk text-ink border border-transparent disabled:hover:bg-transparent',
    danger: 'bg-bad hover:bg-[#991B1B] text-white border border-transparent disabled:hover:bg-bad',
  };

  const sizes = {
    md: 'h-9 px-3.5 text-sm',
    sm: 'h-[30px] px-2.5 text-xs',
  };

  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className} relative`}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded">
          <Loader2 className="w-4 h-4 animate-spin" />
        </span>
      )}
      <span className={loading ? 'invisible' : 'inline-flex items-center gap-1.5'}>
        {children}
      </span>
    </button>
  );
}
