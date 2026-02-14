# NFK Buchhaltung

German Tax Consulting Platform for Süheyl Faruk Kataş (nfk-buchhaltung.de)

## Overview

Secure, scalable Steuerberatung platform featuring:
- 🔐 Enterprise-grade security (JWT RS256, Argon2id, TDE, GDPR compliant)
- 📁 Client Portal with Dossier/Case Tracking System
- 🔄 DATEV Integration (EXTF CSV, dxso XML batch processing)
- 👥 Multi-role Access Control (RBAC with 5 roles)
- 📱 Modern, responsive design (WCAG 2.1 AA)
- 🔔 Real-time notifications
- 📄 Document management with versioning
- 📊 Comprehensive audit logging

## Services
- **Steuerberatung** (Tax Consulting)
- **Buchhaltung** (Accounting)
- **Lohnabrechnungen** (Payroll)
- **Unternehmensberatung** (Business Consulting)

## Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **ORM**: Entity Framework Core 8
- **Database**: Microsoft SQL Server 2022
- **Cache**: Redis 7
- **Background Jobs**: Hangfire
- **Authentication**: JWT with RS256
- **Password Hashing**: Argon2id
- **Logging**: Serilog
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack)
- **Routing**: React Router v6
- **HTTP Client**: Axios

## Quick Start

### Prerequisites
- Docker & Docker Compose
- .NET 8.0 SDK (for local development)
- Node.js 20+ (for frontend development)

### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/SloOoOoO/NFK.git
cd NFK

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Services will be available at:**
- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger
- Frontend: http://localhost:5173
- Hangfire Dashboard: http://localhost:8080/hangfire

### Local Development

#### Backend

```bash
# Navigate to API project
cd src/NFK.API

# Restore dependencies
dotnet restore

# Update database
dotnet ef database update

# Run application
dotnet run
```

#### Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Project Structure

```
NFK/
├── src/
│   ├── NFK.API/              # Web API (Controllers, Middleware)
│   ├── NFK.Application/      # Business Logic (Services, DTOs)
│   ├── NFK.Domain/           # Domain Entities & Enums
│   ├── NFK.Infrastructure/   # Data Access, Auth, DATEV
│   └── NFK.Shared/           # Shared Utilities
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── stores/           # State management
│   │   └── services/         # API services
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # Architecture overview
│   ├── API.md                # API documentation
│   ├── SECURITY.md           # Security practices
│   ├── DATEV.md              # DATEV integration guide
│   └── DEPLOYMENT.md         # Deployment guide
├── docker-compose.yml        # Docker services
└── README.md
```

## Features

### Authentication & Authorization
- ✅ JWT-based authentication (RS256, 15min access, 7 day refresh)
- ✅ OAuth2/OIDC integration (Google, DATEV)
- ✅ SSO with registration continuation flow
- ✅ Role-Based Access Control (7 roles)
- ✅ Account lockout after 5 failed attempts
- ✅ Session management
- ✅ Password reset flow

### User Roles
1. **SuperAdmin** - Full system access, all admin functions
2. **Admin** - General admin role, user management
3. **Consultant** - Client and case management (Tax Consultant / Steuerberater)
4. **Receptionist** - Scheduling and basic client info
5. **Client** - Own dossier and documents
6. **DATEVManager** - DATEV export management

**Admin Access:** SuperAdmin, Admin, and Consultant roles have access to admin dashboard and can view full user details.

**Note:** "Steuerberater" is the German term for tax consultant and is equivalent to the "Consultant" role in the system.

### Client Management
- ✅ Client CRUD operations
- ✅ Case tracking with status workflow
- ✅ Document management
- ✅ Case notes and history
- ✅ Timeline view
- ✅ **Dual Tax ID System**:
  - **Steuer-ID** (11-digit personal tax identifier) - Required for all users
  - **Steuernummer** (business tax number) - Optional for businesses
  - Both fields are separately tracked and displayed in user profiles

### Document Management
- ✅ Upload/download documents
- ✅ Folder organization
- ✅ Version control
- ✅ Comments and annotations
- ✅ Access control

### DATEV Integration
- ✅ EXTF CSV export (Rechnungswesen)
- ✅ dxso XML export (Unternehmen online)
- ✅ Background job processing
- ✅ SFTP file transfer
- ✅ Validation and error handling
- ✅ Job monitoring and retry

### Security
- ✅ TLS/HTTPS encryption
- ✅ JWT with RS256 algorithm
- ✅ Argon2id password hashing
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Rate limiting
- ✅ CSRF protection
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Audit logging
- ✅ GDPR compliance

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Clients
- `GET /api/v1/clients` - List clients
- `GET /api/v1/clients/{id}` - Get client
- `POST /api/v1/clients` - Create client
- `PUT /api/v1/clients/{id}` - Update client
- `DELETE /api/v1/clients/{id}` - Delete client

### Cases
- `GET /api/v1/cases` - List cases
- `GET /api/v1/cases/{id}` - Get case
- `POST /api/v1/cases` - Create case
- `PUT /api/v1/cases/{id}/status` - Update status

### Documents
- `GET /api/v1/documents` - List documents
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents/{id}/download` - Download

### DATEV
- `POST /api/v1/datev/export` - Create export job
- `GET /api/v1/datev/jobs` - List jobs
- `POST /api/v1/datev/jobs/{id}/retry` - Retry failed job

See [API.md](docs/API.md) for complete documentation.

## Configuration

### Environment Variables

Create `.env` file:

```bash
# Database
SQL_SERVER_PASSWORD=YourStrong!Passw0rd

# JWT Authentication
JWT_PRIVATE_KEY=your_private_key
JWT_PUBLIC_KEY=your_public_key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_ENABLED=true

# DATEV OAuth (optional)
DATEV_CLIENT_ID=your_datev_client_id
DATEV_CLIENT_SECRET=your_datev_client_secret
DATEV_OAUTH_ENABLED=false

# DATEV SFTP
DATEV_SFTP_HOST=sftp.datev.de

# Email
SENDGRID_API_KEY=your_sendgrid_key
```

### OAuth Setup

#### Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URIs:
   - Development: `http://localhost:8080/api/v1/auth/google/callback`
   - Production: `https://your-domain.com/api/v1/auth/google/callback`
6. Copy Client ID and Client Secret to `appsettings.json`:

```json
{
  "OAuth": {
    "Google": {
      "ClientId": "your-client-id.apps.googleusercontent.com",
      "ClientSecret": "your-client-secret",
      "Enabled": true
    }
  }
}
```

**Registration Flow with Google:**
- User clicks "Sign in with Google" on registration page
- After Google authentication, user is redirected to registration form
- Email is pre-filled and locked (greyed out, not editable)
- User completes remaining required fields (name, address, tax ID, etc.)

#### DATEV OAuth Configuration

1. Contact DATEV to obtain OAuth credentials for your tax consulting firm
2. Register your application with DATEV
3. Add authorized redirect URIs:
   - Development: `http://localhost:8080/api/v1/auth/datev/callback`
   - Production: `https://your-domain.com/api/v1/auth/datev/callback`
4. Update `appsettings.json`:

```json
{
  "OAuth": {
    "DATEV": {
      "ClientId": "your-datev-client-id",
      "ClientSecret": "your-datev-client-secret",
      "AuthorizationEndpoint": "https://login.datev.de/openid/authorize",
      "TokenEndpoint": "https://login.datev.de/openid/token",
      "UserInfoEndpoint": "https://login.datev.de/openid/userinfo",
      "Scope": "openid profile email datev:accounting",
      "Enabled": true
    }
  }
}
```

**Registration Flow with DATEV:**
- User clicks "Sign in with DATEV" on registration page
- After DATEV authentication, user is redirected to registration form
- First name and last name are pre-filled and locked (greyed out, not editable)
- User completes remaining required fields (email, address, tax ID, etc.)
- DATEV users are typically assigned "Consultant" or "Steuerberater" role

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed configuration.

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Security Practices](docs/SECURITY.md)
- [DATEV Integration](docs/DATEV.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Development

### Running Tests

```bash
# Backend tests
dotnet test

# Frontend tests
cd frontend
npm test
```

### Database Migrations

```bash
# Create migration
dotnet ef migrations add MigrationName -p src/NFK.Infrastructure -s src/NFK.API

# Apply migration
dotnet ef database update -p src/NFK.Infrastructure -s src/NFK.API
```

### Code Quality

```bash
# Format code
dotnet format

# Lint frontend
cd frontend
npm run lint
```

## Contributing

This is a proprietary project. Contributions are managed internally.

## Support

- **Email**: info@nfk-buchhaltung.de
- **Website**: https://nfk-buchhaltung.de
- **Security Issues**: security@nfk-buchhaltung.de

## License

Proprietary - All Rights Reserved © 2024 Süheyl Faruk Kataş

## Status

✅ **Production Ready** - Core features implemented and tested