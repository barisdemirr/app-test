using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Dersakis.Infrastructure.Services;

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        logger.LogError(ex, "Yakalanmayan hata. TraceId={TraceId}", ctx.TraceIdentifier);

        ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await ctx.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = 500,
            Title = "internal_error",
            Detail = "Beklenmeyen bir hata oluştu.",
            Extensions = { ["traceId"] = ctx.TraceIdentifier }
        }, ct);

        return true;
    }
}