using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NFK.Infrastructure.Data;
using NFK.Infrastructure.Security;
using NFK.Application.Interfaces;
using NFK.Application.Services;
using Hangfire;
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
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "NFK Steuerberatung API", Version = "v1" });
    
    // Add JWT Bearer authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below."
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
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
var jwtPublicKey = builder.Configuration["Jwt:PublicKey"];
var accessTokenExpiration = int.Parse(builder.Configuration["Jwt:AccessTokenExpirationMinutes"] ?? "15");
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
    var jwtPrivateKey = builder.Configuration["Jwt:PrivateKey"] ?? GenerateTempRsaKey();
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
builder.Services.AddSingleton<PasswordHasher>();
builder.Services.AddScoped<NFK.Infrastructure.Storage.BlobStorageService>();

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

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "NFK API v1"));
}

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    context.Response.Headers.Add("Content-Security-Policy", "default-src 'self'");
    await next();
});

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
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

app.Run();

static string GenerateTempRsaKey()
{
    using var rsa = RSA.Create(2048);
    return rsa.ExportRSAPublicKeyPem();
}

public class HangfireAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        // WARNING: This allows unrestricted access to Hangfire dashboard in development
        // In production, implement proper authentication:
        // 1. Check if user is authenticated
        // 2. Verify user has SuperAdmin or DATEVManager role
        // 3. Use context properties to access request information
        // Example for ASP.NET Core:
        // var httpContext = context.GetHttpContext();
        // return httpContext.User.Identity?.IsAuthenticated == true &&
        //        (httpContext.User.IsInRole("SuperAdmin") || httpContext.User.IsInRole("DATEVManager"));
        
        // TODO: Implement proper role-based authorization before deploying to production
        return false; // Deny access by default for security
    }
}
