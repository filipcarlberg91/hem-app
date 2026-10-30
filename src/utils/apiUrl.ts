const CLOUD_BACKEND_ORIGIN =
  'https://ais-pre-fogx2dfqvxuv367did2b7p-610632574360.europe-west2.run.app';

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  const host = window.location.hostname;
  const isStaticOrNativeHost =
    window.location.protocol === 'capacitor:' ||
    host === 'localhost' ||
    host === 'hemmahosf.web.app' ||
    host === 'hemmahosf.firebaseapp.com' ||
    host.endsWith('.github.io') ||
    Boolean((window as any).Capacitor?.isNativePlatform?.());

  if (isStaticOrNativeHost && path.startsWith('/api/')) {
    return `${CLOUD_BACKEND_ORIGIN}${path}`;
  }
  return path;
}

