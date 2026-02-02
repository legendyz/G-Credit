# Task 8.7: Architecture Fixes - Token Rotation & Authorization

**Task ID:** Task 8.7  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Sprint 8  
**Priority:** MEDIUM  
**Estimated Hours:** 6h  
**Status:** backlog  
**Created:** 2026-02-02

---

## Context

This task addresses P1 architecture technical debt related to authentication and authorization patterns:
- ARCH-P1-001: Token rotation not implemented
- ARCH-P1-003: JWT secret validation at startup
- ARCH-P1-004: Missing ownership check on template operations

**Reference:** technical-debt-from-reviews.md (ARCH-P1)

---

## Objectives

**As a** Platform Engineer,  
**I want** robust authentication and authorization patterns,  
**So that** the system is secure and follows industry best practices.

---

## Acceptance Criteria

### AC1: Refresh Token Rotation (ARCH-P1-001)
**Given** I refresh my access token  
**When** I call `POST /api/auth/refresh`  
**Then** I receive:

- New access token (15min expiry)
- **New refresh token** (7 day expiry)
- Old refresh token is invalidated

**Security Benefits:**
- Stolen refresh tokens have limited window
- Reduces impact of token theft
- Enables token family tracking (detect reuse)

**Implementation:**
```typescript
// auth.service.ts
async refreshAccessToken(refreshToken: string): Promise<TokensDto> {
  // 1. Validate old refresh token
  const storedToken = await this.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true }
  });

  if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // 2. Generate new tokens
  const newAccessToken = this.generateAccessToken(storedToken.user);
  const newRefreshToken = this.generateRefreshToken(storedToken.user);

  // 3. Invalidate old refresh token
  await this.prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { isRevoked: true }
  });

  // 4. Store new refresh token
  await this.prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.userId,
      expiresAt: addDays(new Date(), 7)
    }
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}
```

**Database Changes:**
- No schema changes (RefreshToken table already has `isRevoked` field)

### AC2: JWT Secret Validation at Startup (ARCH-P1-003)
**Given** the application starts  
**When** JWT_SECRET is missing or weak  
**Then** the application fails to start with clear error:

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validate JWT secret
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters for security');
  }
  if (jwtSecret === 'your-secret-key-here' || jwtSecret === 'secret') {
    throw new Error('JWT_SECRET cannot be a default value. Generate a strong secret.');
  }

  console.log('✅ JWT secret validated (length: ${jwtSecret.length} chars)');

  await app.listen(3000);
}
```

**Test Cases:**
- ❌ No JWT_SECRET → Application exits with error
- ❌ JWT_SECRET < 32 chars → Application exits with error
- ❌ JWT_SECRET is default value → Application exits with error
- ✅ JWT_SECRET >= 32 chars, strong → Application starts

### AC3: Badge Template Ownership Check (ARCH-P1-004)
**Given** I am an ISSUER  
**When** I try to update/delete another issuer's template  
**Then** I receive 403 Forbidden:

```typescript
// badge-templates.controller.ts
@Patch(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ISSUER, Role.ADMIN)
async update(
  @Param('id') id: string,
  @Body() updateDto: UpdateBadgeTemplateDto,
  @CurrentUser() user: User
) {
  // Check ownership (ISSUER can only update own templates)
  if (user.role === Role.ISSUER) {
    const template = await this.templatesService.findOne(id);
    if (template.createdById !== user.id) {
      throw new ForbiddenException('You can only update your own templates');
    }
  }

  return this.templatesService.update(id, updateDto, user.id);
}

@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ISSUER, Role.ADMIN)
async remove(
  @Param('id') id: string,
  @CurrentUser() user: User
) {
  // Check ownership (ISSUER can only delete own templates)
  if (user.role === Role.ISSUER) {
    const template = await this.templatesService.findOne(id);
    if (template.createdById !== user.id) {
      throw new ForbiddenException('You can only delete your own templates');
    }
  }

  return this.templatesService.remove(id);
}
```

**Test Cases:**
- ✅ Issuer updates own template → 200 OK
- ❌ Issuer updates another issuer's template → 403 Forbidden
- ✅ Admin updates any template → 200 OK
- ✅ Issuer deletes own template → 200 OK
- ❌ Issuer deletes another issuer's template → 403 Forbidden

### AC4: Frontend Token Rotation Integration (Story 0.2b Dependency)
**Given** Story 0.2b implements token refresh interceptor  
**When** backend rotates refresh tokens  
**Then** frontend updates both tokens:

```typescript
// Frontend: authInterceptor.ts
const response = await axios.post('/api/auth/refresh', {
  refreshToken: oldRefreshToken
});

const { accessToken, refreshToken } = response.data;

// Update BOTH tokens in store
useAuthStore.getState().setTokens(accessToken, refreshToken);

// Update Authorization header
originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
```

**Note:** Frontend changes are in Story 0.2b, backend must support this.

---

## Tasks / Subtasks

### Task 1: Refresh Token Rotation (AC1) - 2h
- [ ] Update `auth.service.ts`
  - [ ] Generate new refresh token on refresh
  - [ ] Invalidate old refresh token
  - [ ] Store new refresh token in database
- [ ] Update `auth.controller.ts`
  - [ ] Return both accessToken + refreshToken
- [ ] Write unit tests (8 tests: rotation, invalidation, reuse detection)
- [ ] Write E2E tests (4 tests: refresh flow, old token invalid)

### Task 2: JWT Secret Validation (AC2) - 1h
- [ ] Add validation logic to `main.ts`
  - [ ] Check JWT_SECRET exists
  - [ ] Check minimum length (32 chars)
  - [ ] Check not default value
- [ ] Add console log for successful validation
- [ ] Write startup tests (4 tests: missing, weak, default, valid)
- [ ] Update `.env.example` with strong secret generation command

### Task 3: Template Ownership Authorization (AC3) - 2h
- [ ] Update `badge-templates.controller.ts`
  - [ ] Add ownership check to PATCH endpoint
  - [ ] Add ownership check to DELETE endpoint
  - [ ] Admin role bypasses ownership check
- [ ] Optionally create `OwnershipGuard` for reusability
- [ ] Write unit tests (6 tests: own template, other template, admin)
- [ ] Write E2E tests (4 tests: update/delete scenarios)

### Task 4: Documentation & Migration Guide (AC4) - 1h
- [ ] Document token rotation behavior in API-GUIDE.md
- [ ] Update frontend integration guide
- [ ] Create migration checklist for existing sessions
- [ ] Document JWT secret generation best practices

---

## Database Migration

**No schema changes required.**

RefreshToken table already has necessary fields:
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  isRevoked Boolean  @default(false)  // Already exists
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

---

## Testing Strategy

### Unit Tests
- **Token Rotation:** 8 tests (generation, invalidation, reuse detection, error handling)
- **JWT Validation:** 4 tests (missing, weak, default, valid)
- **Ownership Check:** 6 tests (own, other, admin, edge cases)
- **Total Unit:** 18 tests

### E2E Tests
- **Token Rotation:** 4 tests (refresh flow, old token invalid, concurrent refresh, expired token)
- **Template Authorization:** 4 tests (update own, update other, delete own, delete other)
- **Total E2E:** 8 tests

### Manual Testing
- [ ] Test token rotation with frontend (Story 0.2b)
- [ ] Test app startup with various JWT_SECRET values
- [ ] Test template operations with multiple issuer accounts

---

## Dev Notes

### Security Improvements
- **Token Rotation:** Reduces window of stolen token validity from 7 days to 15 minutes
- **JWT Validation:** Prevents weak secrets from being used in production
- **Ownership Check:** Prevents horizontal privilege escalation

### Performance Considerations
- **Token Rotation:** Additional database write on each refresh (~5ms overhead)
- **Ownership Check:** Additional database read per template operation (~2ms overhead)
- Both are acceptable for security gains

### Breaking Changes
- **Frontend Impact:** Story 0.2b must handle new refresh token in response
- **Client Integration:** External API clients must update refresh logic
- **Migration:** Existing refresh tokens remain valid (no forced logout)

---

## Definition of Done

- [ ] All 4 Acceptance Criteria met
- [ ] 26 tests passing (18 unit + 8 E2E)
- [ ] Token rotation works with frontend (Story 0.2b integration tested)
- [ ] App fails to start with weak JWT_SECRET
- [ ] Template ownership enforced for ISSUER role
- [ ] API documentation updated (refresh endpoint behavior)
- [ ] Code review complete
- [ ] Task notes updated with completion details

---

## Dependencies

**Blocked By:**
- None (can start immediately)

**Blocks:**
- Story 0.2b (frontend token refresh must handle new rotation)

**Works With:**
- Task 8.6 (Security Hardening) - complementary security improvements

---

## References

- technical-debt-from-reviews.md (ARCH-P1-001, ARCH-P1-003, ARCH-P1-004)
- [OWASP: Token Rotation](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#token-sidejacking)
- [RFC 6749: OAuth 2.0 - Refresh Token Rotation](https://datatracker.ietf.org/doc/html/rfc6749#section-10.4)
- Story 0.2b: Complete Login System (frontend integration)
