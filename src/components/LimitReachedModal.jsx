import React from 'react';
import { ShieldAlert, Sparkles, LogIn, UserPlus, X } from 'lucide-react';

export default function LimitReachedModal({ isOpen, onClose, onOpenAuth }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#0c1019] border border-pink-500/40 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-slate-100 text-center space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center mx-auto shadow-xl shadow-pink-500/20">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-white tracking-tight">
            15-Minute Guest Limit Reached
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            You've reached the 15-minute daily music preview limit for guest users today.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl text-left space-y-2">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unlock Premium Features Free:</span>
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li>Unlimited 24/7 HD music streaming</li>
            <li>Create & save custom playlists</li>
            <li>Heart & sync your favorite songs</li>
            <li>Full playback & search history sync</li>
          </ul>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenAuth('register');
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Free Account</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenAuth('login');
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:text-white hover:border-slate-700 transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            <span>Log In Existing Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
