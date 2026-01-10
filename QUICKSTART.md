# NFK Quick Start Guide

This guide helps you get started with the NFK Buchhaltung application locally.

## Prerequisites

- .NET 8.0 SDK
- Node.js 20+
- Docker & Docker Compose (for SQL Server, Redis, Azurite)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

The easiest way to run the full stack is using Docker Compose:

```bash
# Start all services (SQL Server, Redis, Azurite, API, Frontend)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger
- **Hangfire Dashboard**: http://localhost:8080/hangfire
- **SQL Server**: localhost:1433 (sa password: SqlServer2025)
- **Redis**: localhost:6379
- **Azurite Blob**: http://localhost:10000

### Option 2: Local Development

#### 1. Start Infrastructure Services

Start SQL Server, Redis, and Azurite using Docker Compose:

```bash
docker-compose up -d sqlserver redis azurite
```

Wait for services to be healthy (check with `docker-compose ps`).

#### 2. Run Backend API

```bash
# Navigate to API project
cd src/NFK.API

# Apply database migrations (first time only)
dotnet ef database update --project ../NFK.Infrastructure

# Run the API
dotnet run
```

The API will start on http://localhost:5199 (or check console output for actual port).

#### 3. Run Frontend

In a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

The frontend will start on http://localhost:5173.

## Database Migration

The initial EF Core migration is already created. To apply it:

```bash
cd /home/runner/work/NFK/NFK
dotnet ef database update --project src/NFK.Infrastructure --startup-project src/NFK.API
```

To create a new migration:

```bash
dotnet ef migrations add MigrationName --project src/NFK.Infrastructure --startup-project src/NFK.API
```

## Configuration

### Backend (appsettings.Development.json)

The `src/NFK.API/appsettings.Development.json` file contains development configuration with placeholders:

- **ConnectionStrings**: SQL Server and Redis connection strings
- **JWT**: Secret key for token generation
- **OAuth**: Google, Apple, and DATEV client IDs and secrets (placeholders)
- **DATEV**: SFTP configuration for DATEV integration (placeholder)
- **Email**: SendGrid API key for email notifications (placeholder)
- **Storage**: Azure Blob Storage connection string (uses Azurite in development)

Update placeholders with real values as needed for your environment.

### Frontend (.env)

Create a `.env` file in the `frontend/` directory based on `.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

Update `VITE_API_URL` if your API runs on a different port:

```env
VITE_API_URL=http://localhost:5199/api/v1
```

## Available Pages

### Public Pages
- **Landing**: http://localhost:5173/ - Main landing page with service overview
- **Login**: http://localhost:5173/auth/login - User login with OAuth options

### Portal Pages (require authentication)
- **Dashboard**: http://localhost:5173/portal/dashboard - General dashboard
- **Client Portal**: http://localhost:5173/portal/client - Client-specific portal with cases and documents
- **Admin Dashboard**: http://localhost:5173/portal/admin - Admin panel with system stats

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user info

### Clients
- `GET /api/v1/clients` - List all clients
- `GET /api/v1/clients/{id}` - Get client by ID
- `POST /api/v1/clients` - Create new client
- `PUT /api/v1/clients/{id}` - Update client
- `DELETE /api/v1/clients/{id}` - Delete client

### Cases
- `GET /api/v1/cases` - List all cases
- `GET /api/v1/cases/{id}` - Get case by ID
- `POST /api/v1/cases` - Create new case
- `PUT /api/v1/cases/{id}/status` - Update case status

### Documents
- `GET /api/v1/documents` - List all documents
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents/{id}/download` - Download document

### DATEV (requires SuperAdmin or DATEVManager role)
- `POST /api/v1/datev/export` - Create DATEV export job
- `GET /api/v1/datev/jobs` - List DATEV jobs
- `POST /api/v1/datev/jobs/{id}/retry` - Retry failed job

### System
- `GET /health` - Health check endpoint

Full API documentation available at: http://localhost:8080/swagger

## Troubleshooting

### SQL Server Connection Issues

If the API can't connect to SQL Server:

1. Ensure SQL Server container is running: `docker-compose ps`
2. Check connection string in `appsettings.Development.json`
3. Wait for SQL Server to be fully started (can take 30-60 seconds)

### Port Already in Use

If you get "address already in use" errors:

- **Backend**: The API tries to use port 5199 by default. Change it in `Properties/launchSettings.json`
- **Frontend**: Vite uses port 5173. Change it with `npm run dev -- --port 3000`

### Migration Errors

If database migration fails:

1. Ensure SQL Server is running
2. Check connection string is correct
3. Manually apply migration: `dotnet ef database update`

## Project Structure

```
NFK/
├── src/
│   ├── NFK.API/              # Web API (Controllers, Program.cs)
│   ├── NFK.Application/      # Business Logic (Services, DTOs)
│   ├── NFK.Domain/           # Domain Entities & Enums
│   ├── NFK.Infrastructure/   # Data Access, Security, DATEV, Storage
│   └── NFK.Shared/           # Shared Utilities
├── frontend/                 # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── public/      # Public pages (Landing)
│   │   │   ├── auth/        # Auth pages (Login)
│   │   │   └── portal/      # Portal pages (Dashboard, Admin, Client)
│   │   └── services/        # API client
│   └── package.json
└── docker-compose.yml       # Docker services configuration
```

## Next Steps

1. Configure OAuth providers (Google, Apple) with real client IDs
2. Set up DATEV SFTP credentials
3. Configure SendGrid for email notifications
4. Implement actual business logic in controllers
5. Add authentication guards to frontend routes
6. Connect frontend pages to backend API

## Support

For issues or questions, refer to the main README.md or contact the development team.
