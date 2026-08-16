# Game tương tác – Ghép cặp

Game học tập dành cho hai đội. Mỗi trận chọn ngẫu nhiên 5 cặp từ ngân hàng thẻ, xáo trộn thành 10 thẻ và tính điểm theo lượt.

## Truy cập game

Sau khi GitHub Pages được bật, game hoạt động tại:

<https://pnnguyen1996.github.io/game-tuong-tac/>

## Tính năng

- Người mở link có thể đổi tên trò chơi; tên được lưu riêng trên trình duyệt.
- Đặt tên hai đội và tung xúc xắc xác định lượt đi.
- Thêm, sửa, xóa từng cặp trong ngân hàng thẻ.
- Thêm nhanh nhiều cặp theo định dạng `Thẻ A | Thẻ B`.
- Nhập và xuất ngân hàng thẻ bằng tệp JSON.
- Mỗi trận chọn ngẫu nhiên 5 cặp hợp lệ.
- Dữ liệu được lưu cục bộ bằng `localStorage`.

## Chạy trên máy tính

Yêu cầu Node.js 22 trở lên.

```bash
npm install
npm run dev
```

## Thay nội dung mẫu

Mở `src/App.tsx` và sửa mảng `DEFAULT_PAIRS`. Mỗi cặp gồm `id`, `left` và `right`; ngân hàng cần ít nhất 5 cặp hợp lệ.

## Xuất bản

Workflow `.github/workflows/deploy-pages.yml` tự động build và triển khai mỗi khi có thay đổi trên nhánh `main`.

## Giấy phép

Dự án phát hành theo [MIT License](LICENSE). Mọi người được phép sử dụng, chỉnh sửa và phân phối lại theo các điều khoản của giấy phép.
