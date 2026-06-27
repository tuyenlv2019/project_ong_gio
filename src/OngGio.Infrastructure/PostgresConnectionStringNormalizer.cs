using Npgsql;

namespace OngGio.Infrastructure;

/// <summary>
/// Chuyển connection string dạng URI (postgresql://...) sang format Npgsql key-value.
/// </summary>
public static class PostgresConnectionStringNormalizer
{
    public static string Normalize(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        var trimmed = connectionString.Trim();
        if (!trimmed.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !trimmed.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        // Render/env đôi khi cắt chuỗi tại ?sslmode (mất =require)
        if (trimmed.EndsWith("?sslmode", StringComparison.OrdinalIgnoreCase))
            trimmed += "=require";

        var uri = new Uri(trimmed);
        var userInfo = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            SslMode = SslMode.Require,
        };

        if (!string.IsNullOrEmpty(uri.Query))
        {
            foreach (var part in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
            {
                var segments = part.Split('=', 2);
                var key = Uri.UnescapeDataString(segments[0]);
                var value = segments.Length > 1 ? Uri.UnescapeDataString(segments[1]) : string.Empty;

                if (key.Equals("sslmode", StringComparison.OrdinalIgnoreCase)
                    && Enum.TryParse(value.Replace('-', '_'), true, out SslMode sslMode))
                {
                    builder.SslMode = sslMode;
                }
            }
        }

        return builder.ConnectionString;
    }
}
