using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Auth;

public sealed record RegisterRequest(string? Phone, string? Code, string? Password, string? DisplayName, string? InviteCode);

public sealed class Register : IEndpoint
{
    private sealed record Registered(User User, int Balance);

    /// <summary>Transaction içinde beklenen bir red durumu. Exception olarak fırlatılır ki transaction GERİ ALINSIN.</summary>
    private sealed class RegistrationRejected(Error error) : Exception(error.Message)
    {
        public Error Error { get; } = error;
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/auth/register", Handle).AllowAnonymous()
              .RequireRateLimiting(RateLimitPolicies.Auth).WithTags("Auth");

    private static async Task<IResult> Handle(
        RegisterRequest req, AppDbContext db, PasswordService passwords, TokenService tokens,
        CreditService credits, OtpService otp, ReferralSettings referral, TimeProvider clock, CancellationToken ct)
    {
        var phone = PhoneNumber.Normalize(req.Phone);
        var code = (req.Code ?? "").Trim();
        var name = (req.DisplayName ?? "").Trim();
        var password = req.Password ?? "";
        var inviteFormatOk = InviteCodes.TryNormalize(req.InviteCode, out var invite);

        var error = new Validator()
            .Check(phone is not null, "Geçerli bir cep telefonu numarası gir (05xx xxx xx xx).")
            .Check(code.Length == 6 && code.All(char.IsAsciiDigit), "Doğrulama kodu 6 haneli olmalı.")
            .Check(password.Length is >= 8 and <= 128, "Şifre 8 ile 128 karakter arasında olmalı.")
            .Check(name.Length is >= 2 and <= 40 && TextRules.Clean(name), "Görünen ad 2 ile 40 karakter arasında olmalı.")
            .Check(inviteFormatOk, "Davet kodu 8 karakterli olmalı.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        // Kod doğrulaması ucuz bir işlem. Pahalı şifre hash'i yalnızca doğru kodla yapılır: sahte isteklerle CPU yakılamaz.
        var verified = await otp.VerifyAsync(phone!, code, ct);
        if (verified.IsFailure) return verified.ToProblem();
        var verificationId = verified.Value;

        if (await db.Users.AnyAsync(u => u.Phone == phone, ct)) return PhoneTaken();

        // Davet ön kontrolü (kullanıcı kodu boşa harcamasın). Asıl garanti transaction içindeki atomik slot alma.
        if (invite is not null)
        {
            var used = await db.Users.AsNoTracking().Where(u => u.InviteCode == invite)
                .Select(u => (int?)u.InvitesUsed).FirstOrDefaultAsync(ct);
            if (used is null) return Rejected(Error.Validation("invite_code_invalid", "Davet kodu geçersiz."));
            if (used >= referral.MaxInvitesPerUser) return Rejected(InviteExhausted);
        }

        var passwordHash = passwords.Hash(password); // transaction dışında: pahalı iş, deadlock'ta tekrarlanmasın

        for (var attempt = 0; attempt < 3; attempt++)
        {
            try
            {
                var created = await db.RunInTransactionAsync<Registered>(
                    token => CreateAsync(db, credits, referral, clock, verificationId, phone!, name, passwordHash, invite, token), ct);

                var user = created.User;
                var (accessToken, expires) = tokens.Create(user);
                var dto = new UserDto(user.Id, user.Phone, user.DisplayName, created.Balance, user.InviteCode);
                return Results.Created("/api/v1/auth/me", new AuthResponse(accessToken, expires, dto));
            }
            catch (RegistrationRejected r)
            {
                return Rejected(r.Error); // transaction geri alındı, SMS kodu hâlâ geçerli
            }
            catch (DbUpdateException ex) when (ex.IsUniqueViolation("UX_Users_Phone"))
            {
                return PhoneTaken(); // iki eşzamanlı kayıt yarışında kaybeden taraf
            }
            catch (DbUpdateException ex) when (ex.IsUniqueViolation("UX_Users_InviteCode"))
            {
                // Rastgele davet kodu çakıştı (neredeyse imkansız). Her şey geri alındı, yeni kodla tekrar dene.
            }
        }

        return Rejected(Error.Conflict("register_conflict", "Kayıt tamamlanamadı, tekrar dene."));
    }

    /// <summary>
    /// Hepsi tek transaction'da: kodu tüket, davet slotu al, kullanıcıyı ekle, iki ödülü ver.
    /// Herhangi bir hata exception olarak çıkar ve hiçbir şey kalıcı olmaz.
    /// </summary>
    private static async Task<Registered> CreateAsync(
        AppDbContext db, CreditService credits, ReferralSettings referral, TimeProvider clock,
        Guid verificationId, string phone, string name, string passwordHash, string? invite, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;

        // Aynı kodla iki paralel kayıt: yalnızca biri tüketebilir.
        var consumed = await db.PhoneVerifications.Where(x => x.Id == verificationId && x.ConsumedAtUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.ConsumedAtUtc, (DateTime?)now), ct);
        if (consumed != 1)
            throw new RegistrationRejected(Error.Validation("code_invalid", "Doğrulama kodu kullanılmış veya geçersiz. Yeni kod iste."));

        Guid? inviterId = null;
        if (invite is not null)
        {
            inviterId = await db.Users.AsNoTracking().Where(u => u.InviteCode == invite)
                .Select(u => (Guid?)u.Id).FirstOrDefaultAsync(ct);
            if (inviterId is null)
                throw new RegistrationRejected(Error.Validation("invite_code_invalid", "Davet kodu geçersiz."));

            // Atomik slot: tek UPDATE hem sınırı denetler hem artırır. Davet edenin satırı burada kilitlenir,
            // aynı koda gelen paralel kayıtlar sıraya girer.
            var claimed = await db.Users.Where(u => u.Id == inviterId && u.InvitesUsed < referral.MaxInvitesPerUser)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.InvitesUsed, u => u.InvitesUsed + 1), ct);
            if (claimed != 1) throw new RegistrationRejected(InviteExhausted);
        }

        var user = new User
        {
            Phone = phone,
            DisplayName = name,
            PasswordHash = passwordHash,
            InviteCode = InviteCodes.Generate(),
            InvitedByUserId = inviterId,
            CreatedAtUtc = now
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        if (inviterId is { } inviter)
        {
            // Ödül günlük tavana sayılmaz. RefId = yeni kullanıcının id'si: aynı kayıt için ikinci ödül ledger'da imkansız.
            var toInvitee = await credits.GrantAsync(user.Id, referral.InviteeReward, CreditReason.ReferralInvitee, user.Id, ct);
            var toInviter = await credits.GrantAsync(inviter, referral.InviterReward, CreditReason.ReferralInviter, user.Id, ct);
            if (toInvitee.IsFailure || toInviter.IsFailure)
                throw new InvalidOperationException("Davet ödülü verilemedi."); // 500, ama her şey geri alınır
        }

        var balance = await db.Users.AsNoTracking().Where(u => u.Id == user.Id).Select(u => u.CreditBalance).FirstAsync(ct);
        return new Registered(user, balance);
    }

    private static readonly Error InviteExhausted =
        Error.Conflict("invite_code_exhausted", "Bu davet kodunun kullanım hakkı doldu.");

    private static IResult Rejected(Error e) => Result.Failure(e).ToProblem();

    private static IResult PhoneTaken()
        => Rejected(Error.Conflict("phone_taken", "Bu telefon numarasıyla zaten bir hesap var."));
}