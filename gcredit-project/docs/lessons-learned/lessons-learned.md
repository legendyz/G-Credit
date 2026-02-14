# Lessons Learned & Best Practices

**Project:** G-Credit Digital Credentialing System  
**Purpose:** Capture key learnings and establish best practices for efficient development  
**Last Updated:** 2026-02-14 (Sprint 11 Complete — Lessons 35, 40, 41, 42)  
**Status:** Living document - update after each Sprint Retrospective  
**Coverage:** Sprint 0 → Sprint 1 → Sprint 2 → Sprint 3 → Sprint 5 → Sprint 6 → Sprint 7 → Sprint 8 → Sprint 9 → Sprint 10 → Sprint 11 (Complete) + Documentation & Test Organization + Documentation System Maintenance + Workflow Automation  
**Total Lessons:** 38 lessons (Sprint 0: 5, Sprint 1: 4, Sprint 2: 1, Post-Sprint 2: 4, Post-Sprint 3: 4, Post-Sprint 5: 1, Sprint 6: 8, Sprint 7: 3, Sprint 8: 3, Sprint 9: 3, Sprint 10: 3, Sprint 11: 4)

---

## 📊 Project Summary (Sprint 0-10)

### Velocity Metrics
| Sprint | Stories | Estimated | Actual | Accuracy | Velocity |
|--------|---------|-----------|--------|----------|----------|
| Sprint 0 | 5/5 (100%) | 10h | 9.5h | 95% | ~1h/story |
| Sprint 1 | 7/7 (100%) | 21h | 21h | 100% | ~3h/story |
| Sprint 2 | 4/6 (67%) | 21-22h | ~3h | 7-8x faster | ~45min/story |
| Sprint 3 | 2/6 (33%) | 4h | 4h | 100% | ~2h/story (Stories 4.1, 4.5) |
| Sprint 6 | 5/5 (100%) | 56-76h | 35h | 46-62% | ~7h/story |
| Sprint 7 | 10/10 (100%) | 41-47h | 38.5h | 82-93% | ~3.9h/story |
| Sprint 8 | 12/12 (100%) | 76h | 80h | 95% | ~6.7h/item |
| Sprint 9 | 5/5 (100%) | 51h | 37h | 73% | ~7.4h/story |
| Sprint 10 | 12/12 (100%) | 95h | 109h | 87% | ~9.1h/story | ⭐
| Sprint 11 | 23/23 (100%) | 51.5-65.5h | ~60h | ~92-100% | ~2.6h/story | ⭐

### Quality Metrics
- **Test Pass Rate:** 100% (1,263/1,263 tests Sprint 11) ⭐
- **UAT Pass Rate:** 100% (33/33 tests Sprint 10, pending Sprint 11 UAT)
- **Documentation Accuracy:** 95%+ (comprehensive guides created)
- **Technical Debt:** 56 items tracked (17 P1 resolved Sprint 8, 7 TD resolved Sprint 10) ⭐
- **Zero Production Bugs:** All issues caught in development/UAT

### Key Achievements
- ✅ Production-ready infrastructure (Azure PostgreSQL + Blob Storage)
- ✅ Complete authentication system (JWT + RBAC + Multi-device)
- ✅ Badge management foundation (Templates, Skills, Categories)
- ✅ Badge issuance system (Single badge + Open Badges 2.0) ⭐
- ✅ Email notification system (Dual-mode: ACS + Ethereal) ⭐
- ✅ Microsoft Graph API integration (Email + Teams) ⭐ Sprint 6
- ✅ Badge sharing system (Email, Widget, Analytics) ⭐ Sprint 6
- ✅ Badge Revocation system (API + UI + Notifications) ⭐ Sprint 7
- ✅ Login & Navigation system ⭐ Sprint 7
- ✅ Complete Lifecycle UAT (100% pass) ⭐ Sprint 7
- ✅ Production-Ready MVP (Dashboard, Accessibility, Security, M365) ⭐ Sprint 8
- ✅ ESLint zero-tolerance & TypeScript strict cleanup ⭐ Sprint 9
- ✅ v1.0.0 Release (UAT 33/33, full documentation, GitHub Release) ⭐ Sprint 10
- ✅ Comprehensive documentation system (15+ guides created)
- ✅ Well-organized test structure (1,061 tests, 100% pass rate) ⭐

---

## 📚 Table of Contents
- [Sprint 0 Lessons](#sprint-0-lessons-january-2026) - Infrastructure Setup (5 lessons)
- [Sprint 1 Lessons](#sprint-1-lessons-january-2026) - Authentication System (4 lessons)
- [Sprint 2 Lessons](#sprint-2-lessons-january-2026) - Badge Templates (1 lesson)
- [Post-Sprint 2 Lessons](#post-sprint-2-lessons-january-2026) - Documentation & Test Organization (4 lessons) 🔄
  - Lesson 11: Documentation Organization
  - Lesson 12: Living vs Historical Documents
  - Lesson 13: Test File Organization
  - Lesson 14: Email Integration & Third-Party Services
- [Post-Sprint 3 Lessons](#post-sprint-3-lessons-january-2026) - Documentation System Cleanup (4 lessons) 🆕 
  - Lesson 15: SSOT Requires Enforcement
  - Lesson 16: Import Path Standardization
  - Lesson 17: Infrastructure Inventory Management
  - Lesson 18: Document Lifecycle Management
- [Post-Sprint 5 Lessons](#post-sprint-5-lessons-january-2026) - Workflow Automation (1 lesson)
  - Lesson 19: Workflow Automation & AI Delegation
- [Sprint 6 Lessons](#sprint-6-lessons-january-2026) - Badge Sharing & External Integrations (8 lessons)
  - Lesson 20-27: Testing, Mocking, Graph API, etc.
- [Sprint 7 Lessons](#sprint-7-lessons-february-2026) - Pre-UAT Reviews & Phase-based Execution (3 lessons)
  - Lesson 28: Pre-UAT Review Pattern
  - Lesson 29: Phase-based Backlog Structure
  - Lesson 30: Technical Debt Registry as SSOT
- [Sprint 9 Lessons](#sprint-9-lessons-february-2026) - ESLint Cleanup & TypeScript Gaps (3 lessons) 🆕
  - Lesson 34: `eslint --fix` Strips `as` Type Assertions
  - Lesson 35: Local CI Parity — TypeScript, ESLint, and Prettier Each Check Different Things
  - Lesson 36: Replacing `any` Cascades into Test Mocks
- [Sprint 8 Lessons](#sprint-8-lessons-february-2026) - Production-Ready MVP (3 lessons)
  - Lesson 31: Code Review as DoD Gate
  - Lesson 32: E2E Test Isolation with Schema-based Approach
  - Lesson 33: Accessibility First Approach
- [Sprint 10 Lessons](#sprint-10-lessons-february-2026) - ESLint Zero-Tolerance Cleanup (3 lessons) 🆕
  - Lesson 37: Jest Asymmetric Matchers Return `any` — Centralized Typed Wrappers
  - Lesson 38: Centralize `eslint-disable` in Utility Files, Not Scattered Across Codebase
  - Lesson 39: UX Spec ≠ Implementation — Design System Foundation Must Be a Sprint 0 Story 🔴
- [Cross-Sprint Patterns](#cross-sprint-patterns) - 13 patterns
- [Development Checklists](#development-checklists)
- [Common Pitfalls](#common-pitfalls-to-avoid)
- [Best Practices Summary](#best-practices-summary)
- [Metrics to Track](#metrics-to-track)
- [Quick Reference](#quick-reference-when-things-go-wrong)
- [Future Sprint Checklist](#future-sprint-checklist)

---

## Sprint 0 Lessons (January 2026)
### Infrastructure Setup & Foundation

### 🎯 Lesson 1: Version Discrepancy - Planning vs Reality

**What Happened:**
Sprint 0 backlog assumed Prisma 5/6, NestJS 10, but `npm install` fetched latest versions (Prisma 7, NestJS 11) in January 2026. This caused:
- Prisma 7 breaking changes (required `prisma.config.ts`, new schema syntax)
- TypeScript compilation errors
- 1 hour lost diagnosing and downgrading Prisma 7 → 6.19.2

**Root Cause:**
Documentation used relative version references ("latest stable") instead of explicit version numbers. Planning occurred weeks before implementation, allowing dependency drift.

**Solution Implemented:**
- Downgraded to Prisma 6.19.2 using `npm install -D prisma@6`
- Updated sprint-0-backlog.md with explicit version locking
- All subsequent installs use specific versions

**Prevention for Future:**
- Create "Version Manifest" in sprint planning documents
- Specify exact versions (e.g., `prisma@6.19.2`, not "latest")
- Include version lock commands in backlog
- Track compatibility matrix (e.g., "Prisma 6 works with NestJS 10-11")

**Key Takeaway:**
> Major version increments happen frequently in Node.js ecosystem. Always specify exact versions in planning documents to prevent drift.

---

### 🎯 Lesson 2: npx Command Cache Confusion

**What Happened:**
After installing Prisma 6 locally, `npx prisma --version` still showed version 7.3.0 from global cache. Team initially confused about whether downgrade succeeded.

**Root Cause:**
npx uses global cache directory (`~/.npm/_npx/`), not local `node_modules`. Team unaware of this behavior.

**Solution:**
Switched all Prisma commands to use local binary: `node_modules\.bin\prisma` instead of `npx prisma`

**Impact:**
- 15 minutes wasted verifying versions
- Added warning to documentation for future developers

**Prevention:**
- Always use local binaries for version-critical tools
- Document npm/npx caching behavior
- Add verification steps to backlog (check actual binary version)

**Key Takeaway:**
> npx uses global cache, not local node_modules. Use local binaries (`node_modules\.bin\...`) for version-locked tools.

---

### 🎯 Lesson 3: Git Submodule Conflict

**What Happened:**
`nest new .` command created `.git` directory inside `backend/`, causing Git to treat it as submodule. Commit failed with "does not have a commit checked out" error.

**Solution:**
Deleted `backend/.git` using `Remove-Item -Recurse -Force backend\.git`

**Impact:**
5 minutes delay. Minor issue but caught team off-guard.

**Prevention:**
- Document in troubleshooting section
- Add to "Before First Commit" checklist: Check for nested `.git` directories
- NestJS CLI creates `.git` when using `nest new` in existing repo

**Key Takeaway:**
> NestJS CLI creates `.git` in project directory. Delete nested `.git` folders to prevent submodule issues.

---

### 🎯 Lesson 4: Strong Documentation Culture Prevents Future Problems

**What Happened:**
Sprint 0 team updated documentation in real-time during troubleshooting. This created comprehensive guides (sprint-0-backlog.md expanded from 3 to 7 troubleshooting sections, README files created).

**Impact:**
- Future sprints avoided same issues (Prisma, npx, Git)
- New developers (or future self) have clear onboarding path
- Zero repeat questions about setup
- Documentation served as institutional knowledge

**Documentation Created:**
- `sprint-0-backlog.md` - 200+ lines of troubleshooting guidance
- `README.md` - Project root with quickstart
- `backend/README.md` - Backend-specific setup
- `sprint-0-retrospective.md` - Complete lessons learned

**Best Practice Established:**
- Document problems AS THEY HAPPEN (not after sprint)
- Include exact commands that worked
- Explain WHY solution works
- Add troubleshooting sections incrementally

**Key Takeaway:**
> Document problems in real-time during development. Future you (and future team) will thank present you.

---

### 🎯 Lesson 5: Health Check Design - Liveness vs Readiness

**What Happened:**
Sprint 0 implemented two health endpoints following cloud-native best practices:
- `GET /health` → Liveness probe (simple "ok", no dependencies)
- `GET /ready` → Readiness probe (checks database + storage connectivity)

**Why This Matters:**
- Liveness: Checks if app process is alive (fast, no dependencies)
- Readiness: Checks if app can handle traffic (includes dependency checks)
- Kubernetes/orchestrators can distinguish "dead container" vs "temporarily unhealthy"

**Benefits:**
- Production-ready from day one
- Clear separation of concerns
- Enables intelligent traffic routing
- Prevents cascading failures

**Trade-offs:**
- Slightly more complex than single `/health` endpoint
- ✅ Pro: Production-ready architecture
- ❌ Con: 2 endpoints instead of 1 (negligible)

**Key Takeaway:**
> Design for production from Sprint 0. Separate liveness and readiness checks enable intelligent orchestration.

---

## Sprint 1 Lessons (January 2026)
### Authentication System & User Management

### 🎯 Lesson 6: Perfect Time Estimation Is Possible (100% accuracy)

**What Happened:**
Sprint 1 was estimated at 21 hours, completed in exactly 21 hours with 100% test pass rate (40/40 tests passed).

**Success Factors:**
- Detailed task breakdown (7 stories, each with 3-5 tasks)
- Clear acceptance criteria
- No surprises (well-understood domain: authentication)
- Focused sprint (one epic only)
- Building on Sprint 0's solid foundation

**Replication Strategy:**
- Break stories into 1-2 hour tasks
- Use proven patterns (JWT, Passport, Prisma)
- Limit WIP (one story at a time)
- Clear Definition of Done

**Key Metrics:**
- 7/7 stories completed (Story 2.8 Azure AD deferred as planned)
- 40/40 E2E tests passed (100%)
- 8 Git commits with clean history
- 14 API endpoints delivered

**Key Takeaway:**
> Accurate estimation requires: detailed task breakdown + proven patterns + focused scope + strong foundation from previous sprint.

---

### 🎯 Lesson 7: Comprehensive E2E Testing Pays Off

**What Happened:**
Created PowerShell test scripts for each story, resulting in 100% test pass rate and high confidence in production readiness.

**Test Coverage Achieved:**
- User Registration: 6/6 tests (all 4 roles + duplicate email + weak password)
- JWT Login: 6/6 tests (all 4 roles + invalid credentials + non-existent user)
- RBAC: 14/14 tests (all role combinations + 401/403 errors)
- Password Reset: 2/2 tests (successful + email enumeration protection)
- Profile Management: 7/7 tests (get/update profile + change password)
- Session Management: 5/5 tests (refresh token + logout + revocation)

**Testing Framework Benefits:**
- ✅ Automated E2E testing (no manual testing needed)
- ✅ Timestamp-based unique test users (no conflicts)
- ✅ Detailed reporting with pass/fail counts
- ✅ CI/CD compatible (exit codes)
- ✅ Verbose mode for debugging

**Impact:**
- Zero production bugs discovered after deployment
- High confidence in authentication security
- Documentation serves as API usage examples
- Future stories can copy test patterns

**Key Takeaway:**
> Invest in test automation early. Comprehensive E2E tests catch integration issues and serve as living documentation.

---

### 🎯 Lesson 8: RefreshToken Architecture Evolution

**What Happened:**
During Story 2.7 (Session Management), team refactored from single-device to multi-device session support.

**Original Design (Single Device):**
```prisma
model User {
  refreshToken String? // Only one token per user
}
```

**Improved Design (Multi Device):**
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique @db.Text
  userId    String
  expiresAt DateTime
  isRevoked Boolean  @default(false)
}
```

**Benefits of New Design:**
- ✅ Users can login from multiple devices
- ✅ Can revoke specific device's session
- ✅ Better security (token rotation per device)
- ✅ Audit trail (when each device logged in)

**Lesson Learned:**
Don't lock into single-device assumptions. Multi-device is increasingly expected (desktop + mobile + tablet).

**Key Takeaway:**
> Design authentication for multi-device from the start. RefreshToken as separate table enables device management and better security.

---

### 🎯 Lesson 9: Email Enumeration Protection

**What Happened:**
Password reset endpoint designed to prevent email enumeration attacks.

**Security Pattern:**
```typescript
// ❌ BAD: Reveals if email exists
if (!user) {
  throw new NotFoundException('Email not found');
}

// ✅ GOOD: Always returns success
async requestReset(email: string) {
  const user = await findByEmail(email);
  if (user) {
    // Send reset email
  }
  return { message: 'If email exists, reset link sent' };
}
```

**Why This Matters:**
- Prevents attackers from discovering valid user emails
- Common OWASP vulnerability
- Easy to implement correctly from start
- Hard to fix retroactively (API contract change)

**Pattern Applied in:**
- POST `/auth/request-reset` - Password reset
- POST `/auth/register` - Registration (consistent error messages)
- POST `/auth/login` - Login (generic "Invalid credentials")

**Key Takeaway:**
> Never reveal whether email/username exists in error messages. Always return generic success/error messages to prevent enumeration attacks.

---

## Sprint 2 Lessons (January 2026)
### Badge Templates & Feature Development

### 🎯 Lesson 10: Prisma JSON Types Require Plain Object Conversion (Story 3.5)

**What Happened:**
When implementing `issuanceCriteria` validation with class-validator DTOs, Prisma rejected the DTO instance with error:
```
Type 'IssuanceCriteriaDto' is not assignable to type 'JsonNull | InputJsonValue'
```

**Root Cause:**
- Prisma expects plain JavaScript objects for `Json` type fields
- class-validator DTOs are class instances with metadata
- Class instances !== plain objects in TypeScript

**Solution Implemented:**
```typescript
// ❌ WRONG - Direct DTO assignment
issuanceCriteria: createDto.issuanceCriteria

// ✅ CORRECT - Convert to plain object
issuanceCriteria: createDto.issuanceCriteria 
  ? JSON.parse(JSON.stringify(createDto.issuanceCriteria))
  : null
```

**Impact on Future Development:**
- ⚠️ **CRITICAL:** Any DTO with nested objects stored in Prisma `Json` fields needs conversion
- ⚠️ Affects: Badge issuance rules, workflow definitions, custom metadata
- ✅ Pattern established: Always convert DTO → Plain Object before Prisma

**Prevention Checklist:**
- [ ] When using `@Type()` or `@ValidateNested()` in DTOs
- [ ] When mapping DTO to Prisma model with `Json` field
- [ ] Add `JSON.parse(JSON.stringify(dto.field))` conversion
- [ ] Test with actual class instances, not plain objects

**Key Takeaway:**
> class-validator DTOs are class instances. Prisma Json fields need plain objects. Always convert: `JSON.parse(JSON.stringify(dto))` before saving.

---

## Post-Sprint 2 Lessons (January 2026)
### Documentation Organization & Project Structure

### 🎯 Lesson 11: Documentation Organization

**What Happened:**
After Sprint 2, team discovered documentation scattered across multiple locations:
- Sprint 0-1 docs in `_bmad-output/implementation-artifacts/`
- Sprint 2 docs in `backend/docs/` (root level, mixed with living docs)
- Architecture docs in `_bmad-output/planning-artifacts/`
- Lessons learned in separate `docs/` directory
- No clear organizational principle

**Problems Caused:**
- 🔍 Hard to find specific documents (search across 4+ directories)
- 🔗 Broken cross-references between documents
- 🤔 Confusion about where to put new documents
- 📁 Mixed "living" and "historical" documents in same folder
- 🧹 No clear archival strategy for completed sprints

**Root Cause:**
- No documentation structure defined at project start
- Documents created "wherever convenient" during sprints
- Planning artifacts (`_bmad-output`) kept separate from project
- No distinction between project-level vs backend-specific docs

**Solution Implemented:**
Created standardized documentation structure:
```
gcredit-project/
├── docs/                           # Project-level documentation
│   ├── architecture/               # System architecture
│   ├── planning/                   # Product requirements, epics
│   ├── decisions/                  # Architecture Decision Records
│   ├── lessons-learned/            # This file and best practices
│   └── security/                   # Security policies
├── backend/docs/
│   ├── API-GUIDE.md               # Living: API reference
│   ├── DEPLOYMENT.md              # Living: Deployment procedures
│   ├── TESTING.md                 # Living: Testing guide
│   └── sprints/                   # Historical: Sprint work
│       ├── sprint-0/
│       ├── sprint-1/
│       └── sprint-2/
```

**Key Distinctions:**
1. **Project-level** (`/docs`) vs **Backend-specific** (`/backend/docs`)
2. **Living documents** (root level, updated frequently) vs **Historical snapshots** (`/sprints`, frozen in time)
3. **Planning** (requirements, epics) vs **Implementation** (sprint backlogs, retrospectives)

**Migration Actions Taken:**
- ✅ Moved all sprint docs to `/backend/docs/sprints/sprint-X/`
- ✅ Moved architecture to `/docs/architecture/`
- ✅ Moved planning artifacts to `/docs/planning/`
- ✅ Moved lessons learned to `/docs/lessons-learned/`
- ✅ Created README indexes in each major directory
- ✅ Documented structure in `DOCUMENTATION-STRUCTURE.md`

**Prevention for Future:**
- 📋 Document structure defined upfront
- 📍 Clear rules for where each doc type belongs
- 🔄 Standard process: sprint docs → archive to `sprints/sprint-X/`
- 📖 README indexes in every directory
- ✅ Checklist: "Where should this document go?"

**Key Takeaway:**
> Define documentation structure early. Distinguish between living (frequently updated) and historical (point-in-time snapshot) documents. Use clear folder hierarchy to guide document placement.

**Time Cost:**
- Lost time searching for docs: ~2 hours over project
- Reorganization time: ~1 hour
- **ROI:** Will save 5+ hours on future sprints

---

### 🎯 Lesson 12: Living vs Historical Documents Need Separation

**What Happened:**
In Sprint 2, created multiple documents in `backend/docs/`:
- `sprint-2-retrospective.md` (historical snapshot)
- `sprint-2-final-report.md` (historical snapshot)
- `API-GUIDE.md` (living document, updated ongoing)
- `TESTING.md` (living document, updated ongoing)

All documents mixed together in flat structure.

**Problem:**
- Developers confused: "Should I update sprint-2-retrospective?"
- No clear signal which docs are "done" vs "evolving"
- Hard to find "current" documentation among sprint snapshots

**Root Cause:**
Didn't distinguish between:
- **Living documents** - Represent current system state (API docs, deployment guide)
- **Historical documents** - Point-in-time snapshots (sprint retrospectives, reports)

**Solution:**
Separated by location:
```
backend/docs/
├── API-GUIDE.md              # Living: Update when API changes
├── DEPLOYMENT.md             # Living: Update when deployment changes
├── TESTING.md                # Living: Update when tests change
└── sprints/
    └── sprint-2/
        ├── retrospective.md  # Historical: Never change after sprint
        ├── final-report.md   # Historical: Frozen snapshot
        └── backlog.md        # Historical: What we planned
```

**Clear Rules Established:**
1. **Living docs stay at root level** - Easy to find, meant to be updated
2. **Historical docs go in `/sprints/sprint-X/`** - Archived, read-only
3. **Living docs answer "how is it NOW?"** - Current state
4. **Historical docs answer "what did we do?"** - Past events

**Examples:**

| Document Type | Location | Update Pattern |
|---------------|----------|----------------|
| API Guide | `/backend/docs/API-GUIDE.md` | Update when endpoints change |
| Sprint Retrospective | `/backend/docs/sprints/sprint-2/retrospective.md` | Write once, never update |
| Deployment Guide | `/backend/docs/DEPLOYMENT.md` | Update when procedures change |
| Sprint Backlog | `/backend/docs/sprints/sprint-2/backlog.md` | Snapshot of plan, frozen |
| Testing Guide | `/backend/docs/TESTING.md` | Update when test strategy changes |

**Benefits:**
- ✅ Developers know which docs to update
- ✅ Easy to find "current" documentation (root level)
- ✅ Historical record preserved (sprint folders)
- ✅ No confusion about document status

**Prevention for Future:**
- Ask: "Will this document be updated after sprint ends?"
  - **Yes** → Living document, root level
  - **No** → Historical document, `/sprints/sprint-X/`
- Create sprint folder at sprint start
- Move completed sprint docs to archive at sprint end

**Key Takeaway:**
> Separate living (frequently updated, current state) from historical (frozen snapshot, point-in-time) documents. Location signals purpose: root = current, /sprints = history.

**Documentation Checklist (New Document):**
```
□ Is this a living document (updated frequently)?
  → Yes: Place in /backend/docs/ or /docs/
  → No: Continue to next question

□ Is this sprint-specific work?
  → Yes: Place in /backend/docs/sprints/sprint-X/
  → No: Place in /docs/{category}/

□ Is this project-wide or backend-specific?
  → Project-wide: /docs/
  → Backend-only: /backend/docs/

□ Does it fit a category (architecture, planning, security)?
  → Yes: /docs/{category}/
  → No: Consider creating new category or placing in /docs/
```

---

### 🎯 Lesson 13: Test File Organization - Proactive vs Reactive Cleanup

**What Happened:**
After 3 sprints of development (Sprint 0-3), discovered 35+ test-related files scattered in backend root directory:
- 25 PowerShell test scripts (`.ps1`)
- 4 HTTP test files (`.http`)
- 3 test reports (`.txt`)
- 3 alternative language versions (`.js`, `.py`)
- Multiple duplicate/deprecated test files

**Impact:**
- 🔍 Root directory cluttered (62 files/folders → hard to navigate)
- 😕 Confusion about which tests are current vs deprecated
- ⏱️ 2+ hours spent searching for specific test files
- 🤔 New developers unsure which tests to run
- 📁 No clear organization by Sprint or feature

**Root Cause:**
- Created test files "wherever convenient" during sprints
- No upfront test file organization strategy
- Kept deprecated tests alongside active ones
- No clear naming convention for test evolution (v1, v2, etc.)
- Accumulated "experimental" test files from debugging sessions

**Solution Implemented (2026-01-27):**
Created structured test directory organization:

```
backend/
├── test/                      # Jest E2E tests (4 files)
│   ├── *.e2e-spec.ts
│   └── jest-e2e.json
│
├── test-scripts/              # Active PowerShell tests (17 files) ⭐
│   ├── sprint-1/             # 7 files: Authentication tests
│   ├── sprint-2/             # 4 files: Badge template tests
│   ├── sprint-3/             # 1 file: Badge issuance tests
│   ├── infrastructure/       # 3 files: Email, storage, DB reset
│   └── utilities/            # 2 files: Test data generation
│
└── test-archive/              # Historical/deprecated tests (17 files) ⭐
    ├── deprecated/           # 6 files: Replaced by newer versions
    ├── alternative-languages/ # 3 files: JS, Python reference
    ├── http-client-tests/    # 4 files: REST Client format
    ├── experimental/         # 6 files: Debugging attempts
    └── README.md            # Archive explanation
```

**Reorganization Actions:**
- ✅ Moved 35 test files from root to organized directories
- ✅ Reduced root directory from 62 → 30 items (52% reduction)
- ✅ Created `test-archive/README.md` explaining each archived file
- ✅ Separated active vs deprecated tests clearly
- ✅ Organized by Sprint for easy historical reference
- ✅ Created `testing-quick-guide.md` for finding tests
- ✅ Updated `project-structure.md` to reflect new layout

**Time Investment:**
- Reorganization: 1 hour
- Documentation updates: 30 minutes
- **Total**: 1.5 hours

**Immediate Benefits:**
- ✅ Root directory clean and navigable
- ✅ Clear which tests are active vs archived
- ✅ Easy to find Sprint-specific tests
- ✅ Historical tests preserved for reference
- ✅ New developers can quickly locate tests

**Key Principles Established:**

1. **Organize by Sprint AND Purpose**
   - Sprint-specific tests → `test-scripts/sprint-{n}/`
   - Cross-cutting tests → `test-scripts/infrastructure/`
   - Tools/utilities → `test-scripts/utilities/`

2. **Active vs Archive Separation**
   - Active tests: `test-scripts/` (current, maintained)
   - Deprecated tests: `test-archive/` (reference only)

3. **Never Delete, Always Archive**
   - Deprecated tests move to `test-archive/deprecated/`
   - Document WHY archived (replaced by what?)
   - Preserve for learning and historical reference

4. **Test Evolution Naming**
   - Instead of `test-v1.ps1`, `test-v2.ps1`, `test-v3.ps1`
   - Use descriptive names: `test-quick.ps1`, `test-e2e.ps1`, `test-complete.ps1`
   - Archive old versions when superseded

5. **Documentation is Critical**
   - Each test directory needs a README
   - Archive needs explanation of each file's history
   - Quick guide for finding/running tests

**Prevention for Future:**

**At Sprint Start:**
```
□ Create test-scripts/sprint-{n}/ directory
□ Plan test organization upfront
□ Decide test naming convention
□ Document in test strategy
```

**During Sprint:**
```
□ Place new tests in correct sprint folder
□ Use descriptive names (not test1, test2, test3)
□ Delete temporary test files after debugging
□ Don't keep multiple versions of same test
```

**At Sprint End:**
```
□ Review all test files in sprint folder
□ Archive deprecated tests
□ Update test documentation
□ Ensure tests runnable for future reference
```

**Comparison with Code Organization:**
This is analogous to Lesson 14 (Documentation Organization) but for test files:

| Aspect | Documentation (Lesson 14) | Tests (Lesson 16) |
|--------|---------------------------|-------------------|
| Problem | Docs scattered everywhere | Tests scattered in root |
| Solution | Organize by type & sprint | Organize by sprint & purpose |
| Living vs Historical | `/docs/` vs `/sprints/` | `test-scripts/` vs `test-archive/` |
| Key Principle | Location signals purpose | Location signals status |

**Red Flags (When to Reorganize):**
- 🚨 Root directory has >10 test files
- 🚨 Confusion about which test to run
- 🚨 Multiple versions of same test exist
- 🚨 Old test files "just in case we need them"
- 🚨 5+ minutes to find the right test

**Key Takeaway:**
> Test file organization is as important as code organization. Define test directory structure upfront, organize by Sprint and purpose, and separate active from archived tests. Never let test files accumulate in root directory - reorganize proactively when count exceeds 10.

**ROI Calculation:**
- Reorganization cost: 1.5 hours (one-time)
- Time saved per developer: ~10 minutes/sprint finding tests
- Team size: 3 developers
- Remaining sprints: 5
- **Savings**: 3 × 10min × 5 = 2.5 hours
- **ROI**: 67% time savings (plus cleaner codebase)

**Template for Future Projects:**
```
backend/
├── test/                 # Jest E2E tests only
├── test-scripts/         # Active PowerShell/manual tests
│   ├── sprint-1/
│   ├── sprint-2/
│   ├── sprint-{n}/
│   ├── infrastructure/
│   └── utilities/
└── test-archive/         # Historical reference
    ├── deprecated/
    └── README.md
```

This structure should be created at project start, not after accumulating technical debt.

---

### 📧 Lesson 14: Email Integration & Third-Party Service Challenges (Story 4.5)

**Context:**
Story 4.5 implemented email notification functionality for badge issuance, integrating Azure Communication Services for production and Ethereal for development.

**Development Time:** 2 hours (matches estimate) + 1.5 hours debugging/testing = 3.5 hours actual

---

#### Challenge 1: TypeScript Type Safety - Minor Typos Can Cause Major Issues

**What Happened:**
```typescript
this.etherealTransporter = nodemailer.createTransporter({  // ❌ Wrong
```
Compilation error: `Property 'createTransporter' does not exist`

**Root Cause:**
Method is `createTransport` not `createTransporter` - single character typo.

**Why This Matters:**
- TypeScript caught it at compile time ✅
- Similar issues: `passwordHash` vs `password` field naming
- Small typos in large codebases hard to spot visually

**Solution & Prevention:**
```typescript
import type { Transporter } from 'nodemailer';  // Explicit types
this.etherealTransporter = nodemailer.createTransport({  // ✅ Correct
```

**Lesson:**
> Always use explicit TypeScript imports and type annotations. Let TypeScript catch typos before runtime. Use IDE autocomplete to avoid manual typing.

---

#### Challenge 2: Module Dependencies - Circular Reference Prevention

**What Happened:**
```typescript
// badge-issuance.module.ts
imports: [PrismaModule, EmailModule],  // ❌ EmailModule doesn't exist
```
Error: `Cannot find module '../common/email.module'`

**Root Cause:**
Created EmailService but forgot to create EmailModule wrapper.

**Why This Matters:**
- NestJS requires explicit module registration
- Services without modules can't be injected
- Easy to forget when upgrading existing services

**Solution:**
```typescript
// src/common/email.module.ts (NEW FILE)
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

**Prevention Checklist:**
```
□ Create service file (.service.ts)
□ Create module file (.module.ts)
□ Export service in module
□ Import module where needed
□ Update consuming module imports
```

**Lesson:**
> In NestJS, every service needs a module wrapper. When creating/upgrading services, immediately create the corresponding module to avoid injection errors.

---

#### Challenge 3: Static Resources in Compiled Output

**What Happened:**
```
❌ Failed to load email template: ENOENT: no such file or directory
   'C:\...\backend\dist\src\badge-issuance\templates\badge-claim-notification.html'
```

**Root Cause:**
- TypeScript compiles `.ts` → `.js` to `dist/`
- HTML templates aren't TypeScript files
- NestJS CLI doesn't copy `.html` files by default

**Solution 1: Configure nest-cli.json**
```json
{
  "compilerOptions": {
    "assets": [
      "**/*.prisma",
      "**/*.html"  // ← Add HTML files
    ],
    "watchAssets": true
  }
}
```

**Solution 2: Fallback Path Resolution**
```typescript
// Load from dist or src (development fallback)
let templatePath = path.join(__dirname, '../templates/template.html');
if (!fs.existsSync(templatePath)) {
  templatePath = path.join(process.cwd(), 'src/.../template.html');
}
```

**Asset Types to Consider:**
- HTML templates (emails, PDFs)
- CSS/SCSS files
- JSON configurations
- Image files (if embedded)
- `.prisma` schema files

**Lesson:**
> Always configure `nest-cli.json` to copy non-TypeScript assets during compilation. Add runtime fallback for development environments where assets might be in src/ instead of dist/.

---

#### Challenge 4: Database Schema Field Name Mismatches

**What Happened:**
```typescript
create: {
  email: 'admin@gcredit.com',
  password: adminPassword,  // ❌ Wrong field name
}
```
Error: `Argument 'passwordHash' is missing`

**Root Cause:**
- Assumed field was named `password`
- Actual Prisma schema uses `passwordHash`
- No IDE autocomplete for Prisma create objects

**Why This Happens:**
- Schema designed weeks ago
- Naming convention not memorized
- Easy to guess wrong field name

**Prevention Strategies:**
1. **Check Schema First:**
```bash
# Always verify field names before writing create/update
grep "model User" prisma/schema.prisma -A 20
```

2. **Use Prisma Studio:**
- Visual reference for all fields
- Click to copy field names

3. **Type Hints:**
```typescript
const userData: Prisma.UserCreateInput = {  // ← Type annotation helps
  email: 'test@example.com',
  passwordHash: hashedPassword,  // IDE autocomplete works
}
```

**Common Mismatches:**
- `password` vs `passwordHash`
- `image` vs `imageUrl`
- `createdBy` vs `createdById`
- `expires` vs `expiresAt`

**Lesson:**
> Never assume Prisma field names. Always check schema first, or use explicit type annotations to enable IDE autocomplete. Maintain naming convention documentation.

---

#### Challenge 5: External Resource Reliability

**What Happened:**
```typescript
imageUrl: 'https://via.placeholder.com/400x400/...'  // ❌ Not loading
```
Email preview showed broken image placeholder.

**Root Cause:**
- `placeholder.com` blocked by some email clients
- Ethereal may restrict external images
- No fallback or validation

**Why This Matters:**
- Production emails with broken images look unprofessional
- Third-party CDNs can fail/change
- No control over availability

**Solution Hierarchy:**
```
1. Self-hosted (Best)
   - Upload to Azure Blob Storage
   - Full control, reliable

2. Reliable CDN (Good)
   - picsum.photos (widely accessible)
   - imgur (stable)
   - cloudinary (paid, very reliable)

3. Placeholder services (Avoid)
   - via.placeholder.com (unreliable)
   - dummyimage.com (limited)
```

**Production-Ready Approach:**
```typescript
// Validate image URL before sending email
async validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

// Fallback to default badge image
const imageUrl = await this.validateImageUrl(template.imageUrl) 
  ? template.imageUrl 
  : this.getDefaultBadgeImage();
```

**Lesson:**
> Never trust third-party CDNs in production. Use self-hosted assets or validate external URLs before sending. Always have fallback images for critical UI elements.

---

#### Challenge 6: Development vs Production Environment Configuration

**What Happened:**
Had to implement dual email systems:
- Development: Ethereal (fake SMTP, preview URLs)
- Production: Azure Communication Services (real emails)

**Complexity:**
- Different SDKs (`nodemailer` vs `@azure/communication-email`)
- Different authentication methods
- Different response handling
- Need seamless switching

**Solution Pattern:**
```typescript
class EmailService {
  constructor(private config: ConfigService) {
    const isDev = config.get('NODE_ENV') !== 'production';
    
    if (isDev) {
      this.initializeEthereal();  // Free preview
    } else {
      this.initializeACS();       // Paid service
    }
  }
  
  async sendMail(options: SendMailOptions) {
    // Unified interface for both environments
    if (this.isDevelopment) {
      return this.sendViaEthereal(options);
    } else {
      return this.sendViaACS(options);
    }
  }
}
```

**Benefits of This Pattern:**
- ✅ No real emails during development (no cost)
- ✅ Preview URLs for visual debugging
- ✅ Same code paths for both environments
- ✅ Easy to test production logic locally

**Configuration Requirements:**
```env
# Development (.env)
NODE_ENV=development

# Production (.env.production)
NODE_ENV=production
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=...
EMAIL_FROM=badges@gcredit.example.com
```

**Lesson:**
> For expensive/external services (email, SMS, payments), implement dual-mode service with free development alternative. Use environment variable switching, not code changes, to toggle between modes.

---

#### Challenge 7: Error Handling - Don't Block User Operations

**What Happened:**
Initial implementation threw errors if email sending failed:
```typescript
await this.emailService.sendMail(...);  // ❌ Throws on failure
return badge;  // User never sees badge if email fails
```

**Problem:**
- Email service outage blocks badge issuance
- User penalized for external service failure
- Core functionality dependent on auxiliary feature

**Correct Approach:**
```typescript
try {
  await this.emailService.sendMail(...);
  this.logger.log(`✅ Email sent to ${recipient.email}`);
} catch (error) {
  this.logger.error(`❌ Email failed: ${error.message}`);
  // ⚠️ DON'T THROW - Badge already issued
}
return badge;  // Always return success
```

**Error Handling Hierarchy:**
1. **Core operations:** Throw errors (badge creation, DB writes)
2. **Auxiliary operations:** Log errors, don't throw (emails, analytics)
3. **Nice-to-have:** Silent fail (metrics, tracking)

**When to Throw vs Log:**
```
Throw:     Badge issuance, payment processing, data persistence
Log Only:  Email notifications, Slack webhooks, analytics
Ignore:    Google Analytics, feature flags, A/B tests
```

**Lesson:**
> Never let auxiliary services (email, notifications) block core business operations. Use try-catch to isolate failures, log errors for monitoring, but return success to user. Core functionality should degrade gracefully.

---

### 📊 Story 4.5 Summary Statistics

**Total Development Time:**
- Initial implementation: 2h (estimate: 2h) ✅
- Debugging compilation: 0.5h
- Testing & seed data: 0.5h
- Image URL fix: 0.5h
- **Total:** 3.5h (estimate: 2h) = 175% of estimate

**Issues Encountered:**
1. ❌ EmailModule missing (15min)
2. ❌ TypeScript typo `createTransporter` (10min)
3. ❌ Template file not copied to dist (20min)
4. ❌ Prisma field name mismatch `password` vs `passwordHash` (5min)
5. ❌ Null type errors `template.description | null` (10min)
6. ❌ Empty database, needed seed script (15min)
7. ❌ Broken image placeholder (15min)

**Code Metrics:**
- Files created: 10 (service, module, template, tests, seed scripts)
- Lines added: +1056
- Dependencies: +1 (`@azure/communication-email`)

**Test Results:**
- ✅ Manual testing: 3/3 passed
- ✅ Email rendering: Verified in Ethereal preview
- ✅ All 10 acceptance criteria met

---

### 🎯 Key Takeaways for Future Email/Integration Work

**Pre-Development Checklist:**
```
□ Verify all Prisma field names (especially for User model)
□ Create module wrapper immediately when creating service
□ Configure nest-cli.json for HTML assets
□ Plan dual-mode strategy (dev vs prod) upfront
□ Choose reliable CDN for images (or self-host)
□ Implement graceful degradation for auxiliary services
```

**Development Best Practices:**
```typescript
// 1. Use explicit TypeScript types
import type { Transporter } from 'nodemailer';

// 2. Validate external resources
if (!fs.existsSync(templatePath)) { /* fallback */ }

// 3. Isolate auxiliary service failures
try { await sendEmail(); } catch (e) { logger.error(e); }

// 4. Environment-based switching
const service = isDev ? DevService : ProdService;

// 5. Type-safe Prisma operations
const data: Prisma.UserCreateInput = { ... };
```

**Testing Strategy:**
```
1. Unit tests: Mock EmailService
2. Integration tests: Use Ethereal for real SMTP
3. E2E tests: Verify email sent (check logs, not inbox)
4. Manual verification: Preview actual email HTML
```

**Monitoring Requirements:**
```
- Log all email attempts (success + failure)
- Track email delivery rate
- Alert on >10% failure rate
- Store preview URLs in dev logs
```

---

### 💡 Applicability to Other Integrations

These lessons apply to any third-party service integration:

| Service Type | Dev Alternative | Key Concern |
|--------------|----------------|-------------|
| Email (Story 4.5) | Ethereal | Don't block on failure |
| SMS | Twilio test mode | Cost in development |
| Payment | Stripe test mode | Idempotency required |
| Storage | Local filesystem | Migration path to cloud |
| Analytics | Console logging | Privacy considerations |

**General Integration Pattern:**
1. Research dev/test mode before writing code
2. Implement dual-mode service (dev + prod)
3. Use environment variables for switching
4. Graceful degradation for failures
5. Comprehensive error logging
6. Monitor success rates in production

**ROI of These Lessons:**
- Time saved on future integrations: ~1 hour per service
- Bug prevention: ~2-3 production incidents avoided
- Development speed: 30% faster debugging
- Code quality: Better error handling patterns

---

## Post-Sprint 3 Lessons (January 2026)
### Documentation System Cleanup & Maintenance

### 🎯 Lesson 15: SSOT Requires Enforcement - The Paradox of Important Documents

**What Happened:**
After completing Sprint 3 (Badge Issuance - 6 stories, 26 E2E tests, 7 UAT scenarios - all passing), requested comprehensive documentation cleanup. Agent (Paige - Technical Writer) discovered [project-context.md](../../project-context.md) was severely outdated - still showing Sprint 1 content when we'd completed Sprint 3 two days ago.

**The Paradox:**
[project-context.md](../../project-context.md) is explicitly defined as "single source of truth" for project status, yet it was the LAST document to be updated. Why? Because everyone assumed "someone else" would update the most important document.

**Root Cause:**
- Definition of Done: No explicit "Update project-context.md" step
- Implicit trust: "It's SSOT, so it must be current" (false assumption)
- Attention bias: Updated user-facing docs (READMEs, guides) but forgot internal SSOT
- Sprint velocity: Moving fast → overlooked systematic updates

**Impact:**
- New team members onboarding → seeing outdated Sprint 1 context
- Agent decision-making → based on stale 2-sprint-old information
- BMAD agents → reading incorrect project status when planning work
- Documentation system → SSOT promise broken, trust eroded

**Solution Implemented:**
Created [sprint-completion-checklist-template.md](../checklists/sprint-completion-checklist-template.md) (73 items, 4 phases, 70-100 minutes):
- Phase 3 (Verification): **CRITICAL** "Update project-context.md with Sprint Summary" (5 min)
- Explicit enforcement: Not optional, marked CRITICAL priority
- Template integration: Every Sprint retrospective → mandatory checklist review
- Also added: "Update CODE/README.md" (GitHub homepage) and "Update sprint-backlog.md DoD"

**Key Insights:**
1. **SSOT paradox**: The more important a document as SSOT, the easier it is to forget updating it (because "it's always current")
2. **Checklist enforcement > implicit trust**: Cannot rely on team members "remembering" to update critical docs
3. **CRITICAL markers work**: Explicit priority labeling prevents overlooking important tasks
4. **Definition of Done needs SSOT**: Should include "Update all SSoT documents" as explicit step
5. **Two-day lag = major problem**: In agile, 2-day-old context is effectively outdated

**Prevention for Future:**
- ✅ Sprint completion checklist (73 items) now enforces project-context.md update
- ✅ sprint-backlog-template.md includes Sprint-level Definition of Done with SSOT update
- ✅ DOCUMENTATION-STRUCTURE.md explains project-context.md role as SSOT
- 🔄 Consider: Automated checks (CI/CD) to detect stale project-context.md (e.g., "Last Updated" > 7 days old)
- 🔄 Consider: Git pre-commit hook that warns if merging Sprint work without project-context.md update

**Time Cost:**
- Discovery: 15 minutes (during documentation audit)
- Fix (Sprint 3 update): 20 minutes (updated project-context.md manually)
- Process improvement: 90 minutes (created sprint-completion-checklist-template.md)
- **Total:** 2 hours (one-time), saves ~5 minutes/Sprint future (prevents 2-hour "archaeology" sessions)

**ROI:**
- Prevents: 2-hour "what did we do in Sprint X?" archaeology sessions
- Improves: Agent decision quality (based on current, not stale, context)
- Ensures: BMAD agents always reference correct project state
- Onboarding: New team members see accurate "current Sprint" context

---

### 🎯 Lesson 16: Workspace vs Project Documentation - Different Audiences Need Different READMEs

**What Happened:**
During cleanup, discovered [CODE/README.md](../../../README.md) was outdated (showing Sprint 2 when Sprint 3 complete). User asked: "我记得 CODE/README.md 原本要作为 GitHub 的首页展示，为什么这个文件一直被忽略了？" (Why is CODE/README.md constantly neglected?)

**Root Cause Analysis:**
Confusion between two different audiences and purposes:
- **CODE/README.md**: GitHub repository homepage (external audience: potential employers, collaborators, open-source community)
- **project-context.md**: Internal single source of truth (internal audience: BMAD agents, development team, future maintainers)

The problem: Both documents had "project status" sections, so team members only updated project-context.md (internal SSOT) and forgot CODE/README.md (external homepage). No clear role separation led to neglect.

**Impact:**
- External impression: GitHub visitors seeing Sprint 2 when project at Sprint 3 (looks abandoned/unmaintained)
- Hiring/portfolio: Potential employers see outdated project status
- Open-source readiness: If project goes public, first impression is "stale documentation"
- Documentation duplication: Two "project status" sections → twice the maintenance burden

**Solution Implemented: Dual README Strategy**

**1. CODE/README.md (External Audience - GitHub Homepage):**
```markdown
# G-Credit Digital Credentialing System
*Open Badge-compliant digital credentialing platform*

## Project Status
**Current Sprint:** Sprint 3 - Badge Issuance System ✅ Complete  
**Development Start:** January 2026  
**Last Updated:** 2026-01-28

## Tech Stack
- Backend: NestJS + Prisma + PostgreSQL
- Frontend: React + TypeScript + Tailwind CSS
- Testing: Jest + Supertest (182 E2E tests across 3 Sprints)

## Development Approach
Enterprise-grade development with comprehensive test coverage, E2E-first methodology, and agile Sprint cycles.

## Repository Structure
See [Project Documentation](gcredit-project/project-context.md) for detailed development context.
```

**2. project-context.md (Internal Audience - BMAD Agents + Team):**
- Detailed Sprint history, technical decisions, workflow patterns
- BMAD agent instructions, file organization, development standards
- Living document updated every Sprint completion
- Single source of truth for development team

**Key Distinction:**
| Aspect | CODE/README.md | project-context.md |
|--------|---------------|-------------------|
| **Audience** | External (GitHub visitors) | Internal (BMAD agents + team) |
| **Tone** | Professional showcase | Technical working doc |
| **Depth** | High-level overview | Detailed Sprint history |
| **Update Frequency** | After major milestones | After every Sprint |
| **Purpose** | First impression / Portfolio | Development continuity |

**Updates to Workflow:**
- sprint-completion-checklist-template.md now includes **both**:
  - ✅ "Update project-context.md with Sprint Summary" (internal SSOT)
  - ✅ "Update CODE/README.md with Sprint milestone" (external homepage)
- DOCUMENTATION-STRUCTURE.md added new category:
  ```markdown
  ### 0. Workspace Root Documentation (External Audience)
  - **CODE/README.md**: GitHub repository homepage, project showcase
  ```

**Key Insights:**
1. **Multiple audiences → multiple documents**: External (GitHub) vs Internal (team) need different docs
2. **README confusion is common**: Many projects struggle with "which README to update?"
3. **Explicit role definition prevents neglect**: Clear "external vs internal" distinction ensures both get updated
4. **Checklist enforcement**: sprint-completion-checklist must include BOTH READMEs
5. **External docs = professional image**: Outdated GitHub README = "project looks abandoned"

**Prevention for Future:**
- ✅ Dual README strategy documented in DOCUMENTATION-STRUCTURE.md
- ✅ sprint-completion-checklist enforces both README updates
- ✅ Clear audience targeting: CODE/README.md (external) vs project-context.md (internal)
- 🔄 Consider: Automated "Last Updated" badge in CODE/README.md to show freshness
- 🔄 Consider: CI/CD check that warns if CODE/README.md "Current Sprint" doesn't match latest tag

**Time Cost:**
- Discovery: 5 minutes (user question during cleanup)
- Analysis: 15 minutes (root cause identification)
- Solution: 30 minutes (updated CODE/README.md + sprint-completion-checklist)
- Documentation: 20 minutes (added to DOCUMENTATION-STRUCTURE.md)
- **Total:** 1 hour 10 minutes (one-time), saves ~10 minutes/Sprint future

**ROI:**
- Professional image: GitHub homepage always current (important for portfolio/hiring)
- Clear roles: No more "which README?" confusion
- Systematic updates: Checklist ensures both external and internal docs maintained
- Open-source readiness: If project goes public, documentation already polished

---

### 🎯 Lesson 17: Documentation Consolidation - When to Merge vs When to Keep Separate

**What Happened:**
During cleanup, discovered [IMPORT-PATHS.md](../../reference/IMPORT-PATHS.md) (12KB, 428 lines) with 80%+ overlap with [backend-code-structure-guide.md](../../guides/backend-code-structure-guide.md) (8KB, 263 lines). User asked: "IMPORT-PATHS.md 这个文件还有用吗？看起来和 backend-code-structure-guide.md 有很多重复" (Is IMPORT-PATHS.md useful? Seems to duplicate backend-code-structure-guide.md)

**Root Cause:**
Documentation rapid creation phase (Sprint 0-3) → multiple documents created to address immediate needs → didn't pause to check for overlap → ended up with two docs serving 80% same audience with similar content.

**The Duplication Problem:**
- **IMPORT-PATHS.md**: Copy-paste ready import statements, feature module templates, common mistakes (3 examples)
- **backend-code-structure-guide.md**: Import path best practices, directory structure, common pitfalls (3 examples)
- **Overlap**: Both covered NestJS import conventions, feature module organization, Prisma patterns
- **Risk**: Maintaining two documents → update one, forget the other → content divergence over time

**Decision Framework:**
**方案 A (Keep Separate):**
- Pros: Specialized focus (imports vs structure)
- Cons: 80% overlap = 80% duplicate maintenance, high divergence risk

**方案 B (Merge into One):**
- Pros: Single source for backend structure knowledge, no duplication
- Cons: Longer document (need good TOC)

**Chose 方案 B** because:
1. Same target audience (backend developers)
2. 80%+ overlap = high maintenance cost
3. Import paths ARE part of code structure (not separate concern)
4. Better to have one comprehensive guide than two overlapping docs

**Solution Implemented:**
Merged IMPORT-PATHS.md → backend-code-structure-guide.md:

**Added sections:**
- "Copy-Paste Ready Imports" (from IMPORT-PATHS.md)
- "Feature Module Template" (from IMPORT-PATHS.md)
- Expanded "Common Mistakes" from 3 → 7 examples (merged both docs' examples)
- Added visual diagrams for import path resolution

**Updated references:** 24 files referenced IMPORT-PATHS.md → all updated to point to backend-code-structure-guide.md:
- ADR-001.md (Architecture Decision Records)
- 6 lesson sections in lessons-learned.md
- test-organization-guide.md
- DOCUMENTATION-STRUCTURE.md
- sprint-completion-checklist-template.md
- And 14 more files across Sprint docs, checklists, workflows

**Deleted:** IMPORT-PATHS.md (after confirming all references updated)

**Key Insights:**
1. **Overlap threshold**: >80% overlap + same audience = merge, not maintain separately
2. **Rapid documentation creation → duplication**: Sprint velocity means we create fast, consolidate later
3. **Maintenance cost is ongoing**: Two documents = 2x effort to keep synchronized forever
4. **Content divergence is real**: Found cases where same concept explained differently in two docs
5. **Reference updates are critical**: 24 files referenced old doc → must update all to prevent broken links
6. **Consolidation timing**: After initial rapid creation phase (Sprint 0-3), before docs diverge too much

**When to Merge:**
- ✅ Same target audience (backend devs)
- ✅ >80% content overlap
- ✅ Same purpose (guidance/reference)
- ✅ High risk of content divergence

**When to Keep Separate:**
- ❌ Different audiences (backend vs frontend)
- ❌ <50% overlap
- ❌ Different purposes (guide vs API reference)
- ❌ Documents updated by different teams

**Prevention for Future:**
- ✅ Quarterly documentation review: Check for >50% overlap between docs
- ✅ Before creating new doc: Ask "Does existing doc cover 50%+ of this content?"
- ✅ DOCUMENTATION-STRUCTURE.md: Note that consolidation is expected after rapid creation phases
- 🔄 Consider: Documentation overlap analyzer tool (compare files, flag >60% similarity)
- 🔄 Consider: "Related documents" section in each guide to surface potential overlaps

**Time Cost:**
- Discovery: 10 minutes (user question during cleanup)
- Analysis: 20 minutes (compare two docs, calculate overlap %)
- Merge implementation: 60 minutes (merge content, improve structure, add diagrams)
- Reference updates: 30 minutes (update 24 files)
- Verification: 10 minutes (confirm no broken links)
- **Total:** 2 hours 10 minutes (one-time), saves ~15 minutes/Sprint future (no dual maintenance)

**ROI:**
- Maintenance savings: 50% reduction (one doc instead of two)
- Consistency: Single source = no content divergence
- Developer experience: One comprehensive guide > two partial overlapping guides
- Quality: Can invest saved time into making one great doc instead of two okay docs

---

### 🎯 Lesson 18: Periodic Cleanup Reveals Hidden Technical Debt - Empty Directories, Duplicates, and Divergence

**What Happened:**
Comprehensive documentation cleanup after Sprint 3 completion revealed multiple categories of hidden technical debt that accumulated over 3 Sprints:

**Discovery 1: Duplicate Files with Different Content**
- Found ADR-002.md in two locations: CODE/docs/ and gcredit-project/docs/adr/
- Checked MD5 hashes → **different content** (content had diverged!)
- Risk: Team members referencing different versions → conflicting architectural decisions

**Discovery 2: Severely Outdated "Living Documents"**
- lessons-learned.md in CODE/docs/ was 27KB behind current version
- Sprint 3 content completely missing (6 stories, 26 tests, 7 lessons - all absent)
- Risk: Onboarding new team members with Sprint 1-2 lessons only

**Discovery 3: Misplaced Files**
- CODE/docs/ directory: 7 files total
  - 3 files: Sprint-specific manifests (belonged in gcredit-project/sprints/sprintX/)
  - 2 files: Duplicate ADRs (belonged in gcredit-project/docs/adr/)
  - 1 file: Outdated lessons-learned.md (current version in gcredit-project/docs/lessons-learned/)
  - 1 file: npm-warnings-analysis.md (belonged in gcredit-project/sprints/sprint-0/)
- Root cause: Sprint velocity → "save file quickly" → forget to move to proper location later

**Discovery 4: Empty Directory Hierarchies**
- CODE/backend/ directory: 0 files
  - Had 3 levels of empty subdirectories (controllers/, services/, modules/)
  - Leftover from initial project structure planning (never populated)
  - Wasted mental space: Team members saw directory → assumed it had content → checked → empty → confusion

**Discovery 5: Documentation Compliance Issues**
- Started cleanup with 670+ markdown files
- Only 45% had proper structure (frontmatter, headers, TOC)
- 55% were "quick notes" without metadata → hard to search, organize, maintain

**Root Cause - The Velocity Paradox:**
Sprint velocity creates technical debt accumulation:
1. **Sprint 0-1**: Create foundational docs (mostly well-structured)
2. **Sprint 2-3**: Moving fast → "quick save" files in wrong locations
3. **Post-Sprint 3**: Realize 670+ files with 45% compliance → cleanup needed

Fast development → shortcuts → periodic cleanup required (not a failure, just reality)

**Impact:**
- **Duplicate content divergence**: Different ADR versions → architectural confusion
- **Outdated learning docs**: New team members miss Sprint 3 lessons → repeat mistakes
- **Misplaced files**: Waste time searching for Sprint manifests in wrong locations
- **Empty directories**: False signals ("backend folder exists → must have backend code?")
- **45% compliance**: Hard to maintain, search, and organize unstructured docs

**Solution Implemented - 3-Phase Cleanup:**

**Phase 1: Foundation (45% → 55%)**
- Moved misplaced files to correct Sprint folders
- Deleted duplicate ADR-002.md (kept canonical version in gcredit-project/docs/adr/)
- Deleted outdated lessons-learned.md (kept current version)
- Deleted empty CODE/backend/ directory hierarchy

**Phase 2: Structure (55% → 82%)**
- Added frontmatter metadata to 200+ files
- Created DOCUMENTATION-STRUCTURE.md v1.0 (canonical structure guide)
- Organized files into 8 categories:
  1. Sprint-specific Documentation
  2. Architecture & Technical Decisions
  3. Guides & How-Tos
  4. Reference Documentation
  5. Checklists & Templates
  6. Lessons Learned & Retrospectives
  7. Project Context & Planning
  8. Testing & Quality Assurance

**Phase 3: Enhancement (82% → 100%)**
- Created 20 new comprehensive documents (~30,000 words)
- Added 10 Mermaid diagrams for visual documentation
- Updated 30+ cross-references to deleted/moved files
- Implemented dual README strategy (external vs internal)
- Merged overlapping documents (IMPORT-PATHS.md → backend-code-structure-guide.md)

**Key Insights:**
1. **Duplicates with different MD5 = data integrity problem**: Not just "redundant files" but "conflicting content"
2. **"Living documents" can die quietly**: lessons-learned.md was 27KB behind because no one checks regularly
3. **Empty directories are misleading**: CODE/backend/ had 0 files but 3 levels of structure → false signal
4. **45% compliance is critical threshold**: Below 50% → system starts breaking down (hard to search, maintain)
5. **Cleanup timing matters**: After Sprint 3 (rapid creation done) is better than mid-Sprint (still creating)
6. **Phase-based cleanup works**: Foundation → Structure → Enhancement (not "fix everything at once")

**When to Schedule Periodic Cleanup:**
- ✅ After major milestone (Sprint 3, MVP, release)
- ✅ When compliance drops below 60%
- ✅ When team spends >15 minutes finding documents
- ✅ After rapid documentation creation phase (Sprint 0-3)
- ❌ Mid-Sprint (still actively creating content)
- ❌ During crunch time (cleanup needs focus)

**Prevention for Future:**
- ✅ Monthly documentation audit: Check for duplicates, misplaced files, empty directories
- ✅ Sprint completion checklist: Includes "Move all temporary files to proper locations"
- ✅ Quarterly compliance check: Target 85%+ structured documentation
- ✅ "Living documents" review: Every Sprint, check lessons-learned.md, project-context.md for updates
- 🔄 Consider: Automated duplicate detector (MD5 hash check across workspace)
- 🔄 Consider: Empty directory cleanup script (run monthly)
- 🔄 Consider: Documentation compliance dashboard (show % structured docs over time)

**Time Cost:**
- **Phase 1 (Foundation)**: 3 hours (moved files, deleted duplicates, cleaned empty dirs)
- **Phase 2 (Structure)**: 5 hours (added metadata, created DOCUMENTATION-STRUCTURE.md)
- **Phase 3 (Enhancement)**: 12 hours (created 20 new docs, 10 diagrams, updated references)
- **Total:** 20 hours over 3 days (intensive cleanup session)

**ROI:**
- **Time saved searching**: 15 min/day → 5 min/day (saved 10 min/day × 20 workdays/Sprint = 200 min/Sprint = 3.3 hours/Sprint)
- **Onboarding improvement**: New team members find docs 30% faster (measured by "time to find Sprint X context")
- **Maintenance reduction**: 100% compliance → easier to update (no "where should this go?" decisions)
- **Quality improvement**: Comprehensive docs → fewer repeated mistakes (lessons-learned.md now complete)
- **Annual savings**: 3.3 hours/Sprint × 8 Sprints/year = 26.4 hours/year saved
- **Investment vs Return**: 20 hours cleanup → 26.4 hours/year saved → Break-even after 9 months, then net positive

**Lessons for Next Cleanup:**
1. **Schedule quarterly**: Don't wait until 45% compliance (catch at 70% next time)
2. **Phase-based approach works**: Foundation → Structure → Enhancement (manageable chunks)
3. **Automated tools help**: MD5 duplicate checker, empty directory cleanup script
4. **Cleanup is investment**: 20 hours upfront → 26+ hours/year saved
5. **Velocity creates debt**: Accept that rapid development = periodic cleanup needed (plan for it)

---

## Post-Sprint 5 Lessons (January 2026)
### Workflow Automation & Template System Optimization

### 🎯 Lesson 19: Agent Activation Safety Net - Proactive Template/Reference Checking

**Category:** 🤖 Workflow Automation, 🛡️ Error Prevention  
**Impact:** HIGH (affects all agent interactions across all sprints)  
**Sprint Discovered:** Cross-Sprint Pattern (Sprint 5 → Sprint 6 transition)

**What Happened:**
During Sprint 5 completion and Sprint 6 planning phase, discovered that users might forget to specify custom templates when summoning specialized agents (Bob, Amelia, Winston, Sally). This led to agents using built-in workflows instead of optimized custom templates, missing 15-40 min/Sprint time savings and bypassing lessons-learned integration.

**Root Cause:**
- **Dependency on user memory**: User must remember to say "基于XXX模板" when activating agents
- **Reactive agents**: Agents waited for user specification instead of proactively offering options
- **No safety net**: System relied on human memory for critical workflow decisions
- **Information asymmetry**: User might not know which templates are available or relevant for current task

**Problems This Caused:**
1. **Efficiency loss**: Missed optimized templates → lost 15-40 min/Sprint in Planning and Completion
2. **Knowledge isolation**: Lessons-learned.md (2,296 lines, 18 lessons) underutilized
3. **Workflow inconsistency**: Sometimes custom templates, sometimes built-in workflows
4. **Cognitive load**: User must remember template names, agent capabilities, when to use what

**Solution Implemented:**
Added proactive template/reference checking step to all 4 specialized agents' activation sequences:

**Implementation Details:**
- **Bob (Scrum Master)** - Step 5.5: Asks about sprint-planning/completion-checklist, lessons-learned
- **Amelia (Developer)** - Step 13.5: Asks about user-story-template, code patterns, lessons-learned
- **Winston (Architect)** - Step 3.5: Asks about ADR-template, existing ADRs, architectural patterns
- **Sally (UX Designer)** - Step 4.5: Asks about UX templates, user research, existing wireframes

**New Activation Flow:**
```
1. Agent loads config & project-context.md
2. Agent detects QUICK-REFERENCE.md existence
3. Agent asks: "1️⃣ Do you want to use custom templates?"
4. Agent asks: "2️⃣ Are there reference materials to review?"
5. Agent loads selected files (or proceeds with built-in)
6. Agent stores session: {use_custom_templates}, {reference_files}
7. Agent displays menu and waits for command
```

**Results Achieved:**
- ✅ **Zero-thought workflow**: User no longer needs to remember template names
- ✅ **Proactive safety net**: Agent reminds user about available optimizations
- ✅ **Flexible choice**: User can still say YES/NO/SKIP (not forced)
- ✅ **Contextual prompts**: Each agent suggests relevant materials (SM→lessons, Dev→patterns, Architect→ADRs)
- ✅ **Prevention over correction**: System prevents mistakes rather than fixing them later

**Metrics Impact:**
- **Before**: ~20% chance of forgetting template → 15-40 min lost per Sprint
- **After**: ~99% template usage (agent reminds) → consistent time savings
- **Lessons-learned usage**: Increased from "occasional reference" to "active system" in Planning/Development/Completion

**Key Takeaway:**
> **Proactive > Reactive**. Agents should remind users about available resources, not wait for users to remember. Design systems that prevent human memory failures, not systems that depend on them.

**Prevention Pattern for Future:**
1. **Agent Design Principle**: Always ask "What might user forget?" during agent design
2. **Safety Net First**: Build reminders into activation flow, not documentation
3. **Contextual Awareness**: Agent should know project structure and suggest relevant resources
4. **Flexible Defaults**: Offer smart suggestions but allow user override

**Related Patterns:**
- Pattern 2: Copy Working Code > Reading Docs (agents now proactively offer examples)
- Lesson 15: SSOT Requires Enforcement (agents enforce template usage through prompts)
- Lesson 11: Documentation Organization (QUICK-REFERENCE.md enables agent detection)

**When to Apply This Pattern:**
- ✅ **DO apply** when there are multiple workflow options (built-in vs custom)
- ✅ **DO apply** when forgetting has high cost (>15 min lost time)
- ✅ **DO apply** when user choice is frequent (every agent activation)
- ❌ **DON'T apply** for one-time configurations (better in config file)
- ❌ **DON'T apply** for simple binary choices (better as flag)

**Future Enhancements:**
- [ ] Session persistence: Remember user's last choice across agent restarts
- [ ] Auto-detection: Agent infers relevant references based on menu item selected
- [ ] "Always use custom" config: Skip prompt if user always chooses YES
- [ ] Usage analytics: Track which templates/references are most valuable

**Files Modified:**
- `_bmad/bmm/agents/sm.md` (Bob - Step 5.5)
- `_bmad/bmm/agents/dev.md` (Amelia - Step 13.5)
- `_bmad/bmm/agents/architect.md` (Winston - Step 3.5)
- `_bmad/bmm/agents/ux-designer.md` (Sally - Step 4.5)

**Related Documentation:**
- [QUICK-REFERENCE.md](../templates/QUICK-REFERENCE.md) - Template navigation system
- [Template Audit Report](../archive/template-audit-2026-01-29.md) - Complete template system analysis
- [sprint-planning-checklist.md](../templates/sprint-planning-checklist.md) - Planning workflow with agent automation
- [sprint-completion-checklist-template.md](../templates/sprint-completion-checklist-template.md) - Completion workflow

---

## Sprint 9 Lessons (February 2026)
### ESLint Cleanup & TypeScript Compiler Gaps

### 🎯 Lesson 34: `eslint --fix` Can Silently Strip TypeScript `as` Type Assertions

**Category:** 🔧 Tooling, 🐛 Debugging  
**Impact:** HIGH (causes CI to break after lint auto-fix, very subtle)  
**Sprint Discovered:** Sprint 9, TD-015 (ESLint Type Safety Cleanup)  
**Discovery Date:** 2026-02-07  
**Related Story:** [TD-015](../../sprints/sprint-9/td-015-eslint-type-safety.md)

#### Problem

During CI pipeline repair, Dev fixed a `tsc --noEmit` error in `csv-parser.service.ts` by adding an `as` type cast:

```typescript
// Dev's initial fix — passes tsc --noEmit ✅
const rows = parse(csvContent) as CsvRow[];
```

This passed the TypeScript compiler. But when `eslint --fix` ran subsequently in CI, it **silently removed** the `as CsvRow[]` assertion because the ESLint `no-unsafe-assignment` rule treats `as` casts on `any`-typed values as unsafe. The result reverted to:

```typescript
// After eslint --fix — cast stripped, type is `any` again ❌
const rows = parse(csvContent);
```

This caused `tsc --noEmit` to fail again, requiring a second CI fix commit.

#### Root Cause

`eslint --fix` and `tsc --noEmit` have **conflicting views** on `as` casts:
- **tsc:** `as` casts are valid type annotations that resolve type errors
- **ESLint (no-unsafe-assignment):** `as` casts on `any` values are "unsafe" and get stripped by `--fix`

This creates a loop: Developer adds cast → tsc passes → eslint removes cast → tsc fails again.

#### Solution

**Use variable type annotations instead of `as` casts.** Variable annotations survive `eslint --fix` because they're not considered "unsafe":

```typescript
// ❌ FRAGILE: eslint --fix will strip the `as` cast
const rows = parse(csvContent) as CsvRow[];

// ✅ ROBUST: eslint --fix will NOT touch variable annotations
const rows: CsvRow[] = parse(csvContent);
```

#### Prevention for Future
- **Dev Prompt Rule:** Add "Never use `as` casts to fix type errors when `eslint --fix` is configured — use variable type annotations" to coding standards
- **Code Review Check:** Flag `as` casts on `any`-typed expressions as fragile
- **CI Order:** Run `eslint --fix` BEFORE `tsc --noEmit` to catch cast-stripping early

#### Key Takeaway
> When `eslint --fix` and `tsc --noEmit` both run in CI, they can fight over `as` casts. Use variable type annotations (`const x: Type = expr`) instead of assertion casts (`expr as Type`) to avoid this conflict.

---

### 🎯 Lesson 35: Local CI Parity — TypeScript, ESLint, and Prettier Each Check Different Things

**Category:** 🏗️ Architecture, 🧪 Testing, 📋 Process  
**Impact:** CRITICAL (129 type errors accumulated undetected across 8 sprints; recurred Sprint 11 with 11 lint/prettier errors on new files)  
**Sprint Discovered:** Sprint 9, TD-015 SM Acceptance Review  
**Recurrence:** Sprint 11, Wave 4 (Stories 11.10, 11.11, 11.12) — 2026-02-14  
**Discovery Date:** 2026-02-07  
**Related Story:** [TD-017](../../sprints/sprint-9/td-017-tsc-type-errors.md)

#### Problem

During TD-015 SM acceptance, running `npx tsc --noEmit` revealed **129 pre-existing type errors** that had accumulated since Sprint 0 — completely undetected. All CI checks were green:
- `npm run lint` ✅ (ESLint uses own TypeScript parser)
- `npm test` ✅ (Jest uses ts-jest for compilation)
- `npm run build` ✅ (NestJS build configured differently)

**How 129 errors hid for 8 sprints:**

| Layer | Tool | Strictness | In CI? | Catches tsc errors? |
|-------|------|-----------|--------|---------------------|
| Build | `nest build` (SWC/webpack) | Low | ✅ | ❌ (transpile-only) |
| Lint | `@typescript-eslint/parser` | Medium | ✅ | Partial (rule-based) |
| Test | `ts-jest` | Low | ✅ | ❌ (lenient, mocks bypass) |
| **Type Check** | **`tsc --noEmit`** | **Strict** | **❌** | **✅** |

The strictest tool was the only one NOT in the CI pipeline.

#### Error Breakdown (at discovery)

```
Total: 138 errors (129 pre-existing + 9 from TD-015)
├── Test files: 124 (90%) — mock objects don't match real types
├── Source files: 14 (10%) — Prisma JSON/filter typing issues
│
├── TS2339 (property not exist): 56
├── TS18048 (possibly undefined): 28
├── TS2322 (type mismatch): 16
├── TS2345 (argument mismatch): 16
├── TS7053 (implicit any index): 10
├── TS7006 (implicit any param): 10
└── Other: 2
```

#### Root Cause

**False confidence from green CI:** Three TypeScript tools each use their own compilation strategy, creating gaps:

1. **ts-jest (tests):** Doesn't enforce type accuracy on mock data. `mockResolvedValue({...})` accepts any object shape regardless of the real interface.
2. **@typescript-eslint/parser (lint):** Only checks what eslint rules are configured for. Missing `no-unsafe-*` rules → misses many issues.
3. **tsc --noEmit (type check):** Full TypeScript type resolution. The only tool that catches ALL type errors. Was never added to CI.

#### Solution

1. Created TD-017 to fix all 124 remaining test-file tsc errors (Sprint 10, 5h)
2. Source file errors fixed immediately via CI pipeline repair (commits `5deace0`, `769a151`)
3. Plan: Add `"type-check": "tsc --noEmit"` script to package.json and gate in CI (Sprint 11)

#### Sprint 11 Recurrence (2026-02-14)

**What happened again:** Wave 4 created 3 new spec files (Stories 11.10-11.12) and modified a frontend test file. Local verification ran:
- `npx jest --forceExit` ✅ (718 tests passed)
- `npx vitest run` ✅ (541 tests passed)
- `npx tsc --noEmit` ✅ (0 errors)
- `npx eslint` on **source files only** ✅

But CI failed with **11 errors and 17 warnings**: `prettier/prettier` formatting violations, `@typescript-eslint/no-require-imports` error — all in the **new spec files** that were never linted locally.

**Why it recurred:** The fix for the original lesson added `tsc --noEmit` to the checklist but the local ESLint check was only run on modified source (non-test) files. Newly created `.spec.ts` files bypassed lint entirely. The verification was **selective** (cherry-picked files) instead of **exhaustive** (all changed files).

**Additional gap identified:**

| Check | Ran locally? | Ran in CI? | Scope |
|-------|-------------|-----------|-------|
| `tsc --noEmit` | ✅ | ✅ | All files |
| `eslint` | ⚠️ Partial | ✅ All files | Only ran on 2 source files, skipped 3 new spec files |
| `prettier` | ❌ Never | ✅ (via eslint) | Never ran standalone |
| `jest` | ✅ | ✅ | All test files |

#### Prevention for Future

- **Sprint 0 Rule:** Add `tsc --noEmit` to CI pipeline from day one
- **Dev Prompt:** Include `npx tsc --noEmit` as verification step in all dev prompts
- **SM Acceptance:** Always run `npx tsc --noEmit` during story acceptance
- **New Projects:** Add to project setup checklist: "CI must include tsc --noEmit"
- **🆕 Pre-commit: Lint ALL changed files, not cherry-picked ones:**
  ```powershell
  # Backend: lint all changed/new .ts files (including spec files)
  cd gcredit-project/backend
  npx eslint src/ --max-warnings=0    # Full scope, not selective
  npx prettier --check "src/**/*.ts"  # Explicit prettier check
  npx tsc --noEmit
  
  # Frontend: same pattern
  cd gcredit-project/frontend
  npx eslint src/ --max-warnings=0
  npx prettier --check "src/**/*.{ts,tsx}"
  npx tsc --noEmit
  ```
- **🆕 Rule: New files need MORE scrutiny, not less.** Hand-written code (vs. modified existing code) is most likely to have formatting issues since it wasn't formatted by an editor on save.

#### Key Takeaway
> A NestJS/TypeScript project has at least 4 verification layers (build, lint, prettier, tsc), each checking different things. Tests passing gives false confidence — `jest`/`vitest` don't check formatting or lint rules. **Always run `eslint` and `prettier --check` on the FULL `src/` directory before commit, not just on selected files.** New/hand-written files are the most likely to fail formatting checks.

---

### 🎯 Lesson 36: Replacing `any` with Strict Types Cascades into Test Mock Failures

**Category:** 🧪 Testing, 🔧 Refactoring  
**Impact:** MEDIUM (predictable but needs planning in effort estimates)  
**Sprint Discovered:** Sprint 9, TD-015 (ESLint Type Safety Cleanup)  
**Discovery Date:** 2026-02-07  
**Related Story:** [TD-015](../../sprints/sprint-9/td-015-eslint-type-safety.md)

#### Problem

TD-015 replaced `req: any` with a shared `RequestWithUser` interface across 9 controllers:

```typescript
// Before (in 9 controllers)
@Req() req: any

// After — shared interface
interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}
interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
```

This **immediately introduced 9 new `tsc --noEmit` errors** in test files, because mock request objects only had `{ userId }` or `{ userId, email }` — missing the newly-required `role` field:

```typescript
// ❌ Test mock — was fine when controller used `req: any`
const mockReq = { user: { userId: 'test-id' } };

// ❌ After TD-015 — tsc error TS2345: Property 'email' and 'role' missing
controller.method(mockReq);

// ✅ Fix — mock must match full interface
const mockReq = { 
  user: { userId: 'test-id', email: 'test@test.com', role: UserRole.ADMIN }
} as RequestWithUser;
```

#### Additional Gotcha: `import type` for NestJS Decorators

NestJS's `isolatedModules` + `emitDecoratorMetadata` configuration requires `import type` for interfaces used only in type positions:

```typescript
// ❌ TS1272: A type referenced in a decorated signature must be imported with 'import type'
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

// ✅ Correct — use import type
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
```

#### The Cascade Pattern

```
Replace `any` with strict interface (N controllers)
  → N×M test files have mock objects that don't match new interface
  → Each mock needs additional required properties
  → If NestJS decorators involved, also need `import type`
  → Tests still PASS (ts-jest is lenient), but tsc --noEmit FAILS
```

**This is why tests passing gives false confidence** (see also Lesson 35).

#### Planning Guidance

When estimating type-strictness refactoring, apply this multiplier:

| Source Change | Expected Test Impact |
|--------------|---------------------|
| Replace `any` param in N controllers | ~1-2 test errors per controller |
| Add required field to shared interface | Every consumer's mock needs updating |
| Change return type from `any` to typed | All test assertions may need `as` casts |

**TD-015 actual data:** 9 controllers changed → 9 test errors (1:1 ratio)

#### Prevention for Future

1. **Dev Prompt Rule:** "When replacing `any` with strict types, include test mock updates in scope and time estimate"
2. **Pattern:** Create a `createMockRequestWithUser()` factory function in test utils, so all tests share one mock construction
3. **Verification:** After any `any`-elimination, always run `npx tsc --noEmit` — don't rely on `npm test` alone

#### Key Takeaway
> Replacing `any` with strict types is not just a source code change — it's a source + test change. Budget 30-50% extra time for updating test mocks, and always verify with `tsc --noEmit` since `npm test` won't catch the mock mismatches.

---

## Sprint 10 Lessons (February 2026)
### ESLint Zero-Tolerance Cleanup

### 🎯 Lesson 37: Jest Asymmetric Matchers Return `any` — Centralized Typed Wrappers

**Category:** 🧪 Testing, 🔧 Tooling  
**Impact:** HIGH (affects every test file using `expect.any()`, `expect.objectContaining()`, etc.)  
**Sprint Discovered:** Sprint 10, Story 10.2 (ESLint Full Cleanup)  
**Discovery Date:** 2026-02-08  
**Related Story:** [10-2-eslint-regression-ci-gate.md](../../sprints/sprint-10/10-2-eslint-regression-ci-gate.md)

#### Problem

Jest's asymmetric matchers (`expect.any()`, `expect.objectContaining()`, `expect.stringContaining()`, `expect.arrayContaining()`) all return `any` in `@types/jest`. When used inside object literals in test assertions, they trigger `@typescript-eslint/no-unsafe-assignment` warnings:

```typescript
// ❌ Triggers no-unsafe-assignment because expect.any(Date) returns `any`
expect(result).toEqual({
  id: 'test-id',
  createdAt: expect.any(Date),        // any → no-unsafe-assignment
  name: expect.stringContaining('test'), // any → no-unsafe-assignment
});
```

This is pervasive — nearly every test file with `toEqual()` or `toHaveBeenCalledWith()` assertions triggers these warnings when Jest matchers appear in object literals.

#### Root Cause

`@types/jest` defines asymmetric matchers with return type `any` (not a generic or branded type). This is a known limitation in Jest's TypeScript typings that the Jest team hasn't addressed.

#### Solution

Create a centralized `test/helpers/jest-typed-matchers.ts` utility file with typed wrapper functions:

```typescript
// test/helpers/jest-typed-matchers.ts
/* eslint-disable @typescript-eslint/no-unsafe-return */

export function anyDate(): Date {
  return expect.any(Date);
}

export function anyString(): string {
  return expect.any(String);
}

export function anyNumber(): number {
  return expect.any(Number);
}

export function containing<T extends Record<string, unknown>>(obj: T): T {
  return expect.objectContaining(obj);
}

export function strContaining(s: string): string {
  return expect.stringContaining(s);
}

/* eslint-enable @typescript-eslint/no-unsafe-return */
```

Usage in tests:
```typescript
import { anyDate, anyString, containing } from '../../test/helpers/jest-typed-matchers';

// ✅ No ESLint warnings — all matchers return typed values
expect(result).toEqual({
  id: 'test-id',
  createdAt: anyDate(),
  name: strContaining('test'),
});
```

#### Prevention for Future
1. **Project Template:** Include `test/helpers/jest-typed-matchers.ts` in project boilerplate
2. **Dev Prompt Rule:** "Use typed matcher helpers from `jest-typed-matchers.ts` instead of raw `expect.any()` in object literals"
3. **Code Review Check:** Flag raw `expect.any()` inside object literals as ESLint hazard

#### Key Takeaway
> When `@types/jest` returns `any` from matcher functions, don't scatter `eslint-disable` across every test file. Instead, create a single typed wrapper utility that absorbs the `any` in one place, keeping the rest of the test codebase ESLint-clean.

---

### 🎯 Lesson 38: Centralize `eslint-disable` in Utility Files, Not Scattered Across Codebase

**Category:** 📋 Process, 🔧 Tooling  
**Impact:** MEDIUM (maintainability, auditability of ESLint exceptions)  
**Sprint Discovered:** Sprint 10, Story 10.2 (ESLint Full Cleanup)  
**Discovery Date:** 2026-02-08  
**Related Story:** [10-2-eslint-regression-ci-gate.md](../../sprints/sprint-10/10-2-eslint-regression-ci-gate.md)

#### Problem

When fixing 204 `no-unsafe-*` warnings across 30+ files, there are two approaches:
1. **Scattered:** Add `// eslint-disable-next-line` to each warning location (204 disable comments)
2. **Centralized:** Fix warnings at the source, and where fixes are impossible (library type limitations), create utility wrappers that contain all `eslint-disable` in a single file

Scattered disables make future audits difficult — you can't easily tell which disables are "necessary" (library limitation) vs "lazy" (should have been properly typed).

#### Solution Applied in Story 10.2

| Strategy | Where Applied | Result |
|----------|--------------|--------|
| **Fix at source** | Mock callbacks, error handlers, service calls | 190+ warnings eliminated with proper types |
| **Centralized wrapper** | `test/helpers/jest-typed-matchers.ts` | 7 `eslint-disable` lines in ONE file, reused by 15+ test files |
| **No scattered disables** | Entire codebase | 0 per-line `eslint-disable-next-line` added |

Key patterns used to fix at source:
- `$transaction.mockImplementation((callback: (tx: unknown) => unknown) => ...)` — typed mock callbacks
- `catch (error: unknown)` + `instanceof Error` guards — typed error handling
- `toHaveProperty('field', value)` instead of `result.field` — avoids unsafe member access
- `jest.fn<() => Promise<Type>>()` — typed mock functions

#### Prevention for Future
1. **Zero-tolerance policy:** `--max-warnings=0` prevents new warnings from being introduced
2. **When `eslint-disable` is needed:** Put it in a utility/wrapper file, not inline
3. **Audit check:** `grep -r "eslint-disable" src/` should show minimal results, concentrated in utility files

#### Key Takeaway
> Treat `eslint-disable` like technical debt — if you must have it, concentrate it in utility files where it's visible, documented, and auditable. Never scatter it across the codebase where it becomes invisible and unmaintainable.

---

### 🎯 Lesson 39: UX Spec ≠ Implementation — Design System Foundation Must Be a Sprint 0 Story

**Category:** 🎨 Design, 📋 Process, 🔍 Quality Assurance  
**Impact:** 🔴 CRITICAL (20h remediation cost — largest single rework in project history)  
**Sprint Discovered:** Sprint 10, Story 10.6a (UI Walkthrough & Screenshot Baseline)  
**Discovery Date:** 2026-02-09  
**Related Stories:** [10-6a](../../sprints/sprint-10/10-6a-ui-walkthrough-screenshot-baseline.md), [10-6d](../../sprints/sprint-10/10-6d-design-system-ui-overhaul.md)  
**Remediation Story:** 10.6d — Frontend Design System & UI Overhaul (20h)

#### Problem

The G-Credit UX Design Specification (`docs/planning/ux-design-specification.md`, 3,321 lines) defines a comprehensive design system including:
- Font: `Inter` + `JetBrains Mono` via Google Fonts CDN
- Full color palette: Primary `#0078D4` (Microsoft Blue), Success `#107C10`, Warning `#F7630C`, Error `#D13438`
- Typography scale: Display 68px → Caption 11px
- Design tokens: spacing, border-radius, shadows, animations
- "Phase 1: Foundation Setup (Week 1-2)" implementation plan

**None of this was ever implemented in code.** After 10 sprints and 976 tests:
- `tailwind.config.js`: `theme: { extend: {} }` — completely empty
- `index.html`: No font `<link>` tags, `<title>` still "frontend" (Vite scaffold default)
- No `tokens.ts` or centralized design token file
- No `PageTemplate` component — each page reinvents its own layout
- CSS variables in `index.css`: auto-generated by `npx shadcn-ui init`, not customized
- Components use hardcoded `blue-600`, `text-gray-500` etc. instead of design tokens
- Double padding: `Layout.tsx` adds `px-4 py-4 md:px-6 md:py-6` AND individual pages add their own padding

All pages were functionally correct (routes work, data loads, RBAC enforced) but visually broken — no brand identity, inconsistent layouts, competing color systems.

#### Root Cause Analysis: 5 Systemic Failures

**Failure 1: Sprint 0 — Design System Foundation Was Never a Story**

The UX spec explicitly defines "Phase 1: Foundation Setup" with Tailwind config, font loading, and design tokens. But the Sprint 0 backlog only included bare Tailwind installation (`npm install tailwindcss`) with an empty `extend: {}`. Nobody translated the UX spec's Phase 1 into backlog stories.

**Failure 2: All UX Audits Reviewed Components, Not Infrastructure**

Three code-level audits were conducted (Sprint 1-4, Sprint 6, Sprint 10):

| Audit | Files Reviewed | Files Never Checked |
|-------|---------------|--------------------|
| Sprint 1-4 (Sally) | `BadgeDetailModal.tsx`, `TimelineView.tsx`, etc. | `tailwind.config.js`, `index.html` |
| Sprint 6 (Sally) | `TimelineView.tsx`, `VerifyBadgePage.tsx`, etc. | `tailwind.config.js`, `index.html` |
| Sprint 10 Release | "All frontend source files" | `tailwind.config.js`, `index.html` |

Analogy: Reviewing room decor without checking whether the building has a foundation.

**Failure 3: Sprint 6 Audit Diagnosed Symptoms, Not Root Cause**

The Sprint 6 audit identified typography hierarchy inconsistency, status color inconsistency, and button style inconsistency. But recommendations were "Create typography utility classes" and "Define status color system" — treating each as an individual fix rather than recognizing the systemic gap: zero design system infrastructure.

Had the auditor opened `tailwind.config.js` and seen `extend: {}`, the root cause would have been obvious.

**Failure 4: Audit Recommendations Were Never Converted to Stories**

The Sprint 6 audit produced actionable recommendations. From Sprint 7 through Sprint 9, **no backlog contained any stories for these recommendations.** No process existed to convert UX audit findings into sprint stories.

**Failure 5: Sprint 10 Release Audit Gave a False Positive**

The v1.0.0 release audit rated Design System Consistency at **4/5**, claiming "Full theme token system in index.css with oklch colors" and "Custom theme integrated via `@theme inline`." This was factually incorrect — the CSS variables were Shadcn auto-generated defaults, and the Tailwind config was empty. The audit confused the **presence** of CSS variables with **intentional customization**.

#### Impact

- **20h remediation** (Story 10.6d) — largest single rework story in project history
- **Sprint extended** — no hard deadline, but timeline pushed significantly
- **UAT delayed** — cannot run UAT on visually broken UI
- **All 10 sprints of features** were built on bare Tailwind defaults
- **Hardcoded colors scattered** across 40+ component files need migration to design tokens

#### Timeline

```
Sprint 0  ─── UX spec written (3,321 lines, comprehensive design system)
          ❌  "Phase 1 Foundation" never became a Story
              tailwind.config.js installed with empty theme: { extend: {} }
              ↓ Gap opens here — never closed until Sprint 10

Sprint 1-5── All features built on bare Tailwind defaults
              Components hardcode blue-600, text-gray-500, etc.
              No one notices because no visual review is conducted

Sprint 6  ── 🔍 UX Audit identifies symptoms (inconsistent colors/typography)
          ❌  Root cause missed: never checks tailwind.config.js
          ❌  Recommendations never converted to stories

Sprint 7-9── No design system stories in any backlog
              Features continue building on bare defaults

Sprint 10 ── 🔍 Release audit gives Design System 4/5 (false positive)
          ── 🔍 Story 10.6a UI Walkthrough: FIRST visual review of running UI
          ── ❌ ALL pages functional but visually broken
          ── Story 10.6d created (20h) — first design system story in 10 sprints
```

#### Solutions & Process Changes

**Immediate Fix (Story 10.6d):**
1. Load Inter font via Google Fonts CDN in `index.html`
2. Populate `tailwind.config.js` with full design token system
3. Create `PageTemplate` component for consistent page layouts
4. Remove double padding (Layout vs page-level)
5. Migrate hardcoded colors to CSS variable / Tailwind token references

**Process Changes for Future Projects:**

| # | Change | Rationale |
|---|--------|----------|
| 1 | **Sprint 0 must include "Design System Foundation" story** | Translates UX spec Phase 1 into code: fonts, Tailwind config, tokens, PageTemplate |
| 2 | **UX Audit scope must include infrastructure files** | Checklist: `tailwind.config.js`, `index.html`, `index.css`, layout components |
| 3 | **Visual UI review every 2-3 sprints** | Start the app, take screenshots, compare to spec — not just code review |
| 4 | **Audit recommendations → Stories pipeline** | Every UX audit finding must be triaged: fix now, create story, or accept risk |
| 5 | **Definition of Done for UX stories includes visual verification** | "Matches UX spec" requires actual side-by-side comparison, not just code review |

**UX Audit Infrastructure Checklist (add to audit template):**
```
□ tailwind.config.js — theme colors, fonts, spacing defined?
□ index.html — font CDN links present? <title> correct?
□ index.css / globals — CSS variables customized or just defaults?
□ Layout component — single source of page chrome?
□ PageTemplate — consistent header/spacing pattern?
□ Design tokens file — centralized constants?
□ Visual comparison — at least 3 pages vs UX spec screenshots?
```

#### Prevention for Future Projects

1. **Sprint 0 Story Template:** Include mandatory "Design System Foundation" story that covers: font loading, Tailwind theme population, CSS variable customization, PageTemplate component, design token file
2. **UX Audit Template:** Add infrastructure checklist (above) as required audit section
3. **Visual Gate:** Block UAT until at least one visual walkthrough of running UI is completed
4. **Audit → Story Pipeline:** SM tracks audit recommendations as backlog items with explicit accept/defer decisions

#### Key Takeaway
> A 3,321-line UX spec is worthless if nobody translates it into `tailwind.config.js`. Design system foundation must be a Sprint 0 story — not assumed, not deferred, not "implied." And UX audits that only review `.tsx` components while ignoring `tailwind.config.js` and `index.html` are auditing the paint while the foundation is missing.

---

## Sprint 8 Lessons (February 2026)
### Production-Ready MVP & Quality Gates

### 🎯 Lesson 31: Code Review as DoD Gate - Catch Issues Before Completion

**Category:** 🧪 Quality, 📋 Process  
**Impact:** HIGH (improves code quality and reduces post-completion fixes)  
**Sprint Discovered:** Sprint 8 (Production-Ready MVP)  
**Discovery Date:** 2026-02-05

**What Happened:**
Sprint 8 implemented formal code review as part of Definition of Done for all stories with significant code changes. Each story file includes a dedicated "Code Review" section with:
- Findings categorized by severity (HIGH/MEDIUM/LOW)
- Specific file:line references
- Fix verification with commit hashes

**Results:**
- Story 8.9 (M365 Hardening): 6 findings (3 HIGH + 3 MEDIUM), all fixed
- Story 8.10 (User Management): 4 findings, all fixed
- Story 8.1-8.5: Multiple findings each, all resolved

**Key HIGH Issues Found:**
| Story | Issue | Impact if Missed |
|-------|-------|------------------|
| 8.9 | Network errors not retried | M365 sync fails on transient errors |
| 8.9 | Disabled Azure accounts not deactivated | Security gap - disabled users remain active |
| 8.10 | Admin role change needs two-step confirm | Accidental admin promotions |

**Prevention for Future:**
- Make code review findings section mandatory in all story files
- Use SM verification to confirm all findings fixed
- Include commit hash for each fix

**Key Takeaway:**
> Code review as part of DoD catches issues when they're cheap to fix. Document findings formally in story files for traceability.

---

### 🎯 Lesson 32: E2E Test Isolation with Schema-based Approach

**Category:** 🧪 Testing, 🏗️ Infrastructure  
**Impact:** CRITICAL (enables reliable CI/CD)  
**Sprint Discovered:** Sprint 8, Task 8.8  
**Discovery Date:** 2026-02-03

**What Happened:**
Before Sprint 8, E2E tests had severe reliability issues:
- 45/71 tests failing intermittently
- 20% CI/CD success rate
- 4-minute execution time
- Tests polluting each other's data

**Solution Implemented:**
Schema-based database isolation:
```typescript
// Each test file gets unique schema
const schemaName = `test_${Date.now()}_${randomUUID().slice(0,8)}`

// Create isolated schema
beforeAll(async () => {
  await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
  // Set search_path to isolated schema
});

// Clean up after tests
afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
});
```

**Results:**
- 83/83 E2E tests passing (100%)
- 100% CI/CD reliability
- 40-second execution (6x faster)
- Zero flaky tests

**Why This Works Better Than Transaction Rollback:**
- Transactions can't span multiple requests (E2E sends HTTP requests)
- Schema isolation is true parallel execution
- Each test file is completely independent

**Key Takeaway:**
> For E2E tests with database dependencies, schema-based isolation is the gold standard. Transaction rollback doesn't work for HTTP-based tests.

---

### 🎯 Lesson 33: Accessibility First Approach - Build It In, Don't Bolt It On

**Category:** 🎨 UX, 📋 Process  
**Impact:** MEDIUM (reduces accessibility retrofitting cost)  
**Sprint Discovered:** Sprint 8, Story 8.3  
**Discovery Date:** 2026-02-02

**What Happened:**
Story 8.3 implemented WCAG 2.1 AA compliance as a dedicated story, but the approach was to create reusable accessibility primitives:
- `useFocusTrap` hook - Trap focus within modals/dialogs
- `useKeyboardNavigation` hook - Arrow/Tab/Enter/Escape handling
- `SkipLink` component - Skip to main content
- `StatusBadge` component - WCAG AA color contrast (5.9:1 - 7.5:1)
- `accessibility.css` - Focus indicators, sr-only classes

**Benefits:**
- All subsequent components automatically inherit accessibility
- Story 8.1 (Dashboard), 8.2 (Search), 8.5 (Responsive) used these primitives
- No retrofitting needed for new features

**The Pattern:**
```
1. Create accessibility primitives first (hooks, components, CSS)
2. Use primitives in all new features
3. Accessibility is "free" for all new code
```

**Contrast with Retrofitting:**
- Retrofitting requires touching every component
- Inconsistent implementation across features
- Testing burden multiplied

**Key Takeaway:**
> Invest in accessibility primitives early. When accessibility is built into your component library, every new feature inherits it for free.

---

## Sprint 7 Lessons (February 2026)
### Pre-UAT Reviews & Phase-based Execution

### 🎯 Lesson 28: Pre-UAT Review Pattern - Catch Issues Before Users Do

**Category:** 🔒 Security, 🏗️ Architecture, 🎨 UX  
**Impact:** CRITICAL (prevents UAT failures and security incidents)  
**Sprint Discovered:** Sprint 7 (Badge Revocation & Lifecycle UAT)  
**Discovery Date:** 2026-02-01

**What Happened:**
Before executing UAT, we conducted three specialized reviews:
1. **Security Audit** (Winston) - Found 16 issues, 3 P0
2. **Architecture Review** (Winston) - Found 9 issues, 1 P0
3. **UX Audit** (Sally) - Found 22 issues, 4 P0

**Impact:**
- **9 P0 issues** identified and fixed BEFORE users touched the system
- **UAT result:** 100% pass rate (15/15 tests), 0 P0/P1 bugs
- First sprint with zero UAT-discovered blockers!

**The Pattern:**
```
Sprint Dev Complete → Security Audit → Architecture Review → UX Audit → Fix P0 → UAT
```

**Key P0 Issues Found:**
| Review | Issue | Impact if Missed |
|--------|-------|------------------|
| Security | IDOR in badge claiming | Users could claim others' badges |
| Security | Role self-assignment | Anyone could become ADMIN |
| Security | JWT secret fallback | Production security compromised |
| UX | No login page | UAT impossible |

**Prevention for Future:**
- Make Pre-UAT Reviews mandatory for all sprints with user-facing features
- Add to sprint-completion-checklist as Phase A
- Schedule reviews 1-2 days before UAT

**Key Takeaway:**
> Pre-UAT Reviews are like code review for user experience - catch issues when they're cheap to fix, not during UAT when users are waiting.

---

### 🎯 Lesson 29: Phase-based Backlog Structure - Clear Execution Order for AI Agents

**Category:** 📋 Process, 🤖 AI Collaboration  
**Impact:** HIGH (improves Dev agent efficiency and reduces miscommunication)  
**Sprint Discovered:** Sprint 7  
**Discovery Date:** 2026-02-01

**What Happened:**
Original backlog was a traditional story list with dependencies noted but no clear execution order. After Pre-UAT Reviews added 9 P0 fixes, the backlog became confusing:
- Which P0 to fix first?
- When to start UX fixes vs Security fixes?
- How do UAT and bug fixes relate to P0 fixes?

**Solution Implemented:**
Restructured backlog into **Phase-based execution order**:
```
Phase 0: Completed (Epic 9 Stories) ✅
Phase A: Security P0 Fixes (3.25h) → Must complete before Phase B
Phase B: UX P0 Fixes + Login (12h) → Must complete before Phase C  
Phase C: UAT Execution (8h) → Must complete before Phase D
Phase D: Bug Fixes (TBD) → Based on UAT findings
```

**Benefits:**
- Dev agent knows exactly what to do next
- Clear dependencies and gates
- Easy progress tracking
- Zero miscommunication

**When to Use Phase-based Structure:**
- Sprints with mixed work types (features + fixes + validation)
- Sprints with clear dependency chains
- When working with AI agents that need explicit ordering

**Key Takeaway:**
> For complex sprints, transform story-list backlog into phase-based execution plan. AI agents work better with explicit "do this, then that" instructions.

---

### 🎯 Lesson 30: Technical Debt Registry as Single Source of Truth

**Category:** 📋 Process, 🔧 Technical Debt  
**Impact:** MEDIUM (prevents debt from being forgotten)  
**Sprint Discovered:** Sprint 7  
**Discovery Date:** 2026-02-01

**What Happened:**
Pre-UAT Reviews generated many findings across 3 different documents:
- `security-audit-sprint-0-7.md` (16 items)
- `architecture-review-retrospective.md` (9 items)
- `ux-audit-sprint-1-4.md` (22 items)

Plus historical debt from Sprint 0-6 (TD-001 to TD-008).

**Problem:** Items scattered across documents could be forgotten.

**Solution Implemented:**
Created `technical-debt-from-reviews.md` as **consolidated registry**:
- All items assigned unique IDs (SEC-P0-001, UX-P1-003, TD-013, etc.)
- Priority assigned (P0/P1/P2/P3)
- Effort estimated
- Target Sprint specified
- Status tracked (Pending → Fixed)

**Final Count:** 56 items tracked
- P0: 9 (all fixed in Sprint 7)
- P1: 17 (Sprint 8)
- P2: 22 (Sprint 8-9)
- P3: 8 (Sprint 9+)

**Key Principle:**
> All technical debt MUST exist in a tracked backlog, not just in review documents. Review documents are input; backlog is output.

**Prevention for Future:**
- Add "TD Registry Update" to sprint-completion-checklist (Section 3.6)
- All new debt immediately added to registry
- Review registry in Sprint Planning

**Key Takeaway:**
> Technical debt documents without tracking become technical debt themselves. Consolidate into one registry with IDs, priorities, and target sprints.

---

## Sprint 6 Lessons (January 2026)
### Testing Strategy & Service Initialization

### 🎯 Lesson 20: Unit Tests Can't Catch All Integration Issues - The Testing Coverage Gap

**Category:** 🧪 Testing Strategy, 🏗️ Architecture  
**Impact:** HIGH (affects all future service development and testing practices)  
**Sprint Discovered:** Sprint 6, Story 7.2 (Email Badge Sharing)  
**Discovery Date:** 2026-01-30

**What Happened:**
Story 7.2 implemented email badge sharing with Microsoft Graph API integration. All **29 unit tests passed 100%**, but upon starting the development server, **4 critical runtime errors** appeared:
1. **EmailTemplateService**: Template file not found (path resolution issue)
2. **GraphTokenProviderService**: Not initialized (lifecycle timing)
3. **GraphEmailService**: Failed to initialize (dependency on uninitialized TokenProvider)
4. **GraphTeamsService**: Failed to initialize (same root cause)

**Timeline:**
- ✅ **12:13 AM**: All unit tests passing (29/29)
- ✅ **12:13 AM**: TypeScript compilation successful
- ✅ **12:13 AM**: Story 7.2 marked complete, commit pushed
- ❌ **12:13 AM**: `npm run start:dev` fails with 4 ERROR logs
- 🔧 **12:15-12:28 AM**: Debugging and fixing (13 minutes to resolve)

**Root Causes Identified:**

**Issue 1: Template Path Resolution**
```typescript
// Test Environment (src/ directory) ✅
__dirname = 'src/badge-sharing/services'
template = '../templates/badge-notification.html' 
→ Resolves to: src/badge-sharing/templates/badge-notification.html ✅

// Production Environment (dist/ compiled) ❌
__dirname = 'dist/src/badge-sharing/services'
template = '../templates/badge-notification.html'
→ Resolves to: dist/src/badge-sharing/templates/badge-notification.html ❌
→ Actual location: dist/badge-sharing/templates/badge-notification.html (NestJS asset copy)
```

**Why Tests Didn't Catch This:**
- Jest runs directly in `src/` using ts-jest (no compilation)
- `nest build` asset copying only happens during production build
- Tests never executed the actual file I/O in compiled environment

**Issue 2: Service Initialization Order**
```typescript
// Test Environment (with Mocks) ✅
const mockTokenProvider = {
  getAuthProvider: jest.fn().mockReturnValue(mockAuthProvider)  // Instant
};
// GraphEmailService constructor calls mockTokenProvider.getAuthProvider() ✅

// Production Environment (real dependencies) ❌
1. GraphEmailService constructor → calls initializeClient()
2. initializeClient() → calls tokenProvider.getAuthProvider()
3. getAuthProvider() → throws "not initialized" ❌
4. (Later) GraphTokenProviderService.onModuleInit() → initializes provider ⏰
```

**Why Tests Didn't Catch This:**
- **Mocks hide real behavior**: Mock immediately returns, real service needs async initialization
- **No lifecycle hooks**: Tests don't run NestJS `onModuleInit()` lifecycle
- **Dependency isolation**: Unit tests don't test cross-service initialization timing

**Problems This Caused:**
1. **False confidence**: 100% test pass rate gave false sense of completion
2. **Delayed discovery**: Issues only found during manual server startup
3. **Production risk**: Could have deployed broken code if we didn't test server startup
4. **Time waste**: 13 minutes debugging "working" code that passed all tests

**Solutions Implemented:**

**Fix 1: Template Path with Fallback**
```typescript
// Added environment-aware path resolution
let templatePath = path.join(__dirname, '../templates/badge-notification.html');
if (!fs.existsSync(templatePath)) {
  // Fallback for dist/src/ structure
  templatePath = path.join(__dirname, '../../..', 'badge-sharing/templates/badge-notification.html');
}
```

**Fix 2: Move Initialization to Lifecycle Hook**
```typescript
// Before (in constructor) ❌
constructor() {
  if (this.isEnabled) {
    this.initializeClient(); // Too early!
  }
}

// After (in onModuleInit) ✅
export class GraphEmailService implements OnModuleInit {
  async onModuleInit() {
    if (this.isEnabled) {
      this.initializeClient(); // After dependencies ready
    }
  }
}
```

**Prevention Strategies for Future:**

**1. Add Integration/Smoke Tests**
```typescript
// New test type: Module initialization
describe('MicrosoftGraphModule (Integration)', () => {
  it('should initialize all services in correct order', async () => {
    const module = await Test.createTestingModule({
      imports: [MicrosoftGraphModule], // Real module, not mocks
    }).compile();
    
    await module.init(); // Trigger actual lifecycle
    
    const emailService = module.get(GraphEmailService);
    expect(emailService.isGraphEmailEnabled()).toBe(true);
  });
});
```

**2. CI/CD Build + Startup Check**
```yaml
# .github/workflows/ci.yml
- name: Build application
  run: npm run build
  
- name: Start server (smoke test)
  run: |
    npm run start &
    sleep 5
    curl http://localhost:3000/health
    pkill -f "node.*dist/main"
```

**3. Test in Production Mode Locally**
```bash
# Before committing
npm run build
npm run start:prod  # Not just npm test
# Check logs for ERROR
```

**Testing Coverage Gap Analysis:**

| Test Type | What It Catches | What It Misses |
|-----------|-----------------|----------------|
| **Unit Tests** | ✅ Business logic<br>✅ Single function behavior<br>✅ Error handling paths | ❌ File path resolution<br>❌ Dependency init order<br>❌ Compilation artifacts<br>❌ NestJS lifecycle |
| **Integration Tests** | ✅ Service interactions<br>✅ Database queries<br>✅ API contracts | ❌ Full lifecycle hooks<br>❌ Real file I/O<br>❌ Build process issues |
| **E2E Tests** | ✅ Full user flows<br>✅ Real HTTP requests | ❌ Server startup errors (if E2E assumes server running) |
| **Smoke Tests** | ✅ Server starts<br>✅ Basic health check | ❌ Complex flows<br>❌ Edge cases |

**The Testing Pyramid Revised:**

```
        E2E (5-10%)
     ↗    Smoke Tests (5%)    ← NEW LAYER
   Integration (15-20%)
 Unit Tests (65-75%)
```

**Key Insight**: **The gap between unit tests and E2E tests is where production bugs hide.**

**New Testing Checklist for All Services:**

**Before Marking Story Complete:**
- [ ] ✅ All unit tests pass (`npm test`)
- [ ] ✅ TypeScript compiles (`npm run build`)
- [ ] ✅ **Server starts successfully** (`npm run start:dev`, check for ERROR logs)
- [ ] ✅ Health endpoint responds (`curl localhost:3000/health`)
- [ ] ✅ **Check logs for initialization sequence** (services initialize in correct order)
- [ ] ✅ Basic smoke test (if API endpoint, hit it with curl/Postman)

**Architectural Lessons:**

**1. Dependency Injection ≠ Dependency Resolution**
- DI frameworks inject dependencies, but don't guarantee initialization order
- Services using other services must respect lifecycle hooks
- Constructor should only assign dependencies, not use them

**2. Mock Isolation is a Double-Edged Sword**
- **Pro**: Fast, reliable, isolated tests
- **Con**: Hides real integration problems
- **Balance**: Use mocks for logic, real instances for integration

**3. NestJS Lifecycle Hooks Matter**
- `onModuleInit()`: After all dependencies injected
- `onApplicationBootstrap()`: After all modules initialized
- Don't call dependent services in constructor

**Prevention Pattern for Future:**

**When creating services with dependencies:**
1. ✅ **DO**: Implement `OnModuleInit` if using other services
2. ✅ **DO**: Move initialization logic to `onModuleInit()`
3. ✅ **DO**: Keep constructor minimal (only DI assignment)
4. ✅ **DO**: Add integration test for module initialization
5. ❌ **DON'T**: Call other services in constructor
6. ❌ **DON'T**: Assume mocked behavior = real behavior
7. ❌ **DON'T**: Skip server startup test before committing

**When working with file paths in compiled code:**
1. ✅ **DO**: Use `nest-cli.json` assets configuration
2. ✅ **DO**: Add fallback paths for src/ vs dist/ structure
3. ✅ **DO**: Test path resolution in both environments
4. ✅ **DO**: Log resolved paths during development
5. ❌ **DON'T**: Assume `__dirname` points to same place in test vs prod
6. ❌ **DON'T**: Hard-code paths without environment checking

**Metrics Impact:**
- **Test Coverage**: 100% unit test coverage → False security
- **Bug Detection**: 0 bugs caught by tests → 4 bugs found at runtime
- **Recovery Time**: 13 minutes to debug and fix
- **Prevention Cost**: ~5 min to run `npm run build && npm run start:dev` before commit
- **ROI**: Spend 5 min to prevent 13+ min debugging = 2.6x return

**Key Takeaway:**
> **100% unit test coverage ≠ bug-free code**. Always validate in the actual runtime environment. Mocks hide integration issues that only appear when real dependencies interact. Add a "build + startup" check to your development workflow.

**Related Lessons:**
- Lesson 1: Version Discrepancy (planning vs reality gap)
- Lesson 8: E2E Test Stability (test environment vs production differences)
- Pattern 2: Copy Working Code > Reading Docs (real examples reveal real issues)

**Files Modified (Fixes):**
- `email-template.service.ts`: Added fallback path resolution
- `graph-email.service.ts`: Moved initialization to `onModuleInit()`
- `graph-teams.service.ts`: Moved initialization to `onModuleInit()`
- `.env`: Added missing `GRAPH_API_SCOPE` configuration

**Commits:**
- `a819786`: Story 7.2 implementation (all tests passing)
- `7fc65df`: Runtime issue fixes (initialization order + template path)

**Future Enhancements:**
- [ ] Add smoke test suite: `npm run smoke-test` (build + start + health check)
- [ ] CI/CD: Run build + startup validation on every PR
- [ ] Create integration test template for all new modules
- [ ] Document "Lifecycle Hook Best Practices" in architecture guide
- [ ] Add pre-commit hook: `npm run build && npm run start:dev -- --timeout 10s`

---

### 🎯 Lesson 21: Story File Creation Process Gap - Missing BMM Workflow Step

**Category:** 📋 Process, 🔄 Workflow  
**Impact:** MEDIUM (affects knowledge management and team scaling)  
**Sprint Discovered:** Sprint 6, during Story 7.4 planning  
**Discovery Date:** 2026-01-30

**What Happened:**

During Sprint 6 Story 7.4 preparation, discovered that **all previous sprints (0-5) and Story 7.2 were developed without creating dedicated story files**. Development proceeded directly from `backlog.md` specifications, skipping the BMM `create-story` workflow step.

**Timeline:**
- **Sprint 0-5**: No story files created (e.g., no `1-2-user-authentication.md`, `6-3-verification-service.md`)
- **Story 7.2**: Implemented directly from backlog, no `7-2-email-sharing.md` created
- **Story 7.4**: First story to follow proper workflow → discovered the gap

**Affected Sprints:**
- Sprint 0: 5 stories (infrastructure setup)
- Sprint 1: 7 stories (authentication)
- Sprint 2: 4 stories (badge templates)
- Sprint 3: 2 stories (badge issuance)
- Sprint 5: 5 stories (verification, Open Badges 2.0)
- **Total: ~30 stories without dedicated story files**

**What Was Missing in Those Stories:**

| Missing Component | Impact | Workaround That Helped |
|-------------------|--------|------------------------|
| **Dev Agent Record** | No implementation debug log | Git commits with story references |
| **File List** | Unclear which files each story modified | Git history, code search |
| **Completion Notes** | Lost development decisions and context | Retrospective.md captured some |
| **Detailed Tasks/Subtasks** | No granular tracking | Backlog.md had acceptance criteria |
| **Dev Notes Section** | Missing architecture constraints for future reference | Code comments like `// Story 6.3` |
| **Change Log** | No chronological story evolution | Git commits |

**Root Causes:**

**1. BMM Workflow Understanding Gap:**
- Team wasn't fully aware that `create-story` was a required workflow step
- Assumed detailed `backlog.md` was sufficient for development
- Dev agent didn't enforce story file requirement

**2. Time Pressure:**
- Sprint 0-5 were completed quickly (Sprint 2: 21h estimated, ~3h actual)
- Skipped "overhead" to move faster
- Focus on "working code" over "complete documentation"

**3. Workflow Design:**
- `dev-story` workflow has fallback logic: works with or without story file
- No hard enforcement of story file existence
- System allowed proceeding without blocking

**4. Backlog Quality Masked the Gap:**
- Sprint 5 backlog: 900+ lines with code examples
- Very detailed acceptance criteria (BDD format)
- Developers could work effectively without story files

**Actual Impact Analysis:**

**✅ What Went Well Despite Missing Story Files:**
1. **Code Quality:** All stories delivered high-quality code (68 tests in Sprint 5, 29 in Story 7.2)
2. **Retrospectives:** Comprehensive retrospectives captured key learnings (Sprint 5: 688 lines)
3. **Git History:** Commit messages referenced stories (e.g., "Story 6.3: Add verification service")
4. **Code Comments:** Source code annotated with story references (e.g., `// Story 4.3 - AC 3.7`)
5. **Production Stability:** All features work correctly, no bugs from missing documentation

**⚠️ What Suffered:**
1. **Knowledge Transfer:** New team members would struggle to understand "why" decisions were made
2. **Context Recovery:** Revisiting code 6 months later lacks implementation rationale
3. **File Tracking:** Unclear exactly which files were created/modified per story (must infer from git)
4. **Process Compliance:** BMM workflow incomplete, missing key tracking artifacts
5. **Onboarding Cost:** Higher learning curve for new developers joining the project

**Why This Wasn't Catastrophic:**

**Mitigating Factors:**
- Small team (1 developer + agents) - knowledge in heads, not just docs
- Continuous development - no long gaps between sprints
- Excellent testing - tests serve as executable documentation
- Detailed retrospectives - captured "what happened" and "why"
- Git discipline - meaningful commit messages with story references

**When It Would Become Critical:**
- Team grows beyond 2-3 developers
- Developer turnover occurs
- Project paused for >3 months
- Need to audit what was built in each story
- Compliance review requires change tracking

**Solution Implemented:**

**Starting with Story 7.4:**
1. ✅ Created comprehensive story file: `7-4-teams-notifications.md`
2. ✅ Used `create-story` workflow (even though manual due to no sprint-status.yaml)
3. ✅ Story file includes:
   - Complete tasks/subtasks breakdown (12 tasks, 48+ subtasks)
   - Dev Notes with architecture constraints
   - References to related documents (ADR-008, adaptive-card-specs.md)
   - Lessons learned from Story 7.2 (Lesson 20)
   - Dev Agent Record structure prepared
   - File List section ready for tracking
   - Change Log section ready

**Decision for Past Stories:**

**❌ NOT Retroactively Creating Story Files for Sprint 0-5**

**Rationale:**
- Work/benefit ratio too low (~35 stories × 30 min = 17.5 hours)
- Alternative documentation already exists (retrospectives, git, code comments)
- Code is stable and in production
- Knowledge already captured in lessons-learned.md
- Team continuity means knowledge retention is good

**✅ Compensating Actions:**
1. Added this lesson to prevent future gaps
2. Comprehensive lessons-learned.md covers key decisions
3. Retrospectives provide historical context
4. Git history is well-maintained

**Prevention Pattern for Future:**

**1. Sprint Planning Checklist Update:**
```markdown
Before starting any story:
- [ ] Run create-story workflow to generate story file
- [ ] Verify story file has: Tasks, Dev Notes, References, Dev Agent Record
- [ ] Story status = "ready-for-dev" (set by create-story)
- [ ] Dev agent confirms story file exists before implementation
```

**2. Dev Agent Enforcement:**
```yaml
# dev-story workflow should HALT if:
- Story file not found
- Story status != "ready-for-dev"
- Dev Agent Record sections missing

# Prompt user:
"Story file missing. Run create-story workflow first? (y/n)"
```

**3. Code Review Gate:**
```markdown
Before marking story complete:
- [ ] Story file exists
- [ ] File List updated with all changed files
- [ ] Completion Notes filled in Dev Agent Record
- [ ] Change Log has entry for this completion
```

**Key Takeaway:**

> **Process shortcuts work short-term but create knowledge debt.** Even with excellent code quality and testing, missing the story file creation step loses valuable development context. For solo/small teams, retrospectives can compensate. For scaling teams, story files are essential for knowledge transfer and onboarding.

**Metrics:**

| Metric | Before (Sprint 0-5) | After (Story 7.4+) |
|--------|---------------------|---------------------|
| Story files created | 0/30 (0%) | 1/1 (100%) target |
| Dev Agent Record | None | Complete structure |
| File List tracking | Git only | In story file + git |
| Implementation notes | Retrospective only | Per-story + retrospective |
| Onboarding time | ~2-3 days (code reading) | ~1 day (story files + code) estimate |

**Related Lessons:**
- Lesson 11: Documentation Organization (importance of structure)
- Lesson 15: SSOT Requires Enforcement (process compliance)
- Lesson 19: Agent Activation Safety Net (proactive checks)
- Lesson 20: Testing Coverage Gap (unit tests ≠ complete validation)

**Files Referenced:**
- [Sprint 6 Backlog](../../sprints/sprint-6/backlog.md) - Used instead of story files
- [Sprint 5 Retrospective](../../sprints/sprint-5/retrospective.md) - Partial context recovery
- [Story 7.4 Story File](../../sprints/sprint-6/7-4-teams-notifications.md) - First proper story file
- [BMM Create-Story Workflow](/_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml)
- [BMM Dev-Story Workflow](/_bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml)

**Action Items:**
- [x] Document this gap in lessons-learned.md
- [x] Create Story 7.4 with complete story file
- [ ] Update sprint-planning checklist with story file requirement
- [ ] Add enforcement logic to dev-story workflow (suggest to BMad framework)
- [ ] Review with LegendZhu in Sprint 6 retrospective
- [ ] Consider if Story 7.2 needs retroactive story file (decision: NO, too much effort)

---

### 🎯 Lesson 22: Prisma Schema Naming Conventions and Mock Testing Pitfalls

**Category:** 🧪 Testing, 🏗️ Architecture, 🐛 Debugging  
**Impact:** HIGH (caused repeated TypeScript compilation errors)  
**Sprint Discovered:** Sprint 6, Story 7.4 (Teams Notifications)  
**Discovery Date:** 2026-01-30  
**Related Story:** [Story 7.4](../../sprints/sprint-6/7-4-teams-notifications.md)

#### Problem

**Symptoms:**
Repeated TypeScript compilation errors when accessing Prisma relations, despite all unit tests (182/182) passing:

```typescript
// ❌ TS2339: Property 'badgeTemplate' does not exist
const badge = await prisma.badge.findUnique({
  where: { id: badgeId },
  include: { 
    badgeTemplate: {  // ERROR!
      include: { issuer: true } 
    }
  }
});

// ❌ TS2339: Property 'credential' does not exist on type 'PrismaService'
const credential = await prisma.credential.findFirst(...);

// ❌ TS2339: Property 'name' does not exist on type 'User'
const userName = user.name;  // User has firstName/lastName, not name
```

**What Happened in Story 7.4:**
1. Implemented `TeamsSharingController` and `TeamsBadgeNotificationService`
2. All 36 unit tests passed (100% coverage) ✅
3. Committed code and started dev server
4. TypeScript compilation showed 5 errors ❌
5. Server started but had runtime errors
6. Spent 30+ minutes debugging "obvious" code that worked in tests

#### Root Cause

**Three interrelated issues:**

**1. Prisma Relation Naming Mismatch**

```prisma
// Schema definition (schema.prisma)
model badges {
  templateId                      String
  users_badges_issuerIdTousers    users  @relation("badges_issuerIdTousers", ...)
  users_badges_recipientIdTousers users  @relation("badges_recipientIdTousers", ...)
  badge_templates                 badge_templates  @relation(...)
  //  ↑ Field name                 ↑ Table name
}
```

**How Prisma generates API names:**
- Field name in schema: `badge_templates` (snake_case, same as table)
- **Generated API name**: `template` (singular, camelCase, **without "badge" prefix**)
- **NOT**: `badgeTemplate` (what we incorrectly assumed)
- Similarly: `users_badges_issuerIdTousers` → `issuer`, `users_badges_recipientIdTousers` → `recipient`

**Why this is confusing:**
```typescript
// Database table: badge_templates
// Foreign key field: templateId (camelCase)
// Natural assumption: relation should be badgeTemplate
// Actual Prisma API: template (removes redundant prefix)

// Wrong assumption
badge.badgeTemplate.name  // ❌ Property doesn't exist
badge.badgeTemplate.issuer.name  // ❌ Double wrong

// Correct usage
badge.template.name  // ✅ Correct
badge.issuer.name   // ✅ Direct relation
```

**2. Mock Testing Isolation Trap** (Related to Lesson 20)

```typescript
// Unit test with mock
const mockBadge = {
  id: 'badge-123',
  badgeTemplate: {  // ❌ Wrong structure, but mock accepts anything
    issuer: {
      id: 'issuer-456',
      name: 'Test University'  // ❌ User doesn't have 'name' field
    }
  }
};

mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

// Test passes ✅ because mock returns what we tell it
const result = await service.sendNotification('badge-123', 'user-789');
expect(result).toBeDefined();  // ✅ PASS
```

**The trap:**
- **Jest tests**: 182/182 passing ✅ (mocks return any structure)
- **TypeScript compilation**: FAILED ❌ (real Prisma types enforced)
- **Runtime**: Server crashes 💥 (actual database schema enforced)

**3. User Model Field Mismatch**

```prisma
model users {
  id            String
  email         String
  firstName     String?  // ✅ Exists
  lastName      String?  // ✅ Exists
  // NO 'name' field!
}
```

```typescript
// Wrong assumption (common in other ORMs)
const userName = user.name;  // ❌ Property doesn't exist

// Correct usage
const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;
```

#### Why Tests Didn't Catch This

**Mock testing isolation (documented in Lesson 20):**

```typescript
// Mocks can return ANY structure - TypeScript doesn't validate mock data
mockPrisma.badge.findUnique.mockResolvedValue({
  // This structure doesn't match real Prisma types, but TypeScript allows it
  badgeTemplate: { ... },  // Wrong property
  credential: { ... },     // Model doesn't exist
  name: 'Test User'        // Field doesn't exist on User
});
```

**What gets validated:**
- ✅ Mock setup syntax (method exists)
- ✅ Test assertions (expect statements)
- ✅ Business logic (function behavior with mocked data)

**What doesn't get validated:**
- ❌ Mock data structure matches real Prisma types
- ❌ Relation names are correct
- ❌ Field names exist on actual models
- ❌ TypeScript compilation of actual service code

**Root issue**: Unit tests with mocks validate logic, not type correctness.

#### Why We Can't Just Rename Schema

**Initial attempted fix:**
```prisma
model badges {
  template  badge_templates  @relation(...)
  issuer    users  @relation("badges_issuerIdTousers", ...)
  recipient users  @relation("badges_recipientIdTousers", ...)
  //  ↑ Explicit naming
}
```

**What happened after `npx prisma generate`:**

Prisma Client regeneration **broke 137 files** throughout the entire codebase!

**Why it failed:**
- Entire codebase uses camelCase model names: `prisma.user`, `prisma.badge`, `prisma.badgeTemplate`
- Prisma actually generates from table names: `prisma.users`, `prisma.badges`, `prisma.badge_templates`
- Schema was created with snake_case tables but code was written assuming camelCase
- Changing relation names in schema cascaded to all Prisma queries

**Scope of impact** (if we had proceeded):
```typescript
// All of these would break:
prisma.user → prisma.users               // 15+ files in auth module
prisma.badge → prisma.badges             // 20+ files in badge issuance
prisma.badgeTemplate → prisma.badge_templates  // 10+ files
prisma.skill → prisma.skills             // 12+ files
prisma.milestoneConfig → prisma.milestone_configs  // 8+ files
// ... and 72+ more files
```

**Decision**: Reverted schema change, used correct Prisma-generated names instead.

#### Solution Implemented

**Immediate Fix (Commit 9eb3be3):**

**1. Fixed Prisma queries to use correct relation names:**

```typescript
// Before (wrong)
const badge = await this.prisma.badge.findUnique({
  where: { id: badgeId },
  include: {
    badgeTemplate: {  // ❌ Wrong
      include: { issuer: true }
    }
  }
});

// After (correct)
const badge = await this.prisma.badge.findUnique({
  where: { id: badgeId },
  include: {
    template: true,  // ✅ Correct relation name
    issuer: true,    // ✅ Direct relation
  }
});
```

**2. Removed non-existent model queries:**

```typescript
// Before (wrong) - credential model doesn't exist
const credential = await this.prisma.credential.findFirst({
  where: { badgeId, userId }
});
const isRecipient = !!credential;

// After (correct) - use badge.recipientId field
const isRecipient = badge.recipientId === userId;
```

**3. Fixed User model field access:**

```typescript
// Before (wrong)
const userName = user.name;  // ❌ Property doesn't exist
const issuerName = badge.badgeTemplate.issuer.name;  // ❌ Nested wrong

// After (correct)
private getFullName(user: { firstName: string | null; lastName: string | null; email: string }): string {
  const parts = [];
  if (user.firstName) parts.push(user.firstName);
  if (user.lastName) parts.push(user.lastName);
  return parts.length > 0 ? parts.join(' ') : user.email;
}

const userName = this.getFullName(user);
const issuerName = this.getFullName(badge.issuer);  // ✅ Direct relation
```

**4. Fixed null safety:**

```typescript
// Handle nullable fields from schema
badgeImageUrl: badge.template.imageUrl || 'https://default-badge-image.png',
badgeDescription: badge.template.description || '',
```

**5. Updated all test mocks to match real schema:**

```typescript
// Before (wrong mock structure)
const mockBadge = {
  badgeTemplate: {
    issuer: { name: 'Test' }
  }
};

// After (correct mock structure)
const mockBadge = {
  status: 'PENDING',
  issuerId: 'issuer-456',
  recipientId: 'user-123',
  template: {
    name: 'Test Badge',
    description: 'Test description',
    imageUrl: 'https://test.png'
  },
  issuer: {
    id: 'issuer-456',
    firstName: 'Test',
    lastName: 'University',
    email: 'test@university.edu'
  }
};
```

**Files Fixed:**
- `teams-sharing.controller.ts` - 4 replacements
- `teams-badge-notification.service.ts` - 3 replacements + helper method
- `teams-sharing.controller.spec.ts` - Updated mock structure
- `teams-badge-notification.service.spec.ts` - Updated mock structure

**Changes:**
- 4 files modified
- 128 lines deleted (incorrect queries and mocks)
- 75 lines added (correct schema access)
- All tests still passing: 182/182 ✅
- TypeScript compilation: SUCCESS ✅
- Server startup: No errors ✅

#### Long-term Solution

**Development Workflow Improvements:**

**1. Always check Prisma-generated types before writing queries:**

```bash
# View generated types
code node_modules/.prisma/client/index.d.ts

# Or use Prisma Studio
npx prisma studio  # Visual schema browser
```

**2. Use VSCode autocomplete for Prisma queries:**
- Type `prisma.` → See all available models
- Type `prisma.badge.findUnique({ include: { ` → See all available relations
- Autocomplete shows correct field names

**3. Compile TypeScript frequently during development:**

```bash
# Before committing
npm run build  # Catches type errors
npm test       # Validates logic
npm run start:dev  # Validates runtime
```

**4. Type-safe mocks (future improvement):**

```typescript
// Instead of generic mocks, use Prisma-generated types
import { Prisma } from '@prisma/client';

type BadgeWithRelations = Prisma.badgesGetPayload<{
  include: { template: true; issuer: true }
}>;

const mockBadge: BadgeWithRelations = {
  // TypeScript validates structure matches real Prisma type
  id: 'badge-123',
  template: { ... },  // ✅ Correct property enforced
  issuer: { ... },    // ✅ Correct property enforced
  // badgeTemplate: { ... }  // ❌ TypeScript error!
};
```

**Schema Naming Convention Decision:**

**Option A: Keep snake_case (✅ CHOSEN)**
- Pros: No breaking changes, follows PostgreSQL conventions
- Cons: Code uses different naming than database visually
- Action: Document relation names in schema comments

**Option B: Migrate to camelCase**
- Requires: Database migration + Prisma schema update + 137 file updates
- Risk: HIGH - potential data loss or service disruption
- Timeline: Requires dedicated sprint
- Decision: **NOT worth it** for this project size

#### Prevention Checklist

**Before writing Prisma queries:**
- [ ] Check generated types in `node_modules/.prisma/client/index.d.ts`
- [ ] Use VSCode autocomplete to see available relations
- [ ] Reference recent working code (e.g., `badge-issuance.service.ts`)
- [ ] Document non-obvious relation names in code comments

**Before committing code:**
- [ ] Run `npm run build` (catches TypeScript errors)
- [ ] Run `npm test` (validates logic)
- [ ] Run `npm run start:dev` (validates runtime)
- [ ] Check server logs for errors

**When creating mocks:**
- [ ] Reference real Prisma types (copy from working service)
- [ ] Match field names exactly (template not badgeTemplate)
- [ ] Include all required fields (id, timestamps, etc.)
- [ ] Consider using Prisma-generated Payload types for type safety

**When updating schema:**
- [ ] Run `npx prisma generate` immediately
- [ ] Run `npm run build` to check for breaking changes
- [ ] Search codebase for affected relation names
- [ ] Update mocks to match new structure

#### Metrics Impact

| Metric | Value |
|--------|-------|
| **Bug Discovery** | TypeScript compilation (not tests) |
| **Tests Passing** | 182/182 (100%) - gave false confidence |
| **TypeScript Errors** | 5 errors in 2 files |
| **Debugging Time** | 30+ minutes |
| **Files Fixed** | 4 files |
| **Lines Changed** | -128 / +75 (net -53) |
| **Prevention Time** | 5 min `npm run build` before commit |
| **ROI** | 30 min debugging / 5 min prevention = 6x return |

#### Key Takeaways

> **1. Prisma's naming is auto-generated and non-obvious.** Always verify relation names in generated types rather than assuming based on table/field names.

> **2. Mock tests provide false confidence when not paired with type checking.** 100% unit test coverage ≠ type-safe code.

> **3. TypeScript compilation is not optional.** It's a critical validation step that catches what tests miss.

> **4. When in doubt, copy from working code.** Recent similar code has correct patterns.

> **5. Schema migrations have massive ripple effects.** Don't rename unless absolutely necessary.

#### ⚠️ 重大更新：真正的根本原因发现 (2026-01-30)

**经过深入调查，发现137个TypeScript编译错误的真正原因：**

| 项目 | 详情 |
|------|------|
| **问题提交** | `d1431dd` (2026-01-29 23:18) |
| **提交消息** | "style(prisma): Apply Prisma format to schema" |
| **错误操作** | 将 PascalCase 模型名改为 snake_case |
| **影响范围** | 137+ TypeScript 编译错误 |

**这个提交做了什么：**
```prisma
// 原始设计（正确）
model User {
  id String @id @default(uuid())
  ...
  @@map("users")  // 表名映射
}

// 被格式化后（错误）
model users {
  id String @id @default(uuid())
  ...
  // @@map() 被移除
}
```

**为什么原始设计是正确的：**
- `model User` + `@@map("users")` 是 Prisma 官方推荐的最佳实践
- API 使用 `prisma.user` (单数、PascalCase) 符合 JS/TS 惯例
- 数据库表名 `users` (复数、snake_case) 符合 PostgreSQL 惯例
- TypeScript 类型导出为 `User` 而非 `users`

**最终解决方案：**
- **Commit `28114df`**: 回退 schema 到正确版本
- **操作**: `git checkout d1431dd^ -- prisma/schema.prisma`
- **结果**: 零代码更改，137个错误全部消失
- **验证**: 181/181 测试通过，服务器正常启动

---

### 🚨 强制性开发规范 (MANDATORY)

> **以下规范必须严格遵守，违反可能导致整个代码库损坏！**

#### 规范 1: 禁止格式化 Prisma Schema

```bash
# ❌ 禁止运行
npx prisma format          # 会破坏 @@map() 设计
prettier schema.prisma     # 会重新格式化模型名

# ✅ 允许的操作
npx prisma generate        # 重新生成 Prisma Client
npx prisma db push         # 同步数据库（开发环境）
npx prisma migrate dev     # 创建迁移
```

#### 规范 2: Schema 修改必须遵循三步验证

```bash
# 任何 schema.prisma 修改后必须执行：
npx prisma generate        # 步骤 1: 重新生成 Client
npm run build              # 步骤 2: TypeScript 编译检查
npm test                   # 步骤 3: 运行所有测试

# 如果步骤 2 出现大量错误（>10个），立即回退！
git checkout HEAD -- prisma/schema.prisma
```

#### 规范 3: 保护 Schema 命名约定

**当前项目使用的正确模式：**
```prisma
model User {           // ✅ PascalCase 模型名 → prisma.user
  id String @id
  ...
  @@map("users")       // ✅ snake_case 表名
}

model BadgeTemplate {  // ✅ PascalCase 模型名 → prisma.badgeTemplate
  id String @id
  ...
  @@map("badge_templates")  // ✅ snake_case 表名
}
```

**绝对禁止的模式：**
```prisma
model users {          // ❌ snake_case 模型名
  id String @id
  ...
}

model badge_templates { // ❌ snake_case 模型名
  id String @id
  ...
}
```

#### 规范 4: 提交前必检清单

**修改 `prisma/schema.prisma` 时：**
- [ ] **确认没有运行 `prisma format`**
- [ ] 检查所有 `model` 名称仍为 PascalCase
- [ ] 检查所有 `@@map()` 属性仍然存在
- [ ] 运行 `npx prisma generate` 成功
- [ ] 运行 `npm run build` 无错误
- [ ] 运行 `npm test` 全部通过

#### 规范 5: 紧急回退程序

**如果 TypeScript 编译出现 >50 个错误且与 Prisma 相关：**

```bash
# 1. 立即停止当前工作
# 2. 检查 schema.prisma 最近的更改
git log -3 --oneline -- prisma/schema.prisma

# 3. 对比差异
git diff HEAD~1 -- prisma/schema.prisma

# 4. 如果发现模型名被改为 snake_case，立即回退
git checkout HEAD~1 -- prisma/schema.prisma
npx prisma generate
npm run build

# 5. 验证错误消失后，提交回退
git add prisma/schema.prisma
git commit -m "fix(prisma): Revert schema format changes"
```

---

#### Related Lessons

- **Lesson 20**: Unit Tests Can't Catch All Integration Issues (similar mock isolation problem)
- **Lesson 1**: Version Discrepancy (planning vs reality gap)
- **Lesson 8**: E2E Test Stability (test environment vs production differences)

#### References

- [Prisma Naming Conventions](https://www.prisma.io/docs/concepts/components/prisma-schema/names-in-underlying-database)
- [Prisma Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [TypeScript Type Safety with Prisma](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety)
- **Commit History**: `d1431dd` (破坏性格式化) → `28114df` (回退修复)

**Commits:**
- `9eb3be3`: Fixed Prisma schema mismatches in Teams notification services
- `24114b1`: Documented Lesson 22

**Future Enhancements:**
- [ ] Add Prisma type reference guide to documentation
- [ ] Create type-safe mock utilities using Prisma Payload types
- [ ] Add pre-commit hook: `npm run build` before allowing commits
- [ ] Document common Prisma gotchas in architecture guide

---

## Cross-Sprint Patterns

### Pattern 1: Flat Feature Modules Work Well

**Observation:**
Sprint 2 introduced 3 flat feature modules (`badge-templates/`, `skill-categories/`, `skills/`) outside of `modules/` directory.

**Why This Works:**
- ✅ Easy to discover (top-level in `src/`)
- ✅ Clear ownership (one feature per folder)
- ✅ No deep nesting confusion
- ✅ Simple imports (`../common/prisma.service`)

**When to Use Flat Structure:**
- Standard CRUD operations
- Feature has <5 service files
- No need for sub-modules
- Independent business domain

**When to Use `modules/` Structure:**
- Complex patterns (CQRS, Event Sourcing)
- Needs Passport strategies
- Has multiple sub-modules
- Shared across features

**Decision Rule:**
> Start flat, move to `modules/` only when complexity demands it.

---

### Pattern 2: Copy Working Code > Reading Docs

**Observation:**
Dev velocity highest when copying imports/patterns from recently completed stories.

**Best Practice:**
1. **Starting new feature?** → Open similar completed feature
2. **Unsure about import?** → Check 2-3 recent files
3. **Need boilerplate?** → Copy controller/service template
4. **Docs conflict with code?** → Trust code, fix docs

**Reference Hierarchy (most reliable to least):**
1. 🥇 **Recently committed code** (Story 3.1-3.3)
2. 🥈 **`IMPORT-PATHS.md`** (maintained cheatsheet)
3. 🥉 **`backend-code-structure-guide.md`** (architecture explanation)
4. 🏅 **Sprint Backlog** (may lag behind reality)
5. ⚠️ **`project-context.md`** (high-level only)

---

### Pattern 3: Directory Structure Evolution

**Sprint 0 Decision: `src/common/` for Shared Services**

**What was decided:**
Place PrismaService and StorageService in `src/common/` (not `src/prisma/` or `src/storage/`)

**Rationale:**
- `common/` is more flexible for future shared utilities (guards, interceptors, decorators)
- Avoids creating single-purpose directories for each utility service
- Aligns with NestJS community best practices for modular monoliths
- Easier to discover (all shared infrastructure in one place)

**Current Common Services (Sprint 2):**
- `prisma.module.ts`, `prisma.service.ts` - Database ORM
- `storage.module.ts`, `storage.service.ts` - Azure Blob Storage
- `jwt-auth.guard.ts` - JWT authentication
- `roles.decorator.ts`, `roles.guard.ts` - RBAC
- Future: `email.service.ts`, `validation.service.ts`, etc.

**Trade-offs:**
- ✅ Pro: Scalable structure, easy to add shared services
- ✅ Pro: Clear separation: common/ vs modules/ vs flat features
- ❌ Con: Slightly less explicit than service-specific directories

**Key Takeaway:**
> Use `common/` for cross-cutting infrastructure shared by multiple features. Avoid single-purpose utility directories.

---

### Pattern 4: Azure Resource Naming Convention

**Established in Sprint 0:**

**Naming Pattern:**
`{product}-{environment}-{resource-type}-{location-code}`

**Examples:**
- `gcredit-dev-db-lz` - Database (Landing Zone region)
- `gcreditdevstoragelz` - Storage (no hyphens, Azure limitation)
- `gcredit-prod-db-sea` - Production database (Southeast Asia)

**Environment Codes:**
- `dev` - Development
- `staging` - Staging/UAT
- `prod` - Production

**Location Codes:**
- `lz` - Landing Zone (default region)
- `sea` - Southeast Asia
- `use` - US East
- `euw` - Europe West

**Benefits:**
- Instantly identify resource purpose
- Prevents accidental production changes
- Easy to script deployment
- Consistent across all Azure services

**Key Takeaway:**
> Establish naming conventions in Sprint 0. Consistency prevents mistakes and enables automation.

---

### Pattern 5: Environment Variable Management

**Established across Sprint 0-2:**

**File Structure:**
```
backend/
  .env                # Local development (gitignored)
  .env.example        # Template (committed to Git)
  .env.test           # Test environment (gitignored)
  .env.production     # Production secrets (Azure Key Vault)
```

**Best Practices:**
1. ✅ **Never commit secrets** - All `.env` files in `.gitignore`
2. ✅ **Maintain .env.example** - Update when adding new variables
3. ✅ **Document variable purpose** - Comments in .env.example
4. ✅ **Validate on startup** - ConfigModule validates required variables
5. ✅ **Use Azure Key Vault for production** - Not plain text .env

**Variable Naming Convention:**
```bash
# Database
DATABASE_URL="postgresql://..."

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME="..."
AZURE_STORAGE_ACCOUNT_KEY="..."

# JWT
JWT_SECRET="..."
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="..."
JWT_REFRESH_EXPIRES_IN="7d"

# Email (future)
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
```

**Security Checklist:**
- [ ] All secrets in .env (not hardcoded)
- [ ] .env in .gitignore
- [ ] .env.example up to date
- [ ] Production uses Azure Key Vault
- [ ] No secrets in Git history

**Key Takeaway:**
> Environment variables are configuration, not code. Maintain .env.example template and validate on startup.

---

### Pattern 6: Git Commit Message Standards

**Established in Sprint 0-2:**

**Format:**
```
Story X.Y: Brief description

- Detailed change 1
- Detailed change 2
- Detailed change 3
```

**Examples from Project:**
```
Story 1.1: Frontend initialization

- Initialize React 18.3.1 with Vite 7.2.4
- Configure Tailwind CSS 4.1.18
- Set up TypeScript 5.9.3
```

```
Story 2.3: JWT login

- Implement JWT authentication with Passport
- Add access token (15min) + refresh token (7d)
- Update lastLoginAt on successful login
```

**Best Practices:**
- ✅ Reference story number for traceability
- ✅ Brief description in subject (50 chars max)
- ✅ Bullet points for multiple changes
- ✅ Meaningful message (not "fix bug" or "update")
- ✅ Present tense ("Add feature" not "Added feature")

**Benefits:**
- Easy to find story-related commits
- Clear audit trail
- Meaningful `git log` output
- Helps with rollbacks/debugging

**Key Takeaway:**
> Commit messages are documentation. Write them for future readers (including future you).

---

### Pattern 7: Technical Debt Management Strategy

**Established in Sprint 0-2:**

**Debt Categories:**

**1. Accepted Debt (Documented & Scheduled)**
- lodash security vulnerability (Sprint 0) → Defer to Sprint 7
- Azure AD SSO (Sprint 1) → Defer to Sprint 8+
- npm security warnings (Sprint 2) → Batch fix in Sprint 7

**2. Prevented Debt (Good Practices)**
- 100% test coverage (Sprint 1: 40/40 tests)
- TypeScript strict mode (catch type errors early)
- ESLint configured (code quality)
- Meaningful commit messages (traceability)

**Decision Framework:**

**Fix Immediately If:**
- ❌ Critical security vulnerability (CVSS 9+)
- ❌ Blocks current story
- ❌ Affects production users
- ❌ Data corruption risk

**Document & Defer If:**
- ✅ Moderate security (CVSS 4-7)
- ✅ Dev environment only
- ✅ No current user impact
- ✅ Can batch with similar fixes
- ✅ Requires breaking changes

**Documentation Template:**
```markdown
## Known Issue: [Issue Name]

**Severity:** High/Medium/Low
**Discovered:** Sprint X, Story Y
**Impact:** [Who/what is affected]
**Risk Assessment:** [Why it's acceptable to defer]
**Planned Resolution:** Sprint Z
**Workaround:** [If applicable]
```

**Benefits:**
- ✅ Transparent decision-making
- ✅ Nothing gets forgotten
- ✅ Prevents "yak shaving" (fixing unrelated issues)
- ✅ Allows focused sprints

**Key Takeaway:**
> Not all issues require immediate fixes. Document, assess risk, schedule properly. Preserve sprint focus.

---

### Pattern 8: Progressive Enhancement Strategy

**Observed across Sprint 0-2:**

**Sprint 0: Foundation**
- Database, Storage, Basic health checks
- No features, just infrastructure

**Sprint 1: Core Features**
- Authentication, RBAC, User management
- Real features, but single tenant

**Sprint 2: Feature Expansion**
- Badge Templates, Skills, Categories
- Building on Sprint 1's auth patterns

**Sprint 3+ (Planned): Polish**
- Frontend integration
- Advanced features (webhooks, notifications)
- Multi-tenant, Performance optimization

**Key Principle:**
> Build stable foundation → Add core features → Expand functionality → Optimize & polish

**Anti-Pattern to Avoid:**
❌ Trying to build everything at once
❌ Premature optimization (Redis before users exist)
❌ Perfect UI before backend works
❌ Multi-tenant before single-tenant works

**Success Pattern:**
✅ Each sprint builds on previous
✅ Working software every sprint
✅ Can stop at any point (MVP at each sprint)
✅ Natural dependency order (infra → auth → features → polish)

**Key Takeaway:**
> Progressive enhancement: Foundation → Core → Expand → Polish. Each sprint delivers working software.

---

### Pattern 9: "Code is Truth" Hierarchy

**Established in Sprint 2 (Path Error Discovery):**

**When docs conflict with code, trust:**

**1. Running Code (Highest Authority)**
- Actual directory structure
- Working import statements
- Committed code in Git

**2. Recently Updated Documentation**
- `IMPORT-PATHS.md` (copy-paste ready)
- Story-specific guides
- Sprint backlog (if verified recently)

**3. High-Level Documentation (Context Only)**
- `project-context.md`
- Architecture documents
- Planning documents

**Resolution Process:**
1. Discovery: Find conflict between docs and code
2. Verification: Check actual codebase (trust code)
3. Fix: Update documentation immediately
4. Prevent: Add verification to sprint planning

**Real Example (Sprint 2):**
```
Documentation said: ../modules/prisma/prisma.service
Code had:          ../common/prisma.service

Action taken:
1. Verified code (trust ../common/)
2. Fixed 6 references in sprint-2-backlog.md
3. Updated project-context.md
4. Created IMPORT-PATHS.md
5. Established verification process
```

**Key Takeaway:**
> Code is the ultimate source of truth. When documentation conflicts, trust code and fix documentation immediately.

---

### Pattern 10: PowerShell as API Testing Framework

**Established in Sprint 1-2:**

**Why PowerShell for Testing:**
- ✅ Native Windows integration (no additional tools)
- ✅ Easy to read and maintain (clear syntax)
- ✅ Supports JSON manipulation natively
- ✅ Can generate detailed reports
- ✅ CI/CD compatible (exit codes)
- ✅ Timestamp-based unique test data

**Test Script Structure:**
```powershell
# 1. Configuration
$baseUrl = "http://localhost:3000"
$testResults = @()

# 2. Generate unique test data
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "admin-$timestamp@gcredit.test"

# 3. Execute tests
$response = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
  -Method POST -Body $body -ContentType "application/json"

# 4. Collect results
$testResults += [PSCustomObject]@{
  Test = "Admin Registration"
  Status = if ($response.role -eq "ADMIN") { "✅ PASS" } else { "❌ FAIL" }
}

# 5. Generate report
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
$testResults | Format-Table -AutoSize
```

**Benefits Observed:**
- Sprint 1: 40/40 tests passed (100%)
- Sprint 2: Comprehensive testing without Postman
- Zero manual testing required
- Scripts serve as API usage documentation
- Easy to run before commits

**Key Takeaway:**
> PowerShell is excellent for API testing. Native JSON support, easy reporting, and Windows integration make it ideal for E2E tests.

---

### Pattern 11: Monorepo Structure Benefits

**Established in Sprint 0:**

**Structure:**
```
gcredit-project/
├── frontend/         # React + Vite
├── backend/          # NestJS
├── docs/            # Shared documentation
├── .git/            # Single Git repository
└── package.json     # Optional root scripts
```

**Benefits Experienced:**

**1. Atomic Commits**
- Frontend + Backend changes in single commit
- No "forgot to update API" issues
- Clear history of related changes

**2. Simplified Dependency Management**
- One node_modules for shared tools
- Consistent versions (TypeScript, ESLint)
- Single `npm install` command

**3. Unified Documentation**
- Single source of truth
- Cross-reference frontend/backend docs easily
- No sync issues between repos

**4. Easier CI/CD**
- Single pipeline
- Test frontend + backend together
- Deploy both from same commit

**Trade-offs:**
- ✅ Pro: Simplified development workflow
- ✅ Pro: Atomic cross-stack changes
- ❌ Con: Larger repository size (manageable for our scale)
- ❌ Con: Need clear frontend/backend separation

**Key Takeaway:**
> Monorepo works well for full-stack projects. Atomic commits and simplified workflow outweigh the larger repository size.

---

### Pattern 12: Sprint Velocity Tracking

**Observed across Sprint 0-2:**

**Sprint 0:**
- Estimated: 10 hours
- Actual: 9.5 hours
- Accuracy: 95% (5% under)
- Velocity: ~1h/story

**Sprint 1:**
- Estimated: 21 hours
- Actual: 21 hours
- Accuracy: 100% (perfect!)
- Velocity: ~3h/story

**Sprint 2 (4/6 stories):**
- Estimated: 21-22 hours total
- Actual: ~3 hours (67% complete)
- Velocity: ~45min/story (with AI assistance)
- Acceleration: 7-8x faster than traditional

**Velocity Evolution:**
```
Sprint 0: 1h/story  (infrastructure setup)
Sprint 1: 3h/story  (new patterns, authentication)
Sprint 2: 0.75h/story (copy existing patterns, simple CRUD)
```

**Factors Affecting Velocity:**

**Increases Velocity:**
- ✅ Copying existing patterns
- ✅ Simple CRUD operations
- ✅ Clear acceptance criteria
- ✅ AI assistance for boilerplate
- ✅ Good documentation

**Decreases Velocity:**
- ❌ Novel technology/pattern
- ❌ Unclear requirements
- ❌ Integration challenges
- ❌ Poor documentation
- ❌ Complex business logic

**Key Takeaway:**
> Track velocity per story, not per sprint. Adjust estimates based on novelty vs familiarity with patterns.

---

### Pattern 13: UX Spec → Code Translation Requires Explicit Stories (Sprint 10)

**Observation:**
A 3,321-line UX Design Specification existed from Sprint 0. It defined fonts, colors, typography scales, design tokens, and a phased implementation plan. After 10 sprints, none of it was implemented — `tailwind.config.js` was empty, fonts were never loaded, no design tokens existed.

**Root Cause:**
Everyone assumed "the spec exists, so someone will implement it." But specs don't auto-translate into code. Without explicit stories, the gap grows silently — each sprint builds more components on bare defaults, increasing remediation cost exponentially.

**The Pattern:**
```
Spec Written (Sprint 0) → Assumption: "It'll get done" → 10 sprints pass
→ Nobody notices (audits review components, not infrastructure)
→ Discovery at UAT stage → 20h remediation (10x original cost)
```

**Prevention Pattern:**
| Spec Section | Must Generate | Verification |
|-------------|---------------|---------------|
| Fonts / Typography | Sprint 0 story: "Load fonts + configure Tailwind typography" | `index.html` has `<link>`, `tailwind.config.js` has `fontFamily` |
| Color System | Sprint 0 story: "Configure Tailwind theme colors" | `tailwind.config.js` has `colors` populated |
| Design Tokens | Sprint 0 story: "Create design token file" | `tokens.ts` or CSS variables customized |
| Page Layout | Sprint 0 story: "Create PageTemplate component" | `PageTemplate.tsx` exists and is used by all pages |
| Component Library | Sprint 1 story: "Customize shadcn theme" | `components.json` + CSS variables match brand |

**Broader Principle:**
> Every "Phase" or "Implementation Plan" section in a spec document must map 1:1 to backlog stories. If it's not a story, it won't get done. SM should cross-check spec phases against backlog during Sprint Planning.

**Key Takeaway:**
> Installation ≠ Configuration. Spec ≠ Implementation. Code Review ≠ Visual Review. Each transition requires an explicit story and verification step.

---

## Development Checklists

### ✅ Before Starting ANY Story

```markdown
[ ] Read the story acceptance criteria
[ ] Check if similar story was completed recently
[ ] Open `IMPORT-PATHS.md` in separate tab
[ ] Review reference code (copy imports from there)
[ ] Confirm Azure/DB resources exist (check infrastructure-inventory.md)
[ ] Understand business logic BEFORE writing code
```

### ✅ Before Starting Sprint (PM Checklist)

```markdown
[ ] Run path verification on backlog (see sprint-2-backlog-path-verification.md)
[ ] Verify all code examples use correct file paths
[ ] Check if new Azure resources needed (reference Sprint 0)
[ ] Confirm all stories have clear acceptance criteria
[ ] Review lessons learned from previous sprint
[ ] Update project-context.md if structure changed
[ ] Cross-check: Do spec "Implementation Phases" have corresponding backlog stories?
[ ] Cross-check: Were previous UX audit recommendations converted to stories?
```

### ✅ Before Committing Code

```markdown
[ ] Run tests: backend `npx jest --forceExit` + frontend `npx vitest run`
[ ] TypeScript check: `npx tsc --noEmit` (both backend and frontend)
[ ] ESLint full scope: `npx eslint src/` (NOT selective files — catches new file issues)
[ ] Prettier check: `npx prettier --check "src/**/*.ts"` (especially for new/hand-written files)
[ ] Verify imports use correct paths (no red squiggles in IDE)
[ ] Update IMPORT-PATHS.md if new pattern introduced
[ ] Check if documentation needs update
[ ] Write meaningful commit message
```

> ⚠️ **Lesson 35 (Sprint 9 + Sprint 11):** Never lint only selected files. New files are the most likely to fail formatting. Always lint the full `src/` directory.

### ✅ Sprint Retrospective (Must-Do Items)

```markdown
[ ] Update lessons-learned.md with new insights
[ ] Check: Did actual directory structure change?
[ ] Update project-context.md if needed
[ ] Review time estimates vs actual (adjust future estimates)
[ ] Identify any "yak shaving" moments (prevent next time)
[ ] Document any new patterns or decisions
[ ] Visual spot-check: Start the app, verify 2-3 pages match UX spec (every 2-3 sprints)
```

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: "Just One More Thing" Syndrome

**Symptom:** Story scope expands during implementation

**Example:**
"While implementing Badge API, let's also add audit logging, email notifications, and webhooks..."

**Prevention:**
- Strict adherence to acceptance criteria
- New ideas → backlog for future sprint
- Ask: "Is this required for story to be done?"

**When it's OK to expand:**
- Blocking bug discovered
- Security vulnerability (critical)
- Dependency absolutely required

---

### ❌ Pitfall 2: Premature Optimization

**Symptom:** Spending hours on performance before testing load

**Example:**
"Let me add Redis caching, database query optimization, and CDN before any users exist..."

**Prevention:**
- Build feature first, optimize later
- Measure before optimizing
- Follow acceptance criteria (e.g., "response time <200ms" triggers optimization)

**When optimization is needed:**
- Acceptance criteria specify performance
- Load testing reveals actual issues
- Production metrics show problems

---

### ❌ Pitfall 3: Documentation-Driven Development (Backward)

**Symptom:** Writing docs before validating with code

**Example:**
Creating detailed architecture docs that don't match implementation reality.

**Better Approach:**
1. Build working code
2. Document what actually works
3. Keep docs synchronized

**Rule of Thumb:**
> Code first, document second. Or better: "Document as you code" using inline comments and README updates.

---

### ❌ Pitfall 4: Not Checking Existing Infrastructure

**Symptom:** Creating duplicate Azure resources or services

**Example:**
Story 3.2 almost created new Azure Storage account (Sprint 0 already had one).

**Prevention:**
- Always check `docs/infrastructure-inventory.md` first
- Search codebase: "Is this service already implemented?"
- Ask in backlog: "Sprint 0 already did this?"

**Golden Rule:**
> Before creating ANY infrastructure: Check inventory, check code, check commits. Don't duplicate.

---

## Best Practices Summary

### 🎯 The "G-Credit Way" (Established Patterns)

1. **Module Organization**
   - Shared infrastructure → `src/common/`
   - Complex domains → `src/modules/`
   - Simple features → Flat (e.g., `src/badge-templates/`)

2. **Import Patterns**
   - Prisma: `'../common/prisma.service'`
   - Guards: `'../common/guards/jwt-auth.guard'`
   - Never cross-import features

3. **Documentation Hierarchy**
   - Trust code > `IMPORT-PATHS.md` > guides > backlog > project-context

4. **Time Estimation** (with AI assistance)
   - Simple CRUD: 30-60min (not 4-6h)
   - Medium complexity: 1-2h (not 6-8h)
   - Complex: 3-5h (not 8-12h)
   - Novel/Research: 4-8h (not 12-16h)

5. **Security Handling**
   - Document immediately
   - Assess risk quickly
   - Defer non-critical to maintenance sprint
   - Never skip documentation

6. **Sprint Execution**
   - One story at a time
   - Reference completed code
   - Update docs as you go
   - Test everything before committing

7. **Design System & Visual Quality** ⭐ (Added Sprint 10)
   - Sprint 0 must include "Design System Foundation" story (fonts, theme, tokens, PageTemplate)
   - UX audit scope includes infrastructure files (`tailwind.config.js`, `index.html`), not just components
   - Visual UI review (running app + screenshots) every 2-3 sprints
   - Audit recommendations → stories pipeline (triage at Sprint Planning, never silently ignore)
   - "Present" ≠ "Configured" — verify values match brand spec, not just that variables exist

8. **Quality Gates from Day 1** ⭐ (Added Sprint 10)
   - `tsc --noEmit` in CI from Sprint 0 (Lesson 35: 114 type errors accumulated over 8 sprints)
   - `eslint --max-warnings=0` from Sprint 0 (Lesson 37-38: 204 warnings accumulated)
   - Visual regression baseline from Sprint 1
   - Every spec "Phase" must have a corresponding story (Lesson 39: 20h remediation)

---

## Metrics to Track

### Velocity Metrics
- [ ] Estimated hours vs actual hours per story
- [ ] Stories completed per sprint
- [ ] Average time from story start to commit

### Quality Metrics
- [ ] Test pass rate (target: 100%)
- [ ] Build errors before commit (target: 0)
- [ ] Documentation sync rate (docs match code?)

### Efficiency Metrics
- [ ] Time spent debugging import paths (target: 0)
- [ ] Time spent on "yak shaving" (target: <5%)
- [ ] Rework/refactor after story complete (target: <10%)

---

## Future Sprint Checklist

Copy this to each new Sprint Retrospective:

```markdown
## Lessons Learned Review

1. What worked well this sprint that we should keep doing?
   - 

2. What didn't work that we should stop doing?
   - 

3. What new practice should we try next sprint?
   - 

4. Did any documentation fall out of sync with code?
   - [ ] Yes → Update now: _____
   - [ ] No → Great!

5. Were time estimates accurate?
   - [ ] Yes → Keep current estimation method
   - [ ] No → Adjust by: _____

6. Any new patterns or decisions to document?
   - [ ] Yes → Add to lessons-learned.md: _____
   - [ ] No

7. Update project-context.md needed?
   - [ ] Yes → What changed: _____
   - [ ] No

8. Any security issues discovered?
   - [ ] Yes → Documented in security-notes.md
   - [ ] No

9. Spec-to-Implementation gap check:
   - [ ] Are all UX/architecture spec "Implementation Phases" covered by backlog stories?
   - [ ] Were previous audit recommendations converted to stories or explicitly deferred?

10. Visual verification (every 2-3 sprints):
    - [ ] Start frontend + backend
    - [ ] Spot-check 3+ pages against UX spec
    - [ ] Screenshot comparison if baseline exists
    - [ ] Note any visual regressions
```

---

## Quick Reference: When Things Go Wrong

### "I can't find the right import path"
→ Check `IMPORT-PATHS.md` → Copy from recent similar code → Ask in chat

### "Documentation conflicts with code"
→ Trust code → Fix documentation immediately → Notify team

### "Story taking longer than estimated"
→ Check scope creep → Re-estimate → Communicate to PM

### "Security warning appeared"
→ Document in security-notes.md → Quick risk assessment → Defer if low risk

### "Not sure if resource exists"
→ Check infrastructure-inventory.md → Search codebase → Check Git history

### "Should I optimize now?"
→ Check acceptance criteria → Measure first → Optimize only if needed

---

## Contributing to This Document

**When to update:**
- After each Sprint Retrospective (required)
- When discovering new pattern or pitfall
- When documentation process improves
- When team grows (new member insights)

**How to update:**
1. Add new lessons under appropriate sprint section
2. Update checklists if new steps needed
3. Add to "Common Pitfalls" if new anti-pattern found
4. Keep "Best Practices Summary" current
5. Update metrics if tracking changes

**Review cycle:**
- Sprint Retrospective: Add new lessons
- Every 3 sprints: Review and consolidate
- Before new team member joins: Update onboarding sections

---

## Sprint 6 Lessons (January 2026)

**Context:** Epic 7 - Badge Sharing & Social Proof  
**Stories:** 5/5 completed (Microsoft Graph, Email Sharing, Widget, Teams, Analytics)  
**Key Achievement:** 190/190 core tests passing, 35 hours vs 56-76 estimated

---

### Lesson 23: Microsoft Graph API Integration Best Practices

**Date:** 2026-01-31  
**Context:** Integrating Microsoft Graph for email and Teams notifications  
**Story:** 7.1, 7.2, 7.4

**Problem:**
Microsoft Graph API requires complex OAuth 2.0 setup with multiple moving parts:
- Azure AD app registration
- Multiple permission types (Mail.Send, TeamsActivity.Send, ChannelMessage.Send)
- Tenant admin approval required
- Token lifecycle management
- Error handling for unavailable services

**What Went Wrong:**
1. Teams functionality couldn't be fully tested due to missing permissions
2. ChannelMessage.Send requires tenant admin approval
3. Complex permission matrix difficult to understand
4. Token caching not obvious from docs

**Solution:**
```typescript
// ✅ Pattern: OAuth 2.0 Client Credentials with graceful degradation

@Injectable()
export class GraphTokenProviderService {
  private isEnabled: boolean;
  
  constructor(private config: ConfigService) {
    this.isEnabled = 
      !!this.config.get('AZURE_CLIENT_ID') &&
      !!this.config.get('AZURE_CLIENT_SECRET');
  }
  
  // Always check if enabled before calling
  getAuthProvider() {
    if (!this.isEnabled) {
      throw new Error('Graph API not configured');
    }
    return new ClientSecretCredential(...);
  }
}

// All consuming services check availability
@Injectable()
export class GraphEmailService {
  isGraphEmailEnabled(): boolean {
    return this.isEnabled && this.tokenProvider.isEnabled;
  }
  
  async sendEmail(...) {
    if (!this.isGraphEmailEnabled()) {
      this.logger.warn('Graph Email disabled');
      return; // Graceful degradation
    }
    // ... actual send
  }
}
```

**Best Practices:**
1. **Feature flags for external services**
   - `ENABLE_GRAPH_EMAIL=true/false`
   - `ENABLE_TEAMS_NOTIFICATIONS=true/false`
   - Allow disabling without code changes

2. **Graceful degradation**
   - Check `isEnabled` before every API call
   - Log warnings, don't throw errors
   - Provide fallback functionality (e.g., email instead of Teams)

3. **Comprehensive error logging**
   - Log OAuth errors with tenant ID
   - Include permission names in error messages
   - Reference Azure Portal URLs in logs

4. **Token caching**
   - Use built-in `ClientSecretCredential` caching
   - Don't implement custom token management
   - Trust the SDK

5. **Setup documentation**
   - Create step-by-step guide with screenshots
   - List ALL required permissions upfront
   - Document tenant admin approval process
   - Include troubleshooting section

**Documentation Created:**
- `docs/setup/azure-ad-app-setup.md` - Setup guide
- `docs/setup/external-services-setup-guide.md` - Comprehensive configuration
- `docs/decisions/ADR-008-microsoft-graph-integration.md` - Architecture decision

**Impact:**
- ✅ Email notifications working reliably
- ⏸️ Teams notifications deferred (technical debt)
- ✅ Clear path to enable Teams when permissions available
- ✅ New developers can set up in <2 hours with guide

**When to Apply:**
- Any OAuth 2.0 integration (Google, Microsoft, Slack, etc.)
- Services requiring admin approval
- Features that may not be available in all environments

---

### Lesson 24: Frontend Modal Rendering & CSS Framework Limitations

**Date:** 2026-01-31  
**Context:** Badge Detail Modal not rendering as overlay  
**Issue:** 15 bugs found during manual testing

**Problem:**
Tailwind CSS utility classes (`inset-0`, `fixed`, `bg-blue-600`) not working on modal components:
- Modal rendered inline instead of as overlay
- `position: fixed` computed as relative
- Z-index classes had no effect
- Background colors not applied

**Root Cause Investigation:**
1. Modal nested in `max-w-7xl` container
2. Tailwind classes not taking precedence
3. Possible PostCSS configuration issue
4. CSS specificity conflicts

**Attempted Solutions:**
```jsx
// ❌ Attempt 1: Move Modal to App.tsx root
// Result: Still failed, same issue

// ❌ Attempt 2: Use React Portal
import ReactDOM from 'react-dom';
return ReactDOM.createPortal(<Modal />, document.body);
// Result: TypeScript errors, complex to debug

// ✅ Solution: Inline styles for critical positioning
<div style={{
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
  {/* Modal content */}
</div>
```

**Best Practices:**
1. **Use inline styles for critical positioning**
   - Fixed positioning always inline
   - Z-index values inline
   - Backdrop colors inline
   - Layout properties (flex, grid) inline

2. **Utility classes for non-critical styling**
   - Text colors (if working)
   - Padding/margins (if working)
   - Border radius (usually works)

3. **Test CSS framework early**
   - Create simple modal first
   - Test in isolation
   - Verify utility classes work before complex components

4. **Consider CSS-in-JS for modals**
   - styled-components
   - emotion
   - More reliable than utility classes for overlays

5. **Document workarounds**
   - Add comments explaining why inline styles used
   - Reference issue tracker
   - Plan future refactor

**Impact:**
- ⚠️ Code maintainability reduced
- ⚠️ Theming harder
- ✅ Modals working reliably
- ⚠️ Similar fix needed for all modals (BadgeShare, etc.)

**Action Items:**
- [ ] Investigate Tailwind configuration
- [ ] Test with minimal reproduction
- [ ] Consider migrating to styled-components
- [ ] Or accept inline styles as standard for modals

**When to Apply:**
- Any fixed-position overlays
- Modals, dropdowns, tooltips
- Components that must work reliably
- When CSS framework has specificity issues

---

### Lesson 25: Manual Testing Complements Unit Tests

**Date:** 2026-01-31  
**Context:** 15 bugs found during manual testing that unit tests missed  
**Story:** All Sprint 6 stories

**Problem:**
Unit tests passing (190/190) but integration broken:
1. Token key inconsistency (`accessToken` vs `access_token`)
2. API path mismatches (`/badges/:id/share` vs `/badges/share/email`)
3. Authorization bugs (`user.id` vs `user.userId`)
4. CurrentUser decorator returning object instead of string
5. UUID validation issues (seed data used `demo-badge-1`)

**Why Unit Tests Missed These:**
- Unit tests mock all dependencies
- Don't test actual HTTP requests
- Don't verify token storage/retrieval
- Don't catch API contract mismatches
- Don't test full user workflows

**Manual Testing Process:**
```
1. Environment Setup (Steps 1-5)
   - Start backend/frontend
   - Load seed data
   - Verify connections

2. Authentication (Steps 6-10)
   - Get JWT token via PowerShell
   - Store in localStorage
   - Verify auth working

3. Feature Testing (Steps 11-60)
   - Badge list → Badge detail → Share modal
   - Widget generator → Download badge
   - Admin analytics → Report issue
   
4. Cross-browser Testing
   - Chrome, Firefox, Safari, Edge
   - Mobile viewport testing
   
5. Documentation
   - Record all bugs found
   - Track resolution status
   - Update test scenarios
```

**Results:**
| Testing Phase | Bugs Found | Severity |
|---------------|-----------|----------|
| Unit Tests | 0 | - |
| Manual Testing | 15 | High: 5, Medium: 7, Low: 3 |
| Pass Rate | 100% → 100% | After fixes |

**Bugs Found:**
1. Token auth反复失败 (High) - Key inconsistency
2. Badge卡片不可点击 (High) - Missing onClick
3. Modal组件未渲染 (High) - Component not included
4. Badge Detail API缺失 (High) - Endpoint not implemented
5. Modal显示为内联 (High) - CSS/positioning issue
6-15. (API paths, auth, validation, etc.)

**Best Practices:**
1. **Document manual test scenarios**
   - Create `sprint-X-manual-testing-progress.md`
   - 60+ step-by-step instructions
   - Track completion status

2. **Test integration points first**
   - Auth flow end-to-end
   - API contracts (request/response)
   - Token handling
   - Permission checks

3. **Use real data**
   - Don't mock everything
   - Test with actual JWT tokens
   - Use seed data matching production format

4. **Progressive testing**
   - Test each component individually
   - Then test integration
   - Then test full workflows

5. **Keep test environment fresh**
   - Reset database between tests
   - Clear localStorage
   - Use consistent test data

**Time Investment:**
- Manual testing: ~3 hours
- Bug fixes: ~2 hours
- Documentation: ~1 hour
- **ROI**: Found 15 bugs before production

**When to Apply:**
- After implementing new features
- Before marking story "done"
- Integration of external services
- UI/UX workflows
- Any user-facing functionality

**Documentation:**
- `docs/testing/sprint-6-manual-testing-progress.md` (complete)

---

### Lesson 26: Technical Debt is Acceptable for MVP

**Date:** 2026-01-31  
**Context:** Teams channel sharing requires permissions not yet available  
**Decision:** Defer as documented technical debt

**Problem:**
Teams channel sharing needs `ChannelMessage.Send` permission:
- Requires tenant admin approval
- Complex setup process
- May take days/weeks to get approval
- Blocks sprint completion

**Options Considered:**

**Option A: Block sprint until permissions available** ❌
- Delays all other features
- No clear timeline
- Team idle time

**Option B: Implement mock Teams integration** ❌
- Technical debt anyway (must replace with real)
- Doesn't test actual Graph API
- Wasted development time

**Option C: Defer as technical debt** ✅
- Document clearly what's needed
- Provide workaround (email)
- Continue with other features
- Clear path to implement later

**Decision Matrix:**
| Factor | Option A | Option B | Option C |
|--------|----------|----------|----------|
| **Sprint velocity** | ❌ Blocked | ⚠️ Slowed | ✅ Full speed |
| **Code quality** | ✅ Complete | ❌ Mock code | ✅ Real code ready |
| **User impact** | ❌ No features | ⚠️ Fake demo | ✅ Email works |
| **Future work** | ✅ None | ❌ Rewrite | ✅ Enable when ready |

**Technical Debt Template:**
```markdown
### Teams Channel Sharing - Not Implemented

**Status**: Deferred to Future Sprint
**Priority**: Medium
**Estimated Effort**: 2-3 days

**Background:**
Teams channel sharing requires ChannelMessage.Send permission 
that needs tenant admin approval.

**Current Implementation:**
- ✅ Badge Issuance: Email (working)
- ✅ Badge Sharing: Email (working)
- ❌ Teams Channel Sharing: Not implemented

**What's Needed:**
1. Add ChannelMessage.Send permission in Azure AD
2. Request tenant admin consent
3. Test with real Teams channel
4. Enable endpoint

**Code References:**
- Controller: `teams-sharing.controller.ts` (disabled)
- Service: `teams-badge-notification.service.ts` (ready)
- Tests: 16 tests deferred

**Decision Rationale:**
- Email provides equivalent functionality for MVP
- Teams is nice-to-have, not critical
- Clear implementation path for future
- No blockers for launch
```

**Best Practices:**
1. **Document everything**
   - Why deferred
   - What's needed to implement
   - Code ready to enable
   - Priority and effort estimate

2. **Provide workaround**
   - Email instead of Teams
   - Manual process instead of automated
   - Clearly communicate limitations

3. **Set clear criteria**
   - When to implement (Sprint 7? When permissions available?)
   - Success metrics
   - Definition of done

4. **Mark tests appropriately**
   - Use `describe.skip()` or `test.todo()`
   - Add comments explaining why
   - Reference technical debt doc

5. **Track in sprint status**
   ```yaml
   technical_debt:
     teams_channel_sharing:
       status: "deferred"
       reason: "Requires ChannelMessage.Send permission"
       workaround: "Email sharing provides full functionality"
       priority: "medium"
       estimated_effort: "2-3 days when permissions available"
   ```

**Impact:**
- ✅ Sprint 6 completed 100% (core functionality)
- ⏸️ Teams channel sharing documented for future
- ✅ Email provides equivalent user experience
- ✅ No blockers for MVP launch

**When to Defer as Technical Debt:**
- ✅ External dependencies unavailable
- ✅ Requires permissions/approval from 3rd party
- ✅ Workaround available
- ✅ Not critical for MVP
- ✅ Clear implementation path exists

**When NOT to Defer:**
- ❌ Core functionality
- ❌ Security vulnerabilities
- ❌ Data integrity issues
- ❌ No workaround available
- ❌ Blocks other features

**Documentation:**
- `docs/sprints/sprint-6/technical-debt.md` (complete)

---

### Lesson 27: External Service Configuration Complexity

**Date:** 2026-01-31  
**Context:** Microsoft Graph, Azure AD, Teams setup  
**Issue:** Complex multi-step configuration required

**Problem:**
External services require extensive setup:
1. **Azure AD App Registration** (30 min)
   - Navigate Azure Portal
   - Create app registration
   - Note tenant/client IDs
   
2. **API Permissions Configuration** (30 min)
   - Understand permission types (Delegated vs Application)
   - Add correct permissions (Mail.Send, TeamsActivity.Send, etc.)
   - Grant admin consent
   - Wait for propagation
   
3. **Client Secret Management** (15 min)
   - Create secret
   - Copy immediately (only shown once)
   - Store securely
   - Set expiration reminder
   
4. **Teams Configuration** (45 min)
   - Create/find Team
   - Get Team ID from URL
   - Get Channel ID
   - Test permissions
   
5. **Environment Variables** (15 min)
   - Update .env file
   - Verify all variables set
   - Restart services
   
**Total**: ~2-3 hours for first-time setup

**Challenges:**
- Microsoft docs scattered across multiple sites
- Permission names not obvious (ChannelMessage.Send vs Teamwork.Migrate.All)
- Admin consent requires tenant admin role
- IDs hard to extract from URLs
- No validation until runtime

**Solution - Comprehensive Setup Guide:**

Created `docs/setup/external-services-setup-guide.md`:
```markdown
## 📊 Configuration Priority
| Priority | Service | Status | Time |
|----------|---------|--------|------|
| 🔴 P0 | Graph API Permissions | ⚠️ Partial | 30min |
| 🔴 P0 | Teams Configuration | ❌ Missing | 45min |
| 🟡 P1 | Badge PNG Generation | ❌ Mock | 1-2h |

## Step-by-step with screenshots
1. Login to Azure Portal
2. Navigate to Azure AD...
[Detailed instructions]

## PowerShell helper scripts
- get-token.ps1 - Test authentication
- get-teams-info.ps1 - List available Teams
- create-test-team.ps1 - Auto-create test Team

## Troubleshooting
- Error AADSTS700016 → Client ID wrong
- Error AADSTS7000215 → Secret expired
[More scenarios]
```

**Best Practices:**
1. **Create setup guide early**
   - Don't wait until integration time
   - Document as you set up first time
   - Include screenshots
   - Test with fresh Azure account

2. **Provide helper scripts**
   ```powershell
   # get-teams-info.ps1
   # Lists all Teams with IDs
   Get-Content .env | ForEach-Object {
     # Parse env vars
   }
   $token = Get-GraphToken
   $teams = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me/joinedTeams"
   $teams.value | Format-Table displayName, id
   ```

3. **Validate configuration**
   ```typescript
   @Injectable()
   export class ConfigurationHealthCheck {
     check(): HealthCheckResult {
       const required = [
         'AZURE_TENANT_ID',
         'AZURE_CLIENT_ID',
         'AZURE_CLIENT_SECRET',
         'GRAPH_EMAIL_FROM',
       ];
       
       const missing = required.filter(key => !process.env[key]);
       
       if (missing.length > 0) {
         return {
           status: 'error',
           message: `Missing: ${missing.join(', ')}`,
           docs: 'docs/setup/external-services-setup-guide.md'
         };
       }
       
       return { status: 'ok' };
     }
   }
   ```

4. **Add health check endpoint**
   ```typescript
   @Get('health/graph')
   async checkGraphAPI() {
     return {
       emailEnabled: this.graphEmail.isEnabled(),
       teamsEnabled: this.graphTeams.isEnabled(),
       lastTokenRefresh: this.tokenProvider.lastRefresh,
       permissions: await this.graphToken.getPermissions(),
     };
   }
   ```

5. **Mock for development**
   ```typescript
   // .env
   MOCK_GRAPH_API=true  // Skip real API calls in dev
   
   // graph-email.service.ts
   async sendEmail(...) {
     if (this.config.get('MOCK_GRAPH_API') === 'true') {
       this.logger.log('[MOCK] Would send email to:', to);
       return;
     }
     // Real implementation
   }
   ```

**Documentation Created:**
- `docs/setup/azure-ad-app-setup.md` - Quick start
- `docs/setup/external-services-setup-guide.md` - Comprehensive (378 lines)
- `docs/setup/badge-image-setup-guide.md` - Image configuration
- 3 PowerShell test scripts

**Impact:**
- ✅ New developers can set up in 2-3 hours (vs 1-2 days trial-and-error)
- ✅ Clear troubleshooting for common errors
- ✅ Automated scripts reduce manual work
- ✅ Health check endpoint verifies configuration

**When to Apply:**
- Any OAuth 2.0 integration
- Third-party API requiring complex setup
- Multi-step configuration process
- Services requiring admin/tenant-level permissions
- When onboarding new developers

---

## Best Practices Summary (Updated Sprint 6)

### Development Workflow
1. **Start with clear requirements** (User stories + acceptance criteria)
2. **Create story files first** using bmb-workflow-builder
3. **Document as you code** (Dev Agent Record)
4. **Test early and often** (Unit tests + Manual testing)
5. **Defer technical debt when appropriate** (Document clearly)

### External Integrations
6. **Create setup guides early** (Step-by-step with screenshots)
7. **Provide helper scripts** (PowerShell for Windows, Bash for Linux)
8. **Add health check endpoints** (Verify configuration at runtime)
9. **Support mocking** (MOCK_*_API flags for development)
10. **Graceful degradation** (Check isEnabled, log warnings, don't throw)

### Testing Strategy
11. **Unit tests for logic** (190+ tests, 100% coverage)
12. **Manual testing for integration** (60+ step scenarios)
13. **Document manual test progress** (Track bugs found/fixed)
14. **Test with real data** (Actual JWT tokens, seed data)
15. **Progressive testing** (Component → Integration → Workflow)

### Technical Debt Management
16. **Accept debt for MVP** (When workaround available)
17. **Document everything** (Why, what's needed, code ready)
18. **Provide workarounds** (Alternative functionality)
19. **Set clear criteria** (Priority, effort, when to implement)
20. **Track in sprint status** (YAML format with all details)

### Code Quality
21. **Inline styles for critical CSS** (Fixed positioning, z-index)
22. **Utility classes for non-critical** (Colors, spacing)
23. **Proper dependency injection** (All constructor params mocked in tests)
24. **Consistent API contracts** (TypeScript types shared fe/be)
25. **Error handling everywhere** (Try-catch, log, don't throw for non-critical)

### TypeScript Type Safety (Sprint 9 Additions)
26. **Variable annotations over `as` casts** (`const x: Type = expr` survives `eslint --fix`; `expr as Type` does not)
27. **Gate `tsc --noEmit` in CI from Sprint 0** (ESLint and Jest have their own lenient TS parsers — only `tsc` does full type checking)
28. **Budget test mock updates when eliminating `any`** (Replacing `any` → strict interface in N files causes ~N test mock failures)
29. **Use `import type` for NestJS decorator parameters** (`isolatedModules` + `emitDecoratorMetadata` requires it)

---

## Common Pitfalls (Sprint 6 Additions)

### ❌ Pitfall 11: Blocking Sprint for External Dependencies
**Symptom:** Waiting for tenant admin approval, permissions, etc.  
**Cost:** Team idle, sprint delayed  
**Fix:** Defer as technical debt with workaround

### ❌ Pitfall 12: Trusting Unit Tests Alone
**Symptom:** "All tests passing" but features broken in browser  
**Cost:** 15 bugs found during manual testing  
**Fix:** Manual testing for every user-facing feature

### ❌ Pitfall 13: No Setup Documentation for Complex Services
**Symptom:** "How do I configure Azure AD?" - spend 2 days trial-and-error  
**Cost:** Onboarding time, misconfiguration, frustration  
**Fix:** Create comprehensive setup guide with screenshots

### ❌ Pitfall 14: CSS Framework Assumptions
**Symptom:** Tailwind classes don't work, waste time debugging  
**Cost:** Hours lost fighting CSS specificity  
**Fix:** Test framework early, use inline styles for critical CSS

### ❌ Pitfall 15: Hardcoding Service Availability
**Symptom:** App crashes when Graph API unavailable  
**Cost:** Poor user experience, difficult debugging  
**Fix:** Feature flags, isEnabled checks, graceful degradation

## Common Pitfalls (Sprint 10 Additions — Lesson 39)

### ❌ Pitfall 19: Writing Spec Without Creating Implementation Stories
**Symptom:** Comprehensive UX/architecture spec exists but its "Implementation Plan" was never translated into backlog stories  
**Cost:** 20h remediation (G-Credit Lesson 39) — largest single rework in project history  
**Fix:** SM cross-checks every spec's "Phase" or "Implementation" sections against backlog. If it's not a story, it won't get done. Add to Sprint Planning checklist.

### ❌ Pitfall 20: UX Audit Scope Limited to Components
**Symptom:** UX audit reviews `.tsx` component files but never opens `tailwind.config.js`, `index.html`, or layout infrastructure  
**Cost:** Design system absence goes undetected for 10 sprints  
**Fix:** UX Audit Infrastructure Checklist (mandatory):
```
□ tailwind.config.js — theme colors, fonts, spacing defined?
□ index.html — font CDN links present? <title> correct?
□ index.css — CSS variables customized or just scaffold defaults?
□ Layout component — single source of page chrome?
□ PageTemplate — consistent header/spacing pattern?
□ Design tokens file — centralized constants?
□ Visual comparison — at least 3 pages vs UX spec (requires running app)
```

### ❌ Pitfall 21: Audit Recommendations Filed but Never Tracked
**Symptom:** Audit report contains actionable recommendations, but no one converts them to stories  
**Cost:** Recommendations decay; same issues rediscovered later at higher cost  
**Fix:** SM triages every audit finding in next Sprint Planning:
- **Fix Now** → current sprint
- **Create Story** → add to backlog with priority
- **Accept Risk** → document decision and rationale
- **Never:** silently ignore

### ❌ Pitfall 22: Confusing "Present" with "Configured"
**Symptom:** Audit sees CSS variables in `index.css` and reports "design tokens implemented" — but variables are auto-generated scaffold defaults, not customized  
**Cost:** False sense of completion; release audit gives 4/5 to a 1/5 reality  
**Fix:** Auditor must verify values, not just presence. Ask: "Do these values match our brand spec?" not "Do CSS variables exist?"

---

## Common Pitfalls (Sprint 9 Additions)

### ❌ Pitfall 16: Using `as` Casts to Fix tsc Errors
**Symptom:** `tsc --noEmit` passes, then `eslint --fix` strips the `as` cast, `tsc` fails again  
**Cost:** 2 CI fix rounds, extra commit churn  
**Fix:** Use `const x: Type = expr` instead of `expr as Type` — variable annotations survive `eslint --fix`

### ❌ Pitfall 17: Trusting "All Green CI" Without `tsc --noEmit`
**Symptom:** 129 type errors accumulate across 8 sprints, nobody notices  
**Cost:** 5h cleanup task (TD-017), CI pipeline breaks when eventually discovered  
**Fix:** Add `tsc --noEmit` to CI from project day one. ESLint and Jest use lenient TypeScript parsers.

### ❌ Pitfall 18: Replacing `any` Without Updating Test Mocks
**Symptom:** Source code compiles, tests pass (ts-jest is lenient), but `tsc --noEmit` shows errors in test files  
**Cost:** 9 new tsc errors per 9 controllers changed (1:1 ratio)  
**Fix:** Always include test mock updates in scope when replacing `any` with strict types. Run `tsc --noEmit` to verify.

---

## Sprint 6 Statistics

**Development Metrics:**
- **Stories**: 5/5 completed (100%)
- **Estimated effort**: 56-76 hours
- **Actual effort**: 35 hours (46-62% of estimate)
- **Velocity**: ~7 hours per story

**Quality Metrics:**
- **Core tests**: 190/190 passing (100%)
- **Deferred tests**: 16 (Teams - technical debt)
- **Manual test scenarios**: 60+
- **Bugs found**: 15 (all fixed)
- **Code coverage**: >80%

**Documentation:**
- **Story files**: 5 (complete with dev notes)
- **Setup guides**: 3 (378+ lines total)
- **Test scripts**: 3 PowerShell files
- **Technical debt**: 1 document (2 items)
- **Retrospective**: 1 complete review

**Technical Debt:**
- **Teams channel sharing**: Medium priority, 2-3 days
- **Badge PNG generation**: Low priority, 1-2 days

---

**Last Major Update:** Sprint 11 Complete (2026-02-14) - Lessons 35, 40, 41, 42  
**Next Review:** Sprint 12 Retrospective  
**Owner:** PM (John) + Dev Team

---

## Sprint 11: Lesson 41 — Wave-Based Execution Handles Large Sprints Well

**Date:** 2026-02-14  
**Sprint:** 11 (Security & Quality Hardening)  
**Severity:** Positive — enabled 23 stories in 3 days with zero confusion

### What Happened

23 stories spanning security, code quality, features, and DX were organized into 5 thematic waves:
- Wave 1: Quick Wins (trivial fixes, confidence builder)
- Wave 2: Core Security (highest risk, needed careful review)
- Wave 3: Complex Cross-cutting Features
- Wave 4: Test Suites + Infrastructure (highest test count growth)
- Wave 5: Polish + CI Tooling

Each wave followed: dev prompt → implementation → code review → acceptance.

### Root Cause (of Success)

Thematic grouping reduced context switching. Code reviews per wave caught issues early. Acceptance per wave provided clear progress visibility.

### Action Items

1. **[SM] Sprint Planning:** For sprints with >10 stories, always organize into waves
2. **[SM] Wave sizing:** Aim for 4-5 stories per wave with similar complexity
3. **[SM] Wave ordering:** Start with quick wins for momentum, end with tooling/DX

### Key Takeaway

> **Wave-based execution = thematic batching + incremental quality gates. It turns a chaotic 23-story sprint into 5 manageable mini-sprints.**

---

## Sprint 11: Lesson 42 — Service Test Suites Are High-Value Technical Debt Items

**Date:** 2026-02-14  
**Sprint:** 11 (Security & Quality Hardening), Wave 4  
**Severity:** Positive — 3 services went from 0% to 90%+ coverage

### What Happened

Stories 11.10-11.12 added test suites for 3 critical services that had 0% coverage:
- `badge-templates.service` (96%+ coverage, 15 test cases)
- `issuance-criteria-validator.service` (90%+ coverage)
- `blob-storage.service` (Azure mock tests)

These tests caught edge cases and provided regression safety for business-critical code paths.

### Root Cause

These services were initially built without tests (Sprint 2-3) because velocity was prioritized. The code quality audit in Sprint 11 planning correctly identified them as the highest-value test investment.

### Action Items

1. **[Dev] New services:** Always create test suite alongside service implementation
2. **[SM] Sprint Planning:** When auditing test coverage, prioritize services with business logic over simple CRUD
3. **[SM] Estimation:** Service test suites typically take 2-3h each — they’re straightforward but high-value

### Key Takeaway

> **A service test suite at 90%+ coverage takes ~3h to write but provides ongoing regression safety for the life of the project. Always worth the investment.**

---

## Sprint 11: Lesson 40 — Local Pre-Push Checks Must Mirror CI Pipeline

**Date:** 2026-02-14  
**Sprint:** 11 (Security & Quality Hardening), Wave 2  
**Severity:** Medium — caused 4 consecutive CI failures on a single push  

### What Happened

Wave 2 完成 5 个安全 Story 后，本地只跑了部分检查就 push，导致 CI 连续失败 4 次：

| CI 轮次 | 失败原因 | 本地遗漏的检查步骤 |
|---------|---------|-------------------|
| 1 | ESLint: `require()` import + unsafe-any warnings | 只跑了单文件 `npx eslint file.ts`，没用 `npm run lint`（含 `--max-warnings=0`） |
| 2 | TypeScript TS1272: `import type` required | 没跑 `npx tsc --noEmit` |
| 3 | E2E: register 返回格式变了，断言不匹配 | 没跑 E2E 测试 |
| 4 | E2E: refresh token 唯一约束冲突 | 同上 |

### Root Cause

CI 执行 4 个步骤，本地每次只跑了 1-2 个：
```
CI Pipeline:
1. npm run lint              (ESLint --max-warnings=0)
2. npx tsc --noEmit          (TypeScript 类型检查)
3. npm test                  (单元测试)
4. jest --config e2e         (E2E 测试)
```

### Action Items

1. **[Dev] 立即生效：** Push 前必须执行完整检查链：
   ```powershell
   # Backend
   cd gcredit-project/backend
   npm run lint && npx tsc --noEmit && npm test && npx jest --config test/jest-e2e.json

   # Frontend
   cd gcredit-project/frontend
   npx prettier --check "src/**/*.{ts,tsx}" && npm test
   ```

2. **[Scrum Master] 建议：** 将上述检查链写入 `project-context.md` 的开发标准

3. **[Dev] Story 11.22：** 实现 Husky pre-push hook 自动化执行，彻底消除人为遗漏

### Key Takeaway

> **本地检查必须 100% 覆盖 CI 的每个步骤。部分检查 = 假信心。**

*This is a living document - keep it updated, keep it useful!*
