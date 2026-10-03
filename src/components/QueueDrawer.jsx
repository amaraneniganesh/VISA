import React from 'react';
import { X, Trash2, ListMusic, Music2 } from 'lucide-react';
import { decodeHTMLEntities } from '../utils/formatters';

export default function QueueDrawer({
  isOpen,
  onClose,
  queue = [],
  queueIndex = 0,
  onPlayQueueTrack,
  onRemoveFromQueue,
  onClearQueue,
  upgradeImg
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800/90 h-full flex flex-col shadow-2xl p-6">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Playback Queue</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
              {queue.length} Tracks
            </span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="p-2 text-slate-400 hover:text-pink-400 hover:bg-slate-900 rounded-xl transition"
                title="Clear entire queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Queue Items Container */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {queue.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Music2 className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-semibold">Your queue is empty</p>
              <p className="text-xs text-slate-600">Add songs from discover or search results</p>
            </div>
          ) : (
            queue.map((song, idx) => {
              const isPlayingThis = idx === queueIndex;
              return (
                <div
                  key={`${song.id}_${idx}`}
                  onClick={() => onPlayQueueTrack(idx)}
                  className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition border ${
                    isPlayingThis
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/40'
                      : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-500 w-4 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={upgradeImg(song.image)}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0"
                    />
                    <div className="truncate">
                      <p className={`text-xs font-bold truncate ${isPlayingThis ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {decodeHTMLEntities(song.title)}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {decodeHTMLEntities(song.subtitle || song.more_info?.music || 'Track')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {isPlayingThis ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromQueue(idx);
                        }}
                        className="p-1.5 text-slate-500 hover:text-pink-400 opacity-0 group-hover:opacity-100 transition"
                        title="Remove from queue"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
