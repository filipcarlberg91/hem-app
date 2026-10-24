import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
  FileText,
  Grid,
  Lightbulb,
  LightbulbOff,
  Maximize2,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  ShoppingCart,
  Sliders,
  Sun,
  Timer,
  Trash2,
  Wifi,
  Wind,
  X,
} from 'lucide-react';
import {
  CalendarEvent,
  EventCategory,
  GothenburgWeather,
  NoteItem,
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

interface ScreensaverViewProps {
  open: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  categories: EventCategory[];
  todos: TodoItem[];
  notes: NoteItem[];
  shopping: ShoppingItem[];
  recipes: RecipeItem[];
  memberName: string;
  idleMinutes: number;
  onChangeIdleMinutes: (minutes: number) => void;
  // Interactive widget callbacks (all work directly without leaving screensaver)
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

type ScreensaverThemeMode = 'dark' | 'light' | 'auto' | 'night-clock';

const SCREENSAVER_THEME_KEY = 'vn_screensaver_theme_v1';
const SCREENSAVER_DIMMER_KEY = 'vn_screensaver_dimmer_v1';

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

function getWeatherIcon(code: number, className = 'h-5 w-5') {
  if (code === 0) return <Sun className={`${className} text-[#FACC15]`} />;
  if (code === 1 || code === 2)
    return <CloudSun className={`${className} text-[#A6F2C6]`} />;
  if (code === 3 || code === 45 || code === 48)
    return <Cloud className={`${className} text-[#CBD5E1]`} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className={`${className} text-[#7DD3FC]`} />;
  if (code >= 71 && code <= 77)
    return <CloudSnow className={`${className} text-[#E0F2FE]`} />;
  if (code >= 95)
    return <CloudLightning className={`${className} text-[#C4B5FD]`} />;
  return <CloudSun className={className} />;
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
    // Ignore audio context restrictions
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

  // Theme mode for the Always-On Screensaver:
  // 'dark' = Mörkerläge (default! Shows all household widgets in a low-glare dark theme)
  // 'light' = Ljust läge (Shows all household widgets in a bright daylight theme)
  // 'auto' = Ljust läge 07:00–19:00, Mörkerläge (med alla widgets!) 19:00–07:00
  // 'night-clock' = Minimalistisk Nattklocka
  const [themeMode, setThemeMode] = useState<ScreensaverThemeMode>(() => {
    try {
      const saved = localStorage.getItem(SCREENSAVER_THEME_KEY) as ScreensaverThemeMode | null;
      if (saved === 'dark' || saved === 'light' || saved === 'auto' || saved === 'night-clock') {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'dark';
  });

  // Screen brightness / dimmer percentage (100, 80, 60, 40) for comfortable evening tablet viewing
  const [dimmerPercent, setDimmerPercent] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(SCREENSAVER_DIMMER_KEY));
      if ([100, 80, 60, 40].includes(saved)) return saved;
    } catch {
      // Ignore
    }
    return 100;
  });

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
    const nextIdx = (steps.indexOf(dimmerPercent) + 1) % steps.length;
    const nextVal = steps[nextIdx];
    setDimmerPercent(nextVal);
    try {
      localStorage.setItem(SCREENSAVER_DIMMER_KEY, String(nextVal));
    } catch {
      // Ignore
    }
  };

  // Mobile (< 7 inch / < md:) active widget tab
  const [mobileActiveWidget, setMobileActiveWidget] = useState<
    'all' | 'hue' | 'shopping' | 'calendar' | 'todo' | 'kitchen'
  >('all');

  // Philips Hue state
  const [hueConfig, setHueConfig] = useState<HueConfig>(() => loadHueConfig());
  const [hueRooms, setHueRooms] = useState<HueRoom[]>([]);
  const [hueIsLive, setHueIsLive] = useState<boolean>(false);
  const [hueSettingsOpen, setHueSettingsOpen] = useState<boolean>(false);
  const [hueBridgeIpInput, setHueBridgeIpInput] = useState<string>(() => loadHueConfig().bridgeIp);
  const [huePairingStatus, setHuePairingStatus] = useState<string>('');
  const [huePairingBusy, setHuePairingBusy] = useState<boolean>(false);
  const [newDemoRoomName, setNewDemoRoomName] = useState<string>('');

  // External App Shortcuts state
  const [appShortcuts, setAppShortcuts] = useState<ExternalAppShortcut[]>(() =>
    loadAppShortcuts()
  );
  const [appsModalOpen, setAppsModalOpen] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState<string>('');
  const [newAppUrl, setNewAppUrl] = useState<string>('');
  const [newAppCategory, setNewAppCategory] = useState<string>('Smarta hem');

  // Recipe & Kitchen Mode state
  const [selectedRecipeIdx, setSelectedRecipeIdx] = useState<number>(0);
  const [kitchenModeOpen, setKitchenModeOpen] = useState<boolean>(false);
  const [checkedRecipeSteps, setCheckedRecipeSteps] = useState<Record<string, boolean>>({});
  const [checkedRecipeIngredients, setCheckedRecipeIngredients] = useState<
    Record<string, boolean>
  >({});

  // Built-in Kitchen Timer inside Screensaver
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Quick-add states inside the 3 scrollable widgets
  const [showAddEventForm, setShowAddEventForm] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventDate, setNewEventDate] = useState<string>(() => getTodayDateString());
  const [newEventStart, setNewEventStart] = useState<string>('17:00');
  const [newEventEnd] = useState<string>('18:00');

  const [newShoppingName, setNewShoppingName] = useState<string>('');
  const [newShoppingAmount, setNewShoppingAmount] = useState<string>('1');
  const [newShoppingUnit] = useState<string>('st');

  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  const [newTodoPriority, setNewTodoPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [rightColumnFilter, setRightColumnFilter] = useState<'all' | 'todo' | 'notes'>('all');

  // Subtle pixel shift every minute for OLED/IPS screen protection
  const [pixelShift, setPixelShift] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const refreshHueRooms = useCallback(async (cfgOverride?: HueConfig) => {
    const activeCfg = cfgOverride || hueConfig;
    const res = await fetchHueRooms(activeCfg);
    setHueRooms(res.rooms);
    setHueIsLive(res.isLive);
  }, [hueConfig]);

  // Load and poll Philips Hue state while screensaver is open
  useEffect(() => {
    if (!open) return;
    refreshHueRooms();
    const interval = setInterval(() => {
      refreshHueRooms();
    }, 8000);
    return () => clearInterval(interval);
  }, [open, refreshHueRooms]);

  // Update clock every second
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

  // Keep tablet/phone screen awake via Screen Wake Lock API + Android Native FLAG_KEEP_SCREEN_ON
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
        // Ignore wakeLock permission errors in restricted browsers/iframes
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

  // Fetch live Gothenburg weather
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

  // Kitchen countdown timer effect
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

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (kitchenModeOpen) {
          setKitchenModeOpen(false);
        } else if (hueSettingsOpen) {
          setHueSettingsOpen(false);
        } else if (appsModalOpen) {
          setAppsModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, kitchenModeOpen, hueSettingsOpen, appsModalOpen, onClose]);

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

  const hour = now.getHours();
  const isEveningOrNight = hour >= 19 || hour < 7;
  const isDarkDashboard =
    themeMode === 'dark' || (themeMode === 'auto' && isEveningOrNight);
  const isNightClockActive = themeMode === 'night-clock';

  const timeString = now.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const weekdayName = now.toLocaleDateString('sv-SE', { weekday: 'long' });
  const dayAndMonth = now.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
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
    const bri = Math.max(1, Math.min(254, Math.round((pct / 100) * 254)));
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
      category: newAppCategory || 'Genomslag',
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
      unit: newShoppingUnit || 'st',
      category: classifySwedishGrocery(trimmed),
      checked: false,
      favorite: false,
    });
    setNewShoppingName('');
    setNewShoppingAmount('1');
  };

  const handleQuickAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTodoTitle.trim();
    if (!trimmed) return;
    onAddTodo({
      title: trimmed,
      completed: false,
      priority: newTodoPriority,
      favorite: false,
      category: 'Hushåll',
    });
    setNewTodoTitle('');
  };

  const handleQuickAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEventTitle.trim();
    if (!trimmed) return;
    onAddEvent({
      title: trimmed,
      date: newEventDate || todayStr,
      startTime: newEventStart || '17:00',
      endTime: newEventEnd || '18:00',
      isAllDay: false,
      categoryId: categories[0]?.id || 'cat-family',
      assignee: memberName,
    });
    setNewEventTitle('');
    setShowAddEventForm(false);
  };

  const activeHueLightsCount = hueRooms.filter((r) => r.on).length;

  // ============================================================================
  // MINIMAL NIGHT CLOCK MODE (Only when explicitly chosen via "Nattklocka")
  // ============================================================================
  if (isNightClockActive) {
    const nextEvent = upcomingEvents[0];
    return (
      <div
        data-no-pull-refresh="true"
        style={{ filter: `brightness(${dimmerPercent}%)` }}
        className="fixed inset-0 z-50 bg-[#050605] text-[#8BB89E] flex flex-col justify-between px-4 sm:px-8 md:px-10 pt-[max(env(safe-area-inset-top,0px)+12px,44px)] md:pt-8 pb-[max(env(safe-area-inset-bottom,0px)+12px,20px)] md:pb-8 select-none overflow-hidden"
      >
        {/* Top subtle status row */}
        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-sm text-[#5E7E6B]">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#739E84] shrink-0" />
            <span className="font-semibold tracking-wide truncate">
              Nattklocka · Alltid på
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
            {getWeatherIcon(weather.weatherCode, 'h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-70')}
            <span>
              {weather.temperature}°C · {weather.description}
            </span>
          </div>
        </div>

        {/* Center Giant Low-Luminance Clock */}
        <div
          style={{
            transform: `translate(${pixelShift.x}px, ${pixelShift.y}px)`,
            transition: 'transform 1.5s ease-in-out',
          }}
          className="my-auto flex flex-col items-center justify-center text-center px-2"
        >
          <div className="text-[4.4rem] sm:text-[8.5rem] md:text-[11rem] lg:text-[13.5rem] font-extrabold leading-none tracking-tight font-mono tabular-nums text-[#94C4A8]/85">
            {timeString}
          </div>
          <div className="mt-2.5 sm:mt-4 text-base sm:text-2xl md:text-3xl font-semibold capitalize text-[#6B917B]">
            {fullDateLong} · v.{weekNumber}
          </div>

          {nextEvent && (
            <div className="mt-4 sm:mt-6 max-w-full inline-flex items-center gap-2 rounded-2xl bg-[#0D130F] border border-[#1B2920] px-3.5 py-2 text-xs sm:text-sm text-[#769E87]">
              <Calendar className="h-4 w-4 text-[#5E8C72] shrink-0" />
              <span className="truncate">
                Nästa:{' '}
                <strong className="text-[#94C4A8]">{nextEvent.title}</strong> (
                {nextEvent.date === todayStr ? 'Idag' : nextEvent.date.slice(5)}{' '}
                <span className="font-mono tabular-nums">
                  {nextEvent.isAllDay ? 'Heldag' : nextEvent.startTime}
                </span>
                )
              </span>
            </div>
          )}

          {/* Quick Philips Hue Night Controls right inside Night Clock */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleHueScenePreset('all-off')}
              className="rounded-2xl bg-[#0D130F] hover:bg-[#152119] border border-[#1E2E24] px-3.5 py-2 text-xs font-bold text-[#8BB89E] flex items-center gap-1.5 transition-colors"
            >
              <LightbulbOff className="h-3.5 w-3.5 text-[#FACC15]" />
              <span>Släck alla Hue ({activeHueLightsCount} på)</span>
            </button>
            <button
              type="button"
              onClick={() => handleHueScenePreset('evening')}
              className="rounded-2xl bg-[#0D130F] hover:bg-[#152119] border border-[#1E2E24] px-3.5 py-2 text-xs font-bold text-[#8BB89E] flex items-center gap-1.5 transition-colors"
            >
              <Lightbulb className="h-3.5 w-3.5 text-[#FACC15]" />
              <span>Nattljus (25%)</span>
            </button>
          </div>
        </div>

        {/* Bottom discreet controls */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#121A15]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectThemeMode('dark')}
              className="min-h-[40px] rounded-2xl bg-[#0F1712] hover:bg-[#17241C] border border-[#213327] px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#A6F2C6] flex items-center gap-1.5 sm:gap-2 transition-colors"
            >
              <Moon className="h-4 w-4 text-[#A6F2C6] shrink-0" />
              <span className="truncate">Visa Hushållstavla (Mörkerläge)</span>
            </button>
            <button
              type="button"
              onClick={handleCycleDimmer}
              className="min-h-[40px] rounded-2xl bg-[#0F1712] hover:bg-[#17241C] border border-[#213327] px-3 py-2 text-xs font-mono tabular-nums font-bold text-[#8BB89E]"
            >
              Ljus: {dimmerPercent}%
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-2xl bg-[#0F1712] hover:bg-[#17241C] border border-[#213327] px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#8BB89E] flex items-center gap-1.5 sm:gap-2 transition-colors shrink-0"
          >
            <X className="h-4 w-4 shrink-0" />
            <span>Stäng</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ALLTID-PÅ HUSHÅLLSTAVLA (Med äkta Mörkerläge, Philips Hue & App-genvägar!)
  // ============================================================================
  const uncheckedShoppingCount = shopping.filter((s) => !s.checked).length;
  const checkedShoppingCount = shopping.filter((s) => s.checked).length;
  const openTodosCount = todos.filter((t) => !t.completed).length;

  // Dynamic surface classes for Dark Mode vs Light Mode
  const rootSurfaceClass = isDarkDashboard
    ? 'bg-[#090F0C] text-[#E6F2EB]'
    : 'bg-[#F4F6F3] text-[#141E18]';

  const cardSurfaceClass = isDarkDashboard
    ? 'bg-[#111C16] border-[#1E3126] text-[#E6F2EB]'
    : 'bg-white border-[#DCE3DD] text-[#141E18]';

  const subCardSurfaceClass = isDarkDashboard
    ? 'bg-[#16241C] border-[#253B2E] text-[#E6F2EB]'
    : 'bg-[#FAFBF9] border-[#E5ECE7] text-[#141E18]';

  const mutedTextClass = isDarkDashboard ? 'text-[#8AB09A]' : 'text-[#54685C]';
  const inputSurfaceClass = isDarkDashboard
    ? 'bg-[#0D1611] border-[#253B2E] text-[#E6F2EB] placeholder:text-[#668573] focus:border-[#A6F2C6]'
    : 'bg-[#F4F8F5] border-[#D4E4DA] text-[#141E18] placeholder:text-[#687D70] focus:bg-white focus:border-[#163A2B]';

  return (
    <div
      data-no-pull-refresh="true"
      style={{ filter: `brightness(${dimmerPercent}%)` }}
      className={`fixed inset-0 z-50 ${rootSurfaceClass} flex flex-col h-dvh px-2.5 sm:px-4 lg:px-5 pt-[max(env(safe-area-inset-top,0px)+10px,40px)] md:pt-3.5 lg:pt-5 pb-[max(env(safe-area-inset-bottom,0px)+10px,14px)] md:pb-3.5 lg:pb-5 overflow-y-auto md:overflow-hidden transition-colors duration-300`}
    >
      {/* ====================================================================
          TOP SECTION (12 columns on 7"+ tablets):
          - Col 1..5 (5 cols): Clock, Date, Gothenburg Weather, Mörkerläge/Dimmer & Auto-Idle
          - Col 6..9 (4 cols): Philips Hue Lampor & Andra Appar (Smarta Hem-hubb)
          - Col 10..12 (3 cols): Matsedel, Köksläge & Timer
         ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 shrink-0">
        {/* 1. Top Left Card: Clock, Weather & Mörkerläge Controls */}
        <div
          className={`md:col-span-5 rounded-[24px] sm:rounded-[26px] p-3.5 sm:p-4 flex flex-col justify-between border shadow-xs ${
            isDarkDashboard
              ? 'bg-[#0F1F17] border-[#234233] text-[#E8F5ED]'
              : 'bg-[#163A2B] border-[#25543F] text-[#E8F5ED]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Clock + Date */}
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-mono tabular-nums text-white leading-none">
                  {timeString}
                </span>
                <span className="rounded-lg bg-[#214E3B] border border-[#326B52] px-2 py-0.5 text-[10px] sm:text-xs font-extrabold font-mono tabular-nums text-[#A6F2C6]">
                  v.{weekNumber}
                </span>
              </div>
              <div className="mt-1 text-xs sm:text-sm font-bold capitalize text-[#B6DEC6] truncate">
                {weekdayName} {dayAndMonth} · Hemma hos F
              </div>
            </div>

            {/* Live Gothenburg Weather Pill */}
            <div className="rounded-2xl bg-[#1A3D2E] border border-[#2F634C] px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2 shrink-0">
              {getWeatherIcon(weather.weatherCode, 'h-5 w-5 sm:h-6 sm:w-6 shrink-0')}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-lg font-extrabold font-mono tabular-nums text-white leading-none">
                    {weather.temperature}°C
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-[#A6F2C6]">
                    {weather.description}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] font-medium font-mono tabular-nums text-[#B6DEC6] flex items-center gap-1">
                  <span>
                    H:{weather.highTemp}° L:{weather.lowTemp}°
                  </span>
                  <span className="hidden xl:inline">·</span>
                  <span className="hidden xl:inline-flex items-center gap-0.5">
                    <Wind className="h-2.5 w-2.5" /> {weather.windSpeed} m/s
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar inside Top-Left Card: Mörkerläge / Ljust / Nattklocka + Dimmer + Auto-idle + Stäng */}
          <div className="mt-2.5 pt-2.5 border-t border-[#25543F]/80 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {/* Theme Switcher Segmented Control */}
              <div className="flex items-center rounded-xl bg-[#0A1811] border border-[#25543F] p-0.5 text-[10px] sm:text-[11px] font-extrabold shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectThemeMode('dark')}
                  className={`rounded-lg px-2 py-1 flex items-center gap-1 transition-colors ${
                    themeMode === 'dark'
                      ? 'bg-[#A6F2C6] text-[#0A1811]'
                      : 'text-[#B6DEC6] hover:text-white'
                  }`}
                  title="Mörkerläge: Visar all information i ett mörkt, behagligt tema dygnet runt"
                >
                  <Moon className="h-3 w-3 shrink-0" />
                  <span>Mörkt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectThemeMode('light')}
                  className={`rounded-lg px-2 py-1 flex items-center gap-1 transition-colors ${
                    themeMode === 'light'
                      ? 'bg-[#A6F2C6] text-[#0A1811]'
                      : 'text-[#B6DEC6] hover:text-white'
                  }`}
                  title="Ljust läge"
                >
                  <Sun className="h-3 w-3 shrink-0" />
                  <span>Ljust</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectThemeMode('auto')}
                  className={`rounded-lg px-2 py-1 transition-colors ${
                    themeMode === 'auto'
                      ? 'bg-[#A6F2C6] text-[#0A1811]'
                      : 'text-[#B6DEC6] hover:text-white'
                  }`}
                  title="Auto: Ljust 07–19, Mörkerläge med alla widgets 19–07"
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectThemeMode('night-clock')}
                  className={`rounded-lg px-2 py-1 transition-colors ${
                    themeMode === 'night-clock'
                      ? 'bg-[#A6F2C6] text-[#0A1811]'
                      : 'text-[#B6DEC6] hover:text-white'
                  }`}
                  title="Minimalistisk Nattklocka"
                >
                  Klocka
                </button>
              </div>

              {/* Dimmer button */}
              <button
                type="button"
                onClick={handleCycleDimmer}
                className="min-h-[28px] rounded-xl bg-[#102B20] hover:bg-[#193D2E] border border-[#25543F] px-2 py-1 text-[10px] sm:text-[11px] font-mono tabular-nums font-bold text-[#A6F2C6] shrink-0"
                title="Dämpa skärmens ljusstyrka"
              >
                ☀ {dimmerPercent}%
              </button>

              {/* Auto-idle selector */}
              <div className="hidden sm:flex items-center gap-0.5 rounded-xl bg-[#102B20] border border-[#25543F] px-1.5 py-0.5 text-[10px] text-[#B6DEC6] shrink-0">
                <Clock className="h-3 w-3 text-[#A6F2C6] shrink-0" />
                {([0, 2, 5, 10] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onChangeIdleMinutes(m)}
                    className={`rounded-md px-1 py-0.5 font-mono tabular-nums font-bold transition-colors ${
                      idleMinutes === m
                        ? 'bg-[#A6F2C6] text-[#163A2B]'
                        : 'text-[#B6DEC6] hover:text-white'
                    }`}
                  >
                    {m === 0 ? 'Av' : `${m}m`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[30px] rounded-xl bg-white/15 hover:bg-white/25 px-2.5 py-1 text-[11px] font-extrabold text-white flex items-center gap-1 shrink-0 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Stäng</span>
            </button>
          </div>
        </div>

        {/* 2. Top Middle Card: PHILIPS HUE BELYSNING & ANDRA APPAR */}
        <div
          className={`${
            mobileActiveWidget === 'hue' || mobileActiveWidget === 'all'
              ? 'flex'
              : 'hidden md:flex'
          } md:col-span-4 rounded-[24px] sm:rounded-[26px] border p-3.5 sm:p-4 flex-col justify-between shadow-xs ${cardSurfaceClass}`}
        >
          {/* Header: Philips Hue + Quick Scene Presets + Setup Button */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                  activeHueLightsCount > 0
                    ? 'bg-[#FACC15]/20 text-[#EAB308] border border-[#FACC15]/40'
                    : isDarkDashboard
                    ? 'bg-[#1A2B22] text-[#8AB09A]'
                    : 'bg-[#E6EFE9] text-[#163A2B]'
                }`}
              >
                <Lightbulb className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider truncate">
                    Philips Hue
                  </h2>
                  <span
                    className={`text-[10px] font-mono tabular-nums font-bold ${mutedTextClass}`}
                  >
                    · {activeHueLightsCount}/{hueRooms.length} på
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleHueScenePreset('cozy')}
                className={`rounded-lg px-2 py-1 text-[10px] font-extrabold transition-colors ${
                  isDarkDashboard
                    ? 'bg-[#1D2F25] hover:bg-[#273F32] text-[#FDE047]'
                    : 'bg-[#FEF9C3] hover:bg-[#FEF08A] text-[#854D0E]'
                }`}
                title="Mysbelysning (varmvit 60%)"
              >
                Mys
              </button>
              <button
                type="button"
                onClick={() => handleHueScenePreset('all-off')}
                className={`rounded-lg px-2 py-1 text-[10px] font-extrabold transition-colors ${
                  isDarkDashboard
                    ? 'bg-[#1D2F25] hover:bg-[#273F32] text-[#96B8A4]'
                    : 'bg-[#E6EFE9] hover:bg-[#D5E6DC] text-[#163A2B]'
                }`}
                title="Släck alla rum"
              >
                Släck
              </button>
              <button
                type="button"
                onClick={() => setHueSettingsOpen(true)}
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                  isDarkDashboard
                    ? 'bg-[#1D2F25] hover:bg-[#273F32] text-[#A6F2C6]'
                    : 'bg-[#E6EFE9] hover:bg-[#D5E6DC] text-[#163A2B]'
                }`}
                title="Koppla Philips Hue Bridge eller anpassa rum"
                aria-label="Philips Hue inställningar"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Compact 2x2 Room Grid with One-Tap Toggle & Brightness Slider */}
          <div className="my-2 grid grid-cols-2 gap-1.5">
            {hueRooms.slice(0, 4).map((room) => {
              const pct = Math.round((room.bri / 254) * 100);
              return (
                <div
                  key={room.id}
                  className={`rounded-xl border px-2.5 py-1.5 flex flex-col justify-between transition-all ${
                    room.on
                      ? isDarkDashboard
                        ? 'bg-[#192B20] border-[#FACC15]/40 text-[#F4FBF7]'
                        : 'bg-[#FFFBEB] border-[#FDE047] text-[#141E18]'
                      : subCardSurfaceClass
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleHueRoom(room)}
                      className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
                    >
                      <span
                        className={`h-4 w-4 rounded-md flex items-center justify-center shrink-0 ${
                          room.on
                            ? 'bg-[#FACC15] text-[#141E18]'
                            : isDarkDashboard
                            ? 'bg-[#24382C] text-[#7A9E89]'
                            : 'bg-[#E2E8E4] text-[#54685C]'
                        }`}
                      >
                        <Lightbulb className="h-2.5 w-2.5" />
                      </span>
                      <span className="text-[11px] font-extrabold truncate">
                        {room.name}
                      </span>
                    </button>
                    <span className="text-[10px] font-mono tabular-nums font-bold opacity-75 shrink-0">
                      {room.on ? `${pct}%` : 'Av'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={room.on ? pct : 0}
                    onChange={(e) =>
                      handleChangeHueRoomBrightness(room, Number(e.target.value))
                    }
                    className="mt-1 w-full h-1.5 accent-[#FACC15] cursor-pointer"
                    aria-label={`Ljusstyrka ${room.name}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Bottom Row inside Hue Card: Quick App Launcher Chips (Spotify, Hue, Sonos, Home Assistant, etc.) */}
          <div className="pt-1.5 border-t border-current/10 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {appShortcuts.slice(0, 4).map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => launchExternalAppShortcut(app)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-extrabold flex items-center gap-1 whitespace-nowrap shrink-0 border transition-colors ${
                    isDarkDashboard
                      ? 'bg-[#16261E] hover:bg-[#1F352A] border-[#263E31] text-[#D7EDE0]'
                      : 'bg-[#F4F8F5] hover:bg-[#E6EFE9] border-[#D4E4DA] text-[#163A2B]'
                  }`}
                  title={`Öppna ${app.name}`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: app.accentColor }}
                  />
                  <span>{app.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAppsModalOpen(true)}
              className={`rounded-lg px-2 py-1 text-[10px] font-extrabold flex items-center gap-1 shrink-0 transition-colors ${
                isDarkDashboard
                  ? 'bg-[#214E3B] hover:bg-[#2B614A] text-[#A6F2C6]'
                  : 'bg-[#163A2B] hover:bg-[#1E4B38] text-[#A6F2C6]'
              }`}
              title="Hantera och öppna andra appar från skärmsläckaren"
            >
              <Grid className="h-3 w-3" />
              <span>Appar</span>
            </button>
          </div>
        </div>

        {/* 3. Top Right Card: MATSEDEL, KÖKSLÄGE & TIMER */}
        <div
          className={`${
            mobileActiveWidget === 'kitchen' || mobileActiveWidget === 'all'
              ? 'flex'
              : 'hidden md:flex'
          } md:col-span-3 rounded-[24px] sm:rounded-[26px] border p-3.5 sm:p-4 flex-col justify-between shadow-xs ${
            isDarkDashboard
              ? 'bg-[#13221A] border-[#233D2F] text-[#E6F2EB]'
              : 'm3-secondary-surface border'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#163A2B] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#A6F2C6]">
                  <ChefHat className="h-3 w-3" />
                  Kök & Recept
                </span>
                {orderedRecipes.length > 1 && (
                  <span className="text-[11px] font-mono tabular-nums font-bold opacity-80">
                    {(selectedRecipeIdx % orderedRecipes.length) + 1}/{orderedRecipes.length}
                  </span>
                )}
              </div>

              {currentRecipe ? (
                <>
                  <h2 className="mt-1 text-sm sm:text-base font-extrabold truncate">
                    {currentRecipe.title}
                  </h2>
                  <p className="text-[11px] opacity-80 truncate">
                    {currentRecipe.prepTime} · {currentRecipe.servings} port
                  </p>
                </>
              ) : (
                <h2 className="mt-1.5 text-xs font-bold opacity-80">
                  Inga recept sparade ännu
                </h2>
              )}
            </div>

            {orderedRecipes.length > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedRecipeIdx(
                      (prev) =>
                        (prev - 1 + orderedRecipes.length) % orderedRecipes.length
                    )
                  }
                  className={`h-7 w-7 rounded-lg border flex items-center justify-center ${
                    isDarkDashboard
                      ? 'bg-[#1B3025] border-[#2C4C3B] text-[#A6F2C6]'
                      : 'bg-white/80 hover:bg-white border-black/10 text-[#163A2B]'
                  }`}
                  aria-label="Föregående recept"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedRecipeIdx((prev) => (prev + 1) % orderedRecipes.length)
                  }
                  className={`h-7 w-7 rounded-lg border flex items-center justify-center ${
                    isDarkDashboard
                      ? 'bg-[#1B3025] border-[#2C4C3B] text-[#A6F2C6]'
                      : 'bg-white/80 hover:bg-white border-black/10 text-[#163A2B]'
                  }`}
                  aria-label="Nästa recept"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive Kitchen Timer Bar */}
          <div
            className={`my-2 rounded-xl border px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 ${
              isDarkDashboard
                ? 'bg-[#0D1812] border-[#233D2F] text-[#E6F2EB]'
                : 'bg-white/90 border-black/10 text-[#141E18]'
            }`}
          >
            <div className="flex items-center gap-1">
              <Timer className="h-3.5 w-3.5 text-[#A6F2C6] shrink-0" />
              <span
                className={`text-xs font-mono tabular-nums font-extrabold px-1.5 py-0.5 rounded-md ${
                  timerSecondsLeft > 0
                    ? 'bg-[#163A2B] text-[#A6F2C6]'
                    : isDarkDashboard
                    ? 'bg-[#192D22] text-[#A6F2C6]'
                    : 'bg-[#E6EFE9] text-[#141E18]'
                }`}
              >
                {formatTimer(timerSecondsLeft)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {[1, 5, 10].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => addTimerMinutes(m)}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-extrabold ${
                    isDarkDashboard
                      ? 'bg-[#1B3025] hover:bg-[#244031] text-[#A6F2C6]'
                      : 'bg-[#E6EFE9] hover:bg-[#D5E6DC] text-[#163A2B]'
                  }`}
                >
                  +{m}m
                </button>
              ))}
              {timerSecondsLeft > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setTimerRunning((r) => !r)}
                    className="h-6 w-6 rounded-md bg-[#163A2B] text-white flex items-center justify-center"
                    aria-label={timerRunning ? 'Pausa timer' : 'Starta timer'}
                  >
                    {timerRunning ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSecondsLeft(0);
                    }}
                    className="h-6 w-6 rounded-md bg-[#FDE8E8] text-[#9E2A2B] flex items-center justify-center"
                    aria-label="Nollställ timer"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons: Open Step-by-Step Kitchen Mode OR Add Ingredients directly */}
          {currentRecipe && (
            <div className="flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => setKitchenModeOpen(true)}
                className="flex-1 min-h-[34px] rounded-xl bg-[#163A2B] hover:bg-[#1E4B38] px-2.5 py-1 text-[11px] font-extrabold text-[#A6F2C6] flex items-center justify-center gap-1 transition-colors"
              >
                <Maximize2 className="h-3 w-3 shrink-0" />
                <span className="truncate">Köksläge</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onSendIngredientsToShopping(
                    currentRecipe.ingredients,
                    currentRecipe.title
                  )
                }
                className={`min-h-[34px] rounded-xl border px-2.5 py-1 text-[11px] font-extrabold flex items-center gap-1 shrink-0 transition-colors ${
                  isDarkDashboard
                    ? 'bg-[#1B3025] hover:bg-[#244031] border-[#2C4C3B] text-[#E6F2EB]'
                    : 'bg-white hover:bg-[#F5FBF7] border-black/10 text-[#163A2B]'
                }`}
                title="Lägg till receptets ingredienser direkt i inköpslistan"
              >
                <ShoppingCart className="h-3 w-3" />
                <span>+ Inköp</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MOBILE WIDGET SWITCHER BAR (< 7 inch screens / md:hidden)
         ==================================================================== */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar md:hidden shrink-0 pb-0.5">
        {(
          [
            {
              id: 'all',
              label: 'Alla',
              badge: null,
              icon: Maximize2,
            },
            {
              id: 'hue',
              label: 'Lampor & Appar',
              badge: activeHueLightsCount,
              icon: Lightbulb,
            },
            {
              id: 'shopping',
              label: 'Inköp',
              badge: uncheckedShoppingCount,
              icon: ShoppingCart,
            },
            {
              id: 'calendar',
              label: 'Agenda',
              badge: upcomingEvents.length,
              icon: Calendar,
            },
            {
              id: 'todo',
              label: 'Att göra',
              badge: openTodosCount,
              icon: CheckSquare,
            },
            {
              id: 'kitchen',
              label: 'Kök',
              badge: timerSecondsLeft > 0 ? formatTimer(timerSecondsLeft) : null,
              icon: ChefHat,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = mobileActiveWidget === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileActiveWidget(tab.id)}
              className={`min-h-[36px] rounded-2xl px-2.5 py-1.5 text-[11px] font-extrabold flex items-center justify-center gap-1.5 border whitespace-nowrap shrink-0 transition-all ${
                active
                  ? 'bg-[#163A2B] border-[#2D6B50] text-[#A6F2C6] shadow-xs'
                  : isDarkDashboard
                  ? 'bg-[#111C16] border-[#1E3126] text-[#C6DFD0]'
                  : 'bg-white border-[#DCE3DD] text-[#141E18]'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge !== 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                    active
                      ? 'bg-[#A6F2C6] text-[#163A2B]'
                      : isDarkDashboard
                      ? 'bg-[#1C3025] text-[#A6F2C6]'
                      : 'bg-[#E6EFE9] text-[#163A2B]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          BOTTOM ROW:
          - On 7"+ Tablets (md:grid-cols-3): All 3 Scrollable Widgets side-by-side
          - Works seamlessly in both Dark Mode and Light Mode!
         ==================================================================== */}
      <div className="mt-2.5 sm:mt-3 md:flex-1 md:min-h-0 grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5 md:overflow-hidden pb-2 md:pb-0">
        {/* ================================================================
            WIDGET 1: KOMMANDE AGENDA (KALENDER)
           ================================================================ */}
        <section
          className={`${
            mobileActiveWidget === 'calendar' || mobileActiveWidget === 'all'
              ? 'flex'
              : 'hidden md:flex'
          } rounded-[24px] sm:rounded-[26px] border p-3.5 sm:p-4 flex-col md:min-h-0 md:h-full overflow-hidden shadow-2xs ${cardSurfaceClass}`}
        >
          <div
            className={`flex items-center justify-between gap-2 pb-2.5 border-b shrink-0 ${
              isDarkDashboard ? 'border-[#1E3126]' : 'border-[#E9EFEA]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 ${
                  isDarkDashboard
                    ? 'bg-[#182B21] border-[#284636] text-[#A6F2C6]'
                    : 'm3-tertiary-surface'
                }`}
              >
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider truncate">
                  Kommande agenda
                </h3>
                <p className={`text-[11px] font-medium font-mono tabular-nums ${mutedTextClass}`}>
                  {upcomingEvents.length} inplanerade händelser
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddEventForm((prev) => !prev)}
              className={`min-h-[34px] rounded-xl px-2.5 py-1 text-xs font-extrabold flex items-center gap-1 shrink-0 transition-colors ${
                isDarkDashboard
                  ? 'bg-[#1B3025] hover:bg-[#244031] text-[#A6F2C6]'
                  : 'bg-[#E6EFE9] hover:bg-[#D5E6DC] text-[#163A2B]'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddEventForm ? 'Stäng' : 'Ny'}</span>
            </button>
          </div>

          {showAddEventForm && (
            <form
              onSubmit={handleQuickAddEvent}
              className={`mt-2.5 rounded-2xl border p-2.5 space-y-2 shrink-0 ${subCardSurfaceClass}`}
            >
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Händelse (t.ex. Fotbollsträning)..."
                className={`w-full rounded-xl border px-3 py-1.5 text-xs font-bold focus:outline-none ${inputSurfaceClass}`}
              />
              <div className="grid grid-cols-3 gap-1.5">
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className={`rounded-xl border px-2 py-1.5 text-[11px] font-mono tabular-nums font-bold ${inputSurfaceClass}`}
                />
                <input
                  type="time"
                  value={newEventStart}
                  onChange={(e) => setNewEventStart(e.target.value)}
                  className={`rounded-xl border px-2 py-1.5 text-[11px] font-mono tabular-nums font-bold ${inputSurfaceClass}`}
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#163A2B] text-[#A6F2C6] text-xs font-extrabold py-1.5 px-3 hover:bg-[#1E4B38]"
                >
                  Spara
                </button>
              </div>
            </form>
          )}

          <div className="mt-2.5 max-h-[280px] md:max-h-none md:flex-1 md:min-h-0 overflow-y-auto pr-1 space-y-2">
            {upcomingEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 px-4">
                <Calendar className={`h-8 w-8 mb-2 ${mutedTextClass}`} />
                <p className={`text-xs font-bold ${mutedTextClass}`}>
                  Inga kommande händelser i kalendern.
                </p>
              </div>
            ) : (
              upcomingEvents.map((evt) => {
                const cat = categories.find((c) => c.id === evt.categoryId);
                const isToday = evt.date === todayStr;
                return (
                  <div
                    key={evt.id}
                    className={`rounded-2xl border p-2.5 sm:p-3 flex items-center justify-between gap-2.5 transition-colors ${
                      isToday
                        ? isDarkDashboard
                          ? 'bg-[#172C21] border-[#2E5942]'
                          : 'bg-[#F3FAF6] border-[#B8DEC6]'
                        : subCardSurfaceClass
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="mt-1 h-7 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat?.colorHex || '#A6F2C6' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-extrabold uppercase ${
                              isToday
                                ? 'bg-[#163A2B] text-[#A6F2C6]'
                                : isDarkDashboard
                                ? 'bg-[#21362B] text-[#B8DEC6]'
                                : 'bg-[#E6EFE9] text-[#2E4035]'
                            }`}
                          >
                            {isToday ? 'IDAG' : evt.date.slice(5)}
                          </span>
                          <span
                            className={`text-xs font-mono tabular-nums font-extrabold ${
                              isDarkDashboard ? 'text-[#A6F2C6]' : 'text-[#163A2B]'
                            }`}
                          >
                            {evt.isAllDay
                              ? 'Heldag'
                              : `${evt.startTime}–${evt.endTime}`}
                          </span>
                          {evt.assignee && (
                            <span className={`text-[10px] font-bold ${mutedTextClass}`}>
                              · {evt.assignee}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-sm font-extrabold truncate">
                          {evt.title}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteEventDirect(evt.id)}
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                        isDarkDashboard
                          ? 'bg-[#111C16] hover:bg-[#1E3327] border-[#263E31] text-[#96B8A4] hover:text-[#A6F2C6]'
                          : 'bg-white hover:bg-[#E6EFE9] border-[#DCE3DD] text-[#54685C] hover:text-[#163A2B]'
                      }`}
                      title="Bocka av / ta bort händelse"
                      aria-label={`Bocka av ${evt.title}`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ================================================================
            WIDGET 2: INKÖPSLISTA
           ================================================================ */}
        <section
          className={`${
            mobileActiveWidget === 'shopping' || mobileActiveWidget === 'all'
              ? 'flex'
              : 'hidden md:flex'
          } order-first md:order-none rounded-[24px] sm:rounded-[26px] border p-3.5 sm:p-4 flex-col md:min-h-0 md:h-full overflow-hidden shadow-2xs ${cardSurfaceClass}`}
        >
          <div
            className={`flex items-center justify-between gap-2 pb-2.5 border-b shrink-0 ${
              isDarkDashboard ? 'border-[#1E3126]' : 'border-[#E9EFEA]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 ${
                  isDarkDashboard
                    ? 'bg-[#182B21] border-[#284636] text-[#A6F2C6]'
                    : 'm3-secondary-surface'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider truncate">
                  Inköpslista
                </h3>
                <p className={`text-[11px] font-medium font-mono tabular-nums ${mutedTextClass}`}>
                  {uncheckedShoppingCount} kvar att handla
                </p>
              </div>
            </div>

            {checkedShoppingCount > 0 && (
              <button
                type="button"
                onClick={onClearCheckedShopping}
                className="min-h-[34px] rounded-xl bg-[#FDE8E8] hover:bg-[#FBD5D5] px-2.5 py-1 text-[11px] font-extrabold text-[#9E2A2B] flex items-center gap-1 shrink-0 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Rensa ({checkedShoppingCount})</span>
              </button>
            )}
          </div>

          <form
            onSubmit={handleQuickAddShopping}
            className="mt-2.5 flex items-center gap-1.5 shrink-0"
          >
            <input
              type="text"
              value={newShoppingName}
              onChange={(e) => setNewShoppingName(e.target.value)}
              placeholder="+ Lägg till vara (t.ex. Mjölk)..."
              className={`flex-1 min-w-0 rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none ${inputSurfaceClass}`}
            />
            <input
              type="number"
              min="1"
              value={newShoppingAmount}
              onChange={(e) => setNewShoppingAmount(e.target.value)}
              className={`w-11 rounded-xl border px-1.5 py-2 text-center text-xs font-mono tabular-nums font-bold ${inputSurfaceClass}`}
              aria-label="Antal"
            />
            <button
              type="submit"
              className="min-h-[36px] rounded-xl bg-[#163A2B] hover:bg-[#1E4B38] px-3 py-2 text-xs font-extrabold text-[#A6F2C6] shrink-0 transition-colors"
            >
              Lägg till
            </button>
          </form>

          <div className="mt-2.5 max-h-[280px] md:max-h-none md:flex-1 md:min-h-0 overflow-y-auto pr-1 space-y-1.5">
            {sortedShopping.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 px-4">
                <ShoppingCart className={`h-8 w-8 mb-2 ${mutedTextClass}`} />
                <p className={`text-xs font-bold ${mutedTextClass}`}>
                  Inköpslistan är tom. Lägg till varor direkt ovanför!
                </p>
              </div>
            ) : (
              sortedShopping.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleShoppingChecked(item.id)}
                  className={`w-full text-left rounded-2xl border px-3 py-2.5 flex items-center justify-between gap-2 transition-all ${
                    item.checked
                      ? isDarkDashboard
                        ? 'bg-[#0E1712] border-[#192920] text-[#5C7A69]'
                        : 'bg-[#F5F7F5] border-[#E5ECE7] text-[#7B8E82]'
                      : subCardSurfaceClass
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`h-5 w-5 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                        item.checked
                          ? 'bg-[#163A2B] border-[#2A6349] text-[#A6F2C6]'
                          : isDarkDashboard
                          ? 'bg-[#0D1611] border-[#385947]'
                          : 'bg-white border-[#9BB5A5]'
                      }`}
                    >
                      {item.checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </span>
                    <span
                      className={`text-sm font-extrabold truncate ${
                        item.checked ? 'line-through' : ''
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs font-mono tabular-nums font-extrabold shrink-0 ${
                      isDarkDashboard
                        ? 'bg-[#1D3227] text-[#A6F2C6]'
                        : 'bg-[#E6EFE9] text-[#163A2B]'
                    }`}
                  >
                    {item.amount} {item.unit}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* ================================================================
            WIDGET 3: ATT GÖRA & FÄSTA ANTECKNINGAR
           ================================================================ */}
        <section
          className={`${
            mobileActiveWidget === 'todo' || mobileActiveWidget === 'all'
              ? 'flex'
              : 'hidden md:flex'
          } rounded-[24px] sm:rounded-[26px] border p-3.5 sm:p-4 flex-col md:min-h-0 md:h-full overflow-hidden shadow-2xs ${cardSurfaceClass}`}
        >
          <div
            className={`flex items-center justify-between gap-2 pb-2.5 border-b shrink-0 ${
              isDarkDashboard ? 'border-[#1E3126]' : 'border-[#E9EFEA]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isDarkDashboard
                    ? 'bg-[#182B21] text-[#A6F2C6]'
                    : 'bg-[#E6EFE9] text-[#163A2B]'
                }`}
              >
                <CheckSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider truncate">
                  Att göra & Notis
                </h3>
                <p className={`text-[11px] font-medium font-mono tabular-nums ${mutedTextClass}`}>
                  {openTodosCount} uppgifter · {notes.length} notiser
                </p>
              </div>
            </div>

            <div
              className={`flex items-center rounded-xl p-0.5 text-[11px] font-extrabold shrink-0 ${
                isDarkDashboard ? 'bg-[#0D1611]' : 'bg-[#F0F4F1]'
              }`}
            >
              {(
                [
                  { id: 'all', label: 'Alla' },
                  { id: 'todo', label: 'Att göra' },
                  { id: 'notes', label: 'Notis' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightColumnFilter(tab.id)}
                  className={`rounded-lg px-2 py-1 transition-colors ${
                    rightColumnFilter === tab.id
                      ? 'bg-[#163A2B] text-[#A6F2C6]'
                      : mutedTextClass
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {rightColumnFilter !== 'notes' && (
            <form
              onSubmit={handleQuickAddTodo}
              className="mt-2.5 flex items-center gap-1.5 shrink-0"
            >
              <input
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder="+ Ny uppgift att bocka av..."
                className={`flex-1 min-w-0 rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none ${inputSurfaceClass}`}
              />
              <select
                value={newTodoPriority}
                onChange={(e) =>
                  setNewTodoPriority(e.target.value as 'high' | 'medium' | 'low')
                }
                className={`rounded-xl border px-2 py-2 text-xs font-extrabold ${inputSurfaceClass}`}
                aria-label="Prioritet"
              >
                <option value="high">Hög</option>
                <option value="medium">Medel</option>
                <option value="low">Låg</option>
              </select>
              <button
                type="submit"
                className="min-h-[36px] rounded-xl bg-[#163A2B] hover:bg-[#1E4B38] px-3 py-2 text-xs font-extrabold text-[#A6F2C6] shrink-0 transition-colors"
              >
                Lägg till
              </button>
            </form>
          )}

          <div className="mt-2.5 max-h-[280px] md:max-h-none md:flex-1 md:min-h-0 overflow-y-auto pr-1 space-y-2">
            {rightColumnFilter !== 'notes' &&
              sortedTodos.map((todo) => (
                <button
                  key={todo.id}
                  type="button"
                  onClick={() => onToggleTodo(todo.id)}
                  className={`w-full text-left rounded-2xl border px-3 py-2.5 flex items-center justify-between gap-2 transition-all ${
                    todo.completed
                      ? isDarkDashboard
                        ? 'bg-[#0E1712] border-[#192920] text-[#5C7A69]'
                        : 'bg-[#F5F7F5] border-[#E5ECE7] text-[#7B8E82]'
                      : subCardSurfaceClass
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`h-5 w-5 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                        todo.completed
                          ? 'bg-[#163A2B] border-[#2A6349] text-[#A6F2C6]'
                          : isDarkDashboard
                          ? 'bg-[#0D1611] border-[#385947]'
                          : 'bg-white border-[#9BB5A5]'
                      }`}
                    >
                      {todo.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </span>
                    <span
                      className={`text-sm font-extrabold truncate ${
                        todo.completed ? 'line-through' : ''
                      }`}
                    >
                      {todo.title}
                    </span>
                  </div>

                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase shrink-0 ${
                      todo.priority === 'high'
                        ? 'bg-[#FDE8E8] text-[#9E2A2B]'
                        : todo.priority === 'medium'
                        ? isDarkDashboard
                          ? 'bg-[#293820] text-[#E6F4B8]'
                          : 'm3-secondary-surface'
                        : isDarkDashboard
                        ? 'bg-[#1D3227] text-[#A6F2C6]'
                        : 'bg-[#E6EFE9] text-[#163A2B]'
                    }`}
                  >
                    {todo.priority === 'high'
                      ? 'Hög'
                      : todo.priority === 'medium'
                      ? 'Medel'
                      : 'Låg'}
                  </span>
                </button>
              ))}

            {rightColumnFilter !== 'todo' &&
              sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className={`rounded-2xl border p-3 space-y-2 ${
                    isDarkDashboard
                      ? 'bg-[#18231B] border-[#2B3E31] text-[#E6F2EB]'
                      : 'bg-[#FFFDF7] border-[#E6DEC8] text-[#141E18]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-[#EAB308] shrink-0" />
                      <h4 className="text-xs font-extrabold truncate">{note.title}</h4>
                    </div>
                    {note.favorite && (
                      <span className="rounded-md bg-[#163A2B] text-[#A6F2C6] px-1.5 py-0.5 text-[10px] font-extrabold">
                        Fäst
                      </span>
                    )}
                  </div>

                  {note.listMode === 'checklist' &&
                  note.checklistItems &&
                  note.checklistItems.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {note.checklistItems.map((ci) => (
                        <button
                          key={ci.id}
                          type="button"
                          onClick={() => onToggleNoteChecklistItem(note.id, ci.id)}
                          className={`w-full text-left flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-bold ${
                            isDarkDashboard
                              ? 'bg-[#111C16] border-[#253B2E] text-[#E6F2EB]'
                              : 'bg-white/80 hover:bg-white border-[#EDE6D3] text-[#141E18]'
                          }`}
                        >
                          <span
                            className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                              ci.checked
                                ? 'bg-[#163A2B] border-[#2A6349] text-[#A6F2C6]'
                                : isDarkDashboard
                                ? 'bg-[#0D1611] border-[#385947]'
                                : 'bg-white border-[#9BB5A5]'
                            }`}
                          >
                            {ci.checked && <Check className="h-3 w-3 stroke-[3]" />}
                          </span>
                          <span className={ci.checked ? 'line-through opacity-60' : ''}>
                            {ci.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-xs opacity-85 leading-relaxed line-clamp-4"
                      dangerouslySetInnerHTML={{ __html: note.contentHtml }}
                    />
                  )}
                </div>
              ))}
          </div>
        </section>
      </div>

      {/* ====================================================================
          PHILIPS HUE BRIDGE & ROOMS SETUP MODAL
         ==================================================================== */}
      {hueSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            className={`w-full max-w-xl max-h-[90vh] rounded-[28px] border shadow-2xl flex flex-col overflow-hidden ${cardSurfaceClass}`}
          >
            <div className="bg-[#163A2B] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Lightbulb className="h-5 w-5 text-[#FACC15] shrink-0" />
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold truncate">
                    Philips Hue i Skärmsläckaren
                  </h2>
                  <p className="text-[11px] text-[#A6F2C6]">
                    {hueIsLive
                      ? `Ansluten till Hue Bridge (${hueConfig.bridgeIp})`
                      : 'Snabbstyrning & lokal Hue Bridge-parkoppling'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHueSettingsOpen(false)}
                className="min-h-[36px] rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-extrabold text-white flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                <span>Stäng</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Step 1: Connect Local Hue Bridge */}
              <div className={`rounded-2xl border p-4 space-y-3 ${subCardSurfaceClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-[#A6F2C6]" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                      Koppla din Philips Hue Bridge (Wi-Fi)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscoverBridge}
                    disabled={huePairingBusy}
                    className="rounded-xl bg-[#163A2B] hover:bg-[#1E4B38] px-2.5 py-1 text-[11px] font-extrabold text-[#A6F2C6] flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${huePairingBusy ? 'animate-spin' : ''}`} />
                    <span>Sök automatiskt</span>
                  </button>
                </div>

                <p className={`text-xs leading-relaxed ${mutedTextClass}`}>
                  1. Kontrollera att surfplattan är på samma Wi-Fi som din Philips Hue Bridge.
                  <br />
                  2. Tryck på den fysiska runda knappen ovanpå din Hue Bridge.
                  <br />
                  3. Klicka på <strong>Parkoppla Hue Bridge</strong> nedan inom 30 sekunder.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={hueBridgeIpInput}
                    onChange={(e) => setHueBridgeIpInput(e.target.value)}
                    placeholder="Hue Bridge IP (t.ex. 192.168.1.50)"
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-mono tabular-nums font-bold focus:outline-none ${inputSurfaceClass}`}
                  />
                  <button
                    type="button"
                    onClick={handlePairBridge}
                    disabled={huePairingBusy}
                    className="min-h-[38px] rounded-xl bg-[#FACC15] hover:bg-[#EAB308] px-3.5 py-2 text-xs font-extrabold text-[#141E18] shrink-0"
                  >
                    Parkoppla Hue Bridge
                  </button>
                </div>

                {huePairingStatus && (
                  <div className="rounded-xl bg-[#163A2B] text-[#A6F2C6] p-3 text-xs font-bold leading-relaxed">
                    {huePairingStatus}
                  </div>
                )}
              </div>

              {/* Step 2: Manage Rooms / Demo Mode */}
              <div className={`rounded-2xl border p-4 space-y-3 ${subCardSurfaceClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[#FACC15]" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                      Rum på skärmsläckaren ({hueRooms.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      launchExternalAppShortcut({
                        id: 'app-hue',
                        name: 'Philips Hue',
                        category: 'Belysning',
                        deepLink: 'philipshue://',
                        webUrl: 'https://account.meethue.com',
                        androidPackage: 'com.philips.lighting.hue2',
                        accentColor: '#FACC15',
                      })
                    }
                    className="rounded-xl bg-[#163A2B] px-2.5 py-1 text-[11px] font-extrabold text-[#A6F2C6] flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Öppna Hue-appen</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {hueRooms.map((room) => {
                    const pct = Math.round((room.bri / 254) * 100);
                    return (
                      <div
                        key={room.id}
                        className={`rounded-xl border px-3 py-2 flex items-center justify-between gap-3 ${cardSurfaceClass}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleHueRoom(room)}
                          className="flex items-center gap-2 text-left min-w-0"
                        >
                          <span
                            className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
                              room.on
                                ? 'bg-[#FACC15] text-[#141E18]'
                                : 'bg-[#24382C] text-[#7A9E89]'
                            }`}
                          >
                            <Lightbulb className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-xs font-extrabold truncate">
                            {room.name}
                          </span>
                        </button>

                        <div className="flex items-center gap-2 w-40">
                          <input
                            type="range"
                            min={5}
                            max={100}
                            value={room.on ? pct : 0}
                            onChange={(e) =>
                              handleChangeHueRoomBrightness(room, Number(e.target.value))
                            }
                            className="flex-1 h-1.5 accent-[#FACC15]"
                          />
                          <span className="w-9 text-right text-[11px] font-mono tabular-nums font-bold">
                            {room.on ? `${pct}%` : 'Av'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!hueIsLive && (
                  <form onSubmit={handleAddDemoRoom} className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newDemoRoomName}
                      onChange={(e) => setNewDemoRoomName(e.target.value)}
                      placeholder="+ Lägg till rum (t.ex. Barnrum, Altan)..."
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none ${inputSurfaceClass}`}
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-[#163A2B] px-3 py-2 text-xs font-extrabold text-[#A6F2C6]"
                    >
                      Lägg till
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ANDRA APPAR & INTEGRATIONER MODAL (App Launcher & Genägar)
         ==================================================================== */}
      {appsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            className={`w-full max-w-xl max-h-[90vh] rounded-[28px] border shadow-2xl flex flex-col overflow-hidden ${cardSurfaceClass}`}
          >
            <div className="bg-[#163A2B] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Grid className="h-5 w-5 text-[#A6F2C6] shrink-0" />
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold truncate">
                    Andra appar & Smarta hem-genvägar
                  </h2>
                  <p className="text-[11px] text-[#A6F2C6]">
                    Starta andra appar direkt från surfplattans skärmsläckare
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppsModalOpen(false)}
                className="min-h-[36px] rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-extrabold text-white flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                <span>Stäng</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {appShortcuts.map((app) => (
                  <div
                    key={app.id}
                    className={`rounded-2xl border p-3 flex flex-col justify-between gap-2 ${subCardSurfaceClass}`}
                  >
                    <div className="flex items-start justify-between gap-1">
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
                          className="text-xs opacity-60 hover:opacity-100"
                          title="Ta bort genväg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => launchExternalAppShortcut(app)}
                      className="w-full rounded-xl bg-[#163A2B] hover:bg-[#1E4B38] py-1.5 px-2.5 text-xs font-extrabold text-[#A6F2C6] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Öppna</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom App / URL Shortcut */}
              <form
                onSubmit={handleAddCustomAppShortcut}
                className={`rounded-2xl border p-4 space-y-2.5 ${subCardSurfaceClass}`}
              >
                <h3 className="text-xs font-extrabold uppercase tracking-wider">
                  + Lägg till egen app eller webbsida på skärmsläckaren
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="Namn (t.ex. SVT Play)"
                    className={`rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none ${inputSurfaceClass}`}
                  />
                  <input
                    type="text"
                    value={newAppUrl}
                    onChange={(e) => setNewAppUrl(e.target.value)}
                    placeholder="Länk eller app-URI (t.ex. svtplay.se)"
                    className={`rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none ${inputSurfaceClass}`}
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newAppCategory}
                      onChange={(e) => setNewAppCategory(e.target.value)}
                      placeholder="Kategori"
                      className={`w-full rounded-xl border px-2.5 py-2 text-xs font-bold focus:outline-none ${inputSurfaceClass}`}
                    />
                    <button
                      type="submit"
                      className="min-h-[36px] rounded-xl bg-[#163A2B] px-3 py-2 text-xs font-extrabold text-[#A6F2C6] shrink-0"
                    >
                      Spara
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          STEP-BY-STEP KITCHEN MODE MODAL (Right inside the Screensaver!)
         ==================================================================== */}
      {kitchenModeOpen && currentRecipe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            className={`w-full max-w-4xl max-h-[90vh] rounded-[28px] sm:rounded-[32px] border shadow-2xl flex flex-col overflow-hidden ${cardSurfaceClass}`}
          >
            <div className="bg-[#163A2B] text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#A6F2C6] truncate">
                  Köksläge · Steg-för-steg utan att lämna skärmsläckaren
                </div>
                <h2 className="text-lg sm:text-2xl font-extrabold mt-0.5 truncate">
                  {currentRecipe.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setKitchenModeOpen(false)}
                className="min-h-[38px] rounded-2xl bg-white/15 hover:bg-white/25 px-3.5 py-2 text-xs font-extrabold text-white flex items-center gap-1.5 shrink-0"
              >
                <X className="h-4 w-4" />
                <span>Stäng</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
              <div className={`md:col-span-5 rounded-3xl border p-4 space-y-3 ${subCardSurfaceClass}`}>
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
                    className="rounded-xl bg-[#163A2B] px-2.5 py-1 text-[11px] font-extrabold text-[#A6F2C6]"
                  >
                    + Lägg i inköpslista
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
                        className={`w-full text-left rounded-xl border px-3 py-2 flex items-center justify-between gap-2 text-xs font-bold ${
                          isChecked ? 'opacity-50 line-through' : ''
                        } ${cardSurfaceClass}`}
                      >
                        <span>{ing.name}</span>
                        <span className="font-mono tabular-nums font-extrabold text-[#A6F2C6] bg-[#163A2B] px-2 py-0.5 rounded-md">
                          {ing.amount} {ing.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`md:col-span-7 rounded-3xl border p-4 space-y-3 ${subCardSurfaceClass}`}>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">
                  Gör så här (Tryck för att bocka av steg)
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
                        className={`w-full text-left rounded-2xl border p-3.5 flex items-start gap-3 transition-colors ${
                          isDone ? 'opacity-55' : ''
                        } ${cardSurfaceClass}`}
                      >
                        <span
                          className={`h-6 w-6 rounded-lg font-mono tabular-nums text-xs font-extrabold flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-[#163A2B] text-[#A6F2C6]'
                              : 'bg-[#214E3B] text-[#A6F2C6]'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </span>
                        <span
                          className={`text-sm font-medium leading-relaxed ${
                            isDone ? 'line-through' : ''
                          }`}
                        >
                          {step}
                        </span>
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
