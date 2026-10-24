import React, { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  Palette,
  RefreshCw,
  Check,
  WifiOff,
  LayoutGrid,
  Lock,
  Users,
  X,
  Home,
  ShoppingCart,
  Calendar as CalendarIcon,
  CheckSquare,
  FileText,
  ChefHat,
  Wallet,
  Camera,
  Watch,
  Plus,
  Sparkles,
  Monitor,
  ChevronDown,
} from 'lucide-react';
import {
  AppNotification,
  BudgetEntry,
  BudgetMonth,
  CalendarEvent,
  EventCategory,
  NavTab,
  NoteItem,
  PhotoAlbum,
  PhotoItem,
  RecipeIngredient,
  RecipeItem,
  ShareableModule,
  ShoppingItem,
  SyncQueueItem,
  TodoItem,
  UserAccount,
} from './types';
import {
  INITIAL_BUDGET_MONTHS,
  INITIAL_CATEGORIES,
  INITIAL_EVENTS,
  INITIAL_NOTES,
  INITIAL_PHOTO_ALBUMS,
  INITIAL_PHOTOS,
  INITIAL_RECIPES,
  INITIAL_SHOPPING,
  INITIAL_TODOS,
  getOffsetDateString,
  getTodayDateString,
} from './data/initialData';
import { classifySwedishGrocery } from './utils/swedishGrocerySorter';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import {
  ensureFirebaseAuthSession,
  fetchHouseholdState,
  getConnectionSharedModules,
  getDeviceId,
  getDeviceLabel,
  hasAnySharedModule,
  loginCloudAccount,
  loginWithGoogleCloudAccount,
  logoutCloudAccount,
  registerCloudAccount,
  resolveModuleWorkspaceKey,
  sanitizeFirestoreId,
  saveHouseholdState,
  transferPrivateContentToShared,
  updateCloudAccountProfile,
  upgradeCategoriesToVibrant,
  WorkspaceDataSlice,
} from './utils/cloudHouseholdSync';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { HomeView } from './components/HomeView';
import { CalendarView } from './components/CalendarView';
import { TodoView } from './components/TodoView';
import { NotesView } from './components/NotesView';
import { ShoppingView } from './components/ShoppingView';
import { RecipesView } from './components/RecipesView';
import { BudgetApplyScope, BudgetView } from './components/BudgetView';
import { PhotosView } from './components/PhotosView';
import { CalculatorDrawer } from './components/CalculatorDrawer';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ExpressiveFAB } from './components/ExpressiveFAB';
import { WidgetSetupModal } from './components/WidgetSetupModal';
import {
  AuthGateScreen,
  ProfileMenuModal,
  SHAREABLE_PAGE_OPTIONS,
  UserAvatarBubble,
} from './components/ProfileAccountModal';
import { ScreensaverView } from './components/ScreensaverView';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function playNotificationChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Ignore audio context restrictions
  }
}

const APP_THEMES = [
  {
    id: 'forest',
    name: 'Skogsgrön & Bärnstensguld',
    subtitle: 'Android 16 · Skog, salvia & bärnsten',
    primary: '#183D2C',
    secondary: '#92400E',
    tertiary: '#0369A1',
    surface: '#F6FBF7',
    accent: '#A6F2C6',
  },
  {
    id: 'ocean',
    name: 'Västkustblå & Korall',
    subtitle: 'Android 16 · Hav, korall & turkos',
    primary: '#143B5D',
    secondary: '#9A3412',
    tertiary: '#0F766E',
    surface: '#F4F8FC',
    accent: '#9AD0FF',
  },
  {
    id: 'terracotta',
    name: 'Terrakotta & Olivlund',
    subtitle: 'Android 17 · Keramik, oliv & indigo',
    primary: '#7C2D12',
    secondary: '#365314',
    tertiary: '#4338CA',
    surface: '#FDF7F5',
    accent: '#FFC2AD',
  },
  {
    id: 'lavender',
    name: 'Ametist & Rosékvarts',
    subtitle: 'Android 17 · Viol, hallon & smaragd',
    primary: '#4C1D95',
    secondary: '#9D174D',
    tertiary: '#0F766E',
    surface: '#F8F6FC',
    accent: '#D7C2FF',
  },
  {
    id: 'rose',
    name: 'Rosé, Plommon & Guld',
    subtitle: 'Android 16 · Sommaräng, guld & viol',
    primary: '#831843',
    secondary: '#92400E',
    tertiary: '#5B21B6',
    surface: '#FDF6FA',
    accent: '#FFB8DA',
  },
  {
    id: 'slate',
    name: 'Skiffer, Kobolt & Mint',
    subtitle: 'Android 17 · Grafit, indigo & smaragd',
    primary: '#0F172A',
    secondary: '#3730A3',
    tertiary: '#065F46',
    surface: '#F8FAFC',
    accent: '#BAE6FD',
  },
] as const;

const SwipeableNotifCard: React.FC<{
  notif: AppNotification;
  onDismiss: (id: string) => void;
}> = ({ notif, onDismiss }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    setOffsetX(dx);
  };

  const handleTouchEnd = () => {
    if (startXRef.current === null) return;
    startXRef.current = null;
    setIsDragging(false);
    if (Math.abs(offsetX) > 65) {
      setOffsetX(offsetX > 0 ? 360 : -360);
      setTimeout(() => onDismiss(notif.id), 160);
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#FADAD8]">
      <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-extrabold text-[#9E2A2B]">
        <span>Svep för att ta bort</span>
        <span>Ta bort</span>
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          opacity: Math.max(0.25, 1 - Math.abs(offsetX) / 260),
          transition: isDragging ? 'none' : 'transform 0.18s ease-out, opacity 0.18s ease-out',
        }}
        className="relative rounded-2xl bg-white border border-[#DCEAE1] p-4 space-y-1 shadow-2xs select-none"
      >
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#183D2C]">
          <span className="truncate">{notif.title}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono tabular-nums text-[#54685C]">
              {notif.timestamp}
            </span>
            <button
              type="button"
              onClick={() => onDismiss(notif.id)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#54685C] hover:bg-[#FADAD8] hover:text-[#9E2A2B]"
              title="Ta bort notis"
              aria-label="Ta bort notis"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <p className="text-xs text-[#2E4035]">{notif.body}</p>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const isOnline = useOnlineStatus();

  const [currentAccount, setCurrentAccount] = useState<UserAccount | null>(() => {
    const saved = loadFromStorage<UserAccount | null>('vn_active_account_v1', null);
    if (saved && saved.passwordHash === 'firebase-auth') return saved;
    return null;
  });
  const [allAccounts, setAllAccounts] = useState<UserAccount[]>(() =>
    loadFromStorage<UserAccount[]>('vn_all_accounts_v1', [])
  );
  const [privateSlice, setPrivateSlice] = useState<Partial<WorkspaceDataSlice> | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Persistent Local & Cloud-Ready State
  const [categories, setCategories] = useState<EventCategory[]>(
    () =>
      upgradeCategoriesToVibrant(
        loadFromStorage('vn_categories_v2', INITIAL_CATEGORIES)
      ) || INITIAL_CATEGORIES
  );
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    loadFromStorage('vn_events_v2', INITIAL_EVENTS)
  );
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    loadFromStorage('vn_todos_v2', INITIAL_TODOS)
  );
  const [notes, setNotes] = useState<NoteItem[]>(() =>
    loadFromStorage('vn_notes_v2', INITIAL_NOTES)
  );
  const [shopping, setShopping] = useState<ShoppingItem[]>(() =>
    loadFromStorage('vn_shopping_v2', INITIAL_SHOPPING)
  );
  const [recipes, setRecipes] = useState<RecipeItem[]>(() =>
    loadFromStorage('vn_recipes_v2', INITIAL_RECIPES)
  );
  const [budgetMonths, setBudgetMonths] = useState<BudgetMonth[]>(() =>
    loadFromStorage('vn_budget_v2', INITIAL_BUDGET_MONTHS)
  );
  const [photos, setPhotos] = useState<PhotoItem[]>(() =>
    loadFromStorage('vn_photos_v1', INITIAL_PHOTOS)
  );
  const [photoAlbums, setPhotoAlbums] = useState<PhotoAlbum[]>(() =>
    loadFromStorage('vn_photo_albums_v1', INITIAL_PHOTO_ALBUMS)
  );
  const [activeMonthKey, setActiveMonthKey] = useState<string>('2026-10');
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadFromStorage('vn_notifications_v2', [])
  );
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() =>
    loadFromStorage('vn_sync_queue_v2', [])
  );

  // Calculator Drawer State (Strictly on Budget page)
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorCallback, setCalculatorCallback] = useState<
    ((val: number) => void) | undefined
  >(undefined);

  const memberName = currentAccount?.name?.split(' ')[0] || 'Familjemedlem';
  const lastSyncedVersionRef = React.useRef<number>(0);
  const lastSyncedHashRef = React.useRef<string>('');
  const isApplyingRemoteRef = React.useRef<boolean>(false);

  // Notification Drawer, Theme Picker, Header Dropdown Menu & Active Banner
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [appTheme, setAppTheme] = useState<string>(
    () => localStorage.getItem('vn_app_theme_v1') || 'forest'
  );
  const [toastBanner, setToastBanner] = useState<AppNotification | null>(null);
  const [toastSwipe, setToastSwipe] = useState<{
    startX: number | null;
    startY: number | null;
    dx: number;
    dy: number;
  }>({ startX: null, startY: null, dx: 0, dy: 0 });

  // Pull-to-Refresh State
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = React.useRef<number | null>(null);
  const touchStartXRef = React.useRef<number | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [keepSyncStatus] = useState<string>('Synkas automatiskt med dina valda kontakter');

  // Confirmation Dialog State
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    destructive: boolean;
    action: () => Promise<void> | void;
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Bekräfta',
    destructive: false,
    action: () => {},
  });

  // Save state to localStorage for instant offline capability
  useEffect(() => {
    if (currentAccount) {
      localStorage.setItem('vn_active_account_v1', JSON.stringify(currentAccount));
    } else {
      localStorage.removeItem('vn_active_account_v1');
    }
  }, [currentAccount]);
  useEffect(() => {
    localStorage.setItem('vn_all_accounts_v1', JSON.stringify(allAccounts));
  }, [allAccounts]);
  useEffect(() => {
    localStorage.setItem('vn_categories_v2', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem('vn_events_v2', JSON.stringify(events));
  }, [events]);
  useEffect(() => {
    localStorage.setItem('vn_todos_v2', JSON.stringify(todos));
  }, [todos]);
  useEffect(() => {
    localStorage.setItem('vn_notes_v2', JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem('vn_shopping_v2', JSON.stringify(shopping));
  }, [shopping]);
  useEffect(() => {
    localStorage.setItem('vn_recipes_v2', JSON.stringify(recipes));
  }, [recipes]);
  useEffect(() => {
    localStorage.setItem('vn_budget_v2', JSON.stringify(budgetMonths));
  }, [budgetMonths]);
  useEffect(() => {
    localStorage.setItem('vn_photos_v1', JSON.stringify(photos));
  }, [photos]);
  useEffect(() => {
    localStorage.setItem('vn_photo_albums_v1', JSON.stringify(photoAlbums));
  }, [photoAlbums]);
  useEffect(() => {
    localStorage.setItem('vn_notifications_v2', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('vn_sync_queue_v2', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Apply selected Material 3 Expressive color theme
  useEffect(() => {
    localStorage.setItem('vn_app_theme_v1', appTheme);
    document.documentElement.setAttribute('data-theme', appTheme);
    const found = APP_THEMES.find((t) => t.id === appTheme);
    if (found) {
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', found.primary);
    }
  }, [appTheme]);

  // Close calculator automatically if user leaves the budget page
  useEffect(() => {
    if (activeTab !== 'budget' && calculatorOpen) {
      setCalculatorOpen(false);
    }
  }, [activeTab, calculatorOpen]);

  const [isEditingHomeLayout, setIsEditingHomeLayout] = useState(false);

  // Exit start page layout editing mode automatically if user navigates away from Home
  useEffect(() => {
    if (activeTab !== 'home' && isEditingHomeLayout) {
      setIsEditingHomeLayout(false);
    }
  }, [activeTab, isEditingHomeLayout]);

  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showScreensaver, setShowScreensaver] = useState<boolean>(() => {
    const h = (window.location.hash || '').replace('#', '').toLowerCase();
    return h === 'screensaver' || h === 'skarmslackare';
  });
  const [screensaverIdleMinutes, setScreensaverIdleMinutes] = useState<number>(() => {
    const isSmallScreenUnder7Inch =
      typeof window !== 'undefined' &&
      Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight) < 600;
    return loadFromStorage<number>(
      'vn_screensaver_idle_mins_v2',
      isSmallScreenUnder7Inch ? 0 : 0
    );
  });

  useEffect(() => {
    localStorage.setItem(
      'vn_screensaver_idle_mins_v2',
      JSON.stringify(screensaverIdleMinutes)
    );
  }, [screensaverIdleMinutes]);

  // Automatic Screensaver Activation ONLY while the app is continuously open and visible in foreground
  useEffect(() => {
    if (!currentAccount || screensaverIdleMinutes <= 0 || showScreensaver) return;

    let lastActiveAt = Date.now();
    let lastTickAt = Date.now();

    const markUserActive = () => {
      lastActiveAt = Date.now();
      lastTickAt = Date.now();
    };

    const handleVisibilityOrFocus = () => {
      // Whenever the app returns from background/closed state or loses visibility, reset idle clock to 0
      lastActiveAt = Date.now();
      lastTickAt = Date.now();
    };

    const interval = setInterval(() => {
      const now = Date.now();
      // If the app/WebView was suspended in the background (gap > 15s), reset idle timer so it never fires on resume
      if (
        document.visibilityState !== 'visible' ||
        (typeof document.hasFocus === 'function' && !document.hasFocus()) ||
        now - lastTickAt > 15000
      ) {
        lastActiveAt = now;
        lastTickAt = now;
        return;
      }
      lastTickAt = now;
      if (now - lastActiveAt >= screensaverIdleMinutes * 60 * 1000) {
        setShowScreensaver(true);
      }
    }, 5000);

    const eventsToWatch = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    eventsToWatch.forEach((ev) =>
      window.addEventListener(ev, markUserActive, { passive: true })
    );
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('blur', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      eventsToWatch.forEach((ev) => window.removeEventListener(ev, markUserActive));
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('blur', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
    };
  }, [currentAccount, screensaverIdleMinutes, showScreensaver]);

  const [standaloneWidgetMode, setStandaloneWidgetMode] = useState<
    'shopping' | 'calendar' | 'todo' | 'all' | 'wear' | null
  >(() => {
    const h = (window.location.hash || '').replace('#', '').toLowerCase();
    if (h === 'widget-shopping') return 'shopping';
    if (h === 'widget-calendar') return 'calendar';
    if (h === 'widget-todo') return 'todo';
    if (h === 'widget-all') return 'all';
    if (h === 'wear') return 'wear';
    return null;
  });
  const [quickWidgetInput, setQuickWidgetInput] = useState('');
  const lastExplicitPushTimeRef = React.useRef<number>(0);

  // Sync data to Native Android Home Screen Widgets (Calendar, Shopping List, Todo)
  const syncAndroidNativeWidgets = useCallback(() => {
    try {
      const todayStr = getTodayDateString();
      const maxTwoWeeksStr = getOffsetDateString(14);
      const allUpcomingEvts = [...events]
        .filter((e) => e.date >= todayStr && e.date <= maxTwoWeeksStr)
        .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
      const calText =
        allUpcomingEvts.length > 0
          ? allUpcomingEvts
              .map((e) => {
                const catColor =
                  e.customColorHex ||
                  categories.find((c) => c.id === e.categoryId)?.colorHex ||
                  INITIAL_CATEGORIES.find((c) => c.id === e.categoryId)?.colorHex ||
                  '#0066FF';
                const timeRange = e.endTime ? `${e.startTime}–${e.endTime}` : e.startTime;
                return `• ${
                  e.date === todayStr ? 'Idag' : e.date.slice(5)
                } ${timeRange} — ${e.title}||${catColor}`;
              })
              .join('\n')
          : 'Inga inplanerade händelser närmaste 2 veckorna';

      const allUncheckedShop = shopping.filter((s) => !s.checked);
      const shopText =
        allUncheckedShop.length > 0
          ? allUncheckedShop.map((s) => `• ${s.name} (${s.amount} ${s.unit})`).join('\n')
          : 'Inköpslistan är tom';

      const pWeight = { high: 0, medium: 1, low: 2 };
      const allOpenTodos = [...todos]
        .filter((t) => !t.completed)
        .sort((a, b) => pWeight[a.priority] - pWeight[b.priority]);
      const todoText =
        allOpenTodos.length > 0
          ? allOpenTodos.map((t) => `• ${t.title}`).join('\n')
          : 'Alla uppgifter är avklarade!';

      const bridge = (window as any).HemWidgetBridge;
      if (bridge) {
        if (typeof bridge.updateWidgetsExpressive === 'function') {
          bridge.updateWidgetsExpressive(
            calText,
            shopText,
            todoText,
            `${allUpcomingEvts.length} st`,
            `${allUncheckedShop.length} kvar`,
            `${allOpenTodos.length} kvar`
          );
        } else if (typeof bridge.updateWidgets === 'function') {
          bridge.updateWidgets(calText, shopText, todoText);
        }
      }
    } catch {
      // Ignore outside Android native shell
    }
  }, [events, categories, shopping, todos]);

  useEffect(() => {
    syncAndroidNativeWidgets();
  }, [syncAndroidNativeWidgets]);

  // Handle deep-linking when tapping one of the 3 Android Home Screen Widgets, PWA Widget Shortcuts, or Wear OS
  useEffect(() => {
    (window as any).__hemOpenTab = (tab: string) => {
      if (
        tab === 'calendar' ||
        tab === 'shopping' ||
        tab === 'todo' ||
        tab === 'home' ||
        tab === 'notes' ||
        tab === 'recipes' ||
        tab === 'budget' ||
        tab === 'photos'
      ) {
        setStandaloneWidgetMode(null);
        setActiveTab(tab);
      }
    };
    const checkHash = () => {
      const h = (window.location.hash || '').replace('#', '').toLowerCase();
      if (h === 'widget-shopping') {
        setStandaloneWidgetMode('shopping');
        return;
      }
      if (h === 'widget-calendar') {
        setStandaloneWidgetMode('calendar');
        return;
      }
      if (h === 'widget-todo') {
        setStandaloneWidgetMode('todo');
        return;
      }
      if (h === 'widget-all') {
        setStandaloneWidgetMode('all');
        return;
      }
      if (h === 'wear') {
        setStandaloneWidgetMode('wear');
        return;
      }
      if (
        h === 'calendar' ||
        h === 'shopping' ||
        h === 'todo' ||
        h === 'home' ||
        h === 'photos' ||
        h === 'notes' ||
        h === 'recipes' ||
        h === 'budget'
      ) {
        setStandaloneWidgetMode(null);
        setActiveTab(h as NavTab);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Googlebook OS (ChromeOS) & Desktop Keyboard Shortcuts: Alt+1..8 to switch pages, Alt+W to open M3 Widgets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();
      const tabOrder: NavTab[] = [
        'home',
        'shopping',
        'calendar',
        'todo',
        'notes',
        'recipes',
        'budget',
        'photos',
      ];
      if (key >= '1' && key <= '8') {
        e.preventDefault();
        const idx = Number(key) - 1;
        if (tabOrder[idx]) {
          setStandaloneWidgetMode(null);
          setActiveTab(tabOrder[idx]);
        }
      } else if (key === 'w') {
        e.preventDefault();
        setShowWidgetModal((prev) => !prev);
      } else if (key === 's') {
        e.preventDefault();
        setShowScreensaver((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Request Native Android/iOS & Web Notification Permissions + High-Importance Channel on launch
  const ensureNotificationPermissions = useCallback(async () => {
    try {
      const capLocalNotif = (window as any).Capacitor?.Plugins?.LocalNotifications;
      if (capLocalNotif) {
        if (typeof capLocalNotif.checkPermissions === 'function') {
          const perm = await capLocalNotif.checkPermissions();
          if (perm?.display !== 'granted' && typeof capLocalNotif.requestPermissions === 'function') {
            await capLocalNotif.requestPermissions();
          }
        } else if (typeof capLocalNotif.requestPermissions === 'function') {
          await capLocalNotif.requestPermissions();
        }
        if (typeof capLocalNotif.createChannel === 'function') {
          await capLocalNotif.createChannel({
            id: 'hem_alerts_high',
            name: 'Hem Hushållsnotiser',
            description: 'Notiser i realtid mellan dina enheter (telefon & surfplatta) och familjen',
            importance: 5,
            visibility: 1,
            vibration: true,
            lights: true,
          });
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }
    } catch {
      // Ignore permission errors in restricted contexts
    }
  }, []);

  useEffect(() => {
    ensureNotificationPermissions();
    const handleFirstInteraction = () => {
      ensureNotificationPermissions();
      window.removeEventListener('pointerdown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    return () => window.removeEventListener('pointerdown', handleFirstInteraction);
  }, [ensureNotificationPermissions]);

  // Deterministic integer ID (matches Java String.hashCode() math in HemSyncService)
  const computeDeterministicNativeId = useCallback((idStr: string): number => {
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = (hash * 31 + idStr.charCodeAt(i)) | 0;
    }
    return ((hash & 0x7fffffff) % 800000) + 100000;
  }, []);

  const isDeletionSummary = useCallback((summary?: string): boolean => {
    const s = (summary || '').trim().toLowerCase();
    return (
      s.startsWith('tog bort') ||
      s.startsWith('rensade') ||
      s.startsWith('raderade') ||
      s.startsWith('bockade av') ||
      s.startsWith('återställde') ||
      s.startsWith('gjorde klart') ||
      s.startsWith('återöppnade') ||
      s.startsWith('uppdaterade') ||
      s.startsWith('flyttade')
    );
  }, []);

  const formatHemNotificationBody = useCallback(
    (actionType: string, rawSummary?: string): string => {
      const pageMap: Record<string, string> = {
        shopping: 'Inköpslista',
        calendar: 'Kalender',
        todo: 'Att göra',
        photos: 'Foton',
        notes: 'Anteckningar',
        recipes: 'Recept',
        budget: 'Budget',
      };
      const pageName = pageMap[actionType] || 'Hem';
      let text = (rawSummary || '').trim();
      if (!text) return pageName;
      if (text.toLowerCase().startsWith(pageName.toLowerCase() + ':')) {
        return text;
      }
      text = text
        .replace(/^Lade till\s+/i, '')
        .replace(/\s+i inköpslistan$/i, '')
        .replace(/^Ny kalenderhändelse:\s*/i, '')
        .replace(/^Ny uppgift:\s*/i, '')
        .replace(/^Skapade anteckningen\s*/i, '')
        .replace(/^Lade till receptet\s*/i, '')
        .replace(/^Skapade bildalbumet\s*/i, '')
        .replace(/^Skapade budgetmånaden\s*/i, '')
        .replace(/^"(.+)"$/, '$1')
        .trim();
      return `${pageName}: ${text}`;
    },
    []
  );

  // Trigger Notification helper (In-App + Native Android Bridge/Capacitor + ServiceWorker PWA + Sound)
  const pushNotification = useCallback(
    (
      title: string,
      body: string,
      type: AppNotification['type'],
      explicitId?: string,
      explicitNativeId?: number,
      alreadyOnStatusBar?: boolean
    ) => {
      // Never send a notification when synchronization completes
      if (type === 'sync') {
        return;
      }

      const notifId =
        explicitId || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nativeId = explicitNativeId ?? computeDeterministicNativeId(notifId);
      const createdAtMs = Date.now();

      const newNotif: AppNotification = {
        id: notifId,
        title,
        body,
        timestamp: new Date().toLocaleTimeString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        type,
        read: false,
        nativeId,
        createdAtMs,
        deliveredToStatusBar: Boolean(alreadyOnStatusBar),
        swDeliveredToStatusBar: false,
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.id === notifId || (n.nativeId && n.nativeId === nativeId))) {
          return prev;
        }
        return [newNotif, ...prev.slice(0, 29)];
      });

      if (!alreadyOnStatusBar) {
        setToastBanner(newNotif);
        playNotificationChime();
      }

      if (alreadyOnStatusBar) {
        return;
      }

      // 1. Native Android Bridge (HemNativeBridge) if running inside the signed Android app
      const nativeBridge = (window as any).HemNativeBridge;
      if (nativeBridge && typeof nativeBridge.postNotification === 'function') {
        try {
          nativeBridge.postNotification(nativeId, title, body, notifId, type);
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notifId ? { ...n, deliveredToStatusBar: true } : n
            )
          );
          return;
        } catch {
          // Fall through to Capacitor LocalNotifications
        }
      }

      // 2. Native Android / iOS Capacitor LocalNotifications support
      const capLocalNotif = (window as any).Capacitor?.Plugins?.LocalNotifications;
      if (capLocalNotif?.schedule) {
        capLocalNotif
          .schedule({
            notifications: [
              {
                id: nativeId,
                title,
                body,
                channelId: 'hem_alerts_high',
                smallIcon: 'ic_stat_hem',
                iconColor: '#183D2C',
                extra: { appNotifId: notifId },
              },
            ],
          })
          .then(() => {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === notifId ? { ...n, deliveredToStatusBar: true } : n
              )
            );
          })
          .catch(() => {});
        return;
      }

      // 3. Web / Mobile PWA ServiceWorker + Notification API support
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          const iconUrl = `${import.meta.env.BASE_URL}pwa-192x192.png`;
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker
              .getRegistration()
              .then((reg) => {
                if (reg && typeof reg.showNotification === 'function') {
                  return reg
                    .showNotification(title, {
                      body,
                      icon: iconUrl,
                      badge: iconUrl,
                      tag: notifId,
                      data: { appNotifId: notifId, nativeId },
                    })
                    .then(() => {
                      setNotifications((prev) =>
                        prev.map((n) =>
                          n.id === notifId ? { ...n, swDeliveredToStatusBar: true } : n
                        )
                      );
                    });
                }
                new Notification(title, { body, icon: iconUrl, tag: notifId });
              })
              .catch(() => {
                try {
                  new Notification(title, { body, icon: iconUrl, tag: notifId });
                } catch {
                  // Ignore on mobile browsers requiring SW
                }
              });
          } else {
            try {
              new Notification(title, { body, icon: iconUrl, tag: notifId });
            } catch {
              // Ignore in restricted iframe
            }
          }
        }
      }
    },
    [computeDeterministicNativeId]
  );

  // Helper to remove a notification both from the app AND from the Android status bar
  const dismissNotificationEverywhere = useCallback((targetId: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === targetId);
      if (target) {
        const nativeBridge = (window as any).HemNativeBridge;
        if (nativeBridge && typeof nativeBridge.cancelNotification === 'function' && target.nativeId) {
          try {
            nativeBridge.cancelNotification(target.nativeId);
          } catch {
            // Ignore
          }
        }
        const capLocalNotif = (window as any).Capacitor?.Plugins?.LocalNotifications;
        if (capLocalNotif?.removeDeliveredNotifications && target.nativeId) {
          capLocalNotif
            .removeDeliveredNotifications({
              notifications: [{ id: target.nativeId }],
            })
            .catch(() => {});
        }
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker
            .getRegistration()
            .then((reg) => reg?.getNotifications({ tag: target.id }))
            .then((list) => list?.forEach((n) => n.close()))
            .catch(() => {});
        }
      }
      return prev.filter((n) => n.id !== targetId);
    });
    setToastBanner((prev) => (prev?.id === targetId ? null : prev));
  }, []);

  const clearAllNotificationsEverywhere = useCallback(() => {
    setNotifications([]);
    setToastBanner(null);
    const nativeBridge = (window as any).HemNativeBridge;
    if (nativeBridge && typeof nativeBridge.cancelAllNotifications === 'function') {
      try {
        nativeBridge.cancelAllNotifications();
      } catch {
        // Ignore
      }
    }
    const capLocalNotif = (window as any).Capacitor?.Plugins?.LocalNotifications;
    if (capLocalNotif?.removeAllDeliveredNotifications) {
      capLocalNotif.removeAllDeliveredNotifications().catch(() => {});
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.getNotifications())
        .then((list) => list?.forEach((n) => n.close()))
        .catch(() => {});
    }
  }, []);

  // Synchronize Android Status Bar dismissals -> In-App Notifications
  // When the user swipes away a notification from the Android status bar, it automatically disappears inside the app too!
  const syncStatusBarDismissals = useCallback(async () => {
    try {
      const now = Date.now();
      const nativeBridge = (window as any).HemNativeBridge;

      // 1. Check Native Android Bridge (if running in native Android app)
      if (nativeBridge && typeof nativeBridge.getActiveNotificationIds === 'function') {
        const activeJson = nativeBridge.getActiveNotificationIds();
        const activeIdsArr: number[] = JSON.parse(activeJson || '[]');
        const activeNativeIds = new Set<number>(activeIdsArr.map(Number));

        // First import any background notifications posted by HemSyncService while app was in background/closed
        // (Only those that have NOT already been swiped away from the status bar, and without re-triggering toast/sound!)
        if (typeof nativeBridge.consumePostedNotifications === 'function') {
          const postedJson = nativeBridge.consumePostedNotifications();
          const postedList = JSON.parse(postedJson || '[]');
          if (Array.isArray(postedList) && postedList.length > 0) {
            const seenSet = seenActionIdsRef.current || new Set(loadFromStorage<string[]>('vn_seen_action_ids_v1', []));
            seenActionIdsRef.current = seenSet;
            for (const item of postedList) {
              if (item?.actionId) {
                seenSet.add(item.actionId);
              }
              if (item && activeNativeIds.has(Number(item.nativeId))) {
                const notifId = item.id || `notif-${item.actionId || Date.now()}`;
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === notifId)) return prev;
                  return [
                    {
                      id: notifId,
                      title: 'Hem',
                      body: item.body || '',
                      timestamp: new Date().toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                      type: item.type || 'shopping',
                      read: false,
                      nativeId: Number(item.nativeId),
                      createdAtMs: Date.now() - 5000,
                      deliveredToStatusBar: true,
                    },
                    ...prev.slice(0, 29),
                  ];
                });
              }
            }
            try {
              localStorage.setItem(
                'vn_seen_action_ids_v1',
                JSON.stringify(Array.from(seenSet).slice(-120))
              );
            } catch {
              // Ignore
            }
          }
        }

        // Remove any in-app notification that was delivered to the Android status bar and has now been swiped away
        setNotifications((prev) => {
          const next = prev.filter((n) => {
            if (!n.deliveredToStatusBar || !n.nativeId) return true;
            if (now - (n.createdAtMs || 0) < 2500) return true;
            return activeNativeIds.has(n.nativeId);
          });
          return next.length === prev.length ? prev : next;
        });
        setToastBanner((prev) => {
          if (!prev || !prev.deliveredToStatusBar || !prev.nativeId) return prev;
          if (now - (prev.createdAtMs || 0) < 2500) return prev;
          return activeNativeIds.has(prev.nativeId) ? prev : null;
        });
        return;
      }

      // 2. Check Capacitor LocalNotifications delivered notifications in Android status bar
      const capLocalNotif = (window as any).Capacitor?.Plugins?.LocalNotifications;
      if (capLocalNotif && typeof capLocalNotif.getDeliveredNotifications === 'function') {
        const res = await capLocalNotif.getDeliveredNotifications();
        if (res && Array.isArray(res.notifications)) {
          const activeNativeIds = new Set<number>(
            res.notifications.map((x: any) => Number(x.id))
          );
          setNotifications((prev) => {
            const next = prev.filter((n) => {
              if (!n.deliveredToStatusBar || !n.nativeId) return true;
              if (now - (n.createdAtMs || 0) < 2500) return true;
              return activeNativeIds.has(n.nativeId);
            });
            return next.length === prev.length ? prev : next;
          });
          setToastBanner((prev) => {
            if (!prev || !prev.deliveredToStatusBar || !prev.nativeId) return prev;
            if (now - (prev.createdAtMs || 0) < 2500) return prev;
            return activeNativeIds.has(prev.nativeId) ? prev : null;
          });
        }
      }

      // 3. Check PWA Service Worker notifications in status bar
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.getNotifications === 'function') {
          const activeSwNotifs = await reg.getNotifications();
          const activeTags = new Set<string>(
            activeSwNotifs.map((x) => x.tag).filter(Boolean)
          );
          setNotifications((prev) => {
            const next = prev.filter((n) => {
              if (!n.swDeliveredToStatusBar) return true;
              if (now - (n.createdAtMs || 0) < 2500) return true;
              return activeTags.has(n.id);
            });
            return next.length === prev.length ? prev : next;
          });
          setToastBanner((prev) => {
            if (!prev || !prev.swDeliveredToStatusBar) return prev;
            if (now - (prev.createdAtMs || 0) < 2500) return prev;
            return activeTags.has(prev.id) ? prev : null;
          });
        }
        navigator.serviceWorker.controller?.postMessage({
          type: 'HEM_SW_GET_DISMISSED',
        });
      }
    } catch {
      // Ignore in restricted environments
    }
  }, [pushNotification]);

  useEffect(() => {
    syncStatusBarDismissals();
    const interval = setInterval(syncStatusBarDismissals, 6000);
    const onVisOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncStatusBarDismissals();
      }
    };
    window.addEventListener('focus', onVisOrFocus);
    document.addEventListener('visibilitychange', onVisOrFocus);

    // Listen to Service Worker notificationclose / notificationclick messages
    const handleSwMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'HEM_NOTIFICATION_DISMISSED' && (data.id || data.tag)) {
        const targetId = data.id || data.tag;
        setNotifications((prev) => prev.filter((n) => n.id !== targetId));
        setToastBanner((prev) => (prev?.id === targetId ? null : prev));
      } else if (
        data.type === 'HEM_SW_DISMISSED_LIST' &&
        Array.isArray(data.ids) &&
        data.ids.length > 0
      ) {
        const dismissedSet = new Set<string>(data.ids);
        setNotifications((prev) => prev.filter((n) => !dismissedSet.has(n.id)));
      } else if (data.type === 'HEM_SW_NOTIFICATION_POSTED' && data.notification) {
        const nb = data.notification;
        if (nb.actionId && seenActionIdsRef.current) {
          seenActionIdsRef.current.add(nb.actionId);
        }
        setNotifications((prev) => {
          if (prev.some((n) => n.id === nb.id)) return prev;
          return [
            {
              id: nb.id,
              title: nb.title,
              body: nb.body,
              timestamp: new Date().toLocaleTimeString('sv-SE', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              type: nb.type || 'shopping',
              read: false,
              createdAtMs: nb.createdAtMs || Date.now(),
              swDeliveredToStatusBar: true,
            },
            ...prev.slice(0, 29),
          ];
        });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    // Also listen for Capacitor notification tap / action events
    const capLocalNotif = (window as any).Capacitor?.Plugins?.LocalNotifications;
    let capListenerHandle: any = null;
    if (capLocalNotif && typeof capLocalNotif.addListener === 'function') {
      capListenerHandle = capLocalNotif.addListener(
        'localNotificationActionPerformed',
        (evt: any) => {
          const notifId = evt?.notification?.extra?.appNotifId;
          const nativeId = Number(evt?.notification?.id);
          setNotifications((prev) =>
            prev.filter(
              (n) =>
                (notifId ? n.id !== notifId : true) &&
                (nativeId ? n.nativeId !== nativeId : true)
            )
          );
        }
      );
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onVisOrFocus);
      document.removeEventListener('visibilitychange', onVisOrFocus);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
      if (capListenerHandle && typeof capListenerHandle.remove === 'function') {
        capListenerHandle.remove();
      }
    };
  }, [syncStatusBarDismissals]);

  // Auto-hide toast banner after 4.5s & reset swipe offset when banner changes
  useEffect(() => {
    setToastSwipe({ startX: null, startY: null, dx: 0, dy: 0 });
    if (!toastBanner) return;
    const t = setTimeout(() => setToastBanner(null), 4800);
    return () => clearTimeout(t);
  }, [toastBanner]);

  // Cross-Device Household & Shared Friends Sync
  const pushHouseholdState = useCallback(
    async (
      summary: string,
      actionType:
        | 'calendar'
        | 'todo'
        | 'shopping'
        | 'photos'
        | 'notes'
        | 'recipes'
        | 'budget'
        | 'sync',
      overrides?: Partial<{
        categories: EventCategory[];
        events: CalendarEvent[];
        todos: TodoItem[];
        notes: NoteItem[];
        shopping: ShoppingItem[];
        recipes: RecipeItem[];
        budgetMonths: BudgetMonth[];
        photos: PhotoItem[];
        photoAlbums: PhotoAlbum[];
      }>
    ) => {
      if (!isOnline || (!overrides && isApplyingRemoteRef.current) || !currentAccount) return;
      lastExplicitPushTimeRef.current = Date.now();
      try {
        const changedModules: ShareableModule[] = [];
        if (overrides) {
          if (overrides.categories !== undefined || overrides.events !== undefined) {
            changedModules.push('calendar');
          }
          if (overrides.todos !== undefined) changedModules.push('todo');
          if (overrides.notes !== undefined) changedModules.push('notes');
          if (overrides.shopping !== undefined) changedModules.push('shopping');
          if (overrides.recipes !== undefined) changedModules.push('recipes');
          if (overrides.budgetMonths !== undefined) changedModules.push('budget');
          if (overrides.photos !== undefined || overrides.photoAlbums !== undefined) {
            changedModules.push('photos');
          }
        }
        const actorName = currentAccount.name.split(' ')[0] || memberName;
        const nextVer = await saveHouseholdState(
          {
            updatedBy: actorName,
            updatedByDeviceId: getDeviceId(),
            lastActionSummary: summary,
            lastActionType: actionType,
            categories: overrides?.categories ?? categories,
            events: overrides?.events ?? events,
            todos: overrides?.todos ?? todos,
            notes: overrides?.notes ?? notes,
            shopping: overrides?.shopping ?? shopping,
            recipes: overrides?.recipes ?? recipes,
            budgetMonths: overrides?.budgetMonths ?? budgetMonths,
            photos: overrides?.photos ?? photos,
            photoAlbums: overrides?.photoAlbums ?? photoAlbums,
          },
          lastSyncedVersionRef.current,
          currentAccount.email,
          changedModules.length > 0 ? changedModules : undefined
        );
        if (typeof nextVer === 'number' && nextVer > 0) {
          lastSyncedVersionRef.current = Math.max(lastSyncedVersionRef.current, nextVer);
        }
      } catch {
        // Offline fallback handled via localStorage
      }
    },
    [
      isOnline,
      currentAccount,
      memberName,
      categories,
      events,
      todos,
      notes,
      shopping,
      recipes,
      budgetMonths,
      photos,
      photoAlbums,
    ]
  );

  // Track which cloud action IDs THIS physical device has already displayed notifications for
  const seenActionIdsRef = React.useRef<Set<string> | null>(null);
  const initializedActionQueueRef = React.useRef<boolean>(false);

  const getDeviceSeenActions = useCallback((): Set<string> => {
    if (!seenActionIdsRef.current) {
      const saved = loadFromStorage<string[]>('vn_seen_action_ids_v1', []);
      seenActionIdsRef.current = new Set(saved);
    }
    return seenActionIdsRef.current;
  }, []);

  const markDeviceSeenActions = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const set = getDeviceSeenActions();
    ids.forEach((id) => set.add(id));
    const arr = Array.from(set).slice(-120);
    seenActionIdsRef.current = new Set(arr);
    try {
      localStorage.setItem('vn_seen_action_ids_v1', JSON.stringify(arr));
    } catch {
      // Ignore storage quota
    }
    const nativeBridge = (window as any).HemNativeBridge;
    if (nativeBridge && typeof nativeBridge.markActionsSeen === 'function') {
      try {
        nativeBridge.markActionsSeen(JSON.stringify(arr));
      } catch {
        // Ignore
      }
    }
  }, [getDeviceSeenActions]);

  // Keep Native Android Background Service & PWA Service Worker informed of current user + deviceId + seenIds + active Firestore workspace IDs
  useEffect(() => {
    if (!currentAccount) return;
    const email = currentAccount.email.trim().toLowerCase();
    const devId = getDeviceId();
    const devLabel = getDeviceLabel();
    const seenArr = Array.from(getDeviceSeenActions());
    const wsDocIdSet = new Set<string>();
    wsDocIdSet.add(sanitizeFirestoreId(`priv_${email}`));
    for (const conn of currentAccount.connections || []) {
      const otherEmail = conn.email.trim().toLowerCase();
      if (otherEmail) {
        const pair = [email, otherEmail].sort().join('__');
        wsDocIdSet.add(sanitizeFirestoreId(`shared_${pair}`));
      }
    }
    for (const mod of [
      'calendar',
      'todo',
      'shopping',
      'photos',
      'notes',
      'recipes',
      'budget',
    ] as ShareableModule[]) {
      const rawKey = resolveModuleWorkspaceKey(email, mod, allAccounts);
      wsDocIdSet.add(sanitizeFirestoreId(rawKey));
    }
    const wsDocIdsArr = Array.from(wsDocIdSet);

    const syncBgToken = async () => {
      let fbToken = '';
      try {
        if (auth.currentUser) {
          fbToken = await auth.currentUser.getIdToken();
        }
      } catch {
        // Ignore
      }

      const nativeBridge = (window as any).HemNativeBridge;
      if (nativeBridge) {
        try {
          if (typeof nativeBridge.syncConfigWithFirebase === 'function') {
            nativeBridge.syncConfigWithFirebase(
              email,
              devId,
              devLabel,
              JSON.stringify(seenArr),
              JSON.stringify(wsDocIdsArr),
              fbToken
            );
          } else if (typeof nativeBridge.syncConfigWithWorkspaces === 'function') {
            nativeBridge.syncConfigWithWorkspaces(
              email,
              devId,
              devLabel,
              JSON.stringify(seenArr),
              JSON.stringify(wsDocIdsArr)
            );
          }
        } catch {
          // Ignore
        }
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.active?.postMessage({
              type: 'HEM_SW_CONFIG',
              email,
              deviceId: devId,
              deviceLabel: devLabel,
              firebaseToken: fbToken,
              wsDocIds: wsDocIdsArr,
              seenIds: seenArr,
            });
            if ('periodicSync' in reg) {
              (reg as any).periodicSync
                .register('hem-household-sync', { minInterval: 60 * 1000 })
                .catch(() => {});
            }
          })
          .catch(() => {});
      }
    };

    syncBgToken();
  }, [currentAccount, allAccounts, getDeviceSeenActions, notifications.length]);

  useEffect(() => {
    if (!isOnline || !currentAccount) return;
    let active = true;

    const pollHousehold = async () => {
      try {
        // First pull any notifications already posted by native background service
        await syncStatusBarDismissals();

        const data = await fetchHouseholdState(currentAccount.email);
        if (!data || !active) return;

        let profileConnectionsChanged = false;
        if (Array.isArray(data.accounts)) {
          setAllAccounts((prev) =>
            JSON.stringify(prev) !== JSON.stringify(data.accounts) ? data.accounts! : prev
          );
          const refreshedMe = data.accounts.find(
            (a) => a.email.trim().toLowerCase() === currentAccount.email.trim().toLowerCase()
          );
          if (
            refreshedMe &&
            JSON.stringify(refreshedMe) !== JSON.stringify(currentAccount)
          ) {
            profileConnectionsChanged = true;
            setCurrentAccount(refreshedMe);
          }
        }

        if (data.privateSlice) {
          setPrivateSlice(data.privateSlice);
        }

        if (!data.initialized) {
          await pushHouseholdState('Initierade arbetsyta', 'sync');
          return;
        }

        const myDeviceId = getDeviceId();
        const seenSet = getDeviceSeenActions();
        const isFirstPollOnThisDevice = !initializedActionQueueRef.current;
        initializedActionQueueRef.current = true;

        // 1. Apply updated workspace data whenever cloud version advances, syncHash changes, or sharing connections change
        const hasNewSyncHash = Boolean(
          data.syncHash && data.syncHash !== lastSyncedHashRef.current
        );
        const recentlyPushedHere = Date.now() - lastExplicitPushTimeRef.current < 2200;

        if (
          !recentlyPushedHere &&
          (profileConnectionsChanged ||
            hasNewSyncHash ||
            (typeof data.version === 'number' &&
              data.version > lastSyncedVersionRef.current))
        ) {
          if (localStorage.getItem('vn_rescued_run35_shop_v1') !== 'true') {
            localStorage.setItem('vn_rescued_run35_shop_v1', 'true');
            const localShop = loadFromStorage<ShoppingItem[]>('vn_shopping_v2', []);
            if (localShop.length > 0 && (!data.shopping || data.shopping.length === 0)) {
              try {
                const newVer = await saveHouseholdState(
                  {
                    updatedBy: memberName,
                    lastActionSummary: `Lade till ${localShop[0].name} (${localShop[0].amount || 1} ${localShop[0].unit || 'st'}) i inköpslistan`,
                    lastActionType: 'shopping',
                    shopping: localShop,
                  },
                  data.version || lastSyncedVersionRef.current,
                  currentAccount.email,
                  ['shopping']
                );
                data.version = newVer;
                data.shopping = localShop;
              } catch {
                // Ignore if offline
              }
            }
          }
          if (typeof data.version === 'number') {
            lastSyncedVersionRef.current = data.version;
          }
          if (data.syncHash) {
            lastSyncedHashRef.current = data.syncHash;
          }
          isApplyingRemoteRef.current = true;
          if (Array.isArray(data.categories) && data.categories.length > 0)
            setCategories(data.categories);
          if (Array.isArray(data.events)) {
            setEvents((prev) => {
              if (
                data.events!.length === 0 &&
                prev.length > 0 &&
                data.lastActionType !== 'calendar'
              ) {
                return prev;
              }
              return data.events!;
            });
          }
          if (Array.isArray(data.todos)) setTodos(data.todos);
          if (Array.isArray(data.notes)) setNotes(data.notes);
          if (Array.isArray(data.shopping)) setShopping(data.shopping);
          if (Array.isArray(data.recipes)) setRecipes(data.recipes);
          if (Array.isArray(data.budgetMonths)) {
            const incomingHasEntries = data.budgetMonths.some(
              (m) => Array.isArray(m.entries) && m.entries.length > 0
            );
            setBudgetMonths((prev) => {
              const prevHasEntries = prev.some(
                (m) => Array.isArray(m.entries) && m.entries.length > 0
              );
              if (!incomingHasEntries && prevHasEntries && data.lastActionType !== 'budget') {
                return prev;
              }
              return data.budgetMonths!;
            });
          }
          if (Array.isArray(data.photos)) {
            const localPhotos = loadFromStorage<PhotoItem[]>('vn_photos_v1', []);
            const localAlbums = loadFromStorage<PhotoAlbum[]>('vn_photo_albums_v1', []);
            const remotePhotoIds = new Set((data.photos || []).map((p) => p.id));
            const isPhotoDeletion = (data.lastActionSummary || '')
              .toLowerCase()
              .includes('tog bort en bild');
            const unsyncedLocalPhotos = !isPhotoDeletion
              ? localPhotos.filter(
                  (lp) => lp && lp.id && lp.imageUrl && !remotePhotoIds.has(lp.id)
                )
              : [];

            if (unsyncedLocalPhotos.length > 0) {
              const mergedPhotos = [...unsyncedLocalPhotos, ...(data.photos || [])];
              const remoteAlbumIds = new Set((data.photoAlbums || []).map((a) => a.id));
              const unsyncedAlbums = localAlbums.filter(
                (la) => la && la.id && !remoteAlbumIds.has(la.id)
              );
              const mergedAlbums = [...(data.photoAlbums || []), ...unsyncedAlbums];
              setPhotos(mergedPhotos);
              setPhotoAlbums(mergedAlbums);
              saveHouseholdState(
                {
                  updatedBy: memberName,
                  updatedByDeviceId: getDeviceId(),
                  lastActionSummary: `Foton: ${
                    unsyncedLocalPhotos.length === 1
                      ? unsyncedLocalPhotos[0].caption || 'Ny bild'
                      : `${unsyncedLocalPhotos.length} nya bilder`
                  }`,
                  lastActionType: 'photos',
                  photos: mergedPhotos,
                  photoAlbums: mergedAlbums,
                },
                data.version || lastSyncedVersionRef.current,
                currentAccount.email,
                ['photos']
              )
                .then((ver) => {
                  if (typeof ver === 'number' && ver > 0) {
                    lastSyncedVersionRef.current = Math.max(
                      lastSyncedVersionRef.current,
                      ver
                    );
                  }
                })
                .catch(() => {});
            } else {
              setPhotos(data.photos);
              if (Array.isArray(data.photoAlbums)) setPhotoAlbums(data.photoAlbums);
            }
          } else if (Array.isArray(data.photoAlbums)) {
            setPhotoAlbums(data.photoAlbums);
          }
          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 900);
        }

        // 2. Process per-device notifications from recentActions (works across Phone & Tablet on SAME account!)
        if (Array.isArray(data.recentActions) && data.recentActions.length > 0) {
          const nowMs = Date.now();
          const newlySeen: string[] = [];
          const nativeBridge = (window as any).HemNativeBridge;

          // If running inside Android native app while in the background, let HemSyncService handle status bar notifications
          if (nativeBridge && document.visibilityState !== 'visible') {
            return;
          }

          // Iterate oldest-to-newest so multiple notifications appear in chronological order
          const chronological = [...data.recentActions].reverse();
          for (const act of chronological) {
            if (!act || !act.id || seenSet.has(act.id)) continue;
            newlySeen.push(act.id);

            // Check if native background service already handled this action
            if (
              nativeBridge &&
              typeof nativeBridge.hasSeenAction === 'function' &&
              nativeBridge.hasSeenAction(act.id)
            ) {
              continue;
            }

            // Never notify the exact physical device that created the action
            if (act.deviceId === myDeviceId) continue;

            // Never notify for sync actions or when something is deleted, checked off, or updated
            if (act.actionType === 'sync' || isDeletionSummary(act.summary)) continue;

            // Skip historical actions older than 3 minutes so opening the app after hours away never floods old notifications
            const ageMs = nowMs - new Date(act.createdAt || 0).getTime();
            if (ageMs > 180000 || (isFirstPollOnThisDevice && ageMs > 120000)) continue;

            const notifId = `notif-${act.id}`;
            pushNotification(
              'Hem',
              formatHemNotificationBody(act.actionType, act.summary),
              act.actionType,
              notifId,
              computeDeterministicNativeId(act.id)
            );
          }
          if (newlySeen.length > 0) {
            markDeviceSeenActions(newlySeen);
          }
        } else if (data.updatedByDeviceId && data.updatedByDeviceId !== myDeviceId) {
          // Fallback for actions from older app builds without recentActions array
          const fallbackId =
            data.lastActionId || `legacy-v${data.version}-${data.updatedByDeviceId}`;
          if (!seenSet.has(fallbackId)) {
            markDeviceSeenActions([fallbackId]);
            if (
              !isFirstPollOnThisDevice &&
              data.lastActionType &&
              data.lastActionType !== 'sync' &&
              !isDeletionSummary(data.lastActionSummary)
            ) {
              pushNotification(
                'Hem',
                formatHemNotificationBody(data.lastActionType, data.lastActionSummary),
                data.lastActionType,
                `notif-${fallbackId}`,
                computeDeterministicNativeId(fallbackId)
              );
            }
          }
        }
      } catch {
        // Ignore transient network errors
      }
    };

    pollHousehold();
    const timer = setInterval(pollHousehold, 30000);

    // Also run an unthrottled Web Worker timer so background polling lasts much longer when minimized
    let pollWorker: Worker | null = null;
    try {
      const workerBlob = new Blob(
        [
          `setInterval(() => { postMessage('tick'); }, 60000);`,
        ],
        { type: 'application/javascript' }
      );
      const workerUrl = URL.createObjectURL(workerBlob);
      pollWorker = new Worker(workerUrl);
      pollWorker.onmessage = () => {
        if (document.visibilityState !== 'visible') {
          pollHousehold();
        }
      };
    } catch {
      // Ignore if Worker is blocked
    }

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        pollHousehold();
      } else if ('serviceWorker' in navigator) {
        const email = currentAccount.email.trim().toLowerCase();
        const wsDocIdSet = new Set<string>();
        wsDocIdSet.add(sanitizeFirestoreId(`priv_${email}`));
        for (const conn of currentAccount.connections || []) {
          const otherEmail = conn.email.trim().toLowerCase();
          if (otherEmail) {
            const pair = [email, otherEmail].sort().join('__');
            wsDocIdSet.add(sanitizeFirestoreId(`shared_${pair}`));
          }
        }
        for (const mod of [
          'calendar',
          'todo',
          'shopping',
          'photos',
          'notes',
          'recipes',
          'budget',
        ] as ShareableModule[]) {
          wsDocIdSet.add(
            sanitizeFirestoreId(resolveModuleWorkspaceKey(email, mod, allAccounts))
          );
        }
        // Hand off immediate background polling to Service Worker when minimized
        navigator.serviceWorker.controller?.postMessage({
          type: 'HEM_SW_CONFIG',
          email,
          deviceId: getDeviceId(),
          deviceLabel: getDeviceLabel(),
          wsDocIds: Array.from(wsDocIdSet),
          seenIds: Array.from(getDeviceSeenActions()),
          triggerPollNow: true,
        });
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    return () => {
      active = false;
      clearInterval(timer);
      if (pollWorker) {
        pollWorker.terminate();
      }
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [
    isOnline,
    currentAccount,
    allAccounts,
    pushHouseholdState,
    pushNotification,
    getDeviceSeenActions,
    markDeviceSeenActions,
    syncStatusBarDismissals,
    computeDeterministicNativeId,
    isDeletionSummary,
    formatHemNotificationBody,
  ]);

  // Push local changes for notes, recipes & budget to shared household store after a short debounce
  useEffect(() => {
    if (
      !isOnline ||
      !currentAccount ||
      isApplyingRemoteRef.current ||
      lastSyncedVersionRef.current === 0
    ) {
      return;
    }
    const t = setTimeout(() => {
      if (
        isApplyingRemoteRef.current ||
        Date.now() - lastExplicitPushTimeRef.current < 3500
      ) {
        return;
      }
      pushHouseholdState('Uppdaterade innehåll', 'sync');
    }, 800);
    return () => clearTimeout(t);
    // Only trigger background 'sync' when notes, recipes, budgetMonths, photos, or photoAlbums change locally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, recipes, budgetMonths, photos, photoAlbums]);

  // Per-Device Timed Reminder Check (Every 15 seconds) for Calendar & Todo
  // Stored per physical device in localStorage so BOTH phone and tablet fire reminders independently on the same account!
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayStr = getTodayDateString();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      const notifiedOnThisDevice = new Set<string>(
        loadFromStorage<string[]>('vn_device_notified_reminders_v1', [])
      );
      let updatedSet = false;

      // 1. Check Todo timed reminders on this device
      for (const t of todos) {
        if (
          !t.completed &&
          t.dueDate === todayStr &&
          t.reminderTime &&
          t.reminderTime === currentHHMM
        ) {
          const reminderKey = `todo-${t.id}-${todayStr}-${t.reminderTime}`;
          if (!notifiedOnThisDevice.has(reminderKey)) {
            notifiedOnThisDevice.add(reminderKey);
            updatedSet = true;
            pushNotification(
              'Hem',
              `Att göra: ${t.title} (kl ${t.reminderTime})`,
              'todo'
            );
          }
        }
      }

      // 2. Check Calendar event reminders on this device
      for (const e of events) {
        if (
          e.date === todayStr &&
          e.reminderMinutesBefore !== undefined &&
          e.reminderMinutesBefore >= 0
        ) {
          const timeStr = e.isAllDay ? '09:00' : e.startTime;
          const [eh, em] = timeStr.split(':').map(Number);
          const eventTimeMs = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            eh || 9,
            em || 0
          ).getTime();
          const diffMinutes = Math.round((eventTimeMs - now.getTime()) / 60000);
          if (diffMinutes >= 0 && diffMinutes <= e.reminderMinutesBefore) {
            const reminderKey = `evt-${e.id}-${todayStr}-${timeStr}-${e.reminderMinutesBefore}`;
            if (!notifiedOnThisDevice.has(reminderKey)) {
              notifiedOnThisDevice.add(reminderKey);
              updatedSet = true;
              pushNotification(
                'Hem',
                e.isAllDay
                  ? `Kalender: ${e.title} (Heldag)`
                  : `Kalender: ${e.title} (kl ${e.startTime})`,
                'calendar'
              );
            }
          }
        }
      }

      if (updatedSet) {
        try {
          localStorage.setItem(
            'vn_device_notified_reminders_v1',
            JSON.stringify(Array.from(notifiedOnThisDevice).slice(-200))
          );
        } catch {
          // Ignore quota errors
        }
      }
    };

    // Also pre-schedule future Calendar & Todo reminders in Android OS AlarmManager via Capacitor LocalNotifications
    // so timed reminders fire reliably even if the app is completely closed!
    const scheduleUpcomingNativeReminders = async () => {
      const capLocalNotif = (window as any).Capacitor?.Plugins?.LocalNotifications;
      if (!capLocalNotif || typeof capLocalNotif.schedule !== 'function') return;
      try {
        const nowMs = Date.now();
        const toSchedule: any[] = [];

        for (const t of todos) {
          if (!t.completed && t.dueDate && t.reminderTime) {
            const [y, m, d] = t.dueDate.split('-').map(Number);
            const [hh, mm] = t.reminderTime.split(':').map(Number);
            if (y && m && d && hh !== undefined && mm !== undefined) {
              const targetDate = new Date(y, m - 1, d, hh, mm, 0);
              if (targetDate.getTime() > nowMs + 5000) {
                const key = `todo-sched-${t.id}-${t.dueDate}-${t.reminderTime}`;
                toSchedule.push({
                  id: computeDeterministicNativeId(key),
                  title: 'Hem',
                  body: `Att göra: ${t.title} (kl ${t.reminderTime})`,
                  channelId: 'hem_alerts_high',
                  smallIcon: 'ic_stat_hem',
                  iconColor: '#183D2C',
                  schedule: { at: targetDate, allowWhileIdle: true },
                  extra: { appNotifId: `notif-${key}` },
                });
              }
            }
          }
        }

        for (const e of events) {
          if (
            e.date &&
            e.startTime &&
            e.reminderMinutesBefore !== undefined &&
            e.reminderMinutesBefore >= 0
          ) {
            const timeStr = e.isAllDay ? '09:00' : e.startTime;
            const [y, m, d] = e.date.split('-').map(Number);
            const [hh, mm] = timeStr.split(':').map(Number);
            if (y && m && d && hh !== undefined && mm !== undefined) {
              const eventDate = new Date(y, m - 1, d, hh, mm, 0);
              const remindAt = new Date(
                eventDate.getTime() - e.reminderMinutesBefore * 60000
              );
              if (remindAt.getTime() > nowMs + 5000) {
                const key = `evt-sched-${e.id}-${e.date}-${timeStr}-${e.reminderMinutesBefore}`;
                toSchedule.push({
                  id: computeDeterministicNativeId(key),
                  title: 'Hem',
                  body: e.isAllDay
                    ? `Kalender: ${e.title} (${e.date})`
                    : `Kalender: ${e.title} (kl ${e.startTime})`,
                  channelId: 'hem_alerts_high',
                  smallIcon: 'ic_stat_hem',
                  iconColor: '#183D2C',
                  schedule: { at: remindAt, allowWhileIdle: true },
                  extra: { appNotifId: `notif-${key}` },
                });
              }
            }
          }
        }

        if (toSchedule.length > 0) {
          await capLocalNotif.schedule({ notifications: toSchedule });
        }
      } catch {
        // Ignore scheduling errors
      }
    };

    checkReminders();
    scheduleUpcomingNativeReminders();
    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [todos, events, pushNotification, computeDeterministicNativeId]);

  const syncSharedWorkspaceNow = useCallback(
    async (explicitEmail?: string) => {
      const targetEmail = explicitEmail || currentAccount?.email;
      if (!targetEmail) return;
      setIsSyncing(true);
      try {
        const shared = await fetchHouseholdState(targetEmail);
        if (shared && shared.initialized) {
          if (localStorage.getItem('vn_rescued_run35_shop_v1') !== 'true') {
            localStorage.setItem('vn_rescued_run35_shop_v1', 'true');
            const localShop = loadFromStorage<ShoppingItem[]>('vn_shopping_v2', []);
            if (localShop.length > 0 && (!shared.shopping || shared.shopping.length === 0)) {
              try {
                const newVer = await saveHouseholdState(
                  {
                    updatedBy: memberName,
                    lastActionSummary: `Lade till ${localShop[0].name} (${localShop[0].amount || 1} ${localShop[0].unit || 'st'}) i inköpslistan`,
                    lastActionType: 'shopping',
                    shopping: localShop,
                  },
                  shared.version || lastSyncedVersionRef.current,
                  targetEmail
                );
                shared.version = newVer;
                shared.shopping = localShop;
              } catch {
                // Ignore if offline
              }
            }
          }
          if (typeof shared.version === 'number') {
            lastSyncedVersionRef.current = shared.version;
          }
          if (shared.syncHash) {
            lastSyncedHashRef.current = shared.syncHash;
          }
          if (Array.isArray(shared.accounts)) {
            setAllAccounts(shared.accounts);
            const refreshedMe = shared.accounts.find(
              (a) => a.email.trim().toLowerCase() === targetEmail.trim().toLowerCase()
            );
            if (refreshedMe) setCurrentAccount(refreshedMe);
          }
          if (shared.privateSlice) {
            setPrivateSlice(shared.privateSlice);
          }
          isApplyingRemoteRef.current = true;
          if (Array.isArray(shared.categories) && shared.categories.length > 0)
            setCategories(shared.categories);
          if (Array.isArray(shared.events)) {
            setEvents((prev) => {
              if (
                shared.events!.length === 0 &&
                prev.length > 0 &&
                shared.lastActionType !== 'calendar'
              ) {
                return prev;
              }
              return shared.events!;
            });
          }
          if (Array.isArray(shared.todos)) setTodos(shared.todos);
          if (Array.isArray(shared.notes)) setNotes(shared.notes);
          if (Array.isArray(shared.shopping)) setShopping(shared.shopping);
          if (Array.isArray(shared.recipes)) setRecipes(shared.recipes);
          if (Array.isArray(shared.budgetMonths)) {
            const incomingHasEntries = shared.budgetMonths.some(
              (m) => Array.isArray(m.entries) && m.entries.length > 0
            );
            setBudgetMonths((prev) => {
              const prevHasEntries = prev.some(
                (m) => Array.isArray(m.entries) && m.entries.length > 0
              );
              if (!incomingHasEntries && prevHasEntries && shared.lastActionType !== 'budget') {
                return prev;
              }
              return shared.budgetMonths!;
            });
          }
          if (Array.isArray(shared.photos)) {
            const localPhotos = loadFromStorage<PhotoItem[]>('vn_photos_v1', []);
            const localAlbums = loadFromStorage<PhotoAlbum[]>('vn_photo_albums_v1', []);
            const remotePhotoIds = new Set((shared.photos || []).map((p) => p.id));
            const isPhotoDeletion = (shared.lastActionSummary || '')
              .toLowerCase()
              .includes('tog bort en bild');
            const unsyncedLocalPhotos = !isPhotoDeletion
              ? localPhotos.filter(
                  (lp) => lp && lp.id && lp.imageUrl && !remotePhotoIds.has(lp.id)
                )
              : [];

            if (unsyncedLocalPhotos.length > 0) {
              const mergedPhotos = [...unsyncedLocalPhotos, ...(shared.photos || [])];
              const remoteAlbumIds = new Set((shared.photoAlbums || []).map((a) => a.id));
              const unsyncedAlbums = localAlbums.filter(
                (la) => la && la.id && !remoteAlbumIds.has(la.id)
              );
              const mergedAlbums = [...(shared.photoAlbums || []), ...unsyncedAlbums];
              setPhotos(mergedPhotos);
              setPhotoAlbums(mergedAlbums);
              saveHouseholdState(
                {
                  updatedBy: memberName,
                  updatedByDeviceId: getDeviceId(),
                  lastActionSummary: `Foton: ${
                    unsyncedLocalPhotos.length === 1
                      ? unsyncedLocalPhotos[0].caption || 'Ny bild'
                      : `${unsyncedLocalPhotos.length} nya bilder`
                  }`,
                  lastActionType: 'photos',
                  photos: mergedPhotos,
                  photoAlbums: mergedAlbums,
                },
                shared.version || lastSyncedVersionRef.current,
                targetEmail,
                ['photos']
              ).catch(() => {});
            } else {
              setPhotos(shared.photos);
              if (Array.isArray(shared.photoAlbums)) setPhotoAlbums(shared.photoAlbums);
            }
          } else if (Array.isArray(shared.photoAlbums)) {
            setPhotoAlbums(shared.photoAlbums);
          }
          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 200);
        } else {
          await pushHouseholdState('Synkroniserade innehåll', 'sync');
        }
        setSyncQueue([]);
      } catch {
        // Offline fallback handled silently without sync notification
      } finally {
        setIsSyncing(false);
      }
    },
    [currentAccount, pushHouseholdState]
  );

  // Consume any direct check-offs or quick-adds made from the native Android Home Screen Widgets
  useEffect(() => {
    const consumeNativeWidgetMutations = () => {
      try {
        const bridge = (window as any).HemWidgetBridge;
        if (!bridge || typeof bridge.consumePendingWidgetMutations !== 'function') return;
        const raw = bridge.consumePendingWidgetMutations();
        if (!raw || raw === '[]') return;
        const mutations = JSON.parse(raw);
        if (!Array.isArray(mutations) || mutations.length === 0) return;

        let nextShopping = [...shopping];
        let nextTodos = [...todos];
        let shopChanged = false;
        let todoChanged = false;
        let lastAddedShopSummary = '';

        for (const mut of mutations) {
          if (!mut || typeof mut !== 'object') continue;
          const title = String(mut.title || '').trim();
          if (mut.action === 'add_shopping' && title) {
            const parsedAmt = Number(mut.amount);
            const newItem: ShoppingItem = {
              id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: title,
              amount: Number.isFinite(parsedAmt) && parsedAmt > 0 ? parsedAmt : 1,
              unit: String(mut.unit || 'st'),
              category: classifySwedishGrocery(title),
              checked: false,
              favorite: false,
              addedAt: new Date().toISOString(),
            };
            nextShopping = [newItem, ...nextShopping];
            shopChanged = true;
            lastAddedShopSummary = `Inköpslista: ${newItem.name} (${newItem.amount} ${newItem.unit})`;
          } else if (mut.action === 'toggle' && mut.targetTab === 'shopping' && title) {
            const lowerTitle = title.toLowerCase();
            let toggled = false;
            nextShopping = nextShopping.map((s) => {
              if (!toggled && !s.checked && s.name.trim().toLowerCase() === lowerTitle) {
                toggled = true;
                shopChanged = true;
                return { ...s, checked: true };
              }
              return s;
            });
          } else if (mut.action === 'toggle' && mut.targetTab === 'todo' && title) {
            const lowerTitle = title.toLowerCase();
            let toggled = false;
            nextTodos = nextTodos.map((t) => {
              if (!toggled && !t.completed && t.title.trim().toLowerCase() === lowerTitle) {
                toggled = true;
                todoChanged = true;
                return { ...t, completed: true, updatedAt: new Date().toISOString() };
              }
              return t;
            });
          }
        }

        if (shopChanged) {
          setShopping(nextShopping);
          pushHouseholdState(
            lastAddedShopSummary || 'Uppdaterade inköpslista i Android-widget',
            lastAddedShopSummary ? 'shopping' : 'sync',
            { shopping: nextShopping }
          );
        }
        if (todoChanged) {
          setTodos(nextTodos);
          pushHouseholdState('Klarmarkerade uppgift i Android-widget', 'sync', {
            todos: nextTodos,
          });
        }
      } catch {
        // Ignore outside Android native shell
      }
    };

    consumeNativeWidgetMutations();
    const interval = setInterval(consumeNativeWidgetMutations, 3500);
    window.addEventListener('focus', consumeNativeWidgetMutations);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', consumeNativeWidgetMutations);
    };
  }, [shopping, todos, pushHouseholdState]);

  // Account Registration, Login & Profile Handlers
  const handleRegisterAccount = async (params: {
    email: string;
    password: string;
    name: string;
    roleTitle?: string;
    avatarDataUrl?: string;
    avatarColor: string;
  }) => {
    const { account, allAccounts: updatedAll } = await registerCloudAccount(params);
    setCurrentAccount(account);
    setAllAccounts(updatedAll);
    lastSyncedVersionRef.current = 0;
    lastSyncedHashRef.current = '';
    await syncSharedWorkspaceNow(account.email);
  };

  const handleLoginAccount = async (email: string, password: string) => {
    const { account, allAccounts: updatedAll } = await loginCloudAccount(email, password);
    setCurrentAccount(account);
    setAllAccounts(updatedAll);
    lastSyncedVersionRef.current = 0;
    lastSyncedHashRef.current = '';
    await syncSharedWorkspaceNow(account.email);
  };

  const handleGoogleLoginAccount = async () => {
    const { account, allAccounts: updatedAll } = await loginWithGoogleCloudAccount();
    setCurrentAccount(account);
    setAllAccounts(updatedAll);
    lastSyncedVersionRef.current = 0;
    lastSyncedHashRef.current = '';
    await syncSharedWorkspaceNow(account.email);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        const cleanEmail = fbUser.email.trim().toLowerCase();
        if (!currentAccount || currentAccount.email.trim().toLowerCase() !== cleanEmail) {
          await syncSharedWorkspaceNow(cleanEmail);
        }
      } else if (!fbUser && currentAccount) {
        // Ensure a valid Firebase Auth session exists for existing logged-in devices without logging them out
        await ensureFirebaseAuthSession();
        await syncSharedWorkspaceNow(currentAccount.email);
      }
    });
    return () => unsub();
  }, [currentAccount, syncSharedWorkspaceNow]);

  const handleSaveAccountProfile = async (
    updated: UserAccount,
    newPassword?: string
  ) => {
    const { account, allAccounts: updatedAll } = await updateCloudAccountProfile(
      updated,
      newPassword
    );
    setCurrentAccount(account);
    setAllAccounts(updatedAll);
    lastSyncedVersionRef.current = 0;
    lastSyncedHashRef.current = '';
    await syncSharedWorkspaceNow(account.email);
  };

  const handleTransferPrivateToShared = async (
    modules: ShareableModule[],
    targetEmails?: string[]
  ) => {
    if (!currentAccount) return;
    const { account, allAccounts: updatedAll } = await transferPrivateContentToShared(
      currentAccount.email,
      modules,
      targetEmails
    );
    setCurrentAccount(account);
    setAllAccounts(updatedAll);
    lastSyncedVersionRef.current = 0;
    lastSyncedHashRef.current = '';
    await syncSharedWorkspaceNow(account.email);
  };

  const handleLogoutAccount = () => {
    setShowProfileMenu(false);
    setCurrentAccount(null);
    logoutCloudAccount();
  };

  // ==========================================
  // CALENDAR HANDLERS
  // ==========================================
  const handleAddEvent = async (newEvtData: Omit<CalendarEvent, 'id' | 'updatedAt'>) => {
    const newEvt: CalendarEvent = {
      ...newEvtData,
      id: `evt-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    const nextEvents = [...events, newEvt];
    setEvents(nextEvents);
    const timeLabel = newEvt.isAllDay ? newEvt.date : `${newEvt.date} kl ${newEvt.startTime}`;
    pushHouseholdState(
      `Kalender: ${newEvt.title} (${timeLabel})`,
      'calendar',
      { events: nextEvents }
    );
  };

  const handleUpdateEvent = (updatedEvt: CalendarEvent) => {
    const nextEvents = events.map((e) => (e.id === updatedEvt.id ? updatedEvt : e));
    setEvents(nextEvents);
    pushHouseholdState(
      `Uppdaterade kalenderhändelsen "${updatedEvt.title}"`,
      'sync',
      { events: nextEvents }
    );
  };

  const handleDeleteEvent = (evt: CalendarEvent) => {
    setConfirmState({
      open: true,
      title: 'Ta bort kalenderhändelse?',
      description: `Är du säker på att du vill ta bort "${evt.title}" (${evt.date})?`,
      confirmLabel: 'Ta bort',
      destructive: true,
      action: async () => {
        const nextEvents = events.filter((e) => e.id !== evt.id);
        setEvents(nextEvents);
        pushHouseholdState(
          `Tog bort kalenderhändelsen "${evt.title}"`,
          'sync',
          { events: nextEvents }
        );
      },
    });
  };

  const handleUpdateCategoryColor = (
    categoryId: string,
    colorHex: string,
    bgHex: string,
    textHex: string
  ) => {
    const next = categories.map((c) =>
      c.id === categoryId ? { ...c, colorHex, bgHex, textHex } : c
    );
    setCategories(next);
    pushHouseholdState('Uppdaterade kategorifärg i kalendern', 'sync', {
      categories: next,
    });
  };

  const handleRenameCategory = (categoryId: string, newName: string) => {
    const next = categories.map((c) =>
      c.id === categoryId ? { ...c, name: newName } : c
    );
    setCategories(next);
  };

  const handleAddCategory = (
    name: string,
    colorHex: string,
    bgHex: string,
    textHex: string
  ) => {
    const newCat: EventCategory = {
      id: `cat-${Date.now()}`,
      name,
      colorHex,
      bgHex,
      textHex,
      googleColorId: '9',
    };
    const next = [...categories, newCat];
    setCategories(next);
    pushHouseholdState(`Kalender: ${name}`, 'calendar', {
      categories: next,
    });
  };

  // ==========================================
  // TODO HANDLERS
  // ==========================================
  const handleAddTodo = async (newTodoData: Omit<TodoItem, 'id' | 'updatedAt'>) => {
    const newTodo: TodoItem = {
      ...newTodoData,
      id: `todo-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    const nextTodos = [newTodo, ...todos];
    setTodos(nextTodos);
    pushHouseholdState(`Att göra: ${newTodo.title}`, 'todo', {
      todos: nextTodos,
    });
  };

  const handleUpdateTodo = (updatedTodo: TodoItem) => {
    const nextTodos = todos.map((t) => (t.id === updatedTodo.id ? updatedTodo : t));
    setTodos(nextTodos);
    pushHouseholdState(`Uppdaterade uppgiften "${updatedTodo.title}"`, 'sync', {
      todos: nextTodos,
    });
  };

  const handleToggleTodo = async (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    const updated: TodoItem = {
      ...target,
      completed: !target.completed,
      updatedAt: new Date().toISOString(),
    };
    const nextTodos = todos.map((t) => (t.id === id ? updated : t));
    setTodos(nextTodos);

    pushHouseholdState(
      updated.completed
        ? `Gjorde klart uppgiften "${updated.title}"`
        : `Återöppnade uppgiften "${updated.title}"`,
      'sync',
      {
        todos: nextTodos,
      }
    );
  };

  const handleDeleteTodo = (todo: TodoItem) => {
    setConfirmState({
      open: true,
      title: 'Ta bort uppgift?',
      description: `Är du säker på att du vill ta bort uppgiften "${todo.title}"?`,
      confirmLabel: 'Ta bort',
      destructive: true,
      action: async () => {
        const nextTodos = todos.filter((t) => t.id !== todo.id);
        setTodos(nextTodos);
        pushHouseholdState(`Tog bort uppgiften "${todo.title}"`, 'sync', {
          todos: nextTodos,
        });
      },
    });
  };

  // ==========================================
  // SHOPPING LIST HANDLERS
  // ==========================================
  const handleAddShoppingItem = (itemData: Omit<ShoppingItem, 'id' | 'addedAt'>) => {
    const newItem: ShoppingItem = {
      ...itemData,
      id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      addedAt: new Date().toISOString(),
    };
    const nextShopping = [newItem, ...shopping];
    setShopping(nextShopping);
    pushHouseholdState(
      `Inköpslista: ${newItem.name} (${newItem.amount} ${newItem.unit})`,
      'shopping',
      { shopping: nextShopping }
    );
  };

  const handleSendIngredientsToShopping = (
    ingredients: RecipeIngredient[],
    recipeTitle: string
  ) => {
    if (!ingredients || ingredients.length === 0) {
      setActiveTab('shopping');
      return;
    }
    const newItems: ShoppingItem[] = ingredients.map((ing, i) => ({
      id: `shop-${Date.now()}-${i}`,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: classifySwedishGrocery(ing.name),
      checked: false,
      favorite: false,
      addedAt: new Date().toISOString(),
    }));
    const nextShopping = [...newItems, ...shopping];
    setShopping(nextShopping);
    pushHouseholdState(
      `Inköpslista: ${ingredients.length} varor från ${recipeTitle}`,
      'shopping',
      { shopping: nextShopping }
    );
    setActiveTab('shopping');
  };

  // ==========================================
  // MULTI-MONTH BUDGET HANDLERS
  // ==========================================
  const handleAddBudgetMonth = (
    monthKey: string,
    label: string,
    copyFromCurrent: boolean
  ) => {
    if (budgetMonths.some((m) => m.monthKey === monthKey)) {
      setActiveMonthKey(monthKey);
      return;
    }
    const sourceMonth =
      budgetMonths.find((m) => m.monthKey === activeMonthKey) || budgetMonths[0];
    const copiedEntries: BudgetEntry[] =
      copyFromCurrent && sourceMonth
        ? sourceMonth.entries.map((e, i) => ({
            ...e,
            id: `b-${monthKey}-${Date.now()}-${i}`,
          }))
        : [];
    const next = [...budgetMonths, { monthKey, label, entries: copiedEntries }].sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );
    setBudgetMonths(next);
    setActiveMonthKey(monthKey);
    pushHouseholdState(`Budget: ${label}`, 'budget', {
      budgetMonths: next,
    });
  };

  const handleDeleteBudgetMonth = (monthKey: string) => {
    const target = budgetMonths.find((m) => m.monthKey === monthKey);
    const next = budgetMonths.filter((m) => m.monthKey !== monthKey);
    setBudgetMonths(next);
    if (activeMonthKey === monthKey && next.length > 0) {
      setActiveMonthKey(next[next.length - 1].monthKey);
    }
    pushHouseholdState(
      `Tog bort budgetmånaden ${target?.label || monthKey}`,
      'sync',
      { budgetMonths: next }
    );
  };

  const handleSaveBudgetEntry = (
    entryData: Omit<BudgetEntry, 'id'>,
    editingEntryId: string | null,
    scope: BudgetApplyScope,
    targetMonthKey: string
  ) => {
    const next = budgetMonths.map((m) => {
      const shouldApply =
        scope === 'all' ||
        (scope === 'single' && m.monthKey === targetMonthKey) ||
        (scope === 'future' && m.monthKey >= targetMonthKey);

      if (!shouldApply) return m;

      if (editingEntryId) {
        const hasMatch = m.entries.some(
          (e) => e.id === editingEntryId || e.seriesId === entryData.seriesId
        );
        if (hasMatch) {
          return {
            ...m,
            entries: m.entries.map((e) =>
              e.id === editingEntryId || e.seriesId === entryData.seriesId
                ? { ...entryData, id: e.id }
                : e
            ),
          };
        }
      }

      return {
        ...m,
        entries: [
          ...m.entries,
          {
            ...entryData,
            id: `b-${m.monthKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          },
        ],
      };
    });
    setBudgetMonths(next);
    pushHouseholdState(
      editingEntryId
        ? `Uppdaterade budgetpost "${entryData.title}"`
        : `Budget: ${entryData.title}`,
      editingEntryId ? 'sync' : 'budget',
      {
        budgetMonths: next,
      }
    );
  };

  const handleDeleteBudgetEntry = (
    entry: BudgetEntry,
    scope: BudgetApplyScope,
    targetMonthKey: string
  ) => {
    const next = budgetMonths.map((m) => {
      const shouldApply =
        scope === 'all' ||
        (scope === 'single' && m.monthKey === targetMonthKey) ||
        (scope === 'future' && m.monthKey >= targetMonthKey);

      if (!shouldApply) return m;

      return {
        ...m,
        entries: m.entries.filter((e) =>
          m.monthKey === targetMonthKey
            ? e.id !== entry.id
            : e.seriesId !== entry.seriesId
        ),
      };
    });
    setBudgetMonths(next);
    pushHouseholdState(`Tog bort budgetpost "${entry.title}"`, 'sync', {
      budgetMonths: next,
    });
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Pull-to-Refresh Touch Handlers (Never triggers inside open modals/windows & requires a deliberate longer pull)
  const PULL_DEADZONE_PX = 55;
  const PULL_TRIGGER_THRESHOLD = 95;

  const isTouchInsideModalOrScrollableContainer = (target: EventTarget | null): boolean => {
    if (
      isEditingHomeLayout ||
      showProfileMenu ||
      showNotifPanel ||
      showThemePanel ||
      showHeaderMenu ||
      showWidgetModal ||
      showScreensaver ||
      confirmState.open ||
      calculatorOpen
    ) {
      return true;
    }
    if (typeof document !== 'undefined') {
      // If any fixed modal overlay (.fixed.inset-0) is currently mounted in the DOM, block pull-to-refresh
      const activeModals = document.querySelectorAll('.fixed.inset-0');
      if (activeModals.length > 0) {
        return true;
      }
    }
    let el = target as HTMLElement | null;
    while (el && el !== document.body && el !== document.documentElement) {
      if (
        el.getAttribute('role') === 'dialog' ||
        el.hasAttribute('data-no-pull-refresh') ||
        el.classList.contains('fixed')
      ) {
        return true;
      }
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return true;
      }
      try {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed') {
          return true;
        }
        const overflowY = style.overflowY;
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          (el.scrollTop > 0 || el.scrollHeight > el.clientHeight + 4)
        ) {
          return true;
        }
      } catch {
        // Ignore style lookup errors
      }
      el = el.parentElement;
    }
    return false;
  };

  const handlePullRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncSharedWorkspaceNow();
    } catch {
      // Offline fallback
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 450);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || isRefreshing) {
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      return;
    }
    if (isTouchInsideModalOrScrollableContainer(e.target)) {
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      return;
    }
    const scrollTop =
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollTop <= 2) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
    } else {
      touchStartYRef.current = null;
      touchStartXRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null || isRefreshing || e.touches.length !== 1) return;
    const scrollTop =
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollTop > 2 || isTouchInsideModalOrScrollableContainer(e.target)) {
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      setPullDistance(0);
      return;
    }
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    const deltaX =
      touchStartXRef.current !== null ? e.touches[0].clientX - touchStartXRef.current : 0;

    // Cancel if the user is swiping horizontally (e.g. changing calendar month)
    if (Math.abs(deltaX) > 18 && Math.abs(deltaX) > Math.abs(deltaY) * 0.75) {
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      setPullDistance(0);
      return;
    }

    if (deltaY > PULL_DEADZONE_PX) {
      const damped = Math.min(145, Math.round((deltaY - PULL_DEADZONE_PX) * 0.45));
      setPullDistance(damped);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null) return;
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    if (pullDistance >= PULL_TRIGGER_THRESHOLD && !isRefreshing) {
      handlePullRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // ==========================================
  // PHOTOS & ALBUMS HANDLERS
  // ==========================================
  const handleAddPhotos = (
    newItemsData: Omit<PhotoItem, 'id' | 'createdAt'>[],
    albumNameForNotif?: string,
    newAlbumToCreate?: { name: string; description?: string }
  ) => {
    const nowIso = new Date().toISOString();
    let nextAlbums = photoAlbums;
    let createdAlbumId: string | undefined;

    if (newAlbumToCreate && newAlbumToCreate.name.trim()) {
      const newAlbum: PhotoAlbum = {
        id: `alb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: newAlbumToCreate.name.trim(),
        description: newAlbumToCreate.description?.trim(),
        createdBy: currentAccount?.name || 'Familjemedlem',
        createdByEmail: currentAccount?.email || '',
        createdAt: nowIso,
      };
      createdAlbumId = newAlbum.id;
      nextAlbums = [...photoAlbums, newAlbum];
      setPhotoAlbums(nextAlbums);
    }

    const createdPhotos: PhotoItem[] = newItemsData.map((item, idx) => ({
      ...item,
      albumId: createdAlbumId || item.albumId,
      id: `photo-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: nowIso,
    }));
    const nextPhotos = [...createdPhotos, ...photos];
    setPhotos(nextPhotos);

    const addedDesc =
      createdPhotos.length === 1
        ? createdPhotos[0].caption?.trim() ||
          (albumNameForNotif ? `Ny bild i ${albumNameForNotif}` : 'Ny bild')
        : `${createdPhotos.length} nya bilder`;
    pushHouseholdState(
      `Foton: ${addedDesc}`,
      'photos',
      { photos: nextPhotos, photoAlbums: nextAlbums }
    );
  };

  const handleDeletePhoto = (photo: PhotoItem) => {
    setConfirmState({
      open: true,
      title: 'Ta bort bild?',
      description: 'Är du säker på att du vill ta bort den här bilden permanent?',
      confirmLabel: 'Ta bort',
      destructive: true,
      action: () => {
        const nextPhotos = photos.filter((p) => p.id !== photo.id);
        setPhotos(nextPhotos);
        pushHouseholdState('Tog bort en bild', 'sync', { photos: nextPhotos });
      },
    });
  };

  const handleToggleFavoritePhoto = (photoId: string) => {
    const nextPhotos = photos.map((p) =>
      p.id === photoId ? { ...p, favorite: !p.favorite } : p
    );
    setPhotos(nextPhotos);
    pushHouseholdState('Uppdaterade favoritbild', 'sync', { photos: nextPhotos });
  };

  const handleMovePhotoToAlbum = (
    photoId: string,
    albumId: string | undefined
  ) => {
    const nextPhotos = photos.map((p) =>
      p.id === photoId ? { ...p, albumId } : p
    );
    setPhotos(nextPhotos);
    pushHouseholdState('Flyttade bild till album', 'sync', { photos: nextPhotos });
  };

  const handleTogglePhotoReaction = (photoId: string, emoji: string) => {
    if (!currentAccount) return;
    const myEmail = currentAccount.email.trim().toLowerCase();
    const myName = currentAccount.name.split(' ')[0] || currentAccount.name;

    const nextPhotos = photos.map((p) => {
      if (p.id !== photoId) return p;
      const existing = p.reactions || [];
      const alreadyHas = existing.some(
        (r) => r.emoji === emoji && r.userEmail.trim().toLowerCase() === myEmail
      );
      if (alreadyHas) {
        return {
          ...p,
          reactions: existing.filter(
            (r) =>
              !(r.emoji === emoji && r.userEmail.trim().toLowerCase() === myEmail)
          ),
        };
      }
      return {
        ...p,
        reactions: [
          ...existing,
          { emoji, userEmail: myEmail, userName: myName },
        ],
      };
    });

    setPhotos(nextPhotos);
    pushHouseholdState('Uppdaterade reaktion på bild', 'sync', {
      photos: nextPhotos,
    });
  };

  const handleAddPhotoComment = (photoId: string, text: string) => {
    if (!currentAccount || !text.trim()) return;
    const myName = currentAccount.name.split(' ')[0] || currentAccount.name;
    const newComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorName: myName,
      authorEmail: currentAccount.email,
      authorAvatarDataUrl: currentAccount.avatarDataUrl,
      authorAvatarColor: currentAccount.avatarColor,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextPhotos = photos.map((p) =>
      p.id === photoId
        ? { ...p, comments: [...(p.comments || []), newComment] }
        : p
    );
    setPhotos(nextPhotos);
    pushHouseholdState(
      `Foton: ${text.trim().slice(0, 45)}`,
      'photos',
      { photos: nextPhotos }
    );
  };

  const handleDeletePhotoComment = (photoId: string, commentId: string) => {
    const nextPhotos = photos.map((p) =>
      p.id === photoId
        ? {
            ...p,
            comments: (p.comments || []).filter((c) => c.id !== commentId),
          }
        : p
    );
    setPhotos(nextPhotos);
    pushHouseholdState('Tog bort kommentar på bild', 'sync', {
      photos: nextPhotos,
    });
  };

  const handleCreatePhotoAlbum = (
    name: string,
    description?: string
  ): PhotoAlbum => {
    const newAlbum: PhotoAlbum = {
      id: `alb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      description: description?.trim(),
      createdBy: currentAccount?.name || 'Familjemedlem',
      createdByEmail: currentAccount?.email || '',
      createdAt: new Date().toISOString(),
    };
    const nextAlbums = [...photoAlbums, newAlbum];
    setPhotoAlbums(nextAlbums);
    pushHouseholdState(
      `Foton: Album "${newAlbum.name}"`,
      'photos',
      { photoAlbums: nextAlbums }
    );
    return newAlbum;
  };

  const handleDeletePhotoAlbum = (album: PhotoAlbum) => {
    setConfirmState({
      open: true,
      title: `Ta bort albumet "${album.name}"?`,
      description:
        'Själva bilderna raderas inte utan ligger kvar under "Alla bilder".',
      confirmLabel: 'Ta bort album',
      destructive: true,
      action: () => {
        const nextAlbums = photoAlbums.filter((a) => a.id !== album.id);
        const nextPhotos = photos.map((p) =>
          p.albumId === album.id ? { ...p, albumId: undefined } : p
        );
        setPhotoAlbums(nextAlbums);
        setPhotos(nextPhotos);
        pushHouseholdState(`Tog bort albumet "${album.name}"`, 'sync', {
          photoAlbums: nextAlbums,
          photos: nextPhotos,
        });
      },
    });
  };

  // If the user has not created an account or logged in yet, show the Account & Profile Setup Screen
  if (!currentAccount) {
    return (
      <AuthGateScreen
        onRegister={handleRegisterAccount}
        onLogin={handleLoginAccount}
        onGoogleLogin={handleGoogleLoginAccount}
      />
    );
  }

  const activeSharedConnections = (currentAccount.connections || []).filter(
    (c) => hasAnySharedModule(c)
  );

  const getSharedNamesForModule = (mod: ShareableModule): string[] => {
    return (currentAccount.connections || [])
      .filter((c) => getConnectionSharedModules(c)[mod])
      .map((c) => c.name.split(' ')[0]);
  };

  const currentTabShareInfo =
    activeTab !== 'home' && activeTab !== 'photos'
      ? {
          pageLabel:
            SHAREABLE_PAGE_OPTIONS.find((p) => p.id === activeTab)?.label ||
            activeTab,
          sharedNames: getSharedNamesForModule(activeTab as ShareableModule),
        }
      : null;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen flex flex-col bg-[#F6FBF7] text-[#141E18]"
    >
      {/* Sticky Top Bar */}
      <header className="sticky top-0 left-0 right-0 z-40 w-full flex items-center justify-between gap-2 sm:gap-3 px-3.5 sm:px-6 md:px-8 pt-[max(env(safe-area-inset-top,0px),44px)] pb-3.5 bg-[#F6FBF7]/95 backdrop-blur-md border-b border-[#D8E6DD] shadow-xs">
        <a
          href="#hem"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('home');
          }}
          className="flex items-center gap-2 text-lg sm:text-xl font-extrabold tracking-tight text-[#183D2C] whitespace-nowrap shrink-0"
        >
          <img
            src={`${import.meta.env.BASE_URL}icon.svg`}
            alt="Hem"
            className="h-8 w-8 rounded-xl shadow-xs shrink-0"
          />
          <span>Hem</span>
        </a>

        <div className="relative flex items-center gap-2 shrink-0">
          {/* Quick "Klar" button when actively editing Home layout */}
          {activeTab === 'home' && isEditingHomeLayout && (
            <button
              type="button"
              onClick={() => setIsEditingHomeLayout(false)}
              className="flex h-10 items-center justify-center gap-1.5 rounded-full px-3.5 bg-[#0369A1] border border-[#0369A1] text-white text-xs font-extrabold shadow-xs transition-all shrink-0"
            >
              <Check className="h-4 w-4 shrink-0" />
              <span>Klar</span>
            </button>
          )}

          {/* 1. Notification Bell Button (Collapsible dropdown menu just like Meny) */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'default') {
                  Notification.requestPermission();
                }
              }
              syncStatusBarDismissals();
              setShowThemePanel(false);
              setShowHeaderMenu(false);
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              setShowNotifPanel((prev) => !prev);
            }}
            className={`relative flex h-10 px-2.5 md:px-3.5 items-center justify-center gap-1.5 rounded-2xl md:rounded-full border transition-all shrink-0 ${
              showNotifPanel
                ? 'bg-[#92400E] border-[#92400E] text-white'
                : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E] hover:bg-[#FDE68A]/80'
            }`}
            aria-expanded={showNotifPanel}
            aria-label="Notiser"
            title="Öppna notismeny"
          >
            <Bell
              className={`h-4 w-4 shrink-0 ${
                showNotifPanel ? 'text-[#FDE68A] fill-[#FDE68A]' : 'text-[#D97706] fill-[#FACC15]'
              }`}
            />
            <span className="hidden md:inline text-xs font-extrabold">Notiser</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                showNotifPanel ? 'rotate-180' : ''
              }`}
            />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#9E2A2B] px-1 text-[10px] font-bold font-mono tabular-nums text-white shadow-2xs">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Click-outside backdrop + Collapsible Notification Dropdown Menu (Fällbar meny) */}
          {showNotifPanel && (
            <>
              <div
                onClick={() => setShowNotifPanel(false)}
                className="fixed inset-0 z-40"
                aria-hidden="true"
              />
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,360px)] sm:w-96 rounded-3xl bg-white border border-[#CDE0D4] p-3.5 shadow-xl flex flex-col max-h-[75vh]">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E6F0EA] shrink-0">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#141E18]">Notiser</h3>
                    <p className="text-[11px] text-[#54685C]">
                      Enhet: <span className="font-bold text-[#183D2C]">{getDeviceLabel()}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotificationsEverywhere}
                        className="rounded-xl bg-[#FADAD8]/60 hover:bg-[#FADAD8] px-2.5 py-1 text-[11px] font-extrabold text-[#9E2A2B] transition-colors"
                      >
                        Rensa alla
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotifPanel(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#38493F] hover:bg-[#E3EFE7]"
                      aria-label="Stäng notismeny"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Test Buttons inside Dropdown */}
                <div className="mt-2.5 rounded-2xl bg-[#F6FBF7] border border-[#DCEAE1] p-2.5 space-y-1.5 shrink-0">
                  <div className="text-[10px] font-bold text-[#54685C]">
                    Testa notiser på telefon & surfplatta:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        await ensureNotificationPermissions();
                        pushNotification(
                          'Hem',
                          'Inköpslista: Testvara (1 st)',
                          'shopping'
                        );
                      }}
                      className="min-h-[34px] rounded-xl bg-white hover:bg-[#E4F3EA] border border-[#CDE0D4] px-2.5 py-1 text-[11px] font-extrabold text-[#183D2C] transition-colors"
                    >
                      Testa denna enhet
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await ensureNotificationPermissions();
                        await pushHouseholdState(
                          'Inköpslista: Testnotis',
                          'shopping'
                        );
                      }}
                      className="min-h-[34px] rounded-xl bg-[#183D2C] hover:bg-[#21513B] px-2.5 py-1 text-[11px] font-extrabold text-white transition-colors"
                    >
                      Till andra enheter
                    </button>
                  </div>
                </div>

                {/* Scrollable Notification List inside Dropdown */}
                <div className="mt-2.5 flex-1 overflow-y-auto space-y-2 pr-0.5 max-h-[340px]">
                  {notifications.length === 0 ? (
                    <div className="py-7 text-center text-xs font-semibold text-[#54685C]">
                      Inga nya notiser just nu.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <SwipeableNotifCard
                        key={n.id}
                        notif={n}
                        onDismiss={(id) => dismissNotificationEverywhere(id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* 2. Collapsible Dropdown Menu Trigger (Fällbar meny) */}
          <button
            type="button"
            onClick={() => {
              setShowNotifPanel(false);
              setShowThemePanel(false);
              setShowHeaderMenu((prev) => !prev);
            }}
            className={`relative flex h-10 items-center justify-center gap-2 rounded-2xl md:rounded-full border pl-1.5 pr-2.5 sm:pr-3 py-1 transition-all shadow-2xs shrink-0 ${
              showHeaderMenu
                ? 'bg-[#183D2C] border-[#183D2C] text-white'
                : 'bg-[#D8F3E3] hover:bg-[#C2EBD3] border-[#9EE2B9] text-[#141E18]'
            }`}
            aria-expanded={showHeaderMenu}
            aria-label="Öppna meny"
            title="Öppna meny med funktioner och profil"
          >
            <UserAvatarBubble
              name={currentAccount.name}
              avatarDataUrl={currentAccount.avatarDataUrl}
              avatarColor={currentAccount.avatarColor}
              sizeClass="h-7 w-7"
              textClass="text-[11px]"
            />
            <span className="text-xs font-extrabold leading-tight">Meny</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                showHeaderMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Click-outside backdrop + Collapsible Dropdown Menu (Fällbar meny) */}
          {showHeaderMenu && (
            <>
              <div
                onClick={() => setShowHeaderMenu(false)}
                className="fixed inset-0 z-40"
                aria-hidden="true"
              />
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 sm:w-72 rounded-3xl bg-white border border-[#CDE0D4] p-2 shadow-xl space-y-1">
                {/* 1. Profil & delning */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowProfileMenu(true);
                  }}
                  className="w-full rounded-2xl p-2.5 text-left flex items-center gap-3 hover:bg-[#F2F9F5] transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#D8F3E3] border border-[#9EE2B9]">
                    <UserAvatarBubble
                      name={currentAccount.name}
                      avatarDataUrl={currentAccount.avatarDataUrl}
                      avatarColor={currentAccount.avatarColor}
                      sizeClass="h-7 w-7"
                      textClass="text-[11px]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-[#141E18] truncate">
                      {currentAccount.name.split(' ')[0]} · Profil & delning
                    </div>
                    <div className="text-[11px] font-medium text-[#54685C] truncate">
                      {activeSharedConnections.length > 0
                        ? `Delar med ${activeSharedConnections.length} kontakt${
                            activeSharedConnections.length > 1 ? 'er' : ''
                          }`
                        : 'Konto och familjedelning'}
                    </div>
                  </div>
                </button>

                <div className="my-1 border-t border-[#E6F0EA]" />

                {/* 2. Skärmsläckare & Nattklocka */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowScreensaver(true);
                  }}
                  className="w-full rounded-2xl p-2.5 text-left flex items-center gap-3 hover:bg-[#F2F9F5] transition-colors"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E0E7FF] border border-[#C7D2FE] text-[#4338CA]">
                    <Monitor className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-[#141E18]">
                      Skärmsläckare
                    </div>
                    <div className="text-[11px] font-medium text-[#54685C]">
                      Hushållstavla & Nattklocka (22–06)
                    </div>
                  </div>
                </button>

                {/* 3. Widgets & Wear OS */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowWidgetModal(true);
                  }}
                  className="w-full rounded-2xl p-2.5 text-left flex items-center gap-3 hover:bg-[#F2F9F5] transition-colors"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] border border-[#DDD6FE] text-[#7C3AED]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-[#141E18]">
                      Widgets & Wear OS
                    </div>
                    <div className="text-[11px] font-medium text-[#54685C]">
                      Hemwidgets & smartklocka
                    </div>
                  </div>
                </button>

                {/* 4. Tema & Färg */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowThemePanel(true);
                  }}
                  className="w-full rounded-2xl p-2.5 text-left flex items-center gap-3 hover:bg-[#F2F9F5] transition-colors"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFE4E6] border border-[#FECDD3] text-[#E11D48]">
                    <Palette className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-[#141E18]">
                      Tema & färg
                    </div>
                    <div className="text-[11px] font-medium text-[#54685C]">
                      Byt färgpalett för appen
                    </div>
                  </div>
                </button>

                {/* 5. Layout på startsidan */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    if (activeTab !== 'home') {
                      setActiveTab('home');
                      setIsEditingHomeLayout(true);
                    } else {
                      setIsEditingHomeLayout((prev) => !prev);
                    }
                  }}
                  className="w-full rounded-2xl p-2.5 text-left flex items-center gap-3 hover:bg-[#F2F9F5] transition-colors"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7]">
                    {isEditingHomeLayout ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <LayoutGrid className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-[#141E18]">
                      {isEditingHomeLayout
                        ? 'Klar med startsidans layout'
                        : 'Ändra layout på startsidan'}
                    </div>
                    <div className="text-[11px] font-medium text-[#54685C]">
                      Flytta & ändra storlek på kort
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Profile & Friends/Family Sharing Modal */}
      <ProfileMenuModal
        open={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        account={currentAccount}
        allAccounts={allAccounts}
        onSaveAccount={handleSaveAccountProfile}
        onTransferPrivateToShared={handleTransferPrivateToShared}
        privateSlice={privateSlice}
        onLogout={handleLogoutAccount}
        onForceSync={() => syncSharedWorkspaceNow()}
        isSyncing={isSyncing}
      />

      {/* Live Notification Toast (Swipe left, right, or up to dismiss) */}
      {toastBanner && (
        <div
          onTouchStart={(e) => {
            e.stopPropagation();
            if (e.touches.length === 1) {
              setToastSwipe({
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                dx: 0,
                dy: 0,
              });
            }
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
            if (toastSwipe.startX === null || toastSwipe.startY === null || e.touches.length !== 1)
              return;
            const dx = e.touches[0].clientX - toastSwipe.startX;
            const dy = e.touches[0].clientY - toastSwipe.startY;
            setToastSwipe((prev) => ({ ...prev, dx, dy }));
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            if (Math.abs(toastSwipe.dx) > 45 || toastSwipe.dy < -25) {
              dismissNotificationEverywhere(toastBanner.id);
              setToastBanner(null);
            }
            setToastSwipe({ startX: null, startY: null, dx: 0, dy: 0 });
          }}
          onPointerDown={(e) => {
            if (e.pointerType === 'touch') return;
            setToastSwipe({
              startX: e.clientX,
              startY: e.clientY,
              dx: 0,
              dy: 0,
            });
          }}
          onPointerMove={(e) => {
            if (
              e.pointerType === 'touch' ||
              toastSwipe.startX === null ||
              toastSwipe.startY === null
            )
              return;
            setToastSwipe((prev) => ({
              ...prev,
              dx: e.clientX - (prev.startX ?? e.clientX),
              dy: e.clientY - (prev.startY ?? e.clientY),
            }));
          }}
          onPointerUp={(e) => {
            if (e.pointerType === 'touch') return;
            if (Math.abs(toastSwipe.dx) > 45 || toastSwipe.dy < -25) {
              dismissNotificationEverywhere(toastBanner.id);
              setToastBanner(null);
            }
            setToastSwipe({ startX: null, startY: null, dx: 0, dy: 0 });
          }}
          style={{
            transform: `translate(${toastSwipe.dx}px, ${Math.min(0, toastSwipe.dy)}px)`,
            opacity: Math.max(
              0.2,
              1 - Math.hypot(toastSwipe.dx, Math.min(0, toastSwipe.dy)) / 150
            ),
            transition: toastSwipe.startX === null ? 'transform 0.2s ease, opacity 0.2s ease' : 'none',
          }}
          className="fixed top-28 sm:top-20 left-4 right-4 sm:left-auto sm:right-5 z-50 sm:max-w-sm rounded-3xl bg-[#183D2C] text-white p-4 shadow-2xl border border-[#8CE6B4]/30 flex items-start justify-between gap-3 select-none cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#A6F2C6]">{toastBanner.title}</div>
            <div className="mt-0.5 text-xs text-white/90">{toastBanner.body}</div>
            <div className="mt-1 text-[10px] text-[#A6F2C6]/70">
              Svep åt sidan eller uppåt för att ta bort
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissNotificationEverywhere(toastBanner.id);
              setToastBanner(null);
            }}
            className="text-white/70 hover:text-white p-1 shrink-0"
            aria-label="Stäng notis"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Prominent Pull-to-Refresh Indicator */}
      {(pullDistance > 18 || isRefreshing) && (
        <div
          style={{
            transform: `translateY(${
              isRefreshing ? 92 : Math.min(118, 42 + pullDistance * 0.6)
            }px)`,
          }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-100"
        >
          <div className="flex items-center gap-2.5 rounded-full bg-[#183D2C] text-white px-5 py-3 text-xs sm:text-sm font-extrabold shadow-2xl ring-4 ring-[#A6F2C6]/70 border border-white/25">
            <RefreshCw
              className={`h-5 w-5 text-[#A6F2C6] ${
                isRefreshing || pullDistance >= PULL_TRIGGER_THRESHOLD ? 'animate-spin' : ''
              }`}
              style={
                !isRefreshing && pullDistance < PULL_TRIGGER_THRESHOLD
                  ? { transform: `rotate(${pullDistance * 3}deg)` }
                  : undefined
              }
            />
            <span>
              {isRefreshing
                ? 'Uppdaterar & synkar Hem...'
                : pullDistance >= PULL_TRIGGER_THRESHOLD
                ? 'Släpp för att uppdatera!'
                : 'Dra längre nedåt för att uppdatera'}
            </span>
          </div>
        </div>
      )}

      {/* Theme / Color Picker Modal */}
      {showThemePanel && (
        <div
          onClick={() => setShowThemePanel(false)}
          className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 backdrop-blur-xs p-4 pt-28"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#DCEAE1] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#141E18]">
                  Tema & Färg (Android 16 & 17 M3)
                </h3>
                <p className="text-xs text-[#54685C]">
                  Primärfärg + sekundära och tertiära accentfärger
                </p>
              </div>
              <button
                onClick={() => setShowThemePanel(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#38493F] hover:bg-[#D8F3E3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {APP_THEMES.map((t) => {
                const isSelected = appTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setAppTheme(t.id)}
                    className={`rounded-2xl border p-3 text-left transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-[#183D2C] bg-white shadow-md ring-2 ring-[#183D2C]'
                        : 'border-[#DCEAE1] bg-white/80 hover:bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#141E18] truncate">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-[#54685C] truncate">
                        {t.subtitle}
                      </div>
                    </div>
                    <div className="flex items-center -space-x-1.5 shrink-0">
                      <span
                        className="h-6 w-6 rounded-full border border-white shadow-xs flex items-center justify-center"
                        style={{ backgroundColor: t.primary }}
                        title="Primär färg"
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </span>
                      <span
                        className="h-5 w-5 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: t.secondary }}
                        title="Sekundär färg"
                      />
                      <span
                        className="h-5 w-5 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: t.tertiary }}
                        title="Tertiär färg"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#DCEAE1]">
              <button
                type="button"
                onClick={() => {
                  setShowThemePanel(false);
                  setShowWidgetModal(true);
                }}
                className="w-full min-h-[42px] rounded-2xl bg-[#E4F3EA] hover:bg-[#D8F3E3] border border-[#CDE0D4] px-4 py-2.5 text-xs font-bold text-[#183D2C] flex items-center justify-center gap-2 transition-colors"
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span>Widgets för hemskärmen (Android & iOS)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Home Screen Widgets Setup Modal (Android, PWA, Googlebook OS, iOS & Wear OS) */}
      <WidgetSetupModal
        open={showWidgetModal}
        onClose={() => setShowWidgetModal(false)}
        onForceUpdateAndroidWidgets={syncAndroidNativeWidgets}
        events={events}
        categories={categories}
        shopping={shopping}
        todos={todos}
        currentAccount={currentAccount}
        onToggleShopping={(id) => {
          const next = shopping.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s));
          setShopping(next);
          pushHouseholdState('Uppdaterade inköpslista i widget', 'sync', { shopping: next });
        }}
        onAddShoppingItem={handleAddShoppingItem}
        onToggleTodo={(id) => handleToggleTodo(id)}
        onOpenStandaloneWidgetMode={(mode) => setStandaloneWidgetMode(mode)}
      />

      {/* Dedicated Standalone PWA M3 Expressive Widget / Wear OS Watch Mode */}
      {standaloneWidgetMode && (
        <div
          className={`fixed inset-0 z-50 overflow-y-auto p-3 sm:p-5 flex flex-col ${
            standaloneWidgetMode === 'wear'
              ? 'bg-[#0B1711] text-white items-center justify-center'
              : 'bg-[#F6FBF7] text-[#141E18]'
          }`}
        >
          <div
            className={
              standaloneWidgetMode === 'wear'
                ? 'w-full max-w-[330px] rounded-[48px] bg-[#12261C] border-2 border-[#274D3A] p-4 shadow-2xl space-y-3'
                : 'w-full max-w-xl mx-auto space-y-3.5'
            }
          >
            {/* Top Bar inside Widget / Watch */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl font-extrabold ${
                    standaloneWidgetMode === 'wear'
                      ? 'bg-[#A6F2C6] text-[#0B1711]'
                      : 'bg-[#183D2C] text-[#A6F2C6]'
                  }`}
                >
                  {standaloneWidgetMode === 'wear' ? (
                    <Watch className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div
                    className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      standaloneWidgetMode === 'wear' ? 'text-[#A6F2C6]' : 'text-[#54685C]'
                    }`}
                  >
                    {standaloneWidgetMode === 'wear'
                      ? 'HEM · WEAR OS SMARTKLOCKA'
                      : 'HEM · M3 EXPRESSIVE PWA WIDGET'}
                  </div>
                  <div
                    className={`text-sm font-extrabold ${
                      standaloneWidgetMode === 'wear' ? 'text-white' : 'text-[#183D2C]'
                    }`}
                  >
                    {standaloneWidgetMode === 'shopping'
                      ? 'Inköpslista'
                      : standaloneWidgetMode === 'calendar'
                      ? 'Kalender'
                      : standaloneWidgetMode === 'todo'
                      ? 'Att göra'
                      : standaloneWidgetMode === 'wear'
                      ? 'Handledsvy'
                      : 'Alla 3 Widgets'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => syncSharedWorkspaceNow()}
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    standaloneWidgetMode === 'wear'
                      ? 'bg-[#1D3B2C] text-[#A6F2C6]'
                      : 'bg-white border border-[#CDE0D4] text-[#183D2C]'
                  }`}
                  title="Synka nu"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '#home';
                    setStandaloneWidgetMode(null);
                  }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold ${
                    standaloneWidgetMode === 'wear'
                      ? 'bg-[#A6F2C6] text-[#0B1711]'
                      : 'bg-[#183D2C] text-white'
                  }`}
                >
                  Full app
                </button>
              </div>
            </div>

            {/* Mode Switcher Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'shopping', label: 'Inköp' },
                  { id: 'calendar', label: 'Kalender' },
                  { id: 'todo', label: 'Att göra' },
                  { id: 'all', label: 'Alla 3' },
                  { id: 'wear', label: 'Wear OS' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    window.location.hash = m.id === 'wear' ? '#wear' : `#widget-${m.id}`;
                    setStandaloneWidgetMode(m.id);
                  }}
                  className={`rounded-full px-3 py-1 text-[11px] font-extrabold whitespace-nowrap transition-all ${
                    standaloneWidgetMode === m.id
                      ? standaloneWidgetMode === 'wear'
                        ? 'bg-[#A6F2C6] text-[#0B1711]'
                        : 'bg-[#183D2C] text-[#A6F2C6]'
                      : standaloneWidgetMode === 'wear'
                      ? 'bg-[#1D3B2C] text-white/80'
                      : 'bg-white border border-[#CDE0D4] text-[#2E4035]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Quick Add Bar for Shopping or Todo inside Widget */}
            {(standaloneWidgetMode === 'shopping' ||
              standaloneWidgetMode === 'todo' ||
              standaloneWidgetMode === 'all' ||
              standaloneWidgetMode === 'wear') && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = quickWidgetInput.trim();
                  if (!val) return;
                  if (standaloneWidgetMode === 'todo') {
                    handleAddTodo({
                      title: val,
                      completed: false,
                      favorite: false,
                      category: 'Hushåll',
                      priority: 'medium',
                      dueDate: getTodayDateString(),
                    });
                  } else {
                    const cat = classifySwedishGrocery(val);
                    handleAddShoppingItem({
                      name: val,
                      amount: 1,
                      unit: 'st',
                      category: cat,
                      checked: false,
                      favorite: false,
                    });
                  }
                  setQuickWidgetInput('');
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={quickWidgetInput}
                  onChange={(e) => setQuickWidgetInput(e.target.value)}
                  placeholder={
                    standaloneWidgetMode === 'todo'
                      ? 'Lägg till uppgift...'
                      : 'Lägg till vara i inköpslistan...'
                  }
                  className={`flex-1 min-h-[38px] rounded-2xl px-3.5 text-xs font-semibold outline-none ${
                    standaloneWidgetMode === 'wear'
                      ? 'bg-[#1D3B2C] text-white placeholder:text-white/50 border border-[#2F5C46]'
                      : 'bg-white text-[#141E18] border border-[#CDE0D4]'
                  }`}
                />
                <button
                  type="submit"
                  className={`h-[38px] px-3.5 rounded-2xl text-xs font-extrabold flex items-center gap-1 ${
                    standaloneWidgetMode === 'wear'
                      ? 'bg-[#A6F2C6] text-[#0B1711]'
                      : 'bg-[#183D2C] text-[#A6F2C6]'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Lägg till</span>
                </button>
              </form>
            )}

            {/* 1. Shopping Widget Section */}
            {(standaloneWidgetMode === 'shopping' ||
              standaloneWidgetMode === 'all' ||
              standaloneWidgetMode === 'wear') && (
              <div
                className={`rounded-[28px] p-4 space-y-3 ${
                  standaloneWidgetMode === 'wear'
                    ? 'bg-[#183326] border border-[#2F5C46]'
                    : 'bg-[#EEF7F2] border-2 border-[#C3DFCF] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-[14px] ${
                        standaloneWidgetMode === 'wear'
                          ? 'bg-[#A6F2C6] text-[#0B1711]'
                          : 'bg-[#183D2C] text-[#A6F2C6]'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </span>
                    <div>
                      <div
                        className={`text-[9px] font-extrabold uppercase tracking-widest ${
                          standaloneWidgetMode === 'wear' ? 'text-[#A6F2C6]/80' : 'text-[#4A6355]'
                        }`}
                      >
                        HEM · ATT HANDLA
                      </div>
                      <div className="font-extrabold text-sm">Inköpslista</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-2.5 py-1 text-[11px] font-extrabold font-mono">
                    {shopping.filter((s) => !s.checked).length} kvar
                  </span>
                </div>
                <div className="max-h-[280px] overflow-y-auto pr-0.5 space-y-1.5">
                  {shopping.filter((s) => !s.checked).length === 0 ? (
                    <div
                      className={`rounded-2xl p-4 text-center space-y-1 ${
                        standaloneWidgetMode === 'wear'
                          ? 'bg-[#224735] text-white'
                          : 'bg-white border border-[#D2E7DA] text-[#183D2C]'
                      }`}
                    >
                      <div className="text-xs font-extrabold">✓ Inköpslistan är tom</div>
                      <div className="text-[10px] opacity-75">Lägg till en vara i fältet ovan</div>
                    </div>
                  ) : (
                    shopping
                      .filter((s) => !s.checked)
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const next = shopping.map((s) =>
                              s.id === item.id ? { ...s, checked: !s.checked } : s
                            );
                            setShopping(next);
                            pushHouseholdState(`Bockade av ${item.name} i widget`, 'sync', {
                              shopping: next,
                            });
                          }}
                          className={`w-full text-left flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold transition-all ${
                            standaloneWidgetMode === 'wear'
                              ? 'bg-[#224735] hover:bg-[#2C5943] text-white'
                              : 'bg-white hover:bg-[#F5FBF7] border border-[#D5E8DC] text-[#141E18] shadow-2xs'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold ${
                                standaloneWidgetMode === 'wear'
                                  ? 'bg-[#183326] text-[#A6F2C6]'
                                  : 'bg-[#D8F3E3] text-[#183D2C]'
                              }`}
                            >
                              ○
                            </span>
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-2.5 py-0.5 text-[10px] font-extrabold shrink-0">
                            {item.amount} {item.unit}
                          </span>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* 2. Calendar Widget Section (2 weeks ahead, category colored, date/time on top, title underneath) */}
            {(standaloneWidgetMode === 'calendar' ||
              standaloneWidgetMode === 'all' ||
              standaloneWidgetMode === 'wear') && (
              <div
                className={`rounded-[30px] p-4 space-y-3 ${
                  standaloneWidgetMode === 'wear'
                    ? 'bg-[#12261D] border-2 border-[#2A5942] shadow-lg'
                    : 'bg-[#EEF7F2] border-2 border-[#C3DFCF] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-[14px] ${
                        standaloneWidgetMode === 'wear'
                          ? 'bg-[#C3E8FF] text-[#081C29]'
                          : 'bg-[#183D2C] text-[#A6F2C6]'
                      }`}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <div
                        className={`text-[9px] font-extrabold uppercase tracking-widest ${
                          standaloneWidgetMode === 'wear' ? 'text-[#C3E8FF]/90' : 'text-[#4A6355]'
                        }`}
                      >
                        HEM · 14 DAGAR FRAMÅT
                      </div>
                      <div className="font-extrabold text-sm">Kalender</div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold font-mono ${
                      standaloneWidgetMode === 'wear'
                        ? 'bg-[#C3E8FF] text-[#081C29]'
                        : 'bg-[#183D2C] text-[#A6F2C6]'
                    }`}
                  >
                    {
                      events.filter(
                        (e) =>
                          e.date >= getTodayDateString() &&
                          e.date <= getOffsetDateString(14)
                      ).length
                    }{' '}
                    st
                  </span>
                </div>
                <div className="max-h-[280px] overflow-y-auto pr-0.5 space-y-2">
                  {events.filter(
                    (e) =>
                      e.date >= getTodayDateString() && e.date <= getOffsetDateString(14)
                  ).length === 0 ? (
                    <div
                      className={`rounded-2xl p-4 text-center space-y-1 ${
                        standaloneWidgetMode === 'wear'
                          ? 'bg-[#1A382A] text-white'
                          : 'bg-white border border-[#D2E7DA] text-[#183D2C]'
                      }`}
                    >
                      <div className="text-xs font-extrabold">
                        Inga händelser närmaste 2 veckorna
                      </div>
                    </div>
                  ) : (
                    [...events]
                      .filter(
                        (e) =>
                          e.date >= getTodayDateString() &&
                          e.date <= getOffsetDateString(14)
                      )
                      .sort((a, b) =>
                        `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)
                      )
                      .map((evt) => {
                        const catColor =
                          evt.customColorHex ||
                          categories.find((c) => c.id === evt.categoryId)?.colorHex ||
                          INITIAL_CATEGORIES.find((c) => c.id === evt.categoryId)?.colorHex ||
                          '#0066FF';
                        const timeRange = evt.endTime
                          ? `${evt.startTime}–${evt.endTime}`
                          : evt.startTime;
                        return (
                          <div
                            key={evt.id}
                            style={{ backgroundColor: catColor }}
                            className="flex flex-col rounded-[20px] px-3.5 py-2.5 text-white shadow-xs"
                          >
                            <span className="text-[11px] font-mono font-extrabold tracking-wide text-white/90">
                              {evt.date === getTodayDateString() ? 'Idag' : evt.date.slice(5)} ·{' '}
                              {timeRange}
                            </span>
                            <span className="mt-0.5 text-[14px] font-extrabold leading-snug truncate">
                              {evt.title}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}

            {/* 3. Todo Widget Section */}
            {(standaloneWidgetMode === 'todo' ||
              standaloneWidgetMode === 'all' ||
              standaloneWidgetMode === 'wear') && (
              <div
                className={`rounded-[28px] p-4 space-y-3 ${
                  standaloneWidgetMode === 'wear'
                    ? 'bg-[#183326] border border-[#2F5C46]'
                    : 'bg-[#EEF7F2] border-2 border-[#C3DFCF] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-[14px] ${
                        standaloneWidgetMode === 'wear'
                          ? 'bg-[#A6F2C6] text-[#0B1711]'
                          : 'bg-[#183D2C] text-[#A6F2C6]'
                      }`}
                    >
                      <CheckSquare className="h-4 w-4" />
                    </span>
                    <div>
                      <div
                        className={`text-[9px] font-extrabold uppercase tracking-widest ${
                          standaloneWidgetMode === 'wear' ? 'text-[#A6F2C6]/80' : 'text-[#4A6355]'
                        }`}
                      >
                        HEM · UPPGIFTER
                      </div>
                      <div className="font-extrabold text-sm">Att göra</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-2.5 py-1 text-[11px] font-extrabold font-mono">
                    {todos.filter((t) => !t.completed).length} kvar
                  </span>
                </div>
                <div className="max-h-[260px] overflow-y-auto pr-0.5 space-y-1.5">
                  {todos.filter((t) => !t.completed).length === 0 ? (
                    <div
                      className={`rounded-2xl p-4 text-center space-y-1 ${
                        standaloneWidgetMode === 'wear'
                          ? 'bg-[#224735] text-white'
                          : 'bg-white border border-[#D2E7DA] text-[#183D2C]'
                      }`}
                    >
                      <div className="text-xs font-extrabold">✓ Alla uppgifter är avklarade!</div>
                      <div className="text-[10px] opacity-75"> Bra jobbat — lägg till ny ovan</div>
                    </div>
                  ) : (
                    todos
                      .filter((t) => !t.completed)
                      .map((todo) => (
                        <button
                          key={todo.id}
                          type="button"
                          onClick={() => handleToggleTodo(todo.id)}
                          className={`w-full text-left flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold transition-all ${
                            standaloneWidgetMode === 'wear'
                              ? 'bg-[#224735] hover:bg-[#2C5943] text-white'
                              : 'bg-white hover:bg-[#F5FBF7] border border-[#D5E8DC] text-[#141E18] shadow-2xs'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold ${
                                standaloneWidgetMode === 'wear'
                                  ? 'bg-[#183326] text-[#A6F2C6]'
                                  : 'bg-[#D8F3E3] text-[#183D2C]'
                              }`}
                            >
                              ▢
                            </span>
                            <span className="truncate">{todo.title}</span>
                          </span>
                          {todo.dueDate && (
                            <span className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-2 py-0.5 text-[10px] font-extrabold shrink-0">
                              {todo.dueDate.slice(5)}
                            </span>
                          )}
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive Tablet (7"+ / md:) / Googlebook OS / Desktop Layout Wrapper */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex gap-0 md:gap-5 lg:gap-6 md:px-5 lg:px-6">
        {/* Material 3 Expressive Navigation Rail for 7-inch+ Screens (md:flex) */}
        <aside className="hidden md:flex flex-col w-52 lg:w-56 shrink-0 pt-6 pb-8 sticky top-[76px] h-[calc(100vh-76px)]">
          <div className="rounded-[28px] bg-white border border-[#DCEAE1] p-3 shadow-xs space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#54685C]">
              Navigering
            </div>
            {(
              [
                { id: 'home', label: 'Startsida', icon: Home, shortcut: 'Alt+1', badge: 0 },
                {
                  id: 'shopping',
                  label: 'Inköpslista',
                  icon: ShoppingCart,
                  shortcut: 'Alt+2',
                  badge: shopping.filter((s) => !s.checked).length,
                },
                {
                  id: 'calendar',
                  label: 'Kalender',
                  icon: CalendarIcon,
                  shortcut: 'Alt+3',
                  badge: events.filter((e) => e.date === getTodayDateString()).length,
                },
                {
                  id: 'todo',
                  label: 'Att göra',
                  icon: CheckSquare,
                  shortcut: 'Alt+4',
                  badge: todos.filter((t) => !t.completed).length,
                },
                { id: 'notes', label: 'Anteckningar', icon: FileText, shortcut: 'Alt+5', badge: 0 },
                { id: 'recipes', label: 'Recept', icon: ChefHat, shortcut: 'Alt+6', badge: 0 },
                { id: 'budget', label: 'Budget', icon: Wallet, shortcut: 'Alt+7', badge: 0 },
                {
                  id: 'photos',
                  label: 'Foton',
                  icon: Camera,
                  shortcut: 'Alt+8',
                  badge: photos.length,
                },
              ] as const
            ).map((nav) => {
              const Icon = nav.icon;
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setActiveTab(nav.id)}
                  className={`w-full min-h-[42px] rounded-2xl px-3 py-2 text-xs font-extrabold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-[#183D2C] text-[#A6F2C6] shadow-xs'
                      : 'text-[#2E4035] hover:bg-[#E4F3EA]'
                  }`}
                  title={`${nav.label} (${nav.shortcut})`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{nav.label}</span>
                  </span>
                  {nav.badge > 0 ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-extrabold ${
                        isActive
                          ? 'bg-[#A6F2C6] text-[#183D2C]'
                          : 'bg-[#E4F3EA] text-[#183D2C]'
                      }`}
                    >
                      {nav.badge}
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono opacity-45">{nav.shortcut}</span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content Container */}
        <main
          style={{
            transform:
              pullDistance > 0 || isRefreshing
                ? `translateY(${isRefreshing ? 52 : Math.min(68, pullDistance * 0.55)}px)`
                : undefined,
            transition: pullDistance === 0 ? 'transform 0.25s ease-out' : 'none',
          }}
          className="flex-1 min-w-0 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-2 pt-5 sm:pt-8 pb-28"
        >
        {/* Per-Page Sharing Status Strip (Shows whether current page is Shared or Private) */}
        {currentTabShareInfo && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl bg-white border border-[#DCEAE1] px-4 py-2.5 text-xs shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              {currentTabShareInfo.sharedNames.length > 0 ? (
                <>
                  <Users className="h-3.5 w-3.5 text-[#183D2C] shrink-0" />
                  <span className="text-[#141E18] truncate">
                    <strong>{currentTabShareInfo.pageLabel}</strong> delas med:{' '}
                    <span className="font-bold text-[#183D2C]">
                      {currentTabShareInfo.sharedNames.join(', ')}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-[#54685C] shrink-0" />
                  <span className="text-[#54685C] truncate">
                    <strong>{currentTabShareInfo.pageLabel}</strong> är{' '}
                    <span className="font-bold text-[#141E18]">privat</span> för dig (delas ej)
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowProfileMenu(true)}
              className="text-xs font-extrabold text-[#183D2C] hover:underline shrink-0"
            >
              Ändra delning →
            </button>
          </div>
        )}

        {activeTab === 'home' && (
          <HomeView
            events={events}
            categories={categories}
            todos={todos}
            notes={notes}
            shopping={shopping}
            recipes={recipes}
            budgetMonths={budgetMonths}
            photos={photos}
            photoAlbums={photoAlbums}
            isEditingLayout={isEditingHomeLayout}
            onCloseEditingLayout={() => setIsEditingHomeLayout(false)}
            onNavigate={setActiveTab}
            onToggleTodo={handleToggleTodo}
            onToggleFavoriteTodo={(id) => {
              const next = todos.map((t) =>
                t.id === id ? { ...t, favorite: !t.favorite } : t
              );
              setTodos(next);
              pushHouseholdState('Uppdaterade favorituppgift', 'sync', { todos: next });
            }}
            onToggleFavoriteNote={(id) => {
              const next = notes.map((n) =>
                n.id === id ? { ...n, favorite: !n.favorite } : n
              );
              setNotes(next);
              pushHouseholdState('Uppdaterade favoritanteckning', 'sync', { notes: next });
            }}
            onToggleFavoriteShopping={(id) => {
              const next = shopping.map((s) =>
                s.id === id ? { ...s, favorite: !s.favorite } : s
              );
              setShopping(next);
              pushHouseholdState('Uppdaterade favoritvara', 'sync', { shopping: next });
            }}
            onToggleFavoriteRecipe={(id) => {
              const next = recipes.map((r) =>
                r.id === id ? { ...r, favorite: !r.favorite } : r
              );
              setRecipes(next);
              pushHouseholdState('Uppdaterade favoritrecept', 'sync', { recipes: next });
            }}
            onToggleShoppingChecked={(id) => {
              const next = shopping.map((s) =>
                s.id === id ? { ...s, checked: !s.checked } : s
              );
              setShopping(next);
              pushHouseholdState('Uppdaterade inköpslista', 'sync', { shopping: next });
            }}
            isGoogleConnected={true}
            onSyncAll={() => syncSharedWorkspaceNow()}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'photos' && (
          <PhotosView
            photos={photos}
            albums={photoAlbums}
            currentAccount={currentAccount}
            sharedWithNames={getSharedNamesForModule('photos')}
            onOpenSharingSettings={() => setShowProfileMenu(true)}
            onAddPhotos={handleAddPhotos}
            onDeletePhoto={handleDeletePhoto}
            onToggleFavoritePhoto={handleToggleFavoritePhoto}
            onMovePhotoToAlbum={handleMovePhotoToAlbum}
            onToggleReaction={handleTogglePhotoReaction}
            onAddComment={handleAddPhotoComment}
            onDeleteComment={handleDeletePhotoComment}
            onCreateAlbum={handleCreatePhotoAlbum}
            onDeleteAlbum={handleDeletePhotoAlbum}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            categories={categories}
            currentAccount={currentAccount}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onUpdateCategoryColor={handleUpdateCategoryColor}
            onRenameCategory={handleRenameCategory}
            onAddCategory={handleAddCategory}
            isGoogleConnected={true}
            onSyncGoogleCalendar={() => syncSharedWorkspaceNow()}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'todo' && (
          <TodoView
            todos={todos}
            onAddTodo={handleAddTodo}
            onUpdateTodo={handleUpdateTodo}
            onToggleTodo={handleToggleTodo}
            onDeleteTodo={handleDeleteTodo}
            onToggleFavorite={(id) => {
              const next = todos.map((t) =>
                t.id === id ? { ...t, favorite: !t.favorite } : t
              );
              setTodos(next);
              pushHouseholdState('Uppdaterade favorituppgift', 'sync', { todos: next });
            }}
            isGoogleConnected={true}
            onSyncGoogleTasks={() => syncSharedWorkspaceNow()}
            isSyncing={isSyncing}
            onTriggerTestNotification={(title, body) =>
              pushNotification(title, body, 'todo')
            }
          />
        )}

        {activeTab === 'notes' && (
          <NotesView
            notes={notes}
            onAddNote={(newNote) => {
              const next = [
                {
                  ...newNote,
                  id: `note-${Date.now()}`,
                  updatedAt: new Date().toISOString(),
                },
                ...notes,
              ];
              setNotes(next);
              pushHouseholdState(`Anteckningar: ${newNote.title}`, 'notes', {
                notes: next,
              });
            }}
            onUpdateNote={(updated) => {
              const next = notes.map((n) => (n.id === updated.id ? updated : n));
              setNotes(next);
              pushHouseholdState(`Uppdaterade anteckningen "${updated.title}"`, 'sync', {
                notes: next,
              });
            }}
            onDeleteNote={(note) =>
              setConfirmState({
                open: true,
                title: 'Ta bort anteckning?',
                description: `Är du säker på att du vill ta bort anteckningen "${note.title}"?`,
                confirmLabel: 'Ta bort',
                destructive: true,
                action: () => {
                  const next = notes.filter((n) => n.id !== note.id);
                  setNotes(next);
                  pushHouseholdState(`Tog bort anteckningen "${note.title}"`, 'sync', {
                    notes: next,
                  });
                },
              })
            }
            onToggleFavorite={(id) => {
              const next = notes.map((n) =>
                n.id === id ? { ...n, favorite: !n.favorite } : n
              );
              setNotes(next);
              pushHouseholdState('Uppdaterade favoritanteckning', 'sync', {
                notes: next,
              });
            }}
            onToggleChecklistItem={(noteId, itemId) => {
              const next = notes.map((n) =>
                n.id === noteId
                  ? {
                      ...n,
                      checklistItems: n.checklistItems.map((ci) =>
                        ci.id === itemId ? { ...ci, checked: !ci.checked } : ci
                      ),
                    }
                  : n
              );
              setNotes(next);
              pushHouseholdState('Uppdaterade checklista i anteckning', 'sync', {
                notes: next,
              });
            }}
            isGoogleConnected={true}
            onSyncKeep={() => syncSharedWorkspaceNow()}
            isSyncing={isSyncing}
            keepSyncStatus={keepSyncStatus}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingView
            items={shopping}
            onAddItem={handleAddShoppingItem}
            onToggleChecked={(id) => {
              const target = shopping.find((s) => s.id === id);
              const nextShopping = shopping.map((s) =>
                s.id === id ? { ...s, checked: !s.checked } : s
              );
              setShopping(nextShopping);
              if (target) {
                pushHouseholdState(
                  `${!target.checked ? 'Bockade av' : 'Återställde'} ${target.name} i inköpslistan`,
                  'sync',
                  { shopping: nextShopping }
                );
              }
            }}
            onToggleFavorite={(id) => {
              const next = shopping.map((s) =>
                s.id === id ? { ...s, favorite: !s.favorite } : s
              );
              setShopping(next);
              pushHouseholdState('Uppdaterade favoritvara', 'sync', { shopping: next });
            }}
            onDeleteItem={(id) => {
              const target = shopping.find((s) => s.id === id);
              const nextShopping = shopping.filter((s) => s.id !== id);
              setShopping(nextShopping);
              if (target) {
                pushHouseholdState(
                  `Tog bort ${target.name} från inköpslistan`,
                  'sync',
                  { shopping: nextShopping }
                );
              }
            }}
            onClearChecked={() => {
              const nextShopping = shopping.filter((s) => !s.checked);
              setShopping(nextShopping);
              pushHouseholdState(
                'Rensade alla avbockade varor från inköpslistan',
                'sync',
                { shopping: nextShopping }
              );
            }}
            onTriggerShoppingNotification={() => {
              const remaining = shopping.filter((s) => !s.checked);
              pushNotification(
                'Hem',
                `Inköpslista: ${remaining.length} varor kvar (${remaining
                  .slice(0, 3)
                  .map((i) => i.name)
                  .join(', ')})`,
                'shopping'
              );
            }}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesView
            recipes={recipes}
            onAddRecipe={(recData) => {
              const next = [
                {
                  ...recData,
                  id: `rec-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                },
                ...recipes,
              ];
              setRecipes(next);
              pushHouseholdState(`Recept: ${recData.title}`, 'recipes', {
                recipes: next,
              });
            }}
            onUpdateRating={(id, rating) => {
              const next = recipes.map((r) => (r.id === id ? { ...r, rating } : r));
              setRecipes(next);
              pushHouseholdState('Uppdaterade betyg på recept', 'sync', {
                recipes: next,
              });
            }}
            onToggleFavorite={(id) => {
              const next = recipes.map((r) =>
                r.id === id ? { ...r, favorite: !r.favorite } : r
              );
              setRecipes(next);
              pushHouseholdState('Uppdaterade favoritrecept', 'sync', {
                recipes: next,
              });
            }}
            onDeleteRecipe={(id) => {
              const next = recipes.filter((r) => r.id !== id);
              setRecipes(next);
              pushHouseholdState('Tog bort ett recept', 'sync', {
                recipes: next,
              });
            }}
            onSendIngredientsToShopping={handleSendIngredientsToShopping}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            months={budgetMonths}
            activeMonthKey={activeMonthKey}
            onSelectMonth={setActiveMonthKey}
            onAddMonth={handleAddBudgetMonth}
            onDeleteMonth={handleDeleteBudgetMonth}
            onSaveEntry={handleSaveBudgetEntry}
            onDeleteEntry={handleDeleteBudgetEntry}
            onOpenCalculator={(cb) => {
              setCalculatorCallback(() => cb);
              setCalculatorOpen(true);
            }}
          />
        )}
        </main>
      </div>

      {/* Offline Mode Banner */}
      {!isOnline && (
        <div className="fixed bottom-6 left-4 z-50 flex items-center gap-2 rounded-2xl bg-[#7A4F2B] px-4 py-2.5 text-xs font-bold text-white shadow-xl">
          <WifiOff className="h-4 w-4" />
          <span>Offline-läge — Ändringar sparas lokalt ({syncQueue.length} i synkkö)</span>
        </div>
      )}

      {/* Expressive FAB Menu */}
      <ExpressiveFAB
        activeTab={activeTab}
        onSelectDestination={(tab) => setActiveTab(tab)}
        memberName={memberName}
      />

      {/* Built-in Calculator Drawer (Strictly available on Budget page) */}
      {activeTab === 'budget' && (
        <CalculatorDrawer
          open={calculatorOpen}
          onClose={() => setCalculatorOpen(false)}
          onUseAmount={calculatorCallback}
        />
      )}

      {/* Mandatory User Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onConfirm={async () => {
          setConfirmState((prev) => ({ ...prev, open: false }));
          await confirmState.action();
        }}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />

      {/* Förslag 3: Material 3 Expressive Hushållstavla (Skärmsläckare + Nattklocka 22–06) */}
      <ScreensaverView
        open={showScreensaver}
        onClose={() => setShowScreensaver(false)}
        events={events}
        categories={categories}
        todos={todos}
        notes={notes}
        shopping={shopping}
        recipes={recipes}
        memberName={memberName}
        idleMinutes={screensaverIdleMinutes}
        onChangeIdleMinutes={setScreensaverIdleMinutes}
        onToggleShoppingChecked={(id) => {
          const target = shopping.find((s) => s.id === id);
          const nextShopping = shopping.map((s) =>
            s.id === id ? { ...s, checked: !s.checked } : s
          );
          setShopping(nextShopping);
          if (target) {
            pushHouseholdState(
              `${!target.checked ? 'Bockade av' : 'Återställde'} ${target.name} i inköpslistan`,
              'sync',
              { shopping: nextShopping }
            );
          }
        }}
        onAddShoppingItem={handleAddShoppingItem}
        onClearCheckedShopping={() => {
          const nextShopping = shopping.filter((s) => !s.checked);
          setShopping(nextShopping);
          pushHouseholdState(
            'Rensade alla avbockade varor från inköpslistan',
            'sync',
            { shopping: nextShopping }
          );
        }}
        onToggleTodo={handleToggleTodo}
        onAddTodo={handleAddTodo}
        onToggleNoteChecklistItem={(noteId, itemId) => {
          const next = notes.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  checklistItems: n.checklistItems.map((ci) =>
                    ci.id === itemId ? { ...ci, checked: !ci.checked } : ci
                  ),
                }
              : n
          );
          setNotes(next);
          pushHouseholdState('Uppdaterade checklista i anteckning', 'sync', {
            notes: next,
          });
        }}
        onAddEvent={handleAddEvent}
        onDeleteEventDirect={(eventId) => {
          const target = events.find((e) => e.id === eventId);
          const nextEvents = events.filter((e) => e.id !== eventId);
          setEvents(nextEvents);
          if (target) {
            pushHouseholdState(
              `Bockade av kalenderhändelsen "${target.title}"`,
              'sync',
              { events: nextEvents }
            );
          }
        }}
        onSendIngredientsToShopping={(ingredients, recipeTitle) => {
          if (!ingredients || ingredients.length === 0) return;
          const newItems: ShoppingItem[] = ingredients.map((ing, i) => ({
            id: `shop-${Date.now()}-${i}`,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            category: classifySwedishGrocery(ing.name),
            checked: false,
            favorite: false,
            addedAt: new Date().toISOString(),
          }));
          const nextShopping = [...newItems, ...shopping];
          setShopping(nextShopping);
          pushHouseholdState(
            `Inköpslista: ${ingredients.length} varor från ${recipeTitle}`,
            'shopping',
            { shopping: nextShopping }
          );
          pushNotification(
            'Hem',
            `Lade till ${ingredients.length} varor från "${recipeTitle}" i inköpslistan`,
            'shopping'
          );
        }}
      />
    </div>
  );
}
