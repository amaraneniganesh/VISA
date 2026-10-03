import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Maximize2,
  ListMusic,
  Heart,
  Loader2,
  X,
  ChevronUp,
  Sparkles,
  FastForward,
  Laptop,
  Headphones,
  Speaker,
  Mic2
} from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { decodeHTMLEntities } from '../utils/formatters';

export default function PlayerBar({
  currentTrack,
  isPlaying,
  isResolvingAudio,
  currentTime,
  duration,
  handleSeek,
  handleSkipBackward,
  handleSkipForward,
  handlePrevTrack,
  handleNextTrack,
  togglePlayPause,
  handlePlayFullSong,
  volume,
  isMuted,
  handleVolumeChange,
  handleToggleMute,
  bitrate,
  handleBitrateChange,
  isShuffle,
  toggleShuffle,
  repeatMode,
  toggleRepeatMode,
  isFavorite,
  toggleFavorite,
  onOpenAddToPlaylist,
  onExpandStudio,
  onToggleQueue,
  queueCount,
  queue = [],
  queueIndex = -1,
  recommendations = [],
  formatSeconds,
  upgradeImg,
  audioRef,
  onOpenDevicePicker,
  activeDevice
}) {
  const [isClosed, setIsClosed] = useState(false);
  const [showMobileVolume, setShowMobileVolume] = useState(false);

  const nextTrack = queue && queueIndex >= 0 && queueIndex < queue.length - 1 ? queue[queueIndex + 1] : null;
  const progressPercent = duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;
  const volumePercent = (isMuted ? 0 : volume) * 100;

  if (!currentTrack) return null;

  // Mini Floating Audio Bubble when Player is Closed/Minimized
  if (isClosed) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 right-6 z-40 animate-in fade-in duration-200">
        <button
          onClick={() => setIsClosed(false)}
          className="flex items-center gap-3 p-2.5 rounded-2xl glass-panel border border-emerald-500/40 shadow-2xl bg-slate-950/95 text-slate-100 hover:border-emerald-400 transition group"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10">
            <img src={upgradeImg(currentTrack.image)} alt="" className="w-full h-full object-cover" />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            )}
          </div>
          <div className="text-left hidden sm:block max-w-[120px] truncate">
            <p className="text-xs font-bold text-slate-100 truncate">{decodeHTMLEntities(currentTrack.title)}</p>
            <p className="text-[10px] text-emerald-400">Tap to show player</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
            <ChevronUp className="w-4 h-4 stroke-[3]" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <footer className="fixed bottom-[54px] xs:bottom-[58px] lg:bottom-0 left-2 right-2 lg:left-64 lg:right-0 bg-[#090c14]/95 backdrop-blur-3xl border border-slate-800/90 rounded-2xl lg:rounded-none px-3 sm:px-8 py-2 sm:py-3 z-40 shadow-[0_12px_40px_rgba(0,0,0,0.9)] transition-all">
      <div className="max-w-7xl mx-auto flex flex-col gap-2 relative">
        {/* Close / Hide Button */}
        <button
          onClick={() => setIsClosed(true)}
          className="absolute -top-3.5 right-0 p-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition z-50"
          title="Minimize player"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Top Strip: Up Next Spotlight & Recommendations */}
        {(nextTrack || recommendations.length > 0) && (
          <div className="flex items-center gap-3 border-b border-slate-800/60 pb-2 overflow-x-auto no-scrollbar">
            {/* UP NEXT SPOTLIGHT */}
            {nextTrack && (
              <div
                onClick={handleNextTrack}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border border-cyan-500/40 hover:border-cyan-400 rounded-xl px-2.5 py-1.5 text-left transition shrink-0 group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-cyan-400 shrink-0">
                  <FastForward className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="hidden xs:inline">NEXT:</span>
                </div>
                <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-white/10">
                  <img
                    src={upgradeImg(nextTrack.image)}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div className="max-w-[120px] sm:max-w-[160px] truncate">
                  <p className="text-xs font-bold text-slate-100 truncate group-hover:text-cyan-300">
                    {decodeHTMLEntities(nextTrack.title)}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {decodeHTMLEntities(nextTrack.subtitle || nextTrack.more_info?.music || 'Upcoming')}
                  </p>
                </div>
                <div className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black flex items-center justify-center transition shrink-0 ml-1">
                  <SkipForward className="w-3 h-3 fill-current" />
                </div>
              </div>
            )}

            {/* Recommendations Strip: "More by Artist" */}
            {recommendations.length > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0 ml-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>More by Artist:</span>
                </div>
                {recommendations.map((reco) => {
                  const isRecoPlaying = currentTrack?.id === reco.id && isPlaying;
                  return (
                    <button
                      key={reco.id}
                      onClick={() => handlePlayFullSong(reco)}
                      className={`flex items-center gap-2 bg-slate-900 border rounded-xl px-2 py-1 text-left transition shrink-0 group ${
                        currentTrack?.id === reco.id
                          ? 'border-emerald-500/80 bg-emerald-500/10'
                          : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="relative w-6 h-6 rounded-md overflow-hidden shrink-0 bg-slate-800">
                        <img
                          src={upgradeImg(reco.image)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition ${isRecoPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          {isRecoPlaying ? (
                            <Pause className="w-2.5 h-2.5 text-emerald-400 fill-current" />
                          ) : (
                            <Play className="w-2.5 h-2.5 text-white ml-0.5 fill-current" />
                          )}
                        </div>
                      </div>
                      <div className="max-w-[110px] truncate">
                        <p className={`text-[11px] font-semibold truncate ${currentTrack?.id === reco.id ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {decodeHTMLEntities(reco.title)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mobile Full-Width Progress Seeker (< md) */}
        <div className="md:hidden relative w-full -mt-3 pt-1 pb-0.5">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            style={{
              background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${progressPercent}%, #1e293b ${progressPercent}%, #1e293b 100%)`
            }}
            className="w-full h-1.5 rounded-none cursor-pointer appearance-none outline-none accent-emerald-400 touch-pan-x"
          />
          <div className="flex items-center justify-between px-1 mt-0.5 text-[9px] font-mono font-bold text-slate-400">
            <span className="text-emerald-400">{formatSeconds(currentTime)}</span>
            <span>{formatSeconds(duration || currentTrack.more_info?.duration)}</span>
          </div>
        </div>

        {/* Desktop Audio Scrub Bar & Timers (>= md) */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
          <span className="w-10 text-right font-mono text-[11px] text-slate-300 font-bold">
            {formatSeconds(currentTime)}
          </span>
          <div className="relative flex-1 group flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              style={{
                background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${progressPercent}%, #1e293b ${progressPercent}%, #1e293b 100%)`
              }}
              className="w-full h-1.5 rounded-lg cursor-pointer appearance-none outline-none accent-emerald-400 hover:h-2.5 transition-all shadow-inner"
            />
          </div>
          <span className="w-10 font-mono text-[11px] text-slate-400 font-bold">
            {formatSeconds(duration || currentTrack.more_info?.duration)}
          </span>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* MOBILE LAYOUT (< md): Spacious Track Info + Mobile Actions */}
        {/* ------------------------------------------------------------------ */}
        <div className="md:hidden flex items-center justify-between gap-3 min-w-0">
          {/* Left: Track Thumbnail + Title & Subtitle (Priority Space) */}
          <div
            onClick={onExpandStudio}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
              <img
                src={upgradeImg(currentTrack.image)}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-100 truncate group-hover:text-emerald-400 transition">
                {decodeHTMLEntities(currentTrack.title)}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {decodeHTMLEntities(currentTrack.subtitle || currentTrack.more_info?.music || 'Track Artist')}
              </p>
            </div>
          </div>

          {/* Right: Mobile Control Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Play/Pause Button */}
            <button
              onClick={() => handlePlayFullSong(currentTrack)}
              disabled={isResolvingAudio}
              className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/25 active:scale-95 transition"
            >
              {isResolvingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              )}
            </button>

            {/* Next Track Button */}
            <button
              onClick={handleNextTrack}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* View Lyrics Button */}
            <button
              onClick={() => onExpandStudio && onExpandStudio('lyrics')}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-xl transition"
              title="View Lyrics"
            >
              <Mic2 className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Expand Full Studio Button */}
            <button
              onClick={() => onExpandStudio && onExpandStudio('studio')}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-xl transition"
              title="Full Studio Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DESKTOP LAYOUT (>= md): Full 3-Column Studio Bar */}
        {/* ------------------------------------------------------------------ */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Left: Track Details */}
          <div className="flex items-center gap-3.5 min-w-0 max-w-xs md:max-w-sm">
            <div
              onClick={onExpandStudio}
              className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg cursor-pointer group"
            >
              <img
                src={upgradeImg(currentTrack.image)}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div className="truncate">
              <p
                onClick={onExpandStudio}
                className="text-sm font-semibold text-slate-100 truncate hover:text-emerald-400 cursor-pointer"
              >
                {decodeHTMLEntities(currentTrack.title)}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {decodeHTMLEntities(currentTrack.subtitle || currentTrack.more_info?.music || 'Track')}
              </p>
            </div>

            {/* Favorite Quick Button */}
            <button
              onClick={() => toggleFavorite(currentTrack)}
              className={`p-1.5 rounded-lg transition shrink-0 ${
                isFavorite
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Add to Playlist Quick Button */}
            {onOpenAddToPlaylist && (
              <button
                onClick={() => onOpenAddToPlaylist(currentTrack)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-900 transition shrink-0"
                title="Add to Playlist"
              >
                <ListMusic className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-xl transition ${
                isShuffle
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={isShuffle ? 'Shuffle enabled' : 'Enable shuffle'}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrevTrack}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
              title="Previous track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handleSkipBackward}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => handlePlayFullSong(currentTrack)}
              disabled={isResolvingAudio}
              className="w-11 h-11 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shadow-emerald-500/25"
            >
              {isResolvingAudio ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              )}
            </button>

            <button
              onClick={handleSkipForward}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition"
              title="Forward 10s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleNextTrack}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
              title="Next track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={toggleRepeatMode}
              className={`p-2 rounded-xl transition ${
                repeatMode !== 'off'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Right: Volume, Bitrate & Studio */}
          <div className="flex items-center gap-3">
            {/* Integrated Visualizer */}
            <div className="hidden lg:block w-24 h-8 rounded-xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
              <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} mode="spectrum" />
            </div>

            {/* Desktop Volume Slider */}
            <div className="flex items-center gap-2">
              <button onClick={handleToggleMute} className="text-slate-400 hover:text-white transition">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-pink-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${volumePercent}%, #1e293b ${volumePercent}%, #1e293b 100%)`
                }}
                className="w-16 lg:w-20 h-1.5 rounded-lg cursor-pointer appearance-none outline-none accent-emerald-400"
              />
            </div>

            {/* Bitrate Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 shrink-0">
              {['96', '160', '320'].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleBitrateChange(rate)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                    bitrate === rate ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}k
                </button>
              ))}
            </div>

            {/* Connect to Device Selector (Spotify-style) */}
            <button
              onClick={onOpenDevicePicker}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition relative group border ${
                activeDevice?.id && activeDevice.id !== 'default'
                  ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 border-slate-800 bg-slate-900/60 hover:text-emerald-400 hover:border-slate-700'
              }`}
              title={`Audio Output: ${activeDevice?.name || 'PC Speakers'}`}
            >
              <div className="relative flex items-center justify-center shrink-0">
                {activeDevice?.type === 'headphones' ? (
                  <Headphones className="w-4 h-4 text-emerald-400" />
                ) : activeDevice?.type === 'speaker' ? (
                  <Speaker className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Laptop className="w-4 h-4 text-emerald-400" />
                )}
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-xs font-bold text-slate-200 hidden lg:inline truncate max-w-[120px]">
                {activeDevice?.name || 'PC Speakers'}
              </span>
            </button>

            {/* View Lyrics Button */}
            <button
              onClick={() => onExpandStudio && onExpandStudio('lyrics')}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-xl transition"
              title="View Song Lyrics"
            >
              <Mic2 className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Studio Expand Button */}
            <button
              onClick={() => onExpandStudio && onExpandStudio('studio')}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-xl transition"
              title="Full Studio Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleQueue}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-xl transition relative"
              title="Queue Drawer"
            >
              <ListMusic className="w-4 h-4" />
              {queueCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {queueCount}
                </span>
              )}
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
