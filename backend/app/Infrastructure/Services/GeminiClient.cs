using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Dersakis.Infrastructure.Services;

public sealed record GeminiTurn(string Role, string Text);

/// <param name="Text">Modelin ürettiği JSON metni (şemaya uygun olması beklenir, doğrulama çağıranın işidir).</param>
/// <param name="Failure">null değilse: "blocked" (güvenlik filtresi), "rate_limited", "unavailable".</param>
public sealed record GeminiResult(string? Text, string? Failure);

/// <summary>Google Gemini generateContent çağrısı. Anahtar yalnızca x-goog-api-key başlığında gider; günlüğe ve cevaba asla yazılmaz.</summary>
public sealed class GeminiClient(HttpClient http, AiSettings cfg, ILogger<GeminiClient> log)
{
    // Modelden yalnızca bu yapıda cevap istenir (structured output): serbest metin yok, alanlar tipli.
    private const string ResponseSchema = """
    {
      "type": "OBJECT",
      "properties": {
        "reply": { "type": "STRING" },
        "showWrongAnswers": { "type": "BOOLEAN" },
        "wrongAnswersTopic": { "type": "STRING", "nullable": true },
        "plan": {
          "type": "OBJECT", "nullable": true,
          "properties": {
            "title": { "type": "STRING" },
            "days": {
              "type": "ARRAY",
              "items": {
                "type": "OBJECT",
                "properties": {
                  "day": { "type": "STRING" },
                  "tasks": {
                    "type": "ARRAY",
                    "items": {
                      "type": "OBJECT",
                      "properties": {
                        "topic": { "type": "STRING" },
                        "minutes": { "type": "INTEGER" },
                        "what": { "type": "STRING" }
                      },
                      "required": ["topic", "minutes", "what"]
                    }
                  }
                },
                "required": ["day", "tasks"]
              }
            }
          },
          "required": ["title", "days"]
        },
        "practice": {
          "type": "ARRAY",
          "items": {
            "type": "OBJECT",
            "properties": {
              "course": { "type": "STRING" },
              "question": { "type": "STRING" },
              "options": { "type": "ARRAY", "items": { "type": "STRING" } },
              "correctIndex": { "type": "INTEGER" },
              "explanation": { "type": "STRING" }
            },
            "required": ["course", "question", "options", "correctIndex", "explanation"]
          }
        },
        "suggestions": { "type": "ARRAY", "items": { "type": "STRING" } }
      },
      "required": ["reply", "showWrongAnswers", "practice", "suggestions"]
    }
    """;

    private static readonly string[] SafetyCategories =
    [
        "HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH",
        "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT"
    ];

    public async Task<GeminiResult> GenerateAsync(string systemInstruction, IReadOnlyList<GeminiTurn> turns, CancellationToken ct)
    {
        var contents = new JsonArray();
        foreach (var t in turns)
            contents.Add(new JsonObject
            {
                ["role"] = t.Role,
                ["parts"] = new JsonArray(new JsonObject { ["text"] = t.Text })
            });

        var safety = new JsonArray();
        foreach (var c in SafetyCategories)
            safety.Add(new JsonObject { ["category"] = c, ["threshold"] = "BLOCK_MEDIUM_AND_ABOVE" });

        var body = new JsonObject
        {
            ["systemInstruction"] = new JsonObject { ["parts"] = new JsonArray(new JsonObject { ["text"] = systemInstruction }) },
            ["contents"] = contents,
            ["generationConfig"] = new JsonObject
            {
                ["temperature"] = cfg.Temperature,
                ["maxOutputTokens"] = cfg.MaxOutputTokens,
                ["responseMimeType"] = "application/json",
                ["responseSchema"] = JsonNode.Parse(ResponseSchema)
            },
            ["safetySettings"] = safety
        };

        var url = $"{cfg.BaseUrl.TrimEnd('/')}/models/{cfg.Model}:generateContent";
        using var req = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json")
        };
        req.Headers.Add("x-goog-api-key", cfg.ApiKey);

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(cfg.TimeoutSeconds));

            using var res = await http.SendAsync(req, cts.Token);
            var raw = await res.Content.ReadAsStringAsync(cts.Token);

            if (!res.IsSuccessStatusCode)
            {
                // Gövde yalnızca sunucu günlüğüne (kısaltılmış) gider; istemciye asla.
                log.LogWarning("Gemini hata {Status}: {Body}", (int)res.StatusCode, raw.Length > 400 ? raw[..400] : raw);
                return new GeminiResult(null, res.StatusCode == HttpStatusCode.TooManyRequests ? "rate_limited" : "unavailable");
            }

            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            if (root.TryGetProperty("promptFeedback", out var fb) && fb.TryGetProperty("blockReason", out _))
                return new GeminiResult(null, "blocked");

            if (!root.TryGetProperty("candidates", out var cands) || cands.GetArrayLength() == 0)
                return new GeminiResult(null, "blocked");

            var cand = cands[0];
            if (cand.TryGetProperty("finishReason", out var fr) && fr.GetString() is "SAFETY" or "PROHIBITED_CONTENT" or "BLOCKLIST" or "SPII")
                return new GeminiResult(null, "blocked");

            var sb = new StringBuilder();
            if (cand.TryGetProperty("content", out var content) && content.TryGetProperty("parts", out var parts))
                foreach (var p in parts.EnumerateArray())
                    if (p.TryGetProperty("text", out var tx) && tx.ValueKind == JsonValueKind.String)
                        sb.Append(tx.GetString());

            return sb.Length == 0 ? new GeminiResult(null, "unavailable") : new GeminiResult(sb.ToString(), null);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            log.LogWarning("Gemini zaman aşımı ({Seconds} sn)", cfg.TimeoutSeconds);
            return new GeminiResult(null, "unavailable");
        }
        catch (Exception e) when (e is HttpRequestException or JsonException)
        {
            log.LogWarning("Gemini çağrısı başarısız: {Type}", e.GetType().Name);
            return new GeminiResult(null, "unavailable");
        }
    }
}
