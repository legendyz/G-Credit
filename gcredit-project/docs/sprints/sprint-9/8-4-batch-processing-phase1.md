# Story 8.4: Bulk Issuance Synchronous Processing (MVP)

**Status:** done  
**Epic:** Epic 8 - Bulk Badge Issuance  
**Sprint:** Sprint 9  
**Priority:** MEDIUM  
**Estimated Hours:** 8.5h (原4h + P0修复2h + P1改进0.5h + TD-014 2h)  
**Actual Hours:** 7h  
**Dependencies:** Story 8.3 (Bulk Preview UI)  
**Post-Review Updates:** UX-P0-1, C2, C6 (2026-02-05审查)  
**Security Critical:** 🔴 MUST implement C2 (Session IDOR) validation  
**Includes Tech Debt:** 🔧 TD-014 (Email System Unification, 2h) — 作为前置任务嵌入本Story

**MVP Decision**: Deferred Redis/Bull Queue to Phase 2 (TD-016). Sprint 9 implements synchronous processing with 20-badge limit to validate core workflow before adding complexity.

---

## Story

As an **Issuer**,  
I want **to issue up to 20 badges at once via CSV upload**,  
So that **I can efficiently award badges to small groups without manual one-by-one issuance**.

---

## Acceptance Criteria

1. [x] **AC1: CSV Upload Limit (MVP)**
   - System validates CSV has ≤20 badges
   - If >20 badges, show error: "MVP限制：最多20个徽章/批次。Phase 2将支持更大批量。"
   - Provide option to split CSV or select first 20 rows

2. [x] **AC2: Synchronous Batch Processing**
   - POST `/api/bulk-issuance/confirm/:sessionId` processes all badges in single HTTP request
   - Loop through all valid badges (max 20)
   - Call `BadgeInstanceService.issueBadge()` for each badge
   - Collect success/failure results
   - Return complete results when done (no background job)

3. [x] **AC3: Error Handling** ⚠️ **P1-Enhancement**
   - Individual badge failures don't stop the loop
   - Failures collected in `failedBadges` array with error messages
   - ⚠️ **ARCH-C6**: Document transaction strategy (0.5h)
     - Each badge issued in atomic transaction
     - Individual failures rollback only that badge (not entire batch)
     - Clarify partial rollback behavior in API docs
   - Return partial success results (e.g., "18 of 20 succeeded")
   - Frontend displays error list immediately

4. [x] **AC4: Frontend Loading State** 🔴 **CRITICAL P0-Fix** (UX-P0-1, 2h)
   - ⚠️ **UX Critical Gap**: 20-second wait creates "frozen app" perception
   - **MUST implement pseudo-progress indicator**:
     - Replace static spinner with LIVE progress display
     - Update every 1 second with fake progress (20 ticks for 20 badges)
     - Display:
       ```
       ⏳ 正在发放徽章...
       [████████░░░░░░░░] 40% (8/20)
       
       ✅ 正在处理: Leadership Excellence → John Doe
       ⏱️ 预计剩余时间: 12秒
       
       已完成: 7个 ✓ | 失败: 1个 ✗ | 剩余: 12个
       ```
     - Shows current badge being processed
     - Running success/failure counts
     - Countdown timer
   - Estimate: ~1 second per badge (20 badges = ~20 seconds)
   - Disable all UI during processing
   - 30-second timeout with helpful error message

5. [x] **AC5: Completion Display**
   - Immediate result display (no polling needed)

6. [x] **AC6: Session Security** 🔴 **CRITICAL Security** (ARCH-C2, 1h)
   - Validate session ownership before processing: `session.issuerId === currentUser.id`
   - Prevent IDOR attack (User B confirming User A's bulk issuance)
   - Throw `ForbiddenException` if unauthorized access detected
   - Log security events
   - Summary: "成功发放18个徽章，失败2个"
   - Failed badges shown in error table with reasons
   - "Download Error Report" button for CSV export
   - Option to retry failed badges

6. [x] **AC6: Notification Emails**
   - Each successful badge issuance sends email to recipient
   - Email includes badge name, issuer, and claim link
   - Email send failures logged but don't fail badge creation
   - Email errors shown in completion summary

7. [x] **AC7: Email System Unification (TD-014)**
   - All nodemailer references removed from codebase
   - All email sending consolidated to GraphEmailService
   - nodemailer dependency removed from `package.json`
   - nodemailer config removed from `.env`
   - Email-related tests passing with unified service
   - Documentation updated (setup guide, env example)

---

## Tasks / Subtasks

### Task 0: TD-014 — Email System Unification (前置任务) - 2h

> **Tech Debt TD-014** 嵌入本 Story，作为前置任务在批量处理开发前完成。
> **理由：** 批量处理会发送大量邮件，统一邮件系统避免双系统复杂度。

- [ ] **0.1** Audit codebase for nodemailer usage (0.5h)
  - Search: `grep -r "nodemailer" backend/src/`
  - Document all email sending locations
- [ ] **0.2** Migrate remaining nodemailer calls to GraphEmailService (1h)
  - Update email sending code
  - Ensure templates compatible with Graph API
  - Update configuration
- [ ] **0.3** Remove nodemailer dependency (0.25h)
  - `npm uninstall nodemailer @types/nodemailer`
  - Remove nodemailer config from `.env`
  - Update `.env.example`
  - Update `gcredit-project/docs/setup/environment-setup.md`
- [ ] **0.4** Test email sending (0.25h)
  - Test badge issuance email
  - Test password reset email (if applicable)
  - Test admin notification emails

**TD-014 Success Criteria:**
- [ ] Zero references to `nodemailer` in codebase
- [ ] All emails sent via GraphEmailService
- [ ] Email tests passing
- [ ] Documentation updated

**TD-014 Files to Modify:**
- `backend/src/email/` (remove nodemailer service)
- `backend/package.json` (remove dependency)
- `backend/.env.example` (remove nodemailer config)
- `gcredit-project/docs/setup/environment-setup.md` (update docs)

---

### Task 1: CSV Upload Validation (AC: #1) - 0.5h
- [ ] **1.1** Add validation in Story 8.2 upload endpoint
  - jobId (UUID, PK)
  - sessionId (FK to BulkIssuanceSession)
  - issuerId (FK to User)
  - status (ENUM: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
  - totalBadges (int)
  - processedCount (int, default 0)
  - successCount (int, default 0)
  - failedCount (int, default 0)
  - failedBadges (JSONB array: [{row, recipientEmail, error}])
  - startedAt (DateTime, nullable)
  - completedAt (DateTime, nullable)
  - createdAt (DateTime)
  - updatedAt (DateTime)
- [ ] **1.2** Run Prisma migration: `npx prisma migrate dev --name add-bulk-issuance-job`
- [ ] **1.3** Create indexes on sessionId and status

---

### Task 2: Synchronous Batch Processing API (AC: #2, #3) - 2h
- [ ] **2.1** Update POST `/api/bulk-issuance/confirm/:sessionId` endpoint
- [ ] **2.2** Validate session has ≤20 badges
- [ ] **2.3** Implement synchronous loop processing
- [ ] **2.4** Collect success/failure results
- [ ] **2.5** Return complete results immediately
- [ ] **2.6** Unit tests (10 tests: success, partial failure, all fail, timeout)

**Synchronous Processing Code:**
```typescript
// src/bulk-issuance/bulk-issuance.service.ts
async confirmBulkIssuance(sessionId: string, issuerId: string) {
  // Validate session
  const session = await this.getSession(sessionId);
  if (!session || session.expiresAt < new Date()) {
    throw new BadRequestException('Session expired');
  }
  
  const badges = session.validRows;
  
  // MVP Limit: Max 20 badges
  if (badges.length > 20) {
    throw new BadRequestException('MVP限制：最多20个徽章/批次。Phase 2将支持更大批量。');
  }
  
  if (badges.length === 0 || session.errorRows > 0) {
    throw new BadRequestException('Cannot process: No valid badges or errors exist');
  }
  
  const results = {
    totalBadges: badges.length,
    successCount: 0,
    failedCount: 0,
    successBadges: [],
    failedBadges: []
  };
  
  // Synchronous loop (frontend waits)
  for (const badge of badges) {
    try {
      // Issue badge
      const issuedBadge = await this.badgeInstanceService.issueBadge({
        badgeClassId: badge.badgeTemplateId,
        recipientId: badge.recipientId,
        issuerId: issuerId,
        evidenceUrl: badge.evidenceUrl,
        narrativeJustification: badge.narrativeJustification
      });
      
      // Send email (fire-and-forget)
      this.emailService.sendBadgeIssuedEmail(badge.recipientEmail, issuedBadge)
        .catch(err => this.logger.warn(`Email failed: ${err.message}`));
      
      results.successCount++;
      results.successBadges.push({ 
        recipientEmail: badge.recipientEmail,
        badgeName: badge.badgeName 
      });
      
    } catch (error) {
      this.logger.error(`Badge issuance failed: ${error.message}`, error.stack);
      results.failedCount++;
      results.failedBadges.push({
        recipientEmail: badge.recipientEmail,
        badgeName: badge.badgeName,
        error: error.message
      });
    }
  }
  
  return results;
}
```

**API Response:**
```json
{
  "totalBadges": 20,
  "successCount": 18,
  "failedCount": 2,
  "successBadges": [
    { "recipientEmail": "john@company.com", "badgeName": "Leadership Excellence" }
  ],
  "failedBadges": [
    { "recipientEmail": "jane@company.com", "badgeName": "Team Player", "error": "User not found" }
  ]
}
```

---

### Task 3: Frontend - Loading State UI (AC: #4) - 1h
- [ ] **3.1** Update `BulkPreviewPage.tsx` confirmation handler
- [ ] **3.2** Show loading modal with spinner
- [ ] **3.3** Display message: "正在发放徽章，请稍候..."
- [ ] **3.4** Estimate time: "预计需要 {count} 秒"
- [ ] **3.5** Disable all UI interactions during processing
- [ ] **3.6** Handle 30-second timeout with error message
- [ ] **3.7** Component tests (4 tests)

**Loading UI:**
```
+-----------------------------------------------------------------------+
|  ⏳ 正在发放徽章                                                      |
|-----------------------------------------------------------------------|
|                                                                       |
|                         [======     ]                                 |
|                                                                       |
|  正在处理 20 个徽章，请稍候...                                        |
|  预计需要 20 秒                                                       |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

### Task 4: Frontend - Result Display UI (AC: #5) - 0.5h
- [ ] **4.1** Update `BulkPreviewPage.tsx` to handle immediate response
- [ ] **4.2** Display success/failure summary
- [ ] **4.3** Show failed badges in error table
- [ ] **4.4** "Download Error Report" button (CSV export)
- [ ] **4.5** "Retry Failed Badges" button (re-create session)
- [ ] **4.6** Component tests (3 tests)

---

### Task 5: Email Notification Integration (AC: #6) - 0.25h
- [ ] **5.1** In synchronous loop, call `GraphEmailService.sendBadgeIssuedEmail()`
- [ ] **5.2** Email send is fire-and-forget (don't block badge creation)
- [ ] **5.3** Log email send failures but don't fail badge issuance
- [ ] **5.4** Include email errors in failedBadges response if they occur

---

### Task 6: Testing (AC: All) - 0.75h
- [ ] **6.1** Unit tests for synchronous processing (5 tests)
- [ ] **6.2** E2E test: Upload 10 badges, confirm, verify all issued (1 test)
- [ ] **6.3** E2E test: Upload 20 badges, verify 20-second processing (1 test)
- [ ] **6.4** E2E test: Upload 21 badges, verify error message (1 test)
- [ ] **6.5** E2E test: Partial failure scenario (1 test)

---

## Dev Notes

### MVP Simplification Rationale
**Decision Date**: 2026-02-05 (Sprint 9 Planning)

**Why Synchronous Processing for MVP?**
1. **Validate User Behavior**: Unknown if users truly need >20 badges at once
2. **Reduce Complexity**: No Redis, no Bull Queue, no background workers
3. **Faster Delivery**: 4h instead of 8h
4. **Lean Development**: Build minimum viable, then iterate based on feedback
5. **Cost Optimization**: Save $12/month Azure Redis during MVP phase

**Acceptable Trade-offs for MVP:**
- ✅ 20-badge limit acceptable for pilot users
- ✅ 20-second wait time tolerable (comparable to file upload times)
- ✅ Manual retry acceptable for failures
- ✅ No real-time progress (simple loading state sufficient)

**Upgrade Path to Phase 2 (Post-MVP):**
See **TD-016** (Technical Debt) for async enhancement plan when validated.

### Architecture Patterns Used
- **Synchronous Loop Processing**: Simple HTTP request-response cycle
- **Partial Failure Handling**: Continue processing despite individual failures
- **Fire-and-Forget Emails**: Email failures don't block badge creation
- **Timeout Protection**: 30-second HTTP timeout prevents infinite waits

### Source Tree Components
```
backend/src/
├── bulk-issuance/
│   ├── bulk-issuance.controller.ts       # POST /confirm/:sessionId (synchronous)
│   ├── bulk-issuance.service.ts          # confirmBulkIssuance() loop logic
│   ├── csv-validation.service.ts         # Row validation (from 8.1)
│   └── dto/
│       ├── bulk-issuance-row.dto.ts
│       ├── bulk-result.dto.ts            # Success/failure results
│       └── bulk-error.dto.ts

frontend/src/
├── pages/
│   └── BulkPreviewPage.tsx               # Confirmation + Loading + Results
├── components/
│   └── BulkIssuance/
│       ├── BulkLoadingModal.tsx          # Loading state during processing
│       └── BulkResultSummary.tsx         # Success/failure display
```

### Testing Standards
- **Backend:** 10 unit tests (synchronous processing API)
- **Frontend:** 7 component tests (loading UI, results display)
- **E2E:** 4 tests (full bulk flow with limits)
- **TD-014:** Email-related E2E tests (estimated 10 tests) + manual verification
- **Target Coverage:** >80%

### Performance Notes
- **Processing Speed**: ~1 badge/second (synchronous DB + email)
- **20 Badges**: ~20 seconds total processing time
- **HTTP Timeout**: 30 seconds (buffer for slower networks)
- **Email Delays**: Fire-and-forget, doesn't block main loop

### Phase 2 Upgrade Path (TD-016)
**When to upgrade?**
- User feedback confirms need for >20 badges/batch
- Bulk issuance usage >10 times/week
- Users report 20-second wait time is too long

**What changes in Phase 2?**
- Add Redis + Bull Queue
- Support 100+ badges per batch
- Async processing with job IDs
- Real-time progress tracking (polling or WebSocket)
- Job failure recovery and retry mechanisms

**Estimated Effort**: 6-8h (reuse Story 8.1-8.3, add async layer)

### References
- Email service: `src/email/graph-email.service.ts`
- Badge issuance: `src/badges/badge-instance.service.ts`
- Session management: Story 8.2 implementation
│       ├── BulkIssuanceProgress.tsx       # Progress bar
---

## Dev Agent Record

### Agent Model Used
**Model:** Claude Opus 4.6  
**Date:** 2026-02-08

### Completion Notes
**Status:** Complete  
**Blockers:** None  
**MVP Simplification:** Redis async processing deferred to TD-016 (Phase 2)

### Test Results
- **Backend Unit Tests:** 532 passed, 0 failures (12 new confirm tests)
- **Frontend Tests:** 390 passed, 0 failures (20 new tests)
- **E2E Tests:** 156 passed, 0 failures (4 new confirm E2E tests)
- **ESLint:** 0 errors, 283 warnings
- **Bundle Size:** 235 KB (≤240 KB budget)

### Commits
1. `8a153c1` — refactor: TD-014 email system unification — remove nodemailer
2. `5a6e320` — feat: Story 8.4 backend — synchronous batch processing
3. `ffa4746` — feat: Story 8.4 frontend — loading UI + result display
4. `3ac4bca` — test: Story 8.4 E2E tests for batch processing

### File List
**Files Created:**
- `frontend/src/components/BulkIssuance/__tests__/ProcessingModal.test.tsx`
- `frontend/src/components/BulkIssuance/__tests__/ProcessingComplete.test.tsx`
- `backend/test/bulk-issuance-confirm.e2e-spec.ts`

**Files Modified:**
- `backend/src/common/email.service.ts` (rewritten: nodemailer → GraphEmailService wrapper)
- `backend/src/common/email.module.ts` (import MicrosoftGraphModule)
- `backend/src/modules/auth/auth.module.ts` (import EmailModule instead of direct provider)
- `backend/src/microsoft-graph/microsoft-graph.module.ts` (remove EmailModule import)
- `backend/src/microsoft-graph/microsoft-graph.module.spec.ts` (remove EmailService mock)
- `backend/src/bulk-issuance/bulk-issuance.module.ts` (import BadgeIssuanceModule)
- `backend/src/bulk-issuance/bulk-issuance.service.ts` (implement confirmBulkIssuance)
- `backend/src/bulk-issuance/bulk-issuance.service.spec.ts` (12 new tests)
- `backend/src/bulk-issuance/bulk-issuance.controller.ts` (Swagger response schema)
- `backend/package.json` (remove nodemailer, update max-warnings)
- `frontend/src/components/BulkIssuance/ProcessingModal.tsx` (translate + enhance)
- `frontend/src/components/BulkIssuance/ProcessingComplete.tsx` (failed table + download)
- `frontend/src/components/BulkIssuance/BulkPreviewPage.tsx` (AbortController timeout + results)
- `frontend/src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` (2 new tests)
- `docs/setup/EMAIL_SETUP_QUICK.md` (rewritten for Graph API)

---

## Retrospective Notes

### What Went Well
- TBD

### Challenges Encountered
- TBD

### Lessons Learned
- TBD

### Phase 2 Decision Point
- [ ] **User Feedback**: Did users request >20 badges/batch?
- [ ] **Usage Metrics**: Bulk issuance frequency and batch sizes
- [ ] **Wait Time Feedback**: Was 20-second wait acceptable?
- [ ] **Decision**: Proceed with TD-016 async upgrade? (Yes/No/Defer)

