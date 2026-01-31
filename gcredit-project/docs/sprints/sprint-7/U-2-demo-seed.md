# Story U.2a: M365 User Sync for Demo Seed (MVP)

**Story ID:** Story U.2a (Split from U.2)  
**Epic:** UAT Phase  
**Sprint:** Sprint 7  
**Priority:** HIGH  
**Story Points:** 5 → **6** ⚠️ **UPDATED**  
**Status:** Backlog  
**Last Updated:** February 1, 2026 (Post-Technical Review)

---

## ⚠️ SECURITY UPDATES & MVP SCOPE (Feb 1, 2026)

This story has been split into **MVP (U.2a)** and **Production Hardening (U.2b - Sprint 8)** following Security Review.

**🔴 CRITICAL SECURITY FIXES (Must Implement):**
1. ✅ **YAML → .env Migration** - Role mapping via environment variables (NOT YAML file in Git)
2. ✅ **Production Guard** - `NODE_ENV === 'production'` check prevents accidental sync
3. ✅ **Fallback Strategy** - Auto-fallback to local mode if M365 API fails

**MVP Scope (Sprint 7 - This Story):**
- ✅ GraphUsersService for M365 API integration
- ✅ .env-based role mapping (security fix)
- ✅ Support <100 users (Product Owner org has ~15 users)
- ✅ Production guard (prevent accidental data wipe)
- ✅ Basic error handling (fail-fast with clear messages)
- ✅ Local mode fallback

**Deferred to Story U.2b (Sprint 8):**
- ⏸️ Pagination support (1000+ users)
- ⏸️ Retry logic with exponential backoff (ADR-008 compliance)
- ⏸️ Audit logging (who synced, when, how many users)
- ⏸️ User deactivation sync (deleted M365 users → deactivate in GCredit)
- ⏸️ Comprehensive error recovery

**Why Split:**
- Architecture review found 5 P0 security issues (7.5h → 12.5-14.5h with all fixes)
- UAT only needs ~15 users (Product Owner's org size)
- Pagination/retry/audit not critical for Sprint 7
- MVP delivers realistic UAT data without production risks

**Estimate Updated:**
- Original: 7.5 hours (with YAML config)
- **Revised MVP: 6 hours** (simpler .env config + security guard)

**Prerequisites:**
- ⚠️ **Product Owner MUST verify Azure User.Read.All permission before Day 3**
- Verify in Azure Portal → App registrations → API permissions

**References:**
- Architecture Review: See `architecture-review-story-u2.md`
- Developer Review: See meeting minutes Part 3
- Meeting Minutes: See `sprint-7-technical-review-meeting-minutes.md`

---

## User Story

**As a** QA/Developer,  
**I want** a script to generate comprehensive demo seed data (from local fixtures OR Microsoft 365 organization),  
**So that** UAT testing is efficient, repeatable, and uses realistic user accounts.

---

## Background / Context

UAT testing (Story U.1) requires realistic, comprehensive test data including:
- Multiple user roles (Admin, Issuer, Manager, Employee)
- Badge templates (various types, some with/without competencies)
- Issued badges (various statuses: ISSUED, CLAIMED, REVOKED)
- Historical data (dates spanning several months)

Manual data creation is:
- Time-consuming (30+ min per UAT session)
- Error-prone (forgot edge cases)
- Not repeatable (different data each time)

A seed script provides:
- One-command setup (`npm run seed:demo`)
- **Two modes:** Local fixtures OR sync from Microsoft 365 Developer E5 organization
- Consistent test data
- Coverage of all test scenarios
- Fast reset (drop + re-seed in <1 min)

**Microsoft 365 Integration (Optional):**
For more realistic UAT testing, the script can sync users from an existing M365 Developer E5 subscription:
- Reads real user accounts from M365 organization
- Maps M365 users to GCredit roles (via YAML config file)
- Provides realistic names, emails, departments
- Enables testing with actual Teams integration

---

## Acceptance Criteria

### AC1: Seed Script Command
**Given** I have a clean database  
**When** I run `npm run seed:demo`  
**Then** Demo data is created in <60 seconds

- [x] Command: `npm run seed:demo` (in backend package.json)
- [x] Script location: `backend/prisma/seed-demo.ts`
- [x] Idempotent: Can run multiple times (drops existing demo data first)
- [x] Console output shows progress (e.g., "Creating users...", "Creating badges...")

### AC2: User Accounts Created
- [x] 4 users with predictable credentials:
  ```
  Admin:     admin@example.com     / testpass123
  Issuer:    issuer@example.com    / testpass123
  Manager:   manager@example.com   / testpass123
  Employee:  employee@example.com  / testpass123
  ```
- [x] All users have full names (e.g., "Admin User", "John Employee")
- [x] Passwords hashed with bcrypt (same as production)
- [x] Roles assigned correctly (ADMIN, ISSUER, MANAGER, EMPLOYEE)

### AC3: Badge Templates Created
- [x] 5 diverse badge templates:
  1. **Advanced React Development** (with 3 competencies)
  2. **DevOps Fundamentals** (with 2 competencies)
  3. **Leadership Excellence** (no competencies)
  4. **Python Programming** (with 4 competencies)
  5. **Security Awareness** (with 1 competency)
- [x] Templates owned by Issuer user
- [x] Mix of technical and soft skills
- [x] Realistic descriptions and criteria

### AC4: Badge Issuance (Various Statuses)
- [x] 10+ badges issued with diverse statuses:
  - 3 badges: **ISSUED** (not yet claimed by employee)
  - 4 badges: **CLAIMED** (active, employee claimed)
  - 3 badges: **REVOKED** (with different revocation reasons)
- [x] Badges issued to Employee user
- [x] Issuance dates span last 3 months (realistic timeline)
- [x] Revoked badges have revocation date, reason, notes

### AC5: Edge Case Data
- [x] 1 expired badge (issued >1 year ago)
- [x] 1 badge with very long description (test truncation)
- [x] 1 badge with special characters in name (test encoding)
- [x] 1 badge issued by Manager (not Issuer) to test authz

### AC6: Data Reset Script
- [x] Command: `npm run seed:reset` (drops all data, re-seeds)
- [x] Prompts for confirmation: "This will delete all data. Continue? (y/n)"
- [x] Uses Prisma cascade deletes (safe cleanup)

### AC7: Microsoft 365 User Sync (MVP) ⚠️ **SECURITY UPDATED**
**Given** I have M365 Developer E5 subscription with demo organization  
**When** I run `npm run seed:m365`  
**Then** Real M365 users are synced to GCredit database

- [x] Command: `npm run seed:m365` (uses M365 mode)
- [x] Environment variable: `SEED_MODE=m365` triggers M365 sync
- [x] **NEW:** Production guard checks `NODE_ENV` first:
  ```typescript
  if (process.env.NODE_ENV === 'production') {
    throw new Error('M365 sync not allowed in production. Use manual provisioning.');
  }
  ```
- [x] Calls Microsoft Graph API `/users` endpoint
- [x] **MVP:** No pagination (works for <100 users, Product Owner has ~15)
- [x] Filters active users only: `accountEnabled eq true and userType eq 'Member'`
- [x] **SECURITY FIX:** Reads role mapping from `.env` file (NOT YAML)
- [x] Maps M365 emails → GCredit roles via env variables
- [x] Uses consistent test password from `.env`
- [x] Console output shows: "✅ Synced 15 users from M365 organization"
- [x] **NEW:** Auto-fallback to local mode if M365 API fails

### AC8: Role Mapping via Environment Variables ⚠️ **SECURITY FIX**
- [x] **CHANGED:** Configuration via `.env` file (NOT YAML in Git)
- [x] .env structure:
  ```bash
  # M365 User Sync Configuration (DO NOT COMMIT REAL VALUES)
  SEED_MODE=local  # or 'm365' for M365 sync
  
  # Role mapping (M365 email -> GCredit role)
  M365_ADMIN_EMAIL=admin@yourdomain.onmicrosoft.com
  M365_ISSUER_EMAIL=issuer@yourdomain.onmicrosoft.com  
  M365_MANAGER_EMAIL=manager@yourdomain.onmicrosoft.com
  # All other M365 users default to EMPLOYEE
  
  # Default password for synced users
  M365_DEFAULT_PASSWORD=TestPass123!
  ```
- [x] `.env.example` provided with placeholder values
- [x] Real `.env` added to `.gitignore` (prevent email exposure)
- [x] Validation: Script checks required env vars present
- [x] Default role: Users not in mapping → EMPLOYEE

**Rationale for .env over YAML:**
- 🔐 Real employee emails never committed to Git history
- 🔐 GDPR compliance (no PII in version control)
- 🔐 Easier to manage per-environment (dev, staging, UAT)
  ```yaml
  roleMapping:
    admin@yourdomain.onmicrosoft.com: ADMIN
    issuer@yourdomain.onmicrosoft.com: ISSUER
    manager@yourdomain.onmicrosoft.com: MANAGER
    # All others default to EMPLOYEE
  
  defaultPassword: "TestPass123!"
  
  syncOptions:
    onlyActiveUsers: true
    skipGuestUsers: true
    updateExisting: true
  ```
- [x] Validation: Script validates YAML syntax on startup
- [x] Default role: Users not in mapping → EMPLOYEE
- [x] Comments in YAML explain each setting

---

## Non-Functional Requirements

### Performance
- [x] Seed script completes in <60 seconds
- [x] Uses batch inserts where possible (Prisma `createMany`)

### Reliability
- [x] Script handles existing data gracefully (delete first)
- [x] Script validates data before insert (no orphan records)
- [x] Error messages clear if script fails

### Security
- [x] Demo data clearly marked (emails use @example.com)
- [x] Passwords are test-only (testpass123)
- [x] Script never runs in production (env check)

---

## Technical Details

### File Structure
```
backend/
  config/
    m365-role-mapping.yaml      # M365 user → role mapping (NEW)
  prisma/
    seed-demo.ts                # Main seed script (supports 2 modes)
    seed-reset.ts               # Reset script (drop + re-seed)
  src/
    microsoft-graph/
      services/
        graph-users.service.ts  # M365 user sync service (NEW)
  package.json                  # Add scripts
```

### Package.json Scripts
```json
{
  "scripts": {
    "seed:demo": "ts-node prisma/seed-demo.ts",
    "seed:m365": "SEED_MODE=m365 ts-node prisma/seed-demo.ts",
    "seed:reset": "ts-node prisma/seed-reset.ts"
  }
}
```

### GraphUsersService Implementation (NEW)
```typescript
// backend/src/microsoft-graph/services/graph-users.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { GraphTokenProviderService } from './graph-token-provider.service';

export interface M365User {
  id: string;
  mail: string;
  displayName: string;
  jobTitle?: string;
  department?: string;
  accountEnabled: boolean;
}

@Injectable()
export class GraphUsersService {
  private readonly logger = new Logger(GraphUsersService.name);
  private graphClient: Client;

  constructor(private readonly tokenProvider: GraphTokenProviderService) {
    const authProvider = this.tokenProvider.getAuthProvider();
    this.graphClient = Client.initWithMiddleware({ authProvider });
  }

  /**
   * Get all active users from M365 organization
   * Filters out disabled accounts and guest users
   */
  async getOrganizationUsers(): Promise<M365User[]> {
    try {
      const response = await this.graphClient
        .api('/users')
        .select('id,mail,displayName,jobTitle,department,accountEnabled')
        .filter('accountEnabled eq true and userType eq \'Member\'')
        .get();

      this.logger.log(`✅ Retrieved ${response.value.length} users from M365`);
      return response.value;
    } catch (error) {
      this.logger.error('❌ Failed to get M365 users', error);
      throw error;
    }
  }
}
```

### Role Mapping YAML Schema
```yaml
# backend/config/m365-role-mapping.yaml
# Microsoft 365 User → GCredit Role Mapping
# Used when running: npm run seed:m365

roleMapping:
  # === Admins (Full System Access) ===
  admin@yourdomain.onmicrosoft.com: ADMIN
  
  # === Issuers (Badge Issuance) ===
  issuer@yourdomain.onmicrosoft.com: ISSUER
  hr-manager@yourdomain.onmicrosoft.com: ISSUER
  
  # === Managers (View Team Badges) ===
  team-lead@yourdomain.onmicrosoft.com: MANAGER
  project-manager@yourdomain.onmicrosoft.com: MANAGER
  
  # NOTE: All other M365 users default to EMPLOYEE role

# Password for UAT testing (all users get same password)
defaultPassword: "TestPass123!"

# Sync options
syncOptions:
  onlyActiveUsers: true   # Only sync accountEnabled = true
  skipGuestUsers: true    # Skip userType = Guest
  updateExisting: true    # Update displayName if user already exists
```

### Seed Script Outline (Hybrid Mode)
```typescript
// backend/prisma/seed-demo.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { GraphUsersService } from '../src/microsoft-graph/services/graph-users.service';

const prisma = new PrismaClient();

// Detect seed mode from environment variable
const SEED_MODE = process.env.SEED_MODE || 'local'; // 'local' | 'm365'

async function main() {
  console.log(`🌱 Seeding demo data (mode: ${SEED_MODE})...`);
  
  // 1. Clear existing demo data
  console.log('🧹 Cleaning existing data...');
  await prisma.badge.deleteMany({ 
    where: { recipient: { email: { endsWith: '@example.com' } } }
  });
  await prisma.badgeTemplate.deleteMany({ 
    where: { creator: { email: { endsWith: '@example.com' } } }
  });
  await prisma.user.deleteMany({ 
    where: { email: { endsWith: '@example.com' } }
  });
  
  // 2. Create users (local OR M365 mode)
  console.log('👤 Creating users...');
  
  let admin, issuer, manager, employee;
  
  if (SEED_MODE === 'm365') {
    // === M365 SYNC MODE ===
    console.log('🔄 Syncing users from Microsoft 365...');
    
    // Load role mapping config
    const configPath = './config/m365-role-mapping.yaml';
    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configFile) as any;
    
    // Initialize NestJS context to access GraphUsersService
    const app = await NestFactory.createApplicationContext(AppModule);
    const graphUsersService = app.get(GraphUsersService);
    
    // Fetch M365 users
    const m365Users = await graphUsersService.getOrganizationUsers();
    console.log(`📥 Retrieved ${m365Users.length} users from M365`);
    
    // Hash default password
    const hashedPassword = await bcrypt.hash(
      config.defaultPassword || 'TestPass123!',
      10
    );
    
    // Sync users to database
    for (const m365User of m365Users) {
      const role = config.roleMapping[m365User.mail] || 'EMPLOYEE';
      
      await prisma.user.upsert({
        where: { email: m365User.mail },
        create: {
          email: m365User.mail,
          password: hashedPassword,
          name: m365User.displayName,
          role: role,
        },
        update: config.syncOptions.updateExisting 
          ? { name: m365User.displayName }
          : {},
      });
      
      console.log(`  ✅ ${m365User.displayName} → ${role}`);
    }
    
    // Get reference users for seeding badges
    admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    issuer = await prisma.user.findFirst({ where: { role: 'ISSUER' } });
    manager = await prisma.user.findFirst({ where: { role: 'MANAGER' } });
    employee = await prisma.user.findFirst({ where: { role: 'EMPLOYEE' } });
    
    await app.close();
    
  } else {
    // === LOCAL FIXTURES MODE ===
    console.log('📦 Creating local fixture users...');
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
  
  const issuer = await prisma.user.create({
    data: {
      email: 'issuer@example.com',
      password: hashedPassword,
      name: 'Jane Issuer',
      role: 'ISSUER'
    }
  });
  
  const manager = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      password: hashedPassword,
      name: 'Mike Manager',
      role: 'MANAGER'
    }
  });
  
  const employee = await prisma.user.create({
    data: {
      email: 'employee@example.com',
      password: hashedPassword,
      name: 'John Employee',
      role: 'EMPLOYEE'
    }
  });
  
  // 3. Create badge templates
  console.log('🎨 Creating badge templates...');
  const reactTemplate = await prisma.badgeTemplate.create({
    data: {
      name: 'Advanced React Development',
      description: 'Demonstrates advanced React skills including hooks, context, and performance optimization.',
      imageUrl: 'https://example.com/badges/react.png',
      criteria: 'Completed 5+ React projects, passed certification exam',
      competencies: ['React Hooks', 'State Management', 'Performance Optimization'],
      creatorId: issuer.id
    }
  });
  
  const devopsTemplate = await prisma.badgeTemplate.create({
    data: {
      name: 'DevOps Fundamentals',
      description: 'Foundational DevOps skills including CI/CD, Docker, and Kubernetes.',
      imageUrl: 'https://example.com/badges/devops.png',
      criteria: 'Deployed 3+ applications using CI/CD pipelines',
      competencies: ['CI/CD', 'Docker'],
      creatorId: issuer.id
    }
  });
  
  // ... create 3 more templates ...
  
  // 4. Issue badges (various statuses)
  console.log('🏅 Issuing badges...');
  
  // CLAIMED badges (active)
  const badge1 = await prisma.badge.create({
    data: {
      templateId: reactTemplate.id,
      recipientId: employee.id,
      issuedById: issuer.id,
      issuedAt: new Date('2026-01-15'),
      claimedAt: new Date('2026-01-16'),
      status: 'CLAIMED'
    }
  });
  
  // ISSUED badges (not yet claimed)
  const badge2 = await prisma.badge.create({
    data: {
      templateId: devopsTemplate.id,
      recipientId: employee.id,
      issuedById: issuer.id,
      issuedAt: new Date('2026-01-20'),
      status: 'ISSUED'
    }
  });
  
  // REVOKED badges
  const badge3 = await prisma.badge.create({
    data: {
      templateId: reactTemplate.id,
      recipientId: employee.id,
      issuedById: issuer.id,
      issuedAt: new Date('2025-12-01'),
      claimedAt: new Date('2025-12-02'),
      status: 'REVOKED',
      revokedAt: new Date('2026-01-25'),
      revokedBy: admin.id,
      revocationReason: 'Policy Violation',
      revocationNotes: 'Employee left organization'
    }
  });
  
  // ... create 7 more badges with various statuses ...
  
  console.log('✅ Demo data seeded successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('  Admin:     admin@example.com / testpass123');
  console.log('  Issuer:    issuer@example.com / testpass123');
  console.log('  Manager:   manager@example.com / testpass123');
  console.log('  Employee:  employee@example.com / testpass123');
  console.log('\n🎨 Templates created: 5');
  console.log('🏅 Badges issued: 10 (3 ISSUED, 4 CLAIMED, 3 REVOKED)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Test Plan

### Unit Tests
- [x] Script runs without errors
- [x] All expected users created (4 users)
- [x] All expected templates created (5 templates)
- [x] All expected badges created (10 badges)
- [x] Password hashing works (bcrypt verify)

### Manual Testing

**Local Mode:**
- [x] Run `npm run seed:demo` in clean database
- [x] Verify 4 users created (admin, issuer, manager, employee)
- [x] Log in with admin@example.com / testpass123

**M365 Mode (if M365 Developer E5 available):**
- [x] Configure `config/m365-role-mapping.yaml` with real M365 emails
- [x] Run `npm run seed:m365`
- [x] Verify M365 users synced (check console output count)
- [x] Verify role mappings correct (query database for roles)
- [x] Log in with real M365 account (use TestPass123!)
- [x] Verify name synced from M365 displayName

**Common Tests:**
- [x] Verify badge templates created (5 templates)
- [x] Verify badge statuses correct (ISSUED, CLAIMED, REVOKED)
- [x] Run UAT Scenario 1 with seeded data

### Validation Checks
- [x] No orphan records (all FKs valid)
- [x] Dates are realistic (not future dates)
- [x] Revoked badges have revocation metadata
- [x] Claimed badges have claimedAt timestamp

---

## Definition of Done

### Code Complete
- [x] seed-demo.ts script created
- [x] seed-reset.ts script created
- [x] package.json scripts added
- [x] Script includes console progress output
- [x] No TypeScript errors

### Testing Complete
- [x] Seed script tested on clean database
- [x] Reset script tested (drops and re-seeds)
- [x] All 4 test accounts login successfully
- [x] UAT Story U.1 can use seeded data

### Documentation Complete
- [x] README updated with seed command instructions
- [x] Seed script has inline comments explaining data
- [x] Story file updated with completion notes

---

## Estimation

### Breakdown
| Task | Hours | Assignee |
|------|-------|----------|
| Design data structure (users, templates, badges) | 0.5h | Dev |
| Write seed-demo.ts script (local mode) | 1.5h | Dev |
| **NEW: Create GraphUsersService** | 1.5h | Dev |
| **NEW: Create m365-role-mapping.yaml config** | 0.5h | Dev |
| **NEW: Integrate M365 sync in seed-demo.ts** | 1.5h | Dev |
| Write seed-reset.ts script | 0.5h | Dev |
| Test local mode and M365 mode | 1h | Dev |
| Add package.json scripts | 0.25h | Dev |
| Update documentation | 0.25h | Dev |
| **Total** | **7.5h** | |

### Confidence Level
High - Straightforward scripting work

---

## Dependencies

### Depends On
- [x] Story 0.1: Git Branch Creation

### Blocks
- Story U.1: Complete Lifecycle UAT (requires demo data)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Seed script slow (>60s) | Low | Low | Use Prisma createMany for batch inserts |
| Script fails mid-execution | Low | Medium | Wrap in transaction or add cleanup logic |
| Accidental production run | Very Low | Critical | Add env check (exit if NODE_ENV = production) |
| **M365 API rate limiting** | Low | Medium | Use exponential backoff, batch requests if needed |
| **M365 auth fails during seed** | Medium | Medium | Graceful fallback: log error, skip M365 mode, use local |
| **Role mapping config syntax error** | Medium | Low | Validate YAML on startup, show clear error message |

---

## Questions & Assumptions

### Assumptions
- **Local mode:** Demo data uses @example.com emails (clearly test data)
- **M365 mode:** Uses real M365 organization emails (*.onmicrosoft.com)
- All users share same password (TestPass123!) for ease of testing
- Seed script runs on local and test environments only (not production)
- Data is reset before each UAT session (fresh state)
- **M365 sync requires:** User.Read.All permission granted to Azure app registration
- Role mapping config must be manually created/updated (not auto-generated)

### Open Questions
- Should we add seed data for LinkedIn sharing tokens? → Not needed, manual OAuth flow
- Should we seed audit log entries? → Not in MVP, logs auto-generated
- **NEW: M365 User.Read.All permission available?** → ✅ Yes, Product Owner has M365 Developer E5 subscription with demo org
- **NEW: Should we auto-create role mapping YAML?** → No, manual config better (explicit role assignments)

---

## Timeline

**Estimated Start:** February 5, 2026 (Day 3 - morning before UAT)  
**Estimated Completion:** February 5, 2026 (Day 3 - before 10am UAT start)  
**Actual Start:** [TBD]  
**Actual Completion:** [TBD]

---

## Related Links

- **Sprint 7 Backlog:** [backlog.md](backlog.md)
- **Story U.1:** [Complete Lifecycle UAT](U-1-lifecycle-uat.md) (uses this data)
- **Prisma Schema:** [schema.prisma](../../../backend/prisma/schema.prisma)

---

## Story History

| Date | Status | Author | Notes |
|------|--------|--------|-------|
| 2026-01-31 | Backlog | Bob (Scrum Master) | Story created during planning |

---

**Next Story:** [U.3: UAT Bug Fixes](U-3-bug-fixes.md)
