import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Globe,
  Check,
  Disc3,
  Play,
  MoreVertical,
  Mic2,
  Film,
  Disc,
  Radio,
  Sparkles,
  User,
  LogIn,
  ShieldAlert,
  Clock,
  Trash2,
  Timer
} from 'lucide-react';
import { decodeHTMLEntities } from '../utils/formatters';

export default function Navbar({
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  showSuggestions,
  setShowSuggestions,
  autoSuggestions,
  handleCardClick,
  searchContainerRef,
  selectedLanguages = [],
  toggleLanguage,
  ALL_LANGUAGES = [],
  upgradeImg,
  activeTab,
  setActiveTab,
  footerDetails,
  openDetails,
  primaryLanguage = 'telugu',
  user,
  onOpenAuth,
  onOpenProfile,
  onOpenAdmin,
  searchHistory = [],
  onClearSearchHistory,
  guestTimeRemaining = 900
}) {
  const [showMobileSpotlightMenu, setShowMobileSpotlightMenu] = useState(false);
  const [mobileCategory, setMobileCategory] = useState('artists');
  const spotlightMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutsideSpotlight = (event) => {
      if (spotlightMenuRef.current && !spotlightMenuRef.current.contains(event.target)) {
        setShowMobileSpotlightMenu(false);
      }
    };

    if (showMobileSpotlightMenu) {
      document.addEventListener('mousedown', handleClickOutsideSpotlight);
      document.addEventListener('touchstart', handleClickOutsideSpotlight);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideSpotlight);
      document.removeEventListener('touchstart', handleClickOutsideSpotlight);
    };
  }, [showMobileSpotlightMenu]);

  const hasSuggestions =
    autoSuggestions.songs.length > 0 ||
    autoSuggestions.albums.length > 0 ||
    autoSuggestions.artists.length > 0 ||
    searchHistory.length > 0;

  // Extract source data for mobile spotlight
  const getSourceData = () => {
    if (!footerDetails) return { artists: [], actors: [], albums: [], playlists: [] };
    return footerDetails.all || footerDetails;
  };
  const mobileData = getSourceData();
  const mobileCategories = [
    { id: 'artists', label: 'Artists', icon: Mic2, items: mobileData?.artists || [] },
    { id: 'actors', label: 'Actors', icon: Film, items: mobileData?.actors || [] },
    { id: 'albums', label: 'Albums', icon: Disc, items: mobileData?.albums || [] },
    { id: 'playlists', label: 'Playlists', icon: Radio, items: mobileData?.playlists || [] }
  ];
  const currentMobileCatObj = mobileCategories.find((c) => c.id === mobileCategory) || mobileCategories[0];
  const activeMobileItems = (currentMobileCatObj.items || []).slice(0, 15);

  const formatGuestTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-6 py-3 flex items-center justify-between gap-3 relative">
      {/* Mobile Brand */}
      <div className="flex items-center gap-3 lg:hidden shrink-0">
        <div onClick={() => setActiveTab('home')} className="flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Disc3 className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-base font-extrabold text-white tracking-tight hidden xs:inline">
            VISA <span className="text-emerald-400">PLAYER</span>
          </span>
        </div>
      </div>

      {/* Search Input Container */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-xl">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search songs, albums, artists, playlists..."
            className="w-full glass-input rounded-2xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 outline-none transition focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 shadow-inner"
          />
          <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-2.5 sm:top-3" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Search Autocomplete & Recent Search History Dropdown */}
        {showSuggestions && hasSuggestions && (
          <div className="absolute top-full mt-2 w-full bg-[#0d121d] border border-emerald-500/40 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden z-50 divide-y divide-slate-800/80 max-h-[75vh] overflow-y-auto">
            {/* Recent Search History Section */}
            {searchHistory.length > 0 && (
              <div className="p-2.5">
                <div className="flex items-center justify-between px-2 pb-1.5">
                  <span className="text-[10px] font-black tracking-wider text-cyan-400 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>Recent Searches</span>
                  </span>
                  {onClearSearchHistory && (
                    <button
                      type="button"
                      onClick={onClearSearchHistory}
                      className="text-[10px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear History</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 p-1">
                  {searchHistory.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(term);
                        handleSearchSubmit({ preventDefault: () => {} });
                      }}
                      className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/50 transition"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Songs Category */}
            {autoSuggestions.songs.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-black tracking-wider text-emerald-400 uppercase px-3 py-1.5 block">
                  Songs
                </span>
                {autoSuggestions.songs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => handleCardClick(song)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/90 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={upgradeImg(song.image)}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover bg-slate-800 shrink-0 border border-white/5"
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 truncate">
                          {decodeHTMLEntities(song.title)}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {decodeHTMLEntities(song.subtitle || 'Song')}
                        </p>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-emerald-500/15 group-hover:bg-emerald-500 group-hover:text-black text-emerald-400 flex items-center justify-center transition shrink-0">
                      <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Albums Category */}
            {autoSuggestions.albums.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-black tracking-wider text-cyan-400 uppercase px-3 py-1.5 block">
                  Albums
                </span>
                {autoSuggestions.albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => handleCardClick(album)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/90 transition cursor-pointer group"
                  >
                    <img
                      src={upgradeImg(album.image)}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover bg-slate-800 shrink-0 border border-white/5"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 truncate">
                        {decodeHTMLEntities(album.title)}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {decodeHTMLEntities(album.subtitle || 'Album')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Artists Category */}
            {autoSuggestions.artists.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-black tracking-wider text-violet-400 uppercase px-3 py-1.5 block">
                  Artists
                </span>
                {autoSuggestions.artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => handleCardClick(artist)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/90 transition cursor-pointer group"
                  >
                    <img
                      src={upgradeImg(artist.image)}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover bg-slate-800 shrink-0 border border-white/5"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-100 group-hover:text-violet-400 truncate">
                        {decodeHTMLEntities(artist.title)}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">Artist</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Language Pills Toolbar */}
      <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-1 shrink-0">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        {ALL_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguages.includes(lang);
          return (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase transition shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md ring-1 ring-emerald-400'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              <span>{lang}</span>
            </button>
          );
        })}
      </div>

      {/* User Auth / Admin / Profile & Guest Limit Badge */}
      <div className="flex items-center gap-2 shrink-0">
        {user ? (
          <div className="flex items-center gap-2">
            {user.isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black hover:bg-cyan-500 hover:text-slate-950 transition shadow-lg shadow-cyan-500/20"
                title="Admin Control Panel"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Panel</span>
              </button>
            )}

            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition group"
              title="User Profile & Settings"
            >
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff&bold=true`}
                alt=""
                className="w-7 h-7 rounded-xl object-cover border border-emerald-500/40 shrink-0"
              />
              <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 hidden sm:inline max-w-[100px] truncate">
                {user.name}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Guest 15-Min Limit Badge */}
            <div className="hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300">
              <Timer className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span>Guest: <strong className="text-emerald-400">{formatGuestTime(guestTimeRemaining)}</strong></span>
            </div>

            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 hover:scale-105 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          </div>
        )}

        {/* 3-Dots Spotlight & Language Menu */}
        <div ref={spotlightMenuRef} className="relative shrink-0">
          <button
            onClick={() => setShowMobileSpotlightMenu(!showMobileSpotlightMenu)}
            className={`p-2 rounded-xl transition border flex items-center justify-center relative ${
              showMobileSpotlightMenu
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
            title="Regional Spotlight & Preferences"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Spotlight Drawer */}
          {showMobileSpotlightMenu && (
            <div className="absolute top-full right-0 mt-2.5 w-80 sm:w-96 bg-[#0d121d] border border-emerald-500/40 rounded-2xl shadow-2xl p-4 z-50 text-slate-100 divide-y divide-slate-800/80 max-h-[82vh] overflow-y-auto">
              <div className="pb-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Language Preferences
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-bold uppercase transition ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold shadow-sm'
                            : 'bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{lang}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {footerDetails && (
                <div className="pt-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Regional Spotlight
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/70 rounded-xl border border-slate-800/60 mb-2.5">
                    {mobileCategories.map((cat) => {
                      const CatIcon = cat.icon;
                      const isSelected = mobileCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setMobileCategory(cat.id)}
                          className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-bold transition ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <CatIcon className="w-3.5 h-3.5 mb-0.5" />
                          <span className="truncate max-w-[48px]">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {activeMobileItems.length > 0 ? (
                    <ul className="space-y-1 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                      {activeMobileItems.map((item, idx) => (
                        <li
                          key={item.id || idx}
                          onClick={() => {
                            if (openDetails) openDetails(item);
                            setShowMobileSpotlightMenu(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 cursor-pointer transition group"
                        >
                          <span className="truncate pr-2 group-hover:translate-x-0.5 transition-transform">
                            {decodeHTMLEntities(item.title)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-3 text-center">
                      No {mobileCategory} available
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
