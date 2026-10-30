import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ChefHat,
  ChevronDown,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  ExternalLink,
  FileText,
  Home,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  LightbulbOff,
  Maximize2,
  Moon,
  Music,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Settings,
  ShoppingCart,
  SkipBack,
  SkipForward,
  Sparkles,
  Speaker,
  Square,
  Sun,
  Tv,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
  X,
} from 'lucide-react';
import {
  BudgetMonth,
  CalendarEvent,
  EventCategory,
  GothenburgWeather,
  NavTab,
  NoteItem,
  PhotoAlbum,
  PhotoItem,
  RecipeIngredient,
  RecipeItem,
  ShoppingItem,
  TodoItem,
} from '../types';
import { getTodayDateString } from '../data/initialData';
import { classifySwedishGrocery } from '../utils/swedishGrocerySorter';
import { getApiUrl } from '../utils/apiUrl';
import {
  checkGooglePhotosRedirectResult,
  fetchSharedGooglePhotosAlbum,
  pollGooglePhotosPickerSession,
  startGooglePhotosOAuthFlow,
} from '../utils/googlePhotosClient';
import { HomeView } from './HomeView';
import {
  approveHueBridgeInChrome,
  connectHueCloudWithToken,
  discoverHueBridgeIp,
  fetchHueRooms,
  HueConfig,
  HueRoom,
  loadDemoHueRooms,
  loadHueConfig,
  pairHueBridge,
  saveDemoHueRooms,
  saveHueConfig,
  setNativeKeepScreenOn,
  startHueCloudOAuthPopup,
  updateAllHueRoomsAction,
  updateHueRoomAction,
  updateIndividualLightInRoom,
} from '../utils/philipsHueClient';
import {
  exchangeSpotifyCodeIfPresent,
  fetchSpotifyConnectDevices,
  fetchSpotifyConnectNowPlaying,
  getNativeSpotifyNowPlaying,
  getNetworkCastNowPlaying,
  loadSpotifyAuthConfig,
  openNativeGoogleHomeApp,
  openNativeSystemMediaOutputSwitcher,
  scanNetworkCastDevices,
  seekSpotifyConnectPosition,
  sendCastDeviceControl,
  sendNativeAndroidMediaControl,
  sendSpotifyConnectCommand,
  setSpotifyDeviceVolume,
  SpotifyConnectDevice,
  SpotifyNowPlaying,
  startSpotifyPkceLogin,
  transferSpotifyConnectPlayback,
} from '../utils/spotifyClient';

export type HubWidgetPageId =
  | 'calendar'
  | 'shopping'
  | 'todo'
  | 'notes'
  | 'recipes'
  | 'budget'
  | 'photos';

export type HubWidgetSize = 'small' | 'medium' | 'large';

export interface HubWidgetConfigItem {
  id: HubWidgetPageId;
  enabled: boolean;
  size: HubWidgetSize;
}

type AmbientMediaMode = 'photos' | 'video' | 'motion-art';

type HubPaletteId = 'expressive-plum' | 'forest-amber' | 'ocean-coral' | 'terracotta-sage' | 'oled-night';

interface HubPalette {
  id: HubPaletteId;
  name: string;
  subtitle: string;
  bgGradient: string;
  ambientFrameBg: string;
  ambientBorder: string;
  clockPrimary: string;
  clockSecondary: string;
  mediaCardBg: string;
  mediaCardText: string;
  mediaCardSub: string;
  mediaAccentBg: string;
  mediaAccentText: string;
  widgetBg: string;
  widgetAltBg: string;
  widgetBorder: string;
  pillBg: string;
  pillText: string;
  cardInnerBg: string;
}

const HUB_PALETTES: HubPalette[] = [
  {
    id: 'expressive-plum',
    name: 'Förslag 4 · M3 Expressive Plommon & Rosé',
    subtitle: 'Skulpterade former med pastellkontrast',
    bgGradient: 'linear-gradient(135deg, #170F23 0%, #241634 55%, #0F0918 100%)',
    ambientFrameBg: '#381B50',
    ambientBorder: 'rgba(245, 208, 254, 0.32)',
    clockPrimary: '#FAF5FF',
    clockSecondary: '#F5D0FE',
    mediaCardBg: 'linear-gradient(135deg, #F5D0FE 0%, #DDD6FE 100%)',
    mediaCardText: '#2E1065',
    mediaCardSub: '#581C87',
    mediaAccentBg: '#4A044E',
    mediaAccentText: '#F5D0FE',
    widgetBg: '#2B1842',
    widgetAltBg: '#361C52',
    widgetBorder: 'rgba(233, 213, 255, 0.26)',
    pillBg: '#F5D0FE',
    pillText: '#4A044E',
    cardInnerBg: '#422063',
  },
  {
    id: 'forest-amber',
    name: 'Skogsgrön & Varm Bärnsten',
    subtitle: 'Harmonisk naturpalett i M3 Expressive',
    bgGradient: 'linear-gradient(135deg, #0C1B14 0%, #142B20 55%, #08120D 100%)',
    ambientFrameBg: '#1B3B2C',
    ambientBorder: 'rgba(167, 243, 208, 0.3)',
    clockPrimary: '#ECFDF5',
    clockSecondary: '#A7F3D0',
    mediaCardBg: 'linear-gradient(135deg, #A7F3D0 0%, #FDE68A 100%)',
    mediaCardText: '#064E3B',
    mediaCardSub: '#065F46',
    mediaAccentBg: '#064E3B',
    mediaAccentText: '#ECFDF5',
    widgetBg: '#132A20',
    widgetAltBg: '#1A3629',
    widgetBorder: 'rgba(110, 231, 183, 0.25)',
    pillBg: '#FDE68A',
    pillText: '#422006',
    cardInnerBg: '#1E3F31',
  },
  {
    id: 'ocean-coral',
    name: 'Havsblå & Varm Korall',
    subtitle: 'Djupblå bas med ljusa pastellkort',
    bgGradient: 'linear-gradient(135deg, #081726 0%, #0F2942 55%, #06101B 100%)',
    ambientFrameBg: '#153758',
    ambientBorder: 'rgba(186, 230, 253, 0.3)',
    clockPrimary: '#F0F9FF',
    clockSecondary: '#BAE6FD',
    mediaCardBg: 'linear-gradient(135deg, #BAE6FD 0%, #FED7AA 100%)',
    mediaCardText: '#082F49',
    mediaCardSub: '#0C4A6E',
    mediaAccentBg: '#082F49',
    mediaAccentText: '#E0F2FE',
    widgetBg: '#0F2942',
    widgetAltBg: '#163756',
    widgetBorder: 'rgba(125, 211, 252, 0.26)',
    pillBg: '#FDBA74',
    pillText: '#431407',
    cardInnerBg: '#1B4368',
  },
  {
    id: 'terracotta-sage',
    name: 'Terrakotta & Salvia',
    subtitle: 'Varm jordtonad familjehubb',
    bgGradient: 'linear-gradient(135deg, #21110A 0%, #311A10 55%, #120905 100%)',
    ambientFrameBg: '#432012',
    ambientBorder: 'rgba(253, 186, 116, 0.3)',
    clockPrimary: '#FFEDD5',
    clockSecondary: '#FDBA74',
    mediaCardBg: 'linear-gradient(135deg, #FFEDD5 0%, #FDBA74 100%)',
    mediaCardText: '#431407',
    mediaCardSub: '#7C2D12',
    mediaAccentBg: '#431407',
    mediaAccentText: '#FFEDD5',
    widgetBg: '#2B160E',
    widgetAltBg: '#361C12',
    widgetBorder: 'rgba(253, 186, 116, 0.25)',
    pillBg: '#FDBA74',
    pillText: '#431407',
    cardInnerBg: '#462315',
  },
  {
    id: 'oled-night',
    name: 'OLED Nattläge (Sovrum)',
    subtitle: 'Extra dämpad kontrast för kväll & natt',
    bgGradient: 'linear-gradient(135deg, #030305 0%, #090A0F 60%, #000000 100%)',
    ambientFrameBg: '#11131C',
    ambientBorder: 'rgba(148, 163, 184, 0.2)',
    clockPrimary: '#E2E8F0',
    clockSecondary: '#94A3B8',
    mediaCardBg: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    mediaCardText: '#F8FAFC',
    mediaCardSub: '#94A3B8',
    mediaAccentBg: '#38BDF8',
    mediaAccentText: '#082F49',
    widgetBg: '#0F131D',
    widgetAltBg: '#151B28',
    widgetBorder: 'rgba(148, 163, 184, 0.18)',
    pillBg: '#38BDF8',
    pillText: '#082F49',
    cardInnerBg: '#1E2536',
  },
];

const HUB_WIDGETS_STORAGE_KEY = 'vn_hub_m3_widgets_v4';
const HUB_AMBIENT_MODE_KEY = 'vn_hub_ambient_mode_v4';
const HUB_PALETTE_KEY = 'vn_hub_palette_v4';
const HUB_DIMMER_KEY = 'vn_screensaver_dimmer_v1';
const HUB_PHOTO_ALBUM_KEY = 'vn_nesthub_photo_album_v1';
const HUB_PHOTO_DURATION_KEY = 'vn_hub_photo_duration_sec_v1';
const HUB_VIDEO_INDEX_KEY = 'vn_hub_video_idx_v4';
const HUB_CUSTOM_SPEAKERS_KEY = 'vn_hub_real_speakers_v5';
const HUB_GOOGLE_PHOTOS_ITEMS_KEY = 'vn_hub_google_photos_items_v1';
const HUB_GOOGLE_PHOTOS_ALBUM_URL_KEY = 'vn_hub_google_photos_album_url_v1';
const HUB_GOOGLE_PHOTOS_ACCOUNT_KEY = 'vn_hub_google_photos_account_v1';

const PHOTO_DURATION_OPTIONS: { seconds: number; label: string }[] = [
  { seconds: 5, label: '5 sek' },
  { seconds: 10, label: '10 sek' },
  { seconds: 15, label: '15 sek' },
  { seconds: 30, label: '30 sek' },
  { seconds: 60, label: '1 min' },
  { seconds: 300, label: '5 min' },
];

const DEFAULT_HUB_WIDGETS: HubWidgetConfigItem[] = [
  { id: 'calendar', enabled: true, size: 'large' },
  { id: 'shopping', enabled: true, size: 'medium' },
  { id: 'todo', enabled: true, size: 'small' },
  { id: 'budget', enabled: true, size: 'small' },
  { id: 'recipes', enabled: false, size: 'medium' },
  { id: 'notes', enabled: false, size: 'small' },
  { id: 'photos', enabled: false, size: 'medium' },
];

const WIDGET_PAGE_META: Record<
  HubWidgetPageId,
  { title: string; subtitle: string; badgeBg: string; badgeText: string }
> = {
  calendar: {
    title: 'Kalender',
    subtitle: 'Kommande händelser & familjeschema',
    badgeBg: '#F5D0FE',
    badgeText: '#4A044E',
  },
  shopping: {
    title: 'Inköpslista',
    subtitle: 'Bocka av och lägg till varor med ett tryck',
    badgeBg: '#DDD6FE',
    badgeText: '#2E1065',
  },
  todo: {
    title: 'Att göra',
    subtitle: 'Hushållets uppgifter & kom-ihåg',
    badgeBg: '#FBCFE8',
    badgeText: '#831843',
  },
  budget: {
    title: 'Budget',
    subtitle: 'Kvar att använda & snabba utgifter',
    badgeBg: '#FDE68A',
    badgeText: '#422006',
  },
  recipes: {
    title: 'Recept',
    subtitle: 'Kvällens middag, ingredienser & köksläge',
    badgeBg: '#FDBA74',
    badgeText: '#431407',
  },
  notes: {
    title: 'Anteckningar',
    subtitle: 'Fästa anteckningar & checklistor',
    badgeBg: '#FEF08A',
    badgeText: '#422006',
  },
  photos: {
    title: 'Bilder & Album',
    subtitle: 'Galleri-widget från familjens fotoalbum',
    badgeBg: '#BAE6FD',
    badgeText: '#082F49',
  },
};

const AMBIENT_VIDEOS = [
  {
    id: 'nordic-waves',
    title: 'Nordisk Kust & Vågor',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'forest-mist',
    title: 'Skogsglänta & Morgonljus',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    poster: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'stars-night',
    title: 'Stjärnhimmel & Aurora',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4',
    poster: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  },
];

const FALLBACK_AMBIENT_PHOTOS: Array<{ id: string; imageUrl: string; caption: string }> = [
  {
    id: 'fallback-1',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Bohuslän · Hemma hos F',
  },
  {
    id: 'fallback-2',
    imageUrl:
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
    caption: 'Familjealbum · Sommarminnen',
  },
  {
    id: 'fallback-3',
    imageUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    caption: 'Nordisk natur · Levande fotoram',
  },
];

const DEFAULT_HOME_SPEAKERS: SpotifyConnectDevice[] = [];

function loadHubWidgetsConfig(): HubWidgetConfigItem[] {
  try {
    const raw = localStorage.getItem(HUB_WIDGETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const known = new Set(DEFAULT_HUB_WIDGETS.map((w) => w.id));
        const valid: HubWidgetConfigItem[] = parsed.filter(
          (w: any) => w && known.has(w.id)
        );
        for (const def of DEFAULT_HUB_WIDGETS) {
          if (!valid.some((v) => v.id === def.id)) {
            valid.push(def);
          }
        }
        return valid;
      }
    }
  } catch {
    // Ignore
  }
  return DEFAULT_HUB_WIDGETS;
}

function saveHubWidgetsConfig(cfg: HubWidgetConfigItem[]) {
  try {
    localStorage.setItem(HUB_WIDGETS_STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // Ignore
  }
}

function formatDurationShort(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getSwedishWeatherDescription(code: number): string {
  if (code === 0) return 'Klart';
  if (code === 1 || code === 2) return 'Halvklart';
  if (code === 3) return 'Mulet';
  if (code === 45 || code === 48) return 'Dimma';
  if (code >= 51 && code <= 57) return 'Duggregn';
  if (code >= 61 && code <= 67) return 'Regn';
  if (code >= 71 && code <= 77) return 'Snöfall';
  if (code >= 80 && code <= 82) return 'Regnskurar';
  if (code >= 95) return 'Åska';
  return 'Halvklart';
}

function getWeatherIcon(code: number, className = 'h-6 w-6') {
  if (code === 0) return <Sun className={`${className} text-[#FACC15]`} />;
  if (code === 1 || code === 2)
    return <CloudSun className={`${className} text-[#FACC15]`} />;
  if (code === 3 || code === 45 || code === 48)
    return <Cloud className={`${className} text-[#CBD5E1]`} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className={`${className} text-[#7DD3FC]`} />;
  if (code >= 71 && code <= 77)
    return <CloudSnow className={`${className} text-[#E0F2FE]`} />;
  if (code >= 95)
    return <CloudLightning className={`${className} text-[#C4B5FD]`} />;
  return <CloudSun className={`${className} text-[#FACC15]`} />;
}

// ============================================================================
// GOOGLE HOME STYLE TOUCH-SWIPE PILL SLIDER (Scroll-Safe + Google Home Feel)
// ============================================================================
interface GoogleHomeTouchSliderProps {
  title: string;
  subtitle: string;
  brightness: number;
  isOn: boolean;
  accentFillColor: string;
  trackBgColor: string;
  activeTextColor: string;
  inactiveTextColor: string;
  onChangeBrightness: (nextVal: number) => void;
  onToggle: () => void;
}

const GoogleHomeTouchSlider: React.FC<GoogleHomeTouchSliderProps> = ({
  title,
  subtitle,
  brightness,
  isOn,
  accentFillColor,
  trackBgColor,
  activeTextColor,
  inactiveTextColor,
  onChangeBrightness,
  onToggle,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startBrightness: number;
    gestureLocked: 'none' | 'horizontal' | 'vertical';
    maxDx: number;
    maxDy: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startBrightness: 0,
    gestureLocked: 'none',
    maxDx: 0,
    maxDy: 0,
  });

  const effectivePercent = isOn ? Math.max(5, brightness) : 0;

  return (
    <div
      ref={trackRef}
      onPointerDown={(e) => {
        dragStateRef.current = {
          active: true,
          startX: e.clientX,
          startY: e.clientY,
          startBrightness: isOn ? brightness : 0,
          gestureLocked: 'none',
          maxDx: 0,
          maxDy: 0,
        };
      }}
      onPointerMove={(e) => {
        const st = dragStateRef.current;
        if (!st.active) return;
        const dx = Math.abs(e.clientX - st.startX);
        const dy = Math.abs(e.clientY - st.startY);
        if (dx > st.maxDx) st.maxDx = dx;
        if (dy > st.maxDy) st.maxDy = dy;

        if (st.gestureLocked === 'none') {
          // If the user is scrolling vertically, immediately yield to browser scroll
          if (dy > 7 && dy >= dx * 0.8) {
            st.gestureLocked = 'vertical';
            st.active = false;
            return;
          }
          // Only lock into horizontal brightness slide on an intentional horizontal swipe
          if (dx > 12 && dx > dy * 1.6) {
            st.gestureLocked = 'horizontal';
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Ignore
            }
          }
        }

        if (st.gestureLocked === 'horizontal') {
          const el = trackRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0) return;
          const deltaPct = ((e.clientX - st.startX) / rect.width) * 100;
          const nextPct = Math.max(
            0,
            Math.min(100, Math.round(st.startBrightness + deltaPct))
          );
          onChangeBrightness(nextPct);
        }
      }}
      onPointerUp={(e) => {
        const st = dragStateRef.current;
        if (!st.active) return;
        const locked = st.gestureLocked;
        const tapOnly = locked === 'none' && st.maxDx < 7 && st.maxDy < 7;
        st.active = false;
        st.gestureLocked = 'none';
        if (locked === 'horizontal') {
          try {
            e.currentTarget.releasePointerCapture(e.pointerId);
          } catch {
            // Ignore
          }
        }
        if (tapOnly) {
          onToggle();
        }
      }}
      onPointerCancel={() => {
        dragStateRef.current.active = false;
        dragStateRef.current.gestureLocked = 'vertical';
      }}
      style={{ backgroundColor: trackBgColor, touchAction: 'pan-y' }}
      className="relative h-20 sm:h-24 w-full rounded-[30px] sm:rounded-[34px] overflow-hidden select-none touch-pan-y cursor-ew-resize shadow-md border border-white/10 transition-transform"
    >
      {/* Dynamic Google Home Fill Bar */}
      <div
        style={{
          width: `${effectivePercent}%`,
          backgroundColor: accentFillColor,
          transition:
            dragStateRef.current.gestureLocked === 'horizontal'
              ? 'none'
              : 'width 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="absolute inset-y-0 left-0 rounded-[30px] sm:rounded-[34px]"
      />

      {/* Foreground Content */}
      <div className="relative z-10 h-full px-4 sm:px-5 flex items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={{
              backgroundColor: isOn ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.1)',
              color: isOn ? activeTextColor : inactiveTextColor,
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
          >
            {isOn ? (
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <LightbulbOff className="w-5 h-5 sm:w-6 sm:h-6 opacity-70" />
            )}
          </div>
          <div className="min-w-0">
            <div
              style={{
                color: isOn && effectivePercent > 35 ? activeTextColor : inactiveTextColor,
              }}
              className="text-base sm:text-lg font-black truncate leading-tight"
            >
              {title}
            </div>
            <div
              style={{
                color: isOn && effectivePercent > 35 ? activeTextColor : inactiveTextColor,
                opacity: 0.82,
              }}
              className="text-xs font-bold truncate mt-0.5"
            >
              {subtitle}
            </div>
          </div>
        </div>

        <div
          style={{
            color: isOn && effectivePercent > 80 ? activeTextColor : inactiveTextColor,
          }}
          className="text-base sm:text-xl font-black tabular-nums shrink-0"
        >
          {isOn ? `${effectivePercent}%` : 'Av'}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SCROLL-SAFE HORIZONTAL SLIDER (For Volume & Scrubber — Never Blocks Scroll)
// ============================================================================
interface TouchSafeHorizontalSliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (nextValue: number) => void;
  fillColor?: string;
  trackColor?: string;
  thumbColor?: string;
  heightClass?: string;
}

const TouchSafeHorizontalSlider: React.FC<TouchSafeHorizontalSliderProps> = ({
  value,
  min = 0,
  max = 100,
  onChange,
  fillColor = 'currentColor',
  trackColor = 'rgba(0,0,0,0.18)',
  thumbColor = 'currentColor',
  heightClass = 'h-7',
}) => {
  const barRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startVal: number;
    locked: 'none' | 'horizontal' | 'vertical';
    maxDx: number;
    maxDy: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startVal: value,
    locked: 'none',
    maxDx: 0,
    maxDy: 0,
  });

  const range = Math.max(1, max - min);
  const ratio = Math.max(0, Math.min(1, (value - min) / range));

  const valueFromClientX = (clientX: number) => {
    const el = barRef.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return value;
    const r = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(min + r * range);
  };

  return (
    <div
      ref={barRef}
      style={{ touchAction: 'pan-y' }}
      onPointerDown={(e) => {
        stateRef.current = {
          active: true,
          startX: e.clientX,
          startY: e.clientY,
          startVal: value,
          locked: 'none',
          maxDx: 0,
          maxDy: 0,
        };
      }}
      onPointerMove={(e) => {
        const st = stateRef.current;
        if (!st.active) return;
        const dx = Math.abs(e.clientX - st.startX);
        const dy = Math.abs(e.clientY - st.startY);
        if (dx > st.maxDx) st.maxDx = dx;
        if (dy > st.maxDy) st.maxDy = dy;

        if (st.locked === 'none') {
          if (dy > 7 && dy >= dx * 0.8) {
            st.locked = 'vertical';
            st.active = false;
            return;
          }
          if (dx > 10 && dx > dy * 1.5) {
            st.locked = 'horizontal';
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Ignore
            }
          }
        }

        if (st.locked === 'horizontal') {
          const el = barRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0) return;
          const deltaVal = ((e.clientX - st.startX) / rect.width) * range;
          const next = Math.max(min, Math.min(max, Math.round(st.startVal + deltaVal)));
          onChange(next);
        }
      }}
      onPointerUp={(e) => {
        const st = stateRef.current;
        if (!st.active) return;
        const locked = st.locked;
        const isStationaryTap = locked === 'none' && st.maxDx < 6 && st.maxDy < 6;
        st.active = false;
        st.locked = 'none';
        if (locked === 'horizontal') {
          try {
            e.currentTarget.releasePointerCapture(e.pointerId);
          } catch {
            // Ignore
          }
        }
        if (isStationaryTap) {
          onChange(valueFromClientX(e.clientX));
        }
      }}
      onPointerCancel={() => {
        stateRef.current.active = false;
        stateRef.current.locked = 'vertical';
      }}
      className={`relative w-full ${heightClass} flex items-center select-none touch-pan-y cursor-ew-resize`}
    >
      <div
        style={{ backgroundColor: trackColor }}
        className="w-full h-2.5 rounded-full overflow-hidden relative"
      >
        <div
          style={{
            width: `${Math.round(ratio * 100)}%`,
            backgroundColor: fillColor,
          }}
          className="h-full rounded-full"
        />
      </div>
      <div
        style={{
          left: `calc(${Math.round(ratio * 100)}% - 8px)`,
          backgroundColor: thumbColor,
        }}
        className="absolute w-4 h-4 rounded-full shadow-md pointer-events-none"
      />
    </div>
  );
};

export interface ScreensaverViewProps {
  open: boolean;
  onClose: () => void;
  onNavigateAppTab?: (tab: NavTab) => void;
  events: CalendarEvent[];
  categories: EventCategory[];
  todos: TodoItem[];
  notes: NoteItem[];
  shopping: ShoppingItem[];
  recipes: RecipeItem[];
  budgetMonths?: BudgetMonth[];
  photos?: PhotoItem[];
  photoAlbums?: PhotoAlbum[];
  memberName: string;
  idleMinutes: number;
  onChangeIdleMinutes: (minutes: number) => void;
  onToggleShoppingChecked: (id: string) => void;
  onAddShoppingItem: (item: Omit<ShoppingItem, 'id' | 'addedAt'>) => void;
  onClearCheckedShopping: () => void;
  onToggleTodo: (id: string) => void;
  onAddTodo: (todo: Omit<TodoItem, 'id' | 'updatedAt'>) => void;
  onToggleNoteChecklistItem: (noteId: string, itemId: string) => void;
  onAddEvent: (evt: Omit<CalendarEvent, 'id' | 'updatedAt'>) => void;
  onDeleteEventDirect: (eventId: string) => void;
  onSendIngredientsToShopping: (
    ingredients: RecipeIngredient[],
    recipeTitle: string
  ) => void;
  onAddBudgetExpense?: (title: string, amount: number) => void;
  onAddNoteDirect?: (title: string, content: string) => void;
}

export const ScreensaverView: React.FC<ScreensaverViewProps> = ({
  open,
  onClose,
  onNavigateAppTab,
  events,
  categories,
  todos,
  notes,
  shopping,
  recipes,
  budgetMonths = [],
  photos = [],
  photoAlbums = [],
  memberName,
  idleMinutes,
  onChangeIdleMinutes,
  onToggleShoppingChecked,
  onAddShoppingItem,
  onClearCheckedShopping,
  onToggleTodo,
  onAddTodo,
  onToggleNoteChecklistItem,
  onAddEvent,
  onDeleteEventDirect,
  onSendIngredientsToShopping,
  onAddBudgetExpense,
  onAddNoteDirect,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<GothenburgWeather>({
    tempC: 18,
    description: 'Klart',
    code: 0,
    highC: 19,
    lowC: 12,
  });

  // Hub Mode visual & ambient state
  const [paletteId, setPaletteId] = useState<HubPaletteId>(() => {
    const saved = localStorage.getItem(HUB_PALETTE_KEY) as HubPaletteId | null;
    return saved && HUB_PALETTES.some((p) => p.id === saved) ? saved : 'expressive-plum';
  });
  const [ambientMode, setAmbientMode] = useState<AmbientMediaMode>(() => {
    const saved = localStorage.getItem(HUB_AMBIENT_MODE_KEY) as AmbientMediaMode | null;
    return saved === 'video' || saved === 'motion-art' || saved === 'photos'
      ? saved
      : 'photos';
  });
  const [dimmerPercent, setDimmerPercent] = useState<number>(() => {
    const raw = Number(localStorage.getItem(HUB_DIMMER_KEY));
    return Number.isFinite(raw) ? Math.max(0, Math.min(85, raw)) : 0;
  });
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(() => {
    return localStorage.getItem(HUB_PHOTO_ALBUM_KEY) || 'ALL';
  });
  const [photoDurationSec, setPhotoDurationSec] = useState<number>(() => {
    const raw = Number(localStorage.getItem(HUB_PHOTO_DURATION_KEY));
    return PHOTO_DURATION_OPTIONS.some((o) => o.seconds === raw) ? raw : 10;
  });
  const [photoSlideIdx, setPhotoSlideIdx] = useState(0);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<Record<string, boolean>>({});
  const [videoIdx, setVideoIdx] = useState<number>(() => {
    const raw = Number(localStorage.getItem(HUB_VIDEO_INDEX_KEY));
    return Number.isFinite(raw) && raw >= 0 && raw < AMBIENT_VIDEOS.length ? raw : 0;
  });

  // Google Photos integration state (Shared Album Link + Google OAuth Picker/Library/Drive)
  const [googlePhotosList, setGooglePhotosList] = useState<
    Array<{ id: string; imageUrl: string; caption: string }>
  >(() => {
    try {
      const raw = localStorage.getItem(HUB_GOOGLE_PHOTOS_ITEMS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(
              (item: any) =>
                item &&
                typeof item.imageUrl === 'string' &&
                item.imageUrl.trim().length > 0
            )
            .map((item: any) => ({
              ...item,
              imageUrl: String(item.imageUrl).replace(/=w1920-h1080$/, '=w3840-h2160'),
            }));
        }
      }
    } catch {
      // Ignore
    }
    return [];
  });
  const [googlePhotosAlbumUrl, setGooglePhotosAlbumUrl] = useState<string>(() => {
    return localStorage.getItem(HUB_GOOGLE_PHOTOS_ALBUM_URL_KEY) || '';
  });
  const [googlePhotosAccountLabel, setGooglePhotosAccountLabel] = useState<string>(() => {
    return localStorage.getItem(HUB_GOOGLE_PHOTOS_ACCOUNT_KEY) || '';
  });
  const [isFetchingGooglePhotos, setIsFetchingGooglePhotos] = useState(false);
  const [googlePhotosStatus, setGooglePhotosStatus] = useState<string | null>(null);
  const [googlePickerUri, setGooglePickerUri] = useState<string | null>(null);
  const [googlePickerSession, setGooglePickerSession] = useState<{
    sessionId: string;
    accessToken: string;
  } | null>(null);

  // Customizable M3 Expressive Widgets for all 7 pages
  const [widgetsConfig, setWidgetsConfig] = useState<HubWidgetConfigItem[]>(() =>
    loadHubWidgetsConfig()
  );
  const [showWidgetCustomizer, setShowWidgetCustomizer] = useState(false);

  // Bottom-Left Lamp FAB Menu & Bottom-Right App Start Page FAB Menu states
  const [showGoogleHomeDrawer, setShowGoogleHomeDrawer] = useState(false);
  const [showAppStartPageFab, setShowAppStartPageFab] = useState(false);
  const [hueConfig, setHueConfig] = useState<HueConfig>(() => loadHueConfig());
  const [hueRooms, setHueRooms] = useState<HueRoom[]>(() => loadDemoHueRooms());
  const [isPairingHue, setIsPairingHue] = useState(false);
  const [hueStatusMsg, setHueStatusMsg] = useState<string | null>(null);

  // Network Media & Cast Controller state (Spotify Connect + Google TV Streamer 4K + Local Network)
  // NOTE: Null when nothing is playing ("Om inget spelas så syns inte kontrollerna alls")
  const [spotifyNowPlaying, setSpotifyNowPlaying] = useState<SpotifyNowPlaying | null>(null);
  const [isCastMuted, setIsCastMuted] = useState(false);
  const [isScanningNetwork, setIsScanningNetwork] = useState(false);
  const [networkScanStatus, setNetworkScanStatus] = useState<string | null>(null);
  const [showSpeakerMenu, setShowSpeakerMenu] = useState(false);
  const [speakers, setSpeakers] = useState<SpotifyConnectDevice[]>(() => {
    try {
      const saved = localStorage.getItem(HUB_CUSTOM_SPEAKERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return DEFAULT_HOME_SPEAKERS;
  });
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [newSpeakerType, setNewSpeakerType] = useState<'Speaker' | 'TV'>('Speaker');
  const wavyScrubberDragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    locked: 'none' | 'horizontal' | 'vertical';
    maxDx: number;
    maxDy: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    locked: 'none',
    maxDx: 0,
    maxDy: 0,
  });

  // Inline quick-add states for widgets
  const [shopQuickInput, setShopQuickInput] = useState('');
  const [todoQuickInput, setTodoQuickInput] = useState('');
  const [calQuickTitle, setCalQuickTitle] = useState('');
  const [calQuickTime, setCalQuickTime] = useState('18:00');
  const [showCalQuickAdd, setShowCalQuickAdd] = useState(false);
  const [budgetQuickTitle, setBudgetQuickTitle] = useState('');
  const [budgetQuickAmount, setBudgetQuickAmount] = useState('');
  const [showBudgetQuickAdd, setShowBudgetQuickAdd] = useState(false);
  const [noteQuickTitle, setNoteQuickTitle] = useState('');
  const [noteQuickBody, setNoteQuickBody] = useState('');
  const [showNoteQuickAdd, setShowNoteQuickAdd] = useState(false);
  const [activeNoteReader, setActiveNoteReader] = useState<NoteItem | null>(null);
  const [activeRecipeReader, setActiveRecipeReader] = useState<RecipeItem | null>(null);

  const activePalette = useMemo(
    () => HUB_PALETTES.find((p) => p.id === paletteId) || HUB_PALETTES[0],
    [paletteId]
  );

  // Fetch photos from a shared Google Photos album link (works directly in browser/mobile + backend fallback)
  const handleFetchSharedGooglePhotosAlbum = useCallback(
    async (urlOverride?: string, silent = false) => {
      const targetUrl = (urlOverride ?? googlePhotosAlbumUrl).trim();
      if (!targetUrl) {
        if (!silent) {
          setGooglePhotosStatus(
            'Klistra in en delningslänk till ett album i Google Foto (t.ex. https://photos.app.goo.gl/...).'
          );
        }
        return;
      }
      if (!silent) {
        setIsFetchingGooglePhotos(true);
        setGooglePhotosStatus('Hämtar bilder i full upplösning från Google Foto...');
      }
      try {
        const result = await fetchSharedGooglePhotosAlbum(targetUrl);
        const fetchedList = result.photos;
        const label = String(result.albumTitle || 'Google Foto-album');
        setGooglePhotosList(fetchedList);
        setGooglePhotosAccountLabel(label);
        try {
          localStorage.setItem(HUB_GOOGLE_PHOTOS_ITEMS_KEY, JSON.stringify(fetchedList));
          localStorage.setItem(HUB_GOOGLE_PHOTOS_ALBUM_URL_KEY, targetUrl);
          localStorage.setItem(HUB_GOOGLE_PHOTOS_ACCOUNT_KEY, label);
        } catch {
          // Ignore
        }
        if (!silent) {
          setSelectedAlbumId('GOOGLE_PHOTOS');
          setPhotoSlideIdx(0);
          localStorage.setItem(HUB_PHOTO_ALBUM_KEY, 'GOOGLE_PHOTOS');
          setGooglePhotosStatus(
            `Hämtade ${fetchedList.length} bilder i originalupplösning från "${label}"!`
          );
        }
      } catch (err: any) {
        if (!silent) {
          setGooglePhotosStatus(
            err?.message ||
              'Kunde inte hämta bilder från länken. Kontrollera att länkdelning är aktiverad i Google Foto.'
          );
        }
      } finally {
        if (!silent) {
          setIsFetchingGooglePhotos(false);
        }
      }
    },
    [googlePhotosAlbumUrl]
  );

  // Connect Google account directly via OAuth to fetch Google Photos / Picker / Drive Photos
  const handleConnectGooglePhotosOAuth = useCallback(async () => {
    setIsFetchingGooglePhotos(true);
    setGooglePhotosStatus('Öppnar Google-inloggning för Google Foto...');
    setGooglePickerUri(null);
    try {
      const res = await startGooglePhotosOAuthFlow((msg) => setGooglePhotosStatus(msg));

      if (res.pickerUri) {
        setGooglePickerUri(res.pickerUri);
      }
      if (res.pickerSessionId && res.accessToken) {
        setGooglePickerSession({
          sessionId: res.pickerSessionId,
          accessToken: res.accessToken,
        });
      }

      if (res.photos.length > 0) {
        const merged = [...res.photos, ...googlePhotosList].filter(
          (v, idx, arr) => arr.findIndex((x) => x.imageUrl === v.imageUrl) === idx
        );
        setGooglePhotosList(merged);
        setGooglePhotosAccountLabel(res.email);
        setSelectedAlbumId('GOOGLE_PHOTOS');
        setPhotoSlideIdx(0);
        try {
          localStorage.setItem(HUB_GOOGLE_PHOTOS_ITEMS_KEY, JSON.stringify(merged));
          localStorage.setItem(HUB_GOOGLE_PHOTOS_ACCOUNT_KEY, res.email);
          localStorage.setItem(HUB_PHOTO_ALBUM_KEY, 'GOOGLE_PHOTOS');
        } catch {
          // Ignore
        }
        setGooglePhotosStatus(
          `Kopplad till Google Foto (${res.email}) — ${res.photos.length} bilder synkade i full upplösning!`
        );
      } else {
        setGooglePhotosAccountLabel(res.email);
        try {
          localStorage.setItem(HUB_GOOGLE_PHOTOS_ACCOUNT_KEY, res.email);
        } catch {
          // Ignore
        }
        setGooglePhotosStatus(
          res.pickerUri
            ? `Inloggad som ${res.email}! Klicka på "Öppna Google Foto" nedan för att välja bilder, eller klistra in en delad albumlänk.`
            : `Inloggad som ${res.email}. Klistra in en delningslänk till ditt Google Foto-album nedan för att synka hela albumet direkt!`
        );
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg === ' OAUTH_REDIRECT_STARTED ' || msg.includes('OAUTH_REDIRECT_STARTED')) {
        return;
      }
      setGooglePhotosStatus(
        msg ||
          'Inloggningen mot Google avbröts. Du kan även klistra in en delad albumlänk från Google Foto direkt i fältet nedan.'
      );
    } finally {
      setIsFetchingGooglePhotos(false);
    }
  }, [googlePhotosList]);

  // Check if returning from a Google OAuth redirect flow
  useEffect(() => {
    let active = true;
    checkGooglePhotosRedirectResult().then((res) => {
      if (!active || !res) return;
      if (res.pickerUri) setGooglePickerUri(res.pickerUri);
      if (res.pickerSessionId && res.accessToken) {
        setGooglePickerSession({
          sessionId: res.pickerSessionId,
          accessToken: res.accessToken,
        });
      }
      if (res.photos.length > 0) {
        setGooglePhotosList((prev) => {
          const merged = [...res.photos, ...prev].filter(
            (v, idx, arr) => arr.findIndex((x) => x.imageUrl === v.imageUrl) === idx
          );
          try {
            localStorage.setItem(HUB_GOOGLE_PHOTOS_ITEMS_KEY, JSON.stringify(merged));
          } catch {
            // Ignore
          }
          return merged;
        });
        setSelectedAlbumId('GOOGLE_PHOTOS');
        localStorage.setItem(HUB_PHOTO_ALBUM_KEY, 'GOOGLE_PHOTOS');
      }
      if (res.email) {
        setGooglePhotosAccountLabel(res.email);
        localStorage.setItem(HUB_GOOGLE_PHOTOS_ACCOUNT_KEY, res.email);
        setGooglePhotosStatus(
          `Kopplad till Google Foto (${res.email})${
            res.photos.length > 0 ? ` — ${res.photos.length} bilder synkade!` : '!'
          }`
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Poll active Google Photos Picker session when user selects photos in Google Photos Picker
  useEffect(() => {
    if (!googlePickerSession) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled) return;
      const picked = await pollGooglePhotosPickerSession(
        googlePickerSession.sessionId,
        googlePickerSession.accessToken
      );
      if (!cancelled && picked && picked.length > 0) {
        setGooglePhotosList((prev) => {
          const merged = [...picked, ...prev].filter(
            (v, idx, arr) => arr.findIndex((x) => x.imageUrl === v.imageUrl) === idx
          );
          try {
            localStorage.setItem(HUB_GOOGLE_PHOTOS_ITEMS_KEY, JSON.stringify(merged));
          } catch {
            // Ignore
          }
          return merged;
        });
        setSelectedAlbumId('GOOGLE_PHOTOS');
        setPhotoSlideIdx(0);
        localStorage.setItem(HUB_PHOTO_ALBUM_KEY, 'GOOGLE_PHOTOS');
        setGooglePhotosStatus(
          `Hämtade ${picked.length} valda bilder från Google Foto i full upplösning!`
        );
        setGooglePickerSession(null);
        setGooglePickerUri(null);
      }
    }, 3500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [googlePickerSession]);

  // Auto-refresh shared Google Photos album when screensaver opens
  useEffect(() => {
    if (!open || !googlePhotosAlbumUrl.trim()) return;
    handleFetchSharedGooglePhotosAlbum(googlePhotosAlbumUrl, true);
  }, [open, googlePhotosAlbumUrl, handleFetchSharedGooglePhotosAlbum]);

  // Keep screen awake on Android tablet while screensaver is open
  useEffect(() => {
    setNativeKeepScreenOn(open);
    return () => setNativeKeepScreenOn(false);
  }, [open]);

  // Clock ticker + live progress advancement for active playback
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => {
      setNow(new Date());
      setSpotifyNowPlaying((prev) => {
        if (!prev || !prev.isPlaying) return prev;
        const dur = prev.durationMs || 0;
        if (dur <= 0) return prev;
        const nextProg = (prev.progressMs || 0) + 1000;
        return {
          ...prev,
          progressMs: nextProg > dur ? dur : nextProg,
        };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [open]);

  // Normalize app photos (supports both p.imageUrl from types.ts and legacy p.dataUrl)
  const validAppPhotos = useMemo(() => {
    return photos
      .map((p) => {
        const rawUrl = String(
          p.imageUrl || (p as any).dataUrl || (p as any).url || ''
        ).trim();
        const alb = photoAlbums.find((a) => a.id === p.albumId);
        const albTitle = alb?.name || (alb as any)?.title || 'Familjealbum';
        return {
          id: p.id,
          albumId: p.albumId,
          imageUrl: rawUrl,
          caption: p.caption || albTitle,
        };
      })
      .filter((p) => p.imageUrl.length > 0 && !failedPhotoUrls[p.imageUrl]);
  }, [photos, photoAlbums, failedPhotoUrls]);

  const validGooglePhotos = useMemo(() => {
    return googlePhotosList.filter(
      (gp) =>
        gp &&
        typeof gp.imageUrl === 'string' &&
        gp.imageUrl.trim().length > 0 &&
        !failedPhotoUrls[gp.imageUrl]
    );
  }, [googlePhotosList, failedPhotoUrls]);

  // Slideshow rotation — uses the user's own photos from the app & Google Photos across the full screen
  const ambientPhotosList = useMemo(() => {
    if (selectedAlbumId === 'GOOGLE_PHOTOS') {
      if (validGooglePhotos.length > 0) return validGooglePhotos;
    }

    if (selectedAlbumId === 'ALL') {
      const combined = [...validAppPhotos, ...validGooglePhotos];
      if (combined.length > 0) return combined;
    } else if (selectedAlbumId !== 'GOOGLE_PHOTOS') {
      const albumFiltered = validAppPhotos.filter(
        (p) => p.albumId === selectedAlbumId
      );
      if (albumFiltered.length > 0) return albumFiltered;
    }

    const anyUserPhotos = [...validAppPhotos, ...validGooglePhotos];
    if (anyUserPhotos.length > 0) {
      return anyUserPhotos;
    }
    return FALLBACK_AMBIENT_PHOTOS;
  }, [validAppPhotos, validGooglePhotos, selectedAlbumId]);

  useEffect(() => {
    if (!open) return;
    const intervalMs = Math.max(3000, photoDurationSec * 1000);
    const timer = setInterval(() => {
      setPhotoSlideIdx((prev) => (prev + 1) % Math.max(1, ambientPhotosList.length));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [open, ambientPhotosList.length, photoDurationSec]);

  // Fetch Gothenburg Weather
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const loadWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=57.7089&longitude=11.9746&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FStockholm'
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.current) return;
        const code = Number(data.current.weather_code ?? 0);
        setWeather({
          tempC: Math.round(Number(data.current.temperature_2m ?? 18)),
          description: getSwedishWeatherDescription(code),
          code,
          highC: Math.round(Number(data.daily?.temperature_2m_max?.[0] ?? 19)),
          lowC: Math.round(Number(data.daily?.temperature_2m_min?.[0] ?? 11)),
        });
      } catch {
        // Ignore
      }
    };
    loadWeather();
    const wTimer = setInterval(loadWeather, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(wTimer);
    };
  }, [open]);

  // Merge discovered network speakers into state + localStorage
  const mergeDiscoveredSpeakers = useCallback((discovered: SpotifyConnectDevice[]) => {
    if (!discovered || discovered.length === 0) return 0;
    let addedOrUpdated = 0;
    setSpeakers((prev) => {
      const merged = [...prev];
      for (const d of discovered) {
        if (!d || !d.name) continue;
        const idx = merged.findIndex(
          (m) =>
            m.id === d.id ||
            m.name.trim().toLowerCase() === d.name.trim().toLowerCase() ||
            (m.ip && d.ip && m.ip === d.ip)
        );
        if (idx >= 0) {
          merged[idx] = {
            ...merged[idx],
            ...d,
            ip: d.ip || merged[idx].ip,
            statusText: d.statusText || merged[idx].statusText,
          };
          addedOrUpdated++;
        } else {
          merged.unshift(d);
          addedOrUpdated++;
        }
      }
      try {
        localStorage.setItem(HUB_CUSTOM_SPEAKERS_KEY, JSON.stringify(merged));
      } catch {
        // Ignore
      }
      return merged;
    });
    return addedOrUpdated;
  }, []);

  // Poll Spotify Connect & Native Android Network / Google TV Streamer Cast Playback
  const refreshNetworkMediaAndDevices = useCallback(async () => {
    try {
      await exchangeSpotifyCodeIfPresent();
    } catch {
      // Ignore
    }

    let detectedPlaying: SpotifyNowPlaying | null = null;

    // 1. Check Google Cast (port 8009) & Sonos UPnP (port 1400) & NSD first
    try {
      const castNow = await getNetworkCastNowPlaying();
      if (castNow && castNow.trackTitle && castNow.trackTitle.trim().length > 0) {
        detectedPlaying = castNow;
      }
    } catch {
      // Ignore
    }

    // 2. Check Native Android MediaSession / Cast notification
    if (!detectedPlaying) {
      const nativeNow = getNativeSpotifyNowPlaying();
      if (nativeNow && nativeNow.trackTitle && nativeNow.trackTitle.trim().length > 0) {
        detectedPlaying = nativeNow;
      }
    }

    // 3. Check Spotify Connect Web API (detects when anyone on the account/network plays on speakers)
    if (!detectedPlaying) {
      const { state } = await fetchSpotifyConnectNowPlaying();
      if (state && state.trackTitle && state.trackTitle.trim().length > 0) {
        detectedPlaying = state;
      }
    }

    setSpotifyNowPlaying(detectedPlaying);

    // 4. Discover available Sonos, Google Cast & Spotify Connect devices on the network
    const discovered = await fetchSpotifyConnectDevices();
    if (discovered.length > 0) {
      mergeDiscoveredSpeakers(discovered);
    }
  }, [mergeDiscoveredSpeakers]);

  // Explicit "Sök i nätverket" action triggered by user button (or automatically on open)
  const handleScanNetworkSpeakers = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsScanningNetwork(true);
        setNetworkScanStatus(
          'Söker i Wi-Fi-nätverket efter Sonos-högtalare & Google Cast-enheter...'
        );
      }
      try {
        const [foundDevices, castPlaying] = await Promise.all([
          scanNetworkCastDevices(),
          getNetworkCastNowPlaying(),
        ]);
        if (
          castPlaying &&
          castPlaying.trackTitle &&
          castPlaying.trackTitle.trim().length > 0
        ) {
          setSpotifyNowPlaying(castPlaying);
        } else {
          await refreshNetworkMediaAndDevices();
        }
        if (foundDevices.length > 0) {
          mergeDiscoveredSpeakers(foundDevices);
          if (!silent) {
            setNetworkScanStatus(
              `Hittade ${foundDevices.length} ${
                foundDevices.length === 1 ? 'enhet' : 'enheter'
              }: ${foundDevices.map((d) => d.name).join(', ')}`
            );
          }
        } else if (!silent) {
          setNetworkScanStatus(
            'Inga nya högtalare hittades just nu. Kontrollera att surfplattan/telefonen är på samma Wi-Fi som dina Sonos- eller Cast-enheter.'
          );
        }
      } catch {
        if (!silent) {
          setNetworkScanStatus('Nätverkssökning slutförd.');
        }
      } finally {
        if (!silent) {
          setIsScanningNetwork(false);
        }
      }
    },
    [mergeDiscoveredSpeakers, refreshNetworkMediaAndDevices]
  );

  useEffect(() => {
    if (!open) return;
    refreshNetworkMediaAndDevices();
    handleScanNetworkSpeakers(true);
    const t = setInterval(refreshNetworkMediaAndDevices, 3000);
    return () => clearInterval(t);
  }, [open, refreshNetworkMediaAndDevices, handleScanNetworkSpeakers]);

  // Poll Philips Hue rooms if configured
  useEffect(() => {
    if (!open || !hueConfig.connected) return;
    let active = true;
    const syncHue = async () => {
      const rooms = await fetchHueRooms(hueConfig);
      if (active && rooms.length > 0) {
        setHueRooms(rooms);
      }
    };
    syncHue();
    const t = setInterval(syncHue, 8000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [open, hueConfig]);

  if (!open) return null;

  const hoursStr = String(now.getHours()).padStart(2, '0');
  const minsStr = String(now.getMinutes()).padStart(2, '0');
  const dateStr = now.toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Active media session (Sonos, Google Cast, Spotify Connect, or Android MediaSession)
  // Null when nothing is playing -> Media card renders empty state
  const activeMedia =
    spotifyNowPlaying &&
    spotifyNowPlaying.trackTitle &&
    spotifyNowPlaying.trackTitle.trim().length > 0
      ? spotifyNowPlaying
      : null;

  const isCastVideoOrTvSession = Boolean(
    activeMedia &&
      (activeMedia.isCast ||
        activeMedia.mediaType === 'video' ||
        activeMedia.source === 'google-cast')
  );

  const activeSpeakersList = speakers.filter((s) => s.isActive);
  const activeSpeakerSummary =
    activeMedia?.deviceName ||
    (activeSpeakersList.length > 0
      ? activeSpeakersList.map((s) => s.name).join(' + ')
      : speakers.length > 0
      ? `${speakers.length} högtalare i nätverket`
      : 'Högtalare & Cast');

  const progressRatio = activeMedia
    ? Math.max(
        0,
        Math.min(
          1,
          (activeMedia.progressMs || 0) / Math.max(1, activeMedia.durationMs || 180000)
        )
      )
    : 0;

  // Lighting summary
  const activeRoomsCount = hueRooms.filter((r) => r.anyOn).length;
  const avgBrightness =
    activeRoomsCount > 0
      ? Math.round(
          hueRooms
            .filter((r) => r.anyOn)
            .reduce((acc, r) => acc + r.brightness, 0) / activeRoomsCount
        )
      : 0;

  // Handlers for Media, Sonos & Chrome/Chromebook Cast Controls
  const handleMediaPlayPause = async () => {
    if (!activeMedia) {
      // If empty state and user taps Play, try starting playback on active Sonos/Cast speaker or Spotify
      const firstActive = speakers.find((s) => s.isActive) || speakers[0];
      if (firstActive && (firstActive.ip || firstActive.source === 'google-cast')) {
        await sendCastDeviceControl(firstActive.ip || firstActive.id, 'play');
      } else {
        await sendSpotifyConnectCommand(firstActive?.id, 'play');
      }
      setTimeout(refreshNetworkMediaAndDevices, 600);
      return;
    }
    const nextPlay = !activeMedia.isPlaying;
    const targetIpOrId = activeMedia.deviceIp || activeMedia.deviceId;
    if (isCastVideoOrTvSession || activeMedia.deviceIp) {
      await sendCastDeviceControl(targetIpOrId, nextPlay ? 'play' : 'pause');
      setSpotifyNowPlaying((prev) => (prev ? { ...prev, isPlaying: nextPlay } : null));
      return;
    }
    const ok = await sendSpotifyConnectCommand(
      undefined,
      nextPlay ? 'play' : 'pause'
    );
    if (!ok) {
      await sendCastDeviceControl(targetIpOrId, 'play_pause');
    }
    setSpotifyNowPlaying((prev) => (prev ? { ...prev, isPlaying: nextPlay } : null));
  };

  const handleMediaPrev = async () => {
    if (!activeMedia) return;
    const targetIpOrId = activeMedia.deviceIp || activeMedia.deviceId;
    if (isCastVideoOrTvSession && activeMedia.mediaType === 'video') {
      const nextPos = Math.max(0, (activeMedia.progressMs || 0) - 10000);
      setSpotifyNowPlaying((prev) => (prev ? { ...prev, progressMs: nextPos } : null));
      await sendCastDeviceControl(targetIpOrId, 'seek', nextPos);
      return;
    }
    if (activeMedia.deviceIp || activeMedia.source === 'google-cast') {
      await sendCastDeviceControl(targetIpOrId, 'prev');
      setTimeout(refreshNetworkMediaAndDevices, 500);
      return;
    }
    const ok = await sendSpotifyConnectCommand(undefined, 'prev');
    if (!ok) {
      sendNativeAndroidMediaControl('prev');
    }
  };

  const handleMediaNext = async () => {
    if (!activeMedia) return;
    const targetIpOrId = activeMedia.deviceIp || activeMedia.deviceId;
    if (isCastVideoOrTvSession && activeMedia.mediaType === 'video') {
      const dur = activeMedia.durationMs || 0;
      const nextPos =
        dur > 0
          ? Math.min(dur, (activeMedia.progressMs || 0) + 10000)
          : (activeMedia.progressMs || 0) + 10000;
      setSpotifyNowPlaying((prev) => (prev ? { ...prev, progressMs: nextPos } : null));
      await sendCastDeviceControl(targetIpOrId, 'seek', nextPos);
      return;
    }
    if (activeMedia.deviceIp || activeMedia.source === 'google-cast') {
      await sendCastDeviceControl(targetIpOrId, 'next');
      setTimeout(refreshNetworkMediaAndDevices, 500);
      return;
    }
    const ok = await sendSpotifyConnectCommand(undefined, 'next');
    if (!ok) {
      sendNativeAndroidMediaControl('next');
    }
  };

  const handleStopCasting = async () => {
    if (!activeMedia) return;
    const targetIpOrId = activeMedia.deviceIp || activeMedia.deviceId;
    await sendCastDeviceControl(targetIpOrId, 'stop');
    setSpotifyNowPlaying(null);
  };

  const handleToggleCastMute = async () => {
    if (!activeMedia) return;
    const nextMuted = !isCastMuted;
    setIsCastMuted(nextMuted);
    const targetIpOrId = activeMedia.deviceIp || activeMedia.deviceId;
    await sendCastDeviceControl(targetIpOrId, 'mute', nextMuted ? 1 : 0);
  };

  const handleSeekToRatio = async (ratio: number) => {
    if (!activeMedia) return;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const targetMs = Math.round(clampedRatio * (activeMedia.durationMs || 180000));
    setSpotifyNowPlaying((prev) => (prev ? { ...prev, progressMs: targetMs } : null));
    const targetIpOrId = activeMedia.deviceIp || activeMedia.deviceId;
    if (isCastVideoOrTvSession || activeMedia.deviceIp) {
      await sendCastDeviceControl(targetIpOrId, 'seek', targetMs);
    } else {
      await seekSpotifyConnectPosition(targetMs);
    }
  };

  const handleToggleSpeaker = async (speaker: SpotifyConnectDevice) => {
    const nextActive = !speaker.isActive;
    const nextList = speakers.map((s) =>
      s.id === speaker.id ? { ...s, isActive: nextActive } : s
    );
    setSpeakers(nextList);
    try {
      localStorage.setItem(HUB_CUSTOM_SPEAKERS_KEY, JSON.stringify(nextList));
    } catch {
      // Ignore
    }
    if (nextActive) {
      if (speaker.ip || speaker.source === 'google-cast') {
        await sendCastDeviceControl(speaker.ip || speaker.id, 'play');
      } else {
        await transferSpotifyConnectPlayback(speaker.id, true);
      }
    } else if (speaker.ip || speaker.source === 'google-cast') {
      await sendCastDeviceControl(speaker.ip || speaker.id, 'pause');
    }
  };

  const handleSpeakerVolumeChange = async (
    speaker: SpotifyConnectDevice,
    nextVol: number
  ) => {
    const clamped = Math.max(0, Math.min(100, Math.round(nextVol)));
    const nextList = speakers.map((s) =>
      s.id === speaker.id
        ? { ...s, volumePercent: clamped, isActive: clamped > 0 ? true : s.isActive }
        : s
    );
    setSpeakers(nextList);
    try {
      localStorage.setItem(HUB_CUSTOM_SPEAKERS_KEY, JSON.stringify(nextList));
    } catch {
      // Ignore
    }
    if (speaker.ip || speaker.source === 'google-cast') {
      await sendCastDeviceControl(speaker.ip || speaker.id, 'volume', clamped);
    } else {
      await setSpotifyDeviceVolume(speaker.id, clamped);
    }
  };

  const handleRoomBrightnessChange = async (room: HueRoom, nextBri: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(nextBri)));
    const isOn = clamped > 0;
    const updated = hueRooms.map((r) =>
      r.id === room.id ? { ...r, anyOn: isOn, brightness: clamped } : r
    );
    setHueRooms(updated);
    saveDemoHueRooms(updated);
    if (hueConfig.connected) {
      await updateHueRoomAction(hueConfig, room.id, { on: isOn, brightness: clamped });
    }
  };

  const handleToggleRoomOnOff = async (room: HueRoom) => {
    const nextOn = !room.anyOn;
    const nextBri = nextOn ? Math.max(25, room.brightness || 75) : 0;
    const updated = hueRooms.map((r) =>
      r.id === room.id ? { ...r, anyOn: nextOn, brightness: nextBri } : r
    );
    setHueRooms(updated);
    saveDemoHueRooms(updated);
    if (hueConfig.connected) {
      await updateHueRoomAction(hueConfig, room.id, {
        on: nextOn,
        brightness: nextBri,
      });
    }
  };

  // Widget Configuration Helpers
  const updateWidgetSize = (id: HubWidgetPageId, size: HubWidgetSize) => {
    const next = widgetsConfig.map((w) => (w.id === id ? { ...w, size } : w));
    setWidgetsConfig(next);
    saveHubWidgetsConfig(next);
  };

  const toggleWidgetEnabled = (id: HubWidgetPageId) => {
    const next = widgetsConfig.map((w) =>
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    setWidgetsConfig(next);
    saveHubWidgetsConfig(next);
  };

  const moveWidgetOrder = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= widgetsConfig.length) return;
    const copy = [...widgetsConfig];
    const [removed] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, removed);
    setWidgetsConfig(copy);
    saveHubWidgetsConfig(copy);
  };

  // Filtered Data for Widgets
  const todayIso = getTodayDateString();
  const upcomingEvents = [...events]
    .filter((e) => e.date >= todayIso)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
  const uncheckedShopping = shopping.filter((s) => !s.checked);
  const openTodos = todos.filter((t) => !t.completed);

  const currentYm = todayIso.slice(0, 7);
  const currentBudgetMonth =
    budgetMonths.find((m) => m.monthKey === currentYm) || budgetMonths[0];
  const monthEntries = currentBudgetMonth?.entries || [];
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const en of monthEntries) {
    if (en.type === 'income') totalIncome += Number(en.amount) || 0;
    else totalExpenses += Number(en.amount) || 0;
  }
  const remainingBudgetKr = totalIncome - totalExpenses;
  const recentExpenseItems = monthEntries
    .filter((e) => e.type !== 'income')
    .slice(-5)
    .reverse();

  const currentPhotoSlide =
    ambientPhotosList[photoSlideIdx % Math.max(1, ambientPhotosList.length)] ||
    FALLBACK_AMBIENT_PHOTOS[0];
  const currentAmbientVideo =
    AMBIENT_VIDEOS[videoIdx % AMBIENT_VIDEOS.length] || AMBIENT_VIDEOS[0];

  const enabledWidgets = widgetsConfig.filter((w) => w.enabled);

  // Build dynamic SVG sine-wave path for the Material 3 Expressive Wavy Scrubber
  const buildWavyScrubberPath = (endX: number) => {
    if (endX <= 10) return 'M 8 18 L 10 18';
    let d = 'M 8 18';
    const step = 18;
    const isPlayingWave = Boolean(activeMedia && activeMedia.isPlaying);
    for (let x = 8; x < endX; x += step) {
      const nextX = Math.min(endX, x + step);
      const midX = (x + nextX) / 2;
      const amp = isPlayingWave ? 5.5 : 0;
      const dir = Math.floor(x / step) % 2 === 0 ? -1 : 1;
      d += ` Q ${midX} ${18 + dir * amp} ${nextX} 18`;
    }
    return d;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden select-none">
      {/* =====================================================================
          1. FULL-SCREEN OWN PHOTOS FROM THE APP & GOOGLE PHOTOS
         ===================================================================== */}
      <div
        onClick={() => {
          if (showGoogleHomeDrawer) setShowGoogleHomeDrawer(false);
          if (showAppStartPageFab) setShowAppStartPageFab(false);
        }}
        style={{ background: activePalette.bgGradient }}
        className="absolute inset-0 w-full h-full overflow-hidden"
      >
        {/* Base fallback image so the screen is never black while loading */}
        <img
          src={FALLBACK_AMBIENT_PHOTOS[0].imageUrl}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <img
          key={currentPhotoSlide.id}
          src={currentPhotoSlide.imageUrl || FALLBACK_AMBIENT_PHOTOS[0].imageUrl}
          alt={currentPhotoSlide.caption}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const badUrl = currentPhotoSlide.imageUrl;
            if (badUrl && badUrl !== FALLBACK_AMBIENT_PHOTOS[0].imageUrl) {
              setFailedPhotoUrls((prev) => ({ ...prev, [badUrl]: true }));
              e.currentTarget.src = FALLBACK_AMBIENT_PHOTOS[0].imageUrl;
            }
          }}
          className="relative z-10 w-full h-full object-cover transition-all duration-1000"
        />
        {/* Subtle top/bottom vignette for corner button & clock legibility */}
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/35 via-transparent to-black/55 pointer-events-none" />
      </div>

      {/* Subtle Ambient Clock, Date, Weather & Photo Caption (Bottom-Center between the two corner FABs) */}
      <div className="fixed bottom-5 sm:bottom-7 left-24 right-24 sm:left-32 sm:right-32 z-20 pointer-events-none flex flex-col items-center justify-end text-center">
        <div className="flex items-baseline leading-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
          <span className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white">
            {hoursStr}:{minsStr}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-extrabold text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          <span className="capitalize">{dateStr}</span>
          <span className="opacity-60">·</span>
          <span className="inline-flex items-center gap-1">
            {getWeatherIcon(weather.code, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
            <span>
              {weather.tempC}°C {weather.description}
            </span>
          </span>
          {currentPhotoSlide.caption && (
            <>
              <span className="hidden sm:inline opacity-60">·</span>
              <span className="hidden sm:inline text-white/85 truncate max-w-[260px]">
                📸 {currentPhotoSlide.caption}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Night Dimmer Overlay */}
      {dimmerPercent > 0 && (
        <div
          style={{ opacity: dimmerPercent / 100 }}
          className="fixed inset-0 bg-black pointer-events-none z-[105]"
        />
      )}

      {/* =====================================================================
          2. TOP-LEFT CORNER: WHITE ROUND SETTINGS BUTTON
          ("Längst upp i vänstra hörnet har vi en rund knapp som går till alla inställningar.
           Knappen för inställningar ska också vara vit.")
         ===================================================================== */}
      <div className="fixed top-[max(1.25rem,env(safe-area-inset-top))] left-5 sm:top-7 sm:left-7 z-30">
        <button
          type="button"
          onClick={() => {
            setShowGoogleHomeDrawer(false);
            setShowAppStartPageFab(false);
            setShowWidgetCustomizer(true);
          }}
          className="w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full bg-white text-slate-900 border border-white/90 shadow-[0_12px_36px_rgba(0,0,0,0.55)] hover:bg-slate-100 flex items-center justify-center transition-all duration-300 active:scale-90"
          title="Alla inställningar"
          aria-label="Alla inställningar"
        >
          <Settings className="w-7 h-7 sm:w-8 sm:h-8 text-slate-900" />
        </button>
      </div>

      {/* =====================================================================
          3. TOP-RIGHT CORNER: MEDIA CONTROLS (ONLY VISIBLE WHEN PLAYING)
          ("Mediakontroller ska vara uppe i högra hörnet, samma kontroller som vi har nu.
           Om inget spelas så syns inte kontrollerna alls.")
         ===================================================================== */}
      {activeMedia && (
        <div className="fixed top-[max(1.25rem,env(safe-area-inset-top))] right-5 sm:top-7 sm:right-7 z-30 w-[calc(100vw-6.5rem)] max-w-[420px] sm:w-[410px]">
          <div
            style={{
              background: activePalette.mediaCardBg,
              color: activePalette.mediaCardText,
            }}
            className="relative rounded-[34px] sm:rounded-[44px] p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/25 transition-all"
          >
            {/* Top Row: Status Badge + Speaker/Sonos/Cast Output Switcher Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-500 animate-pulse" />
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider truncate">
                  {isCastVideoOrTvSession
                    ? `${
                        activeMedia.appName === 'Sonos' ? 'Sonos' : 'Castar'
                      } · ${activeMedia.deviceName || 'Nätverksenhet'}${
                        activeMedia.appName && activeMedia.appName !== 'Sonos'
                          ? ` · ${activeMedia.appName}`
                          : ''
                      }`
                    : 'Spotify Connect · Live i nätverket'}
                </span>
              </div>

              {/* SPEAKER / SONOS / CAST OUTPUT SWITCHER BUTTON */}
              <button
                type="button"
                onClick={() => setShowSpeakerMenu((prev) => !prev)}
                style={{
                  backgroundColor: activePalette.mediaAccentBg,
                  color: activePalette.mediaAccentText,
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-transform max-w-full"
              >
                {isCastVideoOrTvSession && activeMedia.mediaType === 'video' ? (
                  <Tv className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Speaker className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate max-w-[155px] sm:max-w-[200px]">
                  {activeSpeakerSummary}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    showSpeakerMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Middle Row: Thumbnail / Artwork + Video/Track Title & Channel/Artist */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div
                style={{
                  backgroundColor: activePalette.mediaAccentBg,
                  color: activePalette.mediaAccentText,
                }}
                className={`${
                  isCastVideoOrTvSession && activeMedia.mediaType === 'video'
                    ? 'w-22 h-15 sm:w-26 sm:h-18 rounded-[20px] sm:rounded-[24px]'
                    : 'w-15 h-15 sm:w-18 sm:h-18 rounded-[22px] sm:rounded-[26px]'
                } overflow-hidden shrink-0 flex items-center justify-center shadow-lg`}
              >
                {activeMedia.albumArtUrl ? (
                  <img
                    src={activeMedia.albumArtUrl}
                    alt={activeMedia.trackTitle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : isCastVideoOrTvSession && activeMedia.mediaType === 'video' ? (
                  <Tv className="w-7 h-7 sm:w-8 sm:h-8" />
                ) : (
                  <Music className="w-7 h-7 sm:w-8 sm:h-8" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-base sm:text-xl font-black truncate leading-tight">
                  {activeMedia.trackTitle}
                </div>
                <div
                  style={{ color: activePalette.mediaCardSub }}
                  className="text-xs sm:text-sm font-extrabold truncate mt-0.5"
                >
                  {activeMedia.artistName ||
                    activeMedia.appName ||
                    'Spelas i nätverket'}
                </div>
                <div
                  style={{ color: activePalette.mediaCardSub }}
                  className="text-[11px] font-bold opacity-80 truncate mt-1 flex items-center gap-1.5"
                >
                  <Wifi className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {activeMedia.deviceName
                      ? `Spelas på ${activeMedia.deviceName}`
                      : `Samma Wi-Fi · ${activeSpeakerSummary}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Scroll-Safe Wavy Scrubber + Transport / Chrome Cast Controls */}
            <div className="mt-3 flex flex-col gap-2.5">
              {/* Scroll-Safe Wavy Scrubber */}
              <div className="w-full flex flex-col justify-center">
                <svg
                  viewBox="0 0 320 36"
                  style={{ touchAction: 'pan-y' }}
                  onPointerDown={(e) => {
                    wavyScrubberDragRef.current = {
                      active: true,
                      startX: e.clientX,
                      startY: e.clientY,
                      locked: 'none',
                      maxDx: 0,
                      maxDy: 0,
                    };
                  }}
                  onPointerMove={(e) => {
                    const st = wavyScrubberDragRef.current;
                    if (!st.active) return;
                    const dx = Math.abs(e.clientX - st.startX);
                    const dy = Math.abs(e.clientY - st.startY);
                    if (dx > st.maxDx) st.maxDx = dx;
                    if (dy > st.maxDy) st.maxDy = dy;

                    if (st.locked === 'none') {
                      if (dy > 7 && dy >= dx * 0.8) {
                        st.locked = 'vertical';
                        st.active = false;
                        return;
                      }
                      if (dx > 12 && dx > dy * 1.6) {
                        st.locked = 'horizontal';
                        try {
                          e.currentTarget.setPointerCapture(e.pointerId);
                        } catch {
                          // Ignore
                        }
                      }
                    }

                    if (st.locked === 'horizontal') {
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (rect.width > 0) {
                        const r = (e.clientX - rect.left) / rect.width;
                        handleSeekToRatio(r);
                      }
                    }
                  }}
                  onPointerUp={(e) => {
                    const st = wavyScrubberDragRef.current;
                    if (!st.active) return;
                    const locked = st.locked;
                    const isTap = locked === 'none' && st.maxDx < 6 && st.maxDy < 6;
                    st.active = false;
                    st.locked = 'none';
                    if (locked === 'horizontal') {
                      try {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      } catch {
                        // Ignore
                      }
                    }
                    if (isTap) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (rect.width > 0) {
                        handleSeekToRatio((e.clientX - rect.left) / rect.width);
                      }
                    }
                  }}
                  onPointerCancel={() => {
                    wavyScrubberDragRef.current.active = false;
                    wavyScrubberDragRef.current.locked = 'vertical';
                  }}
                  className="w-full h-9 cursor-ew-resize overflow-visible touch-pan-y"
                >
                  <line
                    x1={Math.max(12, Math.round(progressRatio * 304))}
                    y1="18"
                    x2="312"
                    y2="18"
                    stroke={activePalette.mediaAccentBg}
                    strokeOpacity="0.25"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <path
                    d={buildWavyScrubberPath(
                      Math.max(14, Math.round(progressRatio * 304))
                    )}
                    stroke={activePalette.mediaAccentBg}
                    strokeWidth="5.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <rect
                    x={Math.max(8, Math.round(progressRatio * 304) - 4)}
                    y="6"
                    width="8"
                    height="24"
                    rx="4"
                    fill={activePalette.mediaAccentBg}
                  />
                </svg>
                <div className="flex items-center justify-between text-[11px] font-black px-1 -mt-1 opacity-80 tabular-nums">
                  <span>{formatDurationShort(activeMedia.progressMs || 0)}</span>
                  <span>
                    {activeMedia.durationMs && activeMedia.durationMs > 0
                      ? formatDurationShort(activeMedia.durationMs)
                      : 'Live'}
                  </span>
                </div>
              </div>

              {/* Transport Controls: Chrome / Chromebook Cast Bar vs Audio / Sonos Bar */}
              {isCastVideoOrTvSession && activeMedia.mediaType === 'video' ? (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleMediaPrev}
                        className="h-10 px-3 rounded-full bg-black/12 hover:bg-black/20 flex items-center gap-1 text-xs font-black active:scale-90 transition-all"
                        title="Spola bakåt 10 sekunder"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>-10s</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleMediaPlayPause}
                        style={{
                          backgroundColor: activePalette.mediaAccentBg,
                          color: activePalette.mediaAccentText,
                        }}
                        className={`w-14 h-11 flex items-center justify-center shadow-lg active:scale-90 transition-all ${
                          activeMedia.isPlaying ? 'rounded-[18px]' : 'rounded-full'
                        }`}
                        title={activeMedia.isPlaying ? 'Pausa Cast' : 'Spela Cast'}
                      >
                        {activeMedia.isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleMediaNext}
                        className="h-10 px-3 rounded-full bg-black/12 hover:bg-black/20 flex items-center gap-1 text-xs font-black active:scale-90 transition-all"
                        title="Spola framåt 10 sekunder"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>+10s</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleCastMute}
                        className="w-10 h-10 rounded-full bg-black/12 hover:bg-black/20 flex items-center justify-center active:scale-90 transition-all"
                        title={isCastMuted ? 'Slå på ljud' : 'Ljud av'}
                      >
                        {isCastMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleStopCasting}
                      style={{
                        backgroundColor: activePalette.mediaAccentBg,
                        color: activePalette.mediaAccentText,
                      }}
                      className="h-10 px-3.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                      title="Sluta casta till TV"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Sluta casta</span>
                    </button>
                  </div>

                  {/* Direct Scroll-Safe Cast Volume Bar */}
                  <div className="flex items-center gap-3 px-2 py-1 rounded-2xl bg-black/10">
                    <Volume2 className="w-4 h-4 shrink-0 opacity-80" />
                    <TouchSafeHorizontalSlider
                      value={
                        typeof activeMedia.volumePercent === 'number'
                          ? activeMedia.volumePercent
                          : 60
                      }
                      min={0}
                      max={100}
                      fillColor={activePalette.mediaAccentBg}
                      thumbColor={activePalette.mediaAccentBg}
                      onChange={(nextVol) => {
                        setSpotifyNowPlaying((prev) =>
                          prev ? { ...prev, volumePercent: nextVol } : null
                        );
                        sendCastDeviceControl(
                          activeMedia.deviceIp || activeMedia.deviceId,
                          'volume',
                          nextVol
                        );
                      }}
                    />
                    <span className="text-xs font-black tabular-nums w-9 text-right shrink-0">
                      {typeof activeMedia.volumePercent === 'number'
                        ? `${activeMedia.volumePercent}%`
                        : '60%'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleMediaPrev}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/12 hover:bg-black/20 flex items-center justify-center active:scale-90 transition-all"
                    title="Föregående låt"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={handleMediaPlayPause}
                    style={{
                      backgroundColor: activePalette.mediaAccentBg,
                      color: activePalette.mediaAccentText,
                    }}
                    className={`w-14 h-11 sm:w-15 sm:h-12 flex items-center justify-center shadow-lg active:scale-90 transition-all ${
                      activeMedia.isPlaying ? 'rounded-[20px]' : 'rounded-full'
                    }`}
                    title={activeMedia.isPlaying ? 'Pausa' : 'Spela'}
                  >
                    {activeMedia.isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleMediaNext}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/12 hover:bg-black/20 flex items-center justify-center active:scale-90 transition-all"
                    title="Nästa låt"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>
                </div>
              )}
            </div>

            {/* Expandable Speaker, Sonos & Google Cast Output Switcher Menu */}
            {showSpeakerMenu && (
              <div className="mt-4 pt-3.5 border-t border-black/15 space-y-3 max-h-[52vh] overflow-y-auto overscroll-contain pr-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-black uppercase tracking-wider">
                    🔊 Sonos, Cast &amp; Högtalare
                  </div>
                  <button
                    type="button"
                    disabled={isScanningNetwork}
                    onClick={() => handleScanNetworkSpeakers(false)}
                    style={{
                      backgroundColor: activePalette.mediaAccentBg,
                      color: activePalette.mediaAccentText,
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isScanningNetwork ? 'animate-spin' : ''
                      }`}
                    />
                    <span>
                      {isScanningNetwork ? 'Söker i nätverket...' : 'Sök i nätverket'}
                    </span>
                  </button>
                </div>

                {networkScanStatus && (
                  <div className="text-xs font-bold px-3 py-2 rounded-2xl bg-black/10">
                    {networkScanStatus}
                  </div>
                )}

                {speakers.length === 0 ? (
                  <div className="rounded-[22px] bg-black/10 p-4 text-center text-xs font-bold opacity-85">
                    Tryck på &ldquo;Sök i nätverket&rdquo; för att hitta dina Sonos-högtalare och Google Cast-enheter.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {speakers.map((spk) => (
                      <div
                        key={spk.id}
                        style={{
                          backgroundColor: spk.isActive
                            ? activePalette.mediaAccentBg
                            : 'rgba(0,0,0,0.1)',
                          color: spk.isActive
                            ? activePalette.mediaAccentText
                            : activePalette.mediaCardText,
                        }}
                        className="rounded-[22px] p-2.5 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSpeaker(spk)}
                            className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center border-2 text-xs font-black shrink-0 ${
                                spk.isActive
                                  ? 'bg-white text-slate-950 border-white'
                                  : 'border-current opacity-60'
                              }`}
                            >
                              {spk.isActive ? '✓' : ''}
                            </span>
                            <span className="flex items-center gap-2 min-w-0">
                              {spk.type === 'TV' ? (
                                <Tv className="w-4 h-4 shrink-0" />
                              ) : (
                                <Speaker className="w-4 h-4 shrink-0" />
                              )}
                              <span className="font-black text-xs sm:text-sm truncate">
                                {spk.name}
                              </span>
                            </span>
                          </button>
                          <span className="text-xs font-black tabular-nums shrink-0">
                            {spk.volumePercent}%
                          </span>
                        </div>

                        {spk.statusText && (
                          <div className="text-[11px] font-bold opacity-80 pl-7 mt-0.5 truncate">
                            {spk.statusText}
                          </div>
                        )}

                        <div className="mt-1.5 flex items-center gap-2 pl-7">
                          <Volume2 className="w-3.5 h-3.5 opacity-75 shrink-0" />
                          <TouchSafeHorizontalSlider
                            value={spk.volumePercent}
                            min={0}
                            max={100}
                            fillColor={
                              spk.isActive
                                ? activePalette.mediaAccentText
                                : activePalette.mediaAccentBg
                            }
                            thumbColor={
                              spk.isActive
                                ? activePalette.mediaAccentText
                                : activePalette.mediaAccentBg
                            }
                            trackColor={
                              spk.isActive
                                ? 'rgba(255,255,255,0.25)'
                                : 'rgba(0,0,0,0.18)'
                            }
                            onChange={(nextVol) =>
                              handleSpeakerVolumeChange(spk, nextVol)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Custom Home Speaker / Sonos / Google TV Streamer */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = newSpeakerName.trim();
                    if (!trimmed) return;
                    const created: SpotifyConnectDevice = {
                      id: `cast-custom-${Date.now()}`,
                      name: trimmed,
                      type: newSpeakerType,
                      isActive: true,
                      volumePercent: 60,
                      supportsVolume: true,
                      source: 'google-cast',
                    };
                    const next = [created, ...speakers];
                    setSpeakers(next);
                    try {
                      localStorage.setItem(
                        HUB_CUSTOM_SPEAKERS_KEY,
                        JSON.stringify(next)
                      );
                    } catch {
                      // Ignore
                    }
                    setNewSpeakerName('');
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={newSpeakerName}
                    onChange={(e) => setNewSpeakerName(e.target.value)}
                    placeholder="Lägg till högtalare/TV..."
                    className="w-full sm:flex-1 min-w-0 rounded-full bg-black/10 px-3.5 py-2 text-xs font-bold placeholder:opacity-75 outline-none"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={newSpeakerType}
                      onChange={(e) =>
                        setNewSpeakerType(e.target.value as 'Speaker' | 'TV')
                      }
                      className="flex-1 sm:flex-none rounded-full bg-black/10 px-2.5 py-2 text-xs font-bold outline-none"
                    >
                      <option value="Speaker">Högtalare</option>
                      <option value="TV">TV / Streamer</option>
                    </select>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: activePalette.mediaAccentBg,
                        color: activePalette.mediaAccentText,
                      }}
                      className="rounded-full px-3.5 py-2 text-xs font-black shrink-0 shadow-sm active:scale-95 transition-transform"
                    >
                      + Lägg till
                    </button>
                  </div>
                </form>

                {/* Native Android Media Output Switcher + Spotify Connect Login Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openNativeSystemMediaOutputSwitcher()}
                    className="px-3 py-1.5 rounded-full bg-black/12 hover:bg-black/20 text-[11px] font-black flex items-center gap-1.5"
                  >
                    <Speaker className="w-3.5 h-3.5" />
                    <span>Android högtalarmeny</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cfg = loadSpotifyAuthConfig();
                      startSpotifyPkceLogin(cfg.clientId);
                    }}
                    className="px-3 py-1.5 rounded-full bg-black/12 hover:bg-black/20 text-[11px] font-black flex items-center gap-1.5"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Koppla Spotify</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          4. BOTTOM-LEFT CORNER: ROUND LAMP BUTTON + FAB MENU WITH ALL LAMPS
          ("Längst ner i vänstra hörnet en rund knapp med en lampa. Knappen lyser
           när någon lampa är tänd, är vit när allt är släckt. Trycker man på den
           får man upp en meny, som en FAB, med alla lampor i en lista, exakt samma
           som vi har nu.")
         ===================================================================== */}
      {showGoogleHomeDrawer && (
        <div
          onClick={() => setShowGoogleHomeDrawer(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
        />
      )}

      <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-5 sm:bottom-7 sm:left-7 z-40 flex flex-col items-start">
        {/* FAB Popup Menu with All Lamps */}
        {showGoogleHomeDrawer && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mb-3.5 w-[calc(100vw-2.5rem)] max-w-[460px] max-h-[75vh] overflow-y-auto overscroll-contain rounded-[38px] sm:rounded-[44px] bg-[#1C1429]/95 backdrop-blur-xl border-2 border-white/20 p-4 sm:p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.8)] space-y-4 origin-bottom-left animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-[20px] flex items-center justify-center font-black shrink-0 ${
                    activeRoomsCount > 0
                      ? 'bg-[#FDE047] text-[#422006] shadow-[0_0_20px_rgba(250,204,21,0.6)]'
                      : 'bg-white text-slate-900'
                  }`}
                >
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black">Belysning</h3>
                  <p className="text-xs text-white/75 font-bold">
                    {activeRoomsCount > 0
                      ? `${activeRoomsCount} rum tända (${avgBrightness}%) · Svep för ljusstyrka`
                      : 'Alla lampor släckta · Tryck eller svep för att tända'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleHomeDrawer(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick All-On / All-Off Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const next = hueRooms.map((r) => ({
                    ...r,
                    anyOn: true,
                    brightness: 80,
                  }));
                  setHueRooms(next);
                  saveDemoHueRooms(next);
                  if (hueConfig.connected) {
                    await updateAllHueRoomsAction(hueConfig, next, {
                      on: true,
                      brightness: 80,
                    });
                  }
                }}
                className="px-3.5 py-2 rounded-full bg-[#FDE047] text-[#422006] text-xs font-black shadow-sm active:scale-95 transition-transform"
              >
                💡 Tänd alla (80%)
              </button>

              <button
                type="button"
                onClick={async () => {
                  const next = hueRooms.map((r) => ({
                    ...r,
                    anyOn: true,
                    brightness: 30,
                  }));
                  setHueRooms(next);
                  saveDemoHueRooms(next);
                  if (hueConfig.connected) {
                    await updateAllHueRoomsAction(hueConfig, next, {
                      on: true,
                      brightness: 30,
                    });
                  }
                }}
                className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-extrabold active:scale-95 transition-transform"
              >
                🌙 Kvällsljus (30%)
              </button>

              <button
                type="button"
                onClick={async () => {
                  const next = hueRooms.map((r) => ({
                    ...r,
                    anyOn: false,
                    brightness: 0,
                  }));
                  setHueRooms(next);
                  saveDemoHueRooms(next);
                  if (hueConfig.connected) {
                    await updateAllHueRoomsAction(hueConfig, next, { on: false });
                  }
                }}
                className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-extrabold active:scale-95 transition-transform"
              >
                Släck alla
              </button>
            </div>

            {/* Google Home Touch-Swipe Room Sliders (Exact same list & controls) */}
            <div className="space-y-2.5">
              {hueRooms.map((room) => (
                <GoogleHomeTouchSlider
                  key={room.id}
                  title={room.name}
                  subtitle={`${room.lights?.length || 3} lampor · Svep för ljusstyrka`}
                  brightness={room.brightness}
                  isOn={room.anyOn}
                  accentFillColor="#FDE68A"
                  trackBgColor="#2D2240"
                  activeTextColor="#422006"
                  inactiveTextColor="#F8FAFC"
                  onChangeBrightness={(val) => handleRoomBrightnessChange(room, val)}
                  onToggle={() => handleToggleRoomOnOff(room)}
                />
              ))}
            </div>

            {/* Philips Hue Bridge & Native Google Home App Integration */}
            <div className="rounded-[28px] bg-black/35 border border-white/10 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-white/80">
                  {hueConfig.connected
                    ? `Ansluten till Hue Bridge (${hueConfig.bridgeIp || 'Moln'})`
                    : 'Koppla Philips Hue Bridge eller öppna Google Home'}
                </div>
                <button
                  type="button"
                  onClick={() => openNativeGoogleHomeApp()}
                  className="px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-xs font-black flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Home</span>
                </button>
              </div>

              {!hueConfig.connected && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isPairingHue}
                    onClick={async () => {
                      setIsPairingHue(true);
                      setHueStatusMsg('Söker efter Philips Hue Bridge i ditt Wi-Fi...');
                      const ip = hueConfig.bridgeIp || (await discoverHueBridgeIp());
                      if (!ip) {
                        setHueStatusMsg(
                          'Hittade ingen lokal Hue Bridge automatiskt. Tryck på knappen på din Hue Bridge och försök igen.'
                        );
                        setIsPairingHue(false);
                        return;
                      }
                      const res = await pairHueBridge(ip);
                      if (res.ok && res.username) {
                        const nextCfg: HueConfig = {
                          ...hueConfig,
                          bridgeIp: ip,
                          username: res.username,
                          connected: true,
                        };
                        setHueConfig(nextCfg);
                        saveHueConfig(nextCfg);
                        setHueStatusMsg('Ansluten till Philips Hue Bridge!');
                      } else {
                        setHueStatusMsg(
                          res.error || 'Tryck på knappen på din Hue Bridge först.'
                        );
                      }
                      setIsPairingHue(false);
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold"
                  >
                    🔗 Parkoppla lokal Hue Bridge
                  </button>
                  {hueStatusMsg && (
                    <span className="text-xs text-amber-200 font-bold">
                      {hueStatusMsg}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom-Left Round Lamp FAB Button: Glows when any lamp is on, White when all are off */}
        <button
          type="button"
          onClick={() => {
            setShowAppStartPageFab(false);
            setShowGoogleHomeDrawer((prev) => !prev);
          }}
          className={`w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
            activeRoomsCount > 0
              ? 'bg-[#FDE047] text-[#422006] ring-4 ring-[#FEF08A]/70 shadow-[0_0_40px_rgba(250,204,21,0.95),0_0_16px_rgba(254,240,138,0.9)]'
              : 'bg-white text-slate-900 border border-white/90 shadow-[0_12px_36px_rgba(0,0,0,0.55)] hover:bg-slate-100'
          }`}
          title={
            activeRoomsCount > 0
              ? `${activeRoomsCount} rum tända (${avgBrightness}%)`
              : 'Alla lampor släckta'
          }
          aria-label="Belysning"
        >
          <Lightbulb
            className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform ${
              activeRoomsCount > 0 ? 'fill-current scale-110' : 'text-slate-900'
            }`}
          />
        </button>
      </div>

      {/* =====================================================================
          5. BOTTOM-RIGHT CORNER: ROUND MONOCHROME APP ICON BUTTON + START PAGE FAB MENU
          ("Längst ner i högra hörnet en likadan knapp fast med appen ikon, inte i färg.
           Trycker man på den får man också upp en liknande FAB meny som visar
           startsidan på själva appen. Då kan man trycka på den för att snabbt se
           alla saker i appen.")
         ===================================================================== */}
      {showAppStartPageFab && (
        <div
          onClick={() => setShowAppStartPageFab(false)}
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px]"
        />
      )}

      <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 sm:bottom-7 sm:right-7 z-40 flex flex-col items-end">
        {/* FAB Menu showing ONLY the pages' widgets from the Start Page ("bara sidornas widgets som syns, inget annat") */}
        {showAppStartPageFab && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mb-3.5 w-[calc(100vw-2.5rem)] sm:w-[600px] lg:w-[760px] max-h-[78vh] overflow-y-auto overscroll-contain rounded-[38px] sm:rounded-[46px] bg-[#F5FAF6] text-[#141E18] border-2 border-white/80 p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85)] origin-bottom-right animate-in fade-in zoom-in-95 duration-200"
          >
            <HomeView
              widgetsOnly={true}
              events={events}
              categories={categories}
              todos={todos}
              notes={notes}
              shopping={shopping}
              recipes={recipes}
              budgetMonths={budgetMonths}
              photos={photos}
              photoAlbums={photoAlbums}
              onNavigate={(tab) => {
                setShowAppStartPageFab(false);
                if (onNavigateAppTab) {
                  onNavigateAppTab(tab);
                } else {
                  onClose();
                }
              }}
              onToggleTodo={onToggleTodo}
              onToggleShoppingChecked={onToggleShoppingChecked}
              isGoogleConnected={true}
              onSyncAll={() => {}}
              isSyncing={false}
            />
          </div>
        )}

        {/* Bottom-Right Round Button with Monochrome App Icon (Matching the Lamp Button) */}
        <button
          type="button"
          onClick={() => {
            setShowGoogleHomeDrawer(false);
            setShowAppStartPageFab((prev) => !prev);
          }}
          className={`w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full bg-white text-slate-900 border border-white/90 shadow-[0_12px_36px_rgba(0,0,0,0.55)] hover:bg-slate-100 flex items-center justify-center transition-all duration-300 active:scale-90 ${
            showAppStartPageFab ? 'ring-4 ring-white/60 scale-105' : ''
          }`}
          title="Visa appens startsida"
          aria-label="Visa appens startsida"
        >
          {/* Appens ikon i monokromt (inte i färg) */}
          <svg
            viewBox="0 0 512 512"
            className="w-9 h-9 sm:w-10 sm:h-10 text-slate-900"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="translate(256, 256) scale(0.84) translate(-256, -252)">
              {/* Expressive House Roof (Gable) */}
              <path
                d="M106 226 L235 106 C247 95 265 95 277 106 L406 226"
                stroke="currentColor"
                strokeWidth="38"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Skylight Dot under the Roof Peak */}
              <circle cx="256" cy="178" r="22" fill="currentColor" />
              <circle cx="256" cy="178" r="10" fill="#FFFFFF" />

              {/* Left Bento Tile: Calendar Card (Monochrome) */}
              <rect
                x="112"
                y="244"
                width="132"
                height="168"
                rx="34"
                fill="currentColor"
              />
              <rect x="136" y="270" width="84" height="18" rx="9" fill="#FFFFFF" />
              <circle cx="150" cy="322" r="11" fill="#FFFFFF" />
              <circle cx="178" cy="322" r="11" fill="#FFFFFF" />
              <circle cx="206" cy="322" r="11" fill="#FFFFFF" />
              <circle cx="150" cy="356" r="11" fill="#FFFFFF" />
              <circle cx="178" cy="356" r="11" fill="#FFFFFF" />
              <circle cx="206" cy="356" r="11" fill="#FFFFFF" />

              {/* Top-Right Bento Pill: Notes & Shopping (Monochrome) */}
              <rect
                x="264"
                y="244"
                width="136"
                height="76"
                rx="30"
                fill="currentColor"
              />
              <circle cx="300" cy="282" r="12" fill="#FFFFFF" />
              <rect x="322" y="274" width="54" height="16" rx="8" fill="#FFFFFF" />

              {/* Bottom-Right Bento Pill: Tasks & Checklists (Monochrome) */}
              <rect
                x="264"
                y="336"
                width="136"
                height="76"
                rx="30"
                fill="currentColor"
              />
              <path
                d="M292 374 L305 387 L330 361"
                stroke="#FFFFFF"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect x="344" y="366" width="36" height="16" rx="8" fill="#FFFFFF" />
            </g>
          </svg>
        </button>
      </div>

      {/* =====================================================================
          6. ALLA INSTÄLLNINGAR MODAL (Öppnas från runda knappen längst upp till vänster)
         ===================================================================== */}
      {showWidgetCustomizer && (
        <div
          onClick={() => setShowWidgetCustomizer(false)}
          className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-[40px] sm:rounded-[44px] bg-[#181224] border-2 border-white/15 p-4 sm:p-7 text-white shadow-2xl max-h-[92vh] overflow-y-auto space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-black">
                  Inställningar för skärmsläckare
                </h3>
                <p className="text-xs text-white/75 font-bold">
                  Välj fotoalbum från appen, visningstid per bild, högtalare i nätverket och nattdimmer
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-xs font-black text-white"
                >
                  Stäng skärmsläckare
                </button>
                <button
                  type="button"
                  onClick={() => setShowWidgetCustomizer(false)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 1. VÄLJ ALBUM, GOOGLE FOTO & VISNINGSTID FÖR HELSKÄRMSBILDER */}
            <div className="rounded-[28px] bg-white/8 border border-white/10 p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-black uppercase tracking-wider text-purple-200">
                  🖼️ Helskärmsbilder (Appen &amp; Google Foto)
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPhotoSlideIdx(
                      (prev) => (prev + 1) % Math.max(1, ambientPhotosList.length)
                    )
                  }
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-extrabold text-white"
                >
                  Nästa bild ↻
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold text-white/90 block">
                  📁 Välj bildkälla / fotoalbum:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlbumId('ALL');
                      setPhotoSlideIdx(0);
                      localStorage.setItem(HUB_PHOTO_ALBUM_KEY, 'ALL');
                    }}
                    style={
                      selectedAlbumId === 'ALL'
                        ? {
                            backgroundColor: activePalette.pillBg,
                            color: activePalette.pillText,
                          }
                        : undefined
                    }
                    className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      selectedAlbumId === 'ALL'
                        ? 'shadow-md scale-[1.02]'
                        : 'bg-black/40 text-white/80 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    <span>🖼️ Alla bilder</span>
                    <span className="opacity-75">
                      ({validAppPhotos.length + validGooglePhotos.length > 0
                        ? validAppPhotos.length + validGooglePhotos.length
                        : FALLBACK_AMBIENT_PHOTOS.length})
                    </span>
                  </button>

                  {validGooglePhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAlbumId('GOOGLE_PHOTOS');
                        setPhotoSlideIdx(0);
                        localStorage.setItem(HUB_PHOTO_ALBUM_KEY, 'GOOGLE_PHOTOS');
                      }}
                      style={
                        selectedAlbumId === 'GOOGLE_PHOTOS'
                          ? {
                              backgroundColor: activePalette.pillBg,
                              color: activePalette.pillText,
                            }
                          : undefined
                      }
                      className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        selectedAlbumId === 'GOOGLE_PHOTOS'
                          ? 'shadow-md scale-[1.02]'
                          : 'bg-black/40 text-white/80 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>📸 Google Foto</span>
                      <span className="opacity-75">({validGooglePhotos.length})</span>
                    </button>
                  )}

                  {photoAlbums.map((alb) => {
                    const albCount = validAppPhotos.filter(
                      (p) => p.albumId === alb.id
                    ).length;
                    const isSelected = selectedAlbumId === alb.id;
                    const albDisplayName =
                      alb.name || (alb as any).title || 'Album';
                    return (
                      <button
                        key={alb.id}
                        type="button"
                        onClick={() => {
                          setSelectedAlbumId(alb.id);
                          setPhotoSlideIdx(0);
                          localStorage.setItem(HUB_PHOTO_ALBUM_KEY, alb.id);
                        }}
                        style={
                          isSelected
                            ? {
                                backgroundColor: activePalette.pillBg,
                                color: activePalette.pillText,
                              }
                            : undefined
                        }
                        className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'shadow-md scale-[1.02]'
                            : 'bg-black/40 text-white/80 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                      >
                        <span>📁 {albDisplayName}</span>
                        <span className="opacity-75">({albCount})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GOOGLE FOTO-INTEGRERING */}
              <div className="rounded-2xl bg-black/35 border border-white/10 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>📸 Google Foto-integrering</span>
                      {validGooglePhotos.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                          {validGooglePhotos.length} bilder synkade
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/70 font-bold mt-0.5">
                      {googlePhotosAccountLabel
                        ? `Ansluten: ${googlePhotosAccountLabel}`
                        : 'Logga in med Google Foto eller klistra in en länk till ett delat Google Foto-album'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isFetchingGooglePhotos}
                      onClick={handleConnectGooglePhotosOAuth}
                      style={{
                        backgroundColor: activePalette.pillBg,
                        color: activePalette.pillText,
                      }}
                      className="px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>
                        {isFetchingGooglePhotos ? 'Kopplar...' : 'Koppla Google-konto'}
                      </span>
                    </button>

                    {validGooglePhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setGooglePhotosList([]);
                          setGooglePhotosAlbumUrl('');
                          setGooglePhotosAccountLabel('');
                          setGooglePhotosStatus('Google Foto-bilder rensade från skärmsläckaren.');
                          if (selectedAlbumId === 'GOOGLE_PHOTOS') {
                            setSelectedAlbumId('ALL');
                            localStorage.setItem(HUB_PHOTO_ALBUM_KEY, 'ALL');
                          }
                          try {
                            localStorage.removeItem(HUB_GOOGLE_PHOTOS_ITEMS_KEY);
                            localStorage.removeItem(HUB_GOOGLE_PHOTOS_ALBUM_URL_KEY);
                            localStorage.removeItem(HUB_GOOGLE_PHOTOS_ACCOUNT_KEY);
                          } catch {
                            // Ignore
                          }
                        }}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white/80"
                      >
                        Koppla från
                      </button>
                    )}
                  </div>
                </div>

                {/* Delat Google Foto-album (Länk) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleFetchSharedGooglePhotosAlbum(googlePhotosAlbumUrl, false);
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <input
                    type="text"
                    inputMode="url"
                    value={googlePhotosAlbumUrl}
                    onChange={(e) => setGooglePhotosAlbumUrl(e.target.value)}
                    placeholder="Klistra in delad Google Foto-länk (https://photos.app.goo.gl/...)"
                    className="w-full sm:flex-1 min-w-0 rounded-full bg-black/50 border border-white/15 px-3.5 py-2 text-xs font-bold text-white placeholder:text-white/50 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isFetchingGooglePhotos}
                    style={{
                      backgroundColor: activePalette.pillBg,
                      color: activePalette.pillText,
                    }}
                    className="rounded-full px-4 py-2 text-xs font-black shrink-0 shadow-xs active:scale-95 transition-transform"
                  >
                    {isFetchingGooglePhotos ? 'Hämtar...' : 'Hämta album'}
                  </button>
                </form>

                {googlePickerUri && (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2">
                    <span className="text-xs font-bold text-white/90">
                      Välj specifika bilder i Google Foto-väljaren:
                    </span>
                    <a
                      href={googlePickerUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-full bg-white text-slate-900 text-xs font-black flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Öppna Google Foto</span>
                    </a>
                  </div>
                )}

                {googlePhotosStatus && (
                  <div className="text-xs font-bold px-3 py-2 rounded-xl bg-white/10 text-purple-200">
                    {googlePhotosStatus}
                  </div>
                )}
              </div>

              {/* Välj hur länge varje bild ska visas */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-white/90">
                    ⏱️ Hur länge ska varje bild visas?
                  </span>
                  <span className="text-[11px] font-black text-purple-200">
                    {PHOTO_DURATION_OPTIONS.find((o) => o.seconds === photoDurationSec)
                      ?.label || `${photoDurationSec} sek`}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {PHOTO_DURATION_OPTIONS.map((opt) => {
                    const isSelected = photoDurationSec === opt.seconds;
                    return (
                      <button
                        key={opt.seconds}
                        type="button"
                        onClick={() => {
                          setPhotoDurationSec(opt.seconds);
                          localStorage.setItem(
                            HUB_PHOTO_DURATION_KEY,
                            String(opt.seconds)
                          );
                        }}
                        style={
                          isSelected
                            ? {
                                backgroundColor: activePalette.pillBg,
                                color: activePalette.pillText,
                              }
                            : undefined
                        }
                        className={`py-2 px-2.5 rounded-2xl text-xs font-black transition-all ${
                          isSelected
                            ? 'shadow-md scale-[1.02]'
                            : 'bg-black/40 text-white/80 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. NÄTVERKSSÖKNING FÖR SONOS & GOOGLE CAST-HÖGTALARE */}
            <div className="rounded-[28px] bg-white/8 border border-white/10 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-purple-200">
                    🔊 Högtalare, Sonos &amp; Cast i nätverket
                  </div>
                  <p className="text-[11px] text-white/70 font-bold mt-0.5">
                    Mediakontroller visas automatiskt uppe i högra hörnet när något spelas
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isScanningNetwork}
                  onClick={() => handleScanNetworkSpeakers(false)}
                  style={{
                    backgroundColor: activePalette.pillBg,
                    color: activePalette.pillText,
                  }}
                  className="px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isScanningNetwork ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {isScanningNetwork ? 'Söker i nätverket...' : 'Sök i nätverket'}
                  </span>
                </button>
              </div>

              {networkScanStatus && (
                <div className="text-xs font-bold px-3 py-2 rounded-2xl bg-black/30 text-purple-200">
                  {networkScanStatus}
                </div>
              )}

              {speakers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {speakers.map((s) => (
                    <span
                      key={s.id}
                      className="px-3 py-1.5 rounded-full bg-black/35 border border-white/10 text-xs font-bold flex items-center gap-1.5"
                    >
                      {s.type === 'TV' ? (
                        <Tv className="w-3.5 h-3.5 text-purple-300" />
                      ) : (
                        <Speaker className="w-3.5 h-3.5 text-purple-300" />
                      )}
                      <span>{s.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Material 3 Expressive Color Palette Selector (för mediakort & menyer) */}
            <div className="space-y-2.5">
              <div className="text-xs font-black uppercase tracking-wider text-purple-200">
                Färgtema för mediakontroller &amp; menyer
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HUB_PALETTES.map((pal) => {
                  const isAct = pal.id === paletteId;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => {
                        setPaletteId(pal.id);
                        localStorage.setItem(HUB_PALETTE_KEY, pal.id);
                      }}
                      className={`rounded-[24px] p-3.5 text-left border transition-all flex items-center justify-between ${
                        isAct
                          ? 'border-white bg-white/15 ring-2 ring-white/40'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black">{pal.name}</div>
                        <div className="text-[11px] text-white/65">{pal.subtitle}</div>
                      </div>
                      <span
                        style={{ backgroundColor: pal.pillBg }}
                        className="w-6 h-6 rounded-full border border-white shrink-0"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Dimmer & Auto-Start Timer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <div className="text-xs font-black mb-1.5">
                  Skärmdimmer (Nattdämpning: {dimmerPercent}%)
                </div>
                <TouchSafeHorizontalSlider
                  value={dimmerPercent}
                  min={0}
                  max={85}
                  fillColor="#D8B4FE"
                  thumbColor="#F3E8FF"
                  trackColor="rgba(255,255,255,0.18)"
                  onChange={(v) => {
                    setDimmerPercent(v);
                    localStorage.setItem(HUB_DIMMER_KEY, String(v));
                  }}
                />
              </div>

              <div>
                <div className="text-xs font-black mb-1.5">
                  Starta skärmsläckare automatiskt
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 1, 3, 5, 10].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onChangeIdleMinutes(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-black ${
                        idleMinutes === m
                          ? 'bg-purple-200 text-purple-950'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      {m === 0 ? 'Av' : `${m} min`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
