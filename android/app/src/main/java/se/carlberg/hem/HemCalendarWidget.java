package se.carlberg.hem;

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
