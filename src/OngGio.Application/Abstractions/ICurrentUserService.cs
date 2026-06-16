// Hợp đồng lấy thông tin user hiện tại cho audit.
namespace OngGio.Application.Abstractions;

public interface ICurrentUserService
{
    string GetCurrentUserId();
}
