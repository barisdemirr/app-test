namespace Dersakis.Infrastructure.Services;

public sealed class AgoraSettings
{
    public string AppId { get; init; } = "";
    public string AppCertificate { get; init; } = "";   // yalnızca user-secrets / ortam değişkeni, git'e girmez

    /// <summary>Agora App ID ve Certificate 32 karakterlik hex'tir. Eksik/bozuksa token üretilmez, uygulama yine açılır.</summary>
    public bool IsConfigured => IsHex32(AppId) && IsHex32(AppCertificate);

    private static bool IsHex32(string value) => value.Length == 32 && value.All(Uri.IsHexDigit);
}