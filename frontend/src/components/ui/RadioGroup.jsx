import React from 'react';

export default function RadioGroup({
  name,
  label,
  options = [],
  value,
  defaultValue,
  disabled = false,
  onChange,
  className = '',
}) {
  const groupName = name || React.useId();

  return (
    <div role="radiogroup" aria-label={label} className={`space-y-2.5 ${className}`}>
      {label && <span className="block text-sm font-medium text-text mb-1">{label}</span>}
      <div className="space-y-2">
        {options.map((opt) => {
          const optVal = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          const optHint = typeof opt === 'object' ? opt.hint : null;
          const optDisabled = disabled || (typeof opt === 'object' && opt.disabled);
          const isChecked = value !== undefined ? value === optVal : undefined;
          const isDefault = defaultValue !== undefined ? defaultValue === optVal : undefined;

          return (
            <label
              key={optVal}
              className={`flex items-start gap-2.5 cursor-pointer select-none ${
                optDisabled ? 'cursor-not-allowed opacity-60' : ''
              }`}
            >
              <input
                type="radio"
                name={groupName}
                value={optVal}
                checked={isChecked}
                defaultChecked={isDefault}
                disabled={optDisabled}
                onChange={(e) => onChange && onChange(e.target.value)}
                className="w-4 h-4 mt-0.5 rounded-full border border-rule text-ink accent-ink focus:outline-2 focus:outline-focus focus:outline-offset-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="flex flex-col">
                <span className="text-sm text-text">{optLabel}</span>
                {optHint && <span className="text-xs text-muted leading-tight mt-0.5">{optHint}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
