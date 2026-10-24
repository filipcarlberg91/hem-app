package se.carlberg.hem;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public class HemWearActivity extends Activity {
    private static final int REQ_VOICE_ADD = 9501;
    private String activeTab = "shopping";
    private ScrollView rootScroll;
    private LinearLayout listContainer;
    private TextView brandChip;
    private TextView tabShopBtn;
    private TextView tabCalBtn;
    private TextView tabTodoBtn;
    private TextView statusSubText;
    private LinearLayout quickActionsRow;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        HemSyncService.ensureDefaultAccountConfig(this);
        HemSyncService.scheduleNextAlarm(this);
        HemSyncService.startServiceSafe(this);

        if (getIntent() != null) {
            String tabExtra = getIntent().getStringExtra("open_tab");
            if ("calendar".equals(tabExtra) || "todo".equals(tabExtra) || "shopping".equals(tabExtra)) {
                activeTab = tabExtra;
            }
        }

        buildWatchUi();

        if (getIntent() != null && "true".equals(getIntent().getStringExtra("quick_add"))) {
            getIntent().removeExtra("quick_add");
            showTextAddDialog();
        }

        triggerCloudSync(false);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null) {
            String tabExtra = intent.getStringExtra("open_tab");
            if ("calendar".equals(tabExtra) || "todo".equals(tabExtra) || "shopping".equals(tabExtra)) {
                activeTab = tabExtra;
            }
            refreshWatchContent();
            if ("true".equals(intent.getStringExtra("quick_add"))) {
                intent.removeExtra("quick_add");
                showTextAddDialog();
            }
        }
    }

    private void triggerCloudSync(boolean showToast) {
        if (showToast) {
            Toast.makeText(this, "Synkar med Hem...", Toast.LENGTH_SHORT).show();
        }
        new Thread(() -> {
            HemSyncService.pollCloudOnce(getApplicationContext());
            runOnUiThread(this::refreshWatchContent);
        }).start();
    }

    private int dp(float v) {
        return (int) (v * getResources().getDisplayMetrics().density);
    }

    private GradientDrawable pillDrawable(int fillArgb, int strokeArgb, float radiusDp) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(fillArgb);
        gd.setCornerRadius(dp(radiusDp));
        if (strokeArgb != 0) {
            gd.setStroke(dp(1.4f), strokeArgb);
        }
        return gd;
    }

    private void buildWatchUi() {
        rootScroll = new ScrollView(this);
        rootScroll.setBackgroundColor(Color.parseColor("#07120C"));
        rootScroll.setFillViewport(true);
        rootScroll.setFocusable(true);
        rootScroll.setFocusableInTouchMode(true);
        rootScroll.requestFocus();

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        // Round watch screen safe padding (top/bottom extra margin for circular bezels)
        root.setPadding(dp(12), dp(20), dp(12), dp(38));

        brandChip = new TextView(this);
        brandChip.setText("✦ HEM · M3 EXPRESSIVE");
        brandChip.setTextSize(9.5f);
        brandChip.setTypeface(Typeface.DEFAULT_BOLD);
        brandChip.setTextColor(Color.parseColor("#A6F2C6"));
        brandChip.setGravity(Gravity.CENTER);
        brandChip.setPadding(dp(11), dp(4), dp(11), dp(4));
        brandChip.setBackground(pillDrawable(Color.parseColor("#132D20"), Color.parseColor("#285C42"), 999f));
        LinearLayout.LayoutParams brandLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        brandLp.bottomMargin = dp(4);
        root.addView(brandChip, brandLp);

        statusSubText = new TextView(this);
        statusSubText.setText("Inköpslista · Tryck för att bocka av");
        statusSubText.setTextSize(10.5f);
        statusSubText.setTypeface(Typeface.DEFAULT_BOLD);
        statusSubText.setTextColor(Color.parseColor("#96BDAA"));
        statusSubText.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        subLp.bottomMargin = dp(8);
        root.addView(statusSubText, subLp);

        // Material 3 Expressive Segmented Mode Switcher Row
        HorizontalScrollView tabScroll = new HorizontalScrollView(this);
        tabScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout tabRow = new LinearLayout(this);
        tabRow.setOrientation(LinearLayout.HORIZONTAL);
        tabRow.setGravity(Gravity.CENTER);
        tabRow.setPadding(dp(4), dp(4), dp(4), dp(4));
        tabRow.setBackground(pillDrawable(Color.parseColor("#102118"), Color.parseColor("#1E3D2C"), 999f));

        tabShopBtn = createTabPill("🛒 Inköp", "shopping");
        tabCalBtn = createTabPill("📅 Schema", "calendar");
        tabTodoBtn = createTabPill("✓ Uppgift", "todo");

        tabRow.addView(tabShopBtn);
        tabRow.addView(tabCalBtn);
        tabRow.addView(tabTodoBtn);
        tabScroll.addView(tabRow);

        LinearLayout.LayoutParams tabScrollLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        tabScrollLp.bottomMargin = dp(8);
        root.addView(tabScroll, tabScrollLp);

        // Expressive Quick Actions Row (Voice Add / Text Add / Sync)
        quickActionsRow = new LinearLayout(this);
        quickActionsRow.setOrientation(LinearLayout.HORIZONTAL);
        quickActionsRow.setGravity(Gravity.CENTER);

        TextView voiceBtn = new TextView(this);
        voiceBtn.setText("🎤 Röst");
        voiceBtn.setTextSize(11.5f);
        voiceBtn.setTypeface(Typeface.DEFAULT_BOLD);
        voiceBtn.setTextColor(Color.parseColor("#062112"));
        voiceBtn.setPadding(dp(12), dp(6.5f), dp(12), dp(6.5f));
        voiceBtn.setBackground(pillDrawable(Color.parseColor("#A6F2C6"), 0, 999f));
        voiceBtn.setOnClickListener(v -> launchVoiceAdd());
        LinearLayout.LayoutParams vLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        vLp.rightMargin = dp(5);
        quickActionsRow.addView(voiceBtn, vLp);

        TextView textAddBtn = new TextView(this);
        textAddBtn.setText("+ Skriv");
        textAddBtn.setTextSize(11.5f);
        textAddBtn.setTypeface(Typeface.DEFAULT_BOLD);
        textAddBtn.setTextColor(Color.parseColor("#A6F2C6"));
        textAddBtn.setPadding(dp(12), dp(6.5f), dp(12), dp(6.5f));
        textAddBtn.setBackground(pillDrawable(Color.parseColor("#173828"), Color.parseColor("#2E6B4D"), 999f));
        textAddBtn.setOnClickListener(v -> showTextAddDialog());
        LinearLayout.LayoutParams tLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        tLp.rightMargin = dp(5);
        quickActionsRow.addView(textAddBtn, tLp);

        TextView syncBtn = new TextView(this);
        syncBtn.setText("↻");
        syncBtn.setTextSize(12f);
        syncBtn.setTypeface(Typeface.DEFAULT_BOLD);
        syncBtn.setTextColor(Color.parseColor("#B8E6FF"));
        syncBtn.setPadding(dp(11), dp(6.5f), dp(11), dp(6.5f));
        syncBtn.setBackground(pillDrawable(Color.parseColor("#132C40"), Color.parseColor("#2A5E87"), 999f));
        syncBtn.setOnClickListener(v -> triggerCloudSync(true));
        quickActionsRow.addView(syncBtn);

        LinearLayout.LayoutParams qaLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        qaLp.bottomMargin = dp(9);
        root.addView(quickActionsRow, qaLp);

        listContainer = new LinearLayout(this);
        listContainer.setOrientation(LinearLayout.VERTICAL);
        listContainer.setLayoutParams(new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        root.addView(listContainer);

        // Footer Account Button
        SharedPreferences syncPrefs = getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
        String currentEmail = syncPrefs.getString("email", "filipcarlberg91@gmail.com");

        TextView accountBtn = new TextView(this);
        accountBtn.setText("Konto: " + currentEmail);
        accountBtn.setTextSize(10f);
        accountBtn.setTypeface(Typeface.DEFAULT_BOLD);
        accountBtn.setTextColor(Color.parseColor("#8AB09B"));
        accountBtn.setGravity(Gravity.CENTER);
        accountBtn.setPadding(dp(12), dp(6), dp(12), dp(6));
        accountBtn.setBackground(pillDrawable(Color.parseColor("#102219"), Color.parseColor("#1F4230"), 999f));
        accountBtn.setOnClickListener(v -> showAccountDialog(accountBtn));
        LinearLayout.LayoutParams accLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        accLp.topMargin = dp(12);
        root.addView(accountBtn, accLp);

        rootScroll.addView(root);
        setContentView(rootScroll);
        refreshWatchContent();
    }

    private TextView createTabPill(String label, final String tabId) {
        TextView tv = new TextView(this);
        tv.setText(label);
        tv.setTextSize(11f);
        tv.setTypeface(Typeface.DEFAULT_BOLD);
        tv.setPadding(dp(11), dp(5.5f), dp(11), dp(5.5f));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.leftMargin = dp(2);
        lp.rightMargin = dp(2);
        tv.setLayoutParams(lp);
        tv.setOnClickListener(v -> {
            activeTab = tabId;
            refreshWatchContent();
        });
        return tv;
    }

    private void updateTabStyles() {
        styleOneTab(tabShopBtn, "shopping".equals(activeTab), "#A6F2C6", "#062112", "#142B20");
        styleOneTab(tabCalBtn, "calendar".equals(activeTab), "#B8E6FF", "#061E2E", "#12293B");
        styleOneTab(tabTodoBtn, "todo".equals(activeTab), "#FFD8B8", "#2B1404", "#301E10");

        if (rootScroll != null && brandChip != null) {
            if ("calendar".equals(activeTab)) {
                rootScroll.setBackgroundColor(Color.parseColor("#061017"));
                brandChip.setTextColor(Color.parseColor("#B8E6FF"));
                brandChip.setBackground(pillDrawable(Color.parseColor("#11293B"), Color.parseColor("#285B80"), 999f));
            } else if ("todo".equals(activeTab)) {
                rootScroll.setBackgroundColor(Color.parseColor("#120B06"));
                brandChip.setTextColor(Color.parseColor("#FFD8B8"));
                brandChip.setBackground(pillDrawable(Color.parseColor("#2E1D10"), Color.parseColor("#613E23"), 999f));
            } else {
                rootScroll.setBackgroundColor(Color.parseColor("#07120C"));
                brandChip.setTextColor(Color.parseColor("#A6F2C6"));
                brandChip.setBackground(pillDrawable(Color.parseColor("#132D20"), Color.parseColor("#285C42"), 999f));
            }
        }
    }

    private void styleOneTab(TextView tv, boolean active, String activeAccentHex, String onAccentHex, String inactiveBgHex) {
        if (tv == null) return;
        if (active) {
            tv.setTextColor(Color.parseColor(onAccentHex));
            tv.setBackground(pillDrawable(Color.parseColor(activeAccentHex), 0, 999f));
        } else {
            tv.setTextColor(Color.parseColor(activeAccentHex));
            tv.setBackground(pillDrawable(Color.parseColor(inactiveBgHex), 0, 999f));
        }
    }

    private void refreshWatchContent() {
        if (listContainer == null) return;
        updateTabStyles();
        listContainer.removeAllViews();

        SharedPreferences prefs = getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);
        String rawText;
        if ("shopping".equals(activeTab)) {
            rawText = prefs.getString("shop_text", "Inköpslistan är tom");
            statusSubText.setText("Inköpslista · Tryck för att bocka av");
        } else if ("calendar".equals(activeTab)) {
            rawText = prefs.getString("cal_text", "Inga inplanerade händelser närmaste 2 veckorna");
            statusSubText.setText("Kalender · 14 dagar framåt");
        } else {
            rawText = prefs.getString("todo_text", "Alla uppgifter är avklarade!");
            statusSubText.setText("Att göra · Tryck för att klarmarkera");
        }

        List<String> lines = new ArrayList<>();
        if (!HemWidgetBridge.isEmptyStateMessage(rawText)) {
            for (String s : rawText.trim().split("\\r?\\n")) {
                String clean = s.trim();
                if (clean.startsWith("•")) clean = clean.substring(1).trim();
                if (!clean.isEmpty()) lines.add(clean);
            }
        }

        if (lines.isEmpty()) {
            TextView emptyTv = new TextView(this);
            emptyTv.setText(rawText);
            emptyTv.setTextSize(12.5f);
            emptyTv.setTypeface(Typeface.DEFAULT_BOLD);
            emptyTv.setTextColor(Color.parseColor("#E2F5EA"));
            emptyTv.setGravity(Gravity.CENTER);
            emptyTv.setPadding(dp(16), dp(18), dp(16), dp(18));
            emptyTv.setBackground(pillDrawable(Color.parseColor("#13291E"), Color.parseColor("#295740"), 24f));
            listContainer.addView(emptyTv);
            return;
        }

        for (final String rawItemLine : lines) {
            String workingLine = rawItemLine;
            String colorHex = "#0066FF";
            int colorSep = workingLine.lastIndexOf("||");
            if (colorSep > 0) {
                String maybeHex = workingLine.substring(colorSep + 2).trim();
                if (maybeHex.startsWith("#")) colorHex = maybeHex;
                workingLine = workingLine.substring(0, colorSep).trim();
            }

            if ("calendar".equals(activeTab)) {
                String dateTimePart = "Idag";
                String titlePart = workingLine;
                int dashIdx = workingLine.indexOf(" — ");
                if (dashIdx > 0) {
                    dateTimePart = workingLine.substring(0, dashIdx).trim();
                    titlePart = workingLine.substring(dashIdx + 3).trim();
                }

                int catArgb = Color.parseColor("#0066FF");
                try {
                    catArgb = Color.parseColor(colorHex);
                } catch (Throwable ignored) {}

                LinearLayout calCard = new LinearLayout(this);
                calCard.setOrientation(LinearLayout.VERTICAL);
                calCard.setPadding(dp(14), dp(10), dp(14), dp(10));
                calCard.setBackground(pillDrawable(catArgb, Color.parseColor("#38FFFFFF"), 22f));
                LinearLayout.LayoutParams calLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                calLp.bottomMargin = dp(7);

                TextView dtTv = new TextView(this);
                dtTv.setText(dateTimePart);
                dtTv.setTextSize(11f);
                dtTv.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
                dtTv.setTextColor(Color.parseColor("#EBFFFFFF"));
                calCard.addView(dtTv);

                TextView tTv = new TextView(this);
                tTv.setText(titlePart);
                tTv.setTextSize(14f);
                tTv.setTypeface(Typeface.DEFAULT_BOLD);
                tTv.setTextColor(Color.WHITE);
                LinearLayout.LayoutParams tLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                tLp.topMargin = dp(2);
                calCard.addView(tTv, tLp);

                listContainer.addView(calCard, calLp);
                continue;
            }

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(dp(11), dp(9), dp(11), dp(9));
            int rowBg = "shopping".equals(activeTab) ? Color.parseColor("#153022") : Color.parseColor("#301F12");
            int rowStroke = "shopping".equals(activeTab) ? Color.parseColor("#2B6145") : Color.parseColor("#5E3D23");
            row.setBackground(pillDrawable(rowBg, rowStroke, 20f));
            LinearLayout.LayoutParams rowLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            rowLp.bottomMargin = dp(6);

            String cleanTitle = workingLine;
            String metaBadge = "";
            int parenIdx = workingLine.lastIndexOf(" (");
            if (parenIdx > 0 && workingLine.endsWith(")")) {
                cleanTitle = workingLine.substring(0, parenIdx).trim();
                metaBadge = workingLine.substring(parenIdx + 2, workingLine.length() - 1).trim();
            }
            final String itemTitleForAction = cleanTitle;

            TextView iconTv = new TextView(this);
            iconTv.setText("shopping".equals(activeTab) ? "○" : "✓");
            iconTv.setTextSize(12f);
            iconTv.setTypeface(Typeface.DEFAULT_BOLD);
            iconTv.setGravity(Gravity.CENTER);
            int orbAccent = "shopping".equals(activeTab) ? Color.parseColor("#A6F2C6") : Color.parseColor("#FFD8B8");
            int orbBg = "shopping".equals(activeTab) ? Color.parseColor("#214D37") : Color.parseColor("#4A2F1B");
            iconTv.setTextColor(orbAccent);
            iconTv.setBackground(pillDrawable(orbBg, 0, 10f));
            LinearLayout.LayoutParams orbLp = new LinearLayout.LayoutParams(dp(26), dp(26));
            orbLp.rightMargin = dp(9);
            row.addView(iconTv, orbLp);

            TextView titleTv = new TextView(this);
            titleTv.setText(cleanTitle);
            titleTv.setTextSize(13.5f);
            titleTv.setTypeface(Typeface.DEFAULT_BOLD);
            titleTv.setTextColor(Color.parseColor("#F5FBF7"));
            row.addView(titleTv, new LinearLayout.LayoutParams(
                0,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                1f
            ));

            if (!metaBadge.isEmpty()) {
                TextView metaTv = new TextView(this);
                metaTv.setText(metaBadge);
                metaTv.setTextSize(10.5f);
                metaTv.setTypeface(Typeface.DEFAULT_BOLD);
                metaTv.setTextColor(Color.parseColor("#062112"));
                metaTv.setPadding(dp(8), dp(2.5f), dp(8), dp(2.5f));
                metaTv.setBackground(pillDrawable(orbAccent, 0, 999f));
                LinearLayout.LayoutParams metaLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                metaLp.leftMargin = dp(6);
                row.addView(metaTv, metaLp);
            }

            row.setOnClickListener(v -> {
                HemWidgetBridge.handleWidgetToggleItem(getApplicationContext(), activeTab, rawItemLine, itemTitleForAction);
                Toast.makeText(this, "✓ " + itemTitleForAction, Toast.LENGTH_SHORT).show();
                refreshWatchContent();
            });

            listContainer.addView(row, rowLp);
        }
    }

    private void launchVoiceAdd() {
        try {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "sv-SE");
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "todo".equals(activeTab) ? "Säg en ny uppgift..." : "Säg en vara att handla...");
            startActivityForResult(intent, REQ_VOICE_ADD);
        } catch (Throwable e) {
            showTextAddDialog();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_VOICE_ADD && resultCode == RESULT_OK && data != null) {
            ArrayList<String> matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (matches != null && !matches.isEmpty()) {
                String spoken = matches.get(0).trim();
                if (!spoken.isEmpty()) {
                    if ("todo".equals(activeTab)) {
                        HemWidgetBridge.handleWidgetQuickAddTodoItem(getApplicationContext(), spoken);
                        Toast.makeText(this, "Lade till uppgift: " + spoken, Toast.LENGTH_SHORT).show();
                    } else {
                        activeTab = "shopping";
                        HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), spoken, "1", "st");
                        Toast.makeText(this, "Lade till i inköp: " + spoken, Toast.LENGTH_SHORT).show();
                    }
                    refreshWatchContent();
                }
            }
        }
    }

    private void showTextAddDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        final boolean isTodo = "todo".equals(activeTab);
        builder.setTitle(isTodo ? "Ny uppgift" : "Lägg till vara");

        final EditText input = new EditText(this);
        input.setHint(isTodo ? "T.ex. Dammsuga..." : "T.ex. Mjölk, Bröd...");
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        builder.setView(input);

        builder.setPositiveButton("Lägg till", (dialog, which) -> {
            String val = input.getText().toString().trim();
            if (!val.isEmpty()) {
                if (isTodo) {
                    HemWidgetBridge.handleWidgetQuickAddTodoItem(getApplicationContext(), val);
                } else {
                    activeTab = "shopping";
                    HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), val, "1", "st");
                }
                Toast.makeText(this, "Lade till " + val, Toast.LENGTH_SHORT).show();
                refreshWatchContent();
            }
        });
        builder.setNegativeButton("Avbryt", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    private void showAccountDialog(final TextView accountBtn) {
        SharedPreferences syncPrefs = getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
        String currentEmail = syncPrefs.getString("email", "filipcarlberg91@gmail.com");

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Hushållskonto (E-post)");
        final EditText input = new EditText(this);
        input.setText(currentEmail);
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
        builder.setView(input);

        builder.setPositiveButton("Spara & Synka", (dialog, which) -> {
            String newEmail = input.getText().toString().trim().toLowerCase();
            if (!newEmail.isEmpty()) {
                syncPrefs.edit().putString("email", newEmail).apply();
                accountBtn.setText("Konto: " + newEmail);
                triggerCloudSync(true);
            }
        });
        builder.setNegativeButton("Avbryt", (dialog, which) -> dialog.cancel());
        builder.show();
    }
}
