# ADR-011: User Management Architecture — Dual-Mode Provisioning & M365 Integration

**ADR Number:** 011
**Status:** ✅ Accepted
**Date:** 2026-02-20
**Author:** Bob (SM)
**Deciders:** LegendZhu (PO/Project Lead), Bob (SM)
**Context:** Sprint 12 Story 12.3 PO Design Session (2026-02-20)

---

## Context and Problem Statement

G-Credit's user management needs to support two distinct provisioning modes:

1. **Enterprise (Production):** Users are provisioned from Microsoft 365 via Graph API sync. The M365 tenant is the source of truth for identity, roles, and organizational hierarchy.
2. **Development/Demo:** Users are created manually by Admin for testing and demo environments where M365 may not be available.

The existing Sprint 8 M365 sync (ADR-008) creates all users as EMPLOYEE with `passwordHash=''`, has no role mapping, and uses `department` string matching for manager-employee scoping. This is insufficient for production use.

**Key Questions:**
1. How should M365 user roles be determined and managed?
2. How should the manager-employee hierarchy be modeled?
3. What operations should be allowed on M365-synced users vs locally-created users?
4. How do we keep the local user cache fresh and secure?
5. How does manual user creation coexist with M365 sync?

---

## Decisions

This ADR captures 14 decisions made during the PO design session. Each decision impacts current (Sprint 12) and future user-related module development.

---

### DEC-011-01: Dual-Mode User Provisioning

**Decision:** Support two user sources — M365 Sync (production) and Manual Create (dev/demo) — distinguished by the `azureId` field.

**Rule:**
- `azureId != null` → M365 user (synced from Microsoft 365)
- `azureId == null` → Local user (manually created by Admin)

**Rationale:** Enterprise environments use M365 as identity provider; dev/demo environments need standalone user creation without M365 dependency.

**Impact on future modules:** Any module that references users must be source-agnostic in data access but source-aware in UI controls and edit permissions.

---

### DEC-011-02: Azure AD Security Group Role Mapping

**Decision:** Map M365 user roles via Azure AD Security Groups, not individual Azure AD attributes.

**Mapping:**
| Security Group | G-Credit Role |
|---|---|
| `G-Credit Admins` (AZURE_ADMIN_GROUP_ID) | ADMIN |
| `G-Credit Issuers` (AZURE_ISSUER_GROUP_ID) | ISSUER |
| User has `directReports > 0` | MANAGER |
| Default (no group, no reports) | EMPLOYEE |

**Role Priority (highest → lowest):**
```
Security Group membership > roleSetManually=true > directReports > default EMPLOYEE
```

**Rationale:** Security Groups are the enterprise-standard mechanism for role assignment. They scale to 100K+ users, are managed by IT admins in Azure Portal, and integrate with existing enterprise governance workflows. Individual attribute-based mapping would require custom Azure AD schema extensions.

**Impact on future modules:**
- Role assignment logic must always check Security Group first
- `roleSetManually` flag only applies to Local users (M365 user roles are never manually set)
- Any future role (e.g., AUDITOR) requires a corresponding Security Group + env var

---

### DEC-011-03: M365 User Roles Are Read-Only in UI

**Decision:** Admin CANNOT change roles for M365-synced users via the G-Credit UI. Roles are managed exclusively by Security Group membership in Azure AD.

**Enforcement:**
- Frontend: role edit controls disabled/hidden for M365 users
- Backend: `PATCH /api/admin/users/:id/role` returns 400 if `azureId != null` → "M365 user roles are managed via Security Group"

**Rationale:** Allowing UI role edits for M365 users creates a conflict with the Security Group source of truth. The next sync or login would overwrite the manual change, causing confusion.

**Impact on future modules:**
- Any admin UI that edits user roles must check `azureId` before allowing edits
- Role audit logs should distinguish "Security Group sync" vs "Admin manual change"

---

### DEC-011-04: Source-Aware Management Rules

**Decision:** User management operations differ based on user source. M365 users have limited editability; Local users have full CRUD.

| Operation | M365 User | Local User |
|---|:---:|:---:|
| View in table / detail | ✅ | ✅ |
| Search / filter | ✅ | ✅ |
| Edit role | ❌ (Security Group) | ✅ |
| Edit name / email | ❌ (managed by M365) | ✅ |
| Edit department | ❌ (managed by M365) | ✅ |
| Change manager | ❌ (managed by directReports) | ✅ |
| Lock / Disable | ✅ (safety override) | ✅ |
| Delete | ❌ (M365 = source of truth) | ✅ |
| Change password | ⚠️ Temp until SSO | ✅ |

**Rationale:** M365 is the authoritative source for identity data. Allowing local edits to M365 user profiles would be overwritten on next sync, creating data inconsistency.

**Impact on future modules:**
- All user edit UIs must check source before rendering edit controls
- API endpoints that modify user data should enforce source-aware guards
- User profile page (if self-editable) must also respect these rules
- Bulk operations must filter by source type

---

### DEC-011-05: Manager Hierarchy via `managerId` FK (Replacing Department Scoping)

**Decision:** Replace `department` string-based scoping with `managerId` self-referential FK on the User model.

**Schema Change:**
```prisma
model User {
  managerId     String?
  manager       User?   @relation("ManagerReports", fields: [managerId], references: [id])
  directReports User[]  @relation("ManagerReports")
}
```

**Migration Impact (BREAKING CHANGE):**
- `dashboard.service.ts`: Manager team query → `WHERE managerId = manager.id`
- `badge-issuance.service.ts`: Manager scoping → `recipient.managerId = manager.id`
- `analytics.service.ts`: Manager filter → `WHERE managerId = manager.id`
- `department` field retained for display/metadata only — NOT used for access control

**Rationale:** Department string matching is fragile (typos, renames) and doesn't model actual reporting hierarchy. `managerId` FK enables:
- Type-safe Prisma relations (`user.directReports`, `user.manager`)
- Cascading queries (multi-level hierarchy)
- Graph API `directReports` / `manager` endpoint mapping

**Impact on future modules:**
- **All manager-scoped features** must use `managerId` FK, never `department`
- Team views, reporting, delegation — all reference `user.directReports` relation
- Org chart / hierarchy visualization can traverse `managerId` chain
- `department` field is purely informational (HR metadata), never for access control

---

### DEC-011-06: Group-Only Sync Mode

**Decision:** Provide a lightweight "Group-Only" sync (`syncType: 'GROUPS_ONLY'`) that refreshes Security Group memberships and manager relationships without re-importing all user profiles.

**API:** `POST /api/admin/m365-sync` with `syncType: 'GROUPS_ONLY'`

**Behavior:**
- Fetches existing M365 users from local DB (skips user import)
- Re-checks `/memberOf` + `/manager` for each user → updates roles + `managerId`
- Sync log records: `syncType: 'GROUPS_ONLY'`, counts only role/manager changes

**Rationale:** Full sync iterates all users in the M365 tenant (potentially 100K+). Group-only sync targets only existing G-Credit users (~hundreds), checking just group membership and manager — orders of magnitude faster.

**Impact on future modules:**
- Sync UI must offer both "Sync Users" (FULL) and "Sync Roles" (GROUPS_ONLY) buttons
- Sync history / audit logs must record sync type
- Scheduled background sync jobs should use GROUPS_ONLY for frequent runs (e.g., hourly), FULL for infrequent runs (e.g., nightly)

---

### DEC-011-07: User Source Indicator Throughout UI

**Decision:** Display a visible source badge — `M365` (blue, Microsoft icon) or `Local` (gray) — in user tables, detail panels, and profile pages.

**Display Points:**
- User management table: source column with badge
- User detail slide-over panel: "Account Source: Microsoft 365 (synced)" or "Account Source: Local Account"
- M365 user detail: "Identity managed by Microsoft 365. Role assigned via Security Group." + `Last Synced: {lastSyncAt}`

**Rationale:** Admins need immediate visual feedback on why certain edit controls are disabled. The source badge is the primary indicator that drives UX expectations.

**Impact on future modules:**
- Any user-facing list/detail UI should include the source badge
- API responses should include computed `source` field (`'M365'` | `'LOCAL'`)
- Reports and exports should include user source

---

### DEC-011-08: Admin Bootstrap Strategy

**Decision:** Retain seed user `admin@gcredit.com` (Local, ADMIN role) as the bootstrap account. This account is used for:
1. Initial system login before M365 sync is configured
2. Triggering the first M365 sync
3. Dev/demo environments without M365

**Guard:** Other demo seed users (issuer, manager, employee) are optional and gated by `NODE_ENV !== 'production'`.

**Rationale:** A "chicken-and-egg" problem exists — you need an admin to trigger M365 sync, but M365 sync is how admins are provisioned. The seed admin solves this bootstrap problem.

**Impact on future modules:**
- Seed/migration scripts must always create the bootstrap admin
- Production deployment docs must instruct admin to: (1) login with seed, (2) trigger M365 sync, (3) verify own M365 account gets ADMIN via Security Group
- Bootstrap admin's `azureId` remains `null` — it's a permanent Local user

---

### DEC-011-09: Local User Cache as Reference Table

**Decision:** The local PostgreSQL `users` table is a **reference cache** of M365 user data, NOT a competing user management system. Its purpose is:
1. **Relational integrity:** FK references from Badge, Template, MilestoneAchievement, EvidenceFile, AuditLog, etc.
2. **Query performance:** Avoid real-time Graph API calls for every page load
3. **Offline resilience:** System works if Graph API is temporarily unavailable

**Mental Model:**
```
M365 (Source of Truth) → Sync → Local DB (Reference Cache) ← FK queries
```

**Rationale:** Badges, templates, and audit logs require stable FK references to user records. Real-time Graph API queries for every user display would add 200-500ms latency per request, break pagination, and fail if M365 is down.

**Impact on future modules:**
- Never treat local user data as authoritative for M365 users — always note it may be stale
- Any module that displays M365 user data should show `lastSyncAt` if relevant
- Never build features that depend on local-only attribute changes for M365 users (they'll be overwritten)

---

### DEC-011-10: Multi-Layer Freshness Strategy

**Decision:** Implement three layers of data freshness to keep the local cache synchronized with M365:

| Layer | Trigger | Scope | Latency | Fields Updated |
|---|---|---|---|---|
| **Layer 1: Login-time mini-sync** | Every M365 user login | Single user | ~200-300ms | profile, role, manager, accountEnabled |
| **Layer 2: Scheduled full sync** | Background job (configurable) | All M365 users | Minutes | All fields + deactivation detection |
| **Layer 3: Manual sync** | Admin clicks "Sync Users" / "Sync Roles" | All or groups-only | Minutes | Depends on sync type |

**Layer 1 Details (AC #31 — Sprint 12.3a):**
- 3 parallel Graph API calls: `/users/{azureId}`, `/memberOf`, `/manager`
- Updates: firstName, lastName, department, role, managerId, lastSyncAt
- Rejects login if `accountEnabled = false`
- Graceful fallback: Graph API unavailable → use cached data + log warning
- Session-level cache: skip re-check on token refresh within same session

**Rationale:** Each layer addresses a different freshness need:
- Layer 1 eliminates stale privilege risk (user role changed in Azure AD → reflected on next login)
- Layer 2 catches deactivated accounts that haven't logged in
- Layer 3 gives admin on-demand control

**Impact on future modules:**
- SSO implementation (FR27) will replace login-time password check but should retain mini-sync logic
- JIT provisioning (FR27) should invoke the same `syncUserFromGraph()` helper as login-time mini-sync
- Any background job framework must support scheduled sync
- Monitoring/alerting should track sync failures across all layers

---

### DEC-011-11: Login-Time Mini-Sync (AC #31)

**Decision:** On every M365 user login/token-refresh, perform a complete single-user sync that updates all relevant fields, not just role.

**Graph API Calls (fired in parallel):**
1. `GET /users/{azureId}` → accountEnabled, displayName, department
2. `GET /users/{azureId}/memberOf` → Security Group membership → role
3. `GET /users/{azureId}/manager` → manager's azureId → managerId FK

**Updated Fields:**
- `firstName`, `lastName` (parsed from displayName)
- `department`
- `role` (Security Group mapping)
- `managerId` (resolved from manager's azureId)
- `lastSyncAt`

**Shared Logic:** Extract `syncUserFromGraph(userId)` helper reusable by:
- Login-time mini-sync (Layer 1)
- Full sync `syncSingleUser()` (Layer 2)
- JIT provisioning (future FR27)

**Rationale:** If we're already making Graph API calls at login time anyway, the marginal cost of fetching profile + manager (additional ~50ms in parallel) is negligible. This ensures Login = Fresh Data for every M365 user, every time.

**Impact on future modules:**
- `syncUserFromGraph()` is the canonical single-user sync function — all sync paths should use it
- SSO integration must call this function after Azure AD token validation
- Any new user fields synced from M365 should be added to this function

---

### DEC-011-12: JIT Provisioning Creates M365 Users

**Decision:** When SSO is implemented (FR27), Just-In-Time provisioning creates users with `azureId` set (M365 user), not as Local users.

**Flow:**
```
First SSO login → azureId not found in DB → JIT create (azureId = token.oid)
  → immediately invoke syncUserFromGraph() → user has correct role, manager, profile
  → return JWT → user enters system with correct permissions
```

**Rationale:** JIT users authenticated via Azure AD are inherently M365 users. Setting `azureId` ensures:
- Correct source badge (M365, not Local)
- Source-aware management rules apply (read-only profile, Security Group roles)
- No "orphan" accounts with missing Azure linkage
- Login-time mini-sync keeps them fresh going forward

**Impact on future modules:**
- FR27 SSO must set `azureId = token.oid` during JIT creation
- JIT path must call `syncUserFromGraph()` for complete data
- JIT + mini-sync happens in single login transaction — user never sees stale data
- JIT users have `passwordHash = ''` (SSO-only authentication)

---

### DEC-011-13: Temporary Password Strategy for M365 Users

**Decision:** Until SSO (FR27) is implemented, M365 users receive a temporary default password for local login. The system shows a notice that this is temporary.

**Implementation:**
- Full sync creates M365 users with `passwordHash = ''` (cannot login via password)
- Admin can set temporary password via `DEFAULT_USER_PASSWORD` env var
- UI displays notice for M365 users: "This account is managed by Microsoft 365. Password authentication is temporary."

**Rationale:** During the transition period before SSO, M365 users may need local login access for testing/demo. Empty `passwordHash` prevents unauthorized access until explicitly configured.

**Impact on future modules:**
- FR27 SSO replaces this entirely — M365 users authenticate only via Azure AD
- Login flow must handle `passwordHash = ''` gracefully (reject with helpful message)
- Password change UI should be hidden/disabled for M365 users after SSO

---

### DEC-011-14: Self-Demotion Guard

**Decision:** Admin users cannot change their OWN role via the UI. This prevents accidental self-demotion that would lock them out of admin capabilities.

**Enforcement:**
- Frontend: role edit controls disabled for the currently-logged-in user's own record
- Backend: `PATCH /api/admin/users/:id/role` returns 403 if `id === currentUser.id`

**Rationale:** If the only admin demotes themselves, there is no way to restore admin access without direct database intervention.

**Impact on future modules:**
- Any role-change mechanism (bulk, API, automation) must enforce this guard
- Super-admin or tenant-level admin (future) may override this, but requires separate decision

---

### DEC-011-15: API Data Minimization — Exclude `azureId` from Responses

**Decision:** API responses (`GET /api/admin/users`, `GET /api/admin/users/:id`) MUST NOT include the raw `azureId` (Azure AD Object ID). Only the computed `source` field (`'M365'` | `'LOCAL'`) is returned.

**Implementation:**
- `getUserSelect()` queries `azureId` internally to compute `source`
- Response DTO strips `azureId` before serialization
- `azureId` only exists in backend service layer

**Rationale:** If an API endpoint is compromised (stolen JWT, RBAC bypass), the attacker would gain Azure AD Object IDs for all synced users. These IDs can be used for reconnaissance against the M365 tenant (e.g., querying Graph API, crafting phishing attacks). The `source` field provides the same UX value with zero security risk.

**Impact on future modules:**
- No API response should ever include `azureId` — any future endpoint returning user data must follow this rule
- Backend services may use `azureId` internally (for sync, login verification)
- If a future feature genuinely needs to expose Azure identity info, create a separate decision with security review

---

### DEC-011-16: M365 Lock Scope Transparency

**Decision:** When admin locks an M365 user in G-Credit, the UI must clearly communicate that the lock only affects G-Credit sign-in, NOT the user's Microsoft 365 account.

**Lock confirmation text for M365 users:**
> "This will prevent sign-in to G-Credit only. To disable their Microsoft 365 account, contact your IT administrator."

**Rationale:** G-Credit uses `User.Read.All` (read-only). Writing back to Azure AD (`User.ReadWrite.All`) is out of scope and would require elevated enterprise permissions. Admins must understand the scope limitation to avoid false security assumptions.

**Impact on future modules:**
- Any future user status change UI must include scope clarification for M365 users
- If write-back to Azure AD is ever implemented, it would require a separate ADR + security review + enterprise permission approval

---

### DEC-011-17: PII Exclusion from Logs

**Decision:** Sync logs (`M365SyncLog` records) and application logs (`this.logger.*`) MUST NOT contain user PII (names, emails). Reference users by internal `id` only. Error messages may include `azureId` for debugging but not `email` or `displayName`.

**Current code audit:** Existing `m365-sync.service.ts` logs reference `localUser.id` (safe) but sync error arrays may contain email addresses passed through from Graph API errors. This must be sanitized in 12.3a.

**Rationale:** Log aggregation systems (CloudWatch, Application Insights, etc.) often have broader access than the application database. PII in logs creates compliance risk (GDPR, corporate data governance) and increases the blast radius of a log system compromise.

**Impact on future modules:**
- All logging across the application should follow this principle
- Audit logs (`UserRoleAuditLog`) are exempt — they exist specifically to record "who did what to whom" and are access-controlled separately
- Error tracking (Sentry, etc.) should also strip PII from breadcrumbs

---

### DEC-011-18: MANAGER Role–managerId Strong Consistency Constraint

**Date Added:** 2026-02-23  
**Context:** During Sprint 12 UAT, a design inconsistency was discovered between MANAGER role and `managerId` relationship:

- **M365 side:** `directReports > 0` → automatically becomes MANAGER (DEC-011-02 Priority 3)
- **Local side:** `role` and `managerId` were managed independently — an EMPLOYEE could be assigned as someone's manager (inconsistent), or a MANAGER could have zero subordinates (meaningless)

This created two problematic scenarios:

| Scenario | Result |
|---|---|
| User A: role=MANAGER, no one's managerId points to A | A can access Manager Dashboard but **team list is empty** |
| User B: role=EMPLOYEE, someone's managerId points to B | B has subordinates but **cannot access Manager Dashboard** |

**Decision:** Enforce strong consistency between MANAGER role and `managerId` relationship for **all user sources** (LOCAL and M365):

**Rule 1 — Auto-Upgrade on managerId Assignment:**
When a user is assigned as someone's manager (via `managerId`), and that user's current role is EMPLOYEE, their role is automatically upgraded to MANAGER.

- Applies during: `createUser` (with managerId), future `updateManager` endpoint
- Audit log records: `ROLE_CHANGED` with note "Auto-upgraded to MANAGER: assigned as manager of {email}"
- API response includes `managerAutoUpgraded` field so frontend can display info toast
- Does NOT auto-upgrade ISSUER or ADMIN (only EMPLOYEE → MANAGER)

**Rule 2 — Block MANAGER Downgrade with Subordinates:**
Cannot change a user's role from MANAGER to EMPLOYEE or ISSUER if they have `directReportsCount > 0`. Admin must reassign subordinates first.

- Backend returns 400: `"Cannot change role from MANAGER: this user has N subordinate(s). Please reassign their subordinates first."`
- MANAGER → ADMIN is allowed (ADMIN supersedes MANAGER privileges)

**Rule 3 — Auto-Downgrade on Last Subordinate Removal:**
When a MANAGER's last subordinate is deleted (or, in future, reassigned), and their `directReportsCount` drops to 0, their role is automatically downgraded from MANAGER to EMPLOYEE.

- Applies during: `deleteUser` (if deleted user's managerId points to a MANAGER), future `updateManager` endpoint
- Audit log records: `ROLE_CHANGED` with note "Auto-downgraded: last subordinate {email} was deleted"
- Does NOT auto-downgrade ADMIN or ISSUER (only MANAGER → EMPLOYEE)

**Rule 4 — MANAGER/EMPLOYEE Not Manually Assignable:**
The Edit Role UI only offers ADMIN and ISSUER. MANAGER and EMPLOYEE are entirely derived from subordinate relationships. Backend rejects API calls attempting to manually set MANAGER or EMPLOYEE via `updateRole`.

- Create User UI: only EMPLOYEE and ISSUER selectable (ADMIN excluded per AC #33, MANAGER auto-managed)
- Edit Role UI: only ADMIN and ISSUER selectable
- Backend guard: returns 400 if `dto.role` is MANAGER or EMPLOYEE

**Rationale:**

1. **Alignment with M365 behavior:** M365 sync already derives MANAGER from `directReports > 0`. Local users should follow the same principle for consistency.
2. **Avoided alternatives:**
   - *Weak constraint (UI warning only):* Doesn't prevent the inconsistency, just surfaces it. MANAGER with empty team still exists.
   - *Merge (eliminate MANAGER role):* Would require fundamental RBAC refactor across guards, dashboards, analytics, frontend routing. Disproportionate effort for the benefit.
   - *Strong constraint* was chosen as the pragmatic middle ground — minimal code changes, maximum consistency.
3. **Implicit vs explicit upgrade:** Toast notification ensures admin is informed of the side effect, not surprised by it.

**Impact on future modules:**
- Any endpoint that modifies `managerId` must check and auto-upgrade the target user's role
- Bulk operations (import CSV, bulk reassign) must enforce the same constraint
- Org chart / hierarchy features can rely on MANAGER role ↔ has subordinates being consistent
- Role downgrade UI should pre-check subordinate count and show warning before API call

**Implementation:** Commits `fcf1c4a` (Rules 1-2), updated (Rules 3-4, auto-downgrade + manual assignment block)

---

## Consequences

### Positive
- **Enterprise-ready:** Security Group role mapping aligns with enterprise IAM practices
- **Scalable:** Group-only sync handles 100K+ user organizations
- **Consistent:** Source-aware rules eliminate data conflicts between M365 and local edits
- **Fresh:** Multi-layer sync strategy ensures no stale privileges
- **Extensible:** `syncUserFromGraph()` helper creates a single sync path for all future use cases (login, full sync, JIT)
- **Auditable:** Source badges, sync logs, and role audit trails provide full traceability

### Negative
- **Complexity:** Dual-mode provisioning adds branching logic to every user-related feature
- **Azure dependency:** Security Group mapping requires Azure AD setup (prerequisites for 12.3a)
- **Breaking change:** `department` → `managerId` migration affects dashboard, badge-issuance, analytics
- **Login latency:** ~200-300ms overhead per M365 user login (3 Graph API calls)

### Neutral
- `department` field retained as metadata — no data loss, just no longer used for access control
- Local bootstrap admin is a permanent fixture — acceptable for all environment types

### Known Risks (Deferred to Security Hardening Sprint)

| Risk ID | Severity | Description | Target |
|---|---|---|---|
| **SEC-GAP-2** | P1 High | Default password `password123` has no forced-change-on-first-login. Admin-created local users may keep weak password indefinitely. Fix: add `mustChangePassword` field + forced redirect on login. | Security Hardening Sprint |
| **SEC-GAP-3** | P1 High | JWT `role` claim remains valid up to 15 min after DB role change (mini-sync or admin action). Creates stale privilege window. Fix: (A) RolesGuard real-time DB check, (B) shorten token to 5min, or (C) invalidate tokens on role change. | Security Hardening Sprint |

---

## References

- [ADR-008: Microsoft Graph Integration Strategy](ADR-008-microsoft-graph-integration.md) — establishes Graph API as the integration platform
- [Story 12.3: User Management UI Enhancement](../sprints/sprint-12/12-3-user-management-ui-enhancement.md) — implementation story
- [Sprint 8 M365 Sync](../sprints/sprint-8/) — original sync infrastructure
- Microsoft Graph API: [Users](https://learn.microsoft.com/en-us/graph/api/resources/user), [memberOf](https://learn.microsoft.com/en-us/graph/api/user-list-memberof), [manager](https://learn.microsoft.com/en-us/graph/api/user-list-manager)

---

**Last Updated:** 2026-02-23 (DEC-011-18 added)
**Maintained By:** SM / Project Lead
**Review Frequency:** When user management architecture changes
