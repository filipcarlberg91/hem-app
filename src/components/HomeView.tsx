import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckSquare,
  CloudSun,
  Wind,
  ArrowRight,
  Check,
  ShoppingBag,
  UtensilsCrossed,
  StickyNote,
  Wallet,
  RefreshCw,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Cloud,
  Droplets,
  Image as ImageIcon,
  X,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CalendarEvent,
  EventCategory,
  TodoItem,
  NoteItem,
  ShoppingItem,
  RecipeItem,
  BudgetMonth,
  GothenburgWeather,
  NavTab,
  PhotoItem,
  PhotoAlbum,
} from '../types';
import { getTodayDateString } from '../data/initialData';

export type BentoCardId =
  | 'shopping'
  | 'todo'
  | 'photos'
  | 'recipes'
  | 'calendar'
  | 'notes'
  | 'budget';

export type BentoCardSize = 'large' | 'small';

const DEFAULT_BENTO_ORDER: BentoCardId[] = [
  'shopping',
  'todo',
  'photos',
  'recipes',
  'calendar',
  'notes',
  'budget',
];

const DEFAULT_BENTO_SIZES: Record<BentoCardId, BentoCardSize> = {
  shopping: 'large',
  todo: 'large',
  photos: 'large',
  recipes: 'large',
  calendar: 'large',
  notes: 'large',
  budget: 'large',
};

const BENTO_ORDER_STORAGE_KEY = 'hem_home_bento_order_v1';
const BENTO_SIZES_STORAGE_KEY = 'hem_home_bento_sizes_v1';
const HOME_SELECTED_ALBUM_KEY = 'hem_home_selected_album_id_v1';
const HOME_ALBUM_PHOTO_IDX_KEY = 'hem_home_album_photo_idx_v1';

function loadBentoOrder(): BentoCardId[] {
  try {
    const raw = localStorage.getItem(BENTO_ORDER_STORAGE_KEY);
    if (!raw) return DEFAULT_BENTO_ORDER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_BENTO_ORDER;
    const valid = parsed.filter((id): id is BentoCardId =>
      DEFAULT_BENTO_ORDER.includes(id as BentoCardId)
    );
    for (const defId of DEFAULT_BENTO_ORDER) {
      if (!valid.includes(defId)) valid.push(defId);
    }
    return valid;
  } catch {
    return DEFAULT_BENTO_ORDER;
  }
}

function loadBentoSizes(): Record<BentoCardId, BentoCardSize> {
  try {
    const raw = localStorage.getItem(BENTO_SIZES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BENTO_SIZES };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_BENTO_SIZES };
    const result: Record<BentoCardId, BentoCardSize> = { ...DEFAULT_BENTO_SIZES };
    for (const id of DEFAULT_BENTO_ORDER) {
      if (parsed[id] === 'small' || parsed[id] === 'large') {
        result[id] = parsed[id];
      }
    }
    return result;
  } catch {
    return { ...DEFAULT_BENTO_SIZES };
  }
}

interface HomeViewProps {
  events: CalendarEvent[];
  categories: EventCategory[];
  todos: TodoItem[];
  notes: NoteItem[];
  shopping: ShoppingItem[];
  recipes: RecipeItem[];
  budgetMonths: BudgetMonth[];
  photos?: PhotoItem[];
  photoAlbums?: PhotoAlbum[];
  onNavigate: (tab: NavTab) => void;
  onToggleTodo: (id: string) => void;
  onToggleFavoriteTodo?: (id: string) => void;
  onToggleFavoriteNote?: (id: string) => void;
  onToggleFavoriteShopping?: (id: string) => void;
  onToggleFavoriteRecipe?: (id: string) => void;
  onToggleShoppingChecked: (id: string) => void;
  isGoogleConnected: boolean;
  onSyncAll: () => void;
  isSyncing: boolean;
  isEditingLayout?: boolean;
  onCloseEditingLayout?: () => void;
}

function getSwedishWeatherDescription(code: number): string {
  if (code === 0) return 'Klart och soligt';
  if (code === 1 || code === 2) return 'Lätt molnighet';
  if (code === 3) return 'Mulet';
  if (code === 45 || code === 48) return 'Dimma över älven';
  if (code >= 51 && code <= 57) return 'Duggregn';
  if (code >= 61 && code <= 67) return 'Regnskurar';
  if (code >= 71 && code <= 77) return 'Snöfall';
  if (code >= 80 && code <= 82) return 'Växlande regnskurar';
  if (code >= 95) return 'Åskväder';
  return 'Göteborgsväder';
}

function getWeatherIcon(code: number, className = 'h-5 w-5') {
  if (code === 0) return <Sun className={`${className} text-[#F59E0B]`} />;
  if (code === 1 || code === 2) return <CloudSun className={`${className} text-[#0891B2]`} />;
  if (code === 3 || code === 45 || code === 48) return <Cloud className={`${className} text-[#64748B]`} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className={`${className} text-[#0066FF]`} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={`${className} text-[#38BDF8]`} />;
  if (code >= 95) return <CloudLightning className={`${className} text-[#7C3AED]`} />;
  return <CloudSun className={className} />;
}

interface HourlyForecastItem {
  time: string;
  hourLabel: string;
  temp: number;
  weatherCode: number;
  precipProb: number;
  windSpeed: number;
}

interface DailyForecastItem {
  date: string;
  dayName: string;
  dateShort: string;
  weatherCode: number;
  description: string;
  maxTemp: number;
  minTemp: number;
  precipSum: number;
  precipProb: number;
  maxWind: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  events,
  categories,
  todos,
  notes,
  shopping,
  recipes,
  budgetMonths,
  photos = [],
  photoAlbums = [],
  onNavigate,
  onToggleTodo,
  onToggleShoppingChecked,
  isGoogleConnected,
  onSyncAll,
  isSyncing,
  isEditingLayout = false,
  onCloseEditingLayout,
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [weather, setWeather] = useState<GothenburgWeather>({
    temperature: 12,
    apparentTemperature: 10,
    windSpeed: 5.4,
    weatherCode: 2,
    description: 'Lätt molnighet',
    highTemp: 14,
    lowTemp: 8,
    updatedAt: 'Nu',
  });
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastItem[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecastItem[]>([]);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [weatherTab, setWeatherTab] = useState<'today' | '10days'>('today');

  // Bento Grid Ordering & Card Sizes (Stor = 'large', Liten = 'small')
  const [bentoOrder, setBentoOrder] = useState<BentoCardId[]>(() => loadBentoOrder());
  const [bentoSizes, setBentoSizes] = useState<Record<BentoCardId, BentoCardSize>>(() =>
    loadBentoSizes()
  );

  // Selected Photo Album for Start Page & Rotating Photo Index
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(HOME_SELECTED_ALBUM_KEY);
      if (saved) return saved;
    } catch {
      // Ignore
    }
    return 'all';
  });
  const [showAlbumPickerModal, setShowAlbumPickerModal] = useState(false);

  // Advance the rotating photo index every time HomeView mounts (i.e. whenever user returns to the start page)
  const [rotatingPhotoIndex, setRotatingPhotoIndex] = useState<number>(() => {
    try {
      const prevRaw = localStorage.getItem(HOME_ALBUM_PHOTO_IDX_KEY);
      const prevIdx = prevRaw ? parseInt(prevRaw, 10) : -1;
      const nextIdx = Number.isNaN(prevIdx) ? 0 : prevIdx + 1;
      localStorage.setItem(HOME_ALBUM_PHOTO_IDX_KEY, String(nextIdx));
      return nextIdx;
    } catch {
      return 0;
    }
  });

  // If selectedAlbumId is no longer valid (e.g. album was deleted), fallback cleanly
  useEffect(() => {
    if (selectedAlbumId !== 'all' && !photoAlbums.some((a) => a.id === selectedAlbumId)) {
      if (photoAlbums.length > 0) {
        setSelectedAlbumId(photoAlbums[0].id);
      } else {
        setSelectedAlbumId('all');
      }
    }
  }, [selectedAlbumId, photoAlbums]);

  const handleSelectHomeAlbum = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setRotatingPhotoIndex((prev) => prev + 1);
    setShowAlbumPickerModal(false);
    try {
      localStorage.setItem(HOME_SELECTED_ALBUM_KEY, albumId);
    } catch {
      // Ignore
    }
  };

  const saveNewBentoOrder = (nextOrder: BentoCardId[]) => {
    setBentoOrder(nextOrder);
    try {
      localStorage.setItem(BENTO_ORDER_STORAGE_KEY, JSON.stringify(nextOrder));
    } catch {
      // Ignore
    }
  };

  const saveNewBentoSizes = (nextSizes: Record<BentoCardId, BentoCardSize>) => {
    setBentoSizes(nextSizes);
    try {
      localStorage.setItem(BENTO_SIZES_STORAGE_KEY, JSON.stringify(nextSizes));
    } catch {
      // Ignore
    }
  };

  const toggleCardSize = (cardId: BentoCardId) => {
    const nextSize: BentoCardSize = bentoSizes[cardId] === 'small' ? 'large' : 'small';
    saveNewBentoSizes({
      ...bentoSizes,
      [cardId]: nextSize,
    });
  };

  const moveCardInOrder = (cardId: BentoCardId, direction: -1 | 1) => {
    const idx = bentoOrder.indexOf(cardId);
    if (idx < 0) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= bentoOrder.length) return;
    const next = [...bentoOrder];
    const [removed] = next.splice(idx, 1);
    next.splice(targetIdx, 0, removed);
    saveNewBentoOrder(next);
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchGothenburgWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=57.7089&longitude=11.9746&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&forecast_days=11&timezone=Europe%2FStockholm'
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
          highTemp: Math.round(data.daily?.temperature_2m_max?.[0] ?? data.current.temperature_2m + 2),
          lowTemp: Math.round(data.daily?.temperature_2m_min?.[0] ?? data.current.temperature_2m - 3),
          updatedAt: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
        });

        if (data.hourly && Array.isArray(data.hourly.time)) {
          const todayPrefix = getTodayDateString();
          const todayHours: HourlyForecastItem[] = [];
          for (let i = 0; i < data.hourly.time.length; i++) {
            const tStr: string = data.hourly.time[i];
            if (tStr.startsWith(todayPrefix) || todayHours.length < 24) {
              if (todayHours.length < 24) {
                todayHours.push({
                  time: tStr,
                  hourLabel: tStr.slice(11, 16),
                  temp: Math.round(Number(data.hourly.temperature_2m?.[i] ?? 12)),
                  weatherCode: Number(data.hourly.weather_code?.[i] ?? 2),
                  precipProb: Number(data.hourly.precipitation_probability?.[i] ?? 0),
                  windSpeed: Math.round(Number(data.hourly.wind_speed_10m?.[i] ?? 4) * 10) / 10,
                });
              }
            }
          }
          setHourlyForecast(todayHours);
        }

        if (data.daily && Array.isArray(data.daily.time)) {
          const daysList: DailyForecastItem[] = data.daily.time.map(
            (dateStr: string, idx: number): DailyForecastItem => {
              const dObj = new Date(`${dateStr}T12:00:00`);
              const wCode = Number(data.daily.weather_code?.[idx] ?? 2);
              const weekday = dObj.toLocaleDateString('sv-SE', { weekday: 'long' });
              const dateShort = dObj.toLocaleDateString('sv-SE', {
                day: 'numeric',
                month: 'short',
              });
              return {
                date: dateStr,
                dayName:
                  idx === 0
                    ? 'Idag'
                    : idx === 1
                    ? 'Imorgon'
                    : weekday.charAt(0).toUpperCase() + weekday.slice(1),
                dateShort,
                weatherCode: wCode,
                description: getSwedishWeatherDescription(wCode),
                maxTemp: Math.round(Number(data.daily.temperature_2m_max?.[idx] ?? 14)),
                minTemp: Math.round(Number(data.daily.temperature_2m_min?.[idx] ?? 8)),
                precipSum: Math.round(Number(data.daily.precipitation_sum?.[idx] ?? 0) * 10) / 10,
                precipProb: Number(data.daily.precipitation_probability_max?.[idx] ?? 0),
                maxWind: Math.round(Number(data.daily.wind_speed_10m_max?.[idx] ?? 5) * 10) / 10,
              };
            }
          );
          setDailyForecast(daysList);
        }
      } catch {
        // Offline fallback keeps cached/default Gothenburg values
      }
    };
    fetchGothenburgWeather();
    return () => {
      active = false;
    };
  }, []);

  const todayStr = getTodayDateString();
  const formattedDate = now.toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = now.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 1. Kalender: Next upcoming event + 3-4 upcoming/latest events
  const allUpcomingEvents = [...events]
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
  const upcomingEvents = allUpcomingEvents.slice(0, 4);
  const nextEvent = upcomingEvents[0] || null;

  // 2. Inköpslista: 4 latest un-checked items (or latest items if all checked)
  const uncheckedShopping = shopping.filter((s) => !s.checked);
  const recentShopping = (uncheckedShopping.length > 0 ? uncheckedShopping : shopping).slice(0, 4);

  // 3. Att göra: 4 latest uncompleted tasks
  const uncompletedTodos = todos.filter((t) => !t.completed);
  const recentTodos = (uncompletedTodos.length > 0 ? uncompletedTodos : todos).slice(0, 4);

  // 4. Foton & Album: Filter photos by chosen album and pick 1 rotating photo for this visit
  const activeAlbumObj =
    selectedAlbumId === 'all'
      ? null
      : photoAlbums.find((a) => a.id === selectedAlbumId) || null;
  const albumFilteredPhotos =
    selectedAlbumId === 'all'
      ? photos
      : photos.filter((p) => p.albumId === selectedAlbumId);
  const displayPhotosPool =
    albumFilteredPhotos.length > 0 ? albumFilteredPhotos : photos;
  const activeRotatingPhoto =
    displayPhotosPool.length > 0
      ? displayPhotosPool[Math.abs(rotatingPhotoIndex) % displayPhotosPool.length]
      : null;

  // 5. Recept: 3-4 latest recipes
  const recentRecipes = recipes.slice(0, 4);

  // 6. Anteckningar: 3-4 most recently updated/created notes
  const recentNotes = [...notes]
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 4);

  // 7. Budget: Current month summary + 3 latest entries
  const currentMonth = budgetMonths[0];
  const totalIncome = currentMonth
    ? currentMonth.entries.filter((e) => e.type === 'income').reduce((acc, e) => acc + e.amount, 0)
    : 0;
  const totalExpense = currentMonth
    ? currentMonth.entries.filter((e) => e.type === 'expense').reduce((acc, e) => acc + e.amount, 0)
    : 0;
  const netBalance = totalIncome - totalExpense;
  const expenseRatio =
    totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0;
  const recentBudgetEntries = currentMonth
    ? [...currentMonth.entries].slice(-3).reverse()
    : [];

  // Render an individual Bento card in SMALL ('small') Material 3 Expressive number-badge mode
  const renderSmallBentoCardContent = (cardId: BentoCardId) => {
    switch (cardId) {
      case 'shopping':
        return (
          <div
            onClick={() => {
              if (!isEditingLayout) onNavigate('shopping');
            }}
            className="rounded-3xl bg-white border border-[#D5E5DC] p-4 sm:p-5 flex flex-col justify-between h-full min-h-[172px] shadow-2xs cursor-pointer hover:border-[#183D2C] transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#D6EEF8] text-[#1D5B79]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="h-8 w-8 rounded-full bg-[#F2F9F5] group-hover:bg-[#D8F3E3] flex items-center justify-center text-[#183D2C] transition-colors">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3">
              <div className="inline-flex items-baseline gap-2 rounded-[22px] bg-[#E8F6FD] px-3.5 py-1.5 text-[#12455E]">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight leading-none">
                  {uncheckedShopping.length}
                </span>
                <span className="text-[11px] font-extrabold">varor</span>
              </div>
              <h2 className="mt-2 text-sm sm:text-base font-extrabold text-[#141E18] truncate">
                Inköpslista
              </h2>
              <p className="text-[11px] text-[#54685C] truncate">
                {uncheckedShopping.length === 0 ? 'Allt avbockat' : 'Att handla'}
              </p>
            </div>
          </div>
        );

      case 'todo': {
        const highCount = uncompletedTodos.filter((t) => t.priority === 'high').length;
        return (
          <div
            onClick={() => {
              if (!isEditingLayout) onNavigate('todo');
            }}
            className="rounded-3xl bg-white border border-[#D5E5DC] p-4 sm:p-5 flex flex-col justify-between h-full min-h-[172px] shadow-2xs cursor-pointer hover:border-[#183D2C] transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#D8F3E3] text-[#183D2C]">
                <CheckSquare className="h-5 w-5" />
              </div>
              <span className="h-8 w-8 rounded-full bg-[#F2F9F5] group-hover:bg-[#D8F3E3] flex items-center justify-center text-[#183D2C] transition-colors">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3">
              <div className="inline-flex items-baseline gap-2 rounded-[22px] bg-[#D8F3E3] px-3.5 py-1.5 text-[#082114]">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight leading-none">
                  {uncompletedTodos.length}
                </span>
                <span className="text-[11px] font-extrabold">kvar</span>
              </div>
              <h2 className="mt-2 text-sm sm:text-base font-extrabold text-[#141E18] truncate">
                Att göra
              </h2>
              <p className="text-[11px] text-[#54685C] truncate">
                {highCount > 0 ? `${highCount} med hög prio` : 'Uppgifter i listan'}
              </p>
            </div>
          </div>
        );
      }

      case 'photos':
        return (
          <div
            onClick={() => {
              if (!isEditingLayout) onNavigate('photos');
            }}
            className="rounded-3xl bg-[#183D2C] border border-[#D5E5DC] overflow-hidden relative min-h-[172px] p-4 sm:p-5 flex flex-col justify-between h-full shadow-2xs cursor-pointer group"
          >
            {activeRotatingPhoto ? (
              <img
                src={activeRotatingPhoto.imageUrl}
                alt={activeRotatingPhoto.caption || 'Familjefoto'}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#23573F] via-[#3A6B52] to-[#C87D55]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />

            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-black/45 backdrop-blur-xs text-[#A6F2C6] border border-white/20">
                <ImageIcon className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAlbumPickerModal(true);
                }}
                className="h-8 px-2.5 rounded-xl bg-white/90 hover:bg-white text-[#183D2C] text-[11px] font-extrabold flex items-center gap-1 shadow-xs"
                title="Välj album"
              >
                <FolderOpen className="h-3 w-3" />
                <span>Album</span>
              </button>
            </div>

            <div className="relative z-10 mt-3">
              <div className="inline-flex items-baseline gap-1.5 rounded-[22px] bg-[#A6F2C6] px-3 py-1 text-[#082114]">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight leading-none">
                  {displayPhotosPool.length}
                </span>
                <span className="text-[11px] font-extrabold">foton</span>
              </div>
              <h2 className="mt-1.5 text-sm sm:text-base font-extrabold text-white truncate">
                {activeAlbumObj ? activeAlbumObj.name : 'Bilder & Album'}
              </h2>
            </div>
          </div>
        );

      case 'recipes':
        return (
          <div
            onClick={() => {
              if (!isEditingLayout) onNavigate('recipes');
            }}
            className="rounded-3xl bg-white border border-[#D5E5DC] p-4 sm:p-5 flex flex-col justify-between h-full min-h-[172px] shadow-2xs cursor-pointer hover:border-[#183D2C] transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAE2FA] text-[#5C4389]">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="h-8 w-8 rounded-full bg-[#F2F9F5] group-hover:bg-[#D8F3E3] flex items-center justify-center text-[#183D2C] transition-colors">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3">
              <div className="inline-flex items-baseline gap-2 rounded-[22px] bg-[#EAE2FA] px-3.5 py-1.5 text-[#432C6E]">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight leading-none">
                  {recipes.length}
                </span>
                <span className="text-[11px] font-extrabold">recept</span>
              </div>
              <h2 className="mt-2 text-sm sm:text-base font-extrabold text-[#141E18] truncate">
                Recept
              </h2>
              <p className="text-[11px] text-[#54685C] truncate">
                Sparade i samlingen
              </p>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div
            onClick={() => {
              if (!isEditingLayout) onNavigate('calendar');
            }}
            className="rounded-3xl bg-white border border-[#D5E5DC] p-4 sm:p-5 flex flex-col justify-between h-full min-h-[172px] shadow-2xs cursor-pointer hover:border-[#183D2C] transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#D8F3E3] text-[#183D2C]">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="h-8 w-8 rounded-full bg-[#F2F9F5] group-hover:bg-[#D8F3E3] flex items-center justify-center text-[#183D2C] transition-colors">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3">
              <div className="inline-flex items-baseline gap-2 rounded-[22px] bg-[#183D2C] px-3.5 py-1.5 text-[#A6F2C6]">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight leading-none">
                  {allUpcomingEvents.length}
                </span>
                <span className="text-[11px] font-extrabold text-white">bokade</span>
              </div>
              <h2 className="mt-2 text-sm sm:text-base font-extrabold text-[#141E18] truncate">
                Kalender
              </h2>
              <p className="text-[11px] text-[#54685C] truncate">
                {nextEvent ? `Nästa: ${nextEvent.startTime}` : 'Inga kommande'}
              </p>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div
            onClick={() => {
              if (!isEditingLayout) onNavigate('notes');
            }}
            className="rounded-3xl bg-[#FFFDF7] border border-[#E8DFB5] p-4 sm:p-5 flex flex-col justify-between h-full min-h-[172px] shadow-2xs cursor-pointer hover:border-[#7A4F2B] transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FCE8D5] text-[#7A4F2B]">
                <StickyNote className="h-5 w-5" />
              </div>
              <span className="h-8 w-8 rounded-full bg-[#FAF3DE] group-hover:bg-[#FCE8D5] flex items-center justify-center text-[#7A4F2B] transition-colors">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3">
              <div className="inline-flex items-baseline gap-2 rounded-[22px] bg-[#FCE8D5] px-3.5 py-1.5 text-[#5E3A1C]">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight leading-none">
                  {notes.length}
                </span>
                <span className="text-[11px] font-extrabold">st</span>
              </div>
              <h2 className="mt-2 text-sm sm:text-base font-extrabold text-[#141E18] truncate">
                Anteckningar
              </h2>
              <p className="text-[11px] text-[#54685C] truncate">
                Listor & kom-ihåg
              </p>
            </div>
          </div>
        );

      case 'budget': {
        const entryCount = currentMonth ? currentMonth.entries.length : 0;
        return (
          <div
            onClick={() => {
              if (!isEditingLayout) onNavigate('budget');
            }}
            className="rounded-3xl bg-[#EBF4EE] border border-[#CDE0D4] p-4 sm:p-5 flex flex-col justify-between h-full min-h-[172px] shadow-2xs cursor-pointer hover:border-[#183D2C] transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#183D2C] text-white">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="h-8 w-8 rounded-full bg-white/80 group-hover:bg-white flex items-center justify-center text-[#183D2C] transition-colors">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3">
              <div className="inline-flex items-baseline gap-1.5 rounded-[22px] bg-white border border-[#CDE0D4] px-3.5 py-1.5 text-[#183D2C]">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight leading-none">
                  {entryCount}
                </span>
                <span className="text-[11px] font-extrabold">poster</span>
              </div>
              <h2 className="mt-2 text-sm sm:text-base font-extrabold text-[#141E18] truncate">
                Budget
              </h2>
              <p className="text-[11px] font-mono tabular-nums text-[#21513B] font-bold truncate">
                {netBalance.toLocaleString('sv-SE')} kr kvar
              </p>
            </div>
          </div>
        );
      }
    }
  };

  // Render an individual Bento card by ID and size ('large' vs 'small')
  const renderBentoCardContent = (cardId: BentoCardId, size: BentoCardSize) => {
    if (size === 'small') {
      return renderSmallBentoCardContent(cardId);
    }

    switch (cardId) {
      case 'shopping':
        return (
          <div className="rounded-3xl bg-white border border-[#D5E5DC] p-5 sm:p-6 flex flex-col justify-between h-full shadow-2xs">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D6EEF8] text-[#1D5B79]">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold text-[#141E18] truncate">
                      Inköpslista
                    </h2>
                    <p className="text-xs text-[#54685C] truncate">
                      {uncheckedShopping.length === 0
                        ? 'Alla varor är avbockade'
                        : `${uncheckedShopping.length} varor kvar att handla`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('shopping')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-[#EAF5EE] flex items-center gap-1 shrink-0"
                >
                  <span>Öppna</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {recentShopping.length === 0 ? (
                  <div className="rounded-2xl bg-[#F6FBF7] p-5 text-center text-xs text-[#54685C]">
                    Inköpslistan är tom just nu.
                  </div>
                ) : (
                  recentShopping.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!isEditingLayout) onToggleShoppingChecked(item.id);
                      }}
                      className="rounded-2xl bg-[#F6FBF7] hover:bg-[#EBF5EE] border border-[#DCEAE1] px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                            item.checked
                              ? 'bg-[#183D2C] border-[#183D2C] text-white'
                              : 'border-[#183D2C] bg-white'
                          }`}
                        >
                          {item.checked && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <span
                          className={`text-sm font-bold truncate ${
                            item.checked ? 'line-through text-[#6A7F72]' : 'text-[#141E18]'
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-[#54685C] shrink-0">
                        {item.amount} {item.unit}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('shopping')}
              className="mt-4 w-full min-h-[42px] rounded-2xl bg-[#E4F3EA] hover:bg-[#D5EBDD] px-4 py-2 text-xs font-extrabold text-[#183D2C] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>+ Lägg till eller visa alla varor</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        );

      case 'todo':
        return (
          <div className="rounded-3xl bg-white border border-[#D5E5DC] p-5 sm:p-6 flex flex-col justify-between h-full shadow-2xs">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D8F3E3] text-[#183D2C]">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold text-[#141E18] truncate">
                      Att göra
                    </h2>
                    <p className="text-xs text-[#54685C] truncate">
                      {uncompletedTodos.length === 0
                        ? 'Alla uppgifter avklarade!'
                        : `${uncompletedTodos.length} uppgifter kvar`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('todo')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-[#EAF5EE] flex items-center gap-1 shrink-0"
                >
                  <span>Öppna</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {recentTodos.length === 0 ? (
                  <div className="rounded-2xl bg-[#F6FBF7] p-5 text-center text-xs text-[#54685C]">
                    Inga uppgifter på listan.
                  </div>
                ) : (
                  recentTodos.map((task) => {
                    const isHigh = task.priority === 'high';
                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          if (!isEditingLayout) onToggleTodo(task.id);
                        }}
                        className={`rounded-2xl border px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isHigh && !task.completed
                            ? 'bg-[#FFF8F6] border-[#F5D0C5] hover:bg-[#FDECE8]'
                            : 'bg-[#F6FBF7] border-[#DCEAE1] hover:bg-[#EBF5EE]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              task.completed
                                ? 'bg-[#183D2C] border-[#183D2C] text-white'
                                : isHigh
                                ? 'border-[#B42318] bg-white'
                                : 'border-[#183D2C] bg-white'
                            }`}
                          >
                            {task.completed && <Check className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`text-sm font-bold truncate ${
                                task.completed ? 'line-through text-[#6A7F72]' : 'text-[#141E18]'
                              }`}
                            >
                              {task.title}
                            </div>
                            <div
                              className={`text-[11px] font-mono tabular-nums truncate ${
                                isHigh && !task.completed
                                  ? 'text-[#B42318] font-semibold'
                                  : 'text-[#54685C]'
                              }`}
                            >
                              {isHigh ? 'Hög prio' : task.priority === 'medium' ? 'Medel' : 'Låg prio'}
                              {' · '}
                              {task.category}
                              {task.reminderTime ? ` · ${task.reminderTime}` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('todo')}
              className="mt-4 w-full min-h-[42px] rounded-2xl bg-[#E4F3EA] hover:bg-[#D5EBDD] px-4 py-2 text-xs font-extrabold text-[#183D2C] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Visa alla uppgifter</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        );

      case 'photos':
        return (
          <div className="rounded-3xl bg-[#183D2C] border border-[#D5E5DC] overflow-hidden relative min-h-[290px] flex flex-col justify-between h-full shadow-2xs group">
            {activeRotatingPhoto ? (
              <img
                src={activeRotatingPhoto.imageUrl}
                alt={activeRotatingPhoto.caption || 'Familjefoto'}
                referrerPolicy="no-referrer"
                onClick={() => {
                  if (!isEditingLayout) onNavigate('photos');
                }}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer group-hover:scale-[1.02] transition-transform duration-500"
              />
            ) : (
              <div
                onClick={() => {
                  if (!isEditingLayout) onNavigate('photos');
                }}
                className="absolute inset-0 bg-gradient-to-br from-[#23573F] via-[#3A6B52] to-[#C87D55] cursor-pointer"
              />
            )}

            {/* Measured contrast scrim for legibility */}
            <div
              onClick={() => {
                if (!isEditingLayout) onNavigate('photos');
              }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40 cursor-pointer"
            />

            {/* Top Row: Album Badge + Choose Album Button */}
            <div className="relative z-10 p-5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onNavigate('photos')}
                className="rounded-xl bg-black/45 backdrop-blur-xs border border-white/20 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <ImageIcon className="h-3.5 w-3.5 text-[#A6F2C6]" />
                <span className="truncate max-w-[160px]">
                  {activeAlbumObj ? activeAlbumObj.name : 'Alla bilder'} ({displayPhotosPool.length})
                </span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAlbumPickerModal(true);
                }}
                className="min-h-[34px] rounded-xl bg-white/90 hover:bg-white px-3 py-1.5 text-xs font-extrabold text-[#183D2C] flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Välj album</span>
              </button>
            </div>

            {/* Bottom Row: Current Photo Info & Next Photo Trigger */}
            <div
              onClick={() => {
                if (!isEditingLayout) onNavigate('photos');
              }}
              className="relative z-10 p-5 pt-10 cursor-pointer flex items-end justify-between gap-3"
            >
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-white truncate">
                  {activeRotatingPhoto
                    ? activeRotatingPhoto.caption || (activeAlbumObj ? activeAlbumObj.name : 'Bilder & Album')
                    : 'Bilder & Album'}
                </h2>
                <p className="mt-0.5 text-xs text-[#E4F3EA] truncate">
                  {activeRotatingPhoto
                    ? `Uppladdad av ${activeRotatingPhoto.uploadedBy || 'familjen'} · Ny bild vid varje besök`
                    : 'Lägg till foton och skapa delade album'}
                </p>
              </div>
              {displayPhotosPool.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRotatingPhotoIndex((prev) => {
                      const next = prev + 1;
                      try {
                        localStorage.setItem(HOME_ALBUM_PHOTO_IDX_KEY, String(next));
                      } catch {
                        // Ignore
                      }
                      return next;
                    });
                  }}
                  className="min-h-[36px] rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs px-3 py-1.5 text-xs font-bold text-white shrink-0"
                  title="Visa nästa bild från albumet"
                >
                  Nästa bild →
                </button>
              )}
            </div>
          </div>
        );

      case 'recipes':
        return (
          <div className="rounded-3xl bg-white border border-[#D5E5DC] p-5 sm:p-6 flex flex-col justify-between h-full shadow-2xs">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAE2FA] text-[#5C4389]">
                    <UtensilsCrossed className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold text-[#141E18] truncate">
                      Senaste recept
                    </h2>
                    <p className="text-xs text-[#54685C] truncate">
                      {recipes.length} sparade recept i samlingen
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('recipes')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-[#EAF5EE] flex items-center gap-1 shrink-0"
                >
                  <span>Öppna</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {recentRecipes.length === 0 ? (
                  <div className="rounded-2xl bg-[#F6FBF7] p-5 text-center text-xs text-[#54685C]">
                    Inga recept tillagda ännu.
                  </div>
                ) : (
                  recentRecipes.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => {
                        if (!isEditingLayout) onNavigate('recipes');
                      }}
                      className="rounded-2xl bg-[#F6FBF7] hover:bg-[#EBF5EE] border border-[#DCEAE1] px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#141E18] truncate">
                          {rec.title}
                        </div>
                        <div className="text-xs text-[#54685C] font-mono tabular-nums truncate">
                          {rec.prepTime} · {rec.servings} port · {rec.rating}/5 ★
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#54685C] shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('recipes')}
              className="mt-4 w-full min-h-[42px] rounded-2xl bg-[#183D2C] hover:bg-[#0F291E] px-4 py-2 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Öppna recept & ingredienser</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        );

      case 'calendar':
        return (
          <div className="rounded-3xl bg-white border border-[#D5E5DC] p-5 sm:p-6 flex flex-col justify-between h-full shadow-2xs">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D8F3E3] text-[#183D2C]">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold text-[#141E18] truncate">
                      Kommande i kalendern
                    </h2>
                    <p className="text-xs text-[#54685C] truncate">
                      De 4 närmaste bokningarna framåt
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('calendar')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-[#EAF5EE] flex items-center gap-1 shrink-0"
                >
                  <span>Öppna</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {upcomingEvents.length === 0 ? (
                  <div className="rounded-2xl bg-[#F6FBF7] p-5 text-center text-xs text-[#54685C]">
                    Inga inplanerade händelser framöver.
                  </div>
                ) : (
                  upcomingEvents.map((evt) => {
                    const cat = categories.find((c) => c.id === evt.categoryId) || categories[0];
                    const dotColor = evt.customColorHex || cat?.colorHex || '#183D2C';
                    const isToday = evt.date === todayStr;
                    return (
                      <div
                        key={evt.id}
                        onClick={() => {
                          if (!isEditingLayout) onNavigate('calendar');
                        }}
                        className="rounded-2xl bg-[#F6FBF7] hover:bg-[#EBF5EE] border border-[#DCEAE1] px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-9 min-w-[48px] px-2 rounded-xl shrink-0 flex items-center justify-center font-mono tabular-nums text-xs font-bold text-white"
                            style={{ backgroundColor: dotColor }}
                          >
                            {evt.isAllDay ? 'Heldag' : evt.startTime}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-[#141E18] truncate">
                              {evt.title}
                            </div>
                            <div className="text-xs text-[#54685C] font-mono tabular-nums truncate">
                              {isToday ? 'Idag' : evt.date}
                              {' · '}
                              {evt.isAllDay ? 'Heldag' : `${evt.startTime}–${evt.endTime}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="mt-4 w-full min-h-[42px] rounded-2xl bg-[#E4F3EA] hover:bg-[#D5EBDD] px-4 py-2 text-xs font-extrabold text-[#183D2C] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Öppna kalendern</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        );

      case 'notes':
        return (
          <div className="rounded-3xl bg-[#FFFDF7] border border-[#E8DFB5] p-5 sm:p-6 flex flex-col justify-between h-full shadow-2xs">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FCE8D5] text-[#7A4F2B]">
                    <StickyNote className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold text-[#141E18] truncate">
                      Anteckningar
                    </h2>
                    <p className="text-xs text-[#54685C] truncate">
                      De {recentNotes.length} senast uppdaterade
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('notes')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-[#EAF5EE] flex items-center gap-1 shrink-0"
                >
                  <span>Öppna</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {recentNotes.length === 0 ? (
                  <div className="rounded-2xl bg-white/80 p-5 text-center text-xs text-[#54685C]">
                    Inga anteckningar skapade ännu.
                  </div>
                ) : (
                  recentNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        if (!isEditingLayout) onNavigate('notes');
                      }}
                      className="rounded-2xl bg-white hover:bg-[#FAF5E6] border border-[#EDE3BF] px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#141E18] truncate">
                          {note.title}
                        </div>
                        <div className="text-xs text-[#54685C] truncate">
                          {note.listMode === 'checklist'
                            ? `Checklista · ${note.checklistItems.filter((i) => i.checked).length} av ${note.checklistItems.length} avbockade`
                            : note.contentHtml.replace(/<[^>]+>/g, ' ').trim().slice(0, 60) || 'Tom anteckning'}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#7A4F2B] shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('notes')}
              className="mt-4 w-full min-h-[42px] rounded-2xl bg-[#FCE8D5]/70 hover:bg-[#FCE8D5] px-4 py-2 text-xs font-extrabold text-[#7A4F2B] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Visa alla {notes.length} anteckningar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        );

      case 'budget':
        return (
          <div className="rounded-3xl bg-[#EBF4EE] border border-[#CDE0D4] p-5 sm:p-6 flex flex-col justify-between h-full shadow-2xs">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#183D2C] text-white">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold text-[#141E18] truncate">
                      Budget · {currentMonth ? currentMonth.label : 'Månad'}
                    </h2>
                    <p className="text-xs text-[#4E6357] font-mono tabular-nums truncate">
                      Inkomster {totalIncome.toLocaleString('sv-SE')} kr · Utgifter{' '}
                      {totalExpense.toLocaleString('sv-SE')} kr
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('budget')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-white/60 flex items-center gap-1 shrink-0"
                >
                  <span>Öppna</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-white/80 border border-[#CDE0D4] p-4">
                <div className="text-xs font-bold text-[#21513B]">Kvar att disponera</div>
                <div className="mt-0.5 text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#141E18]">
                  {netBalance.toLocaleString('sv-SE')} kr
                </div>
                <div className="mt-3 h-2.5 w-full rounded-full bg-[#CDE0D4] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#183D2C] transition-all"
                    style={{ width: `${Math.max(6, 100 - expenseRatio)}%` }}
                  />
                </div>
              </div>

              {recentBudgetEntries.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {recentBudgetEntries.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => {
                        if (!isEditingLayout) onNavigate('budget');
                      }}
                      className="rounded-xl bg-white/70 px-3 py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-white transition-colors"
                    >
                      <span className="font-bold text-[#141E18] truncate">{entry.title}</span>
                      <span
                        className={`font-mono tabular-nums font-bold shrink-0 ${
                          entry.type === 'income' ? 'text-[#183D2C]' : 'text-[#9E2A2B]'
                        }`}
                      >
                        {entry.type === 'income' ? '+' : '−'}
                        {entry.amount.toLocaleString('sv-SE')} kr
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('budget')}
              className="mt-4 w-full min-h-[42px] rounded-2xl bg-[#183D2C] hover:bg-[#0F291E] px-4 py-2 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Öppna hela månadsbudgeten</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit Layout Helper Bar (Only shown when user activates layout editing from top bar) */}
      {isEditingLayout && (
        <div className="rounded-3xl bg-[#183D2C] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#A6F2C6]/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#A6F2C6] text-[#082114]">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">
                Anpassa startsidans rutnät
              </div>
              <div className="text-xs text-[#CDE8D8]">
                Använd pilarna för att ändra ordning och välj <strong>Stor</strong> eller{' '}
                <strong>Liten</strong> storlek på varje ruta.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                saveNewBentoOrder(DEFAULT_BENTO_ORDER);
                saveNewBentoSizes(DEFAULT_BENTO_SIZES);
              }}
              className="min-h-[38px] rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Återställ</span>
            </button>
            {onCloseEditingLayout && (
              <button
                type="button"
                onClick={onCloseEditingLayout}
                className="min-h-[38px] rounded-xl bg-[#A6F2C6] hover:bg-[#8CE6B4] px-4 py-1.5 text-xs font-extrabold text-[#082114] flex items-center gap-1.5 transition-colors"
              >
                <Check className="h-4 w-4" />
                <span>Klar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Compact Nordic Bento Top Hero: Gothenburg Weather (Left) + Next Event & Clock (Right) */}
      <section className="rounded-3xl bg-[#183D2C] text-[#F4FBF6] p-5 sm:p-7 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Interactive Gothenburg Weather (Click for 24h & 10-day forecast) */}
          <div
            onClick={() => setShowWeatherModal(true)}
            className="lg:col-span-6 cursor-pointer group rounded-2xl bg-white/8 hover:bg-white/14 p-4 sm:p-5 transition-colors border border-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#A6F2C6] uppercase tracking-wider">
                  Göteborg just nu · {weather.description}
                </div>
                <div className="mt-1.5 flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-white">
                    {weather.temperature}°C
                  </span>
                  <span className="text-xs text-[#CDE8D8] font-mono tabular-nums">
                    Högst {weather.highTemp}° · Lägst {weather.lowTemp}°
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#A6F2C6] font-mono tabular-nums">
                  <span className="flex items-center gap-1">
                    <Wind className="h-3.5 w-3.5" />
                    Vind {weather.windSpeed} m/s
                  </span>
                  <span>·</span>
                  <span className="underline decoration-[#A6F2C6]/60 group-hover:text-white">
                    10-dagarsprognos →
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#A6F2C6]/20 text-[#A6F2C6] group-hover:scale-105 transition-transform">
                <CloudSun className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Right: Next Calendar Event + Date/Clock & Quick Sync */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4 lg:pl-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#A6F2C6] capitalize">
                  {formattedDate} · Kl. {formattedTime}
                </div>
                {nextEvent ? (
                  <div
                    onClick={() => onNavigate('calendar')}
                    className="mt-2 cursor-pointer group"
                  >
                    <div className="inline-flex items-center gap-2 rounded-lg bg-[#A6F2C6] px-2.5 py-0.5 text-xs font-extrabold text-[#082114]">
                      <span>
                        {nextEvent.date === todayStr ? 'Idag' : nextEvent.date}{' '}
                        {nextEvent.isAllDay ? 'Heldag' : nextEvent.startTime}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-white truncate group-hover:text-[#A6F2C6] transition-colors">
                      {nextEvent.title}
                    </div>
                    <div className="text-xs text-[#CDE8D8]">
                      {allUpcomingEvents.length > 1
                        ? `+ ${allUpcomingEvents.length - 1} händelser till framöver`
                        : 'Klicka för att öppna kalendern'}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="text-xl font-extrabold text-white">
                      Inga bokningar idag
                    </div>
                    <div className="text-xs text-[#CDE8D8]">
                      Tryck på Kalender för att lägga till en ny händelse
                    </div>
                  </div>
                )}
              </div>

              {isGoogleConnected && (
                <button
                  type="button"
                  onClick={onSyncAll}
                  disabled={isSyncing}
                  className="min-h-[40px] rounded-2xl bg-white/15 hover:bg-white/25 px-3.5 py-2 text-xs font-bold text-white flex items-center gap-1.5 shrink-0 transition-colors"
                  title="Synka nu"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synka' : 'Synka'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reorderable & Resizable Nordic Bento Grid (Stor = full bredd, Liten = 2 i bredd bredvid varandra) */}
      <section className="grid grid-cols-2 gap-3.5 sm:gap-5 items-stretch">
        {bentoOrder.map((cardId, idx) => {
          const cardSize = bentoSizes[cardId] || 'large';
          const isSmall = cardSize === 'small';

          return (
            <div
              key={cardId}
              className={`relative flex flex-col ${
                isSmall ? 'col-span-1' : 'col-span-2'
              } ${
                isEditingLayout
                  ? 'ring-2 ring-[#183D2C] ring-offset-2 rounded-3xl'
                  : ''
              }`}
            >
              {/* Edit Controls Bar (Only Arrow Reordering + Stor/Liten Size Toggle) */}
              {isEditingLayout && (
                <div className="mb-2 rounded-2xl bg-[#183D2C] text-white px-2.5 py-1.5 flex items-center justify-between gap-1.5 shadow-sm">
                  {/* Size Toggle: Stor vs Liten */}
                  <button
                    type="button"
                    onClick={() => toggleCardSize(cardId)}
                    className="min-h-[30px] rounded-xl bg-[#A6F2C6] hover:bg-[#8CE6B4] text-[#082114] px-2.5 py-1 text-[11px] font-extrabold flex items-center gap-1.5 transition-colors shrink-0"
                    title={isSmall ? 'Byt till stor ruta' : 'Byt till liten ruta'}
                  >
                    {isSmall ? (
                      <>
                        <Maximize2 className="h-3 w-3 shrink-0" />
                        <span>Liten → Stor</span>
                      </>
                    ) : (
                      <>
                        <Minimize2 className="h-3 w-3 shrink-0" />
                        <span>Stor → Liten</span>
                      </>
                    )}
                  </button>

                  {/* Arrow Buttons for Reordering */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveCardInOrder(cardId, -1)}
                      className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
                      title="Flytta upp / bakåt"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === bentoOrder.length - 1}
                      onClick={() => moveCardInOrder(cardId, 1)}
                      className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
                      title="Flytta ner / framåt"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1">{renderBentoCardContent(cardId, cardSize)}</div>
            </div>
          );
        })}
      </section>

      {/* Choose Photo Album Modal for Start Page */}
      {showAlbumPickerModal && (
        <div
          onClick={() => setShowAlbumPickerModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 bg-[#183D2C] text-white flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#A6F2C6]">
                  Bilder & Album på startsidan
                </div>
                <h3 className="text-lg font-extrabold">Välj vilket album som visas</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAlbumPickerModal(false)}
                className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[65vh] overflow-y-auto">
              <p className="text-xs text-[#54685C]">
                Varje gång du kommer tillbaka till startsidan växlar kortet automatiskt till en ny bild från det album du har valt här.
              </p>

              <button
                type="button"
                onClick={() => handleSelectHomeAlbum('all')}
                className={`w-full rounded-2xl border p-4 text-left flex items-center justify-between transition-all ${
                  selectedAlbumId === 'all'
                    ? 'bg-white border-[#183D2C] ring-2 ring-[#183D2C]'
                    : 'bg-white/80 border-[#DCEAE1] hover:bg-white'
                }`}
              >
                <div>
                  <div className="text-sm font-extrabold text-[#141E18]">
                    Alla bilder
                  </div>
                  <div className="text-xs text-[#54685C]">
                    Roterar bland samtliga {photos.length} uppladdade bilder
                  </div>
                </div>
                {selectedAlbumId === 'all' && (
                  <span className="h-7 w-7 rounded-full bg-[#183D2C] text-white flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>

              {photoAlbums.map((alb) => {
                const count = photos.filter((p) => p.albumId === alb.id).length;
                const isSelected = selectedAlbumId === alb.id;
                return (
                  <button
                    key={alb.id}
                    type="button"
                    onClick={() => handleSelectHomeAlbum(alb.id)}
                    className={`w-full rounded-2xl border p-4 text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-white border-[#183D2C] ring-2 ring-[#183D2C]'
                        : 'bg-white/80 border-[#DCEAE1] hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-extrabold text-[#141E18]">
                        {alb.name}
                      </div>
                      <div className="text-xs text-[#54685C]">
                        {count} {count === 1 ? 'bild' : 'bilder'} i albumet
                      </div>
                    </div>
                    {isSelected && (
                      <span className="h-7 w-7 rounded-full bg-[#183D2C] text-white flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                );
              })}

              {photoAlbums.length === 0 && (
                <div className="rounded-2xl bg-white border border-[#DCEAE1] p-4 text-center space-y-2">
                  <p className="text-xs text-[#54685C]">
                    Du har inte skapat några egna album ännu.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAlbumPickerModal(false);
                      onNavigate('photos');
                    }}
                    className="min-h-[38px] rounded-xl bg-[#183D2C] px-4 py-2 text-xs font-bold text-white"
                  >
                    Gå till Foton & skapa album →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Weather Forecast Modal (Full Day Hourly + Next 10 Days) */}
      {showWeatherModal && (
        <div
          onClick={() => setShowWeatherModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#DCEAE1] bg-[#183D2C] text-white shrink-0">
              <div>
                <div className="text-xs font-semibold text-[#A6F2C6]">
                  Väderprognos · Göteborg
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold">
                  {weather.temperature}°C · {weather.description}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWeatherModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label="Stäng väderprognos"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Selector: Hela dagen / Kommande 10 dagar */}
            <div className="px-6 pt-4 bg-[#F6FBF7] shrink-0">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#E4F3EA] rounded-2xl border border-[#CDE0D4]">
                <button
                  type="button"
                  onClick={() => setWeatherTab('today')}
                  className={`min-h-[40px] rounded-xl text-xs font-bold transition-colors ${
                    weatherTab === 'today'
                      ? 'bg-[#183D2C] text-white shadow-xs'
                      : 'text-[#183D2C] hover:bg-white/60'
                  }`}
                >
                  Hela dagen (Timme för timme)
                </button>
                <button
                  type="button"
                  onClick={() => setWeatherTab('10days')}
                  className={`min-h-[40px] rounded-xl text-xs font-bold transition-colors ${
                    weatherTab === '10days'
                      ? 'bg-[#183D2C] text-white shadow-xs'
                      : 'text-[#183D2C] hover:bg-white/60'
                  }`}
                >
                  Kommande 10 dagar
                </button>
              </div>
            </div>

            {/* Scrollable Forecast Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {weatherTab === 'today' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#141E18]">
                      Timprognos för hela dygnet (00:00–23:00)
                    </h4>
                    <span className="text-xs text-[#54685C] font-mono tabular-nums">
                      Högst {weather.highTemp}°C · Lägst {weather.lowTemp}°C
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {hourlyForecast.map((h) => {
                      const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:00`;
                      const isCurrentHour = h.hourLabel === currentHourStr;
                      return (
                        <div
                          key={h.time}
                          className={`rounded-2xl border p-3 flex flex-col justify-between gap-2 ${
                            isCurrentHour
                              ? 'bg-[#183D2C] text-white border-[#183D2C] shadow-md'
                              : 'bg-white text-[#141E18] border-[#DCEAE1]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold font-mono tabular-nums ${
                                isCurrentHour ? 'text-[#A6F2C6]' : 'text-[#54685C]'
                              }`}
                            >
                              {isCurrentHour ? `Nu (${h.hourLabel})` : h.hourLabel}
                            </span>
                            {getWeatherIcon(h.weatherCode, 'h-5 w-5')}
                          </div>
                          <div className="text-xl font-extrabold font-mono tabular-nums">
                            {h.temp}°C
                          </div>
                          <div
                            className={`flex items-center justify-between text-[11px] font-mono tabular-nums ${
                              isCurrentHour ? 'text-white/80' : 'text-[#54685C]'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <Droplets className="h-3 w-3 text-[#0066FF]" />
                              {h.precipProb}%
                            </span>
                            <span>{h.windSpeed} m/s</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#141E18]">
                      10-dagarsprognos · Göteborg
                    </h4>
                    <span className="text-xs text-[#54685C]">
                      Min / Max & Nederbörd
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dailyForecast.map((d) => (
                      <div
                        key={d.date}
                        className="rounded-2xl bg-white border border-[#DCEAE1] px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-[105px]">
                          <div className="text-sm font-bold text-[#141E18]">
                            {d.dayName}
                          </div>
                          <div className="text-xs text-[#54685C] font-mono tabular-nums">
                            {d.dateShort}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2F9F5]">
                            {getWeatherIcon(d.weatherCode, 'h-5 w-5')}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#141E18] truncate">
                              {d.description}
                            </div>
                            <div className="text-[11px] text-[#54685C] font-mono tabular-nums flex items-center gap-2">
                              <span className="flex items-center gap-0.5 text-[#0066FF]">
                                <Droplets className="h-3 w-3" />
                                {d.precipProb}% ({d.precipSum} mm)
                              </span>
                              <span>· {d.maxWind} m/s</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div className="text-sm font-extrabold text-[#141E18]">
                            {d.maxTemp}° <span className="text-[#6A7F72] font-normal">/ {d.minTemp}°</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#DCEAE1] bg-[#F6FBF7] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowWeatherModal(false)}
                className="min-h-[42px] rounded-2xl bg-[#183D2C] px-6 py-2 text-xs font-bold text-white hover:bg-[#0F291E]"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
