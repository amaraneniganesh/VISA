import React, { useState, useEffect } from 'react';
import { Play, Pause, Sparkles, Plus, Disc3, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { decodeHTMLEntities } from '../utils/formatters';

export default function HeroBanner({
  featuredItems = [],
  featuredTrack,
  onPlay,
  onAddToQueue,
  isPlaying,
  currentTrack,
  upgradeImg
}) {
  const items = featuredItems.length > 0 ? featuredItems : featuredTrack ? [featuredTrack] : [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance items one by one every 5.5 seconds
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];
  const isCurrent = currentTrack?.id === currentItem.id;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden mb-10 border border-slate-800/80 shadow-2xl group bg-slate-950">
      {/* Background Cover Image with Blur Glow */}
      <div className="absolute inset-0 z-0 transition-all duration-700">
        <img
          src={upgradeImg(currentItem.image)}
          alt=""
          className="w-full h-full object-cover filter blur-2xl opacity-35 scale-110 group-hover:scale-105 transition duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
      </div>

      {/* Content Grid */}
      <div className="relative z-20 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 min-h-[320px]">
        <div className="max-w-xl text-center md:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
            <Flame className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            <span>Trending Stream #{currentIndex + 1} of {items.length}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md transition-all duration-300">
            {decodeHTMLEntities(currentItem.title)}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 font-medium line-clamp-2">
            {decodeHTMLEntities(currentItem.subtitle || currentItem.header_desc || 'Experience high-fidelity lossless spatial audio streaming')}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
            <button
              onClick={() => onPlay(currentItem)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition active:scale-95"
            >
              {isCurrent && isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                  <span>Stream Now</span>
                </>
              )}
            </button>

            <button
              onClick={() => onAddToQueue(currentItem)}
              className="px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2 backdrop-blur-md transition hover:border-emerald-500/40"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add to Queue</span>
            </button>
          </div>
        </div>

        {/* Featured Cover Art Showcase with Vinyl Disc Animation */}
        <div className="relative shrink-0 w-48 h-48 sm:w-56 sm:h-56">
          {/* Vinyl Disc Backdrop */}
          <div className={`absolute -right-6 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-slate-900 border-4 border-slate-800 shadow-xl flex items-center justify-center transition-all duration-700 ${
            isCurrent && isPlaying ? 'translate-x-6 animate-spin-slow opacity-100' : 'opacity-80 group-hover:translate-x-4'
          }`}>
            <div className="w-14 h-14 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center">
              <Disc3 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          {/* Main Artwork */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl z-10 glass-card">
            <img
              src={upgradeImg(currentItem.image)}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            {isCurrent && isPlaying && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                <div className="flex items-end gap-1.5 h-8">
                  <span className="w-1.5 bg-emerald-400 rounded-full eq-bar-1" />
                  <span className="w-1.5 bg-cyan-400 rounded-full eq-bar-2" />
                  <span className="w-1.5 bg-emerald-400 rounded-full eq-bar-3" />
                  <span className="w-1.5 bg-violet-400 rounded-full eq-bar-4" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide Navigation Controls & Indicators */}
      {items.length > 1 && (
        <div className="relative z-20 px-8 pb-5 flex items-center justify-between">
          {/* Indicators Dots */}
          <div className="flex items-center gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-6 bg-emerald-400 shadow-md shadow-emerald-400/50'
                    : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Next / Previous Arrow Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
              title="Previous item"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
              title="Next item"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
