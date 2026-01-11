# .NET 8.0 Migration Guide

## Overview

This document provides instructions for running NFK application with .NET 8.0, including database migrations and application startup.

## Prerequisites

- .NET 8.0 SDK installed
- SQL Server (via Docker or local instance)
- Redis (via Docker or local instance)

## Project Configuration

All projects in the NFK solution are configured to target .NET 8.0:

- `NFK.API` → net8.0
- `NFK.Application` → net8.0
- `NFK.Infrastructure` → net8.0
- `NFK.Domain` → net8.0
- `NFK.Shared` → net8.0

### Package References

The following packages have been configured to support the application requirements:

**Infrastructure Layer:**
- `SSH.NET` 2024.1.0 (provides `Renci.SshNet` namespace for DATEV SFTP integration)
- `Konscious.Security.Cryptography.Argon2` 1.3.1 (for password hashing)
- `Microsoft.EntityFrameworkCore.SqlServer` 8.0.0
- `Microsoft.EntityFrameworkCore.Design` 8.0.0

**Application Layer:**
- `Microsoft.EntityFrameworkCore` 8.0.0
- `Microsoft.Extensions.Logging.Abstractions` 8.0.0
- `Microsoft.AspNetCore.Http.Abstractions` 2.2.0
- `Microsoft.Extensions.Configuration.Abstractions` (available as transitive dependency)

**API Layer:**
- `Microsoft.AspNetCore.Authentication.JwtBearer` 8.0.0
- `Microsoft.EntityFrameworkCore.Design` 8.0.0

## Building the Solution

### 1. Restore NuGet Packages

```bash
cd /path/to/NFK
dotnet restore
```

Expected output:
```
Determining projects to restore...
  Restored /path/to/NFK/src/NFK.Shared/NFK.Shared.csproj
  Restored /path/to/NFK/src/NFK.Domain/NFK.Domain.csproj
  Restored /path/to/NFK/src/NFK.Infrastructure/NFK.Infrastructure.csproj
  Restored /path/to/NFK/src/NFK.Application/NFK.Application.csproj
  Restored /path/to/NFK/src/NFK.API/NFK.API.csproj
```

### 2. Build the Solution

```bash
dotnet build
```

Expected output:
```
Build succeeded.
    0 Error(s)
```

## Database Setup and Migrations

### 1. Start SQL Server

Using Docker Compose:

```bash
docker-compose up -d sqlserver
```

Or manually with Docker:

```bash
docker run -d \
  --name nfk-sqlserver \
  -e "ACCEPT_EULA=Y" \
  -e "SA_PASSWORD=YourStrong!Passw0rd" \
  -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest
```

### 2. Install EF Core Tools

If not already installed:

```bash
dotnet tool install --global dotnet-ef --version 8.*
```

Or update existing installation:

```bash
dotnet tool update --global dotnet-ef --version 8.*
```

Verify installation:

```bash
dotnet ef --version
```

Expected output: `Entity Framework Core .NET Command-line Tools 8.0.x`

### 3. List Existing Migrations

```bash
cd /path/to/NFK
dotnet ef migrations list \
  --project src/NFK.Infrastructure/NFK.Infrastructure.csproj \
  --startup-project src/NFK.API/NFK.API.csproj
```

Expected output:
```
Build started...
Build succeeded.
20260110233032_InitialCreate
```

### 4. Apply Database Migrations

```bash
dotnet ef database update \
  --project src/NFK.Infrastructure/NFK.Infrastructure.csproj \
  --startup-project src/NFK.API/NFK.API.csproj
```

Expected output:
```
Build started...
Build succeeded.
Applying migration '20260110233032_InitialCreate'.
Done.
```

### 5. Verify Database Schema

Connect to SQL Server and verify tables were created:

```bash
# Using sqlcmd (if installed)
sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -d NFK -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES"
```

## Running the Application

### Option 1: Using Docker Compose (Recommended)

Start all services:

```bash
docker-compose up -d
```

This will start:
- SQL Server on port 1433
- Redis on port 6379
- Azurite (blob storage) on port 10000
- API on port 8080
- Frontend on port 5173

Access the application:
- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger
- Hangfire Dashboard: http://localhost:8080/hangfire

### Option 2: Local Development

#### 1. Start Infrastructure Services

```bash
docker-compose up -d sqlserver redis azurite
```

#### 2. Configure Connection String

Edit `src/NFK.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=NFK;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;MultipleActiveResultSets=true",
    "Redis": "localhost:6379"
  }
}
```

#### 3. Run the API

```bash
cd src/NFK.API
dotnet run
```

Expected output:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5199
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

The API will be available at the URL shown in the console (typically http://localhost:5199).

## Creating New Migrations

When you make changes to entity models:

```bash
dotnet ef migrations add YourMigrationName \
  --project src/NFK.Infrastructure/NFK.Infrastructure.csproj \
  --startup-project src/NFK.API/NFK.API.csproj
```

Then apply the migration:

```bash
dotnet ef database update \
  --project src/NFK.Infrastructure/NFK.Infrastructure.csproj \
  --startup-project src/NFK.API/NFK.API.csproj
```

## Reverting Migrations

To revert to a specific migration:

```bash
dotnet ef database update PreviousMigrationName \
  --project src/NFK.Infrastructure/NFK.Infrastructure.csproj \
  --startup-project src/NFK.API/NFK.API.csproj
```

To revert all migrations:

```bash
dotnet ef database update 0 \
  --project src/NFK.Infrastructure/NFK.Infrastructure.csproj \
  --startup-project src/NFK.API/NFK.API.csproj
```

## Troubleshooting

### Build Errors

**Error: SDK not found**
```
Solution: Install .NET 8.0 SDK from https://dotnet.microsoft.com/download/dotnet/8.0
```

**Error: Package restore failed**
```bash
Solution: Clear NuGet cache and restore
dotnet nuget locals all --clear
dotnet restore
```

### Migration Errors

**Error: Could not connect to SQL Server**
```
Solution: 
1. Verify SQL Server is running: docker ps
2. Check connection string in appsettings.Development.json
3. Ensure firewall allows port 1433
```

**Error: Database already exists**
```bash
Solution: Drop and recreate the database
dotnet ef database drop --force \
  --project src/NFK.Infrastructure/NFK.Infrastructure.csproj \
  --startup-project src/NFK.API/NFK.API.csproj

dotnet ef database update \
  --project src/NFK.Infrastructure/NFK.Infrastructure.csproj \
  --startup-project src/NFK.API/NFK.API.csproj
```

**Error: EF Core tools version mismatch**
```bash
Solution: Ensure EF Core tools version matches project packages (8.0.x)
dotnet tool update --global dotnet-ef --version 8.*
```

### Runtime Errors

**Error: Redis connection failed**
```
Solution: Start Redis container
docker-compose up -d redis
```

**Error: JWT validation failed**
```
Solution: Ensure public.pem and private.pem files exist in project root
```

## Verification Steps

### 1. Verify Build

```bash
dotnet build
# Should complete with "Build succeeded. 0 Error(s)"
```

### 2. Verify Migrations

```bash
dotnet ef migrations list \
  --project src/NFK.Infrastructure/NFK.Infrastructure.csproj \
  --startup-project src/NFK.API/NFK.API.csproj
# Should list: 20260110233032_InitialCreate
```

### 3. Verify Database

After applying migrations, connect to database and verify tables exist:
- Users
- Clients
- Cases
- Documents
- AspNetRoles
- AspNetUsers
- etc.

### 4. Verify API Endpoints

Once the API is running, access Swagger UI:
```
http://localhost:8080/swagger
```

Verify endpoints are accessible:
- `/api/v1/auth/register`
- `/api/v1/clients`
- `/api/v1/cases`
- `/api/v1/documents`
- `/api/v1/datev/export`

### 5. Health Check

```bash
curl http://localhost:8080/health
# Should return: Healthy
```

## Production Deployment

For production deployment with .NET 8.0:

1. Build in Release mode:
```bash
dotnet publish src/NFK.API/NFK.API.csproj -c Release -o ./publish
```

2. Run migrations in production:
```bash
dotnet ef database update \
  --project src/NFK.Infrastructure/NFK.Infrastructure.csproj \
  --startup-project src/NFK.API/NFK.API.csproj \
  --configuration Release
```

3. Start the application:
```bash
cd publish
dotnet NFK.API.dll
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

## Additional Resources

- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)
- [.NET 8.0 Documentation](https://docs.microsoft.com/en-us/dotnet/core/whats-new/dotnet-8)
- [ASP.NET Core 8.0 Documentation](https://docs.microsoft.com/en-us/aspnet/core/)

## Summary

All NFK projects are configured to target .NET 8.0 with the following verified:
- ✅ All .csproj files target net8.0
- ✅ All required NuGet packages installed
- ✅ Project references properly configured
- ✅ `dotnet restore` succeeds
- ✅ `dotnet build` succeeds
- ✅ EF Core migrations work correctly
- ✅ Application runs on .NET 8.0 runtime

The solution is ready for development and deployment with .NET 8.0.
