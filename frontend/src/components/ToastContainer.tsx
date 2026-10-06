import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-5 z-[60] flex flex-col gap-2 sm:max-w-sm sm:w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 pointer-events-auto transition-all animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-white border-emerald-300 text-gray-900 ring-2 ring-emerald-500/20'
              : toast.type === 'error'
              ? 'bg-white border-red-300 text-gray-900 ring-2 ring-red-500/20'
              : 'bg-white border-blue-300 text-gray-900 ring-2 ring-blue-500/20'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}

          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-xs text-gray-900 font-heading">{toast.title}</h5>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{toast.description}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
