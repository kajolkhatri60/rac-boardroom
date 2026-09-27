import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast = {
      id,
      message: typeof toast === 'string' ? toast : toast.message,
      variant: toast.variant || 'success', // success, error, info
      duration: toast.duration || 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-ok shrink-0 mt-0.5" aria-hidden="true" />,
    error: <AlertCircle className="w-4 h-4 text-bad shrink-0 mt-0.5" aria-hidden="true" />,
    info: <Info className="w-4 h-4 text-ink shrink-0 mt-0.5" aria-hidden="true" />,
  };

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start justify-between gap-3 p-3.5 bg-paper rounded border border-rule text-sm text-text transform transition-all duration-150 ease-out"
      style={{ boxShadow: '0 8px 24px rgba(20,48,90,0.12)' }}
    >
      <div className="flex items-start gap-2.5">
        {icons[toast.variant] || icons.info}
        <span className="font-medium leading-snug">{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-muted hover:text-text cursor-pointer p-0.5 rounded transition-colors -mr-1 -mt-0.5"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ToastProvider;
