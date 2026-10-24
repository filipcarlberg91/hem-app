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
      '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-permission android:name="android.permission.WAKE_LOCK" />\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />\n    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />\n    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" tools:node="remove" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" tools:node="remove" />\n    <uses-permission android:name="android.permission.USE_EXACT_ALARM" tools:node="remove" />\n    <application'
    );
  }
  if (!manifest.includes('.HemSyncService')) {
    manifest = manifest.replace(
      '</application>',
      '    <service android:name=".HemSyncService" android:enabled="true" android:exported="false" android:stopWithTask="false" />\n        <receiver android:name=".HemAlarmReceiver" android:enabled="true" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\n                <action android:name="se.carlberg.hem.ACTION_BACKGROUND_POLL" />\n            </intent-filter>\n        </receiver>\n    </application>'
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
      '        <activity android:name=".HemWearActivity" android:exported="true" android:label="Hem Klocka" android:taskAffinity="" android:theme="@android:style/Theme.DeviceDefault.NoActionBar" />\n        <service android:name=".HemShoppingTileService" android:label="Hem – Inköpslista" android:description="@string/app_name" android:icon="@mipmap/ic_launcher" android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER" android:exported="true">\n            <intent-filter>\n                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />\n            </intent-filter>\n            <meta-data android:name="androidx.wear.tiles.PREVIEW" android:resource="@drawable/hem_tile_preview" />\n        </service>\n        <service android:name=".HemCalendarTileService" android:label="Hem – Kalender" android:description="@string/app_name" android:icon="@mipmap/ic_launcher" android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER" android:exported="true">\n            <intent-filter>\n                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />\n            </intent-filter>\n            <meta-data android:name="androidx.wear.tiles.PREVIEW" android:resource="@drawable/hem_tile_preview" />\n        </service>\n        <service android:name=".HemTodoTileService" android:label="Hem – Att göra" android:description="@string/app_name" android:icon="@mipmap/ic_launcher" android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER" android:exported="true">\n            <intent-filter>\n                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />\n            </intent-filter>\n            <meta-data android:name="androidx.wear.tiles.PREVIEW" android:resource="@drawable/hem_tile_preview" />\n        </service>\n    </application>'
    );
  }
  if (isWearOsBuild) {
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
                    String moduleDocKey = "shopping".equals(targetTab) ? "ws_doc_shopping" : "ws_doc_todo";
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
                        JSONArray arr = slice.optJSONArray("shopping".equals(targetTab) ? "shopping" : "todos");
                        if (arr != null && arr.length() > 0) {
                            break;
                        }
                    }

                    if (chosenDocId == null || chosenSlice == null) return;

                    boolean modified = false;
                    String nowIso = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(new java.util.Date());
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
                        newTodo.put("createdAt", nowIso);
                        newTodo.put("updatedAt", nowIso);
                        JSONArray reordered = new JSONArray();
                        reordered.put(newTodo);
                        for (int i = 0; i < arr.length(); i++) reordered.put(arr.get(i));
                        chosenSlice.put("todos", reordered);
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
                        if (sArr != null && (bestShopping == null || (sArr.length() > 0 && (isSharedDoc || bestShopping.length() == 0)))) {
                            bestShopping = sArr;
                        }
                        JSONArray tArr = slice.optJSONArray("todos");
                        if (tArr != null && (bestTodos == null || (tArr.length() > 0 && (isSharedDoc || bestTodos.length() == 0)))) {
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

                        JSONArray sliceActions = slice.optJSONArray("recentActions");
                        if (sliceActions != null) {
                            actionArraysToScan.add(sliceActions);
                        }
                    } catch (Throwable ignored) {
                    }
                }

                if (bestShopping != null || bestTodos != null || bestEvents != null) {
                    JSONObject mergedSlice = new JSONObject();
                    if (bestShopping != null) mergedSlice.put("shopping", bestShopping);
                    if (bestTodos != null) mergedSlice.put("todos", bestTodos);
                    if (bestEvents != null) mergedSlice.put("events", bestEvents);
                    if (bestCategories != null) mergedSlice.put("categories", bestCategories);
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

const hemNativeBridgeJava = `package se.carlberg.hem;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.service.notification.StatusBarNotification;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;

import java.util.HashSet;
import java.util.Set;

public class HemNativeBridge {
    private final Context appContext;
    private final MainActivity mainActivity;

    public HemNativeBridge(MainActivity activity) {
        this.mainActivity = activity;
        this.appContext = activity.getApplicationContext();
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
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                this.getBridge().getWebView().addJavascriptInterface(new HemNativeBridge(this), "HemNativeBridge");
                this.getBridge().getWebView().addJavascriptInterface(new HemWidgetBridge(this), "HemWidgetBridge");
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
        try {
            SharedPreferences prefs = appContext.getSharedPreferences(PREFS_WIDGETS, Context.MODE_PRIVATE);
            String calB = (calendarBadge != null && !calendarBadge.isEmpty()) ? calendarBadge : countLinesBadge(calendarText, "0 st");
            String shopB = (shoppingBadge != null && !shoppingBadge.isEmpty()) ? shoppingBadge : countLinesBadge(shoppingText, "0 kvar");
            String todoB = (todoBadge != null && !todoBadge.isEmpty()) ? todoBadge : countLinesBadge(todoText, "0 kvar");
            prefs.edit()
                .putString("cal_text", calendarText != null ? calendarText : "Inga inplanerade händelser framöver")
                .putString("shop_text", shoppingText != null ? shoppingText : "Inköpslistan är tom")
                .putString("todo_text", todoText != null ? todoText : "Alla uppgifter är avklarade!")
                .putString("cal_badge", calB)
                .putString("shop_badge", shopB)
                .putString("todo_badge", todoB)
                .apply();
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
                        sb.append("• ").append(item.optString("title", ""));
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
                    String d = evt.optString("date", "");
                    String dayLabel = today.equals(d) ? "Idag" : (d.length() >= 10 ? d.substring(5) : d);
                    String startT = evt.optString("startTime", "");
                    String endT = evt.optString("endTime", "");
                    String timeRange = (!endT.isEmpty() && !endT.equals(startT)) ? (startT + "–" + endT) : startT;
                    String title = evt.optString("title", "");
                    String colorHex = resolveCategoryColorHex(evt, categoriesArr);
                    sb.append("• ").append(dayLabel).append(" ").append(timeRange).append(" — ").append(title).append("||").append(colorHex);
                }
                ed.putString("cal_text", upcomingCount > 0 ? sb.toString() : "Inga inplanerade händelser närmaste 2 veckorna");
                ed.putString("cal_badge", upcomingCount + " st");
                changed = true;
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

        String headerGlyph = "✦";
        if ("calendar".equals(targetTab)) headerGlyph = "📅";
        else if ("shopping".equals(targetTab)) headerGlyph = "🛒";
        else if ("todo".equals(targetTab)) headerGlyph = "✓";

        if (iconBadgeId != 0) {
            views.setTextViewText(iconBadgeId, headerGlyph);
        }
        views.setTextViewText(titleId, title);
        views.setTextViewText(subId, subtitle);
        views.setTextViewText(badgeId, badgeText);

        if (isEmptyStateMessage(bodyText)) {
            if (listViewId != 0) views.setViewVisibility(listViewId, View.GONE);
            if (emptyCardId != 0) views.setViewVisibility(emptyCardId, View.VISIBLE);
            if (emptyIconId != 0) {
                views.setTextViewText(emptyIconId, "todo".equals(targetTab) ? "✓" : headerGlyph);
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

        // "+" button on Shopping widget opens HemQuickAddActivity popup directly over home screen
        if (addBtnId != 0) {
            if ("shopping".equals(targetTab)) {
                Intent quickAddIntent = new Intent(ctx, HemQuickAddActivity.class);
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

import java.util.ArrayList;
import java.util.List;

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
                int bgImgId = ctx.getResources().getIdentifier("hem_cal_row_bg_img", "id", pkg);
                int dateTimeId = ctx.getResources().getIdentifier("hem_cal_row_datetime", "id", pkg);
                int titleId = ctx.getResources().getIdentifier("hem_cal_row_title", "id", pkg);

                String dateTimeText = "Idag";
                String eventTitleText = line;
                int dashIdx = line.indexOf(" — ");
                if (dashIdx > 0) {
                    dateTimeText = line.substring(0, dashIdx).trim();
                    eventTitleText = line.substring(dashIdx + 3).trim();
                }

                int parsedColor = Color.parseColor("#0066FF");
                try {
                    parsedColor = Color.parseColor(colorHex);
                } catch (Throwable ignored) {}

                if (bgImgId != 0) {
                    rv.setInt(bgImgId, "setColorFilter", parsedColor);
                }
                if (dateTimeId != 0) {
                    rv.setTextViewText(dateTimeId, dateTimeText);
                }
                if (titleId != 0) {
                    rv.setTextViewText(titleId, eventTitleText);
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

            String pillText = "shopping".equals(targetTab) ? "○" : "▢";
            String mainTitle = line;
            String metaText = "";

            int parenStart = line.lastIndexOf(" (");
            if (parenStart > 0 && line.endsWith(")")) {
                mainTitle = line.substring(0, parenStart).trim();
                metaText = line.substring(parenStart + 2, line.length() - 1).trim();
            }

            if (pillId != 0) rv.setTextViewText(pillId, pillText);
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
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
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

        float density = getResources().getDisplayMetrics().density;
        int pad = (int) (18 * density);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad, pad, pad);

        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(Color.parseColor("#EEF7F2"));
        cardBg.setCornerRadius(28 * density);
        cardBg.setStroke((int) (2 * density), Color.parseColor("#C3DFCF"));
        root.setBackground(cardBg);

        TextView subtitle = new TextView(this);
        subtitle.setText("HEM · INKÖPSLISTA WIDGET");
        subtitle.setTextSize(10f);
        subtitle.setTypeface(Typeface.DEFAULT_BOLD);
        subtitle.setTextColor(Color.parseColor("#4A6355"));
        root.addView(subtitle);

        TextView title = new TextView(this);
        title.setText("Lägg till vara direkt");
        title.setTextSize(18f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(Color.parseColor("#14291E"));
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        titleLp.topMargin = (int) (2 * density);
        titleLp.bottomMargin = (int) (12 * density);
        root.addView(title, titleLp);

        final EditText nameInput = new EditText(this);
        nameInput.setHint("T.ex. Mjölk, Bröd, Kaffe...");
        nameInput.setSingleLine(true);
        nameInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        nameInput.setImeOptions(EditorInfo.IME_ACTION_DONE);
        nameInput.setTextSize(14f);
        nameInput.setTextColor(Color.parseColor("#141E18"));
        nameInput.setHintTextColor(Color.parseColor("#6A8274"));
        int inputPadH = (int) (14 * density);
        int inputPadV = (int) (11 * density);
        nameInput.setPadding(inputPadH, inputPadV, inputPadH, inputPadV);
        GradientDrawable inputBg = new GradientDrawable();
        inputBg.setColor(Color.WHITE);
        inputBg.setCornerRadius(16 * density);
        inputBg.setStroke((int) (1.5f * density), Color.parseColor("#C3DFCF"));
        nameInput.setBackground(inputBg);
        root.addView(nameInput, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        final EditText amountInput = new EditText(this);
        amountInput.setHint("Antal (valfritt, t.ex. 2 st)");
        amountInput.setSingleLine(true);
        amountInput.setTextSize(13f);
        amountInput.setTextColor(Color.parseColor("#141E18"));
        amountInput.setHintTextColor(Color.parseColor("#6A8274"));
        amountInput.setPadding(inputPadH, inputPadV, inputPadH, inputPadV);
        GradientDrawable amountBg = new GradientDrawable();
        amountBg.setColor(Color.WHITE);
        amountBg.setCornerRadius(16 * density);
        amountBg.setStroke((int) (1.5f * density), Color.parseColor("#C3DFCF"));
        amountInput.setBackground(amountBg);
        LinearLayout.LayoutParams amountLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        amountLp.topMargin = (int) (8 * density);
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
        cancelBtn.setTextColor(Color.parseColor("#183D2C"));
        GradientDrawable cancelBg = new GradientDrawable();
        cancelBg.setColor(Color.parseColor("#D8F3E3"));
        cancelBg.setCornerRadius(16 * density);
        cancelBtn.setBackground(cancelBg);
        cancelBtn.setOnClickListener(v -> finish());
        btnRow.addView(cancelBtn);

        Button addBtn = new Button(this);
        addBtn.setText("+ Lägg till");
        addBtn.setAllCaps(false);
        addBtn.setTypeface(Typeface.DEFAULT_BOLD);
        addBtn.setTextColor(Color.parseColor("#A6F2C6"));
        GradientDrawable addBg = new GradientDrawable();
        addBg.setColor(Color.parseColor("#183D2C"));
        addBg.setCornerRadius(16 * density);
        addBtn.setBackground(addBg);
        LinearLayout.LayoutParams addBtnLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        addBtnLp.leftMargin = (int) (8 * density);
        addBtn.setOnClickListener(v -> {
            String rawName = nameInput.getText().toString().trim();
            if (rawName.isEmpty()) {
                Toast.makeText(this, "Skriv in en vara först", Toast.LENGTH_SHORT).show();
                return;
            }
            String rawAmt = amountInput.getText().toString().trim();
            String amt = "1";
            String unit = "st";
            if (!rawAmt.isEmpty()) {
                String[] parts = rawAmt.split("\\\\s+", 2);
                amt = parts[0];
                if (parts.length > 1 && !parts[1].isEmpty()) {
                    unit = parts[1];
                }
            }
            HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), rawName, amt, unit);
            Toast.makeText(this, "Lade till " + rawName + " i inköpslistan", Toast.LENGTH_SHORT).show();
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
    public static final String RESOURCES_VERSION = "hem_wear_m3_expressive_v3";
    private static volatile long lastTileCloudSyncMs = 0L;

    public static void requestUpdateAllTiles(Context ctx) {
        if (ctx == null) return;
        try {
            Context appCtx = ctx.getApplicationContext();
            TileService.getUpdater(appCtx).requestUpdate(HemShoppingTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemCalendarTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemTodoTileService.class);
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
                if (clickedId.startsWith("toggle_shop:")) {
                    String title = clickedId.substring("toggle_shop:".length());
                    HemWidgetBridge.handleWidgetToggleItem(appCtx, "shopping", "", title);
                } else if (clickedId.startsWith("toggle_todo:")) {
                    String title = clickedId.substring("toggle_todo:".length());
                    HemWidgetBridge.handleWidgetToggleItem(appCtx, "todo", "", title);
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

    private static int parseColorSafe(String hex, int fallback) {
        if (hex == null || !hex.startsWith("#")) return fallback;
        try {
            return Color.parseColor(hex);
        } catch (Throwable ignored) {
            return fallback;
        }
    }

    private static LayoutElementBuilders.LayoutElement buildRootLayout(Context ctx, String mode) {
        SharedPreferences prefs = ctx.getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);
        String rawText;
        String headerTitle;
        int accentArgb;
        int onAccentArgb;
        int pillBgArgb;
        int cardBgArgb;
        int cardBorderArgb;
        int surfaceBgArgb;

        if ("shopping".equals(mode)) {
            rawText = prefs.getString("shop_text", "Inköpslistan är tom");
            headerTitle = "🛒 INKÖP";
            accentArgb = 0xFFA6F2C6;
            onAccentArgb = 0xFF062112;
            pillBgArgb = 0xFF163626;
            cardBgArgb = 0xFF173828;
            cardBorderArgb = 0xFF2D664A;
            surfaceBgArgb = 0xFF08140E;
        } else if ("calendar".equals(mode)) {
            rawText = prefs.getString("cal_text", "Inga inplanerade händelser närmaste 2 veckorna");
            headerTitle = "📅 14 DAGAR";
            accentArgb = 0xFFB8E6FF;
            onAccentArgb = 0xFF061E2E;
            pillBgArgb = 0xFF122C40;
            cardBgArgb = 0xFF17374F;
            cardBorderArgb = 0xFF2B5E85;
            surfaceBgArgb = 0xFF07121A;
        } else {
            rawText = prefs.getString("todo_text", "Alla uppgifter är avklarade!");
            headerTitle = "✓ UPPGIFTER";
            accentArgb = 0xFFFFD8B8;
            onAccentArgb = 0xFF2B1404;
            pillBgArgb = 0xFF332012;
            cardBgArgb = 0xFF3D2716;
            cardBorderArgb = 0xFF6B4528;
            surfaceBgArgb = 0xFF140C06;
        }

        List<String> items = new ArrayList<>();
        if (!HemWidgetBridge.isEmptyStateMessage(rawText)) {
            for (String line : rawText.trim().split("\\\\r?\\\\n")) {
                String clean = line.trim();
                if (clean.startsWith("•")) clean = clean.substring(1).trim();
                if (!clean.isEmpty()) items.add(clean);
            }
        }

        String headerBadge = String.valueOf(items.size());

        // Material 3 Expressive Header Row: Stadium Title Chip + Expressive Action Orb
        LayoutElementBuilders.Row.Builder headerRow = new LayoutElementBuilders.Row.Builder()
            .setWidth(DimensionBuilders.wrap())
            .setHeight(DimensionBuilders.wrap())
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER);

        ModifiersBuilders.Clickable openAppClick = new ModifiersBuilders.Clickable.Builder()
            .setId("open_app_" + mode)
            .setOnClick(buildLaunchWatchAppAction(ctx, mode, false))
            .build();

        headerRow.addContent(
            new LayoutElementBuilders.Box.Builder()
                .setModifiers(
                    new ModifiersBuilders.Modifiers.Builder()
                        .setClickable(openAppClick)
                        .setBackground(
                            new ModifiersBuilders.Background.Builder()
                                .setColor(ColorBuilders.argb(pillBgArgb))
                                .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(999f)).build())
                                .build()
                        )
                        .setBorder(
                            new ModifiersBuilders.Border.Builder()
                                .setWidth(DimensionBuilders.dp(1f))
                                .setColor(ColorBuilders.argb(cardBorderArgb))
                                .build()
                        )
                        .setPadding(
                            new ModifiersBuilders.Padding.Builder()
                                .setStart(DimensionBuilders.dp(11f))
                                .setEnd(DimensionBuilders.dp(11f))
                                .setTop(DimensionBuilders.dp(4.5f))
                                .setBottom(DimensionBuilders.dp(4.5f))
                                .build()
                        )
                        .build()
                )
                .addContent(
                    new LayoutElementBuilders.Text.Builder()
                        .setText(headerTitle + " · " + headerBadge)
                        .setFontStyle(
                            new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(11f))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .setColor(ColorBuilders.argb(accentArgb))
                                .build()
                        )
                        .build()
                )
                .build()
        );

        headerRow.addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(5f)).build());

        if ("shopping".equals(mode) || "todo".equals(mode)) {
            ModifiersBuilders.Clickable quickAddClick = new ModifiersBuilders.Clickable.Builder()
                .setId("quick_add_" + mode)
                .setOnClick(buildLaunchWatchAppAction(ctx, mode, true))
                .build();

            headerRow.addContent(
                new LayoutElementBuilders.Box.Builder()
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
                                    .setStart(DimensionBuilders.dp(9f))
                                    .setEnd(DimensionBuilders.dp(9f))
                                    .setTop(DimensionBuilders.dp(4f))
                                    .setBottom(DimensionBuilders.dp(4f))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText("+ Ny")
                            .setFontStyle(
                                new LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(DimensionBuilders.sp(11f))
                                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                    .setColor(ColorBuilders.argb(onAccentArgb))
                                    .build()
                            )
                            .build()
                    )
                    .build()
            );
        } else {
            ModifiersBuilders.Clickable syncClick = new ModifiersBuilders.Clickable.Builder()
                .setId("sync_now")
                .setOnClick(new ActionBuilders.LoadAction.Builder().build())
                .build();

            headerRow.addContent(
                new LayoutElementBuilders.Box.Builder()
                    .setModifiers(
                        new ModifiersBuilders.Modifiers.Builder()
                            .setClickable(syncClick)
                            .setBackground(
                                new ModifiersBuilders.Background.Builder()
                                    .setColor(ColorBuilders.argb(accentArgb))
                                    .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(999f)).build())
                                    .build()
                            )
                            .setPadding(
                                new ModifiersBuilders.Padding.Builder()
                                    .setStart(DimensionBuilders.dp(8f))
                                    .setEnd(DimensionBuilders.dp(8f))
                                    .setTop(DimensionBuilders.dp(4f))
                                    .setBottom(DimensionBuilders.dp(4f))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText("↻")
                            .setFontStyle(
                                new LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(DimensionBuilders.sp(11f))
                                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                    .setColor(ColorBuilders.argb(onAccentArgb))
                                    .build()
                            )
                            .build()
                    )
                    .build()
            );
        }

        LayoutElementBuilders.Column.Builder col = new LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.wrap())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(headerRow.build())
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(6f)).build());

        if (items.isEmpty()) {
            String emptyMsg = "shopping".equals(mode)
                ? "✓ Inköpslistan är tom"
                : ("calendar".equals(mode) ? "📅 Inga händelser (14 dgr)" : "✓ Allt är avklarat!");

            col.addContent(
                new LayoutElementBuilders.Box.Builder()
                    .setWidth(DimensionBuilders.expand())
                    .setModifiers(
                        new ModifiersBuilders.Modifiers.Builder()
                            .setClickable(openAppClick)
                            .setBackground(
                                new ModifiersBuilders.Background.Builder()
                                    .setColor(ColorBuilders.argb(cardBgArgb))
                                    .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(20f)).build())
                                    .build()
                            )
                            .setBorder(
                                new ModifiersBuilders.Border.Builder()
                                    .setWidth(DimensionBuilders.dp(1.2f))
                                    .setColor(ColorBuilders.argb(cardBorderArgb))
                                    .build()
                            )
                            .setPadding(
                                new ModifiersBuilders.Padding.Builder()
                                    .setAll(DimensionBuilders.dp(13f))
                                    .build()
                            )
                            .build()
                    )
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(emptyMsg)
                            .setMaxLines(2)
                            .setFontStyle(
                                new LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(DimensionBuilders.sp(12f))
                                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                    .setColor(ColorBuilders.argb(accentArgb))
                                    .build()
                            )
                            .build()
                    )
                    .build()
            );
        } else if ("calendar".equals(mode)) {
            int maxRows = Math.min(items.size(), 2);
            for (int i = 0; i < maxRows; i++) {
                String rawLine = items.get(i);
                String colorHex = "#0066FF";
                int colorSep = rawLine.lastIndexOf("||");
                if (colorSep > 0) {
                    String maybeHex = rawLine.substring(colorSep + 2).trim();
                    if (maybeHex.startsWith("#")) colorHex = maybeHex;
                    rawLine = rawLine.substring(0, colorSep).trim();
                }

                String dateTimePart = "Idag";
                String titlePart = rawLine;
                int dashIdx = rawLine.indexOf(" — ");
                if (dashIdx > 0) {
                    dateTimePart = rawLine.substring(0, dashIdx).trim();
                    titlePart = rawLine.substring(dashIdx + 3).trim();
                }

                int eventCardArgb = parseColorSafe(colorHex, 0xFF0066FF);

                LayoutElementBuilders.Column.Builder eventInnerCol = new LayoutElementBuilders.Column.Builder()
                    .setWidth(DimensionBuilders.expand())
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(dateTimePart)
                            .setMaxLines(1)
                            .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                            .setFontStyle(
                                new LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(DimensionBuilders.sp(10f))
                                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                    .setColor(ColorBuilders.argb(0xE6FFFFFF))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(titlePart)
                            .setMaxLines(1)
                            .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                            .setFontStyle(
                                new LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(DimensionBuilders.sp(12.5f))
                                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                    .setColor(ColorBuilders.argb(0xFFFFFFFF))
                                    .build()
                            )
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
                                        .setColor(ColorBuilders.argb(eventCardArgb))
                                        .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(18f)).build())
                                        .build()
                                )
                                .setPadding(
                                    new ModifiersBuilders.Padding.Builder()
                                        .setStart(DimensionBuilders.dp(11f))
                                        .setEnd(DimensionBuilders.dp(11f))
                                        .setTop(DimensionBuilders.dp(5.5f))
                                        .setBottom(DimensionBuilders.dp(5.5f))
                                        .build()
                                )
                                .build()
                        )
                        .addContent(eventInnerCol.build())
                        .build()
                );

                if (i < maxRows - 1) {
                    col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4f)).build());
                }
            }
        } else {
            int maxRows = Math.min(items.size(), 3);
            for (int i = 0; i < maxRows; i++) {
                String rawLine = items.get(i);
                String cleanTitle = rawLine;
                String metaBadge = "";
                int parenIdx = rawLine.lastIndexOf(" (");
                if (parenIdx > 0 && rawLine.endsWith(")")) {
                    cleanTitle = rawLine.substring(0, parenIdx).trim();
                    metaBadge = rawLine.substring(parenIdx + 2, rawLine.length() - 1).trim();
                }

                String prefixIcon = "shopping".equals(mode) ? "○ " : "▢ ";
                String displayRowText = prefixIcon + cleanTitle + (!metaBadge.isEmpty() ? (" · " + metaBadge) : "");
                ModifiersBuilders.Clickable rowClick = new ModifiersBuilders.Clickable.Builder()
                    .setId(("shopping".equals(mode) ? "toggle_shop:" : "toggle_todo:") + cleanTitle)
                    .setOnClick(new ActionBuilders.LoadAction.Builder().build())
                    .build();

                col.addContent(
                    new LayoutElementBuilders.Box.Builder()
                        .setWidth(DimensionBuilders.expand())
                        .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
                        .setModifiers(
                            new ModifiersBuilders.Modifiers.Builder()
                                .setClickable(rowClick)
                                .setBackground(
                                    new ModifiersBuilders.Background.Builder()
                                        .setColor(ColorBuilders.argb(cardBgArgb))
                                        .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(16f)).build())
                                        .build()
                                )
                                .setBorder(
                                    new ModifiersBuilders.Border.Builder()
                                        .setWidth(DimensionBuilders.dp(1f))
                                        .setColor(ColorBuilders.argb(cardBorderArgb))
                                        .build()
                                )
                                .setPadding(
                                    new ModifiersBuilders.Padding.Builder()
                                        .setStart(DimensionBuilders.dp(11f))
                                        .setEnd(DimensionBuilders.dp(11f))
                                        .setTop(DimensionBuilders.dp(5.5f))
                                        .setBottom(DimensionBuilders.dp(5.5f))
                                        .build()
                                )
                                .build()
                        )
                        .addContent(
                            new LayoutElementBuilders.Text.Builder()
                                .setText(displayRowText)
                                .setMaxLines(1)
                                .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                                .setFontStyle(
                                    new LayoutElementBuilders.FontStyle.Builder()
                                        .setSize(DimensionBuilders.sp(12f))
                                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                        .setColor(ColorBuilders.argb(0xFFF5FBF7))
                                        .build()
                                )
                                .build()
                        )
                        .build()
                );

                if (i < maxRows - 1) {
                    col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4f)).build());
                }
            }
        }

        col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(5f)).build());

        int maxShown = "calendar".equals(mode) ? 2 : 3;
        String footerText = items.size() > maxShown
            ? ("+" + (items.size() - maxShown) + " till · Öppna Hem →")
            : "Öppna Hem Klockapp →";

        col.addContent(
            new LayoutElementBuilders.Box.Builder()
                .setModifiers(
                    new ModifiersBuilders.Modifiers.Builder()
                        .setClickable(openAppClick)
                        .setBackground(
                            new ModifiersBuilders.Background.Builder()
                                .setColor(ColorBuilders.argb(pillBgArgb))
                                .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(999f)).build())
                                .build()
                        )
                        .setBorder(
                            new ModifiersBuilders.Border.Builder()
                                .setWidth(DimensionBuilders.dp(1f))
                                .setColor(ColorBuilders.argb(cardBorderArgb))
                                .build()
                        )
                        .setPadding(
                            new ModifiersBuilders.Padding.Builder()
                                .setStart(DimensionBuilders.dp(12f))
                                .setEnd(DimensionBuilders.dp(12f))
                                .setTop(DimensionBuilders.dp(4f))
                                .setBottom(DimensionBuilders.dp(4f))
                                .build()
                        )
                        .build()
                )
                .addContent(
                    new LayoutElementBuilders.Text.Builder()
                        .setText(footerText)
                        .setFontStyle(
                            new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(10.5f))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .setColor(ColorBuilders.argb(accentArgb))
                                .build()
                        )
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
                            .setStart(DimensionBuilders.dp(14f))
                            .setEnd(DimensionBuilders.dp(14f))
                            .setTop(DimensionBuilders.dp(10f))
                            .setBottom(DimensionBuilders.dp(10f))
                            .build()
                    )
                    .build()
            )
            .addContent(col.build())
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

const hemWearActivityJava = `package se.carlberg.hem;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public class HemWearActivity extends Activity {
    private static final int REQ_VOICE_ADD = 9501;
    private String activeTab = "shopping";
    private ScrollView rootScroll;
    private LinearLayout listContainer;
    private TextView brandChip;
    private TextView tabShopBtn;
    private TextView tabCalBtn;
    private TextView tabTodoBtn;
    private TextView statusSubText;
    private LinearLayout quickActionsRow;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        HemSyncService.ensureDefaultAccountConfig(this);
        HemSyncService.scheduleNextAlarm(this);
        HemSyncService.startServiceSafe(this);

        if (getIntent() != null) {
            String tabExtra = getIntent().getStringExtra("open_tab");
            if ("calendar".equals(tabExtra) || "todo".equals(tabExtra) || "shopping".equals(tabExtra)) {
                activeTab = tabExtra;
            }
        }

        buildWatchUi();

        if (getIntent() != null && "true".equals(getIntent().getStringExtra("quick_add"))) {
            getIntent().removeExtra("quick_add");
            showTextAddDialog();
        }

        triggerCloudSync(false);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null) {
            String tabExtra = intent.getStringExtra("open_tab");
            if ("calendar".equals(tabExtra) || "todo".equals(tabExtra) || "shopping".equals(tabExtra)) {
                activeTab = tabExtra;
            }
            refreshWatchContent();
            if ("true".equals(intent.getStringExtra("quick_add"))) {
                intent.removeExtra("quick_add");
                showTextAddDialog();
            }
        }
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

    private GradientDrawable pillDrawable(int fillArgb, int strokeArgb, float radiusDp) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(fillArgb);
        gd.setCornerRadius(dp(radiusDp));
        if (strokeArgb != 0) {
            gd.setStroke(dp(1.4f), strokeArgb);
        }
        return gd;
    }

    private void buildWatchUi() {
        rootScroll = new ScrollView(this);
        rootScroll.setBackgroundColor(Color.parseColor("#07120C"));
        rootScroll.setFillViewport(true);
        rootScroll.setFocusable(true);
        rootScroll.setFocusableInTouchMode(true);
        rootScroll.requestFocus();

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        // Round watch screen safe padding (top/bottom extra margin for circular bezels)
        root.setPadding(dp(12), dp(20), dp(12), dp(38));

        brandChip = new TextView(this);
        brandChip.setText("✦ HEM · M3 EXPRESSIVE");
        brandChip.setTextSize(9.5f);
        brandChip.setTypeface(Typeface.DEFAULT_BOLD);
        brandChip.setTextColor(Color.parseColor("#A6F2C6"));
        brandChip.setGravity(Gravity.CENTER);
        brandChip.setPadding(dp(11), dp(4), dp(11), dp(4));
        brandChip.setBackground(pillDrawable(Color.parseColor("#132D20"), Color.parseColor("#285C42"), 999f));
        LinearLayout.LayoutParams brandLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        brandLp.bottomMargin = dp(4);
        root.addView(brandChip, brandLp);

        statusSubText = new TextView(this);
        statusSubText.setText("Inköpslista · Tryck för att bocka av");
        statusSubText.setTextSize(10.5f);
        statusSubText.setTypeface(Typeface.DEFAULT_BOLD);
        statusSubText.setTextColor(Color.parseColor("#96BDAA"));
        statusSubText.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        subLp.bottomMargin = dp(8);
        root.addView(statusSubText, subLp);

        // Material 3 Expressive Segmented Mode Switcher Row
        HorizontalScrollView tabScroll = new HorizontalScrollView(this);
        tabScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout tabRow = new LinearLayout(this);
        tabRow.setOrientation(LinearLayout.HORIZONTAL);
        tabRow.setGravity(Gravity.CENTER);
        tabRow.setPadding(dp(4), dp(4), dp(4), dp(4));
        tabRow.setBackground(pillDrawable(Color.parseColor("#102118"), Color.parseColor("#1E3D2C"), 999f));

        tabShopBtn = createTabPill("🛒 Inköp", "shopping");
        tabCalBtn = createTabPill("📅 Schema", "calendar");
        tabTodoBtn = createTabPill("✓ Uppgift", "todo");

        tabRow.addView(tabShopBtn);
        tabRow.addView(tabCalBtn);
        tabRow.addView(tabTodoBtn);
        tabScroll.addView(tabRow);

        LinearLayout.LayoutParams tabScrollLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        tabScrollLp.bottomMargin = dp(8);
        root.addView(tabScroll, tabScrollLp);

        // Expressive Quick Actions Row (Voice Add / Text Add / Sync)
        quickActionsRow = new LinearLayout(this);
        quickActionsRow.setOrientation(LinearLayout.HORIZONTAL);
        quickActionsRow.setGravity(Gravity.CENTER);

        TextView voiceBtn = new TextView(this);
        voiceBtn.setText("🎤 Röst");
        voiceBtn.setTextSize(11.5f);
        voiceBtn.setTypeface(Typeface.DEFAULT_BOLD);
        voiceBtn.setTextColor(Color.parseColor("#062112"));
        voiceBtn.setPadding(dp(12), dp(6.5f), dp(12), dp(6.5f));
        voiceBtn.setBackground(pillDrawable(Color.parseColor("#A6F2C6"), 0, 999f));
        voiceBtn.setOnClickListener(v -> launchVoiceAdd());
        LinearLayout.LayoutParams vLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        vLp.rightMargin = dp(5);
        quickActionsRow.addView(voiceBtn, vLp);

        TextView textAddBtn = new TextView(this);
        textAddBtn.setText("+ Skriv");
        textAddBtn.setTextSize(11.5f);
        textAddBtn.setTypeface(Typeface.DEFAULT_BOLD);
        textAddBtn.setTextColor(Color.parseColor("#A6F2C6"));
        textAddBtn.setPadding(dp(12), dp(6.5f), dp(12), dp(6.5f));
        textAddBtn.setBackground(pillDrawable(Color.parseColor("#173828"), Color.parseColor("#2E6B4D"), 999f));
        textAddBtn.setOnClickListener(v -> showTextAddDialog());
        LinearLayout.LayoutParams tLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        tLp.rightMargin = dp(5);
        quickActionsRow.addView(textAddBtn, tLp);

        TextView syncBtn = new TextView(this);
        syncBtn.setText("↻");
        syncBtn.setTextSize(12f);
        syncBtn.setTypeface(Typeface.DEFAULT_BOLD);
        syncBtn.setTextColor(Color.parseColor("#B8E6FF"));
        syncBtn.setPadding(dp(11), dp(6.5f), dp(11), dp(6.5f));
        syncBtn.setBackground(pillDrawable(Color.parseColor("#132C40"), Color.parseColor("#2A5E87"), 999f));
        syncBtn.setOnClickListener(v -> triggerCloudSync(true));
        quickActionsRow.addView(syncBtn);

        LinearLayout.LayoutParams qaLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        qaLp.bottomMargin = dp(9);
        root.addView(quickActionsRow, qaLp);

        listContainer = new LinearLayout(this);
        listContainer.setOrientation(LinearLayout.VERTICAL);
        listContainer.setLayoutParams(new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        root.addView(listContainer);

        // Footer Account Button
        SharedPreferences syncPrefs = getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
        String currentEmail = syncPrefs.getString("email", "filipcarlberg91@gmail.com");

        TextView accountBtn = new TextView(this);
        accountBtn.setText("Konto: " + currentEmail);
        accountBtn.setTextSize(10f);
        accountBtn.setTypeface(Typeface.DEFAULT_BOLD);
        accountBtn.setTextColor(Color.parseColor("#8AB09B"));
        accountBtn.setGravity(Gravity.CENTER);
        accountBtn.setPadding(dp(12), dp(6), dp(12), dp(6));
        accountBtn.setBackground(pillDrawable(Color.parseColor("#102219"), Color.parseColor("#1F4230"), 999f));
        accountBtn.setOnClickListener(v -> showAccountDialog(accountBtn));
        LinearLayout.LayoutParams accLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        accLp.topMargin = dp(12);
        root.addView(accountBtn, accLp);

        rootScroll.addView(root);
        setContentView(rootScroll);
        refreshWatchContent();
    }

    private TextView createTabPill(String label, final String tabId) {
        TextView tv = new TextView(this);
        tv.setText(label);
        tv.setTextSize(11f);
        tv.setTypeface(Typeface.DEFAULT_BOLD);
        tv.setPadding(dp(11), dp(5.5f), dp(11), dp(5.5f));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.leftMargin = dp(2);
        lp.rightMargin = dp(2);
        tv.setLayoutParams(lp);
        tv.setOnClickListener(v -> {
            activeTab = tabId;
            refreshWatchContent();
        });
        return tv;
    }

    private void updateTabStyles() {
        styleOneTab(tabShopBtn, "shopping".equals(activeTab), "#A6F2C6", "#062112", "#142B20");
        styleOneTab(tabCalBtn, "calendar".equals(activeTab), "#B8E6FF", "#061E2E", "#12293B");
        styleOneTab(tabTodoBtn, "todo".equals(activeTab), "#FFD8B8", "#2B1404", "#301E10");

        if (rootScroll != null && brandChip != null) {
            if ("calendar".equals(activeTab)) {
                rootScroll.setBackgroundColor(Color.parseColor("#061017"));
                brandChip.setTextColor(Color.parseColor("#B8E6FF"));
                brandChip.setBackground(pillDrawable(Color.parseColor("#11293B"), Color.parseColor("#285B80"), 999f));
            } else if ("todo".equals(activeTab)) {
                rootScroll.setBackgroundColor(Color.parseColor("#120B06"));
                brandChip.setTextColor(Color.parseColor("#FFD8B8"));
                brandChip.setBackground(pillDrawable(Color.parseColor("#2E1D10"), Color.parseColor("#613E23"), 999f));
            } else {
                rootScroll.setBackgroundColor(Color.parseColor("#07120C"));
                brandChip.setTextColor(Color.parseColor("#A6F2C6"));
                brandChip.setBackground(pillDrawable(Color.parseColor("#132D20"), Color.parseColor("#285C42"), 999f));
            }
        }
    }

    private void styleOneTab(TextView tv, boolean active, String activeAccentHex, String onAccentHex, String inactiveBgHex) {
        if (tv == null) return;
        if (active) {
            tv.setTextColor(Color.parseColor(onAccentHex));
            tv.setBackground(pillDrawable(Color.parseColor(activeAccentHex), 0, 999f));
        } else {
            tv.setTextColor(Color.parseColor(activeAccentHex));
            tv.setBackground(pillDrawable(Color.parseColor(inactiveBgHex), 0, 999f));
        }
    }

    private void refreshWatchContent() {
        if (listContainer == null) return;
        updateTabStyles();
        listContainer.removeAllViews();

        SharedPreferences prefs = getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);
        String rawText;
        if ("shopping".equals(activeTab)) {
            rawText = prefs.getString("shop_text", "Inköpslistan är tom");
            statusSubText.setText("Inköpslista · Tryck för att bocka av");
        } else if ("calendar".equals(activeTab)) {
            rawText = prefs.getString("cal_text", "Inga inplanerade händelser närmaste 2 veckorna");
            statusSubText.setText("Kalender · 14 dagar framåt");
        } else {
            rawText = prefs.getString("todo_text", "Alla uppgifter är avklarade!");
            statusSubText.setText("Att göra · Tryck för att klarmarkera");
        }

        List<String> lines = new ArrayList<>();
        if (!HemWidgetBridge.isEmptyStateMessage(rawText)) {
            for (String s : rawText.trim().split("\\\\r?\\\\n")) {
                String clean = s.trim();
                if (clean.startsWith("•")) clean = clean.substring(1).trim();
                if (!clean.isEmpty()) lines.add(clean);
            }
        }

        if (lines.isEmpty()) {
            TextView emptyTv = new TextView(this);
            emptyTv.setText(rawText);
            emptyTv.setTextSize(12.5f);
            emptyTv.setTypeface(Typeface.DEFAULT_BOLD);
            emptyTv.setTextColor(Color.parseColor("#E2F5EA"));
            emptyTv.setGravity(Gravity.CENTER);
            emptyTv.setPadding(dp(16), dp(18), dp(16), dp(18));
            emptyTv.setBackground(pillDrawable(Color.parseColor("#13291E"), Color.parseColor("#295740"), 24f));
            listContainer.addView(emptyTv);
            return;
        }

        for (final String rawItemLine : lines) {
            String workingLine = rawItemLine;
            String colorHex = "#0066FF";
            int colorSep = workingLine.lastIndexOf("||");
            if (colorSep > 0) {
                String maybeHex = workingLine.substring(colorSep + 2).trim();
                if (maybeHex.startsWith("#")) colorHex = maybeHex;
                workingLine = workingLine.substring(0, colorSep).trim();
            }

            if ("calendar".equals(activeTab)) {
                String dateTimePart = "Idag";
                String titlePart = workingLine;
                int dashIdx = workingLine.indexOf(" — ");
                if (dashIdx > 0) {
                    dateTimePart = workingLine.substring(0, dashIdx).trim();
                    titlePart = workingLine.substring(dashIdx + 3).trim();
                }

                int catArgb = Color.parseColor("#0066FF");
                try {
                    catArgb = Color.parseColor(colorHex);
                } catch (Throwable ignored) {}

                LinearLayout calCard = new LinearLayout(this);
                calCard.setOrientation(LinearLayout.VERTICAL);
                calCard.setPadding(dp(14), dp(10), dp(14), dp(10));
                calCard.setBackground(pillDrawable(catArgb, Color.parseColor("#38FFFFFF"), 22f));
                LinearLayout.LayoutParams calLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                calLp.bottomMargin = dp(7);

                TextView dtTv = new TextView(this);
                dtTv.setText(dateTimePart);
                dtTv.setTextSize(11f);
                dtTv.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
                dtTv.setTextColor(Color.parseColor("#EBFFFFFF"));
                calCard.addView(dtTv);

                TextView tTv = new TextView(this);
                tTv.setText(titlePart);
                tTv.setTextSize(14f);
                tTv.setTypeface(Typeface.DEFAULT_BOLD);
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

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(dp(11), dp(9), dp(11), dp(9));
            int rowBg = "shopping".equals(activeTab) ? Color.parseColor("#153022") : Color.parseColor("#301F12");
            int rowStroke = "shopping".equals(activeTab) ? Color.parseColor("#2B6145") : Color.parseColor("#5E3D23");
            row.setBackground(pillDrawable(rowBg, rowStroke, 20f));
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

            TextView iconTv = new TextView(this);
            iconTv.setText("shopping".equals(activeTab) ? "○" : "✓");
            iconTv.setTextSize(12f);
            iconTv.setTypeface(Typeface.DEFAULT_BOLD);
            iconTv.setGravity(Gravity.CENTER);
            int orbAccent = "shopping".equals(activeTab) ? Color.parseColor("#A6F2C6") : Color.parseColor("#FFD8B8");
            int orbBg = "shopping".equals(activeTab) ? Color.parseColor("#214D37") : Color.parseColor("#4A2F1B");
            iconTv.setTextColor(orbAccent);
            iconTv.setBackground(pillDrawable(orbBg, 0, 10f));
            LinearLayout.LayoutParams orbLp = new LinearLayout.LayoutParams(dp(26), dp(26));
            orbLp.rightMargin = dp(9);
            row.addView(iconTv, orbLp);

            TextView titleTv = new TextView(this);
            titleTv.setText(cleanTitle);
            titleTv.setTextSize(13.5f);
            titleTv.setTypeface(Typeface.DEFAULT_BOLD);
            titleTv.setTextColor(Color.parseColor("#F5FBF7"));
            row.addView(titleTv, new LinearLayout.LayoutParams(
                0,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                1f
            ));

            if (!metaBadge.isEmpty()) {
                TextView metaTv = new TextView(this);
                metaTv.setText(metaBadge);
                metaTv.setTextSize(10.5f);
                metaTv.setTypeface(Typeface.DEFAULT_BOLD);
                metaTv.setTextColor(Color.parseColor("#062112"));
                metaTv.setPadding(dp(8), dp(2.5f), dp(8), dp(2.5f));
                metaTv.setBackground(pillDrawable(orbAccent, 0, 999f));
                LinearLayout.LayoutParams metaLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                metaLp.leftMargin = dp(6);
                row.addView(metaTv, metaLp);
            }

            row.setOnClickListener(v -> {
                HemWidgetBridge.handleWidgetToggleItem(getApplicationContext(), activeTab, rawItemLine, itemTitleForAction);
                Toast.makeText(this, "✓ " + itemTitleForAction, Toast.LENGTH_SHORT).show();
                refreshWatchContent();
            });

            listContainer.addView(row, rowLp);
        }
    }

    private void launchVoiceAdd() {
        try {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "sv-SE");
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "todo".equals(activeTab) ? "Säg en ny uppgift..." : "Säg en vara att handla...");
            startActivityForResult(intent, REQ_VOICE_ADD);
        } catch (Throwable e) {
            showTextAddDialog();
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
                    if ("todo".equals(activeTab)) {
                        HemWidgetBridge.handleWidgetQuickAddTodoItem(getApplicationContext(), spoken);
                        Toast.makeText(this, "Lade till uppgift: " + spoken, Toast.LENGTH_SHORT).show();
                    } else {
                        activeTab = "shopping";
                        HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), spoken, "1", "st");
                        Toast.makeText(this, "Lade till i inköp: " + spoken, Toast.LENGTH_SHORT).show();
                    }
                    refreshWatchContent();
                }
            }
        }
    }

    private void showTextAddDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        final boolean isTodo = "todo".equals(activeTab);
        builder.setTitle(isTodo ? "Ny uppgift" : "Lägg till vara");

        final EditText input = new EditText(this);
        input.setHint(isTodo ? "T.ex. Dammsuga..." : "T.ex. Mjölk, Bröd...");
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        builder.setView(input);

        builder.setPositiveButton("Lägg till", (dialog, which) -> {
            String val = input.getText().toString().trim();
            if (!val.isEmpty()) {
                if (isTodo) {
                    HemWidgetBridge.handleWidgetQuickAddTodoItem(getApplicationContext(), val);
                } else {
                    activeTab = "shopping";
                    HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), val, "1", "st");
                }
                Toast.makeText(this, "Lade till " + val, Toast.LENGTH_SHORT).show();
                refreshWatchContent();
            }
        });
        builder.setNegativeButton("Avbryt", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    private void showAccountDialog(final TextView accountBtn) {
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
                accountBtn.setText("Konto: " + newEmail);
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
    <solid android:color="#EEF7F2" />
    <corners android:radius="28dp" />
    <stroke android:width="1.5dp" android:color="#C3DFCF" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_inner_card.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <corners android:radius="22dp" />
    <stroke android:width="1dp" android:color="#D2E7DA" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_row_card.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <corners android:radius="16dp" />
    <stroke android:width="1dp" android:color="#D5E8DC" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_cal_card_shape.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <corners android:radius="18dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_icon_squircle.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#183D2C" />
    <corners android:radius="14dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_pill.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#D8F3E3" />
    <corners android:radius="10dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_meta_pill.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#183D2C" />
    <corners android:radius="999dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_add_circle.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#D8F3E3" />
    <corners android:radius="999dp" />
    <stroke android:width="1dp" android:color="#A5DEC0" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resDrawableDir, 'hem_widget_m3_badge.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#183D2C" />
    <corners android:radius="999dp" />
</shape>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(resLayoutDir, 'hem_widget_calendar_row.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/hem_cal_row_root"
    android:layout_width="match_parent"
    android:layout_height="wrap_content">

    <ImageView
        android:id="@+id/hem_cal_row_bg_img"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:scaleType="fitXY"
        android:src="@drawable/hem_widget_m3_cal_card_shape" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:paddingLeft="13dp"
        android:paddingTop="9dp"
        android:paddingRight="13dp"
        android:paddingBottom="10dp">

        <TextView
            android:id="@+id/hem_cal_row_datetime"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:ellipsize="end"
            android:singleLine="true"
            android:text="Idag 09:00"
            android:textColor="#EBFFFFFF"
            android:textSize="11.5sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/hem_cal_row_title"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="2dp"
            android:ellipsize="end"
            android:singleLine="true"
            android:text="Jobb"
            android:textColor="#FFFFFF"
            android:textSize="14.5sp"
            android:textStyle="bold" />
    </LinearLayout>
</FrameLayout>
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
    android:paddingLeft="10dp"
    android:paddingTop="8dp"
    android:paddingRight="10dp"
    android:paddingBottom="8dp">

    <TextView
        android:id="@+id/hem_widget_item_pill"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:background="@drawable/hem_widget_m3_pill"
        android:paddingLeft="8dp"
        android:paddingTop="3dp"
        android:paddingRight="8dp"
        android:paddingBottom="3dp"
        android:singleLine="true"
        android:text="○"
        android:textColor="#183D2C"
        android:textSize="11sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/hem_widget_item_title"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginStart="8dp"
        android:layout_weight="1"
        android:ellipsize="end"
        android:singleLine="true"
        android:text=""
        android:textColor="#141E18"
        android:textSize="13.5sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/hem_widget_item_meta"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginStart="6dp"
        android:background="@drawable/hem_widget_m3_meta_pill"
        android:paddingLeft="8dp"
        android:paddingTop="2dp"
        android:paddingRight="8dp"
        android:paddingBottom="2dp"
        android:singleLine="true"
        android:text=""
        android:textColor="#A6F2C6"
        android:textSize="10.5sp"
        android:textStyle="bold"
        android:visibility="gone" />
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
    android:padding="13dp">

    <!-- Material 3 Expressive Header -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:id="@+id/hem_widget_icon_badge"
            android:layout_width="36dp"
            android:layout_height="36dp"
            android:background="@drawable/hem_widget_m3_icon_squircle"
            android:gravity="center"
            android:text="✦"
            android:textColor="#A6F2C6"
            android:textSize="15sp"
            android:textStyle="bold" />

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_marginStart="10dp"
            android:layout_weight="1"
            android:orientation="vertical">

            <TextView
                android:id="@+id/hem_widget_subtitle"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="HEM"
                android:textColor="#4A6355"
                android:textSize="9.5sp"
                android:textStyle="bold"
                android:letterSpacing="0.08" />

            <TextView
                android:id="@+id/hem_widget_title"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Inköpslista"
                android:textColor="#14291E"
                android:textSize="17sp"
                android:textStyle="bold" />
        </LinearLayout>

        <TextView
            android:id="@+id/hem_widget_badge"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:background="@drawable/hem_widget_m3_badge"
            android:paddingLeft="11dp"
            android:paddingRight="11dp"
            android:paddingTop="5dp"
            android:paddingBottom="5dp"
            android:text="0"
            android:textColor="#A6F2C6"
            android:textSize="11.5sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/hem_widget_add_btn"
            android:layout_width="30dp"
            android:layout_height="30dp"
            android:layout_marginStart="6dp"
            android:background="@drawable/hem_widget_m3_add_circle"
            android:gravity="center"
            android:text="+"
            android:textColor="#183D2C"
            android:textSize="17sp"
            android:textStyle="bold" />
    </LinearLayout>

    <!-- Scrollable ListView for All Items in Widget -->
    <ListView
        android:id="@+id/hem_widget_listview"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:layout_marginTop="9dp"
        android:divider="@android:color/transparent"
        android:dividerHeight="5dp"
        android:scrollbars="vertical" />

    <!-- Expressive Empty State Card -->
    <LinearLayout
        android:id="@+id/hem_widget_empty_card"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:layout_marginTop="9dp"
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
            android:textColor="#A6F2C6"
            android:textSize="15sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/hem_widget_body"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:gravity="center"
            android:text="Alla uppgifter är avklarade!"
            android:textColor="#183D2C"
            android:textSize="13.5sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/hem_widget_empty_sub"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="2dp"
            android:gravity="center"
            android:text="Tryck på + för att lägga till direkt"
            android:textColor="#54685C"
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
      "dependencies {\n    implementation 'androidx.wear.tiles:tiles:1.1.0'\n    implementation 'com.google.guava:guava:31.1-android'"
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
const stylesXmlPath = path.resolve('android/app/src/main/res/values/styles.xml');
if (fs.existsSync(stylesXmlPath)) {
  let stylesXml = fs.readFileSync(stylesXmlPath, 'utf8');
  stylesXml = stylesXml
    .replace(/<item name="android:statusBarColor">.*?<\/item>/g, '')
    .replace(/<item name="android:navigationBarColor">.*?<\/item>/g, '')
    .replace(/<item name="android:windowTranslucentStatus">.*?<\/item>/g, '')
    .replace(/<item name="android:windowTranslucentNavigation">.*?<\/item>/g, '');
  fs.writeFileSync(stylesXmlPath, stylesXml, 'utf8');
}

console.log('Successfully generated native Android background sync classes, Wear OS Tiles, and R8 DEX optimization config.');


