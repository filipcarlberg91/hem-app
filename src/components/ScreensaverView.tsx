import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  BatteryCharging,
  Bell,
  Calendar,
  Camera,
  Check,
  ChefHat,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  ExternalLink,
  FileText,
  FolderHeart,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Lightbulb,
  LightbulbOff,
  Maximize2,
  Moon,
  Music,
  Palette,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Settings,
  ShoppingCart,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Speaker,
  Square,
  Star,
  Sun,
  Trash2,
  Tv,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import {
  AppNotification,
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
  extractExifDateFromImageUrl,
  fetchSharedGooglePhotosAlbum,
  formatPhotoTakenDateSwedish,
  normalizeExifOrIsoDate,
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
  updateSelectedHueLightsAction,
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
    name: 'Midnattsplommon & Rosékvarts',
    subtitle: 'Skulpterade former i djup plommon och varm rosé',
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
    name: 'Nordisk Tallskog & Morgonguld',
    subtitle: 'Harmonisk skogspalett med varm bärnstensglöd',
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
    name: 'Bohuslänsk Horisont & Korall',
    subtitle: 'Djupblått hav med solvarma pastelltoner',
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
    name: 'Solvarma Klippor & Olivlund',
    subtitle: 'Varm keramik och mjuk salviagrön kontrast',
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
    name: 'Stjärnklar Natt (OLED Svart)',
    subtitle: 'Kolsvart bakgrund med mjuk nattkontrast',
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
const HUB_PHOTO_LAYOUT_KEY = 'vn_hub_photo_layout_v1';
const HUB_PHOTO_ORDER_KEY = 'vn_screensaver_photo_order_v1';
const HUB_FAVORITE_LIGHTS_KEY = 'vn_screensaver_favorite_lights_v1';
const HUB_COLLAPSED_ROOMS_KEY = 'vn_screensaver_collapsed_rooms_v1';
const HUB_HOUSE_SEEN_NOTIFS_KEY = 'vn_screensaver_house_ack_notifs_v1';
const HUB_VIDEO_INDEX_KEY = 'vn_hub_video_idx_v4';
const HUB_CUSTOM_SPEAKERS_KEY = 'vn_hub_real_speakers_v5';
const HUB_GOOGLE_PHOTOS_ITEMS_KEY = 'vn_hub_google_photos_items_v1';
const HUB_GOOGLE_PHOTOS_ALBUM_URL_KEY = 'vn_hub_google_photos_album_url_v1';
const HUB_GOOGLE_PHOTOS_ACCOUNT_KEY = 'vn_hub_google_photos_account_v1';

export type PhotoOrderMode = 'sequential' | 'shuffle';

export type PhotoPairLayoutStyle =
  | 'google-tv-auto'
  | 'google-tv-split'
  | 'google-tv-polaroid'
  | 'pair-fullscreen'
  | 'single';

const PHOTO_LAYOUT_OPTIONS: {
  id: PhotoPairLayoutStyle;
  label: string;
  desc: string;
}[] = [
  {
    id: 'google-tv-auto',
    label: 'Google TV Auto',
    desc: 'Växlar automatiskt mellan Google TV Parvy och Polaroid-collage',
  },
  {
    id: 'google-tv-split',
    label: 'Google TV Parvy',
    desc: '2 bilder sida vid sida i rundade ramar med datum under varje bild',
  },
  {
    id: 'google-tv-polaroid',
    label: 'Google TV Polaroid',
    desc: 'Flera bilder som lutande fotokort med datum på kanten',
  },
  {
    id: 'pair-fullscreen',
    label: 'Helskärm i Par',
    desc: '2 bilder sida vid sida som täcker hela skärmens yta',
  },
  {
    id: 'single',
    label: 'Enkelbild',
    desc: 'Visar 1 bild åt gången med datum under bilden',
  },
];

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
  {
    id: 'fallback-4',
    imageUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    caption: 'Kvällsljus · Västkusten',
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
// MATERIAL 3 EXPRESSIVE ICON BADGE (Replaces plain emojis in Settings & Menus)
// ============================================================================
const M3ExpressiveIconBadge: React.FC<{
  children: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  size?: 'xs' | 'sm' | 'md';
  shape?: 'squircle' | 'arch' | 'pill';
}> = React.memo(
  ({
    children,
    bgColor = 'rgba(245, 208, 254, 0.18)',
    textColor = '#F5D0FE',
    size = 'sm',
    shape = 'squircle',
  }) => {
    const dimClass =
      size === 'xs'
        ? 'w-6 h-6'
        : size === 'sm'
        ? 'w-8 h-8'
        : 'w-10 h-10';
    const radiusClass =
      shape === 'pill'
        ? 'rounded-full'
        : shape === 'arch'
        ? 'rounded-t-full rounded-b-[10px]'
        : size === 'xs'
        ? 'rounded-[9px]'
        : 'rounded-[13px]';
    return (
      <span
        style={{ backgroundColor: bgColor, color: textColor }}
        className={`inline-flex items-center justify-center shrink-0 shadow-xs border border-white/15 ${dimClass} ${radiusClass}`}
      >
        {children}
      </span>
    );
  }
);

// ============================================================================
// GOOGLE HOME STYLE TOUCH-SWIPE PILL SLIDER (Scroll-Safe + Collapsible Room)
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const GoogleHomeTouchSlider: React.FC<GoogleHomeTouchSliderProps> = React.memo(({
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
  isCollapsed,
  onToggleCollapse,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [localDragPct, setLocalDragPct] = useState<number | null>(null);
  const lastEmitTimeRef = useRef<number>(0);
  const latestPctRef = useRef<number>(isOn ? brightness : 0);

  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startBrightness: number;
    rectWidth: number;
    gestureLocked: 'none' | 'horizontal' | 'vertical';
    maxDx: number;
    maxDy: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startBrightness: 0,
    rectWidth: 280,
    gestureLocked: 'none',
    maxDx: 0,
    maxDy: 0,
  });

  const isDragging = localDragPct !== null;
  const displayedBrightness = isDragging ? localDragPct : isOn ? Math.max(5, brightness) : 0;
  const effectiveIsOn = isDragging ? localDragPct > 0 : isOn;

  return (
    <div
      ref={trackRef}
      onPointerDown={(e) => {
        const rect = trackRef.current?.getBoundingClientRect();
        const startBri = isOn ? brightness : 0;
        latestPctRef.current = startBri;
        dragStateRef.current = {
          active: true,
          startX: e.clientX,
          startY: e.clientY,
          startBrightness: startBri,
          rectWidth: rect && rect.width > 0 ? rect.width : 280,
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
          if (dy > 7 && dy >= dx * 0.8) {
            st.gestureLocked = 'vertical';
            st.active = false;
            return;
          }
          if (dx > 10 && dx > dy * 1.4) {
            st.gestureLocked = 'horizontal';
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Ignore
            }
          }
        }

        if (st.gestureLocked === 'horizontal') {
          const deltaPct = ((e.clientX - st.startX) / st.rectWidth) * 100;
          const nextPct = Math.max(
            0,
            Math.min(100, Math.round(st.startBrightness + deltaPct))
          );
          latestPctRef.current = nextPct;
          setLocalDragPct(nextPct);

          const nowMs = performance.now();
          if (nowMs - lastEmitTimeRef.current >= 160) {
            lastEmitTimeRef.current = nowMs;
            onChangeBrightness(nextPct);
          }
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
          const finalPct = latestPctRef.current;
          setLocalDragPct(null);
          onChangeBrightness(finalPct);
          return;
        }
        setLocalDragPct(null);
        if (tapOnly) {
          onToggle();
        }
      }}
      onPointerCancel={() => {
        dragStateRef.current.active = false;
        dragStateRef.current.gestureLocked = 'vertical';
        setLocalDragPct(null);
      }}
      style={{ backgroundColor: trackBgColor, touchAction: 'pan-y' }}
      className="relative h-20 sm:h-22 w-full rounded-[28px] sm:rounded-[32px] overflow-hidden select-none touch-pan-y cursor-ew-resize shadow-md border border-white/10"
    >
      {/* Dynamic Google Home Fill Bar */}
      <div
        style={{
          width: `${displayedBrightness}%`,
          backgroundColor: accentFillColor,
          transition: isDragging
            ? 'none'
            : 'width 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'width',
        }}
        className="absolute inset-y-0 left-0 rounded-[28px] sm:rounded-[32px]"
      />

      {/* Foreground Content */}
      <div className="relative z-10 h-full px-4 sm:px-5 flex items-center justify-between gap-2.5 pointer-events-none">
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={{
              backgroundColor: effectiveIsOn ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.1)',
              color: effectiveIsOn ? activeTextColor : inactiveTextColor,
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
          >
            {effectiveIsOn ? (
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <LightbulbOff className="w-5 h-5 sm:w-6 sm:h-6 opacity-70" />
            )}
          </div>
          <div className="min-w-0">
            <div
              style={{
                color:
                  effectiveIsOn && displayedBrightness > 35
                    ? activeTextColor
                    : inactiveTextColor,
              }}
              className="text-base sm:text-lg font-black truncate leading-tight"
            >
              {title}
            </div>
            <div
              style={{
                color:
                  effectiveIsOn && displayedBrightness > 35
                    ? activeTextColor
                    : inactiveTextColor,
                opacity: 0.82,
              }}
              className="text-xs font-bold truncate mt-0.5"
            >
              {subtitle}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            style={{
              color:
                effectiveIsOn && displayedBrightness > 80
                  ? activeTextColor
                  : inactiveTextColor,
            }}
            className="text-base sm:text-xl font-black tabular-nums shrink-0"
          >
            {effectiveIsOn ? `${displayedBrightness}%` : 'Av'}
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
              }}
              style={{
                backgroundColor:
                  effectiveIsOn && displayedBrightness > 75
                    ? 'rgba(0,0,0,0.16)'
                    : 'rgba(255,255,255,0.14)',
                color:
                  effectiveIsOn && displayedBrightness > 75
                    ? activeTextColor
                    : inactiveTextColor,
              }}
              className="pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              title={isCollapsed ? 'Visa lampor i rummet' : 'Dölj lampor i rummet'}
              aria-label={isCollapsed ? 'Visa lampor i rummet' : 'Dölj lampor i rummet'}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  isCollapsed ? '-rotate-90' : 'rotate-0'
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// SCROLL-SAFE HORIZONTAL SLIDER (For Volume, Individual Lamps & Scrubber)
// Uses instant local drag state so dragging is 60fps with zero parent lag!
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

const TouchSafeHorizontalSlider: React.FC<TouchSafeHorizontalSliderProps> = React.memo(({
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
  const [localVal, setLocalVal] = useState<number | null>(null);
  const lastEmitRef = useRef<number>(0);
  const latestValRef = useRef<number>(value);

  const stateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startVal: number;
    rectLeft: number;
    rectWidth: number;
    locked: 'none' | 'horizontal' | 'vertical';
    maxDx: number;
    maxDy: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startVal: value,
    rectLeft: 0,
    rectWidth: 120,
    locked: 'none',
    maxDx: 0,
    maxDy: 0,
  });

  const range = Math.max(1, max - min);
  const activeValue = localVal !== null ? localVal : value;
  const ratio = Math.max(0, Math.min(1, (activeValue - min) / range));

  const valueFromClientX = (clientX: number) => {
    const st = stateRef.current;
    if (st.rectWidth <= 0) return value;
    const r = Math.max(0, Math.min(1, (clientX - st.rectLeft) / st.rectWidth));
    return Math.round(min + r * range);
  };

  return (
    <div
      ref={barRef}
      style={{ touchAction: 'pan-y' }}
      onPointerDown={(e) => {
        const rect = barRef.current?.getBoundingClientRect();
        latestValRef.current = value;
        stateRef.current = {
          active: true,
          startX: e.clientX,
          startY: e.clientY,
          startVal: value,
          rectLeft: rect ? rect.left : 0,
          rectWidth: rect && rect.width > 0 ? rect.width : 120,
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
          if (dx > 8 && dx > dy * 1.4) {
            st.locked = 'horizontal';
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Ignore
            }
          }
        }

        if (st.locked === 'horizontal') {
          const deltaVal = ((e.clientX - st.startX) / st.rectWidth) * range;
          const next = Math.max(min, Math.min(max, Math.round(st.startVal + deltaVal)));
          latestValRef.current = next;
          setLocalVal(next);

          const nowMs = performance.now();
          if (nowMs - lastEmitRef.current >= 160) {
            lastEmitRef.current = nowMs;
            onChange(next);
          }
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
          const finalVal = latestValRef.current;
          setLocalVal(null);
          onChange(finalVal);
          return;
        }
        setLocalVal(null);
        if (isStationaryTap) {
          onChange(valueFromClientX(e.clientX));
        }
      }}
      onPointerCancel={() => {
        stateRef.current.active = false;
        stateRef.current.locked = 'vertical';
        setLocalVal(null);
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
            willChange: 'width',
          }}
          className="h-full rounded-full"
        />
      </div>
      <div
        style={{
          left: `calc(${Math.round(ratio * 100)}% - 8px)`,
          backgroundColor: thumbColor,
          willChange: 'left',
        }}
        className="absolute w-4 h-4 rounded-full shadow-md pointer-events-none"
      />
    </div>
  );
});

const ScrollSafeHorizontalBar = TouchSafeHorizontalSlider;

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
  notifications?: AppNotification[];
  onDismissNotification?: (id: string) => void;
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
  notifications = [],
  onDismissNotification,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<GothenburgWeather>({
    tempC: 18,
    description: 'Klart',
    code: 0,
    highC: 19,
    lowC: 12,
  });

  // Live Device Battery Status (Android Native BatteryManager + Web Battery Status API)
  const [deviceBattery, setDeviceBattery] = useState<{
    level: number;
    charging: boolean;
  } | null>(null);

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
  const [photoLayoutStyle, setPhotoLayoutStyle] = useState<PhotoPairLayoutStyle>(() => {
    const saved = localStorage.getItem(HUB_PHOTO_LAYOUT_KEY) as PhotoPairLayoutStyle | null;
    return saved && PHOTO_LAYOUT_OPTIONS.some((o) => o.id === saved)
      ? saved
      : 'google-tv-auto';
  });
  const [photoOrderMode, setPhotoOrderMode] = useState<PhotoOrderMode>(() => {
    const saved = localStorage.getItem(HUB_PHOTO_ORDER_KEY);
    return saved === 'shuffle' ? 'shuffle' : 'sequential';
  });
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Date.now());
  const [exifDatesByUrl, setExifDatesByUrl] = useState<Record<string, string>>({});
  const [photoSlideIdx, setPhotoSlideIdx] = useState(0);
  const [slideTransitionCounter, setSlideTransitionCounter] = useState(0);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<Record<string, boolean>>({});
  const [videoIdx, setVideoIdx] = useState<number>(() => {
    const raw = Number(localStorage.getItem(HUB_VIDEO_INDEX_KEY));
    return Number.isFinite(raw) && raw >= 0 && raw < AMBIENT_VIDEOS.length ? raw : 0;
  });

  // Google Photos integration state (Shared Album Link + Google OAuth Picker/Library/Drive)
  const [googlePhotosList, setGooglePhotosList] = useState<
    Array<{ id: string; imageUrl: string; caption: string; takenAt?: string }>
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
              imageUrl: String(item.imageUrl).replace(/=w\d+-h\d+.*$/, '=w2560-h2560'),
              takenAt: item.takenAt ? String(item.takenAt) : undefined,
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

  // Favorite Lamps selection (null means all lamps are favorites by default until customized)
  const [favoriteLightKeys, setFavoriteLightKeys] = useState<string[] | null>(() => {
    try {
      const raw = localStorage.getItem(HUB_FAVORITE_LIGHTS_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch {
      // Ignore
    }
    return null;
  });

  // Collapsible Room IDs in the Lamp Menu
  const [collapsedRoomIds, setCollapsedRoomIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(HUB_COLLAPSED_ROOMS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // Ignore
    }
    return {};
  });

  // House Icon Notification Highlight & Notification Popup Box state
  const [acknowledgedHouseNotifIds, setAcknowledgedHouseNotifIds] = useState<string[]>(
    () => {
      try {
        const raw = localStorage.getItem(HUB_HOUSE_SEEN_NOTIFS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed.map(String);
        }
      } catch {
        // Ignore
      }
      return [];
    }
  );
  const [showHouseNotifModal, setShowHouseNotifModal] = useState(false);
  const [housePopupNotifs, setHousePopupNotifs] = useState<AppNotification[]>([]);

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

  // Fetch photos from a shared Google Photos album link (fetches all 520+ photos via multi-page pagination)
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
        setGooglePhotosStatus('Hämtar alla bilder i albumet från Google Foto...');
      }
      try {
        const result = await fetchSharedGooglePhotosAlbum(targetUrl);
        if (!result.ok || result.photos.length === 0) {
          if (!silent) {
            setGooglePhotosStatus(
              result.error ||
                'Hittade inga bilder i länken. Kontrollera att länkdelning är aktiverad i Google Foto.'
            );
          }
          return;
        }
        const fetchedList = result.photos;
        const label = String(result.albumTitle || 'Google Foto-album');

        setGooglePhotosList((prev) => {
          // If silent auto-refresh, only overwrite if we got at least as many photos as cached
          if (silent && prev.length > fetchedList.length) {
            return prev;
          }
          try {
            localStorage.setItem(HUB_GOOGLE_PHOTOS_ITEMS_KEY, JSON.stringify(fetchedList));
            localStorage.setItem(HUB_GOOGLE_PHOTOS_ALBUM_URL_KEY, targetUrl);
            localStorage.setItem(HUB_GOOGLE_PHOTOS_ACCOUNT_KEY, label);
          } catch {
            // Ignore
          }
          return fetchedList;
        });
        setGooglePhotosAccountLabel(label);

        if (!silent) {
          setSelectedAlbumId('GOOGLE_PHOTOS');
          setPhotoSlideIdx(0);
          localStorage.setItem(HUB_PHOTO_ALBUM_KEY, 'GOOGLE_PHOTOS');
          setGooglePhotosStatus(
            `Hämtade alla ${fetchedList.length} bilder i originalupplösning från "${label}"!`
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

  // Track live viewport width, height, and orientation (Portrait vs Landscape on Phone & Tablet)
  const [viewportSize, setViewportSize] = useState<{
    width: number;
    height: number;
  }>(() => {
    if (typeof window === 'undefined') return { width: 1024, height: 768 };
    const w = window.visualViewport?.width || window.innerWidth || 1024;
    const h = window.visualViewport?.height || window.innerHeight || 768;
    return { width: Math.round(w), height: Math.round(h) };
  });

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlBg = document.documentElement.style.backgroundColor;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#000000';
    document.documentElement.style.backgroundColor = '#000000';

    const measureViewport = () => {
      let w =
        window.visualViewport?.width ||
        document.documentElement.clientWidth ||
        window.innerWidth ||
        1024;
      let h =
        window.visualViewport?.height ||
        document.documentElement.clientHeight ||
        window.innerHeight ||
        768;

      // Cross-check with Screen Orientation API so Android WebView rotation updates immediately
      const scrType = window.screen?.orientation?.type || '';
      const legacyAngle =
        typeof (window as any).orientation === 'number'
          ? Math.abs(Number((window as any).orientation))
          : null;
      const isPhysicalLandscape =
        scrType.startsWith('landscape') || legacyAngle === 90;
      const isPhysicalPortrait =
        scrType.startsWith('portrait') || legacyAngle === 0;

      if (isPhysicalLandscape && w < h) {
        const tmp = w;
        w = h;
        h = tmp;
      } else if (isPhysicalPortrait && w > h) {
        const tmp = w;
        w = h;
        h = tmp;
      }

      setViewportSize((prev) => {
        const rw = Math.round(w);
        const rh = Math.round(h);
        if (prev.width === rw && prev.height === rh) return prev;
        return { width: rw, height: rh };
      });
    };

    const handleOrientationOrResize = () => {
      measureViewport();
      setTimeout(measureViewport, 60);
      setTimeout(measureViewport, 180);
      setTimeout(measureViewport, 350);
    };

    measureViewport();
    window.addEventListener('resize', handleOrientationOrResize);
    window.addEventListener('orientationchange', handleOrientationOrResize);
    window.visualViewport?.addEventListener('resize', handleOrientationOrResize);
    window.screen?.orientation?.addEventListener?.('change', handleOrientationOrResize);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.backgroundColor = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBg;
      window.removeEventListener('resize', handleOrientationOrResize);
      window.removeEventListener('orientationchange', handleOrientationOrResize);
      window.visualViewport?.removeEventListener('resize', handleOrientationOrResize);
      window.screen?.orientation?.removeEventListener?.('change', handleOrientationOrResize);
    };
  }, [open]);

  // Keep screen awake on Android tablet while screensaver is open
  useEffect(() => {
    setNativeKeepScreenOn(open);
    return () => setNativeKeepScreenOn(false);
  }, [open]);

  const isAnyMenuOpen =
    showWidgetCustomizer ||
    showGoogleHomeDrawer ||
    showSpeakerMenu ||
    showAppStartPageFab ||
    showHouseNotifModal;

  // Poll Device Battery Status (Android Native Bridge + Web Battery Status API)
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    let cancelled = false;
    let webBatteryObj: any = null;

    const readBattery = async () => {
      if (cancelled) return;
      // 1. Check Native Android Bridge first
      try {
        const nativeBridge = (window as any).HemNativeBridge;
        if (nativeBridge && typeof nativeBridge.getBatteryStatusJson === 'function') {
          const rawJson = nativeBridge.getBatteryStatusJson();
          if (rawJson) {
            const parsed = JSON.parse(rawJson);
            if (typeof parsed?.level === 'number' && parsed.level >= 0 && parsed.level <= 100) {
              setDeviceBattery((prev) => {
                const lvl = Math.round(parsed.level);
                const chg = Boolean(parsed.charging);
                if (prev && prev.level === lvl && prev.charging === chg) return prev;
                return { level: lvl, charging: chg };
              });
              return;
            }
          }
        }
      } catch {
        // Fall through to navigator.getBattery
      }

      // 2. Check Web Battery Status API (`navigator.getBattery()`)
      try {
        const nav = navigator as any;
        if (typeof nav.getBattery === 'function') {
          const bat = await nav.getBattery();
          if (cancelled || !bat) return;
          webBatteryObj = bat;
          const updateFromWebBat = () => {
            if (cancelled) return;
            const lvl = Math.max(0, Math.min(100, Math.round((bat.level ?? 1) * 100)));
            const chg = Boolean(bat.charging);
            setDeviceBattery((prev) => {
              if (prev && prev.level === lvl && prev.charging === chg) return prev;
              return { level: lvl, charging: chg };
            });
          };
          updateFromWebBat();
          bat.addEventListener?.('levelchange', updateFromWebBat);
          bat.addEventListener?.('chargingchange', updateFromWebBat);
        }
      } catch {
        // Ignore
      }
    };

    readBattery();
    const bTimer = setInterval(readBattery, 30000);
    return () => {
      cancelled = true;
      clearInterval(bTimer);
    };
  }, [open]);

  // Clock ticker (updates `now` ONLY when the minute changes to prevent 1-second full-tree re-renders & menu lag!)
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => {
      const current = new Date();
      setNow((prev) => {
        if (
          prev.getMinutes() === current.getMinutes() &&
          prev.getHours() === current.getHours()
        ) {
          return prev;
        }
        return current;
      });

      // Pause local media progress state updates while any menu is open so menus stay 60fps smooth
      if (isAnyMenuOpen) return;

      setSpotifyNowPlaying((prev) => {
        if (!prev || !prev.isPlaying) return prev;
        // For Cast / Android sessions, only tick locally when we have verified remote progress is advancing
        if (
          (prev.isCast ||
            prev.source === 'google-cast' ||
            prev.source === 'android-broadcast') &&
          !castPlaybackTrackerRef.current.inferredPlaying
        ) {
          return prev;
        }
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
  }, [open, isAnyMenuOpen]);

  // Normalize app photos (supports both p.imageUrl from types.ts, p.createdAt, and EXIF date)
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
          takenAt: normalizeExifOrIsoDate(
            (p as any).takenAt || (p as any).exifDate || p.createdAt
          ),
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

  // Base ordered photo list from selected album / Google Photos
  const rawAmbientPhotosList = useMemo(() => {
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

  // Apply Sequential ("I ordning") vs Shuffle ("Blanda") ordering
  const ambientPhotosList = useMemo(() => {
    if (photoOrderMode !== 'shuffle' || rawAmbientPhotosList.length <= 1) {
      return rawAmbientPhotosList;
    }
    const copy = [...rawAmbientPhotosList];
    let s = (shuffleSeed || 123456789) >>> 0;
    for (let i = copy.length - 1; i > 0; i--) {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      const j = s % (i + 1);
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }, [rawAmbientPhotosList, photoOrderMode, shuffleSeed]);

  const advancePhotoSlide = useCallback(() => {
    const total = Math.max(1, ambientPhotosList.length);
    const step = photoLayoutStyle === 'single' ? 1 : total >= 2 ? 2 : 1;
    setPhotoSlideIdx((prev) => {
      const next = (prev + step) % total;
      // If total is even and step is 2, wrap with +1 offset when looping back so odd/even pairs also mix
      if (step === 2 && total > 2 && total % 2 === 0 && prev + step >= total) {
        return (next + 1) % total;
      }
      return next;
    });
    setSlideTransitionCounter((c) => c + 1);
  }, [ambientPhotosList.length, photoLayoutStyle]);

  useEffect(() => {
    if (!open || isAnyMenuOpen) return;
    const intervalMs = Math.max(3000, photoDurationSec * 1000);
    const timer = setInterval(() => {
      advancePhotoSlide();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [open, isAnyMenuOpen, advancePhotoSlide, photoDurationSec]);

  // Preload upcoming photos in memory so paired transitions are instant and flicker-free
  useEffect(() => {
    if (!open || isAnyMenuOpen || ambientPhotosList.length === 0) return;
    const total = ambientPhotosList.length;
    for (let offset = 1; offset <= Math.min(4, total); offset++) {
      const item = ambientPhotosList[(photoSlideIdx + offset) % total];
      if (item?.imageUrl) {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.src = item.imageUrl;
      }
    }
  }, [open, isAnyMenuOpen, photoSlideIdx, ambientPhotosList]);

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

  const manualPlayPauseLockRef = useRef<{ until: number; isPlaying: boolean }>({
    until: 0,
    isPlaying: false,
  });

  // Tracks remote progressMs across 3-second polls so paused Cast/TV streams never falsely show as playing or tick & snap back
  const castPlaybackTrackerRef = useRef<{
    trackKey: string;
    lastPolledProgressMs: number;
    lastPolledAt: number;
    inferredPlaying: boolean;
  }>({
    trackKey: '',
    lastPolledProgressMs: -1,
    lastPolledAt: 0,
    inferredPlaying: false,
  });

  const reconcilePolledMediaPlaybackState = useCallback(
    (candidate: SpotifyNowPlaying | null): SpotifyNowPlaying | null => {
      if (!candidate) {
        castPlaybackTrackerRef.current = {
          trackKey: '',
          lastPolledProgressMs: -1,
          lastPolledAt: 0,
          inferredPlaying: false,
        };
        return null;
      }

      const nowMs = Date.now();
      const trackKey = `${
        candidate.deviceIp || candidate.deviceId || candidate.deviceName || ''
      }|${candidate.trackTitle || ''}|${candidate.appName || ''}`;
      const polledProg = Number(candidate.progressMs || 0);
      const polledDur = Number(candidate.durationMs || 0);

      if (nowMs < manualPlayPauseLockRef.current.until) {
        const lockedPlay = manualPlayPauseLockRef.current.isPlaying;
        castPlaybackTrackerRef.current = {
          trackKey,
          lastPolledProgressMs: polledProg,
          lastPolledAt: nowMs,
          inferredPlaying: lockedPlay,
        };
        return {
          ...candidate,
          isPlaying: lockedPlay,
        };
      }

      const isCastOrNative =
        Boolean(candidate.isCast) ||
        candidate.source === 'google-cast' ||
        candidate.source === 'android-broadcast';

      if (!isCastOrNative) {
        castPlaybackTrackerRef.current = {
          trackKey,
          lastPolledProgressMs: polledProg,
          lastPolledAt: nowMs,
          inferredPlaying: Boolean(candidate.isPlaying),
        };
        return candidate;
      }

      // 1. If the bridge explicitly reports paused, keep it paused and freeze progress
      if (!candidate.isPlaying) {
        castPlaybackTrackerRef.current = {
          trackKey,
          lastPolledProgressMs: polledProg,
          lastPolledAt: nowMs,
          inferredPlaying: false,
        };
        return {
          ...candidate,
          isPlaying: false,
        };
      }

      // 2. If both durationMs and progressMs are 0 (e.g. YouTube/TV app paused or idle with 0:00 / Live),
      // treat as paused unless the user explicitly pressed Play
      if (polledDur <= 0 && polledProg <= 0) {
        castPlaybackTrackerRef.current = {
          trackKey,
          lastPolledProgressMs: 0,
          lastPolledAt: nowMs,
          inferredPlaying: false,
        };
        return {
          ...candidate,
          isPlaying: false,
          progressMs: 0,
        };
      }

      // 3. Compare polled progressMs with previous poll to verify the stream is genuinely advancing
      const prevTracker = castPlaybackTrackerRef.current;
      if (prevTracker.trackKey === trackKey && prevTracker.lastPolledAt > 0) {
        const elapsed = nowMs - prevTracker.lastPolledAt;
        if (elapsed >= 1400) {
          const delta = Math.abs(polledProg - prevTracker.lastPolledProgressMs);
          if (delta < 350) {
            // Remote progressMs did NOT move during the last poll interval -> media is PAUSED!
            castPlaybackTrackerRef.current = {
              trackKey,
              lastPolledProgressMs: polledProg,
              lastPolledAt: nowMs,
              inferredPlaying: false,
            };
            return {
              ...candidate,
              isPlaying: false,
              progressMs: polledProg,
            };
          } else {
            // Remote progressMs advanced -> media is genuinely PLAYING!
            castPlaybackTrackerRef.current = {
              trackKey,
              lastPolledProgressMs: polledProg,
              lastPolledAt: nowMs,
              inferredPlaying: true,
            };
            return {
              ...candidate,
              isPlaying: true,
              progressMs: polledProg,
            };
          }
        }
        return {
          ...candidate,
          isPlaying: prevTracker.inferredPlaying,
        };
      }

      // First sample for this trackKey: record baseline position and wait for next poll before local ticking
      castPlaybackTrackerRef.current = {
        trackKey,
        lastPolledProgressMs: polledProg,
        lastPolledAt: nowMs,
        inferredPlaying: false,
      };
      return {
        ...candidate,
        isPlaying: polledProg > 0 && Boolean(candidate.isPlaying),
      };
    },
    []
  );

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

    setSpotifyNowPlaying(reconcilePolledMediaPlaybackState(detectedPlaying));

    // 4. Discover available Sonos, Google Cast & Spotify Connect devices on the network
    const discovered = await fetchSpotifyConnectDevices();
    if (discovered.length > 0) {
      mergeDiscoveredSpeakers(discovered);
    }
  }, [mergeDiscoveredSpeakers, reconcilePolledMediaPlaybackState]);

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
          setSpotifyNowPlaying(reconcilePolledMediaPlaybackState(castPlaying));
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
    [
      mergeDiscoveredSpeakers,
      refreshNetworkMediaAndDevices,
      reconcilePolledMediaPlaybackState,
    ]
  );

  useEffect(() => {
    if (!open || isAnyMenuOpen) return;
    refreshNetworkMediaAndDevices();
    handleScanNetworkSpeakers(true);
    const t = setInterval(refreshNetworkMediaAndDevices, 3500);
    return () => clearInterval(t);
  }, [open, isAnyMenuOpen, refreshNetworkMediaAndDevices, handleScanNetworkSpeakers]);

  const lastHueManualChangeAtRef = useRef<number>(0);
  const hueDebounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Poll Philips Hue rooms & individual lights if configured
  const syncLiveHueBridgeRooms = useCallback(
    async (cfgOverride?: HueConfig, showFeedback = false) => {
      // Never overwrite local slider state while user is actively adjusting brightness
      if (!showFeedback && Date.now() - lastHueManualChangeAtRef.current < 4000) {
        return;
      }
      const cfg = cfgOverride || hueConfig;
      const isReady = Boolean(
        cfg.username &&
          (cfg.bridgeIp || cfg.hueCloudToken) &&
          (cfg.connected || !cfg.useDemoMode)
      );
      if (!isReady) return;
      try {
        const res = await fetchHueRooms(cfg);
        if (
          !showFeedback &&
          Date.now() - lastHueManualChangeAtRef.current < 4000
        ) {
          return;
        }
        if (Array.isArray(res.rooms) && res.rooms.length > 0) {
          setHueRooms(res.rooms);
          if (showFeedback) {
            const totalLights = res.rooms.reduce(
              (acc, r) => acc + (r.lights?.length || 0),
              0
            );
            setHueStatusMsg(
              res.isLive
                ? `Synkad med Hue Bridge (${cfg.bridgeIp}): ${res.rooms.length} rum och ${totalLights} lampor hämtade!`
                : `Visar ${res.rooms.length} sparade rum.`
            );
          }
        }
      } catch {
        // Ignore transient poll error
      }
    },
    [hueConfig]
  );

  useEffect(() => {
    const isReady = Boolean(
      hueConfig.username &&
        (hueConfig.bridgeIp || hueConfig.hueCloudToken) &&
        (hueConfig.connected || !hueConfig.useDemoMode)
    );
    if (!open || !isReady || isAnyMenuOpen) return;
    syncLiveHueBridgeRooms();
    const t = setInterval(() => {
      syncLiveHueBridgeRooms();
    }, 9000);
    return () => {
      clearInterval(t);
    };
  }, [open, isAnyMenuOpen, hueConfig, syncLiveHueBridgeRooms]);

  // Refresh Hue lamps once after drawer opens
  useEffect(() => {
    if (!showGoogleHomeDrawer) return;
    const t = setTimeout(() => {
      syncLiveHueBridgeRooms();
    }, 350);
    return () => clearTimeout(t);
  }, [showGoogleHomeDrawer, syncLiveHueBridgeRooms]);

  // Compute all available light keys across all rooms for Favorites management
  const allHueLightKeys = useMemo(() => {
    const keys: string[] = [];
    for (const r of hueRooms) {
      const rLights = r.lights || [];
      rLights.forEach((l, idx) => {
        const lid = String(l.id || `${r.id}-l-${idx}`);
        keys.push(`${r.id}::${lid}`);
      });
    }
    return keys;
  }, [hueRooms]);

  const effectiveFavoriteKeySet = useMemo(() => {
    if (favoriteLightKeys === null) {
      return new Set(allHueLightKeys);
    }
    return new Set(favoriteLightKeys);
  }, [favoriteLightKeys, allHueLightKeys]);

  const isLightMarkedFavorite = useCallback(
    (roomId: string, lightId: string) => {
      const key = `${roomId}::${lightId}`;
      if (favoriteLightKeys === null) return true;
      return effectiveFavoriteKeySet.has(key) || effectiveFavoriteKeySet.has(String(lightId));
    },
    [favoriteLightKeys, effectiveFavoriteKeySet]
  );

  const toggleFavoriteLight = useCallback(
    (roomId: string, lightId: string) => {
      const key = `${roomId}::${lightId}`;
      setFavoriteLightKeys((prev) => {
        const base = prev === null ? [...allHueLightKeys] : [...prev];
        const exists = base.includes(key) || base.includes(String(lightId));
        const next = exists
          ? base.filter((k) => k !== key && k !== String(lightId))
          : [...base, key];
        try {
          localStorage.setItem(HUB_FAVORITE_LIGHTS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
    },
    [allHueLightKeys]
  );

  const toggleAllRoomFavorites = useCallback(
    (room: HueRoom) => {
      const roomKeys = (room.lights || []).map(
        (l, idx) => `${room.id}::${String(l.id || `${room.id}-l-${idx}`)}`
      );
      setFavoriteLightKeys((prev) => {
        const base = prev === null ? [...allHueLightKeys] : [...prev];
        const allSelected = roomKeys.every((rk) => base.includes(rk));
        const next = allSelected
          ? base.filter((k) => !roomKeys.includes(k))
          : Array.from(new Set([...base, ...roomKeys]));
        try {
          localStorage.setItem(HUB_FAVORITE_LIGHTS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
    },
    [allHueLightKeys]
  );

  const toggleRoomCollapsed = useCallback((roomId: string) => {
    setCollapsedRoomIds((prev) => {
      const next = { ...prev, [roomId]: !prev[roomId] };
      try {
        localStorage.setItem(HUB_COLLAPSED_ROOMS_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  // Filtered rooms & lamps for the Screensaver Lamp Menu (ONLY favorite lamps, sorted by their rooms)
  const favoriteHueRooms = useMemo(() => {
    return hueRooms
      .map((room) => {
        const favLights = (room.lights || []).filter((l, idx) => {
          if (!l || typeof l !== 'object') return false;
          const lid = String(l.id || `${room.id}-l-${idx}`);
          return isLightMarkedFavorite(room.id, lid);
        });
        if (favLights.length === 0) return null;
        const anyFavOn = favLights.some((l) => Boolean(l.on));
        const activeFavs = favLights.filter((l) => Boolean(l.on));
        const avgFavPct =
          activeFavs.length > 0
            ? Math.round(
                activeFavs.reduce(
                  (acc, l) =>
                    acc +
                    (l.brightness ??
                      Math.max(5, Math.round(((l.bri || 200) / 254) * 100))),
                  0
                ) / activeFavs.length
              )
            : 0;
        return {
          ...room,
          on: anyFavOn,
          anyOn: anyFavOn,
          brightness: avgFavPct,
          lights: favLights,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [hueRooms, isLightMarkedFavorite]);

  // Unacknowledged notifications for the bottom-right House icon
  const unacknowledgedHouseNotifs = useMemo(() => {
    return notifications.filter(
      (n) => n && n.id && !acknowledgedHouseNotifIds.includes(n.id)
    );
  }, [notifications, acknowledgedHouseNotifIds]);

  const hasNewHouseNotification = unacknowledgedHouseNotifs.length > 0;

  const totalPhotosCount = Math.max(1, ambientPhotosList.length);
  const currentPhotoSlide =
    ambientPhotosList[photoSlideIdx % totalPhotosCount] ||
    FALLBACK_AMBIENT_PHOTOS[0];
  const secondPhotoSlide =
    ambientPhotosList[(photoSlideIdx + 1) % totalPhotosCount] ||
    FALLBACK_AMBIENT_PHOTOS[1 % FALLBACK_AMBIENT_PHOTOS.length];
  const thirdPhotoSlide =
    ambientPhotosList[(photoSlideIdx + 2) % totalPhotosCount] ||
    FALLBACK_AMBIENT_PHOTOS[2 % FALLBACK_AMBIENT_PHOTOS.length];

  // Probe EXIF DateTimeOriginal for visible photos if they don't already have takenAt metadata
  useEffect(() => {
    if (!open || isAnyMenuOpen) return;
    let cancelled = false;
    const visibleSlides = [currentPhotoSlide, secondPhotoSlide, thirdPhotoSlide];
    for (const slide of visibleSlides) {
      const url = slide?.imageUrl;
      if (!url || (slide as any).takenAt || exifDatesByUrl[url]) continue;
      extractExifDateFromImageUrl(url).then((exifIso) => {
        if (cancelled || !exifIso) return;
        setExifDatesByUrl((prev) => {
          if (prev[url] === exifIso) return prev;
          return { ...prev, [url]: exifIso };
        });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [
    open,
    isAnyMenuOpen,
    currentPhotoSlide,
    secondPhotoSlide,
    thirdPhotoSlide,
    exifDatesByUrl,
  ]);

  const getPhotoDateDisplay = (photo: {
    imageUrl?: string;
    takenAt?: string;
    createdAt?: string;
  }): string | null => {
    const raw =
      photo?.takenAt ||
      (photo?.imageUrl ? exifDatesByUrl[photo.imageUrl] : undefined) ||
      (photo as any)?.createdAt;
    return formatPhotoTakenDateSwedish(raw);
  };

  if (!open) return null;

  const hoursStr = String(now.getHours()).padStart(2, '0');
  const minsStr = String(now.getMinutes()).padStart(2, '0');
  const dateStr = now.toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Active media session (Sonos, Google Cast, Spotify Connect, or Android MediaSession)
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

  // Lighting summary (based on favorite lamps shown in the Lamp menu)
  const activeRoomsCount = favoriteHueRooms.filter((r) => r.anyOn).length;
  const avgBrightness =
    activeRoomsCount > 0
      ? Math.round(
          favoriteHueRooms
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
    const cmd = nextPlay ? 'play' : 'pause';
    manualPlayPauseLockRef.current = {
      until: Date.now() + 6000,
      isPlaying: nextPlay,
    };
    castPlaybackTrackerRef.current = {
      ...castPlaybackTrackerRef.current,
      inferredPlaying: nextPlay,
      lastPolledAt: Date.now(),
    };
    setSpotifyNowPlaying((prev) => (prev ? { ...prev, isPlaying: nextPlay } : null));

    const targetIpOrId =
      activeMedia.deviceIp || activeMedia.deviceId || activeMedia.deviceName;
    if (isCastVideoOrTvSession || activeMedia.deviceIp) {
      await sendCastDeviceControl(targetIpOrId, 'play_pause', nextPlay ? 1 : 0);
      setTimeout(refreshNetworkMediaAndDevices, 900);
      return;
    }
    const ok = await sendSpotifyConnectCommand(undefined, cmd);
    if (!ok) {
      await sendCastDeviceControl(targetIpOrId, 'play_pause', nextPlay ? 1 : 0);
    }
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

  const handleSetFavoriteLightsBrightness = async (
    targetPct: number,
    onlyRoomId?: string
  ) => {
    lastHueManualChangeAtRef.current = Date.now();
    const clamped = Math.max(0, Math.min(100, Math.round(targetPct)));
    const isOn = clamped > 0;
    const rawBri = Math.max(
      1,
      Math.min(254, Math.round((Math.max(1, clamped) / 100) * 254))
    );

    setHueRooms((prev) => {
      const updated = prev.map((r) => {
        if (onlyRoomId && r.id !== onlyRoomId) return r;
        let touchedInRoom = false;
        const nextLights = (r.lights || []).map((l, idx) => {
          const lid = String(l.id || `${r.id}-l-${idx}`);
          if (!isLightMarkedFavorite(r.id, lid)) return l;
          touchedInRoom = true;
          return {
            ...l,
            on: isOn,
            bri: rawBri,
            brightness: clamped,
          };
        });
        if (!touchedInRoom) return r;
        const anyLightOn = nextLights.some((l) => Boolean(l.on));
        const activeLights = nextLights.filter((l) => Boolean(l.on));
        const avgPct =
          activeLights.length > 0
            ? Math.round(
                activeLights.reduce((acc, l) => acc + (l.brightness ?? 0), 0) /
                  activeLights.length
              )
            : 0;
        return {
          ...r,
          on: anyLightOn,
          anyOn: anyLightOn,
          bri: rawBri,
          brightness: avgPct,
          lights: nextLights,
        };
      });

      const timerKey = onlyRoomId ? `fav-room-${onlyRoomId}` : 'fav-all';
      if (hueDebounceTimersRef.current[timerKey]) {
        clearTimeout(hueDebounceTimersRef.current[timerKey]);
      }
      hueDebounceTimersRef.current[timerKey] = setTimeout(() => {
        updateSelectedHueLightsAction(
          hueConfig,
          updated,
          effectiveFavoriteKeySet,
          { on: isOn, bri: rawBri, brightness: clamped },
          onlyRoomId
        );
      }, 110);

      return updated;
    });
  };

  const handleRoomBrightnessChange = (room: HueRoom, nextBri: number) => {
    handleSetFavoriteLightsBrightness(nextBri, room.id);
  };

  const handleToggleRoomOnOff = async (room: HueRoom) => {
    const nextOn = !room.anyOn;
    const nextBri = nextOn ? Math.max(25, room.brightness || 80) : 0;
    await handleSetFavoriteLightsBrightness(nextBri, room.id);
  };

  const handleIndividualLightChange = (
    room: HueRoom,
    lightId: string,
    nextOn: boolean,
    nextBrightnessPct: number
  ) => {
    lastHueManualChangeAtRef.current = Date.now();
    const clampedPct = nextOn ? Math.max(5, Math.min(100, Math.round(nextBrightnessPct))) : 0;
    const rawBri = Math.max(
      1,
      Math.min(254, Math.round((Math.max(1, clampedPct) / 100) * 254))
    );

    // Optimistically update React state immediately so the slider and room header never lag
    setHueRooms((prev) =>
      prev.map((r) => {
        if (r.id !== room.id) return r;
        const nextLights = (r.lights || []).map((l) =>
          String(l.id) === String(lightId)
            ? { ...l, on: nextOn, bri: rawBri, brightness: clampedPct }
            : l
        );
        const anyLightOn = nextLights.some((l) => l.on);
        const onLights = nextLights.filter((l) => l.on);
        const avgRoomPct =
          onLights.length > 0
            ? Math.round(
                onLights.reduce((acc, l) => acc + (l.brightness ?? 0), 0) /
                  onLights.length
              )
            : 0;
        return {
          ...r,
          on: anyLightOn,
          anyOn: anyLightOn,
          brightness: avgRoomPct,
          lights: nextLights,
        };
      })
    );

    const timerKey = `light-${room.id}-${lightId}`;
    if (hueDebounceTimersRef.current[timerKey]) {
      clearTimeout(hueDebounceTimersRef.current[timerKey]);
    }
    hueDebounceTimersRef.current[timerKey] = setTimeout(() => {
      updateIndividualLightInRoom(hueConfig, room, lightId, {
        on: nextOn,
        bri: rawBri,
        brightness: clampedPct,
      });
    }, 130);
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

  const resolvedPhotoLayout: Exclude<PhotoPairLayoutStyle, 'google-tv-auto'> =
    totalPhotosCount < 2
      ? 'single'
      : photoLayoutStyle === 'google-tv-auto'
        ? slideTransitionCounter % 2 === 0
          ? 'google-tv-split'
          : 'google-tv-polaroid'
        : photoLayoutStyle;

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

  const isPortrait = viewportSize.height > viewportSize.width;
  const isNarrowPortrait = isPortrait && viewportSize.width < 600;
  const isCompactLandscape = !isPortrait && viewportSize.height < 520;
  const showThreePolaroids =
    !isPortrait && viewportSize.width >= 960 && totalPhotosCount >= 3;

  return createPortal(
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: '100vw',
        minHeight: '100dvh',
        background: activePalette.bgGradient,
      }}
      className="fixed inset-0 z-[9999] flex flex-col justify-between bg-black text-white overflow-hidden select-none"
    >
      {/* =====================================================================
          0. SEAMLESS FULL-SCREEN AMBIENT BACKDROP (NO MIDDLE SEAM, ZERO GPU BLUR LAG)
             Uses smooth radial ambient color fields across the entire screen
             instead of two side-by-side CSS-blurred images.
         ===================================================================== */}
      <div
        style={{
          background: activePalette.bgGradient,
          transition: 'background 900ms ease',
        }}
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <div
          style={{
            background: `radial-gradient(circle at 22% 32%, ${activePalette.clockAccent}26 0%, transparent 58%), radial-gradient(circle at 78% 68%, ${activePalette.mediaCardBg}22 0%, transparent 58%)`,
          }}
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/55" />
      </div>

      {/* Click-outside backdrop when Lamp, Start Page, or Speaker drawer is open */}
      {(showGoogleHomeDrawer || showAppStartPageFab || showSpeakerMenu) && (
        <div
          onClick={() => {
            setShowGoogleHomeDrawer(false);
            setShowAppStartPageFab(false);
            setShowSpeakerMenu(false);
          }}
          className="fixed inset-0 z-20 bg-black/40"
        />
      )}

      {/* =====================================================================
          1. ROW 1 — DEDICATED TOP HEADER BAR (SETTINGS LEFT · CLOCK/DATE RIGHT)
             Sits ABOVE the photo stage so the clock and settings button NEVER
             cover or overlap the photos on any phone or tablet screen!
         ===================================================================== */}
      <header
        className={`relative z-30 shrink-0 w-full flex items-center justify-between gap-2.5 ${
          isCompactLandscape
            ? 'px-3.5 pt-[max(0.45rem,env(safe-area-inset-top,0px))] pb-1'
            : 'px-3.5 sm:px-6 lg:px-8 pt-[max(2.15rem,calc(env(safe-area-inset-top,0px)+0.45rem),calc(var(--android-status-bar-height,32px)+0.35rem))] pb-1.5 sm:pb-2'
        }`}
      >
        {/* Top-Left: Round White Settings Button */}
        <button
          type="button"
          onClick={() => {
            setShowGoogleHomeDrawer(false);
            setShowAppStartPageFab(false);
            setShowSpeakerMenu(false);
            setShowWidgetCustomizer(true);
          }}
          className={`${
            isCompactLandscape
              ? 'w-10 h-10'
              : isNarrowPortrait
              ? 'w-11 h-11'
              : 'w-13 h-13 sm:w-14 sm:h-14'
          } rounded-full bg-white text-slate-900 border border-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.5)] hover:bg-slate-100 flex items-center justify-center transition-transform duration-200 active:scale-90 shrink-0`}
          title="Alla inställningar"
          aria-label="Alla inställningar"
        >
          <Settings
            className={`${
              isCompactLandscape
                ? 'w-5 h-5'
                : isNarrowPortrait
                ? 'w-5 h-5'
                : 'w-6 h-6 sm:w-7 sm:h-7'
            } text-slate-900`}
          />
        </button>

        {/* Top-Right: Adaptive Clock, Date, Weather & Device Battery Status Badge */}
        <div
          className={`pointer-events-none rounded-full sm:rounded-[24px] bg-black/70 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center ${
            isCompactLandscape
              ? 'px-3.5 py-1 gap-2'
              : isNarrowPortrait
              ? 'px-3.5 py-1.5 gap-2'
              : 'px-4.5 py-2 gap-3'
          }`}
        >
          <span
            className={`${
              isCompactLandscape
                ? 'text-lg'
                : isNarrowPortrait
                ? 'text-xl'
                : 'text-2xl sm:text-3xl lg:text-4xl'
            } font-black tracking-tight text-white tabular-nums leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]`}
          >
            {hoursStr}:{minsStr}
          </span>
          <span className="w-px h-4 sm:h-5 bg-white/25 shrink-0" />
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs lg:text-sm font-extrabold text-white/95 whitespace-nowrap">
            <span className="capitalize">{dateStr}</span>
            <span className="opacity-60">·</span>
            <span className="inline-flex items-center gap-1">
              {getWeatherIcon(weather.code, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
              <span>{weather.tempC}°C</span>
            </span>

            {deviceBattery && (
              <>
                <span className="opacity-60">·</span>
                <span
                  className="inline-flex items-center gap-1 tabular-nums"
                  title={
                    deviceBattery.charging
                      ? `Batteri ${deviceBattery.level}% (Laddar)`
                      : `Batteri ${deviceBattery.level}%`
                  }
                >
                  {/* Dynamic Material 3 Expressive Battery Icon with Fill Level */}
                  <span className="relative inline-flex items-center">
                    <span className="w-5 h-2.5 sm:w-5.5 sm:h-3 rounded-[4px] border border-white/85 p-[1.5px] flex items-center">
                      <span
                        style={{
                          width: `${Math.max(8, Math.min(100, deviceBattery.level))}%`,
                        }}
                        className={`h-full rounded-[2px] transition-all ${
                          deviceBattery.charging
                            ? 'bg-emerald-400'
                            : deviceBattery.level <= 15
                            ? 'bg-rose-400'
                            : deviceBattery.level <= 30
                            ? 'bg-amber-300'
                            : 'bg-white'
                        }`}
                      />
                    </span>
                    <span className="w-[2px] h-1.5 bg-white/85 rounded-r-[1.5px] ml-[1px]" />
                    {deviceBattery.charging && (
                      <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300 ml-0.5" />
                    )}
                  </span>
                  <span>{deviceBattery.level}%</span>
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. ROW 2 — DEDICATED MIDDLE PHOTO STAGE (60FPS HARDWARE CROSSFADE)
             Occupies flex-1 min-h-0 strictly between Row 1 (Top Header Bar)
             and Row 3 (Bottom Controls Bar). Displays the date the photo was
             taken (from Google Photos & EXIF) directly underneath each photo!
         ===================================================================== */}
      <main
        onClick={() => {
          if (showGoogleHomeDrawer) setShowGoogleHomeDrawer(false);
          if (showAppStartPageFab) setShowAppStartPageFab(false);
          if (showSpeakerMenu) setShowSpeakerMenu(false);
          if (showHouseNotifModal) setShowHouseNotifModal(false);
        }}
        className={`relative z-10 flex-1 min-h-0 min-w-0 w-full overflow-hidden flex items-center justify-center ${
          isCompactLandscape
            ? 'px-3 py-1'
            : 'px-3 sm:px-6 lg:px-8 py-1 sm:py-2'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`slide-${photoSlideIdx}-${resolvedPhotoLayout}-${photoOrderMode}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.34, ease: 'easeOut' }}
            style={{ willChange: 'opacity, transform' }}
            className="w-full h-full min-h-0 min-w-0 overflow-hidden flex items-center justify-center"
          >
            {resolvedPhotoLayout === 'google-tv-split' && (
              /* ---------------------------------------------------------------
                 ALTERNATIV 1: GOOGLE TV DELAD PARVY (Squircle-ramar 50/50)
                 Under varje bild visas datumet när bilden togs (Google Foto / EXIF).
                 --------------------------------------------------------------- */
              <div
                className={`w-full h-full min-h-0 min-w-0 grid overflow-hidden ${
                  isPortrait
                    ? 'grid-cols-1 grid-rows-2 gap-2.5 sm:gap-4'
                    : 'grid-cols-2 grid-rows-1 gap-3 sm:gap-5 lg:gap-7'
                }`}
              >
                {[currentPhotoSlide, secondPhotoSlide].map((photo, idx) => {
                  const safeUrl =
                    photo.imageUrl ||
                    FALLBACK_AMBIENT_PHOTOS[idx % FALLBACK_AMBIENT_PHOTOS.length]
                      .imageUrl;
                  const takenDateStr = getPhotoDateDisplay(photo as any);
                  return (
                    <div
                      key={`${photo.id}-${idx}`}
                      className="relative w-full h-full min-h-0 min-w-0 overflow-hidden flex flex-col items-center justify-center gap-1.5"
                    >
                      <div className="relative z-10 w-full flex-1 min-h-0 min-w-0 rounded-[26px] sm:rounded-[40px] lg:rounded-[50px] overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/20 bg-zinc-900">
                        <img
                          src={safeUrl}
                          alt={photo.caption}
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const badUrl = photo.imageUrl;
                            if (
                              badUrl &&
                              badUrl !== FALLBACK_AMBIENT_PHOTOS[0].imageUrl
                            ) {
                              setFailedPhotoUrls((prev) => ({
                                ...prev,
                                [badUrl]: true,
                              }));
                              e.currentTarget.src =
                                FALLBACK_AMBIENT_PHOTOS[0].imageUrl;
                            }
                          }}
                          className="w-full h-full object-cover pointer-events-none select-none"
                        />
                      </div>

                      {/* Date taken (from Google Photos / EXIF) + album label directly UNDER the photo */}
                      <div className="shrink-0 flex items-center justify-center gap-2 max-w-[94%] px-3.5 py-1 rounded-full bg-black/65 border border-white/15 text-[11px] sm:text-xs font-extrabold text-white/95 truncate shadow-sm pointer-events-none">
                        {takenDateStr ? (
                          <>
                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 shrink-0" />
                            <span>{takenDateStr}</span>
                            {photo.caption && (
                              <>
                                <span className="opacity-50">·</span>
                                <span className="truncate opacity-85">{photo.caption}</span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="truncate">
                            {photo.caption || 'Familjealbum'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {resolvedPhotoLayout === 'google-tv-polaroid' && (
              /* ---------------------------------------------------------------
                 ALTERNATIV 2: GOOGLE TV POLAROID / FOTOKORT
                 Visar datumet när bilden togs direkt under bilden på Polaroid-kortet.
                 --------------------------------------------------------------- */
              <div
                className={`relative z-10 w-full h-full min-h-0 min-w-0 max-w-[1650px] flex ${
                  isPortrait ? 'flex-col' : 'flex-row'
                } items-center justify-center gap-2.5 sm:gap-5 lg:gap-7 px-1 sm:px-3 py-1`}
              >
                {(showThreePolaroids
                  ? [currentPhotoSlide, secondPhotoSlide, thirdPhotoSlide]
                  : [currentPhotoSlide, secondPhotoSlide]
                ).map((photo, idx) => {
                  const safeUrl =
                    photo.imageUrl ||
                    FALLBACK_AMBIENT_PHOTOS[idx % FALLBACK_AMBIENT_PHOTOS.length]
                      .imageUrl;
                  const rotations = isPortrait
                    ? [-1.0, 1.0, -0.8]
                    : [-1.8, 1.4, -1.2];
                  const rot = rotations[idx % rotations.length];
                  const takenDateStr = getPhotoDateDisplay(photo as any);

                  return (
                    <div
                      key={`${photo.id}-polaroid-${idx}`}
                      style={{ transform: `rotate(${rot}deg)` }}
                      className={`flex flex-col flex-1 min-w-0 min-h-0 ${
                        isPortrait
                          ? 'w-full max-w-[96%] sm:max-w-[90%]'
                          : 'h-full max-h-[96%]'
                      } bg-[#F5F2EB] text-[#1C1B18] p-2 sm:p-3 pb-2.5 sm:pb-3.5 rounded-[20px] sm:rounded-[28px] shadow-[0_18px_45px_rgba(0,0,0,0.6)] ring-1 ring-black/10`}
                    >
                      <div className="relative flex-1 w-full min-h-0 rounded-[14px] sm:rounded-[20px] overflow-hidden bg-stone-900">
                        <img
                          src={safeUrl}
                          alt={photo.caption}
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const badUrl = photo.imageUrl;
                            if (
                              badUrl &&
                              badUrl !== FALLBACK_AMBIENT_PHOTOS[0].imageUrl
                            ) {
                              setFailedPhotoUrls((prev) => ({
                                ...prev,
                                [badUrl]: true,
                              }));
                              e.currentTarget.src =
                                FALLBACK_AMBIENT_PHOTOS[0].imageUrl;
                            }
                          }}
                          className="w-full h-full object-cover pointer-events-none select-none"
                        />
                      </div>

                      <div className="pt-1.5 sm:pt-2.5 px-1.5 flex items-center justify-between gap-2 shrink-0">
                        <span className="text-[11px] sm:text-xs lg:text-sm font-extrabold text-stone-800 truncate">
                          {takenDateStr || photo.caption || 'Familjealbum'}
                        </span>
                        <span className="text-[11px] sm:text-xs font-bold text-stone-500 truncate max-w-[45%] shrink-0">
                          {takenDateStr && photo.caption ? photo.caption : 'Google Foto'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {resolvedPhotoLayout === 'pair-fullscreen' && (
              /* ---------------------------------------------------------------
                 ALTERNATIV 3: HELSKÄRM I PAR
                 Visar datumet när bilden togs under varje bild i paret.
                 --------------------------------------------------------------- */
              <div
                className={`relative w-full h-full min-h-0 min-w-0 grid ${
                  isPortrait
                    ? 'grid-cols-1 grid-rows-2 gap-2 sm:gap-3'
                    : 'grid-cols-2 grid-rows-1 gap-2.5 sm:gap-4'
                }`}
              >
                {[currentPhotoSlide, secondPhotoSlide].map((photo, idx) => {
                  const safeUrl =
                    photo.imageUrl ||
                    FALLBACK_AMBIENT_PHOTOS[idx % FALLBACK_AMBIENT_PHOTOS.length]
                      .imageUrl;
                  const takenDateStr = getPhotoDateDisplay(photo as any);
                  return (
                    <div
                      key={`${photo.id}-fullpair-${idx}`}
                      className="relative w-full h-full min-h-0 min-w-0 flex flex-col gap-1.5 overflow-hidden"
                    >
                      <div className="relative flex-1 w-full min-h-0 rounded-[24px] sm:rounded-[34px] overflow-hidden shadow-2xl ring-1 ring-white/15 bg-zinc-950">
                        <img
                          src={safeUrl}
                          alt={photo.caption}
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const badUrl = photo.imageUrl;
                            if (
                              badUrl &&
                              badUrl !== FALLBACK_AMBIENT_PHOTOS[0].imageUrl
                            ) {
                              setFailedPhotoUrls((prev) => ({
                                ...prev,
                                [badUrl]: true,
                              }));
                              e.currentTarget.src =
                                FALLBACK_AMBIENT_PHOTOS[0].imageUrl;
                            }
                          }}
                          className="w-full h-full object-cover pointer-events-none select-none"
                        />
                      </div>
                      <div className="shrink-0 self-center flex items-center gap-1.5 px-3.5 py-0.5 rounded-full bg-black/65 border border-white/15 text-[11px] sm:text-xs font-extrabold text-white/95 truncate max-w-[92%]">
                        {takenDateStr ? (
                          <>
                            <Calendar className="w-3 h-3 text-amber-300 shrink-0" />
                            <span>{takenDateStr}</span>
                            {photo.caption && (
                              <>
                                <span className="opacity-50">·</span>
                                <span className="truncate opacity-80">{photo.caption}</span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="truncate">{photo.caption || 'Familjealbum'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {resolvedPhotoLayout === 'single' && (
              /* ---------------------------------------------------------------
                 ALTERNATIV 4: ENKELBILD (1 bild åt gången med datum under bilden)
                 --------------------------------------------------------------- */
              <div className="relative w-full h-full min-h-0 min-w-0 flex flex-col items-center justify-center gap-1.5 overflow-hidden">
                <div className="relative flex-1 w-full min-h-0 min-w-0 flex items-center justify-center rounded-[28px] sm:rounded-[40px] overflow-hidden bg-black/25 ring-1 ring-white/15">
                  <img
                    src={
                      currentPhotoSlide.imageUrl ||
                      FALLBACK_AMBIENT_PHOTOS[0].imageUrl
                    }
                    alt={currentPhotoSlide.caption}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const badUrl = currentPhotoSlide.imageUrl;
                      if (
                        badUrl &&
                        badUrl !== FALLBACK_AMBIENT_PHOTOS[0].imageUrl
                      ) {
                        setFailedPhotoUrls((prev) => ({ ...prev, [badUrl]: true }));
                        e.currentTarget.src = FALLBACK_AMBIENT_PHOTOS[0].imageUrl;
                      }
                    }}
                    className="relative z-10 w-full h-full max-w-full max-h-full object-contain pointer-events-none select-none"
                  />
                </div>
                <div className="shrink-0 flex items-center gap-1.5 px-4 py-1 rounded-full bg-black/65 border border-white/15 text-xs font-extrabold text-white/95">
                  {getPhotoDateDisplay(currentPhotoSlide as any) ? (
                    <>
                      <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{getPhotoDateDisplay(currentPhotoSlide as any)}</span>
                      {currentPhotoSlide.caption && (
                        <>
                          <span className="opacity-50">·</span>
                          <span className="opacity-85">{currentPhotoSlide.caption}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>{currentPhotoSlide.caption || 'Familjealbum'}</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Night Dimmer Overlay */}
      {dimmerPercent > 0 && (
        <div
          style={{ opacity: dimmerPercent / 100 }}
          className="fixed inset-0 bg-black pointer-events-none z-[105]"
        />
      )}

      {/* =====================================================================
          3. ROW 3 — DEDICATED BOTTOM CONTROLS BAR
             Sits BELOW the photo stage so controls NEVER cover the photos.
             Adapts automatically to narrow portrait phones vs landscape/tablets!
         ===================================================================== */}
      <footer
        className={`relative z-30 shrink-0 w-full ${
          isCompactLandscape
            ? 'px-3.5 pt-0.5 pb-[max(0.45rem,env(safe-area-inset-bottom,0px))]'
            : 'px-3.5 sm:px-6 lg:px-8 pt-1 pb-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.25rem))]'
        }`}
      >
        <div
          className={`w-full ${
            isNarrowPortrait
              ? 'flex flex-col gap-2'
              : 'flex items-center justify-between gap-2.5 sm:gap-4 lg:gap-6'
          }`}
        >
          {/* On narrow portrait phones, render the elongated media bar full-width at the top of the footer */}
          {activeMedia && (
            <div
              className={
                isNarrowPortrait
                  ? 'w-full order-1'
                  : 'flex-1 min-w-0 max-w-[780px] lg:max-w-[940px] mx-auto order-2 flex justify-center'
              }
            >
              <div className="relative w-full pointer-events-auto">
                {/* Expandable Speaker, Sonos, Cast & Volume Popover (opens upwards above the elongated bar) */}
            {showSpeakerMenu && (
              <div
                style={{
                  background: activePalette.mediaCardBg,
                  color: activePalette.mediaCardText,
                }}
                className="absolute bottom-full left-0 right-0 mb-3 rounded-[28px] sm:rounded-[34px] p-4 sm:p-5 shadow-[0_24px_70px_rgba(0,0,0,0.75)] border border-white/25 space-y-3 max-h-[56vh] overflow-y-auto overscroll-contain z-40"
              >
                {/* Direct Volume Slider at top of speaker menu */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-black/12">
                  <Volume2 className="w-4 h-4 shrink-0 opacity-85" />
                  <span className="text-xs font-black shrink-0">Volym</span>
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
                  <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
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

            {/* Main Sleek Elongated Horizontal Media Bar */}
            <div
              style={{
                background: activePalette.mediaCardBg,
                color: activePalette.mediaCardText,
              }}
              className="w-full rounded-[28px] sm:rounded-full px-3 py-2 sm:px-4 sm:py-2.5 shadow-[0_16px_50px_rgba(0,0,0,0.65)] border border-white/25 flex items-center justify-between gap-2.5 sm:gap-3.5 overflow-hidden"
            >
              {/* 1. Left: Compact Thumbnail + Track Title & Device/Status */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 md:flex-initial md:w-[200px] lg:w-[240px] overflow-hidden">
                <div
                  style={{
                    backgroundColor: activePalette.mediaAccentBg,
                    color: activePalette.mediaAccentText,
                  }}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-md"
                >
                  {activeMedia.albumArtUrl ? (
                    <img
                      src={activeMedia.albumArtUrl}
                      alt={activeMedia.trackTitle}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : isCastVideoOrTvSession && activeMedia.mediaType === 'video' ? (
                    <Tv className="w-5 h-5" />
                  ) : (
                    <Music className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        activeMedia.isPlaying
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-black truncate leading-tight">
                      {activeMedia.trackTitle}
                    </span>
                  </div>
                  <div
                    style={{ color: activePalette.mediaCardSub }}
                    className="text-[10px] sm:text-xs font-bold truncate mt-0.5 opacity-90"
                  >
                    {!activeMedia.isPlaying ? 'Pausad · ' : ''}
                    {activeMedia.deviceName
                      ? `${activeMedia.deviceName}${
                          activeMedia.appName &&
                          activeMedia.appName !== activeMedia.trackTitle
                            ? ` · ${activeMedia.appName}`
                            : ''
                        }`
                      : activeMedia.artistName || activeSpeakerSummary}
                  </div>
                </div>
              </div>

              {/* 2. Center: Strictly Bounded Scrubber + Timestamps (Never overflows into buttons) */}
              <div className="hidden md:flex flex-1 min-w-[150px] items-center gap-2.5 px-2 overflow-hidden">
                <span className="text-[11px] font-black tabular-nums opacity-90 shrink-0 min-w-[32px] text-right">
                  {formatDurationShort(activeMedia.progressMs || 0)}
                </span>
                <div className="flex-1 min-w-[70px] px-1 overflow-hidden">
                  <TouchSafeHorizontalSlider
                    value={Math.round(progressRatio * 100)}
                    min={0}
                    max={100}
                    fillColor={activePalette.mediaAccentBg}
                    trackColor="rgba(0,0,0,0.22)"
                    thumbColor={activePalette.mediaAccentBg}
                    heightClass="h-7"
                    onChange={(pct) => handleSeekToRatio(pct / 100)}
                  />
                </div>
                <span className="text-[11px] font-black tabular-nums opacity-90 shrink-0 min-w-[38px]">
                  {activeMedia.durationMs && activeMedia.durationMs > 0
                    ? formatDurationShort(activeMedia.durationMs)
                    : activeMedia.isPlaying
                    ? 'Live'
                    : 'Pausad'}
                </span>
              </div>

              {/* 3. Right: Separated Transport Controls + Output Switcher */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 md:pl-2.5 md:border-l md:border-black/15">
                <button
                  type="button"
                  onClick={handleMediaPrev}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/12 hover:bg-black/20 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                  title={
                    isCastVideoOrTvSession && activeMedia.mediaType === 'video'
                      ? 'Spola bakåt 10 sekunder'
                      : 'Föregående'
                  }
                >
                  {isCastVideoOrTvSession && activeMedia.mediaType === 'video' ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <SkipBack className="w-4 h-4 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleMediaPlayPause}
                  style={{
                    backgroundColor: activePalette.mediaAccentBg,
                    color: activePalette.mediaAccentText,
                  }}
                  className={`w-11 h-10 sm:w-12 sm:h-10 flex items-center justify-center shadow-md active:scale-90 transition-transform shrink-0 ${
                    activeMedia.isPlaying ? 'rounded-[14px]' : 'rounded-full'
                  }`}
                  title={activeMedia.isPlaying ? 'Pausa' : 'Spela'}
                >
                  {activeMedia.isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleMediaNext}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/12 hover:bg-black/20 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                  title={
                    isCastVideoOrTvSession && activeMedia.mediaType === 'video'
                      ? 'Spola framåt 10 sekunder'
                      : 'Nästa'
                  }
                >
                  {isCastVideoOrTvSession && activeMedia.mediaType === 'video' ? (
                    <RotateCw className="w-4 h-4" />
                  ) : (
                    <SkipForward className="w-4 h-4 fill-current" />
                  )}
                </button>

                {isCastVideoOrTvSession && activeMedia.mediaType === 'video' && (
                  <button
                    type="button"
                    onClick={handleStopCasting}
                    className="hidden sm:flex w-9 h-9 rounded-full bg-black/12 hover:bg-black/20 items-center justify-center active:scale-90 transition-transform shrink-0"
                    title="Sluta casta till TV"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}

                {/* Speaker / Sonos / Cast Output & Volume Button */}
                <button
                  type="button"
                  onClick={() => setShowSpeakerMenu((prev) => !prev)}
                  style={{
                    backgroundColor: activePalette.mediaAccentBg,
                    color: activePalette.mediaAccentText,
                  }}
                  className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform shrink-0"
                  title="Högtalare, Cast & Volym"
                >
                  {isCastVideoOrTvSession && activeMedia.mediaType === 'video' ? (
                    <Tv className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Speaker className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="hidden lg:inline truncate max-w-[110px]">
                    {activeSpeakerSummary}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      showSpeakerMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Bottom Corner Buttons Row (on Narrow Portrait: sits cleanly below full-width Media Bar; on Landscape/Tablet: sits Left & Right of Media Bar) */}
          <div
            className={
              isNarrowPortrait
                ? 'w-full order-2 flex items-center justify-between gap-3'
                : 'contents'
            }
          >
            {/* LEFT: Round Lamp Button */}
            <div className={isNarrowPortrait ? 'shrink-0' : 'order-1 shrink-0'}>
              <button
                type="button"
                onClick={() => {
                  setShowAppStartPageFab(false);
                  setShowGoogleHomeDrawer((prev) => !prev);
                }}
                className={`${
                  isCompactLandscape
                    ? 'w-12 h-12'
                    : 'w-13 h-13 sm:w-15 sm:h-15 lg:w-[66px] lg:h-[66px]'
                } rounded-full flex items-center justify-center transition-transform duration-200 active:scale-90 ${
                  activeRoomsCount > 0
                    ? 'bg-[#FDE047] text-[#422006] ring-4 ring-[#FEF08A]/70 shadow-[0_0_36px_rgba(250,204,21,0.9),0_0_14px_rgba(254,240,138,0.85)]'
                    : 'bg-white text-slate-900 border border-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.5)] hover:bg-slate-100'
                }`}
                title={
                  activeRoomsCount > 0
                    ? `${activeRoomsCount} rum tända (${avgBrightness}%)`
                    : 'Alla lampor släckta'
                }
                aria-label="Belysning"
              >
                <Lightbulb
                  className={`${
                    isCompactLandscape ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'
                  } transition-transform ${
                    activeRoomsCount > 0 ? 'fill-current scale-110' : 'text-slate-900'
                  }`}
                />
              </button>
            </div>

            {/* Spacer when no activeMedia on wide layout so Lamp is left and App is right */}
            {!activeMedia && !isNarrowPortrait && <div className="flex-1 order-2" />}

            {/* Subtle swipe/tap hint between buttons on narrow portrait phones */}
            {isNarrowPortrait && (
              <button
                type="button"
                onClick={advancePhotoSlide}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-extrabold text-white/80 active:scale-95 transition-all"
              >
                Nästa bildpar ↻
              </button>
            )}

            {/* RIGHT: Round App Start Page / Notification House Icon Button */}
            <div className={isNarrowPortrait ? 'shrink-0' : 'order-3 shrink-0'}>
              <button
                type="button"
                onClick={() => {
                  setShowGoogleHomeDrawer(false);
                  setShowSpeakerMenu(false);

                  if (hasNewHouseNotification) {
                    // 1. Capture the notifications to display in the popup box
                    const toShow =
                      unacknowledgedHouseNotifs.length > 0
                        ? unacknowledgedHouseNotifs
                        : notifications;
                    setHousePopupNotifs(toShow);

                    // 2. Immediately mark all current notifications as acknowledged on the House icon
                    // so the House icon returns to its original monochrome state right away!
                    const nextAck = Array.from(
                      new Set([
                        ...acknowledgedHouseNotifIds,
                        ...notifications.map((n) => n.id),
                      ])
                    );
                    setAcknowledgedHouseNotifIds(nextAck);
                    try {
                      localStorage.setItem(
                        HUB_HOUSE_SEEN_NOTIFS_KEY,
                        JSON.stringify(nextAck)
                      );
                    } catch {
                      // Ignore
                    }

                    // 3. Open the Notification Popup Box
                    setShowAppStartPageFab(false);
                    setShowHouseNotifModal(true);
                    return;
                  }

                  setShowHouseNotifModal(false);
                  setShowAppStartPageFab((prev) => !prev);
                }}
                className={`relative ${
                  isCompactLandscape
                    ? 'w-12 h-12'
                    : 'w-13 h-13 sm:w-15 sm:h-15 lg:w-[66px] lg:h-[66px]'
                } rounded-full flex items-center justify-center transition-transform duration-200 active:scale-90 ${
                  hasNewHouseNotification
                    ? 'bg-[#FFFDF9] text-slate-900 ring-4 ring-rose-400/75 shadow-[0_0_32px_rgba(244,63,94,0.65),0_10px_28px_rgba(0,0,0,0.5)]'
                    : 'bg-white text-slate-900 border border-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.5)] hover:bg-slate-100'
                } ${showAppStartPageFab || showHouseNotifModal ? 'ring-4 ring-white/60 scale-105' : ''}`}
                title={
                  hasNewHouseNotification
                    ? `${unacknowledgedHouseNotifs.length} ny notis — tryck för att visa`
                    : 'Visa appens startsida'
                }
                aria-label="Visa appens startsida"
              >
                {/* Red Notification Badge Symbol when a new notification has arrived */}
                {hasNewHouseNotification && (
                  <span className="absolute -top-1 -right-1 z-20 min-w-[22px] h-[22px] px-1 rounded-full bg-rose-600 text-white border-2 border-white shadow-[0_4px_12px_rgba(225,29,72,0.85)] flex items-center justify-center text-[11px] font-black animate-bounce">
                    {unacknowledgedHouseNotifs.length > 1
                      ? unacknowledgedHouseNotifs.length
                      : '!'}
                  </span>
                )}

                <svg
                  viewBox="0 0 512 512"
                  className={`${
                    isCompactLandscape ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9'
                  } text-slate-900`}
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g transform="translate(256, 256) scale(0.84) translate(-256, -252)">
                    <path
                      d="M106 226 L235 106 C247 95 265 95 277 106 L406 226"
                      stroke={hasNewHouseNotification ? '#183D2C' : 'currentColor'}
                      strokeWidth="38"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="256"
                      cy="178"
                      r="22"
                      fill={hasNewHouseNotification ? '#D97706' : 'currentColor'}
                    />
                    <circle cx="256" cy="178" r="10" fill="#FFFFFF" />
                    <rect
                      x="112"
                      y="244"
                      width="132"
                      height="168"
                      rx="34"
                      fill={hasNewHouseNotification ? '#2563EB' : 'currentColor'}
                    />
                    <rect x="136" y="270" width="84" height="18" rx="9" fill="#FFFFFF" />
                    <circle cx="150" cy="322" r="11" fill="#FFFFFF" />
                    <circle cx="178" cy="322" r="11" fill="#FFFFFF" />
                    <circle cx="206" cy="322" r="11" fill="#FFFFFF" />
                    <circle cx="150" cy="356" r="11" fill="#FFFFFF" />
                    <circle cx="178" cy="356" r="11" fill="#FFFFFF" />
                    <circle cx="206" cy="356" r="11" fill="#FFFFFF" />
                    <rect
                      x="264"
                      y="244"
                      width="136"
                      height="76"
                      rx="30"
                      fill={hasNewHouseNotification ? '#EA580C' : 'currentColor'}
                    />
                    <circle cx="300" cy="282" r="12" fill="#FFFFFF" />
                    <rect x="322" y="274" width="54" height="16" rx="8" fill="#FFFFFF" />
                    <rect
                      x="264"
                      y="336"
                      width="136"
                      height="76"
                      rx="30"
                      fill={hasNewHouseNotification ? '#10B981' : 'currentColor'}
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
          </div>
        </div>
      </footer>

      {/* =====================================================================
          4. LAMP DRAWER POPOVER (Opens when pressing the bottom-left Lamp button)
             Shows ONLY Favorite Lamps sorted by their respective rooms, with
             collapsible rooms and quick presets: Tänd 80%, 50%, 30% & Släck.
         ===================================================================== */}
      {showGoogleHomeDrawer && (
        <div
          onClick={() => setShowGoogleHomeDrawer(false)}
          className="fixed inset-0 z-[115] bg-black/65 flex items-end justify-start p-3 sm:p-6 pb-[max(4.75rem,calc(env(safe-area-inset-bottom,0px)+4.25rem))]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ transform: 'translateZ(0)', contain: 'content' }}
            className="w-full max-w-[470px] max-h-[78vh] overflow-y-auto overscroll-contain rounded-[34px] sm:rounded-[42px] bg-[#1C1429] border-2 border-white/20 p-4 sm:p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.85)] space-y-4 origin-bottom-left"
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
                  <h3 className="text-lg sm:text-xl font-black">Favoritlampor</h3>
                  <p className="text-xs text-white/75 font-bold">
                    {activeRoomsCount > 0
                      ? `${activeRoomsCount} rum tända (${avgBrightness}%) · Tryck på pilen för att fälla ihop rum`
                      : 'Alla favoritlampor släckta · Svep eller välj 80%, 50%, 30%'}
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

            {/* Quick Presets for Favorite Lamps ONLY: Tänd 80%, 50%, 30% + Släck */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSetFavoriteLightsBrightness(80)}
                className="py-2.5 px-2 rounded-2xl bg-[#FDE047] text-[#422006] text-xs font-black shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                <span>Tänd 80%</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetFavoriteLightsBrightness(50)}
                className="py-2.5 px-2 rounded-2xl bg-[#FEF08A]/90 text-[#422006] text-xs font-black shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                <span>Tänd 50%</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetFavoriteLightsBrightness(30)}
                className="py-2.5 px-2 rounded-2xl bg-amber-200/20 hover:bg-amber-200/30 border border-amber-200/30 text-amber-100 text-xs font-black active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                <Moon className="w-3.5 h-3.5 shrink-0" />
                <span>Tänd 30%</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetFavoriteLightsBrightness(0)}
                className="py-2.5 px-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-extrabold text-white/90 active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                <LightbulbOff className="w-3.5 h-3.5 shrink-0" />
                <span>Släck</span>
              </button>
            </div>

            {/* Favorite Lamps Grouped & Sorted by Room (Each Room is Collapsible) */}
            {favoriteHueRooms.length === 0 ? (
              <div className="rounded-[26px] bg-white/5 border border-white/10 p-5 text-center space-y-2.5">
                <p className="text-xs font-bold text-white/80">
                  Inga favoritlampor är valda just nu.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleHomeDrawer(false);
                    setShowWidgetCustomizer(true);
                  }}
                  className="px-4 py-2 rounded-full bg-[#FDE047] text-[#422006] text-xs font-black"
                >
                  Välj favoritlampor i inställningar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteHueRooms.map((room) => {
                  const isCollapsed = Boolean(collapsedRoomIds[room.id]);
                  return (
                    <div key={room.id} className="space-y-1.5">
                      <GoogleHomeTouchSlider
                        title={room.name}
                        subtitle={`${room.lights?.length || 1} favorit${
                          (room.lights?.length || 1) === 1 ? 'lampa' : 'lampor'
                        } · ${isCollapsed ? 'Ihopfällt rum' : 'Svep för ljusstyrka'}`}
                        brightness={
                          room.brightness ??
                          Math.round(((room.bri || 200) / 254) * 100)
                        }
                        isOn={Boolean(room.anyOn ?? room.on)}
                        accentFillColor="#FDE68A"
                        trackBgColor="#2D2240"
                        activeTextColor="#422006"
                        inactiveTextColor="#F8FAFC"
                        onChangeBrightness={(val) =>
                          handleRoomBrightnessChange(room, val)
                        }
                        onToggle={() => handleToggleRoomOnOff(room)}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => toggleRoomCollapsed(room.id)}
                      />

                      {/* Collapsible list of individual favorite lights inside the room */}
                      {!isCollapsed &&
                        Array.isArray(room.lights) &&
                        room.lights.length > 0 && (
                          <div className="pl-3 pr-1 space-y-1.5">
                            {room.lights.map((light, lightIdx) => {
                              const lightId = String(
                                light.id || `${room.id}-l-${lightIdx}`
                              );
                              const lightName = String(
                                light.name || `Lampa ${lightIdx + 1}`
                              );
                              const lightOn = Boolean(light.on);
                              const lightPct = lightOn
                                ? light.brightness ??
                                  Math.max(
                                    5,
                                    Math.round(((light.bri || 200) / 254) * 100)
                                  )
                                : 0;
                              return (
                                <div
                                  key={`${room.id}-${lightId}`}
                                  className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/10"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleIndividualLightChange(
                                        room,
                                        lightId,
                                        !lightOn,
                                        !lightOn ? Math.max(25, lightPct || 80) : 0
                                      )
                                    }
                                    className="flex items-center gap-2 min-w-0 text-left flex-1"
                                  >
                                    <span
                                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                        lightOn
                                          ? 'bg-[#FDE047] text-[#422006]'
                                          : 'bg-white/10 text-white/60'
                                      }`}
                                    >
                                      <Lightbulb className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="text-xs font-extrabold truncate text-white/95">
                                      {lightName}
                                    </span>
                                  </button>
                                  <div className="w-28 sm:w-32 shrink-0">
                                    <TouchSafeHorizontalSlider
                                      value={lightPct}
                                      min={0}
                                      max={100}
                                      trackColor="rgba(255,255,255,0.14)"
                                      fillColor="#FDE047"
                                      thumbColor="#FFFFFF"
                                      heightClass="h-6"
                                      onChange={(val) =>
                                        handleIndividualLightChange(
                                          room,
                                          lightId,
                                          val > 0,
                                          val
                                        )
                                      }
                                    />
                                  </div>
                                  <span className="text-[11px] font-black text-white/80 w-9 text-right shrink-0">
                                    {lightOn ? `${lightPct}%` : 'Av'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick shortcut to manage Favorite Lamps in Settings */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleHomeDrawer(false);
                  setShowWidgetCustomizer(true);
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-black flex items-center gap-1.5 text-white/90"
              >
                <Star className="w-3.5 h-3.5 text-amber-300" />
                <span>Välj favoritlampor i inställningar</span>
              </button>

              <button
                type="button"
                onClick={() => openNativeGoogleHomeApp()}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-black flex items-center gap-1.5 text-white/90"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Home</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4B. HOUSE NOTIFICATION POPUP BOX (Öppnas när man trycker på det färgade huset)
              Visar notisen med valen "Ta bort" eller "Låt vara kvar".
              Husikonen har redan återgått till original så den kan tändas igen vid nästa nya notis!
         ===================================================================== */}
      {showHouseNotifModal && (
        <div
          onClick={() => setShowHouseNotifModal(false)}
          className="fixed inset-0 z-[120] bg-black/65 flex items-end justify-end p-3 sm:p-6 pb-[max(4.75rem,calc(env(safe-area-inset-bottom,0px)+4.25rem))]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ transform: 'translateZ(0)', contain: 'content' }}
            className="w-full max-w-[440px] max-h-[75vh] overflow-y-auto overscroll-contain rounded-[32px] sm:rounded-[38px] bg-[#1A1628] border-2 border-white/20 p-4 sm:p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.85)] space-y-4 origin-bottom-right"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <M3ExpressiveIconBadge
                  bgColor="rgba(244, 63, 94, 0.22)"
                  textColor="#FDA4AF"
                  size="md"
                >
                  <Bell className="w-5 h-5" />
                </M3ExpressiveIconBadge>
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    Ny notis i Hem
                  </h3>
                  <p className="text-[11px] text-white/70 font-bold">
                    Välj om du vill ta bort notisen eller låta den vara kvar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHouseNotifModal(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {(housePopupNotifs.length > 0 ? housePopupNotifs : notifications).map(
                (notif) => (
                  <div
                    key={notif.id}
                    className="rounded-[24px] bg-white/8 border border-white/15 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-black uppercase tracking-wider text-rose-300">
                          {notif.title || 'Hem'}
                        </div>
                        <div className="text-sm sm:text-base font-black text-white mt-0.5 leading-snug">
                          {notif.message}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-white/60 shrink-0">
                        {notif.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onDismissNotification?.(notif.id);
                          setHousePopupNotifs((prev) => {
                            const remaining = prev.filter((n) => n.id !== notif.id);
                            if (remaining.length === 0) {
                              setShowHouseNotifModal(false);
                            }
                            return remaining;
                          });
                        }}
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-rose-500/25 hover:bg-rose-500/35 border border-rose-400/30 text-rose-100 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Ta bort</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHousePopupNotifs((prev) => {
                            const remaining = prev.filter((n) => n.id !== notif.id);
                            if (remaining.length === 0) {
                              setShowHouseNotifModal(false);
                            }
                            return remaining;
                          });
                        }}
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Låt vara kvar</span>
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowHouseNotifModal(false);
                  setShowAppStartPageFab(true);
                }}
                className="w-full py-2.5 px-4 rounded-full bg-white/12 hover:bg-white/20 text-xs font-black text-white flex items-center justify-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Öppna startsidan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. APP START PAGE WIDGETS DRAWER (Opens when pressing bottom-right App button)
             No backdrop-blur so scrolling is 60fps smooth!
         ===================================================================== */}
      {showAppStartPageFab && (
        <div
          onClick={() => setShowAppStartPageFab(false)}
          className="fixed inset-0 z-[115] bg-black/65 flex items-end justify-end p-3 sm:p-6 pb-[max(4.75rem,calc(env(safe-area-inset-bottom,0px)+4.25rem))]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ transform: 'translateZ(0)', contain: 'content' }}
            className="w-full sm:w-[600px] lg:w-[760px] max-h-[78vh] overflow-y-auto overscroll-contain rounded-[34px] sm:rounded-[44px] bg-[#F5FAF6] text-[#141E18] border-2 border-white/80 p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85)] origin-bottom-right"
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
        </div>
      )}

      {/* =====================================================================
          6. ALLA INSTÄLLNINGAR MODAL (Öppnas från runda knappen längst upp till vänster)
             Uses Material 3 Expressive icon badges everywhere and solid hardware
             surfaces (no backdrop-blur) for zero lag!
         ===================================================================== */}
      {showWidgetCustomizer && (
        <div
          onClick={() => setShowWidgetCustomizer(false)}
          className="fixed inset-0 z-[130] bg-black/80 flex items-center justify-center p-3 sm:p-6 pt-[max(3rem,calc(env(safe-area-inset-top,0px)+1.5rem),calc(var(--android-status-bar-height,36px)+1.25rem))]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ transform: 'translateZ(0)', contain: 'content' }}
            className="w-full max-w-2xl rounded-[40px] sm:rounded-[44px] bg-[#181224] border-2 border-white/15 p-4 sm:p-7 text-white shadow-2xl max-h-[86vh] overflow-y-auto overscroll-contain space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <M3ExpressiveIconBadge
                  bgColor={activePalette.pillBg}
                  textColor={activePalette.pillText}
                  size="md"
                >
                  <Settings className="w-5 h-5" />
                </M3ExpressiveIconBadge>
                <div>
                  <h3 className="text-lg sm:text-xl font-black">
                    Inställningar för skärmsläckare
                  </h3>
                  <p className="text-xs text-white/75 font-bold">
                    Bilder, favoritlampor, högtalare, teman &amp; nattdimmer
                  </p>
                </div>
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

            {/* 1. VÄLJ ALBUM, BILDORDNING, GOOGLE FOTO & VISNINGSTID FÖR HELSKÄRMSBILDER */}
            <div className="rounded-[28px] bg-white/8 border border-white/10 p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <M3ExpressiveIconBadge
                    bgColor={activePalette.pillBg}
                    textColor={activePalette.pillText}
                    size="sm"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </M3ExpressiveIconBadge>
                  <div className="text-xs font-black uppercase tracking-wider text-purple-200">
                    Helskärmsbilder i Par (Google TV &amp; Google Foto)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={advancePhotoSlide}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-extrabold text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Nästa bildpar</span>
                </button>
              </div>

              {/* Välj Google TV-bildlayout (Parvy / Polaroid / Helskärm i Par) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <M3ExpressiveIconBadge size="xs" shape="arch">
                    <Sparkles className="w-3.5 h-3.5" />
                  </M3ExpressiveIconBadge>
                  <span className="text-xs font-extrabold text-white/90">
                    Välj bildlayout &amp; övergångar:
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PHOTO_LAYOUT_OPTIONS.map((opt) => {
                    const isSelected = photoLayoutStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPhotoLayoutStyle(opt.id);
                          localStorage.setItem(HUB_PHOTO_LAYOUT_KEY, opt.id);
                          setSlideTransitionCounter((c) => c + 1);
                        }}
                        style={
                          isSelected
                            ? {
                                backgroundColor: activePalette.pillBg,
                                color: activePalette.pillText,
                              }
                            : undefined
                        }
                        className={`p-3 rounded-2xl text-left transition-all border flex items-start gap-2.5 ${
                          isSelected
                            ? 'shadow-md scale-[1.01] border-white/40'
                            : 'bg-black/40 text-white/85 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <M3ExpressiveIconBadge
                          size="xs"
                          bgColor={
                            isSelected
                              ? 'rgba(0,0,0,0.16)'
                              : 'rgba(255,255,255,0.1)'
                          }
                          textColor={isSelected ? activePalette.pillText : '#E9D5FF'}
                        >
                          {opt.id === 'google-tv-auto' ? (
                            <Sparkles className="w-3.5 h-3.5" />
                          ) : opt.id === 'google-tv-split' ? (
                            <LayoutGrid className="w-3.5 h-3.5" />
                          ) : opt.id === 'google-tv-polaroid' ? (
                            <Camera className="w-3.5 h-3.5" />
                          ) : opt.id === 'pair-fullscreen' ? (
                            <Maximize2 className="w-3.5 h-3.5" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5" />
                          )}
                        </M3ExpressiveIconBadge>
                        <div className="min-w-0">
                          <div className="text-xs font-black">{opt.label}</div>
                          <div
                            className={`text-[11px] font-bold mt-0.5 leading-snug ${
                              isSelected ? 'opacity-90' : 'text-white/60'
                            }`}
                          >
                            {opt.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Välj Bildordning: I ordning eller Blanda */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <M3ExpressiveIconBadge size="xs" shape="pill">
                    <Shuffle className="w-3.5 h-3.5" />
                  </M3ExpressiveIconBadge>
                  <span className="text-xs font-extrabold text-white/90">
                    Bildordning (visas med fotodatum under bilderna):
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoOrderMode('sequential');
                      setPhotoSlideIdx(0);
                      localStorage.setItem(HUB_PHOTO_ORDER_KEY, 'sequential');
                    }}
                    style={
                      photoOrderMode === 'sequential'
                        ? {
                            backgroundColor: activePalette.pillBg,
                            color: activePalette.pillText,
                          }
                        : undefined
                    }
                    className={`py-2.5 px-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 border ${
                      photoOrderMode === 'sequential'
                        ? 'shadow-md border-white/40'
                        : 'bg-black/40 text-white/80 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>I ordning</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhotoOrderMode('shuffle');
                      setShuffleSeed(Date.now());
                      setPhotoSlideIdx(0);
                      localStorage.setItem(HUB_PHOTO_ORDER_KEY, 'shuffle');
                    }}
                    style={
                      photoOrderMode === 'shuffle'
                        ? {
                            backgroundColor: activePalette.pillBg,
                            color: activePalette.pillText,
                          }
                        : undefined
                    }
                    className={`py-2.5 px-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 border ${
                      photoOrderMode === 'shuffle'
                        ? 'shadow-md border-white/40'
                        : 'bg-black/40 text-white/80 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <Shuffle className="w-4 h-4 shrink-0" />
                    <span>Blanda bilder</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <M3ExpressiveIconBadge size="xs">
                    <FolderHeart className="w-3.5 h-3.5" />
                  </M3ExpressiveIconBadge>
                  <span className="text-xs font-extrabold text-white/90">
                    Välj bildkälla / fotoalbum:
                  </span>
                </div>
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
                    <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>Alla bilder</span>
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
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      <span>Google Foto</span>
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
                        <FolderHeart className="w-3.5 h-3.5 shrink-0" />
                        <span>{albDisplayName}</span>
                        <span className="opacity-75">({albCount})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GOOGLE FOTO-INTEGRERING */}
              <div className="rounded-2xl bg-black/35 border border-white/10 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <M3ExpressiveIconBadge size="sm" shape="arch">
                      <Camera className="w-4 h-4" />
                    </M3ExpressiveIconBadge>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>Google Foto-integrering</span>
                        {validGooglePhotos.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                            {validGooglePhotos.length} bilder synkade
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/70 font-bold mt-0.5">
                        {googlePhotosAccountLabel
                          ? `Ansluten: ${googlePhotosAccountLabel}`
                          : 'Logga in med Google Foto eller klistra in en delad albumlänk'}
                      </p>
                    </div>
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
                  <div className="flex items-center gap-2">
                    <M3ExpressiveIconBadge size="xs" shape="pill">
                      <Clock className="w-3.5 h-3.5" />
                    </M3ExpressiveIconBadge>
                    <span className="text-xs font-extrabold text-white/90">
                      Hur länge ska varje bild visas?
                    </span>
                  </div>
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

            {/* 2. SEKTION FÖR LAMPOR & FAVORITLAMPOR (Visas i lampmenyn på skärmsläckaren) */}
            <div className="rounded-[28px] bg-white/8 border border-white/10 p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <M3ExpressiveIconBadge
                    bgColor="#FDE047"
                    textColor="#422006"
                    size="sm"
                  >
                    <Lightbulb className="w-4 h-4" />
                  </M3ExpressiveIconBadge>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-amber-200">
                      Lampor &amp; Favoritlampor
                    </div>
                    <p className="text-[11px] text-white/70 font-bold mt-0.5">
                      Välj vilka lampor som ska visas och tändas (80%, 50%, 30%) i lampmenyn på skärmsläckaren
                    </p>
                  </div>
                </div>

                {(hueConfig.connected || (!hueConfig.useDemoMode && hueConfig.username)) && (
                  <button
                    type="button"
                    onClick={() => syncLiveHueBridgeRooms(hueConfig, true)}
                    className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-black flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Synka Hue</span>
                  </button>
                )}
              </div>

              {/* Hue Bridge Parkoppling i Inställningar */}
              <div className="rounded-2xl bg-black/35 border border-white/10 p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={hueConfig.bridgeIp || ''}
                    onChange={(e) =>
                      setHueConfig((prev) => ({ ...prev, bridgeIp: e.target.value }))
                    }
                    placeholder="Hue Bridge IP (t.ex. 192.168.68.50)"
                    className="flex-1 min-w-[140px] px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white placeholder:text-white/45 focus:outline-none focus:border-amber-300"
                  />
                  <button
                    type="button"
                    disabled={isPairingHue}
                    onClick={async () => {
                      setIsPairingHue(true);
                      setHueStatusMsg('Söker efter Philips Hue Bridge i ditt Wi-Fi...');
                      const discoveredIp = await discoverHueBridgeIp();
                      const ip =
                        (hueConfig.bridgeIp && hueConfig.bridgeIp.trim()) ||
                        discoveredIp ||
                        '192.168.68.50';
                      const res = await pairHueBridge(ip);
                      if (res.ok && res.username) {
                        const nextCfg: HueConfig = {
                          ...hueConfig,
                          bridgeIp: ip,
                          username: res.username,
                          connected: true,
                          useDemoMode: false,
                          provider: 'hue-bridge',
                        };
                        setHueConfig(nextCfg);
                        saveHueConfig(nextCfg);
                        const fetched = await fetchHueRooms(nextCfg);
                        if (Array.isArray(fetched.rooms) && fetched.rooms.length > 0) {
                          setHueRooms(fetched.rooms);
                          const totalLamps = fetched.rooms.reduce(
                            (acc, r) => acc + (r.lights?.length || 0),
                            0
                          );
                          setHueStatusMsg(
                            `Ansluten till Hue Bridge (${ip}) — hittade ${fetched.rooms.length} rum och ${totalLamps} lampor!`
                          );
                        } else {
                          setHueStatusMsg(`Ansluten till Hue Bridge (${ip})!`);
                        }
                      } else {
                        setHueStatusMsg(
                          res.error ||
                            'Tryck på den stora runda knappen mitt på din Hue Bridge först och försök igen.'
                        );
                      }
                      setIsPairingHue(false);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#FDE047] text-[#422006] hover:bg-[#FEF08A] text-xs font-black shadow-xs flex items-center gap-1.5"
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    <span>
                      {hueConfig.connected || (!hueConfig.useDemoMode && hueConfig.username)
                        ? 'Koppla om Hue Bridge'
                        : 'Parkoppla Hue Bridge'}
                    </span>
                  </button>
                </div>
                {hueStatusMsg && (
                  <div className="text-xs text-amber-200 font-bold leading-snug">
                    {hueStatusMsg}
                  </div>
                )}
              </div>

              {/* Välj favoritlampor per rum */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {hueRooms.map((room) => {
                  const roomLights = room.lights || [];
                  const selectedInRoomCount = roomLights.filter((l, idx) =>
                    isLightMarkedFavorite(
                      room.id,
                      String(l.id || `${room.id}-l-${idx}`)
                    )
                  ).length;
                  const allInRoomFav =
                    roomLights.length > 0 && selectedInRoomCount === roomLights.length;

                  return (
                    <div
                      key={`settings-fav-room-${room.id}`}
                      className="rounded-2xl bg-black/35 border border-white/10 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <M3ExpressiveIconBadge
                            size="xs"
                            bgColor={
                              selectedInRoomCount > 0
                                ? 'rgba(253, 224, 71, 0.22)'
                                : 'rgba(255, 255, 255, 0.08)'
                            }
                            textColor={selectedInRoomCount > 0 ? '#FDE047' : '#94A3B8'}
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                          </M3ExpressiveIconBadge>
                          <span className="text-xs font-black text-white truncate">
                            {room.name}
                          </span>
                          <span className="text-[11px] font-bold text-white/60">
                            ({selectedInRoomCount}/{roomLights.length} valda)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleAllRoomFavorites(room)}
                          className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-extrabold text-white/90 shrink-0"
                        >
                          {allInRoomFav ? 'Avmarkera rum' : 'Välj alla i rummet'}
                        </button>
                      </div>

                      {roomLights.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {roomLights.map((light, lightIdx) => {
                            const lid = String(light.id || `${room.id}-l-${lightIdx}`);
                            const lName = String(light.name || `Lampa ${lightIdx + 1}`);
                            const isFav = isLightMarkedFavorite(room.id, lid);
                            return (
                              <button
                                key={`fav-pick-${room.id}-${lid}`}
                                type="button"
                                onClick={() => toggleFavoriteLight(room.id, lid)}
                                className={`px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between gap-2 border transition-all ${
                                  isFav
                                    ? 'bg-[#FDE047]/20 border-[#FDE047]/60 text-white'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0 truncate">
                                  <Star
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isFav
                                        ? 'text-[#FDE047] fill-[#FDE047]'
                                        : 'text-white/40'
                                    }`}
                                  />
                                  <span className="truncate">{lName}</span>
                                </span>
                                <span
                                  className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                    isFav
                                      ? 'bg-[#FDE047] text-[#422006]'
                                      : 'border border-white/30'
                                  }`}
                                >
                                  {isFav ? '✓' : ''}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. NÄTVERKSSÖKNING FÖR SONOS & GOOGLE CAST-HÖGTALARE */}
            <div className="rounded-[28px] bg-white/8 border border-white/10 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <M3ExpressiveIconBadge
                    bgColor={activePalette.pillBg}
                    textColor={activePalette.pillText}
                    size="sm"
                  >
                    <Speaker className="w-4 h-4" />
                  </M3ExpressiveIconBadge>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-purple-200">
                      Högtalare, Sonos &amp; Cast i nätverket
                    </div>
                    <p className="text-[11px] text-white/70 font-bold mt-0.5">
                      Mediakontroller visas i mitten längst ner när något spelas eller castas
                    </p>
                  </div>
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

            {/* 4. Material 3 Expressive Color Palette Selector (Nya temanamn) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <M3ExpressiveIconBadge size="xs">
                  <Palette className="w-3.5 h-3.5" />
                </M3ExpressiveIconBadge>
                <div className="text-xs font-black uppercase tracking-wider text-purple-200">
                  Färgtema för skärmsläckare &amp; menyer
                </div>
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

            {/* 5. Dimmer & Auto-Start Timer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <div className="flex items-center gap-2 text-xs font-black mb-1.5">
                  <M3ExpressiveIconBadge size="xs">
                    <Moon className="w-3.5 h-3.5" />
                  </M3ExpressiveIconBadge>
                  <span>Skärmdimmer (Nattdämpning: {dimmerPercent}%)</span>
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
                <div className="flex items-center gap-2 text-xs font-black mb-1.5">
                  <M3ExpressiveIconBadge size="xs">
                    <Clock className="w-3.5 h-3.5" />
                  </M3ExpressiveIconBadge>
                  <span>Starta skärmsläckare automatiskt</span>
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
    </div>,
    document.body
  );
};

