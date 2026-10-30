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
                for (String existing : currentText.split("\\r?\\n")) {
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
                for (String existing : currentText.split("\\r?\\n")) {
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
                for (String existing : currentText.split("\\r?\\n")) {
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
            .replaceAll("(?i)<br\\s*/?>", " · ")
            .replaceAll("(?i)</p>|</li>|</div>", " · ")
            .replaceAll("<[^>]+>", "")
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replaceAll("\\s+", " ")
            .trim();
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
                    if (sb.length() > 0) sb.append("\n");
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
                    if (sb.length() > 0) sb.append("\n");
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
