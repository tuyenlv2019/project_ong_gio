namespace OngGio.Application.Abstractions;

/// <summary>
/// Hợp đồng tạo và xác thực captcha.
/// </summary>
public interface ICaptchaService
{
    /// <summary>
    /// Tạo một captcha mới.
    /// </summary>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Thông tin captcha gồm token và ảnh base64.</returns>
    Task<CaptchaChallenge> CreateCaptchaAsync(CancellationToken ct = default);

    /// <summary>
    /// Xác thực câu trả lời captcha.
    /// </summary>
    /// <param name="token">Token captcha.</param>
    /// <param name="answer">Câu trả lời người dùng nhập.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>True nếu captcha hợp lệ.</returns>
    Task<bool> ValidateCaptchaAsync(string token, string answer, CancellationToken ct = default);
}

public record CaptchaChallenge(string Token, string ImageBase64);
