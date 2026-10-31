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
  takenAt?: string;
}

export interface SharedAlbumFetchResult {
  ok: boolean;
  albumTitle: string;
  photos: GooglePhotoSlideItem[];
  error?: string;
}

/**
 * Normalizes an EXIF date string ("YYYY:MM:DD HH:MM:SS") or timestamp into an ISO string.
 */
export function normalizeExifOrIsoDate(raw?: string | number | null): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const ms = raw < 10000000000 ? raw * 1000 : raw;
    if (ms >= 631152000000 && ms <= 2100000000000) {
      return new Date(ms).toISOString();
    }
    return undefined;
  }
  const str = String(raw).trim();
  if (!str) return undefined;

  // Match EXIF format "2025:07:14 15:30:12" or "2025:07:14"
  const exifMatch = str.match(
    /^(\d{4}):(\d{2}):(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/
  );
  if (exifMatch) {
    const [, y, m, d, hh = '12', mm = '00', ss = '00'] = exifMatch;
    const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
    const parsed = Date.parse(iso);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }

  // Match numeric string epoch ms
  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    const ms = str.length === 10 ? num * 1000 : num;
    if (ms >= 631152000000 && ms <= 2100000000000) {
      return new Date(ms).toISOString();
    }
  }

  const parsed = Date.parse(str);
  if (!Number.isNaN(parsed) && parsed >= 631152000000 && parsed <= 2100000000000) {
    return new Date(parsed).toISOString();
  }
  return undefined;
}

/**
 * Formats an ISO / EXIF / timestamp date into a clean Swedish date string (e.g., "14 juli 2025").
 */
export function formatPhotoTakenDateSwedish(raw?: string | number | null): string | null {
  const iso = normalizeExifOrIsoDate(raw);
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

/**
 * Parses EXIF DateTimeOriginal (0x9003), DateTimeDigitized (0x9004), or DateTime (0x0132)
 * from raw JPEG bytes (Uint8Array).
 */
function parseExifDateFromJpegBytes(bytes: Uint8Array): string | null {
  try {
    if (bytes.length < 16 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      // Fallback: scan first 64KB for ASCII "20XX:XX:XX XX:XX:XX" EXIF timestamp pattern
      const sliceLen = Math.min(bytes.length, 65536);
      let ascii = '';
      for (let i = 0; i < sliceLen; i++) {
        const c = bytes[i];
        ascii += c >= 32 && c <= 126 ? String.fromCharCode(c) : ' ';
      }
      const m = ascii.match(/\b(20\d{2}|19\d{2}):(0[1-9]|1[0-2]):(0[1-9]|[12]\d|3[01])\s+([01]\d|2[0-3]):([0-5]\d):([0-5]\d)\b/);
      if (m && m[0]) {
        return normalizeExifOrIsoDate(m[0]) || null;
      }
      return null;
    }

    // Fast ASCII EXIF timestamp scan inside the first 64KB of the JPEG header (APP1 Exif block)
    const maxScan = Math.min(bytes.length, 65536);
    let headerAscii = '';
    for (let i = 0; i < maxScan; i++) {
      const c = bytes[i];
      headerAscii += c >= 32 && c <= 126 ? String.fromCharCode(c) : ' ';
    }
    const matches = headerAscii.match(
      /\b(20\d{2}|19\d{2}):(0[1-9]|1[0-2]):(0[1-9]|[12]\d|3[01])\s+([01]\d|2[0-3]):([0-5]\d):([0-5]\d)\b/g
    );
    if (matches && matches.length > 0) {
      // In EXIF IFD, DateTimeOriginal (0x9003) is either the 2nd or 1st timestamp in APP1
      const preferred = matches.length > 1 ? matches[1] : matches[0];
      return normalizeExifOrIsoDate(preferred) || null;
    }
  } catch {
    // Ignore
  }
  return null;
}

const exifDateCache = new Map<string, string | null>();

/**
 * Extracts EXIF DateTimeOriginal from a JPEG data URL or image URL.
 */
export async function extractExifDateFromImageUrl(imageUrl: string): Promise<string | null> {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  if (exifDateCache.has(imageUrl)) {
    return exifDateCache.get(imageUrl) || null;
  }

  try {
    if (imageUrl.startsWith('data:image/')) {
      const commaIdx = imageUrl.indexOf(',');
      if (commaIdx > 0) {
        const b64 = imageUrl.slice(commaIdx + 1, commaIdx + 88000);
        const binStr = atob(b64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        const found = parseExifDateFromJpegBytes(bytes);
        exifDateCache.set(imageUrl, found);
        return found;
      }
    }

    // For Google Photos URLs (`lh3.googleusercontent.com`), try requesting the first 64KB with `=d` (download with original EXIF) or standard URL
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    try {
      const res = await fetch(imageUrl, {
        headers: { Range: 'bytes=0-65535' },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const found = parseExifDateFromJpegBytes(new Uint8Array(buf));
        exifDateCache.set(imageUrl, found);
        return found;
      }
    } catch {
      clearTimeout(timer);
    }
  } catch {
    // Ignore
  }
  exifDateCache.set(imageUrl, null);
  return null;
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
 * Extracts unique Google Photos base URLs AND their creation timestamps from any HTML, JSON, or Markdown text.
 * Supports up to 5,000 photos per album (no 200-photo truncation).
 */
function appendGooglePhotosFromRawText(
  content: string,
  albumTitle: string,
  seenBaseUrls: Set<string>,
  targetList: GooglePhotoSlideItem[],
  maxPhotos = 5000
): void {
  if (!content || typeof content !== 'string') return;

  // Unescape JSON-escaped slashes and equals signs in scripts/batchexecute envelopes
  const normalizedContent = content
    .replace(/\\\\\//g, '/')
    .replace(/\\\//g, '/')
    .replace(/\\u003d/gi, '=')
    .replace(/\\u0026/gi, '&');

  // Match Google Photos media base URLs (pw/... or d/... or long media hashes),
  // explicitly excluding /a/, /a-/, and /ogw/ profile avatars
  const urlRegex =
    /https:\/\/lh3\.googleusercontent\.com\/(?:pw\/[A-Za-z0-9_-]{20,}|d\/[A-Za-z0-9_-]{20,}|(?!a\/|a-\/|ogw\/)[A-Za-z0-9_-]{36,})/g;

  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(normalizedContent)) !== null) {
    const base = match[0];
    if (base.includes('/a/') || base.includes('/a-/') || base.includes('/ogw/')) continue;

    // Look ahead up to 260 characters after the URL in the Google Photos JSON array
    // (`["https://lh3.googleusercontent.com/pw/...", width, height, null, ...], timestampMs`)
    // and also look behind up to 140 characters for the photo's creation timestamp in epoch ms
    let extractedTakenAt: string | undefined;
    const afterSlice = normalizedContent.slice(
      match.index + base.length,
      Math.min(normalizedContent.length, match.index + base.length + 320)
    );
    const beforeSlice = normalizedContent.slice(
      Math.max(0, match.index - 160),
      match.index
    );

    const tsCandidates = [
      ...(afterSlice.match(/\b(1[0-9]{12}|9[5-9][0-9]{10})\b/g) || []),
      ...(beforeSlice.match(/\b(1[0-9]{12}|9[5-9][0-9]{10})\b/g) || []),
    ];
    for (const cand of tsCandidates) {
      const ms = Number(cand);
      // Between 2000-01-01 (946684800000) and now + 2 days
      if (ms >= 946684800000 && ms <= Date.now() + 172800000) {
        extractedTakenAt = new Date(ms).toISOString();
        break;
      }
    }

    if (seenBaseUrls.has(base)) {
      if (extractedTakenAt) {
        const existing = targetList.find((item) => item.imageUrl.startsWith(base));
        if (existing && !existing.takenAt) {
          existing.takenAt = extractedTakenAt;
        }
      }
      continue;
    }

    seenBaseUrls.add(base);
    const idx = targetList.length + 1;
    targetList.push({
      id: `gphotos-${idx}-${base.slice(-12)}`,
      // Use =w2560-h2560 so both portrait and landscape photos load crisp in their original aspect ratio
      imageUrl: `${base}=w2560-h2560`,
      caption: `${albumTitle} · Google Foto`,
      takenAt: extractedTakenAt,
    });
    if (targetList.length >= maxPhotos) break;
  }
}

/**
 * Parses raw HTML or Markdown from a Google Photos shared album page and extracts
 * full-resolution (original aspect ratio) image URLs + album title (up to 5,000 photos).
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

  const seenBaseUrls = new Set<string>();
  const extractedPhotos: GooglePhotoSlideItem[] = [];
  appendGooglePhotosFromRawText(content, albumTitle, seenBaseUrls, extractedPhotos, 5000);

  return { albumTitle, photos: extractedPhotos };
}

/**
 * Extracts Google Photos shared album pagination metadata (albumMediaKey, authKey, nextPageToken)
 * from raw HTML and fetches all remaining pages via Google Photos `batchexecute` (RPC `snAcKc`).
 * Works natively on Android via `HemNativeBridge` or via web fetch/proxy.
 */
async function paginateGooglePhotosSharedAlbumHtml(
  html: string,
  sourceUrl: string,
  albumTitle: string,
  existingPhotos: GooglePhotoSlideItem[]
): Promise<GooglePhotoSlideItem[]> {
  const seenBaseUrls = new Set<string>();
  const combinedPhotos: GooglePhotoSlideItem[] = [];

  for (const p of existingPhotos) {
    const base = p.imageUrl.replace(/=[a-zA-Z0-9_-]+$/, '');
    if (!seenBaseUrls.has(base)) {
      seenBaseUrls.add(base);
      combinedPhotos.push(p);
    }
  }

  let albumMediaKey = '';
  let authKey = '';

  const sharePathMatch =
    sourceUrl.match(/\/share\/([A-Za-z0-9_-]+)/) ||
    html.match(/\/share\/([A-Za-z0-9_-]{20,})/);
  if (sharePathMatch && sharePathMatch[1]) {
    albumMediaKey = sharePathMatch[1];
  }

  const keyParamMatch =
    sourceUrl.match(/[?&]key=([A-Za-z0-9_-]+)/) ||
    html.match(/[?&]key=([A-Za-z0-9_-]{10,})/);
  if (keyParamMatch && keyParamMatch[1]) {
    authKey = keyParamMatch[1];
  }

  let nextPageToken = '';
  const initCallbackRegex =
    /AF_initDataCallback\(\{[^}]*?data\s*:\s*(\[[\s\S]*?\])\s*(?:,\s*sideChannel|\}\s*\))/g;
  let cbMatch: RegExpExecArray | null;
  while ((cbMatch = initCallbackRegex.exec(html)) !== null) {
    const jsonCandidate = cbMatch[1];
    if (!jsonCandidate.includes('lh3.googleusercontent.com')) continue;
    try {
      const parsedData = JSON.parse(jsonCandidate);
      if (Array.isArray(parsedData)) {
        if (typeof parsedData[2] === 'string' && parsedData[2].length > 8) {
          nextPageToken = parsedData[2];
        }
        if (
          !albumMediaKey &&
          Array.isArray(parsedData[3]) &&
          typeof parsedData[3][0] === 'string'
        ) {
          albumMediaKey = parsedData[3][0];
        }
        if (
          !albumMediaKey &&
          Array.isArray(parsedData[0]) &&
          typeof parsedData[0][0] === 'string'
        ) {
          albumMediaKey = parsedData[0][0];
        }
      }
    } catch {
      // Fallback regex below
    }
  }

  if (!nextPageToken) {
    const tokenRegexMatch = html.match(
      /\],\s*"([A-Za-z0-9_-]{24,300})"\s*,\s*(?:null|"|\[\s*"AF1Qip)/
    );
    if (tokenRegexMatch && tokenRegexMatch[1] && !tokenRegexMatch[1].startsWith('http')) {
      nextPageToken = tokenRegexMatch[1];
    }
  }

  if (!albumMediaKey || !nextPageToken) {
    return combinedPhotos;
  }

  const blMatch = html.match(/"cfb2h"\s*:\s*"([^"]+)"/);
  const fSidMatch = html.match(/"FdrFJe"\s*:\s*"([^"]+)"/);
  const blParam = blMatch?.[1] || 'boq_photosuiserver_20240625.06_p0';
  const fSidParam = fSidMatch?.[1] || '';

  const nativeBridge = (window as any)?.HemNativeBridge;
  const seenTokens = new Set<string>();
  let pageGuard = 0;

  while (
    albumMediaKey &&
    nextPageToken &&
    !seenTokens.has(nextPageToken) &&
    pageGuard < 15 &&
    combinedPhotos.length < 5000
  ) {
    seenTokens.add(nextPageToken);
    pageGuard++;

    const rpcPayload = JSON.stringify([
      albumMediaKey,
      nextPageToken,
      null,
      authKey || null,
    ]);
    const freq = JSON.stringify([[['snAcKc', rpcPayload, null, 'generic']]]);
    const bodyStr = `f.req=${encodeURIComponent(freq)}`;

    const batchUrl = `https://photos.google.com/_/PhotosUi/data/batchexecute?rpcids=snAcKc&source-path=${encodeURIComponent(
      `/share/${albumMediaKey}`
    )}&bl=${encodeURIComponent(blParam)}${
      fSidParam ? `&f.sid=${encodeURIComponent(fSidParam)}` : ''
    }&hl=sv&_reqid=${100000 + pageGuard * 10000}&rt=c`;

    let batchText = '';

    // 1. Try Android Native Bridge HTTP POST if available
    if (
      nativeBridge &&
      typeof nativeBridge.localHttpRequestWithHeaders === 'function'
    ) {
      try {
        await new Promise((r) => setTimeout(r, 16));
        batchText =
          nativeBridge.localHttpRequestWithHeaders(
            'POST',
            batchUrl,
            bodyStr,
            JSON.stringify({
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
              Origin: 'https://photos.google.com',
              Referer: 'https://photos.google.com/',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            })
          ) || '';
      } catch {
        batchText = '';
      }
    }

    // 2. Fallback to direct fetch if native bridge wasn't used
    if (!batchText) {
      try {
        const res = await fetch(batchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: bodyStr,
        });
        if (res.ok) {
          batchText = await res.text();
        }
      } catch {
        // Ignore CORS error on web
      }
    }

    if (!batchText) break;

    const countBefore = combinedPhotos.length;
    appendGooglePhotosFromRawText(
      batchText,
      albumTitle,
      seenBaseUrls,
      combinedPhotos,
      5000
    );

    let foundNextToken = '';
    const wrbRegex = /\["wrb\.fr"\s*,\s*"snAcKc"\s*,\s*"((?:[^"\\]|\\.)*)"/g;
    let wrbMatch: RegExpExecArray | null;
    while ((wrbMatch = wrbRegex.exec(batchText)) !== null) {
      try {
        const innerJsonStr = JSON.parse(`"${wrbMatch[1]}"`);
        appendGooglePhotosFromRawText(
          innerJsonStr,
          albumTitle,
          seenBaseUrls,
          combinedPhotos,
          5000
        );
        const innerParsed = JSON.parse(innerJsonStr);
        if (
          Array.isArray(innerParsed) &&
          typeof innerParsed[2] === 'string' &&
          innerParsed[2].length > 8
        ) {
          foundNextToken = innerParsed[2];
        }
      } catch {
        // Ignore
      }
    }

    if (!foundNextToken || combinedPhotos.length === countBefore) {
      break;
    }
    nextPageToken = foundNextToken;
  }

  return combinedPhotos;
}

/**
 * Multi-strategy shared Google Photos album fetcher that supports 520+ photos (up to 5,000)
 * across:
 * - Native Android / iOS Capacitor app (via HemNativeBridge + batchexecute pagination)
 * - Local / Cloud Run server (/api/google-photos/shared-album with batchexecute pagination)
 * - Static Firebase Hosting (hemmahosf.web.app) & GitHub Pages
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
          imageUrl: `${base}=w2560-h2560`,
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
  let bestTitle = 'Google Foto-album';
  const mergedSeenBases = new Set<string>();
  const mergedPhotos: GooglePhotoSlideItem[] = [];

  const mergePhotosList = (title: string, items: GooglePhotoSlideItem[]) => {
    if (
      title &&
      title !== 'Google Foto-album' &&
      title !== 'Google Foto' &&
      bestTitle === 'Google Foto-album'
    ) {
      bestTitle = title;
    }
    for (const item of items) {
      if (!item?.imageUrl) continue;
      const base = item.imageUrl.replace(/=[a-zA-Z0-9_-]+$/, '');
      if (mergedSeenBases.has(base)) continue;
      mergedSeenBases.add(base);
      const idx = mergedPhotos.length + 1;
      mergedPhotos.push({
        id: `gphotos-${idx}-${base.slice(-12)}`,
        imageUrl: `${base}=w2560-h2560`,
        caption: `${bestTitle} · Google Foto`,
      });
    }
  };

  // Strategy 1: Native Android Bridge direct HTML fetch + multi-page batchexecute (zero CORS limits on tablet/phone!)
  try {
    const nativeBridge = (window as any)?.HemNativeBridge;
    if (
      nativeBridge &&
      typeof nativeBridge.localHttpRequestWithHeaders === 'function'
    ) {
      await new Promise((r) => setTimeout(r, 16));
      const rawHtml = nativeBridge.localHttpRequestWithHeaders(
        'GET',
        cleanUrl,
        '',
        JSON.stringify({
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        })
      );
      if (rawHtml && typeof rawHtml === 'string' && rawHtml.length > 200) {
        reachedAnyService = true;
        const parsed = parseGooglePhotosFromHtmlOrText(rawHtml);
        if (parsed.photos.length > 0) {
          const allPages = await paginateGooglePhotosSharedAlbumHtml(
            rawHtml,
            cleanUrl,
            parsed.albumTitle,
            parsed.photos
          );
          mergePhotosList(parsed.albumTitle, allPages);
          if (mergedPhotos.length > 200) {
            return {
              ok: true,
              albumTitle: bestTitle,
              photos: mergedPhotos,
            };
          }
        }
      }
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Backend API endpoint (/api/google-photos/shared-album) — supports full 520+ batchexecute pagination
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
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
          imageUrl: String(p.imageUrl || '').replace(/=w\d+-h\d+.*$/, '=w2560-h2560'),
          caption: String(p.caption || data.albumTitle || 'Google Foto'),
        }));
        mergePhotosList(String(data.albumTitle || 'Google Foto-album'), hiResPhotos);
        if (mergedPhotos.length > 0) {
          return {
            ok: true,
            albumTitle: bestTitle,
            photos: mergedPhotos,
          };
        }
      }
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 3: Public raw HTML CORS proxies (preserves AF_initDataCallback & supports batchexecute pagination)
  const proxyUrls = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
  ];

  for (const pUrl of proxyUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const pRes = await fetch(pUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (pRes.ok) {
        reachedAnyService = true;
        const html = await pRes.text();
        const parsed = parseGooglePhotosFromHtmlOrText(html);
        if (parsed.photos.length > 0) {
          const allPages = await paginateGooglePhotosSharedAlbumHtml(
            html,
            cleanUrl,
            parsed.albumTitle,
            parsed.photos
          );
          mergePhotosList(parsed.albumTitle, allPages);
          if (mergedPhotos.length > 200) {
            return {
              ok: true,
              albumTitle: bestTitle,
              photos: mergedPhotos,
            };
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // Strategy 4: Jina Reader HTML mode (CORS-enabled for hemmahosf.web.app & localhost)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);
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
          const allPages = await paginateGooglePhotosSharedAlbumHtml(
            html,
            cleanUrl,
            parsed.albumTitle,
            parsed.photos
          );
          mergePhotosList(parsed.albumTitle, allPages);
        }
      }
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 5: Jina Reader Default Markdown mode (Simple GET request — zero CORS preflight headers)
  if (mergedPhotos.length === 0) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
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
            mergePhotosList(parsed.albumTitle, parsed.photos);
          }
        }
      }
    } catch {
      // Continue
    }
  }

  if (mergedPhotos.length > 0) {
    return {
      ok: true,
      albumTitle: bestTitle,
      photos: mergedPhotos,
    };
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
 * Automatically paginates nextPageToken to fetch up to 1,000+ photos.
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

  // 2. Try Google Photos Library API (mediaItems with pagination up to 1,000 items)
  try {
    let pageToken = '';
    for (let page = 0; page < 10; page++) {
      const url = `https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100${
        pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
      }`;
      const libRes = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!libRes.ok) break;
      const libData = await libRes.json();
      if (Array.isArray(libData?.mediaItems)) {
        for (const item of libData.mediaItems) {
          if (item?.baseUrl && (!item.mimeType || item.mimeType.startsWith('image/'))) {
            collected.push({
              id: `gphoto-lib-${item.id}`,
              imageUrl: `${item.baseUrl}=w2560-h2560`,
              caption: item.description || item.filename || 'Google Foto',
              takenAt: normalizeExifOrIsoDate(
                item.mediaMetadata?.creationTime || item.createTime
              ),
            });
          }
        }
      }
      if (libData?.nextPageToken) {
        pageToken = String(libData.nextPageToken);
      } else {
        break;
      }
    }
  } catch {
    // Ignore
  }

  // 3. Try Google Drive image files / Google Photos backup folder in full resolution (with pagination + EXIF time)
  try {
    let pageToken = '';
    for (let page = 0; page < 10; page++) {
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        "mimeType contains 'image/' and trashed=false"
      )}&pageSize=100&fields=nextPageToken,files(id,name,createdTime,imageMediaMetadata(time),thumbnailLink,webContentLink)${
        pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
      }`;
      const driveRes = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!driveRes.ok) break;
      const driveData = await driveRes.json();
      if (Array.isArray(driveData?.files)) {
        for (const f of driveData.files) {
          if (f?.thumbnailLink) {
            const hiRes = String(f.thumbnailLink).replace(/=s\d+.*$/, '=w2560-h2560');
            collected.push({
              id: `gdrive-photo-${f.id}`,
              imageUrl: hiRes,
              caption: String(f.name || 'Google Foto').replace(/\.[^/.]+$/, ''),
              takenAt: normalizeExifOrIsoDate(
                f.imageMediaMetadata?.time || f.createdTime
              ),
            });
          }
        }
      }
      if (driveData?.nextPageToken) {
        pageToken = String(driveData.nextPageToken);
      } else {
        break;
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
 * Polls an active Google Photos Picker API session and imports all selected photos
 * in full resolution once the user finishes selecting them in Google Photos.
 */
export async function pollGooglePhotosPickerSession(
  sessionId: string,
  accessToken: string,
  onPhotosPicked?: (photos: GooglePhotoSlideItem[]) => void
): Promise<GooglePhotoSlideItem[]> {
  try {
    const sesRes = await fetch(
      `https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!sesRes.ok) return [];
    const sesData = await sesRes.json();
    if (!sesData?.mediaItemsSet) {
      return [];
    }

    const rawItems: any[] = [];
    let pageToken = '';
    for (let page = 0; page < 10; page++) {
      const itemsRes = await fetch(
        `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${encodeURIComponent(
          sessionId
        )}&pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!itemsRes.ok) break;
      const itemsData = await itemsRes.json();
      if (Array.isArray(itemsData?.mediaItems)) {
        rawItems.push(...itemsData.mediaItems);
      }
      if (itemsData?.nextPageToken) {
        pageToken = String(itemsData.nextPageToken);
      } else {
        break;
      }
    }

    const picked: GooglePhotoSlideItem[] = [];

    for (const item of rawItems) {
      const baseUrl = item?.mediaFile?.baseUrl || item?.baseUrl;
      if (!baseUrl) continue;
      const filename =
        item?.mediaFile?.filename || item?.filename || 'Google Foto';
      const finalUrl = `${baseUrl}=w2560-h2560`;

      picked.push({
        id: `gpicker-${item.id || Date.now()}-${picked.length}`,
        imageUrl: finalUrl,
        caption: String(filename).replace(/\.[^/.]+$/, ''),
        takenAt: normalizeExifOrIsoDate(
          item?.createTime ||
            item?.mediaFile?.createTime ||
            item?.mediaFile?.mediaMetadata?.creationTime
        ),
      });
    }

    if (picked.length > 0 && onPhotosPicked) {
      onPhotosPicked(picked);
    }
    return picked;
  } catch {
    return [];
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

export interface GooglePhotosOAuthFlowResult {
  email: string;
  accessToken?: string;
  photos: GooglePhotoSlideItem[];
  pickerUri: string | null;
  pickerSessionId: string | null;
}

export interface GooglePhotosOAuthCallbacks {
  onStatus: (msg: string) => void;
  onConnected?: (result: GooglePhotosOAuthFlowResult) => void;
  onError?: (msg: string) => void;
}

/**
 * Connects Google account for Google Photos:
 * Supports both callback object `{ onStatus, onConnected, onError }` and direct `(msg) => void` status callback returning a Promise.
 */
export async function startGooglePhotosOAuthFlow(
  callbacksOrOnStatus?: GooglePhotosOAuthCallbacks | ((msg: string) => void)
): Promise<GooglePhotosOAuthFlowResult> {
  const onStatus =
    typeof callbacksOrOnStatus === 'function'
      ? callbacksOrOnStatus
      : callbacksOrOnStatus?.onStatus || (() => {});
  const onConnected =
    typeof callbacksOrOnStatus === 'object' ? callbacksOrOnStatus?.onConnected : undefined;
  const onError =
    typeof callbacksOrOnStatus === 'object' ? callbacksOrOnStatus?.onError : undefined;

  const provider = createGooglePhotosAuthProvider();

  try {
    onStatus('Öppnar Google-inloggning för Google Foto...');
    const result = await signInWithPopup(auth, provider);
    const cred = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = cred?.accessToken;
    const email = result.user?.email || 'Google-konto';

    if (!accessToken) {
      const emptyRes: GooglePhotosOAuthFlowResult = {
        email,
        photos: [],
        pickerUri: null,
        pickerSessionId: null,
      };
      onConnected?.(emptyRes);
      return emptyRes;
    }

    onStatus(`Inloggad som ${email}. Hämtar dina bilder från Google Foto...`);
    const fetched = await fetchGooglePhotosWithAccessToken(accessToken);
    const fullRes: GooglePhotosOAuthFlowResult = {
      email,
      accessToken,
      ...fetched,
    };
    onConnected?.(fullRes);
    return fullRes;
  } catch (err: any) {
    const code = String(err?.code || '');
    const msg = String(err?.message || '');

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      const errMsg =
        'Inloggningen stängdes. Du kan försöka igen eller klistra in en delad albumlänk från Google Foto nedan.';
      onError?.(errMsg);
      throw new Error(errMsg);
    }

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
      onStatus('Omdirigerar till Google-inloggning...');
      await signInWithRedirect(auth, provider);
      throw new Error('OAUTH_REDIRECT_STARTED');
    }

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
        onStatus('Slutför Google Foto-kopplingen i webbläsarfönstret som öppnas...');

        const nativeBridge = (window as any).HemNativeBridge;
        if (nativeBridge && typeof nativeBridge.openInChromeBrowser === 'function') {
          nativeBridge.openInChromeBrowser(connectUrl);
        } else if (nativeBridge && typeof nativeBridge.openExternalUrl === 'function') {
          nativeBridge.openExternalUrl(connectUrl);
        } else {
          window.open(connectUrl, '_blank', 'noopener,noreferrer');
        }

        return await new Promise<GooglePhotosOAuthFlowResult>((resolve, reject) => {
          const startMs = Date.now();
          const pollTimer = setInterval(async () => {
            if (Date.now() - startMs > 120000) {
              clearInterval(pollTimer);
              const timeoutMsg = 'Tidsgränsen för Google Foto-inloggning gick ut.';
              onError?.(timeoutMsg);
              reject(new Error(timeoutMsg));
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
                const bridgedRes: GooglePhotosOAuthFlowResult = {
                  email: String(data.email),
                  accessToken: data.accessToken ? String(data.accessToken) : undefined,
                  photos: parsedPhotos,
                  pickerUri: data.pickerUri ? String(data.pickerUri) : null,
                  pickerSessionId: data.pickerSessionId
                    ? String(data.pickerSessionId)
                    : null,
                };
                onConnected?.(bridgedRes);
                resolve(bridgedRes);
              }
            } catch {
              // Ignore transient poll error
            }
          }, 2000);
        });
      } catch (bridgeErr: any) {
        onError?.(bridgeErr?.message || 'Kunde inte koppla Google-kontot.');
        throw bridgeErr;
      }
    }

    const fallbackMsg =
      'Kunde inte koppla Google-kontot direkt här. Du kan även klistra in en delningslänk till ditt Google Foto-album nedan!';
    onError?.(fallbackMsg);
    throw new Error(fallbackMsg);
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
        photosJson: JSON.stringify(fetched.photos.slice(0, 500)),
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
