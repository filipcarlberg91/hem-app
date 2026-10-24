package se.carlberg.hem;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import com.getcapacitor.BridgeActivity;
import java.io.ByteArrayOutputStream;

public class MainActivity extends BridgeActivity {
    private static final int REQ_CAPTURE_IMAGE = 9201;
    private static final int REQ_CAMERA_PERMISSION = 9202;
    private static final int REQ_NOTIF_PERMISSION = 9203;
    private boolean pendingCameraLaunch = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            boolean isWatch = getPackageManager().hasSystemFeature(PackageManager.FEATURE_WATCH)
                || (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_TYPE_MASK) == android.content.res.Configuration.UI_MODE_TYPE_WATCH;
            if (isWatch) {
                Intent wearIntent = new Intent(this, HemWearActivity.class);
                if (getIntent() != null && getIntent().getExtras() != null) {
                    wearIntent.putExtras(getIntent().getExtras());
                }
                startActivity(wearIntent);
                finish();
                return;
            }
            HemSyncService.setAppInForeground(true);
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                this.getBridge().getWebView().addJavascriptInterface(new HemNativeBridge(this), "HemNativeBridge");
                this.getBridge().getWebView().addJavascriptInterface(new HemWidgetBridge(this), "HemWidgetBridge");
            }
            handleWidgetDeepLinkIntent(getIntent());
            HemSyncService.ensureChannel(this);
            HemSyncService.scheduleNextAlarm(this);
            HemSyncService.startServiceSafe(this);

            if (Build.VERSION.SDK_INT >= 33) {
                if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, REQ_NOTIF_PERMISSION);
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                SharedPreferences prefs = getSharedPreferences(HemSyncService.PREFS_NAME, Context.MODE_PRIVATE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName()) && !prefs.getBoolean("asked_battery_opt", false)) {
                    prefs.edit().putBoolean("asked_battery_opt", true).apply();
                    try {
                        Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                        intent.setData(Uri.parse("package:" + getPackageName()));
                        startActivity(intent);
                    } catch (Throwable ignored) {}
                }
            }
        } catch (Throwable ignored) {
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWidgetDeepLinkIntent(intent);
    }

    private void handleWidgetDeepLinkIntent(Intent intent) {
        if (intent == null) return;
        final String openTab = intent.getStringExtra("open_tab");
        if (openTab != null && !openTab.isEmpty()) {
            intent.removeExtra("open_tab");
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                this.getBridge().getWebView().postDelayed(() -> {
                    try {
                        this.getBridge().getWebView().evaluateJavascript(
                            "window.location.hash='#" + openTab + "'; if(window.__hemOpenTab) window.__hemOpenTab('" + openTab + "');",
                            null
                        );
                    } catch (Throwable ignored) {}
                }, 250);
            }
        }
    }

    public boolean ensureCameraPermission(boolean launchCameraAfter) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    pendingCameraLaunch = launchCameraAfter;
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAMERA_PERMISSION);
                    return false;
                }
            }
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    public boolean launchNativeCameraCapture() {
        try {
            if (!ensureCameraPermission(true)) {
                return true;
            }
            runOnUiThread(() -> {
                try {
                    Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    startActivityForResult(takePictureIntent, REQ_CAPTURE_IMAGE);
                } catch (Throwable ignored) {
                }
            });
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_CAMERA_PERMISSION) {
            boolean granted = grantResults != null && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (granted) {
                if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                    this.getBridge().getWebView().post(() -> {
                        try {
                            this.getBridge().getWebView().evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('hem-camera-permission-granted'));",
                                null
                            );
                        } catch (Throwable ignored) {}
                    });
                }
                if (pendingCameraLaunch) {
                    pendingCameraLaunch = false;
                    launchNativeCameraCapture();
                }
            } else {
                pendingCameraLaunch = false;
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_CAPTURE_IMAGE && resultCode == Activity.RESULT_OK && data != null) {
            try {
                Bundle extras = data.getExtras();
                if (extras != null && extras.get("data") instanceof Bitmap) {
                    Bitmap imageBitmap = (Bitmap) extras.get("data");
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    imageBitmap.compress(Bitmap.CompressFormat.JPEG, 90, baos);
                    String base64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);
                    final String dataUrl = "data:image/jpeg;base64," + base64;
                    if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                        this.getBridge().getWebView().post(() -> {
                            try {
                                this.getBridge().getWebView().evaluateJavascript(
                                    "if (window.__onHemNativeCameraCapture) window.__onHemNativeCameraCapture('" + dataUrl + "');",
                                    null
                                );
                            } catch (Throwable ignored) {}
                        });
                    }
                }
            } catch (Throwable ignored) {
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        HemSyncService.setAppInForeground(true);
        HemSyncService.scheduleNextAlarm(this);
        HemSyncService.startServiceSafe(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        HemSyncService.setAppInForeground(false);
        try {
            // Keep WebView JS timers unthrottled while in background and trigger native alarm + service
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                this.getBridge().getWebView().onResume();
                this.getBridge().getWebView().resumeTimers();
            }
            HemSyncService.scheduleNextAlarm(this);
            HemSyncService.startServiceSafe(this);
        } catch (Throwable ignored) {
        }
    }
}
