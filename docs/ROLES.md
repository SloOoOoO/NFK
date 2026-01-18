# NFK Buchhaltung - Role-Based Permissions

This document defines the role-based access control (RBAC) system for the NFK Buchhaltung platform.

## Available Roles

1. **Client** - End users who are customers of the tax consulting service
2. **Receptionist** - Front office staff handling initial client interactions
3. **Consultant** (Steuerberater) - Tax consultants managing client cases
4. **DATEVManager** - Staff managing DATEV integration and exports
5. **SuperAdmin** - System administrators with full access

## Feature Permissions Matrix

| Feature | Client | Receptionist | Consultant | DATEVManager | SuperAdmin |
|---------|--------|--------------|------------|--------------|------------|
| **Dashboard** | Own stats | Own stats | All stats | DATEV stats | All stats + Analytics |
| **Clients** | View own profile only | View assigned clients | View & manage all clients | View all clients | Full access |
| **Cases** | View own cases | Create cases for assigned clients | Full CRUD on all cases | View all cases | Full access |
| **Documents** | Upload/view own docs | Upload/view own docs | View & manage all docs | View & manage all docs | Full access |
| **Messages** | Reply only (to staff who messaged them) | Send to clients & staff | Send to anyone | Send to anyone | Send to anyone |
| **Pool Emails** | ❌ Cannot see | ✅ Can see all | ✅ Can see all | ✅ Can see all | ✅ Can see all |
| **Calendar** | View own appointments | Manage appointments for assigned clients | Manage all appointments | View all appointments | Full access |
| **DATEV** | ❌ No access | ❌ No access | View exports | Full DATEV management | Full access |
| **Admin Panel** | ❌ No access | ❌ No access | ❌ No access | ❌ No access | ✅ Full access (Users, Logs, Analytics) |
| **Reports** | Own reports only | Reports for assigned clients | All reports | DATEV reports | All reports |
| **User Management** | ❌ No access | ❌ No access | ❌ No access | ❌ No access | ✅ Create/Edit/Delete users, Assign roles |
| **Audit Logs** | ❌ No access | ❌ No access | ❌ No access | ❌ No access | ✅ View all logs |

## Detailed Role Capabilities

### Client
**Purpose**: End users accessing their own tax and accounting information

**Permissions**:
- Login and view own dashboard with personal statistics
- View and update own profile (limited fields: address, phone, email)
- Upload documents for own cases only
- View own cases and their status
- Reply to messages from staff (cannot initiate conversations)
- Book appointments if the feature is enabled
- View own reports and tax documents

**Restrictions**:
- Cannot see other clients' data
- Cannot access administrative features
- Cannot see pool emails (info@nfk-buchhaltung.de)
- Cannot create new cases
- Cannot send messages to staff unprompted

---

### Receptionist
**Purpose**: Front office staff managing client appointments and basic administrative tasks

**Permissions**:
- View basic client information for assigned clients
- Create and manage appointments (create, edit, cancel)
- Send messages to clients and other staff
- Upload documents for assigned clients
- Limited case access (view status only)
- Access to pool emails from info@nfk-buchhaltung.de

**Restrictions**:
- Can only see documents they uploaded themselves
- Cannot modify case details beyond viewing
- No access to DATEV functions
- No access to admin panel
- Cannot manage user accounts

---

### Consultant (Steuerberater)
**Purpose**: Tax consultants providing professional services to clients

**Permissions**:
- Full client management (create, edit, assign to other consultants)
- Full case management (create, update, close, delete)
- Access to ALL documents across all clients
- Generate tax reports and financial statements
- Send messages to anyone (clients, staff, pool)
- Access to pool emails
- View DATEV export status and logs
- Create and manage appointments for all clients

**Restrictions**:
- Cannot trigger DATEV exports (read-only access)
- No access to admin panel
- Cannot manage user accounts or system settings

---

### DATEVManager
**Purpose**: Technical staff managing DATEV integration and data exports

**Permissions**:
- Manage DATEV exports (trigger, monitor, retry failed jobs)
- Configure DATEV integration settings
- Access all documents for export purposes
- View all clients and cases (read-only for non-DATEV tasks)
- Send messages to staff members
- Access to pool emails
- View DATEV-specific reports and analytics

**Restrictions**:
- Cannot create or modify client data
- Cannot create or modify cases
- Limited document management (view only)
- No access to admin panel
- Cannot manage user accounts

---

### SuperAdmin
**Purpose**: System administrators with complete control over the platform

**Permissions**:
- **Everything the other roles can do, PLUS:**
- User management (create, edit, delete users)
- Role assignment and permission management
- System configuration and settings
- View audit logs (all user actions, document access)
- View analytics (page visits, system usage statistics)
- Edit header text and landing page content
- Access to all system features without restriction

**Special Features**:
- Admin Dashboard with tabs:
  - **User Management**: Create/edit users, change roles
  - **Header Text**: Customize landing page messaging
  - **Audit Logs**: View detailed activity logs with filters
  - **Analytics**: View page visit statistics (daily/monthly/yearly)

---

## Messaging System Rules

### Pool Email (info@nfk-buchhaltung.de)
When an email is sent to `info@nfk-buchhaltung.de`:
1. Backend creates a message marked with `IsPoolEmail = true`
2. Message is visible to: SuperAdmin, Consultant, Receptionist, DATEVManager
3. Message is NOT visible to: Client users
4. Appears in all employee inboxes under "Nachrichten"

### Client Message Restrictions
- **Clients can ONLY reply** to staff who have previously sent them a message
- Clients **CANNOT** compose new messages to staff
- This prevents spam and ensures all client communications are initiated by staff
- "Compose" button is hidden for Client role users

### Employee Messaging
- All employee roles (SuperAdmin, Consultant, Receptionist, DATEVManager) can:
  - Send messages to any user (clients or other staff)
  - See pool emails
  - Initiate new conversations

---

## Document Access Rules

### Client Access
- Can ONLY see documents associated with their own cases
- Filter: `Document.Case.Client.UserId == currentUser.Id`
- Can upload new documents to their own cases
- Can download their own documents

### Receptionist Access
- Can ONLY see documents they personally uploaded
- Filter: `Document.UploadedByUserId == currentUser.Id`
- Can upload new documents
- Can delete only their own uploads

### Consultant, DATEVManager, SuperAdmin Access
- Can see ALL documents from all clients and cases
- No filtering applied
- Full upload/download/delete permissions
- Can manage documents for any client

---

## Audit Logging

### What Gets Logged
The system tracks the following actions for compliance and security:

**Document Actions**:
- View Document (`ViewDocument`)
- Download Document (`DownloadDocument`)
- Upload Document (`UploadDocument`)
- Delete Document (`DeleteDocument`)

**User Actions**:
- Login attempts (successful and failed)
- User creation/modification
- Role changes
- Password resets

**Case Actions**:
- Case creation
- Case status changes
- Case assignment changes

### Log Access
- **Only SuperAdmin** can view audit logs
- Logs include:
  - Timestamp
  - User who performed the action
  - Action type
  - Entity affected (Document, Case, Client, etc.)
  - IP Address
  - Additional details in JSON format

### Log Retention
- Logs are stored indefinitely
- Can be filtered by:
  - Date range
  - User
  - Action type
  - Entity type

---

## Analytics (SuperAdmin Only)

### Page Visit Tracking
The system tracks page visits for analytics:

**Metrics Available**:
- Daily page visits (last 30 days)
- Monthly page visits (last 12 months)
- Yearly page visits (current year total)

**Data Collected**:
- Page URL
- User ID (if logged in)
- IP Address
- Timestamp

**Privacy**:
- No personal data beyond user ID is collected
- IP addresses are anonymized after 90 days
- Data is used only for system optimization

---

## Security Best Practices

### For All Users
1. Use strong passwords (minimum 8 characters, mixed case, numbers)
2. Never share login credentials
3. Log out when using shared computers
4. Report suspicious activity immediately

### For Admins
1. Regularly review audit logs
2. Monitor failed login attempts
3. Periodically review user role assignments
4. Keep system updated with latest security patches
5. Review and remove inactive user accounts

### For Developers
1. Always check user role before granting access
2. Use parameterized queries to prevent SQL injection
3. Validate all user inputs
4. Sanitize data before displaying to prevent XSS
5. Log all sensitive operations for audit trail

---

## Implementation Notes

### Backend (C# / .NET)
- Roles are stored in `Roles` table
- User-Role mapping in `UserRoles` table (many-to-many)
- Claims-based authentication using JWT tokens
- Role claim: `User.FindFirst("role")?.Value`

### Frontend (React / TypeScript)
- Current user role stored in JWT payload
- Retrieved via `/api/v1/auth/me` endpoint
- Role-based UI rendering (hide/show components)
- Route guards prevent unauthorized access

### Database
- Entities with role-based filters:
  - `Messages`: filtered by recipient and IsPoolEmail flag
  - `Documents`: filtered by Case.Client.UserId or UploadedByUserId
  - `Cases`: filtered by Client.UserId for clients
  - `AuditLogs`: SuperAdmin only

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-18 | Initial role permission matrix |

---

## Contact

For questions about role permissions or to request access changes, contact:
- System Administrator: admin@nfk-buchhaltung.de
- Technical Support: support@nfk-buchhaltung.de
