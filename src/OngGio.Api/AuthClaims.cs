using System.Security.Claims;

namespace OngGio.Api;

internal static class AuthClaims
{
    public const string AdminRole = "ADMIN";

    public static bool IsAdmin(ClaimsPrincipal user) =>
        string.Equals(user.FindFirst("vaiTro")?.Value, AdminRole, StringComparison.OrdinalIgnoreCase);
}
