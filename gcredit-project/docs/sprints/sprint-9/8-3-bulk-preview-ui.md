# Story 8.3: Build Bulk Issuance Preview UI

**Status:** backlog  
**Epic:** Epic 8 - Bulk Badge Issuance  
**Sprint:** Sprint 9  
**Priority:** MEDIUM  
**Estimated Hours:** 14.5h (原8h + P0修复2.5h + P1改进1h + TD-013 3h)  
**Actual Hours:** TBD  
**Dependencies:** Story 8.2 (CSV Upload & Parsing)  
**Post-Review Updates:** UX-P0-3, C2, UX-P1-3, UX-P1-5 (2026-02-05审查)  
**Security Critical:** 🔴 MUST implement C2 (Session IDOR) validation  
**Includes Tech Debt:** 🔧 TD-013 (Frontend Bundle Code Splitting, 3h) — 作为前置任务嵌入本Story

---

## Story

As an **Issuer**,  
I want **to preview bulk issuance before confirming**,  
So that **I can verify all data is correct before issuing badges**.

---

## Acceptance Criteria

1. [ ] **AC1: Preview Summary Header**
   - Display total badge count to be issued
   - Show breakdown by badge template with counts
   - Display validation status: "X badges ready, Y errors"

2. [ ] **AC2: Preview Data Table** ⚠️ **P1-Enhancement**
   - Table columns: Badge Name, Recipient Name, Recipient Email, Evidence URL, Status
   - Display all valid rows from session data
   - ⚠️ **UX-P1-5**: Pagination adjustment (0.5h)
     - Change from 50 rows/page to 25 rows/page for careful review
     - Add rows-per-page selector: [10 | 25 | 50]
     - Default to 25 for optimal UX
   - Support search by recipient name or email
   - Support filter by badge template

3. [ ] **AC3: Error Handling** 🔴 **P0-Fix** (UX-P0-3, 1.5h)
   - If errors exist, display error list prominently at top
   - Error rows highlighted in red with error message
   - ⚠️ **Critical UX Gap**: Add complete error correction workflow:
     - "Download Error Report" button → CSV with only error rows + error messages
       - Columns: Row, BadgeTemplateId, RecipientEmail, Error
     - Guided workflow text:
       ```
       ⚠️ 5 errors prevent badge issuance
       
       To fix errors:
       1. Click "Download Error Report" below
       2. Correct errors in your original CSV file
       3. Click "Re-upload Fixed CSV" to replace this upload
       
       Or:
       - Continue with 15 valid badges (5 will be skipped)
       ```
     - "Re-upload Fixed CSV" button returns to Story 8.2 upload step
     - Clear current session and pre-populate upload area if possible

4. [ ] **AC4: Confirmation Actions**
   - "Confirm and Issue" button enabled only if no errors (validRows > 0, errorRows = 0)
   - "Cancel" button returns to upload step
   - Show warning modal before confirmation: "You are about to issue X badges. This cannot be undone. Continue?"

5. [ ] **AC5: Session Management** 🔴 **Security + UX Fixes**
   - ⚠️ **ARCH-C2**: Session ownership validation (CRITICAL, 1h)
     - Validate `session.issuerId === currentUser.id` before loading preview
     - Throw `ForbiddenException` if user tries to access another user's session
     - Prevents IDOR attack (User B accessing User A's bulk issuance)
     - Log security events for monitoring
   - Preview loads data from session using sessionId
   - ⚠️ **UX-P1-3**: Session timer optimization (0.5h)
     - Don't show countdown until 5 minutes remaining (reduces anxiety)
     - 30-5 min: No timer displayed
     - 5-0 min: Show warning "⏱️ Preview expires in 4:32. Please confirm soon."
     - 0 min: Modal "Session expired. Please re-upload your CSV."
   - If session expired, show error and redirect to upload step

6. [ ] **AC6: Empty State**
   - If CSV has zero valid rows, display: "No valid badges found in CSV. Please check the template format and try again."
   - Show "Re-upload CSV" button

7. [ ] **AC7: Frontend Bundle Optimization (TD-013)**
   - Route-based code splitting implemented via `lazy()` + `<Suspense>`
   - Vendor libraries split into separate chunks (react, ui, chart, utils)
   - Main bundle size reduced from 579 KB to <400 KB
   - All routes load correctly after splitting
   - Lighthouse performance score improved by ≥10 points

---

## Tasks / Subtasks

### Task 0: TD-013 — Frontend Bundle Code Splitting (前置任务) - 3h

> **Tech Debt TD-013** 嵌入本 Story，作为前置任务在 Preview UI 开发前完成。
> **理由：** Preview UI 是复杂前端组件，先优化包体积防止膨胀。

- [ ] **0.1** Analyze current bundle (0.5h)
  - Run `npm run build`
  - Run `npx vite-bundle-visualizer` to identify large chunks
  - Document top 5 largest dependencies
- [ ] **0.2** Implement route-based code splitting (1.5h)
  - Convert route imports to `lazy(() => import(...))`
  - Add `<Suspense>` fallback for loading states
  - Split routes: Dashboard, Badge Management, Bulk Issuance, Analytics
- [ ] **0.3** Split large vendor libraries (0.5h)
  - Configure manual chunks in `vite.config.ts`
  - Separate: React, UI library, Chart.js, date utilities
  - ```typescript
    // vite.config.ts
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'chart-vendor': ['chart.js', 'react-chartjs-2'],
            'utils-vendor': ['date-fns', 'lodash-es']
          }
        }
      }
    }
    ```
- [ ] **0.4** Verify bundle size reduction (0.5h)
  - Rebuild and measure bundle size
  - Target: <400 KB main bundle (from 579 KB)
  - Run Lighthouse to verify performance improvement
  - Verify all routes load correctly with code splitting

**TD-013 Success Criteria:**
- [ ] Main bundle size reduced to <400 KB
- [ ] Lighthouse performance score improved by ≥10 points
- [ ] All routes load correctly with code splitting
- [ ] No increase in Time to Interactive (TTI)

**TD-013 Files to Modify:**
- `frontend/vite.config.ts` (manual chunks configuration)
- `frontend/src/App.tsx` (lazy imports + Suspense)
- `frontend/src/main.tsx` (if needed)

---

### Task 1: Backend - Preview Data API (AC: #1, #2, #5) - 1.5h
- [ ] **1.1** Create GET `/api/bulk-issuance/preview/:sessionId` endpoint
- [ ] **1.2** Retrieve session data from `BulkIssuanceSession` table
- [ ] **1.3** Validate session not expired
- [ ] **1.4** Enrich data with recipient names (join User table)
- [ ] **1.5** Enrich data with badge names (join BadgeClass table)
- [ ] **1.6** Return preview data with pagination support
- [ ] **1.7** Unit tests for preview API (6 tests: success, expired session, not found, etc.)

**API Response Example:**
```json
{
  "sessionId": "uuid-1234",
  "totalRows": 100,
  "validRows": 95,
  "errorRows": 5,
  "expiresAt": "2026-02-06T10:30:00Z",
  "summary": {
    "byTemplate": [
      { "templateName": "Leadership Excellence", "count": 45 },
      { "templateName": "Team Player", "count": 30 },
      { "templateName": "Innovation Award", "count": 20 }
    ]
  },
  "validData": [
    {
      "badgeTemplateId": "uuid-abc",
      "badgeName": "Leadership Excellence",
      "recipientEmail": "john@company.com",
      "recipientName": "John Doe",
      "evidenceUrl": "https://example.com/evidence",
      "narrativeJustification": "Completed advanced training"
    }
    // ... more rows
  ],
  "errors": [
    { "row": 12, "field": "badgeTemplateId", "error": "Badge template not found", "value": "Invalid Badge" },
    { "row": 45, "field": "recipientEmail", "error": "User does not exist", "value": "invalid@company.com" }
  ]
}
```

---

### Task 2: Frontend - Preview Header Component (AC: #1) - 1.5h
- [ ] **2.1** Create `BulkPreviewHeader.tsx` component
- [ ] **2.2** Display total count: "Bulk Issuance Preview - 95 Badges"
- [ ] **2.3** Display breakdown by template as pills/chips
- [ ] **2.4** Show validation status badge (green if no errors, red if errors)
- [ ] **2.5** Display session expiry countdown timer
- [ ] **2.6** Component tests (4 tests)

**UI Mockup:**
```
+-----------------------------------------------------------+
|  📊 Bulk Issuance Preview                                 |
|-----------------------------------------------------------|
|  ✅ 95 badges ready to issue  |  ⏱️ Expires in 25:30     |
|                                                           |
|  Badge Breakdown:                                         |
|  [Leadership Excellence: 45] [Team Player: 30]            |
|  [Innovation Award: 20]                                   |
+-----------------------------------------------------------+
```

---

### Task 3: Frontend - Preview Data Table (AC: #2) - 2.5h
- [ ] **3.1** Create `BulkPreviewTable.tsx` component
- [ ] **3.2** Table with columns: Badge Name, Recipient, Email, Evidence, Status
- [ ] **3.3** Implement client-side pagination (50 rows per page)
- [ ] **3.4** Add search input (filter by recipient name or email)
- [ ] **3.5** Add badge template filter dropdown
- [ ] **3.6** Responsive table design (scrollable on mobile)
- [ ] **3.7** Show row count: "Showing 1-50 of 95 badges"
- [ ] **3.8** Component tests (6 tests: render, pagination, search, filter)

**Table UI:**
```
+-----------------------------------------------------------------------+
| Search: [____________]  Filter by: [All Templates ▼]                  |
|-----------------------------------------------------------------------|
| Badge Name             | Recipient       | Email              | ...   |
|-----------------------------------------------------------------------|
| Leadership Excellence  | John Doe        | john@company.com   | View  |
| Leadership Excellence  | Jane Smith      | jane@company.com   | View  |
| Team Player            | Bob Johnson     | bob@company.com    | View  |
| ...                                                                    |
|-----------------------------------------------------------------------|
|                           « 1 2 3 ... 10 »                            |
|                        Showing 1-50 of 95 badges                      |
+-----------------------------------------------------------------------+
```

---

### Task 4: Frontend - Error Display (AC: #3) - 1h
- [ ] **4.1** Create `ErrorListSection.tsx` component
- [ ] **4.2** Display errors in collapsible section at top of page
- [ ] **4.3** Error table columns: Row #, Field, Error Message, Value
- [ ] **4.4** Highlight error count badge: "⚠️ 5 errors found"
- [ ] **4.5** "Fix Errors" button navigates back to upload step
- [ ] **4.6** "Download Error Report" button generates CSV with errors
- [ ] **4.7** Component tests (4 tests)

**Error Display UI:**
```
+-----------------------------------------------------------------------+
| ⚠️ 5 Errors Found - Please fix and re-upload                         |
|-----------------------------------------------------------------------|
| Row | Field            | Error                          | Value        |
|-----------------------------------------------------------------------|
| 12  | badgeTemplateId  | Badge template not found       | Invalid...   |
| 45  | recipientEmail   | User does not exist            | invalid@...  |
| 67  | evidenceUrl      | Invalid URL format             | htp://...    |
|-----------------------------------------------------------------------|
| [🔄 Fix Errors] [📥 Download Error Report]                           |
+-----------------------------------------------------------------------+
```

---

### Task 5: Frontend - Confirmation Actions (AC: #4) - 1h
- [ ] **5.1** Create action buttons section at bottom of page
- [ ] **5.2** "Cancel" button (returns to upload, clear session)
- [ ] **5.3** "Confirm and Issue" button (green, primary)
  - Disabled if errorRows > 0
  - Disabled if validRows = 0
  - Shows loading spinner when processing
- [ ] **5.4** Confirmation modal with warning message
- [ ] **5.5** Modal shows final count: "Issue 95 badges?"
- [ ] **5.6** Modal has "Cancel" and "Confirm" buttons
- [ ] **5.7** Component tests (5 tests: button states, modal, confirmation)

---

### Task 6: Frontend - Empty State Handling (AC: #6) - 0.5h
- [ ] **6.1** Create `EmptyPreviewState.tsx` component
- [ ] **6.2** Display friendly message and icon
- [ ] **6.3** Show "Re-upload CSV" button
- [ ] **6.4** Component test

**Empty State UI:**
```
+-----------------------------------------------------------------------+
|                                                                       |
|                          📋  No Valid Badges                          |
|                                                                       |
|         No valid badges found in CSV file.                            |
|         Please check the template format and try again.               |
|                                                                       |
|                        [🔄 Re-upload CSV]                             |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

### Task 7: Session Expiry Handling (AC: #5) - 1h
- [ ] **7.1** Check session expiry on page load
- [ ] **7.2** Show countdown timer using `setInterval`
- [ ] **7.3** Warning at 5 minutes remaining: "Preview expires soon. Please confirm soon."
- [ ] **7.4** When expired, show modal: "Session expired. Please upload your CSV again."
- [ ] **7.5** Redirect to upload step after expiry
- [ ] **7.6** Unit tests for expiry logic (3 tests)

---

## Dev Notes

### Architecture Patterns Used
- **Composition**: Break preview into smaller focused components
- **Context API**: Share preview data across components
- **Client-side Filtering**: For performance, filter/search on loaded data
- **Optimistic UI**: Show immediate feedback for user actions

### Source Tree Components
```
backend/src/
├── bulk-issuance/
│   ├── bulk-issuance.controller.ts       # GET /preview/:sessionId
│   └── bulk-issuance.service.ts          # getPreviewData()

frontend/src/
├── pages/
│   └── BulkPreviewPage.tsx                # Main preview page
├── components/
│   └── BulkIssuance/
│       ├── BulkPreviewHeader.tsx          # Summary header
│       ├── BulkPreviewTable.tsx           # Data table
│       ├── ErrorListSection.tsx           # Error display
│       ├── EmptyPreviewState.tsx          # Empty state
│       ├── ConfirmationModal.tsx          # Confirm dialog
│       └── SessionExpiryTimer.tsx         # Countdown timer
```

### Testing Standards
- **Backend:** 6 unit tests (preview API)
- **Frontend:** 27 component tests (all components)
- **E2E:** 6 tests (preview flow, errors, expiry, confirmation)
- **TD-013:** Manual testing (all routes after build) + Lighthouse audit
- **Target Coverage:** >80%

### UX Design Principles
- **Progressive Disclosure**: Show errors prominently but don't block preview
- **Immediate Feedback**: Search and filter work instantly
- **Clear Actions**: Primary action (Confirm) is visually distinct
- **Safety**: Confirmation modal prevents accidental issuance

### References
- UX Design Specification: Section on Bulk Operations
- React Table patterns from Badge Wallet (Sprint 4)

---

## Dev Agent Record

### Agent Model Used
**Model:** TBD  
**Date:** TBD

### Completion Notes
**Status:** TBD  
**Blockers:** None

### Test Results
- **Unit Tests:** TBD
- **E2E Tests:** TBD

### File List
**Files Created:** TBD  
**Files Modified:** TBD

---

## Retrospective Notes

### What Went Well
- TBD

### Challenges Encountered
- TBD

### Lessons Learned
- TBD
