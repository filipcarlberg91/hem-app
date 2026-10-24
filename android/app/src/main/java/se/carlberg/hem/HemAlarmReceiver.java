package se.carlberg.hem;

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
