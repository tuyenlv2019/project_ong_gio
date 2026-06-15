using OngGio.Application.Abstractions;

namespace OngGio.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    public string GetCurrentUserId() => "system";
}
