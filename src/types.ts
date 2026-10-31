export type NavTab =
  | 'home'
  | 'calendar'
  | 'todo'
  | 'notes'
  | 'shopping'
  | 'recipes'
  | 'budget'
  | 'photos';

export type ShareableModule =
  | 'calendar'
  | 'todo'
  | 'notes'
  | 'shopping'
  | 'recipes'
  | 'budget'
  | 'photos';

export interface FriendConnection {
  email: string;
  name: string;
  avatarDataUrl?: string;
  avatarColor?: string;
  shareAll: boolean;
  sharedModules?: Record<ShareableModule, boolean>;
  addedAt: string;
  updatedAt?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  roleTitle?: string;
  avatarDataUrl?: string;
  avatarColor: string;
  connections: FriendConnection[];
  isPrimaryFounder?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventCategory {
  id: string;
  name: string;
  colorHex: string;
  bgHex: string;
  textHex: string;
  googleColorId: string;
}

export interface CalendarEvent {
  id: string;
  googleEventId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAllDay?: boolean;
  categoryId: string;
  assignee?: string; // e.g. 'shared' ('Gemensamt') or member name ('Filip', 'Felicia', etc.)
  customColorHex?: string;
  description?: string;
  location?: string;
  reminderMinutesBefore?: number; // e.g. 0, 15, 30, 60 (undefined = no reminder)
  notifiedReminder?: boolean;
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  googleTaskId?: string;
  googleTaskListId?: string;
  title: string;
  notes?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate: string; // YYYY-MM-DD
  reminderTime?: string; // HH:mm
  notifiedReminder?: boolean;
  favorite: boolean;
  category: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface NoteItem {
  id: string;
  googleKeepId?: string;
  title: string;
  contentHtml: string;
  listMode: 'none' | 'bullet' | 'numbered' | 'checklist';
  checklistItems: ChecklistItem[];
  colorTone: 'sage' | 'sand' | 'lavender' | 'clay' | 'sky' | 'white';
  favorite: boolean;
  updatedAt: string;
}

export type SwedishShoppingCategory =
  | 'Frukt & Grönt'
  | 'Bröd & Bageri'
  | 'Mejeri, Ost & Ägg'
  | 'Kött, Fågel & Chark'
  | 'Fisk & Skaldjur'
  | 'Skafferi & Torrvaror'
  | 'Fryst'
  | 'Dryck'
  | 'Snacks & Sötsaker'
  | 'Hem & Hygien'
  | 'Övrigt';

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: SwedishShoppingCategory;
  checked: boolean;
  favorite: boolean;
  addedAt: string;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeItem {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  servings: number;
  rating: number; // 0 to 5
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  imageUrl?: string;
  sourceType: 'manual' | 'camera' | 'url';
  sourceUrl?: string;
  favorite: boolean;
  createdAt: string;
}

export interface BudgetEntry {
  id: string;
  seriesId: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  dayOfMonth: number;
}

export interface BudgetMonth {
  monthKey: string; // YYYY-MM
  label: string; // e.g. "Oktober 2026"
  entries: BudgetEntry[];
}

export interface PhotoAlbum {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: string;
}

export interface PhotoReaction {
  emoji: string;
  userEmail: string;
  userName: string;
}

export interface PhotoComment {
  id: string;
  authorName: string;
  authorEmail: string;
  authorAvatarDataUrl?: string;
  authorAvatarColor?: string;
  text: string;
  createdAt: string;
}

export interface PhotoItem {
  id: string;
  albumId?: string;
  imageUrl: string;
  caption: string;
  uploadedBy: string;
  uploadedByEmail: string;
  uploadedByAvatarDataUrl?: string;
  uploadedByAvatarColor?: string;
  reactions: PhotoReaction[];
  comments: PhotoComment[];
  favorite: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type:
    | 'calendar'
    | 'todo'
    | 'shopping'
    | 'photos'
    | 'notes'
    | 'recipes'
    | 'budget'
    | 'sync';
  read: boolean;
  nativeId?: number;
  createdAtMs?: number;
  deliveredToStatusBar?: boolean;
  swDeliveredToStatusBar?: boolean;
}

export interface SyncQueueItem {
  id: string;
  entity: 'calendar' | 'todo' | 'keep';
  action: 'create' | 'update' | 'delete';
  summary: string;
  createdAt: string;
}

export interface GothenburgWeather {
  temperature: number;
  apparentTemperature: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  highTemp: number;
  lowTemp: number;
  updatedAt: string;
}
