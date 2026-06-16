// Implementation đơn giản cho current user trong môi trường hiện tại.
using OngGio.Application.Abstractions;

namespace OngGio.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    public string GetCurrentUserId() => "system";
}
