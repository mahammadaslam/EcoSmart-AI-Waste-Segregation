import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, WifiOff } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'network';
}

interface ToastProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4500); // Auto-dismiss after 4.5 seconds

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getStyleAndIcon = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
          border: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400',
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
          border: 'border-rose-500/20 bg-rose-500/10 text-rose-800 dark:text-rose-400',
        };
      case 'warning':
      case 'network':
        return {
          icon: <WifiOff className="w-4 h-4 text-amber-500" />,
          border: 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-400',
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-blue-500" />,
          border: 'border-blue-500/20 bg-blue-500/10 text-blue-800 dark:text-blue-400',
        };
    }
  };

  const { icon, border } = getStyleAndIcon();

  return (
    <div
      className={`min-w-64 max-w-sm p-3.5 rounded-xl border flex items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-slideIn ${border}`}
    >
      <div className="flex items-center space-x-2.5">
        <div className="shrink-0">{icon}</div>
        <p className="text-xxs font-bold leading-relaxed">{toast.message}</p>
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="text-current hover:opacity-80 transition duration-150 p-1 rounded-md cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-55 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

// Convenient custom state manager for toasts
export function useToasts() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = (message: string, type: ToastItem['type'] = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
