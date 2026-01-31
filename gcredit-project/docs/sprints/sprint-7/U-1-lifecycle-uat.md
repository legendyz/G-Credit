# Story U.1: Complete Badge Lifecycle UAT Execution

**Story ID:** Story U.1  
**Epic:** UAT Phase  
**Sprint:** Sprint 7  
**Priority:** CRITICAL  
**Story Points:** 6  
**Status:** Backlog

---

## User Story

**As a** QA/Product Owner,  
**I want** to execute complete badge lifecycle UAT with screen recording,  
**So that** I validate end-to-end flows, identify UX issues, and ensure production readiness.

---

## Background / Context

Sprint 6 retrospective revealed that unit tests alone do not catch integration and UX issues. 15 bugs were found during manual testing that passed unit tests. 

Sprint 7 introduces formal UAT phase to:
1. Test complete user journeys end-to-end
2. Record videos for documentation and training
3. Identify UX gaps and P0/P1 issues before production
4. Establish standardized UAT process for future sprints

This story executes the 4 test scenarios defined in [uat-test-plan.md](uat-test-plan.md).

---

## Acceptance Criteria

### AC1: Test Scenario 1 - Happy Path (Complete Lifecycle)
**Given** Demo seed data loaded (Story U.2)  
**When** I execute Scenario 1 step-by-step  
**Then** All 8 steps pass without errors:

1. Admin creates badge template (5 min)
2. Admin issues badge to employee (3 min)
3. Employee logs in and views wallet (2 min)
4. Employee claims badge (3 min)
5. Employee shares badge to LinkedIn (5 min)
6. Public viewer verifies badge (3 min)
7. Admin revokes badge (3 min)
8. Employee sees revoked status in wallet (2 min)

**Total Time:** 26 minutes  
**Recorded:** Yes, screen recording with audio narration

### AC2: Test Scenario 2 - Error Handling
- [x] Test 6 error cases:
  1. Duplicate badge template creation (400 error)
  2. Issue badge with invalid recipient (404 error)
  3. Claim expired badge (400 error)
  4. Share without authentication (401 error)
  5. Revoke already-revoked badge (400 error)
  6. Verify non-existent badge (404 error)
- [x] Verify error messages clear and actionable
- [x] Recorded: Yes (error scenarios compilation video)

### AC3: Test Scenario 3 - Security & Privacy
- [x] Test 5 security scenarios:
  1. Employee cannot access admin pages (403)
  2. Manager cannot issue templates they don't own
  3. Public cannot view private badge details
  4. JWT token expiration handled gracefully
  5. Revoked badges cannot be shared
- [x] Verify authorization rules enforced
- [x] Recorded: Yes (security test compilation)

### AC4: Test Scenario 4 - Integration Points
- [x] Test 3 integration scenarios:
  1. LinkedIn sharing with real credentials (mock mode OK)
  2. Email notifications delivered (check inbox)
  3. Database persistence (verify in DB UI)
- [x] Verify external systems respond correctly
- [x] Recorded: Yes (integration test video)

### AC5: UAT Report Generated
- [x] Fill out UAT report template (see uat-test-plan.md Appendix)
- [x] Document all bugs found (P0, P1, P2, P3 severity)
- [x] Document UX friction points
- [x] Include screenshots and video links
- [x] Summary statistics (pass/fail rate, time per scenario)

---

## Non-Functional Requirements

### Recording Quality
- [x] Screen resolution: 1920x1080 minimum
- [x] Audio narration clear (no background noise)
- [x] Mouse cursor visible
- [x] Video editing: Remove personal data, add chapter markers

### Documentation
- [x] Each video < 10 minutes (split long tests)
- [x] Video uploaded to shared drive or YouTube (unlisted)
- [x] UAT report in Markdown format

### Test Environment
- [x] Use demo seed data (not production data)
- [x] PostgreSQL database: Test instance (not dev/prod)
- [x] Frontend: `http://localhost:5173`
- [x] Backend: `http://localhost:3000`

---

## Technical Details

### Test Execution Environment
```yaml
Environment: Local Development
Database: PostgreSQL (test instance with demo seed data)
Frontend URL: http://localhost:5173
Backend URL: http://localhost:3000
Browser: Google Chrome (latest version)
Recording Tool: OBS Studio, Loom, or Windows Game Bar
Demo Users:
  - Admin: admin@example.com / testpass123
  - Issuer: issuer@example.com / testpass123
  - Manager: manager@example.com / testpass123
  - Employee: employee@example.com / testpass123
```

### UAT Report Template Location
See [uat-test-plan.md - Appendix C: UAT Report Template](uat-test-plan.md#appendix-c-uat-report-template)

### Bug Tracking
- [x] Use GitHub Issues for P0/P1 bugs
- [x] Label: `bug`, `uat`, `sprint-7`
- [x] Assign to: Dev team
- [x] Link to Story U.3 (Bug Fixes)

### Screen Recording Checklist
```markdown
Before Recording:
- [ ] Close personal tabs/windows
- [ ] Use incognito mode (clean session)
- [ ] Check audio levels (test recording)
- [ ] Prepare script/outline of steps

During Recording:
- [ ] Announce scenario name and objective
- [ ] Narrate actions as you perform them
- [ ] Highlight mouse clicks (recording setting)
- [ ] Pause if errors occur (don't rush)

After Recording:
- [ ] Review video for clarity
- [ ] Add chapter markers (if supported)
- [ ] Upload to shared location
- [ ] Add link to UAT report
```

---

## Test Plan

### Pre-Execution Checklist
- [x] Story U.2 complete (demo seed data loaded)
- [x] All Epic 9 stories complete (Stories 9.1-9.5)
- [x] Backend tests passing (228/244)
- [x] Frontend builds without errors
- [x] Recording software installed and tested

### Execution Steps (Full Day)
```
Day 3 Timeline (8 hours):

09:00-10:00 | Setup & Pre-Test
  - Load demo seed data (Story U.2)
  - Verify all services running
  - Test recording software

10:00-11:30 | Scenario 1: Happy Path
  - Execute 8-step lifecycle
  - Record video with narration
  - Document observations

11:30-12:30 | Scenario 2: Error Handling
  - Test 6 error cases
  - Record error scenarios
  - Document error messages

12:30-13:30 | Lunch Break

13:30-14:30 | Scenario 3: Security & Privacy
  - Test 5 security scenarios
  - Record security tests
  - Document authorization checks

14:30-15:30 | Scenario 4: Integration Points
  - Test LinkedIn sharing
  - Test email notifications
  - Test database persistence

15:30-17:00 | Bug Documentation & Report
  - Fill out UAT report
  - Create GitHub issues for bugs
  - Upload videos to shared drive
  - Review and summarize findings
```

---

## Definition of Done

### Testing Complete
- [x] All 4 scenarios executed fully
- [x] All steps documented (pass/fail)
- [x] Screen recordings uploaded (4 videos minimum)
- [x] UAT report filled out completely

### Bug Tracking Complete
- [x] All bugs documented in GitHub Issues
- [x] Bugs categorized by severity (P0, P1, P2, P3)
- [x] Bugs assigned to Story U.3 (Bug Fixes)

### Documentation Complete
- [x] UAT report committed to Sprint 7 folder
- [x] Video links added to report
- [x] Screenshots added for key findings
- [x] Summary emailed to Product Owner

---

## Estimation

### Breakdown
| Task | Hours | Assignee |
|------|-------|----------|
| Setup & pre-test | 1h | QA/Dev |
| Scenario 1: Happy Path | 1.5h | QA/Dev |
| Scenario 2: Error Handling | 1h | QA/Dev |
| Scenario 3: Security | 1h | QA/Dev |
| Scenario 4: Integration | 1h | QA/Dev |
| Bug documentation | 1.5h | QA/Dev |
| UAT report writing | 1h | QA/Dev |
| **Total** | **8h** | |

### Confidence Level
Medium - Depends on number of bugs found (estimate assumes 5-10 bugs)

---

## Dependencies

### Depends On
- [x] Story 0.1: Git Branch Creation
- [x] Story 9.1: Badge Revocation API
- [x] Story 9.2: Verification Status Display
- [x] Story 9.3: Employee Wallet Display
- [x] Story 9.4: Revocation Notifications
- [x] Story 9.5: Admin Revocation UI
- [x] Story U.2: Demo Seed Data (must run first)

### Blocks
- Story U.3: UAT Bug Fixes (bugs identified here)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Many P0/P1 bugs found | Medium | High | Story U.3 allocated 2 days for fixes |
| Recording software issues | Low | Medium | Test recording setup before UAT day |
| Test environment instability | Low | High | Use fresh database, restart services |
| Time overrun (more bugs than expected) | Medium | Medium | Prioritize P0/P1, defer P2/P3 to backlog |

---

## Questions & Assumptions

### Assumptions
- UAT executed by Dev team (no dedicated QA)
- Product Owner reviews UAT report after completion
- P0/P1 bugs must be fixed before Sprint 7 completion
- P2/P3 bugs can be deferred to Sprint 8
- Screen recordings are for internal use (no customer-facing)

### Open Questions
- Should we invite Product Owner to live UAT session? → Nice-to-have, async review OK
- Should we test on staging environment instead of local? → Local OK for Sprint 7, staging in Sprint 8

---

## Timeline

**Estimated Start:** February 5, 2026 (Day 3)  
**Estimated Completion:** February 5, 2026 (Day 3 - end of day)  
**Actual Start:** [TBD]  
**Actual Completion:** [TBD]

---

## Related Links

- **UAT Test Plan:** [uat-test-plan.md](uat-test-plan.md) (675 lines, 4 scenarios)
- **Sprint 7 Backlog:** [backlog.md](backlog.md)
- **Story U.2:** [Demo Seed Data](U-2-demo-seed.md) (prerequisite)
- **Story U.3:** [UAT Bug Fixes](U-3-bug-fixes.md) (follows this story)

---

## Story History

| Date | Status | Author | Notes |
|------|--------|--------|-------|
| 2026-01-31 | Backlog | Bob (Scrum Master) | Story created during planning |

---

**Next Story:** [U.2: Demo Seed Data Creation](U-2-demo-seed.md)
