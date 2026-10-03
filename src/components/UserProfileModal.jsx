import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Image,
  Globe,
  Lock,
  Save,
  Trash2,
  Check,
  AlertCircle,
  Activity,
  Clock,
  Headphones,
  Mic2,
  Film,
  Trophy,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { decodeHTMLEntities, upgradeImg } from '../utils/formatters';

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

// text-base on mobile stops iOS Safari from zooming into focused inputs
const inputCls =
  'w-full h-12 rounded-2xl border border-slate-800 bg-slate-900/80 pl-11 pr-4 text-base text-white placeholder:text-slate-600 transition focus:border-emerald-500/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:h-11 sm:text-sm';

const labelCls = 'mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-300';

function Field({ id, label, icon: Icon, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        {children}
      </div>
    </div>
  );
}

function Highlight({ icon: Icon, label, name, plays, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 sm:flex-col sm:gap-1 sm:text-center">
      <div className={`flex shrink-0 items-center gap-1 text-[11px] font-bold sm:justify-center ${tone}`}>
        <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        <span className="hidden sm:inline">{label}</span>
      </div>
      <div className="min-w-0 flex-1 sm:w-full">
        <p className="text-[11px] font-semibold text-slate-400 sm:hidden">{label}</p>
        <p className="truncate text-sm font-bold text-slate-100">{name}</p>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-slate-400">{plays} plays</span>
    </div>
  );
}

export default function UserProfileModal({ isOpen, onClose, user, token, onUpdateUser, onDeleteAccount }) {
  // Hooks must run on every render, so the early return lives below them
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    preferredLanguages: user?.preferredLanguages || ['telugu', 'hindi'],
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Reset the form each time the modal opens or the user changes
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        preferredLanguages: user.preferredLanguages || ['telugu', 'hindi'],
        newPassword: ''
      });
      setMsg('');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, user]);

  const fetchAnalytics = async () => {
    if (!token) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/analytics/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.analytics) setAnalytics(data.analytics);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, token]);

  // Close on Escape and lock background scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const isError = msg.startsWith('Error');

  const handleLangToggle = (lang) => {
    setFormData((f) => {
      const has = f.preferredLanguages.includes(lang);
      if (has && f.preferredLanguages.length === 1) return f; // keep at least one
      return {
        ...f,
        preferredLanguages: has ? f.preferredLanguages.filter((l) => l !== lang) : [...f.preferredLanguages, lang]
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          avatar: formData.avatar,
          preferredLanguages: formData.preferredLanguages,
          password: formData.newPassword || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      onUpdateUser(data.user);
      setFormData((f) => ({ ...f, newPassword: '' }));
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');
      onDeleteAccount();
      onClose();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
      setShowDeleteConfirm(false);
    }
  };

  const avatarSrc =
    formData.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff&bold=true`;

  return (
    <div
      className="fixed inset-0 z-50 flex select-none items-end justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Your profile"
    >
      <div className="relative flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-emerald-500/30 bg-[#0c1019] text-slate-100 shadow-2xl sm:max-h-[90dvh] sm:max-w-lg sm:rounded-3xl">
        {/* Mobile drag handle (visual cue that this is a sheet) */}
        <div className="flex shrink-0 justify-center pt-2 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 px-4 pb-3 pt-2 sm:px-6 sm:pt-5">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-slate-800">
            <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-2 text-base font-black tracking-tight text-white sm:text-lg">
              <span className="truncate">{user.name}</span>
              {user.isAdmin && (
                <span className="shrink-0 rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
                  Admin
                </span>
              )}
            </h3>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Scrollable body */}
        <div className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {msg && (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-2xl border p-3 text-xs ${
                isError
                  ? 'border-pink-500/40 bg-pink-500/15 text-pink-300'
                  : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {isError ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{msg}</span>
            </div>
          )}

          {/* Listening insights */}
          <section className="space-y-4 rounded-3xl border border-emerald-500/25 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black tracking-tight text-white">Your listening insights</h4>
                <p className="text-[11px] text-slate-400">Live from your play history</p>
              </div>
              <button
                type="button"
                onClick={fetchAnalytics}
                disabled={analyticsLoading}
                aria-label="Refresh insights"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition hover:text-white disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {analyticsLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                Loading your insights…
              </div>
            ) : analytics ? (
              <div className="space-y-4">
                {/* Totals */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      Listen time
                    </div>
                    <p className="truncate text-base font-black text-cyan-300">{analytics.formattedTotalTime}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <Headphones className="h-3.5 w-3.5 text-emerald-400" />
                      Song plays
                    </div>
                    <p className="truncate text-base font-black text-emerald-300">{analytics.totalPlays}</p>
                  </div>
                </div>

                {/* Top artist / actor / language: stacked rows on phones, 3 columns from sm */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Highlight
                    icon={Mic2}
                    label="Top artist"
                    tone="text-violet-400"
                    name={analytics.topArtist?.name || 'N/A'}
                    plays={analytics.topArtist?.plays || 0}
                  />
                  <Highlight
                    icon={Film}
                    label="Top actor"
                    tone="text-pink-400"
                    name={analytics.topActor?.name || 'N/A'}
                    plays={analytics.topActor?.plays || 0}
                  />
                  <Highlight
                    icon={Globe}
                    label="Top language"
                    tone="text-emerald-400"
                    name={analytics.topLanguage?.name || 'Telugu'}
                    plays={analytics.topLanguage?.plays || 0}
                  />
                </div>

                {/* Top songs */}
                <div>
                  <h5 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Trophy className="h-3.5 w-3.5" />
                    Most-played songs
                  </h5>
                  {analytics.topSongs?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {analytics.topSongs.map((song, idx) => (
                        <li
                          key={song.id || idx}
                          className="flex items-center gap-2.5 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-2"
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                              idx === 0
                                ? 'bg-amber-400 text-slate-950'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : 'bg-amber-700/60 text-amber-100'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <img
                            src={upgradeImg(song.image)}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-xl border border-white/10 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-100">{decodeHTMLEntities(song.title)}</p>
                            <p className="truncate text-xs text-slate-400">
                              {decodeHTMLEntities(song.subtitle || song.artist || '')}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-bold text-emerald-400">{song.playCount} plays</p>
                            <p className="font-mono text-[10px] text-slate-400">{song.formattedTimeSpent}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-3 text-center text-xs text-slate-500">
                      No plays yet. Listen to a few songs and your top tracks will show up here.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="py-3 text-center text-xs text-slate-500">
                Insights are unavailable right now. Tap refresh to try again.
              </p>
            )}
          </section>

          {/* Edit form (submit button lives in the sticky footer via form="profile-form") */}
          <form id="profile-form" onSubmit={handleSave} className="space-y-4">
            <Field id="pf-name" label="Full name" icon={User}>
              <input
                id="pf-name"
                type="text"
                required
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field id="pf-phone" label="Phone number" icon={Phone}>
              <input
                id="pf-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field id="pf-avatar" label="Profile picture link" icon={Image}>
              <input
                id="pf-avatar"
                type="url"
                inputMode="url"
                autoCapitalize="none"
                placeholder="https://example.com/photo.jpg"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field id="pf-pass" label="New password (leave blank to keep current)" icon={Lock}>
              <input
                id="pf-pass"
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className={inputCls}
              />
            </Field>

            <fieldset>
              <legend className={labelCls}>
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                Preferred music languages
              </legend>
              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const selected = formData.preferredLanguages.includes(lang);
                  return (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => handleLangToggle(lang)}
                      aria-pressed={selected}
                      className={`h-9 rounded-full px-3.5 text-xs font-bold capitalize transition active:scale-95 ${
                        selected
                          ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">Pick at least one language.</p>
            </fieldset>
          </form>

          {/* Danger zone */}
          <section className="border-t border-slate-800 pt-4">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex h-11 items-center gap-2 rounded-xl text-sm font-bold text-pink-400 transition hover:text-pink-300"
              >
                <Trash2 className="h-4 w-4" />
                Delete my account
              </button>
            ) : (
              <div className="space-y-3 rounded-2xl border border-pink-500/40 bg-pink-500/10 p-4">
                <p className="text-sm font-bold text-pink-300">
                  Delete your account? Your profile, playlists and liked songs will be removed permanently.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="h-11 flex-1 rounded-xl bg-pink-500 text-sm font-bold text-white transition hover:bg-pink-600 active:scale-[0.99]"
                  >
                    Delete account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-11 flex-1 rounded-xl bg-slate-800 text-sm font-semibold text-slate-200 transition hover:text-white"
                  >
                    Keep account
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sticky save bar: always reachable on phones */}
        <footer
          className="shrink-0 border-t border-slate-800 bg-[#0c1019]/95 px-4 pt-3 backdrop-blur sm:px-6"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="submit"
            form="profile-form"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}