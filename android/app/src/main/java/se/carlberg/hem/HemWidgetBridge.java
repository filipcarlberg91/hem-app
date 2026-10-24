package se.carlberg.hem;

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
            String[] lines = currentText.split("\\r?\\n");
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
                for (String existing : currentText.split("\\r?\\n")) {
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
                for (String existing : currentText.split("\\r?\\n")) {
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
            if (i > 0) sb.append("\n");
            sb.append(list.get(i));
        }
        return sb.toString();
    }

    private static String countLinesBadge(String text, String fallback) {
        if (text == null || text.trim().isEmpty()) return fallback;
        String t = text.trim().toLowerCase();
        if (t.contains("inga ") || t.contains("är tom") || t.contains("avklarade")) return fallback;
        String[] lines = text.trim().split("\\r?\\n");
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
                        if (sb.length() > 0) sb.append("\n");
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
                        if (sb.length() > 0) sb.append("\n");
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
                    if (sb.length() > 0) sb.append("\n");
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
