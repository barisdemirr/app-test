namespace Dersakis.Features.Auth;

public sealed record UserDto(Guid Id, string Email, string DisplayName, int CreditBalance);

public sealed record AuthResponse(string AccessToken, DateTime ExpiresAtUtc, UserDto User);