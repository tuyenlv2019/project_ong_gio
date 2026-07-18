using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace OngGio.Api.Tests;

public class BaoGiaApiTests : IClassFixture<OngGioWebApplicationFactory>
{
    private readonly OngGioWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public BaoGiaApiTests(OngGioWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        factory.SeedAsync().GetAwaiter().GetResult();
    }

    [Fact]
    public async Task CreateAndGetBaoGia_WithAuth_Works()
    {
        await AuthorizeAsAdminAsync();

        var nhoms = await _client.GetFromJsonAsync<JsonElement>("/api/nhom-san-pham");
        var loaiTons = await _client.GetFromJsonAsync<JsonElement>("/api/loai-ton");

        var nhomId = nhoms.EnumerateArray().First().GetProperty("id").GetInt32();
        var loaiTonId = loaiTons.EnumerateArray().First().GetProperty("id").GetInt32();

        var createResponse = await _client.PostAsJsonAsync("/api/bao-gia", new
        {
            tenKhachHang = "Khách integration test",
            thueSuat = 0.08m,
            trangThai = "CHUA_XU_LY",
            lines = new[]
            {
                new
                {
                    nhomSanPhamId = nhomId,
                    loaiTonId,
                    w = 400m,
                    h = 300m,
                    soLuong = 1,
                    giaNhanCong = 10000m,
                    phuKien = 0m,
                    thamSoNhap = new Dictionary<string, decimal>
                    {
                        ["L"] = 1000m,
                        ["phan_manh"] = 1m
                    },
                    tenSanPham = "Ống test",
                    donViTinh = "cái",
                    thueSuat = 0.08m,
                    thanhTienTon = 50000m
                }
            }
        });

        Assert.True(
            createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created,
            $"Unexpected status: {createResponse.StatusCode}");
        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetInt32();
        Assert.True(id > 0);
        Assert.Equal("Khách integration test", created.GetProperty("tenKhachHang").GetString());

        var getResponse = await _client.GetAsync($"/api/bao-gia/{id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var detail = await getResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(id, detail.GetProperty("id").GetInt32());
        Assert.True(detail.GetProperty("chiTietBaoGias").GetArrayLength() >= 1);
    }

    [Fact]
    public async Task CreateUser_RejectsShortPassword()
    {
        await AuthorizeAsAdminAsync();

        var response = await _client.PostAsJsonAsync("/api/nguoi-dung", new
        {
            tenDangNhap = "shortpwd",
            hoTen = "Short",
            matKhau = "123",
            vaiTro = "NHAN_VIEN",
            dangHoatDong = true
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task AuthorizeAsAdminAsync()
    {
        var login = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            tenDangNhap = "admin",
            matKhau = "admin123",
            captchaToken = "any",
            captchaValue = "any"
        });

        login.EnsureSuccessStatusCode();
        var json = await login.Content.ReadFromJsonAsync<JsonElement>();
        var token = json.GetProperty("token").GetString();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
}
