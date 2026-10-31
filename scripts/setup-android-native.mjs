import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('xmlns:tools=')) {
    manifest = manifest.replace(
      '<manifest ',
      '<manifest xmlns:tools="http://schemas.android.com/tools" '
    );
  }
  if (!manifest.includes('android.permission.POST_NOTIFICATIONS')) {
    manifest = manifest.replace(
      '<application',
      '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />\n    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />\n    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-feature android:name="android.hardware.wifi" android:required="false" />\n    <uses-feature android:name="android.hardware.telephony" android:required="false" />\n    <uses-permission android:name="android.permission.WAKE_LOCK" />\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />\n    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />\n    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" tools:node="remove" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" tools:node="remove" />\n    <uses-permission android:name="android.permission.USE_EXACT_ALARM" tools:node="remove" />\n    <queries>\n        <package android:name="com.philips.lighting.hue2" />\n        <package android:name="com.signify.hue.blue" />\n        <package android:name="com.spotify.music" />\n        <package android:name="com.android.chrome" />\n        <package android:name="com.sonos.acr2" />\n        <package android:name="com.tibber.android" />\n        <intent>\n            <action android:name="android.intent.action.VIEW" />\n            <data android:scheme="https" />\n        </intent>\n        <intent>\n            <action android:name="android.intent.action.VIEW" />\n            <data android:scheme="http" />\n        </intent>\n    </queries>\n    <application'
    );
  } else if (!manifest.includes('android.permission.CHANGE_WIFI_MULTICAST_STATE')) {
    manifest = manifest.replace(
      '<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />',
      '<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />\n    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />'
    );
  }
  if (!manifest.includes('android:usesCleartextTraffic')) {
    manifest = manifest.replace(
      '<application',
      '<application android:usesCleartextTraffic="true" android:networkSecurityConfig="@xml/network_security_config"'
    );
  }
  if (!manifest.includes('.HemSyncService')) {
    manifest = manifest.replace(
      '</application>',
      '    <service android:name=".HemSyncService" android:enabled="true" android:exported="false" android:stopWithTask="false" />\n        <service android:name=".HemMediaListenerService" android:label="Hem – Spotify &amp; Media-synk" android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE" android:exported="true">\n            <intent-filter>\n                <action android:name="android.service.notification.NotificationListenerService" />\n            </intent-filter>\n        </service>\n        <receiver android:name=".HemAlarmReceiver" android:enabled="true" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\n                <action android:name="se.carlberg.hem.ACTION_BACKGROUND_POLL" />\n            </intent-filter>\n        </receiver>\n    </application>'
    );
  } else if (!manifest.includes('.HemMediaListenerService')) {
    manifest = manifest.replace(
      '<service android:name=".HemSyncService"',
      '<service android:name=".HemMediaListenerService" android:label="Hem – Spotify &amp; Media-synk" android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE" android:exported="true">\n            <intent-filter>\n                <action android:name="android.service.notification.NotificationListenerService" />\n            </intent-filter>\n        </service>\n        <service android:name=".HemSyncService"'
    );
  }
  const isWearOsBuild = process.env.WEAR_OS_BUILD === 'true';
  // Google Play Console strictly forbids android:required="false" on android.hardware.type.watch.
  // Phone/Tablet AAB must NOT have android.hardware.type.watch at all, while Wear OS AAB/APK must have android:required="true".
  manifest = manifest.replace(
    /\s*<uses-feature android:name="android\.hardware\.type\.watch"[^>]*\/>\n?/g,
    '\n'
  );
  manifest = manifest.replace(
    /\s*<meta-data android:name="com\.google\.android\.wearable\.standalone"[^>]*\/>\n?/g,
    '\n'
  );
  if (isWearOsBuild) {
    manifest = manifest.replace(
      '<application',
      '<uses-feature android:name="android.hardware.type.watch" android:required="true" />\n    <application'
    );
  } else {
    manifest = manifest.replace(
      '<application',
      '<uses-feature android:name="android.hardware.type.watch" tools:node="remove" />\n    <application'
    );
  }
  if (!manifest.includes('tools:overrideLibrary')) {
    manifest = manifest.replace(
      '<application',
      '<uses-sdk tools:overrideLibrary="androidx.wear.tiles,androidx.wear.tiles.proto,androidx.wear.tiles.renderer" />\n    <application'
    );
  }
  if (!manifest.includes('.HemCalendarWidget')) {
    manifest = manifest.replace(
      '</application>',
      '        <service android:name=".HemWidgetService" android:permission="android.permission.BIND_REMOTEVIEWS" android:exported="false" />\n        <activity android:name=".HemQuickAddActivity" android:theme="@android:style/Theme.DeviceDefault.Light.Dialog.NoActionBar" android:excludeFromRecents="true" android:exported="false" android:windowSoftInputMode="stateVisible|adjustResize" />\n        <receiver android:name=".HemCalendarWidget" android:exported="true" android:label="Hem – Kalender">\n            <intent-filter>\n                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />\n                <action android:name="se.carlberg.hem.ACTION_WIDGET_TOGGLE_ITEM" />\n            </intent-filter>\n            <meta-data android:name="android.appwidget.provider" android:resource="@xml/hem_calendar_widget_info" />\n        </receiver>\n        <receiver android:name=".HemShoppingWidget" android:exported="true" android:label="Hem – Inköpslista">\n            <intent-filter>\n                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />\n                <action android:name="se.carlberg.hem.ACTION_WIDGET_TOGGLE_ITEM" />\n            </intent-filter>\n            <meta-data android:name="android.appwidget.provider" android:resource="@xml/hem_shopping_widget_info" />\n        </receiver>\n        <receiver android:name=".HemTodoWidget" android:exported="true" android:label="Hem – Att göra">\n            <intent-filter>\n                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />\n                <action android:name="se.carlberg.hem.ACTION_WIDGET_TOGGLE_ITEM" />\n            </intent-filter>\n            <meta-data android:name="android.appwidget.provider" android:resource="@xml/hem_todo_widget_info" />\n        </receiver>\n    </application>'
    );
  } else if (!manifest.includes('.HemWidgetService')) {
    manifest = manifest.replace(
      '<receiver android:name=".HemCalendarWidget"',
      '<service android:name=".HemWidgetService" android:permission="android.permission.BIND_REMOTEVIEWS" android:exported="false" />\n        <activity android:name=".HemQuickAddActivity" android:theme="@android:style/Theme.DeviceDefault.Light.Dialog.NoActionBar" android:excludeFromRecents="true" android:exported="false" android:windowSoftInputMode="stateVisible|adjustResize" />\n        <receiver android:name=".HemCalendarWidget"'
    );
  }
  if (!manifest.includes('.HemWearActivity')) {
    manifest = manifest.replace(
      '</application>',
      '        <activity android:name=".HemWearActivity" android:exported="true" android:label="Hem Klocka" android:taskAffinity="" android:enableOnBackInvokedCallback="false" android:theme="@style/HemWearTheme" />\n        <service android:name=".HemCalendarTileService" android:label="Hem – Kalender" android:description="@string/app_name" android:icon="@mipmap/ic_launcher" android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER" android:exported="true">\n            <intent-filter>\n                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />\n            </intent-filter>\n            <meta-data android:name="androidx.wear.tiles.PREVIEW" android:resource="@drawable/hem_tile_preview" />\n        </service>\n        <service android:name=".HemShoppingTileService" android:label="Hem – Inköpslista" android:description="@string/app_name" android:icon="@mipmap/ic_launcher" android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER" android:exported="true">\n            <intent-filter>\n                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />\n            </intent-filter>\n            <meta-data android:name="androidx.wear.tiles.PREVIEW" android:resource="@drawable/hem_tile_preview" />\n        </service>\n        <service android:name=".HemTodoTileService" android:label="Hem – Att göra" android:description="@string/app_name" android:icon="@mipmap/ic_launcher" android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER" android:exported="true">\n            <intent-filter>\n                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />\n            </intent-filter>\n            <meta-data android:name="androidx.wear.tiles.PREVIEW" android:resource="@drawable/hem_tile_preview" />\n        </service>\n        <service android:name=".HemNotesTileService" android:label="Hem – Anteckningar" android:description="@string/app_name" android:icon="@mipmap/ic_launcher" android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER" android:exported="true">\n            <intent-filter>\n                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />\n            </intent-filter>\n            <meta-data android:name="androidx.wear.tiles.PREVIEW" android:resource="@drawable/hem_tile_preview" />\n        </service>\n        <service android:name=".HemBudgetTileService" android:label="Hem – Budget" android:description="@string/app_name" android:icon="@mipmap/ic_launcher" android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER" android:exported="true">\n            <intent-filter>\n                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />\n            </intent-filter>\n            <meta-data android:name="androidx.wear.tiles.PREVIEW" android:resource="@drawable/hem_tile_preview" />\n        </service>\n    </application>'
    );
  } else if (!manifest.includes('.HemNotesTileService')) {
    manifest = manifest.replace(
      '<service android:name=".HemTodoTileService"',
      '<service android:name=".HemNotesTileService" android:label="Hem – Anteckningar" android:description="@string/app_name" android:icon="@mipmap/ic_launcher" android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER" android:exported="true">\n            <intent-filter>\n                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />\n            </intent-filter>\n            <meta-data android:name="androidx.wear.tiles.PREVIEW" android:resource="@drawable/hem_tile_preview" />\n        </service>\n        <service android:name=".HemBudgetTileService" android:label="Hem – Budget" android:description="@string/app_name" android:icon="@mipmap/ic_launcher" android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER" android:exported="true">\n            <intent-filter>\n                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />\n            </intent-filter>\n            <meta-data android:name="androidx.wear.tiles.PREVIEW" android:resource="@drawable/hem_tile_preview" />\n        </service>\n        <service android:name=".HemTodoTileService"'
    );
  }
  manifest = manifest.replace(
    /(<activity[^>]*android:name="\.HemWearActivity"[^>]*android:theme=")[^"]*(")/,
    '$1@style/HemWearTheme$2'
  );
  if (!manifest.includes('android:enableOnBackInvokedCallback')) {
    manifest = manifest.replace(
      '<application',
      '<application android:enableOnBackInvokedCallback="false"'
    );
  }
  if (!manifest.includes('android:resizeableActivity')) {
    manifest = manifest.replace(
      'android:name=".MainActivity"',
      'android:name=".MainActivity" android:resizeableActivity="true"'
    );
  }
  manifest = manifest.replace(
    /android:configChanges="[^"]*"/,
    'android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|density|navigation"'
  );
  if (isWearOsBuild && !manifest.includes('com.google.android.wearable.standalone')) {
    manifest = manifest.replace(
      '<activity android:name=".HemWearActivity"',
      '<meta-data android:name="com.google.android.wearable.standalone" android:value="true" />\n        <activity android:name=".HemWearActivity"'
    );
  }
  fs.writeFileSync(manifestPath, manifest, 'utf8');
}

const javaDir = path.resolve('android/app/src/main/java/se/carlberg/hem');
fs.mkdirSync(javaDir, { recursive: true });

const hemAlarmReceiverJava = `package se.carlberg.hem;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;

public class HemAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        final Context appCtx = context.getApplicationContext();
        HemSyncService.scheduleNextAlarm(appCtx);
        HemSyncService.startServiceSafe(appCtx);
        final PendingResult pending = goAsync();
        new Thread(() -> {
            PowerManager.WakeLock wl = null;
            try {
                PowerManager pm = (PowerManager) appCtx.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Hem:BgAlarmSync");
                    wl.acquire(15000L);
                }
                HemSyncService.pollCloudOnce(appCtx);
            } catch (Throwable ignored) {
            } finally {
                try {
                    if (wl != null && wl.isHeld()) wl.release();
                } catch (Throwable ignored) {}
                try {
                    pending.finish();
                } catch (Throwable ignored) {}
            }
        }).start();
    }
}
`;

const hemSyncServiceJava = `package se.carlberg.hem;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class HemSyncService extends Service {
    public static final String PREFS_NAME = "HemNativeSync";
    public static final String CHANNEL_ID = "hem_alerts_high";
    private static final Object POLL_LOCK = new Object();
    private static volatile boolean appInForeground = false;
    private static volatile long lastDirectoryRefreshMs = 0L;
    private ScheduledExecutorService scheduler;
    private PowerManager.WakeLock serviceWakeLock;

    public static void setAppInForeground(boolean fg) {
        appInForeground = fg;
    }

    public static boolean isAppInForeground() {
        return appInForeground;
    }

    private static final String FIRESTORE_PROJECT_ID = "gen-lang-client-0269437912";
    private static final String FIRESTORE_DB_ID = "ai-studio-vardagsnavkalend-573f32e2-2ecd-4fec-bdc0-b78a7d1d127b";

    public static void startServiceSafe(Context ctx) {
        try {
            ctx.startService(new Intent(ctx, HemSyncService.class));
        } catch (Throwable ignored) {
        }
    }

    public static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID,
                "Hem Hushållsnotiser",
                NotificationManager.IMPORTANCE_HIGH
            );
            ch.setDescription("Notiser i realtid mellan dina enheter och familjen");
            ch.enableVibration(true);
            ch.enableLights(true);
            ch.setLightColor(Color.parseColor("#183D2C"));
            nm.createNotificationChannel(ch);
        }
    }

    public static void postNativeStatusBarNotification(Context ctx, int nativeId, String title, String body) {
        try {
            ensureChannel(ctx);
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            Intent openIntent = new Intent(ctx, MainActivity.class);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pi = PendingIntent.getActivity(ctx, nativeId, openIntent, flags);

            int iconRes = ctx.getResources().getIdentifier("ic_stat_hem", "drawable", ctx.getPackageName());
            if (iconRes == 0) {
                iconRes = ctx.getApplicationInfo().icon;
            }

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(ctx, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(ctx);
                builder.setPriority(Notification.PRIORITY_HIGH);
            }
            builder.setSmallIcon(iconRes)
                   .setContentTitle(title)
                   .setContentText(body)
                   .setStyle(new Notification.BigTextStyle().bigText(body))
                   .setAutoCancel(true)
                   .setContentIntent(pi);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                builder.setColor(Color.parseColor("#183D2C"));
                builder.setVisibility(Notification.VISIBILITY_PUBLIC);
            }
            nm.notify(nativeId, builder.build());
        } catch (Throwable ignored) {
        }
    }

    public static void scheduleNextAlarm(Context ctx) {
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            Intent i = new Intent(ctx, HemAlarmReceiver.class);
            i.setAction("se.carlberg.hem.ACTION_BACKGROUND_POLL");
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pi = PendingIntent.getBroadcast(ctx, 7711, i, flags);
            long triggerAt = SystemClock.elapsedRealtime() + 60000L;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (am.canScheduleExactAlarms()) {
                    am.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
            } else {
                am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
            }
        } catch (Throwable ignored) {
        }
    }

    public static String sanitizeFirestoreId(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "default";
        String cleaned = raw.trim().toLowerCase()
            .replace("@", "_at_")
            .replace(".", "_dot_")
            .replaceAll("[^a-z0-9_-]", "_");
        if (cleaned.isEmpty()) return "default";
        if (cleaned.length() <= 120) return cleaned;
        int h = 0;
        for (int i = 0; i < cleaned.length(); i++) {
            h = (h * 31 + cleaned.charAt(i));
        }
        String suffix = Integer.toString(Math.abs(h), 36);
        return cleaned.substring(0, 105) + "_" + suffix;
    }

    private static boolean isDeletionOrNonAdditionSummary(String summary) {
        if (summary == null) return false;
        String s = summary.trim().toLowerCase();
        return s.startsWith("tog bort") ||
               s.startsWith("rensade") ||
               s.startsWith("raderade") ||
               s.startsWith("bockade av") ||
               s.startsWith("återställde") ||
               s.startsWith("gjorde klart") ||
               s.startsWith("återöppnade") ||
               s.startsWith("uppdaterade") ||
               s.startsWith("flyttade");
    }

    private static String getPageNameForActionType(String actionType) {
        if ("shopping".equals(actionType)) return "Inköpslista";
        if ("calendar".equals(actionType)) return "Kalender";
        if ("todo".equals(actionType)) return "Att göra";
        if ("photos".equals(actionType)) return "Foton";
        if ("notes".equals(actionType)) return "Anteckningar";
        if ("recipes".equals(actionType)) return "Recept";
        if ("budget".equals(actionType)) return "Budget";
        return "Hem";
    }

    private static String formatHemNotificationBody(String actionType, String rawSummary) {
        String pageName = getPageNameForActionType(actionType);
        if (rawSummary == null || rawSummary.trim().isEmpty()) {
            return pageName;
        }
        String text = rawSummary.trim();
        if (text.toLowerCase().startsWith(pageName.toLowerCase() + ":")) {
            return text;
        }
        text = text.replaceFirst("(?i)^Lade till\\\\s+", "")
                   .replaceFirst("(?i)\\\\s+i inköpslistan$", "")
                   .replaceFirst("(?i)^Ny kalenderhändelse:\\\\s*", "")
                   .replaceFirst("(?i)^Ny uppgift:\\\\s*", "")
                   .replaceFirst("(?i)^Skapade anteckningen\\\\s*", "")
                   .replaceFirst("(?i)^Lade till receptet\\\\s*", "")
                   .replaceFirst("(?i)^Skapade bildalbumet\\\\s*", "")
                   .replaceFirst("(?i)^Skapade budgetmånaden\\\\s*", "")
                   .trim();
        if (text.length() >= 2 && text.startsWith("\\"") && text.endsWith("\\"")) {
            text = text.substring(1, text.length() - 1).trim();
        }
        return pageName + ": " + text;
    }

    public static int computeDeterministicNativeId(String idStr) {
        int hash = 0;
        for (int i = 0; i < idStr.length(); i++) {
            hash = (hash * 31 + idStr.charAt(i));
        }
        return ((hash & 0x7fffffff) % 800000) + 100000;
    }

    private static String fetchUrlString(String urlStr) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setUseCaches(false);
            conn.setRequestProperty("Accept", "application/json");
            if (conn.getResponseCode() != 200) return null;
            InputStream is = conn.getInputStream();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = is.read(buf)) != -1) {
                baos.write(buf, 0, n);
            }
            is.close();
            return new String(baos.toByteArray(), StandardCharsets.UTF_8);
        } catch (Throwable ignored) {
            return null;
        } finally {
            if (conn != null) {
                try { conn.disconnect(); } catch (Throwable ignored) {}
            }
        }
    }

    private static final String FIREBASE_WEB_API_KEY = "AIzaSyCPwbR2WGBTREQHL2hiKTe9wlMi4mQCkBw";

    public static void ensureDefaultAccountConfig(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String email = prefs.getString("email", "").trim().toLowerCase();
            String myDeviceId = prefs.getString("deviceId", "").trim();
            SharedPreferences.Editor ed = null;
            if (email.isEmpty()) {
                ed = prefs.edit();
                ed.putString("email", "filipcarlberg91@gmail.com");
            }
            if (myDeviceId.isEmpty()) {
                if (ed == null) ed = prefs.edit();
                ed.putString("deviceId", "wear_" + (System.currentTimeMillis() % 100000000L));
            }
            if (ed != null) ed.apply();
        } catch (Throwable ignored) {
        }
    }

    private static String ensureFirebaseAnonIdToken(Context ctx) {
        HttpURLConnection conn = null;
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String cachedToken = prefs.getString("anon_id_token", "");
            long tokenTs = prefs.getLong("anon_id_token_ts", 0L);
            long now = System.currentTimeMillis();
            if (!cachedToken.isEmpty() && (now - tokenTs) < 45L * 60L * 1000L) {
                return cachedToken;
            }
            URL url = new URL("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + FIREBASE_WEB_API_KEY);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            byte[] payload = "{\\"returnSecureToken\\":true}".getBytes(StandardCharsets.UTF_8);
            conn.getOutputStream().write(payload);
            if (conn.getResponseCode() != 200) return "";
            InputStream is = conn.getInputStream();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[2048];
            int n;
            while ((n = is.read(buf)) != -1) baos.write(buf, 0, n);
            is.close();
            JSONObject resp = new JSONObject(new String(baos.toByteArray(), StandardCharsets.UTF_8));
            String idToken = resp.optString("idToken", "");
            if (!idToken.isEmpty()) {
                prefs.edit().putString("anon_id_token", idToken).putLong("anon_id_token_ts", now).apply();
            }
            return idToken;
        } catch (Throwable ignored) {
            return "";
        } finally {
            if (conn != null) {
                try { conn.disconnect(); } catch (Throwable ignored) {}
            }
        }
    }

    public static void pushWidgetMutationToCloudAsync(
        final Context ctx,
        final String targetTab,
        final String action,
        final String itemTitle,
        final String amount,
        final String unit
    ) {
        if (ctx == null) return;
        final Context appCtx = ctx.getApplicationContext();
        new Thread(() -> {
            synchronized (POLL_LOCK) {
                HttpURLConnection patchConn = null;
                try {
                    ensureDefaultAccountConfig(appCtx);
                    SharedPreferences prefs = appCtx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                    String email = prefs.getString("email", "filipcarlberg91@gmail.com").trim().toLowerCase();
                    String myDeviceId = prefs.getString("deviceId", "wear_device").trim();
                    String idToken = ensureFirebaseAnonIdToken(appCtx);
                    if (idToken.isEmpty()) return;

                    // Determine target workspace docId for this module
                    String moduleDocKey = "ws_doc_todo";
                    if ("shopping".equals(targetTab)) moduleDocKey = "ws_doc_shopping";
                    else if ("calendar".equals(targetTab)) moduleDocKey = "ws_doc_calendar";
                    else if ("notes".equals(targetTab)) moduleDocKey = "ws_doc_notes";
                    else if ("budget".equals(targetTab)) moduleDocKey = "ws_doc_budget";
                    String targetDocId = prefs.getString(moduleDocKey, "");
                    List<String> candidateDocs = new ArrayList<>();
                    if (!targetDocId.isEmpty()) candidateDocs.add(targetDocId);
                    try {
                        JSONArray wsArr = new JSONArray(prefs.getString("ws_keys_json", "[]"));
                        for (int i = 0; i < wsArr.length(); i++) {
                            String k = wsArr.optString(i, "");
                            if (!k.isEmpty() && !"default".equals(k) && !candidateDocs.contains(k)) {
                                candidateDocs.add(k);
                            }
                        }
                    } catch (Throwable ignored) {}
                    String privDocId = sanitizeFirestoreId("priv_" + email);
                    if (!candidateDocs.contains(privDocId)) candidateDocs.add(privDocId);

                    String chosenDocId = null;
                    JSONObject chosenSlice = null;
                    String sliceArrKey = "todos";
                    if ("shopping".equals(targetTab)) sliceArrKey = "shopping";
                    else if ("calendar".equals(targetTab)) sliceArrKey = "events";
                    else if ("notes".equals(targetTab)) sliceArrKey = "notes";
                    else if ("budget".equals(targetTab)) sliceArrKey = "budgetMonths";

                    for (String cand : candidateDocs) {
                        String body = fetchUrlString("https://firestore.googleapis.com/v1/projects/" + FIRESTORE_PROJECT_ID + "/databases/" + FIRESTORE_DB_ID + "/documents/workspaces/" + cand);
                        if (body == null) continue;
                        JSONObject docJson = new JSONObject(body);
                        JSONObject fields = docJson.optJSONObject("fields");
                        if (fields == null) continue;
                        JSONObject sliceField = fields.optJSONObject("sliceJson");
                        if (sliceField == null) continue;
                        String sliceStr = sliceField.optString("stringValue", "");
                        if (sliceStr.isEmpty()) continue;
                        JSONObject slice = new JSONObject(sliceStr);
                        chosenDocId = cand;
                        chosenSlice = slice;
                        JSONArray arr = slice.optJSONArray(sliceArrKey);
                        if (arr != null && arr.length() > 0) {
                            break;
                        }
                    }

                    if (chosenDocId == null || chosenSlice == null) return;

                    boolean modified = false;
                    String nowIso = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(new java.util.Date());
                    String todayIso = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(new java.util.Date());
                    if ("toggle".equals(action)) {
                        String arrayKey = "shopping".equals(targetTab) ? "shopping" : "todos";
                        String flagKey = "shopping".equals(targetTab) ? "checked" : "completed";
                        String nameKey = "shopping".equals(targetTab) ? "name" : "title";
                        JSONArray arr = chosenSlice.optJSONArray(arrayKey);
                        if (arr != null) {
                            for (int i = 0; i < arr.length(); i++) {
                                JSONObject obj = arr.optJSONObject(i);
                                if (obj != null && !obj.optBoolean(flagKey, false)) {
                                    String n = obj.optString(nameKey, "").trim();
                                    if (!n.isEmpty() && (n.equalsIgnoreCase(itemTitle) || (itemTitle != null && itemTitle.toLowerCase().contains(n.toLowerCase())))) {
                                        obj.put(flagKey, true);
                                        obj.put("updatedAt", nowIso);
                                        modified = true;
                                        break;
                                    }
                                }
                            }
                        }
                    } else if ("add_shopping".equals(action)) {
                        JSONArray arr = chosenSlice.optJSONArray("shopping");
                        if (arr == null) {
                            arr = new JSONArray();
                            chosenSlice.put("shopping", arr);
                        }
                        JSONObject newItem = new JSONObject();
                        newItem.put("id", "wear-shop-" + System.currentTimeMillis());
                        newItem.put("name", itemTitle);
                        newItem.put("amount", amount != null && !amount.isEmpty() ? amount : "1");
                        newItem.put("unit", unit != null && !unit.isEmpty() ? unit : "st");
                        newItem.put("category", "Övrigt");
                        newItem.put("checked", false);
                        newItem.put("addedAt", nowIso);
                        JSONArray reordered = new JSONArray();
                        reordered.put(newItem);
                        for (int i = 0; i < arr.length(); i++) reordered.put(arr.get(i));
                        chosenSlice.put("shopping", reordered);
                        modified = true;
                    } else if ("add_todo".equals(action)) {
                        JSONArray arr = chosenSlice.optJSONArray("todos");
                        if (arr == null) {
                            arr = new JSONArray();
                            chosenSlice.put("todos", arr);
                        }
                        JSONObject newTodo = new JSONObject();
                        newTodo.put("id", "wear-todo-" + System.currentTimeMillis());
                        newTodo.put("title", itemTitle);
                        newTodo.put("completed", false);
                        newTodo.put("priority", "medium");
                        newTodo.put("dueDate", todayIso);
                        newTodo.put("createdAt", nowIso);
                        newTodo.put("updatedAt", nowIso);
                        JSONArray reordered = new JSONArray();
                        reordered.put(newTodo);
                        for (int i = 0; i < arr.length(); i++) reordered.put(arr.get(i));
                        chosenSlice.put("todos", reordered);
                        modified = true;
                    } else if ("add_calendar".equals(action)) {
                        JSONArray arr = chosenSlice.optJSONArray("events");
                        if (arr == null) {
                            arr = new JSONArray();
                            chosenSlice.put("events", arr);
                        }
                        JSONObject newEvt = new JSONObject();
                        newEvt.put("id", "wear-evt-" + System.currentTimeMillis());
                        newEvt.put("title", itemTitle);
                        newEvt.put("date", todayIso);
                        newEvt.put("startTime", amount != null && !amount.isEmpty() && amount.contains(":") ? amount : "12:00");
                        newEvt.put("endTime", "13:00");
                        newEvt.put("categoryId", "familj");
                        newEvt.put("updatedAt", nowIso);
                        arr.put(newEvt);
                        modified = true;
                    } else if ("add_note".equals(action)) {
                        JSONArray arr = chosenSlice.optJSONArray("notes");
                        if (arr == null) {
                            arr = new JSONArray();
                            chosenSlice.put("notes", arr);
                        }
                        JSONObject newNote = new JSONObject();
                        newNote.put("id", "wear-note-" + System.currentTimeMillis());
                        newNote.put("title", itemTitle);
                        newNote.put("contentHtml", amount != null && !amount.isEmpty() && !"1".equals(amount) ? amount : itemTitle);
                        newNote.put("listMode", "none");
                        newNote.put("checklistItems", new JSONArray());
                        newNote.put("colorTone", "sand");
                        newNote.put("favorite", true);
                        newNote.put("updatedAt", nowIso);
                        JSONArray reordered = new JSONArray();
                        reordered.put(newNote);
                        for (int i = 0; i < arr.length(); i++) reordered.put(arr.get(i));
                        chosenSlice.put("notes", reordered);
                        modified = true;
                    } else if ("add_budget".equals(action)) {
                        JSONArray arr = chosenSlice.optJSONArray("budgetMonths");
                        if (arr == null) {
                            arr = new JSONArray();
                            chosenSlice.put("budgetMonths", arr);
                        }
                        String monthKey = todayIso.substring(0, 7);
                        JSONObject targetMonth = null;
                        for (int i = 0; i < arr.length(); i++) {
                            JSONObject m = arr.optJSONObject(i);
                            if (m != null && monthKey.equals(m.optString("monthKey", ""))) {
                                targetMonth = m;
                                break;
                            }
                        }
                        if (targetMonth == null && arr.length() > 0) {
                            targetMonth = arr.optJSONObject(arr.length() - 1);
                        }
                        if (targetMonth == null) {
                            targetMonth = new JSONObject();
                            targetMonth.put("monthKey", monthKey);
                            targetMonth.put("label", HemWidgetBridge.getCurrentSwedishMonthName());
                            targetMonth.put("entries", new JSONArray());
                            arr.put(targetMonth);
                        }
                        JSONArray entries = targetMonth.optJSONArray("entries");
                        if (entries == null) {
                            entries = new JSONArray();
                            targetMonth.put("entries", entries);
                        }
                        double parsedAmt = 100.0;
                        try {
                            parsedAmt = Double.parseDouble(amount != null ? amount.replaceAll("[^0-9.]", "") : "100");
                        } catch (Throwable ignored) {}
                        JSONObject entry = new JSONObject();
                        long ts = System.currentTimeMillis();
                        entry.put("id", "wear-exp-" + ts);
                        entry.put("seriesId", "wear-series-" + ts);
                        entry.put("title", itemTitle);
                        entry.put("amount", parsedAmt);
                        entry.put("type", "expense");
                        entry.put("category", unit != null && !unit.isEmpty() && !"st".equals(unit) ? unit : "Övrigt");
                        entry.put("dayOfMonth", java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_MONTH));
                        entries.put(entry);
                        modified = true;
                    }

                    if (!modified) return;

                    int nextVer = chosenSlice.optInt("version", 1) + 1;
                    chosenSlice.put("version", nextVer);
                    chosenSlice.put("updatedAt", nowIso);
                    chosenSlice.put("updatedByDeviceId", myDeviceId);

                    JSONObject patchBody = new JSONObject();
                    JSONObject patchFields = new JSONObject();
                    JSONObject sliceVal = new JSONObject();
                    sliceVal.put("stringValue", chosenSlice.toString());
                    patchFields.put("sliceJson", sliceVal);
                    JSONObject verVal = new JSONObject();
                    verVal.put("integerValue", String.valueOf(nextVer));
                    patchFields.put("version", verVal);
                    patchBody.put("fields", patchFields);

                    String patchUrl = "https://firestore.googleapis.com/v1/projects/" + FIRESTORE_PROJECT_ID
                        + "/databases/" + FIRESTORE_DB_ID
                        + "/documents/workspaces/" + chosenDocId
                        + "?updateMask.fieldPaths=sliceJson&updateMask.fieldPaths=version";
                    URL u = new URL(patchUrl);
                    patchConn = (HttpURLConnection) u.openConnection();
                    patchConn.setRequestMethod("POST");
                    patchConn.setRequestProperty("X-HTTP-Method-Override", "PATCH");
                    patchConn.setRequestProperty("Authorization", "Bearer " + idToken);
                    patchConn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                    patchConn.setConnectTimeout(8000);
                    patchConn.setReadTimeout(8000);
                    patchConn.setDoOutput(true);
                    patchConn.getOutputStream().write(patchBody.toString().getBytes(StandardCharsets.UTF_8));
                    int code = patchConn.getResponseCode();
                    if (code >= 200 && code < 300) {
                        HemWidgetBridge.updateFromRemoteSlice(appCtx, chosenSlice);
                    }
                } catch (Throwable ignored) {
                } finally {
                    if (patchConn != null) {
                        try { patchConn.disconnect(); } catch (Throwable ignored) {}
                    }
                }
            }
        }).start();
    }

    public static void pollCloudOnce(Context ctx) {
        synchronized (POLL_LOCK) {
            try {
                ensureDefaultAccountConfig(ctx);
                SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String email = prefs.getString("email", "filipcarlberg91@gmail.com").trim().toLowerCase();
                String myDeviceId = prefs.getString("deviceId", "wear_device").trim();
                if (email.isEmpty() || myDeviceId.isEmpty()) return;

                Set<String> activeWsKeys = new HashSet<>();
                String privKey = sanitizeFirestoreId("priv_" + email);
                activeWsKeys.add(privKey);
                try {
                    JSONArray wsArr = new JSONArray(prefs.getString("ws_keys_json", "[]"));
                    for (int i = 0; i < wsArr.length(); i++) {
                        String k = wsArr.optString(i, "");
                        if (!k.isEmpty() && !"default".equals(k)) activeWsKeys.add(k);
                    }
                } catch (Throwable ignored) {
                }

                // Periodically check userDirectory for any shared connections so background sync
                // discovers new shared workspaces even while the app is closed or running standalone on Wear OS
                long nowMs = System.currentTimeMillis();
                if (nowMs - lastDirectoryRefreshMs > 60000L || activeWsKeys.size() <= 1) {
                    lastDirectoryRefreshMs = nowMs;
                    try {
                        String dirId = sanitizeFirestoreId(email);
                        String dirBody = fetchUrlString("https://firestore.googleapis.com/v1/projects/" + FIRESTORE_PROJECT_ID + "/databases/" + FIRESTORE_DB_ID + "/documents/userDirectory/" + dirId);
                        if (dirBody != null) {
                            JSONObject dirDoc = new JSONObject(dirBody);
                            JSONObject dirFields = dirDoc.optJSONObject("fields");
                            if (dirFields != null) {
                                JSONObject connsField = dirFields.optJSONObject("connectionsJson");
                                if (connsField != null) {
                                    String connsStr = connsField.optString("stringValue", "[]");
                                    JSONArray connsArr = new JSONArray(connsStr);
                                    SharedPreferences.Editor dirEd = prefs.edit();
                                    JSONArray discoveredWs = new JSONArray();
                                    discoveredWs.put(privKey);
                                    for (int i = 0; i < connsArr.length(); i++) {
                                        JSONObject cObj = connsArr.optJSONObject(i);
                                        if (cObj != null) {
                                            String otherEmail = cObj.optString("email", "").trim().toLowerCase();
                                            if (!otherEmail.isEmpty()) {
                                                String[] pair = new String[]{email, otherEmail};
                                                Arrays.sort(pair);
                                                String sharedId = sanitizeFirestoreId("shared_" + pair[0] + "__" + pair[1]);
                                                activeWsKeys.add(sharedId);
                                                discoveredWs.put(sharedId);
                                                JSONObject mods = cObj.optJSONObject("sharedModules");
                                                boolean shareAll = cObj.optBoolean("shareAll", false);
                                                if (mods != null ? mods.optBoolean("shopping", shareAll) : shareAll) {
                                                    dirEd.putString("ws_doc_shopping", sharedId);
                                                }
                                                if (mods != null ? mods.optBoolean("todo", shareAll) : shareAll) {
                                                    dirEd.putString("ws_doc_todo", sharedId);
                                                }
                                                if (mods != null ? mods.optBoolean("calendar", shareAll) : shareAll) {
                                                    dirEd.putString("ws_doc_calendar", sharedId);
                                                }
                                                if (mods != null ? mods.optBoolean("notes", shareAll) : shareAll) {
                                                    dirEd.putString("ws_doc_notes", sharedId);
                                                }
                                                if (mods != null ? mods.optBoolean("budget", shareAll) : shareAll) {
                                                    dirEd.putString("ws_doc_budget", sharedId);
                                                }
                                            }
                                        }
                                    }
                                    dirEd.putString("ws_keys_json", discoveredWs.toString());
                                    dirEd.apply();
                                }
                            }
                        }
                    } catch (Throwable ignored) {}
                }

                if (activeWsKeys.isEmpty()) return;

                Set<String> seenSet = new HashSet<>();
                JSONArray seenArr = new JSONArray(prefs.getString("seen_ids_json", "[]"));
                for (int i = 0; i < seenArr.length(); i++) {
                    String sId = seenArr.optString(i);
                    if (sId != null && !sId.isEmpty()) {
                        seenSet.add(sId);
                    }
                }
                boolean isFirstSeedOnDevice = seenSet.isEmpty();

                JSONArray postedArr = new JSONArray(prefs.getString("posted_notifs_json", "[]"));
                boolean seenChanged = false;
                boolean postedChanged = false;

                List<JSONArray> actionArraysToScan = new ArrayList<>();
                JSONArray bestShopping = null;
                JSONArray bestTodos = null;
                JSONArray bestEvents = null;
                JSONArray bestCategories = null;
                JSONArray bestNotes = null;
                JSONArray bestBudgetMonths = null;

                for (String docId : activeWsKeys) {
                    if (docId == null || docId.isEmpty() || "default".equals(docId)) continue;
                    try {
                        String respBody = fetchUrlString("https://firestore.googleapis.com/v1/projects/" + FIRESTORE_PROJECT_ID + "/databases/" + FIRESTORE_DB_ID + "/documents/workspaces/" + docId);
                        if (respBody == null) continue;

                        JSONObject docJson = new JSONObject(respBody);
                        JSONObject fields = docJson.optJSONObject("fields");
                        if (fields == null) continue;
                        JSONObject sliceJsonField = fields.optJSONObject("sliceJson");
                        if (sliceJsonField == null) continue;
                        String sliceJsonStr = sliceJsonField.optString("stringValue", "");
                        if (sliceJsonStr.isEmpty()) continue;

                        JSONObject slice = new JSONObject(sliceJsonStr);
                        boolean isSharedDoc = docId.startsWith("shared_");

                        JSONArray sArr = slice.optJSONArray("shopping");
                        if (sArr != null && (bestShopping == null || isSharedDoc)) {
                            bestShopping = sArr;
                        }
                        JSONArray tArr = slice.optJSONArray("todos");
                        if (tArr != null && (bestTodos == null || isSharedDoc)) {
                            bestTodos = tArr;
                        }
                        JSONArray eArr = slice.optJSONArray("events");
                        if (eArr != null && (bestEvents == null || (eArr.length() > 0 && (isSharedDoc || bestEvents.length() == 0)))) {
                            bestEvents = eArr;
                        }
                        JSONArray cArr = slice.optJSONArray("categories");
                        if (cArr != null && (bestCategories == null || (cArr.length() > 0 && (isSharedDoc || bestCategories.length() == 0)))) {
                            bestCategories = cArr;
                        }
                        JSONArray nArr = slice.optJSONArray("notes");
                        if (nArr != null && (bestNotes == null || (nArr.length() > 0 && (isSharedDoc || bestNotes.length() == 0)))) {
                            bestNotes = nArr;
                        }
                        JSONArray bArr = slice.optJSONArray("budgetMonths");
                        if (bArr != null && (bestBudgetMonths == null || (bArr.length() > 0 && (isSharedDoc || bestBudgetMonths.length() == 0)))) {
                            bestBudgetMonths = bArr;
                        }

                        JSONArray sliceActions = slice.optJSONArray("recentActions");
                        if (sliceActions != null) {
                            actionArraysToScan.add(sliceActions);
                        }
                    } catch (Throwable ignored) {
                    }
                }

                if (bestShopping != null || bestTodos != null || bestEvents != null || bestNotes != null || bestBudgetMonths != null) {
                    JSONObject mergedSlice = new JSONObject();
                    if (bestShopping != null) mergedSlice.put("shopping", bestShopping);
                    if (bestTodos != null) mergedSlice.put("todos", bestTodos);
                    if (bestEvents != null) mergedSlice.put("events", bestEvents);
                    if (bestCategories != null) mergedSlice.put("categories", bestCategories);
                    if (bestNotes != null) mergedSlice.put("notes", bestNotes);
                    if (bestBudgetMonths != null) mergedSlice.put("budgetMonths", bestBudgetMonths);
                    HemWidgetBridge.updateFromRemoteSlice(ctx, mergedSlice);
                }

                for (JSONArray recentActions : actionArraysToScan) {
                    for (int i = recentActions.length() - 1; i >= 0; i--) {
                        JSONObject act = recentActions.optJSONObject(i);
                        if (act == null) continue;
                        String actId = act.optString("id", "");
                        if (actId.isEmpty() || seenSet.contains(actId)) continue;

                        seenSet.add(actId);
                        seenArr.put(actId);
                        seenChanged = true;

                        String actDeviceId = act.optString("deviceId", "");
                        if (myDeviceId.equals(actDeviceId)) continue;

                        String actionType = act.optString("actionType", "shopping");
                        if ("sync".equals(actionType)) continue;

                        String summary = act.optString("summary", "");
                        if (isDeletionOrNonAdditionSummary(summary)) continue;

                        // Check action age so old history (>20 min) or initial install seed never floods notifications
                        String createdAtStr = act.optString("createdAt", "");
                        if (!createdAtStr.isEmpty() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            try {
                                long createdMs = Instant.parse(createdAtStr).toEpochMilli();
                                long ageMs = nowMs - createdMs;
                                if (isFirstSeedOnDevice && ageMs > 120000L) continue;
                                if (ageMs > 20L * 60L * 1000L) continue;
                            } catch (Throwable ignored) {}
                        } else if (isFirstSeedOnDevice) {
                            continue;
                        }

                        String fullTitle = "Hem";
                        String formattedBody = formatHemNotificationBody(actionType, summary);
                        int nativeId = computeDeterministicNativeId(actId);

                        postNativeStatusBarNotification(ctx, nativeId, fullTitle, formattedBody);

                        JSONObject postedItem = new JSONObject();
                        postedItem.put("id", "notif-" + actId);
                        postedItem.put("actionId", actId);
                        postedItem.put("nativeId", nativeId);
                        postedItem.put("title", fullTitle);
                        postedItem.put("body", formattedBody);
                        postedItem.put("type", actionType);
                        postedArr.put(postedItem);
                        postedChanged = true;
                    }
                }

                SharedPreferences.Editor ed = prefs.edit();
                if (seenChanged) {
                    JSONArray trimmed = new JSONArray();
                    int start = Math.max(0, seenArr.length() - 180);
                    for (int i = start; i < seenArr.length(); i++) {
                        trimmed.put(seenArr.optString(i));
                    }
                    ed.putString("seen_ids_json", trimmed.toString());
                }
                if (postedChanged) {
                    ed.putString("posted_notifs_json", postedArr.toString());
                }
                ed.apply();
            } catch (Throwable ignored) {
            }
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        ensureChannel(getApplicationContext());
        scheduleNextAlarm(getApplicationContext());
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                serviceWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Hem:ContinuousSyncLock");
                serviceWakeLock.setReferenceCounted(false);
                serviceWakeLock.acquire(24 * 60 * 60 * 1000L);
            }
        } catch (Throwable ignored) {
        }
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleWithFixedDelay(() -> {
            try {
                if (serviceWakeLock != null && !serviceWakeLock.isHeld()) {
                    serviceWakeLock.acquire(24 * 60 * 60 * 1000L);
                }
            } catch (Throwable ignored) {}
            pollCloudOnce(getApplicationContext());
            scheduleNextAlarm(getApplicationContext());
        }, 5, 45, TimeUnit.SECONDS);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        ensureChannel(getApplicationContext());
        scheduleNextAlarm(getApplicationContext());
        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        scheduleNextAlarm(getApplicationContext());
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        if (scheduler != null) {
            scheduler.shutdownNow();
        }
        try {
            if (serviceWakeLock != null && serviceWakeLock.isHeld()) {
                serviceWakeLock.release();
            }
        } catch (Throwable ignored) {}
        scheduleNextAlarm(getApplicationContext());
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
`;

const hemMediaListenerServiceJava = `package se.carlberg.hem;

import android.app.Notification;
import android.content.ComponentName;
import android.content.Context;
import android.media.MediaMetadata;
import android.media.MediaRouter;
import android.media.session.MediaController;
import android.media.session.MediaSession;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.ArrayList;
import java.util.List;

public class HemMediaListenerService extends NotificationListenerService {
    public static volatile HemMediaListenerService activeInstance = null;
    public static volatile String currentTrack = "";
    public static volatile String currentArtist = "";
    public static volatile String currentAlbum = "";
    public static volatile String currentPackage = "";
    public static volatile String currentAppName = "";
    public static volatile String currentDeviceName = "";
    public static volatile boolean currentIsCast = false;
    public static volatile String currentMediaType = "audio";
    public static volatile boolean currentPlaying = false;
    public static volatile boolean currentHasSession = false;
    public static volatile long currentDurationMs = 0L;
    public static volatile long currentPositionMs = 0L;
    public static volatile long lastUpdatedMs = 0L;

    public static String friendlyAppNameFromPackage(String pkg) {
        if (pkg == null) return "Media";
        String p = pkg.toLowerCase();
        if (p.contains("spotify")) return "Spotify";
        if (p.contains("youtube.tv") || p.contains("youtube.leanback")) return "YouTube TV";
        if (p.contains("youtube")) return "YouTube";
        if (p.contains("svtplay") || p.contains("svt.")) return "SVT Play";
        if (p.contains("netflix")) return "Netflix";
        if (p.contains("tv4play") || p.contains("tv4.")) return "TV4 Play";
        if (p.contains("disney")) return "Disney+";
        if (p.contains("hbomax") || p.contains("wbd.stream") || p.contains("max.")) return "Max";
        if (p.contains("viaplay")) return "Viaplay";
        if (p.contains("amazon.avod") || p.contains("primevideo")) return "Prime Video";
        if (p.contains("chromecast") || p.contains("google.android.gms")) return "Google Cast";
        if (p.contains("chrome")) return "Chrome Cast";
        if (p.contains("sverigesradio") || p.contains("sr.play")) return "Sveriges Radio";
        if (p.contains("plex")) return "Plex";
        if (p.contains("twitch")) return "Twitch";
        return "Cast / Media";
    }

    public static boolean isVideoPackage(String pkg) {
        if (pkg == null) return false;
        String p = pkg.toLowerCase();
        return p.contains("youtube") || p.contains("svt") || p.contains("netflix") ||
               p.contains("tv4") || p.contains("disney") || p.contains("wbd") ||
               p.contains("viaplay") || p.contains("avod") || p.contains("primevideo") ||
               p.contains("plex") || p.contains("twitch") || p.contains("gms") ||
               p.contains("chromecast");
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        activeInstance = this;
        refreshFromActiveSessions(getApplicationContext());
    }

    @Override
    public void onListenerDisconnected() {
        if (activeInstance == this) activeInstance = null;
        super.onListenerDisconnected();
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        try {
            refreshFromActiveSessions(getApplicationContext());
        } catch (Throwable ignored) {}
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        try {
            refreshFromActiveSessions(getApplicationContext());
        } catch (Throwable ignored) {}
    }

    public static String getSelectedCastRouteName(Context ctx) {
        if (ctx == null) return "";
        try {
            MediaRouter mr = (MediaRouter) ctx.getSystemService(Context.MEDIA_ROUTER_SERVICE);
            if (mr != null) {
                MediaRouter.RouteInfo selected = mr.getSelectedRoute(MediaRouter.ROUTE_TYPE_LIVE_AUDIO | MediaRouter.ROUTE_TYPE_LIVE_VIDEO);
                if (selected != null && selected.getPlaybackType() == MediaRouter.RouteInfo.PLAYBACK_TYPE_REMOTE) {
                    CharSequence n = selected.getName(ctx);
                    if (n != null && n.length() > 0) return n.toString();
                }
                int count = mr.getRouteCount();
                for (int i = 0; i < count; i++) {
                    MediaRouter.RouteInfo ri = mr.getRouteAt(i);
                    if (ri != null && ri.getPlaybackType() == MediaRouter.RouteInfo.PLAYBACK_TYPE_REMOTE && ri == selected) {
                        CharSequence n = ri.getName(ctx);
                        if (n != null && n.length() > 0) return n.toString();
                    }
                }
            }
        } catch (Throwable ignored) {}
        return "";
    }

    private static List<MediaController> collectAllMediaControllers(Context ctx, StringBuilder outNotifSubText) {
        List<MediaController> allControllers = new ArrayList<>();
        if (ctx == null) return allControllers;
        try {
            MediaSessionManager msm = (MediaSessionManager) ctx.getSystemService(Context.MEDIA_SESSION_SERVICE);
            if (msm != null) {
                ComponentName cn = new ComponentName(ctx, HemMediaListenerService.class);
                List<MediaController> active = msm.getActiveSessions(cn);
                if (active != null) allControllers.addAll(active);
            }
        } catch (Throwable ignored) {}

        try {
            HemMediaListenerService inst = activeInstance;
            if (inst != null) {
                StatusBarNotification[] sbns = inst.getActiveNotifications();
                if (sbns != null) {
                    for (StatusBarNotification sbn : sbns) {
                        if (sbn == null || sbn.getNotification() == null) continue;
                        Notification n = sbn.getNotification();
                        Bundle ex = n.extras;
                        if (ex == null) continue;
                        CharSequence sub = ex.getCharSequence(Notification.EXTRA_SUB_TEXT);
                        if (sub != null && sub.length() > 0 && outNotifSubText != null && outNotifSubText.length() == 0) {
                            outNotifSubText.append(sub.toString());
                        }
                        Object tokenObj = ex.get(Notification.EXTRA_MEDIA_SESSION);
                        if (tokenObj instanceof MediaSession.Token) {
                            MediaController mc = new MediaController(ctx, (MediaSession.Token) tokenObj);
                            allControllers.add(mc);
                        }
                    }
                }
            }
        } catch (Throwable ignored) {}
        return allControllers;
    }

    public static void refreshFromActiveSessions(Context ctx) {
        if (ctx == null) return;
        try {
            StringBuilder notifSubText = new StringBuilder();
            List<MediaController> allControllers = collectAllMediaControllers(ctx, notifSubText);
            String notifSubTextDevice = notifSubText.toString();

            MediaController bestPlaying = null;
            MediaController bestPaused = null;
            for (MediaController mc : allControllers) {
                if (mc == null) continue;
                PlaybackState st = mc.getPlaybackState();
                if (st != null) {
                    int s = st.getState();
                    if (s == PlaybackState.STATE_PLAYING || s == PlaybackState.STATE_BUFFERING) {
                        bestPlaying = mc;
                        break;
                    } else if (bestPaused == null && (s == PlaybackState.STATE_PAUSED || s == PlaybackState.STATE_CONNECTING || s == PlaybackState.STATE_FAST_FORWARDING || s == PlaybackState.STATE_REWINDING)) {
                        MediaMetadata m = mc.getMetadata();
                        if (m != null) {
                            bestPaused = mc;
                        }
                    }
                }
            }

            MediaController chosen = bestPlaying != null ? bestPlaying : bestPaused;
            if (chosen == null) {
                currentPlaying = false;
                currentHasSession = false;
                return;
            }

            String pkg = chosen.getPackageName() != null ? chosen.getPackageName() : "";
            currentPackage = pkg;
            currentAppName = friendlyAppNameFromPackage(pkg);
            MediaController.PlaybackInfo pInfo = chosen.getPlaybackInfo();
            boolean isRemoteRoute = (pInfo != null && pInfo.getPlaybackType() == MediaController.PlaybackInfo.PLAYBACK_TYPE_REMOTE);
            String castRouteName = getSelectedCastRouteName(ctx);
            currentIsCast = isRemoteRoute || !castRouteName.isEmpty() || pkg.toLowerCase().contains("gms") || pkg.toLowerCase().contains("chromecast");
            currentMediaType = (isVideoPackage(pkg) || currentIsCast) && !pkg.toLowerCase().contains("spotify") ? "video" : "audio";

            MediaMetadata meta = chosen.getMetadata();
            PlaybackState state = chosen.getPlaybackState();
            if (meta != null) {
                CharSequence t = meta.getText(MediaMetadata.METADATA_KEY_TITLE);
                if (t == null || t.length() == 0) t = meta.getText(MediaMetadata.METADATA_KEY_DISPLAY_TITLE);
                CharSequence a = meta.getText(MediaMetadata.METADATA_KEY_ARTIST);
                if (a == null || a.length() == 0) a = meta.getText(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE);
                if (a == null || a.length() == 0) a = meta.getText(MediaMetadata.METADATA_KEY_ALBUM_ARTIST);
                CharSequence al = meta.getText(MediaMetadata.METADATA_KEY_ALBUM);
                if (al == null || al.length() == 0) al = meta.getText(MediaMetadata.METADATA_KEY_DISPLAY_DESCRIPTION);
                long dur = meta.getLong(MediaMetadata.METADATA_KEY_DURATION);
                currentTrack = (t != null && t.length() > 0) ? t.toString() : currentAppName;
                currentArtist = (a != null && a.length() > 0) ? a.toString() : currentAppName;
                currentAlbum = (al != null) ? al.toString() : "";
                currentDurationMs = dur > 0 ? dur : 0L;
            }
            if (!castRouteName.isEmpty()) {
                currentDeviceName = castRouteName;
            } else if (!notifSubTextDevice.isEmpty()) {
                currentDeviceName = notifSubTextDevice;
            } else if (currentIsCast) {
                currentDeviceName = "Google Cast / TV";
            } else {
                currentDeviceName = currentAppName + " på enheten";
            }

            currentHasSession = true;
            if (state != null) {
                int st = state.getState();
                currentPlaying = (st == PlaybackState.STATE_PLAYING || st == PlaybackState.STATE_BUFFERING);
                if (state.getPosition() >= 0) {
                    currentPositionMs = state.getPosition();
                }
            } else {
                currentPlaying = (bestPlaying != null);
            }
            lastUpdatedMs = System.currentTimeMillis();
        } catch (Throwable ignored) {}
    }

    public static boolean dispatchTransportCommand(Context ctx, String cmd) {
        if (ctx == null) return false;
        try {
            List<MediaController> controllers = collectAllMediaControllers(ctx, null);
            if (controllers.isEmpty()) return false;

            boolean dispatchedAny = false;
            for (MediaController mc : controllers) {
                if (mc == null || mc.getTransportControls() == null) continue;
                PlaybackState st = mc.getPlaybackState();
                int s = st != null ? st.getState() : PlaybackState.STATE_NONE;
                String pkg = mc.getPackageName() != null ? mc.getPackageName().toLowerCase() : "";
                MediaController.PlaybackInfo pInfo = mc.getPlaybackInfo();
                boolean isRemote = (pInfo != null && pInfo.getPlaybackType() == MediaController.PlaybackInfo.PLAYBACK_TYPE_REMOTE)
                    || pkg.contains("gms") || pkg.contains("chromecast");
                boolean isActiveSession = (s == PlaybackState.STATE_PLAYING || s == PlaybackState.STATE_BUFFERING || s == PlaybackState.STATE_PAUSED || isRemote);
                if (!isActiveSession && controllers.size() > 1) continue;

                MediaController.TransportControls tc = mc.getTransportControls();
                if ("play".equals(cmd)) {
                    tc.play();
                    currentPlaying = true;
                    dispatchedAny = true;
                } else if ("pause".equals(cmd)) {
                    tc.pause();
                    currentPlaying = false;
                    dispatchedAny = true;
                } else if ("stop".equals(cmd)) {
                    tc.stop();
                    currentPlaying = false;
                    currentHasSession = false;
                    dispatchedAny = true;
                } else if ("next".equals(cmd)) {
                    tc.skipToNext();
                    dispatchedAny = true;
                } else if ("prev".equals(cmd)) {
                    tc.skipToPrevious();
                    dispatchedAny = true;
                } else if ("play_pause".equals(cmd)) {
                    if (s == PlaybackState.STATE_PLAYING || s == PlaybackState.STATE_BUFFERING) {
                        tc.pause();
                        currentPlaying = false;
                    } else {
                        tc.play();
                        currentPlaying = true;
                    }
                    dispatchedAny = true;
                }
            }
            return dispatchedAny;
        } catch (Throwable ignored) {
            return false;
        }
    }
}
`;

const hemNativeBridgeJava = `package se.carlberg.hem;

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

            // Prioritize active MediaSession (Cast, YouTube, SVT Play, Netflix, Spotify, etc. — playing or paused)
            if ((HemMediaListenerService.currentPlaying || HemMediaListenerService.currentHasSession) && HemMediaListenerService.currentTrack != null && !HemMediaListenerService.currentTrack.isEmpty()) {
                obj.put("trackTitle", HemMediaListenerService.currentTrack);
                obj.put("artistName", HemMediaListenerService.currentArtist != null ? HemMediaListenerService.currentArtist : "");
                obj.put("albumName", HemMediaListenerService.currentAlbum != null ? HemMediaListenerService.currentAlbum : "");
                obj.put("appName", HemMediaListenerService.currentAppName != null ? HemMediaListenerService.currentAppName : "Media");
                obj.put("deviceName", HemMediaListenerService.currentDeviceName != null ? HemMediaListenerService.currentDeviceName : "Denna enhet");
                obj.put("isCast", HemMediaListenerService.currentIsCast);
                obj.put("mediaType", HemMediaListenerService.currentMediaType != null ? HemMediaListenerService.currentMediaType : "audio");
                obj.put("durationMs", HemMediaListenerService.currentDurationMs);
                obj.put("progressMs", HemMediaListenerService.currentPositionMs);
                obj.put("isPlaying", HemMediaListenerService.currentPlaying);
                obj.put("hasMediaSession", true);
                obj.put("playerState", HemMediaListenerService.currentPlaying ? "PLAYING" : "PAUSED");
                obj.put("updatedAt", HemMediaListenerService.lastUpdatedMs);
                return obj.toString();
            }

            // Fallback to Spotify broadcast receiver if it has an active track
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
                obj.put("hasMediaSession", true);
                obj.put("playerState", "PLAYING");
                obj.put("updatedAt", lastSpotifyUpdatedAt);
                return obj.toString();
            }

            obj.put("isPlaying", false);
            obj.put("hasMediaSession", false);
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
                .replace("&quot;", "\\"")
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
            conn.setRequestProperty("Content-Type", "text/xml; charset=\\"utf-8\\"");
            conn.setRequestProperty("SOAPAction", "\\"urn:schemas-upnp-org:service:" + serviceType + ":1#" + actionName + "\\"");
            String envelope = "<?xml version=\\"1.0\\" encoding=\\"utf-8\\"?>" +
                "<s:Envelope xmlns:s=\\"http://schemas.xmlsoap.org/soap/envelope/\\" s:encodingStyle=\\"http://schemas.xmlsoap.org/soap/encoding/\\">" +
                "<s:Body><u:" + actionName + " xmlns:u=\\"urn:schemas-upnp-org:service:" + serviceType + ":1\\">" +
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
            String sonosDevId = "sonos-" + ip.replace(".", "-");
            result.put("id", sonosDevId);
            result.put("deviceId", sonosDevId);
            result.put("ip", ip);
            result.put("deviceIp", ip);
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
            boolean isPausedNow = "PAUSED_PLAYBACK".equalsIgnoreCase(tState);
            Long overrideUntil = manualCastStateOverrideUntilMs.get(ip);
            if (overrideUntil != null && System.currentTimeMillis() < overrideUntil) {
                Boolean ovPlay = manualCastStateOverridePlaying.get(ip);
                if (ovPlay != null) {
                    isPlayingNow = ovPlay;
                    isPausedNow = !ovPlay;
                }
            }
            result.put("isPlaying", isPlayingNow);
            result.put("isActive", isPlayingNow || isPausedNow);
            result.put("hasMediaSession", false);

            if (isPlayingNow || isPausedNow) {
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
                    result.put("hasMediaSession", true);
                    result.put("playerState", isPlayingNow ? "PLAYING" : "PAUSED");
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
                String msg = "M-SEARCH * HTTP/1.1\\r\\n" +
                             "HOST: 239.255.255.250:1900\\r\\n" +
                             "MAN: \\"ssdp:discover\\"\\r\\n" +
                             "MX: 1\\r\\n" +
                             "ST: " + st + "\\r\\n\\r\\n";
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

    private static final java.util.concurrent.ConcurrentHashMap<String, Long> manualCastStateOverrideUntilMs = new java.util.concurrent.ConcurrentHashMap<>();
    private static final java.util.concurrent.ConcurrentHashMap<String, Boolean> manualCastStateOverridePlaying = new java.util.concurrent.ConcurrentHashMap<>();
    private static final java.util.concurrent.ConcurrentHashMap<String, Long> castLastPositionMsMap = new java.util.concurrent.ConcurrentHashMap<>();
    private static final java.util.concurrent.ConcurrentHashMap<String, Long> castLastPositionSampledAtMap = new java.util.concurrent.ConcurrentHashMap<>();
    private static final java.util.concurrent.ConcurrentHashMap<String, String> castLastTrackKeyMap = new java.util.concurrent.ConcurrentHashMap<>();

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
        int firstBrace = raw.indexOf("{\\"");
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
                if (eureka != null && eureka.contains("\\"name\\"")) {
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

            os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.tp.connection", "{\\"type\\":\\"CONNECT\\"}"));
            os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.receiver", "{\\"type\\":\\"GET_STATUS\\",\\"requestId\\":1}"));
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

            String castDevId = "cast-" + ip.replace(".", "-");
            JSONObject result = new JSONObject();
            result.put("id", castDevId);
            result.put("deviceId", castDevId);
            result.put("ip", ip);
            result.put("deviceIp", ip);
            result.put("port", port > 0 ? port : 8009);
            result.put("name", name);
            result.put("model", model);
            result.put("type", isTv ? "TV" : "Speaker");
            result.put("source", "google-cast");
            result.put("volumePercent", existing != null ? existing.optInt("volumePercent", 60) : 60);
            result.put("isActive", false);
            result.put("isPlaying", false);
            result.put("hasMediaSession", false);

            for (int step = 0; step < 6; step++) {
                String msgStr = readCastV2JsonMessage(is);
                if (msgStr == null) break;
                JSONObject msg = new JSONObject(msgStr);
                String msgType = msg.optString("type", "");
                if ("PING".equals(msgType)) {
                    os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.tp.heartbeat", "{\\"type\\":\\"PONG\\"}"));
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
                                String sessionId = app.optString("sessionId", "");
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
                                    result.put("appName", displayName);
                                    result.put("statusText", statusText);
                                    result.put("transportId", transportId);
                                    result.put("sessionId", sessionId);
                                    result.put("mediaType", displayName.toLowerCase().contains("spotify") ? "audio" : "video");
                                    String cleanStatus = statusText
                                        .replace("Casting:", "")
                                        .replace("Now Playing:", "")
                                        .replace("Spelar upp:", "")
                                        .trim();
                                    boolean hasCleanStatusTrack = !cleanStatus.isEmpty() &&
                                        !cleanStatus.equalsIgnoreCase("Now Playing") &&
                                        !cleanStatus.equalsIgnoreCase("Casting") &&
                                        !cleanStatus.equalsIgnoreCase("Ready To Cast") &&
                                        !cleanStatus.equalsIgnoreCase(displayName);
                                    result.put("trackTitle", hasCleanStatusTrack ? cleanStatus : displayName);
                                    result.put("artistName", displayName + " · " + name);

                                    boolean receivedMediaStatus = false;
                                    // Query MEDIA_STATUS on transportId for rich title, channel, thumbnail, duration & exact playerState (PLAYING vs PAUSED)
                                    if (!transportId.isEmpty()) {
                                        try {
                                            os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.tp.connection", "{\\"type\\":\\"CONNECT\\"}"));
                                            os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\\"type\\":\\"GET_STATUS\\",\\"requestId\\":2}"));
                                            os.flush();
                                            for (int mStep = 0; mStep < 6; mStep++) {
                                                String mediaMsgStr = readCastV2JsonMessage(is);
                                                if (mediaMsgStr == null) break;
                                                JSONObject mObj = new JSONObject(mediaMsgStr);
                                                String mType = mObj.optString("type", "");
                                                if ("PING".equals(mType)) {
                                                    os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.tp.heartbeat", "{\\"type\\":\\"PONG\\"}"));
                                                    os.flush();
                                                    continue;
                                                }
                                                if ("MEDIA_STATUS".equals(mType)) {
                                                    receivedMediaStatus = true;
                                                    JSONArray stArr = mObj.optJSONArray("status");
                                                    if (stArr != null && stArr.length() > 0) {
                                                        JSONObject mSt = stArr.optJSONObject(0);
                                                        if (mSt != null) {
                                                            String pState = mSt.optString("playerState", "IDLE");
                                                            double playbackRate = mSt.optDouble("playbackRate", 1.0);
                                                            result.put("mediaSessionId", mSt.optInt("mediaSessionId", 1));
                                                            double curSec = mSt.optDouble("currentTime", 0.0);
                                                            long progMs = Math.max(0L, Math.round(curSec * 1000.0));
                                                            result.put("progressMs", progMs);

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

                                                            // Detect if playerState is PAUSED, playbackRate == 0, Android MediaSession is paused, or position is frozen across polls
                                                            HemMediaListenerService.refreshFromActiveSessions(appContext);
                                                            boolean androidCastPaused = HemMediaListenerService.currentHasSession &&
                                                                HemMediaListenerService.currentIsCast &&
                                                                !HemMediaListenerService.currentPlaying;
                                                            String trackKey = displayName + "|" + result.optString("trackTitle", "");
                                                            long nowSampleMs = System.currentTimeMillis();
                                                            boolean positionFrozen = false;
                                                            String prevKey = castLastTrackKeyMap.get(ip);
                                                            Long prevSampleAt = castLastPositionSampledAtMap.get(ip);
                                                            Long prevProgMs = castLastPositionMsMap.get(ip);
                                                            if (prevKey != null && prevKey.equals(trackKey) && prevSampleAt != null && prevProgMs != null) {
                                                                long elapsedSample = nowSampleMs - prevSampleAt;
                                                                if (elapsedSample >= 1500L) {
                                                                    if (Math.abs(progMs - prevProgMs) < 350L) {
                                                                        positionFrozen = true;
                                                                    }
                                                                    castLastPositionMsMap.put(ip, progMs);
                                                                    castLastPositionSampledAtMap.put(ip, nowSampleMs);
                                                                }
                                                            } else {
                                                                castLastTrackKeyMap.put(ip, trackKey);
                                                                castLastPositionMsMap.put(ip, progMs);
                                                                castLastPositionSampledAtMap.put(ip, nowSampleMs);
                                                            }

                                                            boolean isPausedState = "PAUSED".equalsIgnoreCase(pState) ||
                                                                "IDLE".equalsIgnoreCase(pState) ||
                                                                playbackRate == 0.0 ||
                                                                statusText.toLowerCase().contains("paus") ||
                                                                androidCastPaused ||
                                                                positionFrozen ||
                                                                (progMs == 0L && result.optLong("durationMs", 0L) == 0L);
                                                            boolean playingNow = ("PLAYING".equalsIgnoreCase(pState) || "BUFFERING".equalsIgnoreCase(pState)) && !isPausedState;
                                                            boolean hasSessionNow = playingNow || "PAUSED".equalsIgnoreCase(pState) || "LOADING".equalsIgnoreCase(pState) || isPausedState;

                                                            result.put("isPlaying", playingNow);
                                                            result.put("hasMediaSession", hasSessionNow);
                                                            result.put("playerState", playingNow ? "PLAYING" : (hasSessionNow ? "PAUSED" : pState));
                                                        }
                                                    } else {
                                                        // Empty status array in MEDIA_STATUS -> no active media stream playing
                                                        result.put("isPlaying", false);
                                                        result.put("hasMediaSession", false);
                                                        result.put("playerState", "IDLE");
                                                    }
                                                    break;
                                                }
                                            }
                                        } catch (Throwable ignored) {}
                                    }

                                    if (!receivedMediaStatus) {
                                        // Fallback when app on Google TV Streamer does not answer CastV2 MEDIA_STATUS
                                        HemMediaListenerService.refreshFromActiveSessions(appContext);
                                        if (HemMediaListenerService.currentHasSession && !HemMediaListenerService.currentTrack.isEmpty()) {
                                            result.put("trackTitle", HemMediaListenerService.currentTrack);
                                            if (!HemMediaListenerService.currentArtist.isEmpty()) {
                                                result.put("artistName", HemMediaListenerService.currentArtist + " · " + displayName);
                                            }
                                            result.put("durationMs", HemMediaListenerService.currentDurationMs);
                                            result.put("progressMs", HemMediaListenerService.currentPositionMs);
                                            result.put("hasMediaSession", true);
                                            result.put("isPlaying", HemMediaListenerService.currentPlaying);
                                            result.put("playerState", HemMediaListenerService.currentPlaying ? "PLAYING" : "PAUSED");
                                        } else {
                                            // Do not falsely claim isPlaying=true when MEDIA_STATUS was not received and no active session is playing
                                            result.put("hasMediaSession", true);
                                            result.put("isPlaying", false);
                                            result.put("playerState", "PAUSED");
                                        }
                                    }

                                    Long overrideUntil = manualCastStateOverrideUntilMs.get(ip);
                                    if (overrideUntil != null && System.currentTimeMillis() < overrideUntil) {
                                        Boolean ovPlay = manualCastStateOverridePlaying.get(ip);
                                        if (ovPlay != null) {
                                            result.put("isPlaying", ovPlay);
                                            result.put("hasMediaSession", true);
                                            result.put("playerState", ovPlay ? "PLAYING" : "PAUSED");
                                        }
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

            JSONObject bestPausedSession = null;

            // Probe all discovered Cast (port 8009) & Sonos (port 1400) devices on the network
            for (String ip : discoveredCastDevices.keySet()) {
                JSONObject cached = discoveredCastDevices.get(ip);
                int port = cached != null ? cached.optInt("port", 8009) : 8009;
                JSONObject fresh = (port == 1400)
                    ? probeSonosDeviceOnPort1400(ip)
                    : probeCastDeviceOnPort8009(ip, port);
                if (fresh == null) continue;
                String title = fresh.optString("trackTitle", "").trim();
                if (title.isEmpty()) continue;

                fresh.put("deviceName", fresh.optString("name", port == 1400 ? "Sonos" : "Google TV Streamer"));
                fresh.put("deviceIp", ip);
                fresh.put("deviceId", fresh.optString("id", "cast-" + ip.replace(".", "-")));
                fresh.put("isCast", port != 1400);

                if (fresh.optBoolean("isPlaying", false)) {
                    return fresh.toString();
                }
                if (bestPausedSession == null && (fresh.optBoolean("hasMediaSession", false) || "PAUSED".equalsIgnoreCase(fresh.optString("playerState", "")))) {
                    bestPausedSession = fresh;
                }
            }

            if (bestPausedSession != null) {
                return bestPausedSession.toString();
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
                if (d != null && (targetIp.equals(ip) || targetIp.equals(d.optString("id", "")) || targetIp.equals(d.optString("deviceId", "")) || targetIp.equalsIgnoreCase(d.optString("name", "")))) {
                    targetIp = ip;
                    targetPort = d.optInt("port", 8009);
                    break;
                }
            }
        }
        if (targetIp.isEmpty() && !discoveredCastDevices.isEmpty()) {
            for (String ip : discoveredCastDevices.keySet()) {
                JSONObject d = discoveredCastDevices.get(ip);
                if (d != null && (d.optBoolean("isPlaying", false) || d.optBoolean("hasMediaSession", false) || d.optBoolean("isActive", false))) {
                    targetIp = ip;
                    targetPort = d.optInt("port", 8009);
                    break;
                }
            }
        }

        JSONObject cachedTarget = !targetIp.isEmpty() ? discoveredCastDevices.get(targetIp) : null;
        boolean currentlyPlaying = cachedTarget != null && cachedTarget.optBoolean("isPlaying", false);
        String resolvedMediaCmd = cmd;
        if ("play_pause".equals(cmd)) {
            if (value == 1) resolvedMediaCmd = "play";
            else if (value == 0) resolvedMediaCmd = "pause";
            else resolvedMediaCmd = currentlyPlaying ? "pause" : "play";
        }

        if (!targetIp.isEmpty() && ("play".equals(resolvedMediaCmd) || "pause".equals(resolvedMediaCmd))) {
            boolean wantPlaying = "play".equals(resolvedMediaCmd);
            manualCastStateOverridePlaying.put(targetIp, wantPlaying);
            manualCastStateOverrideUntilMs.put(targetIp, System.currentTimeMillis() + 5500L);
            if (cachedTarget != null) {
                try {
                    cachedTarget.put("isPlaying", wantPlaying);
                    cachedTarget.put("hasMediaSession", true);
                    cachedTarget.put("playerState", wantPlaying ? "PLAYING" : "PAUSED");
                } catch (Throwable ignored) {}
            }
        }

        // Also dispatch through Android MediaSession / Google Play Services Cast notification if present
        if ("play".equals(resolvedMediaCmd) || "pause".equals(resolvedMediaCmd) || "next".equals(resolvedMediaCmd) || "prev".equals(resolvedMediaCmd) || "stop".equals(resolvedMediaCmd)) {
            try {
                HemMediaListenerService.dispatchTransportCommand(appContext, resolvedMediaCmd);
            } catch (Throwable ignored) {}
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
                if ("play".equals(resolvedMediaCmd)) {
                    sendSonosSoapAction(targetIp, "/MediaRenderer/AVTransport/Control", "AVTransport", "Play", "<InstanceID>0</InstanceID><Speed>1</Speed>", 600);
                    return true;
                }
                if ("pause".equals(resolvedMediaCmd)) {
                    sendSonosSoapAction(targetIp, "/MediaRenderer/AVTransport/Control", "AVTransport", "Pause", "<InstanceID>0</InstanceID>", 600);
                    return true;
                }
                if ("stop".equals(resolvedMediaCmd)) {
                    sendSonosSoapAction(targetIp, "/MediaRenderer/AVTransport/Control", "AVTransport", "Stop", "<InstanceID>0</InstanceID>", 600);
                    return true;
                }
                if ("next".equals(resolvedMediaCmd)) {
                    sendSonosSoapAction(targetIp, "/MediaRenderer/AVTransport/Control", "AVTransport", "Next", "<InstanceID>0</InstanceID>", 600);
                    return true;
                }
                if ("prev".equals(resolvedMediaCmd)) {
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

        // 2. If target is a Google Cast / Google TV Streamer on port 8009, dispatch CastV2 command on a single subscribed TLS socket
        if (!targetIp.isEmpty() && targetIp.matches("^[0-9]+\\\\.[0-9]+\\\\.[0-9]+\\\\.[0-9]+$")) {
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
                rawSock.connect(new java.net.InetSocketAddress(targetIp, 8009), 500);
                sock = (javax.net.ssl.SSLSocket) sc.getSocketFactory().createSocket(rawSock, targetIp, 8009, true);
                sock.setSoTimeout(600);
                sock.startHandshake();
                java.io.OutputStream os = sock.getOutputStream();
                InputStream is = sock.getInputStream();

                // Connect to receiver-0 and request RECEIVER_STATUS on this same socket
                os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.tp.connection", "{\\"type\\":\\"CONNECT\\"}"));
                if ("volume".equals(cmd)) {
                    double lvl = Math.max(0.0, Math.min(1.0, value / 100.0));
                    os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.receiver", "{\\"type\\":\\"SET_VOLUME\\",\\"volume\\":{\\"level\\":" + lvl + "},\\"requestId\\":10}"));
                    os.flush();
                    try { readCastV2JsonMessage(is); } catch (Throwable ignored) {}
                    return true;
                }
                if ("mute".equals(cmd)) {
                    boolean m = (value == 1);
                    os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.receiver", "{\\"type\\":\\"SET_VOLUME\\",\\"volume\\":{\\"muted\\":" + m + "},\\"requestId\\":11}"));
                    os.flush();
                    try { readCastV2JsonMessage(is); } catch (Throwable ignored) {}
                    return true;
                }

                os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.receiver", "{\\"type\\":\\"GET_STATUS\\",\\"requestId\\":1}"));
                os.flush();

                String transportId = cachedTarget != null ? cachedTarget.optString("transportId", "") : "";
                String sessionId = cachedTarget != null ? cachedTarget.optString("sessionId", "") : "";
                int mediaSessionId = cachedTarget != null ? cachedTarget.optInt("mediaSessionId", 1) : 1;

                for (int rStep = 0; rStep < 5; rStep++) {
                    String rMsgStr = readCastV2JsonMessage(is);
                    if (rMsgStr == null) break;
                    JSONObject rMsg = new JSONObject(rMsgStr);
                    String rType = rMsg.optString("type", "");
                    if ("PING".equals(rType)) {
                        os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.tp.heartbeat", "{\\"type\\":\\"PONG\\"}"));
                        os.flush();
                        continue;
                    }
                    if ("RECEIVER_STATUS".equals(rType)) {
                        JSONObject st = rMsg.optJSONObject("status");
                        if (st != null) {
                            JSONArray apps = st.optJSONArray("applications");
                            if (apps != null && apps.length() > 0) {
                                JSONObject app0 = apps.optJSONObject(0);
                                if (app0 != null) {
                                    String tId = app0.optString("transportId", "").trim();
                                    String sId = app0.optString("sessionId", "").trim();
                                    if (!tId.isEmpty()) transportId = tId;
                                    if (!sId.isEmpty()) sessionId = sId;
                                }
                            }
                        }
                        break;
                    }
                }

                if ("stop".equals(resolvedMediaCmd)) {
                    String stopPayload = !sessionId.isEmpty()
                        ? "{\\"type\\":\\"STOP\\",\\"sessionId\\":\\"" + sessionId + "\\",\\"requestId\\":12}"
                        : "{\\"type\\":\\"STOP\\",\\"requestId\\":12}";
                    os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.receiver", stopPayload));
                    os.flush();
                    try { readCastV2JsonMessage(is); } catch (Throwable ignored) {}
                    return true;
                }

                if (!transportId.isEmpty()) {
                    // Subscribe sender-0 to transportId and fetch live mediaSessionId on this same socket before sending command
                    os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.tp.connection", "{\\"type\\":\\"CONNECT\\"}"));
                    os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\\"type\\":\\"GET_STATUS\\",\\"requestId\\":2}"));
                    os.flush();

                    try {
                        sock.setSoTimeout(450);
                        for (int mStep = 0; mStep < 5; mStep++) {
                            String mStr = readCastV2JsonMessage(is);
                            if (mStr == null) break;
                            JSONObject mObj = new JSONObject(mStr);
                            String mType = mObj.optString("type", "");
                            if ("PING".equals(mType)) {
                                os.write(buildCastV2MessagePacket("receiver-0", "urn:x-cast:com.google.cast.tp.heartbeat", "{\\"type\\":\\"PONG\\"}"));
                                os.flush();
                                continue;
                            }
                            if ("MEDIA_STATUS".equals(mType)) {
                                JSONArray stArr = mObj.optJSONArray("status");
                                if (stArr != null && stArr.length() > 0) {
                                    JSONObject mSt = stArr.optJSONObject(0);
                                    if (mSt != null) {
                                        int liveId = mSt.optInt("mediaSessionId", 0);
                                        if (liveId > 0) mediaSessionId = liveId;
                                        if ("play_pause".equals(cmd) || "play".equals(cmd) || "pause".equals(cmd)) {
                                            String livePState = mSt.optString("playerState", "");
                                            if ("PAUSED".equalsIgnoreCase(livePState) || "IDLE".equalsIgnoreCase(livePState)) {
                                                resolvedMediaCmd = "play";
                                            } else if ("PLAYING".equalsIgnoreCase(livePState) || "BUFFERING".equalsIgnoreCase(livePState)) {
                                                resolvedMediaCmd = "pause";
                                            }
                                            boolean wantLivePlay = "play".equals(resolvedMediaCmd);
                                            manualCastStateOverridePlaying.put(targetIp, wantLivePlay);
                                            manualCastStateOverrideUntilMs.put(targetIp, System.currentTimeMillis() + 6000L);
                                            if (cachedTarget != null) {
                                                try {
                                                    cachedTarget.put("isPlaying", wantLivePlay);
                                                    cachedTarget.put("hasMediaSession", true);
                                                    cachedTarget.put("playerState", wantLivePlay ? "PLAYING" : "PAUSED");
                                                } catch (Throwable ignored) {}
                                            }
                                        }
                                    }
                                }
                                break;
                            }
                        }
                    } catch (Throwable ignored) {}

                    if ("play".equals(resolvedMediaCmd)) {
                        os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\\"type\\":\\"PLAY\\",\\"mediaSessionId\\":" + mediaSessionId + ",\\"requestId\\":13}"));
                    } else if ("pause".equals(resolvedMediaCmd)) {
                        os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\\"type\\":\\"PAUSE\\",\\"mediaSessionId\\":" + mediaSessionId + ",\\"requestId\\":14}"));
                    } else if ("seek".equals(cmd)) {
                        double sec = Math.max(0.0, value / 1000.0);
                        os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\\"type\\":\\"SEEK\\",\\"mediaSessionId\\":" + mediaSessionId + ",\\"currentTime\\":" + sec + ",\\"requestId\\":15}"));
                    } else if ("next".equals(resolvedMediaCmd)) {
                        os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\\"type\\":\\"QUEUE_NEXT\\",\\"mediaSessionId\\":" + mediaSessionId + ",\\"requestId\\":16}"));
                    } else if ("prev".equals(resolvedMediaCmd)) {
                        os.write(buildCastV2MessagePacket(transportId, "urn:x-cast:com.google.cast.media", "{\\"type\\":\\"QUEUE_PREV\\",\\"mediaSessionId\\":" + mediaSessionId + ",\\"requestId\\":17}"));
                    }
                    os.flush();

                    // Wait for the receiver to acknowledge/process the media command before closing socket
                    try {
                        sock.setSoTimeout(400);
                        for (int ackStep = 0; ackStep < 3; ackStep++) {
                            String ackStr = readCastV2JsonMessage(is);
                            if (ackStr == null) break;
                            if (ackStr.contains("MEDIA_STATUS") || ackStr.contains("INVALID_")) break;
                        }
                    } catch (Throwable ignored) {}
                    return true;
                }
            } catch (Throwable ignored) {
            } finally {
                if (sock != null) {
                    try { sock.close(); } catch (Throwable ignored) {}
                }
            }
        }
        return sendMediaControl(resolvedMediaCmd);
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
    public String getBatteryStatusJson() {
        if (appContext == null) return "{\\"level\\":100,\\"charging\\":false}";
        try {
            android.os.BatteryManager bm = (android.os.BatteryManager) appContext.getSystemService(Context.BATTERY_SERVICE);
            int level = -1;
            boolean charging = false;
            if (bm != null) {
                level = bm.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    charging = bm.isCharging();
                }
            }
            android.content.IntentFilter ifilter = new android.content.IntentFilter(android.content.Intent.ACTION_BATTERY_CHANGED);
            android.content.Intent batteryStatus = appContext.registerReceiver(null, ifilter);
            if (batteryStatus != null) {
                if (level < 0 || level > 100) {
                    int rawLevel = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
                    int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
                    if (rawLevel >= 0 && scale > 0) {
                        level = Math.round((rawLevel * 100f) / scale);
                    }
                }
                int status = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_STATUS, -1);
                int plugged = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_PLUGGED, 0);
                if (status == android.os.BatteryManager.BATTERY_STATUS_CHARGING ||
                    status == android.os.BatteryManager.BATTERY_STATUS_FULL ||
                    plugged > 0) {
                    charging = true;
                }
            }
            if (level < 0 || level > 100) level = 100;
            JSONObject o = new JSONObject();
            o.put("level", level);
            o.put("charging", charging);
            return o.toString();
        } catch (Throwable ignored) {
            return "{\\"level\\":100,\\"charging\\":false}";
        }
    }

    @JavascriptInterface
    public void syncConfig(String email, String deviceId, String deviceLabel, String seenIdsJson) {
        syncConfigWithWorkspaces(email, deviceId, deviceLabel, seenIdsJson, "[\\"default\\"]");
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
`;

const mainActivityJava = `package se.carlberg.hem;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import com.getcapacitor.BridgeActivity;
import java.io.ByteArrayOutputStream;

public class MainActivity extends BridgeActivity {
    private static final int REQ_CAPTURE_IMAGE = 9201;
    private static final int REQ_CAMERA_PERMISSION = 9202;
    private static final int REQ_NOTIF_PERMISSION = 9203;
    private boolean pendingCameraLaunch = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            boolean isWatch = getPackageManager().hasSystemFeature(PackageManager.FEATURE_WATCH)
                || (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_TYPE_MASK) == android.content.res.Configuration.UI_MODE_TYPE_WATCH;
            if (isWatch) {
                Intent wearIntent = new Intent(this, HemWearActivity.class);
                if (getIntent() != null && getIntent().getExtras() != null) {
                    wearIntent.putExtras(getIntent().getExtras());
                }
                startActivity(wearIntent);
                finish();
                return;
            }
            HemSyncService.setAppInForeground(true);
            try {
                getWindow().getDecorView().setBackgroundColor(android.graphics.Color.parseColor("#111613"));
            } catch (Throwable ignored) {}
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                final android.webkit.WebView wv = this.getBridge().getWebView();
                try {
                    wv.setBackgroundColor(android.graphics.Color.parseColor("#111613"));
                    android.webkit.WebSettings ws = wv.getSettings();
                    if (ws != null) {
                        ws.setUseWideViewPort(true);
                        ws.setLoadWithOverviewMode(true);
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            ws.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                        }
                    }
                } catch (Throwable ignored) {}
                wv.addJavascriptInterface(new HemNativeBridge(this), "HemNativeBridge");
                wv.addJavascriptInterface(new HemWidgetBridge(this), "HemWidgetBridge");
                syncWebViewLayoutAndViewport(wv);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
                    getWindow().getDecorView().setOnApplyWindowInsetsListener((v, insets) -> {
                        try {
                            int topPx = insets.getSystemWindowInsetTop();
                            float density = getResources().getDisplayMetrics().density;
                            int topCssPx = Math.max(24, Math.round(topPx / Math.max(1f, density)));
                            wv.post(() -> {
                                try {
                                    wv.evaluateJavascript(
                                        "document.documentElement.style.setProperty('--android-status-bar-height', '" + topCssPx + "px');",
                                        null
                                    );
                                } catch (Throwable ignored) {}
                            });
                        } catch (Throwable ignored) {}
                        return v.onApplyWindowInsets(insets);
                    });
                }
            }
            handleWidgetDeepLinkIntent(getIntent());
            HemSyncService.ensureChannel(this);
            HemSyncService.scheduleNextAlarm(this);
            HemSyncService.startServiceSafe(this);

            if (Build.VERSION.SDK_INT >= 33) {
                if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, REQ_NOTIF_PERMISSION);
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                SharedPreferences prefs = getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName()) && !prefs.getBoolean("asked_battery_opt", false)) {
                    prefs.edit().putBoolean("asked_battery_opt", true).apply();
                    try {
                        Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                        intent.setData(Uri.parse("package:" + getPackageName()));
                        startActivity(intent);
                    } catch (Throwable ignored) {}
                }
            }
        } catch (Throwable ignored) {
        }
    }

    private void syncWebViewLayoutAndViewport(final android.webkit.WebView wv) {
        if (wv == null) return;
        try {
            android.view.View current = wv;
            while (current != null) {
                android.view.ViewGroup.LayoutParams lp = current.getLayoutParams();
                if (lp != null && (lp.width != android.view.ViewGroup.LayoutParams.MATCH_PARENT || lp.height != android.view.ViewGroup.LayoutParams.MATCH_PARENT)) {
                    lp.width = android.view.ViewGroup.LayoutParams.MATCH_PARENT;
                    lp.height = android.view.ViewGroup.LayoutParams.MATCH_PARENT;
                    current.setLayoutParams(lp);
                }
                current.requestLayout();
                if (current.getId() == android.R.id.content) break;
                android.view.ViewParent parent = current.getParent();
                current = (parent instanceof android.view.View) ? (android.view.View) parent : null;
            }
            final String jsRefreshViewport =
                "(function(){" +
                "var m=document.querySelector('meta[name=viewport]');" +
                "if(m){m.setAttribute('content','width=device-width, initial-scale=1.0, viewport-fit=cover');}" +
                "window.dispatchEvent(new Event('resize'));" +
                "window.dispatchEvent(new Event('orientationchange'));" +
                "})();";
            wv.post(() -> {
                try {
                    wv.requestLayout();
                    wv.evaluateJavascript(jsRefreshViewport, null);
                } catch (Throwable ignored) {}
            });
            wv.postDelayed(() -> {
                try {
                    wv.requestLayout();
                    wv.evaluateJavascript(jsRefreshViewport, null);
                } catch (Throwable ignored) {}
            }, 90);
            wv.postDelayed(() -> {
                try {
                    wv.requestLayout();
                    wv.evaluateJavascript(jsRefreshViewport, null);
                } catch (Throwable ignored) {}
            }, 250);
        } catch (Throwable ignored) {}
    }

    @Override
    public void onConfigurationChanged(android.content.res.Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        try {
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                syncWebViewLayoutAndViewport(this.getBridge().getWebView());
            }
        } catch (Throwable ignored) {}
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWidgetDeepLinkIntent(intent);
    }

    private void handleWidgetDeepLinkIntent(Intent intent) {
        if (intent == null) return;
        final String openTab = intent.getStringExtra("open_tab");
        if (openTab != null && !openTab.isEmpty()) {
            intent.removeExtra("open_tab");
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                this.getBridge().getWebView().postDelayed(() -> {
                    try {
                        this.getBridge().getWebView().evaluateJavascript(
                            "window.location.hash='#" + openTab + "'; if(window.__hemOpenTab) window.__hemOpenTab('" + openTab + "');",
                            null
                        );
                    } catch (Throwable ignored) {}
                }, 250);
            }
        }
    }

    public boolean ensureCameraPermission(boolean launchCameraAfter) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    pendingCameraLaunch = launchCameraAfter;
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAMERA_PERMISSION);
                    return false;
                }
            }
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    public boolean launchNativeCameraCapture() {
        try {
            if (!ensureCameraPermission(true)) {
                return true;
            }
            runOnUiThread(() -> {
                try {
                    Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    startActivityForResult(takePictureIntent, REQ_CAPTURE_IMAGE);
                } catch (Throwable ignored) {
                }
            });
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_CAMERA_PERMISSION) {
            boolean granted = grantResults != null && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (granted) {
                if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                    this.getBridge().getWebView().post(() -> {
                        try {
                            this.getBridge().getWebView().evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('hem-camera-permission-granted'));",
                                null
                            );
                        } catch (Throwable ignored) {}
                    });
                }
                if (pendingCameraLaunch) {
                    pendingCameraLaunch = false;
                    launchNativeCameraCapture();
                }
            } else {
                pendingCameraLaunch = false;
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_CAPTURE_IMAGE && resultCode == Activity.RESULT_OK && data != null) {
            try {
                Bundle extras = data.getExtras();
                if (extras != null && extras.get("data") instanceof Bitmap) {
                    Bitmap imageBitmap = (Bitmap) extras.get("data");
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    imageBitmap.compress(Bitmap.CompressFormat.JPEG, 90, baos);
                    String base64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);
                    final String dataUrl = "data:image/jpeg;base64," + base64;
                    if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                        this.getBridge().getWebView().post(() -> {
                            try {
                                this.getBridge().getWebView().evaluateJavascript(
                                    "if (window.__onHemNativeCameraCapture) window.__onHemNativeCameraCapture('" + dataUrl + "');",
                                    null
                                );
                            } catch (Throwable ignored) {}
                        });
                    }
                }
            } catch (Throwable ignored) {
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        HemSyncService.setAppInForeground(true);
        HemSyncService.scheduleNextAlarm(this);
        HemSyncService.startServiceSafe(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        HemSyncService.setAppInForeground(false);
        try {
            // Keep WebView JS timers unthrottled while in background and trigger native alarm + service
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                this.getBridge().getWebView().onResume();
                this.getBridge().getWebView().resumeTimers();
            }
            HemSyncService.scheduleNextAlarm(this);
            HemSyncService.startServiceSafe(this);
        } catch (Throwable ignored) {
        }
    }
}
`;

const hemWidgetBridgeJava = `package se.carlberg.hem;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class HemWidgetBridge {
    public static final String PREFS_WIDGETS = "HemWidgetsM3";
    public static final String ACTION_WIDGET_TOGGLE_ITEM = "se.carlberg.hem.ACTION_WIDGET_TOGGLE_ITEM";
    public static final String EXTRA_TARGET_TAB = "extra_target_tab";
    public static final String EXTRA_ITEM_TITLE = "extra_item_title";
    public static final String EXTRA_ITEM_RAW_LINE = "extra_item_raw_line";
    private final Context appContext;

    public HemWidgetBridge(Context context) {
        this.appContext = context.getApplicationContext();
    }

    @JavascriptInterface
    public void updateWidgets(String calendarText, String shoppingText, String todoText) {
        updateWidgetsExpressive(calendarText, shoppingText, todoText, "", "", "");
    }

    @JavascriptInterface
    public void updateWidgetsExpressive(
        String calendarText,
        String shoppingText,
        String todoText,
        String calendarBadge,
        String shoppingBadge,
        String todoBadge
    ) {
        updateWidgetsAllFive(calendarText, shoppingText, todoText, null, null, calendarBadge, shoppingBadge, todoBadge, null, null);
    }

    @JavascriptInterface
    public void updateWidgetsAllFive(
        String calendarText,
        String shoppingText,
        String todoText,
        String notesText,
        String budgetText,
        String calendarBadge,
        String shoppingBadge,
        String todoBadge,
        String notesBadge,
        String budgetBadge
    ) {
        try {
            SharedPreferences prefs = appContext.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            String calB = (calendarBadge != null && !calendarBadge.isEmpty()) ? calendarBadge : countLinesBadge(calendarText, "0 st");
            String shopB = (shoppingBadge != null && !shoppingBadge.isEmpty()) ? shoppingBadge : countLinesBadge(shoppingText, "0 kvar");
            String todoB = (todoBadge != null && !todoBadge.isEmpty()) ? todoBadge : countLinesBadge(todoText, "0 kvar");
            SharedPreferences.Editor ed = prefs.edit()
                .putString("cal_text", calendarText != null ? calendarText : "Inga inplanerade händelser framöver")
                .putString("shop_text", shoppingText != null ? shoppingText : "Inköpslistan är tom")
                .putString("todo_text", todoText != null ? todoText : "Alla uppgifter är avklarade!")
                .putString("cal_badge", calB)
                .putString("shop_badge", shopB)
                .putString("todo_badge", todoB);
            if (notesText != null) {
                ed.putString("notes_text", notesText);
                if (notesBadge != null && !notesBadge.isEmpty()) ed.putString("notes_badge", notesBadge);
            }
            if (budgetText != null) {
                ed.putString("budget_text", budgetText);
                if (budgetBadge != null && !budgetBadge.isEmpty()) ed.putString("budget_badge", budgetBadge);
            }
            ed.apply();
            refreshAllWidgets(appContext);
        } catch (Throwable ignored) {
        }
    }

    @JavascriptInterface
    public String consumePendingWidgetMutations() {
        try {
            SharedPreferences prefs = appContext.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            String json = prefs.getString("pending_mutations_json", "[]");
            if (!"[]".equals(json)) {
                prefs.edit().putString("pending_mutations_json", "[]").apply();
            }
            return json;
        } catch (Throwable ignored) {
            return "[]";
        }
    }

    public static void appendPendingMutation(Context ctx, String action, String targetTab, String title, String amount, String unit) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            JSONArray arr = new JSONArray(prefs.getString("pending_mutations_json", "[]"));
            JSONObject obj = new JSONObject();
            obj.put("action", action);
            obj.put("targetTab", targetTab);
            obj.put("title", title != null ? title : "");
            obj.put("amount", amount != null ? amount : "1");
            obj.put("unit", unit != null ? unit : "st");
            obj.put("ts", System.currentTimeMillis());
            arr.put(obj);
            prefs.edit().putString("pending_mutations_json", arr.toString()).apply();
        } catch (Throwable ignored) {
        }
    }

    public static void handleWidgetToggleItem(Context ctx, String targetTab, String rawLine, String itemTitle) {
        if (ctx == null || targetTab == null) return;
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            String prefTextKey = "shopping".equals(targetTab) ? "shop_text" : "todo_text";
            String prefBadgeKey = "shopping".equals(targetTab) ? "shop_badge" : "todo_badge";
            String emptyFallback = "shopping".equals(targetTab) ? "Inköpslistan är tom" : "Alla uppgifter är avklarade!";

            String currentText = prefs.getString(prefTextKey, "");
            String[] lines = currentText.split("\\\\r?\\\\n");
            List<String> kept = new ArrayList<>();
            boolean removedOne = false;

            for (String l : lines) {
                String trimmed = l.trim();
                if (trimmed.isEmpty()) continue;
                if (!removedOne && (trimmed.equals(rawLine) || (itemTitle != null && !itemTitle.isEmpty() && trimmed.contains(itemTitle)))) {
                    removedOne = true;
                    continue;
                }
                kept.add(trimmed);
            }

            String newText = kept.isEmpty() ? emptyFallback : joinLines(kept);
            String newBadge = kept.size() + " kvar";
            prefs.edit()
                .putString(prefTextKey, newText)
                .putString(prefBadgeKey, newBadge)
                .apply();

            String cleanTitle = itemTitle != null && !itemTitle.isEmpty() ? itemTitle : rawLine;
            appendPendingMutation(ctx, "toggle", targetTab, cleanTitle, "1", "st");
            refreshAllWidgets(ctx);
            HemSyncService.pushWidgetMutationToCloudAsync(ctx, targetTab, "toggle", cleanTitle, "1", "st");
        } catch (Throwable ignored) {
        }
    }

    public static void handleWidgetQuickAddShoppingItem(Context ctx, String itemName, String amountStr, String unitStr) {
        if (ctx == null || itemName == null || itemName.trim().isEmpty()) return;
        try {
            String cleanName = itemName.trim();
            String cleanAmount = (amountStr == null || amountStr.trim().isEmpty()) ? "1" : amountStr.trim();
            String cleanUnit = (unitStr == null || unitStr.trim().isEmpty()) ? "st" : unitStr.trim();
            String formattedLine = "• " + cleanName + " (" + cleanAmount + " " + cleanUnit + ")";

            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            String currentText = prefs.getString("shop_text", "Inköpslistan är tom");
            List<String> lines = new ArrayList<>();
            lines.add(formattedLine);
            if (!isEmptyStateMessage(currentText)) {
                for (String existing : currentText.split("\\\\r?\\\\n")) {
                    if (!existing.trim().isEmpty()) {
                        lines.add(existing.trim());
                    }
                }
            }

            prefs.edit()
                .putString("shop_text", joinLines(lines))
                .putString("shop_badge", lines.size() + " kvar")
                .apply();

            appendPendingMutation(ctx, "add_shopping", "shopping", cleanName, cleanAmount, cleanUnit);
            refreshAllWidgets(ctx);
            HemSyncService.pushWidgetMutationToCloudAsync(ctx, "shopping", "add_shopping", cleanName, cleanAmount, cleanUnit);
        } catch (Throwable ignored) {
        }
    }

    public static void handleWidgetQuickAddTodoItem(Context ctx, String todoTitle) {
        if (ctx == null || todoTitle == null || todoTitle.trim().isEmpty()) return;
        try {
            String cleanTitle = todoTitle.trim();
            String formattedLine = "• " + cleanTitle;

            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            String currentText = prefs.getString("todo_text", "Alla uppgifter är avklarade!");
            List<String> lines = new ArrayList<>();
            lines.add(formattedLine);
            if (!isEmptyStateMessage(currentText)) {
                for (String existing : currentText.split("\\\\r?\\\\n")) {
                    if (!existing.trim().isEmpty()) {
                        lines.add(existing.trim());
                    }
                }
            }

            prefs.edit()
                .putString("todo_text", joinLines(lines))
                .putString("todo_badge", lines.size() + " kvar")
                .apply();

            appendPendingMutation(ctx, "add_todo", "todo", cleanTitle, "1", "st");
            refreshAllWidgets(ctx);
            HemSyncService.pushWidgetMutationToCloudAsync(ctx, "todo", "add_todo", cleanTitle, "1", "st");
        } catch (Throwable ignored) {
        }
    }

    public static void handleWidgetQuickAddCalendarEvent(Context ctx, String eventTitle, String startTime) {
        if (ctx == null || eventTitle == null || eventTitle.trim().isEmpty()) return;
        try {
            String cleanTitle = eventTitle.trim();
            String cleanTime = (startTime == null || startTime.trim().isEmpty()) ? "12:00" : startTime.trim();
            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            String formattedLine = "• " + today + "|" + cleanTime + " — " + cleanTitle + "||#059669";

            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            String currentText = prefs.getString("cal_text", "Inga inplanerade händelser närmaste 2 veckorna");
            List<String> lines = new ArrayList<>();
            lines.add(formattedLine);
            if (!isEmptyStateMessage(currentText)) {
                for (String existing : currentText.split("\\\\r?\\\\n")) {
                    if (!existing.trim().isEmpty()) lines.add(existing.trim());
                }
            }

            prefs.edit()
                .putString("cal_text", joinLines(lines))
                .putString("cal_badge", lines.size() + " st")
                .apply();

            appendPendingMutation(ctx, "add_calendar", "calendar", cleanTitle, cleanTime, "st");
            refreshAllWidgets(ctx);
            HemSyncService.pushWidgetMutationToCloudAsync(ctx, "calendar", "add_calendar", cleanTitle, cleanTime, "st");
        } catch (Throwable ignored) {
        }
    }

    public static void handleWidgetQuickAddNoteItem(Context ctx, String noteTitle, String noteBody) {
        if (ctx == null || noteTitle == null || noteTitle.trim().isEmpty()) return;
        try {
            String cleanTitle = noteTitle.trim();
            String cleanBody = (noteBody == null || noteBody.trim().isEmpty()) ? cleanTitle : noteBody.trim();
            String formattedLine = "• " + cleanTitle + "||" + cleanBody;

            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            String currentText = prefs.getString("notes_text", "Inga anteckningar sparade");
            List<String> lines = new ArrayList<>();
            lines.add(formattedLine);
            if (!isEmptyStateMessage(currentText)) {
                for (String existing : currentText.split("\\\\r?\\\\n")) {
                    if (!existing.trim().isEmpty()) lines.add(existing.trim());
                }
            }

            prefs.edit()
                .putString("notes_text", joinLines(lines))
                .putString("notes_badge", lines.size() + " st")
                .apply();

            appendPendingMutation(ctx, "add_note", "notes", cleanTitle, cleanBody, "st");
            refreshAllWidgets(ctx);
            HemSyncService.pushWidgetMutationToCloudAsync(ctx, "notes", "add_note", cleanTitle, cleanBody, "st");
        } catch (Throwable ignored) {
        }
    }

    public static int getSafeBudgetInt(SharedPreferences prefs, String key, int defaultVal) {
        if (prefs == null) return defaultVal;
        try {
            return prefs.getInt(key, defaultVal);
        } catch (ClassCastException e) {
            try {
                String s = prefs.getString(key, "");
                if (s != null) {
                    boolean neg = s.trim().startsWith("-");
                    String digits = s.replaceAll("[^0-9]", "");
                    if (!digits.isEmpty()) {
                        int parsed = Integer.parseInt(digits);
                        return neg ? -parsed : parsed;
                    }
                }
            } catch (Throwable ignored) {
            }
            return defaultVal;
        } catch (Throwable ignored) {
            return defaultVal;
        }
    }

    public static String getBudgetRemainingDisplay(SharedPreferences prefs) {
        if (prefs == null) return "0 kr";
        try {
            int val = prefs.getInt("budget_remaining_val", Integer.MIN_VALUE);
            if (val != Integer.MIN_VALUE) {
                return formatSwedishKr(val);
            }
        } catch (ClassCastException e) {
            try {
                String s = prefs.getString("budget_remaining_val", null);
                if (s != null && !s.trim().isEmpty()) return s.trim();
            } catch (Throwable ignored) {
            }
        } catch (Throwable ignored) {
        }
        String badge = prefs.getString("budget_badge", "");
        if (badge != null && !badge.trim().isEmpty()) return badge.trim();
        return "8 450 kr";
    }

    public static String getBudgetSpentDisplay(SharedPreferences prefs) {
        if (prefs == null) return "0 kr";
        try {
            int val = prefs.getInt("budget_spent_val", Integer.MIN_VALUE);
            if (val != Integer.MIN_VALUE) {
                return formatSwedishKr(val);
            }
        } catch (ClassCastException e) {
            try {
                String s = prefs.getString("budget_spent_val", null);
                if (s != null && !s.trim().isEmpty()) return s.trim();
            } catch (Throwable ignored) {
            }
        } catch (Throwable ignored) {
        }
        return "0 kr";
    }

    public static void handleWidgetQuickAddBudgetExpense(Context ctx, String expenseTitle, String amountKr) {
        if (ctx == null || expenseTitle == null || expenseTitle.trim().isEmpty()) return;
        try {
            String cleanTitle = expenseTitle.trim();
            String cleanAmt = (amountKr == null || amountKr.trim().isEmpty()) ? "100" : amountKr.replaceAll("[^0-9]", "");
            if (cleanAmt.isEmpty()) cleanAmt = "100";
            int amtVal = Integer.parseInt(cleanAmt);

            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            int prevRemaining = getSafeBudgetInt(prefs, "budget_remaining_val", 8450);
            int prevSpent = getSafeBudgetInt(prefs, "budget_spent_val", 14200);
            int nextRemaining = prevRemaining - amtVal;
            int nextSpent = prevSpent + amtVal;

            String currentText = prefs.getString("budget_text", "");
            List<String> lines = new ArrayList<>();
            lines.add("• " + cleanTitle + "||-" + formatSwedishKr(amtVal));
            if (!isEmptyStateMessage(currentText)) {
                for (String existing : currentText.split("\\\\r?\\\\n")) {
                    if (!existing.trim().isEmpty()) lines.add(existing.trim());
                }
            }

            prefs.edit()
                .putInt("budget_remaining_val", nextRemaining)
                .putInt("budget_spent_val", nextSpent)
                .putString("budget_badge", formatSwedishKr(nextRemaining))
                .putString("budget_text", joinLines(lines))
                .apply();

            appendPendingMutation(ctx, "add_budget", "budget", cleanTitle, cleanAmt, "Övrigt");
            refreshAllWidgets(ctx);
            HemSyncService.pushWidgetMutationToCloudAsync(ctx, "budget", "add_budget", cleanTitle, cleanAmt, "Övrigt");
        } catch (Throwable ignored) {
        }
    }

    public static String formatSwedishKr(int amount) {
        boolean neg = amount < 0;
        String digits = String.valueOf(Math.abs(amount));
        StringBuilder sb = new StringBuilder();
        int len = digits.length();
        for (int i = 0; i < len; i++) {
            if (i > 0 && (len - i) % 3 == 0) sb.append(" ");
            sb.append(digits.charAt(i));
        }
        return (neg ? "-" : "") + sb.toString() + " kr";
    }

    private static String stripHtmlClean(String html) {
        if (html == null) return "";
        return html
            .replaceAll("(?i)<br\\\\s*/?>", " · ")
            .replaceAll("(?i)</p>|</li>|</div>", " · ")
            .replaceAll("<[^>]+>", "")
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replaceAll("\\\\s+", " ")
            .trim();
    }

    private static String joinLines(List<String> list) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append("\\n");
            sb.append(list.get(i));
        }
        return sb.toString();
    }

    private static String countLinesBadge(String text, String fallback) {
        if (text == null || text.trim().isEmpty()) return fallback;
        String t = text.trim().toLowerCase();
        if (t.contains("inga ") || t.contains("är tom") || t.contains("avklarade")) return fallback;
        String[] lines = text.trim().split("\\\\r?\\\\n");
        return String.valueOf(lines.length);
    }

    public static void updateFromRemoteSlice(Context ctx, JSONObject slice) {
        if (ctx == null || slice == null) return;
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            SharedPreferences.Editor ed = prefs.edit();
            boolean changed = false;

            JSONArray shopping = slice.optJSONArray("shopping");
            if (shopping != null) {
                StringBuilder sb = new StringBuilder();
                int uncheckedCount = 0;
                for (int i = 0; i < shopping.length(); i++) {
                    JSONObject item = shopping.optJSONObject(i);
                    if (item != null && !item.optBoolean("checked", false)) {
                        uncheckedCount++;
                        if (sb.length() > 0) sb.append("\\n");
                        String name = item.optString("name", "");
                        String amount = item.optString("amount", "1");
                        String unit = item.optString("unit", "st");
                        sb.append("• ").append(name).append(" (").append(amount).append(" ").append(unit).append(")");
                    }
                }
                ed.putString("shop_text", uncheckedCount > 0 ? sb.toString() : "Inköpslistan är tom");
                ed.putString("shop_badge", uncheckedCount + " kvar");
                changed = true;
            }

            JSONArray todos = slice.optJSONArray("todos");
            if (todos != null) {
                StringBuilder sb = new StringBuilder();
                int openCount = 0;
                for (int i = 0; i < todos.length(); i++) {
                    JSONObject item = todos.optJSONObject(i);
                    if (item != null && !item.optBoolean("completed", false)) {
                        openCount++;
                        if (sb.length() > 0) sb.append("\\n");
                        String due = item.optString("dueDate", "");
                        String title = item.optString("title", "");
                        if (!due.isEmpty() && due.length() >= 10) {
                            sb.append("• ").append(title).append(" (").append(due.substring(5)).append(")");
                        } else {
                            sb.append("• ").append(title);
                        }
                    }
                }
                ed.putString("todo_text", openCount > 0 ? sb.toString() : "Alla uppgifter är avklarade!");
                ed.putString("todo_badge", openCount + " kvar");
                changed = true;
            }

            JSONArray events = slice.optJSONArray("events");
            if (events != null) {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                long nowMs = System.currentTimeMillis();
                String today = sdf.format(new Date(nowMs));
                String maxDate14 = sdf.format(new Date(nowMs + 14L * 86400000L));

                JSONArray categoriesArr = slice.optJSONArray("categories");
                List<JSONObject> upcomingList = new ArrayList<>();
                for (int i = 0; i < events.length(); i++) {
                    JSONObject evt = events.optJSONObject(i);
                    if (evt != null) {
                        String d = evt.optString("date", "");
                        if (d.compareTo(today) >= 0 && d.compareTo(maxDate14) <= 0) {
                            upcomingList.add(evt);
                        }
                    }
                }

                java.util.Collections.sort(upcomingList, (a, b) -> {
                    String ka = a.optString("date", "") + "T" + a.optString("startTime", "00:00");
                    String kb = b.optString("date", "") + "T" + b.optString("startTime", "00:00");
                    return ka.compareTo(kb);
                });

                StringBuilder sb = new StringBuilder();
                int upcomingCount = upcomingList.size();
                for (int i = 0; i < upcomingCount; i++) {
                    JSONObject evt = upcomingList.get(i);
                    if (sb.length() > 0) sb.append("\\n");
                    String d = evt.optString("date", today);
                    boolean isAllDay = evt.optBoolean("isAllDay", false);
                    String startT = evt.optString("startTime", "");
                    String endT = evt.optString("endTime", "");
                    String timeRange;
                    if (isAllDay || startT.isEmpty()) {
                        timeRange = "Heldag";
                    } else if (!endT.isEmpty() && !endT.equals(startT)) {
                        timeRange = startT + "–" + endT;
                    } else {
                        timeRange = startT;
                    }
                    String title = evt.optString("title", "");
                    String colorHex = resolveCategoryColorHex(evt, categoriesArr);
                    sb.append("• ").append(d).append("|").append(timeRange).append(" — ").append(title).append("||").append(colorHex);
                }
                ed.putString("cal_text", upcomingCount > 0 ? sb.toString() : "Inga inplanerade händelser närmaste 2 veckorna");
                ed.putString("cal_badge", upcomingCount + " st");
                changed = true;
            }

            JSONArray notes = slice.optJSONArray("notes");
            if (notes != null) {
                List<JSONObject> noteList = new ArrayList<>();
                for (int i = 0; i < notes.length(); i++) {
                    JSONObject n = notes.optJSONObject(i);
                    if (n != null) noteList.add(n);
                }
                java.util.Collections.sort(noteList, (a, b) -> {
                    boolean fa = a.optBoolean("favorite", false);
                    boolean fb = b.optBoolean("favorite", false);
                    if (fa != fb) return fa ? -1 : 1;
                    return b.optString("updatedAt", "").compareTo(a.optString("updatedAt", ""));
                });
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < noteList.size(); i++) {
                    JSONObject n = noteList.get(i);
                    if (sb.length() > 0) sb.append("\\n");
                    String title = n.optString("title", "Anteckning").trim();
                    String htmlContent = n.optString("contentHtml", "");
                    if (htmlContent.isEmpty()) htmlContent = n.optString("content", "");
                    String body = stripHtmlClean(htmlContent);
                    JSONArray cl = n.optJSONArray("checklistItems");
                    if (cl != null && cl.length() > 0) {
                        StringBuilder csb = new StringBuilder();
                        for (int j = 0; j < Math.min(cl.length(), 12); j++) {
                            JSONObject ci = cl.optJSONObject(j);
                            if (ci != null) {
                                String itemTxt = ci.optString("text", "").trim();
                                if (!itemTxt.isEmpty()) {
                                    if (csb.length() > 0) csb.append(" · ");
                                    boolean done = ci.optBoolean("checked", false) || ci.optBoolean("completed", false);
                                    csb.append(done ? "☑ " : "☐ ").append(itemTxt);
                                }
                            }
                        }
                        if (csb.length() > 0) {
                            body = body.isEmpty() ? csb.toString() : (body + " · " + csb.toString());
                        }
                    }
                    if (body.length() > 600) body = body.substring(0, 600) + "…";
                    sb.append("• ").append(title).append("||").append(body.isEmpty() ? "Ingen brödtext i anteckningen" : body);
                }
                ed.putString("notes_text", noteList.size() > 0 ? sb.toString() : "Inga anteckningar sparade");
                ed.putString("notes_badge", noteList.size() + " st");
                changed = true;
            }

            JSONArray budgetMonths = slice.optJSONArray("budgetMonths");
            if (budgetMonths != null && budgetMonths.length() > 0) {
                String currentMonthKey = new SimpleDateFormat("yyyy-MM", Locale.US).format(new Date());
                JSONObject chosenMonth = null;
                for (int i = 0; i < budgetMonths.length(); i++) {
                    JSONObject bm = budgetMonths.optJSONObject(i);
                    if (bm != null && currentMonthKey.equals(bm.optString("monthKey", ""))) {
                        chosenMonth = bm;
                        break;
                    }
                }
                if (chosenMonth == null) {
                    chosenMonth = budgetMonths.optJSONObject(budgetMonths.length() - 1);
                }
                if (chosenMonth != null) {
                    JSONArray entries = chosenMonth.optJSONArray("entries");
                    int totalIncome = 0;
                    int totalExpense = 0;
                    List<String> expenseLines = new ArrayList<>();
                    if (entries != null) {
                        for (int i = entries.length() - 1; i >= 0; i--) {
                            JSONObject en = entries.optJSONObject(i);
                            if (en == null) continue;
                            int amt = (int) Math.round(en.optDouble("amount", 0.0));
                            String type = en.optString("type", "expense");
                            if ("income".equalsIgnoreCase(type)) {
                                totalIncome += amt;
                            } else {
                                totalExpense += amt;
                                String t = en.optString("title", "Utgift");
                                expenseLines.add("• " + t + "||-" + formatSwedishKr(amt));
                            }
                        }
                    }
                    int remaining = totalIncome - totalExpense;
                    ed.putInt("budget_remaining_val", remaining);
                    ed.putInt("budget_spent_val", totalExpense);
                    ed.putString("budget_badge", formatSwedishKr(remaining));
                    ed.putString("budget_text", expenseLines.isEmpty() ? "Inga utgifter registrerade" : joinLines(expenseLines));
                    changed = true;
                }
            }

            if (changed) {
                ed.apply();
                refreshAllWidgets(ctx);
            }
        } catch (Throwable ignored) {
        }
    }

    public static String resolveCategoryColorHex(JSONObject evt, JSONArray categoriesArr) {
        if (evt == null) return "#0066FF";
        String custom = evt.optString("customColorHex", "").trim();
        if (custom.startsWith("#") && (custom.length() == 7 || custom.length() == 9)) {
            return custom;
        }
        String catId = evt.optString("categoryId", "").trim();
        if (categoriesArr != null && !catId.isEmpty()) {
            for (int i = 0; i < categoriesArr.length(); i++) {
                JSONObject c = categoriesArr.optJSONObject(i);
                if (c != null && catId.equals(c.optString("id", ""))) {
                    String hex = c.optString("colorHex", "").trim();
                    if (hex.startsWith("#")) return hex;
                }
            }
        }
        if ("arbete".equalsIgnoreCase(catId)) return "#0066FF";
        if ("familj".equalsIgnoreCase(catId)) return "#059669";
        if ("halsa".equalsIgnoreCase(catId)) return "#EA580C";
        if ("fritid".equalsIgnoreCase(catId)) return "#7C3AED";
        if ("viktigt".equalsIgnoreCase(catId)) return "#E11D48";
        return "#0066FF";
    }

    public static void refreshAllWidgets(Context ctx) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            int listViewId = ctx.getResources().getIdentifier("hem_widget_listview", "id", ctx.getPackageName());

            int[] calIds = mgr.getAppWidgetIds(new ComponentName(ctx, HemCalendarWidget.class));
            if (calIds != null && calIds.length > 0 && listViewId != 0) {
                mgr.notifyAppWidgetViewDataChanged(calIds, listViewId);
            }
            HemCalendarWidget.updateAll(ctx, mgr);

            int[] shopIds = mgr.getAppWidgetIds(new ComponentName(ctx, HemShoppingWidget.class));
            if (shopIds != null && shopIds.length > 0 && listViewId != 0) {
                mgr.notifyAppWidgetViewDataChanged(shopIds, listViewId);
            }
            HemShoppingWidget.updateAll(ctx, mgr);

            int[] todoIds = mgr.getAppWidgetIds(new ComponentName(ctx, HemTodoWidget.class));
            if (todoIds != null && todoIds.length > 0 && listViewId != 0) {
                mgr.notifyAppWidgetViewDataChanged(todoIds, listViewId);
            }
            HemTodoWidget.updateAll(ctx, mgr);
            HemTileHelper.requestUpdateAllTiles(ctx);
        } catch (Throwable ignored) {
        }
    }

    public static boolean isEmptyStateMessage(String bodyText) {
        if (bodyText == null || bodyText.trim().isEmpty()) return true;
        String lower = bodyText.trim().toLowerCase();
        return lower.startsWith("inga ") ||
               lower.contains("inköpslistan är tom") ||
               lower.contains("alla uppgifter är avklarade") ||
               lower.startsWith("tryck för att öppna");
    }

    public static String getCurrentSwedishMonthName() {
        String[] months = new String[]{
            "Januari", "Februari", "Mars", "April", "Maj", "Juni",
            "Juli", "Augusti", "September", "Oktober", "November", "December"
        };
        java.util.Calendar cal = java.util.Calendar.getInstance();
        int m = cal.get(java.util.Calendar.MONTH);
        if (m >= 0 && m < months.length) return months[m];
        return "Kalender";
    }

    public static RemoteViews buildExpressiveViews(
        Context ctx,
        String title,
        String subtitle,
        String badgeText,
        String bodyText,
        String targetTab,
        int reqCode,
        Class<?> providerClass
    ) {
        String pkg = ctx.getPackageName();
        int layoutId = ctx.getResources().getIdentifier("hem_widget_m3", "layout", pkg);
        RemoteViews views = new RemoteViews(pkg, layoutId);

        int iconBadgeId = ctx.getResources().getIdentifier("hem_widget_icon_badge", "id", pkg);
        int titleId = ctx.getResources().getIdentifier("hem_widget_title", "id", pkg);
        int subId = ctx.getResources().getIdentifier("hem_widget_subtitle", "id", pkg);
        int badgeId = ctx.getResources().getIdentifier("hem_widget_badge", "id", pkg);
        int addBtnId = ctx.getResources().getIdentifier("hem_widget_add_btn", "id", pkg);
        int bodyId = ctx.getResources().getIdentifier("hem_widget_body", "id", pkg);
        int emptyCardId = ctx.getResources().getIdentifier("hem_widget_empty_card", "id", pkg);
        int emptyIconId = ctx.getResources().getIdentifier("hem_widget_empty_icon", "id", pkg);
        int listViewId = ctx.getResources().getIdentifier("hem_widget_listview", "id", pkg);
        int rootId = ctx.getResources().getIdentifier("hem_widget_root", "id", pkg);

        if ("calendar".equals(targetTab)) {
            if (iconBadgeId != 0) {
                views.setViewVisibility(iconBadgeId, View.GONE);
            }
            views.setTextViewText(titleId, getCurrentSwedishMonthName());
        } else {
            if (iconBadgeId != 0) {
                views.setViewVisibility(iconBadgeId, View.VISIBLE);
                views.setTextViewText(iconBadgeId, "✓");
            }
            views.setTextViewText(titleId, title);
        }
        if (subId != 0) {
            views.setViewVisibility(subId, View.GONE);
        }
        if (badgeId != 0) {
            views.setViewVisibility(badgeId, View.GONE);
        }

        if (isEmptyStateMessage(bodyText)) {
            if (listViewId != 0) views.setViewVisibility(listViewId, View.GONE);
            if (emptyCardId != 0) views.setViewVisibility(emptyCardId, View.VISIBLE);
            if (emptyIconId != 0) {
                views.setTextViewText(emptyIconId, "calendar".equals(targetTab) ? "📅" : "✓");
            }
            views.setTextViewText(bodyId, bodyText != null ? bodyText : "");
        } else {
            if (emptyCardId != 0) views.setViewVisibility(emptyCardId, View.GONE);
            if (listViewId != 0) {
                views.setViewVisibility(listViewId, View.VISIBLE);
                Intent svcIntent = new Intent(ctx, HemWidgetService.class);
                svcIntent.putExtra(EXTRA_TARGET_TAB, targetTab);
                svcIntent.setData(Uri.parse("hemwidget://list/" + targetTab + "/" + reqCode));
                views.setRemoteAdapter(listViewId, svcIntent);
                if (emptyCardId != 0) {
                    views.setEmptyView(listViewId, emptyCardId);
                }

                // Set PendingIntentTemplate for scrollable list items:
                // Shopping & Todo items check off directly on tap; Calendar items open Calendar tab
                if ("shopping".equals(targetTab) || "todo".equals(targetTab)) {
                    Intent toggleIntent = new Intent(ctx, providerClass);
                    toggleIntent.setAction(ACTION_WIDGET_TOGGLE_ITEM);
                    toggleIntent.putExtra(EXTRA_TARGET_TAB, targetTab);
                    int mutFlags = PendingIntent.FLAG_UPDATE_CURRENT;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        mutFlags |= PendingIntent.FLAG_MUTABLE;
                    }
                    PendingIntent toggleTemplatePi = PendingIntent.getBroadcast(ctx, reqCode + 500, toggleIntent, mutFlags);
                    views.setPendingIntentTemplate(listViewId, toggleTemplatePi);
                } else {
                    Intent openCalIntent = new Intent(ctx, MainActivity.class);
                    openCalIntent.putExtra("open_tab", targetTab);
                    openCalIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        flags |= PendingIntent.FLAG_IMMUTABLE;
                    }
                    PendingIntent calTemplatePi = PendingIntent.getActivity(ctx, reqCode + 500, openCalIntent, flags);
                    views.setPendingIntentTemplate(listViewId, calTemplatePi);
                }
            }
        }

        // Header/root click opens the corresponding tab in MainActivity
        Intent openIntent = new Intent(ctx, MainActivity.class);
        openIntent.putExtra("open_tab", targetTab);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getActivity(ctx, reqCode, openIntent, flags);
        views.setOnClickPendingIntent(rootId, pi);

        // "+" button on Shopping & Todo widgets opens HemQuickAddActivity popup directly over home screen
        if (addBtnId != 0) {
            if ("shopping".equals(targetTab) || "todo".equals(targetTab)) {
                Intent quickAddIntent = new Intent(ctx, HemQuickAddActivity.class);
                quickAddIntent.putExtra(EXTRA_TARGET_TAB, targetTab);
                quickAddIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent quickAddPi = PendingIntent.getActivity(ctx, reqCode + 900, quickAddIntent, flags);
                views.setOnClickPendingIntent(addBtnId, quickAddPi);
            } else {
                views.setOnClickPendingIntent(addBtnId, pi);
            }
        }

        return views;
    }
}
`;

const hemWidgetServiceJava = `package se.carlberg.hem;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class HemWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        String targetTab = intent != null ? intent.getStringExtra(HemWidgetBridge.EXTRA_TARGET_TAB) : "shopping";
        if (targetTab == null || targetTab.isEmpty()) targetTab = "shopping";
        return new HemWidgetListFactory(getApplicationContext(), targetTab);
    }

    private static class HemWidgetListFactory implements RemoteViewsFactory {
        private final Context ctx;
        private final String targetTab;
        private final List<String> lines = new ArrayList<>();

        HemWidgetListFactory(Context context, String tab) {
            this.ctx = context;
            this.targetTab = tab;
        }

        @Override
        public void onCreate() {
            loadData();
        }

        @Override
        public void onDataSetChanged() {
            loadData();
        }

        private void loadData() {
            lines.clear();
            try {
                SharedPreferences prefs = ctx.getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);
                String key = "cal_text";
                if ("shopping".equals(targetTab)) key = "shop_text";
                else if ("todo".equals(targetTab)) key = "todo_text";

                String raw = prefs.getString(key, "");
                if (!HemWidgetBridge.isEmptyStateMessage(raw)) {
                    String[] split = raw.trim().split("\\\\r?\\\\n");
                    for (String s : split) {
                        if (s != null && !s.trim().isEmpty()) {
                            lines.add(s.trim());
                        }
                    }
                }
            } catch (Throwable ignored) {
            }
        }

        private String normalizeIsoDate(String rawDateToken, String todayIso) {
            if (rawDateToken == null) return todayIso;
            String t = rawDateToken.trim();
            if (t.isEmpty() || "Idag".equalsIgnoreCase(t)) return todayIso;
            if (t.length() == 5 && t.charAt(2) == '-') {
                return todayIso.substring(0, 5) + t;
            }
            if (t.length() >= 10) {
                return t.substring(0, 10);
            }
            return todayIso;
        }

        private String extractDateKeyForPosition(int pos, String todayIso) {
            if (pos < 0 || pos >= lines.size()) return "";
            String ln = lines.get(pos);
            if (ln.startsWith("•")) ln = ln.substring(1).trim();
            int colorSep = ln.lastIndexOf("||");
            if (colorSep > 0) ln = ln.substring(0, colorSep).trim();
            int dashIdx = ln.indexOf(" — ");
            String dtPart = dashIdx > 0 ? ln.substring(0, dashIdx).trim() : ln;
            int pipeIdx = dtPart.indexOf('|');
            if (pipeIdx > 0) {
                return normalizeIsoDate(dtPart.substring(0, pipeIdx), todayIso);
            }
            int spIdx = dtPart.indexOf(' ');
            if (spIdx > 0) {
                return normalizeIsoDate(dtPart.substring(0, spIdx), todayIso);
            }
            return normalizeIsoDate(dtPart, todayIso);
        }

        private String[] computeSwedishDowAndDay(String isoDate) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                Date parsed = sdf.parse(isoDate);
                if (parsed != null) {
                    Calendar cal = Calendar.getInstance();
                    cal.setTime(parsed);
                    int dow = cal.get(Calendar.DAY_OF_WEEK);
                    String dowStr = "Mån";
                    if (dow == Calendar.MONDAY) dowStr = "Mån";
                    else if (dow == Calendar.TUESDAY) dowStr = "Tis";
                    else if (dow == Calendar.WEDNESDAY) dowStr = "Ons";
                    else if (dow == Calendar.THURSDAY) dowStr = "Tor";
                    else if (dow == Calendar.FRIDAY) dowStr = "Fre";
                    else if (dow == Calendar.SATURDAY) dowStr = "Lör";
                    else if (dow == Calendar.SUNDAY) dowStr = "Sön";
                    String dayNum = String.valueOf(cal.get(Calendar.DAY_OF_MONTH));
                    return new String[]{dowStr, dayNum};
                }
            } catch (Throwable ignored) {
            }
            String fallbackDay = isoDate != null && isoDate.length() >= 10 ? isoDate.substring(8, 10) : "1";
            if (fallbackDay.startsWith("0")) fallbackDay = fallbackDay.substring(1);
            return new String[]{"Dag", fallbackDay};
        }

        @Override
        public void onDestroy() {
            lines.clear();
        }

        @Override
        public int getCount() {
            return lines.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            if (position < 0 || position >= lines.size()) return null;
            String pkg = ctx.getPackageName();
            String rawLine = lines.get(position);
            String line = rawLine;
            if (line.startsWith("•")) {
                line = line.substring(1).trim();
            }

            String colorHex = "#0066FF";
            int colorSep = line.lastIndexOf("||");
            if (colorSep > 0) {
                String maybeHex = line.substring(colorSep + 2).trim();
                if (maybeHex.startsWith("#")) {
                    colorHex = maybeHex;
                }
                line = line.substring(0, colorSep).trim();
            }

            if ("calendar".equals(targetTab)) {
                int calLayoutId = ctx.getResources().getIdentifier("hem_widget_calendar_row", "layout", pkg);
                RemoteViews rv = new RemoteViews(pkg, calLayoutId);

                int rowRootId = ctx.getResources().getIdentifier("hem_cal_row_root", "id", pkg);
                int dayColId = ctx.getResources().getIdentifier("hem_cal_day_col", "id", pkg);
                int dayBadgeBgId = ctx.getResources().getIdentifier("hem_cal_day_badge_bg", "id", pkg);
                int dayDowId = ctx.getResources().getIdentifier("hem_cal_day_dow", "id", pkg);
                int dayNumId = ctx.getResources().getIdentifier("hem_cal_day_num", "id", pkg);
                int bgImgId = ctx.getResources().getIdentifier("hem_cal_row_bg_img", "id", pkg);
                int dateTimeId = ctx.getResources().getIdentifier("hem_cal_row_datetime", "id", pkg);
                int titleId = ctx.getResources().getIdentifier("hem_cal_row_title", "id", pkg);

                String todayIso = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
                String dtPart = todayIso;
                String eventTitleText = line;
                int dashIdx = line.indexOf(" — ");
                if (dashIdx > 0) {
                    dtPart = line.substring(0, dashIdx).trim();
                    eventTitleText = line.substring(dashIdx + 3).trim();
                }

                String dateRaw = dtPart;
                String timeText = "";
                int pipeIdx = dtPart.indexOf('|');
                if (pipeIdx > 0) {
                    dateRaw = dtPart.substring(0, pipeIdx).trim();
                    timeText = dtPart.substring(pipeIdx + 1).trim();
                } else {
                    int spIdx = dtPart.indexOf(' ');
                    if (spIdx > 0) {
                        dateRaw = dtPart.substring(0, spIdx).trim();
                        timeText = dtPart.substring(spIdx + 1).trim();
                    }
                }

                String isoDate = normalizeIsoDate(dateRaw, todayIso);
                String prevIsoDate = position > 0 ? extractDateKeyForPosition(position - 1, todayIso) : "";
                boolean sameAsPrevDay = position > 0 && isoDate.equals(prevIsoDate);
                boolean isHighlightedDay = isoDate.equals(todayIso) || position == 0;

                if (dayColId != 0) {
                    rv.setViewVisibility(dayColId, sameAsPrevDay ? View.INVISIBLE : View.VISIBLE);
                }

                String[] dowAndDay = computeSwedishDowAndDay(isoDate);
                if (dayBadgeBgId != 0) {
                    rv.setViewVisibility(dayBadgeBgId, isHighlightedDay ? View.VISIBLE : View.GONE);
                }
                if (dayDowId != 0) {
                    rv.setTextViewText(dayDowId, dowAndDay[0]);
                    rv.setTextColor(dayDowId, isHighlightedDay ? Color.WHITE : Color.parseColor("#2B303A"));
                }
                if (dayNumId != 0) {
                    rv.setTextViewText(dayNumId, dowAndDay[1]);
                    rv.setTextColor(dayNumId, isHighlightedDay ? Color.WHITE : Color.parseColor("#1C1F26"));
                }

                int parsedColor = Color.parseColor("#0066FF");
                try {
                    parsedColor = Color.parseColor(colorHex);
                } catch (Throwable ignored) {}

                if (bgImgId != 0) {
                    rv.setInt(bgImgId, "setColorFilter", parsedColor);
                }
                if (titleId != 0) {
                    rv.setTextViewText(titleId, eventTitleText);
                }
                if (dateTimeId != 0) {
                    if (timeText.isEmpty() || "Heldag".equalsIgnoreCase(timeText)) {
                        rv.setViewVisibility(dateTimeId, View.GONE);
                    } else {
                        rv.setViewVisibility(dateTimeId, View.VISIBLE);
                        rv.setTextViewText(dateTimeId, timeText);
                    }
                }
                if (rowRootId != 0) {
                    Intent fillIn = new Intent();
                    fillIn.putExtra(HemWidgetBridge.EXTRA_TARGET_TAB, targetTab);
                    fillIn.putExtra(HemWidgetBridge.EXTRA_ITEM_TITLE, eventTitleText);
                    fillIn.putExtra(HemWidgetBridge.EXTRA_ITEM_RAW_LINE, rawLine);
                    rv.setOnClickFillInIntent(rowRootId, fillIn);
                }
                return rv;
            }

            int rowLayoutId = ctx.getResources().getIdentifier("hem_widget_item_row", "layout", pkg);
            RemoteViews rv = new RemoteViews(pkg, rowLayoutId);

            int rowRootId = ctx.getResources().getIdentifier("hem_widget_item_row_root", "id", pkg);
            int pillId = ctx.getResources().getIdentifier("hem_widget_item_pill", "id", pkg);
            int titleId = ctx.getResources().getIdentifier("hem_widget_item_title", "id", pkg);
            int metaId = ctx.getResources().getIdentifier("hem_widget_item_meta", "id", pkg);

            String mainTitle = line;
            String metaText = "";

            int parenStart = line.lastIndexOf(" (");
            if (parenStart > 0 && line.endsWith(")")) {
                mainTitle = line.substring(0, parenStart).trim();
                metaText = line.substring(parenStart + 2, line.length() - 1).trim();
            }

            if (pillId != 0) rv.setTextViewText(pillId, "");
            if (titleId != 0) rv.setTextViewText(titleId, mainTitle);
            if (metaId != 0) {
                if (!metaText.isEmpty()) {
                    rv.setViewVisibility(metaId, View.VISIBLE);
                    rv.setTextViewText(metaId, metaText);
                } else {
                    rv.setViewVisibility(metaId, View.GONE);
                }
            }

            if (rowRootId != 0) {
                Intent fillIn = new Intent();
                fillIn.putExtra(HemWidgetBridge.EXTRA_TARGET_TAB, targetTab);
                fillIn.putExtra(HemWidgetBridge.EXTRA_ITEM_TITLE, mainTitle);
                fillIn.putExtra(HemWidgetBridge.EXTRA_ITEM_RAW_LINE, rawLine);
                rv.setOnClickFillInIntent(rowRootId, fillIn);
            }

            return rv;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 2;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }
    }
}
`;

const hemQuickAddActivityJava = `package se.carlberg.hem;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class HemQuickAddActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        Intent launchIntent = getIntent();
        final String targetTab = (launchIntent != null && "todo".equals(launchIntent.getStringExtra(HemWidgetBridge.EXTRA_TARGET_TAB)))
            ? "todo"
            : "shopping";
        final boolean isTodo = "todo".equals(targetTab);

        float density = getResources().getDisplayMetrics().density;
        int pad = (int) (18 * density);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad, pad, pad);

        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(Color.parseColor("#F0F3F8"));
        cardBg.setCornerRadius(24 * density);
        cardBg.setStroke((int) (1.5f * density), Color.parseColor("#D5DCE6"));
        root.setBackground(cardBg);

        TextView subtitle = new TextView(this);
        subtitle.setText(isTodo ? "HEM · ATT GÖRA WIDGET" : "HEM · INKÖPSLISTA WIDGET");
        subtitle.setTextSize(10f);
        subtitle.setTypeface(Typeface.DEFAULT_BOLD);
        subtitle.setTextColor(Color.parseColor("#5F6368"));
        root.addView(subtitle);

        TextView title = new TextView(this);
        title.setText(isTodo ? "Ny uppgift" : "Lägg till vara");
        title.setTextSize(18f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(Color.parseColor("#1C1F26"));
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        titleLp.topMargin = (int) (2 * density);
        titleLp.bottomMargin = (int) (12 * density);
        root.addView(title, titleLp);

        final EditText nameInput = new EditText(this);
        nameInput.setHint(isTodo ? "T.ex. Boka tandläkare, Dammsuga..." : "T.ex. Mjölk, Bröd, Kaffe...");
        nameInput.setSingleLine(true);
        nameInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        nameInput.setImeOptions(EditorInfo.IME_ACTION_DONE);
        nameInput.setTextSize(14f);
        nameInput.setTextColor(Color.parseColor("#1C1F26"));
        nameInput.setHintTextColor(Color.parseColor("#757A84"));
        int inputPadH = (int) (14 * density);
        int inputPadV = (int) (11 * density);
        nameInput.setPadding(inputPadH, inputPadV, inputPadH, inputPadV);
        GradientDrawable inputBg = new GradientDrawable();
        inputBg.setColor(Color.WHITE);
        inputBg.setCornerRadius(14 * density);
        inputBg.setStroke((int) (1.5f * density), Color.parseColor("#D5DCE6"));
        nameInput.setBackground(inputBg);
        root.addView(nameInput, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        final EditText amountInput = new EditText(this);
        amountInput.setHint("Antal (valfritt, t.ex. 2 st)");
        amountInput.setSingleLine(true);
        amountInput.setTextSize(13f);
        amountInput.setTextColor(Color.parseColor("#1C1F26"));
        amountInput.setHintTextColor(Color.parseColor("#757A84"));
        amountInput.setPadding(inputPadH, inputPadV, inputPadH, inputPadV);
        GradientDrawable amountBg = new GradientDrawable();
        amountBg.setColor(Color.WHITE);
        amountBg.setCornerRadius(14 * density);
        amountBg.setStroke((int) (1.5f * density), Color.parseColor("#D5DCE6"));
        amountInput.setBackground(amountBg);
        LinearLayout.LayoutParams amountLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        amountLp.topMargin = (int) (8 * density);
        if (isTodo) {
            amountInput.setVisibility(View.GONE);
        }
        root.addView(amountInput, amountLp);

        LinearLayout btnRow = new LinearLayout(this);
        btnRow.setOrientation(LinearLayout.HORIZONTAL);
        btnRow.setGravity(Gravity.END);
        LinearLayout.LayoutParams btnRowLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        btnRowLp.topMargin = (int) (14 * density);

        Button cancelBtn = new Button(this);
        cancelBtn.setText("Stäng");
        cancelBtn.setAllCaps(false);
        cancelBtn.setTextColor(Color.parseColor("#1C1F26"));
        GradientDrawable cancelBg = new GradientDrawable();
        cancelBg.setColor(Color.parseColor("#DFE4EC"));
        cancelBg.setCornerRadius(999 * density);
        cancelBtn.setBackground(cancelBg);
        cancelBtn.setOnClickListener(v -> finish());
        btnRow.addView(cancelBtn);

        Button addBtn = new Button(this);
        addBtn.setText("+ Lägg till");
        addBtn.setAllCaps(false);
        addBtn.setTypeface(Typeface.DEFAULT_BOLD);
        addBtn.setTextColor(Color.WHITE);
        GradientDrawable addBg = new GradientDrawable();
        addBg.setColor(Color.parseColor("#242942"));
        addBg.setCornerRadius(999 * density);
        addBtn.setBackground(addBg);
        LinearLayout.LayoutParams addBtnLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        addBtnLp.leftMargin = (int) (8 * density);
        addBtn.setOnClickListener(v -> {
            String rawName = nameInput.getText().toString().trim();
            if (rawName.isEmpty()) {
                Toast.makeText(this, isTodo ? "Skriv in en uppgift först" : "Skriv in en vara först", Toast.LENGTH_SHORT).show();
                return;
            }
            if (isTodo) {
                HemWidgetBridge.handleWidgetQuickAddTodoItem(getApplicationContext(), rawName);
                Toast.makeText(this, "Lade till uppgiften " + rawName, Toast.LENGTH_SHORT).show();
            } else {
                String rawAmt = amountInput.getText().toString().trim();
                String amt = "1";
                String unit = "st";
                if (!rawAmt.isEmpty()) {
                    String[] parts = rawAmt.split("\\\\s+", 2);
                    amt = parts[0];
                    if (parts.length > 1 && !parts[1].isEmpty()) {
                        unit = parts.length > 1 ? parts[1] : "st";
                    }
                }
                HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), rawName, amt, unit);
                Toast.makeText(this, "Lade till " + rawName + " i inköpslistan", Toast.LENGTH_SHORT).show();
            }
            finish();
        });
        btnRow.addView(addBtn, addBtnLp);

        root.addView(btnRow, btnRowLp);
        setContentView(root);
        nameInput.requestFocus();
    }
}
`;

const hemCalendarWidgetJava = `package se.carlberg.hem;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class HemCalendarWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateAll(context, appWidgetManager);
    }

    public static void updateAll(Context context, AppWidgetManager mgr) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);
            String body = prefs.getString("cal_text", "Inga inplanerade händelser närmaste 2 veckorna");
            String badge = prefs.getString("cal_badge", "0 st");
            RemoteViews views = HemWidgetBridge.buildExpressiveViews(
                context,
                "Kalender",
                "HEM · 14 DAGAR FRAMÅT",
                badge,
                body,
                "calendar",
                8101,
                HemCalendarWidget.class
            );
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, HemCalendarWidget.class));
            if (ids != null && ids.length > 0) {
                mgr.updateAppWidget(ids, views);
            }
        } catch (Throwable ignored) {
        }
    }
}
`;

const hemShoppingWidgetJava = `package se.carlberg.hem;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class HemShoppingWidget extends AppWidgetProvider {
    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && HemWidgetBridge.ACTION_WIDGET_TOGGLE_ITEM.equals(intent.getAction())) {
            String rawLine = intent.getStringExtra(HemWidgetBridge.EXTRA_ITEM_RAW_LINE);
            String title = intent.getStringExtra(HemWidgetBridge.EXTRA_ITEM_TITLE);
            HemWidgetBridge.handleWidgetToggleItem(context, "shopping", rawLine, title);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateAll(context, appWidgetManager);
    }

    public static void updateAll(Context context, AppWidgetManager mgr) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);
            String body = prefs.getString("shop_text", "Inköpslistan är tom");
            String badge = prefs.getString("shop_badge", "0 kvar");
            RemoteViews views = HemWidgetBridge.buildExpressiveViews(
                context,
                "Inköpslista",
                "HEM · ATT HANDLA",
                badge,
                body,
                "shopping",
                8102,
                HemShoppingWidget.class
            );
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, HemShoppingWidget.class));
            if (ids != null && ids.length > 0) {
                mgr.updateAppWidget(ids, views);
            }
        } catch (Throwable ignored) {
        }
    }
}
`;

const hemTodoWidgetJava = `package se.carlberg.hem;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class HemTodoWidget extends AppWidgetProvider {
    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && HemWidgetBridge.ACTION_WIDGET_TOGGLE_ITEM.equals(intent.getAction())) {
            String rawLine = intent.getStringExtra(HemWidgetBridge.EXTRA_ITEM_RAW_LINE);
            String title = intent.getStringExtra(HemWidgetBridge.EXTRA_ITEM_TITLE);
            HemWidgetBridge.handleWidgetToggleItem(context, "todo", rawLine, title);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateAll(context, appWidgetManager);
    }

    public static void updateAll(Context context, AppWidgetManager mgr) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);
            String body = prefs.getString("todo_text", "Alla uppgifter är avklarade!");
            String badge = prefs.getString("todo_badge", "0 kvar");
            RemoteViews views = HemWidgetBridge.buildExpressiveViews(
                context,
                "Att göra",
                "HEM · UPPGIFTER",
                badge,
                body,
                "todo",
                8103,
                HemTodoWidget.class
            );
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, HemTodoWidget.class));
            if (ids != null && ids.length > 0) {
                mgr.updateAppWidget(ids, views);
            }
        } catch (Throwable ignored) {
        }
    }
}
`;

const hemTileHelperJava = `package se.carlberg.hem;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;

import androidx.wear.tiles.ActionBuilders;
import androidx.wear.tiles.ColorBuilders;
import androidx.wear.tiles.DimensionBuilders;
import androidx.wear.tiles.LayoutElementBuilders;
import androidx.wear.tiles.ModifiersBuilders;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.ResourceBuilders;
import androidx.wear.tiles.StateBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import androidx.wear.tiles.TimelineBuilders;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;

import java.util.ArrayList;
import java.util.List;

public class HemTileHelper {
    public static final String RESOURCES_VERSION = "hem_wear_m3_expressive_v6";
    private static volatile long lastTileCloudSyncMs = 0L;

    public static void requestUpdateAllTiles(Context ctx) {
        if (ctx == null) return;
        try {
            Context appCtx = ctx.getApplicationContext();
            TileService.getUpdater(appCtx).requestUpdate(HemCalendarTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemShoppingTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemTodoTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemNotesTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemBudgetTileService.class);
        } catch (Throwable ignored) {
        }
    }

    public static ListenableFuture<ResourceBuilders.Resources> buildResources() {
        return Futures.immediateFuture(
            new ResourceBuilders.Resources.Builder()
                .setVersion(RESOURCES_VERSION)
                .build()
        );
    }

    public static ListenableFuture<TileBuilders.Tile> buildTile(
        Context context,
        RequestBuilders.TileRequest requestParams,
        String mode
    ) {
        final Context appCtx = context.getApplicationContext();
        try {
            HemSyncService.ensureDefaultAccountConfig(appCtx);
            StateBuilders.State state = requestParams != null ? requestParams.getState() : null;
            String clickedId = state != null ? state.getLastClickableId() : "";

            if (clickedId != null && !clickedId.isEmpty()) {
                SharedPreferences tilePrefs = appCtx.getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);
                if (clickedId.startsWith("toggle_shop:")) {
                    String title = clickedId.substring("toggle_shop:".length());
                    HemWidgetBridge.handleWidgetToggleItem(appCtx, "shopping", "", title);
                } else if (clickedId.startsWith("toggle_todo:")) {
                    String title = clickedId.substring("toggle_todo:".length());
                    HemWidgetBridge.handleWidgetToggleItem(appCtx, "todo", "", title);
                } else if (clickedId.startsWith("scroll_up:")) {
                    String targetMode = clickedId.substring("scroll_up:".length());
                    int cur = tilePrefs.getInt("tile_offset_" + targetMode, 0);
                    tilePrefs.edit().putInt("tile_offset_" + targetMode, Math.max(0, cur - 2)).apply();
                } else if (clickedId.startsWith("scroll_down:")) {
                    String targetMode = clickedId.substring("scroll_down:".length());
                    int cur = tilePrefs.getInt("tile_offset_" + targetMode, 0);
                    tilePrefs.edit().putInt("tile_offset_" + targetMode, cur + 2).apply();
                } else if ("sync_now".equals(clickedId)) {
                    new Thread(() -> HemSyncService.pollCloudOnce(appCtx)).start();
                }
            }

            long now = System.currentTimeMillis();
            if (now - lastTileCloudSyncMs > 45000L) {
                lastTileCloudSyncMs = now;
                new Thread(() -> HemSyncService.pollCloudOnce(appCtx)).start();
            }
        } catch (Throwable ignored) {
        }

        LayoutElementBuilders.LayoutElement root = buildRootLayout(appCtx, mode);
        TimelineBuilders.Timeline timeline = new TimelineBuilders.Timeline.Builder()
            .addTimelineEntry(
                new TimelineBuilders.TimelineEntry.Builder()
                    .setLayout(
                        new LayoutElementBuilders.Layout.Builder()
                            .setRoot(root)
                            .build()
                    )
                    .build()
            )
            .build();

        return Futures.immediateFuture(
            new TileBuilders.Tile.Builder()
                .setResourcesVersion(RESOURCES_VERSION)
                .setFreshnessIntervalMillis(60000L)
                .setTimeline(timeline)
                .build()
        );
    }

    private static ActionBuilders.LaunchAction buildLaunchWatchAppAction(Context ctx, String mode, boolean quickAdd) {
        return new ActionBuilders.LaunchAction.Builder()
            .setAndroidActivity(
                new ActionBuilders.AndroidActivity.Builder()
                    .setPackageName(ctx.getPackageName())
                    .setClassName("se.carlberg.hem.HemWearActivity")
                    .addKeyToExtraMapping("open_tab", ActionBuilders.stringExtra(mode))
                    .addKeyToExtraMapping("quick_add", ActionBuilders.stringExtra(quickAdd ? "true" : "false"))
                    .build()
            )
            .build();
    }

    private static LayoutElementBuilders.FontStyle.Builder robotoFont(float spSize, boolean bold, int argbColor) {
        return new LayoutElementBuilders.FontStyle.Builder()
            .setSize(DimensionBuilders.sp(spSize))
            .setWeight(bold ? LayoutElementBuilders.FONT_WEIGHT_BOLD : LayoutElementBuilders.FONT_WEIGHT_NORMAL)
            .setColor(ColorBuilders.argb(argbColor));
    }

    private static int parseCategoryColorArgb(String hex, int fallbackArgb) {
        if (hex == null || !hex.startsWith("#")) return fallbackArgb;
        try {
            return android.graphics.Color.parseColor(hex.trim());
        } catch (Throwable ignored) {
            return fallbackArgb;
        }
    }

    private static LayoutElementBuilders.LayoutElement buildScrollBtn(String id, String symbol, int bgArgb, int textArgb) {
        ModifiersBuilders.Clickable click = new ModifiersBuilders.Clickable.Builder()
            .setId(id)
            .setOnClick(new ActionBuilders.LoadAction.Builder().build())
            .build();
        return new LayoutElementBuilders.Box.Builder()
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setModifiers(
                new ModifiersBuilders.Modifiers.Builder()
                    .setClickable(click)
                    .setBackground(
                        new ModifiersBuilders.Background.Builder()
                            .setColor(ColorBuilders.argb(bgArgb))
                            .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(999f)).build())
                            .build()
                    )
                    .setPadding(
                        new ModifiersBuilders.Padding.Builder()
                            .setStart(DimensionBuilders.dp(10f))
                            .setEnd(DimensionBuilders.dp(10f))
                            .setTop(DimensionBuilders.dp(3f))
                            .setBottom(DimensionBuilders.dp(3f))
                            .build()
                    )
                    .build()
            )
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(symbol)
                    .setFontStyle(robotoFont(10f, true, textArgb).build())
                    .build()
            )
            .build();
    }

    private static LayoutElementBuilders.LayoutElement buildRootLayout(Context ctx, String mode) {
        SharedPreferences prefs = ctx.getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);

        String rawText;
        String headerTitle;
        String bottomBtnLabel;
        int surfaceBgArgb;
        int accentArgb;
        int heroTitleArgb;
        int heroSubArgb;
        int secondaryBgArgb;
        int secondaryTitleArgb;
        int secondarySubArgb;
        int bottomBtnBgArgb;
        int bottomBtnTextArgb;

        if ("calendar".equals(mode)) {
            rawText = prefs.getString("cal_text", "Inga inplanerade händelser närmaste 2 veckorna");
            headerTitle = "KALENDER";
            bottomBtnLabel = "+ Händelse";
            surfaceBgArgb = 0xFF0B192C;
            accentArgb = 0xFF93C5FD;
            heroTitleArgb = 0xFF0F172A;
            heroSubArgb = 0xFF1E3A8A;
            secondaryBgArgb = 0xFF1E3A8A;
            secondaryTitleArgb = 0xFFEFF6FF;
            secondarySubArgb = 0xFF93C5FD;
            bottomBtnBgArgb = 0xFF3B82F6;
            bottomBtnTextArgb = 0xFFFFFFFF;
        } else if ("shopping".equals(mode)) {
            rawText = prefs.getString("shop_text", "Inköpslistan är tom");
            headerTitle = "INKÖPSLISTA";
            bottomBtnLabel = "+ Lägg till";
            surfaceBgArgb = 0xFF271206;
            accentArgb = 0xFFFDBA74;
            heroTitleArgb = 0xFF431407;
            heroSubArgb = 0xFF7C2D12;
            secondaryBgArgb = 0xFF7C2D12;
            secondaryTitleArgb = 0xFFFFEDD5;
            secondarySubArgb = 0xFFFDBA74;
            bottomBtnBgArgb = 0xFFEA580C;
            bottomBtnTextArgb = 0xFFFFFFFF;
        } else if ("todo".equals(mode)) {
            rawText = prefs.getString("todo_text", "Alla uppgifter är avklarade!");
            headerTitle = "ATT GÖRA";
            bottomBtnLabel = "+ Ny uppgift";
            surfaceBgArgb = 0xFF082216;
            accentArgb = 0xFF86EFAC;
            heroTitleArgb = 0xFF064E3B;
            heroSubArgb = 0xFF047857;
            secondaryBgArgb = 0xFF14532D;
            secondaryTitleArgb = 0xFFDCFCE7;
            secondarySubArgb = 0xFF86EFAC;
            bottomBtnBgArgb = 0xFF10B981;
            bottomBtnTextArgb = 0xFF052E16;
        } else if ("notes".equals(mode)) {
            rawText = prefs.getString("notes_text", "Inga anteckningar ännu");
            headerTitle = "ANTECKNINGAR";
            bottomBtnLabel = "+ Anteckning";
            surfaceBgArgb = 0xFF231B05;
            accentArgb = 0xFFFEF08A;
            heroTitleArgb = 0xFF422006;
            heroSubArgb = 0xFF713F12;
            secondaryBgArgb = 0xFF713F12;
            secondaryTitleArgb = 0xFFFEF9C3;
            secondarySubArgb = 0xFFFDE047;
            bottomBtnBgArgb = 0xFFEAB308;
            bottomBtnTextArgb = 0xFF422006;
        } else {
            rawText = prefs.getString("budget_text", "Inga utgifter registrerade");
            headerTitle = "BUDGET";
            bottomBtnLabel = "+ Utgift";
            surfaceBgArgb = 0xFF1B102E;
            accentArgb = 0xFFC4B5FD;
            heroTitleArgb = 0xFF1E1B4B;
            heroSubArgb = 0xFF4C1D95;
            secondaryBgArgb = 0xFF3B0764;
            secondaryTitleArgb = 0xFFE9D5FF;
            secondarySubArgb = 0xFFC4B5FD;
            bottomBtnBgArgb = 0xFFA855F7;
            bottomBtnTextArgb = 0xFFFFFFFF;
        }

        List<String> items = new ArrayList<>();
        if (!HemWidgetBridge.isEmptyStateMessage(rawText)) {
            for (String line : rawText.trim().split("\\\\r?\\\\n")) {
                String clean = line.trim();
                if (clean.startsWith("•")) clean = clean.substring(1).trim();
                if (!clean.isEmpty()) items.add(clean);
            }
        }

        int maxVisible = "budget".equals(mode) ? 2 : 4;
        int savedOffset = prefs.getInt("tile_offset_" + mode, 0);
        int maxStart = Math.max(0, items.size() - maxVisible);
        int offset = Math.max(0, Math.min(savedOffset, maxStart));

        ModifiersBuilders.Clickable openAppClick = new ModifiersBuilders.Clickable.Builder()
            .setId("open_app_" + mode)
            .setOnClick(buildLaunchWatchAppAction(ctx, mode, false))
            .build();

        ModifiersBuilders.Clickable quickAddClick = new ModifiersBuilders.Clickable.Builder()
            .setId("quick_add_" + mode)
            .setOnClick(buildLaunchWatchAppAction(ctx, mode, true))
            .build();

        LayoutElementBuilders.Column.Builder col = new LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.wrap())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER);

        // Header Row WITHOUT top page dots + Up/Down scroll controls when list has more items
        LayoutElementBuilders.Row.Builder headerRow = new LayoutElementBuilders.Row.Builder()
            .setWidth(DimensionBuilders.wrap())
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER);

        if (items.size() > maxVisible && offset > 0) {
            headerRow.addContent(buildScrollBtn("scroll_up:" + mode, "▲", accentArgb, heroTitleArgb));
            headerRow.addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(6f)).build());
        }

        String titleWithCount = items.size() > maxVisible
            ? (headerTitle + " (" + (offset + 1) + "–" + Math.min(items.size(), offset + maxVisible) + "/" + items.size() + ")")
            : headerTitle;

        headerRow.addContent(
            new LayoutElementBuilders.Text.Builder()
                .setText(titleWithCount)
                .setModifiers(new ModifiersBuilders.Modifiers.Builder().setClickable(openAppClick).build())
                .setFontStyle(robotoFont(10.5f, true, accentArgb).build())
                .build()
        );

        if (items.size() > maxVisible && offset + maxVisible < items.size()) {
            headerRow.addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(6f)).build());
            headerRow.addContent(buildScrollBtn("scroll_down:" + mode, "▼", accentArgb, heroTitleArgb));
        }

        col.addContent(headerRow.build());
        col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4f)).build());

        if ("budget".equals(mode)) {
            String remVal = HemWidgetBridge.getBudgetRemainingDisplay(prefs);
            String spentVal = HemWidgetBridge.getBudgetSpentDisplay(prefs);

            LayoutElementBuilders.Column.Builder heroInner = new LayoutElementBuilders.Column.Builder()
                .setWidth(DimensionBuilders.expand())
                .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
                .addContent(
                    new LayoutElementBuilders.Text.Builder()
                        .setText("KVAR: " + remVal)
                        .setMaxLines(1)
                        .setFontStyle(robotoFont(13f, true, heroTitleArgb).build())
                        .build()
                )
                .addContent(
                    new LayoutElementBuilders.Text.Builder()
                        .setText("Utgifter: " + spentVal)
                        .setMaxLines(1)
                        .setFontStyle(robotoFont(9.5f, false, heroSubArgb).build())
                        .build()
                );

            col.addContent(
                new LayoutElementBuilders.Box.Builder()
                    .setWidth(DimensionBuilders.expand())
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
                    .setModifiers(
                        new ModifiersBuilders.Modifiers.Builder()
                            .setClickable(openAppClick)
                            .setBackground(
                                new ModifiersBuilders.Background.Builder()
                                    .setColor(ColorBuilders.argb(accentArgb))
                                    .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(18f)).build())
                                    .build()
                            )
                            .setPadding(
                                new ModifiersBuilders.Padding.Builder()
                                    .setStart(DimensionBuilders.dp(12f))
                                    .setEnd(DimensionBuilders.dp(12f))
                                    .setTop(DimensionBuilders.dp(5f))
                                    .setBottom(DimensionBuilders.dp(5f))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(heroInner.build())
                    .build()
            );

            int endIdx = Math.min(items.size(), offset + maxVisible);
            for (int i = offset; i < endIdx; i++) {
                col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(3f)).build());
                String rawExp = items.get(i);
                String expTitle = rawExp;
                String expAmt = "";
                int pipeIdx = rawExp.indexOf("||");
                int dashIdx = rawExp.indexOf(" — ");
                if (pipeIdx > 0) {
                    expTitle = rawExp.substring(0, pipeIdx).trim();
                    expAmt = rawExp.substring(pipeIdx + 2).trim();
                } else if (dashIdx > 0) {
                    expTitle = rawExp.substring(0, dashIdx).trim();
                    expAmt = rawExp.substring(dashIdx + 3).trim();
                }
                col.addContent(
                    buildSecondaryTonalCard(
                        openAppClick,
                        expTitle + (!expAmt.isEmpty() ? (" · " + expAmt) : ""),
                        secondaryBgArgb,
                        secondaryTitleArgb
                    )
                );
            }
        } else if (items.isEmpty()) {
            String emptyMsg = "shopping".equals(mode)
                ? "Inköpslistan är tom"
                : ("calendar".equals(mode)
                    ? "Inga händelser (14 dgr)"
                    : ("notes".equals(mode) ? "Inga anteckningar" : "Allt är avklarat!"));

            col.addContent(
                new LayoutElementBuilders.Box.Builder()
                    .setWidth(DimensionBuilders.expand())
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
                    .setModifiers(
                        new ModifiersBuilders.Modifiers.Builder()
                            .setClickable(openAppClick)
                            .setBackground(
                                new ModifiersBuilders.Background.Builder()
                                    .setColor(ColorBuilders.argb(secondaryBgArgb))
                                    .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(18f)).build())
                                    .build()
                            )
                            .setPadding(
                                new ModifiersBuilders.Padding.Builder()
                                    .setAll(DimensionBuilders.dp(12f))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(emptyMsg)
                            .setMaxLines(2)
                            .setFontStyle(robotoFont(11.5f, true, secondaryTitleArgb).build())
                            .build()
                    )
                    .build()
            );
        } else {
            // Render up to 4 UNIFORM cards (no highlighted first item; calendar uses category colors!)
            int endIdx = Math.min(items.size(), offset + maxVisible);
            for (int i = offset; i < endIdx; i++) {
                if (i > offset) {
                    col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(3f)).build());
                }
                String rawLine = items.get(i);
                int rowBgArgb = secondaryBgArgb;
                int rowTextArgb = secondaryTitleArgb;
                String displayLine = rawLine;
                ModifiersBuilders.Clickable rowClick = openAppClick;

                if ("calendar".equals(mode)) {
                    int colorSep = rawLine.lastIndexOf("||");
                    if (colorSep > 0) {
                        String hex = rawLine.substring(colorSep + 2).trim();
                        rowBgArgb = parseCategoryColorArgb(hex, secondaryBgArgb);
                        rowTextArgb = 0xFFFFFFFF;
                        displayLine = rawLine.substring(0, colorSep).trim();
                    }
                    int dashIdx = displayLine.indexOf(" — ");
                    if (dashIdx > 0) {
                        String meta = displayLine.substring(0, dashIdx).trim();
                        String title = displayLine.substring(dashIdx + 3).trim();
                        int pipeIdx = meta.indexOf("|");
                        if (pipeIdx > 0) {
                            String dPart = meta.substring(0, pipeIdx).trim();
                            String tPart = meta.substring(pipeIdx + 1).trim();
                            if (dPart.length() == 10) dPart = dPart.substring(5);
                            meta = dPart + " " + tPart;
                        }
                        displayLine = meta + " · " + title;
                    }
                } else if ("notes".equals(mode)) {
                    int pipeIdx = rawLine.indexOf("||");
                    int dashIdx = rawLine.indexOf(" — ");
                    if (pipeIdx > 0) {
                        String nTitle = rawLine.substring(0, pipeIdx).trim();
                        String nBody = rawLine.substring(pipeIdx + 2).trim().replace(" · ", " ");
                        displayLine = nBody.isEmpty() ? nTitle : (nTitle + " — " + nBody);
                    } else if (dashIdx > 0) {
                        displayLine = rawLine;
                    }
                } else {
                    String cleanTitle = rawLine;
                    int parenIdx = rawLine.lastIndexOf(" (");
                    if (parenIdx > 0 && rawLine.endsWith(")")) {
                        cleanTitle = rawLine.substring(0, parenIdx).trim();
                    }
                    displayLine = "○  " + rawLine;
                    rowClick = new ModifiersBuilders.Clickable.Builder()
                        .setId(("shopping".equals(mode) ? "toggle_shop:" : "toggle_todo:") + cleanTitle)
                        .setOnClick(new ActionBuilders.LoadAction.Builder().build())
                        .build();
                }

                col.addContent(
                    buildSecondaryTonalCard(
                        rowClick,
                        displayLine,
                        rowBgArgb,
                        rowTextArgb
                    )
                );
            }
        }

        col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(5f)).build());

        // Material 3 Expressive wide bottom-hugging button on every Tile
        col.addContent(
            new LayoutElementBuilders.Box.Builder()
                .setWidth(DimensionBuilders.dp(138f))
                .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
                .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
                .setModifiers(
                    new ModifiersBuilders.Modifiers.Builder()
                        .setClickable(quickAddClick)
                        .setBackground(
                            new ModifiersBuilders.Background.Builder()
                                .setColor(ColorBuilders.argb(accentArgb))
                                .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(999f)).build())
                                .build()
                        )
                        .setPadding(
                            new ModifiersBuilders.Padding.Builder()
                                .setStart(DimensionBuilders.dp(18f))
                                .setEnd(DimensionBuilders.dp(18f))
                                .setTop(DimensionBuilders.dp(6.5f))
                                .setBottom(DimensionBuilders.dp(6.5f))
                                .build()
                        )
                        .build()
                )
                .addContent(
                    new LayoutElementBuilders.Text.Builder()
                        .setText(bottomBtnLabel)
                        .setFontStyle(robotoFont(11.5f, true, heroTitleArgb).build())
                        .build()
                )
                .build()
        );

        return new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setModifiers(
                new ModifiersBuilders.Modifiers.Builder()
                    .setBackground(
                        new ModifiersBuilders.Background.Builder()
                            .setColor(ColorBuilders.argb(surfaceBgArgb))
                            .build()
                    )
                    .setPadding(
                        new ModifiersBuilders.Padding.Builder()
                            .setStart(DimensionBuilders.dp(13f))
                            .setEnd(DimensionBuilders.dp(13f))
                            .setTop(DimensionBuilders.dp(6f))
                            .setBottom(DimensionBuilders.dp(6f))
                            .build()
                    )
                    .build()
            )
            .addContent(col.build())
            .build();
    }

    private static LayoutElementBuilders.LayoutElement buildSecondaryTonalCard(
        ModifiersBuilders.Clickable click,
        String text,
        int bgArgb,
        int textArgb
    ) {
        return new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
            .setModifiers(
                new ModifiersBuilders.Modifiers.Builder()
                    .setClickable(click)
                    .setBackground(
                        new ModifiersBuilders.Background.Builder()
                            .setColor(ColorBuilders.argb(bgArgb))
                            .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(22f)).build())
                            .build()
                    )
                    .setPadding(
                        new ModifiersBuilders.Padding.Builder()
                            .setStart(DimensionBuilders.dp(13f))
                            .setEnd(DimensionBuilders.dp(13f))
                            .setTop(DimensionBuilders.dp(5f))
                            .setBottom(DimensionBuilders.dp(5f))
                            .build()
                    )
                    .build()
            )
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(text)
                    .setMaxLines(1)
                    .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                    .setFontStyle(robotoFont(11f, true, textArgb).build())
                    .build()
            )
            .build();
    }
}
`;

const hemShoppingTileServiceJava = `package se.carlberg.hem;

import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.ResourceBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import com.google.common.util.concurrent.ListenableFuture;

public class HemShoppingTileService extends TileService {
    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        return HemTileHelper.buildTile(this, requestParams, "shopping");
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onResourcesRequest(RequestBuilders.ResourcesRequest requestParams) {
        return HemTileHelper.buildResources();
    }
}
`;

const hemCalendarTileServiceJava = `package se.carlberg.hem;

import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.ResourceBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import com.google.common.util.concurrent.ListenableFuture;

public class HemCalendarTileService extends TileService {
    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        return HemTileHelper.buildTile(this, requestParams, "calendar");
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onResourcesRequest(RequestBuilders.ResourcesRequest requestParams) {
        return HemTileHelper.buildResources();
    }
}
`;

const hemTodoTileServiceJava = `package se.carlberg.hem;

import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.ResourceBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import com.google.common.util.concurrent.ListenableFuture;

public class HemTodoTileService extends TileService {
    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        return HemTileHelper.buildTile(this, requestParams, "todo");
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onResourcesRequest(RequestBuilders.ResourcesRequest requestParams) {
        return HemTileHelper.buildResources();
    }
}
`;

const hemNotesTileServiceJava = `package se.carlberg.hem;

import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.ResourceBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import com.google.common.util.concurrent.ListenableFuture;

public class HemNotesTileService extends TileService {
    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        return HemTileHelper.buildTile(this, requestParams, "notes");
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onResourcesRequest(RequestBuilders.ResourcesRequest requestParams) {
        return HemTileHelper.buildResources();
    }
}
`;

const hemBudgetTileServiceJava = `package se.carlberg.hem;

import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.ResourceBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import com.google.common.util.concurrent.ListenableFuture;

public class HemBudgetTileService extends TileService {
    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        return HemTileHelper.buildTile(this, requestParams, "budget");
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onResourcesRequest(RequestBuilders.ResourcesRequest requestParams) {
        return HemTileHelper.buildResources();
    }
}
`;

const hemWearActivityJava = `package se.carlberg.hem;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.text.InputType;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.Window;
import android.view.animation.DecelerateInterpolator;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class HemWearActivity extends Activity {
    private static final int REQ_VOICE_ADD = 9501;
    private static final String[] PAGES = new String[]{
        "calendar", "shopping", "todo", "notes", "budget"
    };

    private int activePageIdx = 0;
    private int currentScreenBgArgb = Color.parseColor("#0B192C");
    private boolean isAnimatingPage = false;
    private boolean allowExplicitFinish = false;
    private float touchStartX = 0f;
    private float touchStartY = 0f;

    private FrameLayout outerRoot;
    private ScrollView rootScroll;
    private LinearLayout contentCol;
    private LinearLayout dotsRow;
    private TextView pageTitleTv;
    private TextView pageSubTv;
    private LinearLayout listContainer;
    private TextView primaryBottomBtn;
    private TextView voiceBottomBtn;
    private TextView accountFooterBtn;

    private Typeface robotoBold;
    private Typeface robotoMedium;
    private Typeface robotoRegular;

    private final Runnable hideDotsRunnable = new Runnable() {
        @Override
        public void run() {
            if (dotsRow != null) {
                dotsRow.animate()
                    .alpha(0f)
                    .setDuration(360)
                    .start();
            }
        }
    };

    private void showTopDotsTemporarily() {
        if (dotsRow == null) return;
        dotsRow.removeCallbacks(hideDotsRunnable);
        dotsRow.animate().cancel();
        dotsRow.setAlpha(1f);
        dotsRow.postDelayed(hideDotsRunnable, 1150);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        robotoBold = Typeface.create("sans-serif", Typeface.BOLD);
        robotoMedium = Typeface.create("sans-serif-medium", Typeface.NORMAL);
        robotoRegular = Typeface.create("sans-serif", Typeface.NORMAL);

        HemSyncService.ensureDefaultAccountConfig(this);
        HemSyncService.scheduleNextAlarm(this);
        HemSyncService.startServiceSafe(this);

        if (getIntent() != null) {
            applyTabFromIntent(getIntent());
        }

        buildWatchUi();
        registerWearBackAndSwipeBlockers();
        disallowSystemSwipeToDismiss(dp(110));
        if (outerRoot != null) {
            outerRoot.post(() -> disallowSystemSwipeToDismiss(dp(110)));
        }

        if (getIntent() != null && "true".equals(getIntent().getStringExtra("quick_add"))) {
            getIntent().removeExtra("quick_add");
            showQuickAddDialogForActivePage();
        }

        triggerCloudSync(false);
    }

    @Override
    protected void onResume() {
        super.onResume();
        disallowSystemSwipeToDismiss(dp(110));
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            disallowSystemSwipeToDismiss(dp(110));
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null) {
            applyTabFromIntent(intent);
            refreshWatchContent();
            if ("true".equals(intent.getStringExtra("quick_add"))) {
                intent.removeExtra("quick_add");
                showQuickAddDialogForActivePage();
            }
        }
    }

    private void applyTabFromIntent(Intent intent) {
        String tabExtra = intent.getStringExtra("open_tab");
        if (tabExtra == null) return;
        for (int i = 0; i < PAGES.length; i++) {
            if (PAGES[i].equals(tabExtra)) {
                activePageIdx = i;
                return;
            }
        }
    }

    private String getActiveTab() {
        return PAGES[activePageIdx];
    }

    private int getScreenBgForPage(int idx) {
        String m = PAGES[Math.max(0, Math.min(PAGES.length - 1, idx))];
        if ("calendar".equals(m)) return Color.parseColor("#0B192C");
        if ("shopping".equals(m)) return Color.parseColor("#271206");
        if ("todo".equals(m)) return Color.parseColor("#082216");
        if ("notes".equals(m)) return Color.parseColor("#231B05");
        return Color.parseColor("#1B102E");
    }

    private void animateToPage(final int targetIdx, final int direction) {
        if (targetIdx < 0 || targetIdx >= PAGES.length || targetIdx == activePageIdx || isAnimatingPage) {
            return;
        }
        isAnimatingPage = true;
        showTopDotsTemporarily();

        final int fromBg = currentScreenBgArgb;
        final int toBg = getScreenBgForPage(targetIdx);

        ValueAnimator bgAnim = ValueAnimator.ofObject(new ArgbEvaluator(), fromBg, toBg);
        bgAnim.setDuration(260);
        bgAnim.addUpdateListener(anim -> {
            int col = (int) anim.getAnimatedValue();
            currentScreenBgArgb = col;
            if (outerRoot != null) outerRoot.setBackgroundColor(col);
            if (rootScroll != null) rootScroll.setBackgroundColor(col);
        });
        bgAnim.start();

        if (contentCol == null) {
            activePageIdx = targetIdx;
            refreshWatchContent();
            showTopDotsTemporarily();
            isAnimatingPage = false;
            return;
        }

        final float slideOutX = -direction * dp(34);
        final float slideInStartX = direction * dp(38);

        contentCol.animate()
            .translationX(slideOutX)
            .alpha(0.12f)
            .setDuration(105)
            .withEndAction(() -> {
                activePageIdx = targetIdx;
                if (rootScroll != null) {
                    rootScroll.scrollTo(0, 0);
                }
                refreshWatchContent();
                showTopDotsTemporarily();
                contentCol.setTranslationX(slideInStartX);
                contentCol.setAlpha(0.18f);
                contentCol.animate()
                    .translationX(0f)
                    .alpha(1f)
                    .setDuration(220)
                    .setInterpolator(new DecelerateInterpolator(1.6f))
                    .withEndAction(() -> isAnimatingPage = false)
                    .start();
            })
            .start();
    }

    private void registerWearBackAndSwipeBlockers() {
        try {
            if (Build.VERSION.SDK_INT >= 33) {
                Method getDispatcher = Activity.class.getMethod("getOnBackInvokedDispatcher");
                Object dispatcher = getDispatcher.invoke(this);
                if (dispatcher != null) {
                    Class<?> callbackInterface = Class.forName("android.window.OnBackInvokedCallback");
                    Object proxyCallback = Proxy.newProxyInstance(
                        callbackInterface.getClassLoader(),
                        new Class<?>[]{callbackInterface},
                        (proxy, method, args) -> {
                            if ("onBackInvoked".equals(method.getName())) {
                                runOnUiThread(() -> {
                                    if (activePageIdx > 0) {
                                        animateToPage(activePageIdx - 1, -1);
                                    } else {
                                        showTopDotsTemporarily();
                                    }
                                });
                            }
                            return null;
                        }
                    );
                    Method registerMethod = dispatcher.getClass().getMethod(
                        "registerOnBackInvokedCallback",
                        int.class,
                        callbackInterface
                    );
                    // Register at both default (0) and system overlay (1000000) priority
                    registerMethod.invoke(dispatcher, 0, proxyCallback);
                    registerMethod.invoke(dispatcher, 1000000, proxyCallback);
                }
            }
        } catch (Throwable ignored) {
        }
    }

    private void disableSwipeDismissOnViewTree(View v) {
        if (v == null) return;
        try {
            String clsName = v.getClass().getName();
            if (clsName.contains("SwipeDismiss")) {
                for (Method m : v.getClass().getMethods()) {
                    if ("setSwipeable".equals(m.getName()) && m.getParameterTypes().length == 1) {
                        m.invoke(v, false);
                    } else if ("setDismissMinDragWidthRatio".equals(m.getName()) && m.getParameterTypes().length == 1) {
                        m.invoke(v, 10.0f);
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        if (v instanceof ViewGroup) {
            ViewGroup vg = (ViewGroup) v;
            for (int i = 0; i < vg.getChildCount(); i++) {
                disableSwipeDismissOnViewTree(vg.getChildAt(i));
            }
        }
    }

    private void disallowSystemSwipeToDismiss() {
        disallowSystemSwipeToDismiss(dp(110));
    }

    private void disallowSystemSwipeToDismiss(float focusY) {
        try {
            if (outerRoot != null) {
                outerRoot.requestDisallowInterceptTouchEvent(true);
                ViewParent p = outerRoot.getParent();
                while (p != null) {
                    p.requestDisallowInterceptTouchEvent(true);
                    if (p instanceof View) {
                        disableSwipeDismissOnViewTree((View) p);
                    }
                    p = p.getParent();
                }
            }
            if (getWindow() != null) {
                View decor = getWindow().getDecorView();
                if (decor != null) {
                    disableSwipeDismissOnViewTree(decor);
                    if (Build.VERSION.SDK_INT >= 29) {
                        int w = Math.max(500, decor.getWidth() > 0 ? decor.getWidth() : dp(260));
                        int h = Math.max(500, decor.getHeight() > 0 ? decor.getHeight() : dp(260));
                        // Android 10+ enforces a strict 200dp max height per edge for system gesture exclusion.
                        // Passing a 190dp band centered around the touch Y ensures WindowManager 100% honors it!
                        int halfBand = dp(95);
                        int cy = focusY > 0 ? (int) focusY : (h / 2);
                        int top = Math.max(0, cy - halfBand);
                        int bottom = Math.min(h, top + dp(190));
                        List<Rect> exclusions = Collections.singletonList(new Rect(0, top, w, bottom));
                        decor.setSystemGestureExclusionRects(exclusions);
                        if (outerRoot != null) {
                            outerRoot.setSystemGestureExclusionRects(exclusions);
                        }
                    }
                }
            }
        } catch (Throwable ignored) {
        }
    }

    @Override
    public void onBackPressed() {
        // Left-to-right swipe / back gesture switches to the previous page on the left
        // and NEVER closes the app. User exits the app via the physical watch crown!
        if (activePageIdx > 0) {
            animateToPage(activePageIdx - 1, -1);
        } else {
            showTopDotsTemporarily();
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event != null && event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_UP) {
                if (activePageIdx > 0) {
                    animateToPage(activePageIdx - 1, -1);
                } else {
                    showTopDotsTemporarily();
                }
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void finish() {
        if (!allowExplicitFinish) {
            if (activePageIdx > 0) {
                animateToPage(activePageIdx - 1, -1);
            } else {
                showTopDotsTemporarily();
            }
            return;
        }
        super.finish();
    }

    @Override
    public void finishAfterTransition() {
        if (!allowExplicitFinish) {
            if (activePageIdx > 0) {
                animateToPage(activePageIdx - 1, -1);
            } else {
                showTopDotsTemporarily();
            }
            return;
        }
        super.finishAfterTransition();
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (ev != null) {
            switch (ev.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    touchStartX = ev.getRawX();
                    touchStartY = ev.getRawY();
                    disallowSystemSwipeToDismiss(touchStartY);
                    break;
                case MotionEvent.ACTION_MOVE: {
                    disallowSystemSwipeToDismiss(ev.getRawY());
                    float moveDx = ev.getRawX() - touchStartX;
                    float moveDy = ev.getRawY() - touchStartY;
                    if (Math.abs(moveDx) > dp(10) && Math.abs(moveDx) > Math.abs(moveDy) * 1.02f) {
                        showTopDotsTemporarily();
                    }
                    break;
                }
                case MotionEvent.ACTION_UP: {
                    float dx = ev.getRawX() - touchStartX;
                    float dy = ev.getRawY() - touchStartY;

                    // Horizontal swipe LEFT/RIGHT to scroll between pages
                    if (Math.abs(dx) > dp(22) && Math.abs(dx) > Math.abs(dy) * 1.02f) {
                        if (dx < 0 && activePageIdx < PAGES.length - 1) {
                            animateToPage(activePageIdx + 1, 1);
                            return true;
                        } else if (dx > 0 && activePageIdx > 0) {
                            animateToPage(activePageIdx - 1, -1);
                            return true;
                        } else {
                            showTopDotsTemporarily();
                            return true;
                        }
                    }
                    break;
                }
            }
        }
        return super.dispatchTouchEvent(ev);
    }

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent ev) {
        if (ev != null && ev.getAction() == MotionEvent.ACTION_SCROLL && rootScroll != null) {
            float vScroll = -ev.getAxisValue(MotionEvent.AXIS_VSCROLL);
            if (Math.abs(vScroll) < 0.001f) {
                vScroll = -ev.getAxisValue(MotionEvent.AXIS_SCROLL);
            }
            if (Math.abs(vScroll) > 0.001f) {
                int deltaPx = Math.round(vScroll * dp(48));
                rootScroll.smoothScrollBy(0, deltaPx);
                return true;
            }
        }
        return super.dispatchGenericMotionEvent(ev);
    }

    private void triggerCloudSync(boolean showToast) {
        if (showToast) {
            Toast.makeText(this, "Synkar med Hem...", Toast.LENGTH_SHORT).show();
        }
        new Thread(() -> {
            HemSyncService.pollCloudOnce(getApplicationContext());
            runOnUiThread(this::refreshWatchContent);
        }).start();
    }

    private int dp(float v) {
        return (int) (v * getResources().getDisplayMetrics().density);
    }

    private GradientDrawable roundedShape(int fillArgb, int strokeArgb, float radiusDp) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(fillArgb);
        gd.setCornerRadius(dp(radiusDp));
        if (strokeArgb != 0) {
            gd.setStroke(dp(1.6f), strokeArgb);
        }
        return gd;
    }

    private int parseCategoryColor(String hex, int fallbackArgb) {
        if (hex == null || !hex.startsWith("#")) return fallbackArgb;
        try {
            return Color.parseColor(hex.trim());
        } catch (Throwable ignored) {
            return fallbackArgb;
        }
    }

    private void buildWatchUi() {
        outerRoot = new FrameLayout(this);
        outerRoot.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        rootScroll = new ScrollView(this);
        rootScroll.setFillViewport(true);
        rootScroll.setVerticalScrollBarEnabled(false);
        rootScroll.setFocusable(true);
        rootScroll.setFocusableInTouchMode(true);
        rootScroll.requestFocus();
        rootScroll.setOnGenericMotionListener((v, ev) -> {
            if (ev != null && ev.getAction() == MotionEvent.ACTION_SCROLL) {
                float vScroll = -ev.getAxisValue(MotionEvent.AXIS_VSCROLL);
                if (Math.abs(vScroll) < 0.001f) {
                    vScroll = -ev.getAxisValue(MotionEvent.AXIS_SCROLL);
                }
                if (Math.abs(vScroll) > 0.001f) {
                    rootScroll.smoothScrollBy(0, Math.round(vScroll * dp(48)));
                    return true;
                }
            }
            return false;
        });

        contentCol = new LinearLayout(this);
        contentCol.setOrientation(LinearLayout.VERTICAL);
        contentCol.setGravity(Gravity.CENTER_HORIZONTAL);
        contentCol.setPadding(dp(16), dp(18), dp(16), dp(34));

        // Clean Header without directional arrows
        pageTitleTv = new TextView(this);
        pageTitleTv.setText("KALENDER");
        pageTitleTv.setTextSize(13f);
        pageTitleTv.setTypeface(robotoBold);
        pageTitleTv.setLetterSpacing(0.06f);
        pageTitleTv.setGravity(Gravity.CENTER);
        pageTitleTv.setPadding(dp(6), 0, dp(6), 0);
        pageTitleTv.setOnClickListener(v -> triggerCloudSync(true));
        contentCol.addView(pageTitleTv);

        pageSubTv = new TextView(this);
        pageSubTv.setText("14 dagar framåt");
        pageSubTv.setTextSize(9.5f);
        pageSubTv.setTypeface(robotoMedium);
        pageSubTv.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        subLp.bottomMargin = dp(8);
        contentCol.addView(pageSubTv, subLp);

        // Uniform Cards Container
        listContainer = new LinearLayout(this);
        listContainer.setOrientation(LinearLayout.VERTICAL);
        listContainer.setLayoutParams(new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        contentCol.addView(listContainer);

        // Bottom Material 3 Expressive Curved Edge Action Row
        LinearLayout bottomRow = new LinearLayout(this);
        bottomRow.setOrientation(LinearLayout.HORIZONTAL);
        bottomRow.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams bottomRowLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        bottomRowLp.topMargin = dp(10);

        primaryBottomBtn = new TextView(this);
        primaryBottomBtn.setText("+ Händelse");
        primaryBottomBtn.setTextSize(12.5f);
        primaryBottomBtn.setTypeface(robotoBold);
        primaryBottomBtn.setGravity(Gravity.CENTER);
        primaryBottomBtn.setPadding(dp(26), dp(11), dp(26), dp(11));
        primaryBottomBtn.setOnClickListener(v -> showQuickAddDialogForActivePage());
        LinearLayout.LayoutParams primLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        primLp.rightMargin = dp(6);
        bottomRow.addView(primaryBottomBtn, primLp);

        voiceBottomBtn = new TextView(this);
        voiceBottomBtn.setText("🎤");
        voiceBottomBtn.setTextSize(12.5f);
        voiceBottomBtn.setTypeface(robotoBold);
        voiceBottomBtn.setGravity(Gravity.CENTER);
        voiceBottomBtn.setPadding(dp(14), dp(11), dp(14), dp(11));
        voiceBottomBtn.setOnClickListener(v -> launchVoiceAdd());
        bottomRow.addView(voiceBottomBtn);

        contentCol.addView(bottomRow, bottomRowLp);

        // Subtle Sync & Account capsule at very bottom
        SharedPreferences syncPrefs = getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
        String currentEmail = syncPrefs.getString("email", "filipcarlberg91@gmail.com");

        accountFooterBtn = new TextView(this);
        accountFooterBtn.setText("↻ Synka · " + currentEmail);
        accountFooterBtn.setTextSize(9.5f);
        accountFooterBtn.setTypeface(robotoMedium);
        accountFooterBtn.setGravity(Gravity.CENTER);
        accountFooterBtn.setPadding(dp(14), dp(6), dp(14), dp(6));
        accountFooterBtn.setOnClickListener(v -> showAccountDialog());
        LinearLayout.LayoutParams accLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        accLp.topMargin = dp(8);
        contentCol.addView(accountFooterBtn, accLp);

        rootScroll.addView(contentCol);
        outerRoot.addView(rootScroll);

        // Top 5-dot page indicator (appears on horizontal scroll/page change, then fades out)
        dotsRow = new LinearLayout(this);
        dotsRow.setOrientation(LinearLayout.HORIZONTAL);
        dotsRow.setGravity(Gravity.CENTER);
        dotsRow.setPadding(dp(8), dp(3), dp(8), dp(3));
        dotsRow.setAlpha(0f);
        FrameLayout.LayoutParams dotsRowLp = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.TOP | Gravity.CENTER_HORIZONTAL
        );
        dotsRowLp.topMargin = dp(6);
        outerRoot.addView(dotsRow, dotsRowLp);

        setContentView(outerRoot);
        outerRoot.post(this::disallowSystemSwipeToDismiss);
        outerRoot.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> disallowSystemSwipeToDismiss());
        refreshWatchContent();
    }

    private void showNoteDetailDialog(String title, String body) {
        ScrollView sv = new ScrollView(this);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(18), dp(16), dp(18), dp(18));
        box.setBackgroundColor(Color.parseColor("#231B05"));

        TextView titleTv = new TextView(this);
        titleTv.setText(title);
        titleTv.setTextSize(15f);
        titleTv.setTypeface(robotoBold);
        titleTv.setTextColor(Color.parseColor("#FEF08A"));
        box.addView(titleTv);

        String formattedBody = (body == null || body.trim().isEmpty())
            ? "Ingen brödtext i anteckningen"
            : body.replace(" · ", "\\n\\n").trim();

        TextView bodyTv = new TextView(this);
        bodyTv.setText(formattedBody);
        bodyTv.setTextSize(13f);
        bodyTv.setTypeface(robotoRegular);
        bodyTv.setTextColor(Color.parseColor("#FEF9C3"));
        bodyTv.setLineSpacing(dp(2), 1.1f);
        LinearLayout.LayoutParams bodyLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        bodyLp.topMargin = dp(8);
        box.addView(bodyTv, bodyLp);

        TextView closeBtn = new TextView(this);
        closeBtn.setText("Stäng");
        closeBtn.setTextSize(12f);
        closeBtn.setTypeface(robotoBold);
        closeBtn.setTextColor(Color.parseColor("#422006"));
        closeBtn.setGravity(Gravity.CENTER);
        closeBtn.setPadding(dp(20), dp(9), dp(20), dp(9));
        closeBtn.setBackground(roundedShape(Color.parseColor("#EAB308"), 0, 999f));
        LinearLayout.LayoutParams closeLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        closeLp.topMargin = dp(14);
        box.addView(closeBtn, closeLp);

        sv.addView(box);

        final AlertDialog dialog = new AlertDialog.Builder(this)
            .setView(sv)
            .create();
        closeBtn.setOnClickListener(v -> dialog.dismiss());
        dialog.show();
    }

    private void refreshWatchContent() {
        if (listContainer == null) return;
        listContainer.removeAllViews();

        String mode = getActiveTab();
        SharedPreferences prefs = getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);

        String pageTitle;
        String pageSub;
        String bottomBtnText;
        String rawText;
        int screenBgArgb;
        int heroBgArgb;
        int heroTitleArgb;
        int heroSubArgb;
        int secBgArgb;
        int secTitleArgb;
        int secSubArgb;
        int btnBgArgb;
        int btnTextArgb;
        int inactiveDotArgb;

        if ("calendar".equals(mode)) {
            pageTitle = "KALENDER";
            pageSub = "14 dagar framåt";
            bottomBtnText = "+ Händelse";
            rawText = prefs.getString("cal_text", "Inga inplanerade händelser närmaste 2 veckorna");
            screenBgArgb = Color.parseColor("#0B192C");
            heroBgArgb = Color.parseColor("#93C5FD");
            heroTitleArgb = Color.parseColor("#0F172A");
            heroSubArgb = Color.parseColor("#1E3A8A");
            secBgArgb = Color.parseColor("#1E3A8A");
            secTitleArgb = Color.parseColor("#EFF6FF");
            secSubArgb = Color.parseColor("#93C5FD");
            btnBgArgb = Color.parseColor("#3B82F6");
            btnTextArgb = Color.parseColor("#FFFFFF");
            inactiveDotArgb = Color.parseColor("#1E3A8A");
        } else if ("shopping".equals(mode)) {
            pageTitle = "INKÖPSLISTA";
            pageSub = "Tryck på vara för att bocka av";
            bottomBtnText = "+ Lägg till";
            rawText = prefs.getString("shop_text", "Inköpslistan är tom");
            screenBgArgb = Color.parseColor("#271206");
            heroBgArgb = Color.parseColor("#FDBA74");
            heroTitleArgb = Color.parseColor("#431407");
            heroSubArgb = Color.parseColor("#7C2D12");
            secBgArgb = Color.parseColor("#7C2D12");
            secTitleArgb = Color.parseColor("#FFEDD5");
            secSubArgb = Color.parseColor("#FDBA74");
            btnBgArgb = Color.parseColor("#EA580C");
            btnTextArgb = Color.parseColor("#FFFFFF");
            inactiveDotArgb = Color.parseColor("#7C2D12");
        } else if ("todo".equals(mode)) {
            pageTitle = "ATT GÖRA";
            pageSub = "Tryck för att klarmarkera";
            bottomBtnText = "+ Ny uppgift";
            rawText = prefs.getString("todo_text", "Alla uppgifter är avklarade!");
            screenBgArgb = Color.parseColor("#082216");
            heroBgArgb = Color.parseColor("#86EFAC");
            heroTitleArgb = Color.parseColor("#064E3B");
            heroSubArgb = Color.parseColor("#047857");
            secBgArgb = Color.parseColor("#14532D");
            secTitleArgb = Color.parseColor("#DCFCE7");
            secSubArgb = Color.parseColor("#86EFAC");
            btnBgArgb = Color.parseColor("#10B981");
            btnTextArgb = Color.parseColor("#052E16");
            inactiveDotArgb = Color.parseColor("#14532D");
        } else if ("notes".equals(mode)) {
            pageTitle = "ANTECKNINGAR";
            pageSub = "Tryck på anteckning för att läsa";
            bottomBtnText = "+ Anteckning";
            rawText = prefs.getString("notes_text", "Inga anteckningar ännu");
            screenBgArgb = Color.parseColor("#231B05");
            heroBgArgb = Color.parseColor("#FEF08A");
            heroTitleArgb = Color.parseColor("#422006");
            heroSubArgb = Color.parseColor("#713F12");
            secBgArgb = Color.parseColor("#713F12");
            secTitleArgb = Color.parseColor("#FEF9C3");
            secSubArgb = Color.parseColor("#FDE047");
            btnBgArgb = Color.parseColor("#EAB308");
            btnTextArgb = Color.parseColor("#422006");
            inactiveDotArgb = Color.parseColor("#713F12");
        } else {
            pageTitle = "BUDGET";
            pageSub = "Månadsöversikt & utgifter";
            bottomBtnText = "+ Utgift";
            rawText = prefs.getString("budget_text", "Inga utgifter registrerade");
            screenBgArgb = Color.parseColor("#1B102E");
            heroBgArgb = Color.parseColor("#C4B5FD");
            heroTitleArgb = Color.parseColor("#1E1B4B");
            heroSubArgb = Color.parseColor("#4C1D95");
            secBgArgb = Color.parseColor("#3B0764");
            secTitleArgb = Color.parseColor("#E9D5FF");
            secSubArgb = Color.parseColor("#C4B5FD");
            btnBgArgb = Color.parseColor("#A855F7");
            btnTextArgb = Color.parseColor("#FFFFFF");
            inactiveDotArgb = Color.parseColor("#4C1D95");
        }

        currentScreenBgArgb = screenBgArgb;
        if (!isAnimatingPage) {
            outerRoot.setBackgroundColor(screenBgArgb);
            rootScroll.setBackgroundColor(screenBgArgb);
        }
        pageTitleTv.setText(pageTitle);
        pageTitleTv.setTextColor(heroBgArgb);
        pageSubTv.setText(pageSub);
        pageSubTv.setTextColor(secSubArgb);

        // Render horizontal 5 Page Dots at the top of the watch screen
        if (dotsRow != null) {
            dotsRow.removeAllViews();
            for (int i = 0; i < PAGES.length; i++) {
                boolean isCurrent = (i == activePageIdx);
                View dot = new View(this);
                LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(
                    dp(isCurrent ? 16f : 5.5f),
                    dp(5.5f)
                );
                dlp.leftMargin = dp(2.5f);
                dlp.rightMargin = dp(2.5f);
                dot.setLayoutParams(dlp);
                dot.setBackground(roundedShape(isCurrent ? heroBgArgb : inactiveDotArgb, 0, 999f));
                dotsRow.addView(dot);
            }
        }

        // Style bottom Material 3 Expressive tonal action buttons
        primaryBottomBtn.setText(bottomBtnText);
        primaryBottomBtn.setTextColor(heroTitleArgb);
        primaryBottomBtn.setBackground(roundedShape(heroBgArgb, 0, 999f));

        voiceBottomBtn.setTextColor(secTitleArgb);
        voiceBottomBtn.setBackground(roundedShape(secBgArgb, 0, 999f));

        accountFooterBtn.setTextColor(secSubArgb);
        accountFooterBtn.setBackground(roundedShape(secBgArgb, 0, 999f));

        List<String> lines = new ArrayList<>();
        if (!HemWidgetBridge.isEmptyStateMessage(rawText)) {
            for (String s : rawText.trim().split("\\\\r?\\\\n")) {
                String clean = s.trim();
                if (clean.startsWith("•")) clean = clean.substring(1).trim();
                if (!clean.isEmpty()) lines.add(clean);
            }
        }

        if ("budget".equals(mode)) {
            String remVal = HemWidgetBridge.getBudgetRemainingDisplay(prefs);
            String spentVal = HemWidgetBridge.getBudgetSpentDisplay(prefs);

            LinearLayout heroCard = new LinearLayout(this);
            heroCard.setOrientation(LinearLayout.VERTICAL);
            heroCard.setPadding(dp(15), dp(12), dp(15), dp(12));
            heroCard.setBackground(roundedShape(heroBgArgb, 0, 22f));
            LinearLayout.LayoutParams heroLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            heroLp.bottomMargin = dp(7);

            TextView labelTv = new TextView(this);
            labelTv.setText("KVAR ATT ANVÄNDA");
            labelTv.setTextSize(10f);
            labelTv.setTypeface(robotoBold);
            labelTv.setTextColor(heroSubArgb);
            heroCard.addView(labelTv);

            TextView amountTv = new TextView(this);
            amountTv.setText(remVal);
            amountTv.setTextSize(20f);
            amountTv.setTypeface(robotoBold);
            amountTv.setTextColor(heroTitleArgb);
            heroCard.addView(amountTv);

            TextView spentTv = new TextView(this);
            spentTv.setText("Utgifter denna månad: " + spentVal);
            spentTv.setTextSize(11f);
            spentTv.setTypeface(robotoMedium);
            spentTv.setTextColor(heroSubArgb);
            heroCard.addView(spentTv);

            listContainer.addView(heroCard, heroLp);

            for (String expLine : lines) {
                String expTitle = expLine;
                String expAmt = "";
                int pipeIdx = expLine.indexOf("||");
                int dashIdx = expLine.indexOf(" — ");
                if (pipeIdx > 0) {
                    expTitle = expLine.substring(0, pipeIdx).trim();
                    expAmt = expLine.substring(pipeIdx + 2).trim();
                } else if (dashIdx > 0) {
                    expTitle = expLine.substring(0, dashIdx).trim();
                    expAmt = expLine.substring(dashIdx + 3).trim();
                }

                LinearLayout secCard = new LinearLayout(this);
                secCard.setOrientation(LinearLayout.HORIZONTAL);
                secCard.setGravity(Gravity.CENTER_VERTICAL);
                secCard.setPadding(dp(14), dp(10), dp(14), dp(10));
                secCard.setBackground(roundedShape(secBgArgb, 0, 20f));
                LinearLayout.LayoutParams secLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                secLp.bottomMargin = dp(6);

                TextView tTv = new TextView(this);
                tTv.setText(expTitle);
                tTv.setTextSize(13f);
                tTv.setTypeface(robotoBold);
                tTv.setTextColor(secTitleArgb);
                secCard.addView(tTv, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

                if (!expAmt.isEmpty()) {
                    TextView aTv = new TextView(this);
                    aTv.setText(expAmt);
                    aTv.setTextSize(12f);
                    aTv.setTypeface(robotoBold);
                    aTv.setTextColor(secSubArgb);
                    secCard.addView(aTv);
                }

                listContainer.addView(secCard, secLp);
            }
            return;
        }

        if (lines.isEmpty()) {
            LinearLayout emptyCard = new LinearLayout(this);
            emptyCard.setOrientation(LinearLayout.VERTICAL);
            emptyCard.setGravity(Gravity.CENTER);
            emptyCard.setPadding(dp(16), dp(16), dp(16), dp(16));
            emptyCard.setBackground(roundedShape(secBgArgb, 0, 20f));

            TextView emptyTv = new TextView(this);
            emptyTv.setText(rawText);
            emptyTv.setTextSize(13f);
            emptyTv.setTypeface(robotoBold);
            emptyTv.setTextColor(secTitleArgb);
            emptyTv.setGravity(Gravity.CENTER);
            emptyCard.addView(emptyTv);

            listContainer.addView(emptyCard);
            return;
        }

        // Render ALL list items with the exact same uniform card style (no first-item highlight!)
        for (int idx = 0; idx < lines.size(); idx++) {
            final String rawItemLine = lines.get(idx);

            if ("calendar".equals(mode)) {
                String workingLine = rawItemLine;
                int catColorArgb = secBgArgb;
                int colorSep = workingLine.lastIndexOf("||");
                if (colorSep > 0) {
                    String hex = workingLine.substring(colorSep + 2).trim();
                    catColorArgb = parseCategoryColor(hex, secBgArgb);
                    workingLine = workingLine.substring(0, colorSep).trim();
                }

                String dateTimePart = "Idag";
                String titlePart = workingLine;
                int dashIdx = workingLine.indexOf(" — ");
                if (dashIdx > 0) {
                    dateTimePart = workingLine.substring(0, dashIdx).trim().replace("|", " · ");
                    titlePart = workingLine.substring(dashIdx + 3).trim();
                }

                LinearLayout calCard = new LinearLayout(this);
                calCard.setOrientation(LinearLayout.VERTICAL);
                calCard.setPadding(dp(14), dp(10), dp(14), dp(10));
                calCard.setBackground(roundedShape(catColorArgb, 0, 20f));
                LinearLayout.LayoutParams calLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                calLp.bottomMargin = dp(6);

                TextView dtTv = new TextView(this);
                dtTv.setText(dateTimePart.toUpperCase(Locale.forLanguageTag("sv-SE")));
                dtTv.setTextSize(10f);
                dtTv.setTypeface(robotoBold);
                dtTv.setTextColor(Color.parseColor("#E2E8F0"));
                calCard.addView(dtTv);

                TextView tTv = new TextView(this);
                tTv.setText(titlePart);
                tTv.setTextSize(13.5f);
                tTv.setTypeface(robotoBold);
                tTv.setTextColor(Color.WHITE);
                LinearLayout.LayoutParams tLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                tLp.topMargin = dp(2);
                calCard.addView(tTv, tLp);

                listContainer.addView(calCard, calLp);
                continue;
            }

            if ("notes".equals(mode)) {
                String noteTitle = rawItemLine;
                String noteBody = "";
                int pipeIdx = rawItemLine.indexOf("||");
                int dashIdx = rawItemLine.indexOf(" — ");
                if (pipeIdx > 0) {
                    noteTitle = rawItemLine.substring(0, pipeIdx).trim();
                    noteBody = rawItemLine.substring(pipeIdx + 2).trim();
                } else if (dashIdx > 0) {
                    noteTitle = rawItemLine.substring(0, dashIdx).trim();
                    noteBody = rawItemLine.substring(dashIdx + 3).trim();
                }
                final String dialogTitle = noteTitle;
                final String dialogBody = noteBody;
                String previewSingleLine = noteBody.replace(" · ", " ").trim();

                LinearLayout noteCard = new LinearLayout(this);
                noteCard.setOrientation(LinearLayout.VERTICAL);
                noteCard.setPadding(dp(14), dp(10), dp(14), dp(10));
                noteCard.setBackground(roundedShape(secBgArgb, 0, 20f));
                LinearLayout.LayoutParams noteLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                noteLp.bottomMargin = dp(6);

                TextView tTv = new TextView(this);
                tTv.setText(noteTitle);
                tTv.setTextSize(13.5f);
                tTv.setTypeface(robotoBold);
                tTv.setTextColor(secTitleArgb);
                noteCard.addView(tTv);

                if (!previewSingleLine.isEmpty()) {
                    TextView pTv = new TextView(this);
                    pTv.setText(previewSingleLine);
                    pTv.setTextSize(11.5f);
                    pTv.setTypeface(robotoRegular);
                    pTv.setTextColor(secSubArgb);
                    pTv.setMaxLines(2);
                    LinearLayout.LayoutParams pLp = new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    );
                    pLp.topMargin = dp(2);
                    noteCard.addView(pTv, pLp);
                }

                noteCard.setOnClickListener(v -> showNoteDetailDialog(dialogTitle, dialogBody));

                listContainer.addView(noteCard, noteLp);
                continue;
            }

            // Shopping & Todo Cards: uniform card style + unchecked hollow circle ring
            String workingLine = rawItemLine;
            int colorSep = workingLine.lastIndexOf("||");
            if (colorSep > 0) {
                workingLine = workingLine.substring(0, colorSep).trim();
            }

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(dp(14), dp(10), dp(14), dp(10));
            row.setBackground(roundedShape(secBgArgb, 0, 20f));
            LinearLayout.LayoutParams rowLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            rowLp.bottomMargin = dp(6);

            String cleanTitle = workingLine;
            String metaBadge = "";
            int parenIdx = workingLine.lastIndexOf(" (");
            if (parenIdx > 0 && workingLine.endsWith(")")) {
                cleanTitle = workingLine.substring(0, parenIdx).trim();
                metaBadge = workingLine.substring(parenIdx + 2, workingLine.length() - 1).trim();
            }
            final String itemTitleForAction = cleanTitle;

            LinearLayout textCol = new LinearLayout(this);
            textCol.setOrientation(LinearLayout.VERTICAL);

            TextView titleTv = new TextView(this);
            titleTv.setText(cleanTitle);
            titleTv.setTextSize(13.5f);
            titleTv.setTypeface(robotoBold);
            titleTv.setTextColor(secTitleArgb);
            textCol.addView(titleTv);

            if (!metaBadge.isEmpty()) {
                TextView metaTv = new TextView(this);
                metaTv.setText(metaBadge);
                metaTv.setTextSize(11f);
                metaTv.setTypeface(robotoMedium);
                metaTv.setTextColor(secSubArgb);
                textCol.addView(metaTv);
            }

            row.addView(textCol, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

            View checkCircle = new View(this);
            checkCircle.setBackground(roundedShape(0x00000000, secSubArgb, 999f));
            LinearLayout.LayoutParams chkLp = new LinearLayout.LayoutParams(dp(22), dp(22));
            chkLp.leftMargin = dp(8);
            row.addView(checkCircle, chkLp);

            row.setOnClickListener(v -> {
                HemWidgetBridge.handleWidgetToggleItem(getApplicationContext(), mode, rawItemLine, itemTitleForAction);
                Toast.makeText(this, "✓ " + itemTitleForAction, Toast.LENGTH_SHORT).show();
                refreshWatchContent();
            });

            listContainer.addView(row, rowLp);
        }
    }

    private void launchVoiceAdd() {
        try {
            String mode = getActiveTab();
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "sv-SE");
            String prompt = "Säg vad du vill lägga till...";
            if ("shopping".equals(mode)) prompt = "Säg en vara att handla...";
            else if ("todo".equals(mode)) prompt = "Säg en ny uppgift...";
            else if ("notes".equals(mode)) prompt = "Diktera en anteckning...";
            else if ("calendar".equals(mode)) prompt = "Säg en kalenderhändelse...";
            else if ("budget".equals(mode)) prompt = "Säg utgift och belopp...";
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, prompt);
            startActivityForResult(intent, REQ_VOICE_ADD);
        } catch (Throwable e) {
            showQuickAddDialogForActivePage();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_VOICE_ADD && resultCode == RESULT_OK && data != null) {
            ArrayList<String> matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (matches != null && !matches.isEmpty()) {
                String spoken = matches.get(0).trim();
                if (!spoken.isEmpty()) {
                    String mode = getActiveTab();
                    if ("todo".equals(mode)) {
                        HemWidgetBridge.handleWidgetQuickAddTodoItem(getApplicationContext(), spoken);
                    } else if ("notes".equals(mode)) {
                        HemWidgetBridge.handleWidgetQuickAddNoteItem(getApplicationContext(), spoken, spoken);
                    } else if ("calendar".equals(mode)) {
                        HemWidgetBridge.handleWidgetQuickAddCalendarEvent(getApplicationContext(), spoken, "12:00");
                    } else if ("budget".equals(mode)) {
                        String digits = spoken.replaceAll("[^0-9]", "");
                        String amtStr = digits.isEmpty() ? "100" : digits;
                        HemWidgetBridge.handleWidgetQuickAddBudgetExpense(getApplicationContext(), spoken, amtStr);
                    } else {
                        HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), spoken, "1", "st");
                    }
                    Toast.makeText(this, "Lade till: " + spoken, Toast.LENGTH_SHORT).show();
                    refreshWatchContent();
                }
            }
        }
    }

    private void showQuickAddDialogForActivePage() {
        String mode = getActiveTab();
        AlertDialog.Builder builder = new AlertDialog.Builder(this);

        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(14), dp(8), dp(14), dp(4));

        final EditText primaryInput = new EditText(this);
        primaryInput.setSingleLine(true);
        primaryInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);

        final EditText secondaryInput = new EditText(this);
        secondaryInput.setSingleLine(true);

        if ("calendar".equals(mode)) {
            builder.setTitle("Ny händelse");
            primaryInput.setHint("Titel (t.ex. Middag)");
            secondaryInput.setHint("Tid (t.ex. 18:00)");
            secondaryInput.setText("18:00");
            form.addView(primaryInput);
            form.addView(secondaryInput);
        } else if ("shopping".equals(mode)) {
            builder.setTitle("Lägg till vara");
            primaryInput.setHint("T.ex. Havremjölk");
            secondaryInput.setHint("Mängd (t.ex. 2)");
            secondaryInput.setText("1");
            form.addView(primaryInput);
            form.addView(secondaryInput);
        } else if ("todo".equals(mode)) {
            builder.setTitle("Ny uppgift");
            primaryInput.setHint("T.ex. Vattna blommorna");
            form.addView(primaryInput);
        } else if ("notes".equals(mode)) {
            builder.setTitle("Ny anteckning");
            primaryInput.setHint("Rubrik");
            secondaryInput.setHint("Innehåll...");
            form.addView(primaryInput);
            form.addView(secondaryInput);
        } else {
            builder.setTitle("Ny utgift");
            primaryInput.setHint("Vad? (t.ex. Lunch, ICA)");
            secondaryInput.setHint("Belopp i kr (t.ex. 145)");
            secondaryInput.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
            form.addView(primaryInput);
            form.addView(secondaryInput);
        }

        builder.setView(form);

        builder.setPositiveButton("Spara", (dialog, which) -> {
            String val1 = primaryInput.getText().toString().trim();
            String val2 = secondaryInput.getText().toString().trim();
            if (val1.isEmpty()) return;

            if ("calendar".equals(mode)) {
                HemWidgetBridge.handleWidgetQuickAddCalendarEvent(getApplicationContext(), val1, val2.isEmpty() ? "12:00" : val2);
            } else if ("shopping".equals(mode)) {
                HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), val1, val2.isEmpty() ? "1" : val2, "st");
            } else if ("todo".equals(mode)) {
                HemWidgetBridge.handleWidgetQuickAddTodoItem(getApplicationContext(), val1);
            } else if ("notes".equals(mode)) {
                HemWidgetBridge.handleWidgetQuickAddNoteItem(getApplicationContext(), val1, val2.isEmpty() ? val1 : val2);
            } else {
                String amtStr = val2.replace(",", ".").replaceAll("[^0-9.]", "");
                if (amtStr.isEmpty()) amtStr = "100";
                HemWidgetBridge.handleWidgetQuickAddBudgetExpense(getApplicationContext(), val1, amtStr);
            }
            Toast.makeText(this, "Sparat: " + val1, Toast.LENGTH_SHORT).show();
            refreshWatchContent();
        });

        builder.setNegativeButton("Avbryt", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    private void showAccountDialog() {
        SharedPreferences syncPrefs = getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
        String currentEmail = syncPrefs.getString("email", "filipcarlberg91@gmail.com");

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Hushållskonto (E-post)");
        final EditText input = new EditText(this);
        input.setText(currentEmail);
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
        builder.setView(input);

        builder.setPositiveButton("Spara & Synka", (dialog, which) -> {
            String newEmail = input.getText().toString().trim().toLowerCase();
            if (!newEmail.isEmpty()) {
                syncPrefs.edit().putString("email", newEmail).apply();
                accountFooterBtn.setText("↻ Synka · " + newEmail);
                triggerCloudSync(true);
            }
        });
        builder.setNegativeButton("Avbryt", (dialog, which) -> dialog.cancel());
        builder.show();
    }
}
`;

fs.writeFileSync(path.join(javaDir, 'HemAlarmReceiver.java'), hemAlarmReceiverJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemSyncService.java'), hemSyncServiceJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemMediaListenerService.java'), hemMediaListenerServiceJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemNativeBridge.java'), hemNativeBridgeJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemWidgetBridge.java'), hemWidgetBridgeJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemWidgetService.java'), hemWidgetServiceJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemQuickAddActivity.java'), hemQuickAddActivityJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemCalendarWidget.java'), hemCalendarWidgetJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemShoppingWidget.java'), hemShoppingWidgetJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemTodoWidget.java'), hemTodoWidgetJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemTileHelper.java'), hemTileHelperJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemShoppingTileService.java'), hemShoppingTileServiceJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemCalendarTileService.java'), hemCalendarTileServiceJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemTodoTileService.java'), hemTodoTileServiceJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemNotesTileService.java'), hemNotesTileServiceJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemBudgetTileService.java'), hemBudgetTileServiceJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'HemWearActivity.java'), hemWearActivityJava, 'utf8');
fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), mainActivityJava, 'utf8');

// Write Material 3 Expressive Widget XML resources (drawables, layout, and appwidget-provider info)
const resDrawableDir = path.resolve('android/app/src/main/res/drawable');
const resLayoutDir = path.resolve('android/app/src/main/res/layout');
const resXmlDir = path.resolve('android/app/src/main/res/xml');
const resValuesDir = path.resolve('android/app/src/main/res/values');
fs.mkdirSync(resDrawableDir, { recursive: true });
fs.mkdirSync(resLayoutDir, { recursive: true });
fs.mkdirSync(resXmlDir, { recursive: true });
fs.mkdirSync(resValuesDir, { recursive: true });

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_tile_preview.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <solid android:color="#183D2C" />
    <stroke android:width="3dp" android:color="#A6F2C6" />
    <size android:width="96dp" android:height="96dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_surface.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#F0F3F8" />
    <corners android:radius="24dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_inner_card.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <corners android:radius="18dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_row_card.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#00FFFFFF" />
    <corners android:radius="12dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_cal_card_shape.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <corners android:radius="14dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_cal_today_circle.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <solid android:color="#242942" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_tasks_circle.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <solid android:color="#00000000" />
    <stroke android:width="2dp" android:color="#444746" />
    <size android:width="20dp" android:height="20dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_icon_squircle.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <solid android:color="#242942" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_pill.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <solid android:color="#00000000" />
    <stroke android:width="2dp" android:color="#444746" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_meta_pill.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#00000000" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_add_circle.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#242942" />
    <corners android:radius="999dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_badge.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#242942" />
    <corners android:radius="999dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resLayoutDir, 'hem_widget_calendar_row.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/hem_cal_row_root"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:gravity="top">

    <!-- Left Day Indicator Column (Google Calendar Schedule Style) -->
    <FrameLayout
        android:id="@+id/hem_cal_day_col"
        android:layout_width="40dp"
        android:layout_height="38dp"
        android:layout_marginEnd="6dp">

        <ImageView
            android:id="@+id/hem_cal_day_badge_bg"
            android:layout_width="36dp"
            android:layout_height="36dp"
            android:layout_gravity="center"
            android:src="@drawable/hem_widget_cal_today_circle"
            android:visibility="visible" />

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:gravity="center"
            android:orientation="vertical">

            <TextView
                android:id="@+id/hem_cal_day_dow"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:includeFontPadding="false"
                android:singleLine="true"
                android:text="Mån"
                android:textColor="#FFFFFF"
                android:textSize="9sp"
                android:textStyle="bold" />

            <TextView
                android:id="@+id/hem_cal_day_num"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:includeFontPadding="false"
                android:singleLine="true"
                android:text="22"
                android:textColor="#FFFFFF"
                android:textSize="12.5sp"
                android:textStyle="bold" />
        </LinearLayout>
    </FrameLayout>

    <!-- Right Colored Event Card -->
    <FrameLayout
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:minHeight="38dp">

        <ImageView
            android:id="@+id/hem_cal_row_bg_img"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:scaleType="fitXY"
            android:src="@drawable/hem_widget_m3_cal_card_shape" />

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_gravity="center_vertical"
            android:orientation="vertical"
            android:paddingLeft="12dp"
            android:paddingTop="7dp"
            android:paddingRight="12dp"
            android:paddingBottom="7dp">

            <TextView
                android:id="@+id/hem_cal_row_title"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:ellipsize="end"
                android:singleLine="true"
                android:text="Händelse"
                android:textColor="#FFFFFF"
                android:textSize="13.5sp"
                android:textStyle="bold" />

            <TextView
                android:id="@+id/hem_cal_row_datetime"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="1dp"
                android:ellipsize="end"
                android:singleLine="true"
                android:text="14:30–15:30"
                android:textColor="#EBFFFFFF"
                android:textSize="11.5sp" />
        </LinearLayout>
    </FrameLayout>
</LinearLayout>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resLayoutDir, 'hem_widget_item_row.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/hem_widget_item_row_root"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:background="@drawable/hem_widget_m3_row_card"
    android:gravity="center_vertical"
    android:orientation="horizontal"
    android:paddingLeft="4dp"
    android:paddingTop="7dp"
    android:paddingRight="6dp"
    android:paddingBottom="7dp">

    <!-- Google Tasks Style Hollow Radio Circle -->
    <TextView
        android:id="@+id/hem_widget_item_pill"
        android:layout_width="20dp"
        android:layout_height="20dp"
        android:background="@drawable/hem_widget_tasks_circle"
        android:gravity="center"
        android:text=""
        android:textColor="#444746"
        android:textSize="10sp" />

    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginStart="12dp"
        android:layout_weight="1"
        android:orientation="vertical">

        <TextView
            android:id="@+id/hem_widget_item_title"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:ellipsize="end"
            android:singleLine="true"
            android:text=""
            android:textColor="#1C1F26"
            android:textSize="14.5sp" />

        <TextView
            android:id="@+id/hem_widget_item_meta"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="1dp"
            android:singleLine="true"
            android:text=""
            android:textColor="#5F6368"
            android:textSize="11.5sp"
            android:visibility="gone" />
    </LinearLayout>
</LinearLayout>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resLayoutDir, 'hem_widget_m3.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/hem_widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@drawable/hem_widget_m3_surface"
    android:paddingLeft="14dp"
    android:paddingTop="13dp"
    android:paddingRight="14dp"
    android:paddingBottom="12dp">

    <!-- Clean Google Calendar / Google Tasks Header -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:id="@+id/hem_widget_icon_badge"
            android:layout_width="24dp"
            android:layout_height="24dp"
            android:layout_marginEnd="8dp"
            android:background="@drawable/hem_widget_m3_icon_squircle"
            android:gravity="center"
            android:text="✓"
            android:textColor="#FFFFFF"
            android:textSize="13sp"
            android:textStyle="bold" />

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:orientation="vertical">

            <TextView
                android:id="@+id/hem_widget_subtitle"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="HEM"
                android:textColor="#5F6368"
                android:textSize="9.5sp"
                android:textStyle="bold"
                android:visibility="gone" />

            <TextView
                android:id="@+id/hem_widget_title"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Oktober"
                android:textColor="#1C1F26"
                android:textSize="18sp"
                android:textStyle="bold" />
        </LinearLayout>

        <TextView
            android:id="@+id/hem_widget_badge"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:background="@drawable/hem_widget_m3_badge"
            android:paddingLeft="10dp"
            android:paddingRight="10dp"
            android:paddingTop="4dp"
            android:paddingBottom="4dp"
            android:text="0"
            android:textColor="#FFFFFF"
            android:textSize="11sp"
            android:textStyle="bold"
            android:visibility="gone" />

        <TextView
            android:id="@+id/hem_widget_add_btn"
            android:layout_width="44dp"
            android:layout_height="30dp"
            android:layout_marginStart="6dp"
            android:background="@drawable/hem_widget_m3_add_circle"
            android:gravity="center"
            android:text="+"
            android:textColor="#FFFFFF"
            android:textSize="18sp" />
    </LinearLayout>

    <!-- Scrollable ListView for All Items in Widget -->
    <ListView
        android:id="@+id/hem_widget_listview"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:layout_marginTop="10dp"
        android:divider="@android:color/transparent"
        android:dividerHeight="5dp"
        android:scrollbars="vertical" />

    <!-- Clean Empty State Card -->
    <LinearLayout
        android:id="@+id/hem_widget_empty_card"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:layout_marginTop="10dp"
        android:background="@drawable/hem_widget_m3_inner_card"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="12dp"
        android:visibility="gone">

        <TextView
            android:id="@+id/hem_widget_empty_icon"
            android:layout_width="32dp"
            android:layout_height="32dp"
            android:background="@drawable/hem_widget_m3_badge"
            android:gravity="center"
            android:text="✓"
            android:textColor="#FFFFFF"
            android:textSize="15sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/hem_widget_body"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:gravity="center"
            android:text="Alla uppgifter är avklarade!"
            android:textColor="#1C1F26"
            android:textSize="13.5sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/hem_widget_empty_sub"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="2dp"
            android:gravity="center"
            android:text="Tryck på + för att lägga till"
            android:textColor="#5F6368"
            android:textSize="11sp" />
    </LinearLayout>
</LinearLayout>
`,
  'utf8'
);

const buildWidgetInfoXml = () => `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="110dp"
    android:targetCellWidth="3"
    android:targetCellHeight="2"
    android:minResizeWidth="110dp"
    android:minResizeHeight="80dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/hem_widget_m3"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
`;

fs.writeFileSync(path.join(resXmlDir, 'hem_calendar_widget_info.xml'), buildWidgetInfoXml(), 'utf8');
fs.writeFileSync(path.join(resXmlDir, 'hem_shopping_widget_info.xml'), buildWidgetInfoXml(), 'utf8');
fs.writeFileSync(path.join(resXmlDir, 'hem_todo_widget_info.xml'), buildWidgetInfoXml(), 'utf8');
fs.writeFileSync(
  path.join(resXmlDir, 'network_security_config.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
`,
  'utf8'
);


// 1. Ensure minSdkVersion >= 26 in android/variables.gradle and android/app/build.gradle for Wear OS Tiles
// and enable R8 DEX code shrinking, optimization & obfuscation + Wear OS Tile dependencies
const variablesGradlePath = path.resolve('android/variables.gradle');
if (fs.existsSync(variablesGradlePath)) {
  let varsContent = fs.readFileSync(variablesGradlePath, 'utf8');
  varsContent = varsContent.replace(/minSdkVersion\s*=\s*2[0-4]/g, 'minSdkVersion = 26');
  fs.writeFileSync(variablesGradlePath, varsContent, 'utf8');
}

const appBuildGradlePath = path.resolve('android/app/build.gradle');
if (fs.existsSync(appBuildGradlePath)) {
  let gradleContent = fs.readFileSync(appBuildGradlePath, 'utf8');
  gradleContent = gradleContent.replace(
    /minSdkVersion\s+rootProject\.ext\.minSdkVersion/g,
    'minSdkVersion 26'
  );
  gradleContent = gradleContent.replace(
    /minSdkVersion\s+2[0-4]/g,
    'minSdkVersion 26'
  );
  gradleContent = gradleContent.replace(
    /minifyEnabled\s+false/g,
    'minifyEnabled true\n            shrinkResources true'
  );
  gradleContent = gradleContent.replace(
    /getDefaultProguardFile\(['"]proguard-android\.txt['"]\)/g,
    "getDefaultProguardFile('proguard-android-optimize.txt')"
  );
  if (!gradleContent.includes('androidx.wear.tiles:tiles')) {
    gradleContent = gradleContent.replace(
      /dependencies\s*\{/,
      "dependencies {\n    implementation 'androidx.wear.tiles:tiles:1.5.0'\n    implementation 'androidx.wear.tiles:tiles-proto:1.5.0'\n    implementation 'androidx.wear.protolayout:protolayout:1.3.0'\n    implementation 'androidx.wear.protolayout:protolayout-proto:1.3.0'\n    implementation 'com.google.guava:guava:31.1-android'"
    );
  } else {
    gradleContent = gradleContent.replace(
      /androidx\.wear\.tiles:tiles:[0-9A-Za-z.-]+/g,
      'androidx.wear.tiles:tiles:1.5.0'
    );
  }
  fs.writeFileSync(appBuildGradlePath, gradleContent, 'utf8');
}

// 2. Write R8 / ProGuard rules that keep Hem native bridge, Wear OS Tiles & Capacitor entry points
const proguardPath = path.resolve('android/app/proguard-rules.pro');
const proguardRules = `# Keep JavascriptInterface annotations and methods for WebView bridge
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-keepattributes Signature,InnerClasses,EnclosingMethod

# Keep Hem native classes and JavascriptInterface methods intact
-keep class se.carlberg.hem.** { *; }
-keepclassmembers class se.carlberg.hem.** {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Wear OS TileService & ProtoLayout classes intact
-keep class androidx.wear.tiles.** { *; }
-keep class androidx.wear.protolayout.** { *; }
-keepclassmembers class * extends androidx.wear.protolayout.protobuf.GeneratedMessageLite {
    <fields>;
}

# Keep Capacitor core Activity and Plugin entry points
-keep class com.getcapacitor.BridgeActivity { *; }
-keep class com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
    @com.getcapacitor.PluginMethod <methods>;
}

-dontwarn com.google.android.**
-dontwarn com.google.common.**
-dontwarn androidx.**
-dontwarn org.chromium.**
`;
fs.writeFileSync(proguardPath, proguardRules, 'utf8');

// 3. Ensure styles.xml has no deprecated Android 15 edge-to-edge statusBarColor / navigationBarColor parameters
// and define HemWearTheme with windowSwipeToDismiss=false so left-to-right swipes switch watch pages instead of closing the app
const wearValuesDir = path.resolve('android/app/src/main/res/values');
fs.mkdirSync(wearValuesDir, { recursive: true });
const wearStylesXmlPath = path.join(wearValuesDir, 'hem_wear_styles.xml');
const wearThemeXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="HemWearTheme" parent="@android:style/Theme.DeviceDefault.NoActionBar">
        <item name="android:windowSwipeToDismiss">false</item>
        <item name="android:windowIsTranslucent">false</item>
        <item name="android:windowBackground">@android:color/black</item>
    </style>
</resources>
`;
fs.writeFileSync(wearStylesXmlPath, wearThemeXmlContent, 'utf8');

const wearWatchValuesDir = path.resolve('android/app/src/main/res/values-watch');
fs.mkdirSync(wearWatchValuesDir, { recursive: true });
fs.writeFileSync(
  path.join(wearWatchValuesDir, 'hem_wear_styles.xml'),
  wearThemeXmlContent,
  'utf8'
);

const stylesXmlPath = path.resolve('android/app/src/main/res/values/styles.xml');
if (fs.existsSync(stylesXmlPath)) {
  let stylesXml = fs.readFileSync(stylesXmlPath, 'utf8');
  stylesXml = stylesXml
    .replace(/<item name="android:statusBarColor">.*?<\/item>/g, '')
    .replace(/<item name="android:navigationBarColor">.*?<\/item>/g, '')
    .replace(/<item name="android:windowTranslucentStatus">.*?<\/item>/g, '')
    .replace(/<item name="android:windowTranslucentNavigation">.*?<\/item>/g, '');
  if (!stylesXml.includes('android:windowSwipeToDismiss')) {
    stylesXml = stylesXml.replace(
      /(<style name="AppTheme\.NoActionBar"[^>]*>)/,
      '$1\n        <item name="android:windowSwipeToDismiss">false</item>'
    );
  }
  fs.writeFileSync(stylesXmlPath, stylesXml, 'utf8');
}

console.log('Successfully generated native Android background sync classes, Wear OS Tiles, and R8 DEX optimization config.');


