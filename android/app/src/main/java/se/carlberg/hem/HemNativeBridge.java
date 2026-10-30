package se.carlberg.hem;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;
import android.service.notification.StatusBarNotification;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.ArrayList;
import java.util.List;

public class HemNativeBridge {
    private final Context appContext;
    private final MainActivity mainActivity;
    private volatile String lastSpotifyTrack = "";
    private volatile String lastSpotifyArtist = "";
    private volatile String lastSpotifyAlbum = "";
    private volatile String lastSpotifyUri = "";
    private volatile boolean lastSpotifyPlaying = false;
    private volatile int lastSpotifyLengthMs = 0;
    private volatile long lastSpotifyUpdatedAt = 0L;

    public HemNativeBridge(MainActivity activity) {
        this.mainActivity = activity;
        this.appContext = activity.getApplicationContext();
        registerSpotifyMetadataReceiver();
    }

    private void registerSpotifyMetadataReceiver() {
        try {
            android.content.IntentFilter filter = new android.content.IntentFilter();
            filter.addAction("com.spotify.music.metadatachanged");
            filter.addAction("com.spotify.music.playbackstatechanged");
            filter.addAction("com.android.music.metachanged");
            filter.addAction("com.android.music.playstatechanged");

            android.content.BroadcastReceiver receiver = new android.content.BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (intent == null) return;
                    try {
                        String action = intent.getAction();
                        String track = intent.getStringExtra("track");
                        String artist = intent.getStringExtra("artist");
                        String album = intent.getStringExtra("album");
                        String id = intent.getStringExtra("id");
                        if (track != null && !track.isEmpty()) lastSpotifyTrack = track;
                        if (artist != null && !artist.isEmpty()) lastSpotifyArtist = artist;
                        if (album != null && !album.isEmpty()) lastSpotifyAlbum = album;
                        if (id != null && !id.isEmpty()) lastSpotifyUri = id;
                        int len = intent.getIntExtra("length", 0);
                        if (len > 0) lastSpotifyLengthMs = len > 1000 ? len : len * 1000;
                        if (intent.hasExtra("playing")) {
                            lastSpotifyPlaying = intent.getBooleanExtra("playing", false);
                        } else if ("com.spotify.music.metadatachanged".equals(action)) {
                            lastSpotifyPlaying = true;
                        }
                        lastSpotifyUpdatedAt = System.currentTimeMillis();
                    } catch (Throwable ignored) {}
                }
            };

            if (android.os.Build.VERSION.SDK_INT >= 33) {
                appContext.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED);
            } else {
                appContext.registerReceiver(receiver, filter);
            }
        } catch (Throwable ignored) {}
    }

    @JavascriptInterface
    public boolean isSpotifyInstalled() {
        if (appContext == null) return false;
        try {
            return appContext.getPackageManager().getLaunchIntentForPackage("com.spotify.music") != null;
        } catch (Throwable ignored) {
            return false;
        }
    }

    @JavascriptInterface
    public boolean isMediaNotificationAccessGranted() {
        if (appContext == null) return false;
        try {
            String enabled = Settings.Secure.getString(appContext.getContentResolver(), "enabled_notification_listeners");
            return enabled != null && enabled.contains(appContext.getPackageName());
        } catch (Throwable ignored) {
            return false;
        }
    }

    @JavascriptInterface
    public boolean openMediaNotificationAccessSettings() {
        if (appContext == null) return false;
        try {
            Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            appContext.startActivity(intent);
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    @JavascriptInterface
    public String getSpotifyNowPlayingJson() {
        try {
            HemMediaListenerService.refreshFromActiveSessions(appContext);
            JSONObject obj = new JSONObject();

            // Prioritize active MediaSession (Cast, YouTube, SVT Play, Netflix, Spotify, etc.)
            if (HemMediaListenerService.currentPlaying && HemMediaListenerService.currentTrack != null && !HemMediaListenerService.currentTrack.isEmpty()) {
                obj.put("trackTitle", HemMediaListenerService.currentTrack);
                obj.put("artistName", HemMediaListenerService.currentArtist != null ? HemMediaListenerService.currentArtist : "");
                obj.put("albumName", HemMediaListenerService.currentAlbum != null ? HemMediaListenerService.currentAlbum : "");
                obj.put("appName", HemMediaListenerService.currentAppName != null ? HemMediaListenerService.currentAppName : "Media");
                obj.put("deviceName", HemMediaListenerService.currentDeviceName != null ? HemMediaListenerService.currentDeviceName : "Denna enhet");
                obj.put("isCast", HemMediaListenerService.currentIsCast);
                obj.put("mediaType", HemMediaListenerService.currentMediaType != null ? HemMediaListenerService.currentMediaType : "audio");
                obj.put("durationMs", HemMediaListenerService.currentDurationMs);
                obj.put("progressMs", HemMediaListenerService.currentPositionMs);
                obj.put("isPlaying", true);
                obj.put("updatedAt", HemMediaListenerService.lastUpdatedMs);
                return obj.toString();
            }

            // Fallback to Spotify broadcast receiver ONLY if it is actively playing right now
            if (lastSpotifyPlaying && lastSpotifyTrack != null && !lastSpotifyTrack.isEmpty()) {
                obj.put("trackTitle", lastSpotifyTrack);
                obj.put("artistName", lastSpotifyArtist != null ? lastSpotifyArtist : "");
                obj.put("albumName", lastSpotifyAlbum != null ? lastSpotifyAlbum : "");
                obj.put("appName", "Spotify");
                obj.put("deviceName", "Spotify på enheten");
                obj.put("isCast", false);
                obj.put("mediaType", "audio");
                obj.put("spotifyUri", lastSpotifyUri != null ? lastSpotifyUri : "");
                obj.put("durationMs", lastSpotifyLengthMs);
                obj.put("progressMs", 0);
                obj.put("isPlaying", true);
                obj.put("updatedAt", lastSpotifyUpdatedAt);
                return obj.toString();
            }

            obj.put("isPlaying", false);
            obj.put("trackTitle", "");
            return obj.toString();
        } catch (Throwable ignored) {
            return "{}";
        }
    }

    @JavascriptInterface
    public String fetchUrlHtml(String urlStr) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36");
            conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
            conn.setRequestProperty("Accept-Language", "sv-SE,sv;q=0.9,en;q=0.8");
            int code = conn.getResponseCode();
            if (code < 200 || code >= 400) return "";
            InputStream is = conn.getInputStream();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = is.read(buf)) != -1) {
                baos.write(buf, 0, n);
            }
            is.close();
            return new String(baos.toByteArray(), StandardCharsets.UTF_8);
        } catch (Throwable ignored) {
            return "";
        } finally {
            if (conn != null) {
                try { conn.disconnect(); } catch (Throwable ignored) {}
            }
        }
    }

    private static boolean isLocalLanHost(String host) {
        if (host == null) return false;
        String h = host.trim().toLowerCase();
        return h.startsWith("192.168.") ||
               h.startsWith("10.") ||
               h.startsWith("172.16.") || h.startsWith("172.17.") || h.startsWith("172.18.") ||
               h.startsWith("172.19.") || h.startsWith("172.2") || h.startsWith("172.30.") || h.startsWith("172.31.") ||
               h.endsWith(".local") ||
               h.equals("localhost") ||
               h.equals("127.0.0.1");
    }

    private static void applyLocalLanSslTrust(HttpURLConnection conn, String host) {
        if (!(conn instanceof javax.net.ssl.HttpsURLConnection)) return;
        if (!isLocalLanHost(host)) return;
        try {
            javax.net.ssl.HttpsURLConnection https = (javax.net.ssl.HttpsURLConnection) conn;
            javax.net.ssl.TrustManager[] trustAllCerts = new javax.net.ssl.TrustManager[]{
                new javax.net.ssl.X509TrustManager() {
                    @Override
                    public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                        return new java.security.cert.X509Certificate[0];
                    }
                    @Override
                    public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                    @Override
                    public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                }
            };
            javax.net.ssl.SSLContext sc = javax.net.ssl.SSLContext.getInstance("TLS");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            https.setSSLSocketFactory(sc.getSocketFactory());
            https.setHostnameVerifier((hostname, session) -> true);
        } catch (Throwable ignored) {}
    }

    @JavascriptInterface
    public String localHttpRequest(String method, String urlStr, String jsonBody) {
        return localHttpRequestWithHeaders(method, urlStr, jsonBody, "");
    }

    @JavascriptInterface
    public String localHttpRequestWithHeaders(String method, String urlStr, String jsonBody, String headersJson) {
        String res = executeSingleHttpRequest(method, urlStr, jsonBody, headersJson, 4500);
        if (res != null && !res.isEmpty()) {
            return res;
        }
        // If calling a local LAN Hue Bridge IP over http:// or https:// failed, automatically try the alternate protocol
        try {
            URL parsed = new URL(urlStr);
            if (isLocalLanHost(parsed.getHost())) {
                String altUrl = null;
                if (urlStr.startsWith("http://")) {
                    altUrl = "https://" + urlStr.substring(7);
                } else if (urlStr.startsWith("https://")) {
                    altUrl = "http://" + urlStr.substring(8);
                }
                if (altUrl != null) {
                    String altRes = executeSingleHttpRequest(method, altUrl, jsonBody, headersJson, 4500);
                    if (altRes != null && !altRes.isEmpty()) {
                        return altRes;
                    }
                }
            }
        } catch (Throwable ignored) {}
        return "";
    }

    private String executeSingleHttpRequest(String method, String urlStr, String jsonBody, String headersJson, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            applyLocalLanSslTrust(conn, url.getHost());
            conn.setInstanceFollowRedirects(true);
            conn.setRequestMethod(method != null ? method.toUpperCase() : "GET");
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setRequestProperty("Accept", "application/json");
            if (headersJson != null && !headersJson.isEmpty()) {
                try {
                    JSONObject hObj = new JSONObject(headersJson);
                    Iterator<String> keys = hObj.keys();
                    while (keys.hasNext()) {
                        String k = keys.next();
                        String v = hObj.optString(k, "");
                        if (!k.isEmpty() && !v.isEmpty()) {
                            conn.setRequestProperty(k, v);
                        }
                    }
                } catch (Throwable ignored) {}
            }
            if (jsonBody != null && !jsonBody.isEmpty() && ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method))) {
                conn.setDoOutput(true);
                if (conn.getRequestProperty("Content-Type") == null) {
                    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                }
                byte[] outBytes = jsonBody.getBytes(StandardCharsets.UTF_8);
                conn.getOutputStream().write(outBytes);
            }
            int code = conn.getResponseCode();
            InputStream is = (code >= 200 && code < 400) ? conn.getInputStream() : conn.getErrorStream();
            if (is == null) return "";
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = is.read(buf)) != -1) {
                baos.write(buf, 0, n);
            }
            is.close();
            return new String(baos.toByteArray(), StandardCharsets.UTF_8);
        } catch (Throwable ignored) {
            return "";
        } finally {
            if (conn != null) {
                try { conn.disconnect(); } catch (Throwable ignored) {}
            }
        }
    }

    @JavascriptInterface
    public String discoverLocalHueBridgeIp() {
        // 1. Try Philips Hue official cloud discovery first
        try {
            String cloudResp = executeSingleHttpRequest("GET", "https://discovery.meethue.com", "", "", 3500);
            if (cloudResp != null && cloudResp.trim().startsWith("[")) {
                JSONArray arr = new JSONArray(cloudResp);
                if (arr.length() > 0) {
                    JSONObject first = arr.optJSONObject(0);
                    if (first != null) {
                        String ip = first.optString("internalipaddress", "").trim();
                        if (!ip.isEmpty()) return ip;
                    }
                }
            }
        } catch (Throwable ignored) {}

        // 2. Fast parallel LAN /24 subnet scan on local Wi-Fi (checks both WifiManager & NetworkInterface)
        try {
            String subnetPrefix = null;
            try {
                android.net.wifi.WifiManager wm = (android.net.wifi.WifiManager) appContext.getSystemService(Context.WIFI_SERVICE);
                if (wm != null && wm.getConnectionInfo() != null) {
                    int ipInt = wm.getConnectionInfo().getIpAddress();
                    if (ipInt != 0) {
                        String wifiIp = String.format(
                            java.util.Locale.US,
                            "%d.%d.%d.",
                            (ipInt & 0xff),
                            (ipInt >> 8 & 0xff),
                            (ipInt >> 16 & 0xff)
                        );
                        if (!wifiIp.startsWith("0.") && !wifiIp.startsWith("127.")) {
                            subnetPrefix = wifiIp;
                        }
                    }
                }
            } catch (Throwable ignored) {}

            Enumeration<NetworkInterface> nets = NetworkInterface.getNetworkInterfaces();
            while (nets != null && nets.hasMoreElements() && subnetPrefix == null) {
                NetworkInterface ni = nets.nextElement();
                if (!ni.isUp() || ni.isLoopback()) continue;
                Enumeration<InetAddress> addrs = ni.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        String host = addr.getHostAddress();
                        if (host != null && (host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172."))) {
                            int lastDot = host.lastIndexOf('.');
                            if (lastDot > 0) {
                                subnetPrefix = host.substring(0, lastDot + 1);
                                break;
                            }
                        }
                    }
                }
            }
            if (subnetPrefix == null) return "";

            final String prefix = subnetPrefix;
            ExecutorService pool = Executors.newFixedThreadPool(48);
            List<Future<String>> futures = new ArrayList<>();
            for (int i = 1; i <= 254; i++) {
                final String candidateIp = prefix + i;
                futures.add(pool.submit((Callable<String>) () -> {
                    String[] probeUrls = new String[]{
                        "http://" + candidateIp + "/api/0/config",
                        "https://" + candidateIp + "/api/0/config"
                    };
                    for (String pUrl : probeUrls) {
                        HttpURLConnection c = null;
                        try {
                            URL u = new URL(pUrl);
                            c = (HttpURLConnection) u.openConnection();
                            applyLocalLanSslTrust(c, candidateIp);
                            c.setRequestMethod("GET");
                            c.setConnectTimeout(350);
                            c.setReadTimeout(350);
                            if (c.getResponseCode() == 200) {
                                InputStream is = c.getInputStream();
                                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                                byte[] buf = new byte[1024];
                                int n;
                                while ((n = is.read(buf)) != -1) baos.write(buf, 0, n);
                                is.close();
                                String body = new String(baos.toByteArray(), StandardCharsets.UTF_8);
                                String lower = body.toLowerCase();
                                if (lower.contains("bridgeid") || lower.contains("bsb002") || lower.contains("philips hue") || lower.contains("modelid")) {
                                    return candidateIp;
                                }
                            }
                        } catch (Throwable ignored) {
                        } finally {
                            if (c != null) {
                                try { c.disconnect(); } catch (Throwable ignored) {}
                            }
                        }
                    }
                    return "";
                }));
            }
            pool.shutdown();
            pool.awaitTermination(4000, TimeUnit.MILLISECONDS);
            for (Future<String> f : futures) {
                if (f.isDone()) {
                    try {
                        String found = f.get();
                        if (found != null && !found.isEmpty()) return found;
                    } catch (Throwable ignored) {}
                }
            }
        } catch (Throwable ignored) {}
        return "";
    }

    @JavascriptInterface
    public void setKeepScreenOn(final boolean keepOn) {
        if (mainActivity == null) return;
        try {
            mainActivity.runOnUiThread(() -> {
                try {
                    if (keepOn) {
                        mainActivity.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    } else {
                        mainActivity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    }
                } catch (Throwable ignored) {}
            });
        } catch (Throwable ignored) {}
    }

    @JavascriptInterface
    public boolean openInChromeBrowser(String urlStr) {
        if (appContext == null || urlStr == null || urlStr.isEmpty()) return false;
        try {
            android.net.Uri uri = android.net.Uri.parse(urlStr);
            try {
                Intent chromeIntent = new Intent(Intent.ACTION_VIEW, uri);
                chromeIntent.setPackage("com.android.chrome");
                chromeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                appContext.startActivity(chromeIntent);
                return true;
            } catch (Throwable ignored) {}
            Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, uri);
            fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            appContext.startActivity(fallbackIntent);
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    @JavascriptInterface
    public boolean openPhilipsHueApp() {
        if (appContext == null) return false;
        String[] huePackages = new String[]{"com.philips.lighting.hue2", "com.signify.hue.blue"};
        for (String pkg : huePackages) {
            try {
                Intent launchIntent = appContext.getPackageManager().getLaunchIntentForPackage(pkg);
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    appContext.startActivity(launchIntent);
                    return true;
                }
            } catch (Throwable ignored) {}
        }
        try {
            Intent deepIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("philipshue://"));
            deepIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            appContext.startActivity(deepIntent);
            return true;
        } catch (Throwable ignored) {}
        return openInChromeBrowser("https://account.meethue.com");
    }

    @JavascriptInterface
    public boolean launchExternalApp(String packageName, String fallbackUrl) {
        if (appContext == null) return false;
        try {
            if (fallbackUrl != null && !fallbackUrl.isEmpty() && packageName != null && !packageName.isEmpty()) {
                try {
                    Intent deepPkgIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(fallbackUrl));
                    deepPkgIntent.setPackage(packageName);
                    deepPkgIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    deepPkgIntent.putExtra(Intent.EXTRA_REFERRER, android.net.Uri.parse("android-app://" + appContext.getPackageName()));
                    appContext.startActivity(deepPkgIntent);
                    return true;
                } catch (Throwable ignored) {}
            }
            if (packageName != null && !packageName.isEmpty()) {
                Intent launchIntent = appContext.getPackageManager().getLaunchIntentForPackage(packageName);
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    appContext.startActivity(launchIntent);
                    return true;
                }
            }
            if (fallbackUrl != null && !fallbackUrl.isEmpty()) {
                Intent viewIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(fallbackUrl));
                viewIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                appContext.startActivity(viewIntent);
                return true;
            }
        } catch (Throwable ignored) {}
        return false;
    }

    @JavascriptInterface
    public boolean sendMediaControl(String cmd) {
        if (appContext == null) return false;
        try {
            android.media.AudioManager am = (android.media.AudioManager) appContext.getSystemService(Context.AUDIO_SERVICE);
            if (am == null) return false;
            if ("vol_up".equals(cmd)) {
                am.adjustStreamVolume(android.media.AudioManager.STREAM_MUSIC, android.media.AudioManager.ADJUST_RAISE, android.media.AudioManager.FLAG_SHOW_UI);
                return true;
            }
            if ("vol_down".equals(cmd)) {
                am.adjustStreamVolume(android.media.AudioManager.STREAM_MUSIC, android.media.AudioManager.ADJUST_LOWER, android.media.AudioManager.FLAG_SHOW_UI);
                return true;
            }
            if (HemMediaListenerService.dispatchTransportCommand(appContext, cmd)) {
                return true;
            }
            int keyCode = android.view.KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE;
            if ("next".equals(cmd)) keyCode = android.view.KeyEvent.KEYCODE_MEDIA_NEXT;
            else if ("prev".equals(cmd)) keyCode = android.view.KeyEvent.KEYCODE_MEDIA_PREVIOUS;
            else if ("play".equals(cmd)) keyCode = android.view.KeyEvent.KEYCODE_MEDIA_PLAY;
            else if ("pause".equals(cmd)) keyCode = android.view.KeyEvent.KEYCODE_MEDIA_PAUSE;

            long eventTime = android.os.SystemClock.uptimeMillis();
            android.view.KeyEvent downEvent = new android.view.KeyEvent(eventTime, eventTime, android.view.KeyEvent.ACTION_DOWN, keyCode, 0);
            am.dispatchMediaKeyEvent(downEvent);
            android.view.KeyEvent upEvent = new android.view.KeyEvent(eventTime, eventTime, android.view.KeyEvent.ACTION_UP, keyCode, 0);
            am.dispatchMediaKeyEvent(upEvent);
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    @JavascriptInterface
    public boolean isDeviceMusicPlaying() {
        if (appContext == null) return false;
        try {
            android.media.AudioManager am = (android.media.AudioManager) appContext.getSystemService(Context.AUDIO_SERVICE);
            return am != null && am.isMusicActive();
        } catch (Throwable ignored) {
            return false;
        }
    }

    @JavascriptInterface
    public boolean openSystemMediaOutputSwitcher() {
        if (appContext == null) return false;
        try {
            Intent panelIntent = new Intent("com.android.settings.panel.action.MEDIA_OUTPUT");
            panelIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            appContext.startActivity(panelIntent);
            return true;
        } catch (Throwable ignored) {}
        try {
            Intent sysUiIntent = new Intent("com.android.systemui.action.LAUNCH_MEDIA_OUTPUT_DIALOG");
            sysUiIntent.setPackage("com.android.systemui");
            sysUiIntent.putExtra("package_name", appContext.getPackageName());
            appContext.sendBroadcast(sysUiIntent);
            return true;
        } catch (Throwable ignored) {}
        try {
            Intent castIntent = new Intent("android.settings.CAST_SETTINGS");
            castIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            appContext.startActivity(castIntent);
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    @JavascriptInterface
    public boolean openGoogleHomeApp() {
        if (appContext == null) return false;
        try {
            Intent launchIntent = appContext.getPackageManager().getLaunchIntentForPackage("com.google.android.apps.chromecast.app");
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                appContext.startActivity(launchIntent);
                return true;
            }
        } catch (Throwable ignored) {}
        return openInChromeBrowser("https://home.google.com");
    }

    private static final java.util.concurrent.ConcurrentHashMap<String, JSONObject> discoveredCastDevices = new java.util.concurrent.ConcurrentHashMap<>();
    private volatile boolean nsdDiscoveryActive = false;
    private volatile boolean sonosNsdDiscoveryActive = false;
    private volatile long lastAutoSubnetScanMs = 0L;
    private volatile boolean subnetScanInProgress = false;
    private android.net.nsd.NsdManager.DiscoveryListener castNsdListener = null;
    private android.net.nsd.NsdManager.DiscoveryListener sonosNsdListener = null;
    private android.net.wifi.WifiManager.MulticastLock multicastLock = null;

    private void acquireMulticastLockSafe() {
        if (appContext == null) return;
        try {
            if (multicastLock == null) {
                android.net.wifi.WifiManager wm = (android.net.wifi.WifiManager) appContext.getSystemService(Context.WIFI_SERVICE);
                if (wm != null) {
                    multicastLock = wm.createMulticastLock("hem_cast_sonos_multicast");
                    multicastLock.setReferenceCounted(false);
                }
            }
            if (multicastLock != null && !multicastLock.isHeld()) {
                multicastLock.acquire();
            }
        } catch (Throwable ignored) {}
    }

    private void ensureCastNsdDiscoveryStarted() {
        if (appContext == null) return;
        acquireMulticastLockSafe();
        try {
            final android.net.nsd.NsdManager nsd = (android.net.nsd.NsdManager) appContext.getSystemService(Context.NSD_SERVICE);
            if (nsd == null) return;

            if (!nsdDiscoveryActive) {
                castNsdListener = new android.net.nsd.NsdManager.DiscoveryListener() {
                    @Override public void onStartDiscoveryFailed(String serviceType, int errorCode) { nsdDiscoveryActive = false; }
                    @Override public void onStopDiscoveryFailed(String serviceType, int errorCode) {}
                    @Override public void onDiscoveryStarted(String serviceType) { nsdDiscoveryActive = true; }
                    @Override public void onDiscoveryStopped(String serviceType) { nsdDiscoveryActive = false; }
                    @Override
                    public void onServiceFound(android.net.nsd.NsdServiceInfo serviceInfo) {
                        if (serviceInfo == null) return;
                        try {
                            nsd.resolveService(serviceInfo, new android.net.nsd.NsdManager.ResolveListener() {
                                @Override public void onResolveFailed(android.net.nsd.NsdServiceInfo si, int err) {}
                                @Override
                                public void onServiceResolved(android.net.nsd.NsdServiceInfo si) {
                                    if (si == null || si.getHost() == null) return;
                                    try {
                                        String ip = si.getHost().getHostAddress();
                                        if (ip == null || ip.isEmpty()) return;
                                        int port = si.getPort() > 0 ? si.getPort() : 8009;
                                        String fn = "";
                                        String md = "";
                                        String st = "";
                                        String rs = "";
                                        String ca = "";
                                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                                            java.util.Map<String, byte[]> attrs = si.getAttributes();
                                            if (attrs != null) {
                                                if (attrs.get("fn") != null) fn = new String(attrs.get("fn"), StandardCharsets.UTF_8).trim();
                                                if (attrs.get("md") != null) md = new String(attrs.get("md"), StandardCharsets.UTF_8).trim();
                                                if (attrs.get("st") != null) st = new String(attrs.get("st"), StandardCharsets.UTF_8).trim();
                                                if (attrs.get("rs") != null) rs = new String(attrs.get("rs"), StandardCharsets.UTF_8).trim();
                                                if (attrs.get("ca") != null) ca = new String(attrs.get("ca"), StandardCharsets.UTF_8).trim();
                                            }
                                        }
                                        if (fn.isEmpty()) {
                                            String rawSvc = si.getServiceName() != null ? si.getServiceName() : "";
                                            // Strip trailing UUID hash from service name if present (e.g. "Google-TV-Streamer-4a8b...")
                                            fn = rawSvc.replaceAll("-[0-9a-fA-F]{16,}$", "").replace('-', ' ').trim();
                                            if (fn.isEmpty()) fn = "Google Cast (" + ip + ")";
                                        }
                                        boolean isTv = md.toLowerCase().contains("tv") ||
                                                       md.toLowerCase().contains("streamer") ||
                                                       md.toLowerCase().contains("chromecast") ||
                                                       fn.toLowerCase().contains("tv") ||
                                                       fn.toLowerCase().contains("streamer");
                                        try {
                                            if (!ca.isEmpty() && (Integer.parseInt(ca) & 1) != 0) isTv = true;
                                        } catch (Throwable ignored) {}

                                        JSONObject item = discoveredCastDevices.getOrDefault(ip, new JSONObject());
                                        item.put("id", "cast-" + ip.replace(".", "-"));
                                        item.put("ip", ip);
                                        item.put("port", port);
                                        item.put("name", fn);
                                        item.put("model", md);
                                        item.put("type", isTv ? "TV" : "Speaker");
                                        boolean activeNow = "1".equals(st) || (!rs.isEmpty() && !rs.equalsIgnoreCase("Backdrop") && !rs.equalsIgnoreCase("Idle"));
                                        item.put("isActive", activeNow);
                                        if (!rs.isEmpty()) item.put("appName", rs);
                                        if (!item.has("volumePercent")) item.put("volumePercent", 65);
                                        item.put("source", "google-cast");
                                        discoveredCastDevices.put(ip, item);
                                    } catch (Throwable ignored) {}
                                }
                            });
                        } catch (Throwable ignored) {}
                    }
                    @Override public void onServiceLost(android.net.nsd.NsdServiceInfo serviceInfo) {}
                };
                nsd.discoverServices("_googlecast._tcp.", android.net.nsd.NsdManager.PROTOCOL_DNS_SD, castNsdListener);
            }

            if (!sonosNsdDiscoveryActive) {
                sonosNsdListener = new android.net.nsd.NsdManager.DiscoveryListener() {
                    @Override public void onStartDiscoveryFailed(String s, int e) { sonosNsdDiscoveryActive = false; }
                    @Override public void onStopDiscoveryFailed(String s, int e) {}
                    @Override public void onDiscoveryStarted(String s) { sonosNsdDiscoveryActive = true; }
                    @Override public void onDiscoveryStopped(String s) { sonosNsdDiscoveryActive = false; }
                    @Override
                    public void onServiceFound(android.net.nsd.NsdServiceInfo serviceInfo) {
                        if (serviceInfo == null) return;
                        try {
                            nsd.resolveService(serviceInfo, new android.net.nsd.NsdManager.ResolveListener() {
                                @Override public void onResolveFailed(android.net.nsd.NsdServiceInfo si, int err) {}
                                @Override
                                public void onServiceResolved(android.net.nsd.NsdServiceInfo si) {
                                    if (si == null || si.getHost() == null) return;
                                    try {
                                        final String ip = si.getHost().getHostAddress();
                                        if (ip != null && !ip.isEmpty()) {
                                            new Thread(() -> probeSonosDeviceOnPort1400(ip)).start();
                                        }
                                    } catch (Throwable ignored) {}
                                }
                            });
                        } catch (Throwable ignored) {}
                    }
                    @Override public void onServiceLost(android.net.nsd.NsdServiceInfo s) {}
                };
                nsd.discoverServices("_sonos._tcp.", android.net.nsd.NsdManager.PROTOCOL_DNS_SD, sonosNsdListener);
            }
        } catch (Throwable ignored) {}
    }

    private static String extractXmlTag(String xml, String tag) {
        if (xml == null || tag == null) return "";
        String open = "<" + tag + ">";
        String close = "</" + tag + ">";
        int s = xml.indexOf(open);
        if (s < 0) {
            // Try with attributes or namespace prefix
            int alt = xml.indexOf("<" + tag + " ");
            if (alt >= 0) {
                int gt = xml.indexOf('>', alt);
                if (gt > alt) s = gt + 1;
            } else {
                return "";
            }
        } else {
            s += open.length();
        }
        int e = xml.indexOf(close, s);
        if (e > s) {
            return unescapeXml(xml.substring(s, e).trim());
        }
        return "";
    }

    private static String unescapeXml(String s) {
        if (s == null) return "";
        return s.replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&amp;", "&");
    }

    private static long parseDurationStringToMs(String hhmmss) {
        if (hhmmss == null || hhmmss.isEmpty()) return 0L;
        try {
            String[] parts = hhmmss.trim().split(":");
            if (parts.length == 3) {
                long h = Long.parseLong(parts[0]);
                long m = Long.parseLong(parts[1]);
                double sec = Double.parseDouble(parts[2]);
                return (h * 3600L + m * 60L) * 1000L + Math.round(sec * 1000.0);
            } else if (parts.length == 2) {
                long m = Long.parseLong(parts[0]);
                double sec = Double.parseDouble(parts[1]);
                return m * 60000L + Math.round(sec * 1000.0);
            }
        } catch (Throwable ignored) {}
        return 0L;
    }

    private static String formatMsToHhMmSs(long ms) {
        long totalSec = Math.max(0L, ms / 1000L);
        long h = totalSec / 3600L;
        long m = (totalSec % 3600L) / 60L;
        long s = totalSec % 60L;
        return String.format(java.util.Locale.US, "%02d:%02d:%02d", h, m, s);
    }

    private String sendSonosSoapAction(String ip, String controlPath, String serviceType, String actionName, String innerBodyXml, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL("http://" + ip + ":1400" + controlPath);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "text/xml; charset=\"utf-8\"");
            conn.setRequestProperty("SOAPAction", "\"urn:schemas-upnp-org:service:" + serviceType + ":1#" + actionName + "\"");
            String envelope = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
                "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">" +
                "<s:Body><u:" + actionName + " xmlns:u=\"urn:schemas-upnp-org:service:" + serviceType + ":1\">" +
                innerBodyXml +
                "</u:" + actionName + "></s:Body></s:Envelope>";
            byte[] out = envelope.getBytes(StandardCharsets.UTF_8);
            conn.getOutputStream().write(out);
            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) {
                InputStream is = conn.getInputStream();
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buf = new byte[4096];
                int n;
                while ((n = is.read(buf)) != -1) baos.write(buf, 0, n);
                is.close();
                return new String(baos.toByteArray(), StandardCharsets.UTF_8);
            }
        } catch (Throwable ignored) {
        } finally {
            if (conn != null) {
                try { conn.disconnect(); } catch (Throwable ignored) {}
            }
        }
        return "";
    }

    private JSONObject probeSonosDeviceOnPort1400(String ip) {
        try {
            String descXml = executeSingleHttpRequest("GET", "http://" + ip + ":1400/xml/device_description.xml", "", "", 420);
            if (descXml == null || !descXml.toLowerCase().contains("sonos")) return null;

            String roomName = extractXmlTag(descXml, "roomName");
            String displayName = extractXmlTag(descXml, "displayName");
            String modelName = extractXmlTag(descXml, "modelName");
            String friendlyName = extractXmlTag(descXml, "friendlyName");

            // Ignore Sonos Boost / Bridge non-audio infrastructure
            String lowerModel = (modelName + " " + displayName).toLowerCase();
            if (lowerModel.contains("boost") || lowerModel.contains("bridge")) return null;

            String speakerTitle;
            if (!roomName.isEmpty()) {
                String shortModel = !displayName.isEmpty() ? displayName : modelName.replace("Sonos ", "").trim();
                if (!shortModel.isEmpty() && !roomName.toLowerCase().contains("sonos")) {
                    speakerTitle = roomName + " (Sonos " + shortModel.replace("Sonos ", "") + ")";
                } else {
                    speakerTitle = roomName;
                }
            } else if (!friendlyName.isEmpty()) {
                speakerTitle = friendlyName;
            } else {
                speakerTitle = "Sonos (" + ip + ")";
            }

            boolean isTvBar = lowerModel.contains("beam") || lowerModel.contains("arc") || lowerModel.contains("ray") || lowerModel.contains("playbar") || lowerModel.contains("playbase");

            JSONObject result = discoveredCastDevices.getOrDefault(ip, new JSONObject());
            result.put("id", "sonos-" + ip.replace(".", "-"));
            result.put("ip", ip);
            result.put("port", 1400);
            result.put("name", speakerTitle);
            result.put("roomName", roomName);
            result.put("model", !modelName.isEmpty() ? modelName : "Sonos");
            result.put("type", isTvBar ? "TV" : "Speaker");
            result.put("source", "google-cast");
            if (!result.has("volumePercent")) result.put("volumePercent", 50);

            // Query current volume via UPnP RenderingControl
            String volResp = sendSonosSoapAction(ip, "/MediaRenderer/RenderingControl/Control", "RenderingControl", "GetVolume", "<InstanceID>0</InstanceID><Channel>Master</Channel>", 380);
            String curVolStr = extractXmlTag(volResp, "CurrentVolume");
            if (!curVolStr.isEmpty()) {
                try {
                    result.put("volumePercent", Math.max(0, Math.min(100, Integer.parseInt(curVolStr.trim()))));
                } catch (Throwable ignored) {}
            }

            // Query transport state (PLAYING / PAUSED_PLAYBACK / STOPPED)
            String transResp = sendSonosSoapAction(ip, "/MediaRenderer/AVTransport/Control", "AVTransport", "GetTransportInfo", "<InstanceID>0</InstanceID>", 380);
            String tState = extractXmlTag(transResp, "CurrentTransportState");
            boolean isPlayingNow = "PLAYING".equalsIgnoreCase(tState) || "TRANSITIONING".equalsIgnoreCase(tState);
            result.put("isPlaying", isPlayingNow);
            result.put("isActive", isPlayingNow);

            if (isPlayingNow) {
                String posResp = sendSonosSoapAction(ip, "/MediaRenderer/AVTransport/Control", "AVTransport", "GetPositionInfo", "<InstanceID>0</InstanceID>", 420);
                String durStr = extractXmlTag(posResp, "TrackDuration");
                String relStr = extractXmlTag(posResp, "RelTime");
                String metaXml = extractXmlTag(posResp, "TrackMetaData");

                long durMs = parseDurationStringToMs(durStr);
                long progMs = parseDurationStringToMs(relStr);
                String title = extractXmlTag(metaXml, "dc:title");
                String artist = extractXmlTag(metaXml, "dc:creator");
                if (artist.isEmpty()) artist = extractXmlTag(metaXml, "upnp:artist");
                if (artist.isEmpty()) artist = extractXmlTag(metaXml, "r:streamContent");
                String artUri = extractXmlTag(metaXml, "upnp:albumArtURI");
                if (!artUri.isEmpty() && artUri.startsWith("/")) {
                    artUri = "http://" + ip + ":1400" + artUri;
                }

                if (!title.isEmpty() && !title.startsWith("x-rincon") && !title.startsWith("x-sonos")) {
                    result.put("trackTitle", title);
                    result.put("artistName", !artist.isEmpty() ? artist : ("Sonos · " + (!roomName.isEmpty() ? roomName : speakerTitle)));
                    result.put("appName", "Sonos");
                    result.put("mediaType", "audio");
                    result.put("isCast", false);
                    result.put("durationMs", durMs);
                    result.put("progressMs", progMs);
                    if (!artUri.isEmpty()) result.put("albumArtUrl", artUri);
                }
            }

            discoveredCastDevices.put(ip, result);
            return result;
        } catch (Throwable ignored) {
            return null;
        }
    }

    private void runSsdpDiscoveryBurst() {
        java.net.DatagramSocket socket = null;
        try {
            acquireMulticastLockSafe();
            socket = new java.net.DatagramSocket();
            socket.setSoTimeout(350);
            InetAddress group = InetAddress.getByName("239.255.255.250");
            String[] searchTargets = new String[]{
                "urn:schemas-upnp-org:device:ZonePlayer:1",
                "urn:dial-multiscreen-org:service:dial:1",
                "urn:schemas-upnp-org:device:MediaRenderer:1"
            };
            for (String st : searchTargets) {
                String msg = "M-SEARCH * HTTP/1.1\r\n" +
                             "HOST: 239.255.255.250:1900\r\n" +
                             "MAN: \"ssdp:discover\"\r\n" +
                             "MX: 1\r\n" +
                             "ST: " + st + "\r\n\r\n";
                byte[] sendData = msg.getBytes(StandardCharsets.UTF_8);
                socket.send(new java.net.DatagramPacket(sendData, sendData.length, group, 1900));
            }
            long deadline = System.currentTimeMillis() + 650L;
            byte[] buf = new byte[2048];
            while (System.currentTimeMillis() < deadline) {
                java.net.DatagramPacket recv = new java.net.DatagramPacket(buf, buf.length);
                socket.receive(recv);
                String resp = new String(recv.getData(), 0, recv.getLength(), StandardCharsets.UTF_8);
                String senderIp = recv.getAddress() != null ? recv.getAddress().getHostAddress() : "";
                String lower = resp.toLowerCase();
                if (!senderIp.isEmpty()) {
                    if (lower.contains("sonos") || lower.contains(":1400")) {
                        probeSonosDeviceOnPort1400(senderIp);
                    } else if (lower.contains(":8008") || lower.contains("cast") || lower.contains("eureka") || lower.contains("dial")) {
                        probeCastDeviceOnPort8009(senderIp, 8009);
                    }
                }
            }
        } catch (Throwable ignored) {
        } finally {
            if (socket != null) {
                try { socket.close(); } catch (Throwable ignored) {}
            }
        }
    }

    private static void writeProtoVarint(ByteArrayOutputStream out, int val) {
        int v = val;
        while ((v & ~0x7F) != 0) {
            out.write((v & 0x7F) | 0x80);
            v >>>= 7;
        }
        out.write(v & 0x7F);
    }

    private static void writeProtoString(ByteArrayOutputStream out, int fieldTag, String str) {
        byte[] bytes = (str != null ? str : "").getBytes(StandardCharsets.UTF_8);
        out.write(fieldTag);
        writeProtoVarint(out, bytes.length);
        out.write(bytes, 0, bytes.length);
    }

    private static byte[] buildCastV2MessagePacket(String destId, String namespace, String jsonPayload) {
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.write(0x08);
        body.write(0x00); // protocol_version = 0 (CASTV2_1_0)
        writeProtoString(body, 0x12, "sender-0");
        writeProtoString(body, 0x1a, destId);
        writeProtoString(body, 0x22, namespace);
        body.write(0x28);
        body.write(0x00); // payload_type = 0 (STRING)
        writeProtoString(body, 0x32, jsonPayload);

        byte[] msgBytes = body.toByteArray();
        int len = msgBytes.length;
        ByteArrayOutputStream packet = new ByteArrayOutputStream(4 + len);
        packet.write((len >>> 24) & 0xFF);
        packet.write((len >>> 16) & 0xFF);
        packet.write((len >>> 8) & 0xFF);
        packet.write(len & 0xFF);
        packet.write(msgBytes, 0, len);
        return packet.toByteArray();
    }

    private static String readCastV2JsonMessage(InputStream is) throws Exception {
        int b0 = is.read();
        if (b0 < 0) return null;
        int b1 = is.read();
        int b2 = is.read();
        int b3 = is.read();
        if (b1 < 0 || b2 < 0 || b3 < 0) return null;
        int len = ((b0 & 0xFF) << 24) | ((b1 & 0xFF) << 16) | ((b2 & 0xFF) << 8) | (b3 & 0xFF);
        if (len <= 0 || len > 262144) return null;
        byte[] buf = new byte[len];
        int readTotal = 0;
        while (readTotal < len) {
            int n = is.read(buf, readTotal, len - readTotal);
            if (n < 0) break;
            readTotal += n;
        }
        String raw = new String(buf, 0, readTotal, StandardCharsets.UTF_8);
        int firstBrace = raw.indexOf("{\"");
        int lastBrace = raw.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return raw.substring(firstBrace, lastBrace + 1);
        }
        return null;
    }

    private String fetchCastFriendlyNameHttp(String ip) {
        String[] urls = new String[]{
            "http://" + ip + ":8008/setup/eureka_info?params=name,device_info",
            "https://" + ip + ":8443/setup/eureka_info?params=name,device_info",
            "http://" + ip + ":8008/setup/eureka_info"
        };
        for (String u : urls) {
            try {
                String eureka = executeSingleHttpRequest("GET", u, "", "", 380);
                if (eureka != null && eureka.contains("\"name\"")) {
                    JSONObject o = new JSONObject(eureka);
                    String n = o.optString("name", "").trim();
                    if (!n.isEmpty()) return n;
                }
            } catch (Throwable ignored) {}
        }
        try {
            String xml = executeSingleHttpRequest("GET", "http://" + ip + ":8008/ssdp/device-desc.xml", "", "", 380);
            if (xml != null && xml.contains("<friendlyName>")) {
                String fn = extractXmlTag(xml, "friendlyName");
                if (!fn.isEmpty()) return fn;
            }
        } catch (Throwable ignored) {}
        return "";
    }

    private JSONObject probeCastDeviceOnPort8009(String ip, int port) {
        javax.net.ssl.SSLSocket sock = null;
        try {
            javax.net.ssl.TrustManager[] trustAll = new javax.net.ssl.TrustManager[]{
                new javax.net.ssl.X509TrustManager() {
                    @Override public java.security.cert.X509Certificate[] getAcceptedIssuers() { return new java.security.cert.X509Certificate[0]; }
                    @Override public void checkClientTrusted(java.security.cert.X509Certificate[] c, String a) {}
                    @Override public void checkServerTrusted(java.security.cert.X509Certificate[] c, String a) {}
                }
            };
            javax.net.ssl.SSLContext sc = javax.net.ssl.SSLContext.getInstance("TLS");
            sc.init(null, trustAll, new java.security.SecureRandom());
            java.net.Socket rawSock = new java.net.Socket();
            rawSock.connect(new java.net.InetSocketAddress(ip, port > 0 ? port : 8009), 340);
            sock = (javax.net.ssl.SSLSocket) sc.getSocketFactory().createSocket(rawSock, ip, port > 0 ? port : 8009, true);
            sock.setSoTimeout(600);
            sock.startHandshake();

            java.io.OutputStream os = sock.getOutputStream();
            InputStream is = sock.getInputStream();

            os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.tp.connection", "{\"type\":\"CONNECT\"}"));
            os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.receiver", "{\"type\":\"GET_STATUS\",\"requestId\":1}"));
            os.flush();

            JSONObject existing = discoveredCastDevices.get(ip);
            String name = existing != null ? existing.optString("name", "") : "";
            String model = existing != null ? existing.optString("model", "") : "";
            if (name.isEmpty() || name.startsWith("Google Cast (") || name.startsWith("Cast (")) {
                String httpName = fetchCastFriendlyNameHttp(ip);
                if (!httpName.isEmpty()) name = httpName;
            }
            if (name.isEmpty()) {
                name = "Google TV / Cast (" + ip + ")";
            }

            boolean isTv = (existing != null && "TV".equals(existing.optString("type"))) ||
                           name.toLowerCase().contains("tv") ||
                           name.toLowerCase().contains("streamer") ||
                           name.toLowerCase().contains("chromecast") ||
                           model.toLowerCase().contains("tv") ||
                           model.toLowerCase().contains("streamer");

            JSONObject result = new JSONObject();
            result.put("id", "cast-" + ip.replace(".", "-"));
            result.put("ip", ip);
            result.put("port", port > 0 ? port : 8009);
            result.put("name", name);
            result.put("model", model);
            result.put("type", isTv ? "TV" : "Speaker");
            result.put("source", "google-cast");
            result.put("volumePercent", existing != null ? existing.optInt("volumePercent", 60) : 60);
            result.put("isActive", false);
            result.put("isPlaying", false);

            for (int step = 0; step < 6; step++) {
                String msgStr = readCastV2JsonMessage(is);
                if (msgStr == null) break;
                JSONObject msg = new JSONObject(msgStr);
                String msgType = msg.optString("type", "");
                if ("PING".equals(msgType)) {
                    os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.tp.heartbeat", "{\"type\":\"PONG\"}"));
                    os.flush();
                    continue;
                }
                if ("RECEIVER_STATUS".equals(msgType)) {
                    JSONObject status = msg.optJSONObject("status");
                    if (status != null) {
                        JSONObject vol = status.optJSONObject("volume");
                        if (vol != null) {
                            double lvl = vol.optDouble("level", 0.6);
                            result.put("volumePercent", Math.max(0, Math.min(100, (int) Math.round(lvl * 100.0))));
                            result.put("isMuted", vol.optBoolean("muted", false));
                        }
                        JSONArray apps = status.optJSONArray("applications");
                        if (apps != null && apps.length() > 0) {
                            JSONObject app = apps.optJSONObject(0);
                            if (app != null) {
                                String appId = app.optString("appId", "");
                                boolean isIdle = app.optBoolean("isIdleScreen", false) ||
                                                 "E8C28D3C".equals(appId) ||
                                                 "00000000-0000-0000-0000-000000000000".equals(appId);
                                String displayName = app.optString("displayName", "").trim();
                                String statusText = app.optString("statusText", "").trim();
                                String transportId = app.optString("transportId", "").trim();
                                boolean isBackdrop = displayName.equalsIgnoreCase("Backdrop") ||
                                                     displayName.equalsIgnoreCase("Ambient Mode") ||
                                                     displayName.equalsIgnoreCase("Google TV") ||
                                                     displayName.equalsIgnoreCase("Android TV");
                                if (!isIdle && !displayName.isEmpty() && !isBackdrop) {
                                    result.put("isActive", true);
                                    result.put("isPlaying", true);
                                    result.put("appName", displayName);
                                    result.put("statusText", statusText);
                                    result.put("transportId", transportId);
                                    result.put("mediaType", displayName.toLowerCase().contains("spotify") ? "audio" : "video");
                                    String cleanStatus = statusText
                                        .replace("Casting:", "")
                                        .replace("Now Playing:", "")
                                        .replace("Spelar upp:", "")
                                        .trim();
                                    result.put("trackTitle", !cleanStatus.isEmpty() && !cleanStatus.equalsIgnoreCase("Now Playing") && !cleanStatus.equalsIgnoreCase("Casting") ? cleanStatus : displayName);
                                    result.put("artistName", displayName + " · " + name);

                                    // Query MEDIA_STATUS on transportId for rich title, channel, thumbnail & duration
                                    if (!transportId.isEmpty()) {
                                        try {
                                            os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.tp.connection", "{\"type\":\"CONNECT\"}"));
                                            os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\"type\":\"GET_STATUS\",\"requestId\":2}"));
                                            os.flush();
                                            for (int mStep = 0; mStep < 5; mStep++) {
                                                String mediaMsgStr = readCastV2JsonMessage(is);
                                                if (mediaMsgStr == null) break;
                                                JSONObject mObj = new JSONObject(mediaMsgStr);
                                                String mType = mObj.optString("type", "");
                                                if ("PING".equals(mType)) {
                                                    os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.tp.heartbeat", "{\"type\":\"PONG\"}"));
                                                    os.flush();
                                                    continue;
                                                }
                                                if ("MEDIA_STATUS".equals(mType)) {
                                                    JSONArray stArr = mObj.optJSONArray("status");
                                                    if (stArr != null && stArr.length() > 0) {
                                                        JSONObject mSt = stArr.optJSONObject(0);
                                                        if (mSt != null) {
                                                            String pState = mSt.optString("playerState", "PLAYING");
                                                            boolean playingNow = "PLAYING".equalsIgnoreCase(pState) || "BUFFERING".equalsIgnoreCase(pState) || "PAUSED".equalsIgnoreCase(pState);
                                                            result.put("isPlaying", playingNow);
                                                            result.put("mediaSessionId", mSt.optInt("mediaSessionId", 1));
                                                            double curSec = mSt.optDouble("currentTime", 0.0);
                                                            result.put("progressMs", Math.max(0L, Math.round(curSec * 1000.0)));
                                                            JSONObject mediaInfo = mSt.optJSONObject("media");
                                                            if (mediaInfo != null) {
                                                                double durSec = mediaInfo.optDouble("duration", 0.0);
                                                                if (durSec > 0) {
                                                                    result.put("durationMs", Math.round(durSec * 1000.0));
                                                                }
                                                                String streamType = mediaInfo.optString("contentType", "").toLowerCase();
                                                                if (streamType.startsWith("video/")) {
                                                                    result.put("mediaType", "video");
                                                                }
                                                                JSONObject meta = mediaInfo.optJSONObject("metadata");
                                                                if (meta != null) {
                                                                    String mTitle = meta.optString("title", "").trim();
                                                                    String mSub = meta.optString("subtitle", meta.optString("artist", meta.optString("seriesTitle", ""))).trim();
                                                                    if (!mTitle.isEmpty()) result.put("trackTitle", mTitle);
                                                                    if (!mSub.isEmpty()) result.put("artistName", mSub + " · " + displayName);
                                                                    JSONArray imgs = meta.optJSONArray("images");
                                                                    if (imgs != null && imgs.length() > 0) {
                                                                        JSONObject img0 = imgs.optJSONObject(0);
                                                                        if (img0 != null && !img0.optString("url", "").isEmpty()) {
                                                                            result.put("albumArtUrl", img0.optString("url", ""));
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    break;
                                                }
                                            }
                                        } catch (Throwable ignored) {}
                                    }
                                }
                            }
                        }
                    }
                    break;
                }
            }
            discoveredCastDevices.put(ip, result);
            return result;
        } catch (Throwable ignored) {
            return null;
        } finally {
            if (sock != null) {
                try { sock.close(); } catch (Throwable ignored) {}
            }
        }
    }

    private String getLocalWifiSubnetPrefix() {
        try {
            android.net.wifi.WifiManager wm = (android.net.wifi.WifiManager) appContext.getSystemService(Context.WIFI_SERVICE);
            if (wm != null && wm.getConnectionInfo() != null) {
                int ipInt = wm.getConnectionInfo().getIpAddress();
                if (ipInt != 0) {
                    String wifiIp = String.format(
                        java.util.Locale.US,
                        "%d.%d.%d.",
                        (ipInt & 0xff),
                        (ipInt >> 8 & 0xff),
                        (ipInt >> 16 & 0xff)
                    );
                    if (!wifiIp.startsWith("0.") && !wifiIp.startsWith("127.")) {
                        return wifiIp;
                    }
                }
            }
        } catch (Throwable ignored) {}
        try {
            Enumeration<NetworkInterface> nets = NetworkInterface.getNetworkInterfaces();
            while (nets != null && nets.hasMoreElements()) {
                NetworkInterface ni = nets.nextElement();
                if (!ni.isUp() || ni.isLoopback()) continue;
                Enumeration<InetAddress> addrs = ni.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        String host = addr.getHostAddress();
                        if (host != null && (host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172."))) {
                            int lastDot = host.lastIndexOf('.');
                            if (lastDot > 0) {
                                return host.substring(0, lastDot + 1);
                            }
                        }
                    }
                }
            }
        } catch (Throwable ignored) {}
        return null;
    }

    private void executeSubnetScanForCastAndSonos(int maxWaitMs) {
        if (subnetScanInProgress) return;
        subnetScanInProgress = true;
        lastAutoSubnetScanMs = System.currentTimeMillis();
        try {
            ensureCastNsdDiscoveryStarted();
            String prefix = getLocalWifiSubnetPrefix();
            ExecutorService pool = Executors.newFixedThreadPool(64);
            List<Future<?>> futures = new ArrayList<>();
            futures.add(pool.submit(this::runSsdpDiscoveryBurst));
            if (prefix != null) {
                for (int i = 1; i <= 254; i++) {
                    final String candidateIp = prefix + i;
                    futures.add(pool.submit(() -> {
                        probeCastDeviceOnPort8009(candidateIp, 8009);
                        probeSonosDeviceOnPort1400(candidateIp);
                    }));
                }
            }
            pool.shutdown();
            pool.awaitTermination(maxWaitMs, TimeUnit.MILLISECONDS);
        } catch (Throwable ignored) {
        } finally {
            subnetScanInProgress = false;
        }
    }

    @JavascriptInterface
    public String scanNetworkCastDevicesJson() {
        if (appContext == null) return "[]";
        try {
            executeSubnetScanForCastAndSonos(2800);
            return getAvailableMediaOutputDevicesJson();
        } catch (Throwable ignored) {
            return getAvailableMediaOutputDevicesJson();
        }
    }

    @JavascriptInterface
    public String getNetworkCastNowPlayingJson() {
        if (appContext == null) return "{}";
        try {
            ensureCastNsdDiscoveryStarted();
            long nowMs = System.currentTimeMillis();
            if (discoveredCastDevices.isEmpty() || (nowMs - lastAutoSubnetScanMs) > 25000L) {
                new Thread(() -> executeSubnetScanForCastAndSonos(2600)).start();
            }

            // Probe all discovered Cast (port 8009) & Sonos (port 1400) devices on the network
            for (String ip : discoveredCastDevices.keySet()) {
                JSONObject cached = discoveredCastDevices.get(ip);
                int port = cached != null ? cached.optInt("port", 8009) : 8009;
                JSONObject fresh = (port == 1400)
                    ? probeSonosDeviceOnPort1400(ip)
                    : probeCastDeviceOnPort8009(ip, port);
                if (fresh != null && fresh.optBoolean("isPlaying", false) && !fresh.optString("trackTitle", "").isEmpty()) {
                    fresh.put("deviceName", fresh.optString("name", port == 1400 ? "Sonos" : "Google Cast"));
                    fresh.put("isCast", port != 1400);
                    return fresh.toString();
                }
            }
        } catch (Throwable ignored) {}
        return "{}";
    }

    @JavascriptInterface
    public boolean sendCastControlCommand(String ipOrId, String cmd, int value) {
        if (appContext == null) return false;
        String targetIp = ipOrId != null ? ipOrId.trim() : "";
        int targetPort = 8009;

        if (!targetIp.isEmpty()) {
            for (String ip : discoveredCastDevices.keySet()) {
                JSONObject d = discoveredCastDevices.get(ip);
                if (d != null && (targetIp.equals(ip) || targetIp.equals(d.optString("id", "")) || targetIp.equalsIgnoreCase(d.optString("name", "")))) {
                    targetIp = ip;
                    targetPort = d.optInt("port", 8009);
                    break;
                }
            }
        }
        if (targetIp.isEmpty() && !discoveredCastDevices.isEmpty()) {
            for (String ip : discoveredCastDevices.keySet()) {
                JSONObject d = discoveredCastDevices.get(ip);
                if (d != null && (d.optBoolean("isPlaying", false) || d.optBoolean("isActive", false))) {
                    targetIp = ip;
                    targetPort = d.optInt("port", 8009);
                    break;
                }
            }
        }

        // 1. If target is a Sonos speaker on port 1400, dispatch UPnP SOAP command
        if (!targetIp.isEmpty() && (targetPort == 1400 || (ipOrId != null && ipOrId.startsWith("sonos-")))) {
            try {
                if ("volume".equals(cmd)) {
                    int vol = Math.max(0, Math.min(100, value));
                    sendSonosSoapAction(targetIp, "/MediaRenderer/RenderingControl/Control", "RenderingControl", "SetVolume", "<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>" + vol + "</DesiredVolume>", 600);
                    return true;
                }
                if ("mute".equals(cmd)) {
                    int m = (value == 1) ? 1 : 0;
                    sendSonosSoapAction(targetIp, "/MediaRenderer/RenderingControl/Control", "RenderingControl", "SetMute", "<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredMute>" + m + "</DesiredMute>", 600);
                    return true;
                }
                if ("play".equals(cmd)) {
                    sendSonosSoapAction(targetIp, "/MediaRenderer/AVTransport/Control", "AVTransport", "Play", "<InstanceID>0</InstanceID><Speed>1</Speed>", 600);
                    return true;
                }
                if ("pause".equals(cmd) || "play_pause".equals(cmd)) {
                    sendSonosSoapAction(targetIp, "/MediaRenderer/AVTransport/Control", "AVTransport", "Pause", "<InstanceID>0</InstanceID>", 600);
                    return true;
                }
                if ("stop".equals(cmd)) {
                    sendSonosSoapAction(targetIp, "/MediaRenderer/AVTransport/Control", "AVTransport", "Stop", "<InstanceID>0</InstanceID>", 600);
                    return true;
                }
                if ("next".equals(cmd)) {
                    sendSonosSoapAction(targetIp, "/MediaRenderer/AVTransport/Control", "AVTransport", "Next", "<InstanceID>0</InstanceID>", 600);
                    return true;
                }
                if ("prev".equals(cmd)) {
                    sendSonosSoapAction(targetIp, "/MediaRenderer/AVTransport/Control", "AVTransport", "Previous", "<InstanceID>0</InstanceID>", 600);
                    return true;
                }
                if ("seek".equals(cmd)) {
                    String targetTime = formatMsToHhMmSs(Math.max(0L, (long) value));
                    sendSonosSoapAction(targetIp, "/MediaRenderer/AVTransport/Control", "AVTransport", "Seek", "<InstanceID>0</InstanceID><Unit>REL_TIME</Unit><Target>" + targetTime + "</Target>", 600);
                    return true;
                }
            } catch (Throwable ignored) {}
        }

        // 2. If target is a Google Cast / Google TV Streamer on port 8009, dispatch CastV2 command
        if (!targetIp.isEmpty() && targetIp.matches("^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$")) {
            javax.net.ssl.SSLSocket sock = null;
            try {
                JSONObject info = probeCastDeviceOnPort8009(targetIp, 8009);
                String transportId = info != null ? info.optString("transportId", "") : "";
                int mediaSessionId = info != null ? info.optInt("mediaSessionId", 1) : 1;

                javax.net.ssl.TrustManager[] trustAll = new javax.net.ssl.TrustManager[]{
                    new javax.net.ssl.X509TrustManager() {
                        @Override public java.security.cert.X509Certificate[] getAcceptedIssuers() { return new java.security.cert.X509Certificate[0]; }
                        @Override public void checkClientTrusted(java.security.cert.X509Certificate[] c, String a) {}
                        @Override public void checkServerTrusted(java.security.cert.X509Certificate[] c, String a) {}
                    }
                };
                javax.net.ssl.SSLContext sc = javax.net.ssl.SSLContext.getInstance("TLS");
                sc.init(null, trustAll, new java.security.SecureRandom());
                java.net.Socket rawSock = new java.net.Socket();
                rawSock.connect(new java.net.InetSocketAddress(targetIp, 8009), 500);
                sock = (javax.net.ssl.SSLSocket) sc.getSocketFactory().createSocket(rawSock, targetIp, 8009, true);
                sock.setSoTimeout(500);
                sock.startHandshake();
                java.io.OutputStream os = sock.getOutputStream();

                os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.tp.connection", "{\"type\":\"CONNECT\"}"));
                if ("volume".equals(cmd)) {
                    double lvl = Math.max(0.0, Math.min(1.0, value / 100.0));
                    os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.receiver", "{\"type\":\"SET_VOLUME\",\"volume\":{\"level\":" + lvl + "},\"requestId\":10}"));
                    os.flush();
                    return true;
                }
                if ("mute".equals(cmd)) {
                    boolean m = (value == 1);
                    os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.receiver", "{\"type\":\"SET_VOLUME\",\"volume\":{\"muted\":" + m + "},\"requestId\":11}"));
                    os.flush();
                    return true;
                }
                if ("stop".equals(cmd)) {
                    os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.receiver", "{\"type\":\"STOP\",\"requestId\":12}"));
                    os.flush();
                    return true;
                }
                if (!transportId.isEmpty()) {
                    os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.tp.connection", "{\"type\":\"CONNECT\"}"));
                    if ("play".equals(cmd) || ("play_pause".equals(cmd) && info != null && !info.optBoolean("isPlaying", true))) {
                        os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\"type\":\"PLAY\",\"mediaSessionId\":" + mediaSessionId + ",\"requestId\":13}"));
                    } else if ("pause".equals(cmd) || "play_pause".equals(cmd)) {
                        os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\"type\":\"PAUSE\",\"mediaSessionId\":" + mediaSessionId + ",\"requestId\":14}"));
                    } else if ("seek".equals(cmd)) {
                        double sec = Math.max(0.0, value / 1000.0);
                        os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\"type\":\"SEEK\",\"mediaSessionId\":" + mediaSessionId + ",\"currentTime\":" + sec + ",\"requestId\":15}"));
                    } else if ("next".equals(cmd)) {
                        os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\"type\":\"QUEUE_NEXT\",\"mediaSessionId\":" + mediaSessionId + ",\"requestId\":16}"));
                    } else if ("prev".equals(cmd)) {
                        os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\"type\":\"QUEUE_PREV\",\"mediaSessionId\":" + mediaSessionId + ",\"requestId\":17}"));
                    }
                    os.flush();
                    return true;
                }
            } catch (Throwable ignored) {
            } finally {
                if (sock != null) {
                    try { sock.close(); } catch (Throwable ignored) {}
                }
            }
        }
        return sendMediaControl(cmd);
    }

    @JavascriptInterface
    public String getAvailableMediaOutputDevicesJson() {
        if (appContext == null) return "[]";
        try {
            ensureCastNsdDiscoveryStarted();
            if (discoveredCastDevices.isEmpty() && (System.currentTimeMillis() - lastAutoSubnetScanMs) > 20000L) {
                new Thread(() -> executeSubnetScanForCastAndSonos(2600)).start();
            }
            JSONArray arr = new JSONArray();
            Set<String> seenNames = new HashSet<>();

            // 1. Add all discovered local network Sonos & Google Cast / Google TV Streamer devices
            for (String ip : discoveredCastDevices.keySet()) {
                JSONObject castObj = discoveredCastDevices.get(ip);
                if (castObj != null && !castObj.optString("name", "").isEmpty()) {
                    seenNames.add(castObj.optString("name", "").toLowerCase());
                    arr.put(castObj);
                }
            }

            // 2. Add Android MediaRouter live audio/video routes (Google Cast routes, Bluetooth, etc.)
            try {
                android.media.MediaRouter mr = (android.media.MediaRouter) appContext.getSystemService(Context.MEDIA_ROUTER_SERVICE);
                if (mr != null) {
                    android.media.MediaRouter.RouteInfo selectedRoute = mr.getSelectedRoute(android.media.MediaRouter.ROUTE_TYPE_LIVE_AUDIO | android.media.MediaRouter.ROUTE_TYPE_LIVE_VIDEO);
                    int count = mr.getRouteCount();
                    for (int i = 0; i < count; i++) {
                        android.media.MediaRouter.RouteInfo ri = mr.getRouteAt(i);
                        if (ri == null) continue;
                        CharSequence rn = ri.getName(appContext);
                        if (rn == null || rn.length() == 0) continue;
                        String rName = rn.toString().trim();
                        String lower = rName.toLowerCase();
                        if (seenNames.contains(lower) || lower.contains("phone") || lower.contains("telefon") || lower.contains("denna enhet")) continue;
                        seenNames.add(lower);
                        JSONObject o = new JSONObject();
                        o.put("id", "route-" + i + "-" + rName.replaceAll("[^a-zA-Z0-9]", ""));
                        o.put("name", rName);
                        boolean isTv = lower.contains("tv") || lower.contains("streamer") || lower.contains("chromecast") || (ri.getSupportedTypes() & android.media.MediaRouter.ROUTE_TYPE_LIVE_VIDEO) != 0;
                        o.put("type", isTv ? "TV" : "Speaker");
                        o.put("isActive", ri == selectedRoute);
                        int vMax = ri.getVolumeMax();
                        int vCur = ri.getVolume();
                        o.put("volumePercent", vMax > 0 ? Math.round((vCur * 100f) / vMax) : 65);
                        o.put("source", "google-cast");
                        arr.put(o);
                    }
                }
            } catch (Throwable ignored) {}

            // 3. Add AudioManager output devices (Bluetooth speakers, HDMI, IP)
            android.media.AudioManager am = (android.media.AudioManager) appContext.getSystemService(Context.AUDIO_SERVICE);
            int curVolPct = 65;
            if (am != null) {
                int maxV = am.getStreamMaxVolume(android.media.AudioManager.STREAM_MUSIC);
                int curV = am.getStreamVolume(android.media.AudioManager.STREAM_MUSIC);
                if (maxV > 0) curVolPct = Math.round((curV * 100f) / maxV);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    android.media.AudioDeviceInfo[] devs = am.getDevices(android.media.AudioManager.GET_DEVICES_OUTPUTS);
                    if (devs != null) {
                        for (android.media.AudioDeviceInfo d : devs) {
                            CharSequence prod = d.getProductName();
                            if (prod != null && prod.length() > 0) {
                                int t = d.getType();
                                if (t == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
                                    t == android.media.AudioDeviceInfo.TYPE_HDMI ||
                                    t == android.media.AudioDeviceInfo.TYPE_IP ||
                                    t == android.media.AudioDeviceInfo.TYPE_REMOTE_SUBMIX) {
                                    String pName = prod.toString().trim();
                                    if (seenNames.contains(pName.toLowerCase())) continue;
                                    seenNames.add(pName.toLowerCase());
                                    JSONObject o = new JSONObject();
                                    o.put("id", "audio-" + d.getId());
                                    o.put("name", pName);
                                    o.put("type", t == android.media.AudioDeviceInfo.TYPE_HDMI ? "TV" : "Speaker");
                                    o.put("isActive", true);
                                    o.put("volumePercent", curVolPct);
                                    o.put("source", "local-network");
                                    arr.put(o);
                                }
                            }
                        }
                    }
                }
            }
            return arr.toString();
        } catch (Throwable ignored) {
            return "[]";
        }
    }

    @JavascriptInterface
    public void setMediaOutputVolume(int volumePercent) {
        if (appContext == null) return;
        try {
            android.media.AudioManager am = (android.media.AudioManager) appContext.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int maxV = am.getStreamMaxVolume(android.media.AudioManager.STREAM_MUSIC);
                int targetV = Math.max(0, Math.min(maxV, Math.round((volumePercent / 100f) * maxV)));
                am.setStreamVolume(android.media.AudioManager.STREAM_MUSIC, targetV, 0);
            }
        } catch (Throwable ignored) {}
    }

    @JavascriptInterface
    public boolean requestCameraPermission() {
        if (mainActivity == null) return false;
        return mainActivity.ensureCameraPermission(false);
    }

    @JavascriptInterface
    public boolean openNativeCamera() {
        if (mainActivity == null) return false;
        return mainActivity.launchNativeCameraCapture();
    }

    @JavascriptInterface
    public void syncConfig(String email, String deviceId, String deviceLabel, String seenIdsJson) {
        syncConfigWithWorkspaces(email, deviceId, deviceLabel, seenIdsJson, "[\"default\"]");
    }

    @JavascriptInterface
    public void syncConfigWithWorkspaces(String email, String deviceId, String deviceLabel, String seenIdsJson, String wsKeysJson) {
        syncConfigWithFirebase(email, deviceId, deviceLabel, seenIdsJson, wsKeysJson, "");
    }

    @JavascriptInterface
    public void syncConfigWithFirebase(String email, String deviceId, String deviceLabel, String seenIdsJson, String wsKeysJson, String firebaseToken) {
        try {
            SharedPreferences prefs = appContext.getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> merged = new HashSet<>();
            JSONArray existing = new JSONArray(prefs.getString("seen_ids_json", "[]"));
            for (int i = 0; i < existing.length(); i++) {
                merged.add(existing.optString(i));
            }
            if (seenIdsJson != null && !seenIdsJson.isEmpty()) {
                JSONArray incoming = new JSONArray(seenIdsJson);
                for (int i = 0; i < incoming.length(); i++) {
                    merged.add(incoming.optString(i));
                }
            }
            JSONArray out = new JSONArray();
            for (String id : merged) {
                if (id != null && !id.isEmpty()) out.put(id);
            }
            SharedPreferences.Editor ed = prefs.edit()
                 .putString("email", email != null ? email.trim().toLowerCase() : "")
                 .putString("deviceId", deviceId != null ? deviceId.trim() : "")
                 .putString("deviceLabel", deviceLabel != null ? deviceLabel.trim() : "")
                 .putString("seen_ids_json", out.toString());
            if (wsKeysJson != null && !wsKeysJson.isEmpty()) {
                ed.putString("ws_keys_json", wsKeysJson);
            }
            if (firebaseToken != null && !firebaseToken.isEmpty()) {
                ed.putString("firebaseToken", firebaseToken);
            }
            ed.apply();

            HemSyncService.scheduleNextAlarm(appContext);
            HemSyncService.startServiceSafe(appContext);
        } catch (Throwable ignored) {
        }
    }

    @JavascriptInterface
    public void markActionsSeen(String seenIdsJson) {
        try {
            SharedPreferences prefs = appContext.getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> merged = new HashSet<>();
            JSONArray existing = new JSONArray(prefs.getString("seen_ids_json", "[]"));
            for (int i = 0; i < existing.length(); i++) {
                merged.add(existing.optString(i));
            }
            if (seenIdsJson != null && !seenIdsJson.isEmpty()) {
                JSONArray incoming = new JSONArray(seenIdsJson);
                for (int i = 0; i < incoming.length(); i++) {
                    merged.add(incoming.optString(i));
                }
            }
            JSONArray out = new JSONArray();
            for (String id : merged) {
                if (id != null && !id.isEmpty()) out.put(id);
            }
            prefs.edit().putString("seen_ids_json", out.toString()).apply();
        } catch (Throwable ignored) {
        }
    }

    @JavascriptInterface
    public boolean hasSeenAction(String actionId) {
        if (actionId == null || actionId.isEmpty()) return false;
        try {
            SharedPreferences prefs = appContext.getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
            JSONArray existing = new JSONArray(prefs.getString("seen_ids_json", "[]"));
            for (int i = 0; i < existing.length(); i++) {
                if (actionId.equals(existing.optString(i))) return true;
            }
        } catch (Throwable ignored) {
        }
        return false;
    }

    @JavascriptInterface
    public void postNotification(int nativeId, String title, String body, String appNotifId, String type) {
        HemSyncService.postNativeStatusBarNotification(appContext, nativeId, title, body);
    }

    @JavascriptInterface
    public void cancelNotification(int nativeId) {
        try {
            NotificationManager nm = (NotificationManager) appContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(nativeId);
        } catch (Throwable ignored) {
        }
    }

    @JavascriptInterface
    public void cancelAllNotifications() {
        try {
            NotificationManager nm = (NotificationManager) appContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    StatusBarNotification[] active = nm.getActiveNotifications();
                    if (active != null) {
                        for (StatusBarNotification sbn : active) {
                            if (sbn.getId() != 7701) {
                                nm.cancel(sbn.getId());
                            }
                        }
                        return;
                    }
                }
                nm.cancelAll();
            }
        } catch (Throwable ignored) {
        }
    }

    @JavascriptInterface
    public String getActiveNotificationIds() {
        JSONArray arr = new JSONArray();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                NotificationManager nm = (NotificationManager) appContext.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    StatusBarNotification[] active = nm.getActiveNotifications();
                    if (active != null) {
                        for (StatusBarNotification sbn : active) {
                            if (sbn.getId() != 7701) {
                                arr.put(sbn.getId());
                            }
                        }
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        return arr.toString();
    }

    @JavascriptInterface
    public String consumePostedNotifications() {
        try {
            SharedPreferences prefs = appContext.getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
            String json = prefs.getString("posted_notifs_json", "[]");
            prefs.edit().putString("posted_notifs_json", "[]").apply();
            return json;
        } catch (Throwable ignored) {
            return "[]";
        }
    }
}
