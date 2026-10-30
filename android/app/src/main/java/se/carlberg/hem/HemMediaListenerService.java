package se.carlberg.hem;

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

    public static void refreshFromActiveSessions(Context ctx) {
        if (ctx == null) return;
        try {
            List<MediaController> allControllers = new ArrayList<>();
            try {
                MediaSessionManager msm = (MediaSessionManager) ctx.getSystemService(Context.MEDIA_SESSION_SERVICE);
                if (msm != null) {
                    ComponentName cn = new ComponentName(ctx, HemMediaListenerService.class);
                    List<MediaController> active = msm.getActiveSessions(cn);
                    if (active != null) allControllers.addAll(active);
                }
            } catch (Throwable ignored) {}

            // Also inspect active status bar notifications for MediaSession.Token (captures Google Play Services Cast notifications!)
            String notifSubTextDevice = "";
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
                            if (sub != null && sub.length() > 0 && notifSubTextDevice.isEmpty()) {
                                notifSubTextDevice = sub.toString();
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

            MediaController bestPlaying = null;
            for (MediaController mc : allControllers) {
                if (mc == null) continue;
                PlaybackState st = mc.getPlaybackState();
                if (st != null) {
                    int s = st.getState();
                    if (s == PlaybackState.STATE_PLAYING || s == PlaybackState.STATE_BUFFERING) {
                        bestPlaying = mc;
                        break;
                    }
                }
            }

            if (bestPlaying == null) {
                currentPlaying = false;
                return;
            }

            String pkg = bestPlaying.getPackageName() != null ? bestPlaying.getPackageName() : "";
            currentPackage = pkg;
            currentAppName = friendlyAppNameFromPackage(pkg);
            MediaController.PlaybackInfo pInfo = bestPlaying.getPlaybackInfo();
            boolean isRemoteRoute = (pInfo != null && pInfo.getPlaybackType() == MediaController.PlaybackInfo.PLAYBACK_TYPE_REMOTE);
            String castRouteName = getSelectedCastRouteName(ctx);
            currentIsCast = isRemoteRoute || !castRouteName.isEmpty() || pkg.toLowerCase().contains("gms") || pkg.toLowerCase().contains("chromecast");
            currentMediaType = (isVideoPackage(pkg) || currentIsCast) && !pkg.toLowerCase().contains("spotify") ? "video" : "audio";

            MediaMetadata meta = bestPlaying.getMetadata();
            PlaybackState state = bestPlaying.getPlaybackState();
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

            if (state != null) {
                int st = state.getState();
                currentPlaying = (st == PlaybackState.STATE_PLAYING || st == PlaybackState.STATE_BUFFERING);
                if (state.getPosition() >= 0) {
                    currentPositionMs = state.getPosition();
                }
            }
            lastUpdatedMs = System.currentTimeMillis();
        } catch (Throwable ignored) {}
    }

    public static boolean dispatchTransportCommand(Context ctx, String cmd) {
        if (ctx == null) return false;
        try {
            MediaSessionManager msm = (MediaSessionManager) ctx.getSystemService(Context.MEDIA_SESSION_SERVICE);
            if (msm == null) return false;
            ComponentName cn = new ComponentName(ctx, HemMediaListenerService.class);
            List<MediaController> controllers = msm.getActiveSessions(cn);
            if (controllers == null || controllers.isEmpty()) return false;

            MediaController chosen = null;
            for (MediaController mc : controllers) {
                if (mc == null) continue;
                PlaybackState st = mc.getPlaybackState();
                if (st != null && (st.getState() == PlaybackState.STATE_PLAYING || st.getState() == PlaybackState.STATE_BUFFERING)) {
                    chosen = mc;
                    break;
                }
            }
            if (chosen == null) chosen = controllers.get(0);
            if (chosen == null || chosen.getTransportControls() == null) return false;

            MediaController.TransportControls tc = chosen.getTransportControls();
            if ("play".equals(cmd)) tc.play();
            else if ("pause".equals(cmd)) tc.pause();
            else if ("stop".equals(cmd)) tc.stop();
            else if ("next".equals(cmd)) tc.skipToNext();
            else if ("prev".equals(cmd)) tc.skipToPrevious();
            else if ("play_pause".equals(cmd)) {
                PlaybackState st = chosen.getPlaybackState();
                if (st != null && st.getState() == PlaybackState.STATE_PLAYING) {
                    tc.pause();
                } else {
                    tc.play();
                }
            } else {
                return false;
            }
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }
}
