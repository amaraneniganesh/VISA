import React, { useState } from 'react';
import {
  Compass,
  Calendar,
  Users,
  Search,
  Heart,
  ListMusic,
  Disc3,
  Activity,
  Sparkles,
  Zap,
  Globe,
  Mic2,
  Film,
  Disc,
  Radio,
  ChevronDown,
  ChevronRight,
  Clock,
  ShieldAlert,
  Music2
} from 'lucide-react';
import { decodeHTMLEntities, upgradeImg } from '../utils/formatters';

export default function Sidebar({
  activeTab,
  setActiveTab,
  likedSongsCount = 0,
  queueCount = 0,
  onOpenQueue,
  currentTrack,
  isPlaying,
  footerDetails,
  primaryLanguage = 'telugu',
  selectedLanguages = [],
  openDetails,
  user,
  onOpenAdmin,
  userPlaylistsCount = 0
}) {
  const [selectedCategory, setSelectedCategory] = useState('artists');
  const [activeLangTab, setActiveLangTab] = useState('all');
  const [isRegionalOpen, setIsRegionalOpen] = useState(true);

  const navItems = [
    { id: 'home', label: 'Discover', icon: Compass },
    { id: 'years', label: 'Top of the Year', icon: Calendar },
    { id: 'artists', label: 'Artists Spotlight', icon: Users },
    { id: 'search', label: 'Search & Genres', icon: Search },
    { id: 'library', label: 'Liked Songs', icon: Heart, badge: likedSongsCount },
    { id: 'playlists', label: 'My Playlists', icon: ListMusic, badge: userPlaylistsCount },
    { id: 'history', label: 'Recently Played', icon: Clock }
  ];

  const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

  // Extract source data safely supporting both new { all, byLanguage } and legacy format
  const availableLanguages = footerDetails?.byLanguage
    ? [{ language: 'all' }, ...footerDetails.byLanguage]
    : [];

  const getSourceData = () => {
    if (!footerDetails) return { artists: [], actors: [], albums: [], playlists: [] };
    if (activeLangTab === 'all') {
      return footerDetails.all || footerDetails;
    }
    const match = footerDetails.byLanguage?.find(
      (entry) => entry.language.toLowerCase() === activeLangTab.toLowerCase()
    );
    return match || footerDetails.all || footerDetails;
  };

  const currentData = getSourceData();

  const categories = [
    { id: 'artists', label: 'Artists', icon: Mic2, items: currentData?.artists || [] },
    { id: 'actors', label: 'Actors', icon: Film, items: currentData?.actors || [] },
    { id: 'albums', label: 'Albums', icon: Disc, items: currentData?.albums || [] },
    { id: 'playlists', label: 'Playlists', icon: Radio, items: currentData?.playlists || [] }
  ];

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory) || categories[0];
  const activeItems = (currentCategoryObj.items || []).slice(0, 15);

  const spotlightHeaderTitle =
    selectedLanguages?.length === 1
      ? `${primaryLanguage.toUpperCase()} SPOTLIGHT`
      : activeLangTab !== 'all'
      ? `${activeLangTab.toUpperCase()} SPOTLIGHT`
      : 'REGIONAL SPOTLIGHT';

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col h-screen sticky top-0 bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800/80 p-4 pb-28 z-30 select-none overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar space-y-4 pr-0.5">
        {/* Brand Identity */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group px-1 py-1"
        >
          <div className={`relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg transition duration-300 shrink-0 ${
            isPlaying ? 'shadow-emerald-500/40 ring-2 ring-emerald-400/50 scale-105' : 'shadow-emerald-500/25 group-hover:scale-105'
          }`}>
            <Disc3 className={`w-5 h-5 text-slate-950 ${isPlaying ? 'animate-spin-slow' : ''}`} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-tight text-white group-hover:text-emerald-400 transition">
                VISA <span className="text-emerald-400">PLAYER</span>
              </h1>
              <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                HQ
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {isPlaying ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-1" />
                    <span className="w-0.5 bg-cyan-400 rounded-full eq-bar-2" />
                    <span className="w-0.5 bg-teal-400 rounded-full eq-bar-3" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase">Live Audio</span>
                </div>
              ) : (
                <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-cyan-400 inline" /> Vintara Saradaga
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Admin Direct Access */}
        {user?.isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Admin Control Panel</span>
          </button>
        )}

        {/* Main Navigation */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-2.5 py-0.5 block">
            Menu
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Regional Spotlight Section */}
        {footerDetails && (
          <div className="pt-1 space-y-2 border-t border-slate-800/80">
            <button
              onClick={() => setIsRegionalOpen(!isRegionalOpen)}
              className="w-full flex items-center justify-between px-1 py-1 text-left group"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase group-hover:text-cyan-300 transition">
                  {spotlightHeaderTitle}
                </span>
              </div>
              <div className="text-slate-500 group-hover:text-white transition">
                {isRegionalOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
            </button>

            {isRegionalOpen && (
              <div className="space-y-2 animate-in fade-in duration-200">
                {availableLanguages.length > 2 && (
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    {availableLanguages.map((entry) => {
                      const langCode = entry.language.toLowerCase();
                      const isSel = activeLangTab.toLowerCase() === langCode;
                      return (
                        <button
                          key={langCode}
                          onClick={() => setActiveLangTab(langCode)}
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full transition shrink-0 ${
                            isSel
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {langCode === 'all' ? 'All Selected' : langCode}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/80">
                  {categories.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[9px] font-bold transition ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={cat.label}
                      >
                        <CatIcon className="w-3 h-3 mb-0.5" />
                        <span className="truncate max-w-[42px]">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {activeItems.length > 0 ? (
                  <ul className="space-y-0.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                    {activeItems.map((item, idx) => (
                      <li
                        key={item.id || idx}
                        onClick={() => openDetails && openDetails(item)}
                        className="flex items-center justify-between p-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-emerald-400 hover:bg-slate-900/80 cursor-pointer transition group"
                      >
                        <span className="truncate pr-1 group-hover:translate-x-0.5 transition-transform text-[11px]">
                          {decodeHTMLEntities(item.title)}
                        </span>
                        {item.language && (
                          <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-slate-900 text-slate-400 shrink-0">
                            {item.language}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-slate-500 italic py-2 text-center">
                    No {selectedCategory} found
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Persistent Mini Player Preview Box at Sidebar Bottom */}
      {currentTrack && (
        <div className={`absolute bottom-4 left-4 right-4 bg-slate-900/95 border rounded-2xl p-2.5 flex items-center gap-3 shadow-xl transition-all duration-300 ${
          isPlaying ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-slate-800'
        }`}>
          <div className="relative shrink-0">
            <img
              src={upgradeImg(currentTrack.image)}
              alt=""
              className={`w-9 h-9 rounded-xl object-cover border border-white/10 transition duration-500 ${
                isPlaying ? 'ring-2 ring-emerald-400/80 animate-pulse' : ''
              }`}
            />
            {isPlaying && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-slate-950">
                <Music2 className="w-2.5 h-2.5 text-slate-950 animate-bounce" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate">{decodeHTMLEntities(currentTrack.title)}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isPlaying ? (
                <>
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-1" />
                    <span className="w-0.5 bg-cyan-400 rounded-full eq-bar-2" />
                    <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-3" />
                    <span className="w-0.5 bg-teal-400 rounded-full eq-bar-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 truncate">Playing Now</span>
                </>
              ) : (
                <span className="text-[10px] text-slate-400 truncate">Paused</span>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

