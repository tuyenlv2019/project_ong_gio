using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OngGio.Infrastructure.Persistence;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OngGio.Infrastructure.Services;

public sealed class CloudinaryImageService
{
    private static readonly HttpClient Http = new();
    private readonly OngGioDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<CloudinaryImageService> _logger;

    public CloudinaryImageService(
        OngGioDbContext db,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger<CloudinaryImageService> logger)
    {
        _db = db;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    public async Task<string> UploadProductImageAsync(
        Stream fileStream,
        string originalFileName,
        string? contentType,
        CancellationToken ct = default)
    {
        var options = GetOptionsOrThrow();
        var folderName = NormalizeFolder(options.Folder);
        var fileTimestamp = GetVietnamTimestamp();
        var publicId = BuildPublicId(folderName, originalFileName, fileTimestamp);

        using var form = new MultipartFormDataContent();
        using var streamContent = new StreamContent(fileStream);
        streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(
            string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType);

        form.Add(streamContent, "file", Path.GetFileName(originalFileName));
        form.Add(new StringContent(publicId), "public_id");
        form.Add(new StringContent("true"), "overwrite");

        var uploadUrl = $"https://api.cloudinary.com/v1_1/{options.CloudName.Trim()}/image/upload";
        using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl)
        {
            Content = form
        };
        ApplyBasicAuth(request, options.ApiKey, options.ApiSecret);

        var response = await Http.SendAsync(request, ct);
        var responseText = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            var errorMessage = TryReadCloudinaryError(responseText);
            throw new InvalidOperationException(NormalizeCloudinaryError(errorMessage, "upload"));
        }

        var uploadResult = JsonSerializer.Deserialize<CloudinaryUploadResponse>(responseText);
        if (string.IsNullOrWhiteSpace(uploadResult?.SecureUrl))
        {
            throw new InvalidOperationException("Cloudinary không trả về đường dẫn ảnh hợp lệ");
        }

        return uploadResult.SecureUrl!;
    }

    public async Task DeleteProductImageAsync(string imageUrlOrPath, CancellationToken ct = default)
    {
        var options = GetOptionsOrNull();
        if (options is null || string.IsNullOrWhiteSpace(imageUrlOrPath))
            return;

        if (!TryExtractPublicIdFromCloudinaryUrl(imageUrlOrPath.Trim(), out var publicId))
            return;
        var cloudName = options.CloudName.Trim();
        var apiKey = options.ApiKey.Trim();
        var apiSecret = options.ApiSecret.Trim();
        var timestamp = GetCloudinaryTimestamp();

        var signature = CreateSignature(
            new Dictionary<string, string>
            {
                ["public_id"] = publicId,
                ["timestamp"] = timestamp
            },
            apiSecret);

        var deleteUrl =
            $"https://api.cloudinary.com/v1_1/{cloudName}/image/destroy";

        using var form = new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                ["api_key"] = apiKey,
                ["timestamp"] = timestamp,
                ["signature"] = signature,
                ["public_id"] = publicId
            });

        var response = await Http.PostAsync(deleteUrl, form, ct);

        var responseText =
            await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            var errorMessage = TryReadCloudinaryError(responseText);
            throw new InvalidOperationException(NormalizeCloudinaryError(errorMessage, "delete"));
        }
    }

    public async Task<int> MigrateNhomSanPhamImagesAsync(CancellationToken ct = default)
    {
        var options = GetOptionsOrNull();
        if (options is null)
            return 0;

        var webRootPath = ResolveWebRootPath();
        if (string.IsNullOrWhiteSpace(webRootPath))
            return 0;

        var nhoms = await _db.NhomSanPhams
            .Where(x => x.HinhAnhMinhHoa != null && x.HinhAnhMinhHoa != "")
            .ToListAsync(ct);

        var migrated = 0;
        foreach (var nhom in nhoms)
        {
            var current = nhom.HinhAnhMinhHoa?.Trim();
            if (string.IsNullOrWhiteSpace(current) || IsCloudinaryUrl(current))
                continue;

            var localPath = ResolveLocalImagePath(current, webRootPath);
            if (localPath is null || !File.Exists(localPath))
            {
                _logger.LogWarning("Không tìm thấy ảnh cũ để migrate: {ImagePath}", current);
                continue;
            }

            try
            {
                await using var stream = File.OpenRead(localPath);
                var uploadedUrl = await UploadProductImageAsync(
                    stream,
                    Path.GetFileName(localPath),
                    GetContentType(localPath),
                    ct);

                nhom.HinhAnhMinhHoa = uploadedUrl;
                migrated++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Không thể migrate ảnh nhóm sản phẩm {Id} ({ImagePath})", nhom.Id, current);
            }
        }

        if (migrated > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        return migrated;
    }

    private static bool TryExtractPublicIdFromCloudinaryUrl(string imageUrlOrPath, out string publicId)
    {
        publicId = string.Empty;

        if (!Uri.TryCreate(imageUrlOrPath, UriKind.Absolute, out var uri))
            return false;

        if (!uri.Host.Contains("res.cloudinary.com", StringComparison.OrdinalIgnoreCase))
            return false;

        var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries).ToList();
        var uploadIndex = segments.FindIndex(segment => string.Equals(segment, "upload", StringComparison.OrdinalIgnoreCase));
        if (uploadIndex < 0 || uploadIndex + 1 >= segments.Count)
            return false;

        var publicSegments = segments.Skip(uploadIndex + 1).ToList();
        if (publicSegments.Count == 0)
            return false;

        if (publicSegments[0].Length > 1
            && publicSegments[0][0] == 'v'
            && publicSegments[0].Substring(1).All(char.IsDigit))
        {
            publicSegments.RemoveAt(0);
        }

        if (publicSegments.Count == 0)
            return false;

        publicSegments[^1] = Path.GetFileNameWithoutExtension(publicSegments[^1]);
        publicId = string.Join("/", publicSegments).Trim('/');
        return publicId.Length > 0;
    }

    private CloudinaryOptions? GetOptionsOrNull()
    {
        var options = _configuration.GetSection("Cloudinary").Get<CloudinaryOptions>() ?? new CloudinaryOptions();
        options = new CloudinaryOptions
        {
            CloudName = options.CloudName?.Trim() ?? string.Empty,
            ApiKey = options.ApiKey?.Trim() ?? string.Empty,
            ApiSecret = options.ApiSecret?.Trim() ?? string.Empty,
            Folder = options.Folder?.Trim() ?? "ong-gio",
        };
        if (string.IsNullOrWhiteSpace(options.CloudName)
            || string.IsNullOrWhiteSpace(options.ApiKey)
            || string.IsNullOrWhiteSpace(options.ApiSecret))
        {
            return null;
        }

        return options;
    }

    private CloudinaryOptions GetOptionsOrThrow()
    {
        var options = GetOptionsOrNull();
        if (options is null)
        {
            throw new InvalidOperationException(
                "Cloudinary chưa được cấu hình. Vui lòng đặt Cloudinary:CloudName, Cloudinary:ApiKey và Cloudinary:ApiSecret.");
        }

        return options;
    }

    private static string NormalizeFolder(string? folder)
    {
        var value = string.IsNullOrWhiteSpace(folder) ? "ong-gio" : folder.Trim().Trim('/');
        return string.IsNullOrWhiteSpace(value) ? "ong-gio" : value;
    }

    private static string GetVietnamTimestamp()
    {
        var vietNamTime = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7));
        return vietNamTime.ToString("yyyyMMdd_HHmmss");
    }

    private static string BuildPublicId(string folderName, string originalFileName, string timestamp)
    {
        var stem = Path.GetFileNameWithoutExtension(originalFileName);
        stem = SanitizeFileNameStem(stem);
        return $"{folderName}/{stem}_{timestamp}";
    }

    private static string GetCloudinaryTimestamp()
    {
        return DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
    }

    private static string CreateSignature(IReadOnlyDictionary<string, string> parameters, string apiSecret)
    {
        var payload = string.Join("&",
            parameters
                .Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
                .OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"{kv.Key}={kv.Value}"));

        var bytes = Encoding.UTF8.GetBytes(payload + apiSecret);
        var hash = SHA1.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static void ApplyBasicAuth(HttpRequestMessage request, string apiKey, string apiSecret)
    {
        var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{apiKey}:{apiSecret}"));
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);
    }

    private static string SanitizeFileNameStem(string value)
    {
        var builder = new StringBuilder();
        foreach (var c in value.Trim())
        {
            if (char.IsWhiteSpace(c))
            {
                builder.Append('_');
                continue;
            }

            if (Path.GetInvalidFileNameChars().Contains(c) || c is '/' or '\\' or ':' or '*' or '?' or '"' or '<' or '>' or '|')
            {
                builder.Append('_');
                continue;
            }

            builder.Append(c);
        }

        var sanitized = builder.ToString().Trim('_');
        return string.IsNullOrWhiteSpace(sanitized) ? "image" : sanitized;
    }

    private static string? TryReadCloudinaryError(string responseText)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseText);
            if (doc.RootElement.TryGetProperty("error", out var error)
                && error.TryGetProperty("message", out var message)
                && message.ValueKind == JsonValueKind.String)
            {
                return message.GetString();
            }
        }
        catch
        {
            // Ignore parse failures and fall back to a generic error.
        }

        return null;
    }

    private static string NormalizeCloudinaryError(string? errorMessage, string operation)
    {
        if (string.IsNullOrWhiteSpace(errorMessage))
        {
            return operation == "delete"
                ? "Xóa ảnh trên Cloudinary thất bại"
                : "Tải ảnh lên Cloudinary thất bại";
        }

        if (errorMessage.Contains("Unknown API key", StringComparison.OrdinalIgnoreCase))
        {
            return "Cloudinary báo Unknown API key. Hãy kiểm tra lại Cloudinary__CloudName, Cloudinary__ApiKey và Cloudinary__ApiSecret trên Render, vì 3 giá trị này phải cùng một tài khoản Cloudinary.";
        }

        return errorMessage;
    }

    private string? ResolveWebRootPath()
    {
        var candidates = new[]
        {
            _environment.ContentRootPath is { Length: > 0 } ? Path.Combine(_environment.ContentRootPath, "wwwroot") : null,
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "wwwroot")),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "wwwroot")),
        };

        return candidates.FirstOrDefault(Directory.Exists);
    }

    private static string? ResolveLocalImagePath(string imagePath, string webRootPath)
    {
        var value = imagePath.Trim();
        if (string.IsNullOrWhiteSpace(value) || IsCloudinaryUrl(value))
            return null;

        if (Path.IsPathRooted(value) && File.Exists(value))
            return value;

        var normalized = value.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var candidate = Path.Combine(webRootPath, normalized);
        return candidate;
    }

    private static bool IsCloudinaryUrl(string value) =>
        value.Contains("res.cloudinary.com", StringComparison.OrdinalIgnoreCase);

    private static string? GetContentType(string localPath)
    {
        return Path.GetExtension(localPath).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream",
        };
    }
}

internal sealed class CloudinaryOptions
{
    public string CloudName { get; init; } = string.Empty;
    public string ApiKey { get; init; } = string.Empty;
    public string ApiSecret { get; init; } = string.Empty;
    public string Folder { get; init; } = "ong-gio";
}

internal sealed class CloudinaryUploadResponse
{
    [JsonPropertyName("secure_url")]
    public string? SecureUrl { get; init; }
}
