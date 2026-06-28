using System.Security.Claims;

namespace OngGio.Api;

internal static class AuthClaims
{
    public const string AdminRole = "ADMIN";

    public static bool IsAdmin(ClaimsPrincipal user) =>
        string.Equals(user.FindFirst("vaiTro")?.Value, AdminRole, StringComparison.OrdinalIgnoreCase);

    public static int? GetUserId(ClaimsPrincipal user) =>
        int.TryParse(user.FindFirst("id")?.Value, out var userId) ? userId : null;
}
