import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Globe, Image, ShieldCheck, LogIn, UserPlus, AlertCircle } from 'lucide-react';

const AVAILABLE_LANGUAGES = [
  'telugu',
  'hindi',
  'tamil',
  'punjabi',
  'malayalam',
  'kannada',
  'english',
  'bhojpuri',
  'bengali',
  'marathi'
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onLoginSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    avatar: '',
    preferredLanguages: ['telugu', 'hindi']
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLangToggle = (lang) => {
    const current = formData.preferredLanguages;
    if (current.includes(lang)) {
      if (current.length > 1) {
        setFormData({ ...formData, preferredLanguages: current.filter((l) => l !== lang) });
      }
    } else {
      setFormData({ ...formData, preferredLanguages: [...current, lang] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = mode === 'login' ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';

    try {
      const payload =
        mode === 'login'
          ? { email: formData.email, password: formData.password }
          : {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              password: formData.password,
              avatar: formData.avatar,
              preferredLanguages: formData.preferredLanguages
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error(`Server returned invalid response (${res.status}). Make sure backend server is running.`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const callback = onAuthSuccess || onLoginSuccess;
      if (callback) callback(data.user, data.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#0c1019] border border-emerald-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                {mode === 'login' ? 'Welcome Back to VISA Music' : 'Create Your VISA Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'login' ? 'Sign in to access your playlists & unlimited HD music' : 'Register for unlimited music streaming'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 my-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'login' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'register' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-pink-500/15 border border-pink-500/40 text-pink-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Full Name *</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Email Address *</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Phone Number (Optional)</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Password *</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Profile Picture (Image URL Link)</label>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1 flex items-center">
                    <Image className="w-4 h-4 text-slate-500 absolute left-3.5" />
                    <input
                      type="url"
                      placeholder="https://example.com/my-photo.jpg"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
                    />
                  </div>
                  {formData.avatar && (
                    <img src={formData.avatar} alt="Preview" className="w-9 h-9 rounded-xl object-cover border border-emerald-500/40 shrink-0" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Favorite Music Languages (Select Preferred)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 max-h-32 overflow-y-auto no-scrollbar">
                  {AVAILABLE_LANGUAGES.map((lang) => {
                    const isSelected = formData.preferredLanguages.includes(lang);
                    return (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => handleLangToggle(lang)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-xl uppercase transition ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Log In to VISA Music' : 'Create Account & Unlock Unlimited Access'}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Logged in users enjoy unlimited 320k HD streaming & zero limits</span>
          </p>
        </div>
      </div>
    </div>
  );
}
