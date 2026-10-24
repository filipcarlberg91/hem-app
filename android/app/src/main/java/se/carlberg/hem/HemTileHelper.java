package se.carlberg.hem;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;

import androidx.wear.tiles.ActionBuilders;
import androidx.wear.tiles.ColorBuilders;
import androidx.wear.tiles.DimensionBuilders;
import androidx.wear.tiles.LayoutElementBuilders;
import androidx.wear.tiles.ModifiersBuilders;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.ResourceBuilders;
import androidx.wear.tiles.StateBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import androidx.wear.tiles.TimelineBuilders;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;

import java.util.ArrayList;
import java.util.List;

public class HemTileHelper {
    public static final String RESOURCES_VERSION = "hem_wear_m3_expressive_v3";
    private static volatile long lastTileCloudSyncMs = 0L;

    public static void requestUpdateAllTiles(Context ctx) {
        if (ctx == null) return;
        try {
            Context appCtx = ctx.getApplicationContext();
            TileService.getUpdater(appCtx).requestUpdate(HemShoppingTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemCalendarTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemTodoTileService.class);
        } catch (Throwable ignored) {
        }
    }

    public static ListenableFuture<ResourceBuilders.Resources> buildResources() {
        return Futures.immediateFuture(
            new ResourceBuilders.Resources.Builder()
                .setVersion(RESOURCES_VERSION)
                .build()
        );
    }

    public static ListenableFuture<TileBuilders.Tile> buildTile(
        Context context,
        RequestBuilders.TileRequest requestParams,
        String mode
    ) {
        final Context appCtx = context.getApplicationContext();
        try {
            HemSyncService.ensureDefaultAccountConfig(appCtx);
            StateBuilders.State state = requestParams != null ? requestParams.getState() : null;
            String clickedId = state != null ? state.getLastClickableId() : "";

            if (clickedId != null && !clickedId.isEmpty()) {
                if (clickedId.startsWith("toggle_shop:")) {
                    String title = clickedId.substring("toggle_shop:".length());
                    HemWidgetBridge.handleWidgetToggleItem(appCtx, "shopping", "", title);
                } else if (clickedId.startsWith("toggle_todo:")) {
                    String title = clickedId.substring("toggle_todo:".length());
                    HemWidgetBridge.handleWidgetToggleItem(appCtx, "todo", "", title);
                } else if ("sync_now".equals(clickedId)) {
                    new Thread(() -> HemSyncService.pollCloudOnce(appCtx)).start();
                }
            }

            long now = System.currentTimeMillis();
            if (now - lastTileCloudSyncMs > 45000L) {
                lastTileCloudSyncMs = now;
                new Thread(() -> HemSyncService.pollCloudOnce(appCtx)).start();
            }
        } catch (Throwable ignored) {
        }

        LayoutElementBuilders.LayoutElement root = buildRootLayout(appCtx, mode);
        TimelineBuilders.Timeline timeline = new TimelineBuilders.Timeline.Builder()
            .addTimelineEntry(
                new TimelineBuilders.TimelineEntry.Builder()
                    .setLayout(
                        new LayoutElementBuilders.Layout.Builder()
                            .setRoot(root)
                            .build()
                    )
                    .build()
            )
            .build();

        return Futures.immediateFuture(
            new TileBuilders.Tile.Builder()
                .setResourcesVersion(RESOURCES_VERSION)
                .setFreshnessIntervalMillis(60000L)
                .setTimeline(timeline)
                .build()
        );
    }

    private static ActionBuilders.LaunchAction buildLaunchWatchAppAction(Context ctx, String mode, boolean quickAdd) {
        return new ActionBuilders.LaunchAction.Builder()
            .setAndroidActivity(
                new ActionBuilders.AndroidActivity.Builder()
                    .setPackageName(ctx.getPackageName())
                    .setClassName("se.carlberg.hem.HemWearActivity")
                    .addKeyToExtraMapping("open_tab", ActionBuilders.stringExtra(mode))
                    .addKeyToExtraMapping("quick_add", ActionBuilders.stringExtra(quickAdd ? "true" : "false"))
                    .build()
            )
            .build();
    }

    private static int parseColorSafe(String hex, int fallback) {
        if (hex == null || !hex.startsWith("#")) return fallback;
        try {
            return Color.parseColor(hex);
        } catch (Throwable ignored) {
            return fallback;
        }
    }

    private static LayoutElementBuilders.LayoutElement buildRootLayout(Context ctx, String mode) {
        SharedPreferences prefs = ctx.getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);
        String rawText;
        String headerTitle;
        int accentArgb;
        int onAccentArgb;
        int pillBgArgb;
        int cardBgArgb;
        int cardBorderArgb;
        int surfaceBgArgb;

        if ("shopping".equals(mode)) {
            rawText = prefs.getString("shop_text", "Inköpslistan är tom");
            headerTitle = "🛒 INKÖP";
            accentArgb = 0xFFA6F2C6;
            onAccentArgb = 0xFF062112;
            pillBgArgb = 0xFF163626;
            cardBgArgb = 0xFF173828;
            cardBorderArgb = 0xFF2D664A;
            surfaceBgArgb = 0xFF08140E;
        } else if ("calendar".equals(mode)) {
            rawText = prefs.getString("cal_text", "Inga inplanerade händelser närmaste 2 veckorna");
            headerTitle = "📅 14 DAGAR";
            accentArgb = 0xFFB8E6FF;
            onAccentArgb = 0xFF061E2E;
            pillBgArgb = 0xFF122C40;
            cardBgArgb = 0xFF17374F;
            cardBorderArgb = 0xFF2B5E85;
            surfaceBgArgb = 0xFF07121A;
        } else {
            rawText = prefs.getString("todo_text", "Alla uppgifter är avklarade!");
            headerTitle = "✓ UPPGIFTER";
            accentArgb = 0xFFFFD8B8;
            onAccentArgb = 0xFF2B1404;
            pillBgArgb = 0xFF332012;
            cardBgArgb = 0xFF3D2716;
            cardBorderArgb = 0xFF6B4528;
            surfaceBgArgb = 0xFF140C06;
        }

        List<String> items = new ArrayList<>();
        if (!HemWidgetBridge.isEmptyStateMessage(rawText)) {
            for (String line : rawText.trim().split("\\r?\\n")) {
                String clean = line.trim();
                if (clean.startsWith("•")) clean = clean.substring(1).trim();
                if (!clean.isEmpty()) items.add(clean);
            }
        }

        String headerBadge = String.valueOf(items.size());

        // Material 3 Expressive Header Row: Stadium Title Chip + Expressive Action Orb
        LayoutElementBuilders.Row.Builder headerRow = new LayoutElementBuilders.Row.Builder()
            .setWidth(DimensionBuilders.wrap())
            .setHeight(DimensionBuilders.wrap())
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER);

        ModifiersBuilders.Clickable openAppClick = new ModifiersBuilders.Clickable.Builder()
            .setId("open_app_" + mode)
            .setOnClick(buildLaunchWatchAppAction(ctx, mode, false))
            .build();

        headerRow.addContent(
            new LayoutElementBuilders.Box.Builder()
                .setModifiers(
                    new ModifiersBuilders.Modifiers.Builder()
                        .setClickable(openAppClick)
                        .setBackground(
                            new ModifiersBuilders.Background.Builder()
                                .setColor(ColorBuilders.argb(pillBgArgb))
                                .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(999f)).build())
                                .build()
                        )
                        .setBorder(
                            new ModifiersBuilders.Border.Builder()
                                .setWidth(DimensionBuilders.dp(1f))
                                .setColor(ColorBuilders.argb(cardBorderArgb))
                                .build()
                        )
                        .setPadding(
                            new ModifiersBuilders.Padding.Builder()
                                .setStart(DimensionBuilders.dp(11f))
                                .setEnd(DimensionBuilders.dp(11f))
                                .setTop(DimensionBuilders.dp(4.5f))
                                .setBottom(DimensionBuilders.dp(4.5f))
                                .build()
                        )
                        .build()
                )
                .addContent(
                    new LayoutElementBuilders.Text.Builder()
                        .setText(headerTitle + " · " + headerBadge)
                        .setFontStyle(
                            new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(11f))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .setColor(ColorBuilders.argb(accentArgb))
                                .build()
                        )
                        .build()
                )
                .build()
        );

        headerRow.addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(5f)).build());

        if ("shopping".equals(mode) || "todo".equals(mode)) {
            ModifiersBuilders.Clickable quickAddClick = new ModifiersBuilders.Clickable.Builder()
                .setId("quick_add_" + mode)
                .setOnClick(buildLaunchWatchAppAction(ctx, mode, true))
                .build();

            headerRow.addContent(
                new LayoutElementBuilders.Box.Builder()
                    .setModifiers(
                        new ModifiersBuilders.Modifiers.Builder()
                            .setClickable(quickAddClick)
                            .setBackground(
                                new ModifiersBuilders.Background.Builder()
                                    .setColor(ColorBuilders.argb(accentArgb))
                                    .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(999f)).build())
                                    .build()
                            )
                            .setPadding(
                                new ModifiersBuilders.Padding.Builder()
                                    .setStart(DimensionBuilders.dp(9f))
                                    .setEnd(DimensionBuilders.dp(9f))
                                    .setTop(DimensionBuilders.dp(4f))
                                    .setBottom(DimensionBuilders.dp(4f))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText("+ Ny")
                            .setFontStyle(
                                new LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(DimensionBuilders.sp(11f))
                                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                    .setColor(ColorBuilders.argb(onAccentArgb))
                                    .build()
                            )
                            .build()
                    )
                    .build()
            );
        } else {
            ModifiersBuilders.Clickable syncClick = new ModifiersBuilders.Clickable.Builder()
                .setId("sync_now")
                .setOnClick(new ActionBuilders.LoadAction.Builder().build())
                .build();

            headerRow.addContent(
                new LayoutElementBuilders.Box.Builder()
                    .setModifiers(
                        new ModifiersBuilders.Modifiers.Builder()
                            .setClickable(syncClick)
                            .setBackground(
                                new ModifiersBuilders.Background.Builder()
                                    .setColor(ColorBuilders.argb(accentArgb))
                                    .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(999f)).build())
                                    .build()
                            )
                            .setPadding(
                                new ModifiersBuilders.Padding.Builder()
                                    .setStart(DimensionBuilders.dp(8f))
                                    .setEnd(DimensionBuilders.dp(8f))
                                    .setTop(DimensionBuilders.dp(4f))
                                    .setBottom(DimensionBuilders.dp(4f))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText("↻")
                            .setFontStyle(
                                new LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(DimensionBuilders.sp(11f))
                                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                    .setColor(ColorBuilders.argb(onAccentArgb))
                                    .build()
                            )
                            .build()
                    )
                    .build()
            );
        }

        LayoutElementBuilders.Column.Builder col = new LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.wrap())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(headerRow.build())
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(6f)).build());

        if (items.isEmpty()) {
            String emptyMsg = "shopping".equals(mode)
                ? "✓ Inköpslistan är tom"
                : ("calendar".equals(mode) ? "📅 Inga händelser (14 dgr)" : "✓ Allt är avklarat!");

            col.addContent(
                new LayoutElementBuilders.Box.Builder()
                    .setWidth(DimensionBuilders.expand())
                    .setModifiers(
                        new ModifiersBuilders.Modifiers.Builder()
                            .setClickable(openAppClick)
                            .setBackground(
                                new ModifiersBuilders.Background.Builder()
                                    .setColor(ColorBuilders.argb(cardBgArgb))
                                    .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(20f)).build())
                                    .build()
                            )
                            .setBorder(
                                new ModifiersBuilders.Border.Builder()
                                    .setWidth(DimensionBuilders.dp(1.2f))
                                    .setColor(ColorBuilders.argb(cardBorderArgb))
                                    .build()
                            )
                            .setPadding(
                                new ModifiersBuilders.Padding.Builder()
                                    .setAll(DimensionBuilders.dp(13f))
                                    .build()
                            )
                            .build()
                    )
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(emptyMsg)
                            .setMaxLines(2)
                            .setFontStyle(
                                new LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(DimensionBuilders.sp(12f))
                                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                    .setColor(ColorBuilders.argb(accentArgb))
                                    .build()
                            )
                            .build()
                    )
                    .build()
            );
        } else if ("calendar".equals(mode)) {
            int maxRows = Math.min(items.size(), 2);
            for (int i = 0; i < maxRows; i++) {
                String rawLine = items.get(i);
                String colorHex = "#0066FF";
                int colorSep = rawLine.lastIndexOf("||");
                if (colorSep > 0) {
                    String maybeHex = rawLine.substring(colorSep + 2).trim();
                    if (maybeHex.startsWith("#")) colorHex = maybeHex;
                    rawLine = rawLine.substring(0, colorSep).trim();
                }

                String dateTimePart = "Idag";
                String titlePart = rawLine;
                int dashIdx = rawLine.indexOf(" — ");
                if (dashIdx > 0) {
                    dateTimePart = rawLine.substring(0, dashIdx).trim();
                    titlePart = rawLine.substring(dashIdx + 3).trim();
                }

                int eventCardArgb = parseColorSafe(colorHex, 0xFF0066FF);

                LayoutElementBuilders.Column.Builder eventInnerCol = new LayoutElementBuilders.Column.Builder()
                    .setWidth(DimensionBuilders.expand())
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(dateTimePart)
                            .setMaxLines(1)
                            .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                            .setFontStyle(
                                new LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(DimensionBuilders.sp(10f))
                                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                    .setColor(ColorBuilders.argb(0xE6FFFFFF))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(titlePart)
                            .setMaxLines(1)
                            .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                            .setFontStyle(
                                new LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(DimensionBuilders.sp(12.5f))
                                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                    .setColor(ColorBuilders.argb(0xFFFFFFFF))
                                    .build()
                            )
                            .build()
                    );

                col.addContent(
                    new LayoutElementBuilders.Box.Builder()
                        .setWidth(DimensionBuilders.expand())
                        .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
                        .setModifiers(
                            new ModifiersBuilders.Modifiers.Builder()
                                .setClickable(openAppClick)
                                .setBackground(
                                    new ModifiersBuilders.Background.Builder()
                                        .setColor(ColorBuilders.argb(eventCardArgb))
                                        .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(18f)).build())
                                        .build()
                                )
                                .setPadding(
                                    new ModifiersBuilders.Padding.Builder()
                                        .setStart(DimensionBuilders.dp(11f))
                                        .setEnd(DimensionBuilders.dp(11f))
                                        .setTop(DimensionBuilders.dp(5.5f))
                                        .setBottom(DimensionBuilders.dp(5.5f))
                                        .build()
                                )
                                .build()
                        )
                        .addContent(eventInnerCol.build())
                        .build()
                );

                if (i < maxRows - 1) {
                    col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4f)).build());
                }
            }
        } else {
            int maxRows = Math.min(items.size(), 3);
            for (int i = 0; i < maxRows; i++) {
                String rawLine = items.get(i);
                String cleanTitle = rawLine;
                String metaBadge = "";
                int parenIdx = rawLine.lastIndexOf(" (");
                if (parenIdx > 0 && rawLine.endsWith(")")) {
                    cleanTitle = rawLine.substring(0, parenIdx).trim();
                    metaBadge = rawLine.substring(parenIdx + 2, rawLine.length() - 1).trim();
                }

                String prefixIcon = "shopping".equals(mode) ? "○ " : "▢ ";
                String displayRowText = prefixIcon + cleanTitle + (!metaBadge.isEmpty() ? (" · " + metaBadge) : "");
                ModifiersBuilders.Clickable rowClick = new ModifiersBuilders.Clickable.Builder()
                    .setId(("shopping".equals(mode) ? "toggle_shop:" : "toggle_todo:") + cleanTitle)
                    .setOnClick(new ActionBuilders.LoadAction.Builder().build())
                    .build();

                col.addContent(
                    new LayoutElementBuilders.Box.Builder()
                        .setWidth(DimensionBuilders.expand())
                        .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
                        .setModifiers(
                            new ModifiersBuilders.Modifiers.Builder()
                                .setClickable(rowClick)
                                .setBackground(
                                    new ModifiersBuilders.Background.Builder()
                                        .setColor(ColorBuilders.argb(cardBgArgb))
                                        .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(16f)).build())
                                        .build()
                                )
                                .setBorder(
                                    new ModifiersBuilders.Border.Builder()
                                        .setWidth(DimensionBuilders.dp(1f))
                                        .setColor(ColorBuilders.argb(cardBorderArgb))
                                        .build()
                                )
                                .setPadding(
                                    new ModifiersBuilders.Padding.Builder()
                                        .setStart(DimensionBuilders.dp(11f))
                                        .setEnd(DimensionBuilders.dp(11f))
                                        .setTop(DimensionBuilders.dp(5.5f))
                                        .setBottom(DimensionBuilders.dp(5.5f))
                                        .build()
                                )
                                .build()
                        )
                        .addContent(
                            new LayoutElementBuilders.Text.Builder()
                                .setText(displayRowText)
                                .setMaxLines(1)
                                .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                                .setFontStyle(
                                    new LayoutElementBuilders.FontStyle.Builder()
                                        .setSize(DimensionBuilders.sp(12f))
                                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                        .setColor(ColorBuilders.argb(0xFFF5FBF7))
                                        .build()
                                )
                                .build()
                        )
                        .build()
                );

                if (i < maxRows - 1) {
                    col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4f)).build());
                }
            }
        }

        col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(5f)).build());

        int maxShown = "calendar".equals(mode) ? 2 : 3;
        String footerText = items.size() > maxShown
            ? ("+" + (items.size() - maxShown) + " till · Öppna Hem →")
            : "Öppna Hem Klockapp →";

        col.addContent(
            new LayoutElementBuilders.Box.Builder()
                .setModifiers(
                    new ModifiersBuilders.Modifiers.Builder()
                        .setClickable(openAppClick)
                        .setBackground(
                            new ModifiersBuilders.Background.Builder()
                                .setColor(ColorBuilders.argb(pillBgArgb))
                                .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(999f)).build())
                                .build()
                        )
                        .setBorder(
                            new ModifiersBuilders.Border.Builder()
                                .setWidth(DimensionBuilders.dp(1f))
                                .setColor(ColorBuilders.argb(cardBorderArgb))
                                .build()
                        )
                        .setPadding(
                            new ModifiersBuilders.Padding.Builder()
                                .setStart(DimensionBuilders.dp(12f))
                                .setEnd(DimensionBuilders.dp(12f))
                                .setTop(DimensionBuilders.dp(4f))
                                .setBottom(DimensionBuilders.dp(4f))
                                .build()
                        )
                        .build()
                )
                .addContent(
                    new LayoutElementBuilders.Text.Builder()
                        .setText(footerText)
                        .setFontStyle(
                            new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(10.5f))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .setColor(ColorBuilders.argb(accentArgb))
                                .build()
                        )
                        .build()
                )
                .build()
        );

        return new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setModifiers(
                new ModifiersBuilders.Modifiers.Builder()
                    .setBackground(
                        new ModifiersBuilders.Background.Builder()
                            .setColor(ColorBuilders.argb(surfaceBgArgb))
                            .build()
                    )
                    .setPadding(
                        new ModifiersBuilders.Padding.Builder()
                            .setStart(DimensionBuilders.dp(14f))
                            .setEnd(DimensionBuilders.dp(14f))
                            .setTop(DimensionBuilders.dp(10f))
                            .setBottom(DimensionBuilders.dp(10f))
                            .build()
                    )
                    .build()
            )
            .addContent(col.build())
            .build();
    }
}
