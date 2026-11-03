# VocabLuxe cho Android – hướng dẫn build và đăng CH Play

## 1. Cấu trúc project

```
VocabLuxeAndroid/
├─ app/src/main/
│  ├─ java/com/vocabluxe/app/MainActivity.java   ← vỏ Android: WebView + giọng đọc + cầu nối mạng (2 hàm, ~250 dòng)
│  ├─ assets/www/                                 ← toàn bộ app: index.html, style.css, app.js
│  │   └─ data/  en.json zh.json ja.json ko.json topics.json   (dữ liệu đóng gói sẵn, ~5,6 MB)
│  ├─ res/  AndroidManifest.xml  icon  theme
├─ store/   icon-512.png, feature-graphic-1024x500.png, 5 ảnh chụp 1080x1920 (dùng cho trang cửa hàng)
└─ build.gradle.kts, settings.gradle.kts, gradle/…
```

Giao diện viết bằng HTML/JS (đã chạy thử trên Chromium giả lập điện thoại), được nhúng vào app Android.
Mọi trang web trong app chạy từ `assets`, không tải trang nào từ Internet.

## 2. Build lần đầu

1. Cài **Android Studio** bản mới (hỗ trợ API 36; cần AGP 8.13 trở lên, JDK 17 đi kèm).
2. `File > Open` → chọn thư mục `VocabLuxeAndroid`. Chờ Gradle Sync (cần Internet để tải thư viện).
   Nếu Studio hỏi nâng cấp Gradle/AGP thì cứ đồng ý.
3. Đổi `applicationId` trong `app/build.gradle.kts` (đang là `com.vocabluxe.app`) thành ID riêng của bạn,
   ví dụ `com.tenban.vocabluxe`. **Không đổi được sau khi đã đăng.**
   (Nếu đổi, đổi luôn `namespace` và tên package của `MainActivity` cho khớp, hoặc chỉ đổi `applicationId` – cách này vẫn build được.)
4. Cắm điện thoại (bật Gỡ lỗi USB) hoặc dùng máy ảo → bấm **Run ▶** để thử.

Việc cần thử trên máy thật: nghe phát âm cả 4 ngôn ngữ, nút Back, xoay ngang, tra nghĩa khi có/không có mạng.

## 3. Tạo bản đăng (AAB đã ký)

1. `Build > Generate Signed App Bundle / APK` → **Android App Bundle** → tạo keystore mới
   (**sao lưu file keystore và mật khẩu ở nơi an toàn**; mất là không cập nhật app được nữa dù Play App Signing có giữ khóa phát hành).
2. Hoặc dùng dòng lệnh: tạo file `keystore.properties` cạnh `settings.gradle.kts`:
   ```
   storeFile=vocabluxe.jks
   storePassword=...
   keyAlias=...
   keyPassword=...
   ```
   rồi chạy `./gradlew bundleRelease` (project chưa kèm file `gradlew`; Android Studio tự tạo khi Sync, hoặc chạy `gradle wrapper` một lần, hoặc cứ dùng menu Build ở bước 1) → file nằm ở `app/build/outputs/bundle/release/app-release.aab`.
3. Mỗi lần cập nhật: tăng `versionCode` (số nguyên) và `versionName` trong `app/build.gradle.kts`.

## 4. Đăng lên Google Play Console

1. Tạo tài khoản nhà phát triển (phí đăng ký một lần) và xác minh danh tính.
2. **Tạo ứng dụng** → ngôn ngữ mặc định Tiếng Việt, loại *Ứng dụng*, *Miễn phí*.
3. Tải lên `.aab` (khuyên dùng Play App Signing).
4. Trang cửa hàng: dùng ảnh trong thư mục `store/` (icon 512, ảnh bìa 1024×500, ảnh chụp điện thoại). Cần mô tả ngắn (≤80 ký tự) và mô tả đầy đủ.
5. Điền các mục bắt buộc: **Chính sách quyền riêng tư (URL)**, **An toàn dữ liệu**, **Phân loại nội dung**, **Đối tượng mục tiêu**, ứng dụng không có quảng cáo (nếu đúng).
6. Tài khoản cá nhân mới thường phải chạy **kiểm thử kín** với một số người thử trong vài tuần trước khi được xuất bản
   chính thức – kiểm tra yêu cầu hiện hành ngay trong Play Console.

**Gợi ý khai An toàn dữ liệu / chính sách riêng tư** (đúng với cách app đang hoạt động):
- App không có tài khoản, không thu thập thông tin cá nhân; tiến độ học lưu trên máy.
- Để tra nghĩa/ví dụ, app gửi **từ đang xem** tới: Google Translate (translate.googleapis.com), MyMemory, Tatoeba, dictionaryapi.dev.
  Các dịch vụ này có thể ghi nhận địa chỉ IP. Phải nêu rõ trong chính sách riêng tư.

## 5. Điểm khác so với bản PC

| Bản PC | Bản Android |
|---|---|
| Giọng Google nữ qua gTTS + pygame | Bộ đọc giọng (TextToSpeech) của máy; Android không cho ép giới tính giọng – người dùng chọn giọng trong *Cài đặt > Chuyển văn bản thành giọng nói*. Không tạo file, không cache |
| Tự cào tiếng Hàn từ tuvungtienghan.com ở lần mở đầu | Dữ liệu tiếng Hàn **đóng gói sẵn** (dùng offline ngay, không tải gì, không hỏi) |
| Phím tắt | Vuốt trái/phải để chuyển từ; phím tắt vẫn dùng được nếu có bàn phím rời |
| Cửa sổ 3 cột | Điện thoại: danh sách → bấm vào từ để xem chi tiết, menu chủ đề kéo ra từ nút ☰. Máy tính bảng/ngang rộng: 3 cột như bản PC |
| Cache SQLite | IndexedDB trong app |
| Tiến độ `progress.json` | localStorage trong app (không sao lưu lên cloud) |

Giữ nguyên: 4 ngôn ngữ (nút tiếng Việt), chủ đề, tìm không dấu, lọc Tất cả/Chưa thuộc/Đã thuộc/★ và theo cấp độ,
thanh tiến độ, Đã thuộc / Yêu thích, chế độ ôn tập ẩn nghĩa + Hiện đáp án, Luyện tập 10 từ ngẫu nhiên đã thuộc,
Nghe / Nghe chậm / Tự phát âm, nghĩa + nghĩa phụ + định nghĩa tiếng Anh, ngữ cảnh + phiên âm + dịch tiếng Việt,
chuẩn hóa Unicode NFC (dấu tiếng Việt không bị lệch). Không có màn hình cài đặt, không có vùng ảnh trên thẻ từ.

## 6. Hai rủi ro cần xử lý TRƯỚC khi đăng công khai

**a) Bản quyền dữ liệu.** Dữ liệu trong app lấy từ Oxford 3000/5000 (Oxford University Press), file HSK, tài liệu JLPT
và nội dung cào từ tuvungtienghan.com. Đăng công khai lên CH Play mà không có giấy phép có thể bị khiếu nại bản quyền và gỡ app,
thậm chí khóa tài khoản nhà phát triển. Cách an toàn: tự biên soạn, xin phép, hoặc thay bằng nguồn có giấy phép mở
(ví dụ JMdict cho tiếng Nhật, CC-CEDICT cho tiếng Trung – hãy đọc kỹ điều kiện ghi nguồn). Thay dữ liệu chỉ cần thay các file
`assets/www/data/*.json` giữ nguyên cấu trúc (xem `build_data.py` ở bản PC).

**b) Dịch vụ tra cứu không chính thức.** `translate.googleapis.com/translate_a/single` là endpoint không công bố, không cam kết hoạt động
và vi phạm điều khoản nếu dùng thương mại ở quy mô lớn; có thể bị chặn bất cứ lúc nào (khi đó app tự rơi về MyMemory, rồi báo lỗi).
Nghĩa tiếng Anh (4.980 từ) và nghĩa tiếng Nhật (4.754 từ) hiện *chưa có sẵn trong dữ liệu* nên phụ thuộc vào dịch vụ này.
Giải pháp bền vững: dịch sẵn toàn bộ nghĩa một lần (bằng API chính thức như Google Cloud Translation, hoặc nguồn từ điển có giấy phép)
rồi ghi vào file JSON – app sẽ chạy hoàn toàn offline, nhanh hơn và hết phụ thuộc.

## 7. Giới hạn của bản giao này

- Phần giao diện đã được chạy thử tự động trên Chromium giả lập điện thoại và máy tính bảng (chuyển ngôn ngữ, lọc, tìm không dấu,
  đánh dấu, luyện tập, danh sách 17.000 từ, cầu nối giả lập). Phần vỏ Android (`MainActivity.java`) **chưa được biên dịch hay chạy trên máy thật**
  vì môi trường tạo project không có Android SDK. Lần build đầu có thể cần chỉnh nhỏ theo thông báo của Android Studio.
- Ảnh chụp trong `store/` dùng dữ liệu tra cứu giả lập (nghĩa tiếng Anh minh họa); hãy chụp lại trên máy thật nếu muốn ảnh chính xác.
