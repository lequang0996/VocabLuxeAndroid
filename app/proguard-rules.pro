# Giữ các hàm gọi được từ JavaScript (AndroidBridge)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.vocabluxe.app.MainActivity$Bridge { *; }
