# Nguồn tiếng Hàn (phải tải tay 1 lần)

Từ điển cơ bản tiếng Hàn (한국어기초사전, CC BY-SA 2.0 KR) **không có đường dẫn tải trực tiếp**: trang web gửi link tải
vào email sau khi bạn chọn mục đích sử dụng. Vì vậy workflow không tự tải được.

1. Vào https://krdict.korean.go.kr/ → cuối trang chọn **사전 전체 내려받기** (hoặc **사전 내려받기**, chọn định dạng XML hoặc JSON và
   bật các bản dịch **tiếng Anh + tiếng Việt**).
2. Giải nén (hoặc để nguyên file .zip) rồi chép vào thư mục `tools/sources/krdict/` trong repo (tạo thư mục nếu chưa có).
3. Commit & push. Các file này là dữ liệu CC BY-SA 2.0 KR, được phép lưu trong repo kèm ghi nguồn.
4. Chạy workflow **Build data**. Nếu log báo "Không nhận ra cấu trúc file krdict", chạy lại với `--inspect-ko`
   (ô "Extra args" của workflow) và gửi log để chỉnh bộ đọc.

Mặc định chỉ giữ từ có xếp cấp (sơ/trung/cao cấp). Thêm `--ko-include-ungraded` để giữ cả từ chưa xếp cấp (file lớn hơn nhiều).
