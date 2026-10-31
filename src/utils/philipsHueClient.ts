import { getApiUrl } from './apiUrl';

export interface HueLight {
  id: string;
  name: string;
  on: boolean;
  bri: number; // 1..254
  brightness: number; // 0..100
  reachable: boolean;
}

export interface HueRoom {
  id: string;
  name: string;
  type: string;
  on: boolean;
  anyOn: boolean;
  bri: number; // 1..254
  brightness: number; // 0..100
  ct?: number; // 153..500 (color temp mirek)
  lightIds: string[];
  lights?: HueLight[];
  reachable?: boolean;
}

export type SmartLightProvider = 'hue-bridge' | 'hue-cloud' | 'custom-rooms';

export interface HueConfig {
  bridgeIp: string;
  username: string;
  connected?: boolean;
  hueCloudToken?: string;
  hueCloudRefreshToken?: string;
  hueClientId?: string;
  hueClientSecret?: string;
  useDemoMode: boolean;
  provider?: SmartLightProvider;
  webhookUrl?: string;
  lastConnectedAt?: string;
}

function briToPercent(bri: number, isOn: boolean): number {
  if (!isOn) return 0;
  return Math.max(1, Math.min(100, Math.round((Math.max(1, Math.min(254, bri)) / 254) * 100)));
}

function percentToBri(pct: number): number {
  return Math.max(1, Math.min(254, Math.round((Math.max(1, Math.min(100, pct)) / 100) * 254)));
}

export function normalizeHueLight(
  l: (Partial<HueLight> & { id?: string; name?: string }) | string | null | undefined,
  fallbackIdx = 0
): HueLight {
  if (!l || typeof l !== 'object') {
    const fallbackId = String(l || fallbackIdx + 1);
    return {
      id: fallbackId,
      name: `Lampa ${fallbackId}`,
      on: false,
      bri: 200,
      brightness: 0,
      reachable: true,
    };
  }
  const isOn = Boolean(l.on);
  const rawBri =
    typeof l.bri === 'number' && l.bri > 0
      ? Math.max(1, Math.min(254, Math.round(l.bri)))
      : typeof l.brightness === 'number' && l.brightness > 0
      ? percentToBri(l.brightness)
      : 200;
  const pct =
    typeof l.brightness === 'number'
      ? Math.max(0, Math.min(100, Math.round(l.brightness)))
      : briToPercent(rawBri, isOn);
  const resolvedId = String(l.id || fallbackIdx + 1);
  return {
    id: resolvedId,
    name: String(l.name || `Lampa ${resolvedId}`),
    on: isOn,
    bri: rawBri,
    brightness: isOn ? Math.max(1, pct) : 0,
    reachable: l.reachable !== false,
  };
}

export function normalizeHueRoom(r: Partial<HueRoom> & { id: string; name: string }): HueRoom {
  const isOn = Boolean(r.anyOn ?? r.on);
  const rawBri =
    typeof r.bri === 'number' && r.bri > 0
      ? Math.max(1, Math.min(254, Math.round(r.bri)))
      : typeof r.brightness === 'number' && r.brightness > 0
      ? percentToBri(r.brightness)
      : 200;
  const pct =
    typeof r.brightness === 'number'
      ? Math.max(0, Math.min(100, Math.round(r.brightness)))
      : briToPercent(rawBri, isOn);
  const normalizedLights = Array.isArray(r.lights)
    ? r.lights.filter(Boolean).map((l, idx) => normalizeHueLight(l as any, idx))
    : undefined;
  return {
    id: String(r.id),
    name: String(r.name || `Rum ${r.id}`),
    type: String(r.type || 'Room'),
    on: isOn,
    anyOn: isOn,
    bri: rawBri,
    brightness: isOn ? Math.max(1, pct) : 0,
    ct: r.ct,
    lightIds: Array.isArray(r.lightIds)
      ? r.lightIds.map(String)
      : normalizedLights
      ? normalizedLights.map((l) => l.id)
      : [],
    lights: normalizedLights,
    reachable: r.reachable !== false,
  };
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

const DEFAULT_LIGHTS_BY_ROOM_ID: Record<string, HueLight[]> = {
  'demo-1': [
    { id: 'l-1', name: 'Taklampa vardagsrum', on: true, bri: 200, brightness: 79, reachable: true },
    { id: 'l-2', name: 'Fönsterlampa', on: true, bri: 180, brightness: 71, reachable: true },
    { id: 'l-3', name: 'Golvlampa vid soffan', on: true, bri: 205, brightness: 81, reachable: true },
  ],
  'demo-2': [
    { id: 'l-4', name: 'Matbordslampa', on: true, bri: 230, brightness: 91, reachable: true },
    { id: 'l-5', name: 'Köksbänk LED', on: true, bri: 230, brightness: 91, reachable: true },
    { id: 'l-6', name: 'Fönsterlampa kök', on: false, bri: 160, brightness: 0, reachable: true },
  ],
  'demo-3': [
    { id: 'l-7', name: 'Taklampa sovrum', on: false, bri: 90, brightness: 0, reachable: true },
    { id: 'l-8', name: 'Sänglampa vänster', on: false, bri: 80, brightness: 0, reachable: true },
    { id: 'l-9', name: 'Sänglampa höger', on: false, bri: 80, brightness: 0, reachable: true },
  ],
  'demo-4': [
    { id: 'l-10', name: 'Takspottar hall', on: true, bri: 150, brightness: 59, reachable: true },
    { id: 'l-11', name: 'Byrålampa entré', on: true, bri: 150, brightness: 59, reachable: true },
  ],
};

const DEFAULT_DEMO_ROOMS: HueRoom[] = [
  {
    id: 'demo-1',
    name: 'Vardagsrum',
    type: 'Room',
    on: true,
    anyOn: true,
    bri: 195,
    brightness: 77,
    ct: 370,
    lightIds: ['l-1', 'l-2', 'l-3'],
    lights: DEFAULT_LIGHTS_BY_ROOM_ID['demo-1'],
    reachable: true,
  },
  {
    id: 'demo-2',
    name: 'Kök & Matplats',
    type: 'Room',
    on: true,
    anyOn: true,
    bri: 230,
    brightness: 91,
    ct: 310,
    lightIds: ['l-4', 'l-5', 'l-6'],
    lights: DEFAULT_LIGHTS_BY_ROOM_ID['demo-2'],
    reachable: true,
  },
  {
    id: 'demo-3',
    name: 'Sovrum',
    type: 'Room',
    on: false,
    anyOn: false,
    bri: 90,
    brightness: 0,
    ct: 430,
    lightIds: ['l-7', 'l-8', 'l-9'],
    lights: DEFAULT_LIGHTS_BY_ROOM_ID['demo-3'],
    reachable: true,
  },
  {
    id: 'demo-4',
    name: 'Hall & Entré',
    type: 'Room',
    on: true,
    anyOn: true,
    bri: 150,
    brightness: 59,
    ct: 360,
    lightIds: ['l-10', 'l-11'],
    lights: DEFAULT_LIGHTS_BY_ROOM_ID['demo-4'],
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
  localHttpRequestWithHeaders?: (
    method: string,
    url: string,
    body: string,
    headersJson: string
  ) => string;
  discoverLocalHueBridgeIp?: () => string;
  launchExternalApp?: (pkg: string, fallbackUrl: string) => boolean;
  openInChromeBrowser?: (url: string) => boolean;
  openPhilipsHueApp?: () => boolean;
  setKeepScreenOn?: (keepOn: boolean) => void;
} | null {
  try {
    const w = window as unknown as {
      HemNativeBridge?: {
        localHttpRequest?: (method: string, url: string, body: string) => string;
        localHttpRequestWithHeaders?: (
          method: string,
          url: string,
          body: string,
          headersJson: string
        ) => string;
        discoverLocalHueBridgeIp?: () => string;
        launchExternalApp?: (pkg: string, fallbackUrl: string) => boolean;
        openInChromeBrowser?: (url: string) => boolean;
        openPhilipsHueApp?: () => boolean;
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

export function extractCleanBridgeIp(rawInput: string): string {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) return '';
  const ipv4Match = trimmed.match(/\b((?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3})\b/);
  if (ipv4Match && ipv4Match[1]) {
    return ipv4Match[1];
  }
  return trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim();
}

export function openHueInChromeBrowser(url: string): void {
  if (!url) return;
  try {
    const bridge = getNativeBridge();
    if (bridge && typeof bridge.openInChromeBrowser === 'function') {
      const ok = bridge.openInChromeBrowser(url);
      if (ok) return;
    }
  } catch {
    // Continue
  }

  const isAndroid =
    typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');

  if (isAndroid) {
    try {
      const parsed = new URL(url);
      const scheme = parsed.protocol.replace(':', '');
      const withoutScheme = url.replace(/^https?:\/\//i, '');
      const fallback = encodeURIComponent(url);
      const chromeIntent = `intent://${withoutScheme}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
      const a = document.createElement('a');
      a.href = chromeIntent;
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
      return;
    } catch {
      // Fall through to window.open
    }
  }

  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
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
    }
  } catch {
    // Ignore
  }
}

export function openPhilipsHueNativeApp(): { opened: boolean; message: string } {
  try {
    const bridge = getNativeBridge();
    if (bridge && typeof bridge.openPhilipsHueApp === 'function') {
      const ok = bridge.openPhilipsHueApp();
      if (ok) {
        return {
          opened: true,
          message:
            'Öppnade Philips Hue-appen! Kontrollera att bryggan är aktiv (eller tryck på bryggans knapp) och växla tillbaka till Hem.',
        };
      }
    }
    if (bridge && typeof bridge.launchExternalApp === 'function') {
      const ok = bridge.launchExternalApp(
        'com.philips.lighting.hue2',
        'philipshue://'
      );
      if (ok) {
        return {
          opened: true,
          message:
            'Öppnade Philips Hue-appen! Växla tillbaka till Hem när du är klar.',
        };
      }
    }
  } catch {
    // Continue
  }

  const isAndroid =
    typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');
  if (isAndroid) {
    const fallback = encodeURIComponent('https://account.meethue.com');
    const intentHref = `intent://#Intent;package=com.philips.lighting.hue2;scheme=philipshue;S.browser_fallback_url=${fallback};end`;
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
    }, 400);
    return {
      opened: true,
      message:
        'Öppnar Philips Hue-appen på din telefon/surfplatta (under Inställningar → Bridges ser du din Hue Bridge IP-adress).',
    };
  }

  openHueInChromeBrowser('https://account.meethue.com');
  return {
    opened: true,
    message: 'Öppnade Philips Hue i nytt fönster.',
  };
}

export function approveHueBridgeInChrome(rawIp: string): {
  openedUrl: string;
  ip: string;
  message: string;
} {
  const ip = extractCleanBridgeIp(rawIp) || extractCleanBridgeIp(loadHueConfig().bridgeIp);
  if (ip) {
    const targetUrl = `https://${ip}/api/0/config`;
    openHueInChromeBrowser(targetUrl);
    return {
      openedUrl: targetUrl,
      ip,
      message: `Chrome har öppnats mot https://${ip}/api/0/config! Välj "Avancerat → Fortsätt till ${ip} (osäkert)" i Chrome och tryck sedan på knappen på din Hue Bridge – appen kopplar automatiskt när du går tillbaka hit!`,
    };
  }
  const discoveryUrl = 'https://discovery.meethue.com';
  openHueInChromeBrowser(discoveryUrl);
  return {
    openedUrl: discoveryUrl,
    ip: '',
    message:
      'Chrome har öppnats till discovery.meethue.com! Kopiera IP-adressen ("internalipaddress") som visas där och klistra in i fältet här i appen.',
  };
}

const localBridgeSchemeCache = new Map<string, 'https' | 'http'>();

function isLocalLanUrl(url: string): { isLocal: boolean; host: string; pathAndQuery: string } {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    const isLocal =
      h.startsWith('192.168.') ||
      h.startsWith('10.') ||
      h.startsWith('172.') ||
      h.endsWith('.local');
    return {
      isLocal,
      host: u.host,
      pathAndQuery: `${u.pathname}${u.search}`,
    };
  } catch {
    return { isLocal: false, host: '', pathAndQuery: '' };
  }
}

async function fetchWithTimeout(
  method: 'GET' | 'POST' | 'PUT',
  url: string,
  bodyStr: string | undefined,
  headers: Record<string, string> | undefined,
  timeoutMs: number
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: headers && Object.keys(headers).length > 0 ? headers : undefined,
      body: bodyStr,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } finally {
    clearTimeout(timeout);
  }
}

const localBridgeUnreachableUntilCache = new Map<string, number>();

async function smartHttpRequest(
  method: 'GET' | 'POST' | 'PUT',
  url: string,
  bodyObj?: unknown,
  headersOverride?: Record<string, string>
): Promise<unknown> {
  const bodyStr = bodyObj !== undefined ? JSON.stringify(bodyObj) : '';
  const bridge = getNativeBridge();
  const localCheck = isLocalLanUrl(url);

  // Yield a macrotask before any synchronous Android JavascriptInterface call
  // so opening modals/screensaver paints immediately without freezing the UI thread.
  await new Promise((resolve) => setTimeout(resolve, 16));

  if (localCheck.isLocal && method === 'GET' && !headersOverride) {
    const blockedUntil = localBridgeUnreachableUntilCache.get(localCheck.host) || 0;
    if (Date.now() < blockedUntil) {
      throw new Error('Local Hue Bridge temporarily backed off');
    }
  }

  // 1. In the Android app, prefer native Java HttpURLConnection for local LAN or authenticated requests.
  if (bridge) {
    const candidateUrls =
      localCheck.isLocal && !headersOverride
        ? [
            `http://${localCheck.host}${localCheck.pathAndQuery}`,
            `https://${localCheck.host}${localCheck.pathAndQuery}`,
          ]
        : [url];

    for (const candidateUrl of candidateUrls) {
      try {
        if (typeof bridge.localHttpRequestWithHeaders === 'function') {
          const headersJson = headersOverride ? JSON.stringify(headersOverride) : '';
          const raw = bridge.localHttpRequestWithHeaders(
            method,
            candidateUrl,
            bodyStr,
            headersJson
          );
          if (raw && raw.trim().length > 0) {
            if (localCheck.isLocal) {
              localBridgeUnreachableUntilCache.delete(localCheck.host);
            }
            return JSON.parse(raw);
          }
        } else if (typeof bridge.localHttpRequest === 'function' && !headersOverride) {
          const raw = bridge.localHttpRequest(method, candidateUrl, bodyStr);
          if (raw && raw.trim().length > 0) {
            if (localCheck.isLocal) {
              localBridgeUnreachableUntilCache.delete(localCheck.host);
            }
            return JSON.parse(raw);
          }
        }
      } catch {
        // Fall through
      }
    }

    if (localCheck.isLocal && method === 'GET' && !headersOverride) {
      localBridgeUnreachableUntilCache.set(localCheck.host, Date.now() + 2500);
      throw new Error('Local Hue Bridge unreachable via native bridge');
    }
  }

  // 2. If calling Philips Hue Cloud API from a web browser, route through backend proxy to avoid CORS
  if (url.startsWith('https://api.meethue.com/') && headersOverride?.Authorization) {
    try {
      const token = headersOverride.Authorization.replace(/^Bearer\s+/i, '').trim();
      const huePath = url.replace(/^https:\/\/api\.meethue\.com\//i, '');
      const proxyRes = await fetch(getApiUrl('/api/hue/cloud-proxy'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          path: huePath,
          token,
          body: bodyObj,
        }),
      });
      if (proxyRes.ok) {
        return await proxyRes.json();
      }
    } catch {
      // Fall through to direct fetch
    }
  }

  // 3. If calling a local Hue Bridge IP from a browser/PWA, try both https://<ip> (no Mixed Content!) and http://<ip>
  //    Also omit Content-Type: application/json so POST is a CORS Simple Request (text/plain) without OPTIONS preflight.
  if (localCheck.isLocal && !headersOverride) {
    const cachedScheme = localBridgeSchemeCache.get(localCheck.host);
    const isPageHttps =
      typeof window !== 'undefined' && window.location?.protocol === 'https:';
    const schemesOrder: Array<'https' | 'http'> = cachedScheme
      ? [cachedScheme, cachedScheme === 'https' ? 'http' : 'https']
      : isPageHttps
      ? ['https', 'http']
      : ['http', 'https'];

    let lastErr: unknown = null;
    for (const scheme of schemesOrder) {
      const candidateUrl = `${scheme}://${localCheck.host}${localCheck.pathAndQuery}`;
      try {
        const data = await fetchWithTimeout(
          method,
          candidateUrl,
          bodyObj !== undefined ? bodyStr : undefined,
          undefined,
          3500
        );
        localBridgeSchemeCache.set(localCheck.host, scheme);
        return data;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Local Hue Bridge unreachable');
  }

  const headers: Record<string, string> = {
    ...(bodyObj !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(headersOverride || {}),
  };
  return fetchWithTimeout(
    method,
    url,
    bodyObj !== undefined ? bodyStr : undefined,
    headers,
    5000
  );
}

const DEFAULT_KNOWN_HUE_BRIDGE_IP = '192.168.68.50';

export function loadHueConfig(): HueConfig {
  try {
    const raw = localStorage.getItem(HUE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const bridgeIp =
        extractCleanBridgeIp(String(parsed.bridgeIp || '')) ||
        DEFAULT_KNOWN_HUE_BRIDGE_IP;
      const username = String(parsed.username || '').trim();
      const hueCloudToken = String(parsed.hueCloudToken || '').trim();
      const hasValidAuth = Boolean(username && (bridgeIp || hueCloudToken));
      const isConnected =
        hasValidAuth &&
        (parsed.connected === true || parsed.useDemoMode === false);
      return {
        bridgeIp,
        username,
        connected: isConnected,
        hueCloudToken,
        hueCloudRefreshToken: String(parsed.hueCloudRefreshToken || '').trim(),
        hueClientId: String(parsed.hueClientId || '').trim(),
        hueClientSecret: String(parsed.hueClientSecret || '').trim(),
        useDemoMode: !isConnected,
        provider:
          parsed.provider === 'hue-cloud'
            ? 'hue-cloud'
            : parsed.provider === 'custom-rooms'
            ? 'custom-rooms'
            : 'hue-bridge',
        webhookUrl: parsed.webhookUrl ? String(parsed.webhookUrl).trim() : '',
        lastConnectedAt: parsed.lastConnectedAt,
      };
    }
  } catch {
    // Ignore storage error
  }
  return {
    bridgeIp: DEFAULT_KNOWN_HUE_BRIDGE_IP,
    username: '',
    connected: false,
    hueCloudToken: '',
    hueCloudRefreshToken: '',
    hueClientId: '',
    hueClientSecret: '',
    useDemoMode: true,
    provider: 'hue-bridge',
    webhookUrl: '',
  };
}

export function saveHueConfig(cfg: HueConfig): void {
  try {
    const hasAuth = Boolean(cfg.username && (cfg.bridgeIp || cfg.hueCloudToken));
    const isConnected =
      hasAuth && (cfg.connected === true || cfg.useDemoMode === false);
    const normalized: HueConfig = {
      ...cfg,
      connected: isConnected,
      useDemoMode: !isConnected,
    };
    localStorage.setItem(HUE_CONFIG_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage error
  }
}

export function disconnectHueBridge(): HueConfig {
  const next: HueConfig = {
    bridgeIp: DEFAULT_KNOWN_HUE_BRIDGE_IP,
    username: '',
    connected: false,
    hueCloudToken: '',
    hueCloudRefreshToken: '',
    hueClientId: '',
    hueClientSecret: '',
    useDemoMode: true,
    provider: 'hue-bridge',
    webhookUrl: '',
  };
  saveHueConfig(next);
  return next;
}

function ensureRoomHasLights(room: HueRoom): HueRoom {
  const norm = normalizeHueRoom(room);
  if (Array.isArray(norm.lights) && norm.lights.length > 0) {
    return norm;
  }
  const preset = DEFAULT_LIGHTS_BY_ROOM_ID[norm.id];
  if (preset) {
    return normalizeHueRoom({
      ...norm,
      lights: preset.map((l) =>
        normalizeHueLight({
          ...l,
          on: norm.on,
          bri: norm.bri,
          brightness: norm.brightness,
        })
      ),
      lightIds: preset.map((l) => l.id),
    });
  }
  const defaultLights: HueLight[] = [
    normalizeHueLight({
      id: `${norm.id}-l1`,
      name: `Taklampa ${norm.name.toLowerCase()}`,
      on: norm.on,
      bri: norm.bri,
      brightness: norm.brightness,
      reachable: true,
    }),
    normalizeHueLight({
      id: `${norm.id}-l2`,
      name: `Fönsterlampa ${norm.name.toLowerCase()}`,
      on: norm.on,
      bri: norm.bri,
      brightness: norm.brightness,
      reachable: true,
    }),
  ];
  return normalizeHueRoom({
    ...norm,
    lights: defaultLights,
    lightIds: defaultLights.map((l) => l.id),
  });
}

export function loadDemoHueRooms(): HueRoom[] {
  try {
    const raw = localStorage.getItem(HUE_DEMO_ROOMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(ensureRoomHasLights);
      }
    }
  } catch {
    // Ignore
  }
  return DEFAULT_DEMO_ROOMS.map(ensureRoomHasLights);
}

export function saveDemoHueRooms(rooms: HueRoom[]): void {
  try {
    const normalized = rooms.map((r) => normalizeHueRoom(r));
    localStorage.setItem(HUE_DEMO_ROOMS_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore
  }
}

// ============================================================================
// PHILIPS HUE BRIDGE DISCOVERY & PAIRING (Local Bridge Button + Chrome / App Approval)
// ============================================================================

export async function discoverHueBridgeIp(): Promise<string | null> {
  // 1. Try Android Native Bridge (checks discovery.meethue.com + scans local /24 Wi-Fi subnet over HTTP & HTTPS!)
  try {
    const bridge = getNativeBridge();
    if (bridge && typeof bridge.discoverLocalHueBridgeIp === 'function') {
      const nativeIp = bridge.discoverLocalHueBridgeIp();
      if (nativeIp && nativeIp.trim().length > 0) {
        return extractCleanBridgeIp(nativeIp);
      }
    }
  } catch {
    // Continue
  }

  // 2. Try direct discovery.meethue.com
  try {
    const data = await smartHttpRequest('GET', 'https://discovery.meethue.com');
    if (Array.isArray(data) && data.length > 0 && data[0]?.internalipaddress) {
      return extractCleanBridgeIp(String(data[0].internalipaddress));
    }
  } catch {
    // Ignore
  }

  // 3. Try server-side discovery proxy
  try {
    const res = await fetch(getApiUrl('/api/hue/discover'));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.bridges) && data.bridges.length > 0 && data.bridges[0]?.ip) {
        return extractCleanBridgeIp(String(data.bridges[0].ip));
      }
    }
  } catch {
    // Continue
  }

  const saved = loadHueConfig().bridgeIp;
  if (saved) return extractCleanBridgeIp(saved);

  return DEFAULT_KNOWN_HUE_BRIDGE_IP;
}

export async function pairHueBridge(
  rawIp: string
): Promise<{
  ok: boolean;
  username?: string;
  waitingForButton?: boolean;
  mixedContentBlocked?: boolean;
  error?: string;
}> {
  const ip = extractCleanBridgeIp(rawIp) || DEFAULT_KNOWN_HUE_BRIDGE_IP;
  localBridgeUnreachableUntilCache.delete(ip);
  try {
    const res = await smartHttpRequest('POST', `http://${ip}/api`, {
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
          waitingForButton: true,
          error: `Kontakt med Philips Hue Bridge (${ip})! Tryck nu på den stora runda knappen mitt på din Hue Bridge – appen kopplar automatiskt!`,
        };
      }
      if (first?.error?.description) {
        return { ok: false, error: `Hue Bridge svarade: ${first.error.description}` };
      }
    }
    return { ok: false, error: 'Oväntat svar från Hue Bridge. Kontrollera IP-adressen.' };
  } catch {
    return {
      ok: false,
      mixedContentBlocked: true,
      error: `Kunde inte nå Hue Bridge (${ip}) direkt. Tryck på den fysiska knappen mitt på din Hue Bridge (${ip}) och håll kvar detta fönster öppet.`,
    };
  }
}

export async function connectHueCloudWithToken(
  accessTokenInput: string
): Promise<{
  ok: boolean;
  username?: string;
  accessToken?: string;
  error?: string;
}> {
  const cleanToken = accessTokenInput.trim();
  if (!cleanToken) {
    return { ok: false, error: 'Ange en giltig Philips Hue Access Token.' };
  }

  try {
    // 1. Virtually press the link button on the remote Hue Bridge
    await smartHttpRequest(
      'PUT',
      'https://api.meethue.com/route/api/0/config',
      { linkbutton: true },
      { Authorization: `Bearer ${cleanToken}` }
    );

    // 2. Create remote username
    const regData = await smartHttpRequest(
      'POST',
      'https://api.meethue.com/route/api',
      { devicetype: 'hem_hushallstavla#tablet' },
      { Authorization: `Bearer ${cleanToken}` }
    );

    if (Array.isArray(regData) && regData[0]?.success?.username) {
      return {
        ok: true,
        username: String(regData[0].success.username),
        accessToken: cleanToken,
      };
    }

    return {
      ok: false,
      error: 'Kunde inte länka mot bryggan i Philips Hue Cloud. Kontrollera din token.',
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Kunde inte ansluta till Philips Hue Cloud.',
    };
  }
}

export function getHueOAuthRedirectUri(): string {
  if (typeof window === 'undefined') return 'https://hemmahosf.web.app/api/oauth/callback';
  return `${window.location.origin}/api/oauth/callback`;
}

export async function startHueCloudOAuthPopup(
  clientId: string,
  clientSecret: string
): Promise<{
  ok: boolean;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  error?: string;
}> {
  const cid = clientId.trim();
  const csecret = clientSecret.trim();
  if (!cid || !csecret) {
    openHueInChromeBrowser('https://account.meethue.com/homes');
    return {
      ok: false,
      error:
        'Öppnade Philips Hue i Chrome (account.meethue.com)! För direktkoppling på ditt Wi-Fi: använd "Öppna Chrome & godkänn Hue Bridge" eller ange Client ID & Secret för moln-API.',
    };
  }

  const state = `hue_${Date.now()}`;
  const authUrl = `https://api.meethue.com/v2/oauth2/authorize?client_id=${encodeURIComponent(
    cid
  )}&response_type=code&state=${encodeURIComponent(state)}`;

  return new Promise((resolve) => {
    const popup = window.open(
      authUrl,
      'hem_hue_oauth',
      'width=520,height=680,menubar=no,toolbar=no,location=yes,status=no'
    );

    if (!popup) {
      resolve({
        ok: false,
        error: 'Popup-fönstret blockerades. Tillåt popup-fönster och försök igen.',
      });
      return;
    }

    let settled = false;
    const finish = async (code: string, errStr?: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (errStr || !code) {
        resolve({ ok: false, error: errStr || 'Inloggningen avbröts.' });
        return;
      }

      try {
        const res = await fetch(getApiUrl('/api/hue/oauth/token'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: cid,
            clientSecret: csecret,
            code,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.accessToken) {
          resolve({
            ok: false,
            error: data?.error || 'Kunde inte slutföra inloggningen mot Philips Hue.',
          });
          return;
        }
        resolve({
          ok: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          username: data.username,
        });
      } catch (e: any) {
        resolve({
          ok: false,
          error: e?.message || 'Nätverksfel vid token-utbyte med Philips Hue.',
        });
      }
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

async function fetchRoomsFromHueBridge(
  cfg: HueConfig
): Promise<{ rooms: HueRoom[]; isLive: boolean } | null> {
  const ip = extractCleanBridgeIp(cfg.bridgeIp);
  const isCloud = Boolean(cfg.hueCloudToken);
  if ((!ip && !isCloud) || !cfg.username) return null;

  if (ip) {
    localBridgeUnreachableUntilCache.delete(ip);
  }

  const baseUrl = isCloud
    ? `https://api.meethue.com/route/api/${cfg.username}`
    : `http://${ip}/api/${cfg.username}`;
  const headers = isCloud
    ? { Authorization: `Bearer ${cfg.hueCloudToken}` }
    : undefined;

  try {
    let [groupsObj, lightsObj] = await Promise.all([
      smartHttpRequest('GET', `${baseUrl}/groups`, undefined, headers).catch(
        () => null
      ) as Promise<Record<string, any> | null>,
      smartHttpRequest('GET', `${baseUrl}/lights`, undefined, headers).catch(
        () => null
      ) as Promise<Record<string, any> | null>,
    ]);

    // Fallback: if /groups or /lights failed or returned error array, try root datastore GET /api/<username>
    if (
      (!groupsObj || Array.isArray(groupsObj)) &&
      (!lightsObj || Array.isArray(lightsObj))
    ) {
      const fullStore = (await smartHttpRequest(
        'GET',
        baseUrl,
        undefined,
        headers
      ).catch(() => null)) as Record<string, any> | null;
      if (fullStore && typeof fullStore === 'object' && !Array.isArray(fullStore)) {
        if (fullStore.groups && typeof fullStore.groups === 'object') {
          groupsObj = fullStore.groups;
        }
        if (fullStore.lights && typeof fullStore.lights === 'object') {
          lightsObj = fullStore.lights;
        }
      }
    }

    // Parse all individual lights from /lights first
    const allLightsMap = new Map<string, HueLight>();
    if (lightsObj && typeof lightsObj === 'object' && !Array.isArray(lightsObj)) {
      for (const [lid, lObj] of Object.entries(lightsObj)) {
        if (!lObj || typeof lObj !== 'object' || !lObj.state) continue;
        const isOn = Boolean(lObj.state.on);
        const bri =
          typeof lObj.state.bri === 'number'
            ? Math.max(1, Math.min(254, lObj.state.bri))
            : 254;
        allLightsMap.set(
          String(lid),
          normalizeHueLight({
            id: String(lid),
            name: String(lObj.name || `Hue-lampa ${lid}`),
            on: isOn,
            bri,
            reachable: Boolean(lObj.state.reachable ?? true),
          })
        );
      }
    }

    const rooms: HueRoom[] = [];
    const assignedLightIds = new Set<string>();

    if (groupsObj && typeof groupsObj === 'object' && !Array.isArray(groupsObj)) {
      for (const [id, g] of Object.entries(groupsObj)) {
        if (!g || typeof g !== 'object') continue;
        // Skip internal group 0 or empty non-room entertainment groups if there are real rooms
        const gType = String(g.type || 'Room');
        const lightIds = Array.isArray(g.lights) ? g.lights.map(String) : [];
        if (lightIds.length === 0 && !g.state && !g.action) continue;

        const roomLights: HueLight[] = lightIds.map((lid) => {
          assignedLightIds.add(lid);
          const existing = allLightsMap.get(lid);
          if (existing) return existing;
          const anyOnFallback = Boolean(g.state?.any_on ?? g.action?.on);
          const briFallback =
            typeof g.action?.bri === 'number'
              ? Math.max(1, Math.min(254, g.action.bri))
              : 200;
          return normalizeHueLight({
            id: lid,
            name: `Lampa ${lid}`,
            on: anyOnFallback,
            bri: briFallback,
            reachable: true,
          });
        });

        const anyOn =
          roomLights.length > 0
            ? roomLights.some((l) => l.on) || Boolean(g.state?.any_on)
            : Boolean(g.state?.any_on ?? g.action?.on);

        const activeLights = roomLights.filter((l) => l.on);
        const avgBri =
          activeLights.length > 0
            ? Math.round(
                activeLights.reduce((acc, l) => acc + l.bri, 0) / activeLights.length
              )
            : typeof g.action?.bri === 'number'
            ? Math.max(1, Math.min(254, g.action.bri))
            : roomLights[0]?.bri || 200;

        const ct = typeof g.action?.ct === 'number' ? g.action.ct : 366;

        rooms.push(
          normalizeHueRoom({
            id: String(id),
            name: String(g.name || `Rum ${id}`),
            type: gType,
            on: anyOn,
            anyOn,
            bri: avgBri,
            ct,
            lightIds,
            lights: roomLights,
            reachable: true,
          })
        );
      }
    }

    // If there are lights in /lights that aren't in any group (or if no groups exist at all),
    // add them so every single lamp on the Hue Bridge is visible and controllable!
    const unassignedLights = Array.from(allLightsMap.values()).filter(
      (l) => !assignedLightIds.has(l.id)
    );
    if (unassignedLights.length > 0) {
      const anyOn = unassignedLights.some((l) => l.on);
      const activeUnassigned = unassignedLights.filter((l) => l.on);
      const avgBri =
        activeUnassigned.length > 0
          ? Math.round(
              activeUnassigned.reduce((acc, l) => acc + l.bri, 0) /
                activeUnassigned.length
            )
          : unassignedLights[0].bri;
      rooms.push(
        normalizeHueRoom({
          id: rooms.length === 0 ? '0' : 'unassigned-lights',
          name: rooms.length === 0 ? 'Alla Hue-lampor' : 'Övriga Hue-lampor',
          type: 'Room',
          on: anyOn,
          anyOn,
          bri: avgBri,
          lightIds: unassignedLights.map((l) => l.id),
          lights: unassignedLights,
          reachable: true,
        })
      );
    }

    // Fallback: Try Hue CLIP v2 API if v1 returned 0 rooms & 0 lights
    if (rooms.length === 0 && ip && !isCloud) {
      try {
        const clipLightsRes = (await smartHttpRequest(
          'GET',
          `https://${ip}/clip/v2/resource/light`,
          undefined,
          { 'hue-application-key': cfg.username }
        )) as any;
        if (clipLightsRes && Array.isArray(clipLightsRes.data) && clipLightsRes.data.length > 0) {
          const v2Lights: HueLight[] = clipLightsRes.data.map((item: any, idx: number) => {
            const isOn = Boolean(item?.on?.on);
            const pct =
              typeof item?.dimming?.brightness === 'number'
                ? Math.round(item.dimming.brightness)
                : isOn
                ? 80
                : 0;
            return normalizeHueLight({
              id: String(item.id_v1 ? item.id_v1.replace('/lights/', '') : item.id || idx + 1),
              name: String(item?.metadata?.name || `Hue-lampa ${idx + 1}`),
              on: isOn,
              brightness: pct,
              reachable: true,
            });
          });
          const anyOn = v2Lights.some((l) => l.on);
          rooms.push(
            normalizeHueRoom({
              id: '0',
              name: 'Alla Hue-lampor',
              type: 'Room',
              on: anyOn,
              anyOn,
              bri: v2Lights[0]?.bri || 200,
              lightIds: v2Lights.map((l) => l.id),
              lights: v2Lights,
              reachable: true,
            })
          );
        }
      } catch {
        // Ignore CLIP v2 error
      }
    }

    if (rooms.length > 0) {
      saveDemoHueRooms(rooms);
      return { rooms, isLive: true };
    }
  } catch {
    // Ignore
  }
  return null;
}

// ============================================================================
// UNIFIED FETCH & CONTROL FUNCTIONS (Philips Hue Only)
// ============================================================================

export async function fetchHueRooms(
  cfg: HueConfig
): Promise<{ rooms: HueRoom[]; isLive: boolean; activeProviderLabel: string }> {
  const isConfigured = Boolean(
    cfg.username &&
      (cfg.bridgeIp || cfg.hueCloudToken) &&
      (cfg.connected === true || cfg.useDemoMode === false)
  );
  if (isConfigured) {
    const hue = await fetchRoomsFromHueBridge(cfg);
    if (hue && hue.rooms.length > 0) {
      return {
        ...hue,
        activeProviderLabel: cfg.hueCloudToken
          ? 'Philips Hue Cloud (Live)'
          : `Philips Hue Bridge (${extractCleanBridgeIp(cfg.bridgeIp)})`,
      };
    }
  }

  return {
    rooms: loadDemoHueRooms(),
    isLive: false,
    activeProviderLabel: 'Sparade rum & lampor i appen',
  };
}

export async function updateHueRoomAction(
  cfg: HueConfig,
  roomOrId: HueRoom | string,
  action: { on?: boolean; bri?: number; brightness?: number; ct?: number }
): Promise<boolean> {
  const current = loadDemoHueRooms();
  const roomObj: HueRoom =
    typeof roomOrId === 'string'
      ? current.find((r) => r.id === roomOrId) ||
        normalizeHueRoom({ id: roomOrId, name: `Rum ${roomOrId}` })
      : roomOrId;

  const resolvedBri =
    typeof action.bri === 'number'
      ? Math.max(1, Math.min(254, Math.round(action.bri)))
      : typeof action.brightness === 'number' && action.brightness > 0
      ? percentToBri(action.brightness)
      : undefined;

  const resolvedOn =
    action.on !== undefined
      ? action.on
      : typeof action.brightness === 'number'
      ? action.brightness > 0
      : undefined;

  const bridgePayload: { on?: boolean; bri?: number; ct?: number } = {};
  if (resolvedOn !== undefined) bridgePayload.on = resolvedOn;
  if (resolvedBri !== undefined && resolvedOn !== false) {
    bridgePayload.bri = resolvedBri;
  }
  if (action.ct !== undefined) bridgePayload.ct = action.ct;

  if (cfg.webhookUrl) {
    fetch(cfg.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: 'room',
        roomId: roomObj.id,
        roomName: roomObj.name,
        ...bridgePayload,
      }),
    }).catch(() => {});
  }

  // Always update local state immediately for zero-latency UI
  const updated = current.map((r) => {
    if (r.id !== roomObj.id) return r;
    const nextOn = resolvedOn !== undefined ? resolvedOn : r.on;
    const nextBri = resolvedBri !== undefined ? resolvedBri : r.bri;
    const nextPct = nextOn ? briToPercent(nextBri, true) : 0;
    const nextLights = (r.lights || []).map((l) =>
      normalizeHueLight({
        ...l,
        on: nextOn,
        bri: resolvedBri !== undefined ? nextBri : l.bri,
        brightness: nextPct,
      })
    );
    return normalizeHueRoom({
      ...r,
      on: nextOn,
      anyOn: nextOn,
      bri: nextBri,
      brightness: nextPct,
      ct: action.ct !== undefined ? action.ct : r.ct,
      lights: nextLights,
    });
  });
  saveDemoHueRooms(updated);

  const isLiveBridge = Boolean(
    cfg.username &&
      (cfg.bridgeIp || cfg.hueCloudToken) &&
      (cfg.connected === true || cfg.useDemoMode === false)
  );
  if (!isLiveBridge) return true;

  const ip = extractCleanBridgeIp(cfg.bridgeIp);
  const isCloud = Boolean(cfg.hueCloudToken);
  if ((ip || isCloud) && cfg.username) {
    const baseUrl = isCloud
      ? `https://api.meethue.com/route/api/${cfg.username}`
      : `http://${ip}/api/${cfg.username}`;
    const headers = isCloud
      ? { Authorization: `Bearer ${cfg.hueCloudToken}` }
      : undefined;
    try {
      if (roomObj.id === 'unassigned-lights' && Array.isArray(roomObj.lightIds)) {
        await Promise.all(
          roomObj.lightIds.map((lid) =>
            smartHttpRequest('PUT', `${baseUrl}/lights/${lid}/state`, bridgePayload, headers)
          )
        );
      } else {
        await smartHttpRequest(
          'PUT',
          `${baseUrl}/groups/${roomObj.id}/action`,
          bridgePayload,
          headers
        );
      }
      return true;
    } catch {
      return false;
    }
  }

  return true;
}

export async function updateIndividualLightInRoom(
  cfg: HueConfig,
  room: HueRoom,
  lightId: string,
  action: { on?: boolean; bri?: number; brightness?: number }
): Promise<HueRoom[]> {
  const resolvedBri =
    typeof action.bri === 'number'
      ? Math.max(1, Math.min(254, Math.round(action.bri)))
      : typeof action.brightness === 'number' && action.brightness > 0
      ? percentToBri(action.brightness)
      : undefined;

  const resolvedOn =
    action.on !== undefined
      ? action.on
      : typeof action.brightness === 'number'
      ? action.brightness > 0
      : undefined;

  const bridgePayload: { on?: boolean; bri?: number } = {};
  if (resolvedOn !== undefined) bridgePayload.on = resolvedOn;
  if (resolvedBri !== undefined && resolvedOn !== false) {
    bridgePayload.bri = resolvedBri;
  }

  if (cfg.webhookUrl) {
    fetch(cfg.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: 'light',
        roomId: room.id,
        roomName: room.name,
        lightId,
        ...bridgePayload,
      }),
    }).catch(() => {});
  }

  const current = loadDemoHueRooms();
  const updated = current.map((r) => {
    if (r.id !== room.id) return r;
    const nextLights = (r.lights || []).map((l) =>
      l.id === lightId
        ? normalizeHueLight({
            ...l,
            on: resolvedOn !== undefined ? resolvedOn : l.on,
            bri: resolvedBri !== undefined ? resolvedBri : l.bri,
          })
        : l
    );
    const anyOn = nextLights.some((l) => l.on);
    const activeLights = nextLights.filter((l) => l.on);
    const avgBri =
      activeLights.length > 0
        ? Math.round(
            activeLights.reduce((acc, l) => acc + l.bri, 0) / activeLights.length
          )
        : r.bri;
    return normalizeHueRoom({
      ...r,
      on: anyOn,
      anyOn,
      bri: avgBri,
      lights: nextLights,
    });
  });
  saveDemoHueRooms(updated);

  const isLiveBridge = Boolean(
    cfg.username &&
      (cfg.bridgeIp || cfg.hueCloudToken) &&
      (cfg.connected === true || cfg.useDemoMode === false)
  );
  if (!isLiveBridge) return updated;

  const ip = extractCleanBridgeIp(cfg.bridgeIp);
  const isCloud = Boolean(cfg.hueCloudToken);
  if ((ip || isCloud) && cfg.username) {
    const baseUrl = isCloud
      ? `https://api.meethue.com/route/api/${cfg.username}`
      : `http://${ip}/api/${cfg.username}`;
    const headers = isCloud
      ? { Authorization: `Bearer ${cfg.hueCloudToken}` }
      : undefined;
    try {
      await smartHttpRequest(
        'PUT',
        `${baseUrl}/lights/${lightId}/state`,
        bridgePayload,
        headers
      );
    } catch {
      // Ignore
    }
  }

  return updated;
}

export async function updateAllHueRoomsAction(
  cfg: HueConfig,
  roomsOrAction:
    | HueRoom[]
    | { on?: boolean; bri?: number; brightness?: number; ct?: number },
  maybeAction?: { on?: boolean; bri?: number; brightness?: number; ct?: number }
): Promise<boolean> {
  const action =
    (Array.isArray(roomsOrAction) ? maybeAction : roomsOrAction) || {};

  const resolvedBri =
    typeof action.bri === 'number'
      ? Math.max(1, Math.min(254, Math.round(action.bri)))
      : typeof action.brightness === 'number' && action.brightness > 0
      ? percentToBri(action.brightness)
      : undefined;

  const resolvedOn =
    action.on !== undefined
      ? action.on
      : typeof action.brightness === 'number'
      ? action.brightness > 0
      : undefined;

  const bridgePayload: { on?: boolean; bri?: number; ct?: number } = {};
  if (resolvedOn !== undefined) bridgePayload.on = resolvedOn;
  if (resolvedBri !== undefined && resolvedOn !== false) {
    bridgePayload.bri = resolvedBri;
  }
  if (action.ct !== undefined) bridgePayload.ct = action.ct;

  if (cfg.webhookUrl) {
    fetch(cfg.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'all', ...bridgePayload }),
    }).catch(() => {});
  }

  const current = Array.isArray(roomsOrAction) ? roomsOrAction : loadDemoHueRooms();
  const updated = current.map((r) => {
    const nextOn = resolvedOn !== undefined ? resolvedOn : r.on;
    const nextBri = resolvedBri !== undefined ? resolvedBri : r.bri;
    return normalizeHueRoom({
      ...r,
      on: nextOn,
      anyOn: nextOn,
      bri: nextBri,
      ct: action.ct !== undefined ? action.ct : r.ct,
      lights: (r.lights || []).map((l) =>
        normalizeHueLight({
          ...l,
          on: nextOn,
          bri: resolvedBri !== undefined ? nextBri : l.bri,
        })
      ),
    });
  });
  saveDemoHueRooms(updated);

  const isLiveBridge = Boolean(
    cfg.username &&
      (cfg.bridgeIp || cfg.hueCloudToken) &&
      (cfg.connected === true || cfg.useDemoMode === false)
  );
  if (!isLiveBridge) return true;

  const ip = extractCleanBridgeIp(cfg.bridgeIp);
  const isCloud = Boolean(cfg.hueCloudToken);
  if ((ip || isCloud) && cfg.username) {
    const baseUrl = isCloud
      ? `https://api.meethue.com/route/api/${cfg.username}`
      : `http://${ip}/api/${cfg.username}`;
    const headers = isCloud
      ? { Authorization: `Bearer ${cfg.hueCloudToken}` }
      : undefined;
    try {
      await smartHttpRequest(
        'PUT',
        `${baseUrl}/groups/0/action`,
        bridgePayload,
        headers
      );
      return true;
    } catch {
      return false;
    }
  }

  return true;
}

export async function updateSelectedHueLightsAction(
  cfg: HueConfig,
  rooms: HueRoom[],
  favoriteLightKeys: Set<string>,
  action: { on?: boolean; bri?: number; brightness?: number },
  onlyRoomId?: string
): Promise<HueRoom[]> {
  const resolvedBri =
    typeof action.bri === 'number'
      ? Math.max(1, Math.min(254, Math.round(action.bri)))
      : typeof action.brightness === 'number' && action.brightness > 0
      ? percentToBri(action.brightness)
      : undefined;

  const resolvedOn =
    action.on !== undefined
      ? action.on
      : typeof action.brightness === 'number'
      ? action.brightness > 0
      : undefined;

  const bridgePayload: { on?: boolean; bri?: number } = {};
  if (resolvedOn !== undefined) bridgePayload.on = resolvedOn;
  if (resolvedBri !== undefined && resolvedOn !== false) {
    bridgePayload.bri = resolvedBri;
  }

  const targetLightIdsToUpdate: string[] = [];

  const updated = rooms.map((r) => {
    if (onlyRoomId && r.id !== onlyRoomId) return r;
    const roomLights = r.lights || [];
    let touchedInRoom = false;

    const nextLights = roomLights.map((l, idx) => {
      const lid = String(l.id || `${r.id}-l-${idx}`);
      const key = `${r.id}::${lid}`;
      const isFav =
        favoriteLightKeys.size === 0 ||
        favoriteLightKeys.has(key) ||
        favoriteLightKeys.has(lid);
      if (!isFav) return l;

      touchedInRoom = true;
      targetLightIdsToUpdate.push(lid);
      return normalizeHueLight({
        ...l,
        on: resolvedOn !== undefined ? resolvedOn : l.on,
        bri: resolvedBri !== undefined ? resolvedBri : l.bri,
      });
    });

    if (!touchedInRoom) return r;

    const anyOn = nextLights.some((l) => l.on);
    const activeLights = nextLights.filter((l) => l.on);
    const avgBri =
      activeLights.length > 0
        ? Math.round(
            activeLights.reduce((acc, l) => acc + l.bri, 0) / activeLights.length
          )
        : r.bri;

    return normalizeHueRoom({
      ...r,
      on: anyOn,
      anyOn,
      bri: avgBri,
      lights: nextLights,
    });
  });

  saveDemoHueRooms(updated);

  if (cfg.webhookUrl && targetLightIdsToUpdate.length > 0) {
    fetch(cfg.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: 'favorite-lights',
        lightIds: targetLightIdsToUpdate,
        ...bridgePayload,
      }),
    }).catch(() => {});
  }

  const isLiveBridge = Boolean(
    cfg.username &&
      (cfg.bridgeIp || cfg.hueCloudToken) &&
      (cfg.connected === true || cfg.useDemoMode === false)
  );
  if (!isLiveBridge || targetLightIdsToUpdate.length === 0) return updated;

  const ip = extractCleanBridgeIp(cfg.bridgeIp);
  const isCloud = Boolean(cfg.hueCloudToken);
  if ((ip || isCloud) && cfg.username) {
    const baseUrl = isCloud
      ? `https://api.meethue.com/route/api/${cfg.username}`
      : `http://${ip}/api/${cfg.username}`;
    const headers = isCloud
      ? { Authorization: `Bearer ${cfg.hueCloudToken}` }
      : undefined;
    try {
      const uniqueIds = Array.from(new Set(targetLightIdsToUpdate));
      await Promise.all(
        uniqueIds.map((lid) =>
          smartHttpRequest(
            'PUT',
            `${baseUrl}/lights/${lid}/state`,
            bridgePayload,
            headers
          )
        )
      );
    } catch {
      // Ignore
    }
  }

  return updated;
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

  if (
    typeof navigator !== 'undefined' &&
    /Android/i.test(navigator.userAgent || '') &&
    shortcut.androidPackage &&
    shortcut.deepLink
  ) {
    const scheme = shortcut.deepLink.replace(/:\/\/.*$/, '');
    const fallback = encodeURIComponent(shortcut.webUrl || 'https://google.com');
    const intentHref = `intent://#Intent;package=${shortcut.androidPackage};scheme=${scheme};S.browser_fallback_url=${fallback};end`;
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

  if (shortcut.deepLink && !shortcut.deepLink.startsWith('http')) {
    window.location.href = shortcut.deepLink;
    return;
  }

  if (shortcut.webUrl) {
    window.location.href = shortcut.webUrl;
  }
}
