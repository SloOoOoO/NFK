# SSO Setup Guide for NFK Buchhaltung

This document provides step-by-step instructions for setting up Single Sign-On (SSO) with Google and DATEV.

## Table of Contents
- [Google SSO Setup](#google-sso-setup)
- [DATEV SSO Setup](#datev-sso-setup)
- [Configuration](#configuration)
- [Testing](#testing)

## Google SSO Setup

### Prerequisites
- Google Cloud Platform account
- Admin access to configure OAuth

### Step 1: Create Google OAuth 2.0 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen:
   - Application name: **NFK Buchhaltung**
   - User support email: **info@nfk-buchhaltung.de**
   - Developer contact email: **info@nfk-buchhaltung.de**
   - Authorized domains: Add your domain (e.g., `nfk-buchhaltung.de`)

### Step 2: Configure OAuth 2.0 Client

1. Select **Web application** as the application type
2. Set the name: **NFK Buchhaltung Web App**
3. Add **Authorized redirect URIs**:
   - Development: `http://localhost:8080/api/v1/auth/google/callback`
   - Production: `https://api.nfk-buchhaltung.de/api/v1/auth/google/callback`
4. Click **Create**
5. Copy the **Client ID** and **Client Secret**

### Step 3: Configure Application

**⚠️ SECURITY WARNING:** Never commit OAuth secrets to version control!

#### Option 1: Environment Variables (Recommended for Production)

Set the following environment variables:

```bash
# Google OAuth Configuration
export GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE"
export GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET_HERE"
export GOOGLE_OAUTH_ENABLED="true"
```

For local development, create a `.env` file in the project root (copy from `.env.example`):

```env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_OAUTH_ENABLED=true
```

#### Option 2: Configuration File (Development Only)

For development environments only, you can add credentials to `appsettings.Development.json`:

```json
{
  "OAuth": {
    "Google": {
      "ClientId": "YOUR_GOOGLE_CLIENT_ID_HERE",
      "ClientSecret": "YOUR_GOOGLE_CLIENT_SECRET_HERE",
      "Enabled": true
    }
  }
}
```

**Important:** 
- `appsettings.Development.json` should contain only placeholder values when committed
- Never commit real secrets to appsettings files
- Use environment variables or secret management services in production

### Step 4: Test Google SSO

1. Navigate to the login page
2. Click **Mit Google anmelden** button
3. You will be redirected to Google's login page
4. After successful authentication, you'll be redirected back to the application
5. If the Google email doesn't exist in the system, you'll be redirected to registration with the email pre-filled

---

## DATEV SSO Setup

### Prerequisites
- DATEV developer account
- Registered DATEV application
- Certified tax consultant or accounting firm in Germany

### Step 1: Register Your Application with DATEV

1. Visit [DATEV Developer Portal](https://developer.datev.de/)
2. Log in with your DATEV credentials
3. Navigate to **My Applications** > **Create New Application**
4. Fill in the application details:
   - Application name: **NFK Buchhaltung**
   - Application type: **Web Application**
   - Description: **Tax consulting and accounting platform**
   - Contact email: **info@nfk-buchhaltung.de**

### Step 2: Configure OAuth 2.0 Settings

1. In the application settings, configure OAuth 2.0:
   - **Grant Type**: Authorization Code
   - **Redirect URIs**:
     - Development: `http://localhost:8080/api/v1/auth/datev/callback`
     - Production: `https://api.nfk-buchhaltung.de/api/v1/auth/datev/callback`
   - **Scopes**: 
     - `openid` (required)
     - `profile` (required)
     - `email` (required)
     - `datev:accounting` (for accounting data access)

2. Submit the application for review
3. After approval, you will receive:
   - **Client ID**
   - **Client Secret**

### Step 3: Configure Application

**⚠️ SECURITY WARNING:** Never commit OAuth secrets to version control!

#### Option 1: Environment Variables (Recommended for Production)

Set the following environment variables:

```bash
# DATEV OAuth Configuration
export DATEV_CLIENT_ID="YOUR_DATEV_CLIENT_ID_HERE"
export DATEV_CLIENT_SECRET="YOUR_DATEV_CLIENT_SECRET_HERE"
export DATEV_OAUTH_ENABLED="true"
```

For local development, create a `.env` file in the project root (copy from `.env.example`):

```env
DATEV_CLIENT_ID=YOUR_DATEV_CLIENT_ID_HERE
DATEV_CLIENT_SECRET=YOUR_DATEV_CLIENT_SECRET_HERE
DATEV_OAUTH_ENABLED=true
```

#### Option 2: Configuration File (Development Only)

For development environments only, you can add credentials to `appsettings.Development.json`:

```json
{
  "OAuth": {
    "DATEV": {
      "ClientId": "YOUR_DATEV_CLIENT_ID_HERE",
      "ClientSecret": "YOUR_DATEV_CLIENT_SECRET_HERE",
      "AuthorizationEndpoint": "https://login.datev.de/openid/authorize",
      "TokenEndpoint": "https://login.datev.de/openid/token",
      "UserInfoEndpoint": "https://login.datev.de/openid/userinfo",
      "Scope": "openid profile email datev:accounting",
      "Enabled": true
    }
  }
}
```

**Important:**
- `appsettings.Development.json` should contain only placeholder values when committed
- Never commit real secrets to appsettings files
- Use environment variables or secret management services in production

### Step 4: Test DATEV SSO

1. Navigate to the login page
2. Click **Mit DATEV anmelden** button
3. You will be redirected to DATEV's login page
4. Log in with your DATEV credentials
5. After successful authentication, you'll be redirected back to the application
6. User account will be created with **Consultant** or **DATEVManager** role

---

## Configuration

### Environment Variables

**⚠️ SECURITY BEST PRACTICE:** Always use environment variables for OAuth secrets in production!

The application loads OAuth configuration in this order:
1. **Environment variables** (highest priority)
2. Configuration files (appsettings.json)

#### Setting Environment Variables

**Linux/macOS:**
```bash
# Google OAuth
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
export GOOGLE_OAUTH_ENABLED="true"

# DATEV OAuth
export DATEV_CLIENT_ID="your-datev-client-id"
export DATEV_CLIENT_SECRET="your-datev-client-secret"
export DATEV_OAUTH_ENABLED="true"
```

**Windows (PowerShell):**
```powershell
# Google OAuth
$env:GOOGLE_CLIENT_ID="your-google-client-id"
$env:GOOGLE_CLIENT_SECRET="your-google-client-secret"
$env:GOOGLE_OAUTH_ENABLED="true"

# DATEV OAuth
$env:DATEV_CLIENT_ID="your-datev-client-id"
$env:DATEV_CLIENT_SECRET="your-datev-client-secret"
$env:DATEV_OAUTH_ENABLED="true"
```

**Docker Compose:**
```yaml
services:
  api:
    environment:
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_OAUTH_ENABLED=true
      - DATEV_CLIENT_ID=${DATEV_CLIENT_ID}
      - DATEV_CLIENT_SECRET=${DATEV_CLIENT_SECRET}
      - DATEV_OAUTH_ENABLED=true
```

Create a `.env` file in the project root (use `.env.example` as template):
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_ENABLED=true
DATEV_CLIENT_ID=your-datev-client-id
DATEV_CLIENT_SECRET=your-datev-client-secret
DATEV_OAUTH_ENABLED=true
```

### Production Configuration

For production deployments, use environment variables instead of storing credentials in configuration files.

---

## Testing

### Testing Google SSO

1. **Without existing account**:
   - Click "Mit Google anmelden"
   - Login with Google account
   - Should redirect to registration page with email pre-filled and locked
   - Complete registration form
   - After registration, user can login with Google

2. **With existing account**:
   - User must first register normally or link their Google account
   - Click "Mit Google anmelden"
   - Login with Google account
   - Should be logged in automatically

### Testing DATEV SSO

1. **Without existing account**:
   - Click "Mit DATEV anmelden"
   - Login with DATEV credentials
   - Account is created automatically with Consultant role
   - User is logged in

2. **With existing account**:
   - If user has DATEV ID linked, they can login directly
   - If not, DATEV login will link the account

### Error Scenarios

1. **Invalid credentials**:
   - Should redirect to login page with error message
   - Error parameter in URL: `?error=google_failed` or `?error=datev_failed`

2. **OAuth provider disabled**:
   - SSO buttons should not be visible if `Enabled` is `false`
   - API returns error message if OAuth is not configured

---

## Security Considerations

### OAuth Secrets Management

**⚠️ CRITICAL SECURITY REQUIREMENTS:**

1. **NEVER commit secrets to version control**
   - OAuth Client Secrets must NEVER be in appsettings.json, appsettings.Development.json, or any committed file
   - Always use environment variables or secure secret stores (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault)
   - The `.env` file is in `.gitignore` to prevent accidental commits

2. **Environment Variables Priority**
   - The application checks environment variables first (e.g., `GOOGLE_CLIENT_ID`)
   - Then falls back to configuration files (e.g., `OAuth:Google:ClientId`)
   - This allows secure production deployments while keeping config files clean

3. **Secret Rotation**
   - Regularly rotate OAuth Client Secrets (recommended: every 90 days)
   - Update environment variables after rotation
   - Monitor OAuth usage in provider consoles

### Google OAuth

- **Client Secret** must be kept secure and never committed to version control
- Use HTTPS in production for all redirect URIs
- Regularly rotate Client Secrets (every 90 days recommended)
- Monitor OAuth usage in Google Cloud Console
- Verify redirect URIs match exactly in both code and Google Console

### DATEV OAuth

- **Client Secret** must be kept secure and never committed
- DATEV SSO is only available for certified tax consultants
- Additional verification may be required by DATEV
- Monitor access in DATEV Developer Portal
- Follow DATEV-specific security guidelines for handling client data

### Best Practices

1. **Use environment variables for all secrets** - never hardcode in source code
2. **Different credentials for dev/prod** - use separate OAuth apps for development and production
3. **Implement rate limiting** - protect OAuth endpoints from abuse
4. **Enable audit logging** - log all OAuth authentication attempts
5. **Review scopes regularly** - only request necessary OAuth scopes
6. **Use HTTPS everywhere** - especially for redirect URIs in production
7. **Validate redirect URIs** - ensure they match configured values exactly
8. **Monitor for anomalies** - watch for unusual OAuth activity patterns

---

## Troubleshooting

### Common Issues

#### Google SSO
- **Error: redirect_uri_mismatch**
  - Solution: Ensure redirect URI in code matches exactly what's configured in Google Cloud Console
  
- **Error: invalid_client**
  - Solution: Check that Client ID and Client Secret are correct
  
- **User not being created**
  - Solution: Check application logs for specific error messages

#### DATEV SSO
- **Error: Application not approved**
  - Solution: Contact DATEV to check application approval status
  
- **Error: invalid_scope**
  - Solution: Ensure requested scopes are approved for your application
  
- **User gets wrong role**
  - Solution: Check role assignment logic in `DATEVOAuthService`

### Logging

Enable detailed logging for OAuth by setting log level in `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "NFK.Application.Services.OAuth": "Debug"
    }
  }
}
```

Check logs for:
- OAuth callback requests
- Token exchange errors
- User profile fetch errors
- Role assignment issues

---

## Support

For additional help:
- **Email**: info@nfk-buchhaltung.de
- **Google OAuth Issues**: [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- **DATEV OAuth Issues**: [DATEV Developer Portal](https://developer.datev.de/)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-14 | Initial SSO setup documentation |
