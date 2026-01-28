# GCredit API Documentation

**Version:** 0.5.0 (Sprint 5 Complete)  
**Base URL:** `http://localhost:3000`  
**API Prefix:** `/api` (for badge resources) or `/auth` (for authentication)  
**Last Updated:** 2026-01-29

## Overview

The GCredit Digital Badge Platform API provides a comprehensive set of RESTful endpoints for managing digital badges, authentication, and user profiles. The API follows Open Badges 2.0 specification and supports JWT-based authentication.

## Table of Contents

- [Authentication](#authentication)
- [API Modules](#api-modules)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Testing](#testing)

## Authentication

The API uses **JWT (JSON Web Token)** authentication with access and refresh tokens.

- **Access Token:** Short-lived (15 minutes), included in `Authorization: Bearer <token>` header
- **Refresh Token:** Long-lived (7 days), used to obtain new access tokens
- **Public Endpoints:** Some endpoints are marked `@Public()` and don't require authentication

### Getting Started

1. **Register:** `POST /auth/register` - Create new user account
2. **Login:** `POST /auth/login` - Get access and refresh tokens
3. **Use Token:** Include `Authorization: Bearer <access_token>` in subsequent requests
4. **Refresh:** `POST /auth/refresh` - Get new access token when expired

See [Authentication API](./authentication.md) for detailed endpoint documentation.

## API Modules

### 1. Authentication & Authorization
- **Path:** `/auth`
- **Documentation:** [authentication.md](./authentication.md)
- **Endpoints:** Register, Login, Password Reset, Profile Management
- **Roles:** `USER`, `ISSUER`, `MANAGER`, `ADMIN`

### 2. Badge Issuance
- **Path:** `/api/badges`
- **Documentation:** [badge-issuance.md](./badge-issuance.md)
- **Endpoints:** Issue, Claim, Query, Revoke, Open Badges Assertion
- **Key Features:**
  - Single badge issuance
  - Bulk badge issuance via CSV
  - Public claiming with token
  - Badge revocation
  - Open Badges 2.0 compliance

### 3. Badge Templates
- **Path:** `/api/badge-templates`
- **Documentation:** [badge-templates.md](./badge-templates.md)
- **Endpoints:** CRUD operations, search, filtering
- **Key Features:**
  - Template management
  - Image upload to Azure Blob Storage
  - Skill and category association
  - Criteria templates

### 4. Skills
- **Path:** `/api/skills`
- **Documentation:** [skills.md](./skills.md)
- **Endpoints:** CRUD operations, hierarchical skill management
- **Key Features:**
  - Skill categories
  - Parent-child relationships
  - Search and filtering

### 5. Skill Categories
- **Path:** `/api/skill-categories`
- **Documentation:** [skill-categories.md](./skill-categories.md)
- **Endpoints:** CRUD operations, hierarchical category management

### 6. Badge Wallet (Sprint 4)
- **Path:** `/api/badges/wallet`
- **Documentation:** In development
- **Endpoints:** Timeline view, similar badges, evidence management, milestones
- **Key Features:**
  - Timeline view with date grouping
  - Badge detail modal data
  - Evidence file upload and download (SAS tokens)
  - Similar badge recommendations
  - Milestone achievements

### 7. Badge Verification (Sprint 5) 🆕
- **Path:** `/verify/:verificationId` and `/api/verify/:verificationId`
- **Documentation:** In development
- **Endpoints:** Public verification, assertion export, baked PNG, integrity check
- **Key Features:**
  - Public HTML verification page (no auth)
  - Open Badges 2.0 JSON-LD assertions
  - Baked badge PNG download (JWT protected)
  - SHA-256 integrity verification
  - CORS-enabled public APIs

## Common Patterns

### Authentication Header
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Body (JSON)
```json
{
  "field": "value",
  "nestedObject": {
    "key": "value"
  }
}
```

### Success Response (200/201)
```json
{
  "id": "uuid",
  "field": "value",
  "createdAt": "2026-01-27T12:00:00.000Z",
  "updatedAt": "2026-01-27T12:00:00.000Z"
}
```

### Pagination (Query Parameters)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `status`: Filter by status
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc`

### Pagination Response
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Error Handling

All errors follow a consistent structure:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 410 Gone
```json
{
  "statusCode": 410,
  "message": "Badge has been revoked",
  "error": "Gone"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. Future versions will include:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
- Separate limits for bulk operations

## Testing

### Using cURL

**Login Example:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Authenticated Request Example:**
```bash
curl -X GET http://localhost:3000/api/badges/my-badges \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the Postman collection (coming soon)
2. Set environment variable `baseUrl` = `http://localhost:3000`
3. Set environment variable `accessToken` after login
4. Use `{{baseUrl}}` and `{{accessToken}}` in requests

### Automated Testing

See [Testing Guide](../../docs/development/testing-guide.md) for information on:
- Unit tests (Jest)
- E2E tests (Supertest)
- UAT test scenarios

## API Versioning

Current version: **v1** (implicit in all endpoints)

Future versioning strategy:
- URL versioning: `/api/v2/badges`
- Backward compatibility for at least 2 major versions

## Swagger/OpenAPI

Interactive API documentation available at:
- **Swagger UI:** `http://localhost:3000/api` (when server is running)
- **OpenAPI JSON:** `http://localhost:3000/api-json`

## Quick Reference

| Module | Base Path | Auth Required | Documentation |
|--------|-----------|---------------|---------------|
| Authentication | `/auth` | Mixed | [View](./authentication.md) |
| Badge Issuance | `/api/badges` | Yes (except claim) | [View](./badge-issuance.md) |
| Badge Templates | `/api/badge-templates` | Yes | [View](./badge-templates.md) |
| Skills | `/api/skills` | Yes | [View](./skills.md) |
| Skill Categories | `/api/skill-categories` | Yes | [View](./skill-categories.md) |

## Support

For questions or issues:
- Check the relevant module documentation
- Review the [troubleshooting guide](../../docs/development/troubleshooting.md)
- Contact the development team

---

**Last Updated:** January 27, 2026  
**Maintained By:** GCredit Development Team
