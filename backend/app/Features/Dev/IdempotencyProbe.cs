using Dersakis.Infrastructure.Services;
using Dersakis.Shared;

namespace Dersakis.Features.Dev;

public sealed record ProbeRequest(int? Amount, int? DelayMs);

/// <summary>GEÇİCİ: idempotency filter testi için. Sadece Development ortamında yayınlanır.</summary>
public sealed class IdempotencyProbe : IEndpoint
{
    private static int _executions;

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        if (!app.ServiceProvider.GetRequiredService<IHostEnvironment>().IsDevelopment()) return;

        app.MapPost("/dev/idempotency-probe", Handle)
           .RequireAuthorization()
           .RequireIdempotency()
           .WithTags("Dev");
    }

    private static async Task<IResult> Handle(ProbeRequest req, CancellationToken ct)
    {
        await Task.Delay(Math.Clamp(req.DelayMs ?? 0, 0, 5000), ct);
        var n = Interlocked.Increment(ref _executions);
        return Results.Ok(new { executions = n, amount = req.Amount });
    }
}