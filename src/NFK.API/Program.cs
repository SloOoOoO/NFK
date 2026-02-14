using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using NFK.Infrastructure.Data;
using NFK.Infrastructure.Security;
using NFK.Application.Interfaces;
using NFK.Application.Services;
using NFK.API.Swagger;
using Hangfire;
using Hangfire.Dashboard;
using Hangfire.SqlServer;
using System.Security.Cryptography;
using System.Text;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Prevent circular reference errors
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "NFK Steuerberatung API", Version = "v1" });
    
    // Add support for file upload
    c.OperationFilter<SwaggerFileOperationFilter>();
    
    // Ignore navigation properties that might cause issues
    c.SchemaFilter<IgnoreNavigationPropertiesSchemaFilter>();
});

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Database=NFK;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// Redis Cache
var redisConnection = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisConnection;
});

// JWT Authentication
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "NFK.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "NFK.Client";
var jwtSecret = builder.Configuration["Jwt:Secret"];
// Load JWT keys from environment variables first, fall back to configuration
var jwtPublicKey = Environment.GetEnvironmentVariable("JWT_PUBLIC_KEY") ?? builder.Configuration["Jwt:PublicKey"];
var jwtPrivateKey = Environment.GetEnvironmentVariable("JWT_PRIVATE_KEY") ?? builder.Configuration["Jwt:PrivateKey"];
var accessTokenExpiration = int.Parse(builder.Configuration["Jwt:AccessTokenExpirationMinutes"] ?? "5");
var refreshTokenExpiration = int.Parse(builder.Configuration["Jwt:RefreshTokenExpirationDays"] ?? "7");

// Register JWT Service - use symmetric key if Secret is provided, otherwise use RSA
if (!string.IsNullOrEmpty(jwtSecret))
{
    builder.Services.AddSingleton(sp => 
        new JwtService(jwtIssuer, jwtAudience, jwtSecret, accessTokenExpiration, refreshTokenExpiration));
    
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = key,
                ClockSkew = TimeSpan.Zero
            };
        });
}
else if (!string.IsNullOrEmpty(jwtPublicKey))
{
    if (string.IsNullOrEmpty(jwtPrivateKey))
    {
        throw new InvalidOperationException("JWT_PRIVATE_KEY environment variable or Jwt:PrivateKey configuration must be set when using asymmetric key authentication");
    }
    
    builder.Services.AddSingleton(sp => 
        new JwtService(jwtIssuer, jwtAudience, jwtPrivateKey, jwtPublicKey, accessTokenExpiration, refreshTokenExpiration));
    
    var rsa = RSA.Create();
    rsa.ImportFromPem(jwtPublicKey);
    
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new RsaSecurityKey(rsa),
                ClockSkew = TimeSpan.Zero
            };
        });
}
else
{
    throw new InvalidOperationException("JWT configuration requires either Secret or PublicKey/PrivateKey to be set");
}

builder.Services.AddAuthorization();

// Register application services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddSingleton<PasswordHasher>();
builder.Services.AddScoped<NFK.Infrastructure.Storage.BlobStorageService>();
builder.Services.AddScoped<NFK.Infrastructure.Security.EncryptionService>();
builder.Services.AddScoped<NFK.Infrastructure.Caching.CacheService>();

// OAuth services - conditionally register based on configuration
// Google OAuth
var googleClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID") 
    ?? builder.Configuration["OAuth:Google:ClientId"];
var googleClientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET") 
    ?? builder.Configuration["OAuth:Google:ClientSecret"];
var googleEnabledStr = Environment.GetEnvironmentVariable("GOOGLE_OAUTH_ENABLED") 
    ?? builder.Configuration["OAuth:Google:Enabled"] ?? "false";
var googleEnabled = bool.TryParse(googleEnabledStr, out var googleEnabledParsed) && googleEnabledParsed;

if (googleEnabled && !string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
{
    builder.Services.AddHttpClient<NFK.Application.Services.OAuth.GoogleOAuthService>();
    builder.Services.AddScoped<IGoogleOAuthService, NFK.Application.Services.OAuth.GoogleOAuthService>();
    Log.Information("Google OAuth service registered");
}
else
{
    Log.Information("Google OAuth service not registered - disabled or missing configuration");
}

// DATEV OAuth
var datevClientId = Environment.GetEnvironmentVariable("DATEV_CLIENT_ID") 
    ?? builder.Configuration["OAuth:DATEV:ClientId"];
var datevClientSecret = Environment.GetEnvironmentVariable("DATEV_CLIENT_SECRET") 
    ?? builder.Configuration["OAuth:DATEV:ClientSecret"];
var datevEnabledStr = Environment.GetEnvironmentVariable("DATEV_OAUTH_ENABLED") 
    ?? builder.Configuration["OAuth:DATEV:Enabled"] ?? "false";
var datevEnabled = bool.TryParse(datevEnabledStr, out var datevEnabledParsed) && datevEnabledParsed;

if (datevEnabled && !string.IsNullOrWhiteSpace(datevClientId) && !string.IsNullOrWhiteSpace(datevClientSecret))
{
    builder.Services.AddHttpClient<NFK.Application.Services.OAuth.DATEVOAuthService>();
    builder.Services.AddScoped<IDATEVOAuthService, NFK.Application.Services.OAuth.DATEVOAuthService>();
    Log.Information("DATEV OAuth service registered");
}
else
{
    Log.Information("DATEV OAuth service not registered - disabled or missing configuration");
}

// Hangfire
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true
    }));

builder.Services.AddHangfireServer();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Response compression for performance
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

var app = builder.Build();

// Run migrations and seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();
        var passwordHasher = services.GetRequiredService<PasswordHasher>();
        
        logger.LogInformation("Running database migrations...");
        await context.Database.MigrateAsync();
        
        logger.LogInformation("Seeding database...");
        await DatabaseSeeder.SeedAsync(context, passwordHasher);
        
        logger.LogInformation("Database initialization completed successfully");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating or seeding the database");
        throw;
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "NFK API v1"));
}

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
    
    // CSP - allow localhost connections only in development
    var cspConnectSrc = app.Environment.IsDevelopment() 
        ? "'self' http://localhost:8080 https://api.nfk-buchhaltung.de" 
        : "'self' https://api.nfk-buchhaltung.de";
    context.Response.Headers["Content-Security-Policy"] = $"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src {cspConnectSrc}";
    
    await next();
});

app.UseSerilogRequestLogging();
app.UseResponseCompression();
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseMiddleware<NFK.Infrastructure.Middleware.RateLimitingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Hangfire Dashboard
app.MapHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthorizationFilter() }
});

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

await app.RunAsync();

public class HangfireAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        
        // Require authentication and SuperAdmin or DATEVManager role
        return httpContext.User?.Identity?.IsAuthenticated == true &&
               (httpContext.User.IsInRole("SuperAdmin") || httpContext.User.IsInRole("DATEVManager"));
    }
}
