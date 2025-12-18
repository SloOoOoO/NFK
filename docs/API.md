# NFK API Documentation

Base URL: `http://localhost:8080/api/v1`

## Authentication

All API endpoints except public auth endpoints require authentication via JWT Bearer token.

**Header Format:**
```
Authorization: Bearer <access_token>
```

## Endpoints

### Auth Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `200 OK`
```json
{
  "userId": 1,
  "email": "user@example.com",
  "message": "Registration successful"
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "dGhpcyBpc...",
  "expiresIn": 900,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["Client"]
  }
}
```

#### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "dGhpcyBpc..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 900
}
```

#### POST /auth/logout
Logout and invalidate tokens.

**Response:** `200 OK`

### Client Endpoints

#### GET /clients
Get all clients (Admin/Consultant only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `search` (optional): Search term

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "companyName": "Acme Corp",
      "taxNumber": "123456789",
      "contactPerson": "John Doe",
      "email": "john@acme.com",
      "phone": "+49 123 456789"
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20
}
```

#### GET /clients/{id}
Get client details.

**Response:** `200 OK`
```json
{
  "id": 1,
  "companyName": "Acme Corp",
  "taxNumber": "123456789",
  "vatNumber": "DE123456789",
  "address": "Hauptstrasse 1",
  "city": "Berlin",
  "postalCode": "10115",
  "country": "Germany",
  "contactPerson": "John Doe",
  "email": "john@acme.com",
  "phone": "+49 123 456789"
}
```

#### POST /clients
Create a new client (Admin/Consultant only).

**Request Body:**
```json
{
  "companyName": "Acme Corp",
  "taxNumber": "123456789",
  "vatNumber": "DE123456789",
  "address": "Hauptstrasse 1",
  "city": "Berlin",
  "postalCode": "10115",
  "email": "john@acme.com",
  "phone": "+49 123 456789"
}
```

**Response:** `201 Created`

#### PUT /clients/{id}
Update client details.

**Response:** `200 OK`

#### DELETE /clients/{id}
Delete client (soft delete).

**Response:** `204 No Content`

### Case Endpoints

#### GET /cases
Get all cases.

**Query Parameters:**
- `clientId` (optional): Filter by client
- `status` (optional): Filter by status
- `assignedToUserId` (optional): Filter by assigned user

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "clientId": 1,
      "title": "Jahresabschluss 2023",
      "status": "InProgress",
      "assignedTo": "Max Mustermann",
      "dueDate": "2024-03-31T00:00:00Z",
      "priority": 1
    }
  ],
  "total": 10
}
```

#### GET /cases/{id}
Get case details.

**Response:** `200 OK`
```json
{
  "id": 1,
  "clientId": 1,
  "clientName": "Acme Corp",
  "title": "Jahresabschluss 2023",
  "description": "Annual financial statements for 2023",
  "status": "InProgress",
  "assignedToUserId": 2,
  "assignedToName": "Max Mustermann",
  "dueDate": "2024-03-31T00:00:00Z",
  "priority": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "notes": [...]
}
```

#### POST /cases
Create a new case.

**Request Body:**
```json
{
  "clientId": 1,
  "title": "Jahresabschluss 2023",
  "description": "Annual financial statements",
  "dueDate": "2024-03-31T00:00:00Z",
  "priority": 1,
  "assignedToUserId": 2
}
```

**Response:** `201 Created`

#### PUT /cases/{id}/status
Update case status.

**Request Body:**
```json
{
  "status": "Completed",
  "comment": "All documents processed"
}
```

**Response:** `200 OK`

### Document Endpoints

#### GET /documents
Get all documents.

**Query Parameters:**
- `caseId` (optional): Filter by case
- `folderId` (optional): Filter by folder

**Response:** `200 OK`

#### POST /documents/upload
Upload a document.

**Request:** `multipart/form-data`
- `file`: File to upload
- `caseId`: Associated case ID
- `folderId`: Target folder ID
- `description`: Document description

**Response:** `201 Created`

#### GET /documents/{id}/download
Download a document.

**Response:** File stream

### DATEV Endpoints

#### POST /datev/export
Create a DATEV export job (DATEVManager/SuperAdmin only).

**Request Body:**
```json
{
  "clientId": 1,
  "exportType": "EXTF",
  "fromDate": "2024-01-01",
  "toDate": "2024-12-31"
}
```

**Response:** `202 Accepted`
```json
{
  "jobId": 1,
  "status": "Pending"
}
```

#### GET /datev/jobs
Get all DATEV jobs.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "jobName": "Export_Acme_2024",
      "jobType": "EXTF",
      "status": "Completed",
      "clientId": 1,
      "clientName": "Acme Corp",
      "startedAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T10:05:00Z"
    }
  ]
}
```

#### POST /datev/jobs/{id}/retry
Retry a failed DATEV job.

**Response:** `200 OK`

## Error Responses

### 400 Bad Request
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "errors": {
    "email": ["Email is required", "Email format is invalid"]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "NotFound",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

- Auth endpoints: 5 requests per minute
- All other endpoints: 100 requests per minute per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```
