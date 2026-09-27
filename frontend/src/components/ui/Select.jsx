import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  id,
  name,
  value,
  defaultValue,
  options = [],
  children,
  disabled = false,
  required = false,
  error = false,
  onChange,
  onBlur,
  className = '',
  ...props
}) {
  const isInvalid = error || props['aria-invalid'] === 'true' || props['aria-invalid'] === true;

  const borderClass = isInvalid
    ? 'border-bad focus:outline-bad'
    : 'border-rule focus:outline-focus';

  return (
    <div className="relative w-full">
      <select
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full h-9 pl-3 pr-8 text-sm text-text bg-paper rounded border ${borderClass} focus:outline-2 focus:outline-offset-2 transition-colors disabled:bg-desk disabled:text-muted disabled:cursor-not-allowed appearance-none cursor-pointer ${className}`}
        {...props}
      >
        {options.length > 0
          ? options.map((opt) => {
              const optVal = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const optDisabled = typeof opt === 'object' ? opt.disabled : false;
              return (
                <option key={optVal} value={optVal} disabled={optDisabled}>
                  {optLabel}
                </option>
              );
            })
          : children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted">
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      </div>
    </div>
  );
}
