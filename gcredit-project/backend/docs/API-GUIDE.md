# API Usage Guide

**G-Credit Badge Platform REST API**  
**Version:** 1.0.0 (Sprint 10 - v1.0.0 Released)  
**Last Updated:** 2026-02-11

---

## Table of Contents

1. [Authentication](#authentication)
2. [Badge Templates](#badge-templates)
3. [Badge Issuance](#badge-issuance)
4. [Badge Revocation](#badge-revocation)
5. [Badge Verification](#badge-verification)
6. [Skills Management](#skills-management)
7. [Skill Categories](#skill-categories)
8. [Analytics API](#analytics-api)
9. [Admin User Management](#admin-user-management)
10. [M365 Sync API](#m365-sync-api)
11. [Bulk Issuance](#bulk-issuance) ⭐ NEW
12. [Error Handling](#error-handling)
13. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints except `/api/auth/login` and `/api/auth/register` require JWT authentication.

### Register New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "role": "EMPLOYEE"
  }'
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "role": "EMPLOYEE",
  "createdAt": "2026-01-26T10:00:00.000Z"
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gcredit.test",
    "password": "Admin123!"
  }'
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@gcredit.test",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

**Save Token for Subsequent Requests:**
```bash
# PowerShell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Current User Profile

```bash
# PowerShell
curl -X GET http://localhost:3000/api/auth/profile `
  -H "Authorization: Bearer $token"

# Bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "admin@gcredit.test",
  "name": "Admin User",
  "role": "ADMIN",
  "createdAt": "2026-01-25T08:00:00.000Z",
  "updatedAt": "2026-01-26T10:00:00.000Z"
}
```

---

## Badge Templates

### Create Badge Template (with Image)

**Endpoint:** `POST /api/badge-templates`  
**Authentication:** Required (ADMIN/ISSUER)  
**Content-Type:** `multipart/form-data`

```bash
# PowerShell
curl -X POST http://localhost:3000/api/badge-templates `
  -H "Authorization: Bearer $token" `
  -F "name=Python Expert" `
  -F "description=Mastery of Python programming language" `
  -F "category=SKILL" `
  -F "status=ACTIVE" `
  -F "skillIds=550e8400-e29b-41d4-a716-446655440001,550e8400-e29b-41d4-a716-446655440002" `
  -F "issuanceCriteria={\"minYearsExperience\":3,\"requiredCertifications\":[\"PCEP\",\"PCAP\"]}" `
  -F "image=@C:\path\to\python-badge.png"

# Bash
curl -X POST http://localhost:3000/api/badge-templates \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Python Expert" \
  -F "description=Mastery of Python programming language" \
  -F "category=SKILL" \
  -F "status=ACTIVE" \
  -F "skillIds=550e8400-e29b-41d4-a716-446655440001,550e8400-e29b-41d4-a716-446655440002" \
  -F 'issuanceCriteria={"minYearsExperience":3,"requiredCertifications":["PCEP","PCAP"]}' \
  -F "image=@/path/to/python-badge.png"
```

> **💡 Smart JSON Parsing:** The API automatically handles JSON fields in multipart forms, including malformed JSON from curl commands. Both properly quoted JSON and unquoted curl syntax (like `skillIds=uuid1,uuid2`) are automatically parsed correctly thanks to our MultipartJsonInterceptor middleware.

**Request Parameters:**
- `name` (required) - Badge name (max 100 chars)
- `description` (required) - Badge description (max 1000 chars)
- `category` (required) - One of: SKILL, ACHIEVEMENT, CERTIFICATION, MEMBERSHIP, PARTICIPATION
- `status` (optional) - DRAFT (default), ACTIVE, or ARCHIVED
- `skillIds` (optional) - Comma-separated skill UUIDs
- `issuanceCriteria` (optional) - JSON object with criteria
- `image` (optional) - Image file (JPG, PNG, GIF, WEBP, max 5MB)

**Response (201 Created):**
```json
{
  "id": "badg-1234-5678-9abc-def012345678",
  "name": "Python Expert",
  "description": "Mastery of Python programming language",
  "imageUrl": "https://gcreditstorage.blob.core.windows.net/badges/badg-1234-5678-9abc-def012345678.png",
  "category": "SKILL",
  "status": "ACTIVE",
  "issuanceCriteria": {
    "minYearsExperience": 3,
    "requiredCertifications": ["PCEP", "PCAP"]
  },
  "skills": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Python Programming",
      "description": "Core Python language skills"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Object-Oriented Programming",
      "description": "OOP principles and design patterns"
    }
  ],
  "createdAt": "2026-01-26T10:30:00.000Z",
  "updatedAt": "2026-01-26T10:30:00.000Z"
}
```

### List Active Badges (Public)

**Endpoint:** `GET /api/badge-templates`  
**Authentication:** Not Required  
**Filters:** Returns only ACTIVE badges

```bash
# Basic query
curl http://localhost:3000/api/badge-templates

# With pagination
curl "http://localhost:3000/api/badge-templates?page=1&limit=10"

# Filter by category
curl "http://localhost:3000/api/badge-templates?category=SKILL"

# Filter by skill
curl "http://localhost:3000/api/badge-templates?skillId=550e8400-e29b-41d4-a716-446655440001"

# Combined filters
curl "http://localhost:3000/api/badge-templates?category=SKILL&page=2&limit=5"
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `category` (optional) - Filter by category
- `skillId` (optional) - Filter by skill UUID

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "badg-1234-5678-9abc-def012345678",
      "name": "Python Expert",
      "description": "Mastery of Python programming language",
      "imageUrl": "https://gcreditstorage.blob.core.windows.net/badges/badg-1234-5678-9abc-def012345678.png",
      "category": "SKILL",
      "status": "ACTIVE",
      "skills": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Python Programming"
        }
      ],
      "createdAt": "2026-01-26T10:30:00.000Z"
    }
  ],
  "meta": {
    "totalCount": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### List All Badges (Admin)

**Endpoint:** `GET /api/badge-templates/admin`  
**Authentication:** Required (ADMIN/ISSUER)  
**Filters:** Returns badges in ALL statuses

```bash
# PowerShell
curl -X GET "http://localhost:3000/api/badge-templates/admin?page=1&limit=20" `
  -H "Authorization: Bearer $token"

# Bash
curl -X GET "http://localhost:3000/api/badge-templates/admin?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Additional Query Parameters (vs public endpoint):**
- `status` (optional) - Filter by DRAFT, ACTIVE, or ARCHIVED

**Response:** Same structure as public endpoint, but includes all statuses.

### Get Badge by ID

```bash
# PowerShell
curl -X GET "http://localhost:3000/api/badge-templates/badg-1234-5678-9abc-def012345678" `
  -H "Authorization: Bearer $token"

# Bash
curl -X GET "http://localhost:3000/api/badge-templates/badg-1234-5678-9abc-def012345678" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "id": "badg-1234-5678-9abc-def012345678",
  "name": "Python Expert",
  "description": "Mastery of Python programming language",
  "imageUrl": "https://gcreditstorage.blob.core.windows.net/badges/badg-1234-5678-9abc-def012345678.png",
  "category": "SKILL",
  "status": "ACTIVE",
  "issuanceCriteria": {
    "minYearsExperience": 3,
    "requiredCertifications": ["PCEP", "PCAP"]
  },
  "skills": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Python Programming",
      "description": "Core Python language skills",
      "categoryId": "cat-tech-001",
      "category": {
        "id": "cat-tech-001",
        "name": "Technical Skills"
      }
    }
  ],
  "createdAt": "2026-01-26T10:30:00.000Z",
  "updatedAt": "2026-01-26T10:30:00.000Z"
}
```

### Update Badge Template

**Endpoint:** `PATCH /api/badge-templates/:id`  
**Authentication:** Required (ADMIN/ISSUER)  
**Content-Type:** `multipart/form-data`

```bash
# PowerShell - Update without changing image
curl -X PATCH "http://localhost:3000/api/badge-templates/badg-1234-5678-9abc-def012345678" `
  -H "Authorization: Bearer $token" `
  -F "name=Senior Python Expert" `
  -F "description=Advanced mastery of Python programming" `
  -F "status=ACTIVE"

# PowerShell - Update with new image (old image auto-deleted)
curl -X PATCH "http://localhost:3000/api/badge-templates/badg-1234-5678-9abc-def012345678" `
  -H "Authorization: Bearer $token" `
  -F "name=Senior Python Expert" `
  -F "image=@C:\path\to\new-python-badge.png"
```

**Updatable Fields:**
- `name`, `description`, `category`, `status`
- `skillIds` (replaces existing skills)
- `issuanceCriteria` (replaces existing criteria)
- `image` (replaces existing image, old one deleted from Azure Blob)

**Response (200 OK):** Same structure as GET response with updated values.

### Delete Badge Template

**Endpoint:** `DELETE /api/badge-templates/:id`  
**Authentication:** Required (ADMIN/ISSUER)  
**Side Effects:** Cascades deletion to Azure Blob Storage

```bash
# PowerShell
curl -X DELETE "http://localhost:3000/api/badge-templates/badg-1234-5678-9abc-def012345678" `
  -H "Authorization: Bearer $token"

# Bash
curl -X DELETE "http://localhost:3000/api/badge-templates/badg-1234-5678-9abc-def012345678" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "Badge template deleted successfully",
  "deletedImageUrl": "https://gcreditstorage.blob.core.windows.net/badges/badg-1234-5678-9abc-def012345678.png"
}
```

### Search Badge Templates

**Endpoint:** `GET /api/badge-templates/search`  
**Authentication:** Not Required  
**Search Algorithm:** Full-text search on `name` and `description`

```bash
# Search by keyword
curl "http://localhost:3000/api/badge-templates/search?query=python"

# Search with pagination
curl "http://localhost:3000/api/badge-templates/search?query=leadership&page=1&limit=5"

# Search with category filter
curl "http://localhost:3000/api/badge-templates/search?query=programming&category=SKILL"
```

**Query Parameters:**
- `query` (required) - Search term (case-insensitive)
- `page`, `limit`, `category`, `skillId` - Same as list endpoint

**Response:** Same structure as list endpoint, filtered by search query.

---

## Skills Management

### Create Skill

```bash
# PowerShell
curl -X POST http://localhost:3000/api/skills `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Python Programming",
    "description": "Core Python language skills including syntax, data structures, and standard library",
    "categoryId": "cat-tech-001"
  }'
```

**Request Body:**
- `name` (required) - Skill name (max 100 chars)
- `description` (optional) - Skill description (max 500 chars)
- `categoryId` (required) - Parent category UUID

**Response (201 Created):**
```json
{
  "id": "skill-1234-5678-9abc-def012345678",
  "name": "Python Programming",
  "description": "Core Python language skills including syntax, data structures, and standard library",
  "categoryId": "cat-tech-001",
  "category": {
    "id": "cat-tech-001",
    "name": "Technical Skills"
  },
  "createdAt": "2026-01-26T11:00:00.000Z",
  "updatedAt": "2026-01-26T11:00:00.000Z"
}
```

### List All Skills

```bash
curl http://localhost:3000/api/skills
```

**Response (200 OK):**
```json
[
  {
    "id": "skill-1234-5678-9abc-def012345678",
    "name": "Python Programming",
    "description": "Core Python language skills",
    "categoryId": "cat-tech-001",
    "category": {
      "id": "cat-tech-001",
      "name": "Technical Skills",
      "parentId": null
    },
    "createdAt": "2026-01-26T11:00:00.000Z"
  }
]
```

### Get Skill by ID

```bash
curl http://localhost:3000/api/skills/skill-1234-5678-9abc-def012345678
```

**Response (200 OK):** Same structure as list item.

### Update Skill

```bash
# PowerShell
curl -X PATCH "http://localhost:3000/api/skills/skill-1234-5678-9abc-def012345678" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Advanced Python Programming",
    "description": "Expert-level Python including async, metaclasses, and performance optimization"
  }'
```

**Response (200 OK):** Same structure as GET response with updated values.

### Delete Skill

```bash
# PowerShell
curl -X DELETE "http://localhost:3000/api/skills/skill-1234-5678-9abc-def012345678" `
  -H "Authorization: Bearer $token"
```

**Response (200 OK):**
```json
{
  "message": "Skill deleted successfully"
}
```

---

## Skill Categories

### List All Categories (Hierarchical)

**Endpoint:** `GET /api/skill-categories`  
**Authentication:** Not Required  
**Structure:** Returns tree with parent/child relationships

```bash
curl http://localhost:3000/api/skill-categories
```

**Response (200 OK):**
```json
[
  {
    "id": "cat-tech-001",
    "name": "Technical Skills",
    "description": "Technology and engineering competencies",
    "parentId": null,
    "children": [
      {
        "id": "cat-tech-prog-001",
        "name": "Programming Languages",
        "description": "Proficiency in programming languages",
        "parentId": "cat-tech-001",
        "children": []
      },
      {
        "id": "cat-tech-data-001",
        "name": "Data Science",
        "description": "Data analysis and machine learning",
        "parentId": "cat-tech-001",
        "children": []
      }
    ],
    "createdAt": "2026-01-26T08:00:00.000Z"
  },
  {
    "id": "cat-lead-001",
    "name": "Leadership",
    "description": "Team and project leadership skills",
    "parentId": null,
    "children": [],
    "createdAt": "2026-01-26T08:00:00.000Z"
  }
]
```

### Create Category

```bash
# PowerShell - Create root category
curl -X POST http://localhost:3000/api/skill-categories `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Soft Skills",
    "description": "Interpersonal and communication skills"
  }'

# PowerShell - Create child category
curl -X POST http://localhost:3000/api/skill-categories `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Public Speaking",
    "description": "Presentation and speaking skills",
    "parentId": "cat-soft-001"
  }'
```

**Request Body:**
- `name` (required) - Category name (max 100 chars)
- `description` (optional) - Category description (max 500 chars)
- `parentId` (optional) - Parent category UUID (null for root)

**Response (201 Created):**
```json
{
  "id": "cat-soft-001",
  "name": "Soft Skills",
  "description": "Interpersonal and communication skills",
  "parentId": null,
  "createdAt": "2026-01-26T11:30:00.000Z",
  "updatedAt": "2026-01-26T11:30:00.000Z"
}
```

### Get Category by ID

```bash
curl http://localhost:3000/api/skill-categories/cat-tech-001
```

**Response (200 OK):**
```json
{
  "id": "cat-tech-001",
  "name": "Technical Skills",
  "description": "Technology and engineering competencies",
  "parentId": null,
  "parent": null,
  "children": [
    {
      "id": "cat-tech-prog-001",
      "name": "Programming Languages"
    }
  ],
  "skills": [
    {
      "id": "skill-1234",
      "name": "Python Programming"
    }
  ],
  "createdAt": "2026-01-26T08:00:00.000Z"
}
```

### Update Category

```bash
# PowerShell
curl -X PATCH "http://localhost:3000/api/skill-categories/cat-soft-001" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Interpersonal Skills",
    "description": "Communication and collaboration skills"
  }'
```

**Response (200 OK):** Same structure as GET response with updated values.

### Delete Category

```bash
# PowerShell
curl -X DELETE "http://localhost:3000/api/skill-categories/cat-soft-001" `
  -H "Authorization: Bearer $token"
```

**Response (200 OK):**
```json
{
  "message": "Category deleted successfully"
}
```

**Note:** Cannot delete category with existing skills or child categories. Delete dependencies first.

---

## Badge Issuance

### Issue Single Badge

**Endpoint:** `POST /api/badges`  
**Authentication:** Required  
**Authorization:** ADMIN, ISSUER

```bash
# PowerShell
curl -X POST http://localhost:3000/api/badges `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "templateId": "123e4567-e89b-12d3-a456-426614174000",
    "recipientId": "123e4567-e89b-12d3-a456-426614174001",
    "evidenceUrl": "https://storage.azure.com/evidence/cert.pdf",
    "expiresIn": 365
  }'
```

**Request Body:**
- `templateId` (required) - Badge template UUID
- `recipientId` (required) - Recipient user UUID
- `evidenceUrl` (optional) - Evidence file URL
- `expiresIn` (optional) - Expiration in days (1-3650, null = no expiration)

**Response (201 Created):**
```json
{
  "id": "badge-uuid-123",
  "templateId": "123e4567-e89b-12d3-a456-426614174000",
  "recipientId": "123e4567-e89b-12d3-a456-426614174001",
  "issuerId": "issuer-uuid-456",
  "status": "ISSUED",
  "claimToken": "claim_abc123def456",
  "claimUrl": "http://localhost:3000/claim/claim_abc123def456",
  "evidenceUrl": "https://storage.azure.com/evidence/cert.pdf",
  "expiresAt": "2027-02-01T12:00:00.000Z",
  "issuedAt": "2026-02-01T12:00:00.000Z",
  "template": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Outstanding Performance",
    "imageUrl": "https://storage.azure.com/badges/badge.png"
  }
}
```

### Bulk Issue Badges (CSV)

**Endpoint:** `POST /api/badges/bulk`  
**Authentication:** Required  
**Authorization:** ADMIN, ISSUER  
**Content-Type:** multipart/form-data

```bash
# PowerShell
curl -X POST http://localhost:3000/api/badges/bulk `
  -H "Authorization: Bearer $token" `
  -F "file=@C:\path\to\badges.csv"
```

**CSV Format:**
```csv
recipientEmail,templateId,evidenceUrl,expiresIn
user1@example.com,123e4567-e89b-12d3-a456-426614174000,https://storage.azure.com/evidence1.pdf,365
user2@example.com,123e4567-e89b-12d3-a456-426614174000,,730
```

**Response (201 Created):**
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

### Claim Badge (Public)

**Endpoint:** `POST /api/badges/:id/claim`  
**Authentication:** Not Required  
**Authorization:** None

```bash
curl -X POST http://localhost:3000/api/badges/badge-uuid-123/claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimToken": "claim_abc123def456"
  }'
```

**Response (200 OK):**
```json
{
  "id": "badge-uuid-123",
  "status": "CLAIMED",
  "claimedAt": "2026-02-01T12:00:00.000Z",
  "badge": {
    "name": "Outstanding Performance",
    "imageUrl": "https://storage.azure.com/badges/badge.png"
  },
  "assertionUrl": "http://localhost:3000/api/badges/badge-uuid-123/assertion",
  "message": "Badge claimed successfully!"
}
```

### Get My Badges

**Endpoint:** `GET /api/badges/my-badges`  
**Authentication:** Required  
**Authorization:** Any authenticated user

```bash
# PowerShell
curl -X GET "http://localhost:3000/api/badges/my-badges?page=1&limit=10&status=CLAIMED" `
  -H "Authorization: Bearer $token"
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `status` (optional) - Filter by ISSUED, CLAIMED, REVOKED
- `search` (optional) - Search by badge name or description

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "badge-uuid-123",
      "status": "CLAIMED",
      "claimedAt": "2026-02-01T12:00:00.000Z",
      "issuedAt": "2026-02-01T10:00:00.000Z",
      "template": {
        "name": "Outstanding Performance",
        "imageUrl": "https://storage.azure.com/badges/badge.png"
      },
      "issuer": {
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

### Get Issued Badges

**Endpoint:** `GET /api/badges/issued`  
**Authentication:** Required  
**Authorization:** ADMIN (all badges), ISSUER (own badges only)

```bash
# PowerShell
curl -X GET "http://localhost:3000/api/badges/issued?page=1&limit=10" `
  -H "Authorization: Bearer $token"
```

**Response:** Same structure as Get My Badges, but shows badges you issued.

---

## Badge Revocation

### Revoke Badge

**Endpoint:** `POST /api/badges/:id/revoke`  
**Authentication:** Required  
**Authorization:** ADMIN (any badge), ISSUER (own issued badges only)

```bash
# PowerShell
curl -X POST http://localhost:3000/api/badges/badge-uuid-123/revoke `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "reason": "Policy Violation",
    "notes": "Optional additional context for the revocation"
  }'
```

**Request Body:**
- `reason` (required) - One of: "Policy Violation", "Issued in Error", "Expired", "Duplicate", "Fraud", "Other"
- `notes` (optional) - Additional explanation (max 1000 chars)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Badge revoked successfully",
  "badge": {
    "id": "badge-uuid-123",
    "status": "REVOKED",
    "revokedAt": "2026-02-01T12:00:00.000Z",
    "revokedBy": "admin-uuid-999",
    "revocationReason": "Policy Violation",
    "revocationNotes": "Optional additional context"
  }
}
```

**Error Responses:**
- **403 Forbidden:** ISSUER trying to revoke another issuer's badge
- **404 Not Found:** Badge not found

**Note:** Re-revoking an already revoked badge returns 200 OK (idempotent operation).

---

## Badge Verification

### Get Open Badges 2.0 Assertion (Public)

**Endpoint:** `GET /api/badges/:id/assertion`  
**Authentication:** Not Required  
**Authorization:** None  
**Standards:** Open Badges 2.0 compliant

```bash
curl http://localhost:3000/api/badges/badge-uuid-123/assertion
```

**Response (200 OK):**
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
      "narrative": "Demonstrates exceptional performance"
    },
    "issuer": {
      "type": "Profile",
      "id": "http://localhost:3000/api/issuer",
      "name": "G-Credit Platform",
      "url": "http://localhost:3000",
      "email": "admin@gcredit.test"
    }
  },
  "recipient": {
    "type": "email",
    "hashed": true,
    "identity": "sha256$e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "issuedOn": "2026-02-01T10:00:00Z",
  "verification": {
    "type": "hosted"
  }
}
```

### Verify Badge (Public Page)

**Endpoint:** `GET /verify/:verificationId`  
**Authentication:** Not Required  
**Authorization:** None  
**Returns:** HTML page with badge details

```bash
curl http://localhost:3000/verify/verify-uuid-123
```

Returns a public verification page showing:
- Badge name, description, and image
- Recipient information (masked email)
- Issue date and expiration (if any)
- Revocation status
- Open Badges 2.0 assertion link

---

## Admin User Management

**Story:** 8.10 - Admin User Management Panel  
**Added:** Sprint 8 (2026-02-04)  
**Security:** Admin-only endpoints (requires `role: ADMIN`)

Admin users can manage all users in the system: view, search, filter, change roles, and activate/deactivate accounts. All actions are logged in the audit trail.

### List All Users

**Endpoint:** `GET /api/admin/users`  
**Auth Required:** Yes (Admin only)  
**Description:** Get paginated list of all users with search, filter, and sort capabilities.

**Query Parameters:**
- `page` (number, optional): Page number, default: 1
- `limit` (number, optional): Items per page, default: 25, max: 100
- `search` (string, optional): Search by name or email
- `roleFilter` (string, optional): Filter by role (`ADMIN`, `ISSUER`, `MANAGER`, `EMPLOYEE`)
- `statusFilter` (boolean, optional): Filter by active status
- `sortBy` (string, optional): Sort field (`name`, `email`, `role`, `lastLogin`), default: `name`
- `sortOrder` (string, optional): Sort direction (`asc`, `desc`), default: `asc`
- `cursor` (string, optional): Cursor for pagination (large datasets ≥1000 users)

**Example Request:**
```bash
# PowerShell
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=25&search=john&roleFilter=EMPLOYEE&sortBy=name&sortOrder=asc" `
  -H "Authorization: Bearer $token"

# Bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=25&search=john&roleFilter=EMPLOYEE&sortBy=name&sortOrder=asc" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "EMPLOYEE",
      "department": "Engineering",
      "isActive": true,
      "lastLogin": "2026-02-03T15:30:00Z",
      "roleSetManually": false,
      "roleUpdatedAt": null,
      "roleUpdatedBy": null,
      "roleVersion": 0
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 25,
    "totalPages": 6,
    "nextCursor": null,
    "hasMore": true
  }
}
```

**Hybrid Pagination Strategy:**
- **Small datasets (<1000 users):** Offset-based (page/limit)
- **Large datasets (≥1000 users):** Cursor-based (cursor/limit)
- Response includes `nextCursor` and `hasMore` fields for cursor pagination

---

### Get Single User

**Endpoint:** `GET /api/admin/users/:id`  
**Auth Required:** Yes (Admin only)  
**Description:** Get detailed information about a specific user.

**Example Request:**
```bash
# PowerShell
curl -X GET "http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000" `
  -H "Authorization: Bearer $token"

# Bash
curl -X GET "http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE",
  "department": "Engineering",
  "isActive": true,
  "lastLogin": "2026-02-03T15:30:00Z",
  "roleSetManually": false,
  "roleUpdatedAt": null,
  "roleUpdatedBy": null,
  "roleVersion": 0,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

---

### Update User Role

**Endpoint:** `PATCH /api/admin/users/:id/role`  
**Auth Required:** Yes (Admin only)  
**Description:** Change a user's role. Uses optimistic locking to prevent conflicts with M365 sync. Creates audit log entry.

**Restrictions:**
- Cannot change your own role (400 Bad Request)
- Requires `roleVersion` for optimistic locking (409 Conflict if mismatch)

**Request Body:**
```json
{
  "role": "ISSUER",
  "roleVersion": 0,
  "auditNote": "Promoted to badge issuer for HR department"
}
```

**Example Request:**
```bash
# PowerShell
curl -X PATCH "http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000/role" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "role": "ISSUER",
    "roleVersion": 0,
    "auditNote": "Promoted to badge issuer for HR department"
  }'

# Bash
curl -X PATCH "http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000/role" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ISSUER",
    "roleVersion": 0,
    "auditNote": "Promoted to badge issuer for HR department"
  }'
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "role": "ISSUER",
  "roleSetManually": true,
  "roleUpdatedAt": "2026-02-04T10:30:00Z",
  "roleUpdatedBy": "admin-user-id",
  "roleVersion": 1
}
```

**Error Responses:**
- `400 Bad Request`: Cannot change your own role
- `404 Not Found`: User not found
- `409 Conflict`: Role version mismatch (another process modified the role)

**Optimistic Locking:**
```json
{
  "statusCode": 409,
  "message": "User role was modified by another process. Please refresh and try again.",
  "error": "Conflict"
}
```

---

### Update User Status

**Endpoint:** `PATCH /api/admin/users/:id/status`  
**Auth Required:** Yes (Admin only)  
**Description:** Activate or deactivate a user account. Deactivated users cannot log in, but their badges remain valid. Creates audit log entry.

**Request Body:**
```json
{
  "isActive": false,
  "auditNote": "User left organization"
}
```

**Example Request (Deactivate):**
```bash
# PowerShell
curl -X PATCH "http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000/status" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "isActive": false,
    "auditNote": "User left organization"
  }'

# Bash
curl -X PATCH "http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false,
    "auditNote": "User left organization"
  }'
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "isActive": false
}
```

**Example Request (Reactivate):**
```bash
# PowerShell
curl -X PATCH "http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000/status" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "isActive": true,
    "auditNote": "User returned to organization"
  }'
```

**Effects of Deactivation:**
- User receives `401 Unauthorized` on login attempts
- Existing JWT tokens remain valid until expiry
- User's issued badges remain valid (not revoked)
- User's claimed badges remain valid
- User appears with "Inactive" status in admin list

---

### Audit Trail

All role changes and status changes are logged in the `user_role_audit_logs` table:

**Audit Log Fields:**
- `id`: Unique log entry ID
- `userId`: Target user ID
- `performedBy`: Admin user ID who made the change
- `action`: `ROLE_CHANGED` or `STATUS_CHANGED`
- `oldValue`: Previous role/status
- `newValue`: New role/status
- `note`: Admin's audit note (optional)
- `createdAt`: Timestamp of the change

**Cascade Delete:** When a user is deleted, all their audit logs are automatically deleted.

---

### Role Priority Logic

When M365 sync runs, roles are determined by this priority:

1. **Manual Admin Assignment (HIGHEST PRIORITY):** If `roleSetManually = true`, preserve the Admin-set role
2. **`.env` Manual Mapping:** Initial configuration mappings
3. **M365 Org Structure:** Auto-detect Managers (directReports > 0)
4. **Default:** Employee role

This ensures that Admin-assigned roles are never overwritten by M365 sync.

---

## M365 Sync API

**Story:** 8.9 - M365 Production Hardening  
**Added:** Sprint 8 (2026-02-05)  
**Security:** Admin-only endpoints (requires `role: ADMIN`)

Production-grade Microsoft 365 user synchronization with pagination, retry logic, audit logging, and user deactivation sync.

### Trigger M365 Sync

**Endpoint:** `POST /api/admin/m365-sync`  
**Auth Required:** Yes (Admin only)  
**Description:** Trigger a full or incremental M365 user sync.

**Request Body:**
```json
{
  "syncType": "FULL"  // Optional: "FULL" (default) or "INCREMENTAL"
}
```

**Example Request:**
```bash
# PowerShell
curl -X POST "http://localhost:3000/api/admin/m365-sync" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"syncType": "FULL"}'

# Bash
curl -X POST "http://localhost:3000/api/admin/m365-sync" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"syncType": "FULL"}'
```

**Response (201 Created):**
```json
{
  "syncId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "SUCCESS",
  "totalUsers": 1500,
  "syncedUsers": 1498,
  "createdUsers": 12,
  "updatedUsers": 1486,
  "deactivatedUsers": 3,
  "failedUsers": 2,
  "errors": [
    "User user1@example.com: Email already exists",
    "User user2@example.com: Invalid department format"
  ],
  "durationMs": 45230,
  "startedAt": "2026-02-05T10:00:00.000Z",
  "completedAt": "2026-02-05T10:00:45.230Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not an Admin
- `500 Internal Server Error`: Graph API unavailable or configuration error

---

### Get Sync History

**Endpoint:** `GET /api/admin/m365-sync/logs`  
**Auth Required:** Yes (Admin only)  
**Description:** Get paginated history of M365 sync operations.

**Query Parameters:**
- `limit` (number, optional): Maximum logs to return, default: 10, max: 100

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/m365-sync/logs?limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "syncDate": "2026-02-05T10:00:00.000Z",
    "syncType": "FULL",
    "userCount": 1500,
    "syncedCount": 1498,
    "createdCount": 12,
    "updatedCount": 1486,
    "failedCount": 2,
    "status": "SUCCESS",
    "durationMs": 45230,
    "syncedBy": "admin@example.com",
    "metadata": {
      "retryAttempts": 0,
      "pagesProcessed": 2,
      "deactivatedCount": 3
    }
  }
]
```

---

### Get Sync Log Details

**Endpoint:** `GET /api/admin/m365-sync/logs/:id`  
**Auth Required:** Yes (Admin only)  
**Description:** Get detailed information about a specific sync operation.

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/m365-sync/logs/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "syncDate": "2026-02-05T10:00:00.000Z",
  "syncType": "FULL",
  "userCount": 1500,
  "syncedCount": 1498,
  "createdCount": 12,
  "updatedCount": 1486,
  "failedCount": 2,
  "status": "SUCCESS",
  "errorMessage": null,
  "durationMs": 45230,
  "syncedBy": "admin@example.com",
  "metadata": {
    "retryAttempts": 0,
    "pagesProcessed": 2,
    "deactivatedCount": 3
  },
  "createdAt": "2026-02-05T10:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: Sync log with specified ID not found

---

### Get Integration Status

**Endpoint:** `GET /api/admin/m365-sync/status`  
**Auth Required:** Yes (Admin only)  
**Description:** Check M365 integration availability and last sync timestamp.

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/m365-sync/status" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "available": true,
  "lastSync": "2026-02-05T10:00:00.000Z"
}
```

**Response (M365 not configured):**
```json
{
  "available": false,
  "lastSync": null
}
```

---

### Sync Status Types

| Status | Description |
|--------|-------------|
| `SUCCESS` | All users synced successfully |
| `PARTIAL_SUCCESS` | Some users synced, some failed |
| `FAILURE` | Sync failed completely |
| `IN_PROGRESS` | Sync is currently running |

---

### Retry Logic (ADR-008)

The M365 Sync API implements exponential backoff retry for transient errors:

- **Max Retries:** 3
- **Base Delay:** 1000ms
- **Backoff Multiplier:** 2x (1s → 2s → 4s)
- **Retryable Errors:**
  - `429 Too Many Requests` (rate limiting)
  - `5xx Server Errors`
  - Network errors: `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`, `ECONNREFUSED`

---

## Bulk Issuance

Batch badge issuance via CSV upload. Allows ISSUER and ADMIN users to issue up to 20 badges in a single session.

**Authorization:** ISSUER or ADMIN role required for all endpoints.  
**Rate Limiting:** Upload endpoint limited to 10 requests per 5 minutes per user.  
**Session Expiry:** Preview sessions expire after 30 minutes.

### Download CSV Template

```bash
curl -X GET http://localhost:3000/api/bulk-issuance/template \
  -H "Authorization: Bearer $TOKEN" \
  -o bulk-issuance-template.csv
```

**Response (200 OK):** CSV file download with UTF-8 BOM header.

| Column | Required | Description |
|--------|----------|-------------|
| `badgeTemplateId` | Yes | UUID of an APPROVED badge template |
| `recipientEmail` | Yes | Email address of registered user |
| `evidenceUrl` | No | URL to supporting evidence |
| `narrativeJustification` | No | Text justification for issuance |

**Response Headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="bulk-badge-issuance-template-2026-02-08.csv"
```

### Upload CSV

```bash
curl -X POST http://localhost:3000/api/bulk-issuance/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@badges.csv"
```

**Constraints:**
- File size: max 100 KB
- File format: `.csv` or `.txt` (RFC 4180 compliant)
- Max rows: 20 (excluding header)
- UTF-8 BOM is automatically stripped

**Response (201 Created):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "VALIDATED",
  "totalRows": 5,
  "validRows": 4,
  "errorRows": 1,
  "errors": [
    {
      "row": 3,
      "field": "recipientEmail",
      "message": "User not found with this email"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` — Invalid CSV file format or missing file
- `429 Too Many Requests` — Rate limit exceeded (10 uploads per 5 minutes)

**Security:**
- CSV injection sanitization on all input fields (ARCH-C1)
- XSS input sanitization via `sanitize-html` (ARCH-C7)
- Database-backed sessions with `ReadCommitted` isolation (ARCH-C4)

### Get Preview

```bash
curl -X GET "http://localhost:3000/api/bulk-issuance/preview/{sessionId}?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `pageSize` | number | 10 | Items per page |

**Response (200 OK):**
```json
{
  "sessionId": "550e8400-...",
  "status": "VALIDATED",
  "totalRows": 5,
  "validRows": 4,
  "errorRows": 1,
  "rows": [
    {
      "row": 1,
      "badgeTemplateId": "abc123...",
      "badgeTemplateName": "Cloud Architecture",
      "recipientEmail": "jane@example.com",
      "recipientName": "Jane Doe",
      "evidenceUrl": "https://...",
      "narrativeJustification": "Completed certification",
      "isValid": true,
      "errors": []
    }
  ],
  "templateSummary": [
    { "templateName": "Cloud Architecture", "count": 3 },
    { "templateName": "Security Basics", "count": 2 }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

**Error Responses:**
- `403 Forbidden` — Not authorized to access this session (IDOR protection)
- `404 Not Found` — Session not found or expired

### Confirm Bulk Issuance

```bash
curl -X POST http://localhost:3000/api/bulk-issuance/confirm/{sessionId} \
  -H "Authorization: Bearer $TOKEN"
```

**Response (201 Created):**
```json
{
  "success": true,
  "processed": 4,
  "failed": 0,
  "results": [
    {
      "row": 1,
      "recipientEmail": "jane@example.com",
      "badgeName": "Cloud Architecture",
      "status": "success"
    },
    {
      "row": 2,
      "recipientEmail": "bob@example.com",
      "badgeName": "Security Basics",
      "status": "failed",
      "error": "Badge already issued to this recipient"
    }
  ]
}
```

**Processing Behavior:**
- Each badge is issued in an atomic `prisma.$transaction` (ARCH-C6)
- Partial failure: individual errors don't stop the batch
- Status transitions: `VALIDATED` → `PROCESSING` → `COMPLETED` / `FAILED`

**Error Responses:**
- `400 Bad Request` — Session not in VALIDATED status
- `403 Forbidden` — Not authorized to confirm this session
- `404 Not Found` — Session not found or expired

### Download Error Report

```bash
curl -X GET http://localhost:3000/api/bulk-issuance/error-report/{sessionId} \
  -H "Authorization: Bearer $TOKEN" \
  -o errors.csv
```

**Response (200 OK):** CSV file containing rows with validation errors.

**Response Headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="errors-550e8400.csv"
```

**Error Responses:**
- `400 Bad Request` — No errors in this session
- `403 Forbidden` — Not authorized to access this session
- `404 Not Found` — Session not found or expired

**Security:** CSV output is sanitized to prevent injection attacks (ARCH-C1).

---

## Error Handling

### Standard Error Response Format

All errors follow this structure:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "name",
      "message": "name should not be empty"
    }
  ]
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error, invalid JSON |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions (role check) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (unique constraint) |
| 413 | Payload Too Large | File upload exceeds 5MB |
| 415 | Unsupported Media Type | Invalid file MIME type |
| 500 | Internal Server Error | Database connection, server crash |

### Authentication Errors

**Missing Token:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Invalid Token:**
```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

**Expired Token:**
```json
{
  "statusCode": 401,
  "message": "Token has expired"
}
```

**Insufficient Permissions:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### Validation Errors

**Missing Required Fields:**
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "description should not be empty",
    "category must be one of: SKILL, ACHIEVEMENT, CERTIFICATION, MEMBERSHIP, PARTICIPATION"
  ],
  "error": "Bad Request"
}
```

**Invalid UUID:**
```json
{
  "statusCode": 400,
  "message": "Invalid UUID format",
  "error": "Bad Request"
}
```

### File Upload Errors

**File Too Large:**
```json
{
  "statusCode": 413,
  "message": "File size exceeds 5MB limit",
  "error": "Payload Too Large"
}
```

**Invalid MIME Type:**
```json
{
  "statusCode": 415,
  "message": "Invalid file type. Allowed: jpg, jpeg, png, gif, webp",
  "error": "Unsupported Media Type"
}
```

### Resource Not Found

```json
{
  "statusCode": 404,
  "message": "Badge template not found",
  "error": "Not Found"
}
```

---

## Analytics API

**Added in Sprint 8 (Story 8.4)**

Analytics endpoints provide system-wide metrics and statistics for monitoring platform health and usage.

**Features:**
- System overview statistics
- Badge issuance trends
- Top performers ranking
- Skills distribution analysis
- Recent activity feed

**Caching:** Most endpoints cached for 15 minutes (900,000ms) to optimize performance.

### System Overview

**GET** `/api/analytics/system-overview`

Returns system-wide statistics including user counts, badge metrics, and template counts.

**Authorization:** Admin only

```bash
# PowerShell
curl -X GET http://localhost:3000/api/analytics/system-overview `
  -H "Authorization: Bearer $token"

# Bash
curl -X GET http://localhost:3000/api/analytics/system-overview \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "users": {
    "total": 450,
    "activeThisMonth": 320,
    "newThisMonth": 25,
    "byRole": {
      "ADMIN": 5,
      "ISSUER": 20,
      "MANAGER": 45,
      "EMPLOYEE": 380
    }
  },
  "badges": {
    "totalIssued": 1234,
    "claimedCount": 1015,
    "pendingCount": 189,
    "revokedCount": 30,
    "claimRate": 0.82
  },
  "badgeTemplates": {
    "total": 23,
    "active": 18,
    "draft": 3,
    "archived": 2
  },
  "systemHealth": {
    "status": "healthy",
    "lastSync": "2026-02-03T09:00:00Z",
    "apiResponseTime": "120ms"
  }
}
```

**Error Responses:**
- `403 Forbidden` - Non-admin user
- `401 Unauthorized` - Missing or invalid token

---

### Issuance Trends

**GET** `/api/analytics/issuance-trends`

Returns badge issuance statistics over specified time period.

**Authorization:** Admin and Issuer (Issuer sees only their own data)

**Query Parameters:**
- `period` (optional) - Time period in days: `7`, `30`, `90`, or `365` (default: 30)
- `issuerId` (optional) - Filter by issuer UUID (Admin only)

```bash
# PowerShell - Last 30 days
curl -X GET "http://localhost:3000/api/analytics/issuance-trends?period=30" `
  -H "Authorization: Bearer $token"

# PowerShell - Filter by issuer (Admin only)
curl -X GET "http://localhost:3000/api/analytics/issuance-trends?period=90&issuerId=550e8400-e29b-41d4-a716-446655440000" `
  -H "Authorization: Bearer $token"
```

**Response (200 OK):**
```json
{
  "period": "last30days",
  "startDate": "2026-01-04",
  "endDate": "2026-02-03",
  "dataPoints": [
    {
      "date": "2026-01-04",
      "issued": 15,
      "claimed": 12,
      "revoked": 0
    },
    {
      "date": "2026-01-05",
      "issued": 20,
      "claimed": 18,
      "revoked": 1
    }
    // ... 30 data points total
  ],
  "totals": {
    "issued": 456,
    "claimed": 380,
    "revoked": 8,
    "claimRate": 0.83
  }
}
```

**Error Responses:**
- `403 Forbidden` - Issuer trying to view other issuer's data
- `400 Bad Request` - Invalid period value

---

### Top Performers

**GET** `/api/analytics/top-performers`

Returns employees ranked by badge count.

**Authorization:** Admin and Manager (Manager sees only their team)

**Query Parameters:**
- `teamId` (optional) - Filter by team/department (Manager must use own team)
- `limit` (optional) - Max results (1-100, default: 10)

```bash
# PowerShell - Top 10 performers
curl -X GET "http://localhost:3000/api/analytics/top-performers?limit=10" `
  -H "Authorization: Bearer $token"

# PowerShell - Top performers in Engineering team
curl -X GET "http://localhost:3000/api/analytics/top-performers?teamId=Engineering&limit=20" `
  -H "Authorization: Bearer $token"
```

**Response (200 OK):**
```json
{
  "teamId": "Engineering",
  "teamName": "Engineering Team",
  "period": "allTime",
  "topPerformers": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Smith",
      "badgeCount": 15,
      "latestBadge": {
        "templateName": "Python Expert",
        "claimedAt": "2026-02-01T10:00:00Z"
      }
    },
    {
      "userId": "550e8400-e29b-41d4-a716-446655440002",
      "name": "John Doe",
      "badgeCount": 12,
      "latestBadge": {
        "templateName": "AWS Certified",
        "claimedAt": "2026-01-28T14:30:00Z"
      }
    }
    // ... up to 'limit' performers
  ]
}
```

**Error Responses:**
- `403 Forbidden` - Manager trying to view different team
- `403 Forbidden` - Manager has no department assigned

---

### Skills Distribution

**GET** `/api/analytics/skills-distribution`

Returns aggregated skills statistics ranked by badge count.

**Authorization:** Admin only

```bash
# PowerShell
curl -X GET http://localhost:3000/api/analytics/skills-distribution `
  -H "Authorization: Bearer $token"
```

**Response (200 OK):**
```json
{
  "totalSkills": 45,
  "topSkills": [
    {
      "skillId": "550e8400-e29b-41d4-a716-446655440010",
      "skillName": "Python",
      "badgeCount": 120,
      "employeeCount": 85
    },
    {
      "skillId": "550e8400-e29b-41d4-a716-446655440011",
      "skillName": "Leadership",
      "badgeCount": 95,
      "employeeCount": 72
    }
    // ... top 20 skills
  ],
  "skillsByCategory": {
    "Technical": 180,
    "Soft Skills": 95,
    "Leadership": 60
  }
}
```

**Error Responses:**
- `403 Forbidden` - Non-admin user

---

### Recent Activity Feed

**GET** `/api/analytics/recent-activity`

Returns system-wide activity log with pagination.

**Authorization:** Admin only

**Query Parameters:**
- `limit` (optional) - Max results (1-100, default: 20)
- `offset` (optional) - Pagination offset (default: 0)

```bash
# PowerShell - Get last 20 activities
curl -X GET "http://localhost:3000/api/analytics/recent-activity?limit=20" `
  -H "Authorization: Bearer $token"

# PowerShell - Pagination (skip first 20)
curl -X GET "http://localhost:3000/api/analytics/recent-activity?limit=20&offset=20" `
  -H "Authorization: Bearer $token"
```

**Response (200 OK):**
```json
{
  "activities": [
    {
      "id": "act-001",
      "type": "BADGE_ISSUED",
      "actor": {
        "userId": "550e8400-e29b-41d4-a716-446655440020",
        "name": "John Issuer"
      },
      "target": {
        "userId": "550e8400-e29b-41d4-a716-446655440021",
        "name": "Jane Recipient",
        "badgeTemplateName": "Python Expert"
      },
      "timestamp": "2026-02-03T09:30:00Z"
    },
    {
      "id": "act-002",
      "type": "TEMPLATE_CREATED",
      "actor": {
        "userId": "550e8400-e29b-41d4-a716-446655440022",
        "name": "Admin User"
      },
      "templateName": "New Leadership Badge",
      "timestamp": "2026-02-03T09:00:00Z"
    }
    // ... up to 'limit' activities
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1250
  }
}
```

**Activity Types:**
- `BADGE_ISSUED` - Badge issued to recipient
- `BADGE_CLAIMED` - Recipient claimed badge
- `BADGE_REVOKED` - Badge revoked
- `TEMPLATE_CREATED` - New badge template created
- `USER_REGISTERED` - New user registered

**Error Responses:**
- `403 Forbidden` - Non-admin user
- `400 Bad Request` - Invalid limit or offset

---

## Rate Limiting

**Implementation:** Global `ThrottlerGuard` via NestJS (Sprint 8)

**Current Limits:**
- **Default:** 100 requests per 60 seconds per IP
- **Bulk Upload:** 10 requests per 5 minutes per user
- Custom limits per endpoint as needed
- Throttle responses return `429 Too Many Requests`

---

## Postman Collection

Import this collection into Postman for quick API testing:

### Environment Variables

```json
{
  "base_url": "http://localhost:3000",
  "token": "{{access_token}}",
  "badge_id": "",
  "skill_id": "",
  "category_id": ""
}
```

### Quick Start Collection

1. **Login** → Save `access_token` to environment
2. **Create Skill Category** → Save `id` as `category_id`
3. **Create Skill** → Save `id` as `skill_id`
4. **Create Badge Template** → Save `id` as `badge_id`
5. **List Badges** → Verify creation
6. **Search Badges** → Test search functionality

---

## Need Help?

- **Swagger UI:** http://localhost:3000/api (Interactive API explorer)
- **Testing Guide:** See [TESTING.md](./TESTING.md) for test examples
- **Deployment Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- **Issues:** Check [Common Issues](../README.md#common-issues--solutions) in main README

---

**Last Updated:** 2026-02-09  
**API Version:** 1.0.0-dev (Sprint 10 - v1.0.0 Release Sprint)  
**Author:** G-Credit Development Team  
**Coverage:** Sprint 0-10 (Authentication, Templates, Issuance, Verification, Sharing, Revocation, Analytics, Admin Users, M365 Sync, Bulk Issuance, Dashboard, Evidence, Milestones, Teams)  
**Total Routes:** ~77 across 16 modules  

**See Also:**
- [API Module Index](./api/README.md) - Quick reference table
- Swagger UI: http://localhost:3000/api (Interactive API explorer)
