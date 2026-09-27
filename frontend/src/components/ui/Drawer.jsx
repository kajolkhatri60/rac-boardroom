import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function Drawer({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  footer,
  className = '',
}) {
  const drawerRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose && onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/20 transition-opacity duration-150 ease-out"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className={`w-screen max-w-[480px] bg-paper border-l border-rule flex flex-col justify-between transform transition-transform duration-150 ease-out ${className}`}
          style={{ boxShadow: '0 8px 24px rgba(20,48,90,0.12)' }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-rule flex items-center justify-between">
            <div>
              {title && (
                <h2 id="drawer-title" className="text-[17px] font-semibold text-text">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-muted mt-0.5">{description}</p>
              )}
            </div>
            <Button
              variant="quiet"
              size="sm"
              onClick={onClose}
              className="text-muted hover:text-text p-1 h-auto"
              aria-label="Close sheet"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-rule bg-paper flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
