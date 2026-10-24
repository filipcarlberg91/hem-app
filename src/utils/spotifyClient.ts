export interface SpotifyPlaylistItem {
  id: string;
  name: string;
  subtitle: string;
  spotifyUri: string; // e.g. "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO"
  embedUrl: string; // e.g. "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0"
  deepLink: string; // e.g. "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO"
  isCustom?: boolean;
}

export interface SpotifyNowPlaying {
  isPlaying: boolean;
  trackTitle: string;
  artistName: string;
  albumArtUrl?: string;
  deviceName?: string;
  progressMs?: number;
  durationMs?: number;
  volumePercent?: number;
}

const SPOTIFY_PLAYLISTS_KEY = 'vn_screensaver_spotify_playlists_v1';
const SPOTIFY_SELECTED_ID_KEY = 'vn_screensaver_spotify_selected_id_v1';
const SPOTIFY_ACCESS_TOKEN_KEY = 'vn_screensaver_spotify_token_v1';

export const DEFAULT_SPOTIFY_PLAYLISTS: SpotifyPlaylistItem[] = [
  {
    id: 'sp-cozy-friday',
    name: 'Fredagsmys',
    subtitle: 'Familj & Helg',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX2sUQwD7tbmL',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX2sUQwD7tbmL?utm_source=generator&theme=0',
    deepLink: 'https://open.spotify.com/playlist/37i9dQZF1DX2sUQwD7tbmL',
  },
  {
    id: 'sp-kitchen-cooking',
    name: 'Matlagning & Kök',
    subtitle: 'Skönt i köket',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX0UrRvztWcAU',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX0UrRvztWcAU?utm_source=generator&theme=0',
    deepLink: 'https://open.spotify.com/playlist/37i9dQZF1DX0UrRvztWcAU',
  },
  {
    id: 'sp-morning-coffee',
    name: 'Morgonkaffe',
    subtitle: 'Lugn start',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX6ZiG578N78c',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX6ZiG578N78c?utm_source=generator&theme=0',
    deepLink: 'https://open.spotify.com/playlist/37i9dQZF1DX6ZiG578N78c',
  },
  {
    id: 'sp-swedish-hits',
    name: 'Svenska Favoriter',
    subtitle: 'Pop & Klassiker',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX3ZeFHRhhi7Y',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX3ZeFHRhhi7Y?utm_source=generator&theme=0',
    deepLink: 'https://open.spotify.com/playlist/37i9dQZF1DX3ZeFHRhhi7Y',
  },
  {
    id: 'sp-evening-chill',
    name: 'Lugn Kväll',
    subtitle: 'Avkoppling',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0',
    deepLink: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
  },
];

export function parseSpotifyInputToPlaylistItem(
  name: string,
  rawUrlOrUri: string,
  subtitle = 'Egen spellista'
): SpotifyPlaylistItem | null {
  const trimmed = rawUrlOrUri.trim();
  if (!trimmed) return null;

  let type: 'playlist' | 'album' | 'track' | 'artist' | 'show' = 'playlist';
  let spotifyId = '';

  // Format 1: spotify:playlist:37i9dQZF1DX4sWSpwq3LiO
  const uriMatch = trimmed.match(
    /^spotify:(playlist|album|track|artist|show):([a-zA-Z0-9]+)/i
  );
  if (uriMatch) {
    type = uriMatch[1].toLowerCase() as typeof type;
    spotifyId = uriMatch[2];
  } else {
    // Format 2: https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO?si=...
    // or https://open.spotify.com/intl-sv/playlist/...
    const urlMatch = trimmed.match(
      /spotify\.com\/(?:intl-[a-z]+\/)?(?:embed\/)?(playlist|album|track|artist|show)\/([a-zA-Z0-9]+)/i
    );
    if (urlMatch) {
      type = urlMatch[1].toLowerCase() as typeof type;
      spotifyId = urlMatch[2];
    } else if (/^[a-zA-Z0-9]{15,30}$/.test(trimmed)) {
      spotifyId = trimmed;
    }
  }

  if (!spotifyId) return null;

  return {
    id: `sp-custom-${Date.now()}-${spotifyId.slice(0, 6)}`,
    name: name.trim() || 'Min Spellista',
    subtitle: subtitle.trim() || 'Egen spellista',
    spotifyUri: `spotify:${type}:${spotifyId}`,
    embedUrl: `https://open.spotify.com/embed/${type}/${spotifyId}?utm_source=generator&theme=0`,
    deepLink: `https://open.spotify.com/${type}/${spotifyId}`,
    isCustom: true,
  };
}

export function loadSpotifyPlaylists(): SpotifyPlaylistItem[] {
  try {
    const raw = localStorage.getItem(SPOTIFY_PLAYLISTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return DEFAULT_SPOTIFY_PLAYLISTS;
}

export function saveSpotifyPlaylists(list: SpotifyPlaylistItem[]): void {
  try {
    localStorage.setItem(SPOTIFY_PLAYLISTS_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

export function loadSelectedSpotifyPlaylistId(): string {
  try {
    return localStorage.getItem(SPOTIFY_SELECTED_ID_KEY) || DEFAULT_SPOTIFY_PLAYLISTS[0].id;
  } catch {
    return DEFAULT_SPOTIFY_PLAYLISTS[0].id;
  }
}

export function saveSelectedSpotifyPlaylistId(id: string): void {
  try {
    localStorage.setItem(SPOTIFY_SELECTED_ID_KEY, id);
  } catch {
    // Ignore
  }
}

export function loadSpotifyAccessToken(): string {
  try {
    return localStorage.getItem(SPOTIFY_ACCESS_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function saveSpotifyAccessToken(token: string): void {
  try {
    if (!token) {
      localStorage.removeItem(SPOTIFY_ACCESS_TOKEN_KEY);
    } else {
      localStorage.setItem(SPOTIFY_ACCESS_TOKEN_KEY, token.trim());
    }
  } catch {
    // Ignore
  }
}

function getNativeMediaBridge(): {
  sendMediaControl?: (cmd: string) => boolean;
  launchExternalApp?: (pkg: string, fallbackUrl: string) => boolean;
} | null {
  try {
    const w = window as unknown as {
      HemNativeBridge?: {
        sendMediaControl?: (cmd: string) => boolean;
        launchExternalApp?: (pkg: string, fallbackUrl: string) => boolean;
      };
    };
    return w.HemNativeBridge || null;
  } catch {
    return null;
  }
}

export function sendNativeAndroidMediaControl(
  cmd: 'play_pause' | 'play' | 'pause' | 'next' | 'prev' | 'vol_up' | 'vol_down'
): boolean {
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.sendMediaControl === 'function') {
      return Boolean(bridge.sendMediaControl(cmd));
    }
  } catch {
    // Ignore
  }
  return false;
}

export async function fetchSpotifyConnectNowPlaying(
  token: string
): Promise<SpotifyNowPlaying | null> {
  if (!token) return null;
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204 || !res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    const item = data.item;
    return {
      isPlaying: Boolean(data.is_playing),
      trackTitle: item?.name || 'Spotify Connect',
      artistName: Array.isArray(item?.artists)
        ? item.artists.map((a: any) => a.name).join(', ')
        : '',
      albumArtUrl: item?.album?.images?.[0]?.url,
      deviceName: data.device?.name,
      progressMs: data.progress_ms,
      durationMs: item?.duration_ms,
      volumePercent: data.device?.volume_percent,
    };
  } catch {
    return null;
  }
}

export async function fetchUserSpotifyPlaylists(
  token: string
): Promise<SpotifyPlaylistItem[]> {
  if (!token) return [];
  try {
    const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.items)) return [];
    return data.items
      .filter((it: any) => it && it.id && it.name)
      .map((it: any) => ({
        id: `sp-api-${it.id}`,
        name: String(it.name),
        subtitle: `${it.tracks?.total ?? 0} låtar`,
        spotifyUri: `spotify:playlist:${it.id}`,
        embedUrl: `https://open.spotify.com/embed/playlist/${it.id}?utm_source=generator&theme=0`,
        deepLink: `https://open.spotify.com/playlist/${it.id}`,
        isCustom: true,
      }));
  } catch {
    return [];
  }
}

export async function sendSpotifyConnectCommand(
  token: string,
  action: 'play' | 'pause' | 'next' | 'prev' | 'play-uri',
  contextUri?: string
): Promise<boolean> {
  if (!token) return false;
  try {
    if (action === 'play-uri' && contextUri) {
      const res = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context_uri: contextUri }),
      });
      return res.ok || res.status === 204;
    }
    if (action === 'play' || action === 'pause') {
      const res = await fetch(`https://api.spotify.com/v1/me/player/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok || res.status === 204;
    }
    if (action === 'next' || action === 'prev') {
      const endpoint = action === 'next' ? 'next' : 'previous';
      const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok || res.status === 204;
    }
  } catch {
    // Ignore
  }
  return false;
}
