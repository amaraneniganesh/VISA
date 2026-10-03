import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import HeroBanner from './components/HeroBanner';
import TrackCard from './components/TrackCard';
import TrackRow from './components/TrackRow';
import PlayerBar from './components/PlayerBar';
import ExpandedPlayer from './components/ExpandedPlayer';
import QueueDrawer from './components/QueueDrawer';
import DetailModal from './components/DetailModal';
import SortControls from './components/SortControls';
import DevicePickerModal from './components/DevicePickerModal';

// Authentication & Feature Modals
import AuthModal from './components/AuthModal';
import LimitReachedModal from './components/LimitReachedModal';
import UserProfileModal from './components/UserProfileModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import AdminPortalModal from './components/AdminPortalModal';

import { SectionSkeleton, GridSkeleton } from './components/SkeletonLoader';
import ToastNotification from './components/ToastNotification';
import { decodeHTMLEntities, formatSeconds, upgradeImg } from './utils/formatters';

import {
  Calendar,
  Users,
  Music2,
  Layers,
  Heart,
  ListMusic,
  History,
  Plus,
  Play,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';

const API_BASE = ' https://visa-server-7qzv.onrender.com/api';

const ALL_LANGUAGES = [
  'telugu',
  'hindi',
  'tamil',
  'punjabi',
  'malayalam',
  'kannada',
  'english',
  'bhojpuri',
  'bengali',
  'marathi'
];

const YEARS = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => String(2026 - i));

const GENRE_TAGS = [
  'Tollywood Hits',
  'Bollywood Beats',
  'Lo-Fi Chill',
  'Melodic Acoustic',
  'EDM Party Pulse',
  'Mass Chartbusters',
  'Romantic Duets',
  'Classics'
];

function sortItems(list = [], option = 'default') {
  const cleanList = (Array.isArray(list) ? list : []).filter(
    (item) => item && typeof item === 'object' && (item.id || item.title)
  );
  if (cleanList.length === 0 || option === 'default') return cleanList;
  const arr = [...cleanList];
  if (option === 'title-asc') {
    return arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }
  if (option === 'title-desc') {
    return arr.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
  }
  if (option === 'year-desc') {
    return arr.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
  }
  if (option === 'duration-desc') {
    return arr.sort((a, b) => Number(b.more_info?.duration || 0) - Number(a.more_info?.duration || 0));
  }
  return arr;
}

export default function App() {
  // ----------------------------------------------------
  // User Authentication & Profile State
  // ----------------------------------------------------
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('visa_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('visa_token') || null;
  });

  // Modal Dialog States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // User Playlists & History DB State
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [listeningHistory, setListeningHistory] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  // Selected Playlist for viewing detail view
  const [selectedPlaylistDetail, setSelectedPlaylistDetail] = useState(null);

  // ----------------------------------------------------
  // Unauthenticated Guest Daily Playback Timer (15 mins = 900s)
  // ----------------------------------------------------
  const [guestTimeSpent, setGuestTimeSpent] = useState(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('visa_guest_date');
      if (savedDate !== todayStr) {
        localStorage.setItem('visa_guest_date', todayStr);
        localStorage.setItem('visa_guest_time', '0');
        return 0;
      }
      return parseInt(localStorage.getItem('visa_guest_time') || '0', 10);
    } catch {
      return 0;
    }
  });

  // Save user & token to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('visa_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('visa_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('visa_token', token);
    } else {
      localStorage.removeItem('visa_token');
    }
  }, [token]);

  // Sync user state with preferred languages on login
  useEffect(() => {
    if (user && user.preferredLanguages && user.preferredLanguages.length > 0) {
      setSelectedLanguages(user.preferredLanguages);
    }
  }, [user]);

  // Load User Data (Likes, Playlists, History) on Token Change
  useEffect(() => {
    if (!token) {
      setUserPlaylists([]);
      setListeningHistory([]);
      setSearchHistory([]);
      return;
    }
    fetchUserData();
  }, [token]);

  const fetchUserData = async () => {
    if (!token) return;
    try {
      // 1. Fetch Likes
      const likesRes = await fetch(`${API_BASE}/likes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (likesRes.ok) {
        const likesData = await likesRes.json();
        const map = {};
        likesData.forEach((item) => {
          map[item.songId] = item.songData || {
            id: item.songId,
            songId: item.songId,
            title: item.title,
            subtitle: item.subtitle,
            image: item.image,
            perma_url: item.perma_url,
            language: item.language,
            year: item.year,
            explicit_content: item.explicit_content,
            more_info: item.more_info || {}
          };
        });
        setFavorites(map);
      }

      // 2. Fetch Playlists
      const playlistsRes = await fetch(`${API_BASE}/playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (playlistsRes.ok) {
        const playlistsData = await playlistsRes.json();
        setUserPlaylists(playlistsData);
      }

      // 3. Fetch Listening History
      const listeningRes = await fetch(`${API_BASE}/history/listening`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listeningRes.ok) {
        const historyData = await listeningRes.json();
        setListeningHistory(historyData);
      }

      // 4. Fetch Search History
      const searchRes = await fetch(`${API_BASE}/history/search`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        setSearchHistory(searchData);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // ----------------------------------------------------
  // Languages State
  // ----------------------------------------------------
  const [selectedLanguages, setSelectedLanguages] = useState(() => {
    try {
      const saved = localStorage.getItem('visa_player_languages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return ['telugu', 'hindi'];
  });

  useEffect(() => {
    try {
      localStorage.setItem('visa_player_languages', JSON.stringify(selectedLanguages));
    } catch (err) {
      console.error(err);
    }
  }, [selectedLanguages]);

  // Main Tab State: 'home' | 'years' | 'artists' | 'search' | 'library' | 'playlists' | 'history'
  const [activeTab, setActiveTab] = useState('home');
  const [sections, setSections] = useState([]);
  const [artists, setArtists] = useState([]);

  // Year Explorer
  const [selectedYear, setSelectedYear] = useState('2024');
  const [yearAlbums, setYearAlbums] = useState([]);

  // Sort State
  const [sortOption, setSortOption] = useState('default');

  // Search & Live Autocomplete Suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ songs: [], albums: [], playlists: [], artists: [] });
  const [autoSuggestions, setAutoSuggestions] = useState({ songs: [], albums: [], artists: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  // Detail Modal State
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [relatedAlbums, setRelatedAlbums] = useState([]);
  const [artistMoreSongsLoading, setArtistMoreSongsLoading] = useState(false);

  // Footer Details State
  const [footerDetails, setFooterDetails] = useState({ artists: [], actors: [], albums: [], playlists: [] });

  // Queue State
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Artist Recommendations State
  const [recommendations, setRecommendations] = useState([]);

  // Playback Control State
  const [bitrate, setBitrate] = useState('160');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResolvingAudio, setIsResolvingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');

  // Expanded Fullscreen Studio View
  const [isExpandedStudio, setIsExpandedStudio] = useState(false);
  const [studioInitialTab, setStudioInitialTab] = useState('studio');

  const handleExpandStudio = (tab = 'studio') => {
    setStudioInitialTab(typeof tab === 'string' ? tab : 'studio');
    setIsExpandedStudio(true);
  };

  // Device Picker Modal State
  const [isDevicePickerOpen, setIsDevicePickerOpen] = useState(false);
  const [spotlightCategory, setSpotlightCategory] = useState('artists');
  const [spotlightLang, setSpotlightLang] = useState('all');
  const [activeDevice, setActiveDevice] = useState({
    id: 'default',
    name: 'PC Speakers (System Default)',
    type: 'computer'
  });
  const [audioDevices, setAudioDevices] = useState([]);

  // Load and parse system audio output devices
  const loadAudioDevices = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');

      const parsedOutputs = audioOutputs.map((d, index) => {
        const rawLabel = d.label ? d.label.trim() : '';
        const lowerLabel = rawLabel.toLowerCase();

        let type = 'computer';
        if (
          lowerLabel.includes('headphone') ||
          lowerLabel.includes('buds') ||
          lowerLabel.includes('airpods') ||
          lowerLabel.includes('bluetooth') ||
          lowerLabel.includes('wireless') ||
          lowerLabel.includes('headset')
        ) {
          type = 'headphones';
        } else if (
          lowerLabel.includes('speaker') ||
          lowerLabel.includes('realtek') ||
          lowerLabel.includes('soundbar') ||
          lowerLabel.includes('audio') ||
          lowerLabel.includes('hifi')
        ) {
          type = 'speaker';
        } else if (
          lowerLabel.includes('tv') ||
          lowerLabel.includes('hdmi') ||
          lowerLabel.includes('display') ||
          lowerLabel.includes('chromecast')
        ) {
          type = 'tv';
        }

        let name = rawLabel;
        if (!name) {
          if (d.deviceId === 'default') name = 'PC Speakers (System Default)';
          else if (d.deviceId === 'communications') name = 'Communications Speaker';
          else name = `Audio Output Device ${index + 1}`;
        }

        return {
          id: d.deviceId || `device_${index}`,
          sinkId: d.deviceId,
          name,
          type,
          desc: d.deviceId === 'default' ? 'Primary PC System Output' : 'Detected Audio Hardware'
        };
      });

      if (parsedOutputs.length > 0) {
        setAudioDevices(parsedOutputs);
      }
    } catch (err) {
      console.log('Device enumeration error:', err);
    }
  };

  const handleRequestDevicePermission = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        await loadAudioDevices();
        showToast('Unlocked full system & bluetooth device labels!');
      }
    } catch (err) {
      console.log('Permission request denied/ignored:', err);
      showToast('Unlocked preset device outputs!');
    }
  };

  useEffect(() => {
    loadAudioDevices();
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', loadAudioDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', loadAudioDevices);
      };
    }
  }, []);

  // Favorites Local State
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('pulse_favorites');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Toast Alerts State
  const [toastMessage, setToastMessage] = useState('');

  const audioRef = useRef(new Audio());
  const searchContainerRef = useRef(null);

  const languagesQuery = selectedLanguages.join(',');
  const primaryLanguage = selectedLanguages[0] || 'telugu';

  // Save Local Favorites to LocalStorage for fallback
  useEffect(() => {
    try {
      localStorage.setItem('pulse_favorites', JSON.stringify(favorites));
    } catch (err) {
      console.error(err);
    }
  }, [favorites]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ----------------------------------------------------
  // Guest Playback Interval Timer (900 seconds limit)
  // ----------------------------------------------------
  useEffect(() => {
    let interval = null;
    if (isPlaying && !user) {
      interval = setInterval(() => {
        setGuestTimeSpent((prev) => {
          const next = prev + 1;
          try {
            localStorage.setItem('visa_guest_time', String(next));
          } catch { }

          if (next >= 900) {
            audioRef.current.pause();
            setIsPlaying(false);
            setIsLimitModalOpen(true);
            showToast('Guest 15-minute playback limit reached!');
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, user]);

  const handleSelectDevice = (device) => {
    setActiveDevice(device);
    if (audioRef.current && typeof audioRef.current.setSinkId === 'function' && device.sinkId) {
      audioRef.current
        .setSinkId(device.sinkId)
        .then(() => {
          showToast(`Playing on ${device.name}`);
        })
        .catch((err) => {
          console.warn('Could not set sink ID:', err);
          showToast(`Selected ${device.name}`);
        });
    } else {
      showToast(`Connected to ${device.name}`);
    }
  };

  // Audio Event Listeners & Queue Auto-advance
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      handleTrackEnded();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queue, queueIndex, repeatMode, isShuffle]);

  // Handle Track Ended Queue Flow
  const handleTrackEnded = () => {
    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    } else if (queue.length > 0) {
      let nextIdx = queueIndex + 1;
      if (isShuffle) {
        nextIdx = Math.floor(Math.random() * queue.length);
      }
      if (nextIdx < queue.length) {
        setQueueIndex(nextIdx);
        handlePlayFullSong(queue[nextIdx]);
      } else if (repeatMode === 'all') {
        setQueueIndex(0);
        handlePlayFullSong(queue[0]);
      }
    }
  };

  // Fetch Footer Details (Multi-Language)
  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const res = await fetch(`${API_BASE}/footer-details?languages=${encodeURIComponent(languagesQuery)}`);
        if (!res.ok) return;
        const data = await res.json();
        setFooterDetails(data);
      } catch (err) {
        console.error('Error fetching footer details:', err);
      }
    };
    fetchFooter();
  }, [languagesQuery]);

  // Fetch Artist Recommendations for Current Track
  const fetchArtistRecommendations = async (song) => {
    if (!song || !song.id) {
      setRecommendations([]);
      return;
    }

    const artistMap = song.more_info?.artistMap;
    const extractedIds = [
      ...(artistMap?.primary_artists || []),
      ...(artistMap?.artists || []),
      ...(artistMap?.featured_artists || [])
    ]
      .map((a) => a?.id)
      .filter(Boolean);

    if (extractedIds.length === 0 && song.more_info?.primary_artists_id) {
      const splitIds = song.more_info.primary_artists_id
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      extractedIds.push(...splitIds);
    }

    const uniqueIds = Array.from(new Set(extractedIds)).join(',');

    if (!uniqueIds) {
      setRecommendations([]);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/artist-other-songs?artist_ids=${encodeURIComponent(uniqueIds)}&song_id=${encodeURIComponent(song.id)}&languages=${encodeURIComponent(languagesQuery)}`
      );
      const data = await res.json();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching artist suggestions:', err);
      setRecommendations([]);
    }
  };

  // Fetch Catalog Data
  useEffect(() => {
    if (activeTab === 'search' || activeTab === 'library' || activeTab === 'playlists' || activeTab === 'history') return;
    fetchData();
  }, [activeTab, languagesQuery, selectedYear]);

  // Click Outside for Search Suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Autocomplete Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setAutoSuggestions({ songs: [], albums: [], artists: [] });
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(searchQuery)}&languages=${encodeURIComponent(languagesQuery)}`);
        const data = await res.json();
        setAutoSuggestions({
          songs: (data.songs || []).slice(0, 5),
          albums: (data.albums || []).slice(0, 3),
          artists: (data.artists || []).slice(0, 3)
        });
        setShowSuggestions(true);
      } catch {
        setAutoSuggestions({ songs: [], albums: [], artists: [] });
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery, languagesQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'home') {
        const res = await fetch(`${API_BASE}/launch-sections?languages=${encodeURIComponent(languagesQuery)}`);
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
      } else if (activeTab === 'artists') {
        const res = await fetch(`${API_BASE}/artists?languages=${encodeURIComponent(languagesQuery)}`);
        const data = await res.json();
        setArtists(Array.isArray(data) ? data : []);
      } else if (activeTab === 'years') {
        const res = await fetch(`${API_BASE}/top-albums-year?year=${selectedYear}&language=${primaryLanguage}`);
        const data = await res.json();
        setYearAlbums(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async (e, customQuery) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery || searchQuery;
    if (!queryToUse.trim()) return;

    if (customQuery) setSearchQuery(customQuery);
    setShowSuggestions(false);
    setSearchLoading(true);
    setActiveTab('search');

    // Record Search History if Logged In
    if (token) {
      try {
        await fetch(`${API_BASE}/history/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ query: queryToUse })
        });
        setSearchHistory((prev) => Array.from(new Set([queryToUse, ...prev])));
      } catch { }
    }

    try {
      const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(queryToUse)}&languages=${encodeURIComponent(languagesQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearchHistory = async () => {
    if (!token) {
      setSearchHistory([]);
      return;
    }
    try {
      await fetch(`${API_BASE}/history/search`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchHistory([]);
      showToast('Cleared search history');
    } catch (err) {
      showToast('Failed to clear search history');
    }
  };

  const toggleLanguage = (lang) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== lang);
      } else {
        return [...prev, lang];
      }
    });
  };

  const handleCardClick = (item) => {
    setShowSuggestions(false);
    if (item.type === 'song') {
      handlePlayFullSong(item);
    } else {
      openDetails(item);
    }
  };

  const openDetails = async (item) => {
    setSelectedEntity(item);
    setDetailData(null);
    setRelatedAlbums([]);
    setDetailLoading(true);

    try {
      let query = '';
      const cleanToken = item.token ? item.token.replace(/\?.*$/, '') : '';

      if (item.type === 'playlist') {
        query = cleanToken
          ? `token=${encodeURIComponent(cleanToken)}&type=playlist&languages=${encodeURIComponent(languagesQuery)}`
          : `listid=${encodeURIComponent(item.listid || item.id)}&type=playlist&languages=${encodeURIComponent(languagesQuery)}`;
      } else if (item.type === 'artist') {
        query = `token=${encodeURIComponent(cleanToken)}&type=artist&n_song=50&n_album=50&languages=${encodeURIComponent(languagesQuery)}`;
      } else {
        query = `token=${encodeURIComponent(cleanToken)}&type=album&languages=${encodeURIComponent(languagesQuery)}`;
      }

      const res = await fetch(`${API_BASE}/details?${query}`);
      const data = await res.json();
      setDetailData(data);

      if (item.type === 'album' && (data.id || item.id)) {
        fetchAlbumRecommendations(data.id || item.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchAlbumRecommendations = async (albumId) => {
    try {
      const res = await fetch(`${API_BASE}/album-recommendations?albumid=${encodeURIComponent(albumId)}&languages=${encodeURIComponent(languagesQuery)}`);
      const recos = await res.json();
      setRelatedAlbums(Array.isArray(recos) ? recos : []);
    } catch {
      setRelatedAlbums([]);
    }
  };

  const handleLoadMoreArtistSongs = async () => {
    const artistId = detailData?.artistId || detailData?.id;
    if (!artistId) return;

    setArtistMoreSongsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/artist-more-songs?artistId=${encodeURIComponent(artistId)}&page=1&languages=${encodeURIComponent(languagesQuery)}`);
      const moreTracks = await res.json();

      if (Array.isArray(moreTracks) && moreTracks.length > 0) {
        setDetailData((prev) => {
          const currentList = prev.topSongs || prev.list || [];
          const existingIds = new Set(currentList.map((s) => s.id));
          const additions = moreTracks.filter((s) => !existingIds.has(s.id));

          return {
            ...prev,
            topSongs: [...currentList, ...additions],
            list: [...currentList, ...additions]
          };
        });
        showToast('Loaded more artist tracks');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setArtistMoreSongsLoading(false);
    }
  };

  // Play Audio Track via Direct Stream Proxy
  const handlePlayFullSong = async (song, chosenBitrate = bitrate) => {
    // Check Guest Limit (15 min = 900 seconds)
    if (!user && guestTimeSpent >= 900) {
      setIsLimitModalOpen(true);
      showToast('15-minute daily guest playback limit reached! Please Log In or Register.');
      return;
    }

    if (currentTrack?.id === song.id && chosenBitrate === bitrate) {
      togglePlayPause();
      return;
    }

    const previousTime = currentTrack?.id === song.id ? audioRef.current.currentTime : 0;
    setIsResolvingAudio(true);

    try {
      let encryptedUrl = song.more_info?.encrypted_media_url;
      let songPid = song.id;
      let songDetails = song;

      if (!encryptedUrl) {
        const queryParam = songPid ? `pids=${encodeURIComponent(songPid)}` : `token=${encodeURIComponent(song.token)}&type=song`;
        const detailRes = await fetch(`${API_BASE}/details?${queryParam}&languages=${encodeURIComponent(languagesQuery)}`);
        const fullSong = await detailRes.json();

        if (fullSong && fullSong.more_info) {
          encryptedUrl = fullSong.more_info.encrypted_media_url;
          songPid = fullSong.id || songPid;
          songDetails = { ...song, ...fullSong };
        }
      }

      const params = new URLSearchParams({
        encryptedUrl: encryptedUrl ? encodeURIComponent(encryptedUrl) : '',
        pid: songPid || '',
        id: songPid || song.id || '',
        token: song.token || '',
        bitrate: chosenBitrate,
        languages: languagesQuery
      });

      const res = await fetch(`${API_BASE}/song-stream?${params.toString()}`);
      const data = await res.json();

      if (data.stream_url) {
        audioRef.current.src = data.stream_url;
        audioRef.current.currentTime = previousTime;
        await audioRef.current.play();
        setCurrentTrack(songDetails);
        setIsPlaying(true);

        // Fetch Recommendations by Artist
        fetchArtistRecommendations(songDetails);

        // Ensure track is present in queue
        addToQueueIfNotPresent(songDetails);

        // Record Listening History & Backend Database Analytics if Logged In
        if (token) {
          try {
            await fetch(`${API_BASE}/history/listening`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ song: songDetails })
            });

            // Database Analytics Logging
            await fetch(`${API_BASE}/analytics/listen`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                song: songDetails,
                durationListened: songDetails.duration || songDetails.more_info?.duration || 180
              })
            });

            setListeningHistory((prev) => [
              songDetails,
              ...prev.filter((item) => (item.id || item._id) !== songDetails.id)
            ]);
          } catch { }
        }
      } else {
        showToast('Unable to resolve audio stream for track');
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      showToast('Audio resolution failed');
    } finally {
      setIsResolvingAudio(false);
    }
  };

  // Play Song From Container List
  const handlePlaySongFromList = (trackList, index) => {
    if (!trackList || trackList.length === 0 || !trackList[index]) return;
    setQueue(trackList);
    setQueueIndex(index);
    handlePlayFullSong(trackList[index]);
    showToast(`Playing "${decodeHTMLEntities(trackList[index].title)}" • Loaded ${trackList.length} tracks into queue`);
  };

  // Queue Operations
  const addToQueueIfNotPresent = (track) => {
    setQueue((prev) => {
      const existsIdx = prev.findIndex((item) => item.id === track.id);
      if (existsIdx >= 0) {
        setQueueIndex(existsIdx);
        return prev;
      } else {
        const updated = [...prev, track];
        setQueueIndex(updated.length - 1);
        return updated;
      }
    });
  };

  const handleAddToQueue = (track) => {
    setQueue((prev) => {
      if (prev.some((item) => item.id === track.id)) {
        showToast(`"${decodeHTMLEntities(track.title)}" is already in queue`);
        return prev;
      }
      showToast(`Added "${decodeHTMLEntities(track.title)}" to queue`);
      return [...prev, track];
    });
  };

  const handlePlayAllTracks = (trackList) => {
    if (!trackList || trackList.length === 0) return;
    setQueue(trackList);
    setQueueIndex(0);
    handlePlayFullSong(trackList[0]);
    showToast(`Loaded ${trackList.length} tracks into queue`);
  };

  const handleAddAllToQueue = (trackList) => {
    if (!trackList || trackList.length === 0) return;
    setQueue((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const additions = trackList.filter((t) => !existingIds.has(t.id));
      showToast(`Added ${additions.length} tracks to queue`);
      return [...prev, ...additions];
    });
  };

  const handleRemoveFromQueue = (index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
    showToast('Removed track from queue');
  };

  const handleClearQueue = () => {
    setQueue(currentTrack ? [currentTrack] : []);
    setQueueIndex(0);
    showToast('Cleared playback queue');
  };

  const handlePlayQueueTrack = (index) => {
    if (queue[index]) {
      setQueueIndex(index);
      handlePlayFullSong(queue[index]);
    }
  };

  // Track Prev / Next
  const handleNextTrack = () => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    }
    if (nextIdx < queue.length) {
      setQueueIndex(nextIdx);
      handlePlayFullSong(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      handlePlayFullSong(queue[0]);
    }
  };

  const handlePrevTrack = () => {
    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx >= 0) {
      setQueueIndex(prevIdx);
      handlePlayFullSong(queue[prevIdx]);
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!user && guestTimeSpent >= 900) {
        setIsLimitModalOpen(true);
        showToast('Guest limit reached. Please log in.');
        return;
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const target = Number(e.target.value);
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleSkipForward = () => {
    const nextTime = Math.min((audioRef.current.currentTime || 0) + 10, duration);
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleSkipBackward = () => {
    const prevTime = Math.max((audioRef.current.currentTime || 0) - 10, 0);
    audioRef.current.currentTime = prevTime;
    setCurrentTime(prevTime);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    audioRef.current.volume = newVol;
    if (newVol > 0 && isMuted) setIsMuted(false);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleBitrateChange = (newRate) => {
    setBitrate(newRate);
    showToast(`Bitrate set to ${newRate}kbps HD`);
    if (currentTrack) {
      handlePlayFullSong(currentTrack, newRate);
    }
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
    showToast(!isShuffle ? 'Shuffle mode ON' : 'Shuffle mode OFF');
  };

  const toggleRepeatMode = () => {
    const modes = ['off', 'all', 'one'];
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
    showToast(`Repeat mode: ${next.toUpperCase()}`);
  };

  // Toggle Heart / Favorite (Database Synced)
  const toggleFavorite = async (track) => {
    if (!track || !track.id) return;
    const isCurrentlyLiked = !!favorites[track.id];

    // Optimistic UI Update
    setFavorites((prev) => {
      const copy = { ...prev };
      if (isCurrentlyLiked) {
        delete copy[track.id];
      } else {
        copy[track.id] = track;
      }
      return copy;
    });

    if (token) {
      try {
        const res = await fetch(`${API_BASE}/likes/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ song: track })
        });
        const data = await res.json();
        showToast(data.message);
      } catch (err) {
        showToast('Error syncing like with database');
      }
    } else {
      showToast(
        isCurrentlyLiked
          ? `Removed "${decodeHTMLEntities(track.title)}" from favorites`
          : `Liked "${decodeHTMLEntities(track.title)}"! Log in to sync across devices.`
      );
    }
  };

  // Delete Custom Playlist
  const handleDeletePlaylist = async (playlistId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUserPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
        if (selectedPlaylistDetail?._id === playlistId) {
          setSelectedPlaylistDetail(null);
        }
        showToast('Playlist deleted successfully');
      }
    } catch {
      showToast('Failed to delete playlist');
    }
  };

  // Remove Track from Custom Playlist
  const handleRemoveTrackFromPlaylist = async (playlistId, songId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setUserPlaylists((prev) => prev.map((p) => (p._id === playlistId ? updated : p)));
        if (selectedPlaylistDetail?._id === playlistId) {
          setSelectedPlaylistDetail(updated);
        }
        showToast('Removed track from playlist');
      }
    } catch {
      showToast('Failed to remove track from playlist');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('visa_user');
    localStorage.removeItem('visa_token');
    showToast('Logged out successfully');
  };

  // Collect All Featured Trending Items for Hero Slider
  const trendingList =
    sections.flatMap((sec) => sec.items || []).filter((i) => i && i.title).slice(0, 10);

  const likedTracksList = Object.values(favorites).filter(
    (item) => item && typeof item === 'object' && (item.id || item.title)
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black flex">
      {/* Toast Alert */}
      <ToastNotification message={toastMessage} />

      {/* Left Sidebar Navigation (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        likedSongsCount={likedTracksList.length}
        userPlaylistsCount={userPlaylists.length}
        queueCount={queue.length}
        onOpenQueue={() => setIsQueueOpen(true)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        footerDetails={footerDetails}
        primaryLanguage={primaryLanguage}
        selectedLanguages={selectedLanguages}
        openDetails={openDetails}
        user={user}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-36">
        {/* Sticky Glass Navbar */}
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearchSubmit={handleSearchSubmit}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          autoSuggestions={autoSuggestions}
          handleCardClick={handleCardClick}
          searchContainerRef={searchContainerRef}
          selectedLanguages={selectedLanguages}
          toggleLanguage={toggleLanguage}
          ALL_LANGUAGES={ALL_LANGUAGES}
          upgradeImg={upgradeImg}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          footerDetails={footerDetails}
          openDetails={openDetails}
          primaryLanguage={primaryLanguage}
          user={user}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          searchHistory={searchHistory}
          onClearSearchHistory={handleClearSearchHistory}
          guestTimeSpent={guestTimeSpent}
        />

        {/* Content Body */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex-1">
          {loading ? (
            <div className="space-y-8">
              <SectionSkeleton />
              <SectionSkeleton />
            </div>
          ) : activeTab === 'home' ? (
            <div>
              {/* Automated Hero Carousel Slider */}
              <HeroBanner
                featuredItems={trendingList}
                onPlay={handleCardClick}
                onAddToQueue={handleAddToQueue}
                isPlaying={isPlaying}
                currentTrack={currentTrack}
                upgradeImg={upgradeImg}
              />

              {/* Dynamic Sections Grid */}
              {sections.map((section) => {
                const sectionSongs = section.items.filter((i) => i.type === 'song');
                const sortedItems = sortItems(section.items, sortOption);

                return (
                  <div key={section.key} className="mb-12">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                      <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5">
                        <span>{section.title}</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                          {section.items.length} Items
                        </span>
                      </h3>
                    </div>

                    <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
                      {sortedItems.map((item) => (
                        <div key={item.id || item.token} className="w-44 shrink-0">
                          <TrackCard
                            item={item}
                            onCardClick={handleCardClick}
                            onPlaySong={(songItem) => {
                              if (sectionSongs.length > 0) {
                                const idx = sectionSongs.findIndex((s) => s.id === songItem.id);
                                handlePlaySongFromList(sectionSongs, idx >= 0 ? idx : 0);
                              } else {
                                handlePlayFullSong(songItem);
                              }
                            }}
                            onAddToQueue={handleAddToQueue}
                            onToggleFavorite={toggleFavorite}
                            isFavorite={!!favorites[item.id]}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            isResolvingAudio={isResolvingAudio}
                            upgradeImg={upgradeImg}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === 'spotlight' || activeTab === 'artists' ? (
            <div>
              {/* Spotlight Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
                    <Sparkles className="w-7 h-7 text-cyan-400" />
                    <span>Regional Spotlight Hub</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Explore top regional artists, actors, albums, and playlists across all languages
                  </p>
                </div>

                {/* Language Selector Pills */}
                {footerDetails?.byLanguage && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {[{ language: 'all' }, ...footerDetails.byLanguage].map((entry) => {
                      const langCode = entry.language.toLowerCase();
                      const isSel = spotlightLang.toLowerCase() === langCode;
                      return (
                        <button
                          key={langCode}
                          onClick={() => setSpotlightLang(langCode)}
                          className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase transition shrink-0 ${isSel
                              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                          {langCode === 'all' ? 'All Languages' : langCode}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Category Selector Tabs */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                {[
                  { id: 'artists', label: 'Artists', icon: Users },
                  { id: 'actors', label: 'Actors', icon: Film },
                  { id: 'albums', label: 'Albums', icon: Disc },
                  { id: 'playlists', label: 'Playlists', icon: Radio }
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isSel = spotlightCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSpotlightCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${isSel
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Grid View of Spotlight Items */}
              {(() => {
                const source =
                  spotlightLang === 'all'
                    ? footerDetails?.all || footerDetails
                    : footerDetails?.byLanguage?.find(
                      (e) => e.language.toLowerCase() === spotlightLang.toLowerCase()
                    ) || footerDetails?.all;

                const rawItems = source ? source[spotlightCategory] || [] : [];
                const items = sortItems(rawItems, sortOption);

                if (items.length === 0) {
                  return (
                    <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
                      <Sparkles className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
                      <h3 className="text-base font-bold text-slate-300">
                        No {spotlightCategory} found for {spotlightLang.toUpperCase()}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Try selecting "All Languages" or switching categories above.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                    {items.map((item, idx) => (
                      <TrackCard
                        key={item.id || item.token || idx}
                        item={{
                          ...item,
                          type:
                            spotlightCategory === 'artists'
                              ? 'artist'
                              : spotlightCategory === 'albums'
                                ? 'album'
                                : 'playlist'
                        }}
                        onCardClick={openDetails}
                        onPlaySong={openDetails}
                        onAddToQueue={handleAddToQueue}
                        onToggleFavorite={toggleFavorite}
                        isFavorite={!!favorites[item.id]}
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
                        isResolvingAudio={isResolvingAudio}
                        upgradeImg={upgradeImg}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : activeTab === 'years' ? (
            <div>
              {/* Year Selector Pills Bar */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-3 no-scrollbar">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0 mr-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Catalog Year:
                </span>
                {YEARS.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 ${selectedYear === yr
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md ring-1 ring-emerald-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>

              {/* Sort Controls */}
              <SortControls
                sortOption={sortOption}
                setSortOption={setSortOption}
                totalCount={yearAlbums.length}
                label="Year Albums"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {sortItems(yearAlbums, sortOption).map((album) => (
                  <TrackCard
                    key={album.id || album.token}
                    item={{ ...album, type: 'album' }}
                    onCardClick={openDetails}
                    onPlaySong={openDetails}
                    onAddToQueue={handleAddToQueue}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={!!favorites[album.id]}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    isResolvingAudio={isResolvingAudio}
                    upgradeImg={upgradeImg}
                  />
                ))}
              </div>
            </div>
          ) : activeTab === 'search' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-xs text-slate-400 mt-1">Instant catalog discovery across songs, albums & artists</p>
              </div>

              {/* Genre Quick Filters */}
              <div className="mb-6 p-4 rounded-2xl glass-panel border border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                  Popular Moods & Genre Exploration
                </span>
                <div className="flex flex-wrap gap-2">
                  {GENRE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleSearchSubmit(null, tag)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold text-slate-300 hover:text-white transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Controls */}
              <SortControls
                sortOption={sortOption}
                setSortOption={setSortOption}
                totalCount={(searchResults.songs?.length || 0) + (searchResults.albums?.length || 0)}
                label="Search Results"
              />

              {searchLoading ? (
                <GridSkeleton count={10} />
              ) : (
                <div className="space-y-10">
                  {/* Songs Search */}
                  {searchResults.songs?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-100 mb-4 flex items-center gap-2">
                        <Music2 className="w-5 h-5 text-emerald-400" />
                        <span>Songs ({searchResults.songs.length})</span>
                      </h3>
                      <div className="space-y-2">
                        {sortItems(searchResults.songs, sortOption).map((song, idx) => (
                          <TrackRow
                            key={song.id}
                            song={song}
                            index={idx}
                            onPlay={() => handlePlaySongFromList(searchResults.songs, idx)}
                            onAddToQueue={handleAddToQueue}
                            onToggleFavorite={toggleFavorite}
                            onOpenAddToPlaylist={(songItem) => {
                              setSelectedSongForPlaylist(songItem);
                              setIsPlaylistModalOpen(true);
                            }}
                            isFavorite={!!favorites[song.id]}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            isResolvingAudio={isResolvingAudio}
                            upgradeImg={upgradeImg}
                            formatSeconds={formatSeconds}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Albums Search */}
                  {searchResults.albums?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-100 mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-cyan-400" />
                        <span>Albums</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                        {sortItems(searchResults.albums, sortOption).map((album) => (
                          <TrackCard
                            key={album.id}
                            item={{ ...album, type: 'album' }}
                            onCardClick={openDetails}
                            onPlaySong={openDetails}
                            onAddToQueue={handleAddToQueue}
                            onToggleFavorite={toggleFavorite}
                            isFavorite={!!favorites[album.id]}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            isResolvingAudio={isResolvingAudio}
                            upgradeImg={upgradeImg}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Artists Search */}
                  {searchResults.artists?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-100 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-400" />
                        <span>Artists</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                        {sortItems(searchResults.artists, sortOption).map((artist) => (
                          <TrackCard
                            key={artist.id}
                            item={{ ...artist, type: 'artist' }}
                            onCardClick={openDetails}
                            onPlaySong={openDetails}
                            onAddToQueue={handleAddToQueue}
                            onToggleFavorite={toggleFavorite}
                            isFavorite={!!favorites[artist.id]}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            isResolvingAudio={isResolvingAudio}
                            upgradeImg={upgradeImg}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'library' ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
                    <Heart className="w-7 h-7 text-emerald-400 fill-current" />
                    <span>My Favorites Library</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Bookmarked songs and tracks saved to your personalized library</p>
                </div>
                <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  {likedTracksList.length} Tracks
                </span>
              </div>

              {/* Sort Controls */}
              {likedTracksList.length > 0 && (
                <SortControls
                  sortOption={sortOption}
                  setSortOption={setSortOption}
                  totalCount={likedTracksList.length}
                  label="Favorites"
                />
              )}

              {likedTracksList.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
                  <Heart className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
                  <h3 className="text-base font-bold text-slate-300">No favorite tracks saved yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click the heart icon on any song or album card to bookmark it to your personalized library.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortItems(likedTracksList, sortOption)
                    .filter((song) => song && (song.id || song.title))
                    .map((song, idx) => (
                      <TrackRow
                        key={song.id || `liked_${idx}`}
                        song={song}
                        index={idx}
                        onPlay={() => handlePlaySongFromList(likedTracksList, idx)}
                        onAddToQueue={handleAddToQueue}
                        onToggleFavorite={toggleFavorite}
                        onOpenAddToPlaylist={(songItem) => {
                          setSelectedSongForPlaylist(songItem);
                          setIsPlaylistModalOpen(true);
                        }}
                        isFavorite={true}
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
                        isResolvingAudio={isResolvingAudio}
                        upgradeImg={upgradeImg}
                        formatSeconds={formatSeconds}
                      />
                    ))}
                </div>
              )}
            </div>
          ) : activeTab === 'playlists' ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
                    <ListMusic className="w-7 h-7 text-emerald-400" />
                    <span>My Custom Playlists</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Create and manage your custom playlists synced in cloud DB</p>
                </div>
                {user && (
                  <button
                    onClick={() => {
                      setSelectedSongForPlaylist(null);
                      setIsPlaylistModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition shadow-lg shadow-emerald-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Playlist</span>
                  </button>
                )}
              </div>

              {!user ? (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-4">
                  <ListMusic className="w-12 h-12 text-emerald-400/50 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-200">Log in to create custom playlists</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Registered users can create custom playlists, add songs from any album or search result, and sync across devices!
                  </p>
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-extrabold hover:shadow-lg transition"
                  >
                    Log In / Register
                  </button>
                </div>
              ) : selectedPlaylistDetail ? (
                <div>
                  {/* Selected Playlist Detailed View */}
                  <div className="mb-6 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPlaylistDetail(null)}
                      className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1.5"
                    >
                      ← Back to All Playlists
                    </button>
                    <button
                      onClick={() => handleDeletePlaylist(selectedPlaylistDetail._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition border border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Playlist</span>
                    </button>
                  </div>

                  <div className="p-6 rounded-3xl glass-panel border border-slate-800 mb-8 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-32 h-32 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <ListMusic className="w-12 h-12 text-emerald-400" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        Custom Playlist
                      </span>
                      <h1 className="text-2xl sm:text-4xl font-black text-slate-100 mt-2">
                        {selectedPlaylistDetail.name}
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedPlaylistDetail.songs?.length || 0} Tracks • Created by {user.name}
                      </p>
                      {selectedPlaylistDetail.songs?.length > 0 && (
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => handlePlayAllTracks(selectedPlaylistDetail.songs)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 transition"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Play All</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedPlaylistDetail.songs?.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No tracks in this playlist yet. Add songs using the "+ Add to Playlist" button on tracks!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPlaylistDetail.songs.map((song, idx) => (
                        <div key={song.id || idx} className="flex items-center gap-2">
                          <div className="flex-1">
                            <TrackRow
                              song={song}
                              index={idx}
                              onPlay={() => handlePlaySongFromList(selectedPlaylistDetail.songs, idx)}
                              onAddToQueue={handleAddToQueue}
                              onToggleFavorite={toggleFavorite}
                              isFavorite={!!favorites[song.id]}
                              currentTrack={currentTrack}
                              isPlaying={isPlaying}
                              isResolvingAudio={isResolvingAudio}
                              upgradeImg={upgradeImg}
                              formatSeconds={formatSeconds}
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveTrackFromPlaylist(selectedPlaylistDetail._id, song.id)}
                            title="Remove from playlist"
                            className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : userPlaylists.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
                  <ListMusic className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
                  <h3 className="text-base font-bold text-slate-300">No playlists created yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Create Playlist" or tap "+ Add to Playlist" on any song to create your first collection.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPlaylists.map((pl) => (
                    <div
                      key={pl._id}
                      onClick={() => setSelectedPlaylistDetail(pl)}
                      className="group p-5 rounded-2xl glass-panel border border-slate-800/80 hover:border-emerald-500/40 transition cursor-pointer flex items-center gap-4"
                    >
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <ListMusic className="w-7 h-7 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition truncate">
                          {pl.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {pl.songs?.length || 0} Tracks
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(pl._id);
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'history' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
                  <History className="w-7 h-7 text-emerald-400" />
                  <span>Playback & Search History</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tracks you listened to and recent queries typed in the search bar
                </p>
              </div>

              {!user ? (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-4">
                  <History className="w-12 h-12 text-emerald-400/50 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-200">Log in to track playback history</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Logged-in users automatically save playback history and search bar history across sessions!
                  </p>
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-extrabold hover:shadow-lg transition"
                  >
                    Log In / Register
                  </button>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Search Queries History */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span>Search History</span>
                      </h3>
                      {searchHistory.length > 0 && (
                        <button
                          onClick={handleClearSearchHistory}
                          className="text-xs text-slate-400 hover:text-rose-400 transition"
                        >
                          Clear History
                        </button>
                      )}
                    </div>
                    {searchHistory.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">No search history recorded yet.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.map((queryStr, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSearchSubmit(null, queryStr)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-2"
                          >
                            <span>{queryStr}</span>
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recently Played Song History */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-200 mb-4 flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-emerald-400" />
                      <span>Recently Played Songs ({listeningHistory.length})</span>
                    </h3>

                    {listeningHistory.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">No tracks played recently.</div>
                    ) : (
                      <div className="space-y-2">
                        {listeningHistory.map((song, idx) => (
                          <TrackRow
                            key={song.id || idx}
                            song={song}
                            index={idx}
                            onPlay={() => handlePlaySongFromList(listeningHistory, idx)}
                            onAddToQueue={handleAddToQueue}
                            onToggleFavorite={toggleFavorite}
                            onOpenAddToPlaylist={(songItem) => {
                              setSelectedSongForPlaylist(songItem);
                              setIsPlaylistModalOpen(true);
                            }}
                            isFavorite={!!favorites[song.id]}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            isResolvingAudio={isResolvingAudio}
                            upgradeImg={upgradeImg}
                            formatSeconds={formatSeconds}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mb-6 capitalize tracking-tight">
                Artists Spotlight ({selectedLanguages.join(', ')})
              </h2>

              <SortControls
                sortOption={sortOption}
                setSortOption={setSortOption}
                totalCount={artists.length}
                label="Artists"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {sortItems(artists, sortOption).map((artist) => (
                  <TrackCard
                    key={artist.id}
                    item={{ ...artist, type: 'artist' }}
                    onCardClick={openDetails}
                    onPlaySong={openDetails}
                    onAddToQueue={handleAddToQueue}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={!!favorites[artist.id]}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    isResolvingAudio={isResolvingAudio}
                    upgradeImg={upgradeImg}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< lg screens) */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        likedSongsCount={likedTracksList.length}
        userPlaylistsCount={userPlaylists.length}
        user={user}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Detail Modal Overview */}
      <DetailModal
        selectedEntity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
        detailData={detailData}
        detailLoading={detailLoading}
        onPlaySongFromList={handlePlaySongFromList}
        onPlayAllTracks={handlePlayAllTracks}
        onAddAllToQueue={handleAddAllToQueue}
        onAddToQueue={handleAddToQueue}
        onToggleFavorite={toggleFavorite}
        onOpenAddToPlaylist={(songItem) => {
          setSelectedSongForPlaylist(songItem);
          setIsPlaylistModalOpen(true);
        }}
        favoritesMap={favorites}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isResolvingAudio={isResolvingAudio}
        relatedAlbums={relatedAlbums}
        onOpenAnotherDetail={openDetails}
        onLoadMoreArtistSongs={handleLoadMoreArtistSongs}
        artistMoreSongsLoading={artistMoreSongsLoading}
        upgradeImg={upgradeImg}
        formatSeconds={formatSeconds}
      />

      {/* Up Next Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        queueIndex={queueIndex}
        onPlayQueueTrack={handlePlayQueueTrack}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        upgradeImg={upgradeImg}
      />

      {/* Fullscreen Visualizer & Studio Overlay */}
      {isExpandedStudio && (
        <ExpandedPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isResolvingAudio={isResolvingAudio}
          currentTime={currentTime}
          duration={duration}
          handleSeek={handleSeek}
          handleSkipBackward={handleSkipBackward}
          handleSkipForward={handleSkipForward}
          handlePrevTrack={handlePrevTrack}
          handleNextTrack={handleNextTrack}
          togglePlayPause={togglePlayPause}
          volume={volume}
          isMuted={isMuted}
          handleVolumeChange={handleVolumeChange}
          handleToggleMute={handleToggleMute}
          bitrate={bitrate}
          handleBitrateChange={handleBitrateChange}
          isShuffle={isShuffle}
          toggleShuffle={toggleShuffle}
          repeatMode={repeatMode}
          toggleRepeatMode={toggleRepeatMode}
          isFavorite={!!favorites[currentTrack?.id]}
          toggleFavorite={toggleFavorite}
          onOpenAddToPlaylist={(songItem) => {
            setSelectedSongForPlaylist(songItem || currentTrack);
            setIsPlaylistModalOpen(true);
          }}
          onClose={() => setIsExpandedStudio(false)}
          queue={queue}
          queueIndex={queueIndex}
          onPlayQueueTrack={handlePlayQueueTrack}
          onPlaySong={handlePlayFullSong}
          formatSeconds={formatSeconds}
          upgradeImg={upgradeImg}
          audioRef={audioRef}
          onOpenDevicePicker={() => setIsDevicePickerOpen(true)}
          activeDevice={activeDevice}
          initialTab={studioInitialTab}
        />
      )}

      {/* Bottom Production Audio Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isResolvingAudio={isResolvingAudio}
        currentTime={currentTime}
        duration={duration}
        handleSeek={handleSeek}
        handleSkipBackward={handleSkipBackward}
        handleSkipForward={handleSkipForward}
        handlePrevTrack={handlePrevTrack}
        handleNextTrack={handleNextTrack}
        togglePlayPause={togglePlayPause}
        handlePlayFullSong={handlePlayFullSong}
        volume={volume}
        isMuted={isMuted}
        handleVolumeChange={handleVolumeChange}
        handleToggleMute={handleToggleMute}
        bitrate={bitrate}
        handleBitrateChange={handleBitrateChange}
        isShuffle={isShuffle}
        toggleShuffle={toggleShuffle}
        repeatMode={repeatMode}
        toggleRepeatMode={toggleRepeatMode}
        isFavorite={!!favorites[currentTrack?.id]}
        toggleFavorite={toggleFavorite}
        onOpenAddToPlaylist={(songItem) => {
          setSelectedSongForPlaylist(songItem || currentTrack);
          setIsPlaylistModalOpen(true);
        }}
        onExpandStudio={handleExpandStudio}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        queueCount={queue.length}
        recommendations={recommendations}
        formatSeconds={formatSeconds}
        upgradeImg={upgradeImg}
        audioRef={audioRef}
        onOpenDevicePicker={() => setIsDevicePickerOpen(true)}
        activeDevice={activeDevice}
      />

      {/* Spotify-Style Connect Device Picker Modal */}
      <DevicePickerModal
        isOpen={isDevicePickerOpen}
        onClose={() => setIsDevicePickerOpen(false)}
        activeDevice={activeDevice}
        onSelectDevice={handleSelectDevice}
        audioDevices={audioDevices}
        onRequestPermission={handleRequestDevicePermission}
      />

      {/* 1. Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={(userData, userToken) => {
          setUser(userData);
          setToken(userToken);
          setIsAuthModalOpen(false);
          showToast(`Welcome back, ${userData.name}!`);
        }}
      />

      {/* 2. Guest 15-Minute Playback Limit Reached Modal */}
      <LimitReachedModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        onOpenAuth={(mode) => {
          setIsLimitModalOpen(false);
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
      />

      {/* 3. User Profile Modal */}
      {user && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          token={token}
          onUpdateUser={(updated) => {
            setUser(updated);
            showToast('Profile updated successfully!');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* 4. Add to Custom Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => {
          setIsPlaylistModalOpen(false);
          setSelectedSongForPlaylist(null);
        }}
        song={selectedSongForPlaylist}
        playlists={userPlaylists}
        token={token}
        onPlaylistUpdated={(updatedPlaylist) => {
          setUserPlaylists((prev) => {
            const exists = prev.some((p) => p._id === updatedPlaylist._id);
            if (exists) {
              return prev.map((p) => (p._id === updatedPlaylist._id ? updatedPlaylist : p));
            }
            return [...prev, updatedPlaylist];
          });
          showToast(`Playlist "${updatedPlaylist.name}" updated!`);
        }}
      />

      {/* 5. Admin Control Panel Modal */}
      {user?.isAdmin && (
        <AdminPortalModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          token={token}
        />
      )}
    </div>
  );
}