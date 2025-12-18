# Security Documentation

## Overview

The NFK platform implements multiple layers of security to protect sensitive financial and tax data.

## Authentication & Authorization

### JWT Implementation

- **Algorithm**: RS256 (RSA with SHA-256)
- **Key Size**: 2048 bits
- **Access Token Lifetime**: 15 minutes
- **Refresh Token Lifetime**: 7 days
- **Token Storage**: HttpOnly cookies recommended for web, secure storage for mobile

### Password Security

- **Hashing Algorithm**: Argon2id
- **Salt Size**: 16 bytes (randomly generated per password)
- **Hash Size**: 32 bytes
- **Iterations**: 4
- **Memory**: 128 MB
- **Parallelism**: 2 threads

### Password Requirements

- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number, special character
- Cannot be common passwords
- Cannot be similar to username/email

### Account Lockout

- **Failed Attempts Threshold**: 5
- **Lockout Duration**: 30 minutes
- **Counter Reset**: After successful login
- **Notification**: Email sent to user on lockout

### Session Management

- Concurrent sessions tracked per user
- Session invalidation on logout
- Automatic session cleanup for expired sessions
- IP address and User-Agent tracking

## Authorization (RBAC)

### Roles

1. **SuperAdmin**
   - Full system access
   - User management
   - System configuration

2. **Consultant**
   - Client management
   - Case management
   - Document access
   - Report generation

3. **Receptionist**
   - Appointment scheduling
   - Basic client information
   - Limited document access

4. **Client**
   - Own dossier access
   - Document upload/download
   - Message communication
   - Appointment booking

5. **DATEVManager**
   - DATEV export management
   - Integration configuration
   - Export logs access

### Permission System

Permissions are granular and can be assigned to:
- Roles (via RolePermission)
- Individual users (via UserPermission)

Example permissions:
- `clients:read`
- `clients:write`
- `cases:read`
- `cases:write`
- `documents:upload`
- `datev:export`

## Data Protection

### Encryption at Rest

- **Database**: Transparent Data Encryption (TDE) enabled on SQL Server
- **Documents**: Azure Blob Storage with encryption
- **Backups**: Encrypted backup files

### Encryption in Transit

- **HTTPS/TLS 1.3**: All API communication
- **Certificate**: Valid SSL/TLS certificate
- **HSTS**: Strict-Transport-Security header enabled
- **SFTP**: Secure file transfer for DATEV

### Data Masking

- Sensitive fields logged in masked format
- PII redacted in logs
- Credit card numbers never stored

### Row-Level Security

- Each client can only access their own data
- Consultants can only access assigned clients
- Implemented via EF Core query filters

## Security Headers

All responses include:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## API Security

### Rate Limiting

- **Auth Endpoints**: 5 requests/minute
- **General Endpoints**: 100 requests/minute
- **By IP and User**: Combined limiting
- **Response**: 429 Too Many Requests

### CORS Configuration

- **Allowed Origins**: Configured whitelist
- **Credentials**: Allowed with credentials
- **Methods**: GET, POST, PUT, DELETE, PATCH
- **Headers**: Authorization, Content-Type

### Input Validation

- **FluentValidation**: All DTOs validated
- **ModelState**: Automatic validation
- **SQL Injection**: Parameterized queries (EF Core)
- **XSS Prevention**: Output encoding
- **CSRF**: Anti-forgery tokens for state-changing operations

### File Upload Security

- **Size Limit**: 50 MB per file
- **Type Validation**: Whitelist of allowed MIME types
- **Virus Scanning**: Recommended for production
- **File Name Sanitization**: Remove special characters
- **Storage**: Isolated from web root

## OAuth2 Integration

### Google OAuth

- **Client ID**: Configured in appsettings
- **Scopes**: email, profile
- **Token Exchange**: Server-side only
- **State Parameter**: CSRF protection

### Apple Sign In

- **Client ID**: App identifier
- **Team ID**: Developer team
- **Private Key**: RS256 signing
- **Token Validation**: Signature verification

## Audit Logging

### Logged Events

- User login/logout
- Failed login attempts
- Permission changes
- Data modifications (CRUD)
- Configuration changes
- DATEV exports
- Document access

### Audit Log Fields

- Timestamp
- User ID
- Action type
- Entity name
- Entity ID
- Old values (JSON)
- New values (JSON)
- IP address
- User agent

### Retention Policy

- Audit logs: 7 years (compliance requirement)
- Login attempts: 90 days
- Session logs: 30 days

## GDPR Compliance

### User Rights

1. **Right to Access**: Users can download their data
2. **Right to Rectification**: Users can update their data
3. **Right to Erasure**: Users can request deletion
4. **Right to Portability**: Data export in JSON format
5. **Right to Object**: Opt-out of processing

### Data Processing

- **Legal Basis**: Contract and legitimate interest
- **Data Processor Agreement**: Required with DATEV
- **Privacy Policy**: Available and accessible
- **Consent Management**: Explicit consent for marketing

### Data Retention

- Active user data: Indefinite
- Deleted user data: 30 days (soft delete)
- Audit logs: 7 years
- Backups: 90 days

## Vulnerability Management

### Security Scanning

- **Dependency Scanning**: Automated NuGet package checks
- **Code Scanning**: Static analysis (SonarQube recommended)
- **OWASP Top 10**: Regular assessment
- **Penetration Testing**: Annual third-party audit

### Patch Management

- **Critical Patches**: Within 24 hours
- **High Priority**: Within 7 days
- **Medium Priority**: Within 30 days
- **Low Priority**: Next release

### Incident Response

1. **Detection**: Monitoring and alerting
2. **Containment**: Isolate affected systems
3. **Investigation**: Root cause analysis
4. **Remediation**: Apply fixes
5. **Communication**: Notify affected users
6. **Documentation**: Incident report

## Secure Development

### Code Review

- All code reviewed before merge
- Security-focused review for sensitive areas
- Automated tools (CodeQL, SonarQube)

### Secrets Management

- **No Secrets in Code**: Use environment variables
- **Key Vault**: Azure Key Vault for production
- **Rotation**: Regular key rotation
- **Access Control**: Principle of least privilege

### Testing

- Unit tests for business logic
- Integration tests for APIs
- Security tests for authentication
- Penetration tests annually

## Compliance

### Standards

- **ISO 27001**: Information security management
- **GDPR**: EU data protection
- **GoBD**: German tax compliance
- **BSI Grundschutz**: German IT security

### Certifications

- Security audit: Annual
- Penetration testing: Annual
- Compliance audit: Annual

## Security Contacts

- **Security Issues**: security@nfk-buchhaltung.de
- **Response Time**: 24 hours for critical issues
- **Bug Bounty**: Not currently available
