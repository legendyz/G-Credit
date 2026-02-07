# Sprint 9 Backlog

**Sprint:** Sprint 9  
**Duration:** 2026-02-06 to 2026-02-20 (2 weeks)  
**Target Version:** v0.9.0  
**Sprint Type:** Balanced Approach (Features + Tech Debt)

---

## 🎯 Sprint Goal

**Primary:** Deliver Epic 8 (Bulk Badge Issuance) MVP with CSV upload, validation, preview, and synchronous batch processing (max 20 badges).

**Secondary:** Address 3 P2 technical debt items (ESLint warnings, email unification, bundle optimization) to prevent P1 escal ation.

**MVP Scope Decision**: Simplified Story 8.4 to synchronous processing (Redis async deferred to TD-016 Phase 2) to validate core workflow first.

**Success Criteria:**
- ✅ Issuers can issue ≤20 badges via CSV upload
- ✅ CSV validation provides actionable error messages
- ✅ Bulk preview shows all badges before issuance
- ✅ Synchronous processing completes within 20-30 seconds (acceptable for MVP)
- ✅ ESLint warnings reduced by 55% (1100 → 500)
- ✅ nodemailer fully removed, GraphEmailService only
- ✅ Frontend bundle <400KB
- ✅ All 876 existing tests pass (0 regressions)

---

## 📊 Sprint Capacity

### Team Composition
- **Developers:** 2 full-time (40h each)
- **Total Capacity:** 80 hours

### Capacity Allocation (Balanced Approach)
| Category | Hours | % | Notes |
|----------|-------|---|-------|
| **Feature Development** | 32h | 40% | Epic 8 stories 8.1-8.4 (包含P1审查改进8h) |
| **Technical Debt** | 13h | 16% | TD-015, TD-014, TD-013 |
| **Testing** | 12h | 15% | Unit + E2E for new features (包含14个新安全测试) |
| **Code Reviews** | 8h | 10% | PR reviews, pair programming |
| **Bug Fixes** | 4h | 5% | Fix issues found during testing |
| **Sprint Ceremonies** | 8h | 10% | Planning, dailies, retro, demo |
| **Buffer** | 3h | 4% | Unforeseen blockers |
| **TOTAL** | **80h** | **100%** | |

### Pre-Sprint Preparation (NOT counted in Sprint capacity)
| Task | Hours | Deadline | Status |
|------|-------|----------|--------|
| **P0 Security Fixes** | 2h | 2026-02-05 19:00 | ⏳ In Progress |
| **P0 UX Fixes** | 4h | 2026-02-05 19:00 | ⏳ In Progress |
| **TOTAL** | **6h** | Today | ⚠️ BLOCKING for Sprint start |

**Note:** P0 fixes must complete before Sprint 9 kickoff tomorrow (2026-02-06 09:00).

### Proven Sustainability
- **Sprint 8:** 80h capacity, 95% estimation accuracy
- **Sprint 9:** Using same 80h based on Sprint 8 success

---

##📦 Epic 8: Bulk Badge Issuance (32h Features - MVP Simplified + Review Enhancements)

### Overview
Enable issuers to issue multiple badges at once via CSV upload. **MVP Phase focuses on synchronous processing (max 20 badges) to validate core workflow before adding Redis/async complexity** (deferred to TD-016 Phase 2).

**Post-Review Enhancements:** Integrated P1 improvements from UX/Architecture review (2026-02-05): security fixes, UX enhancements, +8h effort.

### Stories

#### Story 8.1: CSV Template & Validation - 8.5h (原6h + P1改进2.5h)
**Priority:** HIGH  
**Status:** done ✅ (SM accepted 2026-02-07, 8h actual)  
**Assigned to:** Dev Agent  
**Dependencies:** None

**Summary:**
Download standardized CSV template with field specifications. Validate CSV structure and required headers.

**Key Features:**
- Downloadable CSV template with example rows
- 🔴 **P0**: Example rows MUST have "EXAMPLE-DELETE-THIS-ROW" prefix (UX-P0-2)
- Template includes: badgeTemplateId, recipientEmail, evidenceUrl (optional), narrativeJustification (optional)
- Template validation service for structure checking
- CSV format help documentation
- ⚠️ **P1**: Badge template selector UI (UX-P1-1, 2h)
- ⚠️ **P1**: File size limit 10MB→100KB for 20-badge MVP (UX-P1-2, 0.5h)

**Acceptance Criteria:**
- ✅ Template available at `/api/bulk-issuance/template`
- ✅ Template has proper headers + 2 example rows
- ✅ Field specifications documented inline (comments)
- ✅ Template download tracked in analytics

**Testing:**
- 3 unit tests (template generation)
- 15 validation tests (CSV structure, field format)
- 3 component tests (download button)
- 5 E2E tests (template download, validation flow)

**Detailed Implementation:** See `sprint-9/8-1-csv-template-validation.md`

---

#### Story 8.2: CSV Upload & Parsing - 11.5h (原6h + 安全修复4.5h + UX改进1h)
**Priority:** HIGH  
**Status:** done ✅ (SM accepted 2026-02-07, 4h actual)  
**Assigned to:** Dev Agent  
**Dependencies:** Story 8.1 ✅  
**Security Critical:** 🔴 MUST implement C1 (CSV Injection) and C2 (IDOR) before development

**Summary:**
Upload CSV file with drag-and-drop support. Parse and validate each row for badge issuance requirements.

**Key Features:**
- File upload with drag-and-drop (max 100KB updated for MVP)
- ⚠️ **P1**: Drag-drop visual feedback states (UX-P1-4, 1h)
- CSV parsing with UTF-8 encoding support
- 🔴 **P1**: UTF-8 BOM handling for Windows Excel (ARCH-C5, 0.5h)
- Row-by-row validation:
  - 🔴 **P1**: CSV injection sanitization (ARCH-C1, 1h) - CRITICAL SECURITY
  - 🔴 **P1**: XSS input sanitization (ARCH-C7, 1h)
  - 🔴 **P1**: Run validation in transaction (ARCH-C4, 1.5h)
  - badgeTemplateId exists and status = APPROVED
  - recipientEmail exists in User table
  - evidenceUrl format valid (if provided)
  - narrativeJustification ≤500 chars (if provided)
- 🔴 **P1**: Rate limiting @Throttle (ARCH-C3, 0.5h)
- Validation summary: totalRows, validRows, errorRows
- Session storage (30 min expiry) for preview

**Acceptance Criteria:**
- ✅ Upload accepts CSV/TXT files only
- ✅ File size validation (max 10MB)
- ✅ All validation errors collected with row numbers
- ✅ Session created for preview retrieval
- ✅ Old sessions cleaned up automatically

**Testing:**
- 8 unit tests (file upload API)
- 10 unit tests (row validation)
- 5 unit tests (session storage)
- 5 component tests (upload UI)
- 8 E2E tests (upload flow, errors, large files)

**Detailed Implementation:** See `sprint-9/8-2-csv-upload-parsing.md`

---

#### Story 8.3: Bulk Issuance Preview UI - 11.5h (原8h + P0修复2.5h + P1改进1h)
**Priority:** MEDIUM  
**Status:** backlog  
**Assigned to:** TBD  
**Dependencies:** Story 8.2  
**Security Critical:** 🔴 MUST implement C2 (Session IDOR) validation

**Summary:**
Display preview of all badges to be issued before confirmation. Show validation errors prominently with fix options.

**Key Features:**
- Preview summary header (badge count, breakdown by template)
- Data table with pagination (25 rows per page, reduced from 50)
- ⚠️ **P1**: Pagination adjustment + rows-per-page selector (UX-P1-5, 0.5h)
- Search by recipient name/email
- Filter by badge template
- 🔴 **P0**: Complete error correction workflow (UX-P0-3, 1.5h)
  - "Download Error Report" CSV with only error rows
  - Guided fix workflow with "Re-upload Fixed CSV" button
  - Clear instructions on how to correct and retry
- 🔴 **P1**: Session ownership IDOR validation (ARCH-C2, 1h) - CRITICAL SECURITY
- ⚠️ **P1**: Session timer only shows at 5 min remaining (UX-P1-3, 0.5h)
- Confirmation modal: "Issue X badges?"

**Acceptance Criteria:**
- ✅ Preview loads from session ID
- ✅ Table shows: Badge Name, Recipient, Email, Evidence, Status
- ✅ Errors highlighted in red at top
- ✅ "Confirm and Issue" disabled if errors exist
- ✅ Empty state shown if zero valid rows
- ✅ Session expiry warning at 5 min remaining

**Testing:**
- 6 unit tests (preview API)
- 27 component tests (all UI components)
- 6 E2E tests (preview flow, errors, expiry, confirmation)

**Detailed Implementation:** See `sprint-9/8-3-bulk-preview-ui.md`

---

#### Story 8.4: Bulk Issuance Synchronous Processing (MVP) - 6.5h (原4h + P0修复2h + P1改进0.5h)
**Priority:** MEDIUM  
**Status:** backlog  
**Assigned to:** TBD  
**Dependencies:** Story 8.3  
**Security Critical:** 🔴 MUST implement C2 (Session IDOR) validation

**MVP Simplification**: Deferred Redis/async processing to TD-016. Sprint 9 implements synchronous processing with 20-badge limit to validate core workflow.

**Summary:**
Process bulk badge issuance synchronously with up to 20 badges per batch. Simple, fast delivery to validate MVP user needs.

**Key Features:**
- Synchronous HTTP request processing (no background jobs)
- Max 20 badges per batch (validate user behavior first)
- 🔴 **P0**: Pseudo-progress indicator for 20s wait (UX-P0-1, 2h) - CRITICAL UX
  - Live counter "Processing badge 5 of 20..."
  - Running success/failure counts
  - Estimated time countdown
  - Prevents "frozen app" perception
- Immediate results display (no polling)
- Partial failure handling (collect all errors)
- 🔴 **P1**: Session ownership IDOR validation (ARCH-C2, shared with 8.3)
- ⚠️ **P1**: Document transaction strategy (ARCH-C6, 0.5h)
- Email notification for each successful badge

**MVP Trade-offs (Acceptable):**
- ✅ 20-badge limit (sufficient for pilot users)
- ✅ 20-second wait time (tolerable, like file uploads)
- ✅ Manual retry for failures
- ✅ No Redis dependency (cost saving: $12/month)

**Acceptance Criteria:**
- ✅ CSV upload validates ≤20 badges (error if >20)
- ✅ POST `/api/bulk-issuance/confirm/:sessionId` processes synchronously
- ✅ Frontend shows loading state with time estimate
- ✅ Returns complete results immediately (success/failure counts)
- ✅ Failed badges shown in error table
- ✅ Email sent for each successful badge

**Testing:**
- 10 unit tests (synchronous processing)
- 7 component tests (loading UI, results)
- 4 E2E tests (limits, timeouts, partial failures)

**Phase 2 Upgrade Path:** See TD-016 for async enhancement when validated

**Detailed Implementation:** See `sprint-9/8-4-batch-processing-phase1.md`

---

## 🔧 Technical Debt (13h TD Cleanup)

### TD-015: Fix ESLint Type Safety Warnings (8h total)

#### Phase 1: Fix `no-unsafe-call` and `no-unsafe-return` (4h)
**Priority:** P2  
**Status:** backlog  
**Assigned to:** TBD

**Problem:** 1100+ ESLint warnings from TypeScript strict rules.

**Target:** Reduce warnings from 1100 → 800 (27% reduction)

**Tasks:**
- Fix `@typescript-eslint/no-unsafe-call` (300 warnings)
- Fix `@typescript-eslint/no-unsafe-return` (300 warnings)
- Add proper type assertions
- Fix Prisma query result types
- Run full test suite (0 regressions)

**Success Criteria:**
- ✅ ESLint warning count ≤800
- ✅ All 876 tests pass
- ⚠️ Type checking (`npx tsc --noEmit`): 138 pre-existing errors — tracked as **TD-017** (Sprint 10)

---

#### Phase 2: Fix `no-unsafe-member-access` and `no-unused-vars` (4h)
**Priority:** P2  
**Status:** backlog  
**Assigned to:** TBD

**Target:** Reduce warnings from 800 → 500 (55% reduction from baseline)

**Tasks:**
- Fix `@typescript-eslint/no-unsafe-member-access` (200 more warnings)
- Fix `@typescript-eslint/no-unused-vars` (100 warnings)
- Remove unused imports/parameters
- Add type definitions for Prisma relations
- Run full test suite (0 regressions)

**Success Criteria:**
- ✅ ESLint warning count ≤500
- ✅ All 876 tests pass
- ✅ Progress documented for Sprint 10 completion

**Detailed Plan:** See `sprint-9/technical-debt-tasks.md`

---

### TD-014: Email System Unification (2h)
**Priority:** P2  
**Status:** backlog  
**Assigned to:** TBD

**Problem:** Two email systems (nodemailer + GraphEmailService) causing duplication and complexity.

**Solution:** Remove nodemailer entirely, use GraphEmailService only.

**Tasks:**
- Audit codebase for nodemailer usage
- Migrate remaining nodemailer calls to GraphEmailService
- `npm uninstall nodemailer @types/nodemailer`
- Update documentation
- Test all email sending (badge issuance, notifications)

**Success Criteria:**
- ✅ Zero `nodemailer` references in codebase
- ✅ All emails sent via GraphEmailService
- ✅ Email tests passing

**Impact:** Reduces code complexity, simplifies configuration, prepares for Story 8.4 bulk email sending.

**Detailed Plan:** See `sprint-9/technical-debt-tasks.md`

---

### TD-013: Frontend Bundle Code Splitting (3h)
**Priority:** P2  
**Status:** backlog  
**Assigned to:** TBD

**Problem:** Frontend bundle size 579 KB (exceeds 400 KB best practice).

**Solution:** Implement route-based code splitting and vendor chunk separation.

**Tasks:**
- Analyze current bundle with `vite-bundle-visualizer`
- Convert route imports to `lazy(() => import(...))`
- Add `<Suspense>` fallback for loading states
- Configure manual chunks in `vite.config.ts`:
  - react-vendor, ui-vendor, chart-vendor, utils-vendor
- Measure bundle size reduction

**Success Criteria:**
- ✅ Main bundle <400 KB
- ✅ Lighthouse performance score improved ≥10 points
- ✅ All routes load correctly
- ✅ No increase in Time to Interactive (TTI)

**Impact:** Improves initial page load speed, better user experience on slow networks.

**Detailed Plan:** See `sprint-9/technical-debt-tasks.md`

---

## 📋 Sprint Task Breakdown

### Week 1 (2026-02-06 to 2026-02-12)

#### Day 1-2 (Monday-Tuesday)
- [ ] **Sprint Kickoff Ceremony** (2h)
  - Review Sprint Goal
  - Story breakdown discussion
  - Task assignment
  - Environment setup verification
- [ ] **Git Branch Setup** (0.5h) - Story 0.1 CRITICAL
  - Create branch: `sprint-9/epic-8-bulk-issuance-td-cleanup`
  - Verify branch protection rules
- [ ] **Story 8.1: CSV Template** (6h)
  - Backend API for template download
  - Frontend download button
  - Validation service
  - Testing

#### Day 3-4 (Wednesday-Thursday)
- [ ] **TD-013: Bundle Code Splitting** (3h)
  - Analyze bundle
  - Implement route-based splitting
  - Configure vendor chunks
  - Verify bundle size
- [ ] **Story 8.2: CSV Upload** (6h)
  - File upload UI with drag-and-drop
  - Backend parsing and validation
  - Session storage
  - Testing

#### Day 5 (Friday)
- [ ] **TD-015 Phase 1: ESLint Warnings** (4h)
  - Fix 300 `no-unsafe-call` warnings
  - Fix 300 `no-unsafe-return` warnings
  - Run regression tests
- [ ] **Daily Review & Team Sync** (1h)

---

### Week 2 (2026-02-13 to 2026-02-20)

#### Day 6-7 (Monday-Tuesday)
- [ ] **TD-014: Email Unification** (2h)
  - Audit nodemailer usage
  - Migrate to GraphEmailService
  - Remove dependency
  - Test email sending
- [ ] **TD-015 Phase 2: ESLint Warnings** (4h)
  - Fix 200 `no-unsafe-member-access` warnings
  - Fix 100 `no-unused-vars` warnings
  - Run regression tests

#### Day 8-9 (Wednesday-Thursday)
- [ ] **Story 8.3: Bulk Preview UI** (8h)
  - Preview header component
  - Data table with pagination
  - Error display section
  - Confirmation modal
  - Session expiry handling
  - Testing

#### Day 10 (Friday)
- [ ] **Story 8.4: Batch Processing** (8h)
  - Bull queue setup with Redis
  - Background processor logic
  - Job status API
  - Progress tracking UI
  - Email notification integration
  - Testing

#### Day 11 (Monday - Final Day)
- [ ] **Final Testing & Bug Fixes** (6h)
  - Full E2E regression test suite
  - Fix any discovered issues
  - Code review addressing
- [ ] **Sprint Demo Preparation** (1h)
  - Prepare demo script
  - Test demo environment
- [ ] **Sprint Review Ceremony** (1.5h)
  - Demo bulk issuance flow
  - Show TD improvements (ESLint, bundle size)
- [ ] **Sprint Retrospective** (1.5h)
  - What went well
  - Challenges encountered
  - Action items for Sprint 10

---

## 🎯 Definition of Done

### Story DoD
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] E2E tests written and passing
- [ ] Code reviewed and approved by peer
- [ ] No new ESLint errors introduced
- [ ] Documentation updated (if applicable)
- [ ] Merged to sprint branch

### Sprint DoD
- [ ] All stories completed or explicitly deferred
- [ ] All tests passing (876 existing + new tests)
- [ ] ESLint warnings ≤500 (55% reduction achieved)
- [ ] Frontend bundle <400KB
- [ ] nodemailer fully removed
- [ ] Sprint demo conducted
- [ ] Sprint retrospective completed
- [ ] Sprint branch merged to main
- [ ] Version v0.9.0 tagged in git

---

## ⚠️ Risks & Mitigation

### Risk 1: Bull Queue Redis Dependency
**Probability:** Medium  
**Impact:** HIGH  
**Description:** Story 8.4 requires Redis for Bull queue. Azure Redis Cache configuration issues could block development.

**Mitigation:**
- **Pre-Sprint:** Verify Azure Redis connection in dev environment (Day 1)
- **Backup Plan:** Use in-memory queue fallback for Sprint 9 (no persistence)
- **Owner:** DevOps + Tech Lead

**Status:** PENDING verification

---

### Risk 2: CSV Parsing Performance for Large Files
**Probability:** Low  
**Impact:** MEDIUM  
**Description:** CSV parsing may be slow for files with 10MB (≈50,000 rows).

**Mitigation:**
- **Design:** Story 8.1-8.2 use streaming parser (`csv-parse`)
- **Limit:** Phase 1 MVP limits to 100 badges per upload
- **Testing:** Include performance test with 100-row CSV
- **Deferral:** Large file support deferred to Phase 2 (Sprint 10+)

**Status:** LOW risk with current design

---

### Risk 3: Email Sending Rate Limits (Azure Communication Services)
**Probability:** Low  
**Impact:** MEDIUM  
**Description:** Bulk issuance could trigger Azure email rate limits (unknown threshold).

**Mitigation:**
- **Research:** Check Azure Communication Services rate limits (Day 1)
- **Design:** Story 8.4 processes 10 badges per batch (delay between batches)
- **Monitoring:** Log email send failures without blocking badge creation
- **Escalation:** Contact Azure support if rate limit issues occur

**Status:** LOW risk, monitoring plan in place

---

### Risk 4: Test Suite Regressions from TD-015 Refactoring
**Probability:** Medium  
**Impact:** HIGH  
**Description:** Fixing 600 ESLint warnings could introduce subtle bugs.

**Mitigation:**
- **Strategy:** Run full test suite after every 50 warning fixes
- **Validation:** Use `npx tsc --noEmit` to confirm type safety
- **Incremental:** TD-015 split into Phase 1+2 (smaller batches)
- **Rollback:** Git commits per file for easy rollback if needed

**Status:** MITIGATED with incremental approach

---

## 🔗 Dependencies

### External Dependencies
- **Azure Redis Cache:** Required for Story 8.4 (Bull queue)
  - Status: Available
  - Connection string in `.env`
- **Azure Communication Services:** Required for Story 8.4 (email sending)
  - Status: Available
  - GraphEmailService already configured
- **Microsoft Graph API:** Required for GraphEmailService
  - Status: Available
  - Access token refresh working

### Internal Dependencies (Story Order)
```
Story 8.1 (CSV Template)
    ↓
Story 8.2 (CSV Upload) [depends on 8.1 template format]
    ↓
Story 8.3 (Bulk Preview) [depends on 8.2 session data]
    ↓
Story 8.4 (Batch Processing) [depends on 8.3 confirmation flow]
```

**Critical Path:** Stories 8.1 → 8.2 → 8.3 → 8.4 must be done sequentially.

**Parallel Work:** TD tasks (TD-013, TD-014, TD-015) can be done in parallel with story work.

---

## 📈 Success Metrics

### Feature Metrics (Epic 8)
- **Target:** Bulk issuance flow functional end-to-end
- **Measurement:**
  - ✅ E2E test "Bulk issuance happy path" passes
  - ✅ Can upload CSV with 100 badges
  - ✅ Validation catches all error types (bad template ID, missing user, etc.)
  - ✅ Preview shows all 100 badges correctly
  - ✅ Batch processing completes in <10 seconds for 100 badges
  - ✅ All 100 emails sent successfully

### Technical Debt Metrics
- **TD-015:** ESLint warnings: 1303 → 284 ✅ (78% reduction, exceeded 62% target)
  - Measurement: `npm run lint | grep "warning" | wc -l`
- **TD-017:** tsc errors: 138 → 0 (deferred to Sprint 10, 6h estimated)
  - Measurement: `npx tsc --noEmit 2>&1 | grep "error TS" | wc -l`
  - Story file: `sprint-9/td-017-tsc-type-errors.md`
- **TD-014:** nodemailer references: N → 0
  - Measurement: `grep -r "nodemailer" backend/src/ | wc -l`
- **TD-013:** Frontend bundle: 579 KB → <400 KB (31% reduction)
  - Measurement: `npm run build` then check `dist/assets/*.js` size

### Quality Metrics
- **Test Coverage:** Maintain >80% (Backend) and >75% (Frontend)
- **Test Pass Rate:** 100% (876 existing + ~100 new tests)
- **Code Review:** All PRs reviewed within 24 hours
- **Bug Escape Rate:** <3 bugs found in Sprint Review demo

---

## 📚 Reference Documents

### Sprint Planning Documents
- **Story Files:** `sprint-9/8-{1,2,3,4}-*.md` (detailed implementation guides)
- **Technical Debt Plan:** `sprint-9/technical-debt-tasks.md`
- **Version Manifest:** `sprint-9/version-manifest.md`
- **Kickoff Readiness:** `sprint-9/kickoff-readiness.md`

### Architecture & Design
- **Epic 8 Design:** `gcredit-project/docs/planning/epic-8-bulk-badge-issuance.md`
- **API Specifications:** `gcredit-project/backend/src/bulk-issuance/` (Swagger docs)
- **UI/UX Designs:** TBD (wireframes to be added)

### Testing
- **Test Standards:** `gcredit-project/docs/testing/test-standards.md`
- **E2E Test Scripts:** `gcredit-project/backend/test/bulk-issuance.e2e-spec.ts` (to be created)

### Lessons Learned
- **Sprint 8 Retrospective:** `gcredit-project/docs/sprints/sprint-8/retrospective.md`
- **All Lessons Learned:** `gcredit-project/docs/lessons-learned/` (33 lessons)

---

## ✅ Sprint Backlog Approval

### Reviewed By
- [ ] **Product Owner:** _______________ (Date: _________)
- [ ] **Scrum Master (Bob):** _______________ (Date: _________)
- [ ] **Tech Lead:** _______________ (Date: _________)
- [ ] **Development Team:** _______________ (Date: _________)

### Sign-Off Checklist
- [ ] Sprint Goal clear and achievable
- [ ] Story estimates validated by team
- [ ] Technical debt plan approved
- [ ] Capacity allocation realistic (80h validated)
- [ ] Risks identified and mitigation plans in place
- [ ] Dependencies documented and owners assigned
- [ ] DoD criteria agreed upon
- [ ] All team members have access to planning documents

---

**Sprint Backlog Status:** APPROVED  
**Last Updated:** 2026-02-05 (Sprint 9 Planning)  
**Next Review:** 2026-02-20 (Sprint 9 Retrospective)
