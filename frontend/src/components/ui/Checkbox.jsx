import React from 'react';

export default function Checkbox({
  id,
  name,
  checked,
  defaultChecked,
  disabled = false,
  required = false,
  onChange,
  label,
  hint,
  className = '',
  ...props
}) {
  const generatedId = id || React.useId();

  return (
    <label
      htmlFor={generatedId}
      className={`inline-flex items-start gap-2.5 cursor-pointer select-none ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      } ${className}`}
    >
      <input
        id={generatedId}
        name={name}
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        required={required}
        onChange={onChange}
        className="w-4 h-4 mt-0.5 rounded border border-rule text-ink accent-ink focus:outline-2 focus:outline-focus focus:outline-offset-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
        {...props}
      />
      {(label || hint) && (
        <span className="flex flex-col">
          {label && <span className="text-sm text-text font-normal">{label}</span>}
          {hint && <span className="text-xs text-muted leading-tight mt-0.5">{hint}</span>}
        </span>
      )}
    </label>
  );
}
