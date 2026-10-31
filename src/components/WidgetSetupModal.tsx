import React, { useState } from 'react';
import {
  LayoutGrid,
  X,
  Check,
  Copy,
  Smartphone,
  Apple,
  RefreshCw,
  ExternalLink,
  ShoppingCart,
  Calendar as CalendarIcon,
  CheckSquare,
  Watch,
  Laptop,
  Sparkles,
  Plus,
} from 'lucide-react';
import { CalendarEvent, Category, ShoppingItem, TodoItem, UserAccount } from '../types';
import { resolveModuleWorkspaceKey, sanitizeFirestoreId } from '../utils/cloudHouseholdSync';
import { getTodayDateString, getOffsetDateString, INITIAL_CATEGORIES } from '../data/initialData';
import { classifySwedishGrocery } from '../utils/swedishGrocerySorter';

interface WidgetSetupModalProps {
  open: boolean;
  onClose: () => void;
  onForceUpdateAndroidWidgets: () => void;
  events: CalendarEvent[];
  categories?: Category[];
  shopping: ShoppingItem[];
  todos: TodoItem[];
  currentAccount?: UserAccount | null;
  onToggleShopping?: (id: string) => void;
  onAddShoppingItem?: (item: Omit<ShoppingItem, 'id' | 'addedAt'>) => void;
  onToggleTodo?: (id: string) => void;
  onAddTodo?: (todo: Omit<TodoItem, 'id' | 'createdAt'>) => void;
  onOpenStandaloneWidgetMode?: (mode: 'shopping' | 'calendar' | 'todo' | 'all' | 'wear') => void;
}

const SWEDISH_MONTHS_TITLE = [
  'Januari',
  'Februari',
  'Mars',
  'April',
  'Maj',
  'Juni',
  'Juli',
  'Augusti',
  'September',
  'Oktober',
  'November',
  'December',
];

const SWEDISH_DOW_SHORT = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

function getSwedishDowAndDayNum(isoDate: string): { dow: string; dayNum: string } {
  try {
    const [y, m, d] = isoDate.split('-').map(Number);
    if (y && m && d) {
      const dt = new Date(y, m - 1, d);
      return {
        dow: SWEDISH_DOW_SHORT[dt.getDay()] || 'Mån',
        dayNum: String(d),
      };
    }
  } catch {
    // Ignore
  }
  return { dow: 'Idag', dayNum: isoDate.slice(8, 10).replace(/^0/, '') || '1' };
}

export const WidgetSetupModal: React.FC<WidgetSetupModalProps> = ({
  open,
  onClose,
  onForceUpdateAndroidWidgets,
  events,
  categories = INITIAL_CATEGORIES,
  shopping,
  todos,
  currentAccount,
  onToggleShopping,
  onAddShoppingItem,
  onToggleTodo,
  onAddTodo,
  onOpenStandaloneWidgetMode,
}) => {
  const [copiedType, setCopiedType] = useState<'calendar' | 'shopping' | 'todo' | 'pwa-url' | null>(
    null
  );
  const [androidSynced, setAndroidSynced] = useState(false);
  const [quickShopInput, setQuickShopInput] = useState('');
  const [quickTodoInput, setQuickTodoInput] = useState('');
  const [showShopInput, setShowShopInput] = useState(false);
  const [showTodoInput, setShowTodoInput] = useState(false);
  const [activeSection, setActiveSection] = useState<'m3-live' | 'pwa-chromeos' | 'ios' | 'wear'>(
    'm3-live'
  );

  if (!open) return null;

  const todayStr = getTodayDateString();
  const maxTwoWeeksStr = getOffsetDateString(14);
  const upcomingEvents = [...events]
    .filter((e) => e.date >= todayStr && e.date <= maxTwoWeeksStr)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));

  const currentMonthTitle = SWEDISH_MONTHS_TITLE[new Date().getMonth()] || 'Kalender';

  const getEventCategoryColor = (evt: CalendarEvent): string => {
    if (evt.customColorHex) return evt.customColorHex;
    const found =
      categories.find((c) => c.id === evt.categoryId) ||
      INITIAL_CATEGORIES.find((c) => c.id === evt.categoryId);
    return found?.colorHex || '#0066FF';
  };

  const uncheckedShopping = shopping.filter((s) => !s.checked);
  const openTodos = todos.filter((t) => !t.completed);

  const getWorkspaceDocIdForMode = (mode: 'calendar' | 'shopping' | 'todo'): string => {
    const rawKey = resolveModuleWorkspaceKey(currentAccount?.email || null, mode);
    return sanitizeFirestoreId(rawKey);
  };

  const openFloatingPwaWidget = (mode: 'shopping' | 'calendar' | 'todo' | 'all' | 'wear') => {
    const hash = mode === 'wear' ? '#wear' : `#widget-${mode}`;
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    const width = mode === 'wear' ? 340 : mode === 'all' ? 440 : 360;
    const height = mode === 'wear' ? 360 : mode === 'all' ? 680 : 480;
    try {
      const popup = window.open(
        url,
        `hem_widget_${mode}`,
        `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
      );
      if (!popup && onOpenStandaloneWidgetMode) {
        onOpenStandaloneWidgetMode(mode);
        onClose();
      }
    } catch {
      if (onOpenStandaloneWidgetMode) {
        onOpenStandaloneWidgetMode(mode);
        onClose();
      }
    }
  };

  const buildIosScriptableCode = (mode: 'calendar' | 'shopping' | 'todo') => {
    const wsDocId = getWorkspaceDocIdForMode(mode);
    const title =
      mode === 'calendar'
        ? currentMonthTitle
        : mode === 'shopping'
        ? 'Inköpslista'
        : 'Att göra';

    return `// Hem — Google Calendar & Google Tasks Style Widget (${title})
// Öppna gratisappen "Scriptable" -> tryck "+" -> klistra in detta skript.
// Synkar i realtid mot ert gemensamma hushåll (${wsDocId})!
const MODE = "${mode}";
const WS_DOC_ID = "${wsDocId}";
const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/gen-lang-client-0269437912/databases/ai-studio-vardagsnavkalend-573f32e2-2ecd-4fec-bdc0-b78a7d1d127b/documents/workspaces/" + WS_DOC_ID;

const w = new ListWidget();
w.backgroundColor = new Color("#F0F3F8");
w.setPadding(14, 14, 14, 14);
w.url = "https://hemmahosf.web.app/#" + MODE;

const header = w.addStack();
header.layoutHorizontally();
header.centerAlignContent();

if (MODE !== "calendar") {
  const iconBox = header.addStack();
  iconBox.backgroundColor = new Color("#242942");
  iconBox.cornerRadius = 12;
  iconBox.setPadding(4, 7, 4, 7);
  const iconTxt = iconBox.addText("✓");
  iconTxt.font = Font.boldSystemFont(12);
  iconTxt.textColor = new Color("#FFFFFF");
  header.addSpacer(8);
}

const mainTxt = header.addText("${title}");
mainTxt.font = Font.boldSystemFont(18);
mainTxt.textColor = new Color("#1C1F26");

header.addSpacer();

const addPill = header.addStack();
addPill.backgroundColor = new Color("#242942");
addPill.cornerRadius = 15;
addPill.setPadding(4, 13, 4, 13);
const addTxt = addPill.addText("+");
addTxt.font = Font.boldSystemFont(15);
addTxt.textColor = new Color("#FFFFFF");

let items = [];
let emptyMsg = "Inga poster";

try {
  const req = new Request(FIRESTORE_URL);
  req.timeoutInterval = 8;
  const json = await req.loadJSON();
  const sliceRaw = json && json.fields && json.fields.sliceJson && json.fields.sliceJson.stringValue;
  const data = sliceRaw ? JSON.parse(sliceRaw) : { events: [], shopping: [], todos: [] };

  if (MODE === "calendar") {
    const today = new Date().toISOString().slice(0, 10);
    const allUpcoming = (data.events || [])
      .filter(e => e.date >= today)
      .sort((a, b) => (a.date + (a.startTime || "")).localeCompare(b.date + (b.startTime || "")));
    emptyMsg = "Inga kommande händelser";
    items = allUpcoming.slice(0, 4).map(e => ({
      date: e.date,
      time: e.isAllDay ? "" : (e.endTime ? e.startTime + "–" + e.endTime : (e.startTime || "")),
      title: e.title || "",
      color: e.customColorHex || "#0066FF"
    }));
  } else if (MODE === "shopping") {
    const unchecked = (data.shopping || []).filter(s => !s.checked);
    emptyMsg = "Inköpslistan är tom";
    items = unchecked.slice(0, 5).map(s => ({
      title: s.name || "",
      meta: (s.amount || 1) + " " + (s.unit || "st")
    }));
  } else {
    const open = (data.todos || []).filter(t => !t.completed);
    emptyMsg = "Alla uppgifter är avklarade!";
    items = open.slice(0, 5).map(t => ({
      title: t.title || "",
      meta: t.dueDate ? t.dueDate.slice(5) : ""
    }));
  }
} catch (e) {
  emptyMsg = "Tryck för att öppna Hem";
}

w.addSpacer(10);

if (items.length === 0) {
  const emptyCard = w.addStack();
  emptyCard.layoutVertically();
  emptyCard.backgroundColor = new Color("#FFFFFF");
  emptyCard.cornerRadius = 16;
  emptyCard.setPadding(14, 14, 14, 14);
  const t = emptyCard.addText("✓  " + emptyMsg);
  t.font = Font.boldSystemFont(12);
  t.textColor = new Color("#1C1F26");
} else if (MODE === "calendar") {
  let prevDate = "";
  for (const it of items) {
    const row = w.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    const dayCol = row.addStack();
    dayCol.size = new Size(34, 32);
    if (it.date !== prevDate) {
      const dTxt = dayCol.addText(it.date.slice(8).replace(/^0/, ""));
      dTxt.font = Font.boldSystemFont(13);
      dTxt.textColor = new Color("#1C1F26");
    }
    prevDate = it.date;
    row.addSpacer(6);
    const card = row.addStack();
    card.layoutVertically();
    card.backgroundColor = new Color(it.color || "#0066FF");
    card.cornerRadius = 12;
    card.setPadding(6, 10, 6, 10);
    const tt = card.addText(it.title);
    tt.font = Font.boldSystemFont(12);
    tt.textColor = Color.white();
    tt.lineLimit = 1;
    if (it.time) {
      const tm = card.addText(it.time);
      tm.font = Font.systemFont(10);
      tm.textColor = new Color("#FFFFFF", 0.9);
    }
    w.addSpacer(5);
  }
} else {
  for (const it of items) {
    const row = w.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    row.setPadding(3, 2, 3, 2);
    const pt = row.addText("○");
    pt.font = Font.boldSystemFont(15);
    pt.textColor = new Color("#444746");
    row.addSpacer(10);
    const tt = row.addText(it.title);
    tt.font = Font.systemFont(13);
    tt.textColor = new Color("#1C1F26");
    tt.lineLimit = 1;
    row.addSpacer();
    if (it.meta) {
      const mt = row.addText(it.meta);
      mt.font = Font.systemFont(11);
      mt.textColor = new Color("#5F6368");
    }
    w.addSpacer(4);
  }
}

w.addSpacer();
Script.setWidget(w);
Script.complete();`;
  };

  const handleCopy = async (mode: 'calendar' | 'shopping' | 'todo') => {
    try {
      await navigator.clipboard.writeText(buildIosScriptableCode(mode));
      setCopiedType(mode);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // Ignore
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[32px] bg-[#F6FBF7] border border-[#CDE0D4] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#DCEAE1] bg-[#F6FBF7] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-[#242942] text-white shadow-xs">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-[#141E18]">
                  Hemskärms-widgets & Wear OS
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#E8ECF4] px-2.5 py-0.5 text-[10px] font-extrabold text-[#242942]">
                  <Sparkles className="h-3 w-3" /> Google Calendar & Tasks Stil
                </span>
              </div>
              <p className="text-xs text-[#54685C]">
                Kalenderschema + Google Tasks-stil för Inköpslista & Att göra
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#38493F] hover:bg-[#D8F3E3]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Switcher */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-[#F6FBF7] border-b border-[#DCEAE1] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {(
            [
              { id: 'm3-live', label: 'Widgets (Live)', icon: Sparkles },
              { id: 'pwa-chromeos', label: 'PWA & Googlebook OS', icon: Laptop },
              { id: 'ios', label: 'iPhone / Scriptable', icon: Apple },
              { id: 'wear', label: 'Wear OS Klocka', icon: Watch },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`min-h-[38px] rounded-2xl px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#242942] text-white shadow-xs'
                    : 'bg-white border border-[#CDE0D4] text-[#2E4035] hover:bg-[#E4F3EA]'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-sm text-[#2E4035]">
          {activeSection === 'm3-live' && (
            <>
              {/* Live Interactive Preview Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#54685C]">
                    Interaktiva Widgets — Google Calendar & Google Tasks Design
                  </span>
                  <button
                    type="button"
                    onClick={() => openFloatingPwaWidget('all')}
                    className="rounded-full bg-[#242942] text-white px-3 py-1 text-[11px] font-extrabold flex items-center gap-1.5 hover:bg-[#191D30] transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Öppna alla 3 som flytande widget</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* 1. KALENDER WIDGET (Google Calendar Schedule Widget Style - som bilden!) */}
                  <div className="rounded-[24px] bg-[#F0F3F8] border border-[#DCE2EC] p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                      {/* Clean Month Header + Dark Pill "+" Button */}
                      <div className="flex items-center justify-between gap-2 px-0.5">
                        <div className="text-[18px] font-bold tracking-tight text-[#1C1F26]">
                          {currentMonthTitle}
                        </div>
                        <button
                          type="button"
                          onClick={() => openFloatingPwaWidget('calendar')}
                          className="h-[30px] w-[44px] rounded-full bg-[#242942] text-white flex items-center justify-center hover:bg-[#1A1E33] transition-colors shadow-2xs"
                          title="Öppna kalender"
                        >
                          <Plus className="h-4 w-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Grouped Day Column on Left + Colored Event Pill on Right */}
                      <div className="mt-3 max-h-[240px] overflow-y-auto pr-0.5 space-y-1.5 min-h-[156px] flex flex-col">
                        {upcomingEvents.length === 0 ? (
                          <div className="rounded-[18px] bg-white p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[144px] my-auto">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#242942] text-white text-xs font-bold">
                              📅
                            </span>
                            <div className="text-xs font-bold text-[#1C1F26]">
                              Inga händelser närmaste 2 veckorna
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {upcomingEvents.map((evt, idx) => {
                              const catColor = getEventCategoryColor(evt);
                              const sameAsPrevDay =
                                idx > 0 && upcomingEvents[idx - 1].date === evt.date;
                              const isHighlightedDay = evt.date === todayStr || idx === 0;
                              const { dow, dayNum } = getSwedishDowAndDayNum(evt.date);
                              const timeRange = evt.isAllDay
                                ? ''
                                : evt.endTime && evt.endTime !== evt.startTime
                                ? `${evt.startTime}–${evt.endTime}`
                                : evt.startTime;

                              return (
                                <div key={evt.id} className="flex items-start gap-1.5">
                                  {/* Left Day Badge Column */}
                                  <div
                                    className={`w-9 shrink-0 flex flex-col items-center justify-center ${
                                      sameAsPrevDay ? 'invisible' : ''
                                    }`}
                                  >
                                    <div
                                      className={`w-9 h-9 rounded-full flex flex-col items-center justify-center leading-none ${
                                        isHighlightedDay
                                          ? 'bg-[#242942] text-white shadow-2xs'
                                          : 'text-[#1C1F26]'
                                      }`}
                                    >
                                      <span
                                        className={`text-[9px] font-bold ${
                                          isHighlightedDay ? 'text-white/95' : 'text-[#444746]'
                                        }`}
                                      >
                                        {dow}
                                      </span>
                                      <span className="text-[12.5px] font-extrabold mt-0.5">
                                        {dayNum}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right Colored Event Card */}
                                  <div
                                    style={{ backgroundColor: catColor }}
                                    className="flex-1 min-w-0 min-h-[36px] flex flex-col justify-center rounded-[14px] px-3 py-1.5 text-white shadow-2xs"
                                  >
                                    <span className="text-[13px] font-bold leading-snug truncate">
                                      {evt.title}
                                    </span>
                                    {timeRange && (
                                      <span className="text-[11px] font-medium text-white/90 leading-tight truncate">
                                        {timeRange}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openFloatingPwaWidget('calendar')}
                      className="mt-3 w-full min-h-[34px] rounded-xl bg-white hover:bg-[#E4E9F2] border border-[#D5DCE6] px-3 py-1.5 text-[11px] font-bold text-[#1C1F26] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Poppa ut Kalender-widget</span>
                    </button>
                  </div>

                  {/* 2. INKÖPSLISTA WIDGET (Google Tasks Widget Style) */}
                  <div className="rounded-[24px] bg-[#F0F3F8] border border-[#DCE2EC] p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                      {/* Google Tasks Header */}
                      <div className="flex items-center justify-between gap-2 px-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#242942] text-white text-xs font-bold">
                            ✓
                          </span>
                          <span className="text-[17px] font-bold text-[#1C1F26] truncate">
                            Inköpslista
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowShopInput((v) => !v)}
                          className="h-[30px] w-[44px] shrink-0 rounded-full bg-[#242942] text-white flex items-center justify-center hover:bg-[#1A1E33] transition-colors shadow-2xs"
                          title="Lägg till vara i inköpslistan"
                        >
                          <Plus className="h-4 w-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {onAddShoppingItem && showShopInput && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const name = quickShopInput.trim();
                            if (!name) return;
                            onAddShoppingItem({
                              name,
                              amount: 1,
                              unit: 'st',
                              category: classifySwedishGrocery(name),
                              checked: false,
                              favorite: false,
                            });
                            setQuickShopInput('');
                            setShowShopInput(false);
                          }}
                          className="mt-2.5 flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={quickShopInput}
                            onChange={(e) => setQuickShopInput(e.target.value)}
                            placeholder="Ny vara (t.ex. Mjölk)..."
                            autoFocus
                            className="flex-1 min-w-0 h-8 rounded-xl bg-white border border-[#D5DCE6] px-2.5 text-xs font-medium text-[#1C1F26] placeholder:text-[#757A84] outline-none focus:border-[#242942]"
                          />
                          <button
                            type="submit"
                            className="h-8 px-2.5 shrink-0 rounded-xl bg-[#242942] text-white text-xs font-bold"
                          >
                            Lägg till
                          </button>
                        </form>
                      )}

                      {/* Google Tasks List Rows */}
                      <div className="mt-2.5 max-h-[240px] overflow-y-auto pr-0.5 space-y-0.5 min-h-[156px] flex flex-col">
                        {uncheckedShopping.length === 0 ? (
                          <div className="rounded-[18px] bg-white p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[144px] my-auto">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#242942] text-white text-xs font-bold">
                              ✓
                            </span>
                            <div className="text-xs font-bold text-[#1C1F26]">
                              Inköpslistan är tom
                            </div>
                            <div className="text-[10px] text-[#5F6368]">
                              Tryck på + för att lägga till varor
                            </div>
                          </div>
                        ) : (
                          <div className="divide-y divide-[#E2E7F0]/70">
                            {uncheckedShopping.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onToggleShopping && onToggleShopping(item.id)}
                                className="w-full text-left flex items-start gap-3 rounded-xl px-1.5 py-2 hover:bg-black/5 transition-colors group"
                                title="Klicka för att bocka av"
                              >
                                <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#444746] group-hover:border-[#1C1F26] transition-colors" />
                                <span className="flex-1 min-w-0">
                                  <span className="block text-[14px] font-medium text-[#1C1F26] leading-snug truncate">
                                    {item.name}
                                  </span>
                                  <span className="block text-[11.5px] text-[#5F6368] leading-tight">
                                    {item.amount} {item.unit}
                                  </span>
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openFloatingPwaWidget('shopping')}
                      className="mt-3 w-full min-h-[34px] rounded-xl bg-white hover:bg-[#E4E9F2] border border-[#D5DCE6] px-3 py-1.5 text-[11px] font-bold text-[#1C1F26] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Poppa ut Inköps-widget</span>
                    </button>
                  </div>

                  {/* 3. ATT GÖRA WIDGET (Google Tasks Widget Style) */}
                  <div className="rounded-[24px] bg-[#F0F3F8] border border-[#DCE2EC] p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                      {/* Google Tasks Header */}
                      <div className="flex items-center justify-between gap-2 px-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#242942] text-white text-xs font-bold">
                            ✓
                          </span>
                          <span className="text-[17px] font-bold text-[#1C1F26] truncate">
                            Att göra
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTodoInput((v) => !v)}
                          className="h-[30px] w-[44px] shrink-0 rounded-full bg-[#242942] text-white flex items-center justify-center hover:bg-[#1A1E33] transition-colors shadow-2xs"
                          title="Lägg till ny uppgift"
                        >
                          <Plus className="h-4 w-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {onAddTodo && showTodoInput && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const title = quickTodoInput.trim();
                            if (!title) return;
                            onAddTodo({
                              title,
                              completed: false,
                              favorite: false,
                              category: 'Hushåll',
                              priority: 'medium',
                              dueDate: todayStr,
                            });
                            setQuickTodoInput('');
                            setShowTodoInput(false);
                          }}
                          className="mt-2.5 flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={quickTodoInput}
                            onChange={(e) => setQuickTodoInput(e.target.value)}
                            placeholder="Ny uppgift..."
                            autoFocus
                            className="flex-1 min-w-0 h-8 rounded-xl bg-white border border-[#D5DCE6] px-2.5 text-xs font-medium text-[#1C1F26] placeholder:text-[#757A84] outline-none focus:border-[#242942]"
                          />
                          <button
                            type="submit"
                            className="h-8 px-2.5 shrink-0 rounded-xl bg-[#242942] text-white text-xs font-bold"
                          >
                            Lägg till
                          </button>
                        </form>
                      )}

                      {/* Google Tasks List Rows */}
                      <div className="mt-2.5 max-h-[240px] overflow-y-auto pr-0.5 space-y-0.5 min-h-[156px] flex flex-col">
                        {openTodos.length === 0 ? (
                          <div className="rounded-[18px] bg-white p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[144px] my-auto">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#242942] text-white text-xs font-bold">
                              ✓
                            </span>
                            <div className="text-xs font-bold text-[#1C1F26]">
                              Alla uppgifter är avklarade!
                            </div>
                            <div className="text-[10px] text-[#5F6368]">
                              Tryck på + för att lägga till uppgift
                            </div>
                          </div>
                        ) : (
                          <div className="divide-y divide-[#E2E7F0]/70">
                            {openTodos.map((todo) => (
                              <button
                                key={todo.id}
                                type="button"
                                onClick={() => onToggleTodo && onToggleTodo(todo.id)}
                                className="w-full text-left flex items-start gap-3 rounded-xl px-1.5 py-2 hover:bg-black/5 transition-colors group"
                                title="Klicka för att klarmarkera"
                              >
                                <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#444746] group-hover:border-[#1C1F26] transition-colors" />
                                <span className="flex-1 min-w-0">
                                  <span className="block text-[14px] font-medium text-[#1C1F26] leading-snug truncate">
                                    {todo.title}
                                  </span>
                                  {todo.dueDate && (
                                    <span className="block text-[11.5px] text-[#5F6368] leading-tight">
                                      {todo.dueDate === todayStr ? 'Idag' : todo.dueDate.slice(5)}
                                    </span>
                                  )}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openFloatingPwaWidget('todo')}
                      className="mt-3 w-full min-h-[34px] rounded-xl bg-white hover:bg-[#E4E9F2] border border-[#D5DCE6] px-3 py-1.5 text-[11px] font-bold text-[#1C1F26] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Poppa ut Att göra-widget</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Native Android Widgets Card */}
              <div className="rounded-3xl bg-white border border-[#DCEAE1] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-extrabold text-[#183D2C]">
                    <Smartphone className="h-4 w-4 shrink-0" />
                    <span>Android Hemskärms-widgets (Google Calendar & Google Tasks Stil)</span>
                  </div>
                  <span className="rounded-full bg-[#E8ECF4] px-2.5 py-0.5 text-[10px] font-bold text-[#242942]">
                    Dag-gruppering + Cirkel-avbockning
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#4E6357]">
                  <strong>Kalender-widgeten</strong> visar nu månadens namn överst, grupperar händelser per dag med veckodag och datum till vänster (med mörk cirkel för idag) och färgkodade händelsekort till höger. <strong>Inköpslista-</strong> och <strong>Att göra-widgetarna</strong> har fått samma rena design som <strong>Google Tasks</strong> med runda avbockningsringar till vänster och <strong>+</strong>-knapp uppe i hörnet för att lägga till varor eller uppgifter direkt på hemskärmen!
                </p>
                <div className="rounded-2xl bg-[#E4F3EA] p-3 text-xs text-[#183D2C]">
                  <strong>Lägg till på Android:</strong> Håll fingret intryckt på hemskärmen → välj <strong>Widgets</strong> → skrolla till <strong>Hem</strong> och dra ut Inköpslista, Kalender eller Att göra!
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onForceUpdateAndroidWidgets();
                    setAndroidSynced(true);
                    setTimeout(() => setAndroidSynced(false), 2000);
                  }}
                  className="w-full min-h-[42px] rounded-2xl bg-[#183D2C] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F291E] flex items-center justify-center gap-2"
                >
                  {androidSynced ? (
                    <>
                      <Check className="h-4 w-4 text-[#A6F2C6]" />
                      <span>Android-widgets uppdaterade!</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 text-[#A6F2C6]" />
                      <span>Synka & uppdatera Android-widgets nu</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {activeSection === 'pwa-chromeos' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-white border border-[#DCEAE1] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-extrabold text-[#183D2C]">
                    <Laptop className="h-4 w-4 shrink-0" />
                    <span>PWA Widgets för hemmahosf.web.app & Googlebook OS</span>
                  </div>
                  <span className="rounded-full bg-[#D8F3E3] px-2.5 py-0.5 text-[10px] font-bold text-[#183D2C]">
                    Fungerar direkt
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#4E6357]">
                  På <strong>hemmahosf.web.app</strong> (och på <strong>Googlebook OS / Chromebook</strong>, PC, Mac och mobil) har vi byggt in ett dedikerat <strong>Material 3 Expressive Widget-läge</strong> där du både kan bocka av varor/uppgifter och lägga till nya direkt i ett kompakt widget-fönster:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => openFloatingPwaWidget('shopping')}
                    className="min-h-[44px] rounded-2xl bg-[#183D2C] text-white px-4 py-2.5 text-xs font-extrabold flex items-center justify-between hover:bg-[#0F291E] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-[#A6F2C6]" />
                      <span>Widget: Inköpslista</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#A6F2C6]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openFloatingPwaWidget('calendar')}
                    className="min-h-[44px] rounded-2xl bg-[#183D2C] text-white px-4 py-2.5 text-xs font-extrabold flex items-center justify-between hover:bg-[#0F291E] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-[#A6F2C6]" />
                      <span>Widget: Kalender</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#A6F2C6]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openFloatingPwaWidget('todo')}
                    className="min-h-[44px] rounded-2xl bg-[#183D2C] text-white px-4 py-2.5 text-xs font-extrabold flex items-center justify-between hover:bg-[#0F291E] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-[#A6F2C6]" />
                      <span>Widget: Att göra</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#A6F2C6]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openFloatingPwaWidget('all')}
                    className="min-h-[44px] rounded-2xl bg-[#E4F3EA] border border-[#CDE0D4] text-[#183D2C] px-4 py-2.5 text-xs font-extrabold flex items-center justify-between hover:bg-[#D8F3E3] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-[#183D2C]" />
                      <span>Samlad Multi-Widget (Alla 3)</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#183D2C]" />
                  </button>
                </div>

                <div className="rounded-2xl bg-[#E4F3EA] p-3.5 text-xs text-[#183D2C] space-y-1.5">
                  <div className="font-extrabold">Tips för PWA (hemmahosf.web.app) & Googlebook OS:</div>
                  <ul className="space-y-1 pl-1">
                    <li>
                      • <strong>Hemskärms-genvägar (PWA):</strong> Håll fingret intryckt (eller högerklicka på Googlebook OS) på den installerade <strong>Hem</strong>-ikonen → dra ut <em>Widget: Inköpslista</em>, <em>Widget: Kalender</em> eller <em>Widget: Att göra</em> som egna widgets på hemskärmen!
                    </li>
                    <li>
                      • <strong> Kortkommandon på Googlebook OS:</strong> Tryck <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold">Alt + 1..8</code> för att växla sida direkt eller <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold">Alt + W</code> för att öppna Widgets.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ios' && (
            <div className="rounded-3xl bg-white border border-[#DCEAE1] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-extrabold text-[#183D2C]">
                  <Apple className="h-4 w-4 shrink-0" />
                  <span>iOS & Android Scriptable Widgets (Realtid mot Molnet)</span>
                </div>
                <span className="rounded-full bg-[#D8F3E3] px-2.5 py-0.5 text-[10px] font-bold text-[#183D2C]">
                  Uppdaterad med live-synk
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#4E6357]">
                Nu är skripten kopplade direkt till er gemensamma databas i molnet (<strong>{getWorkspaceDocIdForMode('shopping')}</strong>) i Material 3 Expressive-stil! Perfekt både för iPhone (via gratisappen <strong>Scriptable</strong>) och för dig som kör webb-PWA:n:
              </p>
              <ol className="text-xs leading-relaxed text-[#4E6357] list-decimal pl-4 space-y-1">
                <li>Öppna <strong>Scriptable</strong> (gratis i App Store).</li>
                <li>Tryck på <strong>+</strong> och klistra in något av de 3 uppdaterade widget-skripten nedan.</li>
                <li>Lägg till en Scriptable-widget på hemskärmen och välj skriptet!</li>
              </ol>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {(
                  [
                    { id: 'shopping', label: 'Kopiera Inköps-widget' },
                    { id: 'calendar', label: 'Kopiera Kalender-widget' },
                    { id: 'todo', label: 'Kopiera Att göra-widget' },
                  ] as const
                ).map((wItem) => (
                  <button
                    key={wItem.id}
                    type="button"
                    onClick={() => handleCopy(wItem.id)}
                    className="min-h-[42px] rounded-2xl border border-[#CDE0D4] bg-[#F6FBF7] hover:bg-[#E4F3EA] px-3 py-2 text-xs font-extrabold text-[#183D2C] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedType === wItem.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#059669]" />
                        <span>Kopierad!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{wItem.label}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'wear' && (
            <div className="rounded-3xl bg-white border border-[#DCEAE1] p-4 space-y-3.5 font-['Roboto',sans-serif]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-extrabold text-[#183D2C]">
                  <Watch className="h-4 w-4 shrink-0" />
                  <span>Hem för Wear OS — Material 3 Expressive (Roboto)</span>
                </div>
                <span className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-2.5 py-0.5 text-[10px] font-bold">
                  Krona ▲▼ & M3 Expressive Tiles
                </span>
              </div>

              <p className="text-xs leading-relaxed text-[#4E6357]">
                Klockappen och alla <strong>5 äkta Wear OS Tiles (Paneler)</strong> har <strong>Material 3 Expressive</strong>-design med <strong>scrollning uppåt och nedåt med klockans krona</strong>, <strong>horisontell bläddring åt höger och vänster</strong> mellan sidorna, <strong>M3 Expressive-pilknappar (▲ / ▼)</strong> samt den kurvade <strong>Material 3 Expressive-bottenknappen</strong> för <em>+ Händelse</em> och <em>+ Lägg till</em>!
              </p>

              {/* 5 Color-Coded Material 3 Expressive Module Tiles Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { name: 'Kalender', bg: '#0B192C', titleCol: '#93C5FD', titleDark: '#0F172A', cardCol: '#2563EB', btnLabel: '+ Händelse' },
                  { name: 'Inköpslista', bg: '#271206', titleCol: '#FDBA74', titleDark: '#431407', cardCol: '#7C2D12', btnLabel: '+ Lägg till' },
                  { name: 'Att göra', bg: '#082216', titleCol: '#86EFAC', titleDark: '#064E3B', cardCol: '#14532D', btnLabel: '+ Uppgift' },
                  { name: 'Anteckningar', bg: '#231B05', titleCol: '#FEF08A', titleDark: '#422006', cardCol: '#713F12', btnLabel: '+ Anteckning' },
                  { name: 'Budget', bg: '#1B102E', titleCol: '#C4B5FD', titleDark: '#1E1B4B', cardCol: '#3B0764', btnLabel: '+ Utgift' },
                ].map((m) => (
                  <div
                    key={m.name}
                    style={{ backgroundColor: m.bg }}
                    className="rounded-[28px] p-2.5 flex flex-col items-center justify-between gap-1.5 text-center shadow-xs"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span
                        style={{ backgroundColor: m.titleCol, color: m.titleDark }}
                        className="rounded-full px-1.5 py-0.2 text-[8px] font-extrabold"
                      >
                        ▲
                      </span>
                      <span
                        style={{ color: m.titleCol }}
                        className="text-[9.5px] font-bold uppercase tracking-wider"
                      >
                        {m.name}
                      </span>
                      <span
                        style={{ backgroundColor: m.titleCol, color: m.titleDark }}
                        className="rounded-full px-1.5 py-0.2 text-[8px] font-extrabold"
                      >
                        ▼
                      </span>
                    </div>
                    <div className="w-full space-y-1">
                      <div
                        style={{ backgroundColor: m.cardCol }}
                        className="w-full h-3 rounded-full opacity-95"
                      />
                      <div
                        style={{ backgroundColor: m.cardCol }}
                        className="w-full h-3 rounded-full opacity-80"
                      />
                    </div>
                    <span
                      style={{ backgroundColor: m.titleCol, color: m.titleDark }}
                      className="w-4/5 rounded-t-[10px] rounded-b-[20px] py-1 text-[9px] font-extrabold shadow-xs"
                    >
                      {m.btnLabel}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="https://filipcarlberg91.github.io/hem-app/Hem-WearOS.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] rounded-full bg-[#183D2C] text-[#A6F2C6] px-4 py-2 text-xs font-extrabold flex items-center gap-2 hover:bg-[#0F291E] transition-colors"
                >
                  <Watch className="h-4 w-4" />
                  <span>Ladda ner Hem-WearOS.apk (5 sidor + 5 Tiles)</span>
                </a>
                <a
                  href="https://filipcarlberg91.github.io/hem-app/Hem-WearOS-Google-Play-Signed.aab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] rounded-full bg-[#E4F3EA] border border-[#CDE0D4] text-[#183D2C] px-4 py-2 text-xs font-extrabold flex items-center gap-2 hover:bg-[#D8F3E3] transition-colors"
                >
                  <Watch className="h-4 w-4" />
                  <span>Wear OS .aab (Play Console Klockspår)</span>
                </a>
                <button
                  type="button"
                  onClick={() => openFloatingPwaWidget('wear')}
                  className="min-h-[42px] rounded-full bg-[#E4F3EA] border border-[#CDE0D4] text-[#183D2C] px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#D8F3E3]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Testa interaktiv Klockvy (5 sidor + Krona)</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText('https://hemmahosf.web.app/#wear');
                      setCopiedType('pwa-url');
                      setTimeout(() => setCopiedType(null), 2000);
                    } catch {
                      // Ignore
                    }
                  }}
                  className="min-h-[42px] rounded-full bg-[#F6FBF7] border border-[#CDE0D4] text-[#183D2C] px-3.5 py-2 text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#E4F3EA]"
                >
                  {copiedType === 'pwa-url' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#059669]" />
                      <span>Länk kopierad!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Kopiera #wear-länk</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-2xl bg-[#E4F3EA] p-3.5 text-xs text-[#183D2C] space-y-2">
                <div className="font-extrabold">Så använder du klockappen & alla 5 Wear OS-Tiles:</div>
                <ol className="list-decimal pl-4 space-y-1.5 text-[#141E18]">
                  <li>
                    <strong>Scrolla uppåt & nedåt med kronan:</strong> Vrid på klockans fysiska krona för att mjukt scrolla uppåt och nedåt genom listorna i klockappen, och svep åt höger eller vänster för att byta mellan <em>Kalender</em>, <em>Inköpslista</em>, <em>Att göra</em>, <em>Anteckningar</em> och <em>Budget</em>.
                  </li>
                  <li>
                    <strong>Material 3 Expressive-knappar på alla 5 Tiles:</strong> Både pilknapparna (▲ / ▼) och lägg till-/händelseknappen längst ner på varje Tile har det uttrycksfulla Material 3 Expressive-designspråket med tonala pastellkontraster och kurvade pillerformer.
                  </li>
                  <li>
                    <strong>Kategorifärger & hela anteckningar:</strong> Kalenderkorten färgkodas efter respektive kalenderkategori, inköps- och uppgiftslistan har enhetliga rader med tom avbockningscirkel, och ett tryck på en anteckning öppnar hela anteckningstexten och checklistan!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#DCEAE1] bg-[#F6FBF7] flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-[#54685C]">
            Tips: Tryck <strong className="text-[#183D2C]">Alt + W</strong> på Googlebook OS för att öppna Widgets direkt
          </span>
          <button
            onClick={onClose}
            className="min-h-[42px] rounded-2xl bg-[#183D2C] px-6 py-2 text-xs font-bold text-white"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
