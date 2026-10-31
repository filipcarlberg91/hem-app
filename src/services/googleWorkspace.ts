import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CalendarEvent, TodoItem, NoteItem } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
// In-memory access token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Kunde inte hämta åtkomsttoken från Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE CALENDAR API
// ==========================================

export async function fetchGoogleCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  const timeMin = new Date();
  timeMin.setMonth(timeMin.getMonth() - 1);
  const timeMax = new Date();
  timeMax.setMonth(timeMax.getMonth() + 4);

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', timeMin.toISOString());
  url.searchParams.set('timeMax', timeMax.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '150');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Google Calendar API svarade med status ${res.status}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  const colorMapToCategory: Record<string, string> = {
    '1': 'arbete',
    '2': 'halsa',
    '3': 'familj',
    '4': 'viktigt',
    '5': 'fritid',
    '9': 'arbete',
    '10': 'halsa',
    '11': 'viktigt',
  };

  return items.map((item: any): CalendarEvent => {
    const startRaw: string = item.start?.dateTime || item.start?.date || new Date().toISOString();
    const endRaw: string = item.end?.dateTime || item.end?.date || startRaw;

    const startDateObj = new Date(startRaw);
    const endDateObj = new Date(endRaw);

    const yyyy = startDateObj.getFullYear();
    const mm = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(startDateObj.getDate()).padStart(2, '0');
    const dateStr = item.start?.date ? item.start.date : `${yyyy}-${mm}-${dd}`;

    const startTimeStr = item.start?.dateTime
      ? `${String(startDateObj.getHours()).padStart(2, '0')}:${String(startDateObj.getMinutes()).padStart(2, '0')}`
      : '09:00';
    const endTimeStr = item.end?.dateTime
      ? `${String(endDateObj.getHours()).padStart(2, '0')}:${String(endDateObj.getMinutes()).padStart(2, '0')}`
      : '10:00';

    const categoryId = colorMapToCategory[item.colorId] || 'arbete';

    return {
      id: `gcal-${item.id}`,
      googleEventId: item.id,
      title: item.summary || '(Namnlös händelse)',
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      categoryId,
      description: item.description || '',
      location: item.location || '',
      reminderMinutesBefore: 15,
      updatedAt: item.updated || new Date().toISOString(),
    };
  });
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: CalendarEvent,
  googleColorId = '10'
): Promise<string> {
  const startDateTime = new Date(`${event.date}T${event.startTime || '09:00'}:00`);
  const endDateTime = new Date(`${event.date}T${event.endTime || '10:00'}:00`);
  if (endDateTime <= startDateTime) {
    endDateTime.setHours(startDateTime.getHours() + 1);
  }

  const body = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    colorId: googleColorId,
    start: {
      dateTime: startDateTime.toISOString(),
    },
    end: {
      dateTime: endDateTime.toISOString(),
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Kunde inte skapa händelse i Google Kalender (${res.status})`);
  }

  const created = await res.json();
  return created.id;
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string,
  event: CalendarEvent,
  googleColorId = '10'
): Promise<void> {
  const startDateTime = new Date(`${event.date}T${event.startTime || '09:00'}:00`);
  const endDateTime = new Date(`${event.date}T${event.endTime || '10:00'}:00`);
  if (endDateTime <= startDateTime) {
    endDateTime.setHours(startDateTime.getHours() + 1);
  }

  const body = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    colorId: googleColorId,
    start: {
      dateTime: startDateTime.toISOString(),
    },
    end: {
      dateTime: endDateTime.toISOString(),
    },
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(`Kunde inte uppdatera händelse i Google Kalender (${res.status})`);
  }
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Kunde inte ta bort händelse från Google Kalender (${res.status})`);
  }
}

// ==========================================
// GOOGLE TASKS API
// ==========================================

export async function fetchGoogleTasks(accessToken: string): Promise<{
  listId: string;
  tasks: TodoItem[];
}> {
  const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listsRes.ok) {
    throw new Error(`Google Tasks API svarade med status ${listsRes.status}`);
  }

  const listsData = await listsRes.json();
  const primaryList = listsData.items?.[0];
  if (!primaryList) {
    return { listId: '@default', tasks: [] };
  }

  const tasksRes = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(primaryList.id)}/tasks?showCompleted=true&maxResults=100`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!tasksRes.ok) {
    throw new Error(`Kunde inte hämta uppgifter från Google Tasks (${tasksRes.status})`);
  }

  const tasksData = await tasksRes.json();
  const rawItems = Array.isArray(tasksData.items) ? tasksData.items : [];

  const todayStr = new Date().toISOString().slice(0, 10);

  const tasks: TodoItem[] = rawItems
    .filter((t: any) => t.title && t.title.trim() !== '')
    .map((t: any): TodoItem => {
      const dueStr = t.due ? t.due.slice(0, 10) : todayStr;
      return {
        id: `gtask-${t.id}`,
        googleTaskId: t.id,
        googleTaskListId: primaryList.id,
        title: t.title,
        notes: t.notes || '',
        completed: t.status === 'completed',
        priority: 'medium',
        dueDate: dueStr,
        favorite: false,
        category: primaryList.title || 'Google Tasks',
        updatedAt: t.updated || new Date().toISOString(),
      };
    });

  return { listId: primaryList.id, tasks };
}

export async function createGoogleTask(
  accessToken: string,
  todo: TodoItem,
  listId = '@default'
): Promise<string> {
  const dueIso = todo.dueDate ? new Date(`${todo.dueDate}T12:00:00Z`).toISOString() : undefined;
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: todo.title,
        notes: todo.notes || '',
        due: dueIso,
        status: todo.completed ? 'completed' : 'needsAction',
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Kunde inte skapa uppgift i Google Tasks (${res.status})`);
  }

  const created = await res.json();
  return created.id;
}

export async function updateGoogleTask(
  accessToken: string,
  todo: TodoItem,
  listId = '@default'
): Promise<void> {
  if (!todo.googleTaskId) return;
  const dueIso = todo.dueDate ? new Date(`${todo.dueDate}T12:00:00Z`).toISOString() : undefined;
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(todo.googleTaskId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: todo.title,
        notes: todo.notes || '',
        due: dueIso,
        status: todo.completed ? 'completed' : 'needsAction',
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Kunde inte uppdatera uppgift i Google Tasks (${res.status})`);
  }
}

export async function deleteGoogleTask(
  accessToken: string,
  googleTaskId: string,
  listId = '@default'
): Promise<void> {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(googleTaskId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok && res.status !== 404) {
    throw new Error(`Kunde inte ta bort uppgift från Google Tasks (${res.status})`);
  }
}

// ==========================================
// GOOGLE KEEP API (Enterprise Workspace + Cloud Fallback)
// ==========================================

export async function fetchGoogleKeepNotes(accessToken: string): Promise<{
  notes: NoteItem[];
  enterpriseAvailable: boolean;
}> {
  try {
    const res = await fetch('https://keep.googleapis.com/v1/notes?pageSize=30', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      // Standard consumer @gmail.com accounts do not have Enterprise Keep API delegation
      return { notes: [], enterpriseAvailable: false };
    }

    const data = await res.json();
    const rawNotes = Array.isArray(data.notes) ? data.notes : [];
    const notes: NoteItem[] = rawNotes.map((n: any): NoteItem => {
      const textContent = n.body?.text?.text || '';
      const listItems = n.body?.list?.listItems || [];
      return {
        id: `gkeep-${n.name}`,
        googleKeepId: n.name,
        title: n.title || 'Keep-anteckning',
        contentHtml: textContent,
        listMode: listItems.length > 0 ? 'checklist' : 'none',
        checklistItems: listItems.map((li: any, idx: number) => ({
          id: `chk-${idx}`,
          text: li.text?.text || '',
          checked: !!li.checked,
        })),
        colorTone: 'sage',
        favorite: false,
        updatedAt: n.updateTime || new Date().toISOString(),
      };
    });

    return { notes, enterpriseAvailable: true };
  } catch {
    return { notes: [], enterpriseAvailable: false };
  }
}
