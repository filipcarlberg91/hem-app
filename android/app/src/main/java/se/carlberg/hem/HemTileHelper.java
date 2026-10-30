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
    public static final String RESOURCES_VERSION = "hem_wear_m3_expressive_v6";
    private static volatile long lastTileCloudSyncMs = 0L;

    public static void requestUpdateAllTiles(Context ctx) {
        if (ctx == null) return;
        try {
            Context appCtx = ctx.getApplicationContext();
            TileService.getUpdater(appCtx).requestUpdate(HemCalendarTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemShoppingTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemTodoTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemNotesTileService.class);
            TileService.getUpdater(appCtx).requestUpdate(HemBudgetTileService.class);
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
                SharedPreferences tilePrefs = appCtx.getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);
                if (clickedId.startsWith("toggle_shop:")) {
                    String title = clickedId.substring("toggle_shop:".length());
                    HemWidgetBridge.handleWidgetToggleItem(appCtx, "shopping", "", title);
                } else if (clickedId.startsWith("toggle_todo:")) {
                    String title = clickedId.substring("toggle_todo:".length());
                    HemWidgetBridge.handleWidgetToggleItem(appCtx, "todo", "", title);
                } else if (clickedId.startsWith("scroll_up:")) {
                    String targetMode = clickedId.substring("scroll_up:".length());
                    int cur = tilePrefs.getInt("tile_offset_" + targetMode, 0);
                    tilePrefs.edit().putInt("tile_offset_" + targetMode, Math.max(0, cur - 2)).apply();
                } else if (clickedId.startsWith("scroll_down:")) {
                    String targetMode = clickedId.substring("scroll_down:".length());
                    int cur = tilePrefs.getInt("tile_offset_" + targetMode, 0);
                    tilePrefs.edit().putInt("tile_offset_" + targetMode, cur + 2).apply();
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

    private static LayoutElementBuilders.FontStyle.Builder robotoFont(float spSize, boolean bold, int argbColor) {
        return new LayoutElementBuilders.FontStyle.Builder()
            .setSize(DimensionBuilders.sp(spSize))
            .setWeight(bold ? LayoutElementBuilders.FONT_WEIGHT_BOLD : LayoutElementBuilders.FONT_WEIGHT_NORMAL)
            .setColor(ColorBuilders.argb(argbColor));
    }

    private static int parseCategoryColorArgb(String hex, int fallbackArgb) {
        if (hex == null || !hex.startsWith("#")) return fallbackArgb;
        try {
            return android.graphics.Color.parseColor(hex.trim());
        } catch (Throwable ignored) {
            return fallbackArgb;
        }
    }

    private static LayoutElementBuilders.LayoutElement buildScrollBtn(String id, String symbol, int bgArgb, int textArgb) {
        ModifiersBuilders.Clickable click = new ModifiersBuilders.Clickable.Builder()
            .setId(id)
            .setOnClick(new ActionBuilders.LoadAction.Builder().build())
            .build();
        return new LayoutElementBuilders.Box.Builder()
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setModifiers(
                new ModifiersBuilders.Modifiers.Builder()
                    .setClickable(click)
                    .setBackground(
                        new ModifiersBuilders.Background.Builder()
                            .setColor(ColorBuilders.argb(bgArgb))
                            .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(999f)).build())
                            .build()
                    )
                    .setPadding(
                        new ModifiersBuilders.Padding.Builder()
                            .setStart(DimensionBuilders.dp(10f))
                            .setEnd(DimensionBuilders.dp(10f))
                            .setTop(DimensionBuilders.dp(3f))
                            .setBottom(DimensionBuilders.dp(3f))
                            .build()
                    )
                    .build()
            )
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(symbol)
                    .setFontStyle(robotoFont(10f, true, textArgb).build())
                    .build()
            )
            .build();
    }

    private static LayoutElementBuilders.LayoutElement buildRootLayout(Context ctx, String mode) {
        SharedPreferences prefs = ctx.getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);

        String rawText;
        String headerTitle;
        String bottomBtnLabel;
        int surfaceBgArgb;
        int accentArgb;
        int heroTitleArgb;
        int heroSubArgb;
        int secondaryBgArgb;
        int secondaryTitleArgb;
        int secondarySubArgb;
        int bottomBtnBgArgb;
        int bottomBtnTextArgb;

        if ("calendar".equals(mode)) {
            rawText = prefs.getString("cal_text", "Inga inplanerade händelser närmaste 2 veckorna");
            headerTitle = "KALENDER";
            bottomBtnLabel = "+ Händelse";
            surfaceBgArgb = 0xFF0B192C;
            accentArgb = 0xFF93C5FD;
            heroTitleArgb = 0xFF0F172A;
            heroSubArgb = 0xFF1E3A8A;
            secondaryBgArgb = 0xFF1E3A8A;
            secondaryTitleArgb = 0xFFEFF6FF;
            secondarySubArgb = 0xFF93C5FD;
            bottomBtnBgArgb = 0xFF3B82F6;
            bottomBtnTextArgb = 0xFFFFFFFF;
        } else if ("shopping".equals(mode)) {
            rawText = prefs.getString("shop_text", "Inköpslistan är tom");
            headerTitle = "INKÖPSLISTA";
            bottomBtnLabel = "+ Lägg till";
            surfaceBgArgb = 0xFF271206;
            accentArgb = 0xFFFDBA74;
            heroTitleArgb = 0xFF431407;
            heroSubArgb = 0xFF7C2D12;
            secondaryBgArgb = 0xFF7C2D12;
            secondaryTitleArgb = 0xFFFFEDD5;
            secondarySubArgb = 0xFFFDBA74;
            bottomBtnBgArgb = 0xFFEA580C;
            bottomBtnTextArgb = 0xFFFFFFFF;
        } else if ("todo".equals(mode)) {
            rawText = prefs.getString("todo_text", "Alla uppgifter är avklarade!");
            headerTitle = "ATT GÖRA";
            bottomBtnLabel = "+ Ny uppgift";
            surfaceBgArgb = 0xFF082216;
            accentArgb = 0xFF86EFAC;
            heroTitleArgb = 0xFF064E3B;
            heroSubArgb = 0xFF047857;
            secondaryBgArgb = 0xFF14532D;
            secondaryTitleArgb = 0xFFDCFCE7;
            secondarySubArgb = 0xFF86EFAC;
            bottomBtnBgArgb = 0xFF10B981;
            bottomBtnTextArgb = 0xFF052E16;
        } else if ("notes".equals(mode)) {
            rawText = prefs.getString("notes_text", "Inga anteckningar ännu");
            headerTitle = "ANTECKNINGAR";
            bottomBtnLabel = "+ Anteckning";
            surfaceBgArgb = 0xFF231B05;
            accentArgb = 0xFFFEF08A;
            heroTitleArgb = 0xFF422006;
            heroSubArgb = 0xFF713F12;
            secondaryBgArgb = 0xFF713F12;
            secondaryTitleArgb = 0xFFFEF9C3;
            secondarySubArgb = 0xFFFDE047;
            bottomBtnBgArgb = 0xFFEAB308;
            bottomBtnTextArgb = 0xFF422006;
        } else {
            rawText = prefs.getString("budget_text", "Inga utgifter registrerade");
            headerTitle = "BUDGET";
            bottomBtnLabel = "+ Utgift";
            surfaceBgArgb = 0xFF1B102E;
            accentArgb = 0xFFC4B5FD;
            heroTitleArgb = 0xFF1E1B4B;
            heroSubArgb = 0xFF4C1D95;
            secondaryBgArgb = 0xFF3B0764;
            secondaryTitleArgb = 0xFFE9D5FF;
            secondarySubArgb = 0xFFC4B5FD;
            bottomBtnBgArgb = 0xFFA855F7;
            bottomBtnTextArgb = 0xFFFFFFFF;
        }

        List<String> items = new ArrayList<>();
        if (!HemWidgetBridge.isEmptyStateMessage(rawText)) {
            for (String line : rawText.trim().split("\\r?\\n")) {
                String clean = line.trim();
                if (clean.startsWith("•")) clean = clean.substring(1).trim();
                if (!clean.isEmpty()) items.add(clean);
            }
        }

        int maxVisible = "budget".equals(mode) ? 2 : 4;
        int savedOffset = prefs.getInt("tile_offset_" + mode, 0);
        int maxStart = Math.max(0, items.size() - maxVisible);
        int offset = Math.max(0, Math.min(savedOffset, maxStart));

        ModifiersBuilders.Clickable openAppClick = new ModifiersBuilders.Clickable.Builder()
            .setId("open_app_" + mode)
            .setOnClick(buildLaunchWatchAppAction(ctx, mode, false))
            .build();

        ModifiersBuilders.Clickable quickAddClick = new ModifiersBuilders.Clickable.Builder()
            .setId("quick_add_" + mode)
            .setOnClick(buildLaunchWatchAppAction(ctx, mode, true))
            .build();

        LayoutElementBuilders.Column.Builder col = new LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.wrap())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER);

        // Header Row WITHOUT top page dots + Up/Down scroll controls when list has more items
        LayoutElementBuilders.Row.Builder headerRow = new LayoutElementBuilders.Row.Builder()
            .setWidth(DimensionBuilders.wrap())
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER);

        if (items.size() > maxVisible && offset > 0) {
            headerRow.addContent(buildScrollBtn("scroll_up:" + mode, "▲", accentArgb, heroTitleArgb));
            headerRow.addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(6f)).build());
        }

        String titleWithCount = items.size() > maxVisible
            ? (headerTitle + " (" + (offset + 1) + "–" + Math.min(items.size(), offset + maxVisible) + "/" + items.size() + ")")
            : headerTitle;

        headerRow.addContent(
            new LayoutElementBuilders.Text.Builder()
                .setText(titleWithCount)
                .setModifiers(new ModifiersBuilders.Modifiers.Builder().setClickable(openAppClick).build())
                .setFontStyle(robotoFont(10.5f, true, accentArgb).build())
                .build()
        );

        if (items.size() > maxVisible && offset + maxVisible < items.size()) {
            headerRow.addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(6f)).build());
            headerRow.addContent(buildScrollBtn("scroll_down:" + mode, "▼", accentArgb, heroTitleArgb));
        }

        col.addContent(headerRow.build());
        col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4f)).build());

        if ("budget".equals(mode)) {
            String remVal = HemWidgetBridge.getBudgetRemainingDisplay(prefs);
            String spentVal = HemWidgetBridge.getBudgetSpentDisplay(prefs);

            LayoutElementBuilders.Column.Builder heroInner = new LayoutElementBuilders.Column.Builder()
                .setWidth(DimensionBuilders.expand())
                .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
                .addContent(
                    new LayoutElementBuilders.Text.Builder()
                        .setText("KVAR: " + remVal)
                        .setMaxLines(1)
                        .setFontStyle(robotoFont(13f, true, heroTitleArgb).build())
                        .build()
                )
                .addContent(
                    new LayoutElementBuilders.Text.Builder()
                        .setText("Utgifter: " + spentVal)
                        .setMaxLines(1)
                        .setFontStyle(robotoFont(9.5f, false, heroSubArgb).build())
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
                                    .setColor(ColorBuilders.argb(accentArgb))
                                    .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(18f)).build())
                                    .build()
                            )
                            .setPadding(
                                new ModifiersBuilders.Padding.Builder()
                                    .setStart(DimensionBuilders.dp(12f))
                                    .setEnd(DimensionBuilders.dp(12f))
                                    .setTop(DimensionBuilders.dp(5f))
                                    .setBottom(DimensionBuilders.dp(5f))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(heroInner.build())
                    .build()
            );

            int endIdx = Math.min(items.size(), offset + maxVisible);
            for (int i = offset; i < endIdx; i++) {
                col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(3f)).build());
                String rawExp = items.get(i);
                String expTitle = rawExp;
                String expAmt = "";
                int pipeIdx = rawExp.indexOf("||");
                int dashIdx = rawExp.indexOf(" — ");
                if (pipeIdx > 0) {
                    expTitle = rawExp.substring(0, pipeIdx).trim();
                    expAmt = rawExp.substring(pipeIdx + 2).trim();
                } else if (dashIdx > 0) {
                    expTitle = rawExp.substring(0, dashIdx).trim();
                    expAmt = rawExp.substring(dashIdx + 3).trim();
                }
                col.addContent(
                    buildSecondaryTonalCard(
                        openAppClick,
                        expTitle + (!expAmt.isEmpty() ? (" · " + expAmt) : ""),
                        secondaryBgArgb,
                        secondaryTitleArgb
                    )
                );
            }
        } else if (items.isEmpty()) {
            String emptyMsg = "shopping".equals(mode)
                ? "Inköpslistan är tom"
                : ("calendar".equals(mode)
                    ? "Inga händelser (14 dgr)"
                    : ("notes".equals(mode) ? "Inga anteckningar" : "Allt är avklarat!"));

            col.addContent(
                new LayoutElementBuilders.Box.Builder()
                    .setWidth(DimensionBuilders.expand())
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
                    .setModifiers(
                        new ModifiersBuilders.Modifiers.Builder()
                            .setClickable(openAppClick)
                            .setBackground(
                                new ModifiersBuilders.Background.Builder()
                                    .setColor(ColorBuilders.argb(secondaryBgArgb))
                                    .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(18f)).build())
                                    .build()
                            )
                            .setPadding(
                                new ModifiersBuilders.Padding.Builder()
                                    .setAll(DimensionBuilders.dp(12f))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(emptyMsg)
                            .setMaxLines(2)
                            .setFontStyle(robotoFont(11.5f, true, secondaryTitleArgb).build())
                            .build()
                    )
                    .build()
            );
        } else {
            // Render up to 4 UNIFORM cards (no highlighted first item; calendar uses category colors!)
            int endIdx = Math.min(items.size(), offset + maxVisible);
            for (int i = offset; i < endIdx; i++) {
                if (i > offset) {
                    col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(3f)).build());
                }
                String rawLine = items.get(i);
                int rowBgArgb = secondaryBgArgb;
                int rowTextArgb = secondaryTitleArgb;
                String displayLine = rawLine;
                ModifiersBuilders.Clickable rowClick = openAppClick;

                if ("calendar".equals(mode)) {
                    int colorSep = rawLine.lastIndexOf("||");
                    if (colorSep > 0) {
                        String hex = rawLine.substring(colorSep + 2).trim();
                        rowBgArgb = parseCategoryColorArgb(hex, secondaryBgArgb);
                        rowTextArgb = 0xFFFFFFFF;
                        displayLine = rawLine.substring(0, colorSep).trim();
                    }
                    int dashIdx = displayLine.indexOf(" — ");
                    if (dashIdx > 0) {
                        String meta = displayLine.substring(0, dashIdx).trim();
                        String title = displayLine.substring(dashIdx + 3).trim();
                        int pipeIdx = meta.indexOf("|");
                        if (pipeIdx > 0) {
                            String dPart = meta.substring(0, pipeIdx).trim();
                            String tPart = meta.substring(pipeIdx + 1).trim();
                            if (dPart.length() == 10) dPart = dPart.substring(5);
                            meta = dPart + " " + tPart;
                        }
                        displayLine = meta + " · " + title;
                    }
                } else if ("notes".equals(mode)) {
                    int pipeIdx = rawLine.indexOf("||");
                    int dashIdx = rawLine.indexOf(" — ");
                    if (pipeIdx > 0) {
                        String nTitle = rawLine.substring(0, pipeIdx).trim();
                        String nBody = rawLine.substring(pipeIdx + 2).trim().replace(" · ", " ");
                        displayLine = nBody.isEmpty() ? nTitle : (nTitle + " — " + nBody);
                    } else if (dashIdx > 0) {
                        displayLine = rawLine;
                    }
                } else {
                    String cleanTitle = rawLine;
                    int parenIdx = rawLine.lastIndexOf(" (");
                    if (parenIdx > 0 && rawLine.endsWith(")")) {
                        cleanTitle = rawLine.substring(0, parenIdx).trim();
                    }
                    displayLine = "○  " + rawLine;
                    rowClick = new ModifiersBuilders.Clickable.Builder()
                        .setId(("shopping".equals(mode) ? "toggle_shop:" : "toggle_todo:") + cleanTitle)
                        .setOnClick(new ActionBuilders.LoadAction.Builder().build())
                        .build();
                }

                col.addContent(
                    buildSecondaryTonalCard(
                        rowClick,
                        displayLine,
                        rowBgArgb,
                        rowTextArgb
                    )
                );
            }
        }

        col.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(5f)).build());

        // Material 3 Expressive wide bottom-hugging button on every Tile
        col.addContent(
            new LayoutElementBuilders.Box.Builder()
                .setWidth(DimensionBuilders.dp(138f))
                .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
                .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
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
                                .setStart(DimensionBuilders.dp(18f))
                                .setEnd(DimensionBuilders.dp(18f))
                                .setTop(DimensionBuilders.dp(6.5f))
                                .setBottom(DimensionBuilders.dp(6.5f))
                                .build()
                        )
                        .build()
                )
                .addContent(
                    new LayoutElementBuilders.Text.Builder()
                        .setText(bottomBtnLabel)
                        .setFontStyle(robotoFont(11.5f, true, heroTitleArgb).build())
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
                            .setStart(DimensionBuilders.dp(13f))
                            .setEnd(DimensionBuilders.dp(13f))
                            .setTop(DimensionBuilders.dp(6f))
                            .setBottom(DimensionBuilders.dp(6f))
                            .build()
                    )
                    .build()
            )
            .addContent(col.build())
            .build();
    }

    private static LayoutElementBuilders.LayoutElement buildSecondaryTonalCard(
        ModifiersBuilders.Clickable click,
        String text,
        int bgArgb,
        int textArgb
    ) {
        return new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
            .setModifiers(
                new ModifiersBuilders.Modifiers.Builder()
                    .setClickable(click)
                    .setBackground(
                        new ModifiersBuilders.Background.Builder()
                            .setColor(ColorBuilders.argb(bgArgb))
                            .setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(22f)).build())
                            .build()
                    )
                    .setPadding(
                        new ModifiersBuilders.Padding.Builder()
                            .setStart(DimensionBuilders.dp(13f))
                            .setEnd(DimensionBuilders.dp(13f))
                            .setTop(DimensionBuilders.dp(5f))
                            .setBottom(DimensionBuilders.dp(5f))
                            .build()
                    )
                    .build()
            )
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(text)
                    .setMaxLines(1)
                    .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                    .setFontStyle(robotoFont(11f, true, textArgb).build())
                    .build()
            )
            .build();
    }
}
