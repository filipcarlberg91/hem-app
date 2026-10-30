import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const basePath = process.env.GH_PAGES === 'true' ? '/hem-app/' : '/';
  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        disable: process.env.CAPACITOR_BUILD === 'true',
        registerType: 'autoUpdate',
        manifest: {
          id: basePath,
          name: 'Hem',
          short_name: 'Hem',
          description:
            'Material 3 Expressive livspussel-app med familje- och vändelning, kalender, självsorterande inköpslista, recept och budget.',
          theme_color: '#183D2C',
          background_color: '#F6FBF7',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          start_url: basePath,
          scope: basePath,
          icons: [
            {
              src: 'pwa-192x192.png?v=3',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png?v=3',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png?v=3',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Inköpslista (Widget)',
              short_name: 'Inköpslista',
              description: 'Öppna självsorterande inköpslistan i Material 3 Expressive widget-vy',
              url: `${basePath}#widget-shopping`,
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Kalender (Widget)',
              short_name: 'Kalender',
              description: 'Öppna familjekalendern i Material 3 Expressive widget-vy',
              url: `${basePath}#widget-calendar`,
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Att göra (Widget)',
              short_name: 'Att göra',
              description: 'Öppna uppgifter i Material 3 Expressive widget-vy',
              url: `${basePath}#widget-todo`,
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Smartklocka (Wear OS)',
              short_name: 'Wear OS',
              description: 'Anpassad vy för Wear OS-klocka på handleden',
              url: `${basePath}#wear`,
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          importScripts: ['sw-notifications.js'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: [
            '**/*.jks',
            '**/*.aab',
            '**/*.apk',
            '**/Hem-Play-Store-Appikon-512x512.png',
          ],
          navigateFallbackDenylist: [
            /\.aab$/i,
            /\.apk$/i,
            /\.png$/i,
            /\.jks$/i,
            /integritetspolicy\.html/i,
            /play-store/i,
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'gothenburg-weather-cache',
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60 * 60 * 6,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
