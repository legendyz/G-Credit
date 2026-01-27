# Sprint 3 Test Strategy - Badge Issuance

**Sprint:** Sprint 3 (Badge Issuance)  
**Version:** v0.3.0  
**Epic:** Epic 4 - Badge Issuance  
**Created:** 2026-01-27  
**Status:** Ready

---

## 🎯 Testing Goals

### Primary Objectives
1. Ensure badge issuance workflow is reliable and secure
2. Validate Open Badges 2.0 assertion compliance
3. Verify email notifications work in dev and production
4. Test CSV bulk issuance with various edge cases
5. Validate badge claiming workflow with token security
6. Ensure RBAC enforcement across all endpoints
7. Test badge revocation and status transitions

### Quality Targets
- **Test Coverage:** ≥80% (code coverage)
- **Unit Tests:** 20 tests (100% pass rate)
- **E2E Tests:** 15 tests (100% pass rate)
- **PowerShell Tests:** 5 scripts (manual validation)
- **Test Execution Time:** <30 seconds (unit), <2 minutes (E2E)
- **Zero Console.log:** No debug output in production code

---

## 📊 Test Pyramid

```
         /\
        /  \        5 PowerShell E2E Tests
       /____\       (Manual workflow validation)
      /      \
     / E2E    \     15 Jest E2E Tests
    /  Tests  \    (API contract & integration)
   /___________\
  /             \
 /   Unit Tests  \  20 Unit Tests
/__________________\ (Business logic & services)
```

### Distribution
- **Unit Tests:** 50% (20 tests) - Service layer logic
- **E2E Tests:** 38% (15 tests) - API endpoints
- **PowerShell Tests:** 12% (5 tests) - End-to-end workflows

---

## 🧪 Unit Tests (20 Total)

### Story 4.1: Single Badge Issuance (8 tests)

**File:** `src/badge-issuance/badge-issuance.service.spec.ts`

**Test Cases:**
1. ✅ `should issue badge successfully with valid inputs`
   - Given: Valid templateId, recipientId, issuerId
   - When: issueBadge() called
   - Then: Badge created with PENDING status, assertion generated, token created
   
2. ✅ `should throw NotFoundException if template not found`
   - Given: Non-existent templateId
   - When: issueBadge() called
   - Then: Throws NotFoundException

3. ✅ `should throw BadRequestException if template not ACTIVE`
   - Given: Template with status DRAFT
   - When: issueBadge() called
   - Then: Throws BadRequestException

4. ✅ `should throw NotFoundException if recipient not found`
   - Given: Non-existent recipientId
   - When: issueBadge() called
   - Then: Throws NotFoundException

5. ✅ `should generate unique claim token`
   - Given: Multiple badge issuances
   - When: issueBadge() called multiple times
   - Then: Each badge has unique 32-character token

6. ✅ `should calculate expiration date correctly`
   - Given: expiresIn = 365 days
   - When: issueBadge() called
   - Then: expiresAt = issuedAt + 365 days

7. ✅ `should handle optional fields (evidenceUrl, expiresIn)`
   - Given: No evidenceUrl or expiresIn
   - When: issueBadge() called
   - Then: Badge created with null values

8. ✅ `should convert assertion DTO to plain object (Lesson 13)`
   - Given: Assertion object with nested structures
   - When: Saved to Prisma
   - Then: No DTO class instances in JSON field

**File:** `src/badge-issuance/services/assertion-generator.service.spec.ts`

**Test Cases:**
1. ✅ `should generate valid Open Badges 2.0 structure`
   - Given: Badge parameters
   - When: generateAssertion() called
   - Then: Assertion includes @context, type, badge, recipient, verification

2. ✅ `should hash email with SHA-256`
   - Given: Email "test@example.com"
   - When: hashEmail() called
   - Then: Returns "sha256$<hex>" format

3. ✅ `should include evidence if provided`
   - Given: evidenceUrl provided
   - When: generateAssertion() called
   - Then: Assertion includes evidence array

4. ✅ `should set expiration if provided`
   - Given: expiresAt date
   - When: generateAssertion() called
   - Then: Assertion includes "expires" field

5. ✅ `should generate unique claim tokens`
   - Given: Multiple calls
   - When: generateClaimToken() called
   - Then: Each token is unique

6. ✅ `should format assertion URL correctly`
   - Given: badgeId
   - When: getAssertionUrl() called
   - Then: Returns {baseUrl}/api/badges/{badgeId}/assertion

7. ✅ `should format claim URL correctly`
   - Given: claimToken
   - When: getClaimUrl() called
   - Then: Returns {baseUrl}/claim-badge?token={token}

8. ✅ `should use issuer profile from config`
   - Given: ConfigService with APP_URL
   - When: generateAssertion() called
   - Then: Assertion includes issuer profile with correct URL

---

### Story 4.2: Batch Badge Issuance (6 tests)

**File:** `src/badge-issuance/services/csv-parser.service.spec.ts`

**Test Cases:**
1. ✅ `should parse valid CSV`
   - Given: Valid CSV with headers
   - When: parseBulkIssuanceCSV() called
   - Then: Returns array of BulkIssuanceRow

2. ✅ `should throw error for missing required headers`
   - Given: CSV missing "recipientEmail" header
   - When: parseBulkIssuanceCSV() called
   - Then: Throws "Missing required headers"

3. ✅ `should throw error for unexpected headers`
   - Given: CSV with "extraColumn" header
   - When: parseBulkIssuanceCSV() called
   - Then: Throws "Unexpected headers"

4. ✅ `should validate email format`
   - Given: Invalid email "not-an-email"
   - When: parseBulkIssuanceCSV() called
   - Then: Throws "Invalid email"

5. ✅ `should validate UUID format for templateId`
   - Given: Invalid UUID "not-a-uuid"
   - When: parseBulkIssuanceCSV() called
   - Then: Throws "Invalid templateId"

6. ✅ `should validate expiresIn range (1-3650)`
   - Given: expiresIn = 5000
   - When: parseBulkIssuanceCSV() called
   - Then: Throws "Invalid expiresIn"

---

### Story 4.3: Badge Claiming (5 tests)

**File:** `src/badge-issuance/badge-issuance.service.spec.ts`

**Test Cases:**
1. ✅ `should claim badge with valid token`
   - Given: Badge with PENDING status
   - When: claimBadge(token) called
   - Then: Status → CLAIMED, claimedAt set, token cleared

2. ✅ `should throw NotFoundException for invalid token`
   - Given: Non-existent claimToken
   - When: claimBadge(token) called
   - Then: Throws NotFoundException

3. ✅ `should throw BadRequestException if already claimed`
   - Given: Badge with CLAIMED status
   - When: claimBadge(token) called
   - Then: Throws BadRequestException

4. ✅ `should throw GoneException if revoked`
   - Given: Badge with REVOKED status
   - When: claimBadge(token) called
   - Then: Throws GoneException

5. ✅ `should throw GoneException if token expired (7 days)`
   - Given: Badge issued 8 days ago
   - When: claimBadge(token) called
   - Then: Throws GoneException

---

### Story 4.6: Badge Revocation (1 test)

**File:** `src/badge-issuance/badge-issuance.service.spec.ts`

**Test Case:**
1. ✅ `should revoke badge successfully`
   - Given: Badge with CLAIMED status
   - When: revokeBadge(id, reason, adminId) called
   - Then: Status → REVOKED, revokedAt set, reason stored, token cleared

---

## 🔄 E2E Tests (15 Total)

### Story 4.1: Single Badge Issuance (3 tests)

**File:** `test/badge-issuance.e2e-spec.ts`

**Test Cases:**
1. ✅ `POST /api/badges - Authorized user (ADMIN) issues badge successfully`
   ```typescript
   it('should issue badge as ADMIN', async () => {
     const response = await request(app.getHttpServer())
       .post('/api/badges')
       .set('Authorization', `Bearer ${adminToken}`)
       .send({
         templateId: validTemplateId,
         recipientId: validRecipientId,
         evidenceUrl: 'https://example.com/cert.pdf',
         expiresIn: 365
       });
     
     expect(response.status).toBe(201);
     expect(response.body.id).toBeDefined();
     expect(response.body.status).toBe('PENDING');
     expect(response.body.claimToken).toHaveLength(32);
   });
   ```

2. ✅ `POST /api/badges - Unauthorized user (EMPLOYEE) gets 403`
   ```typescript
   it('should reject EMPLOYEE role', async () => {
     const response = await request(app.getHttpServer())
       .post('/api/badges')
       .set('Authorization', `Bearer ${employeeToken}`)
       .send({
         templateId: validTemplateId,
         recipientId: validRecipientId
       });
     
     expect(response.status).toBe(403);
   });
   ```

3. ✅ `POST /api/badges - Invalid template ID returns 404`
   ```typescript
   it('should return 404 for invalid template', async () => {
     const response = await request(app.getHttpServer())
       .post('/api/badges')
       .set('Authorization', `Bearer ${adminToken}`)
       .send({
         templateId: 'non-existent-uuid',
         recipientId: validRecipientId
       });
     
     expect(response.status).toBe(404);
   });
   ```

---

### Story 4.2: Batch Badge Issuance (3 tests)

**File:** `test/badge-issuance.e2e-spec.ts`

**Test Cases:**
1. ✅ `POST /api/badges/bulk - Valid CSV issues all badges`
   ```typescript
   it('should issue badges from valid CSV', async () => {
     const csv = `recipientEmail,templateId
test1@example.com,${templateId}
test2@example.com,${templateId}`;
     
     const response = await request(app.getHttpServer())
       .post('/api/badges/bulk')
       .set('Authorization', `Bearer ${adminToken}`)
       .attach('file', Buffer.from(csv), 'badges.csv');
     
     expect(response.status).toBe(201);
     expect(response.body.total).toBe(2);
     expect(response.body.successful).toBe(2);
     expect(response.body.failed).toBe(0);
   });
   ```

2. ✅ `POST /api/badges/bulk - Invalid CSV format returns 400`
   ```typescript
   it('should reject invalid CSV format', async () => {
     const csv = `wrongHeader,anotherHeader
value1,value2`;
     
     const response = await request(app.getHttpServer())
       .post('/api/badges/bulk')
       .set('Authorization', `Bearer ${adminToken}`)
       .attach('file', Buffer.from(csv), 'invalid.csv');
     
     expect(response.status).toBe(400);
   });
   ```

3. ✅ `POST /api/badges/bulk - Partial failures handled gracefully`
   ```typescript
   it('should handle partial failures', async () => {
     const csv = `recipientEmail,templateId
valid@example.com,${templateId}
invalid-email,${templateId}`;
     
     const response = await request(app.getHttpServer())
       .post('/api/badges/bulk')
       .set('Authorization', `Bearer ${adminToken}`)
       .attach('file', Buffer.from(csv), 'mixed.csv');
     
     expect(response.status).toBe(201);
     expect(response.body.successful).toBe(1);
     expect(response.body.failed).toBe(1);
     expect(response.body.results[1].error).toContain('Invalid email');
   });
   ```

---

### Story 4.3: Badge Claiming (4 tests)

**File:** `test/badge-issuance.e2e-spec.ts`

**Test Cases:**
1. ✅ `POST /api/badges/:id/claim - Valid token claims badge`
   ```typescript
   it('should claim badge with valid token', async () => {
     // First, issue a badge
     const issueResponse = await request(app.getHttpServer())
       .post('/api/badges')
       .set('Authorization', `Bearer ${adminToken}`)
       .send({ templateId, recipientId });
     
     const { id, claimToken } = issueResponse.body;
     
     // Then claim it
     const claimResponse = await request(app.getHttpServer())
       .post(`/api/badges/${id}/claim`)
       .send({ claimToken });
     
     expect(claimResponse.status).toBe(200);
     expect(claimResponse.body.status).toBe('CLAIMED');
     expect(claimResponse.body.claimedAt).toBeDefined();
   });
   ```

2. ✅ `POST /api/badges/:id/claim - Invalid token returns 404`
3. ✅ `POST /api/badges/:id/claim - Already claimed returns 400`
4. ✅ `POST /api/badges/:id/claim - Expired token returns 410`

---

### Story 4.4: Issuance History (4 tests)

**File:** `test/badge-issuance.e2e-spec.ts`

**Test Cases:**
1. ✅ `GET /api/badges/my-badges - Returns my received badges`
   ```typescript
   it('should return my badges with pagination', async () => {
     const response = await request(app.getHttpServer())
       .get('/api/badges/my-badges?page=1&limit=10')
       .set('Authorization', `Bearer ${userToken}`);
     
     expect(response.status).toBe(200);
     expect(response.body.data).toBeInstanceOf(Array);
     expect(response.body.pagination.page).toBe(1);
     expect(response.body.pagination.totalCount).toBeGreaterThanOrEqual(0);
   });
   ```

2. ✅ `GET /api/badges/my-badges - Filter by status works`
3. ✅ `GET /api/badges/issued - ISSUER sees own badges`
4. ✅ `GET /api/badges/issued - EMPLOYEE gets 403`

---

### Story 4.6: Badge Revocation (1 test)

**File:** `test/badge-issuance.e2e-spec.ts`

**Test Case:**
1. ✅ `POST /api/badges/:id/revoke - ADMIN revokes badge successfully`
   ```typescript
   it('should revoke badge as ADMIN', async () => {
     const response = await request(app.getHttpServer())
       .post(`/api/badges/${badgeId}/revoke`)
       .set('Authorization', `Bearer ${adminToken}`)
       .send({ reason: 'Badge issued in error' });
     
     expect(response.status).toBe(200);
     expect(response.body.status).toBe('REVOKED');
     expect(response.body.revocationReason).toBe('Badge issued in error');
   });
   ```

---

## 💻 PowerShell E2E Tests (5 Scripts)

### Test 1: Complete Badge Issuance Workflow

**File:** `test/e2e-scripts/01-badge-issuance-workflow.ps1`

**Purpose:** Test complete badge issuance → claim → verification workflow

```powershell
# 01-badge-issuance-workflow.ps1
# Test complete badge issuance workflow

Write-Host "=== Badge Issuance E2E Test ===" -ForegroundColor Cyan

# 1. Login as ADMIN
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body (@{email="admin@gcredit.com"; password="admin123"} | ConvertTo-Json)

$adminToken = $loginResponse.accessToken
Write-Host "✅ Logged in as ADMIN" -ForegroundColor Green

# 2. Get active template
$templates = Invoke-RestMethod -Uri "http://localhost:3000/api/badge-templates?status=ACTIVE" `
  -Method GET -Headers @{Authorization = "Bearer $adminToken"}

$templateId = $templates.data[0].id
Write-Host "✅ Found active template: $($templates.data[0].name)" -ForegroundColor Green

# 3. Get recipient user
$users = Invoke-RestMethod -Uri "http://localhost:3000/api/users?role=EMPLOYEE" `
  -Method GET -Headers @{Authorization = "Bearer $adminToken"}

$recipientId = $users.data[0].id
Write-Host "✅ Found recipient: $($users.data[0].name)" -ForegroundColor Green

# 4. Issue badge
$issueResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/badges" `
  -Method POST -Headers @{Authorization = "Bearer $adminToken"} `
  -ContentType "application/json" `
  -Body (@{
    templateId = $templateId
    recipientId = $recipientId
    evidenceUrl = "https://example.com/evidence.pdf"
    expiresIn = 365
  } | ConvertTo-Json)

$badgeId = $issueResponse.id
$claimToken = $issueResponse.claimToken
Write-Host "✅ Badge issued: $badgeId" -ForegroundColor Green
Write-Host "   Claim Token: $claimToken" -ForegroundColor Yellow
Write-Host "   Claim URL: $($issueResponse.claimUrl)" -ForegroundColor Yellow

# 5. Claim badge (public endpoint)
$claimResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/badges/$badgeId/claim" `
  -Method POST -ContentType "application/json" `
  -Body (@{claimToken = $claimToken} | ConvertTo-Json)

Write-Host "✅ Badge claimed successfully" -ForegroundColor Green
Write-Host "   Status: $($claimResponse.status)" -ForegroundColor Yellow
Write-Host "   Claimed At: $($claimResponse.claimedAt)" -ForegroundColor Yellow

# 6. Verify assertion (public endpoint)
$assertionResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/badges/$badgeId/assertion" `
  -Method GET

Write-Host "✅ Assertion retrieved" -ForegroundColor Green
Write-Host "   Badge Name: $($assertionResponse.badge.name)" -ForegroundColor Yellow
Write-Host "   Recipient: $($assertionResponse.recipient.identity)" -ForegroundColor Yellow
Write-Host "   Issued On: $($assertionResponse.issuedOn)" -ForegroundColor Yellow

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
```

---

### Test 2: Bulk Badge Issuance from CSV

**File:** `test/e2e-scripts/02-bulk-badge-issuance.ps1`

**Purpose:** Test CSV upload and bulk issuance

```powershell
# 02-bulk-badge-issuance.ps1
Write-Host "=== Bulk Badge Issuance Test ===" -ForegroundColor Cyan

# 1. Login as ADMIN
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body (@{email="admin@gcredit.com"; password="admin123"} | ConvertTo-Json)

$adminToken = $loginResponse.accessToken

# 2. Create CSV file
$csvContent = @"
recipientEmail,templateId,evidenceUrl,expiresIn
test1@example.com,$templateId,https://example.com/cert1.pdf,365
test2@example.com,$templateId,https://example.com/cert2.pdf,730
test3@example.com,$templateId,,365
"@

$csvPath = "bulk-badges-test.csv"
$csvContent | Out-File -FilePath $csvPath -Encoding UTF8

# 3. Upload CSV
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/badges/bulk" `
  -Method POST `
  -Headers @{Authorization = "Bearer $adminToken"} `
  -Form @{file = Get-Item -Path $csvPath}

Write-Host "✅ Bulk issuance completed" -ForegroundColor Green
Write-Host "   Total: $($response.total)" -ForegroundColor Yellow
Write-Host "   Successful: $($response.successful)" -ForegroundColor Green
Write-Host "   Failed: $($response.failed)" -ForegroundColor Red

# Cleanup
Remove-Item $csvPath
```

---

### Test 3: Badge Revocation Workflow

**File:** `test/e2e-scripts/03-badge-revocation.ps1`

**Purpose:** Test badge revocation and verification

```powershell
# 03-badge-revocation.ps1
Write-Host "=== Badge Revocation Test ===" -ForegroundColor Cyan

# 1. Login and issue badge (same as Test 1)
# ... (omitted for brevity)

# 2. Revoke badge
$revokeResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/badges/$badgeId/revoke" `
  -Method POST `
  -Headers @{Authorization = "Bearer $adminToken"} `
  -ContentType "application/json" `
  -Body (@{reason = "Badge issued in error for testing"} | ConvertTo-Json)

Write-Host "✅ Badge revoked" -ForegroundColor Green
Write-Host "   Reason: $($revokeResponse.revocationReason)" -ForegroundColor Yellow

# 3. Try to access assertion (should return 410)
try {
  $assertionResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/badges/$badgeId/assertion" `
    -Method GET
  Write-Host "❌ Should have returned 410" -ForegroundColor Red
} catch {
  if ($_.Exception.Response.StatusCode -eq 410) {
    Write-Host "✅ Assertion returns 410 Gone (correct)" -ForegroundColor Green
  } else {
    Write-Host "❌ Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
  }
}
```

---

### Test 4: RBAC Enforcement

**File:** `test/e2e-scripts/04-rbac-enforcement.ps1`

**Purpose:** Test role-based access control across all endpoints

```powershell
# 04-rbac-enforcement.ps1
Write-Host "=== RBAC Enforcement Test ===" -ForegroundColor Cyan

# Test matrix: endpoint x role = expected status
$tests = @(
  @{Endpoint="POST /api/badges"; Role="ADMIN"; Expected=201},
  @{Endpoint="POST /api/badges"; Role="ISSUER"; Expected=201},
  @{Endpoint="POST /api/badges"; Role="EMPLOYEE"; Expected=403},
  @{Endpoint="POST /api/badges/:id/revoke"; Role="ADMIN"; Expected=200},
  @{Endpoint="POST /api/badges/:id/revoke"; Role="ISSUER"; Expected=403},
  @{Endpoint="GET /api/badges/issued"; Role="ADMIN"; Expected=200},
  @{Endpoint="GET /api/badges/issued"; Role="ISSUER"; Expected=200},
  @{Endpoint="GET /api/badges/issued"; Role="EMPLOYEE"; Expected=403}
)

foreach ($test in $tests) {
  # Execute test and verify status
  Write-Host "Testing $($test.Endpoint) as $($test.Role)..." -ForegroundColor Yellow
  # ... (implementation)
}
```

---

### Test 5: Email Notification Verification

**File:** `test/e2e-scripts/05-email-notifications.ps1`

**Purpose:** Verify email notifications in development (Ethereal)

```powershell
# 05-email-notifications.ps1
Write-Host "=== Email Notification Test ===" -ForegroundColor Cyan

# Note: This test requires NODE_ENV=development in .env

# 1. Issue badge (triggers email)
Write-Host "Issuing badge..." -ForegroundColor Yellow
# ... (issue badge code)

Write-Host "✅ Badge issued" -ForegroundColor Green
Write-Host "📧 Check console for Ethereal preview URL" -ForegroundColor Cyan
Write-Host "   Example: Preview URL: https://ethereal.email/message/xxxxx" -ForegroundColor Yellow

# 2. Revoke badge (triggers email)
Write-Host "Revoking badge..." -ForegroundColor Yellow
# ... (revoke badge code)

Write-Host "✅ Badge revoked" -ForegroundColor Green
Write-Host "📧 Check console for revocation email preview URL" -ForegroundColor Cyan
```

---

## 🔍 Test Coverage Targets

### Service Layer (High Priority)
- **BadgeIssuanceService:** 90% coverage
- **AssertionGeneratorService:** 95% coverage
- **CSVParserService:** 85% coverage
- **BadgeNotificationService:** 80% coverage

### Controller Layer (Medium Priority)
- **BadgeIssuanceController:** 75% coverage

### Overall Target
- **Total Coverage:** ≥80%

---

## 🚨 Critical Test Scenarios

### Security Tests
1. ✅ **RBAC Enforcement:** All endpoints check user roles
2. ✅ **Token Security:** Claim tokens are one-time use only
3. ✅ **Public Endpoint Safety:** Assertion endpoint doesn't expose sensitive data
4. ✅ **Email Privacy:** Recipient email is hashed in assertions

### Data Integrity Tests
1. ✅ **Status Transitions:** PENDING → CLAIMED → (not reversible)
2. ✅ **Revocation:** REVOKED badges cannot be claimed
3. ✅ **Token Expiration:** 7-day claim window enforced
4. ✅ **Badge Expiration:** expiresAt honored in queries

### Performance Tests
1. ✅ **Bulk Issuance:** 1000 badges processed in <30 seconds
2. ✅ **Pagination:** Query performance with 10,000+ badges
3. ✅ **Email Delivery:** Non-blocking (doesn't slow down issuance)

### Compliance Tests
1. ✅ **Open Badges 2.0:** Assertion structure validated
2. ✅ **Email Standards:** HTML renders in Gmail/Outlook
3. ✅ **CSV Format:** Standard RFC 4180 compliance

---

## 🛠️ Testing Tools

### Test Frameworks
- **Jest:** Unit and E2E tests
- **Supertest:** HTTP assertion library
- **PowerShell:** Manual workflow testing

### Development Tools
- **Ethereal Email:** Test email delivery (development)
- **Prisma Studio:** Database inspection
- **VS Code REST Client:** Quick endpoint testing

### CI/CD Integration (Future)
- GitHub Actions workflow
- Automated test execution on PR
- Coverage reporting

---

## 📝 Test Execution Commands

### Run All Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run E2E tests only
npm run test:e2e

# Run specific test file
npm run test -- badge-issuance.service.spec.ts
```

### Run PowerShell Tests
```powershell
# Run individual test
.\test\e2e-scripts\01-badge-issuance-workflow.ps1

# Run all PowerShell tests
Get-ChildItem .\test\e2e-scripts\*.ps1 | ForEach-Object { & $_.FullName }
```

### Run Tests in Watch Mode
```bash
# Watch mode (unit tests)
npm run test:watch

# Watch specific file
npm run test:watch -- badge-issuance.service
```

---

## 🐛 Debugging Failed Tests

### Common Issues

**Issue 1: Prisma Connection Error**
```
Error: Can't reach database server
```
**Solution:**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
npx prisma migrate dev
```

**Issue 2: JWT Token Expired**
```
Error: 401 Unauthorized
```
**Solution:**
```bash
# Generate fresh token in PowerShell test
# Tokens expire after 1 hour (default)
```

**Issue 3: Email Not Sent (Development)**
```
EmailService not sending emails
```
**Solution:**
```bash
# Check NODE_ENV=development in .env
# Check console for Ethereal preview URL
```

**Issue 4: CSV Parsing Error**
```
CSV parsing failed: Missing required headers
```
**Solution:**
```csv
# Ensure correct headers (case-sensitive):
recipientEmail,templateId,evidenceUrl,expiresIn
```

---

## 📊 Test Reporting

### Coverage Report
```bash
# Generate HTML coverage report
npm run test:cov

# Open report
start coverage/lcov-report/index.html
```

### E2E Test Results
```bash
# Jest outputs TAP format
npm run test:e2e > test-results.tap

# Convert to HTML (optional)
npm install -g tap-html
cat test-results.tap | tap-html > test-results.html
```

---

## ✅ Test Completion Criteria

### Story Ready for Review When:
- [ ] All unit tests pass (100%)
- [ ] All E2E tests pass (100%)
- [ ] PowerShell tests manually verified
- [ ] Test coverage ≥80%
- [ ] No console.log statements
- [ ] All tests documented in this file

### Sprint Ready for Merge When:
- [ ] All 40 tests passing
- [ ] Coverage report generated
- [ ] Test results reviewed by developer
- [ ] Edge cases covered
- [ ] Performance acceptable (<30s unit, <2min E2E)

---

## 📚 Reference Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Open Badges 2.0 Validator](https://openbadgesvalidator.imsglobal.org/)

---

**Status:** ✅ Ready  
**Total Tests Planned:** 40 (20 unit + 15 E2E + 5 PowerShell)  
**Next Action:** Begin Story 4.1 implementation with test-first approach

**Happy Testing! 🧪✨**
