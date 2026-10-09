namespace Dersakis.Infrastructure.Services;

public interface ISmsSender
{
    Task SendAsync(string phone, string message, CancellationToken ct);
}

/// <summary>Geliştirme gönderici: SMS atmaz, konsola yazar. Gerçek sağlayıcı bağlanınca yerini alır.</summary>
public sealed class ConsoleSmsSender(ILogger<ConsoleSmsSender> logger) : ISmsSender
{
    public Task SendAsync(string phone, string message, CancellationToken ct)
    {
        logger.LogWarning("SMS (konsol) -> {Phone}: {Message}", phone, message);
        return Task.CompletedTask;
    }
}