'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FaRegCheckCircle } from "react-icons/fa";
import { TbXboxX, TbInfoCircle } from "react-icons/tb";



interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }
interface ToastCtx { showToast: (msg: string, type?: 'success' | 'error' | 'info') => void; }

const ToastContext = createContext<ToastCtx | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const icons = { success: <FaRegCheckCircle />, error: <TbXboxX />, info: <TbInfoCircle /> };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{icons[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
