package com.fws.vocabluxe;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;

import androidx.annotation.NonNull;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.ProcessLifecycleOwner;

import com.google.android.gms.ads.MobileAds;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Application: khởi tạo AdMob (một lần, sau khi người dùng đã qua bước xin đồng ý) và quản lý quảng cáo mở ứng dụng.
 * Quảng cáo mở ứng dụng hiện khi cả ứng dụng quay lại nền trước (không hiện khi chỉ chuyển giữa các màn hình trong app).
 */
public class VocabLuxeApp extends Application implements Application.ActivityLifecycleCallbacks, DefaultLifecycleObserver {

    /** Lần mở nguội: chỉ hiện quảng cáo mở ứng dụng nếu nó tải xong trong khoảng này (để không bật lên giữa lúc đang dùng). */
    private static final long COLD_START_WINDOW_MS = 5000;

    private final Handler main = new Handler(Looper.getMainLooper());
    private final AtomicBoolean initStarted = new AtomicBoolean(false);
    private final List<Runnable> whenReady = new ArrayList<>();
    private final long startedAt = SystemClock.elapsedRealtime();
    private boolean adsReady = false;
    private boolean foreground = false;
    private Activity currentActivity;
    private AppOpenAdManager appOpen;

    @Override
    public void onCreate() {
        super.onCreate();
        appOpen = new AppOpenAdManager(this, BuildConfig.ADMOB_APP_OPEN_ID);
        registerActivityLifecycleCallbacks(this);
        ProcessLifecycleOwner.get().getLifecycle().addObserver(this);
    }

    /** Gọi khi được phép yêu cầu quảng cáo (đã xử lý đồng ý UMP). An toàn khi gọi nhiều lần. */
    void startAds() {
        if (!initStarted.compareAndSet(false, true)) return;
        // Google khuyến nghị khởi tạo SDK ở luồng nền để tránh ANR.
        new Thread(() -> MobileAds.initialize(this, status -> main.post(() -> {
            adsReady = true;
            appOpen.load();
            for (Runnable r : whenReady) r.run();
            whenReady.clear();
        }))).start();
    }

    /** Chạy r (trên luồng chính) ngay khi SDK quảng cáo đã sẵn sàng. */
    void whenAdsReady(Runnable r) {
        if (adsReady) r.run(); else whenReady.add(r);
    }

    /** Bỏ qua lần quảng cáo mở ứng dụng kế tiếp (dùng khi chủ động mở trình duyệt / màn hình hệ thống rồi quay lại). */
    void skipNextAppOpen() {
        appOpen.skipNextForeground();
    }

    /** AppOpenAdManager báo quảng cáo vừa tải xong. */
    void onAppOpenLoaded() {
        boolean coldStart = SystemClock.elapsedRealtime() - startedAt < COLD_START_WINDOW_MS;
        if (coldStart && foreground && appOpen.neverShown()) {
            appOpen.showIfAvailable(currentActivity, false);
        }
    }

    // ---- Cả ứng dụng vào / ra nền trước ----
    @Override
    public void onStart(@NonNull LifecycleOwner owner) {
        foreground = true;
        if (adsReady) appOpen.showIfAvailable(currentActivity, true);
    }

    @Override
    public void onStop(@NonNull LifecycleOwner owner) {
        foreground = false;
    }

    // ---- Theo dõi Activity hiện tại (bỏ qua chính Activity của quảng cáo) ----
    @Override
    public void onActivityStarted(@NonNull Activity activity) {
        if (!appOpen.isShowing()) currentActivity = activity;
    }

    @Override
    public void onActivityDestroyed(@NonNull Activity activity) {
        if (currentActivity == activity) currentActivity = null;
    }

    @Override public void onActivityCreated(@NonNull Activity activity, Bundle savedInstanceState) { }
    @Override public void onActivityResumed(@NonNull Activity activity) { }
    @Override public void onActivityPaused(@NonNull Activity activity) { }
    @Override public void onActivityStopped(@NonNull Activity activity) { }
    @Override public void onActivitySaveInstanceState(@NonNull Activity activity, @NonNull Bundle outState) { }
}
