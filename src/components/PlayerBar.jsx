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
  Mic2,
  Download,
  Check
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
  queueCount = 0,
  queue = [],
  queueIndex = -1,
  recommendations = [],
  formatSeconds,
  upgradeImg,
  audioRef,
  onOpenDevicePicker,
  activeDevice,
  onDownload,
  downloads = {},
  downloadingId
}) {
  const [isClosed, setIsClosed] = useState(false);

  const isDownloadingCurrent = downloadingId === currentTrack?.id;
  const isCurrentDownloaded = Boolean(downloads[currentTrack?.id]);

  const nextTrack = queue && queueIndex >= 0 && queueIndex < queue.length - 1 ? queue[queueIndex + 1] : null;
  const progressPercent = duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;
  const volumePercent = (isMuted ? 0 : volume) * 100;

  if (!currentTrack) return null;

  // Mini Floating Audio Bubble when minimized
  if (isClosed) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in duration-200">
        <button
          onClick={() => setIsClosed(false)}
          className="flex items-center gap-3 p-2 sm:p-2.5 rounded-2xl glass-panel border border-emerald-500/40 shadow-2xl bg-slate-950/95 text-slate-100 hover:border-emerald-400 transition group"
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
    <footer className="fixed bottom-[54px] xs:bottom-[58px] lg:bottom-0 left-2 right-2 lg:left-64 lg:right-0 bg-[#090c14]/95 backdrop-blur-3xl border border-slate-800/90 rounded-2xl lg:rounded-none px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5 z-40 shadow-[0_12px_40px_rgba(0,0,0,0.9)] transition-all">
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5 relative">
        {/* Minimize Button */}
        <button
          onClick={() => setIsClosed(true)}
          className="absolute -top-3.5 right-1 p-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition z-50 shadow-sm"
          title="Minimize player"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Up Next & Recommendations Bar */}
        {(nextTrack || recommendations.length > 0) && (
          <div className="flex items-center gap-2.5 border-b border-slate-800/60 pb-1.5 overflow-x-auto no-scrollbar">
            {nextTrack && (
              <div
                onClick={handleNextTrack}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border border-cyan-500/40 hover:border-cyan-400 rounded-xl px-2 py-1 text-left transition shrink-0 group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-cyan-400 shrink-0">
                  <FastForward className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span className="hidden xs:inline">NEXT:</span>
                </div>
                <div className="relative w-6 h-6 rounded-md overflow-hidden shrink-0 bg-slate-800 border border-white/10">
                  <img
                    src={upgradeImg(nextTrack.image)}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div className="max-w-[110px] sm:max-w-[150px] truncate">
                  <p className="text-[11px] font-bold text-slate-100 truncate group-hover:text-cyan-300">
                    {decodeHTMLEntities(nextTrack.title)}
                  </p>
                </div>
                <div className="w-4 h-4 rounded bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black flex items-center justify-center transition shrink-0 ml-0.5">
                  <SkipForward className="w-2.5 h-2.5 fill-current" />
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0 ml-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">More by Artist:</span>
                </div>
                {recommendations.map((reco) => {
                  const isRecoPlaying = currentTrack?.id === reco.id && isPlaying;
                  return (
                    <button
                      key={reco.id}
                      onClick={() => handlePlayFullSong(reco)}
                      className={`flex items-center gap-1.5 bg-slate-900 border rounded-lg px-2 py-1 text-left transition shrink-0 group ${
                        currentTrack?.id === reco.id
                          ? 'border-emerald-500/80 bg-emerald-500/10'
                          : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="relative w-5 h-5 rounded overflow-hidden shrink-0 bg-slate-800">
                        <img src={upgradeImg(reco.image)} alt="" className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition ${isRecoPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          {isRecoPlaying ? (
                            <Pause className="w-2 h-2 text-emerald-400 fill-current" />
                          ) : (
                            <Play className="w-2 h-2 text-white ml-0.5 fill-current" />
                          )}
                        </div>
                      </div>
                      <p className={`text-[11px] font-medium max-w-[100px] truncate ${currentTrack?.id === reco.id ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {decodeHTMLEntities(reco.title)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mobile Scrubber (< md) */}
        <div className="md:hidden relative w-full pt-1 pb-0.5">
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
          <div className="flex items-center justify-between px-0.5 mt-0.5 text-[9px] font-mono font-bold text-slate-400">
            <span className="text-emerald-400">{formatSeconds(currentTime)}</span>
            <span>{formatSeconds(duration || currentTrack.more_info?.duration)}</span>
          </div>
        </div>

        {/* Desktop Scrubber (>= md) */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
          <span className="w-9 text-right font-mono text-[11px] text-slate-300 font-bold shrink-0">
            {formatSeconds(currentTime)}
          </span>
          <div className="relative flex-1 group flex items-center min-w-0">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              style={{
                background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${progressPercent}%, #1e293b ${progressPercent}%, #1e293b 100%)`
              }}
              className="w-full h-1.5 rounded-lg cursor-pointer appearance-none outline-none accent-emerald-400 hover:h-2 transition-all shadow-inner"
            />
          </div>
          <span className="w-9 font-mono text-[11px] text-slate-400 font-bold shrink-0">
            {formatSeconds(duration || currentTrack.more_info?.duration)}
          </span>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* MOBILE CONTROLS (< md) */}
        {/* ----------------------------------------------------------- */}
        <div className="md:hidden flex items-center justify-between gap-2.5 min-w-0">
          {/* Track Info */}
          <div
            onClick={onExpandStudio}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer overflow-hidden group"
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

            <div className="min-w-0 flex-1 truncate">
              <p className="text-xs font-bold text-slate-100 truncate group-hover:text-emerald-400 transition">
                {decodeHTMLEntities(currentTrack.title)}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {decodeHTMLEntities(currentTrack.subtitle || currentTrack.more_info?.music || 'Track Artist')}
              </p>
            </div>
          </div>

          {/* Essential Mobile Controls Only (No crowding) */}
          <div className="flex items-center gap-1 shrink-0">
            {onDownload && (
              <button
                onClick={() => onDownload(currentTrack, bitrate)}
                disabled={isDownloadingCurrent}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 transition active:scale-95 shrink-0"
                title="Download"
              >
                {isDownloadingCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : isCurrentDownloaded ? (
                  <Check className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              onClick={() => onExpandStudio && onExpandStudio('lyrics')}
              className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg transition shrink-0"
              title="Lyrics"
            >
              <Mic2 className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={handleNextTrack}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg transition shrink-0"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => handlePlayFullSong(currentTrack)}
              disabled={isResolvingAudio}
              className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/25 active:scale-95 transition shrink-0"
            >
              {isResolvingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              )}
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* DESKTOP 3-ZONE GRID (>= md) */}
        {/* ----------------------------------------------------------- */}
        <div className="hidden md:grid md:grid-cols-12 items-center gap-3">
          {/* Zone 1: Track Details & Core Actions (4 cols) */}
          <div className="col-span-4 flex items-center gap-3 min-w-0 overflow-hidden">
            <div
              onClick={onExpandStudio}
              className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg cursor-pointer group"
            >
              <img
                src={upgradeImg(currentTrack.image)}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            <div className="min-w-0 flex-1 truncate">
              <p
                onClick={onExpandStudio}
                className="text-xs lg:text-sm font-semibold text-slate-100 truncate hover:text-emerald-400 cursor-pointer"
              >
                {decodeHTMLEntities(currentTrack.title)}
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {decodeHTMLEntities(currentTrack.subtitle || currentTrack.more_info?.music || 'Track')}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleFavorite(currentTrack)}
                className={`p-1.5 rounded-lg transition shrink-0 ${
                  isFavorite ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-200'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

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
          </div>

          {/* Zone 2: Center Transport Controls (4 cols) */}
          <div className="col-span-4 flex items-center justify-center gap-1 sm:gap-2">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 rounded-lg transition shrink-0 ${
                isShuffle ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title={isShuffle ? 'Shuffle enabled' : 'Enable shuffle'}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handlePrevTrack}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition shrink-0"
              title="Previous track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handleSkipBackward}
              className="hidden lg:inline-flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition shrink-0"
              title="Rewind 10s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handlePlayFullSong(currentTrack)}
              disabled={isResolvingAudio}
              className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shadow-emerald-500/25 shrink-0"
            >
              {isResolvingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              )}
            </button>

            <button
              onClick={handleSkipForward}
              className="hidden lg:inline-flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition shrink-0"
              title="Forward 10s"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleNextTrack}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition shrink-0"
              title="Next track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={toggleRepeatMode}
              className={`p-1.5 rounded-lg transition shrink-0 ${
                repeatMode !== 'off' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Zone 3: Audio, Quality & Auxiliary Controls (4 cols) */}
          <div className="col-span-4 flex items-center justify-end gap-1.5 lg:gap-2">
            {/* Visualizer: only on large monitors */}
            <div className="hidden xl:block w-20 h-7 rounded-lg bg-slate-900/60 border border-slate-800/80 overflow-hidden shrink-0">
              <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} mode="spectrum" />
            </div>

            {/* Desktop Volume Slider */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={handleToggleMute} className="text-slate-400 hover:text-white transition p-1">
                {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-pink-400" /> : <Volume2 className="w-3.5 h-3.5" />}
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
                className="w-14 lg:w-18 h-1 rounded cursor-pointer appearance-none outline-none accent-emerald-400"
              />
            </div>

            {/* Bitrate Selector: hidden below lg */}
            <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0">
              {['96', '160', '320'].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleBitrateChange(rate)}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                    bitrate === rate ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}k
                </button>
              ))}
            </div>

            {/* Connect to Device */}
            <button
              onClick={onOpenDevicePicker}
              className={`flex items-center gap-1 p-1.5 lg:px-2 lg:py-1 rounded-lg transition shrink-0 border ${
                activeDevice?.id && activeDevice.id !== 'default'
                  ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 border-slate-800 bg-slate-900/60 hover:text-emerald-400 hover:border-slate-700'
              }`}
              title={`Audio Output: ${activeDevice?.name || 'PC Speakers'}`}
            >
              <div className="relative flex items-center justify-center shrink-0">
                {activeDevice?.type === 'headphones' ? (
                  <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                ) : activeDevice?.type === 'speaker' ? (
                  <Speaker className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 hidden xl:inline truncate max-w-[80px]">
                {activeDevice?.name || 'Speakers'}
              </span>
            </button>

            {/* Download Button */}
            {onDownload && (
              <button
                onClick={() => onDownload(currentTrack, bitrate)}
                disabled={isDownloadingCurrent}
                className={`p-1.5 rounded-lg border transition shrink-0 ${
                  isCurrentDownloaded
                    ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                    : 'text-slate-400 border-slate-800 bg-slate-900/60 hover:text-cyan-400 hover:border-slate-700'
                }`}
                title={isCurrentDownloaded ? 'Downloaded' : `Download (${bitrate}kbps)`}
              >
                {isDownloadingCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : isCurrentDownloaded ? (
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                )}
              </button>
            )}

            {/* Lyrics Button */}
            <button
              onClick={() => onExpandStudio && onExpandStudio('lyrics')}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg transition shrink-0"
              title="Lyrics"
            >
              <Mic2 className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            {/* Studio Expand Button */}
            <button
              onClick={() => onExpandStudio && onExpandStudio('studio')}
              className="hidden lg:inline-flex p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg transition shrink-0"
              title="Full Studio Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Queue Button */}
            <button
              onClick={onToggleQueue}
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-lg transition relative shrink-0"
              title="Queue Drawer"
            >
              <ListMusic className="w-3.5 h-3.5" />
              {queueCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 text-slate-950 text-[8px] font-black flex items-center justify-center">
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