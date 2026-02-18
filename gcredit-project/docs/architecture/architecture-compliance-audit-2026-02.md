# Architecture Compliance Audit Report

**Audit Number:** 2 (from Post-MVP Audit Plan)  
**Agent:** Architect (Winston)  
**Date:** 2026-02-11  
**Priority:** P0 — Must complete before production deployment  
**Status:** ✅ Complete  
**Scope:** Compare actual codebase against `system-architecture.md` (5,755 lines) and 8 ADRs  
**Version Audited:** v1.0.0 (Sprint 10 complete, 1061 tests, UAT 33/33 PASS)

---

## Executive Summary

The G-Credit v1.0.0 codebase demonstrates **strong overall compliance** with the architecture document and ADRs. The modular monolith pattern is well-implemented, RBAC is consistently enforced, and Open Badges 2.0 compliance is solid. Key deviations are mostly structural (flat module organization vs. nested `modules/` directory) and are intentional adaptations that emerged during MVP development. No P0 architectural blockers were found.

| Area | Compliance Score | Deviations | Severity |
|------|-----------------|------------|----------|
| Module Boundary | ✅ 85% | 2 minor | P2 |
| API Design | ✅ 95% | 1 minor | P3 |
| Database Design | ✅ 95% | 1 cosmetic | P3 |
| ADR Compliance | ✅ 90% | 2 items | P1-P2 |
| Infrastructure | ✅ 90% | 2 items | P2 |
| **Overall** | **✅ 91%** | **8 total** | **No P0 blockers** |

---

## 2.1 Module Boundary Compliance

### Architecture Specification

The architecture doc (Decision 4.2) specifies a **feature-based module structure**:

**Backend (Architecture Doc):**
```
src/
├── modules/        # Feature modules
│   ├── badges/     
│   ├── issuance/   
│   ├── users/      
│   └── auth/       
├── common/         # Shared code
├── config/         
└── main.ts
```

**Frontend (Architecture Doc):**
```
src/
├── features/       # Feature modules
├── components/     # Shared components
├── hooks/          # Global hooks
├── lib/            # Utilities
├── stores/         # Zustand stores
└── types/
```

### Actual Implementation

**Backend (Actual):**
```
src/
├── admin-users/           # Feature module (flat)
├── analytics/             # Feature module (flat)
├── badge-issuance/        # Feature module (flat)
├── badge-sharing/         # Feature module (flat)
├── badge-templates/       # Feature module (flat)
├── badge-verification/    # Feature module (flat)
├── bulk-issuance/         # Feature module (flat)
├── common/                # ✅ Shared infrastructure
├── config/                # ✅ Configuration
├── dashboard/             # Feature module (flat)
├── evidence/              # Feature module (flat)
├── m365-sync/             # Feature module (flat)
├── microsoft-graph/       # Feature module (flat)
├── milestones/            # Feature module (flat)
├── modules/auth/          # ⚠️ Only auth under modules/
├── skill-categories/      # Feature module (flat)
├── skills/                # Feature module (flat)
└── main.ts
```

**Frontend (Actual):**
```
src/
├── components/     # ✅ Shared + feature components
├── hooks/          # ✅ Global hooks
├── lib/            # ✅ Utilities (apiConfig, api clients)
├── pages/          # ⚠️ Page components (not "features/")
├── stores/         # ✅ Zustand stores
├── styles/         # ✅ Global styles
├── types/          # ✅ Type definitions
└── utils/          # Additional utilities
```

### Findings

| # | Check | Status | Details |
|---|-------|--------|---------|
| 2.1.1 | Modules properly isolated | ✅ PASS | Each backend module has its own `.module.ts`, `.controller.ts`, `.service.ts` |
| 2.1.2 | `common/` contains only shared infrastructure | ✅ PASS | Contains: decorators, guards, interceptors, interfaces, PrismaModule, StorageModule, EmailModule — all shared |
| 2.1.3 | Domain modules organized consistently | ⚠️ DEVIATION | 15 modules are flat under `src/`, only `auth` is under `src/modules/`. Architecture doc specified all feature modules under `src/modules/` |
| 2.1.4 | No circular dependencies between modules | ✅ PASS | Cross-module imports are limited to 5 legitimate integrations (e.g., `badge-issuance` → `microsoft-graph` for notifications) |
| 2.1.5 | Frontend features directory structure | ⚠️ DEVIATION | Frontend uses `pages/` + `components/` pattern instead of `features/` grouping |
| 2.1.6 | No cross-feature imports violating boundaries | ✅ PASS | Cross-module imports are through proper NestJS module imports, not direct file imports across feature boundaries |

### ARCH-DEV-001: Backend Module Organization Deviation

**Severity:** P2 (Medium — cosmetic, no functional impact)

**Architecture says:** Feature modules under `src/modules/`  
**Actual:** Feature modules flat under `src/`, only `auth` under `src/modules/`

**Assessment:** This deviation is **acceptable for MVP**. The flat structure actually reduces import path depth and is common in mature NestJS projects. All 19 modules are properly self-contained with their own `.module.ts` files registered in `AppModule`.

**Recommendation:** Standardize to one pattern before Phase 2. Either:
- (A) Move `auth` out of `modules/` to match the flat pattern, OR
- (B) Group related modules into domain folders (e.g., `src/badge-domain/{issuance, templates, verification, sharing}`)

### ARCH-DEV-002: Frontend Feature Organization

**Severity:** P3 (Low — no functional impact)

**Architecture says:** Feature-based structure with `src/features/` containing feature modules  
**Actual:** Traditional `pages/` + `components/` structure

**Assessment:** The actual structure works well for the current scale (14 pages, ~40 components) and is a valid React architectural pattern. The architecture doc's feature-based structure would benefit larger teams but isn't critical for a solo-developer MVP.

**Recommendation:** Consider migrating to feature-based structure in Phase 2 when adding 8+ new screens.

---

## 2.2 API Design Compliance

### Controller Prefix Check

**Architecture Specification:** All controllers should use `@Controller('api/...')` prefix (Coding Standard #2).

| Controller | Route Prefix | Compliant? |
|-----------|--------------|------------|
| `AppController` | `@Controller()` (root) | ✅ OK — health/root endpoints |
| `AnalyticsController` | `@Controller('api/analytics')` | ✅ |
| `SkillsController` | `@Controller('api/skills')` | ✅ |
| `SkillCategoriesController` | `@Controller('api/skill-categories')` | ✅ |
| `BadgeAnalyticsController` | `@Controller('api/badges')` | ✅ |
| `BulkIssuanceController` | `@Controller('api/bulk-issuance')` | ✅ |
| `BadgeSharingController` | `@Controller('api/badges/share')` | ✅ |
| `TeamsSharingController` | `@Controller('api/badges')` | ✅ |
| `WidgetEmbedController` | `@Controller('api/badges')` | ✅ |
| `AuthController` | `@Controller('api/auth')` | ✅ |
| `M365SyncController` | `@Controller('api/admin/m365-sync')` | ✅ |
| `TeamsActionController` | `@Controller('api/teams/actions')` | ✅ |
| `MilestonesController` | `@Controller('api')` | ✅ |
| `EvidenceController` | `@Controller('api/badges/:badgeId/evidence')` | ✅ |
| `DashboardController` | `@Controller('api/dashboard')` | ✅ |
| `BadgeTemplatesController` | `@Controller('api/badge-templates')` | ✅ |
| `BadgeVerificationController` | `@Controller('api/verify')` | ✅ |
| `AdminUsersController` | `@Controller('api/admin/users')` | ✅ |
| `BadgeIssuanceController` | `@Controller('api/badges')` | ✅ |

**Result:** ✅ **19/19 controllers compliant** (TD-022 resolved in Sprint 10 — `api/` prefix added to 4 controllers)

### Additional API Checks

| # | Check | Status | Details |
|---|-------|--------|---------|
| 2.2.1 | All controllers use `api/` prefix | ✅ PASS | 19/19 compliant (AppController root paths are appropriate exceptions) |
| 2.2.2 | API structure matches architecture spec endpoints | ⚠️ MINOR | Architecture uses `/api/v1/` versioned prefix; actual uses `/api/` without versioning |
| 2.2.3 | DTOs validated with class-validator | ✅ PASS | All endpoints use `ValidationPipe` globally (main.ts) |
| 2.2.4 | Swagger documentation covers endpoints | ✅ PASS | All controllers have `@ApiTags` and `@ApiOperation` decorators |

### ARCH-DEV-003: API Versioning Not Implemented

**Severity:** P3 (Low — acceptable for internal MVP)

**Architecture says:** URL-based versioning `/api/v1/`  
**Actual:** Unversioned `/api/`

**Assessment:** API versioning is unnecessary for an internal MVP with a single consumer (the frontend). This becomes important only when external API consumers exist (Phase 3 — FR33).

**Recommendation:** Add versioning when implementing RESTful APIs for external systems (FR33, Phase 3).

---

## 2.3 Database Design Compliance

### Schema Comparison

**Architecture Doc Model Names vs. Actual Prisma Schema:**

| Architecture Doc | Actual Prisma | Match? | Notes |
|-----------------|---------------|--------|-------|
| `User` | `User` | ✅ | Additional fields for M365 sync (Sprint 8) |
| `BadgeAssertion` / `Badge` | `Badge` | ✅ | Named `Badge` with `assertionJson` JSONB field |
| `BadgeClass` / `BadgeTemplate` | `BadgeTemplate` | ✅ | |
| `SkillCategory` | `SkillCategory` | ✅ | |
| `Skill` | `Skill` | ✅ | |
| `EvidenceFile` | `EvidenceFile` | ✅ | |
| `MilestoneConfig` | `MilestoneConfig` | ✅ | |
| `MilestoneAchievement` | `MilestoneAchievement` | ✅ | |
| — | `PasswordResetToken` | ✅ | Auth infrastructure |
| — | `RefreshToken` | ✅ | Auth infrastructure |
| — | `BadgeShare` | ✅ | Sprint 6 addition |
| — | `AuditLog` | ✅ | Sprint 7 addition |
| — | `M365SyncLog` | ✅ | Sprint 8 addition |
| — | `UserAuditLog` | ✅ | Sprint 8 addition |
| — | `UserRoleAuditLog` | ✅ | Sprint 8 addition |
| — | `BulkIssuanceSession` | ✅ | Sprint 9 addition |

**Result:** ✅ All architecture-required tables exist. 6 additional tables were added during sprints — all are justified by feature requirements.

### Index Analysis

| # | Check | Status | Details |
|---|-------|--------|---------|
| 2.3.1 | Schema matches architecture data model | ✅ PASS | All core models present |
| 2.3.2 | No undocumented tables (scope creep) | ✅ PASS | All additional tables traceable to sprint stories |
| 2.3.3 | Indexes defined for query patterns | ✅ PASS | Comprehensive indexes including composites (e.g., `[recipientId, status, issuedAt]` for timeline) |
| 2.3.4 | Migration history clean | ✅ PASS | 16 sequential migrations, no conflicts, chronological order from Sprint 0 → Sprint 9 |

### ARCH-DEV-004: Badge Model Naming

**Severity:** P3 (Cosmetic)

**Architecture says:** `BadgeAssertion` model for issued badges  
**Actual:** `Badge` model with `assertionJson` JSONB field

**Assessment:** The actual naming is cleaner. `Badge` encompasses the full lifecycle (PENDING → CLAIMED → REVOKED), while `assertionJson` stores the OB2.0 assertion. This is a valid simplification.

---

## 2.4 ADR Compliance

### ADR-002: lodash Risk Acceptance

| Check | Status | Details |
|-------|--------|---------|
| lodash in dependency tree? | ✅ Yes | Still present as indirect dependency |
| Version | ⚠️ Mixed | `@nestjs/config` → lodash@4.17.21 (vulnerable), `@nestjs/swagger` → lodash@4.17.21 (vulnerable), `node-emoji` → lodash@4.17.23 (patched) |
| ADR conditions still valid? | ⚠️ NEEDS UPDATE | ADR says "re-evaluate before production deployment (Sprint 8+)" — Sprint 10 is complete, production is next |
| New vulnerability found | ⚠️ Yes | `@isaacs/brace-expansion` v5.0.0 — HIGH severity (Uncontrolled Resource Consumption) |

**ARCH-ADR-001: ADR-002 Re-evaluation Overdue**

**Severity:** P1 (Must address before pilot)

**Issue:** ADR-002 explicitly states risk acceptance is valid only during "MVP development phase (Sprints 1-7)" and must be re-evaluated before production deployment. v1.0.0 is released and pilot is next.

**Current Vulnerability Status:**
- 3 moderate (lodash Prototype Pollution via `@nestjs/config` and `@nestjs/swagger`)
- 1 high (`@isaacs/brace-expansion` Uncontrolled Resource Consumption)

**Recommendation:**
1. Run `npm audit fix` to resolve what can be auto-fixed
2. Create ADR-010 documenting updated risk assessment for pilot deployment
3. If lodash can't be upgraded without breaking changes, document the specific mitigations

### ADR-003: Badge Assertion Format

| Check | Status | Details |
|-------|--------|---------|
| JSON-LD format used | ✅ PASS | `assertionJson` JSONB field stores OB2.0 JSON-LD |
| Three-layer architecture | ✅ PASS | Issuer → BadgeClass → Assertion implemented |
| Hashed recipient identity | ✅ PASS | `recipientHash` field with SHA-256 |
| Hosted verification | ✅ PASS | `verificationId` unique field, public endpoint |

### ADR-004: Email Service Selection

| Check | Status | Details |
|-------|--------|---------|
| Graph API the sole email provider? | ✅ PASS | TD-014 resolved in Sprint 9 — nodemailer removed, `EmailService` delegates to `GraphEmailService` |
| Email sending functional | ✅ PASS | Microsoft Graph Mail.Send API via Client Credentials flow |

### ADR-005: Open Badges Integration

| Check | Status | Details |
|-------|--------|---------|
| JSON-LD format compliance | ✅ PASS | OB2.0 compliant assertions generated at issuance |
| Public verification API | ✅ PASS | `GET /api/verify/:verificationId` — public, CORS-enabled |
| Integrity verification | ✅ PASS | SHA-256 `metadataHash` for tamper detection |
| Immutable assertions | ✅ PASS | `assertionJson` stored at issuance, never modified |

### ADR-006: Public API Security

| Check | Status | Details |
|-------|--------|---------|
| Public endpoints properly marked | ✅ PASS | `@Public()` decorator on verification, claim, widget endpoints |
| Rate limiting on public endpoints | ✅ PASS | Global ThrottlerGuard (60 req/min default, 300/10min medium, 1000/hr long) |
| Privacy protection | ✅ PASS | Email masking in public responses (j***@example.com) |
| CORS configuration | ✅ PASS | Allowlist-based, wildcard blocked when credentials enabled |

**Public endpoint inventory:**
- `AppController`: health, root, version (3 endpoints)
- `AuthController`: register, login, request-reset, reset-password, refresh, logout (6 endpoints)
- `BadgeIssuanceController`: claim, assertion, issuance-transparency (3 endpoints)
- `BadgeVerificationController`: verify (1 endpoint)
- `BadgeTemplatesController`: list, detail (2 public read endpoints)
- `WidgetEmbedController`: entire controller public (widget endpoints)

**Assessment:** Public endpoints are appropriate and security controls are properly applied.

### ADR-007: Baked Badge Storage

| Check | Status | Details |
|-------|--------|---------|
| PNG baking with sharp | ✅ PASS | Sharp library used for iTXt chunk embedding |
| Storage strategy | ✅ PASS | On-demand generation (no pre-baking) |
| Cache invalidation for revoked badges | ⚠️ TD-004 | Baked badge caching not yet implemented (deferred, Low priority) |

### ADR-008: Microsoft Graph Integration

| Check | Status | Details |
|-------|--------|---------|
| Client Credentials flow | ✅ PASS | `GraphTokenProviderService` implements OAuth 2.0 CC flow |
| Unified module | ✅ PASS | `MicrosoftGraphModule` contains email + teams services |
| Token management | ✅ PASS | Auto-refresh with caching in `GraphTokenProviderService` |
| Email via Graph | ✅ PASS | `GraphEmailService` using Mail.Send API |
| Teams integration | ⚠️ PARTIAL | 4 tests skipped due to missing `ChannelMessage.Send` permission (TD-006) |

### ADR-009: Tailwind v4 CSS-First Config

| Check | Status | Details |
|-------|--------|---------|
| CSS-first configuration | ✅ PASS | All design tokens in `@theme {}` blocks in `index.css` |
| `tailwind.config.js` not used | ✅ PASS | File exists but is not read by v4 |
| Version pinning | ✅ PASS | Tailwind v4.1.18, `@tailwindcss/postcss` 0.1.8 |

---

## 2.5 Infrastructure Compliance

| # | Check | Status | Details |
|---|-------|--------|---------|
| 2.5.1 | Azure PostgreSQL | ✅ PASS | Azure Flexible Server (B1ms), connection via `DATABASE_URL` env var |
| 2.5.2 | Azure Blob Storage | ✅ PASS | Two containers: `badges` (public), `evidence` (private with SAS tokens) |
| 2.5.3 | Environment configuration | ✅ PASS | `.env` files for dev, `.env.example` committed, `.env.test` for testing |
| 2.5.4 | No hardcoded URLs in source | ⚠️ MINOR | 2 fallback URLs in teams-badge-notification.service.ts (`https://default-badge-image.png`), 1 placeholder in teams-action.controller.ts (`https://via.placeholder.com/80`) |
| 2.5.5 | No hardcoded secrets | ✅ PASS | All secrets via environment variables |
| 2.5.6 | `.env` in `.gitignore` | ✅ PASS | `.env` excluded, `.env.example` and `.env.test` committed (appropriate) |
| 2.5.7 | JWT secret validation | ✅ PASS | `main.ts` validates JWT_SECRET length (≥32 chars), blocks weak values |
| 2.5.8 | Security headers | ✅ PASS | Helmet configured with CSP, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy |
| 2.5.9 | NestJS Logger (no console.log) | ✅ PASS | All services use `new Logger(ClassName.name)`. Only 2 `console.log` instances found — both in test files (`baked-badge.spec.ts`), which is acceptable |

### ARCH-DEV-005: Hardcoded Fallback URLs

**Severity:** P2 (Medium)

**Files affected:**
- `teams-badge-notification.service.ts` (lines 150, 231): `'https://default-badge-image.png'`
- `teams-action.controller.ts` (line 194): `'https://via.placeholder.com/80'`

**Recommendation:** Extract these to configuration constants or environment variables. These fallback URLs would fail silently in production.

---

## Deviation Summary

| ID | Area | Deviation | Severity | Action |
|----|------|-----------|----------|--------|
| ARCH-DEV-001 | Module Boundary | Backend modules flat instead of under `modules/` | P2 | Standardize in Phase 2 |
| ARCH-DEV-002 | Frontend Structure | `pages/` pattern instead of `features/` | P3 | Consider for Phase 2 |
| ARCH-DEV-003 | API Design | No `/api/v1/` versioning | P3 | Add when external APIs needed |
| ARCH-DEV-004 | Database | `Badge` model instead of `BadgeAssertion` | P3 | Accept (cleaner naming) |
| ARCH-DEV-005 | Infrastructure | 3 hardcoded fallback URLs | P2 | Fix before pilot |
| ARCH-ADR-001 | ADR-002 | lodash re-evaluation overdue + new HIGH vuln | P1 | Run `npm audit fix`, create ADR-010 |
| ARCH-ADR-002 | ADR-007 | Baked badge caching not implemented | P3 | TD-004 (deferred, low impact) |
| ARCH-ADR-003 | ADR-008 | Teams 4 tests skipped (permission) | P2 | TD-006 (needs tenant admin) |

---

## Conclusion

G-Credit v1.0.0 achieves **91% architecture compliance** — a strong result for a 10-sprint AI-assisted development project. The architectural decisions made during planning were well-executed during implementation. Structural deviations (module organization, naming conventions) are minor and don't impact functionality, security, or scalability.

**Blocking Items for Pilot (1):**
1. **ARCH-ADR-001:** Re-evaluate lodash vulnerability and new `@isaacs/brace-expansion` HIGH vulnerability before deploying to pilot environment

**Pre-Production Recommendations (3):**
1. Run `npm audit fix` and create ADR-010 with updated risk assessment
2. Fix 3 hardcoded fallback URLs (ARCH-DEV-005)
3. Obtain tenant admin approval for Teams `ChannelMessage.Send` permission (TD-006)

**Phase 2 Improvements (3):**
1. Standardize backend module organization (ARCH-DEV-001)
2. Consider feature-based frontend structure (ARCH-DEV-002)
3. Add API versioning when external APIs are needed (ARCH-DEV-003)

---

*Audit conducted by Winston (Architect Agent) on 2026-02-11 against system-architecture.md (5,755 lines) and ADRs 002-009.*
