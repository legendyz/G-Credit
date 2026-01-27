# Authentication API

**Base Path:** `/auth`  
**Authentication:** Mixed (some endpoints public, some require auth)

## Overview

The Authentication API provides endpoints for user registration, login, password management, and profile operations. It uses JWT (JSON Web Token) for authentication with access and refresh tokens.

## Table of Contents

- [Endpoints](#endpoints)
  - [Register](#register)
  - [Login](#login)
  - [Request Password Reset](#request-password-reset)
  - [Reset Password](#reset-password)
  - [Refresh Access Token](#refresh-access-token)
  - [Logout](#logout)
  - [Get Profile](#get-profile)
  - [Update Profile](#update-profile)
  - [Change Password](#change-password)
- [Authentication Flow](#authentication-flow)
- [Token Management](#token-management)
- [User Roles](#user-roles)
- [Examples](#examples)

---

## Endpoints

### Register

Create a new user account.

**Endpoint:** `POST /auth/register`  
**Authentication:** Not Required (Public)

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | Email | Yes | Valid email address |
| `password` | String | Yes | Min 8 chars, must contain uppercase, lowercase, and number |
| `firstName` | String | Yes | User's first name (min 1 char) |
| `lastName` | String | Yes | User's last name (min 1 char) |
| `role` | String | No | One of: `ADMIN`, `ISSUER`, `MANAGER`, `EMPLOYEE` (default: `EMPLOYEE`) |

#### Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- Special characters recommended but not required

#### Response (201 Created)

```json
{
  "id": "user-uuid-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE",
  "isActive": true,
  "createdAt": "2026-01-27T12:00:00.000Z",
  "updatedAt": "2026-01-27T12:00:00.000Z"
}
```

#### Error Responses

- **400 Bad Request:** Invalid email format, weak password, or missing required fields
- **409 Conflict:** Email already registered

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE"
  }'
```

---

### Login

Authenticate user and receive JWT tokens.

**Endpoint:** `POST /auth/login`  
**Authentication:** Not Required (Public)

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | Email | Yes | User's email address |
| `password` | String | Yes | User's password |

#### Response (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "isActive": true
  }
}
```

| Field | Description |
|-------|-------------|
| `accessToken` | Short-lived JWT token (15 minutes) |
| `refreshToken` | Long-lived JWT token (7 days) |
| `expiresIn` | Access token expiration in seconds (900 = 15 minutes) |
| `user` | User profile information |

#### Error Responses

- **400 Bad Request:** Invalid email format or missing fields
- **401 Unauthorized:** Invalid credentials
- **403 Forbidden:** Account inactive

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

---

### Request Password Reset

Request a password reset email with reset token.

**Endpoint:** `POST /auth/request-reset`  
**Authentication:** Not Required (Public)

#### Request Body

```json
{
  "email": "user@example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | Email | Yes | User's email address |

#### Response (200 OK)

```json
{
  "message": "If an account with that email exists, a password reset link has been sent.",
  "expiresIn": 3600
}
```

**Note:** Response is always 200 OK (even if email doesn't exist) to prevent email enumeration attacks.

#### Email Content

User receives an email with:
- Reset token (valid for 1 hour)
- Reset link: `http://localhost:3000/reset-password?token=RESET_TOKEN`

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

### Reset Password

Reset password using reset token from email.

**Endpoint:** `POST /auth/reset-password`  
**Authentication:** Not Required (Public)

#### Request Body

```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass456!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | String | Yes | Reset token from email |
| `newPassword` | String | Yes | New password (same requirements as register) |

#### Response (200 OK)

```json
{
  "message": "Password reset successfully",
  "email": "user@example.com"
}
```

#### Error Responses

- **400 Bad Request:** Invalid or expired token, weak password
- **404 Not Found:** Token not found

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_abc123xyz789",
    "newPassword": "NewSecurePass456!"
  }'
```

---

### Refresh Access Token

Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`  
**Authentication:** Not Required (Public, but requires refresh token)

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | String | Yes | Refresh token from login |

#### Response (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

#### Error Responses

- **401 Unauthorized:** Invalid or expired refresh token

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

### Logout

Invalidate refresh token and logout user.

**Endpoint:** `POST /auth/logout`  
**Authentication:** Not Required (Public, but requires refresh token)

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | String | Yes | Refresh token to invalidate |

#### Response (200 OK)

```json
{
  "message": "Logged out successfully"
}
```

**Note:** After logout, the refresh token cannot be used to get new access tokens.

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

### Get Profile

Get current user's profile information.

**Endpoint:** `GET /auth/profile`  
**Authentication:** Required

#### Response (200 OK)

```json
{
  "id": "user-uuid-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE",
  "isActive": true,
  "createdAt": "2026-01-27T12:00:00.000Z",
  "updatedAt": "2026-01-27T12:00:00.000Z",
  "lastLoginAt": "2026-01-27T14:30:00.000Z"
}
```

#### Error Responses

- **401 Unauthorized:** Missing or invalid access token

#### Example (cURL)

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Update Profile

Update current user's profile information.

**Endpoint:** `PATCH /auth/profile`  
**Authentication:** Required

#### Request Body

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | String | No | New first name |
| `lastName` | String | No | New last name |
| `email` | Email | No | New email address |

**Note:** All fields are optional. Only include fields you want to update.

#### Response (200 OK)

```json
{
  "id": "user-uuid-123",
  "email": "john.smith@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "role": "EMPLOYEE",
  "isActive": true,
  "updatedAt": "2026-01-27T15:00:00.000Z"
}
```

#### Error Responses

- **400 Bad Request:** Invalid email format
- **401 Unauthorized:** Missing or invalid access token
- **409 Conflict:** Email already in use by another user

#### Example (cURL)

```bash
curl -X PATCH http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lastName": "Smith"
  }'
```

---

### Change Password

Change current user's password (requires current password).

**Endpoint:** `POST /auth/change-password`  
**Authentication:** Required

#### Request Body

```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentPassword` | String | Yes | Current password for verification |
| `newPassword` | String | Yes | New password (must meet requirements) |

#### Response (200 OK)

```json
{
  "message": "Password changed successfully"
}
```

#### Error Responses

- **400 Bad Request:** Weak new password
- **401 Unauthorized:** Invalid current password or missing access token

#### Example (cURL)

```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

---

## Authentication Flow

### 1. Registration & Login Flow

```
User → POST /auth/register
     ← 201 Created (user profile)

User → POST /auth/login
     ← 200 OK (accessToken, refreshToken)

User → Request with Authorization: Bearer {accessToken}
     ← 200 OK (protected resource)
```

### 2. Token Refresh Flow

```
User → POST /auth/refresh (with refreshToken)
     ← 200 OK (new accessToken)

User → Request with Authorization: Bearer {newAccessToken}
     ← 200 OK (protected resource)
```

### 3. Password Reset Flow

```
User → POST /auth/request-reset (with email)
     ← 200 OK

Email → User receives reset token

User → POST /auth/reset-password (with token + newPassword)
     ← 200 OK

User → POST /auth/login (with email + newPassword)
     ← 200 OK (accessToken, refreshToken)
```

---

## Token Management

### Access Token

- **Lifetime:** 15 minutes (900 seconds)
- **Purpose:** Authenticate API requests
- **Storage:** Memory or sessionStorage (never localStorage)
- **Usage:** `Authorization: Bearer {accessToken}` header
- **Claims:**
  ```json
  {
    "sub": "user-uuid-123",
    "email": "user@example.com",
    "role": "EMPLOYEE",
    "iat": 1674825600,
    "exp": 1674826500
  }
  ```

### Refresh Token

- **Lifetime:** 7 days
- **Purpose:** Obtain new access tokens
- **Storage:** HttpOnly cookie (recommended) or secure storage
- **Usage:** POST to `/auth/refresh` endpoint
- **One-time use:** Each refresh invalidates the old refresh token and issues a new one

### Best Practices

1. **Store access token in memory** (or sessionStorage for SPAs)
2. **Store refresh token in HttpOnly cookie** (if backend supports) or secure storage
3. **Never store tokens in localStorage** (XSS vulnerability)
4. **Implement automatic token refresh** before expiration
5. **Clear tokens on logout** using `/auth/logout` endpoint
6. **Handle 401 errors** by attempting refresh, then redirecting to login
7. **Include tokens in every protected request**

---

## User Roles

### EMPLOYEE (Default)
- Basic user role
- Can claim badges
- Can view own badges
- Can update own profile

### MANAGER
- All EMPLOYEE permissions
- Can view team badges (future feature)
- Can approve badge requests (future feature)

### ISSUER
- All EMPLOYEE permissions
- Can issue badges
- Can view badges they issued
- Can upload bulk badge CSV

### ADMIN
- All permissions
- Can manage users
- Can manage badge templates
- Can revoke badges
- Can view all issued badges

### Role-Based Access Control (RBAC)

Endpoints are protected using `@Roles()` decorator:

```typescript
@Roles(UserRole.ADMIN, UserRole.ISSUER)  // Multiple roles allowed
@Post('/api/badges')
async issueBadge() { ... }
```

---

## Examples

### Complete Authentication Flow

**Step 1: Register New User**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123!",
    "firstName": "Alice",
    "lastName": "Smith",
    "role": "EMPLOYEE"
  }'
```

**Step 2: Login**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123!"
  }'

# Save accessToken and refreshToken from response
```

**Step 3: Access Protected Resource**
```bash
curl -X GET http://localhost:3000/api/badges/my-badges \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Step 4: Refresh Token (after 14 minutes)**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'

# Use new accessToken for subsequent requests
```

**Step 5: Logout**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Password Reset Flow

**Step 1: Request Reset**
```bash
curl -X POST http://localhost:3000/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com"
  }'

# Check email for reset token
```

**Step 2: Reset Password**
```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "newPassword": "NewSecurePass456!"
  }'
```

**Step 3: Login with New Password**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "NewSecurePass456!"
  }'
```

### Update Profile

```bash
curl -X PATCH http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice.johnson@example.com"
  }'
```

### Change Password

```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

---

## Security Considerations

### Password Security
- Passwords hashed with bcrypt (salt rounds: 10)
- Password requirements enforced server-side
- No password hints or recovery (reset only)

### Token Security
- JWT signed with HS256 algorithm
- Secret key stored in environment variables
- Tokens include expiration claims (`exp`)
- Refresh tokens stored hashed in database

### Attack Prevention
- Rate limiting (recommended for production)
- Email enumeration protection (consistent responses)
- Brute force protection (account lockout after N failed attempts - future)
- HTTPS required in production
- CORS configured for specific origins

---

## Related Documentation

- [Badge Issuance API](./badge-issuance.md) - Issue and manage badges
- [Badge Templates API](./badge-templates.md) - Manage badge templates
- [Testing Guide](../../docs/development/testing-guide.md) - Authentication E2E tests

---

**Last Updated:** January 27, 2026
