using System.Threading.RateLimiting;
using Dersakis.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Dersakis.Infrastructure.Services;

public static class RateLimitingExtensions
{
    public static IServiceCollection AddAppRateLimiting(this IServiceCollection services, IConfiguration config)
    {
        var s = config.GetSection("RateLimiting").Get<RateLimitSettings>() ?? new RateLimitSettings();

        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Her isteğe uygulanan genel tavan; endpoint'e özel politikalar bunun ÜSTÜNE ayrıca uygulanır.
            o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
    IsUnmetered(ctx.Request.Path)
        ? RateLimitPartition.GetNoLimiter("unmetered")
        : Sliding(UserOrIp(ctx), s.Global));

            o.AddPolicy(RateLimitPolicies.Auth, ctx => Sliding(Ip(ctx), s.Auth)); // anonim: yalnızca IP
            o.AddPolicy(RateLimitPolicies.Heartbeat, ctx => Sliding(UserOrIp(ctx), s.Heartbeat));
            o.AddPolicy(RateLimitPolicies.Answer, ctx => Sliding(UserOrIp(ctx), s.Answer));
            o.AddPolicy(RateLimitPolicies.Write, ctx => Sliding(UserOrIp(ctx), s.Write));
            o.AddPolicy(RateLimitPolicies.Upload, ctx => Sliding(UserOrIp(ctx), s.Upload));
            o.AddPolicy(RateLimitPolicies.Watch, ctx => Sliding(UserOrIp(ctx), s.Watch));
            o.AddPolicy(RateLimitPolicies.Sms, ctx => Sliding(Ip(ctx), s.Sms));
            
            o.OnRejected = async (context, ct) =>
            {
                var http = context.HttpContext;
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    http.Response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();

                await http.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = "rate_limited",
                    Detail = "Çok fazla istek gönderdin. Biraz bekleyip tekrar dene."
                }, ct);
            };
        });

        return services;
    }

    private static RateLimitPartition<string> Sliding(string key, RateRule rule)
        => RateLimitPartition.GetSlidingWindowLimiter(key, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = rule.Permits,
            Window = TimeSpan.FromSeconds(rule.WindowSeconds),
            SegmentsPerWindow = 6,
            QueueLimit = 0,          // bekletme yok, fazlası anında 429
            AutoReplenishment = true
        });

    private static string Ip(HttpContext ctx) => "ip:" + (ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown");

    private static string UserOrIp(HttpContext ctx)
        => ctx.User.GetUserId() is { } id ? "u:" + id : Ip(ctx);


    /// <summary>Sağlık kontrolü ve video akışı global limite takılmaz (bant genişliği işi, API kötüye kullanımı değil).</summary>
    private static bool IsUnmetered(PathString path)
        => path.StartsWithSegments("/api/v1/health")
           || (path.StartsWithSegments("/api/v1/videos") && path.Value!.EndsWith("/stream", StringComparison.Ordinal));
}