// Custom Service Worker Notification & Firebase Firestore Background Sync Handler for Hem PWA
const FIRESTORE_PROJECT_ID = 'gen-lang-client-0269437912';
const FIRESTORE_DB_ID = 'ai-studio-vardagsnavkalend-573f32e2-2ecd-4fec-bdc0-b78a7d1d127b';

let swSyncState = {
  email: '',
  deviceId: '',
  deviceLabel: '',
  firebaseToken: '',
  wsDocIds: [],
  seenIds: new Set(),
  dismissedIds: new Set(),
};

let bgPollTimer = null;
let bgWaitLoopRunning = false;

function isDeletionOrNonAdditionSummary(summary) {
  const s = String(summary || '').trim().toLowerCase();
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
}

function getPageNameForActionType(actionType) {
  switch (actionType) {
    case 'shopping':
      return 'Inköpslista';
    case 'calendar':
      return 'Kalender';
    case 'todo':
      return 'Att göra';
    case 'photos':
      return 'Foton';
    case 'notes':
      return 'Anteckningar';
    case 'recipes':
      return 'Recept';
    case 'budget':
      return 'Budget';
    default:
      return 'Hem';
  }
}

function formatHemNotificationBody(actionType, rawSummary) {
  const pageName = getPageNameForActionType(actionType);
  let text = String(rawSummary || '').trim();
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
}

async function notifyClients(message) {
  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    for (const client of clients) {
      client.postMessage(message);
    }
  } catch {
    // Ignore
  }
}

async function pollCloudInServiceWorker() {
  if (
    !swSyncState.email ||
    !swSyncState.deviceId ||
    swSyncState.wsDocIds.length === 0
  ) {
    return;
  }

  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    const anyVisible = clients.some((c) => c.visibilityState === 'visible');
    if (anyVisible) return; // Foreground app handles polling when visible

    const actionMap = new Map();

    for (const docId of swSyncState.wsDocIds) {
      if (!docId || docId === 'default') continue;
      const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents/workspaces/${docId}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const docJson = await res.json();
      const sliceJsonStr =
        docJson &&
        docJson.fields &&
        docJson.fields.sliceJson &&
        docJson.fields.sliceJson.stringValue;
      if (!sliceJsonStr) continue;

      const slice = JSON.parse(sliceJsonStr);
      if (slice && Array.isArray(slice.recentActions)) {
        for (const act of slice.recentActions) {
          if (act && act.id && !actionMap.has(act.id)) {
            actionMap.set(act.id, act);
          }
        }
      }
    }

    const actions = Array.from(actionMap.values()).sort((a, b) =>
      String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
    );

    const nowMs = Date.now();
    for (const act of actions) {
      if (!act || !act.id || swSyncState.seenIds.has(act.id)) continue;
      swSyncState.seenIds.add(act.id);

      if (act.deviceId === swSyncState.deviceId) continue;
      if (act.actionType === 'sync') continue;
      if (isDeletionOrNonAdditionSummary(act.summary)) continue;

      const ageMs = nowMs - new Date(act.createdAt || 0).getTime();
      if (ageMs > 20 * 60 * 1000) continue;

      const fullTitle = 'Hem';
      const body = formatHemNotificationBody(act.actionType, act.summary);
      const notifId = `notif-${act.id}`;

      await self.registration.showNotification(fullTitle, {
        body,
        icon: 'pwa-192x192.png',
        badge: 'pwa-192x192.png',
        tag: notifId,
        renotify: true,
        data: {
          appNotifId: notifId,
          actionId: act.id,
          title: fullTitle,
          body,
          type: act.actionType || 'shopping',
          createdAtMs: Date.now(),
        },
      });

      await notifyClients({
        type: 'HEM_SW_NOTIFICATION_POSTED',
        notification: {
          id: notifId,
          actionId: act.id,
          title: fullTitle,
          body,
          type: act.actionType || 'shopping',
          createdAtMs: Date.now(),
        },
      });
    }
  } catch {
    // Ignore transient network errors in SW
  }
}

function ensureSwPollLoop() {
  if (bgPollTimer) return;
  bgPollTimer = setInterval(() => {
    pollCloudInServiceWorker();
  }, 60000);
}

async function runExtendedSwBackgroundLoop() {
  if (bgWaitLoopRunning) return;
  bgWaitLoopRunning = true;
  try {
    for (let i = 0; i < 15; i++) {
      await pollCloudInServiceWorker();
      await new Promise((r) => setTimeout(r, 60000));
    }
  } finally {
    bgWaitLoopRunning = false;
  }
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'HEM_SW_CONFIG') {
    if (data.email) swSyncState.email = String(data.email).trim().toLowerCase();
    if (data.deviceId) swSyncState.deviceId = String(data.deviceId);
    if (data.deviceLabel) swSyncState.deviceLabel = String(data.deviceLabel);
    if (data.firebaseToken) swSyncState.firebaseToken = String(data.firebaseToken);
    if (Array.isArray(data.wsDocIds) && data.wsDocIds.length > 0) {
      swSyncState.wsDocIds = data.wsDocIds;
    }
    if (Array.isArray(data.seenIds)) {
      for (const id of data.seenIds) swSyncState.seenIds.add(id);
    }
    ensureSwPollLoop();
    if (data.triggerPollNow) {
      event.waitUntil(runExtendedSwBackgroundLoop());
    }
  } else if (data.type === 'HEM_SW_GET_DISMISSED') {
    const dismissed = Array.from(swSyncState.dismissedIds);
    swSyncState.dismissedIds.clear();
    if (event.source && typeof event.source.postMessage === 'function') {
      event.source.postMessage({
        type: 'HEM_SW_DISMISSED_LIST',
        ids: dismissed,
      });
    }
  }
});

self.addEventListener('notificationclose', (event) => {
  const tag = event.notification ? event.notification.tag : '';
  const appNotifId =
    (event.notification &&
      event.notification.data &&
      event.notification.data.appNotifId) ||
    tag;
  if (appNotifId) {
    swSyncState.dismissedIds.add(appNotifId);
  }
  event.waitUntil(
    notifyClients({
      type: 'HEM_NOTIFICATION_DISMISSED',
      id: appNotifId,
      tag,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  const tag = event.notification ? event.notification.tag : '';
  const appNotifId =
    (event.notification &&
      event.notification.data &&
      event.notification.data.appNotifId) ||
    tag;
  if (event.notification) {
    event.notification.close();
  }
  if (appNotifId) {
    swSyncState.dismissedIds.add(appNotifId);
  }
  event.waitUntil(
    (async () => {
      await notifyClients({
        type: 'HEM_NOTIFICATION_DISMISSED',
        id: appNotifId,
        tag,
      });
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of windowClients) {
        if ('focus' in client) {
          await client.focus();
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow('./');
      }
    })()
  );
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'hem-household-sync') {
    event.waitUntil(pollCloudInServiceWorker());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'hem-household-sync') {
    event.waitUntil(pollCloudInServiceWorker());
  }
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        for (const client of windowClients) {
          client.postMessage({ type: 'HEM_SW_UPDATED_RELOAD' });
          if ('navigate' in client && client.url) {
            await client.navigate(client.url).catch(() => {});
          }
        }
      } catch {
        // Ignore
      }
    })()
  );
});


