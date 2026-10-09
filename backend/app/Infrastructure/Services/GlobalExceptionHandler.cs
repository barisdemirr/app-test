using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Dersakis.Infrastructure.Services;

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment env) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        // Yanıt zaten yazılmaya başladıysa üstüne yazamayız.
        if (ctx.Response.HasStarted) return false;

        // İstemci bağlantıyı kendisi kopardı: hata değil, loglamaya da gerek yok.
        if (ex is OperationCanceledException && ctx.RequestAborted.IsCancellationRequested) return true;

        // Gövde/parametre bağlama hatası (bozuk JSON, Guid olmayan değer vb.) istemci hatasıdır: 400.
        // Development'ta minimal API bu hatayı fırlatır, production'da kendisi 400 döner. İkisi aynı davransın.
        if (ex is BadHttpRequestException bad)
        {
            logger.LogWarning(ex, "Geçersiz istek. TraceId={TraceId}", ctx.TraceIdentifier);
            await Write(ctx, bad.StatusCode, "bad_request",
                env.IsDevelopment() ? Describe(ex) : "İstek gövdesi veya parametreleri geçersiz.", ct);
            return true;
        }

        logger.LogError(ex, "Yakalanmayan hata. TraceId={TraceId}", ctx.TraceIdentifier);
        await Write(ctx, StatusCodes.Status500InternalServerError, "internal_error",
            env.IsDevelopment() ? Describe(ex) : "Beklenmeyen bir hata oluştu.", ct);
        return true;
    }

    private static Task Write(HttpContext ctx, int status, string title, string detail, CancellationToken ct)
    {
        ctx.Response.StatusCode = status;
        return ctx.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Extensions = { ["traceId"] = ctx.TraceIdentifier }
        }, ct);
    }

    /// <summary>Sadece Development'ta kullanılır: hata tipi, mesaj ve varsa iç hata.</summary>
    private static string Describe(Exception ex)
        => ex.InnerException is null
            ? $"{ex.GetType().Name}: {ex.Message}"
            : $"{ex.GetType().Name}: {ex.Message} | İç hata: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}";
}