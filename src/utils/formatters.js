export function decodeHTMLEntities(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}

export function formatSeconds(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function upgradeImg(url) {
  if (!url) return '';
  return url.replace('150x150', '500x500').replace(/bch=\d+/, '');
}

export function formatPlayCount(count) {
  if (!count) return '';
  const num = Number(count);
  if (isNaN(num) || num === 0) return '';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatPlaylistDuration(songs) {
  if (!songs || !Array.isArray(songs) || songs.length === 0) return '0 min';
  let totalSec = 0;
  for (const song of songs) {
    if (!song) continue;
    const raw = song.duration || song.more_info?.duration;
    let sec = 0;
    if (typeof raw === 'number') {
      sec = raw;
    } else if (typeof raw === 'string') {
      if (raw.includes(':')) {
        const parts = raw.split(':').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          sec = parts[0] * 60 + parts[1];
        } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      } else {
        const parsed = Number(raw);
        if (!isNaN(parsed) && parsed > 0) sec = parsed;
      }
    }
    // Fallback if missing or 0: average track duration ~ 210s (3m 30s)
    totalSec += (sec > 0 ? sec : 210);
  }

  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}

