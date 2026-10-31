import { getApiUrl } from './apiUrl';

export interface SpotifyTrackItem {
  uri: string;
  title: string;
  artist: string;
  durationMs: number;
  albumArtUrl?: string;
  audioPreviewUrl?: string;
}

export interface SpotifyPlaylistItem {
  id: string;
  name: string;
  subtitle: string;
  spotifyUri: string; // e.g. "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO"
  embedUrl: string; // e.g. "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0"
  deepLink: string; // e.g. "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO"
  coverUrl?: string;
  tracks?: SpotifyTrackItem[];
  isCustom?: boolean;
  ptToken?: string;
  embedUnavailable?: boolean;
}

export interface SpotifyNowPlaying {
  isPlaying: boolean;
  trackTitle: string;
  artistName: string;
  albumArtUrl?: string;
  deviceName?: string;
  deviceId?: string;
  deviceIp?: string;
  appName?: string;
  isCast?: boolean;
  mediaType?: 'audio' | 'video';
  progressMs?: number;
  durationMs?: number;
  volumePercent?: number;
  spotifyUri?: string;
  source?: 'spotify-connect' | 'android-broadcast' | 'embed-player' | 'google-cast';
}

export interface SpotifyAuthConfig {
  clientId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in ms
  deviceAppConnected?: boolean;
}

const SPOTIFY_PLAYLISTS_KEY = 'vn_screensaver_spotify_playlists_v1';
const SPOTIFY_SELECTED_ID_KEY = 'vn_screensaver_spotify_selected_id_v1';
const SPOTIFY_ACCESS_TOKEN_KEY = 'vn_screensaver_spotify_token_v1';
const SPOTIFY_AUTH_CONFIG_KEY = 'vn_screensaver_spotify_auth_v2';
const SPOTIFY_PKCE_VERIFIER_KEY = 'vn_spotify_pkce_verifier_v1';

export const DEFAULT_SPOTIFY_PLAYLISTS: SpotifyPlaylistItem[] = [
  {
    id: 'sp-cozy-friday',
    name: 'Fredagsmys',
    subtitle: 'Familj & Helg',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX2sUQwD7tbmL',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX2sUQwD7tbmL?utm_source=generator&theme=0',
    deepLink: 'https://open.spotify.com/playlist/37i9dQZF1DX2sUQwD7tbmL',
    coverUrl: 'https://i.scdn.co/image/ab67706f00000002e68acf89609707a72a76e20a',
    tracks: [
      { uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b', title: 'Blinding Lights', artist: 'The Weeknd', durationMs: 200040 },
      { uri: 'spotify:track:4Dvkj6JhhA12EX05fT7y2e', title: 'As It Was', artist: 'Harry Styles', durationMs: 167303 },
      { uri: 'spotify:track:1BxfuPKGuaTgP7aM0Bbdwr', title: 'Cruel Summer', artist: 'Taylor Swift', durationMs: 178426 },
      { uri: 'spotify:track:0yLdNVWF3Srea0uzk55zFn', title: 'Flowers', artist: 'Miley Cyrus', durationMs: 200454 },
      { uri: 'spotify:track:7qiZfU4dY1lWllzX7mPBI3', title: 'Shape of You', artist: 'Ed Sheeran', durationMs: 233712 },
      { uri: 'spotify:track:3PfIrDoz19wz7qK7tYeu62', title: 'Don’t Start Now', artist: 'Dua Lipa', durationMs: 183290 },
      { uri: 'spotify:track:2XU0oxnq2qxCpomAAuJY8K', title: 'Dance Monkey', artist: 'Tones And I', durationMs: 209438 },
      { uri: 'spotify:track:6UelLqGlWMcVH1E5c4H7lY', title: 'Watermelon Sugar', artist: 'Harry Styles', durationMs: 174000 },
      { uri: 'spotify:track:5HCyWlXZPP0y6Gqq8TgA20', title: 'STAY', artist: 'The Kid LAROI, Justin Bieber', durationMs: 141805 },
      { uri: 'spotify:track:3DarAbFujv6eYNliUTyqtz', title: 'Kiss Me More', artist: 'Doja Cat, SZA', durationMs: 208666 },
    ],
  },
  {
    id: 'sp-kitchen-cooking',
    name: 'Matlagning & Kök',
    subtitle: 'Skönt i köket',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX0UrRvztWcAU',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX0UrRvztWcAU?utm_source=generator&theme=0',
    deepLink: 'https://open.spotify.com/playlist/37i9dQZF1DX0UrRvztWcAU',
    coverUrl: 'https://i.scdn.co/image/ab67706f000000026b30471dcc036d254dcc8041',
    tracks: [
      { uri: 'spotify:track:39LLxExYz6ewLAcYrzQQyP', title: 'Levitating', artist: 'Dua Lipa', durationMs: 203064 },
      { uri: 'spotify:track:2Fxmhks0bxGSBdJ92vM42m', title: 'bad guy', artist: 'Billie Eilish', durationMs: 194087 },
      { uri: 'spotify:track:0pqnGHJpmpxLKifKRmU6WP', title: 'Believer', artist: 'Imagine Dragons', durationMs: 204346 },
      { uri: 'spotify:track:60nZcImufyMA1MKQY3dcCH', title: 'Happy', artist: 'Pharrell Williams', durationMs: 232720 },
      { uri: 'spotify:track:32OlwWuMpZ6b0aN2RZOeMS', title: 'Uptown Funk', artist: 'Mark Ronson, Bruno Mars', durationMs: 269666 },
      { uri: 'spotify:track:09IStsImFySgyp0pIQdqAc', title: 'The Middle', artist: 'Zedd, Maren Morris, Grey', durationMs: 184732 },
      { uri: 'spotify:track:7BKLCZ1jbUBVqRi2FVlTVw', title: 'Closer', artist: 'The Chainsmokers, Halsey', durationMs: 244960 },
      { uri: 'spotify:track:6RUKPb4LETWmmr3iAEQktW', title: 'Something Just Like This', artist: 'The Chainsmokers, Coldplay', durationMs: 247160 },
    ],
  },
  {
    id: 'sp-morning-coffee',
    name: 'Morgonkaffe',
    subtitle: 'Lugn start',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX4WYpdgoIcn6',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX4WYpdgoIcn6?utm_source=generator&theme=0',
    deepLink: 'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6',
    coverUrl: 'https://i.scdn.co/image/ab67706f000000020408713c731caaf1f800615a',
    tracks: [
      { uri: 'spotify:track:1zwMYTA5nlNjZxYrvBB2pV', title: 'Someone Like You', artist: 'Adele', durationMs: 285240 },
      { uri: 'spotify:track:3U4isOIWM3VvDubwSI3y7a', title: 'All of Me', artist: 'John Legend', durationMs: 269560 },
      { uri: 'spotify:track:0tgVpDi06FyKpA1z0VMD4v', title: 'Perfect', artist: 'Ed Sheeran', durationMs: 263400 },
      { uri: 'spotify:track:7LVHVU3tWfcxj5aiPFEW4Q', title: 'Fix You', artist: 'Coldplay', durationMs: 295533 },
      { uri: 'spotify:track:3AJwUDP919kvQ9QcozQPxg', title: 'Yellow', artist: 'Coldplay', durationMs: 266773 },
      { uri: 'spotify:track:1dGr1c8CrMLDpV6mPbImSI', title: 'Lover', artist: 'Taylor Swift', durationMs: 221306 },
      { uri: 'spotify:track:6habFhsOp2NvshLv26DqMb', title: 'Slow Dancing in a Burning Room', artist: 'John Mayer', durationMs: 242000 },
      { uri: 'spotify:track:0JmiBCpWc1IAc0et7Xm7FL', title: 'Put Your Records On', artist: 'Corinne Bailey Rae', durationMs: 215360 },
    ],
  },
  {
    id: 'sp-swedish-hits',
    name: 'Svenska Favoriter',
    subtitle: 'Pop & Klassiker',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX3ZeFHRhhi7Y',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX3ZeFHRhhi7Y?utm_source=generator&theme=0',
    deepLink: 'https://open.spotify.com/playlist/37i9dQZF1DX3ZeFHRhhi7Y',
    coverUrl: 'https://i.scdn.co/image/ab67706f0000000292ae7c84ce24f47ee2085743',
    tracks: [
      { uri: 'spotify:track:4aWmUDTfIPGksMNLV2rQP2', title: 'Svag', artist: 'Victor Leksell', durationMs: 191681 },
      { uri: 'spotify:track:6b8Be6ljOzmkOmFslEb23P', title: 'Kan inte gå', artist: 'Bolaget', durationMs: 188000 },
      { uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b', title: 'Strövtåg i hembygden', artist: 'Mando Diao', durationMs: 247000 },
      { uri: 'spotify:track:2VxeLyX666F8uXCJ0dZF8B', title: 'Lev nu dö sen', artist: 'Miss Li', durationMs: 175000 },
      { uri: 'spotify:track:1r9xUipOqoNwggBpENDsvJ', title: 'Komplicerat', artist: 'Miss Li', durationMs: 168000 },
      { uri: 'spotify:track:59nOXPmaKlBfGMDeOVGrIK', title: 'Din låt', artist: 'Victor Leksell, Einár', durationMs: 194000 },
      { uri: 'spotify:track:2cYqizR4lgvp4Qu6IQ3qGN', title: 'Utan dina andetag', artist: 'Kent', durationMs: 263000 },
      { uri: 'spotify:track:7tFiyTwD0nx5a1eklYtX2J', title: 'Känn ingen sorg för mig Göteborg', artist: 'Håkan Hellström', durationMs: 218000 },
    ],
  },
  {
    id: 'sp-evening-chill',
    name: 'Lugn Kväll',
    subtitle: 'Avkoppling',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0',
    deepLink: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
    coverUrl: 'https://i.scdn.co/image/ab67706f0000000270e1fb7db7b45809d6a80377',
    tracks: [
      { uri: 'spotify:track:0u2P5u6lvoDfwTYjAADbn4', title: 'lovely', artist: 'Billie Eilish, Khalid', durationMs: 200185 },
      { uri: 'spotify:track:7qEHsqek33rTcFNT9PFqLf', title: 'Someone You Loved', artist: 'Lewis Capaldi', durationMs: 182160 },
      { uri: 'spotify:track:6ocbgoVGwYJhOv1GgI9NsF', title: '7 rings', artist: 'Ariana Grande', durationMs: 178626 },
      { uri: 'spotify:track:1ZMiCix7XSAbfAJlEZWMCp', title: 'Falling', artist: 'Harry Styles', durationMs: 240133 },
      { uri: 'spotify:track:2gMXnyrvIjhVBUZwvLZDMP', title: 'Before You Go', artist: 'Lewis Capaldi', durationMs: 215106 },
      { uri: 'spotify:track:3ZCTVFBt2Brf31RLEnCkWJ', title: 'everything i wanted', artist: 'Billie Eilish', durationMs: 245425 },
      { uri: 'spotify:track:5wANPM4fQCJwkGd4rN57mH', title: 'drivers license', artist: 'Olivia Rodrigo', durationMs: 242013 },
      { uri: 'spotify:track:6fPan2saHdFaIHuTSatORv', title: 'Heather', artist: 'Conan Gray', durationMs: 198040 },
    ],
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
  let ptToken: string | undefined;

  const ptMatch = trimmed.match(/[?&]pt=([a-zA-Z0-9_-]+)/i);
  if (ptMatch && ptMatch[1]) {
    ptToken = ptMatch[1];
  }

  // Handle Jina "URL Source: https://open.spotify.com/..." header first if present
  const urlSourceMatch = trimmed.match(
    /URL Source:\s*(https?:\/\/open\.spotify\.com\/[^\s\r\n]+)/i
  );
  const candidateSource = urlSourceMatch ? urlSourceMatch[1] : trimmed;
  if (!ptToken) {
    const candidatePt = candidateSource.match(/[?&]pt=([a-zA-Z0-9_-]+)/i);
    if (candidatePt && candidatePt[1]) {
      ptToken = candidatePt[1];
    }
  }

  const uriMatch = candidateSource.match(
    /spotify:(?:user:[^:\s]+:)?(playlist|album|track|artist|show):([a-zA-Z0-9]+)/i
  );
  if (uriMatch) {
    type = uriMatch[1].toLowerCase() as typeof type;
    spotifyId = uriMatch[2];
  } else {
    const urlMatch = candidateSource.match(
      /spotify\.com\/(?:intl-[a-zA-Z-]+\/)?(?:user\/[^/\s]+\/)?(?:embed\/)?(playlist|album|track|artist|show)\/([a-zA-Z0-9]+)/i
    );
    if (urlMatch) {
      type = urlMatch[1].toLowerCase() as typeof type;
      spotifyId = urlMatch[2];
    } else if (/spotify\.com\/(?:intl-[a-zA-Z-]+\/)?collection\/tracks/i.test(candidateSource) || /spotify:collection:tracks/i.test(candidateSource)) {
      return {
        id: `sp-custom-liked-${Date.now()}`,
        name: name.trim() || 'Gillade låtar (Favoriter)',
        subtitle: subtitle.trim() || 'Spotify Favoriter',
        spotifyUri: 'spotify:collection:tracks',
        embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX3ZeFHRhhi7Y?utm_source=generator&theme=0',
        deepLink: 'https://open.spotify.com/collection/tracks',
        isCustom: true,
        embedUnavailable: true,
      };
    } else if (/^[a-zA-Z0-9]{15,30}$/.test(trimmed)) {
      spotifyId = trimmed;
    }
  }

  if (!spotifyId) return null;

  const ptSuffix = ptToken ? `&pt=${encodeURIComponent(ptToken)}` : '';
  const deepLinkPt = ptToken ? `?pt=${encodeURIComponent(ptToken)}` : '';

  return {
    id: `sp-custom-${Date.now()}-${spotifyId.slice(0, 6)}`,
    name: name.trim() || 'Min Spellista',
    subtitle: subtitle.trim() || 'Egen spellista',
    spotifyUri: `spotify:${type}:${spotifyId}`,
    embedUrl: `https://open.spotify.com/embed/${type}/${spotifyId}?utm_source=generator&theme=0${ptSuffix}`,
    deepLink: `https://open.spotify.com/${type}/${spotifyId}${deepLinkPt}`,
    isCustom: true,
    ptToken,
  };
}

export async function resolveAndParseSpotifyInput(
  name: string,
  rawUrlOrUri: string,
  subtitle = 'Egen spellista'
): Promise<SpotifyPlaylistItem | null> {
  const direct = parseSpotifyInputToPlaylistItem(name, rawUrlOrUri, subtitle);
  if (direct) return direct;

  const shortMatch = rawUrlOrUri.match(
    /https?:\/\/(?:spotify\.link|spotify\.app\.link)\/[^\s"'<>]+/i
  );
  if (!shortMatch) return null;

  const shortUrl = shortMatch[0];

  // 1. Try Android native bridge first (follows redirects directly without CORS)
  try {
    const w = window as any;
    const bridge = w?.HemNativeBridge;
    if (bridge && typeof bridge.fetchUrlHtml === 'function') {
      const nativeTxt = bridge.fetchUrlHtml(shortUrl);
      if (nativeTxt) {
        const parsedFromNative = parseSpotifyInputToPlaylistItem(name, nativeTxt, subtitle);
        if (parsedFromNative) return parsedFromNative;
      }
    }
  } catch {
    // Ignore
  }

  // 2. Try AllOrigins raw & Jina Reader
  try {
    const [jinaTxt, allOriginsTxt] = await Promise.all([
      fetch(`https://r.jina.ai/${shortUrl}`)
        .then((r) => (r.ok ? r.text() : ''))
        .catch(() => ''),
      fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(shortUrl)}`)
        .then((r) => (r.ok ? r.text() : ''))
        .catch(() => ''),
    ]);
    const combined = `${jinaTxt}\n${allOriginsTxt}`;
    const parsedFromProxy = parseSpotifyInputToPlaylistItem(name, combined, subtitle);
    if (parsedFromProxy) {
      const tracksFromJina = jinaTxt ? parseJinaMarkdownForTracks(jinaTxt) : null;
      const tracksFromHtml = allOriginsTxt ? parseEmbedHtmlForTracks(allOriginsTxt) : null;
      const best =
        tracksFromHtml && tracksFromHtml.tracks.length > 0
          ? tracksFromHtml
          : tracksFromJina;
      if (best && best.tracks.length > 0) {
        return {
          ...parsedFromProxy,
          name:
            name.trim() && name.trim() !== 'Min Spellista'
              ? name.trim()
              : best.name || parsedFromProxy.name,
          coverUrl: best.coverUrl || parsedFromProxy.coverUrl,
          tracks: best.tracks,
        };
      }
      return parsedFromProxy;
    }
  } catch {
    // Ignore
  }

  // 3. Try local/backend API
  try {
    const apiRes = await fetch(
      getApiUrl(`/api/spotify-embed-info?url=${encodeURIComponent(shortUrl)}`)
    );
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data?.spotifyUri) {
        const item = parseSpotifyInputToPlaylistItem(
          name || data.name || 'Min Spellista',
          String(data.spotifyUri),
          subtitle
        );
        if (item) {
          return {
            ...item,
            name: name.trim() || data.name || item.name,
            coverUrl: data.coverUrl || item.coverUrl,
            tracks: Array.isArray(data.tracks) ? data.tracks : item.tracks,
          };
        }
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

export function loadSpotifyPlaylists(): SpotifyPlaylistItem[] {
  try {
    const raw = localStorage.getItem(SPOTIFY_PLAYLISTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((pl: SpotifyPlaylistItem) => {
          if (!Array.isArray(pl.tracks) || pl.tracks.length === 0) {
            const def = DEFAULT_SPOTIFY_PLAYLISTS.find(
              (d) => d.id === pl.id || d.spotifyUri === pl.spotifyUri
            );
            if (def && Array.isArray(def.tracks) && def.tracks.length > 0) {
              return { ...pl, tracks: def.tracks, coverUrl: pl.coverUrl || def.coverUrl };
            }
          }
          return pl;
        });
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

// ============================================================================
// SPOTIFY DIRECT APP SYNC + OAUTH 2.0 PKCE POPUP (100% Real Playback)
// ============================================================================

export function loadSpotifyAuthConfig(): SpotifyAuthConfig {
  try {
    const raw = localStorage.getItem(SPOTIFY_AUTH_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        clientId: String(parsed.clientId || '').trim(),
        accessToken: String(parsed.accessToken || '').trim(),
        refreshToken: String(parsed.refreshToken || '').trim(),
        expiresAt: Number(parsed.expiresAt || 0),
        deviceAppConnected: Boolean(parsed.deviceAppConnected ?? true),
      };
    }
  } catch {
    // Ignore
  }
  const legacyToken = loadSpotifyAccessToken();
  return {
    clientId: '',
    accessToken: legacyToken,
    refreshToken: '',
    expiresAt: legacyToken ? Date.now() + 3600 * 1000 : 0,
    deviceAppConnected: true,
  };
}

export function saveSpotifyAuthConfig(cfg: SpotifyAuthConfig): void {
  try {
    localStorage.setItem(SPOTIFY_AUTH_CONFIG_KEY, JSON.stringify(cfg));
    if (cfg.accessToken) {
      localStorage.setItem(SPOTIFY_ACCESS_TOKEN_KEY, cfg.accessToken);
    } else {
      localStorage.removeItem(SPOTIFY_ACCESS_TOKEN_KEY);
    }
  } catch {
    // Ignore
  }
}

export function disconnectSpotifyAccount(): void {
  try {
    const cfg = loadSpotifyAuthConfig();
    saveSpotifyAuthConfig({
      clientId: cfg.clientId,
      accessToken: '',
      refreshToken: '',
      expiresAt: 0,
      deviceAppConnected: false,
    });
    localStorage.removeItem(SPOTIFY_ACCESS_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

export function loadSpotifyAccessToken(): string {
  try {
    const raw = localStorage.getItem(SPOTIFY_AUTH_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.accessToken) return String(parsed.accessToken).trim();
    }
    return localStorage.getItem(SPOTIFY_ACCESS_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function saveSpotifyAccessToken(token: string): void {
  const cfg = loadSpotifyAuthConfig();
  saveSpotifyAuthConfig({
    ...cfg,
    accessToken: token.trim(),
    expiresAt: token.trim() ? Date.now() + 3600 * 1000 : 0,
    deviceAppConnected: true,
  });
}

function generateRandomVerifier(length = 64): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += possible[randomValues[i] % possible.length];
  }
  return result;
}

async function computeCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getSpotifyRedirectUri(): string {
  if (typeof window === 'undefined') return 'https://hemmahosf.web.app/api/oauth/callback';
  return `${window.location.origin}/api/oauth/callback`;
}

export function openSpotifyWebLoginPopup(onClosed?: () => void): void {
  const popup = window.open(
    'https://accounts.spotify.com/sv/login?continue=' +
      encodeURIComponent('https://open.spotify.com'),
    'hem_spotify_login',
    'width=480,height=680,menubar=no,toolbar=no,location=yes,status=no'
  );
  if (!popup) {
    // Fallback if popup blocked
    launchPlaylistInSpotifyApp(DEFAULT_SPOTIFY_PLAYLISTS[0]);
    return;
  }
  const cfg = loadSpotifyAuthConfig();
  saveSpotifyAuthConfig({ ...cfg, deviceAppConnected: true });
  const timer = setInterval(() => {
    if (popup.closed) {
      clearInterval(timer);
      if (onClosed) onClosed();
    }
  }, 800);
}

export async function startSpotifyPkceLogin(
  clientIdInput: string
): Promise<{ ok: boolean; error?: string }> {
  const envClientId =
    (import.meta as any).env?.VITE_SPOTIFY_CLIENT_ID || '';
  const clientId = (clientIdInput || envClientId).trim();
  if (!clientId) {
    throw new Error(
      'Ange ditt Spotify Client ID i fältet eller använd direktkopplingen till Spotify-appen ovan.'
    );
  }

  const cfg = loadSpotifyAuthConfig();
  saveSpotifyAuthConfig({ ...cfg, clientId, deviceAppConnected: true });

  const verifier = generateRandomVerifier(64);
  localStorage.setItem(SPOTIFY_PKCE_VERIFIER_KEY, verifier);
  localStorage.setItem('vn_spotify_pending_screensaver_v1', '1');

  const challenge = await computeCodeChallenge(verifier);
  const redirectUri = getSpotifyRedirectUri();
  const scopes = [
    'user-read-playback-state',
    'user-read-currently-playing',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: scopes,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  // Try popup OAuth first so it works inside iframes and without losing state
  const popup = window.open(
    authUrl,
    'hem_spotify_oauth',
    'width=520,height=700,menubar=no,toolbar=no,location=yes,status=no'
  );

  if (!popup) {
    // Fallback to top-level navigation if popup blocked
    window.location.href = authUrl;
    return { ok: true };
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = async (code: string, errStr?: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (errStr || !code) {
        resolve({ ok: false, error: errStr || 'Spotify-inloggningen avbröts.' });
        return;
      }
      const res = await exchangeSpotifyCodeDirect(code, clientId, verifier, redirectUri);
      resolve({ ok: res.exchanged, error: res.error });
    };

    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'HEM_OAUTH_CALLBACK') {
        finish(String(e.data.code || ''), String(e.data.error || ''));
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'vn_oauth_popup_result_v1' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.type === 'HEM_OAUTH_CALLBACK') {
            finish(String(parsed.code || ''), String(parsed.error || ''));
          }
        } catch {
          // Ignore
        }
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('hem_oauth_channel');
        bc.onmessage = (ev) => {
          if (ev.data && ev.data.type === 'HEM_OAUTH_CALLBACK') {
            finish(String(ev.data.code || ''), String(ev.data.error || ''));
          }
        };
      }
    } catch {
      // Ignore
    }

    const timer = setInterval(() => {
      if (popup.closed && !settled) {
        finish('', 'Inloggningsfönstret stängdes.');
      }
    }, 800);

    const cleanup = () => {
      clearInterval(timer);
      window.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
      if (bc) {
        try {
          bc.close();
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);
  });
}

async function exchangeSpotifyCodeDirect(
  code: string,
  clientId: string,
  verifier: string,
  redirectUri: string
): Promise<{ exchanged: boolean; error?: string }> {
  try {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();
    localStorage.removeItem(SPOTIFY_PKCE_VERIFIER_KEY);

    if (!res.ok || !data.access_token) {
      return {
        exchanged: false,
        error: data?.error_description || 'Kunde inte hämta Spotify-token.',
      };
    }

    const cfg = loadSpotifyAuthConfig();
    saveSpotifyAuthConfig({
      clientId,
      accessToken: String(data.access_token),
      refreshToken: String(data.refresh_token || cfg.refreshToken || ''),
      expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
      deviceAppConnected: true,
    });

    return { exchanged: true };
  } catch (err: any) {
    return {
      exchanged: false,
      error: err?.message || 'Nätverksfel vid Spotify-inloggning.',
    };
  }
}

export async function exchangeSpotifyCodeIfPresent(): Promise<{
  exchanged: boolean;
  error?: string;
}> {
  if (typeof window === 'undefined') return { exchanged: false };
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');
  const verifier = localStorage.getItem(SPOTIFY_PKCE_VERIFIER_KEY);

  if (!code || !verifier) {
    return { exchanged: false };
  }

  if (errorParam) {
    localStorage.removeItem(SPOTIFY_PKCE_VERIFIER_KEY);
    return { exchanged: false, error: `Spotify nekade inloggning: ${errorParam}` };
  }

  const cfg = loadSpotifyAuthConfig();
  if (!cfg.clientId) {
    return { exchanged: false, error: 'Saknar Spotify Client ID vid kodutbyte.' };
  }

  // Clean URL params
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState({}, document.title, url.pathname + url.search);

  return exchangeSpotifyCodeDirect(code, cfg.clientId, verifier, getSpotifyRedirectUri());
}

export async function getValidSpotifyAccessToken(): Promise<string> {
  const cfg = loadSpotifyAuthConfig();
  if (!cfg.accessToken) return '';

  if (
    cfg.refreshToken &&
    cfg.clientId &&
    cfg.expiresAt > 0 &&
    Date.now() > cfg.expiresAt - 120 * 1000
  ) {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: cfg.refreshToken,
        client_id: cfg.clientId,
      });
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.access_token) {
          const updated: SpotifyAuthConfig = {
            clientId: cfg.clientId,
            accessToken: String(data.access_token),
            refreshToken: String(data.refresh_token || cfg.refreshToken),
            expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
            deviceAppConnected: true,
          };
          saveSpotifyAuthConfig(updated);
          return updated.accessToken;
        }
      }
    } catch {
      // Ignore network error, return existing token
    }
  }

  return cfg.accessToken;
}

// ============================================================================
// ANDROID NATIVE BRIDGE (MediaSessionManager + SpotifyBroadcastReceiver)
// ============================================================================

function getNativeMediaBridge(): {
  sendMediaControl?: (cmd: string) => boolean;
  isDeviceMusicPlaying?: () => boolean;
  getSpotifyNowPlayingJson?: () => string;
  isSpotifyInstalled?: () => boolean;
  isMediaNotificationAccessGranted?: () => boolean;
  openMediaNotificationAccessSettings?: () => boolean;
  fetchUrlHtml?: (url: string) => string;
  launchExternalApp?: (pkg: string, fallbackUrl: string) => boolean;
  getAvailableMediaOutputDevicesJson?: () => string;
  scanNetworkCastDevicesJson?: () => string;
  getNetworkCastNowPlayingJson?: () => string;
  sendCastControlCommand?: (ipOrId: string, cmd: string, value: number) => boolean;
  selectMediaOutputDevice?: (deviceId: string) => boolean;
  setMediaOutputVolume?: (volumePercent: number) => boolean;
  openSystemMediaOutputSwitcher?: () => boolean;
  openGoogleHomeApp?: () => boolean;
} | null {
  try {
    const w = window as unknown as {
      HemNativeBridge?: {
        sendMediaControl?: (cmd: string) => boolean;
        isDeviceMusicPlaying?: () => boolean;
        getSpotifyNowPlayingJson?: () => string;
        isSpotifyInstalled?: () => boolean;
        isMediaNotificationAccessGranted?: () => boolean;
        openMediaNotificationAccessSettings?: () => boolean;
        fetchUrlHtml?: (url: string) => string;
        launchExternalApp?: (pkg: string, fallbackUrl: string) => boolean;
        getAvailableMediaOutputDevicesJson?: () => string;
        scanNetworkCastDevicesJson?: () => string;
        getNetworkCastNowPlayingJson?: () => string;
        sendCastControlCommand?: (ipOrId: string, cmd: string, value: number) => boolean;
        selectMediaOutputDevice?: (deviceId: string) => boolean;
        setMediaOutputVolume?: (volumePercent: number) => boolean;
        openSystemMediaOutputSwitcher?: () => boolean;
        openGoogleHomeApp?: () => boolean;
      };
    };
    return w.HemNativeBridge || null;
  } catch {
    return null;
  }
}

export function getAndroidSpotifyAppStatus(): {
  isAndroidNative: boolean;
  spotifyInstalled: boolean;
  mediaAccessGranted: boolean;
} {
  const bridge = getNativeMediaBridge();
  if (!bridge) {
    return {
      isAndroidNative: false,
      spotifyInstalled: false,
      mediaAccessGranted: false,
    };
  }
  let spotifyInstalled = true;
  let mediaAccessGranted = true;
  try {
    if (typeof bridge.isSpotifyInstalled === 'function') {
      spotifyInstalled = Boolean(bridge.isSpotifyInstalled());
    }
    if (typeof bridge.isMediaNotificationAccessGranted === 'function') {
      mediaAccessGranted = Boolean(bridge.isMediaNotificationAccessGranted());
    }
  } catch {
    // Ignore
  }
  return {
    isAndroidNative: true,
    spotifyInstalled,
    mediaAccessGranted,
  };
}

export function openAndroidSpotifyMediaAccessSettings(): boolean {
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.openMediaNotificationAccessSettings === 'function') {
      return Boolean(bridge.openMediaNotificationAccessSettings());
    }
  } catch {
    // Ignore
  }
  return false;
}

export function connectDirectlyToSpotifyAppOnDevice(
  playlist?: SpotifyPlaylistItem
): {
  connected: boolean;
  openedSettings?: boolean;
  message: string;
} {
  const cfg = loadSpotifyAuthConfig();
  saveSpotifyAuthConfig({ ...cfg, deviceAppConnected: true });

  const status = getAndroidSpotifyAppStatus();
  if (status.isAndroidNative) {
    if (!status.mediaAccessGranted) {
      openAndroidSpotifyMediaAccessSettings();
      return {
        connected: true,
        openedSettings: true,
        message:
          'Aktivera "Hem" i listan som öppnades så läser skärmsläckaren automatiskt vilken låt som spelas i Spotify-appen på din telefon/surfplatta!',
      };
    }
    if (playlist) {
      launchPlaylistInSpotifyApp(playlist);
    }
    return {
      connected: true,
      message:
        'Direktkopplad till Spotify-appen på denna enhet! Låt, artist och styrning synkas nu automatiskt.',
    };
  }

  // On mobile/tablet browser or desktop: launch Spotify app via URI/Intent
  if (playlist) {
    launchPlaylistInSpotifyApp(playlist);
  }
  return {
    connected: true,
    message:
      'Spotify-appen öppnad! Du kan även trycka på "Logga in på Spotify i spelaren" för att spela direkt i skärmsläckaren.',
  };
}

export function getNativeSpotifyNowPlaying(): SpotifyNowPlaying | null {
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.getSpotifyNowPlayingJson === 'function') {
      const raw = bridge.getSpotifyNowPlayingJson();
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const pState = String(parsed?.playerState || '').toUpperCase();
      const hasSession =
        Boolean(parsed?.isPlaying) ||
        Boolean(parsed?.hasMediaSession) ||
        pState === 'PAUSED';
      if (
        parsed &&
        hasSession &&
        parsed.trackTitle &&
        String(parsed.trackTitle).trim().length > 0
      ) {
        const isCast = Boolean(parsed.isCast);
        const isPlayingNow = Boolean(parsed.isPlaying) && pState !== 'PAUSED';
        const resolvedIp = parsed.deviceIp || parsed.ip;
        const resolvedId = parsed.deviceId || parsed.id;
        return {
          isPlaying: isPlayingNow,
          trackTitle: String(parsed.trackTitle),
          artistName: String(parsed.artistName || ''),
          albumArtUrl: parsed.albumArtUrl ? String(parsed.albumArtUrl) : undefined,
          progressMs: Number(parsed.progressMs || 0),
          durationMs: Number(parsed.durationMs || 0),
          volumePercent:
            typeof parsed.volumePercent === 'number' ? parsed.volumePercent : undefined,
          deviceName: String(
            parsed.deviceName || (isCast ? 'Google TV Streamer' : 'Denna enhet')
          ),
          deviceId: resolvedId ? String(resolvedId) : undefined,
          deviceIp: resolvedIp ? String(resolvedIp) : undefined,
          appName: parsed.appName ? String(parsed.appName) : undefined,
          isCast,
          mediaType: parsed.mediaType === 'video' ? 'video' : 'audio',
          spotifyUri: parsed.spotifyUri ? String(parsed.spotifyUri) : undefined,
          source: isCast ? 'google-cast' : 'android-broadcast',
        };
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

export async function getNetworkCastNowPlaying(): Promise<SpotifyNowPlaying | null> {
  // 1. Check Native Android CastV2 port 8009 / NSD / MediaSession scanner
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.getNetworkCastNowPlayingJson === 'function') {
      const raw = bridge.getNetworkCastNowPlayingJson();
      if (raw) {
        const parsed = JSON.parse(raw);
        const pState = String(parsed?.playerState || '').toUpperCase();
        const hasSession =
          Boolean(parsed?.isPlaying) ||
          Boolean(parsed?.hasMediaSession) ||
          pState === 'PAUSED';
        if (
          parsed &&
          hasSession &&
          parsed.trackTitle &&
          String(parsed.trackTitle).trim().length > 0
        ) {
          const isCast = parsed.isCast !== false;
          const isPlayingNow = Boolean(parsed.isPlaying) && pState !== 'PAUSED';
          const resolvedIp = parsed.deviceIp || parsed.ip;
          const resolvedId = parsed.deviceId || parsed.id;
          return {
            isPlaying: isPlayingNow,
            trackTitle: String(parsed.trackTitle),
            artistName: String(parsed.artistName || parsed.appName || ''),
            albumArtUrl: parsed.albumArtUrl ? String(parsed.albumArtUrl) : undefined,
            deviceName: String(parsed.deviceName || parsed.name || 'Google TV Streamer'),
            deviceId: resolvedId ? String(resolvedId) : undefined,
            deviceIp: resolvedIp ? String(resolvedIp) : undefined,
            appName: String(parsed.appName || 'Google Cast'),
            isCast,
            mediaType: parsed.mediaType === 'audio' ? 'audio' : 'video',
            progressMs: Number(parsed.progressMs || 0),
            durationMs: Number(parsed.durationMs || 0),
            volumePercent:
              typeof parsed.volumePercent === 'number' ? parsed.volumePercent : undefined,
            source: isCast ? 'google-cast' : 'android-broadcast',
          };
        }
      }
    }
  } catch {
    // Ignore
  }

  // 2. Check Chrome / Chromebook Web Cast Sender SDK if active in browser
  try {
    const w = window as any;
    const castCtx = w?.cast?.framework?.CastContext?.getInstance?.();
    const session = castCtx?.getCurrentSession?.();
    if (session) {
      const media = session.getMediaSession?.();
      const devName = session.getCastDevice?.()?.friendlyName || 'Google TV Streamer';
      if (
        media &&
        (media.playerState === 'PLAYING' ||
          media.playerState === 'BUFFERING' ||
          media.playerState === 'PAUSED')
      ) {
        const meta = media.media?.metadata || {};
        const isPlayingWebCast =
          media.playerState === 'PLAYING' || media.playerState === 'BUFFERING';
        return {
          isPlaying: isPlayingWebCast,
          trackTitle: String(
            meta.title ||
              meta.subtitle ||
              session.getApplicationMetadata?.()?.name ||
              'Cast-uppspelning'
          ),
          artistName: String(
            meta.subtitle ||
              meta.artist ||
              meta.studio ||
              session.getApplicationMetadata?.()?.name ||
              ''
          ),
          albumArtUrl: meta.images?.[0]?.url ? String(meta.images[0].url) : undefined,
          deviceName: String(devName),
          appName: String(session.getApplicationMetadata?.()?.name || 'Google Cast'),
          isCast: true,
          mediaType: 'video',
          progressMs: Math.round(Number(media.getEstimatedTime?.() || 0) * 1000),
          durationMs: Math.round(Number(media.media?.duration || 0) * 1000),
          source: 'google-cast',
        };
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

function parseEmbedHtmlForTracks(html: string): {
  name?: string;
  coverUrl?: string;
  tracks: SpotifyTrackItem[];
  isNotFound?: boolean;
} | null {
  try {
    if (!html || html.length < 30) return null;

    const isPageNotFound =
      html.includes('>Page not found<') ||
      html.includes('We can’t seem to find the page you are looking for') ||
      html.includes("We can't seem to find the page you are looking for");

    const parseEntityToResult = (entity: any) => {
      if (!entity) return null;
      const coverUrl =
        entity?.coverArt?.sources?.[0]?.url ||
        entity?.visualIdentity?.image?.[0]?.url ||
        entity?.images?.[0]?.url ||
        '';
      const rawTracks = Array.isArray(entity?.trackList)
        ? entity.trackList
        : Array.isArray(entity?.tracks?.items)
        ? entity.tracks.items
        : entity?.type === 'track' && (entity?.title || entity?.name)
        ? [entity]
        : [];
      const tracks: SpotifyTrackItem[] = rawTracks
        .map((item: any) => item?.track || item?.itemV2?.data || item)
        .filter((t: any) => t && (t.title || t.name))
        .slice(0, 500)
        .map((t: any) => ({
          uri: String(t.uri || ''),
          title: String(t.title || t.name || '').replace(/\u00a0/g, ' ').trim(),
          artist: String(
            t.subtitle ||
              (Array.isArray(t.artists?.items)
                ? t.artists.items
                    .map((a: any) => a?.profile?.name || a?.name || '')
                    .filter(Boolean)
                    .join(', ')
                : Array.isArray(t.artists)
                ? t.artists.map((a: any) => a?.name || '').filter(Boolean).join(', ')
                : '')
          )
            .replace(/\u00a0/g, ' ')
            .trim(),
          durationMs: Number(
            t.duration ||
              t.duration_ms ||
              t.trackDuration?.totalMilliseconds ||
              180000
          ),
          albumArtUrl: coverUrl || undefined,
          audioPreviewUrl: t.audioPreview?.url
            ? String(t.audioPreview.url)
            : t.preview_url
            ? String(t.preview_url)
            : undefined,
        }));
      const rawName = entity?.name || entity?.title;
      return {
        name: rawName ? String(rawName).replace(/\u00a0/g, ' ').trim() : undefined,
        coverUrl: coverUrl || undefined,
        tracks,
      };
    };

    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (m && m[1]) {
      const json = JSON.parse(m[1]);
      const status = json?.props?.pageProps?.status;
      const entity =
        json?.props?.pageProps?.state?.data?.entity ||
        json?.props?.pageProps?.state?.data?.default?.entity;
      const res = parseEntityToResult(entity);
      if (res && (res.tracks.length > 0 || res.name)) return res;
      if (status === 404 || status === 403 || status === 500) {
        return { tracks: [], isNotFound: true };
      }
    }

    const initMatch = html.match(
      /<script id="initial-state"[^>]*>([\s\S]*?)<\/script>/i
    );
    if (initMatch && initMatch[1]) {
      const decoded = atob(initMatch[1].trim());
      const json = JSON.parse(decoded);
      const entities = json?.entities?.items || {};
      for (const key of Object.keys(entities)) {
        const res = parseEntityToResult(entities[key]);
        if (res && res.tracks.length > 0) return res;
      }
    }

    if (isPageNotFound) {
      return { tracks: [], isNotFound: true };
    }

    return null;
  } catch {
    return null;
  }
}

function parseJinaMarkdownForTracks(markdown: string): {
  name?: string;
  coverUrl?: string;
  tracks: SpotifyTrackItem[];
  isNotFound?: boolean;
} | null {
  try {
    if (!markdown || markdown.length < 40) return null;
    if (
      markdown.includes('Page not found') &&
      markdown.includes('find the page you are looking for')
    ) {
      return { tracks: [], isNotFound: true };
    }
    const titleMatch = markdown.match(/^Title:\s*(.+?)(?:\s*-\s*playlist.*|\s*\|\s*Spotify.*|\s*-\s*Spotify.*)?$/im);
    const imgMatch = markdown.match(/!\[[^\]]*\]\((https:\/\/i\.scdn\.co\/[^)\s]+|https:\/\/mosaic\.scdn\.co\/[^)\s]+|https:\/\/image-cdn-[^)\s]+)\)/i);
    const tracks: SpotifyTrackItem[] = [];

    // Format 1: Jina numbered headings
    const entryRegex =
      /\d+\.\s+###\s+([^\r\n]+)[\r\n]+####\s+([^\r\n]+?)(?:[\r\n\s]+(\d{1,2}):(\d{2}))?(?=[\r\n]|$)/g;
    let m: RegExpExecArray | null;
    let idx = 0;
    while ((m = entryRegex.exec(markdown)) !== null && idx < 500) {
      const title = m[1].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\u00a0/g, ' ').trim();
      let artist = m[2].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\u00a0/g, ' ').trim();
      let durationMs = 180000;
      if (m[3] && m[4]) {
        durationMs = (Number(m[3]) * 60 + Number(m[4])) * 1000;
      } else {
        const trailingTime = artist.match(/^(.*?)\s*(\d{1,2}):(\d{2})$/);
        if (trailingTime) {
          artist = trailingTime[1].trim();
          durationMs =
            (Number(trailingTime[2]) * 60 + Number(trailingTime[3])) * 1000;
        }
      }
      if (title) {
        tracks.push({
          uri: `spotify:search:${encodeURIComponent(`${title} ${artist}`)}`,
          title,
          artist,
          durationMs,
          albumArtUrl: imgMatch?.[1],
        });
        idx++;
      }
    }

    // Format 2: Markdown track links [Song Title](https://open.spotify.com/track/ID)
    if (tracks.length === 0) {
      const trackLinkRegex =
        /\[([^\]]+)\]\(https?:\/\/open\.spotify\.com\/(?:intl-[a-zA-Z-]+\/)?track\/([a-zA-Z0-9]+)[^)]*\)(?:[\s\r\n]+(?:\[([^\]]+)\]\(https?:\/\/open\.spotify\.com\/(?:intl-[a-zA-Z-]+\/)?artist\/[^)]+\)|([^\r\n[\]]+)))?/g;
      let tm: RegExpExecArray | null;
      const seenTrackIds = new Set<string>();
      while ((tm = trackLinkRegex.exec(markdown)) !== null && tracks.length < 500) {
        const rawTitle = tm[1].replace(/\u00a0/g, ' ').trim();
        const trackId = tm[2];
        const rawArtist = (tm[3] || tm[4] || '').replace(/\u00a0/g, ' ').trim();
        if (!rawTitle || seenTrackIds.has(trackId)) continue;
        seenTrackIds.add(trackId);
        tracks.push({
          uri: `spotify:track:${trackId}`,
          title: rawTitle,
          artist: rawArtist || 'Spotify',
          durationMs: 180000,
          albumArtUrl: imgMatch?.[1],
        });
      }
    }

    if (tracks.length === 0) return null;
    return {
      name: titleMatch?.[1]?.trim(),
      coverUrl: imgMatch?.[1],
      tracks,
    };
  } catch {
    return null;
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5500
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSpotifyPlaylistMetadata(
  playlist: SpotifyPlaylistItem
): Promise<SpotifyPlaylistItem> {
  // Yield a macrotask so UI updates/animations never wait for metadata extraction
  await new Promise((resolve) => setTimeout(resolve, 16));

  if (playlist.spotifyUri === 'spotify:collection:tracks') {
    return {
      ...playlist,
      embedUnavailable: true,
    };
  }

  const m = playlist.spotifyUri.match(
    /spotify:(playlist|album|track|artist|show):([a-zA-Z0-9]+)/i
  );
  const entityType = m ? m[1].toLowerCase() : 'playlist';
  const entityId = m ? m[2] : '';

  const ptMatch =
    playlist.ptToken ||
    playlist.deepLink?.match(/[?&]pt=([a-zA-Z0-9_-]+)/i)?.[1] ||
    playlist.embedUrl?.match(/[?&]pt=([a-zA-Z0-9_-]+)/i)?.[1];
  const ptQuery = ptMatch ? `?pt=${encodeURIComponent(ptMatch)}` : '';

  let detectedNotFound = false;

  const applyEnriched = (
    name: string | undefined,
    coverUrl: string | undefined,
    tracks: SpotifyTrackItem[],
    embedUnavailable?: boolean
  ): SpotifyPlaylistItem => {
    const cleanName = name ? name.replace(/\u00a0/g, ' ').trim() : '';
    const shouldReplaceName =
      cleanName &&
      cleanName !== 'Page not found' &&
      (!playlist.name ||
        playlist.name === 'Min Spellista' ||
        playlist.name === 'Egen spellista');
    const updatedTracks = tracks.map((t) => ({
      ...t,
      albumArtUrl: t.albumArtUrl || coverUrl || playlist.coverUrl,
    }));
    const finalTracks = updatedTracks.length > 0 ? updatedTracks : playlist.tracks || [];
    return {
      ...playlist,
      name: shouldReplaceName ? cleanName : playlist.name,
      subtitle:
        finalTracks.length > 0 &&
        (!playlist.subtitle ||
          playlist.subtitle === 'Egen spellista' ||
          /^\d+\s+låtar$/i.test(playlist.subtitle))
          ? `${finalTracks.length} låtar`
          : playlist.subtitle,
      coverUrl: coverUrl || playlist.coverUrl,
      tracks: finalTracks,
      embedUnavailable:
        finalTracks.length > 0
          ? false
          : embedUnavailable ?? playlist.embedUnavailable,
    };
  };

  // 0. If running inside Android native app, use HemNativeBridge.fetchUrlHtml directly (zero CORS restrictions!)
  if (entityId) {
    const embedPageUrl = `https://open.spotify.com/embed/${entityType}/${entityId}${ptQuery}`;
    const publicPageUrl = `https://open.spotify.com/${entityType}/${entityId}${ptQuery}`;
    try {
      const bridge = getNativeMediaBridge();
      if (bridge && typeof bridge.fetchUrlHtml === 'function') {
        const rawHtml = bridge.fetchUrlHtml(embedPageUrl);
        const parsedNative = rawHtml ? parseEmbedHtmlForTracks(rawHtml) : null;
        if (parsedNative?.isNotFound) {
          detectedNotFound = true;
        }
        if (parsedNative && parsedNative.tracks.length > 0) {
          return applyEnriched(
            parsedNative.name,
            parsedNative.coverUrl,
            parsedNative.tracks,
            false
          );
        }
        const rawPublicHtml = bridge.fetchUrlHtml(publicPageUrl);
        const parsedPublic = rawPublicHtml
          ? parseEmbedHtmlForTracks(rawPublicHtml) || parseJinaMarkdownForTracks(rawPublicHtml)
          : null;
        if (parsedPublic && parsedPublic.tracks.length > 0) {
          return applyEnriched(
            parsedPublic.name,
            parsedPublic.coverUrl,
            parsedPublic.tracks,
            false
          );
        }
      }
    } catch {
      // Fall through to web fetchers
    }
  }

  // 1. If user has a valid Spotify Web API token and this is a playlist, try official Spotify API (works for Private playlists too!)
  if (entityId && entityType === 'playlist') {
    try {
      const token = await getValidSpotifyAccessToken();
      if (token) {
        const apiRes = await fetchWithTimeout(
          `https://api.spotify.com/v1/playlists/${entityId}`,
          { headers: { Authorization: `Bearer ${token}` } },
          4000
        );
        if (apiRes.ok) {
          const data = await apiRes.json();
          const items = Array.isArray(data?.tracks?.items) ? data.tracks.items : [];
          const apiTracks: SpotifyTrackItem[] = items
            .map((it: any) => it?.track)
            .filter((tr: any) => tr && tr.name)
            .map((tr: any) => ({
              uri: String(tr.uri || ''),
              title: String(tr.name || '').trim(),
              artist: Array.isArray(tr.artists)
                ? tr.artists.map((a: any) => a.name).join(', ')
                : '',
              durationMs: Number(tr.duration_ms || 180000),
              albumArtUrl: tr.album?.images?.[0]?.url || data?.images?.[0]?.url,
              audioPreviewUrl: tr.preview_url ? String(tr.preview_url) : undefined,
            }));
          if (apiTracks.length > 0) {
            return applyEnriched(
              data?.name ? String(data.name) : undefined,
              data?.images?.[0]?.url,
              apiTracks,
              false
            );
          }
        }
      }
    } catch {
      // Fall through to embed extractors
    }
  }

  // 2. Universal CORS-enabled HTML & Markdown readers + Spotify oEmbed
  if (entityId) {
    const embedPageUrl = `https://open.spotify.com/embed/${entityType}/${entityId}${ptQuery}`;
    const publicPageUrl = `https://open.spotify.com/${entityType}/${entityId}${ptQuery}`;
    try {
      const oembedPromise = fetchWithTimeout(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(
          publicPageUrl
        )}`,
        {},
        3500
      )
        .then((r) => {
          if (r.status === 404 || r.status === 400) {
            detectedNotFound = true;
            return null;
          }
          return r.ok ? r.json() : null;
        })
        .catch(() => null);

      const fetchCandidateParsed = async (
        url: string,
        isMarkdown = false
      ) => {
        const res = await fetchWithTimeout(url, {}, 5500);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        const parsed = isMarkdown
          ? parseJinaMarkdownForTracks(text) || parseEmbedHtmlForTracks(text)
          : parseEmbedHtmlForTracks(text) || parseJinaMarkdownForTracks(text);
        if (parsed?.isNotFound) {
          detectedNotFound = true;
        }
        if (!parsed || parsed.tracks.length === 0) {
          throw new Error('No tracks parsed');
        }
        return parsed;
      };

      const [bestParsed, oembedData] = await Promise.all([
        Promise.any([
          fetchCandidateParsed(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(embedPageUrl)}`
          ),
          fetchCandidateParsed(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(publicPageUrl)}`
          ),
          fetchCandidateParsed(
            `https://corsproxy.io/?${encodeURIComponent(embedPageUrl)}`
          ),
          fetchCandidateParsed(`https://r.jina.ai/${publicPageUrl}`, true),
        ]).catch(() => null),
        oembedPromise,
      ]);

      if (bestParsed && bestParsed.tracks.length > 0) {
        return applyEnriched(
          bestParsed.name || oembedData?.title,
          bestParsed.coverUrl || oembedData?.thumbnail_url,
          bestParsed.tracks,
          false
        );
      }

      if (oembedData?.title || oembedData?.thumbnail_url) {
        return applyEnriched(
          oembedData.title ? String(oembedData.title) : undefined,
          oembedData.thumbnail_url ? String(oembedData.thumbnail_url) : undefined,
          playlist.tracks || [],
          detectedNotFound
        );
      }
    } catch {
      // Ignore
    }
  }

  // 3. Express server endpoint (/api/spotify-embed-info)
  try {
    const res = await fetchWithTimeout(
      getApiUrl(
        `/api/spotify-embed-info?uri=${encodeURIComponent(playlist.spotifyUri)}`
      ),
      {},
      3500
    );
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
        return applyEnriched(data.name, data.coverUrl, data.tracks, false);
      }
    }
  } catch {
    // Ignore
  }

  if (detectedNotFound && (!playlist.tracks || playlist.tracks.length === 0)) {
    return {
      ...playlist,
      embedUnavailable: true,
    };
  }

  return playlist;
}

export async function resolvePlayableAudioUrlForTrack(
  track: SpotifyTrackItem,
  fallbackCoverUrl?: string
): Promise<{ audioUrl?: string; albumArtUrl?: string }> {
  if (track.audioPreviewUrl) {
    return {
      audioUrl: track.audioPreviewUrl,
      albumArtUrl: track.albumArtUrl || fallbackCoverUrl,
    };
  }

  const trackMatch = track.uri.match(/spotify:track:([a-zA-Z0-9]+)/i);
  if (trackMatch) {
    const trackId = trackMatch[1];
    const trackEmbedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    try {
      const bridge = getNativeMediaBridge();
      if (bridge && typeof bridge.fetchUrlHtml === 'function') {
        const html = bridge.fetchUrlHtml(trackEmbedUrl);
        const parsed = html ? parseEmbedHtmlForTracks(html) : null;
        if (parsed?.tracks?.[0]?.audioPreviewUrl) {
          return {
            audioUrl: parsed.tracks[0].audioPreviewUrl,
            albumArtUrl: parsed.coverUrl || track.albumArtUrl || fallbackCoverUrl,
          };
        }
      }
    } catch {
      // Ignore
    }

    try {
      const res = await fetchWithTimeout(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(trackEmbedUrl)}`,
        {},
        4500
      );
      if (res.ok) {
        const html = await res.text();
        const parsed = parseEmbedHtmlForTracks(html);
        if (parsed?.tracks?.[0]?.audioPreviewUrl) {
          return {
            audioUrl: parsed.tracks[0].audioPreviewUrl,
            albumArtUrl: parsed.coverUrl || track.albumArtUrl || fallbackCoverUrl,
          };
        }
      }
    } catch {
      // Ignore
    }
  }

  // Fallback: CORS-friendly iTunes audio stream search for the exact track title + artist
  try {
    const q = `${track.title} ${track.artist}`.trim();
    if (q) {
      const itunesRes = await fetchWithTimeout(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          q
        )}&entity=song&limit=1`,
        {},
        4000
      );
      if (itunesRes.ok) {
        const data = await itunesRes.json();
        const item = data?.results?.[0];
        if (item?.previewUrl) {
          const hiResArt = item.artworkUrl100
            ? String(item.artworkUrl100).replace('100x100bb', '600x600bb')
            : undefined;
          return {
            audioUrl: String(item.previewUrl),
            albumArtUrl: hiResArt || track.albumArtUrl || fallbackCoverUrl,
          };
        }
      }
    }
  } catch {
    // Ignore
  }

  return {
    audioUrl: undefined,
    albumArtUrl: track.albumArtUrl || fallbackCoverUrl,
  };
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

export function launchPlaylistInSpotifyApp(
  playlist: SpotifyPlaylistItem,
  trackUriOverride?: string
): void {
  const targetUri = trackUriOverride || playlist.spotifyUri;
  const bridge = getNativeMediaBridge();
  if (bridge && typeof bridge.launchExternalApp === 'function') {
    const launched = bridge.launchExternalApp(
      'com.spotify.music',
      targetUri || playlist.deepLink
    );
    if (launched) return;
  }

  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '')) {
    const fallback = encodeURIComponent(playlist.deepLink || 'https://open.spotify.com');
    const pathPart = targetUri.replace(/^spotify:/i, '').replace(/:/g, '/');
    const intentHref = `intent://${pathPart}#Intent;scheme=spotify;package=com.spotify.music;S.browser_fallback_url=${fallback};end`;
    const a = document.createElement('a');
    a.href = intentHref;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {
        // Ignore
      }
    }, 500);
    return;
  }

  const uri = targetUri || `spotify://`;
  window.location.href = uri;
}

export async function fetchSpotifyConnectNowPlaying(
  tokenOverride?: string
): Promise<{ state: SpotifyNowPlaying | null; tokenExpired?: boolean }> {
  const token = tokenOverride || (await getValidSpotifyAccessToken());
  if (!token) return { state: null };
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      return { state: null, tokenExpired: true };
    }
    if (res.status === 204 || !res.ok) {
      return { state: null };
    }
    const data = await res.json();
    if (!data || !data.item || (!data.is_playing && !data.device?.is_active)) {
      return { state: null };
    }
    const item = data.item;
    const rawDevType = String(data.device?.type || '').toLowerCase();
    const isCastTv = rawDevType.includes('tv') || rawDevType.includes('cast');
    return {
      state: {
        isPlaying: Boolean(data.is_playing),
        trackTitle: String(item.name || ''),
        artistName: Array.isArray(item.artists)
          ? item.artists.map((a: any) => a.name).join(', ')
          : '',
        albumArtUrl: item.album?.images?.[0]?.url,
        deviceName: data.device?.name,
        deviceId: data.device?.id,
        appName: 'Spotify',
        isCast: isCastTv,
        mediaType: 'audio',
        progressMs: Number(data.progress_ms || 0),
        durationMs: Number(item.duration_ms || 0),
        volumePercent: data.device?.volume_percent,
        spotifyUri: item.uri,
        source: 'spotify-connect',
      },
    };
  } catch {
    return { state: null };
  }
}

export async function fetchUserSpotifyPlaylists(
  tokenOverride?: string
): Promise<SpotifyPlaylistItem[]> {
  const token = tokenOverride || (await getValidSpotifyAccessToken());
  if (!token) return [];
  try {
    const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=25', {
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
        coverUrl: it.images?.[0]?.url,
        isCustom: true,
      }));
  } catch {
    return [];
  }
}

export async function sendSpotifyConnectCommand(
  tokenOverride: string | undefined,
  action: 'play' | 'pause' | 'next' | 'prev' | 'play-uri' | 'volume',
  contextUriOrVolume?: string | number,
  parentPlaylistContextUri?: string
): Promise<boolean> {
  const token = tokenOverride || (await getValidSpotifyAccessToken());
  if (!token) return false;
  try {
    if (action === 'play-uri' && typeof contextUriOrVolume === 'string') {
      const isTrack = contextUriOrVolume.startsWith('spotify:track:');
      const body =
        isTrack &&
        parentPlaylistContextUri &&
        parentPlaylistContextUri.startsWith('spotify:playlist:')
          ? {
              context_uri: parentPlaylistContextUri,
              offset: { uri: contextUriOrVolume },
            }
          : isTrack
          ? { uris: [contextUriOrVolume] }
          : { context_uri: contextUriOrVolume };
      const res = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      return res.ok || res.status === 204;
    }
    if (action === 'volume' && typeof contextUriOrVolume === 'number') {
      const vol = Math.max(0, Math.min(100, Math.round(contextUriOrVolume)));
      const res = await fetch(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${vol}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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

export interface SpotifyConnectDevice {
  id: string;
  name: string;
  type: 'Speaker' | 'TV' | 'CastAudio' | 'CastVideo' | 'Computer' | 'Smartphone' | 'Tablet' | 'Group';
  isActive: boolean;
  volumePercent: number;
  supportsVolume: boolean;
  source: 'spotify-connect' | 'google-cast' | 'local-network';
  ip?: string;
  statusText?: string;
}

export async function fetchSpotifyConnectDevices(
  tokenOverride?: string
): Promise<SpotifyConnectDevice[]> {
  const results: SpotifyConnectDevice[] = [];

  // 1. Check Native Android MediaRouter / NSD / Cast cache first if available
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.getAvailableMediaOutputDevicesJson === 'function') {
      const rawJson = bridge.getAvailableMediaOutputDevicesJson();
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed)) {
          for (const d of parsed) {
            if (d && d.name) {
              results.push({
                id: String(d.id || `cast-${d.name}`),
                name: String(d.name),
                type: d.type === 'TV' ? 'TV' : 'Speaker',
                isActive: Boolean(d.isActive),
                volumePercent: typeof d.volumePercent === 'number' ? d.volumePercent : 65,
                supportsVolume: true,
                source: 'google-cast',
                ip: d.ip ? String(d.ip) : undefined,
                statusText: d.statusText ? String(d.statusText) : undefined,
              });
            }
          }
        }
      }
    }
  } catch {
    // Ignore
  }

  // 2. Query Spotify Connect Web API (/v1/me/player/devices)
  const token = tokenOverride || (await getValidSpotifyAccessToken());
  if (token) {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.devices)) {
          for (const dev of data.devices) {
            if (!dev || !dev.id || !dev.name) continue;
            const rawType = String(dev.type || '').toLowerCase();
            let mappedType: SpotifyConnectDevice['type'] = 'Speaker';
            if (rawType.includes('tv') || rawType.includes('cast_video')) mappedType = 'TV';
            else if (rawType.includes('computer')) mappedType = 'Computer';
            else if (rawType.includes('smartphone')) mappedType = 'Smartphone';
            else if (rawType.includes('tablet')) mappedType = 'Tablet';

            const existingIdx = results.findIndex(
              (r) => r.name.toLowerCase() === String(dev.name).toLowerCase()
            );
            const item: SpotifyConnectDevice = {
              id: String(dev.id),
              name: String(dev.name),
              type: mappedType,
              isActive: Boolean(dev.is_active),
              volumePercent:
                typeof dev.volume_percent === 'number' ? dev.volume_percent : 70,
              supportsVolume: dev.supports_volume !== false,
              source: 'spotify-connect',
            };
            if (existingIdx >= 0) {
              results[existingIdx] = { ...results[existingIdx], ...item };
            } else {
              results.push(item);
            }
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  return results;
}

export async function scanNetworkCastDevices(
  tokenOverride?: string
): Promise<SpotifyConnectDevice[]> {
  const results: SpotifyConnectDevice[] = [];

  // 1. Trigger active Wi-Fi subnet port 8009 CastV2 + NSD + MediaRouter scan via Android native bridge
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.scanNetworkCastDevicesJson === 'function') {
      const rawJson = bridge.scanNetworkCastDevicesJson();
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed)) {
          for (const d of parsed) {
            if (d && d.name) {
              results.push({
                id: String(d.id || `cast-${d.ip || d.name}`),
                name: String(d.name),
                type: d.type === 'TV' ? 'TV' : 'Speaker',
                isActive: Boolean(d.isActive),
                volumePercent: typeof d.volumePercent === 'number' ? d.volumePercent : 65,
                supportsVolume: true,
                source: 'google-cast',
                ip: d.ip ? String(d.ip) : undefined,
                statusText: d.statusText ? String(d.statusText) : undefined,
              });
            }
          }
        }
      }
    }
  } catch {
    // Ignore
  }

  // 2. Merge with Spotify Connect / MediaRouter devices
  const connectDevs = await fetchSpotifyConnectDevices(tokenOverride);
  for (const cd of connectDevs) {
    const existingIdx = results.findIndex(
      (r) =>
        r.id === cd.id ||
        r.name.trim().toLowerCase() === cd.name.trim().toLowerCase()
    );
    if (existingIdx >= 0) {
      results[existingIdx] = {
        ...results[existingIdx],
        ...cd,
        ip: results[existingIdx].ip || cd.ip,
        statusText: results[existingIdx].statusText || cd.statusText,
      };
    } else {
      results.push(cd);
    }
  }

  return results;
}

export async function sendCastDeviceControl(
  ipOrDeviceId: string | undefined,
  cmd:
    | 'play'
    | 'pause'
    | 'play_pause'
    | 'stop'
    | 'next'
    | 'prev'
    | 'seek'
    | 'volume'
    | 'mute',
  value = 0
): Promise<boolean> {
  // 1. Try Native Android CastV2 port 8009 / MediaSession control first
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.sendCastControlCommand === 'function') {
      const ok = bridge.sendCastControlCommand(ipOrDeviceId || '', cmd, Math.round(value));
      if (ok) return true;
    }
  } catch {
    // Ignore
  }

  // 2. Try Chrome Web Cast Sender session if active
  try {
    const w = window as any;
    const castCtx = w?.cast?.framework?.CastContext?.getInstance?.();
    const session = castCtx?.getCurrentSession?.();
    if (session) {
      if (cmd === 'stop') {
        session.endSession(true);
        return true;
      }
      if (cmd === 'volume') {
        await session.setVolume(Math.max(0, Math.min(1, value / 100)));
        return true;
      }
      if (cmd === 'mute') {
        await session.setMute(Boolean(value));
        return true;
      }
      const media = session.getMediaSession?.();
      if (media) {
        if (cmd === 'play') media.play(null, null, null);
        else if (cmd === 'pause') media.pause(null, null, null);
        else if (cmd === 'play_pause') {
          if (media.playerState === 'PLAYING') media.pause(null, null, null);
          else media.play(null, null, null);
        } else if (cmd === 'seek') {
          const req = new w.chrome.cast.media.SeekRequest();
          req.currentTime = Math.max(0, value / 1000);
          media.seek(req, null, null);
        }
        return true;
      }
    }
  } catch {
    // Ignore
  }

  // 3. Fallback to Android MediaSession / Spotify Connect
  if (cmd === 'play' || cmd === 'pause' || cmd === 'next' || cmd === 'prev') {
    const ok = await sendSpotifyConnectCommand(undefined, cmd);
    if (ok) return true;
    return sendNativeAndroidMediaControl(cmd);
  }
  if (cmd === 'play_pause') {
    return sendNativeAndroidMediaControl('play_pause');
  }
  if (cmd === 'seek') {
    return seekSpotifyConnectPosition(value);
  }
  if (cmd === 'volume') {
    return setSpotifyDeviceVolume(ipOrDeviceId, value);
  }
  return false;
}

export async function transferSpotifyConnectPlayback(
  deviceId: string,
  play = true,
  tokenOverride?: string
): Promise<boolean> {
  // Also notify native Android MediaRouter if it's a native route
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.selectMediaOutputDevice === 'function') {
      bridge.selectMediaOutputDevice(deviceId);
    }
  } catch {
    // Ignore
  }

  const token = tokenOverride || (await getValidSpotifyAccessToken());
  if (!token) return false;
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play,
      }),
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

export async function setSpotifyDeviceVolume(
  deviceId: string | undefined,
  volumePercent: number,
  tokenOverride?: string
): Promise<boolean> {
  const vol = Math.max(0, Math.min(100, Math.round(volumePercent)));
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.setMediaOutputVolume === 'function') {
      bridge.setMediaOutputVolume(vol);
    }
  } catch {
    // Ignore
  }

  const token = tokenOverride || (await getValidSpotifyAccessToken());
  if (!token) return false;
  try {
    const devParam =
      deviceId && !deviceId.startsWith('local-') && !deviceId.startsWith('cast-')
        ? `&device_id=${encodeURIComponent(deviceId)}`
        : '';
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/volume?volume_percent=${vol}${devParam}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

export async function seekSpotifyConnectPosition(
  positionMs: number,
  tokenOverride?: string
): Promise<boolean> {
  const pos = Math.max(0, Math.round(positionMs));
  const token = tokenOverride || (await getValidSpotifyAccessToken());
  if (!token) return false;
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/seek?position_ms=${pos}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

export function openNativeSystemMediaOutputSwitcher(): boolean {
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.openSystemMediaOutputSwitcher === 'function') {
      return Boolean(bridge.openSystemMediaOutputSwitcher());
    }
  } catch {
    // Ignore
  }
  return false;
}

export function openNativeGoogleHomeApp(): boolean {
  try {
    const bridge = getNativeMediaBridge();
    if (bridge && typeof bridge.openGoogleHomeApp === 'function') {
      return Boolean(bridge.openGoogleHomeApp());
    }
    if (bridge && typeof bridge.launchExternalApp === 'function') {
      return Boolean(
        bridge.launchExternalApp(
          'com.google.android.apps.chromecast.app',
          'https://home.google.com'
        )
      );
    }
  } catch {
    // Ignore
  }
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '')) {
    const a = document.createElement('a');
    a.href =
      'intent://#Intent;package=com.google.android.apps.chromecast.app;S.browser_fallback_url=https%3A%2F%2Fhome.google.com;end';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {
        // Ignore
      }
    }, 400);
    return true;
  }
  return false;
}

