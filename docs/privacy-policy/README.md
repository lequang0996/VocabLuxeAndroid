# Chính sách quyền riêng tư – hướng dẫn đăng CH Play

## 1. Điền thông tin (bắt buộc)
Mở `index.html`, tìm và thay các chỗ được tô vàng:
- `[DEVELOPER NAME]` / `[TÊN NHÀ PHÁT TRIỂN]` → tên (hoặc tên tổ chức) trùng với tên nhà phát triển trên Play Console
- `[CONTACT EMAIL]` / `[EMAIL LIÊN HỆ]` → email liên hệ thật (nên trùng email trong Play Console)

## 2. Đưa lên mạng (GitHub Pages)
1. GitHub → repo → **Settings → Pages**
2. Source: **Deploy from a branch** → Branch: `main` → Folder: `/docs` → Save
3. Sau ~1 phút, trang có địa chỉ:
   `https://<tài-khoản>.github.io/<tên-repo>/privacy-policy/`
4. Địa chỉ này dán vào **Play Console → Chính sách ứng dụng → Chính sách quyền riêng tư**. Phải là trang web mở được công khai (không phải PDF, không cần đăng nhập).
5. Nếu địa chỉ khác `https://lequang0996.github.io/VocabLuxeAndroid/privacy-policy/`, sửa hằng số `PRIVACY_URL` trong `app/src/main/java/com/fws/vocabluxe/MainActivity.java` (nút "Xem Chính sách quyền riêng tư" trong ứng dụng dùng địa chỉ này).

## 3. Gợi ý khi khai báo "An toàn dữ liệu" (Data safety)
Đối chiếu với biểu mẫu hiện tại của Play Console trước khi gửi:
- Không có tài khoản, quảng cáo, phân tích, SDK theo dõi.
- Tiến độ học / cài đặt chỉ lưu trên máy, không gửi đi.
- Ứng dụng gửi **từ/câu đang tra** (và địa chỉ IP, do bản chất kết nối) tới Google Dịch, MyMemory, Free Dictionary API, Tatoeba qua HTTPS. Đây là dữ liệu truyền ra ngoài thiết bị tới bên thứ ba, nên khai báo cho trung thực theo hướng dẫn của Google về "thu thập/chia sẻ".
- Dữ liệu được mã hóa khi truyền (HTTPS). Không có tài khoản nên không có yêu cầu xóa tài khoản.
- Đối tượng người dùng: không nhắm tới trẻ em (khớp mục 7 của chính sách).
