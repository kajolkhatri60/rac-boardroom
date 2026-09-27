import React from 'react';

export default function KeyValue({
  items = [],
  children,
  columns = 3,
  className = '',
}) {
  const colClasses = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };

  const gridCols = colClasses[columns] || colClasses[3];

  return (
    <dl className={`grid grid-cols-1 ${gridCols} gap-y-4 gap-x-6 ${className}`}>
      {items.length > 0
        ? items.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${item.span ? `sm:col-span-${item.span}` : ''} ${item.className || ''}`}
            >
              <dt className="text-[13px] text-muted font-normal leading-tight">
                {item.label}
              </dt>
              <dd className="text-[15px] font-medium text-text mt-1 leading-normal break-words">
                {item.value ?? '—'}
              </dd>
            </div>
          ))
        : children}
    </dl>
  );
}

// Subcomponent for custom item layout
KeyValue.Item = function KeyValueItem({ label, value, children, className = '', span }) {
  return (
    <div className={`flex flex-col ${span ? `sm:col-span-${span}` : ''} ${className}`}>
      <dt className="text-[13px] text-muted font-normal leading-tight">
        {label}
      </dt>
      <dd className="text-[15px] font-medium text-text mt-1 leading-normal break-words">
        {children || value || '—'}
      </dd>
    </div>
  );
};
