package com.vocabluxe.app;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.activity.ComponentActivity;
import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.SystemBarStyle;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * VocabLuxe: toàn bộ giao diện (sáng/tối) chạy trong WebView từ thư mục assets/www (không tải trang web nào từ Internet).
 * Cầu nối AndroidBridge làm 3 việc: đọc giọng bằng TextToSpeech của máy, gọi HTTPS tới đúng 2 dịch vụ tra cứu (tatoeba.org, api.dictionaryapi.dev),
 * và đồng bộ màu thanh hệ thống với giao diện sáng/tối.
 */
public class MainActivity extends ComponentActivity {

    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + ASSET_HOST + "/assets/www/index.html";
    /** Màu nền khớp với biến --bg của giao diện web (sáng / tối). */
    private static final int BG_LIGHT = 0xFFF4F5FB;
    private static final int BG_DARK = 0xFF0E1018;
    private static final int MAX_BODY = 2 * 1024 * 1024;
    private static final String UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) "
            + "Chrome/124.0 Mobile Safari/537.36 VocabLuxe/1.0";
    /** Chỉ cho phép gọi đúng 2 dịch vụ tra cứu này (câu ví dụ và phiên âm tiếng Anh). */
    private static final Set<String> ALLOWED_HOSTS = new HashSet<>(Arrays.asList(
            "api.dictionaryapi.dev", "tatoeba.org"));

    private WebView web;
    private FrameLayout rootView;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private boolean ttsInitializing = false;
    private String pendingLang, pendingText;
    private boolean pendingSlow;
    private final ExecutorService net = Executors.newFixedThreadPool(4);
    private OnBackPressedCallback backCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        final boolean dark = isSystemDark();
        EdgeToEdge.enable(this,
                dark ? SystemBarStyle.dark(Color.TRANSPARENT) : SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
                dark ? SystemBarStyle.dark(Color.TRANSPARENT) : SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT));
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        rootView = root;
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        applyTheme(dark); // giao diện web sẽ gọi lại setTheme() ngay khi tải xong, nếu người dùng đã chọn khác hệ thống

        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets i = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            v.setPadding(i.left, i.top, i.right, i.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        setupWebView();

        // Nút Back / cử chỉ Back: chỉ bật khi giao diện web đang có thứ để đóng (chi tiết từ, menu chủ đề);
        // còn lại để hệ thống xử lý (thoát app / hoạt ảnh quay về màn hình chính).
        backCallback = new OnBackPressedCallback(false) {
            @Override
            public void handleOnBackPressed() {
                web.evaluateJavascript("window.__back && window.__back()", value -> {
                    if (!"true".equals(value)) {
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                    }
                });
            }
        };
        getOnBackPressedDispatcher().addCallback(this, backCallback);

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(START_URL);
        }
    }

    /** Hệ thống đang ở chế độ tối? (dùng làm mặc định cho lần chạy đầu tiên). */
    private boolean isSystemDark() {
        int m = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return m == Configuration.UI_MODE_NIGHT_YES;
    }

    /** Đồng bộ nền + màu biểu tượng thanh trạng thái / thanh điều hướng với giao diện sáng/tối của web. */
    private void applyTheme(boolean dark) {
        int bg = dark ? BG_DARK : BG_LIGHT;
        if (rootView != null) rootView.setBackgroundColor(bg);
        if (web != null) web.setBackgroundColor(bg);
        getWindow().getDecorView().setBackgroundColor(bg);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setAppearanceLightStatusBars(!dark);
        c.setAppearanceLightNavigationBars(!dark);
        if (Build.VERSION.SDK_INT >= 29) getWindow().setNavigationBarContrastEnforced(false);
    }

    private void setupWebView() {
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(ASSET_HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);           // localStorage + IndexedDB lưu tiến độ và cache nghĩa
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setGeolocationEnabled(false);
        s.setUserAgentString(UA);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse res = loader.shouldInterceptRequest(request.getUrl());
                if (res != null) return res;
                // Chặn mọi yêu cầu ra ngoài: dữ liệu mạng chỉ đi qua AndroidBridge.get (có danh sách cho phép).
                return new WebResourceResponse("text/plain", "utf-8", 403, "Blocked",
                        new HashMap<String, String>(), new ByteArrayInputStream(new byte[0]));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true; // không cho điều hướng đi đâu khác
            }
        });
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        net.shutdownNow();
        if (tts != null) { tts.stop(); tts.shutdown(); tts = null; }
        if (web != null) {
            ((ViewGroup) web.getParent()).removeView(web);
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    @Override
    protected void onPause() {
        if (tts != null) tts.stop();
        super.onPause();
    }

    // ------------------------------------------------------------------ //
    //  Đọc giọng (TextToSpeech của máy – không tạo file âm thanh)          //
    // ------------------------------------------------------------------ //
    private void js(final String code) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); });
    }

    private void jsError(String fn, String msg) {
        js("window." + fn + " && window." + fn + "(" + JSONObject.quote(msg) + ")");
    }

    private void doSpeak(String langTag, String text, boolean slow) {
        if (tts == null || !ttsReady) {
            pendingLang = langTag; pendingText = text; pendingSlow = slow;
            if (!ttsInitializing) initTts();
            return;
        }
        Locale loc = Locale.forLanguageTag(langTag);
        int r = tts.setLanguage(loc);
        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
            jsError("__ttsError", "Máy chưa có giọng đọc " + loc.getDisplayLanguage(new Locale("vi"))
                    + ". Vào Cài đặt > Chuyển văn bản thành giọng nói để tải thêm.");
            if (r == TextToSpeech.LANG_MISSING_DATA) {
                try {
                    Intent i = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception ignored) { /* máy không có màn hình cài giọng */ }
            }
            return;
        }
        tts.setSpeechRate(slow ? 0.6f : 1.0f);
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "vl");
    }

    private void initTts() {
        ttsInitializing = true;
        tts = new TextToSpeech(getApplicationContext(), status -> {
            ttsInitializing = false;
            if (status == TextToSpeech.SUCCESS) {
                ttsReady = true;
                if (pendingText != null) {
                    String l = pendingLang, t = pendingText;
                    boolean sl = pendingSlow;
                    pendingLang = pendingText = null;
                    doSpeak(l, t, sl);
                }
            } else {
                ttsReady = false;
                tts = null;
                jsError("__ttsError", "Không khởi động được bộ đọc giọng của máy.");
            }
        });
    }

    // ------------------------------------------------------------------ //
    //  Cầu nối JavaScript                                                 //
    // ------------------------------------------------------------------ //
    public class Bridge {
        @JavascriptInterface
        public void speak(final String langTag, final String text, final boolean slow) {
            if (text == null || text.length() > 600 || langTag == null) return;
            runOnUiThread(() -> doSpeak(langTag, text, slow));
        }

        @JavascriptInterface
        public boolean isSystemDark() {
            return MainActivity.this.isSystemDark();
        }

        @JavascriptInterface
        public void setTheme(final boolean dark) {
            runOnUiThread(() -> applyTheme(dark));
        }

        @JavascriptInterface
        public void canGoBack(final boolean can) {
            runOnUiThread(() -> { if (backCallback != null) backCallback.setEnabled(can); });
        }

        @JavascriptInterface
        public void get(final int id, final String url) {
            net.execute(() -> {
                int code = -1;
                String out = "";
                HttpURLConnection c = null;
                try {
                    URL u = new URL(url);
                    if (!"https".equals(u.getProtocol()) || !ALLOWED_HOSTS.contains(u.getHost())) {
                        throw new SecurityException("Địa chỉ không được phép");
                    }
                    c = (HttpURLConnection) u.openConnection();
                    c.setConnectTimeout(10000);
                    c.setReadTimeout(14000);
                    c.setInstanceFollowRedirects(false);
                    c.setRequestProperty("User-Agent", UA);
                    c.setRequestProperty("Accept", "application/json");
                    c.setRequestProperty("Accept-Language", "en,vi;q=0.8");
                    code = c.getResponseCode();
                    InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
                    if (in != null) {
                        ByteArrayOutputStream bo = new ByteArrayOutputStream();
                        byte[] buf = new byte[8192];
                        int n, total = 0;
                        while ((n = in.read(buf)) > 0) {
                            total += n;
                            if (total > MAX_BODY) throw new java.io.IOException("Phản hồi quá lớn");
                            bo.write(buf, 0, n);
                        }
                        in.close();
                        out = new String(bo.toByteArray(), StandardCharsets.UTF_8);
                    }
                } catch (Exception e) {
                    code = -1;
                    out = String.valueOf(e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage());
                } finally {
                    if (c != null) c.disconnect();
                }
                js("window.__net(" + id + "," + code + "," + JSONObject.quote(out) + ")");
            });
        }
    }
}
