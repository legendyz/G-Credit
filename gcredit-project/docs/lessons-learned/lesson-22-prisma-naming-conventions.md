# Lesson 22: Prisma Schema Naming Conventions and Mock Testing Pitfalls

**Date**: 2026-01-30  
**Story**: Story 7.4 (Teams Notifications)  
**Severity**: High - Caused multiple TypeScript compilation errors

## Problem

### Symptoms
Repeated TypeScript compilation errors when accessing Prisma relations:
```typescript
// ❌ Error: Property 'badgeTemplate' does not exist
const badge = await prisma.badge.findUnique({
  include: { badgeTemplate: { include: { issuer: true } } }
});
```

### Root Cause

**Mismatch between schema definition and Prisma Client API:**

```prisma
// Schema definition (schema.prisma line 52)
model badges {
  templateId                      String
  badge_templates                 badge_templates  @relation(...)
  //  ↑ Field name                ↑ Table name
}
```

**How Prisma names relations:**
- Field name in schema: `badge_templates` (snake_case, same as table)
- Generated API name: `template` (singular, camelCase, without prefix)
- NOT: `badgeTemplate` (what we incorrectly assumed)

**Why this is confusing:**
1. Database table: `badge_templates` (snake_case)
2. Foreign key field: `templateId` (camelCase)
3. Natural assumption: relation should be `badgeTemplate`
4. Actual relation name: `template` (Prisma removes redundant prefix)

## Why Tests Didn't Catch This

**Mock testing isolation (previously documented in Lesson 20):**

```typescript
// ❌ Mock can return ANY structure
mockPrisma.badge.findUnique.mockResolvedValue({
  badgeTemplate: {  // Wrong property name
    issuer: { name: 'Test' }
  }
});

// ✅ Test passes because mock returns what we tell it
expect(result).toBeDefined();
```

**The trap:**
- Jest tests: 182/182 passing ✅
- TypeScript compilation: FAILED ❌
- Runtime: Server crashes 💥

**Root issue**: Unit tests with mocks don't validate TypeScript types

## Why We Can't Just Rename Schema Relations

**Initial attempted fix:**
```prisma
model badges {
  template  badge_templates  @relation(...)
  //  ↑ Explicit naming
}
```

**What happened**: Prisma Client regeneration broke **137 files** throughout the codebase!

**Why it failed:**
- Entire codebase uses camelCase names: `prisma.user`, `prisma.badge`, `prisma.badgeTemplate`
- Prisma actually generates from table names: `prisma.users`, `prisma.badges`, `prisma.badge_templates`
- Schema was originally created with snake_case tables but code was written assuming camelCase
- Changing schema breaks all existing code

**Scope of impact:**
- Auth module: 15+ locations
- Badge issuance: 20+ locations
- Badge templates: 10+ locations
- Milestones: 8+ locations
- Skills: 12+ locations
- Evidence: 5+ locations
- Badge sharing: 8+ locations

## Correct Solution

### Immediate: Use Correct Prisma Names

**Always reference Prisma-generated types:**

```typescript
// 1. Check generated Prisma types in node_modules/.prisma/client/index.d.ts
interface PrismaClient {
  get badges(): Prisma.badgesDelegate<...>;    // NOT badge
  get users(): Prisma.usersDelegate<...>;      // NOT user
  get badge_templates(): Prisma.badge_templatesDelegate<...>;  // NOT badgeTemplate
}

// 2. Use correct relation names
const badge = await prisma.badge.findUnique({
  include: {
    template: true,     // Relation to badge_templates
    issuer: true,       // Relation to users via issuerId
    recipient: true,    // Relation to users via recipientId
  }
});

// 3. Access fields correctly
badge.template.name        // ✅ Correct
badge.badgeTemplate.name   // ❌ Wrong
badge.issuer.email         // ✅ Correct (direct relation)
badge.template.issuer.name // ❌ Wrong (no nested relation)
```

### Long-term: Schema Migration Strategy

**Option A**: Keep snake_case (recommended for existing projects)
- Pros: No breaking changes, follows PostgreSQL conventions
- Cons: Code uses different naming than database
- Action: Document relation names in schema comments

**Option B**: Migrate to camelCase
- Requires: Database migration + Prisma schema update + 100+ file updates
- Risk: High - potential data loss or service disruption
- Timeline: Requires dedicated sprint
- Decision: NOT worth it for this project size

### Development Workflow Improvements

**1. Always compile before committing:**
```bash
npm run build  # Catches type errors
npm test       # Validates logic
```

**2. Use Prisma Studio to explore schema:**
```bash
npx prisma studio  # Visual schema browser
```

**3. Generate types after schema changes:**
```bash
npx prisma generate
npx prisma format  # Auto-format schema
```

**4. Type-safe mocks (future improvement):**
```typescript
// Instead of generic mocks
const mockBadge: Prisma.badgesGetPayload<{
  include: { template: true; issuer: true }
}> = {
  // TypeScript validates structure
};
```

## Prevention Checklist

- [ ] Before writing Prisma queries, check generated types in `node_modules/.prisma/client/`
- [ ] Use VSCode autocomplete for Prisma queries (shows correct field names)
- [ ] Run `npm run build` frequently during development
- [ ] Document non-obvious relation names in schema comments
- [ ] Consider integration tests with real database for critical paths

## Files Affected (Story 7.4)

**Fixed in commit 9eb3be3:**
- `teams-badge-notification.service.ts` - Updated `badgeTemplate` → `template`
- `teams-badge-notification.service.spec.ts` - Updated mock structure
- `teams-sharing.controller.ts` - Updated relation access
- `teams-sharing.controller.spec.ts` - Updated test mocks

**Changes:**
- 4 files modified
- 128 lines deleted (incorrect mocks)
- 75 lines added (correct schema access)

## Related Documentation

- Lesson 20: Mock Testing vs Integration Testing
- Lesson 21: Story File Creation Process Gap
- [Prisma Naming Conventions](https://www.prisma.io/docs/concepts/components/prisma-schema/names-in-underlying-database)

## Key Takeaway

**Prisma's naming is auto-generated and non-obvious. Always verify relation names in generated types rather than assuming based on table names.**

Mock tests provide false confidence when not paired with type checking. Critical code paths should have both unit tests AND type-safe integration tests.
