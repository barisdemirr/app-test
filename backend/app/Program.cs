using System.Net;
using System.Text;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Infrastructure.Services.Push;
using Dersakis.Shared;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddSingleton(TimeProvider.System);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default"), sql =>
    {
        sql.UseCompatibilityLevel(150); // SQL Server 2019
        // 1205 = deadlock victim: EF isteği otomatik tekrar dener.
        sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(4), errorNumbersToAdd: [1205]);
    }));

// --- Ayarlar: hatalıysa uygulama hiç açılmaz ---
var jwt = (builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings()).EnsureValid();
builder.Services.AddSingleton(jwt);
builder.Services.AddSingleton((builder.Configuration.GetSection("Credits").Get<CreditSettings>() ?? new CreditSettings()).EnsureValid());
builder.Services.AddSingleton((builder.Configuration.GetSection("Videos").Get<VideoSettings>() ?? new VideoSettings()).EnsureValid());
builder.Services.AddSingleton((builder.Configuration.GetSection("Watch").Get<WatchSettings>() ?? new WatchSettings()).EnsureValid());
builder.Services.AddSingleton((builder.Configuration.GetSection("Qa").Get<QaSettings>() ?? new QaSettings()).EnsureValid());
builder.Services.AddSingleton((builder.Configuration.GetSection("Otp").Get<OtpSettings>() ?? new OtpSettings()).EnsureValid());
builder.Services.AddSingleton((builder.Configuration.GetSection("Referral").Get<ReferralSettings>() ?? new ReferralSettings()).EnsureValid());

// --- Auth ---
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<PasswordService>();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false; // "sub" claim'i olduğu gibi kalsın
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256], // algoritma karıştırma saldırısına karşı
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

// --- Rate limit, proxy, CORS ---
builder.Services.AddAppRateLimiting(builder.Configuration);
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    foreach (var ip in builder.Configuration.GetSection("Proxy:KnownProxies").Get<string[]>() ?? [])
        o.KnownProxies.Add(IPAddress.Parse(ip));
});
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
{
    if (corsOrigins.Length > 0)
        p.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod()
         .WithExposedHeaders("Idempotent-Replayed", "Retry-After");
}));

// --- Servisler ---
var smsProvider = builder.Configuration["Sms:Provider"] ?? "console";
if (smsProvider != "console")
    throw new InvalidOperationException($"Sms:Provider '{smsProvider}' desteklenmiyor. Şimdilik yalnızca 'console'.");
builder.Services.AddSingleton<ISmsSender, ConsoleSmsSender>();
builder.Services.AddSingleton<VideoStorage>();
builder.Services.AddScoped<CreditService>();
builder.Services.AddScoped<OtpService>();
builder.Services.AddScoped<QaAwardService>();
builder.Services.AddScoped<QaRefundService>();

// --- Arka plan servisleri ---
builder.Services.AddHostedService<IdempotencyCleanupService>();
builder.Services.AddHostedService<VideoDraftCleanupService>();
builder.Services.AddHostedService<WatchSessionCleanupService>();
builder.Services.AddHostedService<PhoneVerificationCleanupService>();
builder.Services.AddHostedService<QaAutoAwardService>();

builder.Services.AddEndpoints(typeof(Program).Assembly);

builder.Services.AddSingleton((builder.Configuration.GetSection("Rewards").Get<RewardSettings>() ?? new RewardSettings()).EnsureValid());

builder.Services.AddSingleton((builder.Configuration.GetSection("Profile").Get<ProfileSettings>() ?? new ProfileSettings()).EnsureValid());
builder.Services.AddSingleton<AvatarStorage>();

builder.Services.AddSingleton((builder.Configuration.GetSection("Live").Get<LiveSettings>() ?? new LiveSettings()).EnsureValid());
builder.Services.AddSingleton(builder.Configuration.GetSection("Agora").Get<AgoraSettings>() ?? new AgoraSettings());

builder.Services.AddSingleton((builder.Configuration.GetSection("Push").Get<PushSettings>() ?? new PushSettings()).EnsureValid());
builder.Services.AddHttpClient<IPushSender, ExpoPushSender>(c => c.Timeout = TimeSpan.FromSeconds(10));
builder.Services.AddHostedService<PushDispatchService>();


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    if (AgoraRtcToken.SelfCheck()) app.Logger.LogInformation("Agora token self-check: OK");
    else app.Logger.LogError("Agora token self-check: BAŞARISIZ. Token kodu resmi algoritmayla uyuşmuyor.");
}

app.UseForwardedHeaders();
app.UseExceptionHandler();
if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.UseHttpsRedirection();

app.UseCors();
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.UseIdempotencyBuffering();

var api = app.MapGroup("/api/v1");
app.MapEndpoints(api);

app.Run();