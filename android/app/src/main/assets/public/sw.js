/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-5d155c7a'], (function (workbox) { 'use strict';

  importScripts("sw-notifications.js");
  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "sw-notifications.js",
    "revision": "dd0a4702d4968ceea1b15ce24624a985"
  }, {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "5972f62579e221e9ab363a156cfb4de2"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e44a5e6dc20025c3168fc59cb3c99693"
  }, {
    "url": "pwa-192x192.png",
    "revision": "b2fbd2444fc15f964e7ee96682bc15f5"
  }, {
    "url": "integritetspolicy.html",
    "revision": "63cc753e60cb910893bd25e8f4cdaac1"
  }, {
    "url": "index.html",
    "revision": "26a18df1f2d1d314349a2f71267c2d2d"
  }, {
    "url": "icon.svg",
    "revision": "9561aa2f7990350d9b45359a9312fbdb"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "27e3e4ac4694a7946450bbfc91ee45b7"
  }, {
    "url": "play-store/index.html",
    "revision": "63e0795838140cb778d42c71bc669745"
  }, {
    "url": "play-store/Hem-WearOS-4-Tile-Panel-1080x1080.png",
    "revision": "45e3cf31b4c9ad9f0fd3dbf30c9183a9"
  }, {
    "url": "play-store/Hem-WearOS-3-AttGora-1080x1080.png",
    "revision": "1d30b6607d8056766f7e1573a40c655e"
  }, {
    "url": "play-store/Hem-WearOS-2-Kalender-1080x1080.png",
    "revision": "ea8f8c4535119ef383dd381dc5a4e432"
  }, {
    "url": "play-store/Hem-WearOS-1-Inkop-1080x1080.png",
    "revision": "fdcea5c96561f74d38534e1155f65769"
  }, {
    "url": "play-store/Hem-Surfplatta-2-Kalender-Budget-1920x1080.png",
    "revision": "a6dc2680b2a8658ceefdf1da1592f91e"
  }, {
    "url": "play-store/Hem-Surfplatta-1-Oversikt-1920x1080.png",
    "revision": "fbd9d2c3104d137929310479a122170f"
  }, {
    "url": "play-store/Hem-Mobil-5-Budget-Recept-1080x1920.png",
    "revision": "8b679dc9f42f3f808b3c787302811e37"
  }, {
    "url": "play-store/Hem-Mobil-4-Bilder-Delning-1080x1920.png",
    "revision": "80da15a0e8cfef16f87fdc05ac7b6871"
  }, {
    "url": "play-store/Hem-Mobil-3-Inkop-1080x1920.png",
    "revision": "2bd7f0d3a91119ee5250df9a41bf390d"
  }, {
    "url": "play-store/Hem-Mobil-2-Kalender-1080x1920.png",
    "revision": "0c8a1dc2d602b07eef38fec14f1c7903"
  }, {
    "url": "play-store/Hem-Mobil-1-Startsida-1080x1920.png",
    "revision": "dea9f9bd5aec0d57010295838b7fa968"
  }, {
    "url": "play-store/Hem-Funktionsbild-1024x500.png",
    "revision": "e41d1d385c1aa75669aa6a7a86994016"
  }, {
    "url": "play-store/Hem-Appikon-512x512.png",
    "revision": "e44a5e6dc20025c3168fc59cb3c99693"
  }, {
    "url": "icon-proposals/index.html",
    "revision": "051a8d1e8e2a821e014d1cca9bbc8452"
  }, {
    "url": "icon-proposals/forslag_ikon_5.png",
    "revision": "0da8ffa730484fba9c265c43701f93ca"
  }, {
    "url": "icon-proposals/forslag_ikon_4.png",
    "revision": "6b43bd6228cec99a7349820dfa4f3cfa"
  }, {
    "url": "icon-proposals/forslag_ikon_3.png",
    "revision": "2c16556cecf29327ec3e0982ebcc3220"
  }, {
    "url": "icon-proposals/forslag_ikon_2.png",
    "revision": "50e688d07ad4778354be4c6fad4abd67"
  }, {
    "url": "icon-proposals/forslag_ikon_1.png",
    "revision": "000a093286c8714a5dd7cc21e3f92a24"
  }, {
    "url": "assets/index-WMm1A8-E.css",
    "revision": null
  }, {
    "url": "assets/index-DbCwz2jE.js",
    "revision": null
  }, {
    "url": "assets/hub_proposals/forslag_5.png",
    "revision": null
  }, {
    "url": "assets/hub_proposals/forslag_4.png",
    "revision": null
  }, {
    "url": "assets/hub_proposals/forslag_3.png",
    "revision": null
  }, {
    "url": "assets/hub_proposals/forslag_2.png",
    "revision": null
  }, {
    "url": "assets/hub_proposals/forslag_1.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_20261029-163717_a5666e1b.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_20261029-163034_2368f3ed.png",
    "revision": null
  }, {
    "url": "pwa-192x192.png",
    "revision": "b2fbd2444fc15f964e7ee96682bc15f5"
  }, {
    "url": "manifest.webmanifest",
    "revision": "513f44a0082f5c306f3545d010167de6"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/\.aab$/i, /\.apk$/i, /\.png$/i, /\.jks$/i, /integritetspolicy\.html/i, /play-store/i]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/api\.open-meteo\.com\/.*/i, new workbox.NetworkFirst({
    "cacheName": "gothenburg-weather-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 5,
      maxAgeSeconds: 21600
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
