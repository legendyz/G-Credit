# GCredit API Documentation

**Version:** 1.2.0 (v1.2.0 Released)  
**Base URL:** `http://localhost:3000`  
**API Prefix:** `/api` (all endpoints, including `/api/auth`)  
**Last Updated:** 2026-02-24

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

1. **Register:** `POST /api/auth/register` - Create new user account
2. **Login:** `POST /api/auth/login` - Get access and refresh tokens
3. **Use Token:** Include `Authorization: Bearer <access_token>` in subsequent requests
4. **Refresh:** `POST /api/auth/refresh` - Get new access token when expired

See [Authentication API](./authentication.md) for detailed endpoint documentation.

## API Modules

### 1. Authentication & Authorization (9 routes)
- **Path:** `/api/auth`
- **Documentation:** [authentication.md](./authentication.md)
- **Endpoints:** Register, Login, Logout, Refresh, Profile (GET/PATCH), Password Reset, Change Password
- **Roles:** `EMPLOYEE`, `ISSUER`, `MANAGER`, `ADMIN`

### 2. Badge Issuance & Wallet (13 routes)
- **Path:** `/api/badges`
- **Documentation:** [badge-issuance.md](./badge-issuance.md)
- **Endpoints:** Issue, Claim, My Badges, Wallet, Issued, Get by ID, Revoke, Assertion, Bulk, Similar, Report, Download PNG, Integrity
- **Key Features:**
  - Single badge issuance + simple bulk
  - Public claiming with token
  - Badge wallet with timeline view
  - Badge revocation with audit
  - Open Badges 2.0 assertions & baked PNG
  - Integrity verification (SHA-256)

### 3. Badge Templates (8 routes)
- **Path:** `/api/badge-templates`
- **Documentation:** [badge-templates.md](./badge-templates.md)
- **Endpoints:** List (public), List All (admin), Get by ID, Create, Update, Delete, Criteria Templates
- **Key Features:**
  - Template management with image upload (Azure Blob)
  - Skill and category association
  - Criteria templates library

### 4. Skills (6 routes)
- **Path:** `/api/skills`
- **Endpoints:** List, Search, Get by ID, Create, Update, Delete

### 5. Skill Categories (6 routes)
- **Path:** `/api/skill-categories`
- **Endpoints:** List (hierarchical), List (flat), Get by ID, Create, Update, Delete

### 6. Badge Verification (1 route)
- **Path:** `/api/verify`
- **Endpoints:** GET `:verificationId` — Public verification page

### 7. Badge Sharing (4 routes)
- **Path:** `/api/badges/share`, `/api/badges/:badgeId/share/teams`
- **Endpoints:** Share via Email, Share via Teams, Analytics, Share History

### 8. Badge Widget & Embed (2 routes)
- **Path:** `/api/badges/:badgeId/embed`, `/api/badges/:badgeId/widget`
- **Endpoints:** Embeddable badge card, Badge widget

### 9. Evidence Management (4 routes)
- **Path:** `/api/badges/:badgeId/evidence`
- **Endpoints:** Upload, List, Download (SAS token), Preview

### 10. Dashboard (4 routes)
- **Path:** `/api/dashboard`
- **Endpoints:** Employee, Issuer, Manager, Admin role-based dashboards

### 11. Analytics (5 routes)
- **Path:** `/api/analytics`
- **Endpoints:** System Overview, Issuance Trends, Top Performers, Skills Distribution, Recent Activity
- **Caching:** 15-minute cache on most endpoints

### 12. Bulk Issuance (5 routes)
- **Path:** `/api/bulk-issuance`
- **Endpoints:** Download Template, Upload CSV, Preview, Confirm, Error Report
- **Limits:** 20 badges per session, 100KB file size, 30-min session expiry

### 13. Admin User Management (8 routes)
- **Path:** `/api/admin/users`
- **Endpoints:** List Users, Get User, Search/Filter, Update Role (optimistic locking), Update Status, Lock/Unlock, User Detail, Stats

### 14. M365 Sync (4 routes)
- **Path:** `/api/admin/m365-sync`
- **Endpoints:** Trigger Sync, Get Logs, Get Log Detail, Integration Status

### 15. Milestones (5 routes)
- **Path:** `/api/admin/milestones`, `/api/milestones/achievements`
- **Endpoints:** Create, List, Update, Delete (admin); Get Achievements (employee)

### 16. Teams Actions (1 route)
- **Path:** `/api/teams/actions`
- **Endpoints:** Claim Badge (from Teams Adaptive Card)

> **Full API Usage Guide:** See [API-GUIDE.md](./API-GUIDE.md) for detailed endpoint documentation with curl examples and response schemas.

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

Global rate limiting is implemented via NestJS `ThrottlerGuard` (Sprint 8):
- **Default:** 100 requests per 60 seconds per IP
- **Bulk Upload:** 10 requests per 5 minutes per user
- Custom limits per endpoint as needed

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

| Module | Base Path | Auth | Routes |
|--------|-----------|------|--------|
| Authentication | `/api/auth` | Mixed | 9 |
| Badge Issuance & Wallet | `/api/badges` | Mixed | 13 |
| Badge Templates | `/api/badge-templates` | Mixed | 8 |
| Skills | `/api/skills` | Mixed | 6 |
| Skill Categories | `/api/skill-categories` | Mixed | 6 |
| Badge Verification | `/api/verify` | Public | 1 |
| Badge Sharing | `/api/badges/share` | Yes | 4 |
| Widget & Embed | `/api/badges/:id/embed` | Public | 2 |
| Evidence | `/api/badges/:id/evidence` | Yes | 4 |
| Dashboard | `/api/dashboard` | Yes | 4 |
| Analytics | `/api/analytics` | Admin | 5 |
| Bulk Issuance | `/api/bulk-issuance` | Yes | 5 |
| Admin Users | `/api/admin/users` | Admin | 8 |
| M365 Sync | `/api/admin/m365-sync` | Admin | 4 |
| Milestones | `/api/admin/milestones` | Admin | 5 |
| Teams Actions | `/api/teams/actions` | Yes | 1 |
| **Total** | | | **~97** |

## Support

For questions or issues:
- Check the relevant module documentation
- Review the [troubleshooting guide](../../docs/development/troubleshooting.md)
- Contact the development team

---

**Last Updated:** February 24, 2026  
**Version:** 1.2.0 (Sprint 12 Complete)  
**Maintained By:** GCredit Development Team
