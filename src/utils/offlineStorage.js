// Local & Offline Audio Storage Utility
// Supports two complementary layers:
// 1. IndexedDB: 100% reliable in-browser storage of audio Blobs and metadata across all browsers and offline states.
// 2. File System Access API (showDirectoryPicker): Saves actual .mp3 files directly to a folder on the user's PC and fetches them back.

const DB_NAME = 'visa_music_offline_db';
const DB_VERSION = 1;
const STORE_TRACKS = 'offline_tracks';
const STORE_BLOBS = 'audio_blobs';
const STORE_SETTINGS = 'app_settings';

/**
 * Open or upgrade the offline IndexedDB database.
 */
export function openOfflineDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if the browser supports the File System Access API (showDirectoryPicker).
 */
export function isFolderPickerSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof window.showDirectoryPicker === 'function' &&
    window.isSecureContext !== false
  );
}

/**
 * Save a directory handle to IndexedDB for persistent access.
 */
export async function saveFolderHandleToDB(handle) {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      store.put({ key: 'music_folder_handle', handle, name: handle.name, savedAt: Date.now() });
      tx.oncomplete = () => {
        try {
          localStorage.setItem('visa_offline_folder_name', handle.name);
        } catch {}
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save folder handle to IndexedDB:', err);
    return false;
  }
}

/**
 * Retrieve the saved directory handle from IndexedDB.
 */
export async function getSavedFolderHandle() {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get('music_folder_handle');
      req.onsuccess = () => {
        resolve(req.result ? req.result.handle : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Verify or request permission on a directory handle.
 */
export async function verifyFolderPermission(dirHandle, requestIfPrompt = false, readWrite = true) {
  if (!dirHandle) return false;
  const opts = { mode: readWrite ? 'readwrite' : 'read' };
  try {
    const status = await dirHandle.queryPermission(opts);
    if (status === 'granted') return true;
    if (requestIfPrompt && (status === 'prompt' || status === 'denied')) {
      const reqStatus = await dirHandle.requestPermission(opts);
      return reqStatus === 'granted';
    }
    return false;
  } catch (err) {
    console.warn('Permission query failed:', err);
    return false;
  }
}

/**
 * Open native directory picker for user to select a music folder.
 */
export async function selectLocalMusicFolder() {
  if (!isFolderPickerSupported()) {
    throw new Error('Local folder selection is not supported in this browser. Browser offline storage is still active!');
  }

  const handle = await window.showDirectoryPicker({
    id: 'visa_music_local_library',
    mode: 'readwrite',
    startIn: 'music'
  });

  const hasPerm = await verifyFolderPermission(handle, true, true);
  if (!hasPerm) {
    throw new Error('Read/Write permission was not granted for the selected folder.');
  }

  await saveFolderHandleToDB(handle);
  return {
    handle,
    folderName: handle.name
  };
}

/**
 * Disconnect the currently configured local folder.
 */
export async function disconnectLocalFolder() {
  try {
    const db = await openOfflineDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      tx.objectStore(STORE_SETTINGS).delete('music_folder_handle');
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch {}

  try {
    localStorage.removeItem('visa_offline_folder_name');
  } catch {}
}

/**
 * Write an audio blob into a directory handle.
 */
export async function writeBlobToFolder(dirHandle, fileName, blob) {
  if (!dirHandle) return false;
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (err) {
    console.warn(`Failed writing "${fileName}" to local folder:`, err);
    return false;
  }
}

/**
 * Read a file directly from a directory handle.
 */
export async function readBlobFromFolder(dirHandle, fileName) {
  if (!dirHandle || !fileName) return null;
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
    return await fileHandle.getFile();
  } catch {
    return null;
  }
}

/**
 * Scan a directory handle for any audio files and return them as track items.
 */
export async function scanFolderForAudioFiles(dirHandle) {
  if (!dirHandle) return [];
  const songs = [];
  const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.opus'];

  try {
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind !== 'file') continue;
      const lowerName = name.toLowerCase();
      const isAudio = audioExtensions.some((ext) => lowerName.endsWith(ext));
      if (!isAudio) continue;

      try {
        const file = await handle.getFile();
        const baseName = name.replace(/\.[^/.]+$/, '');
        let title = baseName;
        let artist = 'Local File';

        // Check for "Title - Artist" or "Artist - Title" pattern
        if (baseName.includes(' - ')) {
          const parts = baseName.split(' - ');
          title = parts[0].trim();
          artist = parts.slice(1).join(' - ').trim();
        }

        const songId = `local_${encodeURIComponent(name)}`;
        const songData = {
          id: songId,
          title,
          subtitle: artist,
          fileName: name,
          fileSize: file.size,
          lastModified: file.lastModified,
          downloadedAt: new Date(file.lastModified).toISOString(),
          isLocalFile: true,
          isOfflineReady: true,
          duration: 0,
          image: '',
          more_info: {
            duration: 0,
            singers: artist,
            album: 'Local Folder'
          }
        };

        songs.push(songData);

        // Also cache metadata in IndexedDB
        await saveOfflineMetadata(songData);
      } catch (fileErr) {
        console.warn(`Could not read file ${name}:`, fileErr);
      }
    }
  } catch (err) {
    console.error('Failed to scan local folder:', err);
    throw err;
  }

  return songs;
}

/**
 * Save track metadata in IndexedDB.
 */
export async function saveOfflineMetadata(song) {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      store.put({
        ...song,
        isOfflineReady: true,
        updatedAt: Date.now()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save metadata in DB:', err);
    return false;
  }
}

/**
 * Save an audio song fully for offline use:
 * 1. Stores Blob in IndexedDB (guaranteed 100% offline playback on any device).
 * 2. Writes to selected local folder on PC (if configured and permitted).
 * 3. Saves track metadata in IndexedDB.
 */
export async function saveOfflineSong(song, audioBlob, chosenBitrate = '320', customFileName = null) {
  if (!song || (!song.id && !song.songId) || !audioBlob) {
    throw new Error('Song data and audio blob are required');
  }

  const cleanTitle = (song.title || 'Track')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const cleanArtist = (song.subtitle || song.more_info?.music || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const fileName = customFileName || (cleanArtist ? `${cleanTitle} - ${cleanArtist}.mp3` : `${cleanTitle}.mp3`);

  let savedToFolder = false;

  // 1. Attempt writing directly to user's selected PC folder
  try {
    const dirHandle = await getSavedFolderHandle();
    if (dirHandle) {
      const hasPerm = await verifyFolderPermission(dirHandle, false, true);
      if (hasPerm) {
        savedToFolder = await writeBlobToFolder(dirHandle, fileName, audioBlob);
      }
    }
  } catch (dirErr) {
    console.warn('Could not write to local folder directly:', dirErr);
  }

  // 2. Always save Blob & Metadata into IndexedDB for instant, bulletproof offline playback
  const db = await openOfflineDB();
  const primaryId = String(song.id || song.songId);

  await new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');

    const trackStore = tx.objectStore(STORE_TRACKS);
    const blobStore = tx.objectStore(STORE_BLOBS);

    const trackItem = {
      ...song,
      id: primaryId,
      fileName,
      bitrate: chosenBitrate,
      fileSize: audioBlob.size,
      downloadedAt: new Date().toISOString(),
      isOfflineReady: true,
      savedToFolder
    };

    trackStore.put(trackItem);

    const blobRecord = {
      id: primaryId,
      blob: audioBlob,
      mimeType: audioBlob.type || 'audio/mpeg',
      fileName,
      size: audioBlob.size,
      savedAt: Date.now()
    };
    blobStore.put(blobRecord);

    // Also store by alternative IDs (e.g. song.songId vs song.id or numeric id) to ensure instant retrieval
    if (song.songId && String(song.songId) !== primaryId) {
      blobStore.put({ ...blobRecord, id: String(song.songId) });
      trackStore.put({ ...trackItem, id: String(song.songId) });
    }
    if (song.id && String(song.id) !== primaryId) {
      blobStore.put({ ...blobRecord, id: String(song.id) });
    }
    if (!isNaN(Number(primaryId))) {
      blobStore.put({ ...blobRecord, id: Number(primaryId) });
    }

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });

  return {
    fileName,
    fileSize: audioBlob.size,
    savedToFolder
  };
}

/**
 * Fetch the audio blob for a song from offline storage:
 * Checks IndexedDB first across all possible song IDs and title matching,
 * then checks connected local folder.
 */
export async function getOfflineAudio(songId, song = null) {
  if (!songId && !song?.id && !song?.songId) return null;

  const candidateIds = new Set();
  const addCandidate = (val) => {
    if (val === null || val === undefined || val === '') return;
    candidateIds.add(String(val));
    if (!isNaN(Number(val))) candidateIds.add(Number(val));
  };

  addCandidate(songId);
  if (song) {
    addCandidate(song.id);
    addCandidate(song.songId);
    addCandidate(song._id);
    if (song.more_info?.id) addCandidate(song.more_info.id);
  }

  // 1. Check IndexedDB audio_blobs store for any candidate ID
  try {
    const db = await openOfflineDB();

    for (const cid of candidateIds) {
      const blobItem = await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_BLOBS, 'readonly');
          const req = tx.objectStore(STORE_BLOBS).get(cid);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });

      if (blobItem && blobItem.blob) {
        return {
          blob: blobItem.blob,
          fileName: blobItem.fileName,
          source: 'indexeddb'
        };
      }
    }

    // 2. Check IndexedDB tracks for matching title or candidate ID fallback
    const allTracks = await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_TRACKS, 'readonly');
        const req = tx.objectStore(STORE_TRACKS).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });

    const cleanTargetTitle = (song?.title || '')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    for (const track of allTracks) {
      const matchesCandidate =
        candidateIds.has(String(track.id)) ||
        (track.songId && candidateIds.has(String(track.songId))) ||
        (track._id && candidateIds.has(String(track._id)));

      const trackCleanTitle = (track.title || '')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      const matchesTitle =
        cleanTargetTitle &&
        trackCleanTitle &&
        (cleanTargetTitle === trackCleanTitle ||
          trackCleanTitle.includes(cleanTargetTitle) ||
          cleanTargetTitle.includes(trackCleanTitle));

      if (matchesCandidate || matchesTitle) {
        const blobItem = await new Promise((resolve) => {
          try {
            const tx = db.transaction(STORE_BLOBS, 'readonly');
            const req = tx.objectStore(STORE_BLOBS).get(track.id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
          } catch {
            resolve(null);
          }
        });

        if (blobItem && blobItem.blob) {
          return {
            blob: blobItem.blob,
            fileName: blobItem.fileName,
            source: 'indexeddb'
          };
        }
      }
    }
  } catch (idbErr) {
    console.warn('IndexedDB offline audio check failed:', idbErr);
  }

  // 3. Check connected local folder if available
  const cleanTitle = (song?.title || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const cleanArtist = (song?.subtitle || song?.more_info?.music || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const candidateFileNames = new Set();
  if (song?.fileName) candidateFileNames.add(song.fileName);
  for (const cid of candidateIds) {
    if (typeof cid === 'string' && cid.startsWith('local_')) {
      candidateFileNames.add(decodeURIComponent(cid.replace('local_', '')));
    }
  }
  if (cleanTitle) {
    if (cleanArtist) {
      candidateFileNames.add(`${cleanTitle} - ${cleanArtist}.mp3`);
      candidateFileNames.add(`${cleanTitle} - ${cleanArtist}.m4a`);
    }
    candidateFileNames.add(`${cleanTitle}.mp3`);
    candidateFileNames.add(`${cleanTitle}.m4a`);
  }

  if (candidateFileNames.size > 0) {
    try {
      const dirHandle = await getSavedFolderHandle();
      if (dirHandle) {
        const hasPerm = await verifyFolderPermission(dirHandle, false, false);
        if (hasPerm) {
          for (const fName of candidateFileNames) {
            const file = await readBlobFromFolder(dirHandle, fName);
            if (file) {
              // Cache in IndexedDB for subsequent lightning fast plays
              try {
                const db = await openOfflineDB();
                const tx = db.transaction(STORE_BLOBS, 'readwrite');
                const pId = String(songId || song?.id || song?.songId || fName);
                tx.objectStore(STORE_BLOBS).put({
                  id: pId,
                  blob: file,
                  mimeType: file.type || 'audio/mpeg',
                  fileName: fName,
                  size: file.size,
                  savedAt: Date.now()
                });
              } catch {}

              return {
                blob: file,
                fileName: file.name,
                source: 'folder'
              };
            }
          }
        }
      }
    } catch (folderErr) {
      console.warn('Local folder audio read failed:', folderErr);
    }
  }

  return null;
}

/**
 * Delete a song from offline storage.
 */
export async function deleteOfflineSong(songId, fileName = null) {
  if (!songId) return;

  try {
    const db = await openOfflineDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');
      tx.objectStore(STORE_TRACKS).delete(String(songId));
      tx.objectStore(STORE_BLOBS).delete(String(songId));
      if (!isNaN(Number(songId))) {
        tx.objectStore(STORE_TRACKS).delete(Number(songId));
        tx.objectStore(STORE_BLOBS).delete(Number(songId));
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to delete from IndexedDB:', err);
  }

  // Optionally delete from local folder if requested and configured
  if (fileName) {
    try {
      const dirHandle = await getSavedFolderHandle();
      if (dirHandle && (await verifyFolderPermission(dirHandle, false, true))) {
        await dirHandle.removeEntry(fileName);
      }
    } catch {}
  }
}

/**
 * Retrieve all offline tracks stored in IndexedDB.
 */
export async function getAllOfflineTracks() {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const req = tx.objectStore(STORE_TRACKS).getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        const map = {};
        for (const item of list) {
          if (item && item.id) map[item.id] = item;
        }
        resolve(map);
      };
      req.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

/**
 * Clear all offline stored tracks and blobs.
 */
export async function clearAllOfflineTracks() {
  try {
    const db = await openOfflineDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');
      tx.objectStore(STORE_TRACKS).clear();
      tx.objectStore(STORE_BLOBS).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed clearing offline DB:', err);
  }
}
