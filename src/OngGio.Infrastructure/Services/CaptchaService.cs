using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;
using OngGio.Application.Abstractions;

namespace OngGio.Infrastructure.Services;

public class CaptchaService : ICaptchaService
{
    private readonly IMemoryCache _cache;
    private const int ExpirationMinutes = 5;
    private const int CaptchaLength = 5;
    private const int ImageWidth = 220;
    private const int ImageHeight = 72;
    private static readonly char[] CaptchaChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray();
    private static readonly string[] FontFamilies = { "Arial", "Tahoma", "Verdana", "Times New Roman" };

    public CaptchaService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task<CaptchaChallenge> CreateCaptchaAsync(CancellationToken ct = default)
    {
        var text = GenerateCaptchaText(CaptchaLength);
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var imageBase64 = CreateCaptchaImageBase64(text);

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

    private static string CreateCaptchaImageBase64(string text)
    {
        using var bitmap = new Bitmap(ImageWidth, ImageHeight);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        graphics.Clear(Color.White);

        DrawNoise(graphics, bitmap);
        DrawCaptchaText(graphics, text);
        DrawNoise(graphics, bitmap);

        using var ms = new MemoryStream();
        bitmap.Save(ms, ImageFormat.Png);
        return Convert.ToBase64String(ms.ToArray());
    }

    private static void DrawCaptchaText(Graphics graphics, string text)
    {
        var randomFont = FontFamilies[RandomNumberGenerator.GetInt32(FontFamilies.Length)];
        using var font = new Font(randomFont, 36, FontStyle.Bold, GraphicsUnit.Pixel);
        using var brush = new SolidBrush(Color.FromArgb(30, 80, 120));

        var charX = 10;
        foreach (var c in text)
        {
            var yOffset = RandomNumberGenerator.GetInt32(0, 16);
            graphics.DrawString(c.ToString(), font, brush, new PointF(charX, yOffset + 10));
            charX += 36;
        }
    }

    private static void DrawNoise(Graphics graphics, Bitmap bitmap)
    {
        using var pen = new Pen(Color.LightGray, 1);
        for (var i = 0; i < 4; i++)
        {
            var x1 = RandomNumberGenerator.GetInt32(0, ImageWidth);
            var y1 = RandomNumberGenerator.GetInt32(0, ImageHeight);
            var x2 = RandomNumberGenerator.GetInt32(0, ImageWidth);
            var y2 = RandomNumberGenerator.GetInt32(0, ImageHeight);
            graphics.DrawLine(pen, x1, y1, x2, y2);
        }

        for (var i = 0; i < 120; i++)
        {
            var x = RandomNumberGenerator.GetInt32(0, ImageWidth);
            var y = RandomNumberGenerator.GetInt32(0, ImageHeight);
            bitmap.SetPixel(x, y, Color.LightGray);
        }
    }

    private static string GetCacheKey(string token) => $"captcha:{token}";
}
