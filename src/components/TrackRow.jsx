import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Heart, Plus, Loader2, Music2, ListMusic, MoreVertical } from 'lucide-react';
import { decodeHTMLEntities, formatPlayCount } from '../utils/formatters';

export default function TrackRow({
  song,
  index,
  onPlay,
  onAddToQueue,
  onOpenAddToPlaylist,
  onToggleFavorite,
  isFavorite,
  currentTrack,
  isPlaying,
  isResolvingAudio,
  upgradeImg,
  formatSeconds
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMobileMenu]);
  const isCurrent = currentTrack?.id === song.id;
  const isBusy = isResolvingAudio && isCurrent;

  const playCountFormatted = formatPlayCount(song.play_count || song.more_info?.play_count);
  const isExplicit = song.explicit_content === '1' || song.more_info?.explicit_content === '1';
  const songYear = song.year || song.more_info?.year;
  const songLang = song.language || song.more_info?.language;
  const artistSubtitle = song.subtitle || song.more_info?.music || song.more_info?.primary_artists || song.header_desc || 'Track';

  return (
    <div
      onClick={() => onPlay(song)}
      className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition duration-200 cursor-pointer border ${
        isCurrent
          ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
          : 'bg-slate-900/40 hover:bg-slate-850/80 border-slate-800/60 hover:border-slate-700'
      }`}
    >
      {/* Left: Index / Play Icon & Track Info (Takes priority for full title visibility) */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 pr-2">
        {/* Index or Audio Equalizer */}
        <div className="w-5 text-center shrink-0">
          {isCurrent && isPlaying ? (
            <div className="flex items-end justify-center gap-0.5 h-3.5">
              <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-1" />
              <span className="w-0.5 bg-cyan-400 rounded-full eq-bar-2" />
              <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-3" />
            </div>
          ) : (
            <span className="text-[11px] font-bold text-slate-500 group-hover:hidden">
              {index !== undefined ? index + 1 : <Music2 className="w-3.5 h-3.5 mx-auto" />}
            </span>
          )}
          <Play className="w-3.5 h-3.5 text-emerald-400 hidden group-hover:block mx-auto fill-current" />
        </div>

        {/* Thumbnail Artwork */}
        <img
          src={upgradeImg(song.image)}
          alt=""
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover bg-slate-800 shrink-0 border border-white/5"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title || 'Song')}&background=10b981&color=fff&size=500&bold=true`;
          }}
        />

        {/* Title, Subtitle & Metadata Badges */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className={`text-xs sm:text-sm font-bold truncate ${
              isCurrent ? 'text-emerald-400 font-black' : 'text-slate-100 group-hover:text-emerald-300'
            }`}>
              {decodeHTMLEntities(song.title)}
            </p>
            {isExplicit && (
              <span className="text-[8px] font-black px-1 py-0.2 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">
                E
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-2 min-w-0">
            <span className="truncate">{decodeHTMLEntities(artistSubtitle)}</span>
            {songLang && (
              <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0 border border-slate-700/60 hidden md:inline">
                {songLang}
              </span>
            )}
            {playCountFormatted && (
              <span className="text-[8px] font-mono text-emerald-400/80 shrink-0 hidden md:inline">
                • {playCountFormatted} plays
              </span>
            )}
            {songYear && (
              <span className="text-[8px] font-mono text-slate-500 shrink-0 hidden md:inline">
                • {songYear}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right Actions & Duration */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <span className="text-[11px] font-mono text-slate-400 font-bold hidden xs:inline">
          {formatSeconds(song.more_info?.duration || song.duration)}
        </span>

        {/* Desktop Favorite Toggle */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(song);
            }}
            className={`p-1.5 rounded-xl transition hidden md:block ${
              isFavorite
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Desktop Add to Playlist Button */}
        {onOpenAddToPlaylist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddToPlaylist(song);
            }}
            className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition hidden md:block"
            title="Add to Playlist"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        )}

        {/* Desktop Add to Queue Button */}
        {onAddToQueue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(song);
            }}
            className="p-1.5 rounded-xl text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition hidden md:block"
            title="Add to queue"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Mobile 3-Dots Action Menu Trigger (< md) */}
        <div ref={menuRef} className="relative md:hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileMenu(!showMobileMenu);
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMobileMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-44 bg-[#0d121d] border border-emerald-500/40 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-150 space-y-1"
            >
              {onToggleFavorite && (
                <button
                  onClick={() => {
                    onToggleFavorite(song);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
                >
                  <Heart className={`w-4 h-4 text-emerald-400 ${isFavorite ? 'fill-current' : ''}`} />
                  <span>{isFavorite ? 'Remove Favorite' : 'Add to Favorite'}</span>
                </button>
              )}
              {onOpenAddToPlaylist && (
                <button
                  onClick={() => {
                    onOpenAddToPlaylist(song);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
                >
                  <ListMusic className="w-4 h-4 text-emerald-400" />
                  <span>Add to Playlist</span>
                </button>
              )}
              {onAddToQueue && (
                <button
                  onClick={() => {
                    onAddToQueue(song);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Add to Queue</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Play/Pause Main Trigger Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(song);
          }}
          disabled={isBusy}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 flex items-center justify-center transition shadow-sm shrink-0"
        >
          {isBusy ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          ) : isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 ml-0.5 fill-current" />
          )}
        </button>
      </div>
    </div>
  );
}

