using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;
using OngGio.Application.Abstractions;

namespace OngGio.Infrastructure.Services;

/// <summary>
/// Service captcha: tạo ảnh SVG, lưu đáp án tạm và xác thực một lần.
/// </summary>
public class CaptchaService : ICaptchaService
{
    private readonly IMemoryCache _cache;
    private const int ExpirationMinutes = 5;
    private const int CaptchaLength = 5;
    private const int ImageWidth = 220;
    private const int ImageHeight = 72;
    private static readonly char[] CaptchaChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray();

    public CaptchaService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task<CaptchaChallenge> CreateCaptchaAsync(CancellationToken ct = default)
    {
        var text = GenerateCaptchaText(CaptchaLength);
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var imageBase64 = CreateCaptchaSvgBase64(text);

        _cache.Set(GetCacheKey(token), text, TimeSpan.FromMinutes(ExpirationMinutes));

        return Task.FromResult(new CaptchaChallenge(token, imageBase64));
    }

    public Task<bool> ValidateCaptchaAsync(string token, string answer, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(answer))
            return Task.FromResult(false);

        var cacheKey = GetCacheKey(token);
        if (!_cache.TryGetValue<string>(cacheKey, out var expectedAnswer))
            return Task.FromResult(false);

        _cache.Remove(cacheKey);
        return Task.FromResult(string.Equals(expectedAnswer, answer.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    private static string GenerateCaptchaText(int length)
    {
        var builder = new StringBuilder(length);
        for (var i = 0; i < length; i++)
        {
            var index = RandomNumberGenerator.GetInt32(CaptchaChars.Length);
            builder.Append(CaptchaChars[index]);
        }
        return builder.ToString();
    }

    private static string CreateCaptchaSvgBase64(string text)
    {
        var svg = new StringBuilder();
        svg.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{ImageWidth}\" height=\"{ImageHeight}\" viewBox=\"0 0 {ImageWidth} {ImageHeight}\">");
        svg.Append("<rect width=\"100%\" height=\"100%\" fill=\"#ffffff\"/>");

        for (var i = 0; i < 4; i++)
        {
            var x1 = RandomNumberGenerator.GetInt32(0, ImageWidth);
            var y1 = RandomNumberGenerator.GetInt32(0, ImageHeight);
            var x2 = RandomNumberGenerator.GetInt32(0, ImageWidth);
            var y2 = RandomNumberGenerator.GetInt32(0, ImageHeight);
            svg.Append($"<line x1=\"{x1}\" y1=\"{y1}\" x2=\"{x2}\" y2=\"{y2}\" stroke=\"#d0d0d0\" stroke-width=\"1\"/>");
        }

        for (var i = 0; i < 80; i++)
        {
            var x = RandomNumberGenerator.GetInt32(0, ImageWidth);
            var y = RandomNumberGenerator.GetInt32(0, ImageHeight);
            svg.Append($"<circle cx=\"{x}\" cy=\"{y}\" r=\"1\" fill=\"#d8d8d8\"/>");
        }

        var charX = 14;
        foreach (var c in text)
        {
            var y = 18 + RandomNumberGenerator.GetInt32(0, 16);
            var rotate = RandomNumberGenerator.GetInt32(-18, 18);
            svg.Append(
                $"<text x=\"{charX}\" y=\"{y + 28}\" fill=\"#1e5078\" font-family=\"Arial,sans-serif\" font-size=\"34\" font-weight=\"700\" transform=\"rotate({rotate} {charX} {y + 28})\">{c}</text>");
            charX += 38;
        }

        svg.Append("</svg>");
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(svg.ToString()));
    }

    private static string GetCacheKey(string token) => $"captcha:{token}";
}
