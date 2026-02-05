# Skipped Tests Tracker

**Purpose:** Track all intentionally skipped tests and ensure they are re-enabled when blocking issues are resolved.

**Last Updated:** 2026-02-03  
**Status:** 4 tests skipped due to TD-006

---

## 🚨 Active Skipped Tests

### TD-006: Teams Channel Permissions (4 tests)

**Blocking Issue:** Microsoft Graph API permission `ChannelMessage.Send` not approved by tenant admin

**Effort to Resolve:** 1 day (mostly admin approval time)

**Resolution Steps:**
1. Request tenant admin to approve `ChannelMessage.Send` permission in Azure AD app registration (ceafe2e0-73a9-46b6-a203-1005bfdda11f)
2. Verify permission in Azure Portal
3. Re-enable tests (remove `.skip()`)
4. Run tests against real Teams environment
5. Update TD-006 status in technical debt documents

---

### Skipped Test Files

| # | Test File | Location | Reason | Last Verified |
|---|-----------|----------|--------|---------------|
| 1 | `badge-issuance-teams-integration.spec.ts` | `backend/test/integration/` | TD-006: No ChannelMessage.Send permission | 2026-02-03 |
| 2 | `graph-teams.service.spec.ts` | `backend/test/unit/microsoft-graph/` | TD-006: No ChannelMessage.Send permission | 2026-02-03 |
| 3 | `teams-sharing.controller.spec.ts` | `backend/test/integration/` | TD-006: No ChannelMessage.Send permission | 2026-02-03 |
| 4 | `teams-badge-notification.service.spec.ts` | `backend/test/unit/badge-sharing/` | TD-006: No ChannelMessage.Send permission | 2026-02-03 |

---

## ✅ Re-enable Checklist (When TD-006 is Resolved)

### Pre-requisites
- [ ] Tenant admin has approved `ChannelMessage.Send` permission
- [ ] Permission visible in Azure AD app registration
- [ ] Test Teams channel ID and Team ID are available
- [ ] Graph API credentials are valid

### Test Re-enablement
- [ ] Remove `.skip()` from `badge-issuance-teams-integration.spec.ts`
- [ ] Remove `.skip()` from `graph-teams.service.spec.ts`
- [ ] Remove `.skip()` from `teams-sharing.controller.spec.ts`
- [ ] Remove `.skip()` from `teams-badge-notification.service.spec.ts`

### Verification
- [ ] Run tests individually: `npm test -- badge-issuance-teams-integration.spec.ts`
- [ ] Run all Teams tests: `npm test -- teams`
- [ ] Verify in CI/CD pipeline
- [ ] Check test coverage increased

### Documentation Updates
- [ ] Update `docs/sprints/sprint-6/technical-debt.md` → Status: ✅ Resolved
- [ ] Update `docs/sprints/sprint-7/technical-debt-from-reviews.md` → Status: ✅ Fixed
- [ ] Update this file → Move to "Resolved" section
- [ ] Add completion date and resolution notes

---

## 📋 Resolved Skipped Tests (Historical)

*No resolved items yet. This section will track tests that were skipped and later re-enabled.*

### Template for Resolved Items
```markdown
### [TD-XXX] Issue Name (Resolved: YYYY-MM-DD)

**Tests Re-enabled:** X tests
**Resolution:** [Brief description]
**Verified By:** [Name/Sprint]

| Test File | Re-enabled Date | Notes |
|-----------|-----------------|-------|
| ... | ... | ... |
```

---

## 🎯 Best Practices

### When to Skip Tests
✅ **Valid Reasons:**
- External dependency unavailable (e.g., API permissions)
- Infrastructure not ready (e.g., Azure service not configured)
- Known bug with documented workaround (tech debt tracked)

❌ **Invalid Reasons:**
- Test is flaky (fix the test instead)
- Feature not implemented yet (don't write the test)
- Test takes too long (optimize or move to separate suite)

### How to Skip Tests Properly
```typescript
// ❌ Bad: No context
describe.skip('Teams integration', () => { ... });

// ✅ Good: Clear reason with TD reference
describe.skip('Teams integration (TD-006: Missing ChannelMessage.Send permission)', () => {
  // TODO: Re-enable when TD-006 is resolved
  // See: docs/testing/SKIPPED-TESTS-TRACKER.md
  
  it('should send badge to Teams channel', () => { ... });
});
```

### Tracking Process
1. **When skipping a test:**
   - Add entry to this document
   - Reference tech debt ID (e.g., TD-006)
   - Add TODO comment in test file
   - Update technical debt document

2. **During Sprint Planning:**
   - Review this file
   - Check if blocking issues are resolved
   - Plan test re-enablement if ready

3. **When re-enabling:**
   - Complete checklist above
   - Update all documentation
   - Move to "Resolved" section

---

## 📊 Statistics

| Metric | Count |
|--------|-------|
| **Total Skipped Tests** | 4 |
| **Blocking Issues** | 1 (TD-006) |
| **Estimated Effort to Resolve** | 1 day |
| **Tests Re-enabled (All Time)** | 0 |

**Target:** 0 skipped tests by Sprint 10 (2026-03-15)

---

## 📚 References

- **Tech Debt Registry:** [technical-debt-from-reviews.md](../sprints/sprint-7/technical-debt-from-reviews.md)
- **Sprint 6 Tech Debt:** [technical-debt.md](../sprints/sprint-6/technical-debt.md)
- **TD-006 Details:** Sprint 6 technical-debt.md (Section 1)
- **Teams Integration Guide:** [badge-image-setup-guide.md](../development/badge-image-setup-guide.md)

---

**Remember:** Skipped tests are technical debt. The goal is to resolve them, not forget them! 🎯
