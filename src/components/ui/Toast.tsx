import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
  kind?: 'success' | 'info' | 'error';
}

interface ToastContextValue {
  push: (message: string, kind?: ToastItem['kind']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastItem['kind'] = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems(prev => [...prev, { id, message, kind }]);
    window.setTimeout(() => {
      setItems(prev => prev.filter(t => t.id !== id));
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 pointer-events-none">
        {items.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-lg bg-apple-elevated/95 backdrop-blur-md border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.4)] text-[12.5px] text-white/90 fade-in"
          >
            {t.kind === 'success' ? (
              <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0">
                <Check size={10} className="text-emerald-400" strokeWidth={3} />
              </div>
            ) : t.kind === 'error' ? (
              <div className="w-4 h-4 rounded-full bg-red-400/20 flex items-center justify-center shrink-0">
                <X size={10} className="text-red-400" strokeWidth={3} />
              </div>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook to register ⌘K and other keyboard shortcuts
export const useGlobalKeys = (handlers: Record<string, () => void>) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      // ⌘K / Ctrl+K
      if (mod && k === 'k') {
        e.preventDefault();
        handlers.cmdK?.();
        return;
      }

      // ? opens shortcuts overlay (shift+/)
      if (e.key === '?' && !mod) {
        e.preventDefault();
        handlers.question?.();
        return;
      }

      // Esc
      if (e.key === 'Escape') {
        handlers.escape?.();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
};