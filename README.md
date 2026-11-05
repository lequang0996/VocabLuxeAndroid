# VocabLuxe (Android)

Học từ vựng Anh · Trung · Nhật · Hàn theo chủ đề: nghe phát âm, ôn tập, luyện tập. Dữ liệu từ các nguồn có giấy phép mở, ghi nguồn trong app (menu ☰ → Nguồn & giấy phép).

- Giao diện: HTML/JS trong `app/src/main/assets/www`, chạy trong WebView
- Vỏ Android: `app/src/main/java/com/vocabluxe/app/MainActivity.java`
- Dữ liệu từ vựng: `app/src/main/assets/www/data/*.json` – **do `tools/build_data.py` dựng** (workflow *Build data*), đừng sửa tay
- Hướng dẫn dựng dữ liệu, build và đăng CH Play: xem `HUONG_DAN_CHPLAY.md`

## Build

Mỗi lần push lên `main`, GitHub Actions build APK debug. Vào tab **Actions** → lần chạy mới nhất → mục **Artifacts** để tải `VocabLuxe-debug-apk`.
Bản đăng (AAB) chỉ build khi đã có khóa ký **và** dữ liệu đã được dựng lại bằng *Build data*.
