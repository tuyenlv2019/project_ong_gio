// Implementation lấy user hiện tại từ JWT cho audit.
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using OngGio.Application.Abstractions;

namespace OngGio.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string GetCurrentUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true)
            return "system";

        return user.FindFirst("tenDangNhap")?.Value
            ?? user.FindFirst("hoTen")?.Value
            ?? user.FindFirst(ClaimTypes.Name)?.Value
            ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user.Claims.FirstOrDefault(c =>
                c.Type.Equals("hoTen", StringComparison.OrdinalIgnoreCase) ||
                c.Type.Equals("tenDangNhap", StringComparison.OrdinalIgnoreCase))?.Value
            ?? "system";
    }
}
