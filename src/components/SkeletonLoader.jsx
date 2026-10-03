import React from 'react';

export function SectionSkeleton() {
  return (
    <div className="mb-10 animate-pulse space-y-4">
      <div className="h-6 w-48 bg-slate-900 rounded-lg animate-shimmer" />
      <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-44 shrink-0 bg-slate-900/60 border border-slate-800 rounded-2xl p-3 space-y-3">
            <div className="aspect-square rounded-xl bg-slate-800 animate-shimmer" />
            <div className="h-4 w-3/4 bg-slate-800 rounded animate-shimmer" />
            <div className="h-3 w-1/2 bg-slate-800/80 rounded animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 10, isRound = false }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 space-y-3 animate-pulse">
          <div className={`aspect-square bg-slate-800 animate-shimmer ${isRound ? 'rounded-full' : 'rounded-xl'}`} />
          <div className="h-4 w-3/4 bg-slate-800 rounded mx-auto animate-shimmer" />
          <div className="h-3 w-1/2 bg-slate-800/80 rounded mx-auto animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
