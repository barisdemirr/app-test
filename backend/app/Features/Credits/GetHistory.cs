using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Credits;

public sealed record CreditTransactionDto(int Amount, int BalanceAfter, string Reason, DateTime CreatedAtUtc);
public sealed record HistoryResponse(IReadOnlyList<CreditTransactionDto> Items, bool HasMore);

public sealed class GetHistory : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/credits/history", Handle).RequireAuthorization().WithTags("Credits");

    private static async Task<IResult> Handle(
        ClaimsPrincipal principal, AppDbContext db, int? page, int? pageSize, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var p = Math.Clamp(page ?? 1, 1, 10_000);
        var size = Math.Clamp(pageSize ?? 20, 1, 50);

        // size + 1 satır çekip fazlalıktan "sonraki sayfa var mı" bilgisini çıkarırız (COUNT sorgusu yok).
        var rows = await db.CreditTransactions.AsNoTracking()
            .Where(t => t.UserId == userId && t.Amount != 0)
            .OrderByDescending(t => t.CreatedAtUtc).ThenByDescending(t => t.Id) // ThenBy: eşit zamanda sıralama sabit kalsın
            .Skip((p - 1) * size).Take(size + 1)
            .Select(t => new { t.Amount, t.BalanceAfter, t.Reason, t.CreatedAtUtc })
            .ToListAsync(ct);

        var items = rows.Take(size)
            .Select(t => new CreditTransactionDto(t.Amount, t.BalanceAfter, t.Reason.ToString(), t.CreatedAtUtc))
            .ToList();

        return Results.Ok(new HistoryResponse(items, rows.Count > size));
    }
}