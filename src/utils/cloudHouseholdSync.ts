import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  RESTORED_FILIP_CATEGORIES,
  RESTORED_FILIP_EVENTS,
  RESTORED_FILIP_SHOPPING,
} from '../data/restoredFilipEvents';
import {
  INITIAL_BUDGET_MONTHS,
  INITIAL_CATEGORIES,
  INITIAL_NOTES,
  INITIAL_PHOTO_ALBUMS,
  INITIAL_RECIPES,
  INITIAL_TODOS,
} from '../data/initialData';
import {
  BudgetMonth,
  CalendarEvent,
  EventCategory,
  FriendConnection,
  NoteItem,
  PhotoAlbum,
  PhotoItem,
  RecipeItem,
  ShareableModule,
  ShoppingItem,
  TodoItem,
  UserAccount,
} from '../types';

export const ALL_SHAREABLE_MODULES: ShareableModule[] = [
  'calendar',
  'todo',
  'notes',
  'shopping',
  'recipes',
  'budget',
  'photos',
];

export function getConnectionSharedModules(
  conn: FriendConnection
): Record<ShareableModule, boolean> {
  const raw = conn.sharedModules;
  if (raw && typeof raw === 'object') {
    return {
      calendar: Boolean(raw.calendar),
      todo: Boolean(raw.todo),
      notes: Boolean(raw.notes),
      shopping: Boolean(raw.shopping),
      recipes: Boolean(raw.recipes),
      budget: Boolean(raw.budget),
      photos: Boolean(raw.photos),
    };
  }
  const fallback = Boolean(conn.shareAll);
  return {
    calendar: fallback,
    todo: fallback,
    notes: fallback,
    shopping: fallback,
    recipes: fallback,
    budget: fallback,
    photos: fallback,
  };
}

export function isModuleSharedWithConnection(
  conn: FriendConnection,
  module: ShareableModule
): boolean {
  const mods = getConnectionSharedModules(conn);
  return Boolean(mods[module]);
}

export function hasAnySharedModule(conn: FriendConnection): boolean {
  const mods = getConnectionSharedModules(conn);
  return ALL_SHAREABLE_MODULES.some((m) => mods[m]);
}

export function sanitizeFirestoreId(raw: string): string {
  const cleaned = (raw || 'default')
    .trim()
    .toLowerCase()
    .replace(/@/g, '_at_')
    .replace(/\./g, '_dot_')
    .replace(/[^a-z0-9_-]/g, '_');
  if (cleaned.length <= 120) {
    return cleaned || 'default';
  }
  let h = 0;
  for (let i = 0; i < cleaned.length; i++) {
    h = (h * 31 + cleaned.charCodeAt(i)) | 0;
  }
  const suffix = Math.abs(h).toString(36);
  return `${cleaned.slice(0, 105)}_${suffix}`;
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem('vn_device_id');
    if (!id) {
      id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('vn_device_id', id);
    }
    return id;
  } catch {
    return 'dev-fallback';
  }
}

export function getDeviceLabel(): string {
  try {
    if (typeof window === 'undefined') return 'Enhet';
    const ua = navigator.userAgent || '';
    const isTablet =
      /iPad|Tablet|PlayBook|Silk/i.test(ua) ||
      (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
      (window.innerWidth >= 700 && 'ontouchstart' in window);
    if (isTablet) return 'Surfplatta';
    if (/iPhone|iPod|Android.*Mobile|Mobile/i.test(ua)) return 'Telefon';
    return 'Dator';
  } catch {
    return 'Enhet';
  }
}

export async function hashPassword(password: string): Promise<string> {
  const normalized = `hem-salt-v1:${password}`;
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const buf = new TextEncoder().encode(normalized);
      const digest = await window.crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback below
  }
  let h1 = 0xdeadbeef ^ normalized.length;
  let h2 = 0x41c6ce57 ^ normalized.length;
  for (let i = 0, ch; i < normalized.length; i++) {
    ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

export async function compressAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Kunde inte läsa bilden.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Kunde inte ladda upp filen.'));
    reader.readAsDataURL(file);
  });
}

export async function compressGalleryPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.68));
      };
      img.onerror = () => reject(new Error('Kunde inte läsa bilden.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Kunde inte ladda upp bilden.'));
    reader.readAsDataURL(file);
  });
}

const VIBRANT_CATEGORY_UPGRADES: Record<
  string,
  { colorHex: string; bgHex: string; textHex: string }
> = {
  '#21513B': { colorHex: '#0066FF', bgHex: '#DBEAFE', textHex: '#1E3A8A' },
  '#7A4F2B': { colorHex: '#059669', bgHex: '#D1FAE5', textHex: '#064E3B' },
  '#1D5B79': { colorHex: '#EA580C', bgHex: '#FFEDD5', textHex: '#7C2D12' },
  '#5C4389': { colorHex: '#7C3AED', bgHex: '#EDE9FE', textHex: '#4C1D95' },
  '#9E2A2B': { colorHex: '#E11D48', bgHex: '#FFE4E6', textHex: '#881337' },
};

export function upgradeCategoriesToVibrant(
  cats?: EventCategory[]
): EventCategory[] | undefined {
  if (!Array.isArray(cats)) return cats;
  return cats.map((c) => {
    const key = (c.colorHex || '').toUpperCase();
    const upgrade = VIBRANT_CATEGORY_UPGRADES[key];
    if (upgrade) {
      return { ...c, ...upgrade };
    }
    return c;
  });
}

export interface CloudActionEvent {
  id: string;
  createdAt: string;
  deviceId: string;
  deviceLabel?: string;
  actorName: string;
  actorEmail?: string;
  actionType:
    | 'calendar'
    | 'todo'
    | 'shopping'
    | 'photos'
    | 'notes'
    | 'recipes'
    | 'budget';
  summary: string;
}

export interface WorkspaceDataSlice {
  version: number;
  updatedAt: string;
  updatedBy: string;
  updatedByDeviceId?: string;
  lastActionId?: string;
  lastActionSummary: string;
  lastActionType:
    | 'calendar'
    | 'todo'
    | 'shopping'
    | 'photos'
    | 'notes'
    | 'recipes'
    | 'budget'
    | 'sync';
  recentActions?: CloudActionEvent[];
  categories?: EventCategory[];
  events?: CalendarEvent[];
  todos?: TodoItem[];
  notes?: NoteItem[];
  shopping?: ShoppingItem[];
  recipes?: RecipeItem[];
  budgetMonths?: BudgetMonth[];
  photos?: PhotoItem[];
  photoAlbums?: PhotoAlbum[];
}

export interface SharedHouseholdPayload extends WorkspaceDataSlice {
  initialized?: boolean;
  syncHash?: string;
  accounts?: UserAccount[];
  workspaces?: Record<string, WorkspaceDataSlice>;
  privateSlice?: Partial<WorkspaceDataSlice>;
}

export function getPrivateWorkspaceKey(email: string | undefined | null): string {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return 'default';
  return `priv_${cleanEmail}`;
}

export function resolveModuleWorkspaceKey(
  email: string | undefined | null,
  module: ShareableModule,
  accounts: UserAccount[] = []
): string {
  if (!email) return 'default';
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return 'default';

  // First check the user's own account: if the user has turned OFF sharing for this module
  // with a person, that person must NOT be linked into a shared workspace for this module.
  const myAccount = accounts.find(
    (a) => a.email.trim().toLowerCase() === cleanEmail
  );
  if (myAccount) {
    const mySharedTargets = (myAccount.connections || []).filter((c) =>
      isModuleSharedWithConnection(c, module)
    );
    if (mySharedTargets.length === 0) {
      return getPrivateWorkspaceKey(cleanEmail);
    }
  }

  const adj = new Map<string, Set<string>>();
  const ensureNode = (e: string) => {
    if (!adj.has(e)) adj.set(e, new Set());
  };

  ensureNode(cleanEmail);
  for (const acc of accounts) {
    const aMail = acc.email.trim().toLowerCase();
    ensureNode(aMail);
    for (const conn of acc.connections || []) {
      const cMail = conn.email.trim().toLowerCase();
      ensureNode(cMail);
      if (isModuleSharedWithConnection(conn, module)) {
        // If one of the endpoints is myAccount, respect myAccount's explicit switch setting
        if (myAccount && (aMail === cleanEmail || cMail === cleanEmail)) {
          const otherMail = aMail === cleanEmail ? cMail : aMail;
          const myConnToOther = (myAccount.connections || []).find(
            (mc) => mc.email.trim().toLowerCase() === otherMail
          );
          if (!myConnToOther || !isModuleSharedWithConnection(myConnToOther, module)) {
            continue;
          }
        }
        adj.get(aMail)!.add(cMail);
        adj.get(cMail)!.add(aMail);
      }
    }
  }

  const visited = new Set<string>([cleanEmail]);
  const queue: string[] = [cleanEmail];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adj.get(curr);
    if (neighbors) {
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
  }

  const groupEmails = Array.from(visited).sort();
  if (groupEmails.length <= 1) {
    return getPrivateWorkspaceKey(cleanEmail);
  }
  return `shared_${groupEmails.join('__')}`;
}

export function resolveWorkspaceKeyForEmail(
  email: string | undefined | null,
  accounts: UserAccount[] = []
): string {
  return resolveModuleWorkspaceKey(email, 'calendar', accounts);
}

function getDefaultInitialSliceForEmail(
  cleanEmail: string,
  actorName: string
): WorkspaceDataSlice {
  const nowIso = new Date().toISOString();
  const isFilip =
    cleanEmail === 'filipcarlberg91@gmail.com' ||
    cleanEmail === 'filip.carlberg@outlook.com';

  return {
    version: 1,
    updatedAt: nowIso,
    updatedBy: actorName || 'Familjemedlem',
    updatedByDeviceId: getDeviceId(),
    lastActionSummary: 'Initierade privat arbetsyta i Firebase',
    lastActionType: 'sync',
    recentActions: [],
    categories: isFilip ? RESTORED_FILIP_CATEGORIES : INITIAL_CATEGORIES,
    events: isFilip ? RESTORED_FILIP_EVENTS : [],
    todos: INITIAL_TODOS,
    notes: INITIAL_NOTES,
    shopping: [],
    recipes: INITIAL_RECIPES,
    budgetMonths: INITIAL_BUDGET_MONTHS,
    photos: [],
    photoAlbums: INITIAL_PHOTO_ALBUMS,
  };
}

function parseSliceDoc(
  docData: Record<string, any> | undefined,
  fallbackEmail: string,
  fallbackName: string
): WorkspaceDataSlice {
  if (!docData || typeof docData.sliceJson !== 'string') {
    return getDefaultInitialSliceForEmail(fallbackEmail, fallbackName);
  }
  try {
    const parsed = JSON.parse(docData.sliceJson) as WorkspaceDataSlice;
    return {
      ...parsed,
      version: typeof docData.version === 'number' ? docData.version : parsed.version || 1,
      updatedBy: docData.updatedBy || parsed.updatedBy || fallbackName,
      lastActionType: docData.lastActionType || parsed.lastActionType || 'sync',
      lastActionSummary: docData.lastActionSummary ?? parsed.lastActionSummary ?? '',
      categories: upgradeCategoriesToVibrant(parsed.categories),
    };
  } catch {
    return getDefaultInitialSliceForEmail(fallbackEmail, fallbackName);
  }
}

const photoBlobCache = new Map<string, string>();
const savedPhotoBlobIds = new Set<string>();

async function readFirestoreWorkspaceSlice(
  wsKey: string,
  cleanEmail: string,
  actorName: string
): Promise<WorkspaceDataSlice | null> {
  const docId = sanitizeFirestoreId(wsKey);
  const path = `workspaces/${docId}`;
  try {
    const snap = await getDoc(doc(db, 'workspaces', docId));
    if (!snap.exists()) return null;
    const parsed = parseSliceDoc(snap.data(), cleanEmail, actorName);
    if (Array.isArray(parsed.photos) && parsed.photos.length > 0) {
      await Promise.all(
        parsed.photos.map(async (p) => {
          if (!p || !p.id) return;
          if (p.imageUrl && p.imageUrl.startsWith('data:')) {
            photoBlobCache.set(p.id, p.imageUrl);
            savedPhotoBlobIds.add(p.id);
            return;
          }
          if (p.imageUrl === '__cloud_blob__' || !p.imageUrl) {
            const cachedUrl = photoBlobCache.get(p.id);
            if (cachedUrl) {
              p.imageUrl = cachedUrl;
              return;
            }
            try {
              const blobDocId = sanitizeFirestoreId(`photo_blob_${p.id}`);
              const blobSnap = await getDoc(doc(db, 'workspaces', blobDocId));
              if (blobSnap.exists()) {
                const imgData = blobSnap.data()?.imageUrl;
                if (typeof imgData === 'string' && imgData.length > 0) {
                  p.imageUrl = imgData;
                  photoBlobCache.set(p.id, imgData);
                  savedPhotoBlobIds.add(p.id);
                }
              }
            } catch {
              // Ignore transient blob fetch error
            }
          }
        })
      );
    }
    return parsed;
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.toLowerCase().includes('missing or insufficient permissions')
    ) {
      handleFirestoreError(err, OperationType.GET, path);
    }
    // Rethrow on transient network or quota (429) errors so callers NEVER
    // mistake a failed read for a non-existent document and overwrite data.
    throw err;
  }
}

async function writeFirestoreWorkspaceSlice(
  wsKey: string,
  slice: WorkspaceDataSlice,
  memberEmails: string[]
): Promise<void> {
  const user = await ensureFirebaseAuthSession();
  const myEmail =
    getEffectiveUserEmail(memberEmails[0]) ||
    user?.email?.trim().toLowerCase() ||
    'unknown@hem.app';
  if (!user) return;

  const docId = sanitizeFirestoreId(wsKey);
  const path = `workspaces/${docId}`;
  const ref = doc(db, 'workspaces', docId);

  const uniqueEmails = Array.from(
    new Set([myEmail, ...memberEmails.map((e) => e.trim().toLowerCase()).filter(Boolean)])
  ).slice(0, 10);

  // Persist individual photo blobs for any newly added photos so large galleries never hit Firestore's 1MB doc limit
  if (Array.isArray(slice.photos) && slice.photos.length > 0) {
    await Promise.all(
      slice.photos.map(async (p) => {
        if (!p || !p.id || !p.imageUrl || !p.imageUrl.startsWith('data:')) return;
        photoBlobCache.set(p.id, p.imageUrl);
        if (savedPhotoBlobIds.has(p.id)) return;
        try {
          const blobDocId = sanitizeFirestoreId(`photo_blob_${p.id}`);
          await setDoc(
            doc(db, 'workspaces', blobDocId),
            {
              ownerId: user.uid,
              photoId: p.id,
              imageUrl: p.imageUrl,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          savedPhotoBlobIds.add(p.id);
        } catch {
          // Ignore individual blob error; inline sliceJson will still hold what fits
        }
      })
    );
  }

  // Strip heavy redundant avatar base64 data from photo items if needed and offload older photo blobs if sliceJson > 720 KB
  const sliceForDoc: WorkspaceDataSlice = {
    ...slice,
    photos: Array.isArray(slice.photos)
      ? slice.photos.map((p) => ({
          ...p,
          uploadedByAvatarDataUrl:
            p.uploadedByAvatarDataUrl && p.uploadedByAvatarDataUrl.length > 12000
              ? undefined
              : p.uploadedByAvatarDataUrl,
        }))
      : slice.photos,
  };

  let sliceJson = JSON.stringify(sliceForDoc);
  if (sliceJson.length > 720000 && Array.isArray(sliceForDoc.photos)) {
    const clonedPhotos = sliceForDoc.photos.map((p) => ({ ...p }));
    for (let i = clonedPhotos.length - 1; i >= 0 && sliceJson.length > 720000; i--) {
      if (clonedPhotos[i].imageUrl && clonedPhotos[i].imageUrl !== '__cloud_blob__') {
        clonedPhotos[i].imageUrl = '__cloud_blob__';
        sliceJson = JSON.stringify({ ...sliceForDoc, photos: clonedPhotos });
      }
    }
  }

  const validActionType =
    slice.lastActionType === 'calendar' ||
    slice.lastActionType === 'todo' ||
    slice.lastActionType === 'shopping' ||
    slice.lastActionType === 'photos' ||
    slice.lastActionType === 'notes' ||
    slice.lastActionType === 'recipes' ||
    slice.lastActionType === 'budget' ||
    slice.lastActionType === 'sync'
      ? slice.lastActionType
      : 'sync';

  const safeUpdatedBy = (slice.updatedBy || 'Familjemedlem').slice(0, 100);
  const safeSummary = (slice.lastActionSummary || '').slice(0, 300);
  const safeVersion = Math.max(1, Math.floor(slice.version || 1));

  try {
    await setDoc(
      ref,
      {
        ownerId: user.uid,
        memberEmails: uniqueEmails,
        version: safeVersion,
        updatedBy: safeUpdatedBy,
        lastActionType: validActionType,
        lastActionSummary: safeSummary,
        sliceJson,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

async function fetchDirectoryAccount(email: string): Promise<UserAccount | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;
  const dirId = sanitizeFirestoreId(cleanEmail);
  const path = `userDirectory/${dirId}`;
  try {
    const snap = await getDoc(doc(db, 'userDirectory', dirId));
    if (!snap.exists()) return null;
    const data = snap.data();
    let connections: FriendConnection[] = [];
    try {
      connections = JSON.parse(data.connectionsJson || '[]');
    } catch {
      connections = [];
    }
    return {
      id: data.ownerId || dirId,
      email: data.email || cleanEmail,
      passwordHash: 'firebase-auth',
      name: data.name || cleanEmail.split('@')[0],
      roleTitle: '',
      avatarColor: data.avatarColor || '#183D2C',
      connections,
      createdAt: new Date().toISOString(),
      updatedAt: data.connectionsUpdatedAt || new Date().toISOString(),
    };
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.toLowerCase().includes('missing or insufficient permissions')
    ) {
      handleFirestoreError(err, OperationType.GET, path);
    }
    return null;
  }
}

const LEGACY_MIGRATED_PASSWORD_HASHES: Record<string, string> = {
  'filip.carlberg@outlook.com':
    '0e987d9c15aa2bf6317b3771ae478e74b644da6ac257ef44138dfe5a877baf16',
  'filipcarlberg91@gmail.com':
    '0e987d9c15aa2bf6317b3771ae478e74b644da6ac257ef44138dfe5a877baf16',
  'feliciacarlberg@hotmail.com':
    '35b488018f9dadfe9848bab4bccd9876e7642565d5de576c6d05a0aa247fd0dc',
};

let authSessionPromise: Promise<any> | null = null;

export async function ensureFirebaseAuthSession(): Promise<any> {
  if (auth.currentUser) return auth.currentUser;
  if (authSessionPromise) return authSessionPromise;

  authSessionPromise = (async () => {
    try {
      if (typeof (auth as any).authStateReady === 'function') {
        await (auth as any).authStateReady();
      }
      if (auth.currentUser) return auth.currentUser;
      const cred = await signInAnonymously(auth);
      return cred.user;
    } catch {
      return auth.currentUser;
    } finally {
      authSessionPromise = null;
    }
  })();

  return authSessionPromise;
}

export function getEffectiveUserEmail(explicitEmail?: string | null): string | null {
  if (explicitEmail && explicitEmail.trim().includes('@')) {
    return explicitEmail.trim().toLowerCase();
  }
  if (auth.currentUser?.email && auth.currentUser.email.trim().includes('@')) {
    return auth.currentUser.email.trim().toLowerCase();
  }
  try {
    const override = localStorage.getItem('vn_auth_email_override');
    if (override && override.trim().includes('@')) {
      return override.trim().toLowerCase();
    }
    const rawAcc =
      localStorage.getItem('vn_active_account_v1') ||
      localStorage.getItem('vn_current_account_v1');
    if (rawAcc) {
      const parsed = JSON.parse(rawAcc);
      if (parsed?.email && String(parsed.email).trim().includes('@')) {
        return String(parsed.email).trim().toLowerCase();
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

const accountCacheByEmail = new Map<
  string,
  {
    ts: number;
    data: { account: UserAccount; allAccounts: UserAccount[] };
  }
>();

const privateSliceCacheByEmail = new Map<
  string,
  {
    ts: number;
    slice: WorkspaceDataSlice;
  }
>();

async function upsertMyUserProfileAndDirectory(
  account: UserAccount,
  removedEmails: string[] = []
): Promise<void> {
  const user = await ensureFirebaseAuthSession();
  const cleanEmail = getEffectiveUserEmail(account.email);
  if (!user || !cleanEmail) return;
  accountCacheByEmail.delete(cleanEmail);

  const nowIso = new Date().toISOString();
  const dirId = sanitizeFirestoreId(cleanEmail);
  const canonicalUserId = user.email ? user.uid : account.id || dirId;
  const safeName = (account.name || cleanEmail.split('@')[0]).trim().slice(0, 100) || 'Användare';
  const safeRole = (account.roleTitle || '').trim().slice(0, 80);
  const safeColor = (account.avatarColor || '#183D2C').trim().slice(0, 16);

  const normalizedConnections: FriendConnection[] = (account.connections || []).map((c) => {
    const mods = getConnectionSharedModules(c);
    const allOn = ALL_SHAREABLE_MODULES.every((m) => mods[m]);
    return {
      ...c,
      email: c.email.trim().toLowerCase(),
      shareAll: allOn,
      sharedModules: { ...mods },
      addedAt: c.addedAt || nowIso,
      updatedAt: nowIso,
    };
  });

  const profileJson = JSON.stringify({
    ...account,
    id: canonicalUserId,
    email: cleanEmail,
    passwordHash: 'firebase-auth',
    connections: normalizedConnections,
    updatedAt: nowIso,
  }).slice(0, 240000);
  const connectionsJson = JSON.stringify(normalizedConnections).slice(0, 190000);

  const emailUserPath = `users/${dirId}`;
  const emailUserRef = doc(db, 'users', dirId);
  const dirPath = `userDirectory/${dirId}`;
  const dirRef = doc(db, 'userDirectory', dirId);

  const userPayload = {
    uid: canonicalUserId,
    email: cleanEmail,
    name: safeName,
    roleTitle: safeRole,
    avatarColor: safeColor,
    profileJson,
    connectionsUpdatedAt: nowIso,
    updatedAt: serverTimestamp(),
  };

  const writes: Promise<any>[] = [
    setDoc(emailUserRef, userPayload, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, emailUserPath)
    ),
    setDoc(
      dirRef,
      {
        ownerId: canonicalUserId,
        email: cleanEmail,
        name: safeName,
        avatarColor: safeColor,
        connectionsJson,
        connectionsUpdatedAt: nowIso,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => handleFirestoreError(err, OperationType.WRITE, dirPath)),
  ];

  if (user.uid && user.uid !== dirId) {
    writes.push(
      setDoc(doc(db, 'users', user.uid), userPayload, { merge: true }).catch(() => {})
    );
  }

  await Promise.all(writes);

  // 3. Remove reciprocal entry from any explicitly removed friends in parallel
  const removePromises = removedEmails.map(async (remEmail) => {
    const targetEmail = (remEmail || '').trim().toLowerCase();
    if (!targetEmail || targetEmail === cleanEmail) return;
    const targetDirId = sanitizeFirestoreId(targetEmail);
    const targetRef = doc(db, 'userDirectory', targetDirId);
    try {
      const targetSnap = await getDoc(targetRef);
      if (targetSnap.exists()) {
        const tData = targetSnap.data();
        let tConns: FriendConnection[] = [];
        try {
          tConns = JSON.parse(tData.connectionsJson || '[]');
        } catch {
          tConns = [];
        }
        const filtered = tConns.filter((c) => c.email.trim().toLowerCase() !== cleanEmail);
        await updateDoc(targetRef, {
          connectionsJson: JSON.stringify(filtered).slice(0, 190000),
          connectionsUpdatedAt: nowIso,
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      // Ignore if friend directory entry does not exist
    }
  });

  // 4. Bilateral sync: update each connected friend's directory entry in parallel
  const bilateralPromises = normalizedConnections.map(async (conn) => {
    const targetEmail = (conn.email || '').trim().toLowerCase();
    if (!targetEmail || targetEmail === cleanEmail) return;
    const targetDirId = sanitizeFirestoreId(targetEmail);
    const targetRef = doc(db, 'userDirectory', targetDirId);
    try {
      const targetSnap = await getDoc(targetRef);
      if (targetSnap.exists()) {
        const tData = targetSnap.data();
        let tConns: FriendConnection[] = [];
        try {
          tConns = JSON.parse(tData.connectionsJson || '[]');
        } catch {
          tConns = [];
        }
        const normalizedMods = getConnectionSharedModules(conn);
        const allOn = ALL_SHAREABLE_MODULES.every((m) => normalizedMods[m]);
        const idx = tConns.findIndex((c) => c.email.trim().toLowerCase() === cleanEmail);
        const revEntry: FriendConnection = {
          email: cleanEmail,
          name: safeName,
          avatarDataUrl: account.avatarDataUrl,
          avatarColor: safeColor,
          shareAll: allOn,
          sharedModules: { ...normalizedMods },
          addedAt: conn.addedAt || nowIso,
          updatedAt: nowIso,
        };
        if (idx >= 0) {
          tConns[idx] = revEntry;
        } else {
          tConns.push(revEntry);
        }
        await updateDoc(targetRef, {
          connectionsJson: JSON.stringify(tConns).slice(0, 190000),
          connectionsUpdatedAt: nowIso,
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      // Friend might not have registered yet
    }
  });

  await Promise.all([...removePromises, ...bilateralPromises]);
}

function mergeConnectionsByLatestTimestamp(
  profileConns: FriendConnection[],
  dirConns: FriendConnection[],
  profileUpdatedAt?: string,
  dirUpdatedAt?: string
): FriendConnection[] {
  // If profile was updated more recently than or at the same time as directory,
  // start with profileConns as the authoritative set of connections
  const profileNewerOrEqual =
    Boolean(profileUpdatedAt) &&
    (!dirUpdatedAt || (profileUpdatedAt || '') >= dirUpdatedAt);

  const baseList = profileNewerOrEqual ? profileConns : dirConns.length > 0 ? dirConns : profileConns;
  const secondaryList = profileNewerOrEqual ? dirConns : profileConns;

  const map = new Map<string, FriendConnection>();
  for (const c of baseList) {
    if (!c || !c.email) continue;
    const key = c.email.trim().toLowerCase();
    const mods = getConnectionSharedModules(c);
    map.set(key, {
      ...c,
      email: key,
      shareAll: ALL_SHAREABLE_MODULES.every((m) => mods[m]),
      sharedModules: { ...mods },
    });
  }

  for (const sc of secondaryList) {
    if (!sc || !sc.email) continue;
    const key = sc.email.trim().toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      // Only include an extra connection from directory if directory is newer than profile
      if (!profileNewerOrEqual) {
        const mods = getConnectionSharedModules(sc);
        map.set(key, {
          ...sc,
          email: key,
          shareAll: ALL_SHAREABLE_MODULES.every((m) => mods[m]),
          sharedModules: { ...mods },
        });
      }
    } else if (sc.updatedAt && existing.updatedAt && sc.updatedAt > existing.updatedAt) {
      const mods = getConnectionSharedModules(sc);
      map.set(key, {
        ...sc,
        email: key,
        shareAll: ALL_SHAREABLE_MODULES.every((m) => mods[m]),
        sharedModules: { ...mods },
      });
    }
  }

  return Array.from(map.values());
}

async function loadMyAccountAndKnownAccounts(
  explicitEmail?: string | null,
  forceRefresh = false
): Promise<{
  account: UserAccount;
  allAccounts: UserAccount[];
} | null> {
  const user = await ensureFirebaseAuthSession();
  const cleanEmail = getEffectiveUserEmail(explicitEmail);
  if (!user || !cleanEmail) return null;

  const cached = accountCacheByEmail.get(cleanEmail);
  if (!forceRefresh && cached && Date.now() - cached.ts < 60000) {
    return cached.data;
  }

  const dirId = sanitizeFirestoreId(cleanEmail);
  const emailUserRef = doc(db, 'users', dirId);
  const dirRef = doc(db, 'userDirectory', dirId);

  let myAccount: UserAccount | null = null;
  let profileUpdatedAt: string | undefined;
  let dirConns: FriendConnection[] = [];
  let dirUpdatedAt: string | undefined;
  let dirDataObj: any = null;

  const [emailUserSnapRes, dirSnapRes] = await Promise.allSettled([
    getDoc(emailUserRef),
    getDoc(dirRef),
  ]);

  // If either read failed due to network or quota (429), abort instead of
  // assuming the user has no profile/connections and overwriting them!
  if (emailUserSnapRes.status === 'rejected' || dirSnapRes.status === 'rejected') {
    if (cached) return cached.data;
    return null;
  }

  const candidateUserSnaps: any[] = [];
  if (emailUserSnapRes.value?.exists()) {
    candidateUserSnaps.push(emailUserSnapRes.value.data());
  } else if (user.uid !== dirId) {
    try {
      const uidSnap = await getDoc(doc(db, 'users', user.uid));
      if (uidSnap.exists()) {
        candidateUserSnaps.push(uidSnap.data());
      }
    } catch {
      if (cached) return cached.data;
      return null;
    }
  }

  for (const d of candidateUserSnaps) {
    try {
      const parsed = JSON.parse(d.profileJson) as UserAccount;
      if (parsed.email?.trim().toLowerCase() !== cleanEmail) continue;
      parsed.passwordHash = 'firebase-auth';
      const ts = d.connectionsUpdatedAt || parsed.updatedAt || '';
      if (!myAccount || ts > (profileUpdatedAt || '')) {
        myAccount = parsed;
        profileUpdatedAt = ts;
      }
    } catch {
      // Ignore parse error
    }
  }

  if (dirSnapRes.value.exists()) {
    dirDataObj = dirSnapRes.value.data();
    dirUpdatedAt = dirDataObj.connectionsUpdatedAt;
    try {
      dirConns = JSON.parse(dirDataObj.connectionsJson || '[]');
    } catch {
      dirConns = [];
    }
  }

  if (myAccount) {
    const mergedConns = mergeConnectionsByLatestTimestamp(
      myAccount.connections || [],
      dirConns,
      profileUpdatedAt,
      dirUpdatedAt
    );
    myAccount = {
      ...myAccount,
      passwordHash: 'firebase-auth',
      connections: mergedConns,
    };
  }

  const nowIso = new Date().toISOString();
  if (!myAccount) {
    // Check if we have a locally stored account with connections before creating a blank one
    let localConnections: FriendConnection[] = dirConns;
    try {
      const rawLocal =
        localStorage.getItem('vn_active_account_v1') ||
        localStorage.getItem('vn_current_account_v1');
      if (rawLocal) {
        const parsedLocal = JSON.parse(rawLocal) as UserAccount;
        if (
          parsedLocal?.email?.trim().toLowerCase() === cleanEmail &&
          Array.isArray(parsedLocal.connections) &&
          parsedLocal.connections.length > localConnections.length
        ) {
          localConnections = parsedLocal.connections;
        }
      }
    } catch {
      // Ignore storage error
    }

    myAccount = {
      id: user.uid,
      email: cleanEmail,
      passwordHash: 'firebase-auth',
      name:
        dirDataObj?.name ||
        user.displayName ||
        (cleanEmail.includes('filip') ? 'Filip Carlberg' : cleanEmail.split('@')[0]),
      roleTitle: '',
      avatarColor: dirDataObj?.avatarColor || '#183D2C',
      connections: localConnections,
      isPrimaryFounder:
        cleanEmail === 'filipcarlberg91@gmail.com' ||
        cleanEmail === 'filip.carlberg@outlook.com',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await upsertMyUserProfileAndDirectory(myAccount);
  }

  const friendResults = await Promise.all(
    (myAccount.connections || []).map(async (conn) => {
      const friendAcc = await fetchDirectoryAccount(conn.email);
      if (friendAcc) return friendAcc;
      return {
        id: `pending-${conn.email}`,
        email: conn.email.trim().toLowerCase(),
        passwordHash: 'pending',
        name: conn.name || conn.email.split('@')[0],
        avatarColor: conn.avatarColor || '#143B5D',
        connections: [
          {
            email: cleanEmail,
            name: myAccount!.name,
            avatarColor: myAccount!.avatarColor,
            shareAll: conn.shareAll,
            sharedModules: getConnectionSharedModules(conn),
            addedAt: conn.addedAt || nowIso,
            updatedAt: conn.updatedAt || nowIso,
          },
        ],
        createdAt: nowIso,
        updatedAt: nowIso,
      } as UserAccount;
    })
  );

  const knownAccounts: UserAccount[] = [myAccount, ...friendResults];
  const result = { account: myAccount, allAccounts: knownAccounts };
  accountCacheByEmail.set(cleanEmail, { ts: Date.now(), data: result });
  return result;
}

function computePayloadSyncHash(payload: {
  version: number;
  accounts?: UserAccount[];
  events?: CalendarEvent[];
  todos?: TodoItem[];
  notes?: NoteItem[];
  shopping?: ShoppingItem[];
  recipes?: RecipeItem[];
  budgetMonths?: BudgetMonth[];
  photos?: PhotoItem[];
  photoAlbums?: PhotoAlbum[];
  categories?: EventCategory[];
}): string {
  const connPart = (payload.accounts || [])
    .map(
      (a) =>
        `${a.email}:${(a.connections || [])
          .map((c) => {
            const m = getConnectionSharedModules(c);
            return `${c.email}[${ALL_SHAREABLE_MODULES.map((k) => (m[k] ? 1 : 0)).join('')}]`;
          })
          .join(',')}`
    )
    .join(';');
  const budPart = (payload.budgetMonths || [])
    .map(
      (m) =>
        `${m.monthKey}:${(m.entries || [])
          .map((e) => `${e.id}=${e.amount}:${e.title}:${e.type}:${e.dayOfMonth}`)
          .join(',')}`
    )
    .join('|');
  const evtPart = `${(payload.events || []).length}:${(payload.events || [])
    .slice(-8)
    .map((e) => `${e.id}:${e.title}:${e.date}:${e.updatedAt || ''}`)
    .join(',')}`;
  const todoPart = `${(payload.todos || []).length}:${(payload.todos || [])
    .map((t) => `${t.id}:${t.completed ? 1 : 0}:${t.favorite ? 1 : 0}:${t.updatedAt || ''}`)
    .join(',')}`;
  const notePart = `${(payload.notes || []).length}:${(payload.notes || [])
    .map(
      (n) =>
        `${n.id}:${n.title}:${n.favorite ? 1 : 0}:${(n.checklistItems || [])
          .map((c) => (c.checked ? 1 : 0))
          .join('')}:${n.updatedAt || ''}`
    )
    .join(',')}`;
  const shopPart = `${(payload.shopping || []).length}:${(payload.shopping || [])
    .map((s) => `${s.id}:${s.checked ? 1 : 0}:${s.amount}:${s.favorite ? 1 : 0}`)
    .join(',')}`;
  const recPart = `${(payload.recipes || []).length}:${(payload.recipes || [])
    .map((r) => `${r.id}:${r.rating}:${r.favorite ? 1 : 0}:${r.title}:${(r.imageUrl || '').length}`)
    .join(',')}`;
  const photoPart = `${(payload.photos || []).length}:${(payload.photoAlbums || []).length}:${(
    payload.photos || []
  )
    .slice(0, 10)
    .map(
      (p) =>
        `${p.id}:${p.albumId || ''}:${p.favorite ? 1 : 0}:${(p.reactions || []).length}:${
          (p.comments || []).length
        }`
    )
    .join(',')}`;

  return `v${payload.version}__c[${connPart}]__b[${budPart}]__e[${evtPart}]__t[${todoPart}]__n[${notePart}]__s[${shopPart}]__r[${recPart}]__p[${photoPart}]`;
}

export async function fetchHouseholdState(
  activeUserEmail?: string | null
): Promise<SharedHouseholdPayload | null> {
  const user = await ensureFirebaseAuthSession();
  const cleanEmail = getEffectiveUserEmail(activeUserEmail);
  if (!user || !cleanEmail) return null;

  const loaded = await loadMyAccountAndKnownAccounts(cleanEmail);
  if (!loaded) return null;

  const { account, allAccounts } = loaded;
  const privKey = getPrivateWorkspaceKey(cleanEmail);

  const anyPrivateModule = ALL_SHAREABLE_MODULES.some(
    (mod) => resolveModuleWorkspaceKey(cleanEmail, mod, allAccounts) === privKey
  );
  const cachedPriv = privateSliceCacheByEmail.get(cleanEmail);

  let privSlice: WorkspaceDataSlice | null = null;
  if (!anyPrivateModule && cachedPriv && Date.now() - cachedPriv.ts < 60000) {
    privSlice = cachedPriv.slice;
  } else {
    privSlice = await readFirestoreWorkspaceSlice(privKey, cleanEmail, account.name);
    if (!privSlice) {
      privSlice = getDefaultInitialSliceForEmail(cleanEmail, account.name);
      await writeFirestoreWorkspaceSlice(privKey, privSlice, [cleanEmail]);
    }
    privateSliceCacheByEmail.set(cleanEmail, { ts: Date.now(), slice: privSlice });
  }

  // Cache slice reads by wsKey so shared modules only read the shared Firestore doc ONCE
  const sliceCache = new Map<string, Promise<WorkspaceDataSlice>>();
  sliceCache.set(privKey, Promise.resolve(privSlice));

  const getSliceForMod = (mod: ShareableModule): Promise<WorkspaceDataSlice> => {
    const wsKey = resolveModuleWorkspaceKey(cleanEmail, mod, allAccounts);
    if (sliceCache.has(wsKey)) {
      return sliceCache.get(wsKey)!;
    }
    const promise = (async () => {
      const sharedSlice = await readFirestoreWorkspaceSlice(wsKey, cleanEmail, account.name);
      if (sharedSlice) return sharedSlice;
      const emptyShared: WorkspaceDataSlice = {
        version: 1,
        updatedAt: new Date().toISOString(),
        updatedBy: account.name,
        updatedByDeviceId: getDeviceId(),
        lastActionSummary: 'Delad sida skapad',
        lastActionType: 'sync',
        recentActions: [],
        categories: privSlice!.categories || INITIAL_CATEGORIES,
        events: [],
        todos: [],
        notes: [],
        shopping: [],
        recipes: [],
        budgetMonths: INITIAL_BUDGET_MONTHS,
        photos: [],
        photoAlbums: [],
      };
      return emptyShared;
    })();
    sliceCache.set(wsKey, promise);
    return promise;
  };

  const [calSlice, todoSlice, notesSlice, shopSlice, recSlice, budSlice, photoSlice] =
    await Promise.all([
      getSliceForMod('calendar'),
      getSliceForMod('todo'),
      getSliceForMod('notes'),
      getSliceForMod('shopping'),
      getSliceForMod('recipes'),
      getSliceForMod('budget'),
      getSliceForMod('photos'),
    ]);

  const allSlices = [
    privSlice,
    calSlice,
    todoSlice,
    notesSlice,
    shopSlice,
    recSlice,
    budSlice,
    photoSlice,
  ];

  const actionById = new Map<string, CloudActionEvent>();
  for (const s of allSlices) {
    for (const act of s.recentActions || []) {
      if (act && act.id && !actionById.has(act.id)) {
        actionById.set(act.id, act);
      }
    }
  }
  const mergedActions = Array.from(actionById.values())
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 30);

  const maxVersion = Math.max(1, ...allSlices.map((s) => s.version || 1));

  const categories = upgradeCategoriesToVibrant(calSlice.categories || privSlice.categories);
  const events =
    calSlice.events && calSlice.events.length > 0
      ? calSlice.events
      : (privSlice.events ?? []);
  const todos = Array.isArray(todoSlice.todos)
    ? todoSlice.todos
    : (privSlice.todos ?? []);
  const notes = Array.isArray(notesSlice.notes)
    ? notesSlice.notes
    : (privSlice.notes ?? []);
  const shopping = Array.isArray(shopSlice.shopping)
    ? shopSlice.shopping
    : (privSlice.shopping ?? []);
  const recipes = Array.isArray(recSlice.recipes)
    ? recSlice.recipes
    : (privSlice.recipes ?? []);
  const budHasEntries = (budSlice.budgetMonths || []).some(
    (m) => Array.isArray(m.entries) && m.entries.length > 0
  );
  const privBudHasEntries = (privSlice.budgetMonths || []).some(
    (m) => Array.isArray(m.entries) && m.entries.length > 0
  );
  const budgetMonths = budHasEntries
    ? budSlice.budgetMonths!
    : privBudHasEntries
    ? privSlice.budgetMonths!
    : budSlice.budgetMonths ?? INITIAL_BUDGET_MONTHS;
  const photos = Array.isArray(photoSlice.photos)
    ? photoSlice.photos
    : (privSlice.photos ?? []);
  const photoAlbums = Array.isArray(photoSlice.photoAlbums)
    ? photoSlice.photoAlbums
    : (privSlice.photoAlbums ?? []);

  // If shopping or todo is shared and privSlice still holds stale leftover items (e.g. "Mjölk"),
  // clean privSlice in Firestore so neither web nor Android native background sync can ever resurrect them.
  const shopWsKey = resolveModuleWorkspaceKey(cleanEmail, 'shopping', allAccounts);
  const todoWsKey = resolveModuleWorkspaceKey(cleanEmail, 'todo', allAccounts);
  let privNeedsCleanup = false;
  if (
    shopWsKey !== privKey &&
    JSON.stringify(privSlice.shopping || []) !== JSON.stringify(shopping)
  ) {
    privSlice.shopping = shopping;
    privNeedsCleanup = true;
  }
  if (
    todoWsKey !== privKey &&
    JSON.stringify(privSlice.todos || []) !== JSON.stringify(todos)
  ) {
    privSlice.todos = todos;
    privNeedsCleanup = true;
  }
  if (privNeedsCleanup) {
    privateSliceCacheByEmail.set(cleanEmail, { ts: Date.now(), slice: privSlice });
    writeFirestoreWorkspaceSlice(privKey, privSlice, [cleanEmail]).catch(() => {});
  }

  const syncHash = computePayloadSyncHash({
    version: maxVersion,
    accounts: allAccounts,
    categories,
    events,
    todos,
    notes,
    shopping,
    recipes,
    budgetMonths,
    photos,
    photoAlbums,
  });

  return {
    initialized: true,
    version: maxVersion,
    syncHash,
    updatedAt: new Date().toISOString(),
    updatedBy: account.name,
    lastActionSummary: mergedActions[0]?.summary || privSlice.lastActionSummary,
    lastActionType: mergedActions[0]?.actionType || 'sync',
    recentActions: mergedActions,
    accounts: allAccounts,
    privateSlice: privSlice,
    categories,
    events,
    todos,
    notes,
    shopping,
    recipes,
    budgetMonths,
    photos,
    photoAlbums,
  };
}

function getGroupEmailsForModule(
  cleanEmail: string,
  mod: ShareableModule,
  accounts: UserAccount[]
): string[] {
  const wsKey = resolveModuleWorkspaceKey(cleanEmail, mod, accounts);
  if (!wsKey.startsWith('shared_')) {
    return [cleanEmail];
  }
  return wsKey
    .slice('shared_'.length)
    .split('__')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function saveHouseholdState(
  payload: Omit<SharedHouseholdPayload, 'version' | 'updatedAt' | 'initialized'>,
  currentVersion: number,
  activeUserEmail?: string | null,
  changedModules?: ShareableModule[]
): Promise<number> {
  const user = await ensureFirebaseAuthSession();
  const cleanEmail = getEffectiveUserEmail(activeUserEmail);
  if (!user || !cleanEmail) return currentVersion;

  const loaded = await loadMyAccountAndKnownAccounts(cleanEmail);
  if (!loaded) return currentVersion;

  const { account, allAccounts } = loaded;
  const nextVersion = Math.max(1, currentVersion + 1);
  const nowIso = new Date().toISOString();
  const myDeviceId = getDeviceId();
  const myDeviceLabel = getDeviceLabel();
  const actionId = `act-${nextVersion}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const changedSet =
    changedModules && changedModules.length > 0 ? new Set<ShareableModule>(changedModules) : null;
  const shouldSaveModule = (mod: ShareableModule) => !changedSet || changedSet.has(mod);

  const slicesByKey = new Map<
    string,
    { slice: WorkspaceDataSlice; memberEmails: string[] }
  >();

  const ensureLoadedSliceByKey = async (
    wsKey: string,
    memberEmails: string[]
  ): Promise<{ wsKey: string; slice: WorkspaceDataSlice; memberEmails: string[] }> => {
    if (!slicesByKey.has(wsKey)) {
      const existing =
        (await readFirestoreWorkspaceSlice(wsKey, cleanEmail, account.name)) ||
        getDefaultInitialSliceForEmail(cleanEmail, account.name);
      const bumpedVersion = Math.max(nextVersion, (existing.version || 0) + 1);
      slicesByKey.set(wsKey, {
        slice: {
          ...existing,
          version: bumpedVersion,
          updatedAt: nowIso,
          updatedBy: payload.updatedBy || account.name,
          updatedByDeviceId: myDeviceId,
          lastActionSummary: payload.lastActionSummary || existing.lastActionSummary || '',
        },
        memberEmails,
      });
    }
    const entry = slicesByKey.get(wsKey)!;
    return { wsKey, slice: entry.slice, memberEmails: entry.memberEmails };
  };

  const ensureLoadedSlice = async (
    mod: ShareableModule
  ): Promise<{ wsKey: string; slice: WorkspaceDataSlice; memberEmails: string[] }> => {
    const wsKey = resolveModuleWorkspaceKey(cleanEmail, mod, allAccounts);
    const memberEmails = getGroupEmailsForModule(cleanEmail, mod, allAccounts);
    return ensureLoadedSliceByKey(wsKey, memberEmails);
  };

  const privKey = getPrivateWorkspaceKey(cleanEmail);

  if (
    shouldSaveModule('calendar') &&
    (payload.categories !== undefined || payload.events !== undefined)
  ) {
    const calEntry = await ensureLoadedSlice('calendar');
    if (payload.categories !== undefined) {
      calEntry.slice.categories = upgradeCategoriesToVibrant(payload.categories);
    }
    if (payload.events !== undefined) {
      calEntry.slice.events = payload.events;
    }
  }

  if (shouldSaveModule('todo') && payload.todos !== undefined) {
    const todoEntry = await ensureLoadedSlice('todo');
    todoEntry.slice.todos = payload.todos;
    if (todoEntry.wsKey !== privKey) {
      const privEntry = await ensureLoadedSliceByKey(privKey, [cleanEmail]);
      privEntry.slice.todos = payload.todos;
    }
  }

  if (shouldSaveModule('notes') && payload.notes !== undefined) {
    const notesEntry = await ensureLoadedSlice('notes');
    notesEntry.slice.notes = payload.notes;
    if (notesEntry.wsKey !== privKey) {
      const privEntry = await ensureLoadedSliceByKey(privKey, [cleanEmail]);
      privEntry.slice.notes = payload.notes;
    }
  }

  if (shouldSaveModule('shopping') && payload.shopping !== undefined) {
    const shopEntry = await ensureLoadedSlice('shopping');
    shopEntry.slice.shopping = payload.shopping;
    if (shopEntry.wsKey !== privKey) {
      const privEntry = await ensureLoadedSliceByKey(privKey, [cleanEmail]);
      privEntry.slice.shopping = payload.shopping;
    }
  }

  if (shouldSaveModule('recipes') && payload.recipes !== undefined) {
    const recEntry = await ensureLoadedSlice('recipes');
    recEntry.slice.recipes = payload.recipes;
    if (recEntry.wsKey !== privKey) {
      const privEntry = await ensureLoadedSliceByKey(privKey, [cleanEmail]);
      privEntry.slice.recipes = payload.recipes;
    }
  }

  if (shouldSaveModule('budget') && payload.budgetMonths !== undefined) {
    const budEntry = await ensureLoadedSlice('budget');
    budEntry.slice.budgetMonths = payload.budgetMonths;
  }

  if (
    shouldSaveModule('photos') &&
    (payload.photos !== undefined || payload.photoAlbums !== undefined)
  ) {
    const photoEntry = await ensureLoadedSlice('photos');
    if (payload.photos !== undefined) {
      photoEntry.slice.photos = payload.photos;
    }
    if (payload.photoAlbums !== undefined) {
      photoEntry.slice.photoAlbums = payload.photoAlbums;
    }
  }

  if (
    payload.lastActionType === 'calendar' ||
    payload.lastActionType === 'todo' ||
    payload.lastActionType === 'shopping' ||
    payload.lastActionType === 'photos' ||
    payload.lastActionType === 'notes' ||
    payload.lastActionType === 'recipes' ||
    payload.lastActionType === 'budget'
  ) {
    const actionEntry = await ensureLoadedSlice(payload.lastActionType);
    const prevActions = Array.isArray(actionEntry.slice.recentActions)
      ? actionEntry.slice.recentActions
      : [];
    const newAction: CloudActionEvent = {
      id: actionId,
      createdAt: nowIso,
      deviceId: myDeviceId,
      deviceLabel: myDeviceLabel,
      actorName: payload.updatedBy || account.name,
      actorEmail: cleanEmail,
      actionType: payload.lastActionType,
      summary: payload.lastActionSummary,
    };
    actionEntry.slice.recentActions = [newAction, ...prevActions].slice(0, 25);
    actionEntry.slice.lastActionId = actionId;
    actionEntry.slice.lastActionType = payload.lastActionType;
    actionEntry.slice.lastActionSummary = payload.lastActionSummary;
  }

  let highestWrittenVersion = nextVersion;
  await Promise.all(
    Array.from(slicesByKey.entries()).map(async ([wsKey, entry]) => {
      if (entry.slice.version > highestWrittenVersion) {
        highestWrittenVersion = entry.slice.version;
      }
      if (wsKey === privKey) {
        privateSliceCacheByEmail.set(cleanEmail, { ts: Date.now(), slice: entry.slice });
      }
      await writeFirestoreWorkspaceSlice(wsKey, entry.slice, entry.memberEmails);
    })
  );

  return highestWrittenVersion;
}

export async function loginWithGoogleCloudAccount(): Promise<{
  account: UserAccount;
  allAccounts: UserAccount[];
}> {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;
  if (!user || !user.email) {
    throw new Error('Kunde inte hämta e-postadress från ditt Google-konto.');
  }
  const loaded = await loadMyAccountAndKnownAccounts();
  if (!loaded) {
    throw new Error('Kunde inte ladda din profil från Firebase.');
  }
  return loaded;
}

export async function registerCloudAccount(params: {
  email: string;
  password: string;
  name: string;
  roleTitle?: string;
  avatarDataUrl?: string;
  avatarColor: string;
}): Promise<{ account: UserAccount; allAccounts: UserAccount[] }> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Ange en giltig e-postadress.');
  }
  if (!params.password || params.password.length < 6) {
    throw new Error('Välj ett lösenord med minst 6 tecken.');
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
    const nowIso = new Date().toISOString();
    const newAccount: UserAccount = {
      id: cred.user.uid,
      email: cleanEmail,
      passwordHash: 'firebase-auth',
      name: params.name.trim() || cleanEmail.split('@')[0],
      roleTitle: params.roleTitle?.trim() || '',
      avatarDataUrl: params.avatarDataUrl,
      avatarColor: params.avatarColor || '#183D2C',
      connections: [],
      isPrimaryFounder:
        cleanEmail === 'filipcarlberg91@gmail.com' ||
        cleanEmail === 'filip.carlberg@outlook.com',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await upsertMyUserProfileAndDirectory(newAccount);
    const loaded = await loadMyAccountAndKnownAccounts();
    return loaded || { account: newAccount, allAccounts: [newAccount] };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') {
      return loginCloudAccount(cleanEmail, params.password);
    }
    throw new Error(err?.message || 'Kunde inte skapa konto.');
  }
}

export async function loginCloudAccount(
  email: string,
  password: string
): Promise<{ account: UserAccount; allAccounts: UserAccount[] }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await signInWithEmailAndPassword(auth, cleanEmail, password);
    try {
      localStorage.setItem('vn_auth_email_override', cleanEmail);
    } catch {
      // Ignore
    }
    const loaded = await loadMyAccountAndKnownAccounts(cleanEmail);
    if (!loaded) {
      throw new Error('Kunde inte ladda kontot från Firebase.');
    }
    return loaded;
  } catch (err: any) {
    // Check if the user is logging in with their pre-Firebase password (verified against SHA-256 hash)
    try {
      const candidateHash = await hashPassword(password);
      await ensureFirebaseAuthSession();
      const dirId = sanitizeFirestoreId(cleanEmail);
      const dirSnap = await getDoc(doc(db, 'userDirectory', dirId));
      const dirData = dirSnap.exists() ? dirSnap.data() : null;
      const expectedHash =
        dirData?.passwordHash || LEGACY_MIGRATED_PASSWORD_HASHES[cleanEmail];

      if (expectedHash && candidateHash === expectedHash) {
        try {
          localStorage.setItem('vn_auth_email_override', cleanEmail);
        } catch {
          // Ignore
        }
        const loaded = await loadMyAccountAndKnownAccounts(cleanEmail);
        if (loaded) {
          return loaded;
        }
      }
    } catch {
      // Fall through to standard error below
    }

    const code = err?.code || '';
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password'
    ) {
      throw new Error('Fel e-postadress eller lösenord.');
    }
    throw new Error(err?.message || 'Inloggningen misslyckades.');
  }
}

export async function logoutCloudAccount(): Promise<void> {
  try {
    localStorage.removeItem('vn_auth_email_override');
  } catch {
    // Ignore
  }
  try {
    await signOut(auth);
  } catch {
    // Ignore
  }
}

function clearModuleDataInSlice(slice: WorkspaceDataSlice, mod: ShareableModule) {
  switch (mod) {
    case 'calendar':
      slice.events = [];
      break;
    case 'todo':
      slice.todos = [];
      break;
    case 'notes':
      slice.notes = [];
      break;
    case 'shopping':
      slice.shopping = [];
      break;
    case 'recipes':
      slice.recipes = [];
      break;
    case 'budget':
      slice.budgetMonths = INITIAL_BUDGET_MONTHS;
      break;
    case 'photos':
      slice.photos = [];
      slice.photoAlbums = [];
      break;
  }
}

function mergeById<T extends { id: string }>(existing: T[] = [], incoming: T[] = []): T[] {
  const map = new Map<string, T>();
  for (const item of existing) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of incoming) {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function copyModuleDataBetweenSlices(
  source: Partial<WorkspaceDataSlice>,
  target: WorkspaceDataSlice,
  mod: ShareableModule
) {
  switch (mod) {
    case 'calendar':
      if (source.categories && source.categories.length > 0) {
        target.categories = upgradeCategoriesToVibrant(source.categories);
      }
      target.events = mergeById(target.events, source.events);
      break;
    case 'todo':
      target.todos = mergeById(target.todos, source.todos);
      break;
    case 'notes':
      target.notes = mergeById(target.notes, source.notes);
      break;
    case 'shopping':
      target.shopping = mergeById(target.shopping, source.shopping);
      break;
    case 'recipes':
      target.recipes = mergeById(target.recipes, source.recipes);
      break;
    case 'budget': {
      const existingMonths = target.budgetMonths || [];
      const srcMonths = source.budgetMonths || [];
      const byMonth = new Map<string, BudgetMonth>();
      for (const bm of existingMonths) {
        if (bm?.monthKey) byMonth.set(bm.monthKey, bm);
      }
      for (const bm of srcMonths) {
        if (bm?.monthKey && !byMonth.has(bm.monthKey)) {
          byMonth.set(bm.monthKey, bm);
        } else if (bm?.monthKey && byMonth.has(bm.monthKey)) {
          const cur = byMonth.get(bm.monthKey)!;
          byMonth.set(bm.monthKey, {
            ...cur,
            entries: mergeById(cur.entries || [], bm.entries || []),
          });
        }
      }
      target.budgetMonths = Array.from(byMonth.values());
      break;
    }
    case 'photos':
      target.photos = mergeById(target.photos, source.photos);
      target.photoAlbums = mergeById(target.photoAlbums, source.photoAlbums);
      break;
  }
}

export async function updateCloudAccountProfile(
  updatedAccount: UserAccount,
  newPassword?: string
): Promise<{ account: UserAccount; allAccounts: UserAccount[] }> {
  const user = await ensureFirebaseAuthSession();
  const cleanEmail = getEffectiveUserEmail(updatedAccount.email);
  if (!user || !cleanEmail) {
    throw new Error('Du måste vara inloggad i Firebase.');
  }
  const nowIso = new Date().toISOString();

  if (newPassword && newPassword.trim().length >= 6) {
    try {
      if (user.email) {
        await updatePassword(user, newPassword.trim());
      }
      const newHash = await hashPassword(newPassword.trim());
      const dirId = sanitizeFirestoreId(cleanEmail);
      await setDoc(
        doc(db, 'userDirectory', dirId),
        { passwordHash: newHash },
        { merge: true }
      ).catch(() => {});
    } catch {
      // Ignore if signed in via Google OAuth or anonymous session
    }
  }

  const prevLoaded = await loadMyAccountAndKnownAccounts(cleanEmail);
  const prevAccounts = prevLoaded?.allAccounts || [updatedAccount];
  const prevMyAcc = prevLoaded?.account;

  const normalizedUpdatedConns: FriendConnection[] = (updatedAccount.connections || []).map(
    (c) => {
      const mods = getConnectionSharedModules(c);
      const allOn = ALL_SHAREABLE_MODULES.every((m) => mods[m]);
      return {
        ...c,
        email: c.email.trim().toLowerCase(),
        shareAll: allOn,
        sharedModules: { ...mods },
        addedAt: c.addedAt || nowIso,
        updatedAt: nowIso,
      };
    }
  );

  const nextConnEmailSet = new Set(normalizedUpdatedConns.map((c) => c.email));
  const removedEmails = (prevMyAcc?.connections || [])
    .map((c) => c.email.trim().toLowerCase())
    .filter((e) => !nextConnEmailSet.has(e));

  const oldKeys: Record<ShareableModule, string> = {
    calendar: resolveModuleWorkspaceKey(cleanEmail, 'calendar', prevAccounts),
    todo: resolveModuleWorkspaceKey(cleanEmail, 'todo', prevAccounts),
    notes: resolveModuleWorkspaceKey(cleanEmail, 'notes', prevAccounts),
    shopping: resolveModuleWorkspaceKey(cleanEmail, 'shopping', prevAccounts),
    recipes: resolveModuleWorkspaceKey(cleanEmail, 'recipes', prevAccounts),
    budget: resolveModuleWorkspaceKey(cleanEmail, 'budget', prevAccounts),
    photos: resolveModuleWorkspaceKey(cleanEmail, 'photos', prevAccounts),
  };

  const canonicalUserId = user.email ? user.uid : updatedAccount.id || sanitizeFirestoreId(cleanEmail);
  const accountToPersist: UserAccount = {
    ...updatedAccount,
    id: canonicalUserId,
    email: cleanEmail,
    passwordHash: 'firebase-auth',
    connections: normalizedUpdatedConns,
    updatedAt: nowIso,
  };

  await upsertMyUserProfileAndDirectory(accountToPersist, removedEmails);

  const nextLoaded = await loadMyAccountAndKnownAccounts(cleanEmail, true);
  // Ensure the caller's explicit switch changes in normalizedUpdatedConns are preserved as authoritative
  const finalAccount: UserAccount = {
    ...(nextLoaded?.account || accountToPersist),
    connections: normalizedUpdatedConns,
    updatedAt: nowIso,
  };
  const nextAccounts: UserAccount[] = [
    finalAccount,
    ...(nextLoaded?.allAccounts || prevAccounts).filter(
      (a) => a.email.trim().toLowerCase() !== cleanEmail
    ),
  ];

  // Cache slice reads/writes by wsKey so we only touch workspaces whose sharing state actually changed
  const modifiedSlices = new Map<
    string,
    { slice: WorkspaceDataSlice; members: string[] }
  >();
  let cachedPrivForMerge: WorkspaceDataSlice | null = null;

  for (const mod of ALL_SHAREABLE_MODULES) {
    const oldKey = oldKeys[mod];
    const newKey = resolveModuleWorkspaceKey(cleanEmail, mod, nextAccounts);
    if (oldKey === newKey) continue;

    if (newKey.startsWith('shared_')) {
      const members = getGroupEmailsForModule(cleanEmail, mod, nextAccounts);
      if (!modifiedSlices.has(newKey)) {
        const existingShared = await readFirestoreWorkspaceSlice(
          newKey,
          cleanEmail,
          finalAccount.name
        );
        const sliceToSave: WorkspaceDataSlice = existingShared || {
          version: 1,
          updatedAt: nowIso,
          updatedBy: finalAccount.name,
          updatedByDeviceId: getDeviceId(),
          lastActionSummary: `${finalAccount.name} startade delning`,
          lastActionType: 'sync',
          recentActions: [],
          categories: INITIAL_CATEGORIES,
          events: [],
          todos: [],
          notes: [],
          shopping: [],
          recipes: [],
          budgetMonths: INITIAL_BUDGET_MONTHS,
          photos: [],
          photoAlbums: [],
        };
        modifiedSlices.set(newKey, { slice: sliceToSave, members });
      }
      const targetEntry = modifiedSlices.get(newKey)!;
      if (oldKey.startsWith('shared_') && oldKey !== newKey) {
        const prevSharedSlice = await readFirestoreWorkspaceSlice(
          oldKey,
          cleanEmail,
          finalAccount.name
        );
        if (prevSharedSlice) {
          copyModuleDataBetweenSlices(prevSharedSlice, targetEntry.slice, mod);
          targetEntry.slice.version = Math.max(
            (targetEntry.slice.version || 1) + 1,
            (prevSharedSlice.version || 1) + 1
          );
          targetEntry.slice.updatedAt = nowIso;
        }
      } else if (!oldKey.startsWith('shared_')) {
        // Automatically merge the user's private content into the shared workspace when enabling sharing
        if (!cachedPrivForMerge) {
          cachedPrivForMerge = await readFirestoreWorkspaceSlice(
            getPrivateWorkspaceKey(cleanEmail),
            cleanEmail,
            finalAccount.name
          );
        }
        if (cachedPrivForMerge) {
          copyModuleDataBetweenSlices(cachedPrivForMerge, targetEntry.slice, mod);
          targetEntry.slice.version = (targetEntry.slice.version || 1) + 1;
          targetEntry.slice.updatedAt = nowIso;
        }
      }
    }
  }

  await Promise.all(
    Array.from(modifiedSlices.entries()).map(([wsKey, entry]) =>
      writeFirestoreWorkspaceSlice(wsKey, entry.slice, entry.members)
    )
  );

  return { account: finalAccount, allAccounts: nextAccounts };
}

export async function transferPrivateContentToShared(
  email: string,
  modulesToTransfer: ShareableModule[],
  targetConnectionEmails?: string[]
): Promise<{
  account: UserAccount;
  allAccounts: UserAccount[];
  transferredModules: ShareableModule[];
}> {
  const user = await ensureFirebaseAuthSession();
  const cleanEmail = getEffectiveUserEmail(email);
  if (!user || !cleanEmail) {
    throw new Error('Du måste vara inloggad.');
  }
  const loaded = await loadMyAccountAndKnownAccounts(cleanEmail);
  if (!loaded) {
    throw new Error('Kunde inte hitta ditt konto.');
  }

  const myAcc = loaded.account;
  const existingAccounts = loaded.allAccounts;
  const nowIso = new Date().toISOString();

  const targetEmailSet =
    targetConnectionEmails && targetConnectionEmails.length > 0
      ? new Set(targetConnectionEmails.map((e) => e.trim().toLowerCase()))
      : null;

  const updatedConnections = (myAcc.connections || []).map((conn) => {
    const cMail = conn.email.trim().toLowerCase();
    const currentMods = getConnectionSharedModules(conn);
    const nextMods = { ...currentMods };

    for (const mod of modulesToTransfer) {
      const currentlyShared = resolveModuleWorkspaceKey(
        cleanEmail,
        mod,
        existingAccounts
      ).startsWith('shared_');
      if (!currentlyShared) {
        if (!targetEmailSet || targetEmailSet.has(cMail)) {
          nextMods[mod] = true;
        }
      } else if (targetEmailSet && targetEmailSet.has(cMail)) {
        nextMods[mod] = true;
      }
    }

    const allOn = ALL_SHAREABLE_MODULES.every((m) => nextMods[m]);
    return {
      ...conn,
      shareAll: allOn,
      sharedModules: nextMods,
      updatedAt: nowIso,
    };
  });

  await upsertMyUserProfileAndDirectory({
    ...myAcc,
    connections: updatedConnections,
    updatedAt: nowIso,
  });

  const refreshed = await loadMyAccountAndKnownAccounts(cleanEmail, true);
  const finalAccount: UserAccount = {
    ...(refreshed?.account || myAcc),
    connections: updatedConnections,
    updatedAt: nowIso,
  };
  const allAccounts: UserAccount[] = [
    finalAccount,
    ...(refreshed?.allAccounts || existingAccounts).filter(
      (a) => a.email.trim().toLowerCase() !== cleanEmail
    ),
  ];

  const privKey = getPrivateWorkspaceKey(cleanEmail);
  const privSlice =
    (await readFirestoreWorkspaceSlice(privKey, cleanEmail, finalAccount.name)) ||
    getDefaultInitialSliceForEmail(cleanEmail, finalAccount.name);

  const transferredModules: ShareableModule[] = [];
  const targetByKey = new Map<
    string,
    { slice: WorkspaceDataSlice; members: string[] }
  >();

  for (const mod of modulesToTransfer) {
    const sharedKey = resolveModuleWorkspaceKey(cleanEmail, mod, allAccounts);
    if (!sharedKey.startsWith('shared_')) continue;

    const members = getGroupEmailsForModule(cleanEmail, mod, allAccounts);
    if (!targetByKey.has(sharedKey)) {
      const existingTarget: WorkspaceDataSlice = (await readFirestoreWorkspaceSlice(
        sharedKey,
        cleanEmail,
        finalAccount.name
      )) || {
        version: 1,
        updatedAt: nowIso,
        updatedBy: finalAccount.name,
        updatedByDeviceId: getDeviceId(),
        lastActionSummary: `${finalAccount.name} delade innehåll`,
        lastActionType: 'sync',
        recentActions: [],
        categories: upgradeCategoriesToVibrant(privSlice.categories) || INITIAL_CATEGORIES,
        events: [],
        todos: [],
        notes: [],
        shopping: [],
        recipes: [],
        budgetMonths: INITIAL_BUDGET_MONTHS,
        photos: [],
        photoAlbums: [],
      };
      existingTarget.version = (existingTarget.version || 1) + 1;
      existingTarget.updatedAt = nowIso;
      existingTarget.updatedBy = finalAccount.name;
      existingTarget.updatedByDeviceId = getDeviceId();
      existingTarget.lastActionSummary = `${finalAccount.name} förde över privat innehåll till delad sida`;
      existingTarget.lastActionType = 'sync';
      targetByKey.set(sharedKey, { slice: existingTarget, members });
    }

    const entry = targetByKey.get(sharedKey)!;
    copyModuleDataBetweenSlices(privSlice, entry.slice, mod);
    transferredModules.push(mod);
  }

  await Promise.all(
    Array.from(targetByKey.entries()).map(([sharedKey, entry]) =>
      writeFirestoreWorkspaceSlice(sharedKey, entry.slice, entry.members)
    )
  );

  return { account: finalAccount, allAccounts, transferredModules };
}
