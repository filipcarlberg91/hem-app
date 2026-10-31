import {
  EventCategory,
  CalendarEvent,
  TodoItem,
  NoteItem,
  ShoppingItem,
  RecipeItem,
  BudgetMonth,
  PhotoItem,
  PhotoAlbum,
} from '../types';

export const INITIAL_CATEGORIES: EventCategory[] = [
  {
    id: 'arbete',
    name: 'Arbete & Möten',
    colorHex: '#0066FF',
    bgHex: '#DBEAFE',
    textHex: '#1E3A8A',
    googleColorId: '9',
  },
  {
    id: 'familj',
    name: 'Familj & Hem',
    colorHex: '#059669',
    bgHex: '#D1FAE5',
    textHex: '#064E3B',
    googleColorId: '10',
  },
  {
    id: 'halsa',
    name: 'Träning & Hälsa',
    colorHex: '#EA580C',
    bgHex: '#FFEDD5',
    textHex: '#7C2D12',
    googleColorId: '6',
  },
  {
    id: 'fritid',
    name: 'Fritid & Vänner',
    colorHex: '#7C3AED',
    bgHex: '#EDE9FE',
    textHex: '#4C1D95',
    googleColorId: '3',
  },
  {
    id: 'viktigt',
    name: 'Viktigt & Ekonomi',
    colorHex: '#E11D48',
    bgHex: '#FFE4E6',
    textHex: '#881337',
    googleColorId: '11',
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const INITIAL_EVENTS: CalendarEvent[] = [];

export const INITIAL_TODOS: TodoItem[] = [];

export const INITIAL_NOTES: NoteItem[] = [];

export const INITIAL_SHOPPING: ShoppingItem[] = [];

export const INITIAL_RECIPES: RecipeItem[] = [];

export const INITIAL_PHOTOS: PhotoItem[] = [];

export const INITIAL_PHOTO_ALBUMS: PhotoAlbum[] = [];

export const INITIAL_BUDGET_MONTHS: BudgetMonth[] = [
  {
    monthKey: '2026-10',
    label: 'Oktober 2026',
    entries: [],
  },
  {
    monthKey: '2026-11',
    label: 'November 2026',
    entries: [],
  },
  {
    monthKey: '2026-12',
    label: 'December 2026',
    entries: [],
  },
];
