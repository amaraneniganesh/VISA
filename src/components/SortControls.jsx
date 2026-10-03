import React from 'react';
import { ArrowUpDown, SlidersHorizontal } from 'lucide-react';

export default function SortControls({ sortOption, setSortOption, totalCount = 0, label = 'Items' }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 sm:p-4 rounded-2xl glass-panel border border-slate-800">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
        <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
        <span>Sort & Filter {label} ({totalCount})</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold">
        <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-slate-400 hidden sm:inline">Sort By:</span>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500/80 cursor-pointer"
        >
          <option value="default">Default / Recommended</option>
          <option value="title-asc">Title (A to Z)</option>
          <option value="title-desc">Title (Z to A)</option>
          <option value="year-desc">Latest Release Year</option>
          <option value="duration-desc">Longest Track Duration</option>
        </select>
      </div>
    </div>
  );
}
