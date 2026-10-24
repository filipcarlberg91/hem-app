import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Configure native Android / iOS Capacitor plugins when running inside native shell
if (typeof window !== 'undefined') {
  const isNativeShell =
    window.location.protocol === 'capacitor:' ||
    Boolean((window as any).Capacitor?.isNativePlatform?.());

  // Manage service workers: unregister in native shell / preview, or auto-update & reload in PWA
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing || isNativeShell) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'HEM_SW_UPDATED_RELOAD') {
        if (!refreshing && !isNativeShell) {
          refreshing = true;
          window.location.reload();
        }
      }
    });

    const checkAndUpdateRegistrations = () => {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const reg of registrations) {
            const scriptUrl =
              reg.active?.scriptURL ||
              reg.installing?.scriptURL ||
              reg.waiting?.scriptURL ||
              '';
            if (
              isNativeShell ||
              scriptUrl.includes('dev-sw.js') ||
              window.location.hostname.includes('run.app')
            ) {
              reg.unregister();
            } else {
              reg.update().catch(() => {});
              if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
              reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', () => {
                  if (
                    newWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              });
            }
          }
        })
        .catch(() => {});
    };

    checkAndUpdateRegistrations();
    // Check for new PWA version every 45 seconds and whenever app comes to foreground
    setInterval(checkAndUpdateRegistrations, 45000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkAndUpdateRegistrations();
      }
    });
    window.addEventListener('focus', checkAndUpdateRegistrations);
    window.addEventListener('pageshow', checkAndUpdateRegistrations);

    if (isNativeShell && 'caches' in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => {});
    }
  }

  const capPlugins = (window as any).Capacitor?.Plugins;
  if (capPlugins?.LocalNotifications) {
    capPlugins.LocalNotifications.requestPermissions?.().catch(() => {});
  }
  if (capPlugins?.StatusBar) {
    capPlugins.StatusBar.setOverlaysWebView?.({ overlay: false }).catch(() => {});
    capPlugins.StatusBar.setBackgroundColor?.({ color: '#F6FBF7' }).catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(<App />);
