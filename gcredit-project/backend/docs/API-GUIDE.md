# API Usage Guide

**G-Credit Badge Platform REST API**  
**Version:** 0.7.0 (Sprint 7 - Badge Revocation)  
**Last Updated:** 2026-02-01

---

## Table of Contents

1. [Authentication](#authentication)
2. [Badge Templates](#badge-templates)
3. [Badge Issuance](#badge-issuance)
4. [Badge Revocation](#badge-revocation)
5. [Badge Verification](#badge-verification)
6. [Skills Management](#skills-management)
7. [Skill Categories](#skill-categories)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints except `/auth/login` and `/auth/register` require JWT authentication.

### Register New User

```bash
curl -X POST http://localhost:3000/auth/register \
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
curl -X POST http://localhost:3000/auth/login \
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
curl -X GET http://localhost:3000/auth/profile `
  -H "Authorization: Bearer $token"

# Bash
curl -X GET http://localhost:3000/auth/profile \
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

**Endpoint:** `PUT /api/badge-templates/:id`  
**Authentication:** Required (ADMIN/ISSUER)  
**Content-Type:** `multipart/form-data`

```bash
# PowerShell - Update without changing image
curl -X PUT "http://localhost:3000/api/badge-templates/badg-1234-5678-9abc-def012345678" `
  -H "Authorization: Bearer $token" `
  -F "name=Senior Python Expert" `
  -F "description=Advanced mastery of Python programming" `
  -F "status=ACTIVE"

# PowerShell - Update with new image (old image auto-deleted)
curl -X PUT "http://localhost:3000/api/badge-templates/badg-1234-5678-9abc-def012345678" `
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
curl -X POST http://localhost:3000/api/badge-templates/skills `
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
curl http://localhost:3000/api/badge-templates/skills
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
curl http://localhost:3000/api/badge-templates/skills/skill-1234-5678-9abc-def012345678
```

**Response (200 OK):** Same structure as list item.

### Update Skill

```bash
# PowerShell
curl -X PUT "http://localhost:3000/api/badge-templates/skills/skill-1234-5678-9abc-def012345678" `
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
curl -X DELETE "http://localhost:3000/api/badge-templates/skills/skill-1234-5678-9abc-def012345678" `
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

**Endpoint:** `GET /api/badge-templates/categories`  
**Authentication:** Not Required  
**Structure:** Returns tree with parent/child relationships

```bash
curl http://localhost:3000/api/badge-templates/categories
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
curl -X POST http://localhost:3000/api/badge-templates/categories `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Soft Skills",
    "description": "Interpersonal and communication skills"
  }'

# PowerShell - Create child category
curl -X POST http://localhost:3000/api/badge-templates/categories `
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
curl http://localhost:3000/api/badge-templates/categories/cat-tech-001
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
curl -X PUT "http://localhost:3000/api/badge-templates/categories/cat-soft-001" `
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
curl -X DELETE "http://localhost:3000/api/badge-templates/categories/cat-soft-001" `
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

## Rate Limiting

**Current Configuration:** No rate limiting implemented (to be added in future sprint)

**Recommended Limits for Production:**
- Authentication endpoints: 5 requests per minute per IP
- Public endpoints: 100 requests per minute per IP
- Authenticated endpoints: 200 requests per minute per user
- File upload endpoints: 10 requests per minute per user

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

- **Swagger UI:** http://localhost:3000/api-docs (Interactive API explorer)
- **Testing Guide:** See [TESTING.md](./TESTING.md) for test examples
- **Deployment Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- **Issues:** Check [Common Issues](../README.md#common-issues--solutions) in main README

---

**Last Updated:** 2026-02-01  
**API Version:** 0.7.0 (Sprint 7 - Badge Revocation Complete)  
**Author:** G-Credit Development Team  
**Coverage:** Sprint 0-7 (Authentication, Templates, Issuance, Verification, Sharing, Revocation)  

**Detailed API Documentation:**
- [Badge Issuance API](./api/badge-issuance.md) - Complete badge lifecycle documentation
- Swagger UI: http://localhost:3000/api-docs (Interactive API explorer)
