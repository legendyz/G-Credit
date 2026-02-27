# Sprint 14 — Role Model Refactor + Quick Wins

**Status:** 🔜 Planned  
**Sprint Goal:** Architecture-first — land the dual-dimension role model refactor before UI changes.  
**Target Version:** v1.4.0  
**Estimated Effort:** ~24h  
**Dependencies:** Sprint 13 (v1.3.0) complete ✅  

---

## Key Deliverables

- Remove MANAGER from UserRole enum → `{ ADMIN, ISSUER, EMPLOYEE }`
- JWT `isManager: boolean` claim derived from `directReports` count
- New `ManagerGuard` + `@RequireManager()` decorator
- M365 sync: role derivation no longer assigns MANAGER
- Frontend: all MANAGER references removed, `isManager` in auth store
- Fix flaky BadgeManagementPage test (TD-036)
- Design tokens prep (P1-2)

## Architecture

- **ADR-015:** UserRole Enum Clean Design
- **ADR-017:** TD-034 Dual-Dimension Identity Architecture (full spec)

## Stories (9)

| # | Story | Est | Priority |
|---|-------|-----|----------|
| 14.1 | Fix flaky BadgeManagementPage test (TD-036) | 2-4h | HIGH |
| 14.2 | Schema migration: remove MANAGER from enum | 2h | CRITICAL |
| 14.3 | JWT payload + AuthenticatedUser + JwtStrategy | 2h | CRITICAL |
| 14.4 | ManagerGuard + @RequireManager() decorator | 2h | HIGH |
| 14.5 | RolesGuard update + remove @Roles('MANAGER') | 2h | HIGH |
| 14.6 | M365 sync + user mgmt cleanup | 2h | HIGH |
| 14.7 | Frontend types + remove MANAGER references | 4h | HIGH |
| 14.8 | 6-combination test matrix | 2h | HIGH |
| 14.9 | Design tokens prep (P1-2) | 1h | LOW |

## Sprint Documents

- [Backlog](backlog.md)
