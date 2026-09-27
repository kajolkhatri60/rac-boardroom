import React from 'react';

export default function Table({
  columns = [],
  data = [],
  loading = false,
  skeletonRows = 4,
  emptyMessage = 'No records found.',
  emptyAction = null,
  caption,
  className = '',
}) {
  return (
    <div className={`w-full overflow-x-auto bg-paper border border-rule rounded ${className}`}>
      <table className="w-full text-left border-collapse">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-desk border-b border-rule">
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                scope="col"
                className={`px-4 py-2.5 text-[13px] font-semibold text-muted tracking-normal ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.headerClassName || ''}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule text-sm text-text">
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, rIdx) => (
              <tr key={`skeleton-${rIdx}`} className="h-11">
                {columns.map((col, cIdx) => (
                  <td key={`skeleton-${rIdx}-${cIdx}`} className="px-4 py-2.5">
                    <div
                      className={`h-4 bg-desk animate-pulse rounded-xs ${
                        col.align === 'right' ? 'ml-auto w-16' : 'w-24'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-muted"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <p>{emptyMessage}</p>
                  {emptyAction}
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr
                key={row.id || rIdx}
                className="h-11 hover:bg-desk transition-colors"
              >
                {columns.map((col, cIdx) => {
                  const val = col.accessor
                    ? typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : row[col.accessor]
                    : col.key
                    ? row[col.key]
                    : null;

                  return (
                    <td
                      key={col.key || cIdx}
                      className={`px-4 py-2.5 text-sm ${
                        col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(val, row) : val}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
