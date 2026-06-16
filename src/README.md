# Backend Summary

This folder contains the ASP.NET Core backend for the Ong Gio system.

## Solution Structure

- `OngGio.Api`
  - HTTP API layer
  - Authentication setup
  - Swagger
  - CORS
  - Startup seeding
- `OngGio.Application`
  - Calculation engine
  - Formula implementations
  - Service abstractions
- `OngGio.Domain`
  - Entities and shared domain types
- `OngGio.Infrastructure`
  - EF Core database context
  - PostgreSQL integration
  - Authentication and captcha services
  - Business services
  - Seed data

## Backend Responsibilities

### Authentication

- Provides captcha generation and validation
- Validates username and password
- Issues JWT tokens for authenticated users

### Dashboard

- Aggregates counts and revenue-related statistics
- Supplies summary data for the admin dashboard

### Quotation and Order Management

- Creates, updates, deletes, and lists quotations
- Updates quotation status
- Exports quotation details to Excel

### Calculation Engine

- Computes area, weight, pricing, and final totals
- Uses formula-based handlers for different product shapes

### Master Data Management

- Manages product groups
- Manages material types
- Manages users

## Key Files

- Startup and middleware: `OngGio.Api/Program.cs`
- Auth endpoints: `OngGio.Api/Controllers/AuthController.cs`
- Dashboard endpoints: `OngGio.Api/Controllers/DashboardController.cs`
- Quotation endpoints: `OngGio.Api/Controllers/BaoGiaController.cs`
- Calculation endpoints: `OngGio.Api/Controllers/CalculationController.cs`
- Product group endpoints: `OngGio.Api/Controllers/NhomSanPhamController.cs`
- Material endpoints: `OngGio.Api/Controllers/LoaiTonController.cs`
- User management: `OngGio.Api/Controllers/NguoiDungController.cs`

## Data Initialization

On startup, the infrastructure layer:

- Applies EF Core migrations
- Seeds product groups and their parameters
- Seeds material records
- Seeds a default admin user

## Chi Tiết Theo File

### `OngGio.Api`

- `Program.cs`: file khởi động của API. Đăng ký Application/Infrastructure, cấu hình JWT, bật Swagger, bật CORS cho frontend, map controllers và chạy seed dữ liệu.
- `Controllers/AuthController.cs`: xử lý lấy captcha và đăng nhập. Kiểm tra tên đăng nhập, mật khẩu, captcha trước khi trả JWT và thông tin user.
- `Controllers/BaoGiaController.cs`: quản lý báo giá/đơn hàng. Hỗ trợ lấy danh sách, xem chi tiết, tạo mới, cập nhật, đổi trạng thái, xóa và export Excel.
- `Controllers/CalculationController.cs`: cung cấp endpoint preview công thức để frontend xem trước kết quả tính toán.
- `Controllers/DashboardController.cs`: trả thống kê dashboard từ service.
- `Controllers/HealthController.cs`: endpoint healthcheck đơn giản để kiểm tra service còn sống.
- `Controllers/LoaiTonController.cs`: CRUD dữ liệu loại tôn, gồm thương hiệu, độ dày, đơn giá, kg/mét tới và bảng barem JSON.
- `Controllers/NhomSanPhamController.cs`: CRUD nhóm sản phẩm và danh sách tham số cố định đi kèm từng nhóm.
- `OngGio.Api.http`: file gọi thử API trong IDE.
- `appsettings.json` và `appsettings.Development.json`: cấu hình connection string, JWT, logging và các setting môi trường.
- `Properties/launchSettings.json`: profile chạy local cho API.

### `OngGio.Application`

- `DependencyInjection.cs`: đăng ký các công thức tính diện tích và `ICalculationEngine`.
- `Abstractions/IAuthService.cs`: hợp đồng cho dịch vụ đăng nhập.
- `Abstractions/ICaptchaService.cs`: hợp đồng tạo và xác thực captcha.
- `Abstractions/ICurrentUserService.cs`: hợp đồng lấy user hiện tại phục vụ audit.
- `Calculation/CalculationEngine.cs`: trung tâm tính toán. Chọn công thức theo nhóm sản phẩm, hợp nhất tham số mặc định và tham số nhập tay, rồi tính diện tích, trọng lượng, đơn giá và thành tiền.
- `Calculation/CalculationModels.cs`: model đầu vào/đầu ra cho tính toán.
- `Calculation/Formulas/AreaFormulaHelper.cs`: helper dùng chung cho các công thức diện tích.
- `Calculation/Formulas/Co90AreaFormula.cs`: công thức cho co 90 độ.
- `Calculation/Formulas/Co45AreaFormula.cs`: công thức cho co 45 độ.
- `Calculation/Formulas/OngThangAreaFormula.cs`: công thức cho ống thẳng.
- `Calculation/Formulas/OngBitDauAreaFormula.cs`: công thức cho ống bít một đầu.
- `Calculation/Formulas/TeCutAreaFormula.cs`: công thức cho tê cút.
- `Calculation/Formulas/TeReAreaFormula.cs`: công thức cho tê rẽ.
- `Calculation/Formulas/GiamAreaFormula.cs`: công thức cho giảm/côn thu.
- `Calculation/Formulas/ChanReAreaFormula.cs`: công thức cho chân rẽ.
- `Calculation/Formulas/BzAreaFormula.cs`: công thức cho BZ/ống lệch tâm.
- `Calculation/Formulas/HopPlenumAreaFormula.cs`: công thức cho hộp plenum.
- `Calculation/Formulas/ChacAreaFormula.cs`: công thức cho dạng chắc.
- `Calculation/Formulas/IAreaFormula.cs`: interface chuẩn cho các công thức diện tích.
- `Services/DashboardStats.cs`: record chứa dữ liệu thống kê dashboard.
- `Services/IBaoGiaService.cs`: hợp đồng thao tác báo giá, preview, export và cập nhật trạng thái.

### `OngGio.Domain`

- `Common/AuditableEntity.cs`: lớp nền cho audit field như `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`.
- `Entities/BaoGia.cs`: entity báo giá, chứa mã báo giá, khách hàng, thuế suất, tổng tiền và trạng thái.
- `Entities/ChiTietBaoGia.cs`: entity chi tiết báo giá, lưu thông tin sản phẩm, kích thước, tham số nhập, kết quả tính toán và quan hệ sang nhóm sản phẩm/loại tôn.
- `Entities/LoaiTon.cs`: entity loại tôn, lưu thương hiệu, độ dày, giá/m2, kg/mét tới và barem JSON.
- `Entities/NguoiDung.cs`: entity người dùng, lưu tên đăng nhập, họ tên, hash mật khẩu, vai trò và trạng thái hoạt động.
- `Entities/NhomSanPham.cs`: entity nhóm sản phẩm, chứa tên nhóm, ảnh minh họa và các tham số cố định.
- `Entities/ThamSoCoDinh.cs`: entity tham số cố định của nhóm sản phẩm.

### `OngGio.Infrastructure`

- `DependencyInjection.cs`: đăng ký DbContext, memory cache, captcha, current user, báo giá, dashboard, auth service và seed dữ liệu ban đầu.
- `Persistence/OngGioDbContext.cs`: cấu hình bảng, khóa chính, quan hệ, kiểu dữ liệu, audit columns và logic tự động set audit khi `SaveChangesAsync`.
- `Security/PasswordHasher.cs`: hash và verify mật khẩu.
- `Services/AuthService.cs`: xác thực user bằng tên đăng nhập + mật khẩu, kiểm tra trạng thái hoạt động và sinh JWT.
- `Services/BaoGiaService.cs`: service nghiệp vụ chính của báo giá. Tạo/cập nhật/xóa báo giá, tính preview từng dòng, tổng hợp tổng tiền, export Excel, và load dữ liệu tính toán từ database.
- `Services/CaptchaService.cs`: tạo captcha ngẫu nhiên, render ảnh PNG base64, cache đáp án tạm thời và xác thực captcha một lần.
- `Services/CurrentUserService.cs`: cung cấp user hiện tại cho audit. Hiện đang trả về giá trị mặc định `system`.
- `Services/DashboardService.cs`: lấy số liệu dashboard từ database.
- `Migrations/*.cs`: lịch sử thay đổi schema của PostgreSQL. Bao gồm khởi tạo bảng, thêm tính năng quản lý, thêm tham số đầu vào cho dòng, thêm tên sản phẩm, thêm đơn vị tính/thuế, và thêm `kg/mét tới` cho loại tôn.
- `Migrations/OngGioDbContextModelSnapshot.cs`: snapshot EF Core dùng để so sánh schema hiện tại khi tạo migration mới.

## Ghi Chú Luồng Xử Lý

- Frontend gọi `AuthController` để lấy captcha và đăng nhập.
- Sau khi có JWT, các màn hình quản trị gọi `BaoGiaController`, `LoaiTonController`, `NhomSanPhamController`, `NguoiDungController` và `DashboardController`.
- `BaoGiaService` là nơi gom logic quan trọng nhất: lấy dữ liệu gốc, chạy công thức, tính tổng tiền, và sinh file Excel.
