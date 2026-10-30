package se.carlberg.hem;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

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

        private String normalizeIsoDate(String rawDateToken, String todayIso) {
            if (rawDateToken == null) return todayIso;
            String t = rawDateToken.trim();
            if (t.isEmpty() || "Idag".equalsIgnoreCase(t)) return todayIso;
            if (t.length() == 5 && t.charAt(2) == '-') {
                return todayIso.substring(0, 5) + t;
            }
            if (t.length() >= 10) {
                return t.substring(0, 10);
            }
            return todayIso;
        }

        private String extractDateKeyForPosition(int pos, String todayIso) {
            if (pos < 0 || pos >= lines.size()) return "";
            String ln = lines.get(pos);
            if (ln.startsWith("•")) ln = ln.substring(1).trim();
            int colorSep = ln.lastIndexOf("||");
            if (colorSep > 0) ln = ln.substring(0, colorSep).trim();
            int dashIdx = ln.indexOf(" — ");
            String dtPart = dashIdx > 0 ? ln.substring(0, dashIdx).trim() : ln;
            int pipeIdx = dtPart.indexOf('|');
            if (pipeIdx > 0) {
                return normalizeIsoDate(dtPart.substring(0, pipeIdx), todayIso);
            }
            int spIdx = dtPart.indexOf(' ');
            if (spIdx > 0) {
                return normalizeIsoDate(dtPart.substring(0, spIdx), todayIso);
            }
            return normalizeIsoDate(dtPart, todayIso);
        }

        private String[] computeSwedishDowAndDay(String isoDate) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                Date parsed = sdf.parse(isoDate);
                if (parsed != null) {
                    Calendar cal = Calendar.getInstance();
                    cal.setTime(parsed);
                    int dow = cal.get(Calendar.DAY_OF_WEEK);
                    String dowStr = "Mån";
                    if (dow == Calendar.MONDAY) dowStr = "Mån";
                    else if (dow == Calendar.TUESDAY) dowStr = "Tis";
                    else if (dow == Calendar.WEDNESDAY) dowStr = "Ons";
                    else if (dow == Calendar.THURSDAY) dowStr = "Tor";
                    else if (dow == Calendar.FRIDAY) dowStr = "Fre";
                    else if (dow == Calendar.SATURDAY) dowStr = "Lör";
                    else if (dow == Calendar.SUNDAY) dowStr = "Sön";
                    String dayNum = String.valueOf(cal.get(Calendar.DAY_OF_MONTH));
                    return new String[]{dowStr, dayNum};
                }
            } catch (Throwable ignored) {
            }
            String fallbackDay = isoDate != null && isoDate.length() >= 10 ? isoDate.substring(8, 10) : "1";
            if (fallbackDay.startsWith("0")) fallbackDay = fallbackDay.substring(1);
            return new String[]{"Dag", fallbackDay};
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
                int dayColId = ctx.getResources().getIdentifier("hem_cal_day_col", "id", pkg);
                int dayBadgeBgId = ctx.getResources().getIdentifier("hem_cal_day_badge_bg", "id", pkg);
                int dayDowId = ctx.getResources().getIdentifier("hem_cal_day_dow", "id", pkg);
                int dayNumId = ctx.getResources().getIdentifier("hem_cal_day_num", "id", pkg);
                int bgImgId = ctx.getResources().getIdentifier("hem_cal_row_bg_img", "id", pkg);
                int dateTimeId = ctx.getResources().getIdentifier("hem_cal_row_datetime", "id", pkg);
                int titleId = ctx.getResources().getIdentifier("hem_cal_row_title", "id", pkg);

                String todayIso = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
                String dtPart = todayIso;
                String eventTitleText = line;
                int dashIdx = line.indexOf(" — ");
                if (dashIdx > 0) {
                    dtPart = line.substring(0, dashIdx).trim();
                    eventTitleText = line.substring(dashIdx + 3).trim();
                }

                String dateRaw = dtPart;
                String timeText = "";
                int pipeIdx = dtPart.indexOf('|');
                if (pipeIdx > 0) {
                    dateRaw = dtPart.substring(0, pipeIdx).trim();
                    timeText = dtPart.substring(pipeIdx + 1).trim();
                } else {
                    int spIdx = dtPart.indexOf(' ');
                    if (spIdx > 0) {
                        dateRaw = dtPart.substring(0, spIdx).trim();
                        timeText = dtPart.substring(spIdx + 1).trim();
                    }
                }

                String isoDate = normalizeIsoDate(dateRaw, todayIso);
                String prevIsoDate = position > 0 ? extractDateKeyForPosition(position - 1, todayIso) : "";
                boolean sameAsPrevDay = position > 0 && isoDate.equals(prevIsoDate);
                boolean isHighlightedDay = isoDate.equals(todayIso) || position == 0;

                if (dayColId != 0) {
                    rv.setViewVisibility(dayColId, sameAsPrevDay ? View.INVISIBLE : View.VISIBLE);
                }

                String[] dowAndDay = computeSwedishDowAndDay(isoDate);
                if (dayBadgeBgId != 0) {
                    rv.setViewVisibility(dayBadgeBgId, isHighlightedDay ? View.VISIBLE : View.GONE);
                }
                if (dayDowId != 0) {
                    rv.setTextViewText(dayDowId, dowAndDay[0]);
                    rv.setTextColor(dayDowId, isHighlightedDay ? Color.WHITE : Color.parseColor("#2B303A"));
                }
                if (dayNumId != 0) {
                    rv.setTextViewText(dayNumId, dowAndDay[1]);
                    rv.setTextColor(dayNumId, isHighlightedDay ? Color.WHITE : Color.parseColor("#1C1F26"));
                }

                int parsedColor = Color.parseColor("#0066FF");
                try {
                    parsedColor = Color.parseColor(colorHex);
                } catch (Throwable ignored) {}

                if (bgImgId != 0) {
                    rv.setInt(bgImgId, "setColorFilter", parsedColor);
                }
                if (titleId != 0) {
                    rv.setTextViewText(titleId, eventTitleText);
                }
                if (dateTimeId != 0) {
                    if (timeText.isEmpty() || "Heldag".equalsIgnoreCase(timeText)) {
                        rv.setViewVisibility(dateTimeId, View.GONE);
                    } else {
                        rv.setViewVisibility(dateTimeId, View.VISIBLE);
                        rv.setTextViewText(dateTimeId, timeText);
                    }
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

            String mainTitle = line;
            String metaText = "";

            int parenStart = line.lastIndexOf(" (");
            if (parenStart > 0 && line.endsWith(")")) {
                mainTitle = line.substring(0, parenStart).trim();
                metaText = line.substring(parenStart + 2, line.length() - 1).trim();
            }

            if (pillId != 0) rv.setTextViewText(pillId, "");
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
