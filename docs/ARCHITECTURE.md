# NFK Steuerberatung Platform - Architecture

## Overview

The NFK platform is built using a modern, layered architecture following Clean Architecture principles and Domain-Driven Design (DDD).

## Backend Architecture

### Layers

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│              (NFK.API)                  │
│  Controllers, Middleware, Configuration │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Application Layer              │
│          (NFK.Application)              │
│   Services, DTOs, Validators, Mappings  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            Domain Layer                 │
│            (NFK.Domain)                 │
│     Entities, Enums, Business Logic     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Infrastructure Layer             │
│        (NFK.Infrastructure)             │
│ Data Access, External Services, Auth    │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: ASP.NET Core 8.0
- **Database**: Microsoft SQL Server 2022
- **ORM**: Entity Framework Core 8
- **Caching**: Redis
- **Background Jobs**: Hangfire
- **Authentication**: JWT with RS256
- **Password Hashing**: Argon2id
- **Logging**: Serilog
- **API Documentation**: Swagger/OpenAPI

### Key Components

#### 1. Authentication & Authorization
- JWT-based authentication with RSA 2048-bit keys
- Role-Based Access Control (RBAC)
- Support for OAuth2 (Google, Apple)
- Session management with refresh tokens
- Account lockout after failed attempts

#### 2. Database Design
- Soft delete pattern for all entities
- Audit trail with CreatedAt, UpdatedAt fields
- Row-level security for data isolation
- Query filters for tenant isolation

#### 3. DATEV Integration
- EXTF CSV format for Rechnungswesen
- dxso XML format for Unternehmen online
- Background job processing with Hangfire
- SFTP file transfer support
- Error handling and retry logic

## Frontend Architecture

### Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   └── features/     # Feature-specific components
│   ├── pages/
│   │   ├── public/       # Landing, Services, About
│   │   ├── auth/         # Login, Register
│   │   ├── portal/       # Client portal
│   │   └── admin/        # Admin dashboard
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state management
│   ├── services/         # API services
│   └── types/            # TypeScript types
```

### Technology Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Routing**: React Router
- **HTTP Client**: Axios

### Design System

- **Primary Color**: #208A8F (Teal)
- **Secondary Color**: #F5F5F5
- **Typography**: Inter font
- **Base Font Size**: 14px
- **Line Height**: 1.6
- **Accessibility**: WCAG 2.1 AA compliant

## Data Flow

1. **Client Request** → Frontend sends HTTP request
2. **API Gateway** → ASP.NET Core receives request
3. **Authentication** → JWT validation
4. **Authorization** → RBAC permission check
5. **Application Service** → Business logic execution
6. **Domain Models** → Entity operations
7. **Infrastructure** → Database/External services
8. **Response** → JSON returned to client

## Security Layers

1. **Transport Security**: HTTPS/TLS 1.3
2. **Authentication**: JWT with RS256
3. **Authorization**: RBAC with permissions
4. **Data Protection**: Encryption at rest (TDE)
5. **CSRF Protection**: Anti-forgery tokens
6. **Rate Limiting**: API throttling
7. **Security Headers**: CSP, HSTS, X-Frame-Options
8. **Input Validation**: FluentValidation
9. **SQL Injection**: Parameterized queries (EF Core)
10. **XSS Protection**: Output encoding

## Scalability Considerations

- **Horizontal Scaling**: Stateless API design
- **Caching**: Redis for session and data caching
- **Background Jobs**: Hangfire with SQL Server storage
- **Database**: Connection pooling and indexing
- **Load Balancing**: Ready for reverse proxy
- **CDN**: Static assets can be served from CDN

## Monitoring & Observability

- **Logging**: Structured logging with Serilog
- **Metrics**: Application performance metrics
- **Health Checks**: /health endpoint
- **Audit Logs**: Complete audit trail

## Deployment Architecture

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
┌──────▼───────┐
│  Frontend    │ (React + Vite)
│  Container   │
└──────┬───────┘
       │
┌──────▼───────┐
│   API        │ (ASP.NET Core)
│  Container   │
└──┬────────┬──┘
   │        │
┌──▼───┐ ┌─▼───────┐
│ SQL  │ │  Redis  │
│Server│ │         │
└──────┘ └─────────┘
```

## Future Enhancements

1. **Microservices**: Split into domain-specific services
2. **Event Sourcing**: Implement for audit trail
3. **CQRS**: Separate read/write models
4. **Message Queue**: RabbitMQ or Azure Service Bus
5. **API Gateway**: Ocelot or Azure API Management
6. **Elasticsearch**: Full-text search
7. **SignalR**: Real-time notifications
