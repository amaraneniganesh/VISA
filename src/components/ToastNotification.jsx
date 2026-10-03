import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function ToastNotification({ message }) {
  if (!message) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl glass-panel border border-emerald-500/40 shadow-2xl text-slate-100 text-xs font-bold shadow-emerald-500/20">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
