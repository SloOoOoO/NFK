# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- .NET 8.0 SDK (for local development)
- Node.js 20+ (for frontend development)
- SQL Server 2022
- Redis 7+

## Environment Setup

### 1. Generate RSA Keys for JWT

```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate public key
openssl rsa -in private.key -pubout -out public.key

# Convert to PEM format (if needed)
cat private.key
cat public.key
```

### 2. Configure Environment Variables

**⚠️ SECURITY WARNING:** Never commit secrets to version control!

Create `.env` file in the root directory (copy from `.env.example`):

```bash
# Database
SQL_SERVER_PASSWORD=YourStrong!Passw0rd

# JWT Keys
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_ENABLED=true

# DATEV OAuth
DATEV_CLIENT_ID=your-datev-client-id
DATEV_CLIENT_SECRET=your-datev-client-secret
DATEV_OAUTH_ENABLED=true

# DATEV SFTP
DATEV_SFTP_HOST=sftp.datev.de
DATEV_SFTP_USERNAME=your_username
DATEV_SFTP_PASSWORD=your_password

# Email
SENDGRID_API_KEY=your_sendgrid_api_key

# Azure Storage (optional)
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
```

**Important Security Notes:**
- The `.env` file is in `.gitignore` and will never be committed
- Use `.env.example` as a template
- In production, use secret management services (Azure Key Vault, AWS Secrets Manager)
- Rotate secrets regularly (every 90 days recommended)

### 3. Update Configuration Files

**Backend** (`src/NFK.API/appsettings.Production.json`):

**⚠️ Note:** This file should NOT contain secrets. Environment variables take precedence.

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver;Database=NFK;User Id=sa;Password=${SQL_SERVER_PASSWORD};TrustServerCertificate=True;MultipleActiveResultSets=true",
    "Redis": "redis:6379"
  },
  "Jwt": {
    "PrivateKey": "",
    "PublicKey": ""
  },
  "OAuth": {
    "Google": {
      "ClientId": "",
      "ClientSecret": "",
      "Enabled": false
    },
    "DATEV": {
      "ClientId": "",
      "ClientSecret": "",
      "Enabled": false
    }
  }
}
```

**Frontend** (`frontend/.env.production`):
```
VITE_API_URL=https://api.nfk-buchhaltung.de/api/v1
```

## Docker Deployment

### 1. Build Images

```bash
# Build all services
docker-compose build

# Or build individually
docker-compose build api
docker-compose build frontend
```

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
docker-compose logs -f frontend
```

### 3. Initialize Database

```bash
# Run migrations
docker-compose exec api dotnet ef database update

# Seed initial data (optional)
docker-compose exec api dotnet run --seed
```

### 4. Verify Deployment

- API Health Check: http://localhost:8080/health
- Swagger UI: http://localhost:8080/swagger
- Frontend: http://localhost:5173
- Hangfire Dashboard: http://localhost:8080/hangfire

## Production Deployment

### Azure App Service

#### 1. Create Resources

```bash
# Create resource group
az group create --name nfk-rg --location westeurope

# Create App Service plan
az appservice plan create \
  --name nfk-plan \
  --resource-group nfk-rg \
  --sku P1V2 \
  --is-linux

# Create Web App for API
az webapp create \
  --name nfk-api \
  --resource-group nfk-rg \
  --plan nfk-plan \
  --runtime "DOTNETCORE:8.0"

# Create Static Web App for Frontend
az staticwebapp create \
  --name nfk-frontend \
  --resource-group nfk-rg \
  --location westeurope
```

#### 2. Configure App Settings

```bash
# Set connection strings
az webapp config connection-string set \
  --name nfk-api \
  --resource-group nfk-rg \
  --connection-string-type SQLAzure \
  --settings DefaultConnection="Server=..."

# Set app settings
az webapp config appsettings set \
  --name nfk-api \
  --resource-group nfk-rg \
  --settings Jwt__PrivateKey="..." Jwt__PublicKey="..."
```

#### 3. Deploy Application

```bash
# API deployment
cd src/NFK.API
dotnet publish -c Release -o ./publish
az webapp deploy \
  --name nfk-api \
  --resource-group nfk-rg \
  --src-path ./publish.zip \
  --type zip

# Frontend deployment
cd frontend
npm run build
az staticwebapp deploy \
  --name nfk-frontend \
  --resource-group nfk-rg \
  --app-location ./dist
```

### Database Configuration

#### SQL Server

```sql
-- Create database
CREATE DATABASE NFK;
GO

-- Enable TDE
USE master;
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'StrongPassword!';
CREATE CERTIFICATE TDECert WITH SUBJECT = 'TDE Certificate';
USE NFK;
CREATE DATABASE ENCRYPTION KEY
WITH ALGORITHM = AES_256
ENCRYPTION BY SERVER CERTIFICATE TDECert;
ALTER DATABASE NFK SET ENCRYPTION ON;
GO

-- Create user
CREATE LOGIN nfkuser WITH PASSWORD = 'SecurePassword!';
USE NFK;
CREATE USER nfkuser FOR LOGIN nfkuser;
ALTER ROLE db_owner ADD MEMBER nfkuser;
GO
```

#### Redis

```bash
# Redis configuration
# Set maxmemory policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET maxmemory 512mb

# Enable persistence
redis-cli CONFIG SET save "900 1 300 10 60 10000"

# Set password (if needed)
redis-cli CONFIG SET requirepass "YourRedisPassword"
```

### SSL/TLS Configuration

#### Let's Encrypt Certificate

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d api.nfk-buchhaltung.de

# Certificate files
# /etc/letsencrypt/live/api.nfk-buchhaltung.de/fullchain.pem
# /etc/letsencrypt/live/api.nfk-buchhaltung.de/privkey.pem
```

#### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name api.nfk-buchhaltung.de;

    ssl_certificate /etc/letsencrypt/live/api.nfk-buchhaltung.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.nfk-buchhaltung.de/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Backup Strategy

### Database Backup

```sql
-- Full backup
BACKUP DATABASE NFK
TO DISK = '/var/opt/mssql/backup/NFK_Full.bak'
WITH FORMAT, COMPRESSION;

-- Differential backup
BACKUP DATABASE NFK
TO DISK = '/var/opt/mssql/backup/NFK_Diff.bak'
WITH DIFFERENTIAL, COMPRESSION;

-- Transaction log backup
BACKUP LOG NFK
TO DISK = '/var/opt/mssql/backup/NFK_Log.trn'
WITH COMPRESSION;
```

### Automated Backup Script

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
docker-compose exec -T sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "$SQL_SERVER_PASSWORD" \
  -Q "BACKUP DATABASE NFK TO DISK = N'/var/opt/mssql/backup/NFK_$DATE.bak' WITH COMPRESSION"

# Copy to backup location
docker cp nfk-sqlserver:/var/opt/mssql/backup/NFK_$DATE.bak $BACKUP_DIR/

# Upload to Azure Blob Storage (optional)
az storage blob upload \
  --account-name nfkbackups \
  --container-name database \
  --name NFK_$DATE.bak \
  --file $BACKUP_DIR/NFK_$DATE.bak

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "NFK_*.bak" -mtime +30 -delete
```

## Monitoring

### Application Monitoring

```bash
# Docker stats
docker stats nfk-api nfk-frontend nfk-sqlserver nfk-redis

# Application logs
docker-compose logs -f --tail=100 api

# Health check script
curl http://localhost:8080/health
```

### Azure Application Insights

```csharp
// Add to Program.cs
builder.Services.AddApplicationInsightsTelemetry(
    builder.Configuration["ApplicationInsights:ConnectionString"]);
```

## Scaling

### Horizontal Scaling

```bash
# Scale API instances
docker-compose up -d --scale api=3

# Load balancer (nginx)
upstream api_backend {
    server api-1:8080;
    server api-2:8080;
    server api-3:8080;
}
```

### Database Scaling

- **Read Replicas**: For read-heavy workloads
- **Sharding**: By client ID for multi-tenant
- **Connection Pooling**: Configure in connection string

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check SQL Server is running
docker-compose ps sqlserver

# Test connection
docker-compose exec sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "$SQL_SERVER_PASSWORD" -Q "SELECT @@VERSION"
```

**2. Redis Connection Failed**
```bash
# Check Redis
docker-compose exec redis redis-cli ping

# Check configuration
docker-compose exec api cat /app/appsettings.json | grep Redis
```

**3. Frontend Not Loading**
```bash
# Check logs
docker-compose logs frontend

# Rebuild frontend
cd frontend && npm run build
```

## Rollback Procedure

```bash
# 1. Stop current version
docker-compose down

# 2. Restore database backup
docker-compose exec sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "$SQL_SERVER_PASSWORD" \
  -Q "RESTORE DATABASE NFK FROM DISK = N'/var/opt/mssql/backup/NFK_Previous.bak' WITH REPLACE"

# 3. Deploy previous version
git checkout previous-release
docker-compose up -d

# 4. Verify
curl http://localhost:8080/health
```

## Maintenance

### Regular Tasks

- **Daily**: Monitor logs and errors
- **Weekly**: Check disk space and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Full security audit and penetration testing

### Update Procedure

```bash
# 1. Backup current state
./scripts/backup.sh

# 2. Pull latest changes
git pull origin main

# 3. Build new images
docker-compose build

# 4. Run database migrations
docker-compose run --rm api dotnet ef database update

# 5. Deploy with zero downtime
docker-compose up -d --no-deps api
docker-compose up -d --no-deps frontend

# 6. Verify
curl http://localhost:8080/health
```
