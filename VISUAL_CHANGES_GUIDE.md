# Visual Guide - NFK Web App Audit Changes

## 1. Registration Form Changes

### BEFORE (with redundant taxNumber field)
```
┌─────────────────────────────────────────┐
│     Steuerdaten (Tax Data)              │
├─────────────────────────────────────────┤
│ Steuer-ID *                             │
│ [___________] (11 digits required)      │
│                                          │
│ Steuernummer                            │
│ [___________] (Optional: 12/345/67890)  │  ← REMOVED
│                                          │
│ USt-IdNr.                               │
│ [___________] (Optional: DE123456789)   │
└─────────────────────────────────────────┘
```

### AFTER (single TaxId field)
```
┌─────────────────────────────────────────┐
│     Steuerdaten (Tax Data)              │
├─────────────────────────────────────────┤
│ Steuer-ID *                             │
│ [___________] (11 digits required)      │
│ ✓ ISO 7064 MOD 11-10 checksum          │
│                                          │
│ USt-IdNr.                               │
│ [___________] (Optional: DE123456789)   │
└─────────────────────────────────────────┘
```

## 2. OAuth Registration Flow

### Google OAuth Flow
```
User clicks "Sign in with Google"
         ↓
┌────────────────────────────────┐
│  Google OAuth Login            │
│  (accounts.google.com)         │
│                                │
│  [Sign in with Google Account] │
└────────────────────────────────┘
         ↓
Authorization Code Returned
         ↓
Backend: Exchange code for tokens
         ↓
Extract user profile (email)
         ↓
Redirect to registration form
         ↓
┌────────────────────────────────┐
│  Complete Registration         │
│                                │
│  Email: user@gmail.com ⚠️      │  ← Pre-filled, locked
│  Password: [__________] *      │
│  First Name: [________] *      │
│  Last Name: [_________] *      │
│  ...complete remaining fields  │
└────────────────────────────────┘
```

### DATEV OAuth Flow
```
User clicks "Sign in with DATEV"
         ↓
┌────────────────────────────────┐
│  DATEV OAuth Login             │
│  (login.datev.de)              │
│                                │
│  [DATEV Consultant Login]      │
└────────────────────────────────┘
         ↓
Authorization Code Returned
         ↓
Backend: Exchange code for tokens
         ↓
Extract user profile (firstName, lastName)
         ↓
Redirect to registration form
         ↓
┌────────────────────────────────┐
│  Complete Registration         │
│                                │
│  First Name: Max ⚠️            │  ← Pre-filled, locked
│  Last Name: Mustermann ⚠️      │  ← Pre-filled, locked
│  Email: [__________] *         │
│  Password: [__________] *      │
│  ...complete remaining fields  │
└────────────────────────────────┘
```

## 3. Role-Based Access Control

### User Roles (6 Total)

```
┌──────────────┬──────────────────────────────────────┬─────────────┐
│ Role         │ Description                          │ Admin Access│
├──────────────┼──────────────────────────────────────┼─────────────┤
│ SuperAdmin   │ Full system access                   │     ✅      │
│ Admin        │ General admin, user management       │     ✅      │
│ Consultant   │ Tax consultant, client management    │     ✅      │
│ Receptionist │ Scheduling, basic client info        │     ❌      │
│ Client       │ Own dossier and documents            │     ❌      │
│ DATEVManager │ DATEV export management              │     ❌      │
└──────────────┴──────────────────────────────────────┴─────────────┘

Note: "Steuerberater" (German) = "Consultant" (same role)
```

### Frontend Route Protection

```
User navigates to /portal/admin
         ↓
┌────────────────────────────────┐
│  AdminRoute Component          │
│                                │
│  Check: Is authenticated?      │
│    ↓ NO → Redirect to /login   │
│    ↓ YES                       │
│  Check: Has admin role?        │
│    ↓ NO → Redirect to /dashboard│
│    ↓ YES (SuperAdmin, Admin,   │
│           or Consultant)       │
│  Render Admin Dashboard        │
└────────────────────────────────┘
```

### Backend Authorization

```
GET /api/v1/admin/users
         ↓
┌────────────────────────────────┐
│  [Authorize(Roles =            │
│   "SuperAdmin,Admin,           │
│    Consultant")]               │
│                                │
│  Check JWT token claims        │
│    ↓ NO → 401 Unauthorized     │
│    ↓ YES                       │
│  Check role in claims          │
│    ↓ NO → 403 Forbidden        │
│    ↓ YES                       │
│  Execute controller action     │
└────────────────────────────────┘
```

## 4. OAuth Configuration

### appsettings.json Structure

```json
{
  "OAuth": {
    "Google": {
      "ClientId": "your-client-id.apps.googleusercontent.com",
      "ClientSecret": "GOCSPX-...",
      "Enabled": true  ← Set to true when configured
    },
    "DATEV": {
      "ClientId": "your-datev-client-id",
      "ClientSecret": "your-datev-secret",
      "AuthorizationEndpoint": "https://login.datev.de/openid/authorize",
      "TokenEndpoint": "https://login.datev.de/openid/token",
      "UserInfoEndpoint": "https://login.datev.de/openid/userinfo",
      "Scope": "openid profile email datev:accounting",
      "Enabled": false  ← Set to true when configured
    }
  }
}
```

### OAuth Flow Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Click "Sign in with OAuth"
       ↓
┌─────────────────────┐
│  Backend API        │
│  /auth/google/login │  2. Generate authorization URL
└──────┬──────────────┘
       │ 3. Redirect to OAuth provider
       ↓
┌──────────────────────┐
│  OAuth Provider      │
│  (Google/DATEV)      │  4. User authenticates
└──────┬───────────────┘
       │ 5. Redirect to callback with code
       ↓
┌─────────────────────────┐
│  Backend API            │
│  /auth/google/callback  │  6. Exchange code for token
│                         │  7. Get user profile
│                         │  8. Redirect to registration
└──────┬──────────────────┘     with pre-filled data
       │
       ↓
┌─────────────────────┐
│  Registration Form  │  9. User completes registration
└─────────────────────┘
```

## 5. Admin Dashboard Access

### Navigation Sidebar

```
BEFORE: Admin visible to all authenticated users

┌─────────────────────┐
│  Navigation         │
│  ─────────────      │
│  📊 Dashboard       │
│  👥 Clients         │
│  📁 Cases           │
│  📄 Documents       │
│  ✉️  Messages       │
│  📅 Calendar        │
│  ⚙️  Admin          │  ← Visible to ALL
└─────────────────────┘


AFTER: Admin only visible to authorized roles

┌─────────────────────┐
│  Navigation         │
│  ─────────────      │
│  📊 Dashboard       │
│  👥 Clients         │
│  📁 Cases           │
│  📄 Documents       │
│  ✉️  Messages       │
│  📅 Calendar        │
│  ⚙️  Admin          │  ← Only if SuperAdmin, Admin, or Consultant
└─────────────────────┘
```

## Summary of Changes

✅ **Tax ID Consolidation:**
- Removed redundant `taxNumber` field
- Single `taxId` field with validation

✅ **OAuth2/OIDC:**
- Real OAuth flow for Google and DATEV
- Pre-fill and lock specific fields
- Registration continuation after SSO

✅ **Role-Based Access:**
- 6 defined roles (was 5)
- Multi-role admin access
- Frontend and backend protection

✅ **Documentation:**
- OAuth setup instructions
- Environment variable guide
- Registration flow descriptions

**Files Modified:** 9 files
**Security Alerts:** 0 (CodeQL scan clean)
**Build Status:** ✅ Backend & Frontend build successfully
