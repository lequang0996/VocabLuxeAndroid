# VocabLuxe cho Android – hướng dẫn build và đăng CH Play

## 1. Cấu trúc project

```
VocabLuxeAndroid/
├─ app/src/main/
│  ├─ java/com/vocabluxe/app/MainActivity.java   ← vỏ Android: WebView + giọng đọc + cầu nối mạng (chỉ cho gọi tatoeba.org và api.dictionaryapi.dev)
│  ├─ assets/www/                                 ← toàn bộ app: index.html, style.css, app.js
│  │   └─ data/  en.json zh.json ja.json ko.json topics.json sources.json   (dữ liệu đóng gói sẵn, chạy offline)
│  ├─ res/  AndroidManifest.xml  icon  theme
├─ tools/   build_data.py (dựng dữ liệu từ nguồn mở), check_data.py (chốt chặn phát hành), overrides/, sources/
├─ .github/workflows/  build.yml (build APK/AAB)  build-data.yml (dựng dữ liệu)
├─ store/   icon-512.png, feature-graphic-1024x500.png, ảnh chụp (dùng cho trang cửa hàng)
└─ build.gradle.kts, settings.gradle.kts, gradle/…
```

Giao diện viết bằng HTML/JS, nhúng vào app Android. Mọi trang web trong app chạy từ `assets`, không tải trang nào từ Internet.

## 2. Dữ liệu từ vựng: nguồn mở, có ghi nguồn

Dữ liệu cũ (Oxford, file HSK/JLPT riêng, cào tuvungtienghan.com) **không được dùng để đăng công khai**. Dữ liệu mới do `tools/build_data.py` dựng:

| Ngôn ngữ | Nguồn | Giấy phép (theo công bố của nguồn) |
|---|---|---|
| Tiếng Anh | CEFR-J Vocabulary Profile 1.5 (A1–B2) + Octanove Vocabulary Profile (C1–C2) | CEFR-J: dùng miễn phí kể cả thương mại, cần ghi nguồn; Octanove: CC BY-SA 4.0 |
| Tiếng Trung | complete-hsk-vocabulary (HSK 2.0, cấp 1–6), nghĩa gốc từ CC-CEDICT | MIT; CC-CEDICT: CC BY-SA 4.0 |
| Tiếng Nhật | open-anki-jlpt-decks (danh sách Tanos, N5–N1) | Danh sách Tanos: CC BY |
| Tiếng Hàn | Từ điển cơ bản tiếng Hàn (한국어기초사전, NIKL) | CC BY-SA 2.0 KR |
| Âm Hán Việt | Unihan (kVietnamese) | Unicode Terms of Use |
| Chủ đề | Princeton WordNet | Giấy phép WordNet |
| Nghĩa tiếng Việt (Anh/Trung/Nhật) | Dịch máy offline Helsinki-NLP/opus-mt-en-vi (hoặc Google Cloud Translation chính thức nếu bạn chọn) | Apache-2.0 (theo trang mô hình) |

Hệ quả cần biết:
- Nghĩa tiếng Việt của tiếng Anh/Trung/Nhật là **dịch tự động**, app hiển thị nhãn "Nghĩa dịch tự động". Có thể sai ở từ nhiều nghĩa – nên rà các từ phổ biến và ghi đè trong `tools/overrides/vi_overrides.json`.
- Các nguồn CC BY-SA yêu cầu **ghi nguồn** và **giữ cùng giấy phép khi phân phối dữ liệu đã chỉnh sửa**. App có màn hình **Nguồn & giấy phép** (menu ☰ → dưới cùng) đọc từ `data/sources.json`. Hãy đọc lại điều khoản từng nguồn trước khi đăng; đây không phải tư vấn pháp lý.
- Câu ví dụ lấy online từ Tatoeba (ưu tiên bản dịch tiếng Việt, không có thì tiếng Anh, có nhãn). Dữ liệu HSK/JLPT mới không kèm câu ví dụ.
- Id từ đổi so với bản cũ nên tiến độ "Đã thuộc / Yêu thích" đã lưu trên máy thử sẽ không còn khớp (không ảnh hưởng người dùng mới).

### Dựng dữ liệu (GitHub Actions)

1. **Tiếng Hàn phải tải tay 1 lần**: làm theo `tools/sources/README.md` (trang krdict gửi link tải qua email, không tự tải được).
2. Tab **Actions → Build data → Run workflow** (chọn `opus` là dịch miễn phí offline; lần đầu có thể chạy vài chục phút đến vài giờ). Workflow tự tải HSK/JLPT/CEFR-J/Unihan, dịch, gán chủ đề, ghi JSON + `sources.json` và tự commit vào repo.
3. Commit do workflow đẩy lên **không tự kích hoạt** workflow build. Hãy vào **Actions → Build Android → Run workflow** để build lại.
4. Kiểm tra nhanh vài từ trong app (nghĩa, Hán Việt, chủ đề) rồi sửa tay trong `tools/overrides/vi_overrides.json` nếu cần.

Có thể chạy trên máy: `pip install -r tools/requirements.txt` rồi `python tools/build_data.py --translator opus`.

**Chốt chặn:** bước build AAB (bản đăng) chạy `tools/check_data.py` và **báo lỗi nếu dữ liệu vẫn là bản cũ** chưa dựng lại, thiếu nguồn/giấy phép, hoặc quá nhiều từ chưa có nghĩa. Bản APK debug không bị chặn.

## 3. Build lần đầu (Android Studio)

1. Cài **Android Studio** bản mới (hỗ trợ API 36; cần AGP 8.13 trở lên, JDK 17 đi kèm).
2. `File > Open` → chọn thư mục `VocabLuxeAndroid`. Chờ Gradle Sync (cần Internet).
3. Đổi `applicationId` trong `app/build.gradle.kts` (đang là `com.vocabluxe.app`) thành ID riêng của bạn. **Không đổi được sau khi đã đăng.**
4. Cắm điện thoại hoặc dùng máy ảo → **Run ▶**.

Việc cần thử trên máy thật: nghe phát âm cả 4 ngôn ngữ, nút Back (kể cả khi đang mở màn hình Nguồn & giấy phép), xoay ngang, ví dụ khi có/không có mạng.

## 4. Tạo bản đăng (AAB đã ký)

Qua GitHub Actions: thêm 4 secret `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` rồi chạy **Build Android**; file `VocabLuxe-release-aab` nằm ở mục Artifacts.
(**Sao lưu keystore và mật khẩu ở nơi an toàn.**) Hoặc dùng Android Studio: `Build > Generate Signed App Bundle / APK`.
Mỗi lần cập nhật: tăng `versionCode` và `versionName` trong `app/build.gradle.kts`.

## 5. Đăng lên Google Play Console

1. Tạo tài khoản nhà phát triển và xác minh danh tính.
2. **Tạo ứng dụng** → ngôn ngữ mặc định Tiếng Việt, loại *Ứng dụng*, *Miễn phí*.
3. Tải lên `.aab` (khuyên dùng Play App Signing).
4. Trang cửa hàng: dùng ảnh trong `store/`. Ảnh chụp cũ dùng dữ liệu cũ, nên chụp lại sau khi dựng dữ liệu mới.
5. Điền các mục bắt buộc: **Chính sách quyền riêng tư (URL)**, **An toàn dữ liệu**, **Phân loại nội dung**, **Đối tượng mục tiêu**, khai báo không có quảng cáo (nếu đúng).
6. Tài khoản cá nhân mới thường phải chạy **kiểm thử kín** vài tuần trước khi xuất bản – kiểm tra yêu cầu hiện hành ngay trong Play Console.

**Gợi ý khai An toàn dữ liệu / chính sách quyền riêng tư** (đúng với cách app đang hoạt động):
- App không có tài khoản, không thu thập thông tin cá nhân; tiến độ học lưu trên máy (không gửi đi đâu).
- Nghĩa, phiên âm (trừ tiếng Anh), cấp độ, chủ đề đều nằm sẵn trong app và dùng offline.
- Chỉ có **2 dịch vụ bên thứ ba** được gọi, để lấy câu ví dụ và phiên âm tiếng Anh: **Tatoeba (tatoeba.org)** và **Free Dictionary API (api.dictionaryapi.dev)**.
  Mỗi lần xem một từ, app có thể gửi **chính từ đó** tới các dịch vụ này; chúng có thể ghi nhận địa chỉ IP. Phải nêu rõ trong chính sách riêng tư (không gửi dữ liệu định danh cá nhân nào khác).
- Không còn gọi Google Translate hay MyMemory.

## 6. Điểm khác so với bản PC

| Bản PC | Bản Android |
|---|---|
| Giọng Google nữ qua gTTS + pygame | Bộ đọc giọng (TextToSpeech) của máy; người dùng chọn giọng trong *Cài đặt > Chuyển văn bản thành giọng nói*. Không tạo file, không cache |
| Tự cào tiếng Hàn từ tuvungtienghan.com | Dữ liệu tiếng Hàn từ Từ điển cơ bản (NIKL), đóng gói sẵn, dùng offline |
| Phím tắt | Vuốt trái/phải để chuyển từ; phím tắt dùng được nếu có bàn phím rời |
| Cửa sổ 3 cột | Điện thoại: danh sách → chi tiết, menu chủ đề ở nút ☰. Máy tính bảng/ngang rộng: 3 cột |
| Cache SQLite | IndexedDB trong app |
| Tiến độ `progress.json` | localStorage trong app (không sao lưu lên cloud) |

## 7. Giới hạn của bản giao này

- Môi trường soạn code không có mạng và không có Android SDK: script dựng dữ liệu mới chỉ được chạy thử bằng **dữ liệu giả lập đúng định dạng đã kiểm chứng trên trang nguồn** (riêng tiếng Hàn: định dạng file krdict chưa kiểm chứng được, xem `tools/sources/README.md`), và `MainActivity.java` chưa được biên dịch. Lần chạy đầu trên dữ liệu thật có thể gặp lỗi định dạng; khi đó gửi log để sửa.
- Số từ sẽ khác con số cũ (4.980 / 5.002 / 4.754 / 17.468) vì nguồn mới khác; tiếng Hàn mặc định chỉ giữ từ có xếp cấp.
- Nguồn nào đổi đường dẫn/định dạng thì `build_data.py` phải sửa theo.
