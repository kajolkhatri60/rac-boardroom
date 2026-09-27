import React from 'react';

export default function TextArea({
  id,
  name,
  rows = 4,
  value,
  defaultValue,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  error = false,
  onChange,
  onBlur,
  onFocus,
  className = '',
  ...props
}) {
  const isInvalid = error || props['aria-invalid'] === 'true' || props['aria-invalid'] === true;

  const borderClass = isInvalid
    ? 'border-bad focus:outline-bad'
    : 'border-rule focus:outline-focus';

  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      className={`w-full p-2.5 text-sm text-text bg-paper rounded border ${borderClass} focus:outline-2 focus:outline-offset-2 transition-colors disabled:bg-desk disabled:text-muted disabled:cursor-not-allowed placeholder:text-muted/60 resize-y ${className}`}
      {...props}
    />
  );
}
