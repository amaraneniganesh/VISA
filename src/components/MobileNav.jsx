import React, { useState } from 'react';
import {
  Compass,
  Calendar,
  Users,
  Search,
  Heart,
  ListMusic,
  Clock,
  Menu,
  X,
  ShieldAlert,
  Disc3,
  ChevronRight
} from 'lucide-react';

export default function MobileNav({
  activeTab,
  setActiveTab,
  likedSongsCount = 0,
  userPlaylistsCount = 0,
  user,
  onOpenAdmin
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Discover', icon: Compass },
    { id: 'years', label: 'Top of the Year', icon: Calendar },
    { id: 'spotlight', label: 'Artists Spotlight', icon: Users },
    { id: 'search', label: 'Search & Genres', icon: Search },
    { id: 'library', label: 'Liked Songs', icon: Heart, badge: likedSongsCount },
    { id: 'playlists', label: 'My Playlists', icon: ListMusic, badge: userPlaylistsCount },
    { id: 'history', label: 'Recently Played', icon: Clock }
  ];

  const primaryItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'years', label: 'Top Year', icon: Calendar },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Liked', icon: Heart, badge: likedSongsCount },
    { id: 'playlists', label: 'Playlists', icon: ListMusic, badge: userPlaylistsCount }
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Full Menu Slide-Up Sheet */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end animate-in fade-in duration-200 select-none">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Slide-Up Drawer Content */}
          <div className="relative z-10 bg-[#0a0d17] border-t border-slate-800 rounded-t-3xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Disc3 className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight">
                    VISA <span className="text-emerald-400">MENU</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">All Navigation & Features</p>
                </div>
              </div>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Control Panel Button if Admin */}
            {user?.isAdmin && (
              <button
                onClick={() => {
                  if (onOpenAdmin) onOpenAdmin();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-xs shadow-sm hover:bg-cyan-500 hover:text-slate-950 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span>Admin Control Panel</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Complete Menu Options List */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 block mb-1">
                Main Menu Options
              </span>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-900/60 border border-slate-850 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-600'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Dock Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#07090f]/95 backdrop-blur-2xl border-t border-slate-800/80 z-40 lg:hidden px-1.5 py-1.5 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] select-none">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-2xl transition-all duration-200 relative group active:scale-95 ${
                  isActive
                    ? 'text-emerald-400 font-extrabold bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isActive ? 'text-emerald-400 scale-110 stroke-[2.5]' : 'group-hover:scale-105'}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-emerald-500 text-slate-950 text-[8px] font-black flex items-center justify-center shadow-md">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] sm:text-[10px] tracking-tight leading-none ${isActive ? 'font-black text-emerald-300' : 'font-semibold text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Menu Drawer Toggle Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-2xl transition-all duration-200 relative group active:scale-95 ${
              isMenuOpen || ['spotlight', 'history', 'artists'].includes(activeTab)
                ? 'text-emerald-400 font-extrabold bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-semibold text-cyan-300 tracking-tight leading-none">
              Menu
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

