# Story 8.0: Sprint 8 Development Environment Setup

**Story ID:** 8.0  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Sprint 8  
**Story Points:** 1  
**Priority:** CRITICAL (Must complete before all other Sprint 8 work)  
**Estimated Effort:** 1.5h  
**Assignee:** Development Team  
**Status:** Backlog  

---

## 📋 Story Description

Set up development environment for Sprint 8 by installing new dependencies and creating required database migrations. This task must be completed before starting any other Sprint 8 work items.

---

## ✅ Acceptance Criteria

### AC1: Backend Dependencies Installed
**Given** Sprint 8 requires new security and caching packages  
**When** Installing @nestjs/helmet, @nestjs/throttler, @nestjs/cache-manager  
**Then** All packages install successfully with correct versions and no conflicts

**Note:** bcrypt 6.0.0 upgrade deferred to Sprint 9 due to Windows compatibility issues

**Verification:**
```bash
cd gcredit-project/backend
npm list @nestjs/helmet @nestjs/throttler @nestjs/cache-manager bcrypt
# Expected output:
# @nestjs/helmet@1.1.0+
# @nestjs/throttler@5.0.0+
# @nestjs/cache-manager@2.0.0+
# bcrypt@5.1.1 (upgrade deferred)
```

---

### AC2: Frontend Dependencies Installed
**Given** Sprint 8 requires accessibility and routing packages  
**When** Installing @axe-core/react, react-router, react-router-dom  
**Then** All packages install successfully and compatible with React 19.2.3

**Verification:**
```bash
cd gcredit-project/frontend
npm list @axe-core/react react-router react-router-dom
# Expected output:
# @axe-core/react@4.11.0+
# react-router@latest
# react-router-dom@latest
```

---

### AC3: Prisma Migration Created (M365 Sync)
**Given** Story 8.9 requires M365SyncLog table and User.isActive field  
**When** Creating and running Prisma migration  
**Then** Migration succeeds and database schema updated

**Verification:**
```bash
cd gcredit-project/backend
npx prisma migrate status
# Migration should show: "add-m365-sync-log" applied
```

**Database Changes:**
- New table: `M365SyncLog` with fields:
  - id, syncDate, syncType, userCount, syncedCount
  - createdCount, updatedCount, status, errorMessage, durationMs, createdAt
  - Indexes on: syncDate, status
- New field: `User.isActive` (Boolean, default: true)
- New index: `User.isActive`

---

### AC4: Version Manifest Updated
**Given** New dependencies installed  
**When** Updating version-manifest.md  
**Then** All new package versions documented with Sprint 8 reference

**Verification:**
- version-manifest.md contains @nestjs/helmet entry
- version-manifest.md contains @nestjs/throttler entry
- version-manifest.md contains @axe-core/react entry
- version-manifest.md contains react-router entries

---

### AC5: Security Audit Passed
**Given** New dependencies installed  
**When** Running npm audit  
**Then** Zero high/critical vulnerabilities (moderate/low acceptable)

**Verification:**
```bash
cd gcredit-project/backend && npm audit --audit-level=high
cd gcredit-project/frontend && npm audit --audit-level=high
# Both should report: "0 vulnerabilities" or only low/moderate
```

---

## 🔧 Implementation Tasks

### Task 1: Install Backend Security Dependencies (30 min)
```bash
# Navigate to backend directory
cd gcredit-project/backend

# Install Helmet (CSP headers - Task 8.6)
npm install @nestjs/helmet@^1.1.0

# Install Throttler (rate limiting - Task 8.6)
npm install @nestjs/throttler@^5.0.0

# Note: bcrypt remains at 5.1.1 (6.0.0 has compatibility issues)
# bcrypt upgrade deferred to Sprint 9 after compatibility testing

# Verify installations
npm list @nestjs/helmet @nestjs/throttler

# Run security audit
npm audit --audit-level=high
```

**Expected Result:**
- @nestjs/helmet@1.1.0+ installed
- @nestjs/throttler@5.0.0+ installed
- @nestjs/cache-manager@2.0.0+ installed
- cache-manager@5.0.0+ installed
- bcrypt@5.1.1 remains (6.0.0 upgrade deferred to Sprint 9)
- Zero high/critical vulnerabilities

---

### Task 2: Install Frontend Dependencies (20 min)
```bash
# Navigate to frontend directory
cd gcredit-project/frontend

# Install Axe accessibility testing (Story 8.3)
npm install @axe-core/react@^4.11.0

# Install React Router (Story 8.1)
npm install react-router@latest react-router-dom@latest

# Verify installations
npm list @axe-core/react react-router react-router-dom

# Run security audit
npm audit --audit-level=high
```

**Expected Result:**
- @axe-core/react@4.11.0+ installed
- react-router@latest installed (compatible with React 19.2.3)
- react-router-dom@latest installed
- Zero high/critical vulnerabilities

---

### Task 3: Create Prisma Migration for M365 Sync (30 min)

#### Step 3.1: Update Prisma Schema
**File:** `gcredit-project/backend/prisma/schema.prisma`

Add new model for M365 sync logging:
```prisma
model M365SyncLog {
  id           String   @id @default(uuid())
  syncDate     DateTime @default(now())
  syncType     String   @default("FULL") // 'FULL' | 'INCREMENTAL'
  userCount    Int      // Total users in M365
  syncedCount  Int      // Successfully synced users
  createdCount Int      @default(0) // New users created
  updatedCount Int      @default(0) // Existing users updated
  status       String   // 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE'
  errorMessage String?  @db.Text
  durationMs   Int?     // Sync duration in milliseconds
  createdAt    DateTime @default(now())

  @@map("m365_sync_logs")
  @@index([syncDate])
  @@index([status])
}
```

Add `isActive` field to User model:
```prisma
model User {
  id              String   @id @default(uuid())
  email           String   @unique
  firstName       String
  lastName        String
  department      String?
  role            Role     @default(EMPLOYEE)
  azureId         String?  @unique
  isActive        Boolean  @default(true)  // NEW FIELD
  // ... existing fields ...
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("users")
  @@index([email])
  @@index([azureId])
  @@index([isActive])  // NEW INDEX
}
```

#### Step 3.2: Generate Migration
```bash
cd gcredit-project/backend

# Generate migration
npx prisma migrate dev --name add-m365-sync-log

# Expected output:
# - Migration file created in prisma/migrations/
# - Database updated
# - Prisma Client regenerated
```

#### Step 3.3: Verify Migration
```bash
# Check migration status
npx prisma migrate status

# Should show: "add-m365-sync-log" in applied migrations

# Test database connection
npx prisma db pull
# Should show no changes (schema in sync)
```

**Expected Files Created:**
- `prisma/migrations/YYYYMMDDHHMMSS_add_m365_sync_log/migration.sql`

**Migration SQL Preview:**
```sql
-- CreateTable
CREATE TABLE "m365_sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "syncDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncType" TEXT NOT NULL DEFAULT 'FULL',
    "userCount" INTEGER NOT NULL,
    "syncedCount" INTEGER NOT NULL,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "m365_sync_logs_syncDate_idx" ON "m365_sync_logs"("syncDate");
CREATE INDEX "m365_sync_logs_status_idx" ON "m365_sync_logs"("status");

-- AlterTable
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");
```

---

### Task 4: Update Version Manifest (10 min)

**File:** `gcredit-project/docs/sprints/sprint-8/version-manifest.md`

Add entries to appropriate sections:

**Backend Stack → Authentication & Security:**
```markdown
| **@nestjs/helmet** | 1.1.0+ | **Sprint 8** | **NEW** Security headers (Task 8.6) |
| **@nestjs/throttler** | 5.0.0+ | **Sprint 8** | **NEW** Rate limiting (Task 8.6) |
| **bcrypt** | 6.0.0+ | Sprint 1 → **Sprint 8** | **UPGRADED** Security fix (SEC-P1-005) |
```

**Frontend Stack → Accessibility:**
```markdown
| **@axe-core/react** | 4.11.0 | **Sprint 8** | **NEW** Accessibility testing (Story 8.3) |
```

**Frontend Stack → Routing:**
```markdown
| **react-router** | 6.x+ | **Sprint 8** | **NEW** Client-side routing (Story 8.1) |
| **react-router-dom** | 6.x+ | **Sprint 8** | **NEW** DOM bindings (Story 8.1) |
```

---

### Task 5: Verify Build & Tests (10 min)
```bash
# Backend build verification
cd gcredit-project/backend
npm run build
# Should succeed with no TypeScript errors

# Backend test verification (quick check)
npm test -- auth.service.spec.ts
# Should pass (bcrypt upgrade is API-compatible)

# Frontend build verification
cd gcredit-project/frontend
npm run build
# Should succeed with no TypeScript errors

# Frontend dev server check
npm run dev
# Should start without errors (Ctrl+C to stop)
```

**Expected Result:**
- Backend builds successfully
- Frontend builds successfully
- Auth tests still pass (bcrypt upgrade compatible)
- Dev server starts without errors

---

## 📝 Testing Strategy

### Unit Tests
- ✅ No new unit tests required (dependency installation only)
- ✅ Run existing auth tests to verify bcrypt upgrade compatibility

### Integration Tests
- ✅ Run Prisma migration tests to verify M365SyncLog table creation
- ✅ Test User.isActive field with existing user queries

### E2E Tests
- ✅ No E2E tests required (infrastructure setup)

---

## 🚨 Potential Issues & Solutions

### Issue 1: npm Install Conflicts
**Symptom:** Package version conflicts or peer dependency warnings  
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall from scratch
npm install
```

---

### Issue 2: Prisma Migration Fails
**Symptom:** Migration fails due to existing data or constraints  
**Solution:**
```bash
# Reset database (DEV ONLY - destroys data)
npx prisma migrate reset

# Or create manual migration with data preservation
npx prisma migrate dev --create-only --name add-m365-sync-log
# Edit migration.sql to add data preservation logic
npx prisma migrate deploy
```

---

### Issue 3: bcrypt Upgrade Breaks Auth Tests
**Symptom:** Auth E2E tests fail after bcrypt 6.0.0 upgrade  
**Solution:**
- bcrypt 6.0.0 is API-compatible with 5.x (no code changes needed)
- If tests fail, check for timing issues (bcrypt 6 may be slightly faster)
- Verify hash comparison logic in auth.service.ts

---

### Issue 4: React Router Type Conflicts
**Symptom:** TypeScript errors with react-router and React 19.2.3  
**Solution:**
```bash
# Install React Router v6 (compatible with React 19)
npm install react-router@6 react-router-dom@6

# Install type definitions
npm install --save-dev @types/react-router @types/react-router-dom
```

---

## 🔗 Dependencies

### Blocks (This task blocks):
- Story 8.1 (Dashboard Homepage) - Needs react-router
- Story 8.3 (WCAG Accessibility) - Needs @axe-core/react
- Task 8.6 (Security Hardening) - Needs @nestjs/helmet, @nestjs/throttler
- Story 8.9 (M365 Hardening) - Needs Prisma migration

### Blocked By (None - this is the first task)
- ✅ No blockers

---

## 📚 References

- **Version Manifest:** [version-manifest.md](version-manifest.md)
- **Sprint Status:** [sprint-status.yaml](sprint-status.yaml)
- **Task 8.6 (Security):** [8-6-security-hardening.md](8-6-security-hardening.md)
- **Story 8.9 (M365):** [U-2b-m365-hardening.md](U-2b-m365-hardening.md)
- **Prisma Documentation:** https://www.prisma.io/docs/concepts/components/prisma-migrate

---

## ✅ Definition of Done

- [x] All backend dependencies installed (@nestjs/helmet, @nestjs/throttler, bcrypt@6.0.0)
- [x] All frontend dependencies installed (@axe-core/react, react-router, react-router-dom)
- [x] Prisma migration created and applied (M365SyncLog + User.isActive)
- [x] Version manifest updated with all new packages
- [x] npm audit passes (zero high/critical vulnerabilities)
- [x] Backend builds successfully (`npm run build`)
- [x] Frontend builds successfully (`npm run build`)
- [x] Existing tests still pass (bcrypt upgrade compatibility verified)
- [x] Code review approved (Scrum Master)
- [x] Documented in sprint-status.yaml

---

## 🎯 Success Metrics

- **Installation Time:** <1.5h total
- **Build Success Rate:** 100% (backend + frontend)
- **Test Pass Rate:** 100% (existing tests)
- **Security Vulnerabilities:** 0 high/critical
- **Migration Success:** 100% (M365SyncLog + User.isActive)

---

**Created:** 2026-02-02  
**Created By:** Bob (Scrum Master)  
**Last Updated:** 2026-02-02  
**Status:** Backlog (CRITICAL - Must complete Day 1 morning)
