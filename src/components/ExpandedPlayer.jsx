import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  ListPlus,
  Activity,
  Laptop,
  Headphones,
  Speaker,
  Loader2,
  Copy,
  Check,
  Mic2,
  ArrowLeft,
  RefreshCw,
  Languages
} from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { decodeHTMLEntities, formatPlayCount } from '../utils/formatters';
import { hasNonLatinScript, transliterateToEnglish } from '../utils/transliterate';

/* ───────────────────────── helpers ───────────────────────── */

const FALLBACK_RGB = [40, 56, 52];
const VIS_MODES = ['radial', 'spectrum', 'particles'];

const CSS = `
.sp-range{-webkit-appearance:none;appearance:none;width:100%;height:16px;background:transparent;cursor:pointer;touch-action:none;outline:none}
.sp-range::-webkit-slider-runnable-track{height:4px;border-radius:999px;background:var(--track)}
.sp-range::-moz-range-track{height:4px;border-radius:999px;background:var(--track)}
.sp-range::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;margin-top:-4px;border-radius:50%;background:#fff;border:0;box-shadow:0 1px 4px rgba(0,0,0,.4);transition:transform .15s}
.sp-range::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#fff;border:0}
.sp-range:active::-webkit-slider-thumb{transform:scale(1.35)}
.sp-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px rgba(255,255,255,.5)}
.sp-noscroll{scrollbar-width:none;-ms-overflow-style:none}
.sp-noscroll::-webkit-scrollbar{display:none}
@keyframes sp-bars{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.sp-bar{transform-origin:bottom;animation:sp-bars 0.9s ease-in-out infinite}
@keyframes sp-fade{from{opacity:0}to{opacity:1}}
.sp-fade{animation:sp-fade .6s ease both}
@keyframes sp-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sp-up{animation:sp-up .32s cubic-bezier(.2,.8,.2,1) both}
@media (prefers-reduced-motion:reduce){.sp-bar,.sp-fade,.sp-up{animation:none}}
`;

// Pull a dominant, darkened colour out of the artwork (falls back silently on CORS errors)
function useArtColor(src) {
  const [rgb, setRgb] = useState(FALLBACK_RGB);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 16;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 16, 16);
        const d = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) {
          const mx = Math.max(d[i], d[i + 1], d[i + 2]);
          const mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const weight = 0.2 + (mx - mn) / 255; // favour saturated pixels
          r += d[i] * weight; g += d[i + 1] * weight; b += d[i + 2] * weight; w += weight;
        }
        r /= w; g /= w; b /= w;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const k = lum > 105 ? 105 / lum : lum < 35 ? 1.4 : 1;
        if (alive) setRgb([r, g, b].map((v) => Math.min(255, Math.round(v * k) + (lum < 35 ? 20 : 0))));
      } catch {
        if (alive) setRgb(FALLBACK_RGB);
      }
    };
    img.onerror = () => alive && setRgb(FALLBACK_RGB);
    img.src = src;
    return () => { alive = false; };
  }, [src]);
  return rgb;
}

const iconBtn =
  'inline-flex items-center justify-center rounded-full transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

/* ───────────────────────── component ───────────────────────── */

export default function ExpandedPlayer({
  currentTrack,
  isPlaying,
  isResolvingAudio,
  currentTime,
  duration,
  handleSeek,
  handleSkipBackward: _handleSkipBackward,
  handleSkipForward: _handleSkipForward,
  handlePrevTrack,
  handleNextTrack,
  togglePlayPause,
  volume,
  isMuted,
  handleVolumeChange,
  handleToggleMute,
  bitrate,
  handleBitrateChange: _handleBitrateChange,
  isShuffle,
  toggleShuffle,
  repeatMode,
  toggleRepeatMode,
  isFavorite,
  toggleFavorite,
  onOpenAddToPlaylist,
  onClose,
  queue = [],
  queueIndex = -1,
  onPlayQueueTrack,
  onPlaySong: _onPlaySong,
  formatSeconds,
  upgradeImg,
  audioRef,
  onOpenDevicePicker,
  activeDevice,
  initialTab = 'studio'
}) {
  // 'player' | 'lyrics' | 'queue'  (legacy 'studio' maps to 'player')
  const [view, setView] = useState(initialTab === 'studio' || !initialTab ? 'player' : initialTab);
  const [visMode, setVisMode] = useState(-1); // -1 = artwork, otherwise index in VIS_MODES

  const [lyricsData, setLyricsData] = useState(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [userScrolling, setUserScrolling] = useState(false);
  const [scriptMode, setScriptMode] = useState('original'); // 'original' | 'english'

  const lyricsScrollRef = useRef(null);
  const lineRefs = useRef([]);
  const queueActiveRef = useRef(null);
  const scrollTimer = useRef(null);

  const art = currentTrack ? upgradeImg(currentTrack.image) : '';
  const rgb = useArtColor(art);
  const rgbStr = rgb.join(',');
  const deep = rgb.map((v) => Math.round(v * 0.35)).join(',');

  /* ── lyrics fetch ── */
  useEffect(() => {
    let alive = true;
    setLyricsData(null);
    setLyricsError(null);
    lineRefs.current = [];
    if (!currentTrack?.id) return;

    (async () => {
      setLyricsLoading(true);
      try {
        const q = new URLSearchParams({
          lyrics_id: currentTrack.id || '',
          title: currentTrack.title || '',
          artist: currentTrack.subtitle || currentTrack.artist || currentTrack.more_info?.music || '',
          duration: duration || currentTrack.more_info?.duration || ''
        });
        const apiHost = window.location.origin.includes('localhost')
          ? 'http://localhost:5000/api'
          : 'https://visa-server-7qzv.onrender.com/api';
        const res = await fetch(`${apiHost}/lyrics?${q.toString()}`);
        const data = await res.json();
        if (!alive) return;
        if (data.success && (data.lyrics || data.syncedLyrics)) setLyricsData(data);
        else setLyricsError(data.error || 'Lyrics aren\u2019t available for this song.');
      } catch {
        if (alive) setLyricsError('Couldn\u2019t load lyrics. Check your connection and try again.');
      } finally {
        if (alive) setLyricsLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  const lyricsText = useMemo(
    () => (lyricsData?.lyrics ? decodeHTMLEntities(lyricsData.lyrics.replace(/<br\s*\/?>/gi, '\n')) : ''),
    [lyricsData]
  );

  const isIndicSong = useMemo(() => hasNonLatinScript(lyricsText || ''), [lyricsText]);

  /* ── parse LRC or estimate timing ── */
  const parsedLyrics = useMemo(() => {
    if (!lyricsData) return [];
    const raw =
      lyricsData.syncedLyrics ||
      (lyricsData.lyrics && /\[\d{1,2}:\d{2}/.test(lyricsData.lyrics) ? lyricsData.lyrics : null);

    if (raw) {
      const items = [];
      const re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
      for (const line of raw.replace(/<br\s*\/?>/gi, '\n').split(/\r?\n/)) {
        const matches = [...line.matchAll(re)];
        if (!matches.length) continue;
        const text = line.replace(/\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/g, '').replace(/<[^>]*>/g, '').trim();
        for (const m of matches) {
          const ms = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) : 0;
          items.push({ time: parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + ms / 1000, text: text || '\u266A' });
        }
      }
      items.sort((a, b) => a.time - b.time);
      if (items.length) return items.map((it, id) => ({ ...it, id }));
    }

    if (lyricsText) {
      const lines = lyricsText.split('\n').map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return [];
      const total = duration && duration > 10 ? duration : 180;
      const start = Math.min(6, total * 0.04);
      const step = Math.max(10, total - start - 8) / lines.length;
      return lines.map((text, id) => ({ id, time: start + id * step, text, estimated: true }));
    }
    return [];
  }, [lyricsData, lyricsText, duration]);

  /* ── Transliterate / Format Display Lyrics (Original vs English Text) ── */
  const displayLyrics = useMemo(() => {
    if (!parsedLyrics.length) return [];
    if (scriptMode === 'english') {
      return parsedLyrics.map((item) => ({
        ...item,
        text: transliterateToEnglish(item.text)
      }));
    }
    return parsedLyrics;
  }, [parsedLyrics, scriptMode]);

  const displaySheetText = useMemo(() => {
    if (!lyricsText) return '';
    if (scriptMode === 'english') {
      return transliterateToEnglish(lyricsText);
    }
    return lyricsText;
  }, [lyricsText, scriptMode]);

  const isSynced = parsedLyrics.length > 0;
  const activeLine = useMemo(() => {
    let a = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTime >= parsedLyrics[i].time) a = i;
      else break;
    }
    return a;
  }, [parsedLyrics, currentTime]);

  /* ── scrolling helpers ── */
  const centerLine = useCallback((idx, smooth = true) => {
    const box = lyricsScrollRef.current;
    const el = lineRefs.current[idx];
    if (!box || !el) return;
    box.scrollTo({
      top: Math.max(0, el.offsetTop - box.clientHeight * 0.3),
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  useEffect(() => {
    if (view === 'lyrics' && !userScrolling && activeLine >= 0) centerLine(activeLine);
  }, [activeLine, view, userScrolling, centerLine]);

  useEffect(() => {
    if (view === 'queue' && queueActiveRef.current) queueActiveRef.current.scrollIntoView({ block: 'center' });
  }, [view]);

  // Only react to real user gestures, not programmatic scrolls
  const pauseAutoScroll = () => {
    setUserScrolling(true);
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setUserScrolling(false), 3500);
  };
  useEffect(() => () => clearTimeout(scrollTimer.current), []);

  const copyLyrics = () => {
    if (!lyricsText) return;
    navigator.clipboard?.writeText(lyricsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const seekTo = (t) => handleSeek({ target: { value: t } });

  if (!currentTrack) return null;

  /* ── derived display values ── */
  const title = decodeHTMLEntities(currentTrack.title);
  const artist = decodeHTMLEntities(
    currentTrack.subtitle || currentTrack.more_info?.music || currentTrack.header_desc || 'Unknown artist'
  );
  const year = currentTrack.year || currentTrack.more_info?.year;
  const language = currentTrack.language || currentTrack.more_info?.language;
  const plays = formatPlayCount(currentTrack.play_count || currentTrack.more_info?.play_count);
  const explicit = currentTrack.explicit_content === '1' || currentTrack.more_info?.explicit_content === '1';

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const volPct = (isMuted ? 0 : volume) * 100;

  const DeviceIcon =
    activeDevice?.type === 'headphones' ? Headphones : activeDevice?.type === 'speaker' ? Speaker : Laptop;
  const deviceName = activeDevice?.name || 'This device';
  const deviceActive = activeDevice?.id && activeDevice.id !== 'default';

  const nextTrack = queue[queueIndex + 1];

  /* ───────── shared pieces ───────── */

  const scrubber = (
    <div>
      <input
        type="range"
        aria-label="Seek"
        min="0"
        max={duration || 100}
        step="0.1"
        value={currentTime}
        onChange={handleSeek}
        className="sp-range"
        style={{
          '--track': `linear-gradient(to right,#fff ${progress}%,rgba(255,255,255,.3) ${progress}%)`
        }}
      />
      <div className="-mt-0.5 flex justify-between text-[11px] font-medium tabular-nums text-white/65">
        <span>{formatSeconds(currentTime)}</span>
        <span>{formatSeconds(duration || currentTrack.more_info?.duration)}</span>
      </div>
    </div>
  );

  const playButton = (size = 'h-16 w-16', icon = 'h-7 w-7') => (
    <button
      onClick={togglePlayPause}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      className={`${iconBtn} ${size} bg-white text-black hover:scale-105`}
    >
      {isResolvingAudio ? (
        <Loader2 className={`${icon} animate-spin`} />
      ) : isPlaying ? (
        <Pause className={`${icon} fill-current`} />
      ) : (
        <Play className={`${icon} ml-0.5 fill-current`} />
      )}
    </button>
  );

  const transport = (
    <div className="flex items-center justify-between">
      <button
        onClick={toggleShuffle}
        aria-label="Shuffle"
        aria-pressed={isShuffle}
        className={`${iconBtn} relative h-11 w-11 ${isShuffle ? 'text-[#1ed760]' : 'text-white/85'}`}
      >
        <Shuffle className="h-[22px] w-[22px]" />
        {isShuffle && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#1ed760]" />}
      </button>
      <button onClick={handlePrevTrack} aria-label="Previous" className={`${iconBtn} h-12 w-12 text-white`}>
        <SkipBack className="h-8 w-8 fill-current" />
      </button>
      {playButton()}
      <button onClick={handleNextTrack} aria-label="Next" className={`${iconBtn} h-12 w-12 text-white`}>
        <SkipForward className="h-8 w-8 fill-current" />
      </button>
      <button
        onClick={toggleRepeatMode}
        aria-label="Repeat"
        aria-pressed={repeatMode !== 'off'}
        className={`${iconBtn} relative h-11 w-11 ${repeatMode !== 'off' ? 'text-[#1ed760]' : 'text-white/85'}`}
      >
        {repeatMode === 'one' ? <Repeat1 className="h-[22px] w-[22px]" /> : <Repeat className="h-[22px] w-[22px]" />}
        {repeatMode !== 'off' && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#1ed760]" />}
      </button>
    </div>
  );

  const equaliser = (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
      {[0, 0.25, 0.5].map((d) => (
        <span key={d} className="sp-bar w-[3px] rounded-sm bg-[#1ed760]" style={{ height: '100%', animationDelay: `${d}s` }} />
      ))}
    </span>
  );

  /* ───────── layout ───────── */

  return (
    <div
      className="fixed inset-0 z-50 flex h-[100dvh] justify-center overflow-hidden bg-[#121212] text-white select-none"
      role="dialog"
      aria-label="Now playing"
    >
      <style>{CSS}</style>

      {/* Artwork-tinted background (cross-fades when the colour changes) */}
      <div
        key={rgbStr}
        className="sp-fade pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(180deg, rgb(${rgbStr}) 0%, rgb(${deep}) 62%, #121212 100%)` }}
      />

      <div className="relative flex h-full w-full max-w-[480px] flex-col">
        {/* ═════════ PLAYER VIEW ═════════ */}
        {view === 'player' && (
          <>
            <header
              className="flex shrink-0 items-center justify-between px-3"
              style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
            >
              <button onClick={onClose} aria-label="Close player" className={`${iconBtn} h-11 w-11`}>
                <ChevronDown className="h-7 w-7" />
              </button>
              <div className="min-w-0 px-2 text-center">
                <p className="text-[11px] font-medium text-white/70">Now playing</p>
                <p className="truncate text-xs font-bold">{queue.length > 1 ? `Queue \u2022 ${queue.length} songs` : 'Single'}</p>
              </div>
              <button
                onClick={onOpenDevicePicker}
                aria-label={`Output device: ${deviceName}`}
                className={`${iconBtn} h-11 w-11 ${deviceActive ? 'text-[#1ed760]' : ''}`}
              >
                <DeviceIcon className="h-5 w-5" />
              </button>
            </header>

            <main className="sp-noscroll min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {/* Artwork / visualizer */}
              <div className="flex justify-center pt-4 pb-6 sm:pt-6">
                <button
                  onClick={() => setVisMode((m) => (m + 1 >= VIS_MODES.length ? -1 : m + 1))}
                  aria-label="Toggle visualizer"
                  className={`relative aspect-square w-full overflow-hidden rounded-lg bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,.55)] transition-transform duration-500 ease-out ${
                    isPlaying ? 'scale-100' : 'scale-[0.86]'
                  }`}
                  style={{ maxWidth: 'min(100%, 46dvh)' }}
                >
                  <img src={art} alt={`${title} cover`} className="h-full w-full object-cover" />
                  {visMode >= 0 && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm">
                      <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} mode={VIS_MODES[visMode]} />
                    </div>
                  )}
                </button>
              </div>

              {/* Title row */}
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-[22px] font-extrabold leading-tight tracking-tight">{title}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[15px] font-medium text-white/70">
                    {explicit && (
                      <span className="shrink-0 rounded-[3px] bg-white/60 px-1 text-[10px] font-bold leading-4 text-black">E</span>
                    )}
                    <span className="truncate">{artist}</span>
                  </p>
                </div>
                {onOpenAddToPlaylist && (
                  <button
                    onClick={() => onOpenAddToPlaylist(currentTrack)}
                    aria-label="Add to playlist"
                    className={`${iconBtn} h-11 w-11 text-white/85`}
                  >
                    <ListPlus className="h-6 w-6" />
                  </button>
                )}
                <button
                  onClick={() => toggleFavorite(currentTrack)}
                  aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                  aria-pressed={isFavorite}
                  className={`${iconBtn} h-11 w-11 ${isFavorite ? 'text-[#1ed760]' : 'text-white/85'}`}
                >
                  <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="mt-4">{scrubber}</div>
              <div className="mt-2">{transport}</div>

              {/* Utility row */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={onOpenDevicePicker}
                  className={`${iconBtn} h-10 gap-2 px-2 text-xs font-bold ${deviceActive ? 'text-[#1ed760]' : 'text-white/75'}`}
                >
                  <DeviceIcon className="h-[18px] w-[18px]" />
                  <span className="max-w-[140px] truncate">{deviceName}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setVisMode((m) => (m >= 0 ? -1 : 0))}
                    aria-label="Visualizer"
                    aria-pressed={visMode >= 0}
                    className={`${iconBtn} h-10 w-10 ${visMode >= 0 ? 'text-[#1ed760]' : 'text-white/75'}`}
                  >
                    <Activity className="h-5 w-5" />
                  </button>
                  <button onClick={() => setView('queue')} aria-label="Open queue" className={`${iconBtn} h-10 w-10 text-white/75`}>
                    <ListMusic className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Lyrics preview card (tap to expand) */}
              <button
                onClick={() => setView('lyrics')}
                className="mt-5 w-full overflow-hidden rounded-xl p-4 text-left transition active:scale-[0.98]"
                style={{ background: `rgb(${rgb.map((v) => Math.min(255, Math.round(v * 1.25 + 14))).join(',')})` }}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold">Lyrics</span>
                  {isIndicSong && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center rounded-full bg-black/40 p-0.5 text-[10px] font-bold"
                    >
                      <button
                        onClick={() => setScriptMode('original')}
                        className={`rounded-full px-2.5 py-0.5 transition ${
                          scriptMode === 'original' ? 'bg-white text-black font-extrabold' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => setScriptMode('english')}
                        className={`rounded-full px-2.5 py-0.5 transition ${
                          scriptMode === 'english' ? 'bg-white text-black font-extrabold' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  )}
                  <span className="rounded-full bg-black/25 px-3 py-1 text-[11px] font-bold shrink-0">Show lyrics</span>
                </div>
                {lyricsLoading ? (
                  <div className="space-y-2">
                    <div className="h-5 w-4/5 animate-pulse rounded bg-white/20" />
                    <div className="h-5 w-3/5 animate-pulse rounded bg-white/15" />
                  </div>
                ) : isSynced ? (
                  <div className="space-y-1.5 text-xl font-extrabold leading-snug">
                    <p className="line-clamp-2">{displayLyrics[Math.max(activeLine, 0)]?.text}</p>
                    <p className="line-clamp-2 text-white/45">{displayLyrics[Math.max(activeLine, 0) + 1]?.text}</p>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-white/75">{lyricsError || 'No lyrics for this song.'}</p>
                )}
              </button>

              {/* About */}
              {(year || language || plays) && (
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/75">
                  {language && <span className="rounded-full bg-white/10 px-3 py-1">{language}</span>}
                  {year && <span className="rounded-full bg-white/10 px-3 py-1">{year}</span>}
                  {plays && <span className="rounded-full bg-white/10 px-3 py-1">{plays} plays</span>}
                  {bitrate && <span className="rounded-full bg-white/10 px-3 py-1">{bitrate} kbps</span>}
                </div>
              )}

              {/* Up next peek */}
              {nextTrack && (
                <button
                  onClick={() => setView('queue')}
                  className="mt-4 flex w-full items-center gap-3 rounded-xl bg-black/25 p-2.5 text-left transition active:scale-[0.98]"
                >
                  <img src={upgradeImg(nextTrack.image)} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-white/60">Next in queue</p>
                    <p className="truncate text-sm font-bold">{decodeHTMLEntities(nextTrack.title)}</p>
                    <p className="truncate text-xs text-white/60">{decodeHTMLEntities(nextTrack.subtitle || '')}</p>
                  </div>
                </button>
              )}

              {/* Volume */}
              <div className="mt-5 hidden items-center gap-3 sm:flex">
                <button onClick={handleToggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} className={`${iconBtn} h-9 w-9 text-white/80`}>
                  {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <input
                  type="range"
                  aria-label="Volume"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="sp-range"
                  style={{ '--track': `linear-gradient(to right,#fff ${volPct}%,rgba(255,255,255,.3) ${volPct}%)` }}
                />
              </div>
              <div style={{ height: 'env(safe-area-inset-bottom)' }} />
            </main>
          </>
        )}

        {/* ═════════ LYRICS VIEW (full-screen, Spotify style) ═════════ */}
        {view === 'lyrics' && (
          <div className="sp-up absolute inset-0 z-10 flex flex-col">
            <header
              className="flex shrink-0 items-center gap-2 px-3 pb-2"
              style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
            >
              <button onClick={() => setView('player')} aria-label="Back to player" className={`${iconBtn} h-11 w-11`}>
                <ChevronDown className="h-7 w-7" />
              </button>
              <div className="min-w-0 flex-1 text-center">
                <p className="truncate text-sm font-extrabold">{title}</p>
                <p className="truncate text-xs font-medium text-white/70">{artist}</p>
              </div>
              {lyricsText ? (
                <button onClick={copyLyrics} aria-label="Copy lyrics" className={`${iconBtn} h-11 w-11`}>
                  {copied ? <Check className="h-5 w-5 text-[#1ed760]" /> : <Copy className="h-5 w-5" />}
                </button>
              ) : (
                <span className="h-11 w-11" />
              )}
            </header>

            {/* Original vs English Text Language Selector */}
            {isIndicSong && (
              <div className="flex shrink-0 items-center justify-center pb-2 pt-1">
                <div className="flex items-center rounded-full bg-white/15 p-1 text-xs font-bold shadow-md backdrop-blur-sm">
                  <button
                    onClick={() => setScriptMode('original')}
                    className={`rounded-full px-4 py-1 transition ${
                      scriptMode === 'original' ? 'bg-white text-black font-extrabold shadow-sm' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Original Script
                  </button>
                  <button
                    onClick={() => setScriptMode('english')}
                    className={`rounded-full px-4 py-1 transition ${
                      scriptMode === 'english' ? 'bg-white text-black font-extrabold shadow-sm' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    English Text
                  </button>
                </div>
              </div>
            )}

            <div
              ref={lyricsScrollRef}
              onTouchMove={pauseAutoScroll}
              onWheel={pauseAutoScroll}
              onPointerDown={pauseAutoScroll}
              className="sp-noscroll relative min-h-0 flex-1 select-text overflow-y-auto px-6"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom,transparent 0,#000 7%,#000 88%,transparent 100%)',
                maskImage: 'linear-gradient(to bottom,transparent 0,#000 7%,#000 88%,transparent 100%)'
              }}
            >
              {lyricsLoading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-white/70">
                  <Loader2 className="h-7 w-7 animate-spin" />
                  <p className="text-sm font-semibold">Loading lyrics</p>
                </div>
              ) : isSynced ? (
                <ul className="pt-[18dvh] pb-[45dvh]">
                  {displayLyrics.map((line, i) => {
                    const active = i === activeLine;
                    const past = i < activeLine;
                    return (
                      <li key={`${line.time}-${i}`} ref={(el) => (lineRefs.current[i] = el)}>
                        <button
                          onClick={() => {
                            seekTo(line.time);
                            setUserScrolling(false);
                          }}
                          className={`block w-full origin-left py-2.5 text-left text-[28px] font-extrabold leading-[1.18] tracking-tight transition-all duration-300 sm:text-[32px] ${
                            active
                              ? 'scale-100 text-white'
                              : past
                              ? 'scale-[0.97] text-white/55 hover:text-white/80'
                              : 'scale-[0.97] text-white/30 hover:text-white/60'
                          }`}
                        >
                          {line.text}
                        </button>
                      </li>
                    );
                  })}
                  {(lyricsData?.provider || lyricsData?.lyrics_copyright) && (
                    <li className="mt-10 space-y-1 text-xs font-medium text-white/50">
                      {lyricsData.provider && <p>Lyrics provided by {lyricsData.provider}</p>}
                      {lyricsData.lyrics_copyright && <p>{lyricsData.lyrics_copyright}</p>}
                    </li>
                  )}
                </ul>
              ) : displaySheetText ? (
                <div className="space-y-1 pt-[10dvh] pb-[30dvh]">
                  {displaySheetText.split('\n').map((l, i) =>
                    l.trim() ? (
                      <p key={i} className="text-[26px] font-extrabold leading-[1.2] tracking-tight text-white">
                        {l.trim()}
                      </p>
                    ) : (
                      <div key={i} className="h-5" />
                    )
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-start justify-center gap-3 pb-24">
                  <Mic2 className="h-9 w-9 text-white/60" />
                  <h3 className="text-2xl font-extrabold">No lyrics for this song</h3>
                  <p className="max-w-xs text-sm font-medium text-white/70">
                    {lyricsError || 'We couldn\u2019t find lyrics for this track.'}
                  </p>
                </div>
              )}
            </div>

            {/* Re-sync pill */}
            {isSynced && userScrolling && activeLine >= 0 && (
              <button
                onClick={() => {
                  setUserScrolling(false);
                  centerLine(activeLine);
                }}
                className="absolute bottom-[132px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-black shadow-xl transition active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Back to current line
              </button>
            )}

            {/* Mini controls */}
            <footer
              className="shrink-0 px-6 pt-2"
              style={{
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
                background: `linear-gradient(to top, rgb(${deep}) 55%, transparent)`
              }}
            >
              {scrubber}
              <div className="mt-1 flex items-center justify-center gap-6">
                <button onClick={handlePrevTrack} aria-label="Previous" className={`${iconBtn} h-11 w-11`}>
                  <SkipBack className="h-7 w-7 fill-current" />
                </button>
                {playButton('h-14 w-14', 'h-6 w-6')}
                <button onClick={handleNextTrack} aria-label="Next" className={`${iconBtn} h-11 w-11`}>
                  <SkipForward className="h-7 w-7 fill-current" />
                </button>
              </div>
            </footer>
          </div>
        )}

        {/* ═════════ QUEUE VIEW ═════════ */}
        {view === 'queue' && (
          <div className="sp-up absolute inset-0 z-10 flex flex-col bg-[#121212]">
            <header
              className="flex shrink-0 items-center gap-2 px-3 pb-2"
              style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
            >
              <button onClick={() => setView('player')} aria-label="Back to player" className={`${iconBtn} h-11 w-11`}>
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h3 className="flex-1 text-center text-base font-extrabold">Queue</h3>
              <span className="h-11 w-11" />
            </header>

            <div className="sp-noscroll min-h-0 flex-1 overflow-y-auto px-4 pb-6">
              {queue.length === 0 ? (
                <p className="py-20 text-center text-sm font-medium text-white/60">
                  Your queue is empty. Play a song to get started.
                </p>
              ) : (
                <>
                  {queue[queueIndex] && (
                    <>
                      <p className="px-2 pt-2 pb-2 text-base font-extrabold">Now playing</p>
                      <div ref={queueActiveRef} className="flex items-center gap-3 rounded-lg p-2">
                        <img src={upgradeImg(queue[queueIndex].image)} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-bold text-[#1ed760]">{decodeHTMLEntities(queue[queueIndex].title)}</p>
                          <p className="truncate text-sm text-white/60">{decodeHTMLEntities(queue[queueIndex].subtitle || '')}</p>
                        </div>
                        {isPlaying && equaliser}
                      </div>
                    </>
                  )}

                  <p className="px-2 pt-5 pb-2 text-base font-extrabold">Next in queue</p>
                  <ul>
                    {queue.map((track, idx) =>
                      idx <= queueIndex ? null : (
                        <li key={`${track.id}_${idx}`}>
                          <button
                            onClick={() => {
                              onPlayQueueTrack(idx);
                              setView('player');
                            }}
                            className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition active:bg-white/10"
                          >
                            <img src={upgradeImg(track.image)} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-bold">{decodeHTMLEntities(track.title)}</p>
                              <p className="truncate text-sm text-white/60">{decodeHTMLEntities(track.subtitle || '')}</p>
                            </div>
                          </button>
                        </li>
                      )
                    )}
                  </ul>

                  {queueIndex > 0 && (
                    <>
                      <p className="px-2 pt-5 pb-2 text-base font-extrabold">Previously played</p>
                      <ul className="opacity-70">
                        {queue.slice(0, queueIndex).map((track, idx) => (
                          <li key={`${track.id}_p${idx}`}>
                            <button
                              onClick={() => {
                                onPlayQueueTrack(idx);
                                setView('player');
                              }}
                              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition active:bg-white/10"
                            >
                              <img src={upgradeImg(track.image)} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-bold">{decodeHTMLEntities(track.title)}</p>
                                <p className="truncate text-sm text-white/60">{decodeHTMLEntities(track.subtitle || '')}</p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Mini bar so playback stays controllable */}
            {currentTrack && (
              <div
                className="flex shrink-0 items-center gap-3 border-t border-white/10 bg-[#181818] px-4 py-2"
                style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
              >
                <img src={art} alt="" className="h-10 w-10 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{title}</p>
                  <p className="truncate text-xs text-white/60">{artist}</p>
                </div>
                {playButton('h-10 w-10', 'h-5 w-5')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}