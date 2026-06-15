namespace OngGio.Application.Abstractions;

public interface ICaptchaService
{
    Task<CaptchaChallenge> CreateCaptchaAsync(CancellationToken ct = default);
    Task<bool> ValidateCaptchaAsync(string token, string answer, CancellationToken ct = default);
}

public record CaptchaChallenge(string Token, string ImageBase64);
