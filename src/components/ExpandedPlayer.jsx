import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Disc3,
  Sparkles,
  Radio,
  Mic2,
  Loader2,
  Copy,
  Check,
  Globe,
  AlignLeft,
  RefreshCw,
  Languages
} from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { decodeHTMLEntities, formatPlayCount } from '../utils/formatters';
import { hasNonLatinScript, transliterateToEnglish } from '../utils/transliterate';

const TABS = [
  { id: 'studio', label: 'Studio', icon: Radio },
  { id: 'lyrics', label: 'Lyrics', icon: Mic2 },
  { id: 'queue', label: 'Queue', icon: ListMusic }
];

const MODES = [
  { id: 'radial', label: 'Radial', icon: Radio },
  { id: 'spectrum', label: 'Spectrum', icon: Activity },
  { id: 'particles', label: 'Beam', icon: Sparkles }
];

const RANGE_CSS = `
.studio-range{-webkit-appearance:none;appearance:none;height:6px;border-radius:999px;outline:none;cursor:pointer;touch-action:none}
.studio-range::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#ffffff;box-shadow:0 0 12px rgba(16,185,129,0.6), 0 0 0 2px rgba(16,185,129,0.8);border:0;transition:transform 0.15s ease}
.studio-range::-webkit-slider-thumb:hover{transform:scale(1.25)}
.studio-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#ffffff;box-shadow:0 0 12px rgba(16,185,129,0.6), 0 0 0 2px rgba(16,185,129,0.8);border:0;transition:transform 0.15s ease}
.studio-range:focus-visible{box-shadow:0 0 0 2px #10b981}
.no-scrollbar{scrollbar-width:none}.no-scrollbar::-webkit-scrollbar{display:none}
`;

const iconBtn =
  'inline-flex items-center justify-center rounded-full transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';

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
  const [visualizerMode, setVisualizerMode] = useState('radial');
  const [activeTab, setActiveTab] = useState(initialTab || 'studio');
  const [lyricsData, setLyricsData] = useState(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState(null);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [lyricsViewMode, setLyricsViewMode] = useState('synced'); // 'synced' | 'sheet'
  const [scriptMode, setScriptMode] = useState('original'); // 'original' | 'english'
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const activeRowRef = useRef(null);
  const lineRefs = useRef({});
  const lyricsContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    if (!currentTrack?.id) {
      setLyricsData(null);
      return;
    }

    const fetchLyrics = async () => {
      setIsLyricsLoading(true);
      setLyricsError(null);
      try {
        const lyricsId = encodeURIComponent(currentTrack.id || '');
        const titleParam = encodeURIComponent(currentTrack.title || '');
        const artistParam = encodeURIComponent(
          currentTrack.subtitle || currentTrack.artist || currentTrack.more_info?.music || ''
        );
        const durParam = encodeURIComponent(duration || currentTrack.more_info?.duration || '');

        const apiHost = window.location.origin.includes('localhost')
          ? 'http://localhost:5000/api'
          : 'https://visa-server-7qzv.onrender.com/api';

        const res = await fetch(
          `${apiHost}/lyrics?lyrics_id=${lyricsId}&title=${titleParam}&artist=${artistParam}&duration=${durParam}`
        );
        const data = await res.json();
        if (!isMounted) return;

        if (data.success && (data.lyrics || data.syncedLyrics)) {
          setLyricsData(data);
          setLyricsError(null);
        } else {
          setLyricsError(data.error || 'Lyrics not available for this song');
          setLyricsData(null);
        }
      } catch (_err) {
        if (isMounted) {
          setLyricsError('Unable to fetch lyrics at this time');
          setLyricsData(null);
        }
      } finally {
        if (isMounted) setIsLyricsLoading(false);
      }
    };

    fetchLyrics();
    return () => {
      isMounted = false;
    };
  }, [
    currentTrack?.id,
    currentTrack?.title,
    currentTrack?.subtitle,
    currentTrack?.artist,
    currentTrack?.more_info?.music,
    duration
  ]);

  // Scroll the playing row into view when the queue opens
  useEffect(() => {
    if (activeTab === 'queue' && activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ block: 'center' });
    }
  }, [activeTab]);

  const lyricsText = useMemo(
    () => (lyricsData?.lyrics ? decodeHTMLEntities(lyricsData.lyrics.replace(/<br\s*\/?>/gi, '\n')) : ''),
    [lyricsData]
  );

  // Check if current lyrics contain Indic or non-Latin script (Telugu, Hindi, Punjabi, Tamil, Malayalam, Kannada, Bengali, etc.)
  const containsNonLatin = useMemo(() => {
    if (!lyricsText) return false;
    return hasNonLatinScript(lyricsText) || (lyricsData?.syncedLyrics && hasNonLatinScript(lyricsData.syncedLyrics));
  }, [lyricsText, lyricsData]);

  // Parse LRC timestamped lyrics OR generate auto-paced synced lines
  const parsedLyrics = useMemo(() => {
    if (!lyricsData) return [];

    const rawLrc =
      lyricsData.syncedLyrics ||
      (lyricsData.lyrics && lyricsData.lyrics.includes('[') ? lyricsData.lyrics : null);

    if (rawLrc) {
      const cleanText = rawLrc.replace(/<br\s*\/?>/gi, '\n');
      const rawLines = cleanText.split(/\r?\n/);
      const items = [];
      const timeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

      for (const rawLine of rawLines) {
        const matches = [...rawLine.matchAll(timeRegex)];
        if (matches.length > 0) {
          const text = rawLine
            .replace(/\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/g, '')
            .replace(/<[^>]*>/g, '')
            .trim();
          for (const m of matches) {
            const mins = parseInt(m[1], 10);
            const secs = parseInt(m[2], 10);
            const ms = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) : 0;
            const timeVal = mins * 60 + secs + ms / 1000;
            if (text || rawLine.includes(']')) {
              items.push({
                id: items.length,
                time: Number(timeVal.toFixed(2)),
                text: text || '♪ ♪ ♪'
              });
            }
          }
        }
      }
      items.sort((a, b) => a.time - b.time);
      if (items.length > 0) return items;
    }

    // Fallback: Plain text line-by-line auto-paced timing across duration
    if (lyricsData.lyrics) {
      const plainText = decodeHTMLEntities(lyricsData.lyrics.replace(/<br\s*\/?>/gi, '\n'));
      const lines = plainText
        .split('\n')
        .map((l) => l.replace(/<[^>]*>/g, '').trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) return [];

      const totalDuration = duration && duration > 10 ? duration : 180;
      const startOffset = Math.min(6, totalDuration * 0.04);
      const endMargin = 8;
      const usableTime = Math.max(10, totalDuration - startOffset - endMargin);
      const interval = usableTime / lines.length;

      return lines.map((text, idx) => ({
        id: idx,
        time: Number((startOffset + idx * interval).toFixed(2)),
        text,
        isEstimated: true
      }));
    }

    return [];
  }, [lyricsData, duration]);

  // Helper to transliterate line text if scriptMode is 'english' without text disappearing
  const getLineText = (text) => {
    if (!text || !text.trim()) return text || '♪ ♪ ♪';
    if (scriptMode === 'english' && containsNonLatin) {
      const transliterated = transliterateToEnglish(text);
      if (transliterated && transliterated.trim()) {
        return transliterated;
      }
    }
    return text;
  };

  // Determine current active lyric line based on playback time
  const activeLineIndex = useMemo(() => {
    if (!parsedLyrics || parsedLyrics.length === 0) return -1;
    let active = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTime >= parsedLyrics[i].time) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }, [parsedLyrics, currentTime]);

  // Auto-scroll active lyric line into center view
  useEffect(() => {
    if (
      activeTab === 'lyrics' &&
      lyricsViewMode === 'synced' &&
      !isUserScrolling &&
      activeLineIndex >= 0 &&
      lineRefs.current[activeLineIndex]
    ) {
      lineRefs.current[activeLineIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeLineIndex, activeTab, lyricsViewMode, isUserScrolling]);

  const handleLyricsScroll = () => {
    if (lyricsViewMode !== 'synced') return;
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4000);
  };

  const handleResyncLyrics = () => {
    setIsUserScrolling(false);
    if (activeLineIndex >= 0 && lineRefs.current[activeLineIndex]) {
      lineRefs.current[activeLineIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const handleCopyLyrics = () => {
    if (!lyricsText) return;
    const finalCopyText =
      scriptMode === 'english' && containsNonLatin ? transliterateToEnglish(lyricsText) : lyricsText;
    navigator.clipboard.writeText(finalCopyText);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;
  const volumePercent = (isMuted ? 0 : volume) * 100;

  const DeviceIcon =
    activeDevice?.type === 'headphones' ? Headphones : activeDevice?.type === 'speaker' ? Speaker : Laptop;
  const deviceName = activeDevice?.name || 'PC Speakers';
  const deviceActive = activeDevice?.id && activeDevice.id !== 'default';

  const title = decodeHTMLEntities(currentTrack.title);
  const artist = decodeHTMLEntities(
    currentTrack.subtitle || currentTrack.more_info?.music || currentTrack.header_desc || 'Track Artist'
  );
  const language = currentTrack.language || currentTrack.more_info?.language;
  const year = currentTrack.year || currentTrack.more_info?.year;
  const plays = formatPlayCount(currentTrack.play_count || currentTrack.more_info?.play_count);
  const explicit = currentTrack.explicit_content === '1' || currentTrack.more_info?.explicit_content === '1';
  const hasLrcExact = Boolean(lyricsData?.hasSynced);

  return (
    <div
      className="fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-[#06080e] text-slate-100 select-none animate-in fade-in duration-300"
      role="dialog"
      aria-label="Now playing"
    >
      <style>{RANGE_CSS}</style>

      {/* Atmospheric dynamic artwork glow */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          src={upgradeImg(currentTrack.image)}
          alt=""
          className="h-full w-full scale-150 object-cover opacity-30 blur-[100px] transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06080e]/75 via-[#06080e]/85 to-[#06080e]" />
      </div>

      {/* ───────── Top Header Bar ───────── */}
      <header
        className="relative z-20 shrink-0 border-b border-white/10 bg-slate-950/60 px-3 pb-2.5 backdrop-blur-2xl sm:px-6 sm:pb-3.5"
        style={{ paddingTop: 'max(0.6rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onClose}
            aria-label="Close player"
            className={`${iconBtn} h-10 w-10 shrink-0 border border-white/15 bg-white/10 text-slate-100 hover:bg-white/20 hover:scale-105`}
          >
            <ChevronDown className="h-5 w-5" />
          </button>

          {/* Master title info */}
          <div className="min-w-0 flex-1 text-center sm:flex-none sm:text-left">
            <p className="flex items-center justify-center gap-1.5 text-sm font-extrabold tracking-tight text-white sm:justify-start sm:text-base">
              <span className="truncate">Studio Master</span>
              <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-emerald-300 shadow-sm shadow-emerald-500/20">
                {bitrate}k
              </span>
            </p>
            <p className="hidden truncate text-xs font-medium text-slate-400 sm:block">
              High Definition Audio Spectrum
            </p>
          </div>

          {/* Desktop Navbar Tabs */}
          <nav
            className="mx-auto hidden items-center gap-1.5 rounded-full border border-white/15 bg-slate-900/80 p-1.5 shadow-xl sm:flex"
            aria-label="Player views"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                  {t.id === 'queue' && (
                    <span className="rounded-full bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-extrabold opacity-80">
                      {queue.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Output Device Picker button */}
          <button
            onClick={onOpenDevicePicker}
            aria-label={`Output device: ${deviceName}`}
            title="Switch audio output device"
            className={`${iconBtn} h-10 shrink-0 gap-2 border px-3 text-xs font-bold transition-all ${
              deviceActive
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-500/20'
                : 'border-white/15 bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <DeviceIcon className="h-4 w-4" />
            <span className="hidden max-w-[120px] truncate md:inline font-semibold">{deviceName}</span>
          </button>
        </div>

        {/* Mobile View Selector Tabs */}
        <nav
          className="mt-2.5 grid grid-cols-3 gap-1 rounded-2xl border border-white/15 bg-slate-900/90 p-1 shadow-lg sm:hidden"
          aria-label="Player views"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                aria-pressed={active}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'text-slate-400 active:bg-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {t.id === 'queue' && (
                  <span className="rounded-full bg-slate-800/80 px-1.5 py-0.2 text-[10px] font-extrabold opacity-80">
                    {queue.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ───────── Main Player Viewport ───────── */}
      <main className="no-scrollbar relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 sm:px-6 sm:py-5">
        {/* STUDIO TAB: Visualizer, Vinyl Artwork & Metadata */}
        {activeTab === 'studio' && (
          <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-evenly gap-3 sm:gap-5">
            {/* Visualizer Mode Switch Pills */}
            <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-slate-900/80 p-1 shadow-lg backdrop-blur-md">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = visualizerMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setVisualizerMode(m.id)}
                    aria-pressed={active}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all sm:px-4 sm:text-xs ${
                      active
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 shadow-md shadow-cyan-500/25'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Central Artwork & Visualizer Container */}
            <div className="relative flex aspect-square w-[min(82vw,42dvh,380px)] shrink-0 items-center justify-center">
              {/* Background Canvas Visualizer */}
              <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} mode={visualizerMode} />
              </div>

              {/* Album Art Card */}
              <div className="group relative z-10 aspect-square w-[54%] overflow-hidden rounded-3xl border border-white/25 shadow-2xl shadow-emerald-500/20 backdrop-blur-sm">
                <img
                  src={upgradeImg(currentTrack.image)}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {isPlaying && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px]">
                    <Disc3 className="h-9 w-9 animate-spin text-emerald-300/60" style={{ animationDuration: '6s' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Song Metadata */}
            <div className="w-full shrink-0 space-y-2 text-center">
              <h2 className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-white sm:text-3xl">
                {title}
              </h2>
              <p className="line-clamp-1 text-sm font-bold text-emerald-400 sm:text-base">{artist}</p>

              {/* Badges row */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {language && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-200 shadow-sm">
                    {language}
                  </span>
                )}
                {year && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
                    {year}
                  </span>
                )}
                {plays && (
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                    {plays} plays
                  </span>
                )}
                {explicit && (
                  <span className="rounded border border-pink-500/40 bg-pink-500/20 px-1.5 py-0.5 text-[10px] font-black text-pink-400">
                    EXPLICIT
                  </span>
                )}
                {isResolvingAudio && (
                  <span className="flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                    <Loader2 className="h-3 w-3 animate-spin" /> Resolving audio stream
                  </span>
                )}
              </div>

              {/* Floating Live Synced Lyric Preview Pill */}
              {parsedLyrics.length > 0 && activeLineIndex >= 0 && parsedLyrics[activeLineIndex] && (
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('lyrics')}
                    className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-emerald-500/40 bg-slate-950/80 px-4 py-2 text-xs font-bold text-slate-200 shadow-2xl backdrop-blur-xl transition-all active:scale-95 hover:border-emerald-400 hover:bg-slate-900 group"
                  >
                    <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    <span className="max-w-[240px] truncate font-extrabold text-emerald-300 sm:max-w-md">
                      {getLineText(parsedLyrics[activeLineIndex].text)}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400 group-hover:text-white">
                      Lyrics →
                    </span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* LYRICS TAB: Spotify-Style Highlighted Lyrics Stream */}
        {activeTab === 'lyrics' && (
          <section className="relative mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur-2xl">
            {/* Header controls & song info */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-b border-white/10 p-3 sm:p-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={upgradeImg(currentTrack.image)}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-xl border border-white/15 object-cover shadow-md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-extrabold text-slate-100">{title}</h4>
                    {parsedLyrics.length > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black shrink-0 ${
                          hasLrcExact
                            ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                            : 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        {hasLrcExact ? 'LRC Synced' : 'Auto Synced'}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs font-bold text-emerald-400">{artist}</p>
                </div>
              </div>

              {/* Action Controls: Script Mode Toggle (Original vs English), View Mode, Copy */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {containsNonLatin && (
                  <button
                    onClick={() => setScriptMode((prev) => (prev === 'original' ? 'english' : 'original'))}
                    title="Toggle lyrics script between Original and English (Romanized)"
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all ${
                      scriptMode === 'english'
                        ? 'border-cyan-500/40 bg-cyan-500/25 text-cyan-200 shadow-md shadow-cyan-500/20'
                        : 'border-white/15 bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    <Languages className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{scriptMode === 'english' ? 'English Text' : 'Original'}</span>
                  </button>
                )}

                {parsedLyrics.length > 0 && (
                  <div className="flex items-center rounded-xl border border-white/15 bg-slate-950/70 p-1">
                    <button
                      onClick={() => setLyricsViewMode('synced')}
                      title="Live Synced Karaoke Mode"
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        lyricsViewMode === 'synced'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Mic2 className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline sm:inline">Karaoke</span>
                    </button>
                    <button
                      onClick={() => setLyricsViewMode('sheet')}
                      title="Full Text Sheet Mode"
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        lyricsViewMode === 'sheet'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline sm:inline">Sheet</span>
                    </button>
                  </div>
                )}

                {lyricsText && (
                  <button
                    onClick={handleCopyLyrics}
                    aria-label="Copy lyrics"
                    className={`${iconBtn} h-8 shrink-0 gap-1.5 border border-white/15 bg-white/10 px-3 text-xs font-bold text-slate-200 hover:bg-white/20`}
                  >
                    {copiedLyrics ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="hidden xs:inline sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Lyrics Body Content */}
            <div
              ref={lyricsContainerRef}
              onScroll={handleLyricsScroll}
              className="no-scrollbar relative min-h-0 flex-1 select-text overflow-y-auto px-4 py-2 sm:px-8"
            >
              {isLyricsLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                  <p className="text-xs font-bold text-slate-300">Fetching synced lyrics…</p>
                </div>
              ) : lyricsData && parsedLyrics.length > 0 ? (
                lyricsViewMode === 'synced' ? (
                  /* ──── SPOTIFY-STYLE FRAMECOMPACT TEXT HIGHLIGHTING VIEW ──── */
                  <div className="space-y-6 py-[30vh]">
                    {parsedLyrics.map((line, i) => {
                      const isActive = i === activeLineIndex;
                      const isPast = i < activeLineIndex;
                      const lineText = getLineText(line.text);

                      return (
                        <div
                          key={`${line.time}_${i}`}
                          ref={(el) => (lineRefs.current[i] = el)}
                          onClick={() => {
                            handleSeek({ target: { value: line.time } });
                            setIsUserScrolling(false);
                          }}
                          className={`group relative flex cursor-pointer items-center justify-between py-1 transition-all duration-300 ${
                            isActive
                              ? 'scale-[1.03] origin-left text-white opacity-100'
                              : isPast
                              ? 'text-slate-400/50 hover:text-slate-200 hover:opacity-90'
                              : 'text-slate-400/60 hover:text-slate-200 hover:opacity-100'
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            {isActive && (
                              <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                              </span>
                            )}

                            <p
                              className={`transition-all duration-300 select-text ${
                                isActive
                                  ? 'text-2xl font-black leading-tight tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] sm:text-3xl md:text-4xl'
                                  : 'text-lg font-bold leading-snug sm:text-2xl md:text-3xl'
                              }`}
                            >
                              {lineText}
                            </p>
                          </div>

                          <span className="ml-3 hidden shrink-0 font-mono text-[11px] font-extrabold text-emerald-400/80 opacity-0 group-hover:opacity-100 sm:inline">
                            {formatSeconds(line.time)}
                          </span>
                        </div>
                      );
                    })}

                    {(lyricsData?.provider || lyricsData?.lyrics_copyright) && (
                      <div className="mt-12 space-y-1 border-t border-white/10 pt-6">
                        {lyricsData.provider && (
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400">
                            <Globe className="h-3.5 w-3.5" />
                            Provider: {lyricsData.provider}
                          </p>
                        )}
                        {lyricsData.lyrics_copyright && (
                          <p className="text-[10px] text-slate-500">{lyricsData.lyrics_copyright}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ──── FULL TEXT SHEET VIEW ──── */
                  <div className="space-y-3 py-6">
                    {lyricsText.split('\n').map((line, i) => {
                      const rawT = line.trim();
                      if (!rawT) return <div key={i} className="h-3" />;
                      const t = getLineText(rawT);
                      const up = rawT.toUpperCase();
                      const isHeader =
                        up.startsWith('HOOK') || up.startsWith('CHORUS') || up.startsWith('VERSE');
                      return (
                        <p
                          key={i}
                          className={
                            isHeader
                              ? 'pt-4 text-xs font-black tracking-widest text-emerald-400'
                              : 'text-base font-semibold leading-relaxed text-slate-200 sm:text-xl'
                          }
                        >
                          {t}
                        </p>
                      );
                    })}

                    {(lyricsData?.provider || lyricsData?.lyrics_copyright) && (
                      <div className="mt-8 space-y-1 border-t border-white/10 pt-4">
                        {lyricsData.provider && (
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400">
                            <Globe className="h-3.5 w-3.5" />
                            Source: {lyricsData.provider}
                          </p>
                        )}
                        {lyricsData.lyrics_copyright && (
                          <p className="text-[10px] text-slate-500">{lyricsData.lyrics_copyright}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                    <Mic2 className="h-6 w-6 text-slate-400" />
                  </div>
                  <h5 className="text-sm font-extrabold text-slate-200">No lyrics available</h5>
                  <p className="max-w-xs text-xs leading-relaxed text-slate-400">
                    {lyricsError || 'Lyrics for this song could not be loaded. Switch to Studio mode to view visuals.'}
                  </p>
                </div>
              )}
            </div>

            {/* Re-sync Floating Button when user scrolls manually */}
            {lyricsViewMode === 'synced' && isUserScrolling && activeLineIndex >= 0 && (
              <div className="absolute bottom-4 right-4 z-30 animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={handleResyncLyrics}
                  className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-xl shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                  Re-sync to song
                </button>
              </div>
            )}
          </section>
        )}

        {/* QUEUE TAB: Track Queue List */}
        {activeTab === 'queue' && (
          <section className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-200">
                <ListMusic className="h-4 w-4 text-emerald-400" />
                Up Next Queue
              </h4>
              <span className="font-mono text-xs font-bold text-slate-400">{queue.length} tracks</span>
            </div>

            <ul className="no-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2 sm:p-3">
              {queue.length === 0 && (
                <li className="py-16 text-center text-xs text-slate-400">
                  Your queue is currently empty. Play songs from the app to add tracks here.
                </li>
              )}
              {queue.map((track, idx) => {
                const current = idx === queueIndex;
                return (
                  <li key={`${track.id}_${idx}`} ref={current ? activeRowRef : null}>
                    <button
                      onClick={() => onPlayQueueTrack(idx)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all active:scale-[0.99] ${
                        current
                          ? 'border-emerald-500/50 bg-emerald-500/20 shadow-lg shadow-emerald-500/10'
                          : 'border-transparent hover:bg-white/5'
                      }`}
                    >
                      <span className="w-6 shrink-0 text-center text-xs font-extrabold text-slate-400">
                        {current && isPlaying ? (
                          <Activity className="mx-auto h-4 w-4 text-emerald-400 animate-pulse" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <img
                        src={upgradeImg(track.image)}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-xl border border-white/15 object-cover shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-extrabold ${current ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {decodeHTMLEntities(track.title)}
                        </p>
                        <p className="truncate text-xs font-medium text-slate-400">
                          {decodeHTMLEntities(track.subtitle || 'Track')}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>

      {/* ───────── Bottom Controls & Scrubber Footer ───────── */}
      <footer
        className="relative z-20 shrink-0 border-t border-white/10 bg-slate-950/95 px-3 pt-3 backdrop-blur-2xl sm:px-8 sm:pt-4"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-3xl space-y-2 sm:space-y-3">
          {/* Interactive Scrubber Bar */}
          <div className="flex items-center gap-3 px-1">
            <span className="w-10 shrink-0 text-right font-mono text-[11px] font-extrabold text-emerald-400">
              {formatSeconds(currentTime)}
            </span>
            <input
              type="range"
              aria-label="Seek track"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              style={{
                background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${progressPercent}%, #1e293b ${progressPercent}%, #1e293b 100%)`
              }}
              className="studio-range min-w-0 flex-1"
            />
            <span className="w-10 shrink-0 font-mono text-[11px] font-extrabold text-slate-400">
              {formatSeconds(duration || currentTrack.more_info?.duration)}
            </span>
          </div>

          {/* Player Action Buttons */}
          <div className="flex flex-col items-stretch gap-2.5 md:flex-row md:items-center md:justify-between md:gap-6">
            {/* Main Transport Controls (Centered) */}
            <div className="flex items-center justify-between gap-1 px-1 sm:justify-center sm:gap-4 md:order-2">
              <button
                onClick={toggleShuffle}
                aria-label="Shuffle mode"
                aria-pressed={isShuffle}
                className={`${iconBtn} h-10 w-10 ${
                  isShuffle ? 'bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shuffle className="h-5 w-5" />
              </button>

              <button
                onClick={handlePrevTrack}
                aria-label="Previous track"
                className={`${iconBtn} h-11 w-11 text-slate-100 hover:bg-white/10`}
              >
                <SkipBack className="h-6 w-6 fill-current" />
              </button>

              <button
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className={`${iconBtn} h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/35 hover:scale-105`}
              >
                {isResolvingAudio ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-7 w-7 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-7 w-7 fill-current" />
                )}
              </button>

              <button
                onClick={handleNextTrack}
                aria-label="Next track"
                className={`${iconBtn} h-11 w-11 text-slate-100 hover:bg-white/10`}
              >
                <SkipForward className="h-6 w-6 fill-current" />
              </button>

              <button
                onClick={toggleRepeatMode}
                aria-label="Repeat mode"
                aria-pressed={repeatMode !== 'off'}
                className={`${iconBtn} h-10 w-10 ${
                  repeatMode !== 'off' ? 'bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                {repeatMode === 'one' ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
              </button>
            </div>

            {/* Secondary Actions: Favorite, Playlist, Volume */}
            <div className="flex items-center justify-center gap-2 md:order-1 md:justify-start">
              <button
                onClick={() => toggleFavorite(currentTrack)}
                aria-label="Favorite track"
                aria-pressed={isFavorite}
                className={`${iconBtn} h-10 w-10 border ${
                  isFavorite
                    ? 'border-pink-500/50 bg-pink-500/20 text-pink-400 shadow-md shadow-pink-500/20'
                    : 'border-white/15 bg-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Heart className={`h-[18px] w-[18px] ${isFavorite ? 'fill-current text-pink-400' : ''}`} />
              </button>

              {onOpenAddToPlaylist && (
                <button
                  onClick={() => onOpenAddToPlaylist(currentTrack)}
                  aria-label="Add to playlist"
                  className={`${iconBtn} h-10 w-10 border border-white/15 bg-white/10 text-slate-300 hover:text-emerald-400 hover:bg-white/20`}
                >
                  <ListPlus className="h-[18px] w-[18px]" />
                </button>
              )}

              {/* Volume Controls */}
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-0.5 pl-0.5 pr-3 md:hidden lg:flex">
                <button
                  onClick={handleToggleMute}
                  aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                  className={`${iconBtn} h-9 w-9 text-slate-300 hover:text-white`}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-[18px] w-[18px] text-pink-400" />
                  ) : (
                    <Volume2 className="h-[18px] w-[18px] text-emerald-400" />
                  )}
                </button>
                <input
                  type="range"
                  aria-label="Volume level"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${volumePercent}%, #1e293b ${volumePercent}%, #1e293b 100%)`
                  }}
                  className="studio-range w-24 sm:w-28"
                />
              </div>
            </div>

            {/* Desktop spacer for md layout balance */}
            <div className="hidden items-center justify-end gap-2 md:order-3 md:flex lg:hidden">
              <button
                onClick={handleToggleMute}
                aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                className={`${iconBtn} h-10 w-10 border border-white/15 bg-white/10 text-slate-300`}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-[18px] w-[18px] text-pink-400" />
                ) : (
                  <Volume2 className="h-[18px] w-[18px] text-emerald-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}