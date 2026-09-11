import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Custom Event bridge to allow triggering toasts from non-React utility callbacks
const TOAST_EVENT_NAME = 'outcomeintel:toast';

export const dispatchGlobalToast = (type: ToastType, message: string, title?: string, duration?: number) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(TOAST_EVENT_NAME, {
      detail: { type, message, title, duration }
    });
    window.dispatchEvent(event);
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, title?: string, duration: number = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id, type, title, message, duration };

    setToasts(prev => [...prev.slice(-4), newToast]); // Keep maximum 5 on screen

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast('success', message, title || 'Success');
  }, [showToast]);

  const showError = useCallback((message: string, title?: string) => {
    showToast('error', message, title || 'Notice', 5500);
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    showToast('warning', message, title || 'Attention', 5000);
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    showToast('info', message, title || 'Information');
  }, [showToast]);

  // Listen for global custom events
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: ToastType; message: string; title?: string; duration?: number }>;
      if (customEvent.detail) {
        const { type, message, title, duration } = customEvent.detail;
        showToast(type, message, title, duration);
      }
    };

    window.addEventListener(TOAST_EVENT_NAME, handleGlobalToast);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handleGlobalToast);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      {/* Fixed Toast Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map(toast => {
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isSuccess = toast.type === 'success';

          return (
            <div
              key={toast.id}
              role={isError ? 'alert' : 'status'}
              className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border text-xs flex items-start space-x-3 animate-slide-in backdrop-blur-sm transition-all ${
                isSuccess
                  ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/80 shadow-emerald-950/30'
                  : isError
                  ? 'bg-rose-950/95 text-rose-100 border-rose-700/80 shadow-rose-950/30'
                  : isWarning
                  ? 'bg-amber-950/90 text-amber-100 border-amber-700/80 shadow-amber-950/30'
                  : 'bg-slate-900/95 text-slate-100 border-slate-700/80 shadow-slate-950/30'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {isError && <AlertCircle className="h-4 w-4 text-rose-400" />}
                {isWarning && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                {toast.type === 'info' && <Info className="h-4 w-4 text-indigo-400" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <div className="font-bold text-[11px] uppercase tracking-wider mb-0.5 opacity-90">
                    {toast.title}
                  </div>
                )}
                <div className="text-xs leading-relaxed break-words font-medium">
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback safe dummy if used outside provider
    return {
      toasts: [],
      showToast: dispatchGlobalToast,
      showSuccess: (msg, title) => dispatchGlobalToast('success', msg, title),
      showError: (msg, title) => dispatchGlobalToast('error', msg, title),
      showWarning: (msg, title) => dispatchGlobalToast('warning', msg, title),
      showInfo: (msg, title) => dispatchGlobalToast('info', msg, title),
      removeToast: () => {}
    };
  }
  return context;
};

