package se.carlberg.hem;

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
        text = text.replaceFirst("(?i)^Lade till\\s+", "")
                   .replaceFirst("(?i)\\s+i inköpslistan$", "")
                   .replaceFirst("(?i)^Ny kalenderhändelse:\\s*", "")
                   .replaceFirst("(?i)^Ny uppgift:\\s*", "")
                   .replaceFirst("(?i)^Skapade anteckningen\\s*", "")
                   .replaceFirst("(?i)^Lade till receptet\\s*", "")
                   .replaceFirst("(?i)^Skapade bildalbumet\\s*", "")
                   .replaceFirst("(?i)^Skapade budgetmånaden\\s*", "")
                   .trim();
        if (text.length() >= 2 && text.startsWith("\"") && text.endsWith("\"")) {
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
            byte[] payload = "{\"returnSecureToken\":true}".getBytes(StandardCharsets.UTF_8);
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
