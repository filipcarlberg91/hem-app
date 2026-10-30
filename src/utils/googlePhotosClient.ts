import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getApiUrl } from './apiUrl';
import {
  ensureFirebaseAuthSession,
  sanitizeFirestoreId,
} from './cloudHouseholdSync';

export interface GooglePhotoSlideItem {
  id: string;
  imageUrl: string;
  caption: string;
}

export interface SharedAlbumFetchResult {
  ok: boolean;
  albumTitle: string;
  photos: GooglePhotoSlideItem[];
  error?: string;
}

/**
 * Extracts a clean Google Photos URL from any pasted text (e.g. Android/iOS Share sheet text).
 */
export function extractGooglePhotosUrlFromInput(rawInput: string): string {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return '';

  const urlMatch = trimmed.match(
    /https?:\/\/(?:photos\.app\.goo\.gl\/[A-Za-z0-9_-]+|photos\.google\.com\/[^\s"'<>]+|goo\.gl\/photos\/[A-Za-z0-9_-]+|lh3\.googleusercontent\.com\/[^\s"'<>]+)/i
  );
  if (urlMatch && urlMatch[0]) {
    return urlMatch[0].trim();
  }
  return trimmed;
}

/**
 * Parses raw HTML or Markdown from a Google Photos shared album page and extracts
 * full-resolution (4K / original aspect ratio) image URLs + album title.
 */
export function parseGooglePhotosFromHtmlOrText(
  content: string,
  fallbackTitle = 'Google Foto-album'
): { albumTitle: string; photos: GooglePhotoSlideItem[] } {
  if (!content || typeof content !== 'string') {
    return { albumTitle: fallbackTitle, photos: [] };
  }

  let albumTitle = fallbackTitle;

  // 1. Try OpenGraph og:title or HTML <title>
  const ogTitleMatch =
    content.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
    content.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i) ||
    content.match(/<title[^>]*>([^<]+)<\/title>/i);

  if (ogTitleMatch && ogTitleMatch[1]) {
    const cleaned = ogTitleMatch[1]
      .replace(/\s*[-–|]\s*Google\s+Photos.*$/i, '')
      .replace(/\s*[-–|]\s*Google\s+Foto.*$/i, '')
      .trim();
    if (
      cleaned &&
      !/^Google\s+(Photos|Foto)$/i.test(cleaned) &&
      !/^(404|Error|Fel|Sign in|Logga in)/i.test(cleaned)
    ) {
      albumTitle = cleaned;
    }
  } else {
    // 2. Try Jina Reader Markdown "Title: ..." header
    const jinaTitleMatch = content.match(/^Title:\s*(.+)$/m);
    if (jinaTitleMatch && jinaTitleMatch[1]) {
      const cleaned = jinaTitleMatch[1]
        .replace(/\s*[-–|]\s*Google\s+Photos.*$/i, '')
        .replace(/\s*[-–|]\s*Google\s+Foto.*$/i, '')
        .trim();
      if (
        cleaned &&
        !/^Google\s+(Photos|Foto)$/i.test(cleaned) &&
        !/^(404|Error|Fel|Sign in|Logga in)/i.test(cleaned)
      ) {
        albumTitle = cleaned;
      }
    }
  }

  // Unescape any JSON-escaped slashes in scripts (e.g. https:\/\/lh3.googleusercontent.com\/pw\/...)
  const normalizedContent = content.replace(/\\\//g, '/');

  // Match Google Photos media base URLs (pw/... or d/... or long media hashes),
  // explicitly excluding /a/ and /a-/ profile avatars
  const urlRegex =
    /https:\/\/lh3\.googleusercontent\.com\/(?:pw\/[A-Za-z0-9_-]{20,}|d\/[A-Za-z0-9_-]{20,}|(?!a\/|a-\/|ogw\/)[A-Za-z0-9_-]{36,})/g;

  const matches = normalizedContent.match(urlRegex) || [];
  const seenBaseUrls = new Set<string>();
  const extractedPhotos: GooglePhotoSlideItem[] = [];

  for (const base of matches) {
    if (seenBaseUrls.has(base)) continue;
    seenBaseUrls.add(base);
    const idx = extractedPhotos.length + 1;
    extractedPhotos.push({
      id: `gphotos-${idx}-${base.slice(-12)}`,
      // Use =w3840-h2160 (4K UHD original aspect ratio) so shared album photos are crisp & full resolution
      imageUrl: `${base}=w3840-h2160`,
      caption: `${albumTitle} · Google Foto`,
    });
    if (extractedPhotos.length >= 200) break;
  }

  return { albumTitle, photos: extractedPhotos };
}

/**
 * Multi-strategy shared Google Photos album fetcher that works from:
 * - Static Firebase Hosting (hemmahosf.web.app)
 * - Native Android / iOS Capacitor app
 * - GitHub Pages
 * - Local / Cloud Run server
 */
export async function fetchSharedGooglePhotosAlbum(
  rawInput: string
): Promise<SharedAlbumFetchResult> {
  const cleanUrl = extractGooglePhotosUrlFromInput(rawInput);

  if (!cleanUrl) {
    return {
      ok: false,
      albumTitle: '',
      photos: [],
      error:
        'Klistra in en delningslänk till ett album i Google Foto (t.ex. https://photos.app.goo.gl/...).',
    };
  }

  // Direct single Google Photos image URL support
  if (cleanUrl.includes('lh3.googleusercontent.com/')) {
    const base = cleanUrl.replace(/=[a-zA-Z0-9_-]+$/, '');
    return {
      ok: true,
      albumTitle: 'Google Foto',
      photos: [
        {
          id: `gphotos-direct-${Date.now()}`,
          imageUrl: `${base}=w3840-h2160`,
          caption: 'Google Foto',
        },
      ],
    };
  }

  if (
    !cleanUrl.includes('photos.app.goo.gl') &&
    !cleanUrl.includes('photos.google.com') &&
    !cleanUrl.includes('goo.gl/photos')
  ) {
    return {
      ok: false,
      albumTitle: '',
      photos: [],
      error:
        'Ange en giltig delningslänk från Google Foto (t.ex. https://photos.app.goo.gl/... eller https://photos.google.com/share/...).',
    };
  }

  let reachedAnyService = false;
  let detected404OrInvalidLink = false;

  // Strategy 1: Jina Reader HTML mode (CORS-enabled for hemmahosf.web.app & localhost, follows shortlink redirects)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 11000);
    const jinaHtmlRes = await fetch(`https://r.jina.ai/${cleanUrl}`, {
      headers: {
        'X-Return-Format': 'html',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    reachedAnyService = true;

    if (jinaHtmlRes.status === 404 || jinaHtmlRes.status === 400) {
      detected404OrInvalidLink = true;
    } else if (jinaHtmlRes.ok) {
      const html = await jinaHtmlRes.text();
      if (
        html.includes('Error 404 (Not Found)') ||
        html.includes('The requested URL was not found on this server')
      ) {
        detected404OrInvalidLink = true;
      } else {
        const parsed = parseGooglePhotosFromHtmlOrText(html);
        if (parsed.photos.length > 0) {
          return {
            ok: true,
            albumTitle: parsed.albumTitle,
            photos: parsed.photos,
          };
        }
      }
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Jina Reader Default Markdown mode (Simple GET request — zero CORS preflight headers)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 11000);
    const jinaMdRes = await fetch(`https://r.jina.ai/${cleanUrl}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    reachedAnyService = true;

    if (jinaMdRes.status === 404) {
      detected404OrInvalidLink = true;
    } else if (jinaMdRes.ok) {
      const md = await jinaMdRes.text();
      if (
        md.includes('Error 404 (Not Found)') ||
        md.includes('Warning: Target URL returned error 404')
      ) {
        detected404OrInvalidLink = true;
      } else {
        const parsed = parseGooglePhotosFromHtmlOrText(md);
        if (parsed.photos.length > 0) {
          return {
            ok: true,
            albumTitle: parsed.albumTitle,
            photos: parsed.photos,
          };
        }
      }
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 3: Backend API endpoint (/api/google-photos/shared-album)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const apiRes = await fetch(getApiUrl('/api/google-photos/shared-album'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumUrl: cleanUrl }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    reachedAnyService = true;

    if (apiRes.status === 404) {
      detected404OrInvalidLink = true;
    } else if (apiRes.ok) {
      const data = await apiRes.json().catch(() => ({}));
      if (Array.isArray(data?.photos) && data.photos.length > 0) {
        const hiResPhotos: GooglePhotoSlideItem[] = data.photos.map((p: any) => ({
          id: String(p.id || `gphotos-${Math.random()}`),
          imageUrl: String(p.imageUrl || '').replace(/=w\d+-h\d+.*$/, '=w3840-h2160'),
          caption: String(p.caption || data.albumTitle || 'Google Foto'),
        }));
        return {
          ok: true,
          albumTitle: String(data.albumTitle || 'Google Foto-album'),
          photos: hiResPhotos,
        };
      }
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 4: Public CORS Proxy fallback (AllOrigins / Codetabs)
  const proxyUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`,
  ];

  for (const pUrl of proxyUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const pRes = await fetch(pUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (pRes.ok) {
        reachedAnyService = true;
        const text = await pRes.text();
        const parsed = parseGooglePhotosFromHtmlOrText(text);
        if (parsed.photos.length > 0) {
          return {
            ok: true,
            albumTitle: parsed.albumTitle,
            photos: parsed.photos,
          };
        }
      }
    } catch {
      // Ignore
    }
  }

  if (detected404OrInvalidLink || reachedAnyService) {
    return {
      ok: false,
      albumTitle: '',
      photos: [],
      error:
        'Hittade inga bilder på länken (länken kan vara avklippt/ofullständig eller så är länkdelning avstängd). Öppna albumet i Google Foto -> tryck på Dela -> "Skapa länk" och klistra in hela länken.',
    };
  }

  return {
    ok: false,
    albumTitle: '',
    photos: [],
    error:
      'Kunde inte läsa albumlänken. Kontrollera att hela Google Foto-länken (t.ex. https://photos.app.goo.gl/...) är inklistrad och att länkdelning är påslagen.',
  };
}

/**
 * Fetches media items from Google Photos Library API, Picker API, or Google Drive using an OAuth access token.
 */
export async function fetchGooglePhotosWithAccessToken(
  accessToken: string
): Promise<{
  photos: GooglePhotoSlideItem[];
  pickerUri: string | null;
  pickerSessionId: string | null;
}> {
  const collected: GooglePhotoSlideItem[] = [];
  let pickerUri: string | null = null;
  let pickerSessionId: string | null = null;

  // 1. Try Google Photos Picker API (creates an interactive session where user can pick any photos/albums)
  try {
    const pickerRes = await fetch('https://photospicker.googleapis.com/v1/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (pickerRes.ok) {
      const pickerData = await pickerRes.json();
      if (pickerData?.pickerUri) {
        pickerUri = String(pickerData.pickerUri);
      }
      if (pickerData?.id) {
        pickerSessionId = String(pickerData.id);
      }
    }
  } catch {
    // Ignore if Picker API is not enabled on GCP project
  }

  // 2. Try Google Photos Library API (mediaItems)
  try {
    const libRes = await fetch(
      'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (libRes.ok) {
      const libData = await libRes.json();
      if (Array.isArray(libData?.mediaItems)) {
        for (const item of libData.mediaItems) {
          if (item?.baseUrl && (!item.mimeType || item.mimeType.startsWith('image/'))) {
            collected.push({
              id: `gphoto-lib-${item.id}`,
              imageUrl: `${item.baseUrl}=w3840-h2160`,
              caption: item.description || item.filename || 'Google Foto',
            });
          }
        }
      }
    }
  } catch {
    // Ignore
  }

  // 3. Try Google Drive image files / Google Photos backup folder in full resolution
  try {
    const driveRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=mimeType contains 'image/' and trashed=false&pageSize=100&fields=files(id,name,thumbnailLink,webContentLink)",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (driveRes.ok) {
      const driveData = await driveRes.json();
      if (Array.isArray(driveData?.files)) {
        for (const f of driveData.files) {
          if (f?.thumbnailLink) {
            const hiRes = String(f.thumbnailLink).replace(/=s\d+.*$/, '=w3840-h2160');
            collected.push({
              id: `gdrive-photo-${f.id}`,
              imageUrl: hiRes,
              caption: String(f.name || 'Google Foto').replace(/\.[^/.]+$/, ''),
            });
          }
        }
      }
    }
  } catch {
    // Ignore
  }

  return {
    photos: collected,
    pickerUri,
    pickerSessionId,
  };
}

/**
 * Polls an active Google Photos Picker API session and imports the selected photos
 * in full resolution once the user finishes selecting them in Google Photos.
 */
export async function pollGooglePhotosPickerSession(
  sessionId: string,
  accessToken: string,
  onPhotosPicked: (photos: GooglePhotoSlideItem[]) => void
): Promise<boolean> {
  try {
    const sesRes = await fetch(
      `https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!sesRes.ok) return false;
    const sesData = await sesRes.json();
    if (!sesData?.mediaItemsSet) {
      return false;
    }

    const itemsRes = await fetch(
      `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${encodeURIComponent(
        sessionId
      )}&pageSize=100`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!itemsRes.ok) return false;
    const itemsData = await itemsRes.json();
    const rawItems = Array.isArray(itemsData?.mediaItems) ? itemsData.mediaItems : [];
    const picked: GooglePhotoSlideItem[] = [];

    for (const item of rawItems) {
      const baseUrl = item?.mediaFile?.baseUrl || item?.baseUrl;
      if (!baseUrl) continue;
      const filename =
        item?.mediaFile?.filename || item?.filename || 'Google Foto';
      // Fetch with Bearer token and convert to blob/dataUrl if needed, or use high-res baseUrl
      let finalUrl = `${baseUrl}=w3840-h2160`;
      try {
        const imgRes = await fetch(`${baseUrl}=w2560-h1440`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('read error'));
            reader.readAsDataURL(blob);
          });
          if (dataUrl.startsWith('data:image/')) {
            finalUrl = dataUrl;
          }
        }
      } catch {
        // Fallback to direct baseUrl
      }

      picked.push({
        id: `gpicker-${item.id || Date.now()}-${picked.length}`,
        imageUrl: finalUrl,
        caption: String(filename).replace(/\.[^/.]+$/, ''),
      });
    }

    if (picked.length > 0) {
      onPhotosPicked(picked);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function createGooglePhotosAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/photospicker.mediaitems.readonly');
  provider.addScope('https://www.googleapis.com/auth/photoslibrary.readonly');
  provider.addScope('https://www.googleapis.com/auth/drive.photos.readonly');
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

/**
 * Checks if the page just returned from a `signInWithRedirect` flow for Google Photos.
 */
export async function checkGooglePhotosRedirectResult(): Promise<{
  email: string;
  accessToken: string;
  photos: GooglePhotoSlideItem[];
  pickerUri: string | null;
  pickerSessionId: string | null;
} | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result || !result.user) return null;
    const cred = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = cred?.accessToken;
    const email = result.user.email || 'Google-konto';
    if (!accessToken) return null;
    const fetched = await fetchGooglePhotosWithAccessToken(accessToken);
    return {
      email,
      accessToken,
      ...fetched,
    };
  } catch {
    return null;
  }
}

/**
 * Connects Google account for Google Photos:
 * 1. Tries `signInWithPopup` (works on hemmahosf.web.app, localhost, etc.).
 * 2. If popup is blocked on mobile PWA/browser, falls back to `signInWithRedirect`.
 * 3. If running inside an embedded WebView or unauthorized origin where Firebase popup fails,
 *    bridges the login through `https://hemmahosf.web.app/?googlePhotosConnect=<sessionId>` + Firestore!
 */
export async function startGooglePhotosOAuthFlow(callbacks: {
  onStatus: (msg: string) => void;
  onConnected: (result: {
    email: string;
    accessToken?: string;
    photos: GooglePhotoSlideItem[];
    pickerUri: string | null;
    pickerSessionId: string | null;
  }) => void;
  onError: (msg: string) => void;
}): Promise<void> {
  const provider = createGooglePhotosAuthProvider();

  try {
    callbacks.onStatus('Öppnar Google-inloggning för Google Foto...');
    const result = await signInWithPopup(auth, provider);
    const cred = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = cred?.accessToken;
    const email = result.user?.email || 'Google-konto';

    if (!accessToken) {
      callbacks.onConnected({
        email,
        photos: [],
        pickerUri: null,
        pickerSessionId: null,
      });
      return;
    }

    callbacks.onStatus(`Inloggad som ${email}. Hämtar dina bilder från Google Foto...`);
    const fetched = await fetchGooglePhotosWithAccessToken(accessToken);
    callbacks.onConnected({
      email,
      accessToken,
      ...fetched,
    });
    return;
  } catch (err: any) {
    const code = String(err?.code || '');
    const msg = String(err?.message || '');

    // User explicitly closed the popup
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      callbacks.onError(
        'Inloggningen stängdes. Du kan försöka igen eller klistra in en delad albumlänk från Google Foto nedan.'
      );
      return;
    }

    // If popup was blocked on mobile Safari / PWA on an authorized web domain, use signInWithRedirect
    const isStandardWebOrigin =
      typeof window !== 'undefined' &&
      (window.location.protocol === 'https:' || window.location.protocol === 'http:') &&
      window.location.hostname !== 'localhost' &&
      !code.includes('unauthorized-domain');

    if (
      isStandardWebOrigin &&
      (code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment')
    ) {
      try {
        localStorage.setItem('vn_pending_gphotos_redirect', '1');
      } catch {
        // Ignore
      }
      callbacks.onStatus('Omdirigerar till Google-inloggning...');
      await signInWithRedirect(auth, provider);
      return;
    }

    // Fallback for Capacitor WebView / unauthorized-domain / embedded browser restrictions:
    // Open the hosted Google Photos Connect helper on https://hemmahosf.web.app and sync via Firestore!
    if (
      code.includes('unauthorized-domain') ||
      code.includes('operation-not-supported') ||
      code.includes('popup-blocked') ||
      msg.includes('unauthorized-domain')
    ) {
      try {
        await ensureFirebaseAuthSession();
        const sessionId = `gp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const docId = sanitizeFirestoreId(`gphotos_connect_${sessionId}`);
        await setDoc(doc(db, 'workspaces', docId), {
          status: 'pending',
          sessionId,
          updatedAt: serverTimestamp(),
        });

        const connectUrl = `https://hemmahosf.web.app/?googlePhotosConnect=${encodeURIComponent(
          sessionId
        )}`;
        callbacks.onStatus(
          'Slutför Google Foto-kopplingen i webbläsarfönstret som öppnas...'
        );

        const nativeBridge = (window as any).HemNativeBridge;
        if (nativeBridge && typeof nativeBridge.openExternalUrl === 'function') {
          nativeBridge.openExternalUrl(connectUrl);
        } else {
          window.open(connectUrl, '_blank', 'noopener,noreferrer');
        }

        // Poll Firestore for up to 120 seconds for the completed Google Photos connection
        const startMs = Date.now();
        const pollTimer = setInterval(async () => {
          if (Date.now() - startMs > 120000) {
            clearInterval(pollTimer);
            return;
          }
          try {
            const snap = await getDoc(doc(db, 'workspaces', docId));
            if (!snap.exists()) return;
            const data = snap.data();
            if (data?.status === 'completed' && data?.email) {
              clearInterval(pollTimer);
              let parsedPhotos: GooglePhotoSlideItem[] = [];
              try {
                parsedPhotos = JSON.parse(data.photosJson || '[]');
              } catch {
                parsedPhotos = [];
              }
              callbacks.onConnected({
                email: String(data.email),
                accessToken: data.accessToken ? String(data.accessToken) : undefined,
                photos: parsedPhotos,
                pickerUri: data.pickerUri ? String(data.pickerUri) : null,
                pickerSessionId: data.pickerSessionId
                  ? String(data.pickerSessionId)
                  : null,
              });
            }
          } catch {
            // Ignore transient poll error
          }
        }, 2000);
        return;
      } catch {
        // Fall through
      }
    }

    callbacks.onError(
      'Kunde inte koppla Google-kontot direkt här. Du kan även klistra in en delningslänk till ditt Google Foto-album nedan!'
    );
  }
}

/**
 * Completes a bridged Google Photos connection when `https://hemmahosf.web.app/?googlePhotosConnect=<sessionId>` is opened.
 */
export async function completeBridgedGooglePhotosConnect(
  sessionId: string
): Promise<{
  ok: boolean;
  email?: string;
  photoCount?: number;
  pickerUri?: string | null;
  error?: string;
}> {
  try {
    const provider = createGooglePhotosAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const cred = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = cred?.accessToken || '';
    const email = result.user?.email || 'Google-konto';

    const fetched = accessToken
      ? await fetchGooglePhotosWithAccessToken(accessToken)
      : { photos: [], pickerUri: null, pickerSessionId: null };

    await ensureFirebaseAuthSession();
    const docId = sanitizeFirestoreId(`gphotos_connect_${sessionId}`);
    await setDoc(
      doc(db, 'workspaces', docId),
      {
        status: 'completed',
        sessionId,
        email,
        accessToken,
        photosJson: JSON.stringify(fetched.photos.slice(0, 120)),
        pickerUri: fetched.pickerUri || '',
        pickerSessionId: fetched.pickerSessionId || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      ok: true,
      email,
      photoCount: fetched.photos.length,
      pickerUri: fetched.pickerUri,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Inloggningen mot Google avbröts.',
    };
  }
}
