package se.carlberg.hem;

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
