# VocabLuxe (Android)

Học từ vựng Anh · Trung · Nhật · Hàn theo chủ đề: nghe phát âm, ôn tập, luyện tập.

- Giao diện: HTML/JS trong `app/src/main/assets/www`, chạy trong WebView
- Vỏ Android: `app/src/main/java/com/vocabluxe/app/MainActivity.java`
- Dữ liệu từ vựng: `app/src/main/assets/www/data/*.json`
- Hướng dẫn build và đăng CH Play: xem `HUONG_DAN_CHPLAY.md`

## Build

Mỗi lần push lên `main`, GitHub Actions tự build. Vào tab **Actions** → bấm lần chạy mới nhất →
mục **Artifacts** để tải `VocabLuxe-debug-apk` (cài thử trên điện thoại).
