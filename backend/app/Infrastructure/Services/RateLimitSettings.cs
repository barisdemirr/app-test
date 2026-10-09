namespace Dersakis.Infrastructure.Services;

public sealed class RateRule
{
    public int Permits { get; init; }
    public int WindowSeconds { get; init; } = 60;
}

public sealed class RateLimitSettings
{
    public RateRule Global { get; init; } = new() { Permits = 300 };
    public RateRule Auth { get; init; } = new() { Permits = 20 };
    public RateRule Heartbeat { get; init; } = new() { Permits = 30 };
    public RateRule Answer { get; init; } = new() { Permits = 30 };
    public RateRule Write { get; init; } = new() { Permits = 30 };
}

public static class RateLimitPolicies
{
    public const string Auth = "auth";
    public const string Heartbeat = "heartbeat";
    public const string Answer = "answer";
    public const string Write = "write";
}