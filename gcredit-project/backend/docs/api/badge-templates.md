# Badge Templates API

**Base Path:** `/badge-templates`  
**Authentication:** Mixed (GET endpoints public, create/update/delete require auth)  
**Authorization:** `ADMIN`, `ISSUER` for management operations

## Overview

The Badge Templates API provides endpoints for managing badge templates. Templates define the structure, appearance, and issuance criteria for digital badges. Supports image uploads to Azure Blob Storage and skill associations.

## Table of Contents

- [Endpoints](#endpoints)
  - [Get Badge Templates (Public)](#get-badge-templates-public)
  - [Get All Templates (Admin)](#get-all-templates-admin)
  - [Get Single Template](#get-single-template)
  - [Create Template](#create-template)
  - [Update Template](#update-template)
  - [Delete Template](#delete-template)
  - [Get Criteria Templates](#get-criteria-templates)
  - [Get Single Criteria Template](#get-single-criteria-template)
- [Data Models](#data-models)
- [Examples](#examples)

---

## Endpoints

### Get Badge Templates (Public)

Get all active badge templates with filtering and pagination.

**Endpoint:** `GET /badge-templates`  
**Authentication:** Not Required (Public)

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | 1 | Page number |
| `limit` | Integer | 10 | Items per page (max: 100) |
| `search` | String | - | Search by name or description |
| `category` | String | - | Filter by category: `achievement`, `skill`, `certification`, `participation` |
| `skillId` | UUID | - | Filter by associated skill ID |
| `sortBy` | String | `createdAt` | Sort field: `name`, `category`, `createdAt` |
| `sortOrder` | String | `desc` | Sort order: `asc` or `desc` |

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "template-uuid-123",
      "name": "TypeScript Advanced Certification",
      "description": "Completed TypeScript Advanced Course",
      "category": "certification",
      "imageUrl": "https://storage.azure.com/badges/typescript-cert.png",
      "issuanceCriteria": {
        "type": "exam_score",
        "conditions": [
          {
            "field": "score",
            "operator": ">=",
            "value": 80
          }
        ]
      },
      "validityPeriod": 365,
      "status": "ACTIVE",
      "skills": [
        {
          "id": "skill-uuid-1",
          "name": "TypeScript",
          "category": "Programming Languages"
        }
      ],
      "createdAt": "2026-01-27T12:00:00.000Z",
      "updatedAt": "2026-01-27T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Note:** Public endpoint only returns templates with `status: ACTIVE`. Use `/badge-templates/all` for admin access to all statuses.

#### Example (cURL)

```bash
curl -X GET "http://localhost:3000/badge-templates?page=1&limit=10&category=certification"
```

---

### Get All Templates (Admin)

Get all badge templates including drafts and archived (Admin/Issuer only).

**Endpoint:** `GET /badge-templates/all`  
**Authentication:** Required  
**Authorization:** `ADMIN`, `ISSUER`

#### Query Parameters

Same as [Get Badge Templates](#get-badge-templates-public), plus:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | String | - | Filter by status: `DRAFT`, `ACTIVE`, `ARCHIVED` |

#### Response (200 OK)

Same structure as public endpoint, but includes all statuses.

#### Error Responses

- **401 Unauthorized:** Missing or invalid access token
- **403 Forbidden:** User doesn't have ADMIN or ISSUER role

#### Example (cURL)

```bash
curl -X GET "http://localhost:3000/badge-templates/all?status=DRAFT" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Get Single Template

Get detailed information about a specific badge template.

**Endpoint:** `GET /badge-templates/:id`  
**Authentication:** Not Required (Public)

#### Response (200 OK)

```json
{
  "id": "template-uuid-123",
  "name": "TypeScript Advanced Certification",
  "description": "Completed TypeScript Advanced Course with excellence",
  "category": "certification",
  "imageUrl": "https://storage.azure.com/badges/typescript-cert.png",
  "issuanceCriteria": {
    "type": "exam_score",
    "conditions": [
      {
        "field": "score",
        "operator": ">=",
        "value": 80
      }
    ]
  },
  "validityPeriod": 365,
  "status": "ACTIVE",
  "skills": [
    {
      "id": "skill-uuid-1",
      "name": "TypeScript",
      "categoryId": "lang-uuid",
      "category": {
        "name": "Programming Languages"
      }
    },
    {
      "id": "skill-uuid-2",
      "name": "JavaScript",
      "categoryId": "lang-uuid",
      "category": {
        "name": "Programming Languages"
      }
    }
  ],
  "createdBy": {
    "id": "user-uuid-456",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "createdAt": "2026-01-27T12:00:00.000Z",
  "updatedAt": "2026-01-27T12:00:00.000Z"
}
```

#### Error Responses

- **404 Not Found:** Badge template not found

#### Example (cURL)

```bash
curl -X GET http://localhost:3000/badge-templates/template-uuid-123
```

---

### Create Template

Create a new badge template with image upload.

**Endpoint:** `POST /badge-templates`  
**Authentication:** Required  
**Authorization:** `ADMIN`, `ISSUER`  
**Content-Type:** `multipart/form-data`

#### Form Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Template name |
| `description` | String | No | Template description |
| `category` | Enum | Yes | One of: `achievement`, `skill`, `certification`, `participation` |
| `skillIds` | JSON Array | Yes | Array of skill UUIDs (JSON string) |
| `issuanceCriteria` | JSON Object | Yes | Issuance criteria (JSON string) |
| `validityPeriod` | Number | No | Validity in days (null = no expiration) |
| `image` | File | No | Badge image (PNG/JPG/GIF/WebP, max 5MB) |
| `status` | Enum | No | `DRAFT` or `ACTIVE` (default: `ACTIVE`) |

#### Request Example (Multipart Form Data)

```
POST /badge-templates
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="name"

TypeScript Advanced Certification
--boundary
Content-Disposition: form-data; name="description"

Completed TypeScript Advanced Course
--boundary
Content-Disposition: form-data; name="category"

certification
--boundary
Content-Disposition: form-data; name="skillIds"

["skill-uuid-1", "skill-uuid-2"]
--boundary
Content-Disposition: form-data; name="issuanceCriteria"

{"type":"exam_score","conditions":[{"field":"score","operator":">=","value":80}]}
--boundary
Content-Disposition: form-data; name="validityPeriod"

365
--boundary
Content-Disposition: form-data; name="image"; filename="badge.png"
Content-Type: image/png

<binary image data>
--boundary--
```

#### Issuance Criteria Structure

```json
{
  "type": "exam_score | course_completion | project_submission | manager_approval",
  "conditions": [
    {
      "field": "score | completion_percentage | submission_count",
      "operator": ">= | > | = | < | <=",
      "value": 80
    }
  ]
}
```

#### Response (201 Created)

```json
{
  "id": "template-uuid-123",
  "name": "TypeScript Advanced Certification",
  "description": "Completed TypeScript Advanced Course",
  "category": "certification",
  "imageUrl": "https://storage.azure.com/badges/typescript-cert-abc123.png",
  "issuanceCriteria": {
    "type": "exam_score",
    "conditions": [{"field": "score", "operator": ">=", "value": 80}]
  },
  "validityPeriod": 365,
  "status": "ACTIVE",
  "skills": [...],
  "createdAt": "2026-01-27T12:00:00.000Z",
  "updatedAt": "2026-01-27T12:00:00.000Z"
}
```

#### Error Responses

- **400 Bad Request:** Invalid input, missing required fields, or invalid image format
- **401 Unauthorized:** Missing or invalid access token
- **403 Forbidden:** User doesn't have ADMIN or ISSUER role

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/badge-templates \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "name=TypeScript Advanced Certification" \
  -F "description=Completed TypeScript Advanced Course" \
  -F "category=certification" \
  -F 'skillIds=["skill-uuid-1","skill-uuid-2"]' \
  -F 'issuanceCriteria={"type":"exam_score","conditions":[{"field":"score","operator":">=","value":80}]}' \
  -F "validityPeriod=365" \
  -F "image=@badge.png"
```

---

### Update Template

Update an existing badge template.

**Endpoint:** `PATCH /badge-templates/:id`  
**Authentication:** Required  
**Authorization:** `ADMIN`, `ISSUER`  
**Content-Type:** `multipart/form-data`

#### Form Data

All fields are optional (only include fields to update):

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | New template name |
| `description` | String | New description |
| `category` | Enum | New category |
| `skillIds` | JSON Array | New skill IDs (replaces existing) |
| `issuanceCriteria` | JSON Object | New criteria |
| `validityPeriod` | Number | New validity period |
| `status` | Enum | `DRAFT`, `ACTIVE`, or `ARCHIVED` |
| `image` | File | New badge image (optional) |

#### Response (200 OK)

Same structure as Create Template response.

#### Error Responses

- **400 Bad Request:** Invalid input or image format
- **401 Unauthorized:** Missing or invalid access token
- **403 Forbidden:** User doesn't have ADMIN or ISSUER role
- **404 Not Found:** Badge template not found

#### Example (cURL)

```bash
curl -X PATCH http://localhost:3000/badge-templates/template-uuid-123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "name=TypeScript Expert Certification" \
  -F "status=ACTIVE" \
  -F "image=@new-badge.png"
```

---

### Delete Template

Delete a badge template (Admin only).

**Endpoint:** `DELETE /badge-templates/:id`  
**Authentication:** Required  
**Authorization:** `ADMIN` only

#### Response (200 OK)

```json
{
  "message": "Badge template deleted successfully",
  "id": "template-uuid-123"
}
```

#### Error Responses

- **401 Unauthorized:** Missing or invalid access token
- **403 Forbidden:** User doesn't have ADMIN role
- **404 Not Found:** Badge template not found
- **409 Conflict:** Cannot delete template with issued badges

#### Example (cURL)

```bash
curl -X DELETE http://localhost:3000/badge-templates/template-uuid-123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Get Criteria Templates

Get predefined issuance criteria templates.

**Endpoint:** `GET /badge-templates/criteria-templates`  
**Authentication:** Not Required (Public)

#### Response (200 OK)

```json
{
  "templates": [
    {
      "key": "exam_score",
      "name": "Exam Score",
      "description": "Award badge based on exam score",
      "template": {
        "type": "exam_score",
        "conditions": [
          {
            "field": "score",
            "operator": ">=",
            "value": 80
          }
        ]
      }
    },
    {
      "key": "course_completion",
      "name": "Course Completion",
      "description": "Award badge upon course completion",
      "template": {
        "type": "course_completion",
        "conditions": [
          {
            "field": "completion_percentage",
            "operator": "=",
            "value": 100
          }
        ]
      }
    },
    {
      "key": "project_submission",
      "name": "Project Submission",
      "description": "Award badge after project submission",
      "template": {
        "type": "project_submission",
        "conditions": []
      }
    }
  ]
}
```

#### Example (cURL)

```bash
curl -X GET http://localhost:3000/badge-templates/criteria-templates
```

---

### Get Single Criteria Template

Get a specific predefined criteria template by key.

**Endpoint:** `GET /badge-templates/criteria-templates/:key`  
**Authentication:** Not Required (Public)

#### Response (200 OK)

```json
{
  "key": "exam_score",
  "name": "Exam Score",
  "description": "Award badge based on exam score",
  "template": {
    "type": "exam_score",
    "conditions": [
      {
        "field": "score",
        "operator": ">=",
        "value": 80
      }
    ]
  }
}
```

#### Error Responses

- **404 Not Found:** Criteria template not found

#### Example (cURL)

```bash
curl -X GET http://localhost:3000/badge-templates/criteria-templates/exam_score
```

---

## Data Models

### Badge Template Status Enum

```typescript
enum TemplateStatus {
  DRAFT = 'DRAFT',       // Template in draft, not visible publicly
  ACTIVE = 'ACTIVE',     // Template active, can be used for issuance
  ARCHIVED = 'ARCHIVED'  // Template archived, read-only
}
```

### Badge Category Enum

```typescript
enum BadgeCategory {
  ACHIEVEMENT = 'achievement',      // Achievement badges
  SKILL = 'skill',                 // Skill badges
  CERTIFICATION = 'certification',  // Certification badges
  PARTICIPATION = 'participation'   // Participation badges
}
```

### Badge Template Object

```typescript
{
  id: string;                    // UUID
  name: string;                  // Template name
  description?: string;          // Template description
  category: BadgeCategory;       // Badge category
  imageUrl?: string;             // Azure Blob Storage URL
  issuanceCriteria: object;      // Issuance criteria JSON
  validityPeriod?: number;       // Validity in days (null = no expiration)
  status: TemplateStatus;        // Current status
  skills: Skill[];               // Associated skills
  createdBy: User;               // Creator
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

---

## Examples

### Complete Workflow: Create → Issue → Claim

**Step 1: Create Template**
```bash
curl -X POST http://localhost:3000/badge-templates \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "name=Python Expert" \
  -F "category=certification" \
  -F 'skillIds=["python-uuid"]' \
  -F 'issuanceCriteria={"type":"exam_score","conditions":[{"field":"score","operator":">=","value":90}]}' \
  -F "image=@python-badge.png"

# Save template ID from response
```

**Step 2: Issue Badge Using Template**
```bash
curl -X POST http://localhost:3000/api/badges \
  -H "Authorization: Bearer ISSUER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "TEMPLATE_ID_FROM_STEP_1",
    "recipientId": "recipient-uuid",
    "expiresIn": 365
  }'
```

**Step 3: Recipient Claims Badge**
```bash
curl -X POST http://localhost:3000/api/badges/badge-uuid/claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimToken": "claim_token_from_step_2"
  }'
```

### Search and Filter Templates

**Search by Name**
```bash
curl -X GET "http://localhost:3000/badge-templates?search=TypeScript"
```

**Filter by Category**
```bash
curl -X GET "http://localhost:3000/badge-templates?category=certification&page=1&limit=20"
```

**Filter by Skill**
```bash
curl -X GET "http://localhost:3000/badge-templates?skillId=typescript-uuid"
```

**Sort by Name (Ascending)**
```bash
curl -X GET "http://localhost:3000/badge-templates?sortBy=name&sortOrder=asc"
```

### Update Template Status

**Publish Draft Template**
```bash
curl -X PATCH http://localhost:3000/badge-templates/template-uuid \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "status=ACTIVE"
```

**Archive Template**
```bash
curl -X PATCH http://localhost:3000/badge-templates/template-uuid \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "status=ARCHIVED"
```

### Update Template Image

```bash
curl -X PATCH http://localhost:3000/badge-templates/template-uuid \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "image=@new-badge-design.png"
```

---

## Best Practices

1. **Use descriptive template names** that clearly indicate the achievement
2. **Always upload high-quality images** (recommended: 512x512px PNG)
3. **Set appropriate validity periods** for time-sensitive certifications
4. **Use DRAFT status** during template creation and testing
5. **Archive (don't delete)** templates that are no longer used
6. **Associate relevant skills** to improve discoverability
7. **Define clear issuance criteria** for automated badge issuance
8. **Test templates** with test issuances before publishing

## Image Guidelines

- **Format:** PNG, JPG, GIF, or WebP
- **Size:** Max 5MB
- **Recommended Dimensions:** 512x512px (square)
- **Aspect Ratio:** 1:1 (square)
- **Background:** Transparent PNG recommended
- **Storage:** Azure Blob Storage (automatically handled)

## Related Documentation

- [Badge Issuance API](./badge-issuance.md) - Issue badges from templates
- [Skills API](./skills.md) - Manage skills for templates
- [Authentication API](./authentication.md) - Login and permissions

---

**Last Updated:** January 27, 2026
