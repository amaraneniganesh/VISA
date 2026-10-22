import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  FolderCheck,
  HardDrive,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  Music2,
  Trash2
} from 'lucide-react';
import {
  isFolderPickerSupported,
  selectLocalMusicFolder,
  disconnectLocalFolder,
  scanFolderForAudioFiles,
  getSavedFolderHandle,
  verifyFolderPermission
} from '../utils/offlineStorage';

export default function LocalFolderModal({
  isOpen,
  onClose,
  folderName,
  onFolderConnected,
  onSongsFetched,
  isPromptMode = false,
  pendingSong = null,
  onConfirmSaveOffline
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rememberChoice, setRememberChoice] = useState(false);

  if (!isOpen) return null;

  const supported = isFolderPickerSupported();

  const handleSelectFolder = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { folderName: name, handle } = await selectLocalMusicFolder();
      setSuccessMsg(`Folder "${name}" connected successfully!`);
      if (onFolderConnected) {
        onFolderConnected(name, handle);
      }

      if (rememberChoice) {
        localStorage.setItem('visa_folder_choice_preference', 'folder');
      }

      if (isPromptMode && onConfirmSaveOffline) {
        setTimeout(() => {
          onConfirmSaveOffline(true);
          onClose();
        }, 600);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setErrorMsg(err.message || 'Failed to select folder');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanFolder = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const dirHandle = await getSavedFolderHandle();
      if (!dirHandle) {
        setErrorMsg('Please select a folder first.');
        return;
      }

      const hasPerm = await verifyFolderPermission(dirHandle, true, false);
      if (!hasPerm) {
        setErrorMsg('Permission needed to read files in this folder. Please grant access.');
        return;
      }

      const foundSongs = await scanFolderForAudioFiles(dirHandle);
      if (onSongsFetched) {
        onSongsFetched(foundSongs);
      }
      setSuccessMsg(`Found and synced ${foundSongs.length} local audio track(s)!`);
    } catch (err) {
      setErrorMsg(err.message || 'Error scanning folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectLocalFolder();
      if (onFolderConnected) {
        onFolderConnected(null, null);
      }
      setSuccessMsg('Local folder disconnected. Defaulting to browser storage.');
    } catch {
      setErrorMsg('Failed to disconnect folder');
    }
  };

  const handleUseBrowserOnly = () => {
    if (rememberChoice) {
      localStorage.setItem('visa_folder_choice_preference', 'browser');
    }
    if (isPromptMode && onConfirmSaveOffline) {
      onConfirmSaveOffline(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0a0f18] border border-cyan-500/30 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-100 overflow-hidden"
      >
        {/* Glow ambient decoration */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {isPromptMode ? 'Choose Save Destination' : 'Local Folder & Offline Storage'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isPromptMode
                  ? 'Select how you want to save downloaded songs'
                  : 'Save songs directly to your PC and fetch them offline'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Browser Support Check */}
        {!supported && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <HelpCircle className="w-4 h-4" />
              <span>Native Folder Access Notice</span>
            </div>
            <p className="text-slate-300">
              Your browser does not support the File System Access folder picker (best on Chrome, Edge, Brave).
              <br />
              <strong className="text-emerald-400">Don't worry!</strong> Browser Offline Storage (IndexedDB) is fully active and saves all songs with complete offline playback support.
            </p>
          </div>
        )}

        {/* Target Song Info in Prompt Mode */}
        {isPromptMode && pendingSong && (
          <div className="mb-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <Music2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-bold text-slate-200 truncate">{pendingSong.title}</p>
              <p className="text-slate-400 truncate text-[11px]">{pendingSong.subtitle || 'Audio Track'}</p>
            </div>
          </div>
        )}

        {/* Status of Connected Folder */}
        {folderName ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <FolderCheck className="w-4 h-4" /> Connected Music Folder
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Ready
                </span>
              </div>
              <p className="text-sm font-black text-white flex items-center gap-2 truncate">
                <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{folderName}</span>
              </p>
              <p className="text-xs text-slate-400">
                Downloaded tracks are saved directly to this folder as high-fidelity MP3 files and can be fetched anytime offline.
              </p>
            </div>

            {/* Folder Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleScanFolder}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Scan & Fetch Songs</span>
              </button>

              <button
                onClick={handleSelectFolder}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold transition"
              >
                <FolderPlus className="w-3.5 h-3.5 text-slate-400" />
                <span>Change Folder</span>
              </button>
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Disconnect Folder</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>Direct PC Folder Storage</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect a local folder on your computer (e.g. <code>D:\Music</code> or <code>C:\Users\...\Music</code>).
                All songs you download will be saved directly into that folder, and you can play them in offline mode with zero internet.
              </p>
            </div>

            {supported && (
              <button
                onClick={handleSelectFolder}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-sm font-black transition shadow-lg shadow-cyan-500/25 active:scale-98"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{loading ? 'Opening Folder Picker…' : 'Select Local Music Folder'}</span>
              </button>
            )}

            <button
              onClick={handleUseBrowserOnly}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 text-xs font-bold transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{isPromptMode ? 'Save to Browser Cache & Downloads' : 'Use Browser Offline Storage Only'}</span>
            </button>
          </div>
        )}

        {/* Remember choice toggle */}
        {isPromptMode && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <input
              type="checkbox"
              id="remember_folder_choice"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="rounded accent-cyan-500 text-cyan-500 w-3.5 h-3.5"
            />
            <label htmlFor="remember_folder_choice" className="text-xs text-slate-400 select-none cursor-pointer">
              Remember my choice for future downloads
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
