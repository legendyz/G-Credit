# ADR-012: Admin Global Settings — Centralized Configuration Management

**ADR Number:** 012
**Status:** 📋 Proposed (Sprint 13+)
**Date:** 2026-02-23
**Author:** Bob (SM)
**Deciders:** LegendZhu (PO/Project Lead), Bob (SM)
**Context:** Sprint 12 UAT discovery — skill category protection rules discussion

---

## Context and Problem Statement

During Sprint 12 UAT, we identified that business rules governing entity protection (e.g., whether system-defined skill categories can be deleted or modified) are hard-coded across multiple files in both backend and frontend. Changing a single behavior requires modifying service logic, seed data, and UI components simultaneously.

This pattern will repeat as more configurable behaviors emerge:
- Badge expiration defaults
- Self-claim permissions
- Manager approval requirements
- UI refresh intervals
- Category depth limits

**Key Question:** How should we centralize runtime-configurable business rules so that Admins can adjust system behavior without code changes?

---

## Decision

### Interim (Sprint 12)

Replace `isSystemDefined`-based hard locks on skill categories with **association-based protection**:
- Delete blocked only when category has children or associated skills (data integrity)
- Edit always allowed (with warning if category has associated skills)
- `isSystemDefined` retained as a UI label ("System Recommended") but not used for access control
- `isEditable` set to `true` for all seed categories

### Future (Sprint 13+)

Implement a `SystemSetting` module for centralized admin configuration:

**Data Model:**
```prisma
model SystemSetting {
  key         String   @id
  value       Json
  group       String
  label       String
  description String?
  updatedBy   String?
  updatedAt   DateTime @updatedAt
}
```

**Proposed Configuration Groups:**

| Group | Key | Default | Description |
|-------|-----|---------|-------------|
| category | `category.systemDefinedProtection` | `"warn"` | `"lock"` / `"warn"` / `"none"` |
| category | `category.maxDepth` | `3` | Maximum nesting depth |
| badge | `badge.allowSelfClaim` | `false` | Allow users to self-claim badges |
| badge | `badge.expirationDefault` | `365` | Default badge validity (days) |
| security | `security.requireManagerApproval` | `true` | Require manager approval for issuance |
| ui | `ui.dashboardRefreshInterval` | `300` | Dashboard auto-refresh (seconds) |

**Architecture:**
- Backend: `SettingsModule` + `SettingsService` with in-memory cache, refreshed on update
- Frontend: `/admin/settings` page, grouped by category, auto-rendered form controls
- Business modules inject `SettingsService` and call `settings.get('key')` instead of hard-coded checks

---

## Consequences

### Positive
- Single point of configuration for runtime business rules
- Admin-adjustable without code deployment
- Environment differentiation (dev = permissive, prod = strict) using same codebase
- Audit trail for configuration changes (who changed what, when)
- Extensible — new settings added with one DB row + one UI entry

### Negative
- Additional module to build and maintain
- Cache invalidation complexity in multi-instance deployments
- Risk of over-configuration — need discipline to only expose settings that genuinely need runtime adjustment

### Risks
- Not needed for MVP — defer until actual multi-tenant or compliance requirements emerge
- Over-engineering if G-Credit remains single-organization

---

## Related

- Sprint 12 UAT: Skill category `isSystemDefined` protection discussion
- ADR-011: User Management Architecture (similar protection patterns for user provisioning modes)
