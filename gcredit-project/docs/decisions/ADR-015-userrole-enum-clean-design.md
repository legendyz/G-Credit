# ADR-015: UserRole Enum Design — Clean Enum, No Dead Values

**ADR Number:** 015
**Status:** ✅ Accepted
**Date:** 2026-02-27
**Author:** Winston (Architect)
**Deciders:** LegendZhu (PO/Project Lead), Winston (Architect), John (PM), Bob (SM), Sally (UX)
**Context:** Sprint 14 planning — TD-034 role model refactor, multi-agent design review meeting

---

## Context and Problem Statement

TD-034 (Role Model Refactor) separates user identity into two orthogonal dimensions:

1. **Permission Role** (stored in DB): What system functions can this user access?
2. **Organization Identity** (derived at runtime): Does this user manage people?

This raises three design questions about the `UserRole` enum:

1. Should `MANAGER` be removed from the enum, or kept but unused?
2. Should `GUEST` (ADR-014) be added preemptively for future FEAT-009?
3. What coding guidelines ensure future developers don't re-introduce dead enum values?

---

## Decision

### DEC-015-01: Remove MANAGER from UserRole Enum

**Decision:** Remove `MANAGER` from `UserRole`. The enum retains only permission-role values:

```prisma
enum UserRole {
  ADMIN       // Full system administration
  ISSUER      // Badge template creation and issuance
  EMPLOYEE    // Base role — no elevated permissions (default)
  // MANAGER removed — see DEC-015-02 for rationale
  // GUEST not added — see DEC-015-03
}
```

**Migration:** Existing users with `role = MANAGER` will be migrated to `role = EMPLOYEE`. Their manager identity is preserved via `directReports` relation (no data loss).

**Rationale:**
- `ADMIN`, `ISSUER`, `EMPLOYEE` all answer "what can you do" — permission semantics
- `MANAGER` answers "what are you in the org chart" — identity semantics
- Mixing two semantic categories in one enum creates an impossible choice when a user is both (e.g., ISSUER + has direct reports)
- The `directReports.length > 0` relation is already the single source of truth for manager identity

### DEC-015-02: Do NOT Keep Unused Enum Values

**Decision:** The `UserRole` enum must only contain values that are actively written to the database and checked in application logic. "Keep but don't use" is explicitly prohibited.

**Rationale — costs of a dead enum value:**

| Cost | Impact |
|------|--------|
| **Developer confusion** | New developers see `MANAGER` in the enum and naturally write `if (role === 'MANAGER')` — a code path that never executes |
| **M365 Sync ambiguity** | Sync logic must explicitly skip a value that exists but shouldn't be assigned — fragile "don't touch" semantics |
| **UI leakage** | Role dropdown in User Management shows `MANAGER` as a selectable option, but selecting it has no effect or causes unexpected behavior |
| **Test burden** | Every role-based test must account for a value that should never appear in production data |
| **Documentation overhead** | Requires ongoing documentation of "this value exists but must not be used" — perpetual cognitive tax |

**Comparison — one-time removal cost vs. ongoing retention cost:**

| Action | Cost | Frequency |
|--------|------|-----------|
| Remove MANAGER + migrate data | ~45 minutes | Once |
| Explain "MANAGER exists but don't use it" to every new contributor | ~30 minutes per person | Every time |

### DEC-015-03: Do NOT Pre-Add GUEST to Enum

**Decision:** `GUEST` will be added to `UserRole` only when FEAT-009 (Invite-to-Claim) development begins. Do not add it preemptively.

**Rationale:**
- Adding an enum value in Prisma is a single migration: `ALTER TYPE "UserRole" ADD VALUE 'GUEST'` — cost: ~10 minutes
- Pre-adding `GUEST` exposes it in UI (role dropdowns), API (DTOs), and tests before any GUEST-handling code exists
- Admin accidentally assigning `GUEST` to an internal user would restrict them to a 30-minute read-only session
- Forward-compatible — adding a new enum value is non-breaking; existing code simply never matches it

**Cross-reference:** See ADR-014 (External User / GUEST Role Strategy) for the full GUEST architecture when FEAT-009 is implemented.

---

## Organization Identity: How Manager Status Works

For clarity, this section documents how the organization dimension operates without being in the enum:

### Source of Truth

```
Manager identity = directReports.length > 0
```

- **Not stored** as a boolean field in the database (avoids data synchronization issues)
- **Derived** at two points:
  1. **JWT generation** (login / token refresh): `isManager: boolean` claim computed from `directReports` count
  2. **Query time**: when building Dashboard tabs or checking manager-scoped access

### How Manager Identity Is Set

| User Type | How manager relationship is established | Can G-Credit Admin modify? |
|-----------|----------------------------------------|---------------------------|
| **Local user** | Admin sets `managerId` on subordinate users via User Management UI. The referenced user automatically becomes a manager. Cycle detection prevents circular hierarchies. | ✅ Yes |
| **M365 user** | M365 Sync reads Graph API `/users/{id}/manager` and `/users/{id}/directReports`. Manager relationship is managed in Azure AD, not in G-Credit. | ❌ No — managed in Azure AD |

### Key Principle

> A user **becomes** a manager by having subordinates assigned to them.
> A user **stops being** a manager when all subordinates are reassigned.
> There is no "promote to manager" action — it's a derived state.

---

## Developer Guidelines

### ⚠️ CRITICAL: Instructions for Future Development

**When working with roles in G-Credit, follow these rules:**

1. **`UserRole` enum = Permission roles ONLY.**
   Values in this enum answer: "What system functions can this user access?"
   Do NOT add organizational identity values (like `MANAGER`).

2. **Manager checks use `isManager` (JWT) or `directReports` (DB query).**
   ```typescript
   // ✅ CORRECT — check JWT claim
   if (user.isManager) { /* show team view */ }
   
   // ✅ CORRECT — check DB relation  
   const hasReports = await prisma.user.count({ where: { managerId: userId } }) > 0;
   
   // ❌ WRONG — never check role for manager identity
   if (user.role === 'MANAGER') { /* this value doesn't exist */ }
   ```

3. **Adding a new role to the enum? Ask these questions first:**
   - Does this value represent a *permission* (what they can do)? → OK to add
   - Does this value represent an *identity* (what they are)? → Derive it, don't enum it
   - Will this value be actively written and checked? → If no, don't add it

4. **GUEST role — add only when implementing FEAT-009.**
   See ADR-014 for the approved architecture. Do not pre-add to enum.

5. **Code comments — add these annotations in key locations:**

   **`schema.prisma` (enum definition):**
   ```prisma
   // ADR-015: Permission roles ONLY. Manager identity derived from directReports relation.
   // Do NOT add MANAGER here. See ADR-015 for rationale.
   // GUEST will be added when FEAT-009 (Invite-to-Claim) is implemented — see ADR-014.
   enum UserRole {
     ADMIN
     ISSUER
     EMPLOYEE
   }
   ```

   **`roles.guard.ts` (backend RBAC guard):**
   ```typescript
   // ADR-015: This guard checks permission roles (ADMIN/ISSUER/EMPLOYEE) only.
   // For manager-scoped access, use @RequireManager() decorator + ManagerGuard.
   // These are two orthogonal dimensions — see ADR-015.
   ```

   **`DashboardPage.tsx` (frontend dashboard):**
   ```typescript
   // ADR-015: Dashboard tabs are computed from TWO dimensions:
   // 1. Permission role (user.role) — determines Issuance/Admin tabs
   // 2. Organization identity (user.isManager) — determines Team tab
   // All users see "My Badges" tab. Additional tabs are additive, not exclusive.
   ```

   **`ProtectedRoute.tsx` (frontend route guard):**
   ```typescript
   // ADR-015: requiredRoles checks permission dimension only.
   // For routes requiring manager access, use requireManager prop.
   ```

---

## References

- **TD-034:** Role Model Refactor — Dual-Dimension Identity (Sprint 14)
- **TD-035:** Dashboard Composite View — Permission Stacking (Sprint 15)
- **ADR-011:** User Management Architecture — `managerId` FK, cycle detection
- **ADR-014:** External User / GUEST Role Strategy (deferred to Post-Pilot)

---

*Accepted unanimously during Sprint 14-16 planning review meeting, 2026-02-27.*
