import React, { useEffect, useMemo, useState } from 'react';
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
  FileText,
  Maximize2,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShoppingCart,
  Sun,
  Timer,
  Trash2,
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

  // Night clock override:
  // 'auto' = automatically Night Clock between 22:00 and 06:00
  // 'force-night' = user manually previewed/enabled Night Clock
  // 'force-day' = user tapped "Visa hushållstavla" during night hours
  const [nightModeOverride, setNightModeOverride] = useState<
    'auto' | 'force-night' | 'force-day'
  >('auto');

  // Mobile (< 7 inch / < md:) active widget tab: defaults to 'all' (Översikt) so there is never a giant empty space
  const [mobileActiveWidget, setMobileActiveWidget] = useState<
    'all' | 'shopping' | 'calendar' | 'todo' | 'kitchen'
  >('all');

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

  // Subtle pixel shift every minute for OLED/IPS screen protection in Night Clock mode
  const [pixelShift, setPixelShift] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update clock every second
  useEffect(() => {
    if (!open) return;
    setNow(new Date());
    const interval = setInterval(() => {
      const current = new Date();
      setNow(current);
      if (current.getSeconds() === 0) {
        const offsetX = Math.floor(Math.random() * 14) - 7;
        const offsetY = Math.floor(Math.random() * 14) - 7;
        setPixelShift({ x: offsetX, y: offsetY });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  // Reset override to 'auto' when opening screensaver fresh
  useEffect(() => {
    if (open) {
      setNightModeOverride('auto');
    }
  }, [open]);

  // Keep tablet/phone screen awake via Screen Wake Lock API while screensaver is open
  useEffect(() => {
    if (!open) return;
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
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => {
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
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, kitchenModeOpen, onClose]);

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
  // Automatic Night Clock between 22:00 and 06:00
  const isWithinNightSchedule = hour >= 22 || hour < 6;
  const isNightClockActive =
    nightModeOverride === 'force-night' ||
    (nightModeOverride === 'auto' && isWithinNightSchedule);

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

  // ============================================================================
  // NIGHT CLOCK MODE (22:00 – 06:00 automatically, or when manually toggled)
  // ============================================================================
  if (isNightClockActive) {
    const nextEvent = upcomingEvents[0];
    return (
      <div
        data-no-pull-refresh="true"
        className="fixed inset-0 z-50 bg-[#050605] text-[#8BB89E] flex flex-col justify-between px-4 sm:px-8 md:px-10 pt-[max(env(safe-area-inset-top,0px)+12px,44px)] md:pt-8 pb-[max(env(safe-area-inset-bottom,0px)+12px,20px)] md:pb-8 select-none overflow-hidden"
      >
        {/* Top subtle status row */}
        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-sm text-[#5E7E6B]">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#739E84] shrink-0" />
            <span className="font-semibold tracking-wide truncate">
              Nattklocka (22:00–06:00)
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 font-mono tabular-nums shrink-0">
            {getWeatherIcon(weather.weatherCode, 'h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-70')}
            <span>
              {weather.temperature}°C · {weather.description}
            </span>
          </div>
        </div>

        {/* Center Giant Low-Luminance Clock with subtle pixel-shift (responsive for phones & 7"+ tablets) */}
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
        </div>

        {/* Bottom discreet controls */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#121A15]">
          <button
            type="button"
            onClick={() => setNightModeOverride('force-day')}
            className="min-h-[40px] rounded-2xl bg-[#0F1712] hover:bg-[#17241C] border border-[#213327] px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#8BB89E] flex items-center gap-1.5 sm:gap-2 transition-colors"
          >
            <Sun className="h-4 w-4 text-[#A6F2C6] shrink-0" />
            <span className="truncate">Visa hushållstavla</span>
          </button>

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
  // FÖRSLAG 3: MATERIAL 3 EXPRESSIVE HUSHÅLLSTAVLA
  // Responsive for both Phones (< 7", < md:) and Tablets/Screens (7"+, md: & lg:)
  // ============================================================================
  const uncheckedShoppingCount = shopping.filter((s) => !s.checked).length;
  const checkedShoppingCount = shopping.filter((s) => s.checked).length;
  const openTodosCount = todos.filter((t) => !t.completed).length;

  return (
    <div
      data-no-pull-refresh="true"
      className="fixed inset-0 z-50 bg-[#F4F6F3] text-[#141E18] flex flex-col h-dvh px-2.5 sm:px-4 lg:px-6 pt-[max(env(safe-area-inset-top,0px)+10px,42px)] md:pt-4 lg:pt-6 pb-[max(env(safe-area-inset-bottom,0px)+10px,16px)] md:pb-4 lg:pb-6 overflow-y-auto md:overflow-hidden"
    >
      {/* ====================================================================
          TOP SECTION:
          - On Phones (< md / < 7"): Compact single Clock + Weather + Controls card
          - On 7"+ Tablets (md:+): 2 Expressive Hero Cards side by side
         ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3.5 shrink-0">
        {/* Top Left Card: Expressive Clock, Date, Gothenburg Weather & Controls */}
        <div className="md:col-span-7 rounded-[24px] sm:rounded-[28px] bg-[#163A2B] text-[#E8F5ED] p-3.5 sm:p-5 flex flex-col justify-between border border-[#25543F] shadow-xs">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Clock + Date */}
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className="text-3xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight font-mono tabular-nums text-white leading-none">
                  {timeString}
                </span>
                <span className="rounded-lg sm:rounded-xl bg-[#214E3B] border border-[#326B52] px-2 py-0.5 text-[10px] sm:text-xs font-extrabold font-mono tabular-nums text-[#A6F2C6]">
                  v.{weekNumber}
                </span>
              </div>
              <div className="mt-1 sm:mt-1.5 text-xs sm:text-base font-bold capitalize text-[#B6DEC6] truncate">
                {weekdayName} {dayAndMonth} · Hemma hos F
              </div>
            </div>

            {/* Live Gothenburg Weather Pill */}
            <div className="rounded-2xl bg-[#1E4836] border border-[#2F634C] px-2.5 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 shrink-0">
              {getWeatherIcon(weather.weatherCode, 'h-6 w-6 sm:h-7 sm:w-7 shrink-0')}
              <div>
                <div className="flex items-baseline gap-1 sm:gap-1.5">
                  <span className="text-base sm:text-xl font-extrabold font-mono tabular-nums text-white leading-none">
                    {weather.temperature}°C
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-[#A6F2C6]">
                    {weather.description}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] font-medium font-mono tabular-nums text-[#B6DEC6] flex items-center gap-1.5">
                  <span>
                    H:{weather.highTemp}° L:{weather.lowTemp}°
                  </span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline-flex items-center gap-0.5">
                    <Wind className="h-2.5 w-2.5" /> {weather.windSpeed} m/s
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar inside Top-Left Card: Night Mode status, Idle Timer & Exit */}
          <div className="mt-2.5 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-[#25543F] flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setNightModeOverride('force-night')}
                className="min-h-[32px] sm:min-h-[36px] rounded-xl bg-[#214E3B] hover:bg-[#2B614A] border border-[#326B52] px-2.5 py-1 text-[11px] sm:text-xs font-extrabold text-[#A6F2C6] flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                title="Slå på Nattklocka (aktiveras automatiskt kl 22:00–06:00)"
              >
                <Moon className="h-3.5 w-3.5 shrink-0" />
                <span className=" sm:hidden">Nattklocka</span>
                <span className="hidden sm:inline">Nattklocka (22–06)</span>
              </button>

              {/* Auto-idle selector */}
              <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl bg-[#102B20] border border-[#25543F] px-2 py-1 text-[10px] sm:text-[11px] text-[#B6DEC6] shrink-0">
                <Clock className="h-3 w-3 text-[#A6F2C6] shrink-0" />
                <span className="hidden lg:inline font-semibold">Auto:</span>
                {([0, 2, 5, 10] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onChangeIdleMinutes(m)}
                    className={`rounded-md px-1.5 py-0.5 font-mono tabular-nums font-bold transition-colors ${
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
              className="min-h-[32px] sm:min-h-[36px] rounded-xl bg-white/15 hover:bg-white/25 px-2.5 sm:px-3.5 py-1 text-[11px] sm:text-xs font-extrabold text-white flex items-center gap-1 shrink-0 transition-colors"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Stäng</span>
            </button>
          </div>
        </div>

        {/* Top Right Card (7"+ Tablets always visible; on Phones visible when "Alla" or "Kök" tab is selected) */}
        <div
          className={`${
            mobileActiveWidget === 'kitchen' || mobileActiveWidget === 'all'
              ? 'flex'
              : 'hidden md:flex'
          } md:col-span-5 rounded-[24px] sm:rounded-[28px] m3-secondary-surface border p-3.5 sm:p-5 flex-col justify-between shadow-xs`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#163A2B] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#A6F2C6]">
                  <ChefHat className="h-3.5 w-3.5" />
                  Matsedel & Köksläge
                </span>
                {orderedRecipes.length > 1 && (
                  <span className="text-xs font-mono tabular-nums font-bold opacity-80">
                    {(selectedRecipeIdx % orderedRecipes.length) + 1}/{orderedRecipes.length}
                  </span>
                )}
              </div>

              {currentRecipe ? (
                <>
                  <h2 className="mt-1.5 text-base sm:text-lg font-extrabold truncate">
                    {currentRecipe.title}
                  </h2>
                  <p className="text-[11px] sm:text-xs opacity-80 line-clamp-1">
                    {currentRecipe.prepTime} · {currentRecipe.servings} portioner ·{' '}
                    {currentRecipe.ingredients.length} ingredienser
                  </p>
                </>
              ) : (
                <h2 className="mt-2 text-sm font-bold opacity-80">
                  Inga recept sparade ännu
                </h2>
              )}
            </div>

            {/* Recipe Prev/Next Switcher */}
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
                  className="h-8 w-8 rounded-xl bg-white/80 hover:bg-white border border-black/10 flex items-center justify-center text-[#163A2B]"
                  aria-label="Föregående recept"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedRecipeIdx((prev) => (prev + 1) % orderedRecipes.length)
                  }
                  className="h-8 w-8 rounded-xl bg-white/80 hover:bg-white border border-black/10 flex items-center justify-center text-[#163A2B]"
                  aria-label="Nästa recept"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive Kitchen Timer Bar */}
          <div className="my-2.5 rounded-2xl bg-white/90 border border-black/10 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[#141E18]">
            <div className="flex items-center gap-1.5">
              <Timer className="h-4 w-4 text-[#163A2B] shrink-0" />
              <span className="text-xs font-extrabold">Timer:</span>
              <span
                className={`text-xs sm:text-sm font-mono tabular-nums font-extrabold px-2 py-0.5 rounded-lg ${
                  timerSecondsLeft > 0
                    ? 'bg-[#163A2B] text-[#A6F2C6]'
                    : 'bg-[#E6EFE9] text-[#141E18]'
                }`}
              >
                {formatTimer(timerSecondsLeft)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {[1, 5, 10, 15].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => addTimerMinutes(m)}
                  className="rounded-lg bg-[#E6EFE9] hover:bg-[#D5E6DC] px-2 py-1 text-[11px] font-mono tabular-nums font-extrabold text-[#163A2B]"
                >
                  +{m}m
                </button>
              ))}
              {timerSecondsLeft > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setTimerRunning((r) => !r)}
                    className="h-7 w-7 rounded-lg bg-[#163A2B] text-white flex items-center justify-center"
                    aria-label={timerRunning ? 'Pausa timer' : 'Starta timer'}
                  >
                    {timerRunning ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSecondsLeft(0);
                    }}
                    className="h-7 w-7 rounded-lg bg-[#FDE8E8] text-[#9E2A2B] flex items-center justify-center"
                    aria-label="Nollställ timer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons: Open Step-by-Step Kitchen Mode OR Add Ingredients directly */}
          {currentRecipe && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setKitchenModeOpen(true)}
                className="flex-1 min-h-[38px] rounded-2xl bg-[#163A2B] hover:bg-[#1E4B38] px-3 py-1.5 text-xs font-extrabold text-[#A6F2C6] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Köksläge (Steg-för-steg)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onSendIngredientsToShopping(
                    currentRecipe.ingredients,
                    currentRecipe.title
                  )
                }
                className="min-h-[38px] rounded-2xl bg-white hover:bg-[#F5FBF7] border border-black/10 px-3 py-1.5 text-xs font-extrabold text-[#163A2B] flex items-center gap-1 shrink-0 transition-colors"
                title="Lägg till receptets ingredienser direkt i inköpslistan"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>+ Inköp</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MOBILE WIDGET SWITCHER BAR (< 7 inch screens / md:hidden)
          No truncation: horizontal pill bar with "Alla", "Inköp", "Agenda", "Att göra", "Kök"
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
              className={`min-h-[38px] rounded-2xl px-2.5 py-1.5 text-[11px] font-extrabold flex items-center justify-center gap-1.5 border whitespace-nowrap shrink-0 transition-all ${
                active
                  ? 'bg-[#163A2B] border-[#163A2B] text-[#A6F2C6] shadow-xs'
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
          - On Phones (< md): Shows natural-height cards in "Alla" or the selected widget without empty white void
         ==================================================================== */}
      <div className="mt-2.5 sm:mt-3.5 md:flex-1 md:min-h-0 grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4 md:overflow-hidden pb-2 md:pb-0">
        {/* ================================================================
            WIDGET 1: KOMMANDE AGENDA (KALENDER) - Scrollable + Add/Check-off
           ================================================================ */}
        <section
          className={`${
            mobileActiveWidget === 'calendar' || mobileActiveWidget === 'all'
              ? 'flex'
              : 'hidden md:flex'
          } rounded-[24px] sm:rounded-[26px] bg-white border border-[#DCE3DD] p-3.5 sm:p-4 flex-col md:min-h-0 md:h-full overflow-hidden shadow-2xs`}
        >
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E9EFEA] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-xl m3-tertiary-surface border flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#141E18] truncate">
                  Kommande agenda
                </h3>
                <p className="text-[11px] font-medium text-[#54685C] font-mono tabular-nums">
                  {upcomingEvents.length} inplanerade händelser
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddEventForm((prev) => !prev)}
              className="min-h-[34px] rounded-xl bg-[#E6EFE9] hover:bg-[#D5E6DC] px-2.5 py-1 text-xs font-extrabold text-[#163A2B] flex items-center gap-1 shrink-0 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddEventForm ? 'Stäng' : 'Ny'}</span>
            </button>
          </div>

          {/* Inline Quick-Add Event Form */}
          {showAddEventForm && (
            <form
              onSubmit={handleQuickAddEvent}
              className="mt-2.5 rounded-2xl bg-[#F4F8F5] border border-[#D4E4DA] p-2.5 space-y-2 shrink-0"
            >
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Händelse (t.ex. Fotbollsträning)..."
                className="w-full rounded-xl bg-white border border-[#C8DFD0] px-3 py-1.5 text-xs font-bold text-[#141E18] focus:outline-none focus:border-[#163A2B]"
              />
              <div className="grid grid-cols-3 gap-1.5">
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="rounded-xl bg-white border border-[#C8DFD0] px-2 py-1.5 text-[11px] font-mono tabular-nums font-bold text-[#141E18]"
                />
                <input
                  type="time"
                  value={newEventStart}
                  onChange={(e) => setNewEventStart(e.target.value)}
                  className="rounded-xl bg-white border border-[#C8DFD0] px-2 py-1.5 text-[11px] font-mono tabular-nums font-bold text-[#141E18]"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#163A2B] text-white text-xs font-extrabold py-1.5 px-3 hover:bg-[#1E4B38]"
                >
                  Spara
                </button>
              </div>
            </form>
          )}

          {/* Scrollable Event List */}
          <div className="mt-2.5 max-h-[280px] md:max-h-none md:flex-1 md:min-h-0 overflow-y-auto pr-1 space-y-2">
            {upcomingEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 px-4">
                <Calendar className="h-8 w-8 text-[#94A89B] mb-2" />
                <p className="text-xs font-bold text-[#54685C]">
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
                        ? 'bg-[#F3FAF6] border-[#B8DEC6]'
                        : 'bg-[#FAFBF9] border-[#E5ECE7]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="mt-1 h-7 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat?.colorHex || '#163A2B' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-extrabold uppercase ${
                              isToday
                                ? 'bg-[#163A2B] text-[#A6F2C6]'
                                : 'bg-[#E6EFE9] text-[#2E4035]'
                            }`}
                          >
                            {isToday ? 'IDAG' : evt.date.slice(5)}
                          </span>
                          <span className="text-xs font-mono tabular-nums font-extrabold text-[#163A2B]">
                            {evt.isAllDay
                              ? 'Heldag'
                              : `${evt.startTime}–${evt.endTime}`}
                          </span>
                          {evt.assignee && (
                            <span className="text-[10px] font-bold text-[#54685C]">
                              · {evt.assignee}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-sm font-extrabold text-[#141E18] truncate">
                          {evt.title}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteEventDirect(evt.id)}
                      className="h-9 w-9 rounded-xl bg-white hover:bg-[#E6EFE9] border border-[#DCE3DD] flex items-center justify-center text-[#54685C] hover:text-[#163A2B] shrink-0 transition-colors"
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
            WIDGET 2: INKÖPSLISTA - Scrollable + One-Tap Check-off + Quick Add
           ================================================================ */}
        <section
          className={`${
            mobileActiveWidget === 'shopping' || mobileActiveWidget === 'all'
              ? 'flex'
              : 'hidden md:flex'
          } order-first md:order-none rounded-[24px] sm:rounded-[26px] bg-white border border-[#DCE3DD] p-3.5 sm:p-4 flex-col md:min-h-0 md:h-full overflow-hidden shadow-2xs`}
        >
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E9EFEA] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-xl m3-secondary-surface border flex items-center justify-center shrink-0">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#141E18] truncate">
                  Inköpslista
                </h3>
                <p className="text-[11px] font-medium text-[#54685C] font-mono tabular-nums">
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

          {/* Quick-Add Grocery Bar right inside the widget */}
          <form
            onSubmit={handleQuickAddShopping}
            className="mt-2.5 flex items-center gap-1.5 shrink-0"
          >
            <input
              type="text"
              value={newShoppingName}
              onChange={(e) => setNewShoppingName(e.target.value)}
              placeholder="+ Lägg till vara (t.ex. Mjölk)..."
              className="flex-1 min-w-0 rounded-xl bg-[#F4F8F5] border border-[#D4E4DA] px-3 py-2 text-xs font-bold text-[#141E18] placeholder:text-[#687D70] focus:outline-none focus:bg-white focus:border-[#163A2B]"
            />
            <input
              type="number"
              min="1"
              value={newShoppingAmount}
              onChange={(e) => setNewShoppingAmount(e.target.value)}
              className="w-11 rounded-xl bg-[#F4F8F5] border border-[#D4E4DA] px-1.5 py-2 text-center text-xs font-mono tabular-nums font-bold text-[#141E18]"
              aria-label="Antal"
            />
            <button
              type="submit"
              className="min-h-[36px] rounded-xl bg-[#163A2B] hover:bg-[#1E4B38] px-3 py-2 text-xs font-extrabold text-white shrink-0 transition-colors"
            >
              Lägg till
            </button>
          </form>

          {/* Scrollable Shopping Items List */}
          <div className="mt-2.5 max-h-[280px] md:max-h-none md:flex-1 md:min-h-0 overflow-y-auto pr-1 space-y-1.5">
            {sortedShopping.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 px-4">
                <ShoppingCart className="h-8 w-8 text-[#94A89B] mb-2" />
                <p className="text-xs font-bold text-[#54685C]">
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
                      ? 'bg-[#F5F7F5] border-[#E5ECE7] text-[#7B8E82]'
                      : 'bg-[#FAFBF9] hover:bg-[#F0F7F2] border-[#DCE3DD] text-[#141E18]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`h-5 w-5 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                        item.checked
                          ? 'bg-[#163A2B] border-[#163A2B] text-[#A6F2C6]'
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
                  <span className="rounded-lg bg-[#E6EFE9] px-2 py-0.5 text-xs font-mono tabular-nums font-extrabold text-[#163A2B] shrink-0">
                    {item.amount} {item.unit}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* ================================================================
            WIDGET 3: ATT GÖRA & FÄSTA ANTECKNINGAR - Scrollable + Check-off
           ================================================================ */}
        <section
          className={`${
            mobileActiveWidget === 'todo' || mobileActiveWidget === 'all'
              ? 'flex'
              : 'hidden md:flex'
          } rounded-[24px] sm:rounded-[26px] bg-white border border-[#DCE3DD] p-3.5 sm:p-4 flex-col md:min-h-0 md:h-full overflow-hidden shadow-2xs`}
        >
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E9EFEA] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-[#E6EFE9] text-[#163A2B] flex items-center justify-center shrink-0">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#141E18] truncate">
                  Att göra & Notis
                </h3>
                <p className="text-[11px] font-medium text-[#54685C] font-mono tabular-nums">
                  {openTodosCount} uppgifter · {notes.length} notiser
                </p>
              </div>
            </div>

            {/* Filter Switcher: Alla / Uppgifter / Anteckningar */}
            <div className="flex items-center rounded-xl bg-[#F0F4F1] p-0.5 text-[11px] font-extrabold shrink-0">
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
                      ? 'bg-[#163A2B] text-white'
                      : 'text-[#54685C] hover:text-[#141E18]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick-Add Todo Input */}
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
                className="flex-1 min-w-0 rounded-xl bg-[#F4F8F5] border border-[#D4E4DA] px-3 py-2 text-xs font-bold text-[#141E18] placeholder:text-[#687D70] focus:outline-none focus:bg-white focus:border-[#163A2B]"
              />
              <select
                value={newTodoPriority}
                onChange={(e) =>
                  setNewTodoPriority(e.target.value as 'high' | 'medium' | 'low')
                }
                className="rounded-xl bg-[#F4F8F5] border border-[#D4E4DA] px-2 py-2 text-xs font-extrabold text-[#163A2B]"
                aria-label="Prioritet"
              >
                <option value="high">Hög</option>
                <option value="medium">Medel</option>
                <option value="low">Låg</option>
              </select>
              <button
                type="submit"
                className="min-h-[36px] rounded-xl bg-[#163A2B] hover:bg-[#1E4B38] px-3 py-2 text-xs font-extrabold text-white shrink-0 transition-colors"
              >
                Lägg till
              </button>
            </form>
          )}

          {/* Unified Scrollable List of Todos + Interactive Notes */}
          <div className="mt-2.5 max-h-[280px] md:max-h-none md:flex-1 md:min-h-0 overflow-y-auto pr-1 space-y-2">
            {/* 1. Todos Section */}
            {rightColumnFilter !== 'notes' &&
              sortedTodos.map((todo) => (
                <button
                  key={todo.id}
                  type="button"
                  onClick={() => onToggleTodo(todo.id)}
                  className={`w-full text-left rounded-2xl border px-3 py-2.5 flex items-center justify-between gap-2 transition-all ${
                    todo.completed
                      ? 'bg-[#F5F7F5] border-[#E5ECE7] text-[#7B8E82]'
                      : 'bg-[#FAFBF9] hover:bg-[#F0F7F2] border-[#DCE3DD] text-[#141E18]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`h-5 w-5 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                        todo.completed
                          ? 'bg-[#163A2B] border-[#163A2B] text-[#A6F2C6]'
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
                        ? 'm3-secondary-surface'
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

            {/* 2. Pinned & Interactive Notes Section */}
            {rightColumnFilter !== 'todo' &&
              sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl bg-[#FFFDF7] border border-[#E6DEC8] p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-[#8C6D1F] shrink-0" />
                      <h4 className="text-xs font-extrabold text-[#141E18] truncate">
                        {note.title}
                      </h4>
                    </div>
                    {note.favorite && (
                      <span className="rounded-md m3-secondary-surface px-1.5 py-0.5 text-[10px] font-extrabold">
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
                          className="w-full text-left flex items-center gap-2 rounded-xl bg-white/80 hover:bg-white border border-[#EDE6D3] px-2.5 py-1.5 text-xs font-bold text-[#141E18]"
                        >
                          <span
                            className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                              ci.checked
                                ? 'bg-[#163A2B] border-[#163A2B] text-[#A6F2C6]'
                                : 'bg-white border-[#9BB5A5]'
                            }`}
                          >
                            {ci.checked && <Check className="h-3 w-3 stroke-[3]" />}
                          </span>
                          <span className={ci.checked ? 'line-through text-[#7B8E82]' : ''}>
                            {ci.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-xs text-[#38493F] leading-relaxed line-clamp-4"
                      dangerouslySetInnerHTML={{ __html: note.contentHtml }}
                    />
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* On Phones when 'kitchen' tab is active: show full scrollable Ingredients & Recipe Steps directly below */}
        {mobileActiveWidget === 'kitchen' && currentRecipe && (
          <section className="flex md:hidden rounded-[24px] bg-white border border-[#DCE3DD] p-3.5 flex-col min-h-0 h-full overflow-y-auto space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#163A2B]">
                Ingredienser & Steg · {currentRecipe.title}
              </h3>
              <span className="text-[11px] font-mono tabular-nums font-bold text-[#54685C]">
                {currentRecipe.servings} port
              </span>
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
                      isChecked
                        ? 'bg-[#F5F7F5] border-[#E5ECE7] line-through text-[#7B8E82]'
                        : 'bg-[#FAFBF9] border-[#DCE3DD] text-[#141E18]'
                    }`}
                  >
                    <span>{ing.name}</span>
                    <span className="font-mono tabular-nums font-extrabold text-[#163A2B]">
                      {ing.amount} {ing.unit}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pt-2 border-t border-[#E9EFEA] space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#163A2B]">
                Gör så här
              </div>
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
                    className={`w-full text-left rounded-2xl border p-3 flex items-start gap-2.5 transition-colors ${
                      isDone
                        ? 'bg-[#F3FAF6] border-[#B8DEC6] text-[#647D6E]'
                        : 'bg-[#FAFBF9] border-[#DCE3DD] text-[#141E18]'
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-md font-mono tabular-nums text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                        isDone
                          ? 'bg-[#163A2B] text-[#A6F2C6]'
                          : 'bg-[#E6EFE9] text-[#163A2B]'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </span>
                    <span className={`text-xs font-medium leading-relaxed ${isDone ? 'line-through' : ''}`}>
                      {step}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ====================================================================
          STEP-BY-STEP KITCHEN MODE MODAL (Right inside the Screensaver!)
         ==================================================================== */}
      {kitchenModeOpen && currentRecipe && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-[28px] sm:rounded-[32px] bg-[#F4F6F3] border border-[#C8DFD0] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
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

            {/* Modal Body: Ingredients Checklist + Step-by-Step Instructions */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
              {/* Ingredients Column */}
              <div className="md:col-span-5 rounded-3xl bg-white border border-[#DCE3DD] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#163A2B]">
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
                    className="rounded-xl bg-[#E6EFE9] hover:bg-[#D5E6DC] px-2.5 py-1 text-[11px] font-extrabold text-[#163A2B]"
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
                          isChecked
                            ? 'bg-[#F5F7F5] border-[#E5ECE7] line-through text-[#7B8E82]'
                            : 'bg-[#FAFBF9] border-[#DCE3DD] text-[#141E18]'
                        }`}
                      >
                        <span>{ing.name}</span>
                        <span className="font-mono tabular-nums font-extrabold text-[#163A2B]">
                          {ing.amount} {ing.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Steps Column */}
              <div className="md:col-span-7 rounded-3xl bg-white border border-[#DCE3DD] p-4 space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#163A2B]">
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
                          isDone
                            ? 'bg-[#F3FAF6] border-[#B8DEC6] text-[#647D6E]'
                            : 'bg-[#FAFBF9] hover:bg-[#F0F7F2] border-[#DCE3DD] text-[#141E18]'
                        }`}
                      >
                        <span
                          className={`h-6 w-6 rounded-lg font-mono tabular-nums text-xs font-extrabold flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-[#163A2B] text-[#A6F2C6]'
                              : 'bg-[#E6EFE9] text-[#163A2B]'
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
