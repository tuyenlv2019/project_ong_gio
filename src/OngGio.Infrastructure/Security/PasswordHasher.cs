using System.Security.Cryptography;
using System.Text;

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
 