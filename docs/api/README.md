# CollectIQ API Documentation

## Base URL

```
http://localhost:5000/api
```

---

## Authentication

All endpoints (except `/auth/login` and `/auth/register`) require JWT authentication.

### Headers

```
Authorization: Bearer <token>
```

---

## Endpoints

### Authentication

#### POST /auth/register

Register a new user.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "dca",
  "agency": "Agency Name"
}
```

**Response** (201):
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "dca"
  }
}
```

#### POST /auth/login

Authenticate and get JWT token.

**Request**:
```json
{
  "email": "admin@enterprise.com",
  "password": "admin123"
}
```

**Response** (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@enterprise.com",
    "name": "Enterprise Admin",
    "role": "enterprise"
  }
}
```

#### GET /auth/me

Get current user info.

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "email": "admin@enterprise.com",
    "name": "Enterprise Admin",
    "role": "enterprise"
  }
}
```

---

### Cases

#### GET /cases

List all cases (with filters and pagination).

**Query Parameters**:
- `status`: Filter by status (new, assigned, in_progress, etc.)
- `priority`: Filter by priority (high, medium, low)
- `assignedDcaId`: Filter by assigned DCA
- `search`: Search in case number, account number, customer name
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response** (200):
```json
{
  "cases": [
    {
      "id": 1,
      "caseNumber": "CASE-1736463123456-789",
      "customerName": "John Smith",
      "amount": 5000,
      "overdueDays": 45,
      "status": "assigned",
      "priority": "high",
      "paymentProbability": 68.5,
      "riskScore": 31.5
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

#### GET /cases/:id

Get case details.

**Response** (200):
```json
{
  "case": {
    "id": 1,
    "caseNumber": "CASE-1736463123456-789",
    "accountNumber": "ACC-001",
    "customerName": "John Smith",
    "amount": 5000,
    "overdueDays": 45,
    "status": "assigned",
    "priority": "high",
    "paymentProbability": 68.5,
    "riskScore": 31.5,
    "assignedDcaId": 2,
    "assignedDcaName": "DCA Collector 1",
    "notes": "...",
    "createdAt": "2024-01-10T12:00:00Z"
  }
}
```

#### POST /cases

Create a new case (Enterprise only).

**Request**:
```json
{
  "accountNumber": "ACC-123",
  "customerName": "Jane Doe",
  "amount": 7500,
  "overdueDays": 60,
  "historicalPayments": 2,
  "contactFrequency": 1
}
```

**Response** (201):
```json
{
  "case": {
    "id": 10,
    "caseNumber": "CASE-1736463123456-123",
    // ... full case object
  }
}
```

#### PUT /cases/:id

Update case.

**Request**:
```json
{
  "status": "in_progress",
  "notes": "Customer contacted, promised payment by Friday"
}
```

**Response** (200):
```json
{
  "case": {
    // ... updated case object
  }
}
```

#### POST /cases/:id/assign

Assign case to DCA (Enterprise only).

**Request**:
```json
{
  "dcaId": 2,
  "dcaName": "DCA Collector 1"
}
```

**Response** (200):
```json
{
  "case": {
    // ... updated case object
  }
}
```

#### POST /cases/:id/notes

Add note to case.

**Request**:
```json
{
  "note": "Called customer, left voicemail"
}
```

**Response** (200):
```json
{
  "case": {
    // ... updated case object with appended note
  }
}
```

#### GET /cases/:id/workflow

Get workflow status for case.

**Response** (200):
```json
{
  "workflow": {
    "currentStage": "contact",
    "slaStatus": "on_track",
    "slaDueDate": "2024-01-12T12:00:00Z",
    "escalationCount": 0,
    "stageHistory": [
      {
        "stage": "assign",
        "timestamp": "2024-01-10T12:00:00Z"
      }
    ]
  }
}
```

---

### Analytics

#### GET /analytics/recovery-rate

Get recovery rate metrics.

**Response** (200):
```json
{
  "totalCases": 100,
  "resolvedCases": 45,
  "closedCases": 10,
  "recoveryRate": "55.00",
  "totalAmount": 500000,
  "recoveredAmount": 275000,
  "amountRecoveryRate": "55.00"
}
```

#### GET /analytics/aging-buckets

Get aging bucket distribution.

**Response** (200):
```json
{
  "buckets": [
    {
      "bucket": "0-30 days",
      "count": 20,
      "total_amount": 50000
    },
    {
      "bucket": "31-60 days",
      "count": 30,
      "total_amount": 120000
    }
  ]
}
```

#### GET /analytics/sla-compliance

Get SLA compliance metrics.

**Response** (200):
```json
{
  "onTrack": 60,
  "warning": 25,
  "breached": 15,
  "total": 100,
  "complianceRate": "85.00"
}
```

#### GET /analytics/dca-performance

Get DCA performance comparison.

**Response** (200):
```json
{
  "performance": [
    {
      "dca_name": "DCA Collector 1",
      "total_cases": 50,
      "resolved_cases": 28,
      "avg_payment_probability": 65.5,
      "avg_risk_score": 34.5
    }
  ]
}
```

---

### Audit

#### GET /audit

Get audit logs with filters.

**Query Parameters**:
- `entityType`: Filter by entity type
- `entityId`: Filter by entity ID
- `userId`: Filter by user ID
- `startDate`: ISO date string
- `endDate`: ISO date string
- `page`: Page number
- `limit`: Items per page

**Response** (200):
```json
{
  "logs": [
    {
      "id": 1,
      "action": "CREATE_CASE",
      "entityType": "Case",
      "entityId": 10,
      "userId": 1,
      "userName": "Enterprise Admin",
      "timestamp": "2024-01-10T12:00:00Z",
      "ipAddress": "192.168.1.1"
    }
  ],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 50,
    "pages": 10
  }
}
```

#### GET /audit/export

Export audit logs as CSV.

**Query Parameters**: Same as GET /audit

**Response**: CSV file download

---

### Communication

#### GET /communication/case/:caseId

Get communications for a case.

**Response** (200):
```json
{
  "communications": [
    {
      "id": 1,
      "caseId": 10,
      "channel": "email",
      "subject": "Payment Reminder",
      "content": "...",
      "status": "delivered",
      "sentAt": "2024-01-10T12:00:00Z"
    }
  ]
}
```

#### POST /communication

Send communication (simulated).

**Request**:
```json
{
  "caseId": 10,
  "channel": "email",
  "templateId": "payment_reminder",
  "subject": "Payment Reminder",
  "content": "Dear customer...",
  "recipientEmail": "customer@example.com"
}
```

**Response** (201):
```json
{
  "communication": {
    // ... created communication object
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation Error",
  "message": "Missing required field: accountNumber"
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
  "error": "Not Found",
  "message": "Case not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

Currently not implemented. Recommended for production:
- 100 requests per minute per user
- 1000 requests per hour per IP

---

For more information, see the main README.md or contact support.
