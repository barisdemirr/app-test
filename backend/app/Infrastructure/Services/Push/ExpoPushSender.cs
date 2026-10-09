using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dersakis.Domain.Enums;

namespace Dersakis.Infrastructure.Services.Push;

public sealed class ExpoPushSender(HttpClient http, PushSettings cfg, ILogger<ExpoPushSender> log) : IPushSender
{
    public PushProvider Provider => PushProvider.Expo;

    public async Task<IReadOnlyList<PushResult>> SendAsync(IReadOnlyList<PushMessage> messages, CancellationToken ct)
    {
        var results = new List<PushResult>(messages.Count);
        foreach (var chunk in messages.Chunk(100))   // Expo isteği başına en fazla 100 mesaj kabul eder
            results.AddRange(await SendChunkAsync(chunk, ct));
        return results;
    }

    private async Task<IReadOnlyList<PushResult>> SendChunkAsync(PushMessage[] chunk, CancellationToken ct)
    {
        var payload = chunk.Select(m =>
        {
            var item = new Dictionary<string, object?>
            {
                ["to"] = m.To,
                ["title"] = m.Title,
                ["body"] = m.Body,
                ["sound"] = "default",
                ["priority"] = "high",       // zaman kritik: uygulama arka plandayken de hemen ulaşsın
                ["channelId"] = "live"       // Android bildirim kanalı, RN tarafında bu adla oluşturulur
            };
            if (m.TtlSeconds is { } ttl) item["ttl"] = ttl;
            if (m.DataJson is not null) item["data"] = JsonSerializer.Deserialize<JsonElement>(m.DataJson);
            return item;
        }).ToList();

        using var request = new HttpRequestMessage(HttpMethod.Post, cfg.ExpoEndpoint) { Content = JsonContent.Create(payload) };
        request.Headers.Accept.ParseAdd("application/json");
        if (!string.IsNullOrEmpty(cfg.ExpoAccessToken))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cfg.ExpoAccessToken);

        try
        {
            using var response = await http.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                var transient = response.StatusCode == HttpStatusCode.TooManyRequests || (int)response.StatusCode >= 500;
                log.LogWarning("Expo push isteği başarısız: HTTP {Status}", (int)response.StatusCode);
                return Repeat(chunk.Length, transient ? PushResultKind.Retry : PushResultKind.Failed, $"http_{(int)response.StatusCode}");
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            if (!doc.RootElement.TryGetProperty("data", out var data)
                || data.ValueKind != JsonValueKind.Array
                || data.GetArrayLength() != chunk.Length)
                return Repeat(chunk.Length, PushResultKind.Retry, "unexpected_response");

            var list = new List<PushResult>(chunk.Length);
            foreach (var item in data.EnumerateArray())
            {
                if (item.TryGetProperty("status", out var status) && status.GetString() == "ok")
                {
                    list.Add(new PushResult(PushResultKind.Ok, null));
                    continue;
                }

                string? code = null;
                if (item.TryGetProperty("details", out var details) && details.ValueKind == JsonValueKind.Object
                    && details.TryGetProperty("error", out var error))
                    code = error.GetString();
                var message = item.TryGetProperty("message", out var msg) ? msg.GetString() : null;

                var kind = code switch
                {
                    "DeviceNotRegistered" => PushResultKind.InvalidToken,   // token'ı kapat
                    "MessageRateExceeded" => PushResultKind.Retry,
                    _ => PushResultKind.Failed
                };
                log.LogWarning("Expo push reddedildi: {Code} {Message}", code, message);
                list.Add(new PushResult(kind, code ?? message));
            }
            return list;
        }
        catch (Exception ex) when (!ct.IsCancellationRequested && ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            log.LogWarning(ex, "Expo push isteği hata verdi.");
            return Repeat(chunk.Length, PushResultKind.Retry, ex.GetType().Name);
        }
    }

    private static List<PushResult> Repeat(int count, PushResultKind kind, string error)
        => Enumerable.Range(0, count).Select(_ => new PushResult(kind, error)).ToList();
}