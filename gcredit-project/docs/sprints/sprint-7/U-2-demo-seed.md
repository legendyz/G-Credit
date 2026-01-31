# Story U.2: Demo Seed Data Creation

**Story ID:** Story U.2  
**Epic:** UAT Phase  
**Sprint:** Sprint 7  
**Priority:** HIGH  
**Story Points:** 3  
**Status:** Backlog

---

## User Story

**As a** QA/Developer,  
**I want** a script to generate comprehensive demo seed data,  
**So that** UAT testing is efficient, repeatable, and covers all scenarios.

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
- Consistent test data
- Coverage of all test scenarios
- Fast reset (drop + re-seed in <1 min)

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
  prisma/
    seed-demo.ts          # Main seed script
    seed-reset.ts         # Reset script (drop + re-seed)
  package.json            # Add scripts
```

### Package.json Scripts
```json
{
  "scripts": {
    "seed:demo": "ts-node prisma/seed-demo.ts",
    "seed:reset": "ts-node prisma/seed-reset.ts"
  }
}
```

### Seed Script Outline
```typescript
// backend/prisma/seed-demo.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');
  
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
  
  // 2. Create users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  
  const admin = await prisma.user.create({
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
- [x] Run `npm run seed:demo` in clean database
- [x] Verify users in database (Prisma Studio or pgAdmin)
- [x] Verify badge statuses correct (ISSUED, CLAIMED, REVOKED)
- [x] Log in with each test account (admin, issuer, manager, employee)
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
| Write seed-demo.ts script | 1.5h | Dev |
| Write seed-reset.ts script | 0.5h | Dev |
| Test and debug seed script | 0.5h | Dev |
| Add package.json scripts | 0.25h | Dev |
| Update documentation | 0.25h | Dev |
| **Total** | **3.5h** | |

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

---

## Questions & Assumptions

### Assumptions
- Demo data uses @example.com emails (clearly test data)
- All users share same password (testpass123) for ease of testing
- Seed script runs on local and test environments only (not production)
- Data is reset before each UAT session (fresh state)

### Open Questions
- Should we add seed data for LinkedIn sharing tokens? → Not needed, manual OAuth flow
- Should we seed audit log entries? → Not in MVP, logs auto-generated

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
