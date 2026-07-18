using System.Security.Cryptography;
using System.Text;

// Tiện ích hash/verify mật khẩu (PBKDF2 + tương thích hash SHA256 cũ).
namespace OngGio.Infrastructure.Security;

public static class PasswordHasher
{
    private const string Prefix = "v1";
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100_000;

    /// <summary>Hash mật khẩu bằng PBKDF2-SHA256 (có salt).</summary>
    public static string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var key = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            KeySize);

        return $"{Prefix}${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}";
    }

    /// <summary>Verify mật khẩu với hash PBKDF2 mới hoặc SHA256 hex cũ.</summary>
    public static bool Verify(string password, string hash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(hash))
            return false;

        if (hash.StartsWith(Prefix + "$", StringComparison.Ordinal))
            return VerifyPbkdf2(password, hash);

        // Legacy: SHA256 hex không salt (seed/user cũ trước khi nâng cấp).
        var legacy = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(password)));
        return legacy.Equals(hash, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>True nếu hash còn dạng cũ và nên nâng cấp khi đăng nhập thành công.</summary>
    public static bool NeedsRehash(string hash) =>
        !string.IsNullOrWhiteSpace(hash)
        && !hash.StartsWith(Prefix + "$", StringComparison.Ordinal);

    private static bool VerifyPbkdf2(string password, string hash)
    {
        var parts = hash.Split('$', 4);
        if (parts.Length != 4 || parts[0] != Prefix)
            return false;

        if (!int.TryParse(parts[1], out var iterations) || iterations < 10_000)
            return false;

        byte[] salt;
        byte[] expected;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expected = Convert.FromBase64String(parts[3]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actual = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expected.Length);

        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
