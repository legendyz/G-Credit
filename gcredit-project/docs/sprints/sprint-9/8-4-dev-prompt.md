# Story 8.4 Dev Agent Prompt: Batch Processing Phase 1 + TD-014 Email Unification

**Sprint:** Sprint 9 | **Category:** Feature + Tech Debt | **Priority:** MEDIUM  
**Estimated Hours:** 8.5h (TD-014: 2h + Processing: 4h + P0 Loading UI: 2h + Misc: 0.5h)  
**Target Version:** v0.9.0  
**Date Created:** 2026-02-08  
**Dependencies:** Story 8.3 ✅ (completed)  
**Story File:** `sprint-9/8-4-batch-processing-phase1.md`

---

## 🎯 Mission

Two objectives in this story:

1. **TD-014 (前置任务, 2h):** Unify email system — remove `nodemailer` dependency entirely, migrate the legacy `EmailService` (used only for password reset) to use `GraphEmailService`. Zero nodemailer references after completion.

2. **Batch Processing MVP (6.5h):** Implement synchronous bulk badge issuance via the existing `POST /api/bulk-issuance/confirm/:sessionId` endpoint. Process up to 20 badges in a single HTTP request loop. Update frontend with enhanced loading UI and result display.

**Key simplification:** This is synchronous processing (no Redis/Bull Queue). Max 20 badges ≈ 20 seconds. Async processing deferred to TD-016 (Phase 2).

---

## ⚠️ Critical Rules

1. **Lessons Learned — MUST follow:**
   - **L34:** Use variable type annotations (`const x: Type = expr`), NOT `as` casts — `eslint --fix` strips `as` casts silently
   - **L35:** Always verify with `npx tsc --noEmit` after all changes — don't rely on `npm test` alone
   - **L36:** When adding strict types, budget time for test mock updates
2. **NO `eslint-disable` comments** — fix properly or skip
3. **English UI text only** — translate ALL Chinese text in `ProcessingModal.tsx`
4. **Commit incrementally** — commit after TD-014, then after backend processing, then after frontend
5. **Test-driven** — write tests alongside each component
6. **Update `max-warnings` in package.json** if ESLint warning count changes (currently 282)
7. **Security:** Session IDOR validation already exists in `loadSession()` — verify it works for confirm flow

---

## 📦 Phase 0: TD-014 — Email System Unification (2h)

> **This MUST complete before batch processing work begins.** Batch processing sends notification emails — unified system avoids dual-path complexity.

### Current State

**Two email systems coexist:**

| System | File | Usage | Transport |
|--------|------|-------|-----------|
| `EmailService` (legacy) | `src/common/email.service.ts` (268 lines) | Password reset only (`AuthService`) | nodemailer/Ethereal (dev) + Azure Communication Services (prod) |
| `GraphEmailService` (current) | `src/microsoft-graph/services/graph-email.service.ts` (168 lines) | Badge notifications via `BadgeNotificationService` | Microsoft Graph API |

**nodemailer references (ALL in `email.service.ts`):**
- Line 4: `import * as nodemailer from 'nodemailer';`
- Line 5: `import type { Transporter } from 'nodemailer';`
- Line 80-81: `nodemailer.createTestAccount()` + `nodemailer.createTransport()`
- Line 166: `nodemailer.SentMessageInfo` type
- Line 175: `nodemailer.getTestMessageUrl(info)`

**Consumers of legacy `EmailService`:**
- `src/modules/auth/auth.service.ts` line 15: `import { EmailService }` → calls `sendPasswordReset()`
- `src/modules/auth/auth.module.ts` line 9: imports `EmailModule`
- `src/badge-issuance/badge-issuance.module.ts` line 14: imports `EmailModule` (but doesn't actually use `EmailService` directly)
- `src/microsoft-graph/microsoft-graph.module.spec.ts`: mocks `EmailService`

### Task 0.1: Rewrite EmailService to Delegate to GraphEmailService (1h)

**Strategy:** Keep `EmailService` class name and `sendPasswordReset()` method signature intact → zero changes needed in `AuthService`. Internally, delegate to `GraphEmailService.sendEmail()`.

**Current `email.module.ts`:**
```typescript
// src/common/email.module.ts
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

**Target `email.module.ts`:**
```typescript
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MicrosoftGraphModule } from '../microsoft-graph/microsoft-graph.module';

@Module({
  imports: [MicrosoftGraphModule],  // Provides GraphEmailService
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

**Rewrite `email.service.ts` — remove ALL nodemailer code:**

The current file is 268 lines with nodemailer, Ethereal, ACS triple-path logic. Replace with a thin wrapper (~80 lines):

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphEmailService } from '../microsoft-graph/services/graph-email.service';

/**
 * Email Service
 *
 * Unified email sending through Microsoft Graph API.
 * Delegates all email delivery to GraphEmailService.
 * 
 * Development: Logs email to console when Graph Email is disabled.
 * Production: Sends via Microsoft Graph API.
 */

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromAddress: string;

  constructor(
    private config: ConfigService,
    private graphEmailService: GraphEmailService,
  ) {
    this.fromAddress = this.config.get<string>(
      'GRAPH_EMAIL_FROM',
      this.config.get<string>('EMAIL_FROM', 'badges@gcredit.example.com'),
    );
    this.logger.log('✅ EmailService initialized (Graph Email unified)');
  }

  /**
   * Send email via GraphEmailService
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      if (!this.graphEmailService.isGraphEmailEnabled()) {
        // Development fallback: log to console
        this.logger.warn('⚠️ Graph Email not enabled, logging email to console');
        console.log('\n' + '='.repeat(80));
        console.log('📧 [DEV MODE] Email');
        console.log('='.repeat(80));
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log('='.repeat(80) + '\n');
        return;
      }

      await this.graphEmailService.sendEmail(
        this.fromAddress,
        [options.to],
        options.subject,
        options.html,
        options.text,
      );
      this.logger.log(`✅ Email sent to ${options.to}: ${options.subject}`);
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to send email to ${options.to}:`,
        (error as Error).message,
      );
      // Don't throw - email failure shouldn't block operations
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    // ... KEEP the existing sendPasswordReset() method body EXACTLY as-is
    // (lines 189-266 of current file) — it calls this.sendMail() internally
    // which now delegates to GraphEmailService
  }
}
```

**CRITICAL:** The `sendPasswordReset()` method body (HTML template + text) must be **preserved exactly** — only the `sendMail()` delivery path changes.

### Task 0.2: Remove nodemailer Dependencies (0.25h)

```bash
cd gcredit-project/backend
npm uninstall nodemailer @types/nodemailer
```

Verify `package.json` no longer contains either dependency.

Also remove `@azure/communication-email` if it exists (was used by old ACS path in EmailService):
```bash
npm ls @azure/communication-email 2>&1
# If found: npm uninstall @azure/communication-email
```

### Task 0.3: Remove Old Email Config References (0.25h)

**`.env.example`** — Remove these entries if they exist:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (old SMTP config)
- `AZURE_COMMUNICATION_CONNECTION_STRING` (old ACS config)
- `EMAIL_FROM` → rename to `GRAPH_EMAIL_FROM` if not already done

**Check `docs/setup/EMAIL_SETUP_QUICK.md`** — If it references SMTP/nodemailer setup, update or delete it.

### Task 0.4: Fix Tests (0.5h)

**Files likely needing updates:**
- `src/microsoft-graph/microsoft-graph.module.spec.ts` — mocks `EmailService`, may need updating
- `src/modules/auth/auth.service.spec.ts` — mocks `EmailService.sendPasswordReset()`
- Any test mocking `nodemailer.createTestAccount` or `createTransport`

**Test command:**
```bash
cd gcredit-project/backend
npx jest --no-coverage --testPathPattern="email|auth" --forceExit
```

### TD-014 Success Criteria

- [ ] Zero `nodemailer` imports in codebase (`grep -r "nodemailer" src/` returns nothing)
- [ ] `nodemailer` and `@types/nodemailer` not in `package.json`
- [ ] `EmailService.sendPasswordReset()` still works (delegates to `GraphEmailService`)
- [ ] All existing tests pass
- [ ] No new ESLint warnings

### TD-014 Commit

```bash
git add -A
git commit -m "refactor: TD-014 email system unification — remove nodemailer

- Rewrite EmailService to delegate to GraphEmailService
- Remove nodemailer + @types/nodemailer dependencies
- Remove ACS email path (consolidated to Graph API)
- Keep sendPasswordReset() API contract unchanged
- Update EmailModule to import MicrosoftGraphModule"
```

---

## 📦 Phase 1: Backend — Synchronous Batch Processing (2.5h)

### Current State

The `confirmBulkIssuance()` method in `bulk-issuance.service.ts` (line 548) is a **TODO stub**:
- Loops through `sessionValidRows` but **does not call `BadgeIssuanceService.issueBadge()`**
- Just increments `processed` counter
- Session IDOR validation already works via `loadSession()` ✅
- Status transitions: `VALIDATED` → `PROCESSING` → `COMPLETED` ✅

**Key challenge — field mapping:**

| `validRows` (CSV data) | `IssueBadgeDto` (expected) | Resolution needed |
|------------------------|---------------------------|-------------------|
| `badgeTemplateId` (name OR UUID) | `templateId` (UUID only) | Resolve name → UUID |
| `recipientEmail` (email) | `recipientId` (UUID) | Look up user by email |
| `evidenceUrl` (optional) | `evidenceUrl` (optional) | Direct pass-through |

### Task 1.1: Wire BadgeIssuanceModule into BulkIssuanceModule (0.25h)

**Current `bulk-issuance.module.ts`:**
```typescript
@Module({
  imports: [PrismaModule],
  controllers: [BulkIssuanceController],
  providers: [BulkIssuanceService, CsvValidationService],
  exports: [BulkIssuanceService, CsvValidationService],
})
export class BulkIssuanceModule {}
```

**Target:**
```typescript
import { BadgeIssuanceModule } from '../badge-issuance/badge-issuance.module';

@Module({
  imports: [PrismaModule, BadgeIssuanceModule],
  controllers: [BulkIssuanceController],
  providers: [BulkIssuanceService, CsvValidationService],
  exports: [BulkIssuanceService, CsvValidationService],
})
export class BulkIssuanceModule {}
```

**Update `BulkIssuanceService` constructor** to inject `BadgeIssuanceService`:
```typescript
constructor(
  private prisma: PrismaService,
  private csvValidation: CsvValidationService,
  private badgeIssuanceService: BadgeIssuanceService,
) {}
```

### Task 1.2: Implement Real confirmBulkIssuance() (1.5h)

Replace the TODO stub (lines 576-591) with actual badge issuance logic:

```typescript
async confirmBulkIssuance(sessionId: string, currentUserId: string): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  results: Array<{
    row: number;
    recipientEmail: string;
    badgeName: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}> {
  const session = await this.loadSession(sessionId, currentUserId);

  if ((session.status as SessionStatus) !== SessionStatus.VALIDATED) {
    throw new BadRequestException(
      `Session is not ready for confirmation. Status: ${session.status}`,
    );
  }

  // MVP limit: 20 badges max
  const sessionValidRows = session.validRows as unknown as Array<{
    badgeTemplateId: string;
    recipientEmail: string;
    evidenceUrl?: string;
  }>;

  if (sessionValidRows.length > BulkIssuanceService.MAX_ROWS) {
    throw new BadRequestException(
      `MVP limit: maximum ${BulkIssuanceService.MAX_ROWS} badges per batch. Phase 2 will support larger batches.`,
    );
  }

  if (sessionValidRows.length === 0) {
    throw new BadRequestException('No valid badges to process');
  }

  // Update status to PROCESSING
  await this.prisma.bulkIssuanceSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.PROCESSING },
  });

  const results: Array<{
    row: number;
    recipientEmail: string;
    badgeName: string;
    status: 'success' | 'failed';
    error?: string;
  }> = [];
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < sessionValidRows.length; i++) {
    const row = sessionValidRows[i];
    try {
      // Resolve badgeTemplateId (could be name or UUID) → UUID
      const template = await this.prisma.badgeTemplate.findFirst({
        where: {
          OR: [{ id: row.badgeTemplateId }, { name: row.badgeTemplateId }],
          status: 'ACTIVE',
        },
      });

      if (!template) {
        throw new Error(`Badge template "${row.badgeTemplateId}" not found or inactive`);
      }

      // Resolve recipientEmail → user UUID
      const recipient = await this.prisma.user.findFirst({
        where: { email: row.recipientEmail, isActive: true },
      });

      if (!recipient) {
        throw new Error(`No active user found with email: ${row.recipientEmail}`);
      }

      // Issue badge via BadgeIssuanceService
      await this.badgeIssuanceService.issueBadge(
        {
          templateId: template.id,
          recipientId: recipient.id,
          evidenceUrl: row.evidenceUrl,
        },
        currentUserId,
      );

      processed++;
      results.push({
        row: i + 2,
        recipientEmail: row.recipientEmail,
        badgeName: template.name,
        status: 'success',
      });

      this.logger.debug(
        `Issued badge ${i + 1}/${sessionValidRows.length}: ${template.name} → ${row.recipientEmail}`,
      );
    } catch (error: unknown) {
      failed++;
      results.push({
        row: i + 2,
        recipientEmail: row.recipientEmail,
        badgeName: row.badgeTemplateId,
        status: 'failed',
        error: (error as Error).message,
      });
      this.logger.error(
        `Failed badge ${i + 1}/${sessionValidRows.length} to ${row.recipientEmail}: ${(error as Error).message}`,
      );
    }
  }

  // Update session status
  const finalStatus = failed === sessionValidRows.length
    ? SessionStatus.FAILED
    : SessionStatus.COMPLETED;

  await this.prisma.bulkIssuanceSession.update({
    where: { id: sessionId },
    data: { status: finalStatus },
  });

  this.logger.log(
    `Completed bulk issuance session ${sessionId}: ${processed} success, ${failed} failed`,
  );

  return {
    success: failed === 0,
    processed,
    failed,
    results,
  };
}
```

**Important notes:**
1. `BadgeIssuanceService.issueBadge()` already handles Teams notifications internally (fire-and-forget `.catch()`)
2. Each badge is issued in its own DB transaction (atomic per badge, not per batch)
3. Individual failures don't stop the loop — partial success is expected
4. `IssueBadgeDto` requires UUID `templateId` and `recipientId` — we resolve them from the CSV data
5. The `issueBadge()` DTO does NOT have `narrativeJustification` — check if it should be added or skipped for MVP

### Task 1.3: Update Response Type / Swagger (0.25h)

Update the controller's Swagger decorators to document the enriched response:

```typescript
@ApiResponse({
  status: 200,
  description: 'Processing complete',
  schema: {
    properties: {
      success: { type: 'boolean' },
      processed: { type: 'number' },
      failed: { type: 'number' },
      results: {
        type: 'array',
        items: {
          properties: {
            row: { type: 'number' },
            recipientEmail: { type: 'string' },
            badgeName: { type: 'string' },
            status: { type: 'string', enum: ['success', 'failed'] },
            error: { type: 'string' },
          },
        },
      },
    },
  },
})
```

### Task 1.4: Backend Tests (0.5h)

**Update `bulk-issuance.service.spec.ts`:**

Add mock for `BadgeIssuanceService`:
```typescript
const mockBadgeIssuanceService = {
  issueBadge: jest.fn(),
};
```

Add to module providers:
```typescript
{ provide: BadgeIssuanceService, useValue: mockBadgeIssuanceService },
```

**New test cases (at least 8):**

```typescript
describe('confirmBulkIssuance - real issuance', () => {
  it('should issue all valid badges successfully', async () => {});
  it('should handle partial failures (some succeed, some fail)', async () => {});
  it('should handle all failures', async () => {});
  it('should resolve badge template by name', async () => {});
  it('should resolve badge template by UUID', async () => {});
  it('should resolve recipient by email', async () => {});
  it('should reject session with >20 rows', async () => {});
  it('should reject non-VALIDATED session', async () => {});
  it('should set status to FAILED when all badges fail', async () => {});
  it('should set status to COMPLETED on partial success', async () => {});
});
```

### Phase 1 Commit

```bash
git add -A
git commit -m "feat: Story 8.4 backend — synchronous batch processing

- Wire BadgeIssuanceModule into BulkIssuanceModule
- Implement real confirmBulkIssuance() with badge loop
- Resolve template name/UUID and recipient email → UUID
- Partial failure handling (individual badge errors don't stop batch)
- Status transitions: VALIDATED → PROCESSING → COMPLETED/FAILED
- 10 new unit tests for batch processing scenarios"
```

---

## 📦 Phase 2: Frontend — Loading UI + Result Display (2h)

### Current State

**`ProcessingModal.tsx` (111 lines):**
- Pseudo-progress bar (visual only, ramps to 90%)
- Chinese text in 5 locations (must translate to English)
- Takes `{ totalBadges, isProcessing }` props
- No real progress data from backend (by design — synchronous POST)

**`BulkPreviewPage.tsx` confirm flow:**
- `handleConfirm()` → POST to confirm endpoint → waits for response
- Sets `processingResults: { success, failed }` on completion
- Shows `<ProcessingComplete>` when done

**`ProcessingComplete.tsx` — already exists** (shows success summary + navigation)

### Task 2.1: Translate ProcessingModal Chinese Text (0.25h)

**File:** `frontend/src/components/BulkIssuance/ProcessingModal.tsx`

| Line | Chinese | English |
|------|---------|---------|
| ~57 | `⏳ 正在发放徽章...` | `⏳ Issuing Badges...` |
| ~67 | `⏱️ 预计剩余时间:` | `⏱️ Estimated time remaining:` |
| ~69 | `分钟` | `minutes` |
| ~69 | `秒` | `seconds` |
| ~99 | `请勿刷新页面或关闭浏览器` | `Please do not refresh or close your browser` |
| ~101 | `批量发放正在进行中，关闭页面可能导致发放中断` | `Bulk issuance is in progress. Closing this page may interrupt the process.` |

### Task 2.2: Enhance ProcessingModal with Live Counts (0.5h)

The current modal shows pseudo-progress only. Story 8.4 AC4 wants live progress display. Since processing is synchronous (single HTTP request), we can't get real-time updates from backend. However, we CAN show a more detailed visual:

**Enhanced props:**
```typescript
interface ProcessingModalProps {
  totalBadges: number;
  isProcessing: boolean;
}
```

**Keep the existing pseudo-progress approach** — it's appropriate for synchronous processing. The progress bar fills to ~90% during the wait, then jumps to 100% when the POST returns.

**Add to the display:**
- Current badge count estimate: `Processing ~{estimatedCurrent}/{totalBadges} badges`
- Estimated time: `~{totalBadges} seconds` (1 badge/second assumption)
- 30-second timeout warning if processing exceeds 30s

**Add timeout handling in `BulkPreviewPage.tsx`:**
```typescript
// In handleConfirm():
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  // ... handle response
} catch (error) {
  clearTimeout(timeoutId);
  if (error instanceof DOMException && error.name === 'AbortError') {
    setError('Processing timed out after 30 seconds. Please check your badges and try again.');
  } else {
    setError('An error occurred during processing.');
  }
}
```

### Task 2.3: Enhance Result Display (0.5h)

**Current `ProcessingComplete.tsx` exists** — verify it handles the enriched response format.

The backend now returns:
```typescript
{
  success: boolean;
  processed: number;
  failed: number;
  results: Array<{
    row: number;
    recipientEmail: string;
    badgeName: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}
```

**Update `BulkPreviewPage.tsx` to pass full results:**

Currently stores only `{ success, failed }`. Update to store full `results` array:

```typescript
const [processingResults, setProcessingResults] = useState<{
  success: number;
  failed: number;
  results: Array<{
    row: number;
    recipientEmail: string;
    badgeName: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
} | null>(null);
```

**Update `ProcessingComplete` to show:**
- Success count: "✅ {N} badges issued successfully"
- Failure count (if any): "❌ {N} badges failed"
- Failed badges table with: Row, Recipient, Badge Name, Error
- "Download Error Report" button (reuse existing endpoint)
- "Return to Dashboard" button

### Task 2.4: Frontend Tests (0.75h)

**New/updated test files:**

1. **`ProcessingModal.test.tsx`** (new, ~6 tests):
   - Renders when `isProcessing=true`
   - Hidden when `isProcessing=false`
   - Shows progress bar with animation
   - Displays badge count
   - Shows estimated time
   - English text (no Chinese)

2. **`BulkPreviewPage.test.tsx`** (update existing):
   - Test confirm flow calls POST endpoint
   - Test timeout handling (30s)
   - Test error state display
   - Test result data passed to ProcessingComplete

3. **`ProcessingComplete.test.tsx`** (update if needed):
   - Shows success/failure summary
   - Shows failed badges table when failures exist
   - "Download Error Report" button visible when failures exist

### Phase 2 Commit

```bash
git add -A
git commit -m "feat: Story 8.4 frontend — loading UI + result display

- Translate ProcessingModal Chinese text to English (5 strings)
- Add 30-second timeout with AbortController
- Enhance result display with full badge results
- Show failed badges table with error details
- 10 new component tests"
```

---

## 📦 Phase 3: E2E Tests + Final Verification (0.5h)

### Task 3.1: E2E Tests

**File:** `backend/test/bulk-issuance-confirm.e2e-spec.ts` (new file)

**Test cases (4 minimum):**
```typescript
describe('Bulk Issuance Confirm E2E', () => {
  it('should confirm and issue all valid badges in session', async () => {});
  it('should handle partial failures gracefully', async () => {});
  it('should reject session with >20 badges', async () => {});
  it('should return 403 for unauthorized session access (IDOR)', async () => {});
});
```

### Task 3.2: Final Quality Gates

Run ALL checks in this exact order:

```bash
# 1. Backend tests
cd gcredit-project/backend
npx jest --no-coverage --forceExit
# Expected: ~530+ passed, 0 failures

# 2. Frontend tests
cd ../frontend
npx vitest run
# Expected: ~380+ passed, 0 failures

# 3. E2E tests
cd ../backend
npx jest --no-coverage --config test/jest-e2e.json --forceExit
# Expected: ~156+ passed, 0 failures

# 4. ESLint
npx eslint src/ --max-warnings=282
# Expected: 0 errors, ≤282 warnings
# If warning count changed, update max-warnings in package.json

# 5. TypeScript compilation
npx tsc --noEmit
# Expected: 124 errors (all in test files, tracked as TD-017)
# CRITICAL: Zero new errors in src/ files

# 6. Bundle size
cd ../frontend
npm run build
# Expected: Main chunk ≤240 KB
```

### Phase 3 Commit

```bash
git add -A
git commit -m "test: Story 8.4 E2E tests for batch processing

- 4 E2E tests: full flow, partial failure, limit, IDOR
- All quality gates verified"
```

---

## 📋 File Inventory

### Files to Create
| File | Description |
|------|-------------|
| `backend/test/bulk-issuance-confirm.e2e-spec.ts` | E2E tests for confirm endpoint |
| `frontend/src/components/BulkIssuance/__tests__/ProcessingModal.test.tsx` | Processing modal unit tests |

### Files to Modify
| File | Changes |
|------|---------|
| `backend/src/common/email.service.ts` | **REWRITE** — remove nodemailer, delegate to GraphEmailService |
| `backend/src/common/email.module.ts` | Import `MicrosoftGraphModule` |
| `backend/package.json` | Remove `nodemailer`, `@types/nodemailer` deps |
| `backend/src/bulk-issuance/bulk-issuance.module.ts` | Import `BadgeIssuanceModule` |
| `backend/src/bulk-issuance/bulk-issuance.service.ts` | Inject `BadgeIssuanceService`, implement real `confirmBulkIssuance()` |
| `backend/src/bulk-issuance/bulk-issuance.service.spec.ts` | Add `BadgeIssuanceService` mock, 10 new confirm tests |
| `frontend/src/components/BulkIssuance/ProcessingModal.tsx` | Translate Chinese → English, enhance display |
| `frontend/src/components/BulkIssuance/BulkPreviewPage.tsx` | Add timeout, store full results, pass to ProcessingComplete |
| `frontend/src/components/BulkIssuance/ProcessingComplete.tsx` | Show failed badges table, download report button |
| `frontend/src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` | Add confirm flow tests |

### Files to Potentially Modify
| File | Condition |
|------|-----------|
| `backend/.env.example` | If SMTP/ACS vars exist, remove them |
| `docs/setup/EMAIL_SETUP_QUICK.md` | If references SMTP/nodemailer, update or delete |
| `backend/src/microsoft-graph/microsoft-graph.module.spec.ts` | If mocks `EmailService`, update |
| `backend/src/modules/auth/auth.service.spec.ts` | If `EmailService` mock shape changes |

### Files to NOT Modify
| File | Reason |
|------|--------|
| `backend/src/modules/auth/auth.service.ts` | `sendPasswordReset()` API unchanged |
| `backend/src/microsoft-graph/services/graph-email.service.ts` | Already complete, no changes needed |
| `prisma/schema.prisma` | No schema changes (BulkIssuanceSession already has all needed fields) |
| `backend/src/bulk-issuance/bulk-issuance.controller.ts` | Controller already correct, only service changes |

---

## 🔍 Key Implementation Details

### 1. IssueBadgeDto Field Mapping

The `IssueBadgeDto` (file: `src/badge-issuance/dto/issue-badge.dto.ts`):
```typescript
export class IssueBadgeDto {
  @IsUUID() templateId: string;     // Badge template UUID
  @IsUUID() recipientId: string;     // Recipient USER ID (UUID)
  @IsOptional() @IsUrl() evidenceUrl?: string;
  @IsOptional() @IsInt() @Min(1) @Max(3650) expiresIn?: number;
}
```

The CSV `validRows` store `{ badgeTemplateId, recipientEmail, evidenceUrl }`. During `confirmBulkIssuance()`:
- `badgeTemplateId` → resolved via `prisma.badgeTemplate.findFirst({ where: { OR: [{ id }, { name }] } })` → `.id`
- `recipientEmail` → resolved via `prisma.user.findFirst({ where: { email } })` → `.id`

**These lookups are redundant with CSV validation (they were checked during upload), but necessary because:**
1. Template/user status could change between upload and confirm
2. Confirms data integrity of the entire flow
3. Provides fresh UUIDs for `issueBadge()` call

### 2. Email Notification Path (Post TD-014)

After TD-014 unification:
- `BadgeIssuanceService.issueBadge()` internally calls `TeamsNotificationService.sendBadgeIssuanceNotification()` (line ~150) — this is a Teams channel notification, not email
- For badge email notifications, `BadgeNotificationService.sendBadgeClaimNotification()` exists — check if `issueBadge()` calls it
- If not, badge claim emails may need to be triggered separately in the bulk loop

**Verify by reading `badge-issuance.service.ts` lines 100-170** to see what notifications `issueBadge()` sends.

### 3. Transaction Strategy (ARCH-C6)

Per Story 8.4 spec: Each badge is issued in its own atomic transaction (inside `issueBadge()`). Individual failures rollback only that badge. The session status reflects overall result:
- All succeed → `COMPLETED`
- Partial → `COMPLETED` (with failed count)
- All fail → `FAILED`

### 4. ProcessingModal Pseudo-Progress

The pseudo-progress approach is **correct for synchronous processing**. The backend processes all badges in one HTTP request (~20 seconds). Frontend can't get real-time updates. The progress bar provides visual feedback while waiting.

---

## 📊 Current Baseline Metrics

| Metric | Current Value | Target |
|--------|--------------|--------|
| Backend Tests | 520 passed | ≥530 |
| Frontend Tests | 370 passed | ≥380 |
| E2E Tests | 152 passed | ≥156 |
| ESLint Warnings | 282 | ≤282 (update max-warnings if changed) |
| tsc Errors | 124 (test files only) | No new src errors |
| Bundle Size | 235 KB | ≤240 KB |

---

## 🔄 Work Order Summary

| Phase | Task | Est. Hours |
|-------|------|-----------|
| **Phase 0** | TD-014: Rewrite EmailService | 1h |
| **Phase 0** | TD-014: Remove nodemailer deps | 0.25h |
| **Phase 0** | TD-014: Clean config/docs | 0.25h |
| **Phase 0** | TD-014: Fix tests | 0.5h |
| **Phase 1** | Wire BadgeIssuanceModule | 0.25h |
| **Phase 1** | Implement confirmBulkIssuance() | 1.5h |
| **Phase 1** | Update Swagger response | 0.25h |
| **Phase 1** | Backend tests (10 new) | 0.5h |
| **Phase 2** | Translate ProcessingModal | 0.25h |
| **Phase 2** | Enhance loading UI + timeout | 0.5h |
| **Phase 2** | Enhance result display | 0.5h |
| **Phase 2** | Frontend tests | 0.75h |
| **Phase 3** | E2E tests (4 new) | 0.25h |
| **Phase 3** | Final quality gates | 0.25h |
| | **Total** | **6.5h** |

---

## 📝 Story File Update

After all phases complete, update `8-4-batch-processing-phase1.md`:

1. Set `Status: done`
2. Set `Actual Hours: Xh`
3. Check all AC boxes `[x]`
4. Fill in Dev Agent Record section:
   - Model used
   - Completion date
   - Test results
   - File lists
   - Commit hashes

---

## Dev Agent Record

### Agent Model Used
**Model:** TBD  
**Date:** TBD

### Completion Notes
**Status:** TBD  
**Blockers:** None anticipated

### Test Results
- **Backend Tests:** TBD
- **Frontend Tests:** TBD  
- **E2E Tests:** TBD

### Commits
1. `TBD` — TD-014 email unification
2. `TBD` — Story 8.4 backend batch processing
3. `TBD` — Story 8.4 frontend loading/results UI
4. `TBD` — Story 8.4 E2E tests

### File List
**Files Created:** TBD  
**Files Modified:** TBD
