# Backend — Ong Gio

ASP.NET Core 8: API REST, tính giá theo công thức DB (NCalc), PostgreSQL, JWT.  
Frontend React nằm tại `frontend/ong-gio-web/`; test nằm tại `tests/`.

> Ký hiệu trong cây: `#` hoặc `—` phía sau tên file là mô tả chức năng.

---

## Cấu trúc `src/` (cây nhị phân)

```
src/
├── OngGio.slnx                          # Solution Visual Studio — gom 4 project backend
├── README.md                            # Tài liệu cấu trúc & luồng xử lý (file này)
│
├── OngGio.Api/                          # Tầng HTTP: controller, cấu hình, static file
│   ├── Program.cs                       # Entry point: DI Application+Infrastructure, JWT,
│   │                                    #   policy AdminOnly, CORS, Swagger (dev), static files,
│   │                                    #   seed DB lúc startup, SPA fallback (production)
│   ├── AuthClaims.cs                    # Helper đọc claim `vaiTro`, kiểm tra ADMIN cho policy
│   ├── OngGio.Api.csproj                # Project web host, reference Application+Infrastructure
│   ├── OngGio.Api.http                  # File gọi thử API trong IDE (REST Client)
│   ├── appsettings.json                 # Connection string PostgreSQL, JwtSettings, logging
│   ├── appsettings.Development.json     # Override cấu hình môi trường dev
│   ├── Controllers/
│   │   ├── AuthController.cs            # GET captcha (ảnh base64 + captchaId);
│   │   │                                #   POST login (user/pass/captcha) → JWT + thông tin user
│   │   ├── BaoGiaController.cs          # CRUD báo giá `/api/bao-gia`;
│   │   │                                #   GET line-history (F4 chọn dòng cũ);
│   │   │                                #   PATCH trạng thái; GET export-excel (file .xlsx)
│   │   ├── CalculationController.cs     # POST `/api/calculation/preview` — tính thử 1 dòng
│   │   │                                #   (diện tích, khối lượng, đơn giá) không lưu DB
│   │   ├── DashboardController.cs       # GET `/api/dashboard` — thống kê tổng quan
│   │   │                                #   (số đơn, doanh thu, SP, loại tôn, user…)
│   │   ├── HealthController.cs          # GET healthcheck đơn giản — kiểm tra API còn sống
│   │   ├── LoaiTonController.cs         # CRUD loại tôn: thương hiệu, độ dày,
│   │   │                                #   đơn giá/mét tới, kg/mét tới
│   │   └── NhomSanPhamController.cs     # CRUD nhóm sản phẩm + tham số cố định;
│   │                                    #   upload ảnh minh họa; lưu CongThucDienTich
│   ├── Properties/
│   │   └── launchSettings.json          # Profile chạy local (URL, port, biến môi trường)
│   └── wwwroot/
│       └── images/                      # Ảnh tĩnh phục vụ API + SPA production
│           ├── *.png                    # Ảnh minh họa master SP (co90, ong-thang, giam…)
│           └── uploads/                 # Ảnh user upload từ màn Sản phẩm (tên file GUID)
│
├── OngGio.Application/                  # Logic thuần: engine tính toán, interface — không EF
│   ├── DependencyInjection.cs           # Đăng ký scoped `ICalculationEngine` → `CalculationEngine`
│   ├── OngGio.Application.csproj
│   ├── Abstractions/
│   │   ├── IAuthService.cs              # Hợp đồng đăng nhập: validate user, trả JWT payload
│   │   ├── ICaptchaService.cs           # Hợp đồng tạo/xác thực captcha một lần (cache)
│   │   └── ICurrentUserService.cs       # Hợp đồng lấy username hiện tại cho audit field
│   ├── Calculation/
│   │   ├── CalculationEngine.cs         # Engine chính: đọc `CongThucDienTich` từ nhóm SP,
│   │   │                                #   gọi DbFormulaEvaluator → ∑Ssx (m²);
│   │   │                                #   quy đổi mét tới (÷1.2), tính kg, tiền tôn,
│   │   │                                #   đơn giá = giá tôn/mét tới × mét tới + NC + PK,
│   │   │                                #   thành tiền = đơn giá × SL
│   │   ├── CalculationModels.cs         # `CalculationRequest` (input 1 dòng) và
│   │   │                                #   `CalculationResult` (output engine)
│   │   ├── DbFormulaEvaluator.cs        # Parse & eval chuỗi công thức NCalc nhiều dòng;
│   │   │                                #   hỗ trợ gán biến (W, H, L, r…), kết quả biến `Ssx`
│   │   └── StandardProductFormulas.cs   # Chuỗi công thức mẫu theo từng loại SP
│   │                                    #   (dùng seed DB + unit test so khớp SRS)
│   └── Services/
│       ├── DashboardStats.cs            # Record DTO thống kê dashboard trả về API
│       └── IBaoGiaService.cs            # Hợp đồng báo giá: preview, CRUD, export Excel,
│                                        #   đổi trạng thái, tìm lịch sử dòng;
│                                        #   kèm DTO `CreateBaoGiaRequest`, `BaoGiaLineHistoryDto`
│
├── OngGio.Domain/                       # Entity & kiểu dùng chung — không logic nghiệp vụ
│   ├── OngGio.Domain.csproj
│   ├── Common/
│   │   └── AuditableEntity.cs           # Base class: CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
│   └── Entities/
│       ├── BaoGia.cs                    # Header báo giá: MaBaoGia, TenKhachHang, NgayTao,
│       │                                #   ThueSuat (header), tổng tiền, TrangThai, chi tiết con
│       ├── ChiTietBaoGia.cs             # 1 dòng SP trong đơn: kích thước W/H, thamSoNhap JSON,
│       │                                #   kết quả tính (diện tích, kg, đơn giá, thành tiền),
│       │                                #   FK nhóm SP & loại tôn
│       ├── LoaiTon.cs                   # Master loại tôn: ThuongHieu, DoDay, DonGiaMetToi,
│       │                                #   KgMoiMetToi
│       ├── NguoiDung.cs                 # User nội bộ: TenDangNhap, HoTen, hash mật khẩu, VaiTro
│       ├── NhomSanPham.cs               # Loại/nhóm SP: TenNhom, HinhAnhMinhHoa,
│       │                                #   CongThucDienTich (công thức ∑Ssx), ThamSoCoDinhs
│       └── ThamSoCoDinh.cs              # Tham số form theo nhóm SP: TenThamSo, GiaTriSo, ThuTu
│
└── OngGio.Infrastructure/               # Triển khai: EF Core, service, seed, export Excel
    ├── DependencyInjection.cs           # Đăng ký DbContext, Auth, Captcha, BaoGia, Dashboard;
    │                                    #   `SeedDataAsync`: migrate, seed nhóm SP+công thức,
    │                                    #   loại tôn, admin; không ghi đè công thức đã có
    ├── OrderStatusNormalizer.cs         # Chuẩn hóa mã trạng thái đơn → CHUA_XU_LY |
    │                                    #   DANG_XU_LY | HOAN_THANH (mã lạ → CHUA_XU_LY)
    ├── PostgresConnectionStringNormalizer.cs  # Chuẩn hóa connection string PostgreSQL
    ├── OngGio.Infrastructure.csproj
    ├── Migrations/                      # Lịch sử schema EF Core (PostgreSQL)
    │   ├── 20260614132405_InitialCreate.cs           # Bảng gốc: báo giá, chi tiết, SP, tôn
    │   ├── 20260614134946_AddManagementFeatures.cs   # Quản lý user, audit, trạng thái đơn
    │   ├── 20260615143000_AddLineInputParameters.cs  # Cột thamSoNhapJson trên chi tiết
    │   ├── 20260615150000_AddLineProductName.cs      # tenSanPham trên chi tiết
    │   ├── 20260615163000_AddLineUnitAndTax.cs       # donViTinh, thueSuat theo dòng
    │   ├── 20260616100000_AddMaterialKgPerRunningMeter.cs  # KgMoiMetToi trên loại tôn
    │   ├── 20260616110000_RemoveLoaiTonBangBaremJson.cs    # Xóa barem JSON loại tôn
    │   ├── 20260618120000_AddCongThucDienTichToNhomSanPham.cs  # Cột công thức trên nhóm SP
    │   ├── 20260618140000_AddThuTuToThamSoCoDinh.cs  # Thứ tự hiển thị tham số form
    │   ├── 20260618150000_AddGhiChuToChiTietBaoGia.cs  # Ghi chú từng dòng đơn
    │   ├── 20260618160000_AddUniqueIndexToMaBaoGia.cs  # Unique index MaBaoGia
    │   ├── 20260618170000_RenameDonGiaM2ToDonGiaMetToi.cs  # Đổi đơn giá m² → mét tới
    │   └── OngGioDbContextModelSnapshot.cs           # Snapshot schema hiện tại cho migration mới
    ├── Persistence/
    │   └── OngGioDbContext.cs           # DbContext EF: map entity, quan hệ FK, audit tự động
    │                                    #   trong SaveChangesAsync
    ├── Security/
    │   └── PasswordHasher.cs            # Hash/verify mật khẩu (SHA-256)
    ├── Seed/
    │   └── SampleBaoGiaSeeder.cs        # Tạo 1 đơn mẫu demo sau seed (nếu chưa có)
    ├── Services/
    │   ├── AuthService.cs               # Xác thực login, kiểm tra active, sinh JWT
    │   ├── BaoGiaService.cs             # Nghiệp vụ báo giá: preview, tạo/sửa/xóa đơn,
    │   │                                #   validate kích thước theo tham số DB, gọi engine,
    │   │                                #   tổng hợp tiền + thuế theo dòng, sinh MaBaoGia,
    │   │                                #   tìm line-history, gọi export Excel
    │   ├── BaoGiaExcelExporter.cs       # Xuất .xlsx từ template Sheet 2 → đổi tên sheet
    │   │                                #   "Báo giá"; ghi dòng SP, tổng cộng, footer mẫu
    │   ├── CaptchaService.cs            # Sinh captcha PNG base64, cache đáp án, validate 1 lần
    │   ├── CurrentUserService.cs        # Đọc claim JWT → username audit (fallback `system`)
    │   └── DashboardService.cs          # Aggregate COUNT/SUM từ DB cho dashboard
    └── Templates/
        └── BaoGiaExportTemplate.xlsx    # File mẫu Excel (sheet nguồn `Sheet 2`, header dòng 1–4)
```

### `NguoiDungController` (cùng file `DashboardController.cs`)

```
DashboardController.cs (tiếp)
└── NguoiDungController              # Route `/api/nguoi-dung`, [Authorize AdminOnly]
    ├── GET/POST/PUT/DELETE user   # CRUD người dùng nội bộ
    └── POST reset-password        # Admin reset mật khẩu user
```

---

## Cấu trúc `tests/` (cây nhị phân)

```
tests/
├── OngGio.Application.Tests/
│   ├── OngGio.Application.Tests.csproj    # xUnit, reference OngGio.Application
│   ├── CalculationEngineTests.cs          # Test engine end-to-end: công thức DB theo tên SP,
│   │                                    #   đơn giá không phụ thuộc SL, quy đổi mét tới,
│   │                                    #   lỗi khi thiếu công thức
│   └── DbFormulaEvaluatorTests.cs       # Test từng công thức StandardProductFormulas
│                                        #   so khớp giá trị SRS (Co90, Giam, TeRe…)
└── OngGio.Infrastructure.Tests/
    ├── OngGio.Infrastructure.Tests.csproj   # xUnit, InternalsVisibleTo → exporter
    └── BaoGiaExcelExporterTests.cs        # Test xuất Excel: có bytes, đúng tên sheet,
                                             #   ghi dòng dữ liệu, đơn rỗng vẫn hợp lệ
```

---

## Cấu trúc `frontend/ong-gio-web/src/` (cây nhị phân)

```
frontend/ong-gio-web/src/
├── main.tsx                             # Mount React, import `index.css`, render `<App />`
├── App.tsx                              # React Router: /login, layout bảo vệ, các route trang
├── App.css                              # CSS template Vite (hiện không import — legacy)
├── index.css                            # Global style: bảng đơn hàng, sidebar, màu dòng…
├── api.ts                               # Axios client + JWT interceptor; hàm gọi API:
│                                        #   dashboard, master data, báo giá, preview, user;
│                                        #   formatMoney, TRANG_THAI_DON
├── authService.ts                       # Login/logout, lưu token+user localStorage,
│                                        #   isAdmin, đổi mật khẩu
├── types.ts                             # TypeScript interfaces + `API_BASE` URL
├── assets/                              # Ảnh/svg template Vite (hero, logo)
├── components/
│   ├── order/
│   │   └── OrderLineCells.tsx           # Cell tách re-render form đơn: dropdown loại SP,
│   │                                    #   ô kích thước, preview tôn/diện tích/giá, footer tổng
│   ├── AdminRoute.tsx                   # Chặn route chỉ ADMIN
│   ├── ChangePasswordModal.tsx          # Modal đổi mật khẩu user đang login
│   ├── EllipsisText.tsx                 # Text rút gọn + tooltip khi tràn
│   ├── FormulaDisplay.tsx               # Hiển thị công thức ∑Ssx nhiều dòng (panel form đơn)
│   ├── HintInput.tsx                    # Input Ant Design + tooltip khi hover/tràn chữ
│   ├── HintInputNumber.tsx              # InputNumber + tooltip (ô số tiền, kích thước)
│   ├── HintSelect.tsx                   # Select + tooltip + ellipsis option
│   ├── LineHistoryPickerModal.tsx       # Modal F4: tìm & chọn dòng từ đơn cũ
│   ├── ProductImageField.tsx            # Upload/chọn ảnh minh họa SP (màn Sản phẩm)
│   ├── ProtectedRoute.tsx               # Redirect /login nếu chưa có token
│   └── TableSearchBar.tsx               # Ô tìm kiếm lọc client-side trên bảng
├── hooks/
│   └── useOpenCreateFromNavigation.ts   # Mở modal tạo mới khi navigate có state.openCreate
├── layouts/
│   ├── MainLayout.tsx                   # Sidebar cố định + thu gọn, header, menu, đổi MK, logout
│   └── MainLayout.css                   # Style sidebar fixed, collapse, offset nội dung
├── pages/
│   ├── DashboardPage.tsx                # Thống kê tổng quan + nút tạo nhanh; xử lý lỗi API
│   ├── LoginPage.tsx                    # Form login + captcha
│   ├── LoginPage.css                    # Style trang đăng nhập
│   ├── MaterialsPage.tsx                # CRUD loại tôn (nguyên liệu)
│   ├── OrderFormPage.tsx                # Form tạo/sửa/sao chép đơn: bảng nhiều dòng,
│   │                                    #   preview debounce, validation, di chuyển/xóa dòng
│   ├── OrdersPage.tsx                   # Danh sách đơn: sửa, sao chép, xuất Excel (confirm),
│   │                                    #   đổi trạng thái, xóa
│   ├── ProductsPage.tsx                 # CRUD nhóm SP + tham số + công thức + ảnh
│   └── UsersPage.tsx                    # CRUD user (admin), reset mật khẩu
└── utils/
    ├── apiError.ts                      # Trích message lỗi từ Axios response
    ├── apiError.test.ts                 # Unit test apiError
    ├── auditDisplay.tsx                 # Cột audit bảng (ngày tạo/sửa, user) + format
    ├── baoGiaFormMapper.ts              # Map entity báo giá ↔ form; parseThamSoNhapJson;
    │                                    #   quy đổi tiền tôn/1 cái ↔ tổng
    ├── baoGiaFormMapper.test.ts         # Test parse JSON tham số an toàn
    ├── imageUrl.ts                      # Ghép URL ảnh master từ path API
    ├── orderFormLineRemap.ts            # Remap index preview/manual-ton khi move/xóa dòng
    ├── orderFormLineRemap.test.ts       # Test remap sau move/remove
    ├── orderFormPreview.ts              # Debounce preview: field nào gọi API, chữ ký cache
    ├── orderFormPreview.test.ts         # Test logic refresh preview
    ├── orderFormPricing.ts              # Tính đơn giá/thành tiền/tổng thuế client-side
    ├── orderFormPricing.test.ts         # Test công thức giá frontend
    ├── productFormParams.ts             # Sắp xếp tham số SP, map W/H, phát hiện trùng tên
    ├── tableCellRender.tsx                # renderEllipsisCell cho cột bảng
    ├── tableColumns.ts                  # Helper cột STT
    └── tableSearch.ts                   # Lọc bảng theo chuỗi tìm kiếm
```

---

## Tầng kiến trúc

| Project | Trách nhiệm |
|---------|-------------|
| `OngGio.Api` | HTTP, JWT, Swagger, CORS, static files, map controller |
| `OngGio.Application` | `CalculationEngine`, `DbFormulaEvaluator`, interface service/DTO |
| `OngGio.Domain` | Entity EF Core, `AuditableEntity` |
| `OngGio.Infrastructure` | DbContext, migration, `BaoGiaService`, seed, export Excel |

## Luồng xử lý chính

```
Login → JWT
  → Form đơn: POST /api/calculation/preview (từng dòng, debounce)
  → Lưu đơn: POST/PUT /api/bao-gia
      → BaoGiaService → CalculationEngine → DbFormulaEvaluator(CongThucDienTich)
      → Lưu ChiTietBaoGia + tổng tiền
  → Xuất Excel: GET /api/bao-gia/{id}/export-excel → BaoGiaExcelExporter
```

## Công thức giá (thống nhất FE/BE)

- **Giá tôn** = tiền tôn cho 1 cái (có thể nhập tay trên form)
- **Đơn giá** = `DonGiaMetToi` × ∑Ssx mét tới + nhân công + phụ kiện
- **Thành tiền** = đơn giá × số lượng
- **∑Ssx mét tới** = ∑Ssx (m²) ÷ 1.2

## Chạy test

```bash
dotnet test tests/OngGio.Application.Tests
dotnet test tests/OngGio.Infrastructure.Tests

cd frontend/ong-gio-web
npm run test:run
```
