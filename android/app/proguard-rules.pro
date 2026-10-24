# Keep JavascriptInterface annotations and methods for WebView bridge
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-keepattributes Signature,InnerClasses,EnclosingMethod

# Keep Hem native classes and JavascriptInterface methods intact
-keep class se.carlberg.hem.** { *; }
-keepclassmembers class se.carlberg.hem.** {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Wear OS TileService & ProtoLayout classes intact
-keep class androidx.wear.tiles.** { *; }

# Keep Capacitor core Activity and Plugin entry points
-keep class com.getcapacitor.BridgeActivity { *; }
-keep class com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
    @com.getcapacitor.PluginMethod <methods>;
}

-dontwarn com.google.android.**
-dontwarn com.google.common.**
-dontwarn androidx.**
-dontwarn org.chromium.**
