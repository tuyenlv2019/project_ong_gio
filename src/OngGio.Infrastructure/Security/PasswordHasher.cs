using System.Security.Cryptography;
using System.Text;

// Tiện ích hash/verify mật khẩu an toàn cho user nội bộ.
namespace OngGio.Infrastructure.Security;

public static class PasswordHasher
{
    public static string Hash(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }

    public static bool Verify(string password, string hash) =>
        Hash(password).Equals(hash, StringComparison.OrdinalIgnoreCase);
}
 
