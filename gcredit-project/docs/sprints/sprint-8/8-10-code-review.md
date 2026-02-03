# Story 8.10 Code Review

**Story/Task:** 8.10 Admin User Management Panel  
**Date:** 2026-02-03  
**Reviewer:** Amelia (Dev Agent)

---

## Scope Reviewed
- Backend admin users module (controller/service/DTO/tests) and Prisma schema/migration
- Frontend admin user management page and components
- Story documentation vs repo state
- Commit range provided (8d22eff..438b1a1)

---

## Summary
Admin user management APIs, UI, and audit logging are largely implemented, but several acceptance criteria are unmet or inconsistent with the story. Key gaps include missing confirmation for Admin role changes, mobile layout deviations, and a backend no-op role update that returns incorrect audit metadata without persisting it.

---

## Git vs Story Discrepancies
- **Story status remains Backlog despite implementation being present.** Evidence: [8-10-user-management-panel.md](gcredit-project/docs/sprints/sprint-8/8-10-user-management-panel.md#L9)

---

## Findings

### 🔴 High

1) **Admin role change confirmation is not implemented (AC2)**
- The story explicitly requires confirmation when promoting to Admin or demoting an Admin, but the dialog only shows an inline warning and proceeds on Save without a confirmation step.
- Evidence: [8-10-user-management-panel.md](gcredit-project/docs/sprints/sprint-8/8-10-user-management-panel.md#L108-L109), [EditRoleDialog.tsx](gcredit-project/frontend/src/components/admin/EditRoleDialog.tsx#L208-L258)

2) **No-op role updates return `roleSetManually=true` and new timestamps without persisting changes**
- When the selected role matches the current role, the service returns `roleSetManually: true` and `roleUpdatedAt: new Date()` without any DB update. This causes the API response to lie about the persisted state and can mislead clients/auditing logic.
- Evidence: [admin-users.service.ts](gcredit-project/backend/src/admin-users/admin-users.service.ts#L234-L247)

---

### 🟡 Medium

3) **Mobile layout exceeds AC1 requirements and lacks “tap to expand” behavior**
- AC1 requires mobile cards showing Name+Role+Actions only, with tap-to-expand for additional fields. The current mobile card always shows email, status, department, and last login without an expansion affordance.
- Evidence: [8-10-user-management-panel.md](gcredit-project/docs/sprints/sprint-8/8-10-user-management-panel.md#L52-L52), [UserListTable.tsx](gcredit-project/frontend/src/components/admin/UserListTable.tsx#L130-L179)

4) **Pinned actions column for small screens is not implemented**
- AC1 requires horizontal scroll with a pinned actions column on small screens. The table wraps in `overflow-x-auto`, but there’s no sticky/pinned actions column implementation.
- Evidence: [8-10-user-management-panel.md](gcredit-project/docs/sprints/sprint-8/8-10-user-management-panel.md#L56-L56), [UserListTable.tsx](gcredit-project/frontend/src/components/admin/UserListTable.tsx#L218-L240)

---

## Recommendations
- Add a confirmation step for Admin promotions/demotions (modal or explicit confirm toggle) to satisfy AC2.
- Fix the no-op role update path to return the actual persisted values (or skip returning roleUpdated* fields if no change).
- Align mobile card layout with AC1 (condensed view + expand affordance) and implement a pinned actions column for small screens.

---

## Outcome
**Status:** Changes requested (high-severity AC gap + backend data consistency issue).
