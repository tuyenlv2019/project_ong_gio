using System.Security.Cryptography;
using System.Text;
using OngGio.Infrastructure.Security;

namespace OngGio.Infrastructure.Tests;

public class PasswordHasherTests
{
    [Fact]
    public void Hash_ProducesPbkdf2Format_AndVerifySucceeds()
    {
        var hash = PasswordHasher.Hash("admin123");

        Assert.StartsWith("v1$", hash);
        Assert.True(PasswordHasher.Verify("admin123", hash));
        Assert.False(PasswordHasher.Verify("wrong", hash));
        Assert.False(PasswordHasher.NeedsRehash(hash));
    }

    [Fact]
    public void Hash_SamePassword_ProducesDifferentSalts()
    {
        var a = PasswordHasher.Hash("same-password");
        var b = PasswordHasher.Hash("same-password");

        Assert.NotEqual(a, b);
        Assert.True(PasswordHasher.Verify("same-password", a));
        Assert.True(PasswordHasher.Verify("same-password", b));
    }

    [Fact]
    public void Verify_AcceptsLegacySha256Hex_AndFlagsRehash()
    {
        var legacy = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("admin123")));

        Assert.True(PasswordHasher.Verify("admin123", legacy));
        Assert.True(PasswordHasher.NeedsRehash(legacy));
        Assert.False(PasswordHasher.Verify("admin1234", legacy));
    }
}
