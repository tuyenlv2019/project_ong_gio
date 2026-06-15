using Microsoft.EntityFrameworkCore;
using OngGio.Application.Abstractions;
using OngGio.Domain.Common;
using OngGio.Domain.Entities;

namespace OngGio.Infrastructure.Persistence;

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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NhomSanPham>(e =>
        {
            e.ToTable("nhom_san_pham");
            e.HasKey(x => x.Id);
            e.Property(x => x.TenNhom).HasMaxLength(200).IsRequired();
            e.Property(x => x.HinhAnhMinhHoa);
        });

        modelBuilder.Entity<ThamSoCoDinh>(e =>
        {
            e.ToTable("tham_so_co_dinh");
            e.HasKey(x => x.Id);
            e.Property(x => x.TenThamSo).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.NhomSanPham).WithMany(x => x.ThamSoCoDinhs).HasForeignKey(x => x.NhomSanPhamId);
        });

        modelBuilder.Entity<LoaiTon>(e =>
        {
            e.ToTable("loai_ton");
            e.HasKey(x => x.Id);
            e.Property(x => x.ThuongHieu).HasMaxLength(200).IsRequired();
            e.Property(x => x.BangBaremJson).HasColumnName("bang_barem").HasColumnType("jsonb");
        });

        modelBuilder.Entity<BaoGia>(e =>
        {
            e.ToTable("bao_gia");
            e.HasKey(x => x.Id);
            e.Property(x => x.MaBaoGia).HasMaxLength(50).IsRequired();
            e.Property(x => x.TenKhachHang).HasMaxLength(300).IsRequired();
            e.Property(x => x.TrangThai).HasMaxLength(50).HasDefaultValue("DANG_XU_LY");
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
            }

            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedBy = currentUserId;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
