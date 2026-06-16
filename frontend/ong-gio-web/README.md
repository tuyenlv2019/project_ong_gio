# Ong Gio Web Client

React + TypeScript + Vite frontend for the Ong Gio quotation and production management system.

## What This Client Does

- Handles login with captcha
- Stores and sends JWT tokens with API requests
- Shows a protected admin layout after authentication
- Displays dashboard statistics
- Manages quotations and orders
- Manages material records
- Manages product groups and their technical parameters
- Manages users

## App Structure

- `src/main.tsx` - React bootstrap
- `src/App.tsx` - application routes
- `src/authService.ts` - login, captcha, token storage, auth helpers
- `src/api.ts` - backend API client and shared request helpers
- `src/layouts/MainLayout.tsx` - authenticated shell with sidebar and header
- `src/components/ProtectedRoute.tsx` - route guard
- `src/pages/` - feature pages

## Pages

- `LoginPage.tsx` - sign-in form with captcha
- `DashboardPage.tsx` - KPI summary cards
- `OrdersPage.tsx` - quotation list, status updates, delete, export
- `OrderFormPage.tsx` - quotation creation and editing
- `MaterialsPage.tsx` - material CRUD
- `ProductsPage.tsx` - product group CRUD
- `UsersPage.tsx` - user CRUD

## API Notes

The client reads the API base URL from `VITE_API_URL`. If that env var is not set, it defaults to `http://localhost:5273`.

Main API areas used by the client:

- `/api/auth`
- `/api/dashboard`
- `/api/bao-gia`
- `/api/calculation`
- `/api/loai-ton`
- `/api/nhom-san-pham`
- `/api/nguoi-dung`

## User Flow

1. Open the login page.
2. Fetch and solve captcha.
3. Submit credentials.
4. Store the JWT token and user profile in `localStorage`.
5. Enter the protected admin area and use the sidebar modules.

## Chi Tiết Theo File

### Gốc Ứng Dụng

- `src/main.tsx`: điểm vào của React app. Mount `App`, nạp Ant Design reset style và CSS chung.
- `src/App.tsx`: khai báo router toàn bộ ứng dụng, gồm trang login và các route được bảo vệ.
- `src/api.ts`: lớp gọi API cho dashboard, nhóm sản phẩm, loại tôn, báo giá, tính preview và user. Cũng chứa helper định dạng tiền và map trạng thái đơn hàng.
- `src/authService.ts`: xử lý captcha, login/logout, lưu token/user vào `localStorage`, và gắn `Authorization` header cho request.
- `src/types.ts`: định nghĩa base URL, interface dữ liệu cho nhóm sản phẩm, loại tôn, báo giá, chi tiết báo giá, người dùng, dashboard, và payload tính toán.
- `src/components/ProtectedRoute.tsx`: chặn truy cập khi chưa có token, tự động chuyển về `/login`.
- `src/layouts/MainLayout.tsx`: layout chính sau đăng nhập, gồm sidebar điều hướng, header chào người dùng và menu đăng xuất.

### Trang

- `src/pages/LoginPage.tsx`: form đăng nhập có captcha, tải captcha mới, xử lý thông báo lỗi/thành công và chuyển hướng sau khi login thành công.
- `src/pages/DashboardPage.tsx`: gọi API dashboard và hiển thị các thẻ thống kê tổng đơn, đang xử lý, hoàn thành, doanh thu, tiền nguyên liệu, số sản phẩm, loại tôn và user.
- `src/pages/OrdersPage.tsx`: danh sách báo giá/đơn hàng. Cho phép đổi trạng thái, mở form chỉnh sửa, export Excel và xóa đơn.
- `src/pages/OrderFormPage.tsx`: màn hình tạo/sửa báo giá. Có các helper quan trọng như:
  - `getDimensionFields()`: xác định các ô kích thước cần nhập theo từng nhóm sản phẩm.
  - `normalizeText()`: chuẩn hóa chuỗi để so khớp tên nhóm.
  - `ensureNewRowIfNeeded()`: tự thêm một dòng trống mới khi dòng cuối đã được nhập đủ.
  - `refreshPreviews()`: gọi API preview cho từng dòng hợp lệ.
  - `calculateTotals()`: cộng tổng tiền trước thuế, thuế VAT và tổng sau thuế từ các preview.
  - `isRowIncomplete()`: đánh dấu dòng chưa đủ dữ liệu.
  - `requiredRulesFor()`: sinh rule bắt buộc theo danh sách cột bắt buộc từ file Excel.
  - `onValuesChange()`: đồng bộ preview, nhóm sản phẩm đang chọn và tự thêm dòng mới.
  - `save()`: validate form, lọc các dòng hợp lệ, build payload và gọi API tạo/cập nhật báo giá.
- `src/pages/MaterialsPage.tsx`: quản lý loại tôn, mở modal thêm/sửa, validate form, gọi API CRUD và hiển thị barem JSON.
- `src/pages/ProductsPage.tsx`: quản lý nhóm sản phẩm, cho phép thêm/sửa/xóa và chỉnh danh sách tham số cố định động.
- `src/pages/UsersPage.tsx`: quản lý user, hỗ trợ tạo/sửa/xóa, đổi vai trò và trạng thái hoạt động.

### Giao Diện

- `src/App.css`: stylesheet giao diện mẫu, hiện đang là phần style mẫu của Vite và có thể thay thế hoặc dọn dẹp theo nhu cầu dự án.
- `src/index.css`: style nền và font cơ bản cho toàn app.

### Tài Nguyên

- `src/assets/hero.png`: ảnh minh họa giao diện.
- `src/assets/react.svg` và `src/assets/vite.svg`: asset mặc định từ template.
- `public/favicon.svg` và `public/icons.svg`: icon tĩnh được phục vụ trực tiếp.

## Ghi Chú Luồng Xử Lý

- `LoginPage` lấy captcha từ backend trước khi cho submit.
- `authService` lưu token để `api.ts` tự đính kèm vào request.
- Các trang nghiệp vụ lấy dữ liệu qua `api.ts` rồi render bằng Ant Design components.
- `OrderFormPage` là nơi nhiều logic nhất ở client vì nó phải map nhóm sản phẩm sang input động và đồng bộ với preview từ server.
