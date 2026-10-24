package se.carlberg.hem;

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
