package com.fws.vocabluxe;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import androidx.activity.ComponentActivity;
import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.SystemBarStyle;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

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
 * Cầu nối AndroidBridge: đọc giọng bằng TextToSpeech của máy (khởi động sẵn để phát âm ngay), gọi HTTPS tới đúng 4 dịch vụ tra cứu,
 * đồng bộ màu thanh hệ thống với giao diện sáng/tối, mở trang Chính sách quyền riêng tư và cập nhật trong ứng dụng (Google Play, kiểu Flexible).
 * Quảng cáo AdMob: biểu ngữ ở đáy màn hình (xin đồng ý UMP trước) và quảng cáo mở ứng dụng (VocabLuxeApp).
 */
public class MainActivity extends ComponentActivity {

    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + ASSET_HOST + "/assets/www/index.html";
    /** Màu nền khớp với biến --bg của giao diện web (sáng / tối). */
    private static final int BG_LIGHT = 0xFFF4F5FB;
    private static final int BG_DARK = 0xFF0E1018;
    private static final int MAX_BODY = 2 * 1024 * 1024;
    /** Trang Chính sách quyền riêng tư (GitHub Pages, file docs/privacy-policy.html). ĐỔI nếu tên tài khoản / kho mã khác. */
    private static final String PRIVACY_URL = "https://lequang0996.github.io/VocabLuxeAndroid/privacy-policy.html";
    private static final String UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) "
            + "Chrome/124.0 Mobile Safari/537.36 VocabLuxe/1.0";
    /** Chỉ cho phép gọi các dịch vụ tra cứu này. */
    private static final Set<String> ALLOWED_HOSTS = new HashSet<>(Arrays.asList(
            "translate.googleapis.com", "api.mymemory.translated.net", "api.dictionaryapi.dev", "tatoeba.org"));

    private WebView web;
    private FrameLayout rootView;

    // Quảng cáo biểu ngữ (AdMob) nằm dưới WebView; ẩn khi chưa tải được hoặc khi bàn phím đang mở
    private FrameLayout adContainer;
    private AdView bannerView;
    private boolean bannerLoaded = false, imeShown = false;
    private int lastOrientation;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private boolean ttsInitializing = false;
    private String pendingLang, pendingText, pendingWarm, currentLang;
    private boolean pendingSlow;

    // Cập nhật trong ứng dụng (Google Play In-App Updates – Flexible)
    private AppUpdateManager updateManager;
    private ActivityResultLauncher<IntentSenderRequest> updateLauncher;
    private boolean updateAsked = false, updateDownloaded = false;
    private final InstallStateUpdatedListener installListener = state -> {
        if (state.installStatus() == InstallStatus.DOWNLOADED) {
            updateDownloaded = true;
            js("window.__updateReady && window.__updateReady()");
        }
    };
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
        // Cột dọc: WebView chiếm phần còn lại, biểu ngữ quảng cáo ở dưới cùng
        LinearLayout column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);
        column.addView(web, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        adContainer = new FrameLayout(this);
        adContainer.setVisibility(View.GONE);
        column.addView(adContainer, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        root.addView(column, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        lastOrientation = getResources().getConfiguration().orientation;
        applyTheme(dark); // giao diện web sẽ gọi lại setTheme() ngay khi tải xong, nếu người dùng đã chọn khác hệ thống

        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets i = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            v.setPadding(i.left, i.top, i.right, i.bottom);
            boolean ime = insets.isVisible(WindowInsetsCompat.Type.ime());
            if (ime != imeShown) { imeShown = ime; updateBannerVisibility(); } // bàn phím mở: ẩn biểu ngữ cho đỡ chật
            return WindowInsetsCompat.CONSUMED;
        });

        setupWebView();
        initTts();          // khởi động sẵn bộ đọc giọng: lần bấm đầu tiên phát âm ngay, không phải chờ
        initInAppUpdate();
        initAds();

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
    protected void onResume() {
        super.onResume();
        if (bannerView != null) bannerView.resume();
        checkForUpdate();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (newConfig.orientation != lastOrientation) { // xoay màn hình: tính lại kích thước biểu ngữ thích ứng
            lastOrientation = newConfig.orientation;
            destroyBanner();
            loadBanner();
        }
    }

    @Override
    protected void onDestroy() {
        destroyBanner();
        if (updateManager != null) { try { updateManager.unregisterListener(installListener); } catch (Exception ignored) { /* bỏ qua */ } }
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
        if (bannerView != null) bannerView.pause();
        if (tts != null) tts.stop();
        super.onPause();
    }

    // ------------------------------------------------------------------ //
    //  Quảng cáo AdMob: xin đồng ý (UMP) -> khởi tạo SDK -> biểu ngữ       //
    //  (quảng cáo mở ứng dụng nằm trong VocabLuxeApp / AppOpenAdManager)   //
    // ------------------------------------------------------------------ //
    private VocabLuxeApp ads() { return (VocabLuxeApp) getApplication(); }

    private void initAds() {
        try {
            final ConsentInformation consent = UserMessagingPlatform.getConsentInformation(this);
            ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
            consent.requestConsentInfoUpdate(this, params,
                    () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(this, formError -> {
                        if (consent.canRequestAds()) startAds();
                    }),
                    formError -> { if (consent.canRequestAds()) startAds(); });
            if (consent.canRequestAds()) startAds(); // đã đồng ý từ lần trước: không cần chờ mạng
        } catch (Throwable t) {
            // lỗi quảng cáo không được làm hỏng ứng dụng học từ
        }
    }

    private void startAds() {
        ads().startAds();
        ads().whenAdsReady(this::loadBanner);
    }

    private void loadBanner() {
        if (adContainer == null) return;
        adContainer.post(() -> {
            if (isFinishing() || isDestroyed() || bannerView != null) return;
            try {
                int widthPx = rootView.getWidth() - rootView.getPaddingLeft() - rootView.getPaddingRight();
                if (widthPx <= 0) widthPx = getResources().getDisplayMetrics().widthPixels;
                int widthDp = (int) (widthPx / getResources().getDisplayMetrics().density);

                AdView v = new AdView(this);
                v.setAdUnitId(BuildConfig.ADMOB_BANNER_ID);
                v.setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(this, widthDp));
                v.setAdListener(new AdListener() {
                    @Override
                    public void onAdLoaded() { bannerLoaded = true; updateBannerVisibility(); }

                    @Override
                    public void onAdFailedToLoad(LoadAdError error) { bannerLoaded = false; updateBannerVisibility(); }
                });
                adContainer.addView(v);
                bannerView = v;
                v.loadAd(new AdRequest.Builder().build());
            } catch (Throwable ignored) { /* bỏ qua */ }
        });
    }

    private void destroyBanner() {
        bannerLoaded = false;
        if (bannerView != null) {
            adContainer.removeView(bannerView);
            bannerView.destroy();
            bannerView = null;
        }
        updateBannerVisibility();
    }

    private void updateBannerVisibility() {
        if (adContainer != null) adContainer.setVisibility(bannerLoaded && !imeShown ? View.VISIBLE : View.GONE);
    }

    // ------------------------------------------------------------------ //
    //  Đọc giọng (TextToSpeech của máy – không tạo file âm thanh)          //
    // ------------------------------------------------------------------ //
    private void js(final String code) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); });
    }

    /** Báo lỗi cho giao diện bằng mã (giao diện tự dịch ra ngôn ngữ đang chọn). */
    private void ttsError(String code, String arg) {
        js("window.__ttsError && window.__ttsError(" + JSONObject.quote(code) + "," + JSONObject.quote(arg == null ? "" : arg) + ")");
    }

    /** Chỉ gọi setLanguage khi đổi ngôn ngữ (mỗi lần gọi tốn hàng trăm ms). Trả về mã kết quả của TextToSpeech. */
    private int ensureLanguage(String langTag) {
        if (langTag.equals(currentLang)) return TextToSpeech.LANG_AVAILABLE;
        int r = tts.setLanguage(Locale.forLanguageTag(langTag));
        if (r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED) currentLang = langTag;
        return r;
    }

    private void doSpeak(String langTag, String text, boolean slow) {
        if (tts == null || !ttsReady) {
            pendingLang = langTag; pendingText = text; pendingSlow = slow;
            if (!ttsInitializing) initTts();
            return;
        }
        int r = ensureLanguage(langTag);
        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
            ttsError("missing", langTag);
            if (r == TextToSpeech.LANG_MISSING_DATA) {
                try {
                    Intent i = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ads().skipNextAppOpen();
                    startActivity(i);
                } catch (Exception ignored) { /* máy không có màn hình cài giọng */ }
            }
            return;
        }
        tts.setSpeechRate(slow ? 0.6f : 1.0f);
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "vl");
    }

    private void initTts() {
        if (tts != null || ttsInitializing) return;
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
                } else if (pendingWarm != null) {
                    String l = pendingWarm;
                    pendingWarm = null;
                    ensureLanguage(l);
                }
            } else {
                ttsReady = false;
                tts = null;
                ttsError("init", "");
            }
        });
    }

    // ------------------------------------------------------------------ //
    //  Cập nhật trong ứng dụng: Google Play In-App Updates (Flexible)      //
    //  Chỉ hoạt động với bản cài từ Google Play; lỗi gì cũng bỏ qua êm.     //
    // ------------------------------------------------------------------ //
    private void initInAppUpdate() {
        try {
            updateLauncher = registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), result -> { /* người dùng từ chối: không làm gì */ });
            updateManager = AppUpdateManagerFactory.create(this);
            updateManager.registerListener(installListener);
        } catch (Throwable t) {
            updateManager = null;
        }
    }

    private void checkForUpdate() {
        if (updateManager == null) return;
        try {
            updateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
                if (info.installStatus() == InstallStatus.DOWNLOADED) {
                    updateDownloaded = true;
                    js("window.__updateReady && window.__updateReady()");
                    return;
                }
                if (!updateAsked && info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                        && info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                    updateAsked = true; // chỉ hỏi một lần mỗi lần mở app
                    try {
                        updateManager.startUpdateFlowForResult(info, updateLauncher, AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build());
                    } catch (Exception ignored) { /* bỏ qua */ }
                }
            });
        } catch (Throwable ignored) { /* bỏ qua */ }
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

        /** Khởi động sẵn bộ đọc giọng và nạp sẵn ngôn ngữ để lần phát âm đầu tiên không bị trễ. */
        @JavascriptInterface
        public void warmTts(final String langTag) {
            if (langTag == null || langTag.length() > 20) return;
            runOnUiThread(() -> {
                if (tts != null && ttsReady) ensureLanguage(langTag);
                else { pendingWarm = langTag; initTts(); }
            });
        }

        /** Bản cập nhật đã tải xong và đang chờ khởi động lại? */
        @JavascriptInterface
        public boolean updateReady() {
            return updateDownloaded;
        }

        /** Cài bản cập nhật đã tải (ứng dụng sẽ khởi động lại). */
        @JavascriptInterface
        public void completeUpdate() {
            runOnUiThread(() -> { if (updateManager != null) updateManager.completeUpdate(); });
        }

        /** Mở trang Chính sách quyền riêng tư bằng trình duyệt (chỉ đúng địa chỉ cố định ở trên). */
        @JavascriptInterface
        public void openPrivacyPolicy() {
            runOnUiThread(() -> {
                try {
                    ads().skipNextAppOpen(); // quay lại từ trình duyệt thì không chèn quảng cáo mở ứng dụng
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(PRIVACY_URL)));
                } catch (Exception e) {
                    ttsError("browser", "");
                }
            });
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
