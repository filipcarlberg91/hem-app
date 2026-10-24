import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  CheckSquare,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  ExternalLink,
  Grid,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  LightbulbOff,
  ListMusic,
  Maximize2,
  Moon,
  Music,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  ShoppingCart,
  SkipForward,
  Sliders,
  Sun,
  Timer,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';
import {
  CalendarEvent,
  EventCategory,
  GothenburgWeather,
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
import {
  discoverHueBridgeIp,
  ExternalAppShortcut,
  fetchHueRooms,
  HueConfig,
  HueRoom,
  launchExternalAppShortcut,
  loadAppShortcuts,
  loadHueConfig,
  pairHueBridge,
  saveAppShortcuts,
  saveDemoHueRooms,
  saveHueConfig,
  setNativeKeepScreenOn,
  updateAllHueRoomsAction,
  updateHueRoomAction,
} from '../utils/philipsHueClient';
import {
  fetchSpotifyConnectNowPlaying,
  fetchUserSpotifyPlaylists,
  loadSelectedSpotifyPlaylistId,
  loadSpotifyAccessToken,
  loadSpotifyPlaylists,
  parseSpotifyInputToPlaylistItem,
  saveSelectedSpotifyPlaylistId,
  saveSpotifyAccessToken,
  saveSpotifyPlaylists,
  sendNativeAndroidMediaControl,
  sendSpotifyConnectCommand,
  SpotifyNowPlaying,
  SpotifyPlaylistItem,
} from '../utils/spotifyClient';

export type NestHubCardId =
  | 'spotify'
  | 'hue'
  | 'calendar'
  | 'shopping'
  | 'photos'
  | 'todo'
  | 'kitchen';

interface CardConfigItem {
  id: NestHubCardId;
  enabled: boolean;
}

const NESTHUB_CARDS_CONFIG_KEY = 'vn_nesthub_cards_config_v1';
const NESTHUB_PHOTO_ALBUM_KEY = 'vn_nesthub_photo_album_v1';
const SCREENSAVER_THEME_KEY = 'vn_screensaver_theme_v1';
const SCREENSAVER_DIMMER_KEY = 'vn_screensaver_dimmer_v1';

const DEFAULT_CARDS_CONFIG: CardConfigItem[] = [
  { id: 'spotify', enabled: true },
  { id: 'hue', enabled: true },
  { id: 'calendar', enabled: true },
  { id: 'shopping', enabled: true },
  { id: 'photos', enabled: false },
  { id: 'todo', enabled: false },
  { id: 'kitchen', enabled: false },
];

const CARD_METADATA: Record<
  NestHubCardId,
  { title: string; subtitle: string; badgeColor: string }
> = {
  spotify: {
    title: 'Spotify',
    subtitle: 'Spellistor & enkla mediakontroller',
    badgeColor: '#1ED760',
  },
  hue: {
    title: 'Belysning · Philips Hue',
    subtitle: 'Rumsreglage där du drar på rutan för att dimra',
    badgeColor: '#FACC15',
  },
  calendar: {
    title: 'Kalender · Idag & Imorgon',
    subtitle: 'Kommande händelser i stor, ren text',
    badgeColor: '#A6F2C6',
  },
  shopping: {
    title: 'Inköpslista',
    subtitle: 'Avskalad lista med ett-trycks avbockning',
    badgeColor: '#A6F2C6',
  },
  photos: {
    title: 'Bilder & Fotoram',
    subtitle: 'Levande bildspel från era fotoalbum i appen',
    badgeColor: '#60A5FA',
  },
  todo: {
    title: 'Att göra & Notiser',
    subtitle: 'Kommande uppgifter och fästa anteckningar',
    badgeColor: '#FDE047',
  },
  kitchen: {
    title: 'Kök & Matsedel',
    subtitle: 'Dagens recept, steg-för-steg köksläge & timer',
    badgeColor: '#FB923C',
  },
};

const FALLBACK_AMBIENT_PHOTOS: Array<{ id: string; imageUrl: string; caption: string }> = [
  {
    id: 'fallback-1',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    caption: 'Fotoram · Lägg till egna bilder under fliken Foton i appen',
  },
  {
    id: 'fallback-2',
    imageUrl:
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=80',
    caption: 'Familjealbum · Hemma hos F',
  },
];

function loadCardsConfig(): CardConfigItem[] {
  try {
    const raw = localStorage.getItem(NESTHUB_CARDS_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const knownIds = new Set(DEFAULT_CARDS_CONFIG.map((c) => c.id));
        const valid: CardConfigItem[] = parsed.filter(
          (item: any) => item && knownIds.has(item.id)
        );
        for (const def of DEFAULT_CARDS_CONFIG) {
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
  return DEFAULT_CARDS_CONFIG;
}

function saveCardsConfig(cfg: CardConfigItem[]): void {
  try {
    localStorage.setItem(NESTHUB_CARDS_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    // Ignore
  }
}

interface ScreensaverViewProps {
  open: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  categories: EventCategory[];
  todos: TodoItem[];
  notes: NoteItem[];
  shopping: ShoppingItem[];
  recipes: RecipeItem[];
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
}

type ScreensaverThemeMode = 'dark' | 'light' | 'night-clock';

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

function getWeatherIcon(code: number, className = 'h-7 w-7') {
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

function getISOWeekNumber(date: Date): number {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function playKitchenTimerBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [587.33, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.16);
      osc.stop(ctx.currentTime + idx * 0.16 + 0.15);
    });
  } catch {
    // Ignore
  }
}

export const ScreensaverView: React.FC<ScreensaverViewProps> = ({
  open,
  onClose,
  events,
  categories,
  todos,
  notes,
  shopping,
  recipes,
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
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [weather, setWeather] = useState<GothenburgWeather>({
    temperature: 12,
    apparentTemperature: 10,
    windSpeed: 5.2,
    weatherCode: 2,
    description: 'Halvklart',
    highTemp: 14,
    lowTemp: 8,
    updatedAt: 'Nu',
  });

  // Theme mode: defaults to 'dark' (Mörkt läge) matching the Nest Hub design
  const [themeMode, setThemeMode] = useState<ScreensaverThemeMode>(() => {
    try {
      const saved = localStorage.getItem(SCREENSAVER_THEME_KEY) as ScreensaverThemeMode | null;
      if (saved === 'dark' || saved === 'light' || saved === 'night-clock') {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'dark';
  });

  const [dimmerPercent, setDimmerPercent] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(SCREENSAVER_DIMMER_KEY));
      if ([100, 80, 60, 40].includes(saved)) return saved;
    } catch {
      // Ignore
    }
    return 100;
  });

  const handleCycleThemeMode = () => {
    const order: ScreensaverThemeMode[] = ['dark', 'light', 'night-clock'];
    const next = order[(order.indexOf(themeMode) + 1) % order.length];
    setThemeMode(next);
    try {
      localStorage.setItem(SCREENSAVER_THEME_KEY, next);
    } catch {
      // Ignore
    }
  };

  const handleSelectThemeMode = (mode: ScreensaverThemeMode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem(SCREENSAVER_THEME_KEY, mode);
    } catch {
      // Ignore
    }
  };

  const handleCycleDimmer = () => {
    const steps = [100, 80, 60, 40];
    const nextVal = steps[(steps.indexOf(dimmerPercent) + 1) % steps.length];
    setDimmerPercent(nextVal);
    try {
      localStorage.setItem(SCREENSAVER_DIMMER_KEY, String(nextVal));
    } catch {
      // Ignore
    }
  };

  // ==========================================================================
  // CUSTOMIZABLE NEST HUB CARDS STATE ("Anpassa kort"-menyn)
  // ==========================================================================
  const [cardsConfig, setCardsConfig] = useState<CardConfigItem[]>(() =>
    loadCardsConfig()
  );
  const [customizeMenuOpen, setCustomizeMenuOpen] = useState<boolean>(false);
  const [selectedPhotoAlbumId, setSelectedPhotoAlbumId] = useState<string>(() => {
    try {
      return localStorage.getItem(NESTHUB_PHOTO_ALBUM_KEY) || 'all';
    } catch {
      return 'all';
    }
  });
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState<number>(0);

  const enabledCards = useMemo(
    () => cardsConfig.filter((c) => c.enabled).map((c) => c.id),
    [cardsConfig]
  );

  const handleToggleCardEnabled = (cardId: NestHubCardId) => {
    setCardsConfig((prev) => {
      const enabledCount = prev.filter((c) => c.enabled).length;
      const target = prev.find((c) => c.id === cardId);
      if (target?.enabled && enabledCount <= 1) {
        return prev; // Keep at least 1 card active
      }
      const next = prev.map((c) =>
        c.id === cardId ? { ...c, enabled: !c.enabled } : c
      );
      saveCardsConfig(next);
      return next;
    });
  };

  const handleMoveCardOrder = (index: number, direction: -1 | 1) => {
    setCardsConfig((prev) => {
      const nextIdx = index + direction;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(nextIdx, 0, moved);
      saveCardsConfig(copy);
      return copy;
    });
  };

  const handleSelectPhotoAlbum = (albumId: string) => {
    setSelectedPhotoAlbumId(albumId);
    setCurrentPhotoIdx(0);
    try {
      localStorage.setItem(NESTHUB_PHOTO_ALBUM_KEY, albumId);
    } catch {
      // Ignore
    }
  };

  // Filtered photos for the Photos / Fotoram card
  const displayPhotos = useMemo(() => {
    let list = photos;
    if (selectedPhotoAlbumId === 'favorites') {
      list = photos.filter((p) => p.favorite);
    } else if (selectedPhotoAlbumId !== 'all') {
      list = photos.filter((p) => p.albumId === selectedPhotoAlbumId);
    }
    if (list.length === 0 && photos.length > 0) {
      list = photos;
    }
    if (list.length > 0) {
      return list.map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        caption: p.caption || `Uppladdad av ${p.uploadedBy}`,
      }));
    }
    return FALLBACK_AMBIENT_PHOTOS;
  }, [photos, selectedPhotoAlbumId]);

  // Rotate photo slideshow every 12 seconds
  useEffect(() => {
    if (!open || displayPhotos.length <= 1) return;
    const t = setInterval(() => {
      setCurrentPhotoIdx((prev) => (prev + 1) % displayPhotos.length);
    }, 12000);
    return () => clearInterval(t);
  }, [open, displayPhotos.length]);

  // ==========================================================================
  // SPOTIFY STATE
  // ==========================================================================
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylistItem[]>(() =>
    loadSpotifyPlaylists()
  );
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(() =>
    loadSelectedSpotifyPlaylistId()
  );
  const [isSpotifyPlaying, setIsSpotifyPlaying] = useState<boolean>(false);
  const [spotifyExpandModalOpen, setSpotifyExpandModalOpen] = useState<boolean>(false);
  const [spotifySettingsOpen, setSpotifySettingsOpen] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [newPlaylistUrl, setNewPlaylistUrl] = useState<string>('');
  const [playlistAddError, setPlaylistAddError] = useState<string>('');
  const [spotifyToken, setSpotifyToken] = useState<string>(() =>
    loadSpotifyAccessToken()
  );
  const [spotifyNowPlaying, setSpotifyNowPlaying] =
    useState<SpotifyNowPlaying | null>(null);
  const [spotifySyncBusy, setSpotifySyncBusy] = useState<boolean>(false);

  const spotifyEmbedMountRef = useRef<HTMLDivElement | null>(null);
  const spotifyControllerRef = useRef<any>(null);
  const [spotifyIframeApiReady, setSpotifyIframeApiReady] = useState<boolean>(false);

  const selectedPlaylist = useMemo(() => {
    return (
      spotifyPlaylists.find((p) => p.id === selectedPlaylistId) ||
      spotifyPlaylists[0]
    );
  }, [spotifyPlaylists, selectedPlaylistId]);

  useEffect(() => {
    if (!open) return;
    const w = window as any;
    if (w.SpotifyIframeApi) {
      setSpotifyIframeApiReady(true);
      return;
    }
    const prevCallback = w.onSpotifyIframeApiReady;
    w.onSpotifyIframeApiReady = (IFrameAPI: any) => {
      w.SpotifyIframeApi = IFrameAPI;
      setSpotifyIframeApiReady(true);
      if (typeof prevCallback === 'function') prevCallback(IFrameAPI);
    };
    if (!document.getElementById('spotify-iframe-api-script')) {
      const script = document.createElement('script');
      script.id = 'spotify-iframe-api-script';
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [open]);

  useEffect(() => {
    if (
      !open ||
      !spotifyIframeApiReady ||
      !spotifyEmbedMountRef.current ||
      !selectedPlaylist
    ) {
      return;
    }
    const w = window as any;
    if (!w.SpotifyIframeApi) return;

    if (spotifyControllerRef.current) {
      try {
        spotifyControllerRef.current.loadUri(selectedPlaylist.spotifyUri);
      } catch {
        // Ignore
      }
      return;
    }

    try {
      w.SpotifyIframeApi.createController(
        spotifyEmbedMountRef.current,
        {
          uri: selectedPlaylist.spotifyUri,
          width: '100%',
          height: 80,
          theme: '0',
        },
        (EmbedController: any) => {
          spotifyControllerRef.current = EmbedController;
          EmbedController.addListener('playback_update', (e: any) => {
            if (e?.data) {
              setIsSpotifyPlaying(!e.data.isPaused);
            }
          });
        }
      );
    } catch {
      // Ignore
    }
  }, [open, spotifyIframeApiReady, selectedPlaylist]);

  useEffect(() => {
    if (!open) {
      spotifyControllerRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !spotifyToken) return;
    let active = true;
    const poll = async () => {
      const np = await fetchSpotifyConnectNowPlaying(spotifyToken);
      if (active && np) {
        setSpotifyNowPlaying(np);
        setIsSpotifyPlaying(np.isPlaying);
      }
    };
    poll();
    const timer = setInterval(poll, 6000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [open, spotifyToken]);

  const handleSelectSpotifyPlaylist = async (playlist: SpotifyPlaylistItem) => {
    setSelectedPlaylistId(playlist.id);
    saveSelectedSpotifyPlaylistId(playlist.id);

    if (spotifyControllerRef.current) {
      try {
        spotifyControllerRef.current.loadUri(playlist.spotifyUri);
        spotifyControllerRef.current.play();
        setIsSpotifyPlaying(true);
      } catch {
        // Ignore
      }
    }

    if (spotifyToken) {
      await sendSpotifyConnectCommand(
        spotifyToken,
        'play-uri',
        playlist.spotifyUri
      );
    }
  };

  const handleSpotifyTogglePlayPause = async () => {
    const nextState = !isSpotifyPlaying;
    setIsSpotifyPlaying(nextState);

    if (spotifyControllerRef.current) {
      try {
        spotifyControllerRef.current.togglePlay();
      } catch {
        // Ignore
      }
    }

    sendNativeAndroidMediaControl('play_pause');

    if (spotifyToken) {
      await sendSpotifyConnectCommand(
        spotifyToken,
        nextState ? 'play' : 'pause'
      );
    }
  };

  const handleSpotifyNextTrack = async () => {
    const sentNative = sendNativeAndroidMediaControl('next');
    if (spotifyToken) {
      await sendSpotifyConnectCommand(spotifyToken, 'next');
    } else if (!sentNative && spotifyPlaylists.length > 1) {
      const idx = spotifyPlaylists.findIndex((p) => p.id === selectedPlaylist.id);
      const nextPl = spotifyPlaylists[(idx + 1) % spotifyPlaylists.length];
      handleSelectSpotifyPlaylist(nextPl);
    }
  };

  const handleAddCustomPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    setPlaylistAddError('');
    const parsed = parseSpotifyInputToPlaylistItem(
      newPlaylistName || 'Min Spellista',
      newPlaylistUrl,
      'Egen spellista'
    );
    if (!parsed) {
      setPlaylistAddError(
        'Kunde inte tolka länken. Klistra in en Spotify-länk (t.ex. https://open.spotify.com/playlist/...).'
      );
      return;
    }
    const next = [parsed, ...spotifyPlaylists];
    setSpotifyPlaylists(next);
    saveSpotifyPlaylists(next);
    setSelectedPlaylistId(parsed.id);
    saveSelectedSpotifyPlaylistId(parsed.id);
    setNewPlaylistName('');
    setNewPlaylistUrl('');
  };

  const handleDeleteSpotifyPlaylist = (id: string) => {
    if (spotifyPlaylists.length <= 1) return;
    const next = spotifyPlaylists.filter((p) => p.id !== id);
    setSpotifyPlaylists(next);
    saveSpotifyPlaylists(next);
    if (selectedPlaylistId === id && next[0]) {
      setSelectedPlaylistId(next[0].id);
      saveSelectedSpotifyPlaylistId(next[0].id);
    }
  };

  const handleFetchPersonalPlaylistsFromToken = async () => {
    if (!spotifyToken.trim()) return;
    setSpotifySyncBusy(true);
    saveSpotifyAccessToken(spotifyToken.trim());
    const fetched = await fetchUserSpotifyPlaylists(spotifyToken.trim());
    setSpotifySyncBusy(false);
    if (fetched.length > 0) {
      const existingIds = new Set(spotifyPlaylists.map((p) => p.spotifyUri));
      const merged = [
        ...fetched.filter((f) => !existingIds.has(f.spotifyUri)),
        ...spotifyPlaylists,
      ];
      setSpotifyPlaylists(merged);
      saveSpotifyPlaylists(merged);
      setSelectedPlaylistId(merged[0].id);
      saveSelectedSpotifyPlaylistId(merged[0].id);
    }
  };

  // ==========================================================================
  // PHILIPS HUE & APP SHORTCUTS STATE
  // ==========================================================================
  const [hueConfig, setHueConfig] = useState<HueConfig>(() => loadHueConfig());
  const [hueRooms, setHueRooms] = useState<HueRoom[]>([]);
  const [hueIsLive, setHueIsLive] = useState<boolean>(false);
  const [hueSettingsOpen, setHueSettingsOpen] = useState<boolean>(false);
  const [hueBridgeIpInput, setHueBridgeIpInput] = useState<string>(() => loadHueConfig().bridgeIp);
  const [huePairingStatus, setHuePairingStatus] = useState<string>('');
  const [huePairingBusy, setHuePairingBusy] = useState<boolean>(false);
  const [newDemoRoomName, setNewDemoRoomName] = useState<string>('');

  const [appShortcuts, setAppShortcuts] = useState<ExternalAppShortcut[]>(() =>
    loadAppShortcuts()
  );
  const [appsModalOpen, setAppsModalOpen] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState<string>('');
  const [newAppUrl, setNewAppUrl] = useState<string>('');
  const [newAppCategory, setNewAppCategory] = useState<string>('Smarta hem');

  // Quick-add modals (opened only when tapping '+' so cards stay 100% clean)
  const [quickAddModal, setQuickAddModal] = useState<
    null | 'shopping' | 'calendar' | 'todo'
  >(null);
  const [newShoppingName, setNewShoppingName] = useState<string>('');
  const [newShoppingAmount, setNewShoppingAmount] = useState<string>('1');
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventDate, setNewEventDate] = useState<string>(() => getTodayDateString());
  const [newEventStart, setNewEventStart] = useState<string>('17:00');
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');

  // Recipe & Kitchen Mode state
  const [selectedRecipeIdx, setSelectedRecipeIdx] = useState<number>(0);
  const [kitchenModeOpen, setKitchenModeOpen] = useState<boolean>(false);
  const [checkedRecipeSteps, setCheckedRecipeSteps] = useState<Record<string, boolean>>({});
  const [checkedRecipeIngredients, setCheckedRecipeIngredients] = useState<
    Record<string, boolean>
  >({});

  // Kitchen Timer
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Subtle pixel shift every minute for OLED/IPS screen protection
  const [pixelShift, setPixelShift] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const refreshHueRooms = useCallback(async (cfgOverride?: HueConfig) => {
    const activeCfg = cfgOverride || hueConfig;
    const res = await fetchHueRooms(activeCfg);
    setHueRooms(res.rooms);
    setHueIsLive(res.isLive);
  }, [hueConfig]);

  useEffect(() => {
    if (!open) return;
    refreshHueRooms();
    const interval = setInterval(() => {
      refreshHueRooms();
    }, 8000);
    return () => clearInterval(interval);
  }, [open, refreshHueRooms]);

  useEffect(() => {
    if (!open) return;
    setNow(new Date());
    const interval = setInterval(() => {
      const current = new Date();
      setNow(current);
      if (current.getSeconds() === 0) {
        const offsetX = Math.floor(Math.random() * 8) - 4;
        const offsetY = Math.floor(Math.random() * 8) - 4;
        setPixelShift({ x: offsetX, y: offsetY });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setNativeKeepScreenOn(false);
      return;
    }
    setNativeKeepScreenOn(true);
    let wakeLockSentinel: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Ignore
      }
    };
    requestWakeLock();
    const handleVis = () => {
      if (document.visibilityState === 'visible' && open) {
        setNativeKeepScreenOn(true);
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => {
      setNativeKeepScreenOn(false);
      document.removeEventListener('visibilitychange', handleVis);
      if (wakeLockSentinel && typeof wakeLockSentinel.release === 'function') {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=57.7089&longitude=11.9746&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=Europe%2FStockholm'
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !data.current) return;
        const code = Number(data.current.weather_code ?? 2);
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          apparentTemperature: Math.round(data.current.apparent_temperature),
          windSpeed: Math.round(data.current.wind_speed_10m * 10) / 10,
          weatherCode: code,
          description: getSwedishWeatherDescription(code),
          highTemp: Math.round(
            data.daily?.temperature_2m_max?.[0] ?? data.current.temperature_2m + 2
          ),
          lowTemp: Math.round(
            data.daily?.temperature_2m_min?.[0] ?? data.current.temperature_2m - 3
          ),
          updatedAt: new Date().toLocaleTimeString('sv-SE', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      } catch {
        // Keep fallback weather
      }
    };
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(weatherInterval);
    };
  }, [open]);

  useEffect(() => {
    if (!timerRunning || timerSecondsLeft <= 0) return;
    const t = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          playKitchenTimerBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timerRunning, timerSecondsLeft]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (customizeMenuOpen) setCustomizeMenuOpen(false);
        else if (quickAddModal) setQuickAddModal(null);
        else if (kitchenModeOpen) setKitchenModeOpen(false);
        else if (spotifyExpandModalOpen) setSpotifyExpandModalOpen(false);
        else if (spotifySettingsOpen) setSpotifySettingsOpen(false);
        else if (hueSettingsOpen) setHueSettingsOpen(false);
        else if (appsModalOpen) setAppsModalOpen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    open,
    customizeMenuOpen,
    quickAddModal,
    kitchenModeOpen,
    spotifyExpandModalOpen,
    spotifySettingsOpen,
    hueSettingsOpen,
    appsModalOpen,
    onClose,
  ]);

  const orderedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => Number(b.favorite) - Number(a.favorite));
  }, [recipes]);

  const currentRecipe: RecipeItem | undefined =
    orderedRecipes[selectedRecipeIdx % Math.max(1, orderedRecipes.length)];

  const todayStr = getTodayDateString();
  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
  }, [events, todayStr]);

  const sortedShopping = useMemo(() => {
    return [...shopping].sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return 0;
    });
  }, [shopping]);

  const sortedTodos = useMemo(() => {
    const pWeight = { high: 0, medium: 1, low: 2 };
    return [...todos].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return pWeight[a.priority] - pWeight[b.priority];
    });
  }, [todos]);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => Number(b.favorite) - Number(a.favorite));
  }, [notes]);

  if (!open) return null;

  const isDarkDashboard = themeMode !== 'light';
  const isNightClockActive = themeMode === 'night-clock';

  const timeString = now.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const fullDateLong = now.toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const weekNumber = getISOWeekNumber(now);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const addTimerMinutes = (mins: number) => {
    setTimerSecondsLeft((prev) => prev + mins * 60);
    setTimerRunning(true);
  };

  // Philips Hue handlers
  const handleToggleHueRoom = async (room: HueRoom) => {
    const nextOn = !room.on;
    setHueRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, on: nextOn } : r))
    );
    await updateHueRoomAction(hueConfig, room, { on: nextOn });
  };

  const handleChangeHueRoomBrightness = async (room: HueRoom, pct: number) => {
    const clampedPct = Math.max(5, Math.min(100, pct));
    const bri = Math.max(1, Math.min(254, Math.round((clampedPct / 100) * 254)));
    setHueRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, on: true, bri } : r))
    );
    await updateHueRoomAction(hueConfig, room, { on: true, bri });
  };

  const handleHueScenePreset = async (preset: 'all-on' | 'all-off' | 'cozy' | 'evening') => {
    if (preset === 'all-off') {
      setHueRooms((prev) => prev.map((r) => ({ ...r, on: false })));
      await updateAllHueRoomsAction(hueConfig, { on: false });
    } else if (preset === 'all-on') {
      setHueRooms((prev) => prev.map((r) => ({ ...r, on: true, bri: 240, ct: 320 })));
      await updateAllHueRoomsAction(hueConfig, { on: true, bri: 240, ct: 320 });
    } else if (preset === 'cozy') {
      setHueRooms((prev) => prev.map((r) => ({ ...r, on: true, bri: 155, ct: 410 })));
      await updateAllHueRoomsAction(hueConfig, { on: true, bri: 155, ct: 410 });
    } else if (preset === 'evening') {
      setHueRooms((prev) => prev.map((r) => ({ ...r, on: true, bri: 65, ct: 454 })));
      await updateAllHueRoomsAction(hueConfig, { on: true, bri: 65, ct: 454 });
    }
  };

  const handleDiscoverBridge = async () => {
    setHuePairingBusy(true);
    setHuePairingStatus('Söker efter Philips Hue Bridge på ditt Wi-Fi...');
    const ip = await discoverHueBridgeIp();
    setHuePairingBusy(false);
    if (ip) {
      setHueBridgeIpInput(ip);
      setHuePairingStatus(
        `Hittade Hue Bridge på ${ip}! Tryck nu på den runda knappen på din Hue Bridge och klicka på "Parkoppla".`
      );
    } else {
      setHuePairingStatus(
        'Hittade ingen Bridge automatiskt. Skriv in din Bridges IP-adress (t.ex. 192.168.1.50) från Philips Hue-appen.'
      );
    }
  };

  const handlePairBridge = async () => {
    setHuePairingBusy(true);
    setHuePairingStatus('Försöker parkoppla med Philips Hue Bridge...');
    const res = await pairHueBridge(hueBridgeIpInput);
    setHuePairingBusy(false);
    if (res.ok && res.username) {
      const nextCfg: HueConfig = {
        bridgeIp: hueBridgeIpInput.trim(),
        username: res.username,
        useDemoMode: false,
        lastConnectedAt: new Date().toISOString(),
      };
      setHueConfig(nextCfg);
      saveHueConfig(nextCfg);
      setHuePairingStatus('Parkoppling klar! Dina rum och lampor är nu anslutna.');
      await refreshHueRooms(nextCfg);
    } else {
      setHuePairingStatus(res.error || 'Kunde inte parkoppla.');
    }
  };

  const handleAddDemoRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDemoRoomName.trim();
    if (!trimmed) return;
    const nextRooms: HueRoom[] = [
      ...hueRooms,
      {
        id: `demo-${Date.now()}`,
        name: trimmed,
        type: 'Room',
        on: true,
        bri: 180,
        ct: 370,
        lightIds: [],
        reachable: true,
      },
    ];
    setHueRooms(nextRooms);
    saveDemoHueRooms(nextRooms);
    setNewDemoRoomName('');
  };

  const handleAddCustomAppShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrim = newAppName.trim();
    const urlTrim = newAppUrl.trim();
    if (!nameTrim || !urlTrim) return;
    const normalizedUrl =
      urlTrim.includes('://') || urlTrim.startsWith('http')
        ? urlTrim
        : `https://${urlTrim}`;
    const newEntry: ExternalAppShortcut = {
      id: `app-custom-${Date.now()}`,
      name: nameTrim,
      category: newAppCategory || 'Genväg',
      deepLink: normalizedUrl,
      webUrl: normalizedUrl,
      accentColor: '#A6F2C6',
    };
    const next = [...appShortcuts, newEntry];
    setAppShortcuts(next);
    saveAppShortcuts(next);
    setNewAppName('');
    setNewAppUrl('');
  };

  const handleDeleteAppShortcut = (id: string) => {
    const next = appShortcuts.filter((a) => a.id !== id);
    setAppShortcuts(next);
    saveAppShortcuts(next);
  };

  const handleQuickAddShopping = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newShoppingName.trim();
    if (!trimmed) return;
    onAddShoppingItem({
      name: trimmed,
      amount: Math.max(1, Number(newShoppingAmount) || 1),
      unit: 'st',
      category: classifySwedishGrocery(trimmed),
      checked: false,
      favorite: false,
    });
    setNewShoppingName('');
    setNewShoppingAmount('1');
    setQuickAddModal(null);
  };

  const handleQuickAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTodoTitle.trim();
    if (!trimmed) return;
    onAddTodo({
      title: trimmed,
      completed: false,
      priority: 'medium',
      dueDate: todayStr,
      favorite: false,
      category: 'Hushåll',
    });
    setNewTodoTitle('');
    setQuickAddModal(null);
  };

  const handleQuickAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEventTitle.trim();
    if (!trimmed) return;
    onAddEvent({
      title: trimmed,
      date: newEventDate || todayStr,
      startTime: newEventStart || '17:00',
      endTime: '18:00',
      isAllDay: false,
      categoryId: categories[0]?.id || 'cat-family',
      assignee: memberName,
    });
    setNewEventTitle('');
    setQuickAddModal(null);
  };

  const activeHueLightsCount = hueRooms.filter((r) => r.on).length;
  const uncheckedShoppingCount = shopping.filter((s) => !s.checked).length;
  const checkedShoppingCount = shopping.filter((s) => s.checked).length;
  const openTodosCount = todos.filter((t) => !t.completed).length;

  // ============================================================================
  // MINIMAL NIGHT CLOCK MODE (Only when explicitly chosen)
  // ============================================================================
  if (isNightClockActive) {
    const nextEvent = upcomingEvents[0];
    return (
      <div
        data-no-pull-refresh="true"
        style={{ filter: `brightness(${dimmerPercent}%)` }}
        className="fixed inset-0 z-50 bg-[#050605] text-[#8BB89E] flex flex-col justify-between px-4 sm:px-8 md:px-12 pt-[max(env(safe-area-inset-top,0px)+14px,44px)] md:pt-10 pb-[max(env(safe-area-inset-bottom,0px)+14px,24px)] md:pb-10 select-none overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-[#5E7E6B]">
          <div className="flex items-center gap-2 truncate">
            <Moon className="h-4 w-4 text-[#739E84] shrink-0" />
            <span className="font-semibold tracking-wide truncate">Nattklocka</span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
            {getWeatherIcon(weather.weatherCode, 'h-4 w-4 opacity-70')}
            <span>
              {weather.temperature}°C · {weather.description}
            </span>
          </div>
        </div>

        <div
          style={{
            transform: `translate(${pixelShift.x}px, ${pixelShift.y}px)`,
            transition: 'transform 1.5s ease-in-out',
          }}
          className="my-auto flex flex-col items-center justify-center text-center px-2"
        >
          <div className="text-[4.8rem] sm:text-[9rem] md:text-[12rem] lg:text-[14rem] font-extrabold leading-none tracking-tight font-mono tabular-nums text-[#94C4A8]/85">
            {timeString}
          </div>
          <div className="mt-3 text-lg sm:text-2xl md:text-3xl font-semibold capitalize text-[#6B917B]">
            {fullDateLong} · v.{weekNumber}
          </div>

          {nextEvent && (
            <div className="mt-5 max-w-full inline-flex items-center gap-2 rounded-full bg-[#0D130F] border border-[#1B2920] px-4 py-2 text-xs sm:text-sm text-[#769E87]">
              <Calendar className="h-4 w-4 text-[#5E8C72] shrink-0" />
              <span className="truncate">
                Nästa: <strong className="text-[#94C4A8]">{nextEvent.title}</strong> (
                {nextEvent.date === todayStr ? 'Idag' : nextEvent.date.slice(5)}{' '}
                {nextEvent.isAllDay ? 'Heldag' : nextEvent.startTime})
              </span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => handleHueScenePreset('all-off')}
              className="rounded-full bg-[#0D130F] hover:bg-[#152119] border border-[#1E2E24] px-4 py-2 text-xs font-bold text-[#8BB89E] flex items-center gap-1.5 transition-colors"
            >
              <LightbulbOff className="h-3.5 w-3.5 text-[#FACC15]" />
              <span>Släck alla ({activeHueLightsCount} på)</span>
            </button>
            <button
              type="button"
              onClick={handleSpotifyTogglePlayPause}
              className="rounded-full bg-[#0D130F] hover:bg-[#152119] border border-[#1E2E24] px-4 py-2 text-xs font-bold text-[#8BB89E] flex items-center gap-1.5 transition-colors"
            >
              {isSpotifyPlaying ? (
                <Pause className="h-3.5 w-3.5 text-[#1ED760]" />
              ) : (
                <Play className="h-3.5 w-3.5 text-[#1ED760]" />
              )}
              <span>Spotify</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3">
          <button
            type="button"
            onClick={() => handleSelectThemeMode('dark')}
            className="min-h-[42px] rounded-full bg-[#14201A] hover:bg-[#1B2C23] border border-[#22362B] px-5 py-2 text-xs sm:text-sm font-bold text-[#98B8A6] flex items-center gap-2 transition-colors"
          >
            <Moon className="h-4 w-4 text-[#A6F2C6]" />
            <span>Tillbaka till Nest Hub-vy</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] rounded-full bg-[#14201A] hover:bg-[#1B2C23] border border-[#22362B] px-5 py-2 text-xs sm:text-sm font-bold text-[#98B8A6] transition-colors"
          >
            Stäng
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // FÖRSLAG 1: GOOGLE NEST HUB "SPLIT VIEW"
  // Vänster sida (42%): Ren skulptural Klocka, Datum & Väder + 3 lugna bottenpiller
  // Höger sida (58%): Valbara Smart-kort i ett lugnt 2x2-rutnät!
  // ============================================================================
  const rootBgClass = isDarkDashboard
    ? 'bg-gradient-to-br from-[#0B110E] to-[#0E1713] text-[#ECF6F0]'
    : 'bg-[#F2F5F3] text-[#141E18]';

  const cardBgClass = isDarkDashboard
    ? 'bg-[#131E18] border-[#22352B] text-[#ECF6F0]'
    : 'bg-white border-[#DCE3DD] text-[#141E18] shadow-xs';

  const innerTileBgClass = isDarkDashboard
    ? 'bg-[#192820] text-[#ECF6F0]'
    : 'bg-[#F4F8F5] text-[#141E18]';

  const mutedTextClass = isDarkDashboard ? 'text-[#7FA38E]' : 'text-[#54685C]';

  const pillBtnClass = isDarkDashboard
    ? 'bg-[#14201A] hover:bg-[#1B2B23] border-[#22362B] text-[#98B8A6]'
    : 'bg-white hover:bg-[#E6EFE9] border-[#D0DDD4] text-[#163A2B]';

  // Render an individual Nest Hub Card by ID
  const renderNestHubCard = (cardId: NestHubCardId) => {
    switch (cardId) {
      // ========================================================================
      // 1. SPOTIFY CARD (Exact Nest Hub design from Förslag 1)
      // ========================================================================
      case 'spotify': {
        return (
          <section
            key="spotify"
            className={`rounded-[32px] sm:rounded-[36px] border p-5 sm:p-6 flex flex-col justify-between min-h-[240px] md:min-h-0 overflow-hidden ${cardBgClass}`}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSpotifyExpandModalOpen(true)}
                className="flex items-center gap-2.5 text-left group"
                title="Tryck för att öppna låtlista"
              >
                <span className="h-4 w-4 rounded-full bg-[#1ED760] shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#1ED760] group-hover:underline">
                  SPOTIFY
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSpotifySettingsOpen(true)}
                className={`text-xs font-bold hover:underline ${mutedTextClass}`}
              >
                + Spellista
              </button>
            </div>

            {/* Center Row: Album Squircle + Title/Subtitle + Big Play & Next */}
            <div className="my-auto py-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSpotifyExpandModalOpen(true)}
                className="flex items-center gap-3.5 min-w-0 flex-1 text-left"
                title="Öppna låtlista"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-[22px] bg-[#1E3A2B] flex items-center justify-center text-[#A6F2C6] shrink-0">
                  <Music className="h-8 w-8 sm:h-9 sm:w-9" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-extrabold truncate">
                    {spotifyNowPlaying?.trackTitle ||
                      selectedPlaylist?.name ||
                      'Fredagsmys'}
                  </div>
                  <div className={`text-xs sm:text-sm font-semibold truncate mt-0.5 ${mutedTextClass}`}>
                    {spotifyNowPlaying?.artistName ||
                      selectedPlaylist?.subtitle ||
                      'Svenska Favoriter'}
                  </div>
                </div>
              </button>

              {/* Big Circular Play/Pause + Circular Next */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSpotifyTogglePlayPause}
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#1ED760] hover:bg-[#1CDF63] text-[#07170D] flex items-center justify-center shadow-md transition-transform active:scale-95"
                  aria-label={isSpotifyPlaying ? 'Pausa' : 'Spela'}
                >
                  {isSpotifyPlaying ? (
                    <Pause className="h-7 w-7 fill-current" />
                  ) : (
                    <Play className="h-7 w-7 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSpotifyNextTrack}
                  className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-colors ${
                    isDarkDashboard
                      ? 'bg-[#1E2F26] hover:bg-[#273D31] text-[#E6F2EB]'
                      : 'bg-[#E6EFE9] hover:bg-[#D5E6DC] text-[#163A2B]'
                  }`}
                  aria-label="Nästa"
                  title="Nästa låt / spellista"
                >
                  <SkipForward className="h-5 w-5 fill-current" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Clean Playlist Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              {spotifyPlaylists.map((pl) => {
                const active = pl.id === selectedPlaylist?.id;
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => handleSelectSpotifyPlaylist(pl)}
                    className={`rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-extrabold whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-[#1ED760] text-[#07170D]'
                        : isDarkDashboard
                        ? 'bg-[#1B2B23] hover:bg-[#24382E] text-[#B8D4C4]'
                        : 'bg-[#E9F2EC] hover:bg-[#D8E8DD] text-[#163A2B]'
                    }`}
                  >
                    {pl.name}
                  </button>
                );
              })}
            </div>
          </section>
        );
      }

      // ========================================================================
      // 2. PHILIPS HUE CARD (Google Nest Hub Touch Slider Pills!)
      // ========================================================================
      case 'hue': {
        return (
          <section
            key="hue"
            className={`rounded-[32px] sm:rounded-[36px] border p-5 sm:p-6 flex flex-col justify-between min-h-[240px] md:min-h-0 overflow-hidden ${cardBgClass}`}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setHueSettingsOpen(true)}
                className="flex items-center gap-2.5 text-left group"
                title="Tryck för att parkoppla Hue Bridge eller anpassa rum"
              >
                <span className="h-4 w-4 rounded-full bg-[#FACC15] shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#FDE047] group-hover:underline">
                  BELYSNING · HUE
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleHueScenePreset('all-off')}
                className={`text-xs sm:text-sm font-bold hover:underline ${mutedTextClass}`}
              >
                Släck alla
              </button>
            </div>

            {/* Nest Hub Touch Slider Pills (3 rooms visible cleanly, slide anywhere on pill to dim!) */}
            <div className="my-auto py-2 space-y-2.5">
              {hueRooms.slice(0, 3).map((room) => {
                const pct = Math.round((room.bri / 254) * 100);
                const fillPct = room.on ? pct : 0;
                const pillStyle: React.CSSProperties = room.on
                  ? {
                      background: isDarkDashboard
                        ? `linear-gradient(90deg, #3E3517 0%, #3E3517 ${fillPct}%, #1A2620 ${fillPct}%, #1A2620 100%)`
                        : `linear-gradient(90deg, #FEF08A 0%, #FEF08A ${fillPct}%, #F4F8F5 ${fillPct}%, #F4F8F5 100%)`,
                    }
                  : {};

                return (
                  <div
                    key={room.id}
                    style={pillStyle}
                    className={`relative h-14 sm:h-16 rounded-[24px] px-4 flex items-center justify-between select-none overflow-hidden transition-colors ${
                      room.on
                        ? 'border border-[#574B22]'
                        : isDarkDashboard
                        ? 'bg-[#19261F] border border-transparent'
                        : 'bg-[#F0F4F1] border border-transparent'
                    }`}
                  >
                    {/* Invisible full-bleed range slider on right 70% for smooth Nest Hub drag-to-dim, while left 30% toggles ON/OFF */}
                    <button
                      type="button"
                      onClick={() => handleToggleHueRoom(room)}
                      className="z-10 flex items-center gap-2.5 text-left min-w-0 pr-2"
                    >
                      <Lightbulb
                        className={`h-5 w-5 shrink-0 ${
                          room.on
                            ? isDarkDashboard
                              ? 'text-[#FDE047]'
                              : 'text-[#854D0E]'
                            : mutedTextClass
                        }`}
                      />
                      <span
                        className={`text-base sm:text-lg font-extrabold truncate ${
                          room.on
                            ? isDarkDashboard
                              ? 'text-[#FEF9C3]'
                              : 'text-[#141E18]'
                            : mutedTextClass
                        }`}
                      >
                        {room.name}
                      </span>
                    </button>

                    <span
                      className={`z-10 text-base sm:text-lg font-extrabold font-mono tabular-nums pointer-events-none ${
                        room.on
                          ? isDarkDashboard
                            ? 'text-[#FDE047]'
                            : 'text-[#854D0E]'
                          : mutedTextClass
                      }`}
                    >
                      {room.on ? `${pct}%` : 'Av'}
                    </span>

                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={room.on ? pct : 0}
                      onChange={(e) =>
                        handleChangeHueRoomBrightness(room, Number(e.target.value))
                      }
                      className="absolute right-0 top-0 bottom-0 w-3/5 opacity-0 cursor-ew-resize z-20"
                      aria-label={`Ljusstyrka ${room.name}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      // ========================================================================
      // 3. KALENDER · IDAG & IMORGON CARD (Exact Nest Hub design from Förslag 1)
      // ========================================================================
      case 'calendar': {
        return (
          <section
            key="calendar"
            className={`rounded-[32px] sm:rounded-[36px] border p-5 sm:p-6 flex flex-col justify-between min-h-[240px] md:min-h-0 overflow-hidden ${cardBgClass}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#A6F2C6]">
                KALENDER · IDAG &amp; IMORGON
              </span>
              <button
                type="button"
                onClick={() => setQuickAddModal('calendar')}
                className={`text-xs font-bold hover:underline ${mutedTextClass}`}
              >
                + Ny
              </button>
            </div>

            <div className="my-auto py-2 space-y-3 overflow-y-auto max-h-[240px] no-scrollbar">
              {upcomingEvents.length === 0 ? (
                <div className={`rounded-[24px] p-5 text-center ${innerTileBgClass}`}>
                  <p className={`text-sm font-bold ${mutedTextClass}`}>
                    Inga inplanerade händelser närmaste dagarna
                  </p>
                </div>
              ) : (
                upcomingEvents.slice(0, 3).map((evt) => {
                  const isToday = evt.date === todayStr;
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => onDeleteEventDirect(evt.id)}
                      className={`w-full text-left rounded-[24px] p-4 sm:p-5 transition-colors flex items-center justify-between gap-3 ${innerTileBgClass}`}
                      title="Tryck för att bocka av händelse"
                    >
                      <div className="min-w-0">
                        <div
                          className={`text-xs sm:text-sm font-extrabold uppercase tracking-wide font-mono tabular-nums ${
                            isToday ? 'text-[#A6F2C6]' : mutedTextClass
                          }`}
                        >
                          {isToday ? 'IDAG' : evt.date.slice(5)}{' '}
                          {evt.isAllDay
                            ? 'HELDAG'
                            : `${evt.startTime}–${evt.endTime}`}
                        </div>
                        <div className="mt-1 text-lg sm:text-xl font-extrabold truncate">
                          {evt.title}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        );
      }

      // ========================================================================
      // 4. INKÖPSLISTA CARD (Exact Nest Hub design from Förslag 1 - zero text inputs!)
      // ========================================================================
      case 'shopping': {
        return (
          <section
            key="shopping"
            className={`rounded-[32px] sm:rounded-[36px] border p-5 sm:p-6 flex flex-col justify-between min-h-[240px] md:min-h-0 overflow-hidden ${cardBgClass}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#A6F2C6]">
                INKÖPSLISTA · {uncheckedShoppingCount} VAROR
              </span>

              <div className="flex items-center gap-3">
                {checkedShoppingCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearCheckedShopping}
                    className="text-xs font-bold text-[#F87171] hover:underline"
                  >
                    Rensa ({checkedShoppingCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setQuickAddModal('shopping')}
                  className={`text-xs font-bold hover:underline ${mutedTextClass}`}
                >
                  + Lägg till
                </button>
              </div>
            </div>

            <div className="my-auto py-2 space-y-2.5 overflow-y-auto max-h-[240px] no-scrollbar">
              {sortedShopping.length === 0 ? (
                <div className={`rounded-[24px] p-5 text-center ${innerTileBgClass}`}>
                  <p className={`text-sm font-bold ${mutedTextClass}`}>
                    Inköpslistan är tom
                  </p>
                </div>
              ) : (
                sortedShopping.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleShoppingChecked(item.id)}
                    className={`w-full text-left h-14 sm:h-16 rounded-[22px] px-4 flex items-center justify-between gap-3 transition-opacity ${innerTileBgClass} ${
                      item.checked ? 'opacity-45' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                          item.checked
                            ? 'bg-[#A6F2C6] border-[#A6F2C6] text-[#0B110E]'
                            : 'border-[#7FA38E]'
                        }`}
                      >
                        {item.checked && <Check className="h-4 w-4 stroke-[3]" />}
                      </span>
                      <span
                        className={`text-base sm:text-xl font-bold truncate ${
                          item.checked ? 'line-through' : ''
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <span className="text-sm sm:text-base font-bold text-[#A6F2C6] font-mono tabular-nums shrink-0">
                      {item.amount} {item.unit}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
        );
      }

      // ========================================================================
      // 5. BILDER & FOTORAM CARD (Google Nest Hub Ambient Photo Frame!)
      // ========================================================================
      case 'photos': {
        const activePhoto =
          displayPhotos[currentPhotoIdx % Math.max(1, displayPhotos.length)];
        return (
          <section
            key="photos"
            onClick={() =>
              setCurrentPhotoIdx((prev) => (prev + 1) % displayPhotos.length)
            }
            className={`relative rounded-[32px] sm:rounded-[36px] border overflow-hidden min-h-[240px] md:min-h-0 flex flex-col justify-between cursor-pointer group ${cardBgClass}`}
            title="Tryck för att byta bild"
          >
            {activePhoto && (
              <img
                src={activePhoto.imageUrl}
                alt={activePhoto.caption}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35" />

            <div className="relative z-10 p-5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-xs px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
                <ImageIcon className="h-3.5 w-3.5 text-[#A6F2C6]" />
                <span>Bilder</span>
              </span>
              {displayPhotos.length > 1 && (
                <span className="rounded-full bg-black/45 backdrop-blur-xs px-2.5 py-1 text-xs font-mono tabular-nums font-bold text-white/90">
                  {(currentPhotoIdx % displayPhotos.length) + 1}/{displayPhotos.length}
                </span>
              )}
            </div>

            {activePhoto?.caption && (
              <div className="relative z-10 p-5 pt-0">
                <p className="text-sm sm:text-base font-bold text-white drop-shadow-xs line-clamp-2">
                  {activePhoto.caption}
                </p>
              </div>
            )}
          </section>
        );
      }

      // ========================================================================
      // 6. ATT GÖRA & NOTISER CARD
      // ========================================================================
      case 'todo': {
        return (
          <section
            key="todo"
            className={`rounded-[32px] sm:rounded-[36px] border p-5 sm:p-6 flex flex-col justify-between min-h-[240px] md:min-h-0 overflow-hidden ${cardBgClass}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#A6F2C6]">
                ATT GÖRA · {openTodosCount} UPPGIFTER
              </span>
              <button
                type="button"
                onClick={() => setQuickAddModal('todo')}
                className={`text-xs font-bold hover:underline ${mutedTextClass}`}
              >
                + Ny
              </button>
            </div>

            <div className="my-auto py-2 space-y-2.5 overflow-y-auto max-h-[240px] no-scrollbar">
              {sortedTodos.length === 0 && sortedNotes.length === 0 ? (
                <div className={`rounded-[24px] p-5 text-center ${innerTileBgClass}`}>
                  <p className={`text-sm font-bold ${mutedTextClass}`}>
                    Alla uppgifter är avklarade!
                  </p>
                </div>
              ) : (
                <>
                  {sortedTodos.slice(0, 3).map((todo) => (
                    <button
                      key={todo.id}
                      type="button"
                      onClick={() => onToggleTodo(todo.id)}
                      className={`w-full text-left h-14 rounded-[22px] px-4 flex items-center justify-between gap-3 ${innerTileBgClass} ${
                        todo.completed ? 'opacity-45' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                            todo.completed
                              ? 'bg-[#A6F2C6] border-[#A6F2C6] text-[#0B110E]'
                              : 'border-[#7FA38E]'
                          }`}
                        >
                          {todo.completed && <Check className="h-4 w-4 stroke-[3]" />}
                        </span>
                        <span
                          className={`text-base sm:text-lg font-bold truncate ${
                            todo.completed ? 'line-through' : ''
                          }`}
                        >
                          {todo.title}
                        </span>
                      </div>
                    </button>
                  ))}
                  {sortedNotes.slice(0, 1).map((note) => (
                    <div
                      key={note.id}
                      className={`rounded-[22px] p-3.5 ${innerTileBgClass}`}
                    >
                      <div className="text-xs font-extrabold text-[#FDE047] truncate">
                        📌 {note.title}
                      </div>
                      {note.listMode === 'checklist' &&
                      note.checklistItems?.length > 0 ? (
                        <div className="mt-1.5 space-y-1">
                          {note.checklistItems.slice(0, 2).map((ci) => (
                            <button
                              key={ci.id}
                              type="button"
                              onClick={() => onToggleNoteChecklistItem(note.id, ci.id)}
                              className="w-full text-left text-xs font-bold flex items-center gap-2"
                            >
                              <span>{ci.checked ? '☑' : '☐'}</span>
                              <span className={ci.checked ? 'line-through opacity-60' : ''}>
                                {ci.text}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="mt-1 text-xs opacity-80 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: note.contentHtml }}
                        />
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        );
      }

      // ========================================================================
      // 7. KÖK & MATSEDEL CARD
      // ========================================================================
      case 'kitchen': {
        return (
          <section
            key="kitchen"
            className={`rounded-[32px] sm:rounded-[36px] border p-5 sm:p-6 flex flex-col justify-between min-h-[240px] md:min-h-0 overflow-hidden ${cardBgClass}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#A6F2C6]">
                KÖK &amp; RECEPT
              </span>
              {orderedRecipes.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedRecipeIdx(
                        (prev) =>
                          (prev - 1 + orderedRecipes.length) % orderedRecipes.length
                      )
                    }
                    className={`h-7 w-7 rounded-full flex items-center justify-center ${innerTileBgClass}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedRecipeIdx((prev) => (prev + 1) % orderedRecipes.length)
                    }
                    className={`h-7 w-7 rounded-full flex items-center justify-center ${innerTileBgClass}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="my-auto py-2">
              {currentRecipe ? (
                <>
                  <h3 className="text-xl sm:text-2xl font-extrabold truncate">
                    {currentRecipe.title}
                  </h3>
                  <p className={`text-xs sm:text-sm font-semibold mt-0.5 ${mutedTextClass}`}>
                    {currentRecipe.prepTime} · {currentRecipe.servings} portioner
                  </p>
                </>
              ) : (
                <p className={`text-sm font-bold ${mutedTextClass}`}>
                  Inga recept sparade ännu
                </p>
              )}

              {/* Clean Timer Row */}
              <div className={`mt-3 rounded-[20px] px-3.5 py-2.5 flex items-center justify-between gap-2 ${innerTileBgClass}`}>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-[#A6F2C6]" />
                  <span className="text-sm font-mono tabular-nums font-extrabold">
                    {formatTimer(timerSecondsLeft)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 5, 10].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => addTimerMinutes(m)}
                      className="rounded-full bg-[#24382E] px-2.5 py-1 text-xs font-mono tabular-nums font-bold text-[#A6F2C6]"
                    >
                      +{m}m
                    </button>
                  ))}
                  {timerSecondsLeft > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setTimerRunning(false);
                        setTimerSecondsLeft(0);
                      }}
                      className="rounded-full bg-red-500/20 px-2 py-1 text-xs font-bold text-red-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {currentRecipe && (
              <button
                type="button"
                onClick={() => setKitchenModeOpen(true)}
                className="w-full h-11 rounded-full bg-[#1E3A2B] hover:bg-[#274B38] text-[#A6F2C6] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-colors"
              >
                <ChefHat className="h-4 w-4" />
                <span>Öppna Köksläge (Steg-för-steg)</span>
              </button>
            )}
          </section>
        );
      }
    }
  };

  // Determine grid layout based on number of active cards
  const gridColsClass =
    enabledCards.length === 1
      ? 'grid-cols-1'
      : enabledCards.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-1'
      : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div
      data-no-pull-refresh="true"
      style={{ filter: `brightness(${dimmerPercent}%)` }}
      className={`fixed inset-0 z-50 ${rootBgClass} flex flex-col md:grid md:grid-cols-12 h-dvh px-4 sm:px-7 lg:px-12 pt-[max(env(safe-area-inset-top,0px)+14px,42px)] md:pt-8 lg:pt-10 pb-[max(env(safe-area-inset-bottom,0px)+14px,20px)] md:pb-8 lg:pb-10 gap-5 lg:gap-8 overflow-y-auto md:overflow-hidden select-none transition-colors duration-300`}
    >
      {/* Hidden 0x0 Spotify IFrame controller mount so music plays seamlessly without cluttering the card */}
      <div className="sr-only pointer-events-none h-0 w-0 overflow-hidden" aria-hidden="true">
        <div ref={spotifyEmbedMountRef} />
      </div>

      {/* ====================================================================
          LEFT 42% (md:col-span-5):
          Google Nest Hub Sculptural Clock, Date, Gothenburg Weather & Bottom Pills
         ==================================================================== */}
      <div className="md:col-span-5 flex flex-col justify-between shrink-0">
        {/* Top Date + Week Number */}
        <div className={`text-sm sm:text-lg lg:text-xl font-semibold capitalize ${mutedTextClass}`}>
          {fullDateLong} · v.{weekNumber}
        </div>

        {/* Center Giant Digital Clock + Gothenburg Weather */}
        <div className="my-4 md:my-auto">
          <div
            style={{
              transform: `translate(${pixelShift.x}px, ${pixelShift.y}px)`,
              transition: 'transform 1.5s ease-in-out',
            }}
            className="text-[4.8rem] sm:text-[7rem] md:text-[7.2rem] lg:text-[9.5rem] xl:text-[11.2rem] font-extrabold leading-none tracking-tighter font-mono tabular-nums"
          >
            {timeString}
          </div>

          <div className="mt-4 sm:mt-6 flex items-center gap-3.5">
            {getWeatherIcon(weather.weatherCode, 'h-8 w-8 sm:h-10 sm:w-10 shrink-0')}
            <div>
              <div className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight">
                {weather.temperature}°C · {weather.description} i Göteborg
              </div>
              <div className={`mt-0.5 text-xs sm:text-base font-medium font-mono tabular-nums ${mutedTextClass}`}>
                Högst {weather.highTemp}° · Lägst {weather.lowTemp}°
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left Discreet Nest Hub Pills: Theme + Anpassa kort + Stäng */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleCycleThemeMode}
            className={`min-h-[44px] rounded-full border px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors ${pillBtnClass}`}
            title="Växla mellan Mörkt läge, Ljust läge och Nattklocka"
          >
            {isDarkDashboard ? (
              <>
                <Moon className="h-4 w-4 text-[#A6F2C6]" />
                <span>Mörkt läge</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-[#F59E0B]" />
                <span>Ljust läge</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCustomizeMenuOpen(true)}
            className={`min-h-[44px] rounded-full border px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors ${pillBtnClass}`}
            title="Välj vilka kort som ska visas på skärmsläckaren (t.ex. Bilder, Spotify, Hue, Inköp)"
          >
            <Layers className="h-4 w-4 text-[#A6F2C6]" />
            <span>Anpassa kort</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className={`min-h-[44px] rounded-full border px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold transition-colors ${pillBtnClass}`}
          >
            Stäng
          </button>
        </div>
      </div>

      {/* ====================================================================
          RIGHT 58% (md:col-span-7):
          Google Nest Hub 2x2 Smart Card Grid (Customizable!)
         ==================================================================== */}
      <div
        className={`md:col-span-7 grid ${gridColsClass} gap-4 sm:gap-5 md:h-full md:min-h-0 md:overflow-y-auto no-scrollbar pb-4 md:pb-0`}
      >
        {enabledCards.map((cardId) => renderNestHubCard(cardId))}
      </div>

      {/* ====================================================================
          "ANPASSA KORT" MENU MODAL (Choose & Reorder Cards + Screen Settings!)
         ==================================================================== */}
      {customizeMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            className={`w-full max-w-xl max-h-[90vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden ${cardBgClass}`}
          >
            <div className="px-6 py-5 border-b border-current/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#1E3A2B] text-[#A6F2C6] flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold">
                    Anpassa skärmsläckarens kort
                  </h2>
                  <p className={`text-xs ${mutedTextClass}`}>
                    Välj vilka kort som ska visas (4 kort ger ett perfekt 2×2-rutnät)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomizeMenuOpen(false)}
                className="min-h-[38px] rounded-full bg-white/10 hover:bg-white/20 px-4 py-1.5 text-xs font-extrabold flex items-center gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>Klar</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* 1. Card Toggle & Order List */}
              <div className="space-y-2.5">
                {cardsConfig.map((item, idx) => {
                  const meta = CARD_METADATA[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between gap-3 border transition-colors ${
                        item.enabled
                          ? isDarkDashboard
                            ? 'bg-[#192820] border-[#2C4739]'
                            : 'bg-[#F0F7F3] border-[#B8DEC6]'
                          : isDarkDashboard
                          ? 'bg-[#111A15] border-[#1B2A22] opacity-65'
                          : 'bg-[#F8FAF8] border-[#E5ECE7] opacity-65'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleCardEnabled(item.id)}
                        className="flex items-center gap-3.5 text-left min-w-0 flex-1"
                      >
                        <span
                          className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                            item.enabled
                              ? 'bg-[#A6F2C6] border-[#A6F2C6] text-[#0B110E]'
                              : 'border-[#658373]'
                          }`}
                        >
                          {item.enabled && <Check className="h-4 w-4 stroke-[3]" />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: meta.badgeColor }}
                            />
                            <span className="text-sm sm:text-base font-extrabold truncate">
                              {meta.title}
                            </span>
                          </div>
                          <div className={`text-xs truncate mt-0.5 ${mutedTextClass}`}>
                            {meta.subtitle}
                          </div>
                        </div>
                      </button>

                      {/* Move Up / Down buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveCardOrder(idx, -1)}
                          disabled={idx === 0}
                          className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/35 disabled:opacity-25 flex items-center justify-center"
                          title="Flytta upp"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCardOrder(idx, 1)}
                          disabled={idx === cardsConfig.length - 1}
                          className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/35 disabled:opacity-25 flex items-center justify-center"
                          title="Flytta ner"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. Photo Album Selector (when Photos card is enabled or available) */}
              <div className={`rounded-[24px] p-4 space-y-2.5 ${innerTileBgClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#A6F2C6]">
                    Fotoalbum för Bilder-kortet
                  </span>
                  <span className={`text-xs font-mono ${mutedTextClass}`}>
                    {photos.length} uppladdade foton
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'Alla bilder' },
                    { id: 'favorites', label: 'Favoriter' },
                    ...photoAlbums.map((a) => ({ id: a.id, label: a.name })),
                  ].map((alb) => (
                    <button
                      key={alb.id}
                      type="button"
                      onClick={() => handleSelectPhotoAlbum(alb.id)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
                        selectedPhotoAlbumId === alb.id
                          ? 'bg-[#A6F2C6] text-[#0B110E]'
                          : 'bg-black/20 text-[#98B8A6] hover:text-white'
                      }`}
                    >
                      {alb.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Display, Brightness, Auto-Idle & Quick Integration Settings */}
              <div className={`rounded-[24px] p-4 space-y-3 ${innerTileBgClass}`}>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#A6F2C6]">
                  Skärm, Ljusstyrka &amp; Kopplingar
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCycleDimmer}
                    className="rounded-full bg-black/25 hover:bg-black/40 px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Sun className="h-3.5 w-3.5 text-[#FACC15]" />
                    <span>Skärmljus: {dimmerPercent}%</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomizeMenuOpen(false);
                      setSpotifySettingsOpen(true);
                    }}
                    className="rounded-full bg-black/25 hover:bg-black/40 px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Music className="h-3.5 w-3.5 text-[#1ED760]" />
                    <span>Spotify-spellistor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomizeMenuOpen(false);
                      setHueSettingsOpen(true);
                    }}
                    className="rounded-full bg-black/25 hover:bg-black/40 px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-[#FACC15]" />
                    <span>Koppla Hue Bridge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomizeMenuOpen(false);
                      setAppsModalOpen(true);
                    }}
                    className="rounded-full bg-black/25 hover:bg-black/40 px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Grid className="h-3.5 w-3.5 text-[#A6F2C6]" />
                    <span>Andra appar</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className={`text-xs font-semibold ${mutedTextClass}`}>
                    Starta skärmsläckare automatiskt vid inaktivitet:
                  </span>
                  <div className="flex items-center gap-1">
                    {([0, 2, 5, 10] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onChangeIdleMinutes(m)}
                        className={`rounded-full px-2.5 py-1 text-xs font-mono tabular-nums font-bold ${
                          idleMinutes === m
                            ? 'bg-[#A6F2C6] text-[#0B110E]'
                            : 'bg-black/20 text-[#98B8A6]'
                        }`}
                      >
                        {m === 0 ? 'Av' : `${m}m`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          DISCREET QUICK-ADD POPUP (Keeps cards 100% free of text input clutter!)
         ==================================================================== */}
      {quickAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-[32px] border p-6 space-y-4 shadow-2xl ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {quickAddModal === 'shopping'
                  ? 'Lägg till vara i inköpslistan'
                  : quickAddModal === 'calendar'
                  ? 'Ny händelse i kalendern'
                  : 'Ny uppgift i Att göra'}
              </h3>
              <button
                type="button"
                onClick={() => setQuickAddModal(null)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {quickAddModal === 'shopping' && (
              <form onSubmit={handleQuickAddShopping} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newShoppingName}
                    onChange={(e) => setNewShoppingName(e.target.value)}
                    placeholder="T.ex. Kaffe, Avokado..."
                    className="flex-1 rounded-2xl bg-black/30 border border-white/15 px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#A6F2C6]"
                  />
                  <input
                    type="number"
                    min="1"
                    value={newShoppingAmount}
                    onChange={(e) => setNewShoppingAmount(e.target.value)}
                    className="w-16 rounded-2xl bg-black/30 border border-white/15 px-3 py-3 text-center text-sm font-mono font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#A6F2C6] text-[#0B110E] py-3 text-sm font-extrabold"
                >
                  Lägg till
                </button>
              </form>
            )}

            {quickAddModal === 'calendar' && (
              <form onSubmit={handleQuickAddEvent} className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Händelse (t.ex. Fotbollsträning)..."
                  className="w-full rounded-2xl bg-black/30 border border-white/15 px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#A6F2C6]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="rounded-2xl bg-black/30 border border-white/15 px-3 py-2.5 text-sm font-mono font-bold"
                  />
                  <input
                    type="time"
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="rounded-2xl bg-black/30 border border-white/15 px-3 py-2.5 text-sm font-mono font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#A6F2C6] text-[#0B110E] py-3 text-sm font-extrabold"
                >
                  Spara händelse
                </button>
              </form>
            )}

            {quickAddModal === 'todo' && (
              <form onSubmit={handleQuickAddTodo} className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  placeholder="Uppgift att göra..."
                  className="w-full rounded-2xl bg-black/30 border border-white/15 px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#A6F2C6]"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#A6F2C6] text-[#0B110E] py-3 text-sm font-extrabold"
                >
                  Spara uppgift
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          SPOTIFY FULL PLAYER & TRACKLIST MODAL (When tapping Spotify header/icon)
         ==================================================================== */}
      {spotifyExpandModalOpen && selectedPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            className={`w-full max-w-3xl max-h-[90vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden ${cardBgClass}`}
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-4 w-4 rounded-full bg-[#1ED760] shrink-0" />
                <h2 className="text-base sm:text-lg font-extrabold truncate">
                  Spotify · {selectedPlaylist.name}
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSpotifyExpandModalOpen(false);
                    setSpotifySettingsOpen(true);
                  }}
                  className="rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-extrabold text-[#A6F2C6]"
                >
                  + Egen spellista
                </button>
                <button
                  type="button"
                  onClick={() => setSpotifyExpandModalOpen(false)}
                  className="rounded-full bg-white/15 hover:bg-white/25 px-3.5 py-1.5 text-xs font-extrabold"
                >
                  Stäng
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {spotifyPlaylists.map((pl) => {
                  const active = pl.id === selectedPlaylist.id;
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => handleSelectSpotifyPlaylist(pl)}
                      className={`rounded-full px-4 py-2 text-xs font-extrabold whitespace-nowrap shrink-0 transition-colors ${
                        active
                          ? 'bg-[#1ED760] text-[#07170D]'
                          : 'bg-black/25 text-[#B8D4C4]'
                      }`}
                    >
                      {pl.name}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#121212]">
                <iframe
                  key={`full-${selectedPlaylist.embedUrl}`}
                  src={selectedPlaylist.embedUrl}
                  width="100%"
                  height="380"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  title={`Spotify - ${selectedPlaylist.name}`}
                  className="w-full h-[380px] border-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SPOTIFY PLAYLIST MANAGER MODAL
         ==================================================================== */}
      {spotifySettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            className={`w-full max-w-xl max-h-[90vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden ${cardBgClass}`}
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-4 rounded-full bg-[#1ED760]" />
                <h2 className="text-base sm:text-lg font-extrabold">
                  Hantera Spotify-spellistor
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSpotifySettingsOpen(false)}
                className="rounded-full bg-white/15 hover:bg-white/25 px-4 py-1.5 text-xs font-extrabold"
              >
                Stäng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <form
                onSubmit={handleAddCustomPlaylist}
                className={`rounded-[24px] p-4 space-y-3 ${innerTileBgClass}`}
              >
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1ED760]">
                  + Lägg till egen Spotify-spellista
                </h3>
                <p className={`text-xs ${mutedTextClass}`}>
                  Kopiera länken till en spellista i Spotify (Dela → Kopiera länk) och klistra in här:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Namn (t.ex. Filips lista)"
                    className="sm:col-span-5 rounded-2xl bg-black/30 border border-white/15 px-3.5 py-2.5 text-xs font-bold focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newPlaylistUrl}
                    onChange={(e) => setNewPlaylistUrl(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    className="sm:col-span-7 rounded-2xl bg-black/30 border border-white/15 px-3.5 py-2.5 text-xs font-bold focus:outline-none"
                  />
                </div>
                {playlistAddError && (
                  <p className="text-xs font-bold text-[#F87171]">{playlistAddError}</p>
                )}
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#1ED760] py-2.5 text-xs font-extrabold text-[#07170D]"
                >
                  Spara spellista
                </button>
              </form>

              <div className={`rounded-[24px] p-4 space-y-2 ${innerTileBgClass}`}>
                <h3 className="text-xs font-extrabold uppercase tracking-wider">
                  Valbara spellistor ({spotifyPlaylists.length})
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {spotifyPlaylists.map((pl) => (
                    <div
                      key={pl.id}
                      className="rounded-2xl bg-black/20 px-3.5 py-2.5 flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectSpotifyPlaylist(pl)}
                        className="text-left min-w-0 flex-1"
                      >
                        <div className="text-xs font-extrabold truncate">{pl.name}</div>
                        <div className={`text-[10px] truncate ${mutedTextClass}`}>
                          {pl.subtitle}
                        </div>
                      </button>
                      {spotifyPlaylists.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSpotifyPlaylist(pl.id)}
                          className="text-[#F87171] p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-[24px] p-4 space-y-2 ${innerTileBgClass}`}>
                <h3 className="text-xs font-extrabold uppercase tracking-wider">
                  Valfritt: Spotify Connect Token
                </h3>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={spotifyToken}
                    onChange={(e) => setSpotifyToken(e.target.value)}
                    placeholder="Spotify Bearer Token (valfritt)..."
                    className="flex-1 rounded-2xl bg-black/30 border border-white/15 px-3.5 py-2 text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleFetchPersonalPlaylistsFromToken}
                    disabled={spotifySyncBusy}
                    className="rounded-full bg-[#1E3A2B] px-4 py-2 text-xs font-extrabold text-[#A6F2C6]"
                  >
                    {spotifySyncBusy ? 'Hämtar...' : 'Hämta'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          PHILIPS HUE BRIDGE & ROOMS SETUP MODAL
         ==================================================================== */}
      {hueSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            className={`w-full max-w-xl max-h-[90vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden ${cardBgClass}`}
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-4 rounded-full bg-[#FACC15]" />
                <h2 className="text-base sm:text-lg font-extrabold">
                  Philips Hue · Inställningar
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setHueSettingsOpen(false)}
                className="rounded-full bg-white/15 hover:bg-white/25 px-4 py-1.5 text-xs font-extrabold"
              >
                Stäng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className={`rounded-[24px] p-4 space-y-3 ${innerTileBgClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-[#A6F2C6]" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider">
                      Koppla din Philips Hue Bridge
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscoverBridge}
                    disabled={huePairingBusy}
                    className="rounded-full bg-[#1E3A2B] px-3 py-1 text-xs font-extrabold text-[#A6F2C6] flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${huePairingBusy ? 'animate-spin' : ''}`} />
                    <span>Sök på Wi-Fi</span>
                  </button>
                </div>

                <p className={`text-xs leading-relaxed ${mutedTextClass}`}>
                  Tryck på den fysiska runda knappen ovanpå din Philips Hue Bridge och klicka sedan på <strong>Parkoppla</strong> inom 30 sekunder.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hueBridgeIpInput}
                    onChange={(e) => setHueBridgeIpInput(e.target.value)}
                    placeholder="Hue Bridge IP (t.ex. 192.168.1.50)"
                    className="flex-1 rounded-2xl bg-black/30 border border-white/15 px-3.5 py-2.5 text-xs font-mono font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePairBridge}
                    disabled={huePairingBusy}
                    className="rounded-full bg-[#FACC15] px-4 py-2.5 text-xs font-extrabold text-[#141E18] shrink-0"
                  >
                    Parkoppla
                  </button>
                </div>

                {huePairingStatus && (
                  <div className="rounded-2xl bg-[#1E3A2B] text-[#A6F2C6] p-3 text-xs font-bold">
                    {huePairingStatus}
                  </div>
                )}
              </div>

              {!hueIsLive && (
                <form
                  onSubmit={handleAddDemoRoom}
                  className={`rounded-[24px] p-4 space-y-2.5 ${innerTileBgClass}`}
                >
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">
                    + Lägg till rum
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDemoRoomName}
                      onChange={(e) => setNewDemoRoomName(e.target.value)}
                      placeholder="Rumsnamn (t.ex. Barnrum, Altan)..."
                      className="flex-1 rounded-2xl bg-black/30 border border-white/15 px-3.5 py-2.5 text-xs font-bold focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[#A6F2C6] px-4 py-2.5 text-xs font-extrabold text-[#0B110E]"
                    >
                      Lägg till
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ANDRA APPAR MODAL
         ==================================================================== */}
      {appsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            className={`w-full max-w-xl max-h-[90vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden ${cardBgClass}`}
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <h2 className="text-base sm:text-lg font-extrabold">
                Öppna andra appar
              </h2>
              <button
                type="button"
                onClick={() => setAppsModalOpen(false)}
                className="rounded-full bg-white/15 hover:bg-white/25 px-4 py-1.5 text-xs font-extrabold"
              >
                Stäng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {appShortcuts.map((app) => (
                  <div
                    key={app.id}
                    className={`rounded-[22px] p-3.5 flex flex-col justify-between gap-2 ${innerTileBgClass}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-[10px] font-bold ${mutedTextClass}`}>
                          {app.category}
                        </span>
                        <h4 className="text-sm font-extrabold truncate">{app.name}</h4>
                      </div>
                      {app.id.startsWith('app-custom-') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAppShortcut(app.id)}
                          className="opacity-60 hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => launchExternalAppShortcut(app)}
                      className="w-full rounded-full bg-[#1E3A2B] py-1.5 text-xs font-extrabold text-[#A6F2C6] flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Öppna</span>
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddCustomAppShortcut}
                className={`rounded-[24px] p-4 space-y-2.5 ${innerTileBgClass}`}
              >
                <h3 className="text-xs font-extrabold uppercase tracking-wider">
                  + Lägg till egen app-genväg
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="Namn (t.ex. SVT Play)"
                    className="rounded-2xl bg-black/30 border border-white/15 px-3 py-2 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={newAppUrl}
                    onChange={(e) => setNewAppUrl(e.target.value)}
                    placeholder="Länk (t.ex. svtplay.se)"
                    className="rounded-2xl bg-black/30 border border-white/15 px-3 py-2 text-xs font-bold"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#A6F2C6] py-2 text-xs font-extrabold text-[#0B110E]"
                  >
                    Spara
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          STEP-BY-STEP KITCHEN MODE MODAL
         ==================================================================== */}
      {kitchenModeOpen && currentRecipe && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            className={`w-full max-w-4xl max-h-[90vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden ${cardBgClass}`}
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#A6F2C6]">
                  Köksläge · Steg-för-steg
                </div>
                <h2 className="text-lg sm:text-2xl font-extrabold mt-0.5">
                  {currentRecipe.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setKitchenModeOpen(false)}
                className="rounded-full bg-white/15 hover:bg-white/25 px-4 py-2 text-xs font-extrabold"
              >
                Stäng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className={`md:col-span-5 rounded-[26px] p-4 space-y-3 ${innerTileBgClass}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">
                    Ingredienser ({currentRecipe.servings} port)
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      onSendIngredientsToShopping(
                        currentRecipe.ingredients,
                        currentRecipe.title
                      )
                    }
                    className="rounded-full bg-[#1E3A2B] px-3 py-1 text-xs font-extrabold text-[#A6F2C6]"
                  >
                    + Till inköp
                  </button>
                </div>
                <div className="space-y-1.5">
                  {currentRecipe.ingredients.map((ing, i) => {
                    const key = `${currentRecipe.id}-ing-${i}`;
                    const isChecked = Boolean(checkedRecipeIngredients[key]);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setCheckedRecipeIngredients((prev) => ({
                            ...prev,
                            [key]: !isChecked,
                          }))
                        }
                        className={`w-full text-left rounded-xl bg-black/20 px-3 py-2 flex items-center justify-between gap-2 text-xs font-bold ${
                          isChecked ? 'opacity-45 line-through' : ''
                        }`}
                      >
                        <span>{ing.name}</span>
                        <span className="font-mono text-[#A6F2C6]">
                          {ing.amount} {ing.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`md:col-span-7 rounded-[26px] p-4 space-y-3 ${innerTileBgClass}`}>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">
                  Gör så här
                </h3>
                <div className="space-y-2.5">
                  {currentRecipe.steps.map((step, idx) => {
                    const key = `${currentRecipe.id}-step-${idx}`;
                    const isDone = Boolean(checkedRecipeSteps[key]);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setCheckedRecipeSteps((prev) => ({
                            ...prev,
                            [key]: !isDone,
                          }))
                        }
                        className={`w-full text-left rounded-2xl bg-black/20 p-3.5 flex items-start gap-3 ${
                          isDone ? 'opacity-45 line-through' : ''
                        }`}
                      >
                        <span className="h-6 w-6 rounded-full bg-[#1E3A2B] text-[#A6F2C6] font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                          {isDone ? '✓' : idx + 1}
                        </span>
                        <span className="text-sm font-medium leading-relaxed">{step}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
