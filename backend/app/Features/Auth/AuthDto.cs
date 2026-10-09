namespace Dersakis.Features.Auth;

public sealed record UserDto(Guid Id, string Phone, string DisplayName, int CreditBalance, string InviteCode);

public sealed record AuthResponse(string AccessToken, DateTime ExpiresAtUtc, UserDto User);