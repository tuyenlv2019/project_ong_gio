// Đăng ký engine tính toán.
using Microsoft.Extensions.DependencyInjection;
using OngGio.Application.Calculation;

namespace OngGio.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ICalculationEngine, CalculationEngine>();
        return services;
    }
}
