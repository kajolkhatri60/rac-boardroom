import React, { useEffect, useRef } from 'react';
import Button from './Button';

export default function Modal({
  isOpen = false,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
  children,
  className = '',
}) {
  const modalRef = useRef(null);

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
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/20 transition-opacity duration-150 ease-out"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className={`relative bg-paper rounded-[6px] border border-rule w-full max-w-md p-6 transform transition-all duration-150 ease-out ${className}`}
        style={{ boxShadow: '0 8px 24px rgba(20,48,90,0.12)' }}
      >
        <h3 id="modal-title" className="text-[17px] font-semibold text-text tracking-tight">
          {title}
        </h3>

        {description && (
          <p id="modal-description" className="text-sm text-muted mt-2 leading-relaxed">
            {description}
          </p>
        )}

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
