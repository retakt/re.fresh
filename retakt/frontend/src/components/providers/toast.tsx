import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import BasicToast, { type ToastType } from '@/components/ui/smoothui/basic-toast';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Global toast manager for imperative API
class ToastManager {
  private listeners: Set<(toasts: ToastItem[]) => void> = new Set();
  private toasts: ToastItem[] = [];

  subscribe(listener: (toasts: ToastItem[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  addToast(message: string, type: ToastType, duration = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, message, type, duration };
    
    this.toasts.push(newToast);
    this.notify();
    
    // Auto remove after duration (unless it's a loading toast with duration 0)
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
    
    return id;
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  dismissToast(id: string) {
    this.removeToast(id);
  }
}

const toastManager = new ToastManager();

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  React.useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return () => {
      unsubscribe();
    };
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    return toastManager.addToast(message, type, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    toastManager.removeToast(id);
  }, []);

  const contextValue: ToastContextType = {
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Render all active toasts - top center with glass effect */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none w-full max-w-md px-4">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{
              transform: `translateY(${index * 4}px)`,
            }}
          >
            <BasicToast
              message={toast.message}
              type={toast.type}
              duration={0} // Disable auto-close since we handle it in the manager
              onClose={() => removeToast(toast.id)}
              className="!static !top-auto !right-auto !transform-none backdrop-blur-xl dark:bg-[#191919]/80 bg-[#e8e4d9]/80 border dark:border-white/10 border-black/10" // Glass effect
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return {
    success: (message: string, options?: { duration?: number }) => 
      context.addToast(message, 'success', options?.duration),
    error: (message: string, options?: { duration?: number }) => 
      context.addToast(message, 'error', options?.duration),
    warning: (message: string, options?: { duration?: number }) => 
      context.addToast(message, 'warning', options?.duration),
    info: (message: string, options?: { duration?: number }) => 
      context.addToast(message, 'info', options?.duration),
  };
}

// Export a toast object that matches the sonner API for easier migration
export const toast = {
  success: (message: string, options?: { duration?: number; description?: string }) => {
    // For now, combine message and description if provided
    const fullMessage = options?.description ? `${message}\n${options.description}` : message;
    return toastManager.addToast(fullMessage, 'success', options?.duration);
  },
  error: (message: string, options?: { duration?: number; description?: string }) => {
    const fullMessage = options?.description ? `${message}\n${options.description}` : message;
    return toastManager.addToast(fullMessage, 'error', options?.duration);
  },
  warning: (message: string, options?: { duration?: number; description?: string }) => {
    const fullMessage = options?.description ? `${message}\n${options.description}` : message;
    return toastManager.addToast(fullMessage, 'warning', options?.duration);
  },
  info: (message: string, options?: { duration?: number; description?: string }) => {
    const fullMessage = options?.description ? `${message}\n${options.description}` : message;
    return toastManager.addToast(fullMessage, 'info', options?.duration);
  },
  loading: (message: string, options?: { duration?: number; description?: string }) => {
    const fullMessage = options?.description ? `${message}\n${options.description}` : message;
    // Loading toasts don't auto-dismiss by default
    return toastManager.addToast(fullMessage, 'info', options?.duration || 0);
  },
  dismiss: (id: string) => {
    toastManager.dismissToast(id);
  },
};