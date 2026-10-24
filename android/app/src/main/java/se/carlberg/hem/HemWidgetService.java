package se.carlberg.hem;

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
                    String[] split = raw.trim().split("\\r?\\n");
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
