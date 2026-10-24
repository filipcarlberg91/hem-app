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
import { CalendarEvent, ShoppingItem, TodoItem, UserAccount } from '../types';
import { resolveModuleWorkspaceKey, sanitizeFirestoreId } from '../utils/cloudHouseholdSync';
import { getTodayDateString } from '../data/initialData';
import { classifySwedishGrocery } from '../utils/swedishGrocerySorter';

interface WidgetSetupModalProps {
  open: boolean;
  onClose: () => void;
  onForceUpdateAndroidWidgets: () => void;
  events: CalendarEvent[];
  shopping: ShoppingItem[];
  todos: TodoItem[];
  currentAccount?: UserAccount | null;
  onToggleShopping?: (id: string) => void;
  onAddShoppingItem?: (item: Omit<ShoppingItem, 'id' | 'addedAt'>) => void;
  onToggleTodo?: (id: string) => void;
  onOpenStandaloneWidgetMode?: (mode: 'shopping' | 'calendar' | 'todo' | 'all' | 'wear') => void;
}

export const WidgetSetupModal: React.FC<WidgetSetupModalProps> = ({
  open,
  onClose,
  onForceUpdateAndroidWidgets,
  events,
  shopping,
  todos,
  currentAccount,
  onToggleShopping,
  onAddShoppingItem,
  onToggleTodo,
  onOpenStandaloneWidgetMode,
}) => {
  const [copiedType, setCopiedType] = useState<'calendar' | 'shopping' | 'todo' | 'pwa-url' | null>(
    null
  );
  const [androidSynced, setAndroidSynced] = useState(false);
  const [quickShopInput, setQuickShopInput] = useState('');
  const [activeSection, setActiveSection] = useState<'m3-live' | 'pwa-chromeos' | 'ios' | 'wear'>(
    'm3-live'
  );

  if (!open) return null;

  const todayStr = getTodayDateString();
  const upcomingEvents = [...events]
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));

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
        ? 'Kalender'
        : mode === 'shopping'
        ? 'Inköpslista'
        : 'Att göra';
    const subtitle =
      mode === 'calendar'
        ? 'HEM · FAMILJEKALENDER'
        : mode === 'shopping'
        ? 'HEM · ATT HANDLA'
        : 'HEM · UPPGIFTER';

    return `// Hem — Material 3 Expressive Widget (${title})
// Öppna gratisappen "Scriptable" -> tryck "+" -> klistra in detta skript.
// Synkar i realtid mot ert gemensamma hushåll (${wsDocId})!
const MODE = "${mode}";
const WS_DOC_ID = "${wsDocId}";
const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/gen-lang-client-0269437912/databases/ai-studio-vardagsnavkalend-573f32e2-2ecd-4fec-bdc0-b78a7d1d127b/documents/workspaces/" + WS_DOC_ID;

const w = new ListWidget();
w.backgroundColor = new Color("#EEF7F2");
w.setPadding(13, 14, 13, 14);
w.url = "https://hemmahosf.web.app/#" + MODE;

// Material 3 Expressive Header
const header = w.addStack();
header.layoutHorizontally();
header.centerAlignContent();

const iconBox = header.addStack();
iconBox.backgroundColor = new Color("#183D2C");
iconBox.cornerRadius = 12;
iconBox.setPadding(6, 8, 6, 8);
const iconTxt = iconBox.addText(MODE === "calendar" ? "📅" : MODE === "shopping" ? "🛒" : "✓");
iconTxt.font = Font.boldSystemFont(13);
iconTxt.textColor = new Color("#A6F2C6");

header.addSpacer(8);

const titleCol = header.addStack();
titleCol.layoutVertically();
const subTxt = titleCol.addText("${subtitle}");
subTxt.font = Font.boldSystemFont(9);
subTxt.textColor = new Color("#4A6355");
const mainTxt = titleCol.addText("${title}");
mainTxt.font = Font.heavySystemFont(16);
mainTxt.textColor = new Color("#14291E");

header.addSpacer();

const badgeStack = header.addStack();
badgeStack.backgroundColor = new Color("#183D2C");
badgeStack.cornerRadius = 14;
badgeStack.setPadding(4, 10, 4, 10);

let items = [];
let badgeCountText = "0";
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
    badgeCountText = allUpcoming.length + " st";
    emptyMsg = "Inga kommande händelser";
    items = allUpcoming.slice(0, 4).map(e => ({
      pill: (e.date === today ? "Idag " : e.date.slice(5) + " ") + (e.startTime || ""),
      title: e.title || "",
      meta: ""
    }));
  } else if (MODE === "shopping") {
    const unchecked = (data.shopping || []).filter(s => !s.checked);
    badgeCountText = unchecked.length + " kvar";
    emptyMsg = "Inköpslistan är tom";
    items = unchecked.slice(0, 4).map(s => ({
      pill: "○",
      title: s.name || "",
      meta: (s.amount || 1) + " " + (s.unit || "st")
    }));
  } else {
    const open = (data.todos || []).filter(t => !t.completed);
    badgeCountText = open.length + " kvar";
    emptyMsg = "Alla uppgifter är avklarade!";
    items = open.slice(0, 4).map(t => ({
      pill: "▢",
      title: t.title || "",
      meta: t.dueDate ? t.dueDate.slice(5) : ""
    }));
  }
} catch (e) {
  badgeCountText = "Synk";
  emptyMsg = "Tryck för att öppna Hem";
}

const badgeTxt = badgeStack.addText(badgeCountText);
badgeTxt.font = Font.boldSystemFont(11);
badgeTxt.textColor = new Color("#A6F2C6");

w.addSpacer(8);

if (items.length === 0) {
  const emptyCard = w.addStack();
  emptyCard.layoutVertically();
  emptyCard.backgroundColor = new Color("#FFFFFF");
  emptyCard.cornerRadius = 18;
  emptyCard.setPadding(14, 14, 14, 14);
  const t = emptyCard.addText("✓  " + emptyMsg);
  t.font = Font.boldSystemFont(12);
  t.textColor = new Color("#183D2C");
} else {
  for (const it of items) {
    const row = w.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    row.backgroundColor = new Color("#FFFFFF");
    row.cornerRadius = 13;
    row.setPadding(6, 9, 6, 9);

    const pill = row.addStack();
    pill.backgroundColor = new Color("#D8F3E3");
    pill.cornerRadius = 8;
    pill.setPadding(2, 6, 2, 6);
    const pt = pill.addText(it.pill);
    pt.font = Font.boldSystemFont(10);
    pt.textColor = new Color("#183D2C");

    row.addSpacer(7);

    const tt = row.addText(it.title);
    tt.font = Font.boldSystemFont(12);
    tt.textColor = new Color("#141E18");
    tt.lineLimit = 1;

    row.addSpacer();

    if (it.meta) {
      const metaPill = row.addStack();
      metaPill.backgroundColor = new Color("#183D2C");
      metaPill.cornerRadius = 8;
      metaPill.setPadding(2, 6, 2, 6);
      const mt = metaPill.addText(it.meta);
      mt.font = Font.boldSystemFont(10);
      mt.textColor = new Color("#A6F2C6");
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
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] bg-[#F6FBF7] border border-[#CDE0D4] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#DCEAE1] bg-[#F6FBF7] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-[#183D2C] text-[#A6F2C6] shadow-xs">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-[#141E18]">
                  Material 3 Expressive Widgets & Wear OS
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#D8F3E3] px-2.5 py-0.5 text-[10px] font-extrabold text-[#183D2C]">
                  <Sparkles className="h-3 w-3" /> M3 Expressive
                </span>
              </div>
              <p className="text-xs text-[#54685C]">
                Inköpslista, Kalender & Att göra — Android, PWA (hemmahosf.web.app), Googlebook OS & Wear OS
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

        {/* Expressive Section Switcher */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-[#F6FBF7] border-b border-[#DCEAE1] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {(
            [
              { id: 'm3-live', label: 'M3 Widgets (Live)', icon: Sparkles },
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
                    ? 'bg-[#183D2C] text-[#A6F2C6] shadow-xs'
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
              {/* Live Interactive M3 Expressive Preview Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#54685C]">
                    Interaktiva Material 3 Expressive Widgets (Live)
                  </span>
                  <button
                    type="button"
                    onClick={() => openFloatingPwaWidget('all')}
                    className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-3 py-1 text-[11px] font-extrabold flex items-center gap-1.5 hover:bg-[#0F291E] transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Öppna alla 3 som flytande widget</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* 1. INKÖPSLISTA WIDGET (M3 Expressive - Scrollbar + Lägg till + Bocka av) */}
                  <div className="rounded-[28px] bg-[#EEF7F2] border-2 border-[#C3DFCF] p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[#183D2C] text-[#A6F2C6] shadow-2xs">
                            <ShoppingCart className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#4A6355]">
                              HEM · ATT HANDLA
                            </div>
                            <div className="text-[15px] font-extrabold text-[#14291E] truncate">
                              Inköpslista
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-2.5 py-1 text-[11px] font-extrabold font-mono tabular-nums shrink-0">
                          {uncheckedShopping.length} kvar
                        </span>
                      </div>

                      {/* Quick-add form directly inside the Shopping List widget */}
                      {onAddShoppingItem && (
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
                          }}
                          className="mt-2.5 flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={quickShopInput}
                            onChange={(e) => setQuickShopInput(e.target.value)}
                            placeholder="+ Lägg till vara..."
                            className="flex-1 min-w-0 h-8 rounded-xl bg-white border border-[#C3DFCF] px-2.5 text-xs font-bold text-[#141E18] placeholder:text-[#54685C] outline-none focus:border-[#183D2C]"
                          />
                          <button
                            type="submit"
                            className="h-8 w-8 shrink-0 rounded-xl bg-[#183D2C] text-[#A6F2C6] flex items-center justify-center hover:bg-[#0F291E] transition-colors"
                            title="Lägg till i inköpslistan"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </form>
                      )}

                      <div className="mt-2.5 max-h-[190px] overflow-y-auto pr-0.5 space-y-1.5 min-h-[144px] flex flex-col">
                        {uncheckedShopping.length === 0 ? (
                          <div className="rounded-[22px] bg-white border border-[#D2E7DA] p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[136px] my-auto">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#183D2C] text-[#A6F2C6] text-xs font-extrabold">
                              ✓
                            </span>
                            <div className="text-xs font-extrabold text-[#183D2C]">
                              Inköpslistan är tom
                            </div>
                            <div className="text-[10px] text-[#54685C]">
                              Skriv ovan för att lägga till varor
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {uncheckedShopping.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onToggleShopping && onToggleShopping(item.id)}
                                className="w-full text-left flex items-center justify-between gap-2 rounded-2xl bg-white hover:bg-[#F5FBF7] border border-[#D5E8DC] px-2.5 py-2 text-xs font-extrabold text-[#141E18] transition-all shadow-2xs"
                                title="Klicka för att bocka av direkt i widgeten"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[#D8F3E3] text-[#183D2C] text-[11px] font-extrabold">
                                    ○
                                  </span>
                                  <span className="truncate">{item.name}</span>
                                </span>
                                <span className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-2 py-0.5 text-[10px] font-extrabold shrink-0">
                                  {item.amount} {item.unit}
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
                      className="mt-3 w-full min-h-[34px] rounded-2xl bg-white hover:bg-[#D8F3E3] border border-[#C3DFCF] px-3 py-1.5 text-[11px] font-extrabold text-[#183D2C] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Poppa ut Inköps-widget</span>
                    </button>
                  </div>

                  {/* 2. KALENDER WIDGET (M3 Expressive - 2 veckor framåt, kategorifärg, datum/tid överst) */}
                  <div className="rounded-[28px] bg-[#EEF7F2] border-2 border-[#C3DFCF] p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[#183D2C] text-[#A6F2C6] shadow-2xs">
                            <CalendarIcon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#4A6355]">
                              HEM · 14 DAGAR FRAMÅT
                            </div>
                            <div className="text-[15px] font-extrabold text-[#14291E] truncate">
                              Kalender
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-2.5 py-1 text-[11px] font-extrabold font-mono tabular-nums shrink-0">
                          {upcomingEvents.length} st
                        </span>
                      </div>

                      <div className="mt-3 max-h-[235px] overflow-y-auto pr-0.5 space-y-2 min-h-[144px] flex flex-col">
                        {upcomingEvents.length === 0 ? (
                          <div className="rounded-[22px] bg-white border border-[#D2E7DA] p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[136px] my-auto">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#183D2C] text-[#A6F2C6] text-xs font-extrabold">
                              📅
                            </span>
                            <div className="text-xs font-extrabold text-[#183D2C]">
                              Inga händelser närmaste 2 veckorna
                            </div>
                            <div className="text-[10px] text-[#54685C]">
                              Tryck för att öppna kalendern
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {upcomingEvents.map((evt) => {
                              const catColor = getEventCategoryColor(evt);
                              const timeRange = evt.endTime
                                ? `${evt.startTime}–${evt.endTime}`
                                : evt.startTime;
                              return (
                                <div
                                  key={evt.id}
                                  style={{ backgroundColor: catColor }}
                                  className="flex flex-col rounded-[18px] px-3.5 py-2.5 text-white shadow-xs"
                                >
                                  <span className="text-[11px] font-mono font-extrabold tracking-wide text-white/90">
                                    {evt.date === todayStr ? 'Idag' : evt.date.slice(5)} · {timeRange}
                                  </span>
                                  <span className="mt-0.5 text-[13.5px] font-extrabold leading-snug truncate">
                                    {evt.title}
                                  </span>
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
                      className="mt-3 w-full min-h-[34px] rounded-2xl bg-white hover:bg-[#D8F3E3] border border-[#C3DFCF] px-3 py-1.5 text-[11px] font-extrabold text-[#183D2C] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Poppa ut Kalender-widget</span>
                    </button>
                  </div>

                  {/* 3. ATT GÖRA WIDGET (M3 Expressive - Scrollbar + Bocka av) */}
                  <div className="rounded-[28px] bg-[#EEF7F2] border-2 border-[#C3DFCF] p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[#183D2C] text-[#A6F2C6] shadow-2xs">
                            <CheckSquare className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#4A6355]">
                              HEM · UPPGIFTER
                            </div>
                            <div className="text-[15px] font-extrabold text-[#14291E] truncate">
                              Att göra
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-2.5 py-1 text-[11px] font-extrabold font-mono tabular-nums shrink-0">
                          {openTodos.length} kvar
                        </span>
                      </div>

                      <div className="mt-3 max-h-[225px] overflow-y-auto pr-0.5 space-y-1.5 min-h-[144px] flex flex-col">
                        {openTodos.length === 0 ? (
                          <div className="rounded-[22px] bg-white border border-[#D2E7DA] p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[136px] my-auto">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#183D2C] text-[#A6F2C6] text-xs font-extrabold">
                              ✓
                            </span>
                            <div className="text-xs font-extrabold text-[#183D2C]">
                              Alla uppgifter är avklarade!
                            </div>
                            <div className="text-[10px] text-[#54685C]">
                              Tryck här för att lägga till ny uppgift
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {openTodos.map((todo) => (
                              <button
                                key={todo.id}
                                type="button"
                                onClick={() => onToggleTodo && onToggleTodo(todo.id)}
                                className="w-full text-left flex items-center justify-between gap-2 rounded-2xl bg-white hover:bg-[#F5FBF7] border border-[#D5E8DC] px-2.5 py-2 text-xs font-extrabold text-[#141E18] transition-all shadow-2xs"
                                title="Klicka för att klarmarkera direkt i widgeten"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[#D8F3E3] text-[#183D2C] text-[11px] font-extrabold">
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
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openFloatingPwaWidget('todo')}
                      className="mt-3 w-full min-h-[34px] rounded-2xl bg-white hover:bg-[#D8F3E3] border border-[#C3DFCF] px-3 py-1.5 text-[11px] font-extrabold text-[#183D2C] flex items-center justify-center gap-1.5 transition-colors"
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
                    <span>Android Hemskärms-widgets (Scrollbara + Interaktiva)</span>
                  </div>
                  <span className="rounded-full bg-[#D8F3E3] px-2.5 py-0.5 text-[10px] font-bold text-[#183D2C]">
                    ListView-scroll + Snabbtillägg
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#4E6357]">
                  Alla 3 Android-widgets (<strong>Inköpslista</strong>, <strong>Kalender</strong> och <strong>Att göra</strong>) är nu <strong>helt scrollbara</strong> direkt på hemskärmen! I <strong>Inköpslista-widgeten</strong> kan du dessutom trycka på <strong>○</strong> för att bocka av en vara direkt på hemskärmen, eller trycka på <strong>+</strong> uppe i hörnet för att lägga till nya varor via en snabb-popup utan att öppna hela appen.
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
            <div className="rounded-3xl bg-white border border-[#DCEAE1] p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-extrabold text-[#183D2C]">
                  <Watch className="h-4 w-4 shrink-0" />
                  <span>Hem för Wear OS (Äkta Tiles & Klockapp)</span>
                </div>
                <span className="rounded-full bg-[#183D2C] text-[#A6F2C6] px-2.5 py-0.5 text-[10px] font-bold">
                  3 Äkta Wear OS Tiles
                </span>
              </div>

              <p className="text-xs leading-relaxed text-[#4E6357]">
                Nu finns en <strong>riktig inbyggd Wear OS-klockapp och 3 äkta Wear OS Tiles (Paneler)</strong> (<em>Hem – Inköpslista</em>, <em>Hem – Kalender</em> och <em>Hem – Att göra</em>)! Bocka av varor direkt på din Tile på urtavlan eller lägg till varor med rösten på handleden.
              </p>

              <div className="flex flex-wrap gap-2">
                <a
                  href="https://filipcarlberg91.github.io/hem-app/Hem-WearOS.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] rounded-2xl bg-[#183D2C] text-[#A6F2C6] px-4 py-2 text-xs font-extrabold flex items-center gap-2 hover:bg-[#0F291E] transition-colors"
                >
                  <Watch className="h-4 w-4" />
                  <span>Ladda ner Hem-WearOS.apk (Klockapp + Tiles)</span>
                </a>
                <a
                  href="https://filipcarlberg91.github.io/hem-app/Hem-WearOS-Google-Play-Signed.aab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] rounded-2xl bg-[#E4F3EA] border border-[#CDE0D4] text-[#183D2C] px-4 py-2 text-xs font-extrabold flex items-center gap-2 hover:bg-[#D8F3E3] transition-colors"
                >
                  <Watch className="h-4 w-4" />
                  <span>Wear OS .aab (Play Console Klockspår)</span>
                </a>
                <a
                  href="/play-store/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] rounded-2xl bg-[#E4F3EA] border border-[#CDE0D4] text-[#183D2C] px-4 py-2 text-xs font-extrabold flex items-center gap-2 hover:bg-[#D8F3E3] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Skärmbilder för Klocka (Play Console)</span>
                </a>
                <button
                  type="button"
                  onClick={() => openFloatingPwaWidget('wear')}
                  className="min-h-[42px] rounded-2xl bg-[#E4F3EA] border border-[#CDE0D4] text-[#183D2C] px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#D8F3E3]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Förhandsgranska Klockvy</span>
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
                  className="min-h-[42px] rounded-2xl bg-[#F6FBF7] border border-[#CDE0D4] text-[#183D2C] px-3.5 py-2 text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#E4F3EA]"
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
                <div className="font-extrabold">Så installerar du äkta Wear OS-Tiles på din klocka:</div>
                <ol className="list-decimal pl-4 space-y-1.5 text-[#141E18]">
                  <li>
                    <strong>Ladda ner APK på telefonen:</strong> Tryck på <strong>Ladda ner Hem-WearOS.apk</strong> ovan så sparas klock-APK:n på din telefon.
                  </li>
                  <li>
                    <strong>Skicka till klockan (1 minut):</strong> Öppna gratisappen <strong>Wear Installer 2</strong> eller <strong>GeminiMan Wear OS Manager</strong> (finns i Google Play på telefonen), välj <code className="bg-white px-1 rounded">Hem-WearOS.apk</code> och tryck <em>Install</em> till klockan över Wi-Fi.
                  </li>
                  <li>
                    <strong>Lägg till din Tile på urtavlan:</strong> Svep åt sidan på klockans urtavla till <strong>+ Lägg till panel (Add tile)</strong> → välj <strong>Hem – Inköpslista</strong>, <strong>Hem – Kalender</strong> eller <strong>Hem – Att göra</strong>!
                  </li>
                  <li>
                    <strong>Bocka av & röstinmatning:</strong> Tryck direkt på en vara i Tilen för att bocka av den direkt på urtavlan, eller tryck på <strong>+ Ny</strong> i Tilen för att säga en vara med rösten!
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
