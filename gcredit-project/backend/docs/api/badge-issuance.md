# Badge Issuance API

**Base Path:** `/api/badges`  
**Authentication:** Required (except `/claim` endpoint)  
**Authorization:** Varies by endpoint

## Overview

The Badge Issuance API provides endpoints for issuing, claiming, querying, and revoking digital badges. It supports both single badge issuance and bulk issuance via CSV upload. All issued badges comply with Open Badges 2.0 specification.

## Table of Contents

- [Endpoints](#endpoints)
  - [Issue Single Badge](#issue-single-badge)
  - [Bulk Issue Badges](#bulk-issue-badges)
  - [Claim Badge](#claim-badge)
  - [Get My Badges](#get-my-badges)
  - [Get Issued Badges](#get-issued-badges)
  - [Revoke Badge](#revoke-badge)
  - [Get Open Badges Assertion](#get-open-badges-assertion)
- [Data Models](#data-models)
- [Badge Statuses](#badge-statuses)
- [Examples](#examples)

---

## Endpoints

### Issue Single Badge

Issue a single badge to a recipient.

**Endpoint:** `POST /api/badges`  
**Authentication:** Required  
**Authorization:** `ADMIN`, `ISSUER`

#### Request Body

```json
{
  "templateId": "123e4567-e89b-12d3-a456-426614174000",
  "recipientId": "123e4567-e89b-12d3-a456-426614174001",
  "evidenceUrl": "https://storage.azure.com/evidence/cert-12345.pdf",
  "expiresIn": 365
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `templateId` | UUID | Yes | Badge template ID |
| `recipientId` | UUID | Yes | Recipient user ID |
| `evidenceUrl` | URL | No | Evidence URL (Azure Blob Storage) |
| `expiresIn` | Integer | No | Expiration in days (1-3650, null = no expiration) |

#### Response (201 Created)

```json
{
  "id": "badge-uuid-123",
  "templateId": "123e4567-e89b-12d3-a456-426614174000",
  "recipientId": "123e4567-e89b-12d3-a456-426614174001",
  "issuerId": "issuer-uuid-456",
  "status": "ISSUED",
  "claimToken": "claim_abc123def456",
  "claimUrl": "http://localhost:3000/claim/claim_abc123def456",
  "evidenceUrl": "https://storage.azure.com/evidence/cert-12345.pdf",
  "expiresAt": "2027-01-27T12:00:00.000Z",
  "issuedAt": "2026-01-27T12:00:00.000Z",
  "createdAt": "2026-01-27T12:00:00.000Z",
  "updatedAt": "2026-01-27T12:00:00.000Z",
  "template": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Outstanding Performance",
    "description": "Awarded for exceptional work",
    "imageUrl": "https://storage.azure.com/badges/performance-badge.png"
  }
}
```

#### Error Responses

- **400 Bad Request:** Invalid request body (missing required fields, invalid UUID)
- **403 Forbidden:** User doesn't have ADMIN or ISSUER role
- **404 Not Found:** Template or recipient not found

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/api/badges \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "123e4567-e89b-12d3-a456-426614174000",
    "recipientId": "123e4567-e89b-12d3-a456-426614174001",
    "evidenceUrl": "https://storage.azure.com/evidence/cert.pdf",
    "expiresIn": 365
  }'
```

---

### Bulk Issue Badges

Issue multiple badges from a CSV file.

**Endpoint:** `POST /api/badges/bulk`  
**Authentication:** Required  
**Authorization:** `ADMIN`, `ISSUER`  
**Content-Type:** `multipart/form-data`

#### Request

Upload a CSV file with the following columns:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `recipientEmail` | Email | Yes | Recipient email address |
| `templateId` | UUID | Yes | Badge template ID |
| `evidenceUrl` | URL | No | Evidence URL |
| `expiresIn` | Integer | No | Expiration in days (1-3650) |

**CSV Example:**
```csv
recipientEmail,templateId,evidenceUrl,expiresIn
user1@example.com,123e4567-e89b-12d3-a456-426614174000,https://storage.azure.com/evidence1.pdf,365
user2@example.com,123e4567-e89b-12d3-a456-426614174000,,730
user3@example.com,234e5678-f90b-12d3-a456-426614174001,https://storage.azure.com/evidence3.pdf,
```

#### Response (201 Created)

```json
{
  "success": true,
  "totalRows": 50,
  "successCount": 48,
  "failureCount": 2,
  "results": [
    {
      "row": 1,
      "success": true,
      "badgeId": "badge-uuid-1",
      "recipientEmail": "user1@example.com"
    },
    {
      "row": 5,
      "success": false,
      "recipientEmail": "invalid@example.com",
      "error": "Recipient not found"
    }
  ]
}
```

#### Error Responses

- **400 Bad Request:** No file uploaded, invalid CSV format, missing required columns
- **403 Forbidden:** User doesn't have ADMIN or ISSUER role

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/api/badges/bulk \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@badges.csv"
```

---

### Claim Badge

Claim a badge using a claim token (public endpoint).

**Endpoint:** `POST /api/badges/:id/claim`  
**Authentication:** Not Required (Public)  
**Authorization:** None

#### Request Body

```json
{
  "claimToken": "claim_abc123def456"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `claimToken` | String | Yes | Claim token from badge issuance |

#### Response (200 OK)

```json
{
  "id": "badge-uuid-123",
  "status": "CLAIMED",
  "claimedAt": "2026-01-27T12:00:00.000Z",
  "badge": {
    "name": "Outstanding Performance",
    "description": "Awarded for exceptional work",
    "imageUrl": "https://storage.azure.com/badges/performance-badge.png"
  },
  "assertionUrl": "http://localhost:3000/api/badges/badge-uuid-123/assertion",
  "message": "Badge claimed successfully! You can now view it in your wallet."
}
```

#### Error Responses

- **400 Bad Request:** Badge already claimed
- **404 Not Found:** Invalid claim token
- **410 Gone:** Badge expired or revoked

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/api/badges/badge-uuid-123/claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimToken": "claim_abc123def456"
  }'
```

---

### Get My Badges

Get badges received by the currently authenticated user.

**Endpoint:** `GET /api/badges/my-badges`  
**Authentication:** Required  
**Authorization:** Any authenticated user

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | 1 | Page number |
| `limit` | Integer | 10 | Items per page (max: 100) |
| `status` | String | - | Filter by status: `ISSUED`, `CLAIMED`, `REVOKED` |
| `search` | String | - | Search by badge name or description |
| `sortBy` | String | `issuedAt` | Sort field: `issuedAt`, `claimedAt`, `name` |
| `sortOrder` | String | `desc` | Sort order: `asc` or `desc` |

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "badge-uuid-123",
      "status": "CLAIMED",
      "claimedAt": "2026-01-27T12:00:00.000Z",
      "issuedAt": "2026-01-27T10:00:00.000Z",
      "expiresAt": "2027-01-27T10:00:00.000Z",
      "template": {
        "id": "template-uuid-1",
        "name": "Outstanding Performance",
        "description": "Awarded for exceptional work",
        "imageUrl": "https://storage.azure.com/badges/badge.png"
      },
      "issuer": {
        "id": "issuer-uuid-456",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### Example (cURL)

```bash
curl -X GET "http://localhost:3000/api/badges/my-badges?page=1&limit=10&status=CLAIMED" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Get Issued Badges

Get badges issued by current user (ISSUER) or all badges (ADMIN).

**Endpoint:** `GET /api/badges/issued`  
**Authentication:** Required  
**Authorization:** `ADMIN`, `ISSUER`

#### Query Parameters

Same as [Get My Badges](#get-my-badges)

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "badge-uuid-123",
      "status": "CLAIMED",
      "claimedAt": "2026-01-27T12:00:00.000Z",
      "issuedAt": "2026-01-27T10:00:00.000Z",
      "template": {
        "name": "Outstanding Performance"
      },
      "recipient": {
        "id": "recipient-uuid-789",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "issuer": {
        "id": "issuer-uuid-456",
        "name": "John Doe"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

#### Notes

- **ISSUER:** Can only see badges they issued
- **ADMIN:** Can see all issued badges across the system

#### Error Responses

- **403 Forbidden:** User doesn't have ADMIN or ISSUER role

---

### Revoke Badge

Revoke a badge (ADMIN only).

**Endpoint:** `POST /api/badges/:id/revoke`  
**Authentication:** Required  
**Authorization:** `ADMIN` only

#### Request Body

```json
{
  "reason": "Policy violation detected"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | String | Yes | Reason for revocation |

#### Response (200 OK)

```json
{
  "id": "badge-uuid-123",
  "status": "REVOKED",
  "revokedAt": "2026-01-27T12:00:00.000Z",
  "revocationReason": "Policy violation detected",
  "revokedBy": "admin-uuid-999"
}
```

#### Error Responses

- **400 Bad Request:** Badge already revoked
- **403 Forbidden:** User doesn't have ADMIN role
- **404 Not Found:** Badge not found

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/api/badges/badge-uuid-123/revoke \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Policy violation detected"
  }'
```

---

### Get Open Badges Assertion

Get Open Badges 2.0 assertion (public endpoint).

**Endpoint:** `GET /api/badges/:id/assertion`  
**Authentication:** Not Required (Public)  
**Authorization:** None

#### Response (200 OK)

```json
{
  "@context": "https://w3id.org/openbadges/v2",
  "type": "Assertion",
  "id": "http://localhost:3000/api/badges/badge-uuid-123/assertion",
  "badge": {
    "type": "BadgeClass",
    "id": "http://localhost:3000/api/badge-templates/template-uuid-1",
    "name": "Outstanding Performance",
    "description": "Awarded for exceptional work",
    "image": "https://storage.azure.com/badges/badge.png",
    "criteria": {
      "narrative": "Demonstrated exceptional performance in project delivery"
    },
    "issuer": {
      "type": "Profile",
      "id": "http://localhost:3000/api/issuer/organization",
      "name": "GCredit Platform",
      "url": "http://localhost:3000"
    }
  },
  "recipient": {
    "type": "email",
    "hashed": false,
    "identity": "jane@example.com"
  },
  "issuedOn": "2026-01-27T10:00:00.000Z",
  "expires": "2027-01-27T10:00:00.000Z",
  "verification": {
    "type": "hosted"
  }
}
```

#### Error Responses

- **404 Not Found:** Badge not found
- **410 Gone:** Badge revoked

#### Example (cURL)

```bash
curl -X GET http://localhost:3000/api/badges/badge-uuid-123/assertion
```

---

## Data Models

### Badge Status Enum

```typescript
enum BadgeStatus {
  ISSUED = 'ISSUED',     // Badge issued, waiting to be claimed
  CLAIMED = 'CLAIMED',   // Badge claimed by recipient
  REVOKED = 'REVOKED'    // Badge revoked by admin
}
```

### Badge Object

```typescript
{
  id: string;                    // UUID
  templateId: string;            // Badge template ID
  recipientId: string;           // Recipient user ID
  issuerId: string;              // Issuer user ID
  status: BadgeStatus;           // Current status
  claimToken: string;            // Token for claiming (hashed)
  claimUrl: string;              // Public claim URL
  evidenceUrl?: string;          // Evidence URL (optional)
  assertionJson: object;         // Open Badges 2.0 assertion
  issuedAt: Date;                // Issue timestamp
  claimedAt?: Date;              // Claim timestamp
  expiresAt?: Date;              // Expiration timestamp
  revokedAt?: Date;              // Revocation timestamp
  revocationReason?: string;     // Revocation reason
  revokedBy?: string;            // Admin who revoked
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

---

## Badge Statuses

### ISSUED
- Initial status when badge is created
- Badge has been assigned to recipient but not yet claimed
- Recipient receives email with `claimUrl` and `claimToken`
- Can transition to: `CLAIMED`, `REVOKED`

### CLAIMED
- Badge has been claimed by recipient
- Recipient can view badge in their wallet
- Can transition to: `REVOKED`

### REVOKED
- Badge has been revoked by admin
- Badge no longer valid
- Assertion endpoint returns 410 Gone
- Final status (cannot transition to other states)

---

## Examples

### Complete Workflow: Issue → Claim

**Step 1: Issue Badge**
```bash
curl -X POST http://localhost:3000/api/badges \
  -H "Authorization: Bearer ISSUER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "123e4567-e89b-12d3-a456-426614174000",
    "recipientId": "recipient-uuid",
    "expiresIn": 365
  }'

# Response includes:
# - claimToken: "claim_abc123"
# - claimUrl: "http://localhost:3000/claim/claim_abc123"
```

**Step 2: Recipient Claims Badge**
```bash
curl -X POST http://localhost:3000/api/badges/badge-uuid/claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimToken": "claim_abc123"
  }'

# Badge status changes from ISSUED → CLAIMED
```

**Step 3: View Assertion (Public)**
```bash
curl -X GET http://localhost:3000/api/badges/badge-uuid/assertion

# Returns Open Badges 2.0 assertion JSON
```

### Bulk Issuance

**Step 1: Prepare CSV**
```csv
recipientEmail,templateId,evidenceUrl,expiresIn
alice@example.com,template-uuid-1,https://storage.azure.com/evidence1.pdf,365
bob@example.com,template-uuid-1,,730
charlie@example.com,template-uuid-2,https://storage.azure.com/evidence2.pdf,365
```

**Step 2: Upload CSV**
```bash
curl -X POST http://localhost:3000/api/badges/bulk \
  -H "Authorization: Bearer ISSUER_TOKEN" \
  -F "file=@badges.csv"

# Response includes success/failure count and details for each row
```

### Query Badges

**Get My Claimed Badges (Newest First)**
```bash
curl -X GET "http://localhost:3000/api/badges/my-badges?status=CLAIMED&sortBy=claimedAt&sortOrder=desc" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Search Issued Badges**
```bash
curl -X GET "http://localhost:3000/api/badges/issued?search=performance&page=1&limit=20" \
  -H "Authorization: Bearer ISSUER_TOKEN"
```

### Revoke Badge

```bash
curl -X POST http://localhost:3000/api/badges/badge-uuid/revoke \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Recipient no longer meets criteria"
  }'
```

---

## Best Practices

1. **Always validate claim tokens** before displaying claim UI
2. **Check expiration dates** before allowing claims
3. **Handle 410 Gone** for revoked badges gracefully
4. **Use pagination** for large badge queries
5. **Store assertion URLs** for permanent badge verification
6. **Validate CSV format** before bulk upload (client-side)
7. **Implement retry logic** for failed bulk issuances

## Related Documentation

- [Authentication API](./authentication.md) - Login and JWT tokens
- [Badge Templates API](./badge-templates.md) - Manage badge templates
- [Testing Guide](../../docs/development/testing-guide.md) - E2E test examples

---

**Last Updated:** January 27, 2026
