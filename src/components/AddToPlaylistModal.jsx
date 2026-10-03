import React, { useState, useEffect } from 'react';
import { X, Plus, ListMusic, Check, Sparkles, CheckCircle2 } from 'lucide-react';
import { decodeHTMLEntities } from '../utils/formatters';

export default function AddToPlaylistModal({
  isOpen,
  onClose,
  song,
  targetSong,
  token,
  playlists = [],
  onPlaylistUpdated,
  onRefreshPlaylists,
  onToast
}) {
  if (!isOpen) return null;

  const songToUse = song || targetSong;
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(!songToUse);
  const [loadingId, setLoadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedPlaylistIds, setAddedPlaylistIds] = useState([]);
  const [lastAddedPlaylistName, setLastAddedPlaylistName] = useState('');

  useEffect(() => {
    setShowCreateInput(!songToUse);
    setNewPlaylistName('');
    setErrorMsg('');
    setAddedPlaylistIds([]);
    setLastAddedPlaylistName('');
  }, [isOpen, songToUse]);

  const notifyToast = (msg) => {
    if (onToast) onToast(msg);
  };

  const handleAddToPlaylist = async (playlistId, name = '') => {
    if (!token) {
      notifyToast('Please log in to create or manage playlists');
      return;
    }

    setLoadingId(playlistId || 'new');
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/playlists/add-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          playlistId,
          newPlaylistName: name,
          song: songToUse || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update playlist');

      const updatedPlaylist = data.playlist;
      const createdOrUpdatedName = updatedPlaylist?.name || name;

      if (onPlaylistUpdated) onPlaylistUpdated(updatedPlaylist);
      if (onRefreshPlaylists) onRefreshPlaylists();

      if (songToUse) {
        setLastAddedPlaylistName(createdOrUpdatedName);
        setAddedPlaylistIds((prev) => Array.from(new Set([...prev, updatedPlaylist._id])));
        notifyToast(`Added to "${createdOrUpdatedName}"!`);
        setShowCreateInput(false);
        setNewPlaylistName('');
      } else {
        notifyToast(`Created playlist "${createdOrUpdatedName}"!`);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message);
      notifyToast(`Error: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#0c1019] border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-100 divide-y divide-slate-800/80">
        {/* Header */}
        <div className="pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ListMusic className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-base font-black tracking-tight text-white truncate">
                {songToUse ? 'Add Song to Playlist' : 'Create Custom Playlist'}
              </h3>
              <p className="text-xs text-emerald-400 truncate">
                {songToUse ? decodeHTMLEntities(songToUse.title) : 'Create a new collection for your favorite music'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Playlists & Create Option */}
        <div className="py-4 space-y-3 max-h-80 overflow-y-auto no-scrollbar">
          {/* Error Alert */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Success Banner Prompting to Add to Another Playlist */}
          {lastAddedPlaylistName && songToUse && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex flex-col gap-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Added to "{lastAddedPlaylistName}"!</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Want to add this song to another playlist? Tap any playlist below or click <strong>Done</strong>.
              </p>
            </div>
          )}

          {songToUse && playlists.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Select Existing Playlist
              </span>
              {playlists.map((pl) => {
                const targetSongId = songToUse?.id || songToUse?.songId;
                const isAlreadyInPlaylist =
                  addedPlaylistIds.includes(pl._id) ||
                  (pl.songs && pl.songs.some((s) => (s.id || s.songId) === targetSongId));

                return (
                  <div
                    key={pl._id}
                    onClick={() => handleAddToPlaylist(pl._id)}
                    className={`flex items-center justify-between p-3 rounded-2xl transition cursor-pointer group ${
                      isAlreadyInPlaylist
                        ? 'bg-emerald-500/10 border border-emerald-500/40'
                        : 'bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 font-bold text-xs overflow-hidden">
                        {pl.coverImage ? (
                          <img src={pl.coverImage} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <ListMusic className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className={`text-xs sm:text-sm font-bold truncate ${
                          isAlreadyInPlaylist ? 'text-emerald-400' : 'text-slate-200 group-hover:text-emerald-300'
                        }`}>
                          {pl.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{pl.songs?.length || 0} Tracks</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {loadingId === pl._id ? (
                        <span className="text-xs text-emerald-400 font-bold">Adding...</span>
                      ) : isAlreadyInPlaylist ? (
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Added
                        </span>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center font-bold group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create New Playlist Input Form */}
          {!showCreateInput ? (
            <button
              onClick={() => setShowCreateInput(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs hover:bg-emerald-500/25 transition mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Playlist</span>
            </button>
          ) : (
            <div className="p-4 bg-slate-900/90 border border-emerald-500/30 rounded-2xl space-y-3">
              <label className="text-[11px] font-bold text-slate-300 block">Playlist Name *</label>
              <input
                type="text"
                required
                placeholder="My Chill Hits 2026..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <div className="flex justify-end gap-2 pt-1">
                {songToUse && (
                  <button
                    type="button"
                    onClick={() => setShowCreateInput(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAddToPlaylist(null, newPlaylistName)}
                  disabled={!newPlaylistName.trim() || loadingId === 'new'}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-xl text-xs hover:shadow-lg transition disabled:opacity-50"
                >
                  {loadingId === 'new' ? 'Creating...' : songToUse ? 'Create & Add Song' : 'Create Playlist'}
                </button>
              </div>
            </div>
          )}

          {/* Action Footer: Done Button if song added to at least one playlist */}
          {addedPlaylistIds.length > 0 && (
            <div className="pt-3 flex justify-end">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

