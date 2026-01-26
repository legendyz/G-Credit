# Lessons Learned & Best Practices

**Project:** G-Credit Digital Credentialing System  
**Purpose:** Capture key learnings and establish best practices for efficient development  
**Last Updated:** 2026-01-26 (Sprint 2 - Story 3.5 Complete)  
**Status:** Living document - update after each Sprint Retrospective  
**Coverage:** Sprint 0 (Infrastructure) → Sprint 1 (Authentication) → Sprint 2 (Badge Templates)  
**Total Lessons:** 13 sprint-specific lessons + 12 cross-sprint patterns = 25 key learnings

---

## 📊 Project Summary (Sprint 0-2)

### Velocity Metrics
| Sprint | Stories | Estimated | Actual | Accuracy | Velocity |
|--------|---------|-----------|--------|----------|----------|
| Sprint 0 | 5/5 (100%) | 10h | 9.5h | 95% | ~1h/story |
| Sprint 1 | 7/7 (100%) | 21h | 21h | 100% | ~3h/story |
| Sprint 2 | 4/6 (67%) | 21-22h | ~3h | 7-8x faster | ~45min/story |

### Quality Metrics
- **Test Pass Rate:** 100% (40/40 Sprint 1 tests, comprehensive Sprint 2 testing)
- **Documentation Accuracy:** 95%+ (after Sprint 2 path corrections)
- **Technical Debt:** 3 items (all documented, 2 scheduled for Sprint 7+)
- **Zero Production Bugs:** All issues caught in development

### Key Achievements
- ✅ Production-ready infrastructure (Azure PostgreSQL + Blob Storage)
- ✅ Complete authentication system (JWT + RBAC + Multi-device)
- ✅ Badge management foundation (Templates, Skills, Categories)
- ✅ Comprehensive documentation system (5 major guides created)
- ✅ Established development patterns and best practices

---

## 📚 Table of Contents
- [Sprint 0 Lessons](#sprint-0-lessons-january-2026) - Infrastructure Setup (5 lessons)
- [Sprint 1 Lessons](#sprint-1-lessons-january-2026) - Authentication System (4 lessons)
- [Sprint 2 Lessons](#sprint-2-lessons-january-2026) - Badge Templates (7 lessons) ⭐ **NEW**
- [Cross-Sprint Patterns](#cross-sprint-patterns) - 12 patterns
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

### 🎯 Lesson 1: Documentation-Code Misalignment Costs Time

**What Happened:**
During Story 3.3 development, dev encountered import path errors 3 times before finding the correct paths. Documentation showed `../modules/prisma/prisma.module` but actual path was `../common/prisma.module`.

**Root Cause:**
- Sprint 0 implementation differed from Architecture document assumptions
- `project-context.md` was not updated after Sprint 0/1
- Sprint 2 Backlog was created based on outdated documentation

**Impact:**
- 15-20 minutes wasted debugging paths
- Potential for more serious environment variable config errors
- Developer frustration and lost flow state

**Solution Implemented:**
1. ✅ Created `IMPORT-PATHS.md` - copy-paste ready imports
2. ✅ Updated `project-context.md` with actual structure
3. ✅ Fixed all paths in `sprint-2-backlog.md`
4. ✅ Created `backend-code-structure-guide.md` - comprehensive guide
5. ✅ Established Sprint Backlog verification process

**Preventive Measures for Future:**
- [ ] Run "Path Verification Check" before each Sprint Planning
- [ ] Update `project-context.md` in every Sprint Retrospective
- [ ] Dev to reference completed code (not docs) when uncertain
- [ ] PM to verify code examples in backlog match actual codebase

**Key Takeaway:** 
> **"Code is truth, documentation is commentary."** When docs conflict with code, trust the code and fix the docs immediately.

---

### 🎯 Lesson 2: Time Estimates Were Highly Inaccurate (7-8x faster than estimated)

**What Happened:**
Sprint 2 stories were completed in ~3 hours vs estimated 21-22 hours (Stories 3.1, 3.2, 3.3, 3.6).

**Analysis:**
- ✅ **What went well:**
  - Solid foundation from Sprint 1 (auth/user patterns to copy)
  - Clear backlog with detailed tasks
  - AI assistance for boilerplate code
  - No scope creep or requirement changes
  
- ⚠️ **Why estimates were off:**
  - First time estimating with AI assistance
  - Didn't account for code reuse from Sprint 1
  - Conservative estimates (assumed manual coding)
  - Simple CRUD operations easier than expected

**Adjustment for Future Sprints:**
- Use **Sprint 2 actual time** as new baseline
- Estimation formula: `Conservative estimate ÷ 7 = Realistic with AI`
- BUT: Don't over-correct - complex features may take longer
- Track: "First time implementing X" vs "Similar to existing Y"

**New Estimation Guidelines:**
| Complexity | Traditional Estimate | AI-Assisted Reality | Notes |
|------------|---------------------|---------------------|-------|
| Simple CRUD | 4-6h | 30-60min | Lots of boilerplate, easy AI help |
| Medium (validation, business logic) | 6-8h | 1-2h | Some thinking required |
| Complex (integrations, algorithms) | 8-12h | 3-5h | More testing, debugging |
| Novel (new tech, research needed) | 12-16h | 4-8h | Less AI help, more learning |

**Key Takeaway:**
> Track actual vs estimated time for 3 sprints before trusting new velocity. Consider AI assistance in estimates but remain conservative for novel features.

---

### 🎯 Lesson 3: Security Vulnerabilities Should Be Documented, Not Fixed Mid-Sprint

**What Happened:**
During npm package installation (Story 3.2), 5 security warnings appeared. Dev asked for analysis.

**Decision Made:**
- Analyzed all 5 vulnerabilities (3 High, 2 Moderate)
- Risk assessment: LOW production impact (build-time only)
- Created `docs/security-notes.md` (487 lines)
- Decision: **Accept and defer to Sprint 7**

**Why This Was Right:**
✅ Didn't disrupt Sprint 2 velocity  
✅ Avoided "yak shaving" (fixing dependencies instead of features)  
✅ Formal documentation for future reference  
✅ Allowed batching security updates in dedicated sprint  

**Process Established:**
1. Capture security warnings when they occur
2. Quick risk assessment (5-10 minutes)
3. Document in `security-notes.md`
4. Decide: Fix now (critical) or Defer (low risk)
5. Plan dedicated "Dependency Maintenance Sprint" (Sprint 7)

**Key Takeaway:**
> Not all warnings require immediate action. Document, assess risk, and schedule properly. Don't let security theater disrupt feature delivery unless truly critical.

---

## Sprint 1 Lessons (January 2026)

### 🎯 Lesson 4: Perfect Time Estimation Is Possible (100% accuracy)

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

### 🎯 Lesson 5: Comprehensive E2E Testing Pays Off

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

### 🎯 Lesson 6 (Sprint 1): RefreshToken Architecture Evolution

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

### 🎯 Lesson 7 (Sprint 1): Email Enumeration Protection

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

### 🎯 Lesson 10: Documentation-Code Misalignment Costs Time

**What Happened:**
During Story 3.3 development, dev encountered import path errors 3 times before finding the correct paths. Documentation showed `../modules/prisma/prisma.module` but actual path was `../common/prisma.module`.

**Root Cause:**
- Sprint 0 implementation differed from Architecture document assumptions
- `project-context.md` was not updated after Sprint 0/1
- Sprint 2 Backlog was created based on outdated documentation

**Impact:**
- 15-20 minutes wasted debugging paths
- Potential for more serious environment variable config errors
- Developer frustration and lost flow state

**Solution Implemented:**
1. ✅ Created `IMPORT-PATHS.md` - copy-paste ready imports
2. ✅ Updated `project-context.md` with actual structure
3. ✅ Fixed all paths in `sprint-2-backlog.md`
4. ✅ Created `backend-code-structure-guide.md` - comprehensive guide
5. ✅ Established Sprint Backlog verification process

**Preventive Measures for Future:**
- [ ] Run "Path Verification Check" before each Sprint Planning
- [ ] Update `project-context.md` in every Sprint Retrospective
- [ ] Dev to reference completed code (not docs) when uncertain
- [ ] PM to verify code examples in backlog match actual codebase

**Key Takeaway:** 
> **"Code is truth, documentation is commentary."** When docs conflict with code, trust the code and fix the docs immediately.

---

### 🎯 Lesson 11: Time Estimates Were Highly Inaccurate (7-8x faster than estimated)

**What Happened:**
Sprint 2 stories were completed in ~3 hours vs estimated 21-22 hours (Stories 3.1, 3.2, 3.3, 3.6).

**Analysis:**
- ✅ **What went well:**
  - Solid foundation from Sprint 1 (auth/user patterns to copy)
  - Clear backlog with detailed tasks
  - AI assistance for boilerplate code
  - No scope creep or requirement changes
  
- ⚠️ **Why estimates were off:**
  - First time estimating with AI assistance
  - Didn't account for code reuse from Sprint 1
  - Conservative estimates (assumed manual coding)
  - Simple CRUD operations easier than expected

**Adjustment for Future Sprints:**
- Use **Sprint 2 actual time** as new baseline
- Estimation formula: `Conservative estimate ÷ 7 = Realistic with AI`
- BUT: Don't over-correct - complex features may take longer
- Track: "First time implementing X" vs "Similar to existing Y"

**New Estimation Guidelines:**
| Complexity | Traditional Estimate | AI-Assisted Reality | Notes |
|------------|---------------------|---------------------|-------|
| Simple CRUD | 4-6h | 30-60min | Lots of boilerplate, easy AI help |
| Medium (validation, business logic) | 6-8h | 1-2h | Some thinking required |
| Complex (integrations, algorithms) | 8-12h | 3-5h | More testing, debugging |
| Novel (new tech, research needed) | 12-16h | 4-8h | Less AI help, more learning |

**Key Takeaway:**
> Track actual vs estimated time for 3 sprints before trusting new velocity. Consider AI assistance in estimates but remain conservative for novel features.

---

### 🎯 Lesson 12: Security Vulnerabilities Should Be Documented, Not Fixed Mid-Sprint

**What Happened:**
During npm package installation (Story 3.2), 5 security warnings appeared. Dev asked for analysis.

**Decision Made:**
- Analyzed all 5 vulnerabilities (3 High, 2 Moderate)
- Risk assessment: LOW production impact (build-time only)
- Created `docs/security-notes.md` (487 lines)
- Decision: **Accept and defer to Sprint 7**

**Why This Was Right:**
✅ Didn't disrupt Sprint 2 velocity  
✅ Avoided "yak shaving" (fixing dependencies instead of features)  
✅ Formal documentation for future reference  
✅ Allowed batching security updates in dedicated sprint  

**Process Established:**
1. Capture security warnings when they occur
2. Quick risk assessment (5-10 minutes)
3. Document in `security-notes.md`
4. Decide: Fix now (critical) or Defer (low risk)
5. Plan dedicated "Dependency Maintenance Sprint" (Sprint 7)

**Key Takeaway:**
> Not all warnings require immediate action. Document, assess risk, and schedule properly. Don't let security theater disrupt feature delivery unless truly critical.

---

### 🎯 Lesson 13: Prisma JSON Types Require Plain Object Conversion (Story 3.5)

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

### 🎯 Lesson 14: Union Types in DTOs Need Explicit Validation (Story 3.5)

**What Happened:**
`IssuanceConditionDto.value` field with union type `string | number | boolean | string[]` was rejected by class-validator:
```
"issuanceCriteria.conditions.0.property value should not exist"
```

**Root Cause:**
- class-validator requires explicit decorators for validation
- Union types without decorators are treated as "unknown properties"
- TypeScript type alone isn't enough for runtime validation

**Solution Implemented:**
```typescript
// ❌ WRONG - No validation decorator
value: string | number | boolean | string[];

// ✅ CORRECT - Add @IsNotEmpty()
@IsNotEmpty()
value: string | number | boolean | string[];
```

**When This Applies:**
- Any DTO field with union types
- Optional fields that could be multiple types
- Polymorphic data structures

**Prevention Strategy:**
1. Always add validation decorator to union type fields
2. Use `@IsNotEmpty()` as minimum (allows any truthy value)
3. For stricter validation, use custom validator
4. Document why union type is needed in comments

**Advanced Alternative:**
```typescript
// For more control, use custom validator
@Validate(IssuanceCriteriaValueValidator)
value: string | number | boolean | string[];
```

**Key Takeaway:**
> Union types in class-validator DTOs must have at least `@IsNotEmpty()` decorator. TypeScript types ≠ runtime validation.

---

### 🎯 Lesson 15: NestJS Route Order Matters - Specific Before Dynamic (Story 3.5)

**What Happened:**
Created public endpoints `/badge-templates/criteria-templates` but received 401 Unauthorized.

**Root Cause:**
Dynamic route `:id` was defined BEFORE specific route `criteria-templates`:
```typescript
@Get(':id')        // Line 84 - catches everything
async findOne() {}

@Get('criteria-templates')  // Line 205 - never reached!
getCriteriaTemplates() {}
```

**NestJS Route Matching:**
- Routes are matched **in definition order** (first match wins)
- `:id` matches ANY string, including "criteria-templates"
- Request to `/badge-templates/criteria-templates` → matched by `:id` route

**Solution:**
```typescript
// ✅ CORRECT ORDER - specific routes first
@Get('all')
@Get('criteria-templates')
@Get('criteria-templates/:key')
@Get(':id')        // Dynamic route LAST
```

**Impact on Future:**
- ⚠️ Any time adding new specific routes to existing controllers
- ⚠️ Easy to forget when routes are far apart in file
- ⚠️ Silent failure - no error, just wrong behavior

**Prevention Checklist:**
- [ ] Put all specific routes (`/exact-string`) before dynamic routes (`:param`)
- [ ] Group related routes together in controller
- [ ] Add comment before `:id` route: "⚠️ Keep this last - matches any string"
- [ ] Test public endpoints without authentication in E2E tests

**Quick Reference:**
```typescript
// Route priority (top to bottom):
@Get('exact-match')           // 1. Exact strings
@Get('path/to/resource')      // 2. Multi-segment paths  
@Get('resource/:id/action')   // 3. Mixed static/dynamic
@Get(':id')                   // 4. Dynamic params LAST
```

**Key Takeaway:**
> In NestJS controllers, route order = match order. Always define specific routes BEFORE dynamic `:param` routes.

---

### 🎯 Lesson 16: Global Guards Require @Public() Decorator for Open Endpoints (Story 3.5)

**What Happened:**
Added criteria templates endpoints but they returned 401 even without auth guard decorators.

**Root Cause:**
`app.module.ts` has global `APP_GUARD` configuration:
```typescript
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
]
```

**Global Guards Apply To ALL Routes:**
- Every controller method protected by default
- Even new endpoints without explicit `@UseGuards()`
- Secure by default, but easy to forget for public endpoints

**Solution:**
```typescript
// Import Public decorator
import { Public } from '../common/decorators/public.decorator';

// Mark public endpoints
@Public()
@Get('criteria-templates')
getCriteriaTemplates() {}
```

**Impact on Future Development:**
- ⚠️ **EVERY** new endpoint needs authentication decision
- ⚠️ Public endpoints are the exception, not the rule
- ✅ Secure by default is good security practice

**Checklist for New Endpoints:**
1. [ ] Should this endpoint be public?
   - Yes → Add `@Public()` decorator
   - No → Add `@Roles()` decorator for RBAC
2. [ ] Test without authentication token
3. [ ] Document authentication requirement in API docs

**Public Endpoint Examples:**
- Login/Register (auth endpoints)
- Public badge list (discovery)
- Template library (reference data)
- Health check/status endpoints

**Key Takeaway:**
> With global guards, explicitly mark public endpoints with `@Public()`. Secure by default protects against forgetting authentication.

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
```

### ✅ Before Committing Code

```markdown
[ ] Run tests (npm test)
[ ] Check for TypeScript errors (npm run build)
[ ] Verify imports use correct paths (no red squiggles in IDE)
[ ] Update IMPORT-PATHS.md if new pattern introduced
[ ] Check if documentation needs update
[ ] Write meaningful commit message
```

### ✅ Sprint Retrospective (Must-Do Items)

```markdown
[ ] Update lessons-learned.md with new insights
[ ] Check: Did actual directory structure change?
[ ] Update project-context.md if needed
[ ] Review time estimates vs actual (adjust future estimates)
[ ] Identify any "yak shaving" moments (prevent next time)
[ ] Document any new patterns or decisions
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

## 📚 Related Documents

- [Import Paths Cheatsheet](../IMPORT-PATHS.md) - Copy-paste ready
- [Backend Code Structure Guide](./backend-code-structure-guide.md) - Architecture
- [Sprint 2 Path Corrections](./sprint-2-path-corrections.md) - Specific issue
- [Project Context](../project-context.md) - High-level overview
- [Infrastructure Inventory](./infrastructure-inventory.md) - Azure resources
- [Security Notes](./security-notes.md) - Vulnerability tracking

---

**Last Major Update:** Sprint 2 (2026-01-26) - Path verification lesson  
**Next Review:** Sprint 3 Retrospective  
**Owner:** PM (John) + Dev Team

*This is a living document - keep it updated, keep it useful!*
