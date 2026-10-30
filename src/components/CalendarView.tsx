import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Tags,
  Bell,
  Trash2,
  Edit3,
  RefreshCw,
  X,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { CalendarEvent, EventCategory, UserAccount } from '../types';
import { getTodayDateString } from '../data/initialData';

interface CalendarViewProps {
  events: CalendarEvent[];
  categories: EventCategory[];
  currentAccount?: UserAccount | null;
  onAddEvent: (evt: Omit<CalendarEvent, 'id' | 'updatedAt'>) => void;
  onUpdateEvent: (evt: CalendarEvent) => void;
  onDeleteEvent: (evt: CalendarEvent) => void;
  onUpdateCategoryColor: (
    categoryId: string,
    colorHex: string,
    bgHex: string,
    textHex: string
  ) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  onAddCategory?: (
    name: string,
    colorHex: string,
    bgHex: string,
    textHex: string
  ) => void;
  isGoogleConnected: boolean;
  onSyncGoogleCalendar: () => void;
  isSyncing: boolean;
}

const EXPRESSIVE_COLOR_PRESETS = [
  { name: 'Klarblå', colorHex: '#0066FF', bgHex: '#DBEAFE', textHex: '#1E3A8A' },
  { name: 'Smaragdgrön', colorHex: '#059669', bgHex: '#D1FAE5', textHex: '#064E3B' },
  { name: 'Mandarinorange', colorHex: '#EA580C', bgHex: '#FFEDD5', textHex: '#7C2D12' },
  { name: 'Ametistlila', colorHex: '#7C3AED', bgHex: '#EDE9FE', textHex: '#4C1D95' },
  { name: 'Hallonröd', colorHex: '#E11D48', bgHex: '#FFE4E6', textHex: '#881337' },
  { name: 'Solgul', colorHex: '#D97706', bgHex: '#FEF3C7', textHex: '#78350F' },
  { name: 'Turkos', colorHex: '#0891B2', bgHex: '#CFFAFE', textHex: '#164E63' },
  { name: 'Rosa & Cerise', colorHex: '#DB2777', bgHex: '#FCE7F3', textHex: '#831843' },
  { name: 'Limegrön', colorHex: '#65A30D', bgHex: '#ECFCCB', textHex: '#365314' },
  { name: 'Indigoblå', colorHex: '#4F46E5', bgHex: '#E0E7FF', textHex: '#312E81' },
];

// ISO-8601 Swedish week number calculation
export function getISOWeekNumber(dateInput: string | Date): number {
  const d =
    typeof dateInput === 'string'
      ? new Date(`${dateInput}T12:00:00`)
      : new Date(dateInput.getTime());
  d.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  );
}

function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekDatesForDate(dateStr: string): string[] {
  const base = new Date(`${dateStr}T12:00:00`);
  const dayOfWeek = (base.getDay() + 6) % 7; // 0 = Monday ... 6 = Sunday
  const monday = new Date(base);
  monday.setDate(base.getDate() - dayOfWeek);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    days.push(formatDateYMD(cur));
  }
  return days;
}

function addOneHourToTime(timeStr: string): string {
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return '11:00';
  }
  const nextHour = (parts[0] + 1) % 24;
  return `${String(nextHour).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`;
}

function formatReminderLabel(minutes: number): string {
  if (minutes === 0) return 'Notis vid starttid';
  if (minutes === 60) return 'Notis 1 timme före start';
  if (minutes === 120) return 'Notis 2 timmar före start';
  if (minutes === 1440) return 'Notis 1 dag före';
  return `Notis ${minutes} min före start`;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  categories,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onUpdateCategoryColor,
  onRenameCategory,
  onAddCategory,
  isGoogleConnected,
  onSyncGoogleCalendar,
  isSyncing,
}) => {
  const todayStr = getTodayDateString();
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [showColorModal, setShowColorModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [weekCategoryFilter, setWeekCategoryFilter] = useState<string>('all');

  // Event form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'arbete');
  const [customColorHex, setCustomColorHex] = useState<string>('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  // -1 represents "Ingen påminnelse" (default when creating a new event)
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(-1);

  // Touch swipe & long-press refs
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openCreateModal = (initialDate = selectedDate, initialCatId?: string) => {
    setEditingEvent(null);
    setTitle('');
    setDate(initialDate);
    setIsAllDay(false);
    setStartTime('10:00');
    setEndTime('11:00');
    setCategoryId(initialCatId || categories[0]?.id || 'arbete');
    setCustomColorHex('');
    setLocation('');
    setDescription('');
    setReminderMinutesBefore(-1);
    setShowEventModal(true);
  };

  const openEditModal = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setDate(evt.date);
    setIsAllDay(Boolean(evt.isAllDay));
    setStartTime(evt.isAllDay ? '10:00' : evt.startTime || '10:00');
    setEndTime(evt.isAllDay ? '11:00' : evt.endTime || '11:00');
    setCategoryId(evt.categoryId);
    setCustomColorHex(evt.customColorHex || '');
    setLocation(evt.location || '');
    setDescription(evt.description || '');
    setReminderMinutesBefore(
      evt.reminderMinutesBefore !== undefined && evt.reminderMinutesBefore >= 0
        ? evt.reminderMinutesBefore
        : -1
    );
    setShowEventModal(true);
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    setEndTime(addOneHourToTime(newStart));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalStartTime = isAllDay ? '00:00' : startTime;
    const finalEndTime = isAllDay ? '23:59' : endTime;
    const finalReminder =
      reminderMinutesBefore >= 0 ? reminderMinutesBefore : undefined;

    if (editingEvent) {
      onUpdateEvent({
        ...editingEvent,
        title: title.trim(),
        date,
        isAllDay,
        startTime: finalStartTime,
        endTime: finalEndTime,
        categoryId,
        customColorHex: customColorHex || undefined,
        location: location.trim(),
        description: description.trim(),
        reminderMinutesBefore: finalReminder,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddEvent({
        title: title.trim(),
        date,
        isAllDay,
        startTime: finalStartTime,
        endTime: finalEndTime,
        categoryId,
        customColorHex: customColorHex || undefined,
        location: location.trim(),
        description: description.trim(),
        reminderMinutesBefore: finalReminder,
      });
    }
    setShowEventModal(false);
  };

  // Build calendar month days (Monday-Sunday Swedish standard) grouped into week rows
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Måndag
  const totalDays = lastDayOfMonth.getDate();

  const calendarCells: (string | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push(dateStr);
  }
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const monthWeeks: { weekNumber: number; days: (string | null)[]; firstValidDate: string }[] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    const slice = calendarCells.slice(i, i + 7);
    const firstValid = slice.find((c) => c !== null) || todayStr;
    monthWeeks.push({
      weekNumber: getISOWeekNumber(firstValid),
      days: slice,
      firstValidDate: firstValid,
    });
  }

  // Week view dates based on selectedDate
  const activeWeekDates = getWeekDatesForDate(selectedDate);
  const activeWeekNumber = getISOWeekNumber(activeWeekDates[0]);

  const shiftSelectedWeek = (deltaDays: number) => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + deltaDays);
    const nextStr = formatDateYMD(d);
    setSelectedDate(nextStr);
    setCurrentMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // Swipe handlers for Month View (change month) and Week View (change week)
  const handleCalendarTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    swipeStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleCalendarTouchMove = (e: React.TouchEvent) => {
    if (!swipeStartRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - swipeStartRef.current.x;
    const dy = e.touches[0].clientY - swipeStartRef.current.y;
    if (Math.hypot(dx, dy) > 10) {
      clearLongPressTimer();
    }
  };

  const handleCalendarTouchEnd = (e: React.TouchEvent) => {
    if (!swipeStartRef.current || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - swipeStartRef.current.x;
    const dy = e.changedTouches[0].clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;

    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      clearLongPressTimer();
      if (viewMode === 'month') {
        if (dx < 0) {
          setCurrentMonthDate(new Date(year, month + 1, 1));
        } else {
          setCurrentMonthDate(new Date(year, month - 1, 1));
        }
      } else {
        if (dx < 0) {
          shiftSelectedWeek(7);
        } else {
          shiftSelectedWeek(-7);
        }
      }
    }
  };

  // Long-press handlers for date cells (hold date -> open create event modal)
  const handleCellPointerDown = (cellDate: string, e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    longPressTriggeredRef.current = false;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(15);
        } catch {
          // Ignore
        }
      }
      setSelectedDate(cellDate);
      openCreateModal(cellDate);
    }, 450);
  };

  const handleCellPointerMove = (e: React.PointerEvent) => {
    if (!pointerStartPosRef.current) return;
    const dist = Math.hypot(
      e.clientX - pointerStartPosRef.current.x,
      e.clientY - pointerStartPosRef.current.y
    );
    if (dist > 10) {
      clearLongPressTimer();
    }
  };

  const handleCellPointerUpOrCancel = () => {
    clearLongPressTimer();
    pointerStartPosRef.current = null;
  };

  const handleCellClick = (cellDate: string) => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    setSelectedDate(cellDate);
  };

  const sortDayEvents = (a: CalendarEvent, b: CalendarEvent) => {
    if (Boolean(a.isAllDay) !== Boolean(b.isAllDay)) {
      return a.isAllDay ? -1 : 1;
    }
    return a.startTime.localeCompare(b.startTime);
  };

  const selectedDateEvents = events
    .filter((e) => e.date === selectedDate)
    .sort(sortDayEvents);

  const selectedDateFormatted = new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
    'sv-SE',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }
  );

  const monthLabel = currentMonthDate.toLocaleDateString('sv-SE', {
    month: 'long',
    year: 'numeric',
  });

  const firstWeekOfMonth = monthWeeks[0]?.weekNumber ?? 1;
  const lastWeekOfMonth = monthWeeks[monthWeeks.length - 1]?.weekNumber ?? 52;

  // Week events count for category filter pills
  const weekEventsAll = events.filter((e) => activeWeekDates.includes(e.date));
  const getWeekCategoryCount = (catId: string) =>
    weekEventsAll.filter((e) => e.categoryId === catId).length;

  const SWEDISH_WEEKDAYS_SHORT = ['MÅN', 'TIS', 'ONS', 'TOR', 'FRE', 'LÖR', 'SÖN'];
  const SWEDISH_WEEKDAYS_FULL = [
    'Måndag',
    'Tisdag',
    'Onsdag',
    'Torsdag',
    'Fredag',
    'Lördag',
    'Söndag',
  ];

  return (
    <div className="space-y-5">
      {/* Top Calendar Header, 2-Column Controls & Category Color Legend */}
      <div className="rounded-3xl bg-white border border-[#D8E6DD] p-4 sm:p-5 shadow-2xs space-y-3.5">
        {/* Title & Week Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold capitalize text-[#183D2C] tracking-tight">
            {viewMode === 'month' ? monthLabel : `Vecka ${activeWeekNumber} · ${monthLabel}`}
          </h1>
          <span className="rounded-xl bg-[#D8F3E3] px-2.5 py-1 text-xs font-extrabold font-mono tabular-nums text-[#183D2C]">
            {viewMode === 'month'
              ? `v.${firstWeekOfMonth} – v.${lastWeekOfMonth}`
              : `${activeWeekDates[0].slice(5)} – ${activeWeekDates[6].slice(5)}`}
          </span>
        </div>

        {/* Controls in Two Columns (No Horizontal Scroll) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Column 1, Row 1: Segmented View Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#EBF3EE] rounded-2xl">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`min-h-[36px] px-2 py-1 text-xs font-extrabold rounded-xl transition-colors ${
                viewMode === 'month'
                  ? 'bg-[#183D2C] text-white shadow-2xs'
                  : 'text-[#38493F] hover:text-[#141E18]'
              }`}
            >
              Månad
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`min-h-[36px] px-2 py-1 text-xs font-extrabold rounded-xl transition-colors ${
                viewMode === 'week'
                  ? 'bg-[#183D2C] text-white shadow-2xs'
                  : 'text-[#38493F] hover:text-[#141E18]'
              }`}
            >
              Vecka
            </button>
          </div>

          {/* Column 2, Row 1: Prev / Today / Next Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'month') {
                  setCurrentMonthDate(new Date(year, month - 1, 1));
                } else {
                  shiftSelectedWeek(-7);
                }
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#CDE0D4] bg-white text-[#183D2C] hover:bg-[#E7F3EC]"
              aria-label="Föregående"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentMonthDate(new Date());
                setSelectedDate(todayStr);
              }}
              className="h-10 flex-1 rounded-2xl border border-[#CDE0D4] bg-white px-2 text-xs font-extrabold text-[#183D2C] hover:bg-[#E7F3EC]"
            >
              Idag
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'month') {
                  setCurrentMonthDate(new Date(year, month + 1, 1));
                } else {
                  shiftSelectedWeek(7);
                }
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#CDE0D4] bg-white text-[#183D2C] hover:bg-[#E7F3EC]"
              aria-label="Nästa"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Column 1, Row 2: Categories Button (+ Google Sync if connected) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowColorModal(true)}
              className="h-10 flex-1 rounded-2xl bg-[#E7F3EC] px-3 text-xs font-extrabold text-[#183D2C] hover:bg-[#D8F3E3] flex items-center justify-center gap-1.5"
              title="Anpassa kalenderkategorier & färger"
            >
              <Tags className="h-4 w-4 shrink-0 text-[#183D2C]" />
              <span className="truncate">Kategorier</span>
            </button>

            {isGoogleConnected && (
              <button
                type="button"
                onClick={onSyncGoogleCalendar}
                disabled={isSyncing}
                className="h-10 w-10 shrink-0 rounded-2xl border border-[#CDE0D4] bg-white text-[#183D2C] hover:bg-[#E7F3EC] flex items-center justify-center"
                title="Synka nu"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {/* Column 2, Row 2: New Event Button */}
          <button
            type="button"
            onClick={() => openCreateModal(selectedDate)}
            className="h-10 w-full rounded-2xl bg-[#183D2C] px-3 text-xs font-extrabold text-[#A6F2C6] hover:bg-[#0F291E] flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="truncate">Ny händelse</span>
          </button>
        </div>

        {/* Calendar Categories Color Overview directly below the buttons */}
        <div className="pt-2.5 border-t border-[#E6F0EA] flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl bg-[#EBF5EE] px-3 py-1.5 text-xs font-extrabold text-[#141E18] flex items-center gap-2"
            >
              <span
                className="h-3 w-3 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: cat.colorHex }}
              />
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================================
          VIEW MODE 1: MÅNADSVY (FÖRSLAG 5: FULLTEXT-MÅNADSMATRIS MED TEXTREMSOR)
         ===================================================================== */}
      {viewMode === 'month' ? (
        <div className="space-y-5">
          {/* Full-Text Month Matrix Container */}
          <div
            onTouchStart={handleCalendarTouchStart}
            onTouchMove={handleCalendarTouchMove}
            onTouchEnd={handleCalendarTouchEnd}
            className="rounded-3xl bg-white border border-[#D5E5DC] overflow-hidden shadow-2xs select-none"
          >
            {/* Column Headers: V. | MÅN | TIS | ONS | TOR | FRE | LÖR | SÖN */}
            <div className="grid grid-cols-[36px_repeat(7,minmax(0,1fr))] sm:grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b border-[#E2EFE7] bg-[#F8FCF9]">
              <div className="py-2.5 text-center text-[11px] font-extrabold text-[#6A7F72] border-r border-[#E2EFE7]">
                V.
              </div>
              {SWEDISH_WEEKDAYS_SHORT.map((d, idx) => (
                <div
                  key={d}
                  className={`py-2.5 text-center text-[11px] sm:text-xs font-extrabold ${
                    idx === 6 ? 'text-[#9E2A2B]' : 'text-[#54685C]'
                  } ${idx < 6 ? 'border-r border-[#E2EFE7]' : ''}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Month Matrix Week Rows */}
            <div className="divide-y divide-[#E2EFE7]">
              {monthWeeks.map((weekRow, wIdx) => {
                const isActiveWeek = weekRow.days.includes(selectedDate);
                return (
                  <div
                    key={`week-${wIdx}-${weekRow.weekNumber}`}
                    className="grid grid-cols-[36px_repeat(7,minmax(0,1fr))] sm:grid-cols-[48px_repeat(7,minmax(0,1fr))]"
                  >
                    {/* Left Week Number Column (Click to jump to Week View) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(weekRow.firstValidDate);
                        setViewMode('week');
                      }}
                      className="border-r border-[#E2EFE7] flex flex-col items-center justify-center py-2 hover:bg-[#EAF5EE] transition-colors group"
                      title={`Öppna vecka ${weekRow.weekNumber} i veckovyn`}
                    >
                      <span
                        className={`px-1.5 py-1 rounded-xl text-[11px] sm:text-xs font-extrabold font-mono tabular-nums transition-colors ${
                          isActiveWeek
                            ? 'bg-[#183D2C] text-[#A6F2C6]'
                            : 'text-[#6A7F72] group-hover:bg-[#D8F3E3] group-hover:text-[#183D2C]'
                        }`}
                      >
                        {weekRow.weekNumber}
                      </span>
                    </button>

                    {/* 7 Date Cells with Horizontal Event Text Ribbons */}
                    {weekRow.days.map((cellDate, dIdx) => {
                      const isSunday = dIdx === 6;

                      if (!cellDate) {
                        return (
                          <div
                            key={`empty-${wIdx}-${dIdx}`}
                            className={`min-h-[96px] sm:min-h-[124px] bg-[#F9FCFA]/70 ${
                              dIdx < 6 ? 'border-r border-[#E2EFE7]' : ''
                            }`}
                          />
                        );
                      }

                      const dayNum = Number(cellDate.slice(8, 10));
                      const dayEvents = events
                        .filter((e) => e.date === cellDate)
                        .sort(sortDayEvents);
                      const isSelected = cellDate === selectedDate;
                      const isToday = cellDate === todayStr;

                      return (
                        <div
                          key={cellDate}
                          onClick={() => handleCellClick(cellDate)}
                          onPointerDown={(e) => handleCellPointerDown(cellDate, e)}
                          onPointerMove={handleCellPointerMove}
                          onPointerUp={handleCellPointerUpOrCancel}
                          onPointerLeave={handleCellPointerUpOrCancel}
                          onPointerCancel={handleCellPointerUpOrCancel}
                          onContextMenu={(e) => e.preventDefault()}
                          title="Tryck för att visa dagen · Håll inne för att skapa ny händelse"
                          className={`min-h-[96px] sm:min-h-[124px] p-1 sm:p-1.5 flex flex-col justify-between cursor-pointer transition-colors relative ${
                            dIdx < 6 ? 'border-r border-[#E2EFE7]' : ''
                          } ${
                            isSelected
                              ? 'bg-[#F0FAF4] ring-2 ring-inset ring-[#183D2C] z-10'
                              : isToday
                              ? 'bg-[#F4FBF7]'
                              : 'bg-white hover:bg-[#F7FCF9]'
                          }`}
                        >
                          {/* Top of Cell: Date Number */}
                          <div className="flex items-center justify-between px-0.5">
                            <span
                              className={`inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-extrabold font-mono tabular-nums ${
                                isSelected
                                  ? 'bg-[#183D2C] text-white'
                                  : isToday
                                  ? 'bg-[#A6F2C6] text-[#082114]'
                                  : isSunday
                                  ? 'text-[#9E2A2B]'
                                  : 'text-[#141E18]'
                              }`}
                            >
                              {dayNum}
                            </span>

                            {dayEvents.length > 0 && (
                              <span className="hidden sm:inline text-[10px] font-mono tabular-nums text-[#6A7F72] font-bold">
                                {dayEvents.length} st
                              </span>
                            )}
                          </div>

                          {/* Event Text Ribbons inside the Cell (Up to 3 ribbons + overflow indicator) */}
                          <div className="mt-1 space-y-1 flex-1 flex flex-col justify-start overflow-hidden">
                            {dayEvents.slice(0, 3).map((evt) => {
                              const cat =
                                categories.find((c) => c.id === evt.categoryId) || categories[0];
                              const hasCustom = Boolean(evt.customColorHex);
                              const ribbonBg = hasCustom
                                ? evt.customColorHex!
                                : isSelected
                                ? cat?.colorHex || '#183D2C'
                                : cat?.bgHex || '#D8F3E3';
                              const ribbonText =
                                hasCustom || isSelected
                                  ? '#FFFFFF'
                                  : cat?.textHex || '#141E18';

                              return (
                                <div
                                  key={evt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDate(cellDate);
                                  }}
                                  className="w-full rounded-[6px] px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold leading-tight truncate shadow-2xs"
                                  style={{
                                    backgroundColor: ribbonBg,
                                    color: ribbonText,
                                  }}
                                  title={`${evt.isAllDay ? 'Heldag' : evt.startTime} ${evt.title}`}
                                >
                                  {!evt.isAllDay && (
                                    <span className="hidden sm:inline font-mono tabular-nums mr-1 opacity-90">
                                      {evt.startTime}
                                    </span>
                                  )}
                                  <span>{evt.title}</span>
                                </div>
                              );
                            })}

                            {dayEvents.length > 3 && (
                              <div className="text-[10px] font-extrabold font-mono tabular-nums text-[#183D2C] px-1 truncate">
                                +{dayEvents.length - 3} till
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forest Green Bottom Sheet Preview Drawer for Selected Date (Förslag 5) */}
          <div className="rounded-3xl bg-[#183D2C] text-white p-5 sm:p-6 shadow-md">
            <div className="w-16 h-1.5 rounded-full bg-[#A6F2C6]/40 mx-auto mb-4" />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#A6F2C6]">
                  Snabböversikt · {selectedDateFormatted} ({selectedDateEvents.length}{' '}
                  {selectedDateEvents.length === 1 ? 'bokning' : 'bokningar'})
                </div>
                <p className="text-xs text-[#CDE8D8] mt-0.5">
                  Tryck på en bokning för att redigera eller lägg till en ny på detta datum
                </p>
              </div>

              <button
                type="button"
                onClick={() => openCreateModal(selectedDate)}
                className="min-h-[36px] rounded-xl bg-[#A6F2C6] hover:bg-[#8CE6B4] px-3.5 py-1.5 text-xs font-extrabold text-[#082114] flex items-center gap-1 transition-colors shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ny på {selectedDate.slice(8, 10)}/{selectedDate.slice(5, 7)}</span>
              </button>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="rounded-2xl bg-white/10 border border-white/15 p-6 text-center">
                <p className="text-sm font-bold text-white">
                  Inga bokningar inlagda på {selectedDateFormatted}.
                </p>
                <p className="text-xs text-[#CDE8D8] mt-1">
                  Tryck på knappen ovan eller håll inne direkt på datumrutan i kalendern för att boka.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {selectedDateEvents.map((evt) => {
                  const cat = categories.find((c) => c.id === evt.categoryId) || categories[0];
                  const accentColor = evt.customColorHex || cat?.colorHex || '#A6F2C6';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => openEditModal(evt)}
                      className="rounded-2xl bg-white/12 hover:bg-white/18 border border-white/15 p-4 flex flex-col justify-between cursor-pointer transition-colors group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-extrabold font-mono tabular-nums text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            {evt.isAllDay ? 'Heldag' : `${evt.startTime} – ${evt.endTime}`}
                          </span>

                          <div className="flex items-center gap-1">
                            {cat?.name && (
                              <span className="text-[11px] font-bold text-[#A6F2C6] px-2 py-0.5 rounded-md bg-black/25">
                                {cat.name}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(evt);
                              }}
                              className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white"
                              title="Redigera"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEvent(evt);
                              }}
                              className="h-7 w-7 rounded-lg bg-white/10 hover:bg-[#9E2A2B] flex items-center justify-center text-[#FFB4AB] hover:text-white"
                              title="Ta bort"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="mt-2.5 text-base font-extrabold text-white truncate">
                          {evt.title}
                        </h3>

                        {evt.location && (
                          <div className="mt-1 text-xs text-[#CDE8D8] truncate">
                            {evt.location}
                          </div>
                        )}

                        {evt.description && (
                          <p className="mt-1.5 text-xs text-white/80 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      {evt.reminderMinutesBefore !== undefined && evt.reminderMinutesBefore >= 0 && (
                        <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-[#A6F2C6] font-mono tabular-nums">
                          <Bell className="h-3 w-3 shrink-0" />
                          <span>{formatReminderLabel(evt.reminderMinutesBefore)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =====================================================================
           VIEW MODE 2: VECKOVY (FÖRSLAG 3 LAYOUT: DAGSRADER & KATEGORIKOLUMNER)
           ===================================================================== */
        <div
          onTouchStart={handleCalendarTouchStart}
          onTouchMove={handleCalendarTouchMove}
          onTouchEnd={handleCalendarTouchEnd}
          className="space-y-4 select-none"
        >
          {/* 7 Day Rows with Parallel Event Cards (Förslag 3 Layout) */}
          <div className="space-y-3">
            {activeWeekDates.map((dayDate, idx) => {
              const dayEvents = events
                .filter(
                  (e) =>
                    e.date === dayDate &&
                    (weekCategoryFilter === 'all' || e.categoryId === weekCategoryFilter)
                )
                .sort(sortDayEvents);
              const isToday = dayDate === todayStr;
              const isWeekend = idx >= 5;
              const dayNum = Number(dayDate.slice(8, 10));
              const monthShort = new Date(`${dayDate}T12:00:00`).toLocaleDateString('sv-SE', {
                month: 'short',
              });

              return (
                <div
                  key={dayDate}
                  className={`rounded-3xl bg-white p-3 sm:p-4 grid grid-cols-[74px_minmax(0,1fr)] sm:grid-cols-[110px_minmax(0,1fr)] gap-3 items-stretch transition-all ${
                    isToday
                      ? 'border-2 border-[#183D2C] shadow-sm'
                      : 'border border-[#D5E5DC] shadow-2xs'
                  }`}
                >
                  {/* Left Day Badge */}
                  <div
                    onClick={() =>
                      openCreateModal(
                        dayDate,
                        weekCategoryFilter !== 'all' ? weekCategoryFilter : undefined
                      )
                    }
                    className={`rounded-2xl p-2.5 flex flex-col justify-center items-center sm:items-start cursor-pointer transition-colors ${
                      isToday
                        ? 'bg-[#183D2C] text-white'
                        : isWeekend
                        ? 'bg-[#FFF5F5] text-[#9E2A2B] hover:bg-[#FEE2E2]'
                        : 'bg-[#F6FBF7] text-[#141E18] hover:bg-[#EAF5EE]'
                    }`}
                    title={`Boka händelse på ${SWEDISH_WEEKDAYS_FULL[idx]} ${dayDate}`}
                  >
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wider ${
                        isToday
                          ? 'text-[#A6F2C6]'
                          : isWeekend
                          ? 'text-[#9E2A2B]'
                          : 'text-[#54685C]'
                      }`}
                    >
                      {isToday ? 'IDAG' : SWEDISH_WEEKDAYS_SHORT[idx]}
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-tight">
                      {dayNum}
                    </span>
                    <span
                      className={`text-[11px] font-semibold capitalize ${
                        isToday ? 'text-[#CDE8D8]' : 'text-[#6A7F72]'
                      }`}
                    >
                      {isToday ? SWEDISH_WEEKDAYS_SHORT[idx].toLowerCase() : monthShort}
                    </span>
                  </div>

                  {/* Right Day Event Columns */}
                  {dayEvents.length === 0 ? (
                    <div
                      onClick={() =>
                        openCreateModal(
                          dayDate,
                          weekCategoryFilter !== 'all' ? weekCategoryFilter : undefined
                        )
                      }
                      className="rounded-2xl p-3 flex items-center justify-between min-h-[84px] bg-[#F8FCF9] border border-dashed border-[#DCEAE1] hover:border-[#183D2C] cursor-pointer group transition-colors"
                    >
                      <span className="text-xs font-semibold text-[#6A7F72] group-hover:text-[#183D2C]">
                        Inga bokningar inlagda
                      </span>
                      <span className="rounded-xl bg-[#E7F3EC] px-2.5 py-1 text-[11px] font-extrabold text-[#183D2C] group-hover:bg-[#183D2C] group-hover:text-[#A6F2C6] transition-colors">
                        + Boka
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 items-stretch">
                      {dayEvents.map((evt) => {
                        const cat =
                          categories.find((c) => c.id === evt.categoryId) || categories[0];
                        const hasCustom = Boolean(evt.customColorHex);
                        const cardBg = hasCustom
                          ? evt.customColorHex!
                          : cat?.bgHex || '#D8F3E3';
                        const cardText = hasCustom
                          ? '#FFFFFF'
                          : cat?.textHex || '#141E18';
                        const badgeColor = hasCustom
                          ? 'rgba(0,0,0,0.22)'
                          : cat?.colorHex || '#183D2C';

                        return (
                          <div
                            key={evt.id}
                            onClick={() => openEditModal(evt)}
                            className="rounded-2xl p-3 cursor-pointer hover:brightness-95 transition-all shadow-2xs flex flex-col justify-between"
                            style={{
                              backgroundColor: cardBg,
                              color: cardText,
                            }}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1.5">
                                <span
                                  className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold font-mono tabular-nums text-white"
                                  style={{ backgroundColor: badgeColor }}
                                >
                                  {evt.isAllDay
                                    ? 'Heldag'
                                    : `${evt.startTime}–${evt.endTime}`}
                                </span>

                                <div className="flex items-center gap-1">
                                  {cat?.name && (
                                    <span className="text-[10px] font-extrabold opacity-80 truncate">
                                      {cat.name}
                                    </span>
                                  )}
                                  {evt.reminderMinutesBefore !== undefined &&
                                    evt.reminderMinutesBefore >= 0 && (
                                      <Bell className="h-3 w-3 shrink-0" />
                                    )}
                                </div>
                              </div>

                              <div className="mt-1.5 text-sm font-extrabold leading-snug break-words">
                                {evt.title}
                              </div>

                              {evt.location && (
                                <div className="mt-0.5 text-[11px] font-semibold truncate opacity-85">
                                  {evt.location}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() =>
                          openCreateModal(
                            dayDate,
                            weekCategoryFilter !== 'all' ? weekCategoryFilter : undefined
                          )
                        }
                        className="rounded-2xl border border-dashed border-[#CDE0D4] hover:border-[#183D2C] bg-[#F8FCF9] hover:bg-[#EAF5EE] p-3 flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#183D2C] transition-colors min-h-[64px]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Lägg till</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Customize Category Names & Colors */}
      {showColorModal && (
        <div
          onClick={() => setShowColorModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#DCEAE1] bg-[#F6FBF7] shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#141E18]">
                  Anpassa kategorier & färger
                </h3>
                <p className="text-xs text-[#54685C]">
                  Byt namn på kategorierna och välj tydliga kalenderfärger för månadsvyns textremsor
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowColorModal(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E7F3EC] text-[#183D2C] hover:bg-[#D8F3E3]"
                aria-label="Stäng kategorimeny"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl bg-white border border-[#DCEAE1] p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-xl shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.colorHex }}
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#54685C] mb-0.5">
                        Kategorinamn
                      </label>
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => onRenameCategory(cat.id, e.target.value)}
                        placeholder="Ange namn på kategori..."
                        className="w-full min-h-[38px] rounded-xl bg-[#F6FBF7] border border-[#CDE0D4] px-3 py-1.5 text-sm font-bold text-[#141E18] focus:outline-none focus:border-[#183D2C]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {EXPRESSIVE_COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.colorHex}
                        type="button"
                        onClick={() =>
                          onUpdateCategoryColor(
                            cat.id,
                            preset.colorHex,
                            preset.bgHex,
                            preset.textHex
                          )
                        }
                        className={`h-8 w-8 rounded-xl transition-transform shadow-2xs ${
                          cat.colorHex.toUpperCase() === preset.colorHex.toUpperCase()
                            ? 'ring-2 ring-offset-2 ring-[#141E18] scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset.colorHex }}
                        title={preset.name}
                      />
                    ))}
                    <input
                      type="color"
                      value={cat.colorHex}
                      onChange={(e) =>
                        onUpdateCategoryColor(cat.id, e.target.value, '#E7F3EC', '#141E18')
                      }
                      className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      title="Välj valfri egen färg"
                    />
                  </div>
                </div>
              ))}

              {onAddCategory && (
                <div className="rounded-2xl bg-[#E7F3EC] border border-[#C6DFD0] p-4 space-y-2.5">
                  <div className="text-xs font-bold text-[#183D2C]">
                    Lägg till ny kategori
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="t.ex. Barnens aktiviteter, Husdjur..."
                      className="flex-1 min-h-[40px] rounded-xl bg-white border border-[#BDD3C5] px-3 py-1.5 text-sm text-[#141E18]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCatName.trim()) return;
                        const preset =
                          EXPRESSIVE_COLOR_PRESETS[
                            categories.length % EXPRESSIVE_COLOR_PRESETS.length
                          ];
                        onAddCategory(
                          newCatName.trim(),
                          preset.colorHex,
                          preset.bgHex,
                          preset.textHex
                        );
                        setNewCatName('');
                      }}
                      className="min-h-[40px] rounded-xl bg-[#183D2C] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0F291E] whitespace-nowrap"
                    >
                      + Lägg till
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#DCEAE1] bg-[#F6FBF7] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowColorModal(false)}
                className="min-h-[44px] rounded-2xl bg-[#183D2C] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#0F291E]"
              >
                Stäng & spara
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Calendar Event */}
      {showEventModal && (
        <div
          onClick={() => setShowEventModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#141E18]">
                {editingEvent ? 'Redigera händelse' : 'Ny kalenderhändelse'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#38493F] hover:bg-[#E3EFE7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">
                Händelsens titel
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="t.ex. Tandläkare, Padel, Middag hemma..."
                className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2.5 text-sm text-[#141E18] focus:outline-none focus:border-[#183D2C]"
              />
            </div>

            {/* All-Day Switch (Heldag) */}
            <div className="flex items-center justify-between rounded-2xl bg-white border border-[#CDE0D4] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[#183D2C]" />
                <div>
                  <div className="text-xs font-bold text-[#141E18]">Heldag</div>
                  <div className="text-[11px] text-[#54685C]">
                    Händelsen pågår hela dagen utan specifik start- och sluttid
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isAllDay}
                onClick={() => setIsAllDay((prev) => !prev)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  isAllDay ? 'bg-[#183D2C]' : 'bg-[#CBDAD1]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                    isAllDay ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className={`grid grid-cols-1 ${isAllDay ? 'sm:grid-cols-1' : 'sm:grid-cols-3'} gap-3`}>
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">Datum</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              {!isAllDay && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#2E4035] mb-1">Starttid</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2E4035] mb-1">
                      Sluttid (std 1 tim)
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm font-mono tabular-nums"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">
                  Påminnelsenotis
                </label>
                <select
                  value={reminderMinutesBefore}
                  onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm"
                >
                  <option value={-1}>Ingen påminnelse</option>
                  <option value={0}>Vid starttid</option>
                  <option value={10}>10 minuter före</option>
                  <option value={15}>15 minuter före</option>
                  <option value={30}>30 minuter före</option>
                  <option value={60}>1 timme före</option>
                  <option value={120}>2 timmar före</option>
                  <option value={1440}>1 dag före</option>
                </select>
              </div>
            </div>

            {/* Individual Event Color Override */}
            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1.5">
                Egen händelsefärg (valfritt — annars används kategorins färg)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCustomColorHex('')}
                  className={`min-h-[36px] rounded-xl px-3 text-xs font-semibold border ${
                    !customColorHex
                      ? 'bg-[#183D2C] text-white border-[#183D2C]'
                      : 'bg-white text-[#38493F] border-[#CDE0D4]'
                  }`}
                >
                  Kategorins färg
                </button>
                {EXPRESSIVE_COLOR_PRESETS.map((p) => (
                  <button
                    key={p.colorHex}
                    type="button"
                    onClick={() => setCustomColorHex(p.colorHex)}
                    className={`h-8 w-8 rounded-xl ${
                      customColorHex === p.colorHex
                        ? 'ring-2 ring-offset-2 ring-[#141E18] scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: p.colorHex }}
                    title={p.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">Plats</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="t.ex. GLTK Göteborg, Kontoret..."
                className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">Anteckning</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detaljer eller länk..."
                className="w-full rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              {editingEvent ? (
                <button
                  type="button"
                  onClick={() => {
                    const toDel = editingEvent;
                    setShowEventModal(false);
                    onDeleteEvent(toDel);
                  }}
                  className="min-h-[44px] rounded-2xl bg-[#FADAD8] px-4 py-2.5 text-xs font-extrabold text-[#9E2A2B] hover:bg-[#F5C2BE] flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Ta bort</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="min-h-[44px] rounded-2xl px-5 py-2.5 text-xs font-semibold text-[#38493F] hover:bg-[#E4EFE8]"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-2xl bg-[#183D2C] px-6 py-2.5 text-xs font-extrabold text-white hover:bg-[#0F291E]"
                >
                  {editingEvent ? 'Spara ändringar' : 'Skapa händelse'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
