/**
 * Tạo file Excel hướng dẫn sử dụng end user kèm ảnh chụp màn hình thật.
 * Chạy: npm run generate-user-guide-excel
 */
import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'docs/huong-dan-su-dung/images');
const OUTPUT = path.join(ROOT, 'docs/huong-dan-su-dung/Huong-dan-su-dung-he-thong-Ong-gio.xlsx');
const OUTPUT_FALLBACK = path.join(ROOT, 'docs/huong-dan-su-dung/Huong-dan-su-dung-he-thong-Ong-gio-moi.xlsx');

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003D82' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const TITLE_FONT = { bold: true, size: 14, color: { argb: 'FF003D82' } };
const SUB_FONT = { italic: true, size: 10, color: { argb: 'FF595959' } };

/** @typedef {{ num: string; area: string; detail: string }} LegendItem */
/** @typedef {{ name: string; location: string; type: string; meaning: string; howTo: string; required: string }} FieldRow */
/** @typedef {{ sheet: string; title: string; description: string; image?: string; image2?: string; image2Label?: string; imageWidth?: number; imageLegendItems?: LegendItem[]; image2LegendItems?: LegendItem[]; fields: FieldRow[] }} GuideModule */

/** @type {GuideModule[]} */
const MODULES = [
  {
    sheet: '1. Mục lục',
    title: 'Hướng dẫn sử dụng — Hệ thống Báo giá & Quản lý Sản xuất Ống gió',
    description: 'Tài liệu dành cho người dùng cuối. Ảnh minh họa chụp trực tiếp từ giao diện thật.',
    fields: [
      { name: '1. Mục lục', location: 'Sheet này', type: '—', meaning: 'Danh sách các màn hình trong tài liệu', howTo: 'Chọn sheet tương ứng ở cuối file Excel', required: '—' },
      { name: '2. Đăng nhập', location: 'Menu /login', type: 'Form', meaning: 'Xác thực tài khoản trước khi vào hệ thống', howTo: 'Xem sheet 2', required: '—' },
      { name: '3. Giao diện chung', location: 'Toàn hệ thống', type: 'Layout', meaning: 'Menu trái, header, vùng nội dung', howTo: 'Xem sheet 3', required: '—' },
      { name: '4. Dashboard', location: 'Menu Dashboard', type: 'Thống kê', meaning: 'Số liệu tổng quan và nút tắt', howTo: 'Xem sheet 4', required: '—' },
      { name: '5. Quản lý đơn hàng', location: 'Menu Quản lý đơn hàng', type: 'Danh sách', meaning: 'Xem, tìm, sửa, sao chép, xuất Excel đơn', howTo: 'Xem sheet 5', required: '—' },
      { name: '6. Form đơn hàng', location: 'Tạo/Sửa đơn', type: 'Form', meaning: 'Nhập chi tiết báo giá từng dòng sản phẩm', howTo: 'Xem sheet 6', required: '—' },
      { name: '7. Quản lý nguyên liệu', location: 'Menu Quản lý nguyên liệu', type: 'Master', meaning: 'Danh mục loại tôn và đơn giá', howTo: 'Xem sheet 7', required: '—' },
      { name: '8. Quản lý sản phẩm', location: 'Menu Quản lý sản phẩm', type: 'Master', meaning: 'Nhóm SP, công thức ∑Ssx, tham số form', howTo: 'Xem sheet 8', required: '—' },
      { name: '9. Quản lý user', location: 'Menu Quản lý user', type: 'Admin', meaning: 'Tài khoản nội bộ (chỉ Admin)', howTo: 'Xem sheet 9', required: '—' },
      { name: '10. Đổi mật khẩu', location: 'Menu user góc phải', type: 'Form', meaning: 'User tự đổi mật khẩu', howTo: 'Xem sheet 10', required: '—' },
    ],
  },
  {
    sheet: '2. Đăng nhập',
    title: 'Đăng nhập hệ thống',
    description: 'Màn hình đầu tiên khi truy cập ứng dụng. Đối chiếu số đỏ trên ảnh với bảng chú thích bên dưới.',
    image: '01-dang-nhap.png',
    imageWidth: 520,
    imageLegendItems: [
      { num: '1', area: 'Tên đăng nhập', detail: 'Ô nhập mã đăng nhập do Admin cấp (vd. admin, test1). Bắt buộc, tối thiểu 3 ký tự. Có icon hình người bên trái ô.' },
      { num: '2', area: 'Mật khẩu', detail: 'Ô nhập mật khẩu bảo mật. Bắt buộc, tối thiểu 6 ký tự. Bấm icon mắt bên phải để hiện/ẩn ký tự.' },
      { num: '3', area: 'Captcha', detail: 'Phía trên: ảnh captcha (ký tự chống đăng nhập tự động). Phía dưới: ô nhập ký tự trong ảnh. Bấm "Làm mới" nếu ảnh khó đọc.' },
      { num: '4', area: 'Nút Đăng nhập', detail: 'Nút xanh cuối form. Bấm sau khi điền đủ 3 trường trên. Thành công → vào Dashboard; sai → kiểm tra lại thông tin.' },
    ],
    fields: [
      { name: 'Tên đăng nhập', location: 'Số 1 trên ảnh', type: 'Text', meaning: 'Mã đăng nhập do Admin cấp', howTo: 'Nhập tối thiểu 3 ký tự', required: 'Có' },
      { name: 'Mật khẩu', location: 'Số 2 trên ảnh', type: 'Password', meaning: 'Mật khẩu bảo mật tài khoản', howTo: 'Nhập tối thiểu 6 ký tự; bấm icon mắt để hiện/ẩn', required: 'Có' },
      { name: 'Captcha', location: 'Số 3 trên ảnh', type: 'Text + ảnh', meaning: 'Mã chống đăng nhập tự động', howTo: 'Nhập đúng ký tự trong ảnh; bấm "Làm mới" nếu khó đọc', required: 'Có' },
      { name: 'Đăng nhập', location: 'Số 4 trên ảnh', type: 'Nút', meaning: 'Gửi thông tin xác thực', howTo: 'Bấm sau khi điền đủ 3 trường trên', required: '—' },
    ],
  },
  {
    sheet: '3. Giao diện chung',
    title: 'Bố cục và menu hệ thống',
    description: 'Sau đăng nhập, làm quen bố cục màn hình và cách chuyển chức năng qua menu trái.',
    image: '11-menu-he-thong.png',
    imageWidth: 720,
    imageLegendItems: [
      { num: '1', area: 'Menu trái (sidebar)', detail: 'Cột xanh bên trái: logo công ty, các mục Dashboard / Quản lý đơn hàng / Nguyên liệu / Sản phẩm / User. Mục đang chọn có nền sáng hơn. Bấm tên menu để chuyển trang.' },
      { num: '2', area: 'Nút thu gọn ☰', detail: 'Icon 3 gạch trên header trắng, góc trái. Bấm để thu gọn hoặc mở rộng menu trái khi cần rộng vùng làm việc.' },
      { num: '3', area: 'Thông tin user', detail: 'Góc phải header: dòng "Xin chào: [Họ tên]" và icon người. Bấm icon → menu Đổi mật khẩu hoặc Đăng xuất.' },
      { num: '4', area: 'Vùng nội dung', detail: 'Khu vực trắng/xám bên phải menu — hiển thị bảng, form, thống kê tùy chức năng đang mở.' },
      { num: '5', area: 'Footer liên hệ', detail: 'Cuối menu trái: copyright công ty, địa chỉ Đà Nẵng, giờ làm việc, SĐT và email. Chỉ xem, không cần thao tác.' },
    ],
    fields: [
      { name: 'Menu Dashboard', location: 'Số 1 — dòng đầu menu', type: 'Menu', meaning: 'Trang chủ — thống kê tổng quan', howTo: 'Bấm để về Dashboard', required: '—' },
      { name: 'Quản lý đơn hàng', location: 'Số 1 — menu trái', type: 'Menu', meaning: 'Danh sách báo giá / đơn hàng', howTo: 'Bấm để mở danh sách đơn', required: '—' },
      { name: 'Quản lý nguyên liệu', location: 'Số 1 — menu trái', type: 'Menu', meaning: 'Quản lý loại tôn (master nguyên liệu)', howTo: 'Bấm để mở danh sách tôn', required: '—' },
      { name: 'Quản lý sản phẩm', location: 'Số 1 — menu trái', type: 'Menu', meaning: 'Quản lý nhóm sản phẩm và công thức', howTo: 'Bấm để mở danh sách SP', required: '—' },
      { name: 'Quản lý user', location: 'Số 1 — menu trái', type: 'Menu', meaning: 'Quản lý tài khoản — chỉ hiện với ADMIN', howTo: 'Nhân viên không thấy mục này', required: '—' },
      { name: 'Nút thu gọn menu (☰)', location: 'Số 2 trên ảnh', type: 'Nút', meaning: 'Thu gọn / mở rộng sidebar', howTo: 'Bấm icon 3 gạch', required: '—' },
      { name: 'Xin chào: [Họ tên]', location: 'Số 3 trên ảnh', type: 'Text', meaning: 'User đang đăng nhập', howTo: 'Bấm icon người → Đổi mật khẩu / Đăng xuất', required: '—' },
      { name: 'Tìm kiếm trong danh sách', location: 'Số 4 — trên bảng', type: 'Text', meaning: 'Lọc nhanh trên các trang danh sách', howTo: 'Gõ tên, mã, trạng thái…', required: '—' },
    ],
  },
  {
    sheet: '4. Dashboard',
    title: 'Dashboard — Trang chủ',
    description: 'Trang mặc định sau đăng nhập. Xem số liệu tổng quan và dùng nút tắt để tạo mới nhanh.',
    image: '02-dashboard.png',
    imageWidth: 720,
    imageLegendItems: [
      { num: '1', area: 'Nút tắt tạo mới', detail: 'Hàng nút phía trên: + Tạo đơn hàng (xanh), + Thêm nguyên liệu, + Thêm sản phẩm, + Thêm user (chỉ Admin). Bấm để chuyển sang trang tương ứng.' },
      { num: '2', area: 'Thẻ thống kê đơn hàng', detail: '4 thẻ đầu: Tổng đơn hàng, Chưa xử lý, Đang xử lý, Hoàn thành — số liệu tự cập nhật từ hệ thống.' },
      { num: '3', area: 'Thẻ doanh thu / nguyên liệu', detail: 'Doanh thu (hoàn thành): tổng tiền sau thuế các đơn đã hoàn thành. Tổng tiền nguyên liệu: giá trị tôn trên tất cả đơn.' },
      { num: '4', area: 'Thẻ sản phẩm / tôn / user', detail: 'Số nhóm sản phẩm (master), số loại tôn và số tài khoản user trong hệ thống.' },
    ],
    fields: [
      { name: '+ Tạo đơn hàng', location: '(1) Nút tắt', type: 'Nút', meaning: 'Mở form tạo đơn hàng mới', howTo: 'Bấm nút xanh', required: '—' },
      { name: '+ Thêm nguyên liệu', location: 'Nút tắt', type: 'Nút', meaning: 'Mở form thêm loại tôn', howTo: 'Chuyển sang trang nguyên liệu và mở modal thêm', required: '—' },
      { name: '+ Thêm sản phẩm', location: 'Nút tắt', type: 'Nút', meaning: 'Mở form thêm nhóm sản phẩm', howTo: 'Chuyển sang trang sản phẩm và mở modal thêm', required: '—' },
      { name: '+ Thêm user', location: 'Nút tắt', type: 'Nút', meaning: 'Thêm tài khoản — chỉ Admin', howTo: 'Không hiện với NHAN_VIEN', required: '—' },
      { name: 'Tổng đơn hàng', location: 'Thẻ thống kê', type: 'Số', meaning: 'Tổng số báo giá trong hệ thống', howTo: 'Tự cập nhật từ DB', required: '—' },
      { name: 'Chưa xử lý', location: 'Thẻ thống kê', type: 'Số', meaning: 'Đơn ở trạng thái CHUA_XU_LY', howTo: 'Tự cập nhật', required: '—' },
      { name: 'Đang xử lý', location: 'Thẻ thống kê', type: 'Số', meaning: 'Đơn ở trạng thái DANG_XU_LY', howTo: 'Tự cập nhật', required: '—' },
      { name: 'Hoàn thành', location: 'Thẻ thống kê', type: 'Số', meaning: 'Đơn ở trạng thái HOAN_THANH', howTo: 'Tự cập nhật', required: '—' },
      { name: 'Doanh thu (hoàn thành)', location: 'Thẻ thống kê', type: 'Tiền VNĐ', meaning: 'Tổng tiền sau thuế các đơn đã hoàn thành', howTo: 'Tự tính từ đơn hoàn thành', required: '—' },
      { name: 'Tổng tiền nguyên liệu', location: 'Thẻ thống kê', type: 'Tiền VNĐ', meaning: 'Tổng giá trị tôn trên tất cả đơn', howTo: 'Tự tính', required: '—' },
      { name: 'Sản phẩm', location: 'Thẻ thống kê', type: 'Số', meaning: 'Số nhóm sản phẩm (master)', howTo: 'Tự cập nhật', required: '—' },
      { name: 'Loại tôn / User', location: 'Thẻ thống kê', type: 'Số/Số', meaning: 'Số loại tôn và số tài khoản user', howTo: 'Tự cập nhật', required: '—' },
    ],
  },
  {
    sheet: '5. Quản lý đơn hàng',
    title: 'Quản lý đơn hàng — Danh sách',
    description: 'Xem, tìm, sửa, sao chép, xuất Excel và xóa báo giá. Đối chiếu số đỏ trên ảnh với bảng chú thích.',
    image: '03-quan-ly-don-hang.png',
    imageWidth: 720,
    imageLegendItems: [
      { num: '1', area: 'Ô tìm kiếm', detail: 'Ô "Tìm kiếm trong danh sách…" phía trên bảng. Gõ mã BG, tên khách, trạng thái, tổng tiền, user tạo/sửa… để lọc nhanh.' },
      { num: '2', area: 'Nút + Tạo đơn hàng', detail: 'Nút xanh góc phải trên. Mở form tạo báo giá / đơn hàng mới (trống, chưa có mã BG).' },
      { num: '3', area: 'Bảng danh sách', detail: 'Header xanh: STT, Mã Báo Giá, Khách hàng, Trạng thái, Tổng SP, Tổng tiền, Tạo, Cập nhật. Mỗi dòng là một báo giá.' },
      { num: '4', area: 'Dropdown Trạng thái', detail: 'Cột Trạng thái trên từng dòng: Chưa xử lý / Đang xử lý / Hoàn Thành. Chọn trực tiếp — lưu ngay, không cần mở form sửa.' },
      { num: '5', area: 'Cột Thao tác', detail: 'Cuối mỗi dòng: ✏️ Sửa form | 📋 Sao chép đơn mới | ⬇️ Xuất Excel báo giá | 🗑️ Xóa (có xác nhận).' },
    ],
    fields: [
      { name: 'Tìm kiếm trong danh sách', location: '(1) Trên bảng', type: 'Text', meaning: 'Lọc theo mã BG, khách hàng, trạng thái, tiền, user…', howTo: 'Gõ từ khóa', required: 'Không' },
      { name: 'Tạo đơn hàng', location: '(2) Góc phải trên', type: 'Nút', meaning: 'Mở form tạo đơn mới', howTo: 'Bấm + Tạo đơn hàng', required: '—' },
      { name: 'STT', location: 'Cột bảng', type: 'Số', meaning: 'Số thứ tự dòng hiển thị', howTo: 'Tự đánh số', required: '—' },
      { name: 'Mã Báo Giá', location: 'Cột bảng', type: 'Text', meaning: 'Mã duy nhất (vd. BG-2026-004) — tự sinh khi lưu', howTo: 'Chỉ xem', required: '—' },
      { name: 'Khách hàng', location: 'Cột bảng', type: 'Text', meaning: 'Tên khách hàng trên đơn', howTo: 'Chỉ xem; sửa trong form đơn', required: '—' },
      { name: 'Trạng thái', location: 'Cột bảng', type: 'Dropdown', meaning: 'Chưa xử lý / Đang xử lý / Hoàn Thành', howTo: 'Chọn trực tiếp trên bảng — lưu ngay', required: '—' },
      { name: 'Tổng SP', location: 'Cột bảng', type: 'Số', meaning: 'Số dòng sản phẩm trong đơn', howTo: 'Tự tính', required: '—' },
      { name: 'Tổng tiền', location: 'Cột bảng', type: 'Tiền VNĐ', meaning: 'Tổng sau thuế của đơn', howTo: 'Tự tính từ các dòng', required: '—' },
      { name: 'Tạo / Cập nhật', location: 'Cột bảng', type: 'Audit', meaning: 'User và thời gian tạo/sửa đơn', howTo: 'Chỉ xem', required: '—' },
      { name: 'Sửa (✏️)', location: 'Cột Thao tác', type: 'Nút', meaning: 'Mở form chỉnh sửa đơn', howTo: 'Bấm icon bút', required: '—' },
      { name: 'Sao chép (📋)', location: 'Cột Thao tác', type: 'Nút', meaning: 'Tạo đơn mới từ bản sao nội dung', howTo: 'Bấm icon sao chép; nhập lại tên KH; mã BG mới khi lưu', required: '—' },
      { name: 'Xuất Excel (⬇️)', location: 'Cột Thao tác', type: 'Nút', meaning: 'Tải file Excel báo giá', howTo: 'Bấm icon tải → xác nhận Xuất', required: '—' },
      { name: 'Xóa (🗑️)', location: 'Cột Thao tác', type: 'Nút', meaning: 'Xóa đơn khỏi hệ thống', howTo: 'Bấm icon thùng rác → xác nhận', required: '—' },
    ],
  },
  {
    sheet: '6. Form đơn hàng',
    title: 'Tạo / Sửa đơn hàng',
    description: 'Nhập báo giá chi tiết từng dòng sản phẩm. Ảnh 1: tạo mới; Ảnh 2: sửa đơn có sẵn.',
    image: '04-form-don-hang-tao-moi.png',
    image2: '05-form-don-hang-sua.png',
    image2Label: 'Ảnh 2 — Sửa đơn hàng có sẵn',
    imageWidth: 720,
    imageLegendItems: [
      { num: '1', area: 'Thông tin đơn hàng', detail: 'Thẻ đầu form: Tên khách hàng (bắt buộc) và Trạng thái đơn (Chưa xử lý / Đang xử lý / Hoàn Thành).' },
      { num: '2', area: 'Bảng cụm sản phẩm', detail: 'Mỗi dòng = 1 SP: Loại SP, Tên, Kích thước (mm), Loại tôn, ∑Ssx, Giá vật liệu, Nhân công, Phụ kiện, SL, Thuế, Đơn giá, Thành tiền. Dùng + Thêm dòng mới / F4 chọn từ đơn cũ.' },
      { num: '3', area: 'Tổng tiền cuối bảng', detail: 'Footer bảng: Tổng trước thuế, Thuế VAT theo %, Tổng sau thuế — tự cập nhật khi nhập liệu.' },
      { num: '4', area: 'Nút Lưu / Hủy', detail: 'Lưu đơn hàng: ghi vào hệ thống (tạo mới hoặc cập nhật). Hủy: quay danh sách, không lưu thay đổi.' },
    ],
    image2LegendItems: [
      { num: '1', area: 'Tiêu đề trang', detail: 'Dòng "Sửa đơn hàng" — xác nhận đang chỉnh sửa đơn có sẵn (không phải tạo mới).' },
      { num: '2', area: 'Thông tin đơn hàng', detail: 'Giống ảnh 1: Tên khách hàng và Trạng thái. Dữ liệu đã có sẵn từ đơn được chọn.' },
      { num: '3', area: 'Bảng cụm sản phẩm', detail: 'Các dòng SP đã lưu — có thể sửa kích thước, tôn, chi phí, thêm/xóa dòng như form tạo mới.' },
      { num: '4', area: 'Tổng tiền', detail: 'Tổng trước thuế và Tổng sau thuế cập nhật theo thay đổi trên bảng.' },
      { num: '5', area: 'Nút Lưu đơn hàng', detail: 'Bấm để cập nhật đơn hiện tại. Mã báo giá giữ nguyên (không đổi khi sửa).' },
    ],
    fields: [
      { name: 'Tên khách hàng', location: 'Thông tin đơn hàng', type: 'Text', meaning: 'Tên khách / công ty nhận báo giá', howTo: 'Nhập tên đầy đủ', required: 'Có' },
      { name: 'Trạng thái đơn hàng', location: 'Thông tin đơn hàng', type: 'Dropdown', meaning: 'Chưa xử lý / Đang xử lý / Hoàn Thành', howTo: 'Chọn trạng thái phù hợp', required: 'Có' },
      { name: 'Loại sản phẩm', location: 'Cột Sản phẩm', type: 'Dropdown', meaning: 'Nhóm SP (ống, co, chạc…) — quyết định công thức và tham số kích thước', howTo: 'Chọn từ danh sách SP đã có công thức', required: 'Có' },
      { name: 'Tên sản phẩm', location: 'Cột Sản phẩm', type: 'Text', meaning: 'Mô tả sản phẩm trên báo giá', howTo: 'Nhập tay hoặc F4 chọn từ đơn cũ', required: 'Có (trừ dòng buffer cuối)' },
      { name: 'Kích thước (mm)', location: 'Cột Kích thước', type: 'Số', meaning: 'W, H, L, R, r… theo tham số của loại SP (đơn vị mm)', howTo: 'Nhập số nguyên/thập phân; Tab ra khỏi ô để tính lại', required: 'Theo loại SP' },
      { name: 'Loại tôn', location: 'Cột Thông tin tôn', type: 'Dropdown', meaning: 'Thương hiệu + độ dày + độ mạ vật liệu — lấy đơn giá/mét tới', howTo: 'Chọn từ master nguyên liệu', required: 'Có' },
      { name: 'Khối lượng (Kg)', location: 'Cột Thông tin tôn', type: 'Tự tính', meaning: 'Khối lượng tôn 1 cái — tính từ diện tích và kg/mét tới', howTo: 'Chỉ xem', required: '—' },
      { name: 'Ssx (m²)', location: 'Cột Diện tích Sx', type: 'Tự tính', meaning: 'Diện tích sản xuất 1 cái (∑Ssx) theo công thức SP', howTo: 'Tự cập nhật sau khi nhập kích thước', required: '—' },
      { name: 'Ssx (mét tới)', location: 'Cột Diện tích Sx', type: 'Tự tính', meaning: 'Diện tích quy đổi mét tới (= m² / 1.2)', howTo: 'Dùng để gợi ý Giá vật liệu', required: '—' },
      { name: 'Giá vật liệu', location: 'Cột Chi phí', type: 'Tiền VNĐ', meaning: 'Tiền vật liệu cho 1 cái — gợi ý = đơn giá tôn/mét tới × Ssx mét tới', howTo: 'Có thể sửa tay; đổi kích thước/loại tôn sẽ hỏi xác nhận cập nhật', required: 'Không' },
      { name: 'Giá nhân công', location: 'Cột Chi phí', type: 'Tiền VNĐ', meaning: 'Chi phí gia công nhân công 1 cái', howTo: 'Nhập số nguyên VNĐ', required: 'Theo cấu hình' },
      { name: 'Phụ kiện đi kèm', location: 'Cột Chi phí', type: 'Tiền VNĐ', meaning: 'Chi phí phụ kiện kèm theo 1 cái', howTo: 'Nhập số nguyên VNĐ', required: 'Theo cấu hình' },
      { name: 'Đơn vị tính', location: 'Cột Thông tin dòng', type: 'Text', meaning: 'ĐVT báo giá (cái, bộ, m²…)', howTo: 'Mặc định "cái"', required: 'Có' },
      { name: 'Số lượng', location: 'Cột Thông tin dòng', type: 'Số', meaning: 'Số lượng sản phẩm cần báo giá', howTo: 'Nhập ≥ 1', required: 'Có' },
      { name: 'Thuế', location: 'Cột Thông tin dòng', type: '%', meaning: 'Thuế suất VAT áp dụng cho dòng (vd. 8%)', howTo: 'Nhập % (0–100)', required: 'Có' },
      { name: 'Đơn giá (VND)', location: 'Cột Giá trị', type: 'Tự tính', meaning: 'Đơn giá 1 cái trước thuế dòng', howTo: 'Tự tính từ chi phí và diện tích', required: '—' },
      { name: 'Thành tiền (VND)', location: 'Cột Giá trị', type: 'Tự tính', meaning: 'Tổng tiền dòng = đơn giá × số lượng (có thuế)', howTo: 'Chỉ xem', required: '—' },
      { name: 'Ghi chú', location: 'Cột Ghi chú & hình ảnh', type: 'Text', meaning: 'Ghi chú riêng cho dòng sản phẩm', howTo: 'Nhập tùy chọn', required: 'Theo cấu hình' },
      { name: 'Hình ảnh', location: 'Cột Ghi chú & hình ảnh', type: 'Ảnh', meaning: 'Ảnh minh họa từ master loại SP', howTo: 'Tự hiện khi chọn loại SP', required: '—' },
      { name: '↑ / ↓ / ⇄ / −', location: 'Cột Thao tác', type: 'Nút', meaning: 'Di chuyển lên/xuống, nhảy đến STT, xóa dòng', howTo: 'Bấm icon tương ứng', required: '—' },
      { name: '+ Thêm dòng mới', location: 'Dưới bảng', type: 'Nút', meaning: 'Thêm dòng sản phẩm trống', howTo: 'Bấm đường viền nét đứt', required: '—' },
      { name: 'Tổng trước thuế', location: 'Footer bảng', type: 'Tự tính', meaning: 'Tổng tiền các dòng trước VAT', howTo: 'Cập nhật realtime', required: '—' },
      { name: 'Thuế VAT [%]', location: 'Footer bảng', type: 'Tự tính', meaning: 'Tiền thuế theo từng mức % trên đơn', howTo: 'Chỉ xem', required: '—' },
      { name: 'Tổng sau thuế', location: 'Footer bảng', type: 'Tự tính', meaning: 'Tổng thanh toán cuối cùng', howTo: 'Chỉ xem', required: '—' },
      { name: 'Lưu đơn hàng', location: 'Cuối form', type: 'Nút', meaning: 'Ghi đơn vào hệ thống', howTo: 'Bấm sau khi kiểm tra dữ liệu', required: '—' },
      { name: 'Hủy', location: 'Cuối form', type: 'Nút', meaning: 'Quay về danh sách không lưu', howTo: 'Bấm Hủy', required: '—' },
      { name: 'F4 — chọn từ đơn cũ', location: 'Ô Tên sản phẩm', type: 'Phím tắt', meaning: 'Mở hộp thoại chọn dòng đã lưu trước đó', howTo: 'Focus ô Tên SP → nhấn F4', required: '—' },
    ],
  },
  {
    sheet: '7. Quản lý nguyên liệu',
    title: 'Quản lý nguyên liệu (Tôn)',
    description: 'Danh mục loại tôn dùng khi lập đơn: thương hiệu, độ dày, đơn giá/mét tới, khối lượng.',
    image: '06-quan-ly-nguyen-lieu.png',
    imageWidth: 720,
    imageLegendItems: [
      { num: '1', area: 'Nút + Thêm loại tôn', detail: 'Góc phải trên. Mở modal nhập loại tôn mới: Thương hiệu, Độ dày (mm), Độ mạ vật liệu, Đơn giá/mét tới (VND), Khối lượng (kg/1 mét tới).' },
      { num: '2', area: 'Ô tìm kiếm', detail: 'Lọc nhanh theo thương hiệu, độ dày, độ mạ, đơn giá trong danh sách dài.' },
      { num: '3', area: 'Bảng loại tôn', detail: 'Các cột: STT, Thương hiệu, Độ dày, Độ mạ vật liệu, Đơn giá/mét tới, Khối lượng, Tạo, Cập nhật. Dữ liệu dùng khi chọn Loại tôn trên form đơn.' },
      { num: '4', area: 'Cột Thao tác', detail: '✏️ Sửa thông tin loại tôn | 🗑️ Xóa (có xác nhận). Thay đổi đơn giá ảnh hưởng gợi ý Giá vật liệu trên đơn mới.' },
    ],
    fields: [
      { name: 'Thêm loại tôn', location: 'Góc phải', type: 'Nút', meaning: 'Mở form thêm loại tôn mới', howTo: 'Bấm + Thêm loại tôn', required: '—' },
      { name: 'Thương hiệu', location: 'Bảng / Form', type: 'Text', meaning: 'Tên hãng tôn (Hoa Sen, Phương Nam…)', howTo: 'Nhập tên thương hiệu', required: 'Có' },
      { name: 'Độ dày (mm)', location: 'Bảng / Form', type: 'Số', meaning: 'Độ dày tấm tôn (mm)', howTo: 'Nhập số thập phân (vd. 0.75)', required: 'Có' },
      { name: 'Độ mạ vật liệu', location: 'Bảng / Form', type: 'Text', meaning: 'Độ mạ kẽm / mạ vật liệu của loại tôn', howTo: 'Nhập tay (vd. Z120, Z275)', required: 'Có' },
      { name: 'Đơn giá/mét tới (VND)', location: 'Bảng / Form', type: 'Tiền', meaning: 'Giá mua tôn trên 1 mét tới sản xuất', howTo: 'Nhập VNĐ; ảnh hưởng gợi ý Giá vật liệu trên đơn', required: 'Có' },
      { name: 'Khối lượng (kg/1 mét tới)', location: 'Bảng / Form', type: 'Số', meaning: 'Khối lượng tôn trên 1 mét tới — dùng tính kg/sp', howTo: 'Nhập số (vd. 4.5)', required: 'Có' },
      { name: 'Sửa / Xóa', location: 'Cột Thao tác', type: 'Nút', meaning: 'Chỉnh sửa hoặc xóa loại tôn', howTo: '✏️ sửa; 🗑️ xóa (có xác nhận)', required: '—' },
    ],
  },
  {
    sheet: '8. Quản lý sản phẩm',
    title: 'Quản lý sản phẩm (Nhóm SP)',
    description: 'Khai báo nhóm sản phẩm, công thức ∑Ssx và tham số nhập trên form đơn hàng.',
    image: '07-quan-ly-san-pham.png',
    image2: '08-modal-san-pham.png',
    image2Label: 'Ảnh 2 — Form thêm / sửa sản phẩm',
    imageWidth: 680,
    imageLegendItems: [
      { num: '1', area: 'Nút + Thêm sản phẩm', detail: 'Góc phải trên danh sách. Mở modal khai báo nhóm SP mới.' },
      { num: '2', area: 'Ô tìm kiếm', detail: 'Lọc theo tên nhóm, công thức, tham số trong bảng.' },
      { num: '3', area: 'Bảng danh sách SP', detail: 'Cột: Hình ảnh, Tên nhóm, Công thức, Tham số, Tạo, Cập nhật. Bấm ✏️ trên dòng để sửa (mở ảnh 2).' },
      { num: '4', area: 'Cột Thao tác', detail: '✏️ Mở form sửa (ảnh 2) | 🗑️ Xóa nhóm SP. Chỉ SP có công thức hợp lệ mới hiện trên form đơn hàng.' },
    ],
    image2LegendItems: [
      { num: '1', area: 'Tên nhóm', detail: 'Tên loại SP hiển thị trên form đơn (vd. Co 90°, Ống thẳng, Thang máng cáp). Bắt buộc.' },
      { num: '2', area: 'Ảnh minh họa', detail: 'Tải ảnh JPG/PNG/WEBP (≤5MB) hoặc nhập URL. Ảnh hiện trên form đơn khi user chọn loại SP này.' },
      { num: '3', area: 'Công thức ∑Ssx (m²)', detail: 'Mỗi dòng: Biến=biểu_thức; dòng cuối Ssx=... Có thể sao chép từ SP khác qua dropdown phía trên. Bắt buộc.' },
      { num: '4', area: 'Tham số form đơn hàng', detail: 'Danh sách tên tham số user nhập khi lập đơn (W, H, L, R, r…). Bấm + Thêm tham số; không trùng tên.' },
      { num: '5', area: 'Nút OK / Hủy', detail: 'OK: lưu nhóm SP. Hủy: đóng modal không lưu.' },
    ],
    fields: [
      { name: 'Tên nhóm', location: 'Bảng / Form', type: 'Text', meaning: 'Tên loại sản phẩm hiển thị trên form đơn', howTo: 'Nhập tên (vd. Co 90°, Ống thẳng)', required: 'Có' },
      { name: 'Hình ảnh', location: 'Cột bảng', type: 'Ảnh', meaning: 'Thumbnail ảnh minh họa trên danh sách', howTo: 'Tự hiện từ đường dẫn ảnh', required: '—' },
      { name: 'Công thức ∑Ssx (m²)', location: 'Bảng / Form', type: 'Công thức', meaning: 'Công thức tính diện tích sản xuất', howTo: 'Mỗi dòng: Biến=biểu_thức; dòng cuối Ssx=...', required: 'Có' },
      { name: 'Tham số nhập trên form', location: 'Cột bảng', type: 'Text', meaning: 'Danh sách tham số kích thước (W, H, L…)', howTo: 'Khai báo trong form thêm/sửa SP', required: 'Có' },
      { name: 'Ảnh minh họa', location: 'Form modal', type: 'Upload/URL', meaning: 'Ảnh hiển thị trên form đơn khi chọn loại SP', howTo: 'Tải ảnh hoặc nhập URL (/images/...)', required: 'Không' },
      { name: 'Sao chép công thức', location: 'Form modal', type: 'Dropdown', meaning: 'Copy công thức từ SP khác', howTo: 'Chọn sản phẩm nguồn trong dropdown', required: 'Không' },
      { name: 'Tham số form đơn hàng', location: 'Form modal', type: 'Danh sách', meaning: 'Tên tham số user nhập (W, H, L, R, r…)', howTo: '+ Thêm tham số; không trùng tên', required: 'Có' },
      { name: 'Thêm sản phẩm / Sửa / Xóa', location: 'Trang & bảng', type: 'Nút', meaning: 'CRUD nhóm sản phẩm', howTo: 'Chỉ SP có công thức mới hiện trên form đơn', required: '—' },
    ],
  },
  {
    sheet: '9. Quản lý user',
    title: 'Quản lý user (Chỉ Admin)',
    description: 'Quản lý tài khoản nội bộ. Menu chỉ hiện khi đăng nhập bằng tài khoản ADMIN.',
    image: '09-quan-ly-user.png',
    imageWidth: 720,
    imageLegendItems: [
      { num: '1', area: 'Nút + Thêm user', detail: 'Góc phải trên. Mở modal tạo tài khoản: Tên đăng nhập, Họ tên, Mật khẩu, Vai trò (ADMIN/NHAN_VIEN), trạng thái Hoạt động.' },
      { num: '2', area: 'Header bảng', detail: 'Tiêu đề các cột: STT, Tên đăng nhập, Họ tên, Vai trò, Trạng thái, Tạo, Cập nhật, Thao tác.' },
      { num: '3', area: 'Cột Vai trò', detail: 'Nhãn ADMIN (đỏ) hoặc NHAN_VIEN (xanh) trên từng dòng. ADMIN: toàn quyền; NHAN_VIEN: không quản lý user.' },
      { num: '4', area: 'Nút Reset mật khẩu 🔑', detail: 'Icon chìa khóa trên dòng user (chỉ Admin). Đặt mật khẩu mới ≥ 6 ký tự cho user khác.' },
      { num: '5', area: 'Cột Thao tác', detail: '✏️ Sửa thông tin user (để trống mật khẩu nếu không đổi) | 🗑️ Xóa tài khoản (có xác nhận).' },
    ],
    fields: [
      { name: 'Thêm user', location: 'Góc phải', type: 'Nút', meaning: 'Tạo tài khoản mới', howTo: 'Bấm + Thêm user', required: '—' },
      { name: 'Tên đăng nhập', location: 'Bảng / Form', type: 'Text', meaning: 'Mã login duy nhất', howTo: 'Không trùng user khác', required: 'Có' },
      { name: 'Họ tên', location: 'Bảng / Form', type: 'Text', meaning: 'Tên hiển thị trên header', howTo: 'Nhập họ tên đầy đủ', required: 'Có' },
      { name: 'Vai trò', location: 'Bảng / Form', type: 'Dropdown', meaning: 'ADMIN: toàn quyền; NHAN_VIEN: không quản lý user', howTo: 'Chọn Admin hoặc Nhân viên', required: 'Có' },
      { name: 'Trạng thái / Hoạt động', location: 'Bảng / Form', type: 'Switch', meaning: 'Bật = được đăng nhập; Tắt = khóa tài khoản', howTo: 'Gạt công tắc Hoạt động', required: 'Có' },
      { name: 'Mật khẩu', location: 'Form thêm user', type: 'Password', meaning: 'Mật khẩu ban đầu', howTo: 'Nhập khi tạo mới', required: 'Có (khi thêm)' },
      { name: 'Mật khẩu mới', location: 'Form sửa user', type: 'Password', meaning: 'Đổi mật khẩu khi sửa', howTo: 'Để trống nếu không đổi', required: 'Không' },
      { name: 'Reset mật khẩu (🔑)', location: 'Cột Thao tác', type: 'Nút', meaning: 'Admin đặt mật khẩu mới cho user khác', howTo: 'Chỉ Admin; nhập mật khẩu mới ≥ 6 ký tự', required: '—' },
      { name: 'Sửa / Xóa', location: 'Cột Thao tác', type: 'Nút', meaning: 'Cập nhật hoặc xóa tài khoản', howTo: '✏️ sửa; 🗑️ xóa', required: '—' },
    ],
  },
  {
    sheet: '10. Đổi mật khẩu',
    title: 'Đổi mật khẩu cá nhân',
    description: 'Mọi user tự đổi mật khẩu qua menu góc phải. Sau khi đổi thành công cần đăng nhập lại.',
    image: '10-doi-mat-khau.png',
    imageWidth: 520,
    imageLegendItems: [
      { num: '1', area: 'Icon user header', detail: 'Góc phải header, cạnh "Xin chào: …". Bấm để mở menu: Đổi mật khẩu / Đăng xuất.' },
      { num: '2', area: 'Mật khẩu hiện tại', detail: 'Ô đầu tiên trong modal. Nhập mật khẩu đang dùng để xác nhận danh tính. Bắt buộc.' },
      { num: '3', area: 'Mật khẩu mới', detail: 'Mật khẩu thay thế. Tối thiểu 6 ký tự, phải khác mật khẩu cũ.' },
      { num: '4', area: 'Xác nhận mật khẩu mới', detail: 'Nhập lại mật khẩu mới — phải khớp với ô số 3.' },
      { num: '5', area: 'Nút Lưu / Hủy', detail: 'Lưu: đổi mật khẩu và đăng xuất tự động → đăng nhập lại. Hủy: đóng modal, không đổi.' },
    ],
    fields: [
      { name: 'Mật khẩu hiện tại', location: 'Modal', type: 'Password', meaning: 'Xác nhận danh tính trước khi đổi', howTo: 'Nhập mật khẩu đang dùng', required: 'Có' },
      { name: 'Mật khẩu mới', location: 'Modal', type: 'Password', meaning: 'Mật khẩu thay thế', howTo: 'Tối thiểu 6 ký tự; khác mật khẩu cũ', required: 'Có' },
      { name: 'Xác nhận mật khẩu mới', location: 'Modal', type: 'Password', meaning: 'Nhập lại mật khẩu mới để tránh sai', howTo: 'Phải khớp với Mật khẩu mới', required: 'Có' },
      { name: 'Lưu / Hủy', location: 'Modal', type: 'Nút', meaning: 'Xác nhận hoặc bỏ qua', howTo: 'Lưu → đăng xuất và login lại', required: '—' },
    ],
  },
];

function setColumns(ws) {
  ws.columns = [
    { width: 6 },
    { width: 32 },
    { width: 22 },
    { width: 12 },
    { width: 48 },
    { width: 42 },
    { width: 10 },
  ];
}

function writeLegendTable(ws, startRow, items, title = 'Chú thích số trên ảnh') {
  ws.mergeCells(`A${startRow}:G${startRow}`);
  ws.getCell(`A${startRow}`).value = title;
  ws.getCell(`A${startRow}`).font = { bold: true, size: 10 };

  const tableHeaderRow = startRow + 1;
  ws.getCell(`A${tableHeaderRow}`).value = 'Số';
  ws.getCell(`B${tableHeaderRow}`).value = 'Vùng trên ảnh';
  ws.mergeCells(`C${tableHeaderRow}:G${tableHeaderRow}`);
  ws.getCell(`C${tableHeaderRow}`).value = 'Mô tả chi tiết';
  ws.getRow(tableHeaderRow).eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = thinBorder();
  });
  ws.getRow(tableHeaderRow).height = 22;

  items.forEach((item, idx) => {
    const rowNum = tableHeaderRow + 1 + idx;
    ws.getCell(`A${rowNum}`).value = item.num;
    ws.getCell(`B${rowNum}`).value = item.area;
    ws.mergeCells(`C${rowNum}:G${rowNum}`);
    ws.getCell(`C${rowNum}`).value = item.detail;
    ws.getCell(`A${rowNum}`).alignment = { horizontal: 'center', vertical: 'top' };
    ws.getCell(`B${rowNum}`).alignment = { vertical: 'top', wrapText: true };
    ws.getCell(`C${rowNum}`).alignment = { vertical: 'top', wrapText: true };
    ws.getRow(rowNum).eachCell((cell) => {
      cell.border = thinBorder();
    });
    const textLen = (item.area?.length ?? 0) + (item.detail?.length ?? 0);
    ws.getRow(rowNum).height = Math.min(100, Math.max(28, 20 + Math.floor(textLen / 70) * 12));
  });

  return tableHeaderRow + items.length;
}

function writeFieldTable(ws, startRow, fields) {
  const headerRow = startRow;
  const headers = ['STT', 'Tên trường / Thành phần', 'Vị trí trên màn hình', 'Loại', 'Ý nghĩa', 'Cách nhập / Lưu ý', 'Bắt buộc'];

  ws.getRow(headerRow).values = headers;
  ws.getRow(headerRow).eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = thinBorder();
  });
  ws.getRow(headerRow).height = 22;

  fields.forEach((field, idx) => {
    const rowNum = headerRow + 1 + idx;
    ws.getRow(rowNum).values = [
      idx + 1,
      field.name,
      field.location,
      field.type,
      field.meaning,
      field.howTo,
      field.required,
    ];
    ws.getRow(rowNum).eachCell((cell, col) => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = thinBorder();
      if (col === 1) cell.alignment = { horizontal: 'center', vertical: 'top' };
    });
    ws.getRow(rowNum).height = estimateRowHeight(field);
  });

  return headerRow + fields.length;
}

function estimateRowHeight(field) {
  const textLen = (field.meaning?.length ?? 0) + (field.howTo?.length ?? 0);
  return Math.min(120, Math.max(28, 20 + Math.floor(textLen / 60) * 12));
}

function thinBorder() {
  return {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  };
}

function readPngSize(imagePath) {
  const buf = fs.readFileSync(imagePath);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

function fitImageSize(imgW, imgH, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / imgW, maxHeight / imgH, 1);
  return {
    width: Math.max(1, Math.round(imgW * scale)),
    height: Math.max(1, Math.round(imgH * scale)),
  };
}

function addScreenshot(workbook, ws, imageFile, startRow, maxDisplayWidth = 880) {
  const imagePath = path.join(IMAGES, imageFile);
  if (!fs.existsSync(imagePath)) {
    ws.getCell(`A${startRow}`).value = `(Chưa có ảnh: ${imageFile})`;
    return startRow + 2;
  }

  const { width: imgW, height: imgH } = readPngSize(imagePath);
  const maxHeight = Math.max(420, Math.round(maxDisplayWidth * 1.35));
  const { width: displayWidth, height: displayHeight } = fitImageSize(
    imgW,
    imgH,
    maxDisplayWidth,
    maxHeight,
  );

  const imageId = workbook.addImage({
    filename: imagePath,
    extension: 'png',
  });

  ws.addImage(imageId, {
    tl: { col: 0, row: startRow - 1 },
    ext: { width: displayWidth, height: displayHeight },
  });

  const rowsNeeded = Math.ceil(displayHeight / 18) + 2;
  for (let i = 0; i < rowsNeeded; i += 1) {
    ws.getRow(startRow + i).height = 18;
  }

  return startRow + rowsNeeded + 1;
}

async function buildSheet(workbook, module) {
  const ws = workbook.addWorksheet(module.sheet, {
    views: [{ state: 'frozen', ySplit: 0 }],
  });
  setColumns(ws);

  ws.mergeCells('A1:G1');
  ws.getCell('A1').value = module.title;
  ws.getCell('A1').font = TITLE_FONT;
  ws.getCell('A1').alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(1).height = 28;

  ws.mergeCells('A2:G2');
  ws.getCell('A2').value = module.description;
  ws.getCell('A2').font = SUB_FONT;
  ws.getCell('A2').alignment = { wrapText: true };
  ws.getRow(2).height = 36;

  let nextRow = 4;

  if (module.image) {
    if (module.imageLegendItems?.length) {
      nextRow = writeLegendTable(ws, nextRow, module.imageLegendItems);
      nextRow += 2;
    }

    ws.mergeCells(`A${nextRow}:G${nextRow}`);
    ws.getCell(`A${nextRow}`).value = 'Ảnh minh họa (chụp từ màn hình thật):';
    ws.getCell(`A${nextRow}`).font = { bold: true, size: 10 };
    nextRow += 1;
    nextRow = addScreenshot(workbook, ws, module.image, nextRow, module.imageWidth ?? 880);

    if (module.image2) {
      nextRow += 1;
      if (module.image2LegendItems?.length) {
        const legendTitle = module.image2Label ?? 'Chú thích số trên ảnh bổ sung';
        nextRow = writeLegendTable(ws, nextRow, module.image2LegendItems, legendTitle);
        nextRow += 1;
      } else {
        ws.mergeCells(`A${nextRow}:G${nextRow}`);
        ws.getCell(`A${nextRow}`).value = module.image2Label ?? 'Ảnh bổ sung:';
        ws.getCell(`A${nextRow}`).font = { bold: true, size: 10 };
        nextRow += 1;
      }
      nextRow = addScreenshot(workbook, ws, module.image2, nextRow, module.imageWidth ?? 880);
    }
    nextRow += 1;
  }

  ws.mergeCells(`A${nextRow}:G${nextRow}`);
  ws.getCell(`A${nextRow}`).value = 'Chi tiết các trường / thành phần:';
  ws.getCell(`A${nextRow}`).font = { bold: true, size: 10 };
  nextRow += 1;

  writeFieldTable(ws, nextRow, module.fields);

  return ws;
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'THUAN PHONG M&E';
  workbook.created = new Date();
  workbook.properties.date1904 = false;

  for (const module of MODULES) {
    await buildSheet(workbook, module);
  }

  try {
    await workbook.xlsx.writeFile(OUTPUT);
    console.log(`Đã tạo: ${OUTPUT}`);
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'EBUSY') {
      await workbook.xlsx.writeFile(OUTPUT_FALLBACK);
      console.log(`File gốc đang mở — đã ghi: ${OUTPUT_FALLBACK}`);
    } else {
      throw err;
    }
  }
  console.log(`Số sheet: ${MODULES.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
