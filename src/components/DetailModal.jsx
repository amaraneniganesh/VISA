import React from 'react';
import { X, Play, Plus, Loader2, Layers } from 'lucide-react';
import TrackRow from './TrackRow';
import { decodeHTMLEntities } from '../utils/formatters';

export default function DetailModal({
  selectedEntity,
  onClose,
  detailData,
  detailLoading,
  onPlaySongFromList,
  onPlayAllTracks,
  onAddAllToQueue,
  onAddToQueue,
  onOpenAddToPlaylist,
  onToggleFavorite,
  favoritesMap = {},
  currentTrack,
  isPlaying,
  isResolvingAudio,
  relatedAlbums = [],
  onOpenAnotherDetail,
  onLoadMoreArtistSongs,
  artistMoreSongsLoading,
  upgradeImg,
  formatSeconds
}) {
  if (!selectedEntity) return null;

  const modalImage =
    upgradeImg(detailData?.image) ||
    upgradeImg(selectedEntity?.image) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEntity?.title || 'Music')}&background=10b981&color=fff&size=500&bold=true`;

  const songList = detailData?.topSongs || detailData?.list || [];
  const isArtist = (detailData?.type || selectedEntity?.type) === 'artist';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-slate-800/80 flex flex-col sm:flex-row gap-6 items-center sm:items-start relative bg-slate-900/40">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Cover Image */}
          <div className="relative shrink-0 w-32 h-32 sm:w-40 sm:h-40">
            <img
              src={modalImage}
              alt=""
              className={`w-full h-full object-cover border border-white/10 shadow-2xl ${
                isArtist ? 'rounded-full' : 'rounded-2xl'
              }`}
            />
          </div>

          {/* Metadata & Actions */}
          <div className="flex-1 text-center sm:text-left space-y-3 min-w-0 pr-6">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 inline-block">
              {detailData?.type || selectedEntity?.type || 'Catalog'}
            </span>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight line-clamp-2">
              {decodeHTMLEntities(detailData?.title || selectedEntity?.title)}
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 font-medium line-clamp-2">
              {decodeHTMLEntities(detailData?.subtitle || detailData?.header_desc || selectedEntity?.subtitle)}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 font-semibold">
              {songList.length > 0 && <span>{songList.length} Tracks</span>}
              {detailData?.more_info?.fan_count && <span>• {detailData.more_info.fan_count} Fans</span>}
              {detailData?.year && <span>• Released {detailData.year}</span>}
            </div>

            {/* Header Action Buttons */}
            {songList.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={() => onPlayAllTracks(songList)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-105 transition"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Play All Tracks</span>
                </button>

                <button
                  onClick={() => onAddAllToQueue(songList)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Add All to Queue</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {detailLoading ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold">Loading catalog metadata & audio tracks...</p>
            </div>
          ) : (
            <>
              {/* Song Tracklist */}
              <div className="space-y-1.5">
                {songList.map((song, idx) => (
                  <TrackRow
                    key={song.id || idx}
                    song={song}
                    index={idx}
                    onPlay={() => onPlaySongFromList(songList, idx)}
                    onAddToQueue={onAddToQueue}
                    onOpenAddToPlaylist={onOpenAddToPlaylist}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={!!favoritesMap[song.id]}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    isResolvingAudio={isResolvingAudio}
                    upgradeImg={upgradeImg}
                    formatSeconds={formatSeconds}
                  />
                ))}
              </div>

              {/* Artist Pagination Load More */}
              {isArtist && (
                <div className="text-center pt-2">
                  <button
                    onClick={onLoadMoreArtistSongs}
                    disabled={artistMoreSongsLoading}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold rounded-xl text-slate-200 transition inline-flex items-center gap-2"
                  >
                    {artistMoreSongsLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
                    <span>Load More Artist Tracks</span>
                  </button>
                </div>
              )}

              {/* Recommended Similar Albums */}
              {relatedAlbums.length > 0 && (
                <div className="pt-6 border-t border-slate-800">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Recommended Similar Albums</span>
                  </h4>
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {relatedAlbums.map((alb) => (
                      <div
                        key={alb.id}
                        onClick={() => onOpenAnotherDetail(alb)}
                        className="w-32 shrink-0 glass-card p-2.5 rounded-2xl cursor-pointer transition hover:border-emerald-500/40"
                      >
                        <img
                          src={upgradeImg(alb.image)}
                          alt={alb.title}
                          className="w-full aspect-square rounded-xl object-cover mb-2 bg-slate-800"
                        />
                        <p className="text-xs font-bold truncate text-slate-200">
                          {decodeHTMLEntities(alb.title)}
                        </p>
                        <p className="text-[11px] truncate text-slate-400 mt-0.5">
                          {decodeHTMLEntities(alb.subtitle || alb.year)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
