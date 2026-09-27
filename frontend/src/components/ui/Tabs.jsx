import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
}) {
  return (
    <div className={`border-b border-rule ${className}`}>
      <nav role="tablist" className="flex gap-6 -mb-px overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`py-3 px-1 text-sm font-medium transition-colors border-b-[3px] whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? 'border-ink text-ink font-semibold'
                  : 'border-transparent text-muted hover:text-text hover:border-rule'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-2 text-xs py-0.5 px-1.5 rounded-xs tabular-nums ${
                    isActive ? 'bg-desk text-ink' : 'bg-desk text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
