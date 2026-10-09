using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Auth;

public sealed record RequestCodeRequest(string? Phone);

/// <summary>DevCode yalnızca Development ortamında dolu gelir (SMS sağlayıcısı olmadan geliştirme için).</summary>
public sealed record RequestCodeResponse(int ExpiresInSeconds, int ResendAfterSeconds, string? DevCode);

public sealed class RequestPhoneCode : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/auth/phone/request-code", Handle).AllowAnonymous()
              .RequireRateLimiting(RateLimitPolicies.Sms).WithTags("Auth");

    private static async Task<IResult> Handle(
        RequestCodeRequest req, AppDbContext db, OtpService otp, OtpSettings cfg, ISmsSender sms,
        IHostEnvironment env, ILogger<RequestPhoneCode> logger, CancellationToken ct)
    {
        var phone = PhoneNumber.Normalize(req.Phone);
        if (phone is null)
            return Result.Failure(Error.Validation("validation_failed", "Geçerli bir cep telefonu numarası gir (05xx xxx xx xx).")).ToProblem();

        // Boşuna SMS maliyeti olmasın: numara zaten kayıtlıysa kod gönderme.
        if (await db.Users.AnyAsync(u => u.Phone == phone, ct))
            return Result.Failure(Error.Conflict("phone_taken", "Bu telefon numarasıyla zaten bir hesap var.")).ToProblem();

        var issued = await otp.IssueAsync(phone, ct);
        if (issued.IsFailure) return issued.ToProblem();

        try
        {
            await sms.SendAsync(phone, $"Dersakis dogrulama kodun: {issued.Value.Code}. Kimseyle paylasma.", ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SMS gönderilemedi.");
            await otp.CancelAsync(issued.Value.Id);
            return Results.Problem(statusCode: 503, title: "sms_unavailable", detail: "Doğrulama kodu şu an gönderilemiyor. Biraz sonra tekrar dene.");
        }

        return Results.Ok(new RequestCodeResponse(cfg.CodeTtlSeconds, cfg.ResendSeconds, env.IsDevelopment() ? issued.Value.Code : null));
    }
}