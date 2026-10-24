const CLOUD_BACKEND_ORIGIN =
  'https://ais-pre-fogx2dfqvxuv367did2b7p-610632574360.europe-west2.run.app';

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  const isNativeShell =
    window.location.protocol === 'capacitor:' ||
    window.location.hostname === 'localhost' ||
    Boolean((window as any).Capacitor?.isNativePlatform?.());

  if (isNativeShell && path.startsWith('/api/')) {
    return `${CLOUD_BACKEND_ORIGIN}${path}`;
  }
  return path;
}
