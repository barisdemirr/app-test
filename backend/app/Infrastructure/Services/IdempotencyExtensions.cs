using Microsoft.AspNetCore.Http.Features;

namespace Dersakis.Infrastructure.Services;

public sealed record IdempotentMetadata;

public static class IdempotencyExtensions
{
    /// <summary>Endpoint'i idempotent yapar: Idempotency-Key header'ı zorunlu hale gelir.</summary>
    public static RouteHandlerBuilder RequireIdempotency(this RouteHandlerBuilder builder)
        => builder.WithMetadata(new IdempotentMetadata()).AddEndpointFilter<IdempotencyFilter>();

    /// <summary>
    /// Endpoint filter'lar parametre bağlamadan SONRA çalışır, yani gövde o zamana kadar okunmuş olur.
    /// Hash için gövdeyi tekrar okuyabilmek amacıyla, idempotent endpoint'lerde buffer'lamayı en baştan açıyoruz.
    /// </summary>
    public static IApplicationBuilder UseIdempotencyBuffering(this IApplicationBuilder app)
        => app.Use(async (ctx, next) =>
        {
            if (ctx.GetEndpoint()?.Metadata.GetMetadata<IdempotentMetadata>() is not null)
            {
                var limit = ctx.Features.Get<IHttpMaxRequestBodySizeFeature>();
                if (limit is { IsReadOnly: false }) limit.MaxRequestBodySize = IdempotencyFilter.MaxBodyBytes;
                ctx.Request.EnableBuffering();
            }
            await next();
        });
}