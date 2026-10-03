import React from 'react';
import { Play, Pause, Heart, Plus, Loader2 } from 'lucide-react';
import { decodeHTMLEntities } from '../utils/formatters';

export default function TrackCard({
  item,
  onCardClick,
  onPlaySong,
  onAddToQueue,
  onToggleFavorite,
  isFavorite,
  currentTrack,
  isPlaying,
  isResolvingAudio,
  upgradeImg
}) {
  const isCurrent = currentTrack?.id === item.id;
  const isSong = item.type === 'song';
  const isArtist = item.type === 'artist';

  return (
    <div
      onClick={() => onCardClick(item)}
      className="group relative glass-card rounded-2xl p-3.5 flex flex-col cursor-pointer transition duration-300 hover:z-10"
    >
      {/* Artwork Container */}
      <div className={`relative aspect-square overflow-hidden mb-3 bg-slate-900 border border-white/5 ${
        isArtist ? 'rounded-full' : 'rounded-xl'
      }`}>
        <img
          src={upgradeImg(item.image)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-108 transition duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || 'Music')}&background=10b981&color=fff&size=500&bold=true`;
          }}
        />

        {/* Entity Type Badge */}
        {!isArtist && (
          <span className="absolute top-2.5 left-2.5 bg-slate-950/85 border border-white/10 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md">
            {item.type || 'album'}
          </span>
        )}

        {/* Playing Soundwave Overlay */}
        {isCurrent && isPlaying && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex items-end gap-1 h-6">
              <span className="w-1 bg-emerald-400 rounded-full eq-bar-1" />
              <span className="w-1 bg-cyan-400 rounded-full eq-bar-2" />
              <span className="w-1 bg-emerald-400 rounded-full eq-bar-3" />
              <span className="w-1 bg-violet-400 rounded-full eq-bar-4" />
            </div>
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-2">
          {isSong ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlaySong(item);
              }}
              disabled={isResolvingAudio && isCurrent}
              className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition"
            >
              {isResolvingAudio && isCurrent ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isCurrent && isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              )}
            </button>
          ) : (
            <div className="w-11 h-11 rounded-full bg-slate-900/90 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg backdrop-blur-md">
              <Play className="w-4 h-4 ml-0.5 fill-current" />
            </div>
          )}
        </div>

        {/* Favorite Heart Quick Toggle */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition ${
              isFavorite
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-950/60 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <h4 className={`font-bold text-sm text-slate-100 truncate group-hover:text-emerald-400 transition ${
          isArtist ? 'text-center' : ''
        }`}>
          {decodeHTMLEntities(item.title)}
        </h4>
        <p className={`text-xs text-slate-400 truncate mt-0.5 ${isArtist ? 'text-center' : ''}`}>
          {decodeHTMLEntities(item.subtitle || item.header_desc || item.type)}
        </p>
      </div>
    </div>
  );
}
