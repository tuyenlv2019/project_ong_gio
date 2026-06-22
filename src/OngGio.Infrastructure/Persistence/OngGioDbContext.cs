using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using OngGio.Application.Abstractions;
using OngGio.Domain.Common;
using OngGio.Domain.Entities;

namespace OngGio.Infrastructure.Persistence;

/// <summary>
/// DbContext PostgreSQL và cấu hình mapping cho toàn bộ entity.
/// </summary>
public class OngGioDbContext : DbContext
{
    private readonly ICurrentUserService _currentUserService;

    public OngGioDbContext(DbContextOptions<OngGioDbContext> options, ICurrentUserService currentUserService)
        : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<NhomSanPham> NhomSanPhams => Set<NhomSanPham>();
    public DbSet<ThamSoCoDinh> ThamSoCoDinhs => Set<ThamSoCoDinh>();
    public DbSet<LoaiTon> LoaiTons => Set<LoaiTon>();
    public DbSet<BaoGia> BaoGias => Set<BaoGia>();
    public DbSet<ChiTietBaoGia> ChiTietBaoGias => Set<ChiTietBaoGia>();
    public DbSet<NguoiDung> NguoiDungs => Set<NguoiDung>();

    /// <summary>
    /// Cấu hình bảng, khóa, quan hệ và kiểu dữ liệu của từng entity.
    /// </summary>
    /// <param name="modelBuilder">Model builder của EF Core.</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NhomSanPham>(e =>
        {
            e.ToTable("nhom_san_pham");
            e.HasKey(x => x.Id);
            e.Property(x => x.TenNhom).HasMaxLength(200).IsRequired();
            e.Property(x => x.HinhAnhMinhHoa);
            e.Property(x => x.CongThucDienTich);
        });

        modelBuilder.Entity<ThamSoCoDinh>(e =>
        {
            e.ToTable("tham_so_co_dinh");
            e.HasKey(x => x.Id);
            e.Property(x => x.TenThamSo).HasMaxLength(50).IsRequired();
            e.Property(x => x.ThuTu).HasDefaultValue(0);
            e.HasOne(x => x.NhomSanPham).WithMany(x => x.ThamSoCoDinhs).HasForeignKey(x => x.NhomSanPhamId);
        });

        modelBuilder.Entity<LoaiTon>(e =>
        {
            e.ToTable("loai_ton");
            e.HasKey(x => x.Id);
            e.Property(x => x.ThuongHieu).HasMaxLength(200).IsRequired();
            e.Property(x => x.KgMoiMetToi).HasDefaultValue(4.5m);
        });

        modelBuilder.Entity<BaoGia>(e =>
        {
            e.ToTable("bao_gia");
            e.HasKey(x => x.Id);
            e.Property(x => x.MaBaoGia).HasMaxLength(50).IsRequired();
            e.Property(x => x.TenKhachHang).HasMaxLength(300).IsRequired();
            e.Property(x => x.TrangThai).HasMaxLength(50).HasDefaultValue("CHUA_XU_LY");
        });

        modelBuilder.Entity<NguoiDung>(e =>
        {
            e.ToTable("nguoi_dung");
            e.HasKey(x => x.Id);
            e.Property(x => x.TenDangNhap).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.TenDangNhap).IsUnique();
            e.Property(x => x.HoTen).HasMaxLength(200).IsRequired();
            e.Property(x => x.MatKhauHash).HasMaxLength(256).IsRequired();
            e.Property(x => x.VaiTro).HasMaxLength(50);
        });

        modelBuilder.Entity<ChiTietBaoGia>(e =>
        {
            e.ToTable("chi_tiet_bao_gia");
            e.HasKey(x => x.Id);
            e.Property(x => x.TenSanPham).HasMaxLength(300);
            e.Property(x => x.GhiChu).HasMaxLength(1000);
            e.Property(x => x.DonViTinh).HasMaxLength(50).HasDefaultValue("cai");
            e.Property(x => x.ThamSoNhapJson).HasColumnName("tham_so_nhap").HasColumnType("jsonb");
            e.Property(x => x.TrangThaiCongThuc).HasMaxLength(50);
            e.HasOne(x => x.BaoGia).WithMany(x => x.ChiTietBaoGias).HasForeignKey(x => x.BaoGiaId);
            e.HasOne(x => x.NhomSanPham).WithMany(x => x.ChiTietBaoGias).HasForeignKey(x => x.NhomSanPhamId);
            e.HasOne(x => x.LoaiTon).WithMany(x => x.ChiTietBaoGias).HasForeignKey(x => x.LoaiTonId);
        });

        ConfigureAuditing<NhomSanPham>(modelBuilder);
        ConfigureAuditing<ThamSoCoDinh>(modelBuilder);
        ConfigureAuditing<LoaiTon>(modelBuilder);
        ConfigureAuditing<BaoGia>(modelBuilder);
        ConfigureAuditing<ChiTietBaoGia>(modelBuilder);
        ConfigureAuditing<NguoiDung>(modelBuilder);
    }

    private static void ConfigureAuditing<T>(ModelBuilder modelBuilder) where T : AuditableEntity
    {
        modelBuilder.Entity<T>(e =>
        {
            e.Property(x => x.CreatedBy).HasColumnName("created_by").HasMaxLength(100);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by").HasMaxLength(100);
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });
    }

    /// <summary>
    /// Tự động gắn thông tin audit trước khi lưu dữ liệu xuống database.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token của request.</param>
    /// <returns>Số bản ghi thay đổi.</returns>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var currentUserId = _currentUserService.GetCurrentUserId();
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.CreatedBy = currentUserId;
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedBy = currentUserId;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedBy = currentUserId;
            }
        }

        TouchBaoGiaWhenLinesChanged(currentUserId, now);

        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Khi chỉ thay đổi dòng chi tiết, header báo giá có thể vẫn Unchanged — vẫn phải cập nhật audit.
    /// </summary>
    private void TouchBaoGiaWhenLinesChanged(string currentUserId, DateTime now)
    {
        foreach (var lineEntry in ChangeTracker.Entries<ChiTietBaoGia>())
        {
            if (lineEntry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
                continue;

            var parentEntry = lineEntry.Reference(x => x.BaoGia).TargetEntry;
            EntityEntry<BaoGia>? baoGiaEntry = parentEntry?.Entity is BaoGia
                ? (EntityEntry<BaoGia>)parentEntry
                : null;
            if (baoGiaEntry is null && lineEntry.Entity.BaoGiaId > 0)
            {
                baoGiaEntry = ChangeTracker.Entries<BaoGia>()
                    .FirstOrDefault(e => e.Entity.Id == lineEntry.Entity.BaoGiaId);
            }

            if (baoGiaEntry is null)
                continue;

            baoGiaEntry.Entity.UpdatedAt = now;
            baoGiaEntry.Entity.UpdatedBy = currentUserId;
            if (baoGiaEntry.State == EntityState.Unchanged)
                baoGiaEntry.State = EntityState.Modified;
        }
    }
}
