using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace OngGio.Api.Tests;

public class AuthApiTests : IClassFixture<OngGioWebApplicationFactory>
{
    private readonly OngGioWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthApiTests(OngGioWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        factory.SeedAsync().GetAwaiter().GetResult();
    }

    [Fact]
    public async Task Captcha_IsAnonymous_AndReturnsToken()
    {
        var response = await _client.GetAsync("/api/auth/captcha");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("token", out var token));
        Assert.False(string.IsNullOrWhiteSpace(token.GetString()));
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsJwt()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            tenDangNhap = "admin",
            matKhau = "admin123",
            captchaToken = "any",
            captchaValue = "any"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("success").GetBoolean());
        Assert.False(string.IsNullOrWhiteSpace(json.GetProperty("token").GetString()));
        Assert.Equal("admin", json.GetProperty("user").GetProperty("tenDangNhap").GetString());
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            tenDangNhap = "admin",
            matKhau = "sai-mat-khau",
            captchaToken = "any",
            captchaValue = "any"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/bao-gia");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
