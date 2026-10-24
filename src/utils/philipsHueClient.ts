export interface HueRoom {
  id: string;
  name: string;
  type: string;
  on: boolean;
  bri: number; // 1..254
  ct?: number; // 153..500 (color temp mirek)
  lightIds: string[];
  reachable?: boolean;
}

export interface HueLight {
  id: string;
  name: string;
  on: boolean;
  bri: number;
  reachable: boolean;
}

export interface HueConfig {
  bridgeIp: string;
  username: string;
  useDemoMode: boolean;
  lastConnectedAt?: string;
}

export interface ExternalAppShortcut {
  id: string;
  name: string;
  category: string;
  deepLink: string;
  webUrl: string;
  androidPackage?: string;
  accentColor: string;
}

const HUE_CONFIG_KEY = 'vn_philips_hue_config_v1';
const HUE_DEMO_ROOMS_KEY = 'vn_philips_hue_demo_rooms_v1';
const APP_SHORTCUTS_KEY = 'vn_screensaver_app_shortcuts_v1';

const DEFAULT_DEMO_ROOMS: HueRoom[] = [
  {
    id: 'demo-1',
    name: 'Vardagsrum',
    type: 'Room',
    on: true,
    bri: 195,
    ct: 370,
    lightIds: ['1', '2', '3'],
    reachable: true,
  },
  {
    id: 'demo-2',
    name: 'Kök & Matplats',
    type: 'Room',
    on: true,
    bri: 230,
    ct: 310,
    lightIds: ['4', '5'],
    reachable: true,
  },
  {
    id: 'demo-3',
    name: 'Sovrum',
    type: 'Room',
    on: false,
    bri: 90,
    ct: 430,
    lightIds: ['6'],
    reachable: true,
  },
  {
    id: 'demo-4',
    name: 'Hall & Entré',
    type: 'Room',
    on: true,
    bri: 150,
    ct: 360,
    lightIds: ['7'],
    reachable: true,
  },
];

export const DEFAULT_APP_SHORTCUTS: ExternalAppShortcut[] = [
  {
    id: 'app-spotify',
    name: 'Spotify',
    category: 'Musik',
    deepLink: 'spotify://',
    webUrl: 'https://open.spotify.com',
    androidPackage: 'com.spotify.music',
    accentColor: '#1ED760',
  },
  {
    id: 'app-hue',
    name: 'Philips Hue',
    category: 'Belysning',
    deepLink: 'philipshue://',
    webUrl: 'https://account.meethue.com',
    androidPackage: 'com.philips.lighting.hue2',
    accentColor: '#FACC15',
  },
  {
    id: 'app-sonos',
    name: 'Sonos',
    category: 'Ljud',
    deepLink: 'sonos://',
    webUrl: 'https://play.sonos.com',
    androidPackage: 'com.sonos.acr2',
    accentColor: '#E2E8F0',
  },
  {
    id: 'app-googlehome',
    name: 'Google Home',
    category: 'Smarta hem',
    deepLink: 'chromecast://',
    webUrl: 'https://home.google.com',
    androidPackage: 'com.google.android.apps.chromecast.app',
    accentColor: '#60A5FA',
  },
  {
    id: 'app-homeassistant',
    name: 'Home Assistant',
    category: 'Automation',
    deepLink: 'homeassistant://navigate/lovelace/0',
    webUrl: 'http://homeassistant.local:8123',
    androidPackage: 'io.homeassistant.companion.android',
    accentColor: '#38BDF8',
  },
  {
    id: 'app-tibber',
    name: 'Tibber',
    category: 'Elpris',
    deepLink: 'tibber://',
    webUrl: 'https://app.tibber.com',
    androidPackage: 'com.tibber.android',
    accentColor: '#22D3EE',
  },
];

function getNativeBridge(): {
  localHttpRequest?: (method: string, url: string, body: string) => string;
  launchExternalApp?: (pkg: string, fallbackUrl: string) => boolean;
  setKeepScreenOn?: (keepOn: boolean) => void;
} | null {
  try {
    const w = window as unknown as {
      HemNativeBridge?: {
        localHttpRequest?: (method: string, url: string, body: string) => string;
        launchExternalApp?: (pkg: string, fallbackUrl: string) => boolean;
        setKeepScreenOn?: (keepOn: boolean) => void;
      };
    };
    return w.HemNativeBridge || null;
  } catch {
    return null;
  }
}

export function setNativeKeepScreenOn(keepOn: boolean): void {
  try {
    const bridge = getNativeBridge();
    if (bridge && typeof bridge.setKeepScreenOn === 'function') {
      bridge.setKeepScreenOn(keepOn);
    }
  } catch {
    // Ignore
  }
}

async function hueHttpRequest(
  method: 'GET' | 'POST' | 'PUT',
  url: string,
  bodyObj?: unknown
): Promise<unknown> {
  const bodyStr = bodyObj !== undefined ? JSON.stringify(bodyObj) : '';
  const bridge = getNativeBridge();
  if (bridge && typeof bridge.localHttpRequest === 'function') {
    const raw = bridge.localHttpRequest(method, url, bodyStr);
    if (raw && raw.trim().length > 0) {
      return JSON.parse(raw);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      method,
      headers: bodyObj !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: bodyObj !== undefined ? bodyStr : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function loadHueConfig(): HueConfig {
  try {
    const raw = localStorage.getItem(HUE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        bridgeIp: String(parsed.bridgeIp || '').trim(),
        username: String(parsed.username || '').trim(),
        useDemoMode: Boolean(parsed.useDemoMode ?? !parsed.username),
        lastConnectedAt: parsed.lastConnectedAt,
      };
    }
  } catch {
    // Ignore storage error
  }
  return {
    bridgeIp: '',
    username: '',
    useDemoMode: true,
  };
}

export function saveHueConfig(cfg: HueConfig): void {
  try {
    localStorage.setItem(HUE_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    // Ignore storage error
  }
}

export function loadDemoHueRooms(): HueRoom[] {
  try {
    const raw = localStorage.getItem(HUE_DEMO_ROOMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return DEFAULT_DEMO_ROOMS;
}

export function saveDemoHueRooms(rooms: HueRoom[]): void {
  try {
    localStorage.setItem(HUE_DEMO_ROOMS_KEY, JSON.stringify(rooms));
  } catch {
    // Ignore
  }
}

export async function discoverHueBridgeIp(): Promise<string | null> {
  try {
    const data = await hueHttpRequest('GET', 'https://discovery.meethue.com');
    if (Array.isArray(data) && data.length > 0 && data[0]?.internalipaddress) {
      return String(data[0].internalipaddress).trim();
    }
  } catch {
    // Discovery rate limited or unreachable
  }
  return null;
}

export async function pairHueBridge(
  rawIp: string
): Promise<{ ok: boolean; username?: string; error?: string }> {
  const ip = rawIp.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
  if (!ip) {
    return { ok: false, error: 'Ange IP-adressen till din Philips Hue Bridge (t.ex. 192.168.1.50).' };
  }
  try {
    const res = await hueHttpRequest('POST', `http://${ip}/api`, {
      devicetype: 'hem_hushallstavla#tablet',
    });
    if (Array.isArray(res) && res.length > 0) {
      const first = res[0];
      if (first?.success?.username) {
        return { ok: true, username: String(first.success.username) };
      }
      if (first?.error?.type === 101) {
        return {
          ok: false,
          error:
            'Tryck på den stora runda knappen ovanpå din Philips Hue Bridge och tryck sedan på "Parkoppla" igen inom 30 sekunder.',
        };
      }
      if (first?.error?.description) {
        return { ok: false, error: `Hue Bridge svarade: ${first.error.description}` };
      }
    }
    return { ok: false, error: 'Oväntat svar från Philips Hue Bridge.' };
  } catch {
    const isHttpsWeb =
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      !getNativeBridge()?.localHttpRequest;
    if (isHttpsWeb) {
      return {
        ok: false,
        error:
          'Kunde inte nå Hue Bridge lokalt. Om du kör via webbläsare på HTTPS (hemmahosf.web.app), tillåt "Osäkert innehåll / Lokalt nätverk" i webbläsarens platsinställningar för att nå lokal IP (http://' +
          ip +
          '), eller använd Android-appen.',
      };
    }
    return {
      ok: false,
      error: `Kunde inte nå Hue Bridge på ${ip}. Kontrollera att surfplattan är på samma Wi-Fi och att IP-adressen stämmer.`,
    };
  }
}

export async function fetchHueRooms(
  cfg: HueConfig
): Promise<{ rooms: HueRoom[]; isLive: boolean }> {
  const ip = cfg.bridgeIp.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
  if (!ip || !cfg.username || cfg.useDemoMode) {
    return { rooms: loadDemoHueRooms(), isLive: false };
  }

  try {
    const groupsObj = (await hueHttpRequest(
      'GET',
      `http://${ip}/api/${cfg.username}/groups`
    )) as Record<string, any>;

    if (!groupsObj || typeof groupsObj !== 'object' || Array.isArray(groupsObj)) {
      return { rooms: loadDemoHueRooms(), isLive: false };
    }

    const rooms: HueRoom[] = [];
    for (const [id, g] of Object.entries(groupsObj)) {
      if (!g || typeof g !== 'object') continue;
      const gType = String(g.type || '');
      if (gType !== 'Room' && gType !== 'Zone' && Object.keys(groupsObj).length > 3) {
        continue;
      }
      const anyOn = Boolean(g.state?.any_on ?? g.action?.on);
      const bri = typeof g.action?.bri === 'number' ? Math.max(1, Math.min(254, g.action.bri)) : 200;
      const ct = typeof g.action?.ct === 'number' ? g.action.ct : 366;
      rooms.push({
        id,
        name: String(g.name || `Rum ${id}`),
        type: gType || 'Room',
        on: anyOn,
        bri,
        ct,
        lightIds: Array.isArray(g.lights) ? g.lights.map(String) : [],
        reachable: true,
      });
    }

    if (rooms.length === 0) {
      // Fallback to individual lights if no rooms/groups exist
      const lightsObj = (await hueHttpRequest(
        'GET',
        `http://${ip}/api/${cfg.username}/lights`
      )) as Record<string, any>;
      if (lightsObj && typeof lightsObj === 'object' && !Array.isArray(lightsObj)) {
        for (const [lid, l] of Object.entries(lightsObj)) {
          if (!l || typeof l !== 'object') continue;
          rooms.push({
            id: `light-${lid}`,
            name: String(l.name || `Lampa ${lid}`),
            type: 'Light',
            on: Boolean(l.state?.on),
            bri: typeof l.state?.bri === 'number' ? l.state.bri : 200,
            ct: typeof l.state?.ct === 'number' ? l.state.ct : 366,
            lightIds: [lid],
            reachable: Boolean(l.state?.reachable ?? true),
          });
        }
      }
    }

    return { rooms, isLive: true };
  } catch {
    return { rooms: loadDemoHueRooms(), isLive: false };
  }
}

export async function updateHueRoomAction(
  cfg: HueConfig,
  room: HueRoom,
  action: { on?: boolean; bri?: number; ct?: number }
): Promise<boolean> {
  const ip = cfg.bridgeIp.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
  if (!ip || !cfg.username || cfg.useDemoMode) {
    const current = loadDemoHueRooms();
    const updated = current.map((r) =>
      r.id === room.id
        ? {
            ...r,
            on: action.on !== undefined ? action.on : r.on,
            bri: action.bri !== undefined ? action.bri : r.bri,
            ct: action.ct !== undefined ? action.ct : r.ct,
          }
        : r
    );
    saveDemoHueRooms(updated);
    return true;
  }

  try {
    if (room.id.startsWith('light-')) {
      const lightId = room.id.replace('light-', '');
      await hueHttpRequest(
        'PUT',
        `http://${ip}/api/${cfg.username}/lights/${lightId}/state`,
        action
      );
    } else {
      await hueHttpRequest(
        'PUT',
        `http://${ip}/api/${cfg.username}/groups/${room.id}/action`,
        action
      );
    }
    return true;
  } catch {
    return false;
  }
}

export async function updateAllHueRoomsAction(
  cfg: HueConfig,
  action: { on?: boolean; bri?: number; ct?: number }
): Promise<boolean> {
  const ip = cfg.bridgeIp.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
  if (!ip || !cfg.username || cfg.useDemoMode) {
    const current = loadDemoHueRooms();
    const updated = current.map((r) => ({
      ...r,
      on: action.on !== undefined ? action.on : r.on,
      bri: action.bri !== undefined ? action.bri : r.bri,
      ct: action.ct !== undefined ? action.ct : r.ct,
    }));
    saveDemoHueRooms(updated);
    return true;
  }

  try {
    await hueHttpRequest('PUT', `http://${ip}/api/${cfg.username}/groups/0/action`, action);
    return true;
  } catch {
    return false;
  }
}

export function loadAppShortcuts(): ExternalAppShortcut[] {
  try {
    const raw = localStorage.getItem(APP_SHORTCUTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return DEFAULT_APP_SHORTCUTS;
}

export function saveAppShortcuts(shortcuts: ExternalAppShortcut[]): void {
  try {
    localStorage.setItem(APP_SHORTCUTS_KEY, JSON.stringify(shortcuts));
  } catch {
    // Ignore
  }
}

export function launchExternalAppShortcut(shortcut: ExternalAppShortcut): void {
  const bridge = getNativeBridge();
  if (
    bridge &&
    typeof bridge.launchExternalApp === 'function' &&
    shortcut.androidPackage
  ) {
    const launched = bridge.launchExternalApp(
      shortcut.androidPackage,
      shortcut.deepLink || shortcut.webUrl
    );
    if (launched) return;
  }

  // On mobile/tablet browser or PWA: trigger deep link first, or webUrl if http
  if (shortcut.deepLink && !shortcut.deepLink.startsWith('http')) {
    const start = Date.now();
    window.location.href = shortcut.deepLink;
    if (shortcut.webUrl) {
      setTimeout(() => {
        if (document.visibilityState === 'visible' && Date.now() - start < 2200) {
          window.location.href = shortcut.webUrl;
        }
      }, 1400);
    }
    return;
  }

  if (shortcut.webUrl) {
    window.location.href = shortcut.webUrl;
  }
}
