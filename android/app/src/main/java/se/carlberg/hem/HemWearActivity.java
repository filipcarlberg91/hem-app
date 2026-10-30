package se.carlberg.hem;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.text.InputType;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.Window;
import android.view.animation.DecelerateInterpolator;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class HemWearActivity extends Activity {
    private static final int REQ_VOICE_ADD = 9501;
    private static final String[] PAGES = new String[]{
        "calendar", "shopping", "todo", "notes", "budget"
    };

    private int activePageIdx = 0;
    private int currentScreenBgArgb = Color.parseColor("#0B192C");
    private boolean isAnimatingPage = false;
    private boolean allowExplicitFinish = false;
    private float touchStartX = 0f;
    private float touchStartY = 0f;

    private FrameLayout outerRoot;
    private ScrollView rootScroll;
    private LinearLayout contentCol;
    private LinearLayout dotsRow;
    private TextView pageTitleTv;
    private TextView pageSubTv;
    private LinearLayout listContainer;
    private TextView primaryBottomBtn;
    private TextView voiceBottomBtn;
    private TextView accountFooterBtn;

    private Typeface robotoBold;
    private Typeface robotoMedium;
    private Typeface robotoRegular;

    private final Runnable hideDotsRunnable = new Runnable() {
        @Override
        public void run() {
            if (dotsRow != null) {
                dotsRow.animate()
                    .alpha(0f)
                    .setDuration(360)
                    .start();
            }
        }
    };

    private void showTopDotsTemporarily() {
        if (dotsRow == null) return;
        dotsRow.removeCallbacks(hideDotsRunnable);
        dotsRow.animate().cancel();
        dotsRow.setAlpha(1f);
        dotsRow.postDelayed(hideDotsRunnable, 1150);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        robotoBold = Typeface.create("sans-serif", Typeface.BOLD);
        robotoMedium = Typeface.create("sans-serif-medium", Typeface.NORMAL);
        robotoRegular = Typeface.create("sans-serif", Typeface.NORMAL);

        HemSyncService.ensureDefaultAccountConfig(this);
        HemSyncService.scheduleNextAlarm(this);
        HemSyncService.startServiceSafe(this);

        if (getIntent() != null) {
            applyTabFromIntent(getIntent());
        }

        buildWatchUi();
        registerWearBackAndSwipeBlockers();
        disallowSystemSwipeToDismiss(dp(110));
        if (outerRoot != null) {
            outerRoot.post(() -> disallowSystemSwipeToDismiss(dp(110)));
        }

        if (getIntent() != null && "true".equals(getIntent().getStringExtra("quick_add"))) {
            getIntent().removeExtra("quick_add");
            showQuickAddDialogForActivePage();
        }

        triggerCloudSync(false);
    }

    @Override
    protected void onResume() {
        super.onResume();
        disallowSystemSwipeToDismiss(dp(110));
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            disallowSystemSwipeToDismiss(dp(110));
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null) {
            applyTabFromIntent(intent);
            refreshWatchContent();
            if ("true".equals(intent.getStringExtra("quick_add"))) {
                intent.removeExtra("quick_add");
                showQuickAddDialogForActivePage();
            }
        }
    }

    private void applyTabFromIntent(Intent intent) {
        String tabExtra = intent.getStringExtra("open_tab");
        if (tabExtra == null) return;
        for (int i = 0; i < PAGES.length; i++) {
            if (PAGES[i].equals(tabExtra)) {
                activePageIdx = i;
                return;
            }
        }
    }

    private String getActiveTab() {
        return PAGES[activePageIdx];
    }

    private int getScreenBgForPage(int idx) {
        String m = PAGES[Math.max(0, Math.min(PAGES.length - 1, idx))];
        if ("calendar".equals(m)) return Color.parseColor("#0B192C");
        if ("shopping".equals(m)) return Color.parseColor("#271206");
        if ("todo".equals(m)) return Color.parseColor("#082216");
        if ("notes".equals(m)) return Color.parseColor("#231B05");
        return Color.parseColor("#1B102E");
    }

    private void animateToPage(final int targetIdx, final int direction) {
        if (targetIdx < 0 || targetIdx >= PAGES.length || targetIdx == activePageIdx || isAnimatingPage) {
            return;
        }
        isAnimatingPage = true;
        showTopDotsTemporarily();

        final int fromBg = currentScreenBgArgb;
        final int toBg = getScreenBgForPage(targetIdx);

        ValueAnimator bgAnim = ValueAnimator.ofObject(new ArgbEvaluator(), fromBg, toBg);
        bgAnim.setDuration(260);
        bgAnim.addUpdateListener(anim -> {
            int col = (int) anim.getAnimatedValue();
            currentScreenBgArgb = col;
            if (outerRoot != null) outerRoot.setBackgroundColor(col);
            if (rootScroll != null) rootScroll.setBackgroundColor(col);
        });
        bgAnim.start();

        if (contentCol == null) {
            activePageIdx = targetIdx;
            refreshWatchContent();
            showTopDotsTemporarily();
            isAnimatingPage = false;
            return;
        }

        final float slideOutX = -direction * dp(34);
        final float slideInStartX = direction * dp(38);

        contentCol.animate()
            .translationX(slideOutX)
            .alpha(0.12f)
            .setDuration(105)
            .withEndAction(() -> {
                activePageIdx = targetIdx;
                if (rootScroll != null) {
                    rootScroll.scrollTo(0, 0);
                }
                refreshWatchContent();
                showTopDotsTemporarily();
                contentCol.setTranslationX(slideInStartX);
                contentCol.setAlpha(0.18f);
                contentCol.animate()
                    .translationX(0f)
                    .alpha(1f)
                    .setDuration(220)
                    .setInterpolator(new DecelerateInterpolator(1.6f))
                    .withEndAction(() -> isAnimatingPage = false)
                    .start();
            })
            .start();
    }

    private void registerWearBackAndSwipeBlockers() {
        try {
            if (Build.VERSION.SDK_INT >= 33) {
                Method getDispatcher = Activity.class.getMethod("getOnBackInvokedDispatcher");
                Object dispatcher = getDispatcher.invoke(this);
                if (dispatcher != null) {
                    Class<?> callbackInterface = Class.forName("android.window.OnBackInvokedCallback");
                    Object proxyCallback = Proxy.newProxyInstance(
                        callbackInterface.getClassLoader(),
                        new Class<?>[]{callbackInterface},
                        (proxy, method, args) -> {
                            if ("onBackInvoked".equals(method.getName())) {
                                runOnUiThread(() -> {
                                    if (activePageIdx > 0) {
                                        animateToPage(activePageIdx - 1, -1);
                                    } else {
                                        showTopDotsTemporarily();
                                    }
                                });
                            }
                            return null;
                        }
                    );
                    Method registerMethod = dispatcher.getClass().getMethod(
                        "registerOnBackInvokedCallback",
                        int.class,
                        callbackInterface
                    );
                    // Register at both default (0) and system overlay (1000000) priority
                    registerMethod.invoke(dispatcher, 0, proxyCallback);
                    registerMethod.invoke(dispatcher, 1000000, proxyCallback);
                }
            }
        } catch (Throwable ignored) {
        }
    }

    private void disableSwipeDismissOnViewTree(View v) {
        if (v == null) return;
        try {
            String clsName = v.getClass().getName();
            if (clsName.contains("SwipeDismiss")) {
                for (Method m : v.getClass().getMethods()) {
                    if ("setSwipeable".equals(m.getName()) && m.getParameterTypes().length == 1) {
                        m.invoke(v, false);
                    } else if ("setDismissMinDragWidthRatio".equals(m.getName()) && m.getParameterTypes().length == 1) {
                        m.invoke(v, 10.0f);
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        if (v instanceof ViewGroup) {
            ViewGroup vg = (ViewGroup) v;
            for (int i = 0; i < vg.getChildCount(); i++) {
                disableSwipeDismissOnViewTree(vg.getChildAt(i));
            }
        }
    }

    private void disallowSystemSwipeToDismiss() {
        disallowSystemSwipeToDismiss(dp(110));
    }

    private void disallowSystemSwipeToDismiss(float focusY) {
        try {
            if (outerRoot != null) {
                outerRoot.requestDisallowInterceptTouchEvent(true);
                ViewParent p = outerRoot.getParent();
                while (p != null) {
                    p.requestDisallowInterceptTouchEvent(true);
                    if (p instanceof View) {
                        disableSwipeDismissOnViewTree((View) p);
                    }
                    p = p.getParent();
                }
            }
            if (getWindow() != null) {
                View decor = getWindow().getDecorView();
                if (decor != null) {
                    disableSwipeDismissOnViewTree(decor);
                    if (Build.VERSION.SDK_INT >= 29) {
                        int w = Math.max(500, decor.getWidth() > 0 ? decor.getWidth() : dp(260));
                        int h = Math.max(500, decor.getHeight() > 0 ? decor.getHeight() : dp(260));
                        // Android 10+ enforces a strict 200dp max height per edge for system gesture exclusion.
                        // Passing a 190dp band centered around the touch Y ensures WindowManager 100% honors it!
                        int halfBand = dp(95);
                        int cy = focusY > 0 ? (int) focusY : (h / 2);
                        int top = Math.max(0, cy - halfBand);
                        int bottom = Math.min(h, top + dp(190));
                        List<Rect> exclusions = Collections.singletonList(new Rect(0, top, w, bottom));
                        decor.setSystemGestureExclusionRects(exclusions);
                        if (outerRoot != null) {
                            outerRoot.setSystemGestureExclusionRects(exclusions);
                        }
                    }
                }
            }
        } catch (Throwable ignored) {
        }
    }

    @Override
    public void onBackPressed() {
        // Left-to-right swipe / back gesture switches to the previous page on the left
        // and NEVER closes the app. User exits the app via the physical watch crown!
        if (activePageIdx > 0) {
            animateToPage(activePageIdx - 1, -1);
        } else {
            showTopDotsTemporarily();
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event != null && event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_UP) {
                if (activePageIdx > 0) {
                    animateToPage(activePageIdx - 1, -1);
                } else {
                    showTopDotsTemporarily();
                }
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void finish() {
        if (!allowExplicitFinish) {
            if (activePageIdx > 0) {
                animateToPage(activePageIdx - 1, -1);
            } else {
                showTopDotsTemporarily();
            }
            return;
        }
        super.finish();
    }

    @Override
    public void finishAfterTransition() {
        if (!allowExplicitFinish) {
            if (activePageIdx > 0) {
                animateToPage(activePageIdx - 1, -1);
            } else {
                showTopDotsTemporarily();
            }
            return;
        }
        super.finishAfterTransition();
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (ev != null) {
            switch (ev.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    touchStartX = ev.getRawX();
                    touchStartY = ev.getRawY();
                    disallowSystemSwipeToDismiss(touchStartY);
                    break;
                case MotionEvent.ACTION_MOVE: {
                    disallowSystemSwipeToDismiss(ev.getRawY());
                    float moveDx = ev.getRawX() - touchStartX;
                    float moveDy = ev.getRawY() - touchStartY;
                    if (Math.abs(moveDx) > dp(10) && Math.abs(moveDx) > Math.abs(moveDy) * 1.02f) {
                        showTopDotsTemporarily();
                    }
                    break;
                }
                case MotionEvent.ACTION_UP: {
                    float dx = ev.getRawX() - touchStartX;
                    float dy = ev.getRawY() - touchStartY;

                    // Horizontal swipe LEFT/RIGHT to scroll between pages
                    if (Math.abs(dx) > dp(22) && Math.abs(dx) > Math.abs(dy) * 1.02f) {
                        if (dx < 0 && activePageIdx < PAGES.length - 1) {
                            animateToPage(activePageIdx + 1, 1);
                            return true;
                        } else if (dx > 0 && activePageIdx > 0) {
                            animateToPage(activePageIdx - 1, -1);
                            return true;
                        } else {
                            showTopDotsTemporarily();
                            return true;
                        }
                    }
                    break;
                }
            }
        }
        return super.dispatchTouchEvent(ev);
    }

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent ev) {
        if (ev != null && ev.getAction() == MotionEvent.ACTION_SCROLL && rootScroll != null) {
            float vScroll = -ev.getAxisValue(MotionEvent.AXIS_VSCROLL);
            if (Math.abs(vScroll) < 0.001f) {
                vScroll = -ev.getAxisValue(MotionEvent.AXIS_SCROLL);
            }
            if (Math.abs(vScroll) > 0.001f) {
                int deltaPx = Math.round(vScroll * dp(48));
                rootScroll.smoothScrollBy(0, deltaPx);
                return true;
            }
        }
        return super.dispatchGenericMotionEvent(ev);
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

    private GradientDrawable roundedShape(int fillArgb, int strokeArgb, float radiusDp) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(fillArgb);
        gd.setCornerRadius(dp(radiusDp));
        if (strokeArgb != 0) {
            gd.setStroke(dp(1.6f), strokeArgb);
        }
        return gd;
    }

    private int parseCategoryColor(String hex, int fallbackArgb) {
        if (hex == null || !hex.startsWith("#")) return fallbackArgb;
        try {
            return Color.parseColor(hex.trim());
        } catch (Throwable ignored) {
            return fallbackArgb;
        }
    }

    private void buildWatchUi() {
        outerRoot = new FrameLayout(this);
        outerRoot.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        rootScroll = new ScrollView(this);
        rootScroll.setFillViewport(true);
        rootScroll.setVerticalScrollBarEnabled(false);
        rootScroll.setFocusable(true);
        rootScroll.setFocusableInTouchMode(true);
        rootScroll.requestFocus();
        rootScroll.setOnGenericMotionListener((v, ev) -> {
            if (ev != null && ev.getAction() == MotionEvent.ACTION_SCROLL) {
                float vScroll = -ev.getAxisValue(MotionEvent.AXIS_VSCROLL);
                if (Math.abs(vScroll) < 0.001f) {
                    vScroll = -ev.getAxisValue(MotionEvent.AXIS_SCROLL);
                }
                if (Math.abs(vScroll) > 0.001f) {
                    rootScroll.smoothScrollBy(0, Math.round(vScroll * dp(48)));
                    return true;
                }
            }
            return false;
        });

        contentCol = new LinearLayout(this);
        contentCol.setOrientation(LinearLayout.VERTICAL);
        contentCol.setGravity(Gravity.CENTER_HORIZONTAL);
        contentCol.setPadding(dp(16), dp(18), dp(16), dp(34));

        // Clean Header without directional arrows
        pageTitleTv = new TextView(this);
        pageTitleTv.setText("KALENDER");
        pageTitleTv.setTextSize(13f);
        pageTitleTv.setTypeface(robotoBold);
        pageTitleTv.setLetterSpacing(0.06f);
        pageTitleTv.setGravity(Gravity.CENTER);
        pageTitleTv.setPadding(dp(6), 0, dp(6), 0);
        pageTitleTv.setOnClickListener(v -> triggerCloudSync(true));
        contentCol.addView(pageTitleTv);

        pageSubTv = new TextView(this);
        pageSubTv.setText("14 dagar framåt");
        pageSubTv.setTextSize(9.5f);
        pageSubTv.setTypeface(robotoMedium);
        pageSubTv.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        subLp.bottomMargin = dp(8);
        contentCol.addView(pageSubTv, subLp);

        // Uniform Cards Container
        listContainer = new LinearLayout(this);
        listContainer.setOrientation(LinearLayout.VERTICAL);
        listContainer.setLayoutParams(new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        contentCol.addView(listContainer);

        // Bottom Material 3 Expressive Curved Edge Action Row
        LinearLayout bottomRow = new LinearLayout(this);
        bottomRow.setOrientation(LinearLayout.HORIZONTAL);
        bottomRow.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams bottomRowLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        bottomRowLp.topMargin = dp(10);

        primaryBottomBtn = new TextView(this);
        primaryBottomBtn.setText("+ Händelse");
        primaryBottomBtn.setTextSize(12.5f);
        primaryBottomBtn.setTypeface(robotoBold);
        primaryBottomBtn.setGravity(Gravity.CENTER);
        primaryBottomBtn.setPadding(dp(26), dp(11), dp(26), dp(11));
        primaryBottomBtn.setOnClickListener(v -> showQuickAddDialogForActivePage());
        LinearLayout.LayoutParams primLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        primLp.rightMargin = dp(6);
        bottomRow.addView(primaryBottomBtn, primLp);

        voiceBottomBtn = new TextView(this);
        voiceBottomBtn.setText("🎤");
        voiceBottomBtn.setTextSize(12.5f);
        voiceBottomBtn.setTypeface(robotoBold);
        voiceBottomBtn.setGravity(Gravity.CENTER);
        voiceBottomBtn.setPadding(dp(14), dp(11), dp(14), dp(11));
        voiceBottomBtn.setOnClickListener(v -> launchVoiceAdd());
        bottomRow.addView(voiceBottomBtn);

        contentCol.addView(bottomRow, bottomRowLp);

        // Subtle Sync & Account capsule at very bottom
        SharedPreferences syncPrefs = getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
        String currentEmail = syncPrefs.getString("email", "filipcarlberg91@gmail.com");

        accountFooterBtn = new TextView(this);
        accountFooterBtn.setText("↻ Synka · " + currentEmail);
        accountFooterBtn.setTextSize(9.5f);
        accountFooterBtn.setTypeface(robotoMedium);
        accountFooterBtn.setGravity(Gravity.CENTER);
        accountFooterBtn.setPadding(dp(14), dp(6), dp(14), dp(6));
        accountFooterBtn.setOnClickListener(v -> showAccountDialog());
        LinearLayout.LayoutParams accLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        accLp.topMargin = dp(8);
        contentCol.addView(accountFooterBtn, accLp);

        rootScroll.addView(contentCol);
        outerRoot.addView(rootScroll);

        // Top 5-dot page indicator (appears on horizontal scroll/page change, then fades out)
        dotsRow = new LinearLayout(this);
        dotsRow.setOrientation(LinearLayout.HORIZONTAL);
        dotsRow.setGravity(Gravity.CENTER);
        dotsRow.setPadding(dp(8), dp(3), dp(8), dp(3));
        dotsRow.setAlpha(0f);
        FrameLayout.LayoutParams dotsRowLp = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.TOP | Gravity.CENTER_HORIZONTAL
        );
        dotsRowLp.topMargin = dp(6);
        outerRoot.addView(dotsRow, dotsRowLp);

        setContentView(outerRoot);
        outerRoot.post(this::disallowSystemSwipeToDismiss);
        outerRoot.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> disallowSystemSwipeToDismiss());
        refreshWatchContent();
    }

    private void showNoteDetailDialog(String title, String body) {
        ScrollView sv = new ScrollView(this);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(18), dp(16), dp(18), dp(18));
        box.setBackgroundColor(Color.parseColor("#231B05"));

        TextView titleTv = new TextView(this);
        titleTv.setText(title);
        titleTv.setTextSize(15f);
        titleTv.setTypeface(robotoBold);
        titleTv.setTextColor(Color.parseColor("#FEF08A"));
        box.addView(titleTv);

        String formattedBody = (body == null || body.trim().isEmpty())
            ? "Ingen brödtext i anteckningen"
            : body.replace(" · ", "\n\n").trim();

        TextView bodyTv = new TextView(this);
        bodyTv.setText(formattedBody);
        bodyTv.setTextSize(13f);
        bodyTv.setTypeface(robotoRegular);
        bodyTv.setTextColor(Color.parseColor("#FEF9C3"));
        bodyTv.setLineSpacing(dp(2), 1.1f);
        LinearLayout.LayoutParams bodyLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        bodyLp.topMargin = dp(8);
        box.addView(bodyTv, bodyLp);

        TextView closeBtn = new TextView(this);
        closeBtn.setText("Stäng");
        closeBtn.setTextSize(12f);
        closeBtn.setTypeface(robotoBold);
        closeBtn.setTextColor(Color.parseColor("#422006"));
        closeBtn.setGravity(Gravity.CENTER);
        closeBtn.setPadding(dp(20), dp(9), dp(20), dp(9));
        closeBtn.setBackground(roundedShape(Color.parseColor("#EAB308"), 0, 999f));
        LinearLayout.LayoutParams closeLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        closeLp.topMargin = dp(14);
        box.addView(closeBtn, closeLp);

        sv.addView(box);

        final AlertDialog dialog = new AlertDialog.Builder(this)
            .setView(sv)
            .create();
        closeBtn.setOnClickListener(v -> dialog.dismiss());
        dialog.show();
    }

    private void refreshWatchContent() {
        if (listContainer == null) return;
        listContainer.removeAllViews();

        String mode = getActiveTab();
        SharedPreferences prefs = getSharedPreferences(HemWidgetBridge.PREFS_WIDGETS, Context.MODE_PRIVATE);

        String pageTitle;
        String pageSub;
        String bottomBtnText;
        String rawText;
        int screenBgArgb;
        int heroBgArgb;
        int heroTitleArgb;
        int heroSubArgb;
        int secBgArgb;
        int secTitleArgb;
        int secSubArgb;
        int btnBgArgb;
        int btnTextArgb;
        int inactiveDotArgb;

        if ("calendar".equals(mode)) {
            pageTitle = "KALENDER";
            pageSub = "14 dagar framåt";
            bottomBtnText = "+ Händelse";
            rawText = prefs.getString("cal_text", "Inga inplanerade händelser närmaste 2 veckorna");
            screenBgArgb = Color.parseColor("#0B192C");
            heroBgArgb = Color.parseColor("#93C5FD");
            heroTitleArgb = Color.parseColor("#0F172A");
            heroSubArgb = Color.parseColor("#1E3A8A");
            secBgArgb = Color.parseColor("#1E3A8A");
            secTitleArgb = Color.parseColor("#EFF6FF");
            secSubArgb = Color.parseColor("#93C5FD");
            btnBgArgb = Color.parseColor("#3B82F6");
            btnTextArgb = Color.parseColor("#FFFFFF");
            inactiveDotArgb = Color.parseColor("#1E3A8A");
        } else if ("shopping".equals(mode)) {
            pageTitle = "INKÖPSLISTA";
            pageSub = "Tryck på vara för att bocka av";
            bottomBtnText = "+ Lägg till";
            rawText = prefs.getString("shop_text", "Inköpslistan är tom");
            screenBgArgb = Color.parseColor("#271206");
            heroBgArgb = Color.parseColor("#FDBA74");
            heroTitleArgb = Color.parseColor("#431407");
            heroSubArgb = Color.parseColor("#7C2D12");
            secBgArgb = Color.parseColor("#7C2D12");
            secTitleArgb = Color.parseColor("#FFEDD5");
            secSubArgb = Color.parseColor("#FDBA74");
            btnBgArgb = Color.parseColor("#EA580C");
            btnTextArgb = Color.parseColor("#FFFFFF");
            inactiveDotArgb = Color.parseColor("#7C2D12");
        } else if ("todo".equals(mode)) {
            pageTitle = "ATT GÖRA";
            pageSub = "Tryck för att klarmarkera";
            bottomBtnText = "+ Ny uppgift";
            rawText = prefs.getString("todo_text", "Alla uppgifter är avklarade!");
            screenBgArgb = Color.parseColor("#082216");
            heroBgArgb = Color.parseColor("#86EFAC");
            heroTitleArgb = Color.parseColor("#064E3B");
            heroSubArgb = Color.parseColor("#047857");
            secBgArgb = Color.parseColor("#14532D");
            secTitleArgb = Color.parseColor("#DCFCE7");
            secSubArgb = Color.parseColor("#86EFAC");
            btnBgArgb = Color.parseColor("#10B981");
            btnTextArgb = Color.parseColor("#052E16");
            inactiveDotArgb = Color.parseColor("#14532D");
        } else if ("notes".equals(mode)) {
            pageTitle = "ANTECKNINGAR";
            pageSub = "Tryck på anteckning för att läsa";
            bottomBtnText = "+ Anteckning";
            rawText = prefs.getString("notes_text", "Inga anteckningar ännu");
            screenBgArgb = Color.parseColor("#231B05");
            heroBgArgb = Color.parseColor("#FEF08A");
            heroTitleArgb = Color.parseColor("#422006");
            heroSubArgb = Color.parseColor("#713F12");
            secBgArgb = Color.parseColor("#713F12");
            secTitleArgb = Color.parseColor("#FEF9C3");
            secSubArgb = Color.parseColor("#FDE047");
            btnBgArgb = Color.parseColor("#EAB308");
            btnTextArgb = Color.parseColor("#422006");
            inactiveDotArgb = Color.parseColor("#713F12");
        } else {
            pageTitle = "BUDGET";
            pageSub = "Månadsöversikt & utgifter";
            bottomBtnText = "+ Utgift";
            rawText = prefs.getString("budget_text", "Inga utgifter registrerade");
            screenBgArgb = Color.parseColor("#1B102E");
            heroBgArgb = Color.parseColor("#C4B5FD");
            heroTitleArgb = Color.parseColor("#1E1B4B");
            heroSubArgb = Color.parseColor("#4C1D95");
            secBgArgb = Color.parseColor("#3B0764");
            secTitleArgb = Color.parseColor("#E9D5FF");
            secSubArgb = Color.parseColor("#C4B5FD");
            btnBgArgb = Color.parseColor("#A855F7");
            btnTextArgb = Color.parseColor("#FFFFFF");
            inactiveDotArgb = Color.parseColor("#4C1D95");
        }

        currentScreenBgArgb = screenBgArgb;
        if (!isAnimatingPage) {
            outerRoot.setBackgroundColor(screenBgArgb);
            rootScroll.setBackgroundColor(screenBgArgb);
        }
        pageTitleTv.setText(pageTitle);
        pageTitleTv.setTextColor(heroBgArgb);
        pageSubTv.setText(pageSub);
        pageSubTv.setTextColor(secSubArgb);

        // Render horizontal 5 Page Dots at the top of the watch screen
        if (dotsRow != null) {
            dotsRow.removeAllViews();
            for (int i = 0; i < PAGES.length; i++) {
                boolean isCurrent = (i == activePageIdx);
                View dot = new View(this);
                LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(
                    dp(isCurrent ? 16f : 5.5f),
                    dp(5.5f)
                );
                dlp.leftMargin = dp(2.5f);
                dlp.rightMargin = dp(2.5f);
                dot.setLayoutParams(dlp);
                dot.setBackground(roundedShape(isCurrent ? heroBgArgb : inactiveDotArgb, 0, 999f));
                dotsRow.addView(dot);
            }
        }

        // Style bottom Material 3 Expressive tonal action buttons
        primaryBottomBtn.setText(bottomBtnText);
        primaryBottomBtn.setTextColor(heroTitleArgb);
        primaryBottomBtn.setBackground(roundedShape(heroBgArgb, 0, 999f));

        voiceBottomBtn.setTextColor(secTitleArgb);
        voiceBottomBtn.setBackground(roundedShape(secBgArgb, 0, 999f));

        accountFooterBtn.setTextColor(secSubArgb);
        accountFooterBtn.setBackground(roundedShape(secBgArgb, 0, 999f));

        List<String> lines = new ArrayList<>();
        if (!HemWidgetBridge.isEmptyStateMessage(rawText)) {
            for (String s : rawText.trim().split("\\r?\\n")) {
                String clean = s.trim();
                if (clean.startsWith("•")) clean = clean.substring(1).trim();
                if (!clean.isEmpty()) lines.add(clean);
            }
        }

        if ("budget".equals(mode)) {
            String remVal = HemWidgetBridge.getBudgetRemainingDisplay(prefs);
            String spentVal = HemWidgetBridge.getBudgetSpentDisplay(prefs);

            LinearLayout heroCard = new LinearLayout(this);
            heroCard.setOrientation(LinearLayout.VERTICAL);
            heroCard.setPadding(dp(15), dp(12), dp(15), dp(12));
            heroCard.setBackground(roundedShape(heroBgArgb, 0, 22f));
            LinearLayout.LayoutParams heroLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            heroLp.bottomMargin = dp(7);

            TextView labelTv = new TextView(this);
            labelTv.setText("KVAR ATT ANVÄNDA");
            labelTv.setTextSize(10f);
            labelTv.setTypeface(robotoBold);
            labelTv.setTextColor(heroSubArgb);
            heroCard.addView(labelTv);

            TextView amountTv = new TextView(this);
            amountTv.setText(remVal);
            amountTv.setTextSize(20f);
            amountTv.setTypeface(robotoBold);
            amountTv.setTextColor(heroTitleArgb);
            heroCard.addView(amountTv);

            TextView spentTv = new TextView(this);
            spentTv.setText("Utgifter denna månad: " + spentVal);
            spentTv.setTextSize(11f);
            spentTv.setTypeface(robotoMedium);
            spentTv.setTextColor(heroSubArgb);
            heroCard.addView(spentTv);

            listContainer.addView(heroCard, heroLp);

            for (String expLine : lines) {
                String expTitle = expLine;
                String expAmt = "";
                int pipeIdx = expLine.indexOf("||");
                int dashIdx = expLine.indexOf(" — ");
                if (pipeIdx > 0) {
                    expTitle = expLine.substring(0, pipeIdx).trim();
                    expAmt = expLine.substring(pipeIdx + 2).trim();
                } else if (dashIdx > 0) {
                    expTitle = expLine.substring(0, dashIdx).trim();
                    expAmt = expLine.substring(dashIdx + 3).trim();
                }

                LinearLayout secCard = new LinearLayout(this);
                secCard.setOrientation(LinearLayout.HORIZONTAL);
                secCard.setGravity(Gravity.CENTER_VERTICAL);
                secCard.setPadding(dp(14), dp(10), dp(14), dp(10));
                secCard.setBackground(roundedShape(secBgArgb, 0, 20f));
                LinearLayout.LayoutParams secLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                secLp.bottomMargin = dp(6);

                TextView tTv = new TextView(this);
                tTv.setText(expTitle);
                tTv.setTextSize(13f);
                tTv.setTypeface(robotoBold);
                tTv.setTextColor(secTitleArgb);
                secCard.addView(tTv, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

                if (!expAmt.isEmpty()) {
                    TextView aTv = new TextView(this);
                    aTv.setText(expAmt);
                    aTv.setTextSize(12f);
                    aTv.setTypeface(robotoBold);
                    aTv.setTextColor(secSubArgb);
                    secCard.addView(aTv);
                }

                listContainer.addView(secCard, secLp);
            }
            return;
        }

        if (lines.isEmpty()) {
            LinearLayout emptyCard = new LinearLayout(this);
            emptyCard.setOrientation(LinearLayout.VERTICAL);
            emptyCard.setGravity(Gravity.CENTER);
            emptyCard.setPadding(dp(16), dp(16), dp(16), dp(16));
            emptyCard.setBackground(roundedShape(secBgArgb, 0, 20f));

            TextView emptyTv = new TextView(this);
            emptyTv.setText(rawText);
            emptyTv.setTextSize(13f);
            emptyTv.setTypeface(robotoBold);
            emptyTv.setTextColor(secTitleArgb);
            emptyTv.setGravity(Gravity.CENTER);
            emptyCard.addView(emptyTv);

            listContainer.addView(emptyCard);
            return;
        }

        // Render ALL list items with the exact same uniform card style (no first-item highlight!)
        for (int idx = 0; idx < lines.size(); idx++) {
            final String rawItemLine = lines.get(idx);

            if ("calendar".equals(mode)) {
                String workingLine = rawItemLine;
                int catColorArgb = secBgArgb;
                int colorSep = workingLine.lastIndexOf("||");
                if (colorSep > 0) {
                    String hex = workingLine.substring(colorSep + 2).trim();
                    catColorArgb = parseCategoryColor(hex, secBgArgb);
                    workingLine = workingLine.substring(0, colorSep).trim();
                }

                String dateTimePart = "Idag";
                String titlePart = workingLine;
                int dashIdx = workingLine.indexOf(" — ");
                if (dashIdx > 0) {
                    dateTimePart = workingLine.substring(0, dashIdx).trim().replace("|", " · ");
                    titlePart = workingLine.substring(dashIdx + 3).trim();
                }

                LinearLayout calCard = new LinearLayout(this);
                calCard.setOrientation(LinearLayout.VERTICAL);
                calCard.setPadding(dp(14), dp(10), dp(14), dp(10));
                calCard.setBackground(roundedShape(catColorArgb, 0, 20f));
                LinearLayout.LayoutParams calLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                calLp.bottomMargin = dp(6);

                TextView dtTv = new TextView(this);
                dtTv.setText(dateTimePart.toUpperCase(Locale.forLanguageTag("sv-SE")));
                dtTv.setTextSize(10f);
                dtTv.setTypeface(robotoBold);
                dtTv.setTextColor(Color.parseColor("#E2E8F0"));
                calCard.addView(dtTv);

                TextView tTv = new TextView(this);
                tTv.setText(titlePart);
                tTv.setTextSize(13.5f);
                tTv.setTypeface(robotoBold);
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

            if ("notes".equals(mode)) {
                String noteTitle = rawItemLine;
                String noteBody = "";
                int pipeIdx = rawItemLine.indexOf("||");
                int dashIdx = rawItemLine.indexOf(" — ");
                if (pipeIdx > 0) {
                    noteTitle = rawItemLine.substring(0, pipeIdx).trim();
                    noteBody = rawItemLine.substring(pipeIdx + 2).trim();
                } else if (dashIdx > 0) {
                    noteTitle = rawItemLine.substring(0, dashIdx).trim();
                    noteBody = rawItemLine.substring(dashIdx + 3).trim();
                }
                final String dialogTitle = noteTitle;
                final String dialogBody = noteBody;
                String previewSingleLine = noteBody.replace(" · ", " ").trim();

                LinearLayout noteCard = new LinearLayout(this);
                noteCard.setOrientation(LinearLayout.VERTICAL);
                noteCard.setPadding(dp(14), dp(10), dp(14), dp(10));
                noteCard.setBackground(roundedShape(secBgArgb, 0, 20f));
                LinearLayout.LayoutParams noteLp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                noteLp.bottomMargin = dp(6);

                TextView tTv = new TextView(this);
                tTv.setText(noteTitle);
                tTv.setTextSize(13.5f);
                tTv.setTypeface(robotoBold);
                tTv.setTextColor(secTitleArgb);
                noteCard.addView(tTv);

                if (!previewSingleLine.isEmpty()) {
                    TextView pTv = new TextView(this);
                    pTv.setText(previewSingleLine);
                    pTv.setTextSize(11.5f);
                    pTv.setTypeface(robotoRegular);
                    pTv.setTextColor(secSubArgb);
                    pTv.setMaxLines(2);
                    LinearLayout.LayoutParams pLp = new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    );
                    pLp.topMargin = dp(2);
                    noteCard.addView(pTv, pLp);
                }

                noteCard.setOnClickListener(v -> showNoteDetailDialog(dialogTitle, dialogBody));

                listContainer.addView(noteCard, noteLp);
                continue;
            }

            // Shopping & Todo Cards: uniform card style + unchecked hollow circle ring
            String workingLine = rawItemLine;
            int colorSep = workingLine.lastIndexOf("||");
            if (colorSep > 0) {
                workingLine = workingLine.substring(0, colorSep).trim();
            }

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(dp(14), dp(10), dp(14), dp(10));
            row.setBackground(roundedShape(secBgArgb, 0, 20f));
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

            LinearLayout textCol = new LinearLayout(this);
            textCol.setOrientation(LinearLayout.VERTICAL);

            TextView titleTv = new TextView(this);
            titleTv.setText(cleanTitle);
            titleTv.setTextSize(13.5f);
            titleTv.setTypeface(robotoBold);
            titleTv.setTextColor(secTitleArgb);
            textCol.addView(titleTv);

            if (!metaBadge.isEmpty()) {
                TextView metaTv = new TextView(this);
                metaTv.setText(metaBadge);
                metaTv.setTextSize(11f);
                metaTv.setTypeface(robotoMedium);
                metaTv.setTextColor(secSubArgb);
                textCol.addView(metaTv);
            }

            row.addView(textCol, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

            View checkCircle = new View(this);
            checkCircle.setBackground(roundedShape(0x00000000, secSubArgb, 999f));
            LinearLayout.LayoutParams chkLp = new LinearLayout.LayoutParams(dp(22), dp(22));
            chkLp.leftMargin = dp(8);
            row.addView(checkCircle, chkLp);

            row.setOnClickListener(v -> {
                HemWidgetBridge.handleWidgetToggleItem(getApplicationContext(), mode, rawItemLine, itemTitleForAction);
                Toast.makeText(this, "✓ " + itemTitleForAction, Toast.LENGTH_SHORT).show();
                refreshWatchContent();
            });

            listContainer.addView(row, rowLp);
        }
    }

    private void launchVoiceAdd() {
        try {
            String mode = getActiveTab();
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "sv-SE");
            String prompt = "Säg vad du vill lägga till...";
            if ("shopping".equals(mode)) prompt = "Säg en vara att handla...";
            else if ("todo".equals(mode)) prompt = "Säg en ny uppgift...";
            else if ("notes".equals(mode)) prompt = "Diktera en anteckning...";
            else if ("calendar".equals(mode)) prompt = "Säg en kalenderhändelse...";
            else if ("budget".equals(mode)) prompt = "Säg utgift och belopp...";
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, prompt);
            startActivityForResult(intent, REQ_VOICE_ADD);
        } catch (Throwable e) {
            showQuickAddDialogForActivePage();
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
                    String mode = getActiveTab();
                    if ("todo".equals(mode)) {
                        HemWidgetBridge.handleWidgetQuickAddTodoItem(getApplicationContext(), spoken);
                    } else if ("notes".equals(mode)) {
                        HemWidgetBridge.handleWidgetQuickAddNoteItem(getApplicationContext(), spoken, spoken);
                    } else if ("calendar".equals(mode)) {
                        HemWidgetBridge.handleWidgetQuickAddCalendarEvent(getApplicationContext(), spoken, "12:00");
                    } else if ("budget".equals(mode)) {
                        String digits = spoken.replaceAll("[^0-9]", "");
                        String amtStr = digits.isEmpty() ? "100" : digits;
                        HemWidgetBridge.handleWidgetQuickAddBudgetExpense(getApplicationContext(), spoken, amtStr);
                    } else {
                        HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), spoken, "1", "st");
                    }
                    Toast.makeText(this, "Lade till: " + spoken, Toast.LENGTH_SHORT).show();
                    refreshWatchContent();
                }
            }
        }
    }

    private void showQuickAddDialogForActivePage() {
        String mode = getActiveTab();
        AlertDialog.Builder builder = new AlertDialog.Builder(this);

        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(14), dp(8), dp(14), dp(4));

        final EditText primaryInput = new EditText(this);
        primaryInput.setSingleLine(true);
        primaryInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);

        final EditText secondaryInput = new EditText(this);
        secondaryInput.setSingleLine(true);

        if ("calendar".equals(mode)) {
            builder.setTitle("Ny händelse");
            primaryInput.setHint("Titel (t.ex. Middag)");
            secondaryInput.setHint("Tid (t.ex. 18:00)");
            secondaryInput.setText("18:00");
            form.addView(primaryInput);
            form.addView(secondaryInput);
        } else if ("shopping".equals(mode)) {
            builder.setTitle("Lägg till vara");
            primaryInput.setHint("T.ex. Havremjölk");
            secondaryInput.setHint("Mängd (t.ex. 2)");
            secondaryInput.setText("1");
            form.addView(primaryInput);
            form.addView(secondaryInput);
        } else if ("todo".equals(mode)) {
            builder.setTitle("Ny uppgift");
            primaryInput.setHint("T.ex. Vattna blommorna");
            form.addView(primaryInput);
        } else if ("notes".equals(mode)) {
            builder.setTitle("Ny anteckning");
            primaryInput.setHint("Rubrik");
            secondaryInput.setHint("Innehåll...");
            form.addView(primaryInput);
            form.addView(secondaryInput);
        } else {
            builder.setTitle("Ny utgift");
            primaryInput.setHint("Vad? (t.ex. Lunch, ICA)");
            secondaryInput.setHint("Belopp i kr (t.ex. 145)");
            secondaryInput.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
            form.addView(primaryInput);
            form.addView(secondaryInput);
        }

        builder.setView(form);

        builder.setPositiveButton("Spara", (dialog, which) -> {
            String val1 = primaryInput.getText().toString().trim();
            String val2 = secondaryInput.getText().toString().trim();
            if (val1.isEmpty()) return;

            if ("calendar".equals(mode)) {
                HemWidgetBridge.handleWidgetQuickAddCalendarEvent(getApplicationContext(), val1, val2.isEmpty() ? "12:00" : val2);
            } else if ("shopping".equals(mode)) {
                HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), val1, val2.isEmpty() ? "1" : val2, "st");
            } else if ("todo".equals(mode)) {
                HemWidgetBridge.handleWidgetQuickAddTodoItem(getApplicationContext(), val1);
            } else if ("notes".equals(mode)) {
                HemWidgetBridge.handleWidgetQuickAddNoteItem(getApplicationContext(), val1, val2.isEmpty() ? val1 : val2);
            } else {
                String amtStr = val2.replace(",", ".").replaceAll("[^0-9.]", "");
                if (amtStr.isEmpty()) amtStr = "100";
                HemWidgetBridge.handleWidgetQuickAddBudgetExpense(getApplicationContext(), val1, amtStr);
            }
            Toast.makeText(this, "Sparat: " + val1, Toast.LENGTH_SHORT).show();
            refreshWatchContent();
        });

        builder.setNegativeButton("Avbryt", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    private void showAccountDialog() {
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
                accountFooterBtn.setText("↻ Synka · " + newEmail);
                triggerCloudSync(true);
            }
        });
        builder.setNegativeButton("Avbryt", (dialog, which) -> dialog.cancel());
        builder.show();
    }
}
