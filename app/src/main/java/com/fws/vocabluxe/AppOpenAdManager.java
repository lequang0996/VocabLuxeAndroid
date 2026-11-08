package com.fws.vocabluxe;

import android.app.Activity;
import android.content.Context;
import android.os.SystemClock;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.appopen.AppOpenAd;

/** Tải trước và hiển thị quảng cáo mở ứng dụng. Mọi hàm gọi trên luồng chính. */
final class AppOpenAdManager {
    /** Quảng cáo mở ứng dụng hết hạn sau 4 giờ kể từ lúc tải. */
    private static final long EXPIRE_MS = 4L * 60 * 60 * 1000;
    /** Khoảng cách tối thiểu giữa hai lần hiện, để không làm phiền người học. */
    private static final long MIN_GAP_MS = 3L * 60 * 1000;

    private final Context app;
    private final String unitId;
    private AppOpenAd ad;
    private long loadedAt;
    private long lastShownAt = -1;
    private boolean loading, showing, skipNext;

    AppOpenAdManager(Context app, String unitId) {
        this.app = app;
        this.unitId = unitId;
    }

    boolean isShowing() { return showing; }
    boolean neverShown() { return lastShownAt < 0; }
    void skipNextForeground() { skipNext = true; }

    private boolean isAvailable() {
        return ad != null && SystemClock.elapsedRealtime() - loadedAt < EXPIRE_MS;
    }

    void load() {
        if (loading || isAvailable()) return;
        loading = true;
        AppOpenAd.load(app, unitId, new AdRequest.Builder().build(), new AppOpenAd.AppOpenAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull AppOpenAd loaded) {
                loading = false;
                ad = loaded;
                loadedAt = SystemClock.elapsedRealtime();
                ((VocabLuxeApp) app).onAppOpenLoaded();
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError error) {
                loading = false;
            }
        });
    }

    /** @param fromForeground true khi gọi do ứng dụng vừa quay lại nền trước (được phép bị bỏ qua bởi skipNextForeground). */
    void showIfAvailable(Activity activity, boolean fromForeground) {
        if (activity == null || activity.isFinishing() || showing) return;
        if (fromForeground && skipNext) { skipNext = false; return; }
        if (!isAvailable()) { load(); return; }
        if (lastShownAt >= 0 && SystemClock.elapsedRealtime() - lastShownAt < MIN_GAP_MS) return;

        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdShowedFullScreenContent() {
                lastShownAt = SystemClock.elapsedRealtime();
            }

            @Override
            public void onAdDismissedFullScreenContent() {
                finished();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError error) {
                finished();
            }
        });
        showing = true;
        ad.show(activity);
    }

    private void finished() {
        showing = false;
        ad = null;
        load(); // tải sẵn cho lần sau
    }
}
