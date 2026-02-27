# ADR-014: External User Strategy — GUEST Role & Deferred Implementation

**ADR Number:** 014
**Status:** 📋 Deferred (Architecture Approved, Implementation Post-Pilot)
**Date:** 2026-02-27
**Author:** Winston (Architect) + John (PM)
**Deciders:** LegendZhu (PO/Project Lead), Winston (Architect), John (PM), Bob (SM), Sally (UX)
**Context:** Sprint 14-16 planning — FEAT-009 (Invite-to-Claim) scope and architectural impact assessment

---

## Context and Problem Statement

FEAT-009 (Invite-to-Claim) allows Issuers to send badge invitations to **external email recipients** who are not in the Azure AD tenant. This raises three architectural questions:

1. **Authentication:** How do external users authenticate to claim badges? (They can't use SSO)
2. **User Type:** Should external users have a distinct role or account type?
3. **Account Lifecycle:** When an external user later joins the organization (new corporate email), how do they associate their old badges with their new identity?

### Current System Assumptions

The current User model assumes every user is either:
- An **SSO user** (`azureId` populated via Azure AD)
- A **local user** (`passwordHash` populated via registration)

External recipients fit neither category.

---

## Decision

### DEC-014-01: GUEST as a Permission Role (Not a Third Dimension)

**Decision:** Add `GUEST` to the `UserRole` enum as a permission role, not as a separate account type dimension.

```prisma
enum UserRole {
  ADMIN
  ISSUER
  EMPLOYEE
  GUEST      // External users — minimal permissions
}
```

**Rationale:**
- Current RBAC is **whitelist-based** — endpoints require explicit `@Roles()` decoration. A new role with no `@Roles('GUEST')` references automatically has zero admin access. This is secure by default.
- Adding a third dimension (`accountType: INTERNAL | GUEST`) would create 12 permission combinations (3 roles × 2 manager × 2 types) vs. 8 (4 roles × 2 manager). The complexity isn't justified.
- `GUEST` semantically describes "what you can do" (minimal — view wallet, claim badges), which is the role dimension's purpose.
- After TD-034 (Sprint 14) removes `MANAGER` from the enum, adding `GUEST` later is a simple forward-compatible enum extension — not a breaking change.

**Rejected Alternatives:**
- **`isExternal: boolean` field:** Creates a second permission axis that every guard must check. Higher complexity, same outcome.
- **No distinct type (just EMPLOYEE):** External users would inherit EMPLOYEE permissions (potentially accessing internal-only features). Principle of least privilege violated.

### DEC-014-02: Magic Link Authentication for External Users

**Decision:** External users authenticate via one-time Magic Link sent to their email.

**Flow:**
1. Issuer sends badge invitation to `abc@hotmail.com`
2. System sends email with `claimToken` (7-day expiry) + `magicLinkToken` (1-hour expiry)
3. Recipient clicks Magic Link → system verifies token → JIT creates GUEST user → issues short-lived JWT → auto-claims badge
4. GUEST session: 30 minutes, non-renewable, access limited to Wallet + Profile + Claim pages

**Rationale:**
- Lowest friction (one click to claim)
- No password management for external users
- Security: short-lived tokens + restricted session scope
- Magic Link token is single-use (prevents replay)

**Rejected Alternatives:**
- **Temporary password:** Adds password management burden for occasional external users
- **No authentication (token-only claim):** Badge would not be viewable after initial claim; no persistent wallet

### DEC-014-03: Manual Account Merge with Verification (Post-Pilot L2)

**Decision:** When an external user joins the organization, account association is **manual with email verification** — not automatic.

**Problem:** `abc@hotmail.com` → `123@company.com` — there is no deterministic technical link between these identifiers. Name matching is unreliable (duplicates), and Azure AD `alternateEmail` is not universally populated.

**Merge Flow (L2 — Post-Pilot):**
1. New employee logs in via SSO → JIT creates corporate account
2. User navigates to Profile → "Link Previous Account" action
3. User enters old email `abc@hotmail.com`
4. System sends verification email to old address
5. User clicks verification link → system merges accounts:
   - Badges (earned + issued), milestones, shares → migrated to new account
   - Audit logs → **not migrated** (immutable time records, retain `performedBy: oldUserId`)
   - Old account → `isActive=false`, `mergedIntoId` points to new account (soft-delete)

**Optional Enhancement:** If a new SSO user's `firstName + lastName` matches an existing GUEST account exactly, show a non-blocking prompt: "We found an account that may be yours (a***@hotmail.com). Would you like to link it?" — suggestion only, never auto-merge.

**Rationale:**
- Zero risk of incorrect account merges (user explicitly verifies ownership of old email)
- Email verification proves ownership of the external address
- Soft-delete preserves referential integrity in audit logs

### DEC-014-04: Phased Implementation

**Decision:** Split into two phases:

| Phase | Scope | Sprint | Effort |
|-------|-------|--------|--------|
| **L1 (Pilot Gate)** | Magic Link + GUEST JIT + Badge Claim | Post-Pilot Sprint | ~8h |
| **L2 (Post-Pilot)** | Account Merge + Self-Service Link + Name Match Suggestion | Phase 5 | ~10-12h |

**Decision to defer L1 from Sprint 16:** Pilot users are internal employees (all in Azure AD). External user invitations are not a Pilot requirement — they are a Phase 5 feature that Pilot feedback should validate demand for first.

---

## Architecture Impact Assessment

### Impact on Sprint 14-16 Work (Current Plan)

| In-Progress Work | Impact from GUEST | Assessment |
|------------------|-------------------|------------|
| TD-034: Remove MANAGER from enum | GUEST added later as enum extension | ✅ **Zero impact** — forward compatible |
| TD-034: JWT `isManager` claim | GUEST users: `isManager = false` | ✅ **Zero impact** |
| TD-035: Tab-based Dashboard | GUEST sees only "My Badges" tab | ✅ **Zero impact** — single-tab case already handled |
| F-1 L1: Issuer template ownership | GUEST doesn't issue badges | ✅ **No intersection** |
| Sprint 13 SSO flow | GUEST uses Magic Link, not SSO | ✅ **Parallel path**, no SSO code changes |

### Future Schema Changes (When Implemented)

```prisma
model User {
  // Existing fields — no changes needed now
  
  // Added in L1:
  // - GUEST added to UserRole enum (1 line)
  // - invitedBy: String? (FK to Issuer who sent invite)
  // - invitedAt: DateTime?
  
  // Added in L2:
  // - mergedIntoId: String? (points to new account after merge)
  // - mergedAt: DateTime?
}
```

### Conclusion

**No preparatory work needed in Sprint 14-16.** The GUEST role is a forward-compatible enum extension that can be added at any time without modifying existing code. Current RBAC whitelist architecture ensures GUEST is secure by default.

---

## Data Model Summary (Future Reference)

### Account Merge Rules

| Data Type | Merge Strategy | Rationale |
|-----------|---------------|-----------|
| Badges (earned) | Migrate to new account | Badges follow the person |
| Badges (issued) | Migrate to new account | Issuer identity follows the person |
| Milestone Achievements | Migrate to new account | Achievements follow the person |
| Badge Shares | Migrate to new account | Share history follows the person |
| Audit Logs | **Do NOT migrate** | Immutable time records; retain `performedBy: oldUserId` |
| Old Account | Soft-delete: `isActive=false, mergedIntoId=newId` | Preserve referential integrity |

### GUEST Session Constraints

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Session duration | 30 minutes | Sufficient for claim + wallet viewing |
| Session renewal | Not allowed | Restrict external access window |
| Accessible pages | Wallet, Profile, Claim | Minimum viable access |
| Admin features | None | Whitelist RBAC blocks by default |

---

## References

- **FEAT-009:** Invite-to-Claim feature request
- **TD-034:** Role Model Refactor (Sprint 14) — removes MANAGER, establishes dual-dimension model
- **ADR-011:** User Management Architecture — `managerId` FK, role management
- **ADR-015:** UserRole Enum Clean Design — explains why GUEST is not pre-added to the enum
- **Sprint 13:** SSO + Session Management — JIT Provisioning pattern reusable for GUEST JIT

---

*This ADR records the architectural decision and defers implementation to Post-Pilot. No code changes required until FEAT-009 is prioritized.*
