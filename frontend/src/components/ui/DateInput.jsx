import React from 'react';

export default function DateInput({
  id,
  name,
  value,
  defaultValue,
  min,
  max,
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
    <input
      id={id}
      name={name}
      type="date"
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      disabled={disabled}
      required={required}
      onChange={onChange}
      onBlur={onBlur}
      className={`w-full h-9 px-3 text-sm text-text bg-paper rounded border ${borderClass} focus:outline-2 focus:outline-offset-2 transition-colors disabled:bg-desk disabled:text-muted disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}
