// File khởi động của API: cấu hình DI, JWT, CORS, Swagger và seed dữ liệu.
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using OngGio.Api;
using OngGio.Application;
using OngGio.Infrastructure;

// Render/container có giới hạn inotify/file descriptor khá thấp, nên tắt reload cấu hình theo file
// để tránh host khởi tạo FileSystemWatcher cho appsettings*.json khi start.
var builderArgs = args.Concat(["hostBuilder:reloadConfigOnChange=false"]).ToArray();
var builder = WebApplication.CreateBuilder(builderArgs);

var connectionString = PostgresConnectionStringNormalizer.Normalize(
    builder.Configuration.GetConnectionString("DefaultConnection"));

builder.Services.AddApplication();
builder.Services.AddInfrastructure(connectionString);

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKeyText = jwtSettings["SecretKey"];
if (string.IsNullOrWhiteSpace(secretKeyText)
    || secretKeyText.Length < 32
    || secretKeyText.Contains("your-super-secret-key", StringComparison.OrdinalIgnoreCase)
    || secretKeyText.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "JwtSettings:SecretKey chưa được cấu hình an toàn (tối thiểu 32 ký tự). "
        + "Đặt qua biến môi trường JwtSettings__SecretKey hoặc appsettings.Development.json.");
}

var secretKey = Encoding.UTF8.GetBytes(secretKeyText);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(secretKey),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = "id",
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    options.AddPolicy("AdminOnly", policy =>
        policy.RequireAuthenticatedUser()
            .RequireAssertion(context => AuthClaims.IsAdmin(context.User)));
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? [];

        if (builder.Environment.IsDevelopment()
            || builder.Environment.IsEnvironment("Testing")
            || origins.Length == 0)
        {
            // Dev/Testing: cho phép mọi origin để Vite proxy hoạt động.
            policy.SetIsOriginAllowed(_ => true)
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (!app.Environment.IsEnvironment("Testing"))
{
    try
    {
        await OngGio.Infrastructure.DependencyInjection.SeedDataAsync(app.Services);
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
        logger.LogError(ex, "Không thể kết nối PostgreSQL. Kiểm tra ConnectionStrings:DefaultConnection / biến môi trường.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");

if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.UseDefaultFiles();
}

app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.MapFallbackToFile("index.html");
}

app.Run();

public partial class Program;
