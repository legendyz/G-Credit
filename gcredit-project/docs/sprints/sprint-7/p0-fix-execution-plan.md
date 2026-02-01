# Sprint 7 P0 Fix Execution Plan

**Created:** 2026-02-01  
**Sprint Extension:** 2026-02-05 → 2026-02-07  
**Total P0 Effort:** ~15.25 hours  
**Execution Order:** Security → Architecture → UX

---

## Overview

Pre-UAT reviews identified **9 P0 issues** that must be fixed before executing Story U.1 (Complete Lifecycle UAT).

```
┌─────────────────────────────────────────────────────────────────┐
│  Sprint 7 Revised Timeline                                       │
├─────────────────────────────────────────────────────────────────┤
│  Feb 1 (AM)  │ Security Audit, Architecture Review, UX Audit    │
│  Feb 1 (PM)  │ Phase A: Security P0 Fixes (3.25h)               │
│  Feb 2       │ Phase B: UX P0 Fixes (12h)                       │
│  Feb 3-5     │ Story U.1: Complete Lifecycle UAT (8h)           │
│  Feb 6-7     │ Bug fixes (Story U.3) + Sprint 7 Completion      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase A: Security & Architecture P0 Fixes (3.25h)

### Priority Order (Security First)

| # | ID | Task | File(s) | Effort | Why First |
|---|----|----- |---------|--------|-----------|
| 1 | SEC-P0-002 | Remove role from RegisterDto | `register.dto.ts`, `auth.service.ts` | 1h | **Critical**: Anyone can become ADMIN |
| 2 | SEC-P0-001 | IDOR fix: Use @CurrentUser() | `teams-action.controller.ts` | 1h | **Critical**: Can claim others' badges |
| 3 | SEC-P0-003 | JWT Secret validation | `jwt.strategy.ts` | 15m | Prevents token forgery |
| 4 | ARCH-P0-002 | Badge Template status check | `badge-templates.service.ts` | 1h | Data exposure (DRAFT visible) |

### Detailed Fix Instructions

#### Fix 1: SEC-P0-002 - Remove Role Self-Assignment

**Problem:** Registration accepts `role` parameter, allowing privilege escalation.

**Files to modify:**
1. `backend/src/auth/dto/register.dto.ts` - Remove `role` field
2. `backend/src/auth/auth.service.ts` - Hardcode `UserRole.EMPLOYEE`

**Before (register.dto.ts):**
```typescript
@IsIn(['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'])
role?: string;
```

**After:**
```typescript
// Remove role field entirely - new users are always EMPLOYEE
```

**Before (auth.service.ts):**
```typescript
role: (dto.role as UserRole) || UserRole.EMPLOYEE,
```

**After:**
```typescript
role: UserRole.EMPLOYEE,  // New users always start as EMPLOYEE
```

**Test:** 
```bash
curl -X POST /auth/register -d '{"email":"test@x.com","password":"Test123!","role":"ADMIN"}'
# Should ignore role, create EMPLOYEE
```

---

#### Fix 2: SEC-P0-001 - IDOR in Teams Badge Claiming

**Problem:** `claimBadge` accepts `userId` from request body instead of JWT.

**File:** `backend/src/badge-sharing/controllers/teams-action.controller.ts`

**Before:**
```typescript
@Post('claim-badge')
async claimBadge(@Body() dto: ClaimBadgeActionDto) {
  if (badge.recipientId !== dto.userId) {
    throw new ForbiddenException();
  }
}
```

**After:**
```typescript
@Post('claim-badge')
async claimBadge(@Body() dto: ClaimBadgeActionDto, @CurrentUser() user: User) {
  // Use authenticated user's ID from JWT, not DTO
  if (badge.recipientId !== user.userId) {
    throw new ForbiddenException();
  }
}
```

**Test:**
```bash
# Try claiming as different user - should fail
curl -X POST /api/teams/claim-badge \
  -H "Authorization: Bearer <USER_A_TOKEN>" \
  -d '{"badgeId":"xxx","userId":"USER_B_ID"}'
# Should use USER_A from token, not USER_B from body
```

---

#### Fix 3: SEC-P0-003 - JWT Secret Validation

**Problem:** Falls back to hardcoded `'default-secret'` if env var missing.

**File:** `backend/src/auth/strategies/jwt.strategy.ts` (or `modules/auth/strategies/jwt.strategy.ts`)

**Before:**
```typescript
secretOrKey: config.get<string>('JWT_SECRET') || 'default-secret',
```

**After:**
```typescript
const jwtSecret = config.get<string>('JWT_SECRET');
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET environment variable is required (min 32 characters)');
}
// ...
secretOrKey: jwtSecret,
```

**Test:**
```bash
# Remove JWT_SECRET and start server
# Should fail at startup with clear error message
```

---

#### Fix 4: ARCH-P0-002 - Badge Template findOne Status Check

**Problem:** `GET /badge-templates/:id` returns DRAFT templates to any authenticated user.

**File:** `backend/src/badge-templates/badge-templates.service.ts`

**Before:**
```typescript
async findOne(id: string) {
  return this.prisma.badgeTemplate.findUnique({
    where: { id },
    // No status check!
  });
}
```

**After:**
```typescript
async findOne(id: string, userRole?: string) {
  const template = await this.prisma.badgeTemplate.findUnique({
    where: { id },
  });
  
  if (!template) {
    throw new NotFoundException('Badge template not found');
  }
  
  // Only ADMIN/ISSUER can see non-ACTIVE templates
  if (template.status !== 'ACTIVE' && !['ADMIN', 'ISSUER'].includes(userRole)) {
    throw new NotFoundException('Badge template not found');
  }
  
  return template;
}
```

**Controller update:**
```typescript
@Get(':id')
async findOne(@Param('id') id: string, @CurrentUser() user: User) {
  return this.badgeTemplatesService.findOne(id, user?.role);
}
```

---

## Phase B: UX P0 Fixes (12h)

### Priority Order

| # | ID | Task | Effort | Complexity |
|---|----|----- |--------|------------|
| 1 | UX-P0-002 | Replace alert() with toast | 2h | Low |
| 2 | UX-P0-003 | Add form labels (A11y) | 2h | Low |
| 3 | UX-P0-001 | Create login page | 4h | Medium |
| 4 | UX-P0-004 | Badge claim celebration | 4h | Medium |

### Detailed Fix Instructions

#### Fix 5: UX-P0-002 - Replace alert() with Toast

**Files to modify:**
1. `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` (Line ~106)
2. `frontend/src/components/BadgeDetailModal/EvidenceSection.tsx` (Lines ~78, ~86)

**Pattern:**
```tsx
// Before
alert('Failed to download badge. Please try again.');

// After
import { toast } from 'sonner';
toast.error('Download failed', {
  description: 'Unable to download badge. Please try again.',
});
```

---

#### Fix 6: UX-P0-003 - Add Form Labels

**Files to modify:**
1. `frontend/src/components/TimelineView/TimelineView.tsx` - filter select
2. `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx` - email input, textarea

**Pattern:**
```tsx
// Before
<select value={filter} onChange={...}>

// After
<label htmlFor="badge-filter" className="sr-only">Filter by status</label>
<select id="badge-filter" value={filter} onChange={...}>
```

---

#### Fix 7: UX-P0-001 - Create Minimal Login Page

**New files to create:**
1. `frontend/src/pages/LoginPage.tsx`
2. Update `frontend/src/App.tsx` or router config

**Minimal implementation for UAT:**
```tsx
// LoginPage.tsx
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      navigate('/wallet');
    } catch (error) {
      toast.error('Login failed', { description: error.message });
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      <Input type="email" value={email} onChange={...} />
      <Input type="password" value={password} onChange={...} />
      <Button type="submit">Login</Button>
    </form>
  );
}
```

---

#### Fix 8: UX-P0-004 - Badge Claim Celebration

**Implementation approach:**
1. Create `ClaimSuccessModal.tsx` or enhance existing claim flow
2. Add success state with:
   - ✅ Green checkmark icon (animated)
   - ✅ "Congratulations!" heading
   - ✅ Badge name display
   - ✅ Issuer message (if provided)
   - ✅ "View in Wallet" button

**Minimal celebration (no confetti for P0):**
```tsx
<Dialog open={claimSuccess}>
  <DialogContent className="text-center">
    <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
    <h2 className="text-2xl font-bold">Congratulations!</h2>
    <p>You've earned the <strong>{badge.name}</strong> badge!</p>
    {badge.issuerMessage && (
      <p className="text-muted-foreground italic">"{badge.issuerMessage}"</p>
    )}
    <Button onClick={() => navigate('/wallet')}>View in Wallet</Button>
  </DialogContent>
</Dialog>
```

---

## Phase C: UAT (8h)

After all P0 fixes are complete, execute full Story U.1 (Complete Lifecycle UAT).

See: [Story U.1 Acceptance Criteria](./story-u1-lifecycle-uat.md) (if exists)

---

## Verification Checklist

### After Phase A (Security)
- [ ] Cannot register with custom role
- [ ] Cannot claim badge as another user
- [ ] Server fails to start without JWT_SECRET
- [ ] Cannot view DRAFT templates as EMPLOYEE

### After Phase B (UX)
- [ ] No alert() dialogs anywhere
- [ ] All form inputs have labels (test with screen reader)
- [ ] Login page works end-to-end
- [ ] Badge claiming shows celebration feedback

### After Phase C (UAT)
- [ ] Full lifecycle tested (template → issue → claim → verify → revoke)
- [ ] Bug list compiled (Story U.3)
- [ ] Sprint 7 ready for completion

---

## Developer Assignment

| Phase | Recommended Agent | Skills Needed |
|-------|-------------------|---------------|
| Phase A | Amelia (Dev) | NestJS, Security, Prisma |
| Phase B | Amelia (Dev) | React, TypeScript, A11y |
| Phase C | Bob (SM) + Manual | Test execution, Bug tracking |

---

**Ready to execute?** Start with Phase A, Fix 1 (SEC-P0-002).
