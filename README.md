# VocabLuxe (Android)

Học từ vựng Anh · Trung theo chủ đề: nghe phát âm, ôn tập, luyện tập.

- Giao diện: HTML/JS trong `app/src/main/assets/www`, chạy trong WebView
- Vỏ Android: `app/src/main/java/com/fws/vocabluxe/MainActivity.java`
- Dữ liệu từ vựng: `app/src/main/assets/www/data/*.json`
- Chính sách quyền riêng tư (đăng CH Play): `docs/privacy-policy/` (xem `docs/privacy-policy/README.md`)
- Màn hình Giấy phép & Quyền riêng tư trong ứng dụng: mở menu chủ đề → nút cuối menu

## Build

Mỗi lần push lên `main`, GitHub Actions tự build. Vào tab **Actions** → bấm lần chạy mới nhất →
mục **Artifacts** để tải `VocabLuxe-debug-apk` (cài thử trên điện thoại).
