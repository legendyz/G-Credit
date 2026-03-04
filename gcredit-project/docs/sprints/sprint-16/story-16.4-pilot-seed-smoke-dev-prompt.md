# Dev Prompt — Story 16.4: Pilot Seed Data + Smoke Test

> **Sprint**: 16 — RBAC Pilot Readiness  
> **Story**: 16.4  
> **Estimate**: 2h  
> **Dependencies**: 16.1 + 16.2 + 16.3 (all done — ownership guards in place)  
> **Branch**: `sprint-16/f1-rbac-pilot-readiness` (continue on current branch)  

---

## Objective

Create a **pilot-ready seed dataset** and an **end-to-end smoke test script** that validates the complete G-Credit workflow with realistic L&D (Learning & Development) data. The seed must demonstrate RBAC ownership isolation (Sprint 16 F-1 feature).

---

## Deliverables

### 1. Pilot Seed Script — `backend/prisma/seed-pilot.ts`

**Reference**: Follow patterns from existing `prisma/seed-uat.ts` (1614 lines).

#### Data Requirements

| Entity | Count | Details |
|--------|-------|---------|
| **Admin** | 1 | `pilot-admin@gcredit.com`, role `ADMIN` |
| **Issuers** | 3 | L&D trainers with distinct names/departments. Each creates their own templates (ownership isolation test) |
| **Employees** | 10 | Across 3+ departments, some with `managerId` hierarchy |
| **Skill Categories** | 3 | e.g., "Technical Skills", "Leadership", "Compliance" |
| **Skills** | 8-10 | Distributed across categories |
| **Badge Templates** | 5 | Created by different Issuers (min 2 templates per Issuer-A, 2 per Issuer-B, 1 per Issuer-C). Categories: skill, certification, participation. All `ACTIVE` status |
| **Badges** | 15+ | Mixed states: ~10 `CLAIMED`, ~3 `PENDING`, ~1 `REVOKED`, ~1 `EXPIRED`. Issued by the Issuer who owns each template |
| **Evidence** | 3+ | Mix of `FILE` and `URL` types |
| **Badge Shares** | 2+ | Some badges shared |

#### Key Design Rules

1. **Fixed UUID scheme** — Use deterministic UUIDs like seed-uat.ts:
   ```typescript
   const PILOT_IDS = {
     admin:    '00000000-0000-4000-b000-000000000001',
     issuerA:  '00000000-0000-4000-b000-000000000010',
     issuerB:  '00000000-0000-4000-b000-000000000011',
     issuerC:  '00000000-0000-4000-b000-000000000012',
     // ... employees b000-000000000020 through b000-000000000029
     // ... templates b000-000000000100 through b000-000000000104
     // ... badges b000-000000000200+
   };
   ```
   Use `b` prefix (not `a` like UAT) to avoid UUID collisions with seed-uat data.

2. **Production guard**: `if (process.env.NODE_ENV === 'production') { process.exit(1); }`

3. **Idempotent**: Use `upsert` or cleanup-then-create pattern (delete in FK-safe order first)

4. **Cleanup order** (FK-safe):
   ```
   BadgeShare → EvidenceFile → Badge → BadgeTemplate skills disconnect → BadgeTemplate → Skill → SkillCategory → User
   ```
   Filter by pilot UUIDs only — must NOT delete UAT seed data.

5. **Passwords**: All users use `Password123` + bcrypt hash (10 rounds), same as UAT seed

6. **Ownership correctness**: Each badge must be issued by the Issuer who owns the template (`badge.issuerId === template.createdBy`). This is critical for demonstrating Sprint 16 F-1.

7. **Realistic L&D names**:
   - Templates: "Cloud Architecture Fundamentals", "Agile Scrum Master", "Data Privacy Compliance", "Leadership Essentials", "Python for Data Science"
   - Issuers: L&D department trainers
   - Employees: Across Engineering, Marketing, Finance departments

#### Code Structure (follow seed-uat.ts pattern)

```typescript
import { PrismaClient, UserRole, TemplateStatus, BadgeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('PILOT SEED: cannot run in production');
    process.exit(1);
  }

  console.log('🌱 Seeding pilot data...');

  // 1. Cleanup (FK-safe order, pilot IDs only)
  // 2. Create users (admin, issuers, employees)
  // 3. Create skill categories + skills
  // 4. Create badge templates (with skills + createdBy)
  // 5. Create badges (with issuerId === template.createdBy)
  // 6. Create evidence
  // 7. Create badge shares
  // 8. Summary log

  console.log('✅ Pilot seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### Helper Functions Needed (copy from seed-uat.ts)

- `hashEmail(email)` — SHA-256 for assertion
- `makeAssertion(badge, recipientEmail)` — OpenBadges v2 assertion JSON
- `canonicalJson(obj)` — deterministic JSON stringify
- `hashAssertion(assertion)` — SHA-256 of canonical assertion

### 2. Package.json Update

Add to `backend/package.json` scripts:
```json
"seed:pilot": "ts-node prisma/seed-pilot.ts"
```

### 3. Smoke Test Script — `scripts/pilot-smoke-test.ps1`

**Reference**: Follow patterns from `backend/test-scripts/uat-lifecycle-test.ps1`.

#### Test Scenarios (8 steps)

| # | Test | Method | Endpoint | Role | Expected |
|---|------|--------|----------|------|----------|
| 1 | Admin login | POST | `/api/auth/login` | ADMIN | 200 + cookie |
| 2 | Issuer-A login | POST | `/api/auth/login` | ISSUER | 200 + cookie |
| 3 | Issuer-A sees only own templates | GET | `/api/badge-templates` | ISSUER-A | Only templates where `createdBy === issuerA.id` |
| 4 | Issuer-A issues badge using own template | POST | `/api/badges/issue` | ISSUER-A | 201 |
| 5 | Issuer-A cannot issue using Issuer-B template | POST | `/api/badges/issue` | ISSUER-A | 403 |
| 6 | Employee login + sees badge in wallet | GET | `/api/badges/wallet` | EMPLOYEE | Contains the issued badge |
| 7 | Public badge verification | GET | `/api/badges/verify/:hash` | (none) | 200 + valid badge data |
| 8 | Admin sees all templates | GET | `/api/badge-templates` | ADMIN | Contains all 5 templates |

#### Script Structure

```powershell
# pilot-smoke-test.ps1
# Requires: Backend running on localhost:3000 + pilot seed data loaded

param(
    [string]$BaseUrl = "http://localhost:3000"
)

$passed = 0
$failed = 0
$total = 8

function Log-Result {
    param([string]$Name, [bool]$Pass, [string]$Detail = "")
    if ($Pass) {
        Write-Host "  ✅ PASS: $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  ❌ FAIL: $Name — $Detail" -ForegroundColor Red
        $script:failed++
    }
}

# Important: Use -UseBasicParsing and handle cookies manually
# Login returns httpOnly cookies (Sprint 11 — no tokens in response body)

# ... test steps ...

Write-Host "`n📊 Results: $passed/$total passed, $failed failed"
```

#### Cookie Handling Note

Since Sprint 11.6 (httpOnly cookies), login does NOT return tokens in the response body. The smoke test must:
1. Use `Invoke-WebRequest` (not `Invoke-RestMethod`) to capture cookies
2. Extract `Set-Cookie` header from login response
3. Pass cookie in subsequent requests via `-Headers @{ Cookie = $cookie }`

Or alternatively, use a `WebSession` object:
```powershell
$loginResponse = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" `
    -Method POST -ContentType "application/json" `
    -Body '{"email":"issuer-a@pilot.gcredit.com","password":"Password123"}' `
    -SessionVariable session

# Subsequent requests use -WebSession $session
$templates = Invoke-RestMethod -Uri "$BaseUrl/api/badge-templates" `
    -WebSession $session
```

### 4. Story Doc Update

After development, update `16-4-pilot-seed-smoke-test.md`:
- Check all ACs
- Fill Dev Agent Record (agent model, completion notes, file list)
- Set Status to `dev-complete`

---

## Constraints

- **Do NOT modify any production source code** (controllers, services, etc.)
- **Do NOT modify existing seed-uat.ts** — pilot seed is a separate file
- Pilot UUIDs must not collide with UAT UUIDs (use `b000` prefix)
- Smoke test must work against `localhost:3000` with pilot seed loaded
- All user passwords: `Password123`

## Files to Create/Modify

| Action | File |
|--------|------|
| **CREATE** | `backend/prisma/seed-pilot.ts` |
| **CREATE** | `scripts/pilot-smoke-test.ps1` |
| **MODIFY** | `backend/package.json` — add `seed:pilot` script |
| **MODIFY** | `docs/sprints/sprint-16/16-4-pilot-seed-smoke-test.md` — update status + ACs |

## Verification

After implementation:
1. `cd backend && npx ts-node prisma/seed-pilot.ts` — should complete without errors
2. Start backend: `npm run start:dev`
3. `cd scripts && .\pilot-smoke-test.ps1` — should show 8/8 PASS
4. `npx eslint prisma/seed-pilot.ts` — 0 errors
