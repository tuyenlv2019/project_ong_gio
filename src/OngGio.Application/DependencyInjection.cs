using Microsoft.Extensions.DependencyInjection;
using OngGio.Application.Calculation;
using OngGio.Application.Calculation.Formulas;
using OngGio.Application.Abstractions;

namespace OngGio.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton<IAreaFormula, Co90AreaFormula>();
        services.AddSingleton<IAreaFormula, Co45AreaFormula>();
        services.AddSingleton<IAreaFormula, OngThangAreaFormula>();
        services.AddSingleton<IAreaFormula, GiamAreaFormula>();
        services.AddSingleton<IAreaFormula, ChanReAreaFormula>();
        services.AddScoped<ICalculationEngine, CalculationEngine>();
        return services;
    }
}
