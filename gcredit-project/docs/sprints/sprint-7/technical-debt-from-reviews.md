# Sprint 7 Technical Debt - Consolidated Registry

**Created:** 2026-02-01  
**Source:** Pre-UAT Reviews + Historical Sprint Debt (Sprint 0-6)  
**Status:** Consolidated master list for Sprint 8+ planning  
**Last Updated:** 2026-02-02 (Sprint 7 Complete - All P0 Fixed)

---

## Summary

| Priority | Count | Source | Target Sprint | Status |
|----------|-------|--------|---------------|--------|
| **P0 (UAT Blocker)** | 9 | Pre-UAT Reviews | Sprint 7 | ✅ **9/9 Fixed** |
| **P1 (Must Fix)** | 17 | Reviews + Historical | Sprint 8 | Pending |
| **P2 (Medium)** | 22 | Reviews + Historical + TD-009~013 | Sprint 8-9 | +5 new items |
| **P3 (Low/Future)** | 8 | Historical | Sprint 9+ | Pending |
| **Total** | **56** | - | - | - |

---

## 📋 Historical Technical Debt (Sprint 0-6)

> These items existed BEFORE the Pre-UAT Reviews. Must not be forgotten!

### High Priority - TD-001 (Sprint 8 Must Fix)

| ID | Issue | Sprint | Effort | Status | Notes |
|----|-------|--------|--------|--------|-------|
| **TD-001** | E2E Test Isolation | S5 | 6h actual | ✅ Resolved | Fixed in Sprint 8 (Task 8.8) - Schema-based isolation |

**Resolution (Sprint 8):** 
- Implemented schema-based test isolation
- 83/83 parallel tests passing (was 45/71 failing)
- CI/CD pipeline first successful run: 2026-02-03
- See: `docs/sprints/sprint-8/8-8-e2e-test-isolation.md`

### Medium Priority (Sprint 8 Candidates)

| ID | Issue | Sprint | Effort | Status | Notes |
|----|-------|--------|--------|--------|-------|
| TD-002 | Badge Issuance Tests Update | S5 | 2-4h | 📋 Planned | metadataHash migration impact |
| TD-006 | Teams Channel Permissions | S6 | 1d | ⏸️ Documented | Needs `ChannelMessage.Send` permission + **4 tests skipped** |

**🧪 TD-006 Skipped Tests (Must Re-enable When Fixed):**
1. `badge-issuance-teams-integration.spec.ts` - Teams badge issuance notifications
2. `graph-teams.service.spec.ts` - Microsoft Graph Teams service
3. `teams-sharing.controller.spec.ts` - Teams sharing controller endpoints
4. `teams-badge-notification.service.spec.ts` - Teams notification service

**Re-enable Checklist:**
- [ ] Tenant admin approves `ChannelMessage.Send` permission
- [ ] Azure AD app registration updated
- [ ] Remove `.skip()` from all 4 test files
- [ ] Verify tests pass with real Teams channel
- [ ] Update Sprint 6 technical-debt.md status to ✅ Resolved

### Low Priority (Sprint 9+ / Backlog)

| ID | Issue | Sprint | Effort | Status | Notes |
|----|-------|--------|--------|--------|-------|
| TD-003 | metadataHash Database Index | S5 | 2h | ⏸️ Backlog | Performance optimization |
| TD-004 | Baked Badge Caching | S5 | 4-6h | ⏸️ Backlog | OPT-001 enhancement |
| TD-005 | Test Data Factory Pattern | S5 | 4h | ⏸️ Backlog | Improve test maintainability |
| TD-007 | Badge PNG Generation | S6 | 2d | ⏸️ Future | `GET /api/badges/:id/download/png` placeholder |
| TD-008 | Tailwind CSS Modal Issues | S6 | 0.5d | ⏸️ Investigate | Frontend styling |

### Accepted Risk (No Action Required)

| ID | Issue | Sprint | Status | ADR |
|----|-------|--------|--------|-----|
| ADR-002 | lodash Prototype Pollution | S0 | ✅ Risk Accepted | ADR-002 |

### Code TODOs Found in Codebase

| File | Line | TODO | Priority |
|------|------|------|----------|
| `skills.service.ts` | 153 | Check if skill is referenced in badge templates before delete | P2 |
| `auth.service.ts` | 54 | Add audit logging (Task 2.2.8) | P2 |
| `auth.service.ts` | 84 | Log failed attempt for rate limiting (Task 2.3.9) | P1 (linked to SEC-P1-004) |
| `teams-sharing.controller.ts` | 92 | Teams Channel Sharing Not Implemented | P2 (TD-006) |

---

## 🔴 P0 Items (Sprint 7 - Immediate Fix Required)

> These items MUST be fixed before UAT begins

### Security P0 (3 items) ✅ COMPLETED 2026-02-01

| ID | Issue | Location | Effort | Status |
|----|-------|----------|--------|--------|
| SEC-P0-001 | IDOR: Teams badge claiming uses DTO userId | `teams-action.controller.ts` | 1h | ✅ Fixed |
| SEC-P0-002 | Register allows role self-assignment | `register.dto.ts`, `auth.service.ts` | 1h | ✅ Fixed |
| SEC-P0-003 | JWT Secret fallback to hardcoded value | `jwt.strategy.ts` | 15m | ✅ Fixed |

### Architecture P0 (1 item) ✅ COMPLETED 2026-02-01

| ID | Issue | Location | Effort | Status |
|----|-------|----------|--------|--------|
| ARCH-P0-002 | Badge Template findOne exposes DRAFT | `badge-templates.service.ts` | 1h | ✅ Fixed |

### UX P0 (4 items) ✅ COMPLETED 2026-02-01 (Phase B)

| ID | Issue | Location | Effort | Status |
|----|-------|----------|--------|---------|
| UX-P0-001 | No login page - relies on localStorage hack | `LoginPage.tsx` (created) | 4h | ✅ Fixed |
| UX-P0-002 | alert() used for errors | `BadgeDetailModal.tsx`, `EvidenceSection.tsx` | 2h | ✅ Fixed |
| UX-P0-003 | Form labels missing (accessibility) | `TimelineView.tsx`, `BadgeShareModal.tsx` | 2h | ✅ Fixed |
| UX-P0-004 | Badge claiming lacks celebration feedback | `ClaimSuccessModal.tsx` (created) | 4h | ✅ Fixed |

**P0 Total: 15.25h** ✅ ALL COMPLETED

---

## 🟠 P1 Items (Sprint 8 Backlog - Must Fix)

### Security (5 items)

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| SEC-P1-001 | IDOR in evidence upload - any ISSUER can upload to any badge | `badge-evidence.controller.ts` | 1h | Add ownership check in service |
| SEC-P1-002 | Missing Helmet middleware - security headers not set | `main.ts` | 30m | Install and configure helmet |
| SEC-P1-003 | Overly permissive CORS - `origin: true` allows all origins | `main.ts` | 30m | Whitelist specific origins |
| SEC-P1-004 | Missing rate limiting on auth endpoints | `auth.controller.ts` | 2h | Implement @nestjs/throttler (also covers TODO in auth.service.ts:84) |
| SEC-P1-005 | Dependency vulnerabilities - bcrypt, AWS SDK | `package.json` | 2h | Update bcrypt@6.0.0, npm audit fix |

### Architecture (4 items)

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| ARCH-P1-001 | Token rotation not implemented on refresh | `auth.service.ts` | 3h | Generate new refresh token on each use |
| ARCH-P1-002 | No rate limiting on auth endpoints | `auth.controller.ts` | - | Same as SEC-P1-004 (deduplicated) |
| ARCH-P1-003 | JWT secret validation at startup | `jwt.strategy.ts`, `main.ts` | 1h | Require minimum 32 char secret |
| ARCH-P1-004 | Missing ownership check on template update/delete | `badge-templates.controller.ts` | 2h | ISSUER can only modify own templates |

### Testing - Historical (1 item) ⚠️ HIGH PRIORITY

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| **TD-001** | E2E Test Isolation | `test/*.e2e-spec.ts` | 8-10h | Database cleanup race conditions. **45/71 parallel tests failing!** |

### UX (7 items)

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| UX-P1-001 | Basic celebration feedback (no confetti yet) | Claim flow | 4h | Green checkmark + congratulations text |
| UX-P1-002 | Create shared LoadingSpinner component | Multiple files | 2h | Consistent loading state patterns |
| UX-P1-003 | Add retry buttons to error states | `TimelineView.tsx`, others | 2h | User-friendly error recovery |
| UX-P1-004 | Filter label for accessibility | `TimelineView.tsx` | 0.5h | Add `<label>` to select |
| UX-P1-005 | Grid cards keyboard accessible | `TimelineView.tsx` | 2h | tabIndex, role, onKeyDown handlers |
| UX-P1-006 | Share modal tabs keyboard navigation | `BadgeShareModal.tsx` | 2h | Arrow key navigation |
| UX-P1-007 | Status badge color contrast | Multiple components | 1h | Yellow badges fail 4.5:1 contrast |

**P1 Total: ~39.5h** (including TD-001)

---

## 🟡 P2 Items (Sprint 8-9 - Medium Priority)

### Security (4 items)

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| SEC-P2-001 | Inconsistent DELETE authorization | `skills.controller.ts` | 30m | ISSUER can delete skills (inconsistent) |
| SEC-P2-002 | Password policy incomplete | `register.dto.ts` | 15m | Add special character requirement |
| SEC-P2-003 | Token storage in localStorage | Frontend | 4h+ | Consider httpOnly cookie approach |
| SEC-P2-004 | XSS in widget HTML | `widget-embed.controller.ts` | 1h | HTML-escape user content |

### Architecture (3 items)

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| ARCH-P2-001 | Password validation enhancement | `register.dto.ts`, DTOs | 2h | Use zxcvbn library |
| ARCH-P2-002 | N+1 query pattern in findOne | `badge-templates.service.ts` | 2h | Monitor, optimize if slow |
| ARCH-P2-003 | Badge template index coverage | `schema.prisma` | 1h | Add name index for search |

### Testing - Historical (1 item)

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| TD-002 | Badge Issuance Tests Update | E2E tests | 2-4h | metadataHash migration impact |

### Testing - Teams Test Failures (4 items) - NEW 2026-02-01

> Discovered during Phase A. Pre-existing issues, not caused by P0 fixes.

| ID | Issue | Location | Root Cause | Effort |
|----|-------|----------|------------|--------|
| TD-009 | Mock setup error | `graph-teams.service.spec.ts` | `disabledService.sendActivityNotification` is not a function | 1h |
| TD-010 | Array index error | `teams-badge-notification.service.spec.ts` | Cannot read properties of undefined (reading '4') | 1h |
| TD-011 | Mock error handling | `teams-sharing.controller.spec.ts` | Teams notification service error handling | 1h |
| TD-012 | DI injection missing | `badge-issuance-teams.integration.specs.ts` | Missing provider for ConfigService or EmailService | 2h |

### UX (5 items)

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| UX-P2-001 | Full confetti celebration animation | Claim flow | 8h | canvas-confetti library |
| UX-P2-002 | SPA routing in empty state CTAs | `EmptyState.tsx` | 1h | Use useNavigate() |
| UX-P2-003 | Replace emoji icons with Lucide | `BadgeTimelineCard.tsx` | 1h | 👁️ ⬇️ → Eye, Download |
| UX-P2-004 | Add skip links | Layout | 1h | "Skip to main content" |
| UX-P2-005 | Standardize focus indicators | Multiple components | 4h | Consistent focus ring |

### Infrastructure - Historical (2 items)

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| TD-006 | Teams Channel Permissions | Graph API | 1d | Needs `ChannelMessage.Send` permission + **4 tests skipped** |
| TODO | Audit logging for auth | `auth.service.ts:54` | 2h | Task 2.2.8 incomplete |

**🧪 TD-006 Impact:**
- **Skipped Tests:** 4 Teams integration tests (see Medium Priority section for list)
- **Code References:** `teams-sharing.controller.ts:92`, service implementations ready
- **Blocked Features:** Teams channel badge sharing (email sharing works as workaround)

### Build/Performance - NEW 2026-02-01 (Phase B)

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| TD-013 | Frontend bundle exceeds 500KB | `vite.config.ts` | 3h | 579KB minified (176KB gzip). Implement code splitting + vendor chunks |

### Code Quality (1 item)

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| TODO | Skill deletion reference check | `skills.service.ts:153` | 2h | Check badge template references before delete |

**P2 Total: ~38h** (+3h TD-013)

---

## 🟢 P3 Items (Sprint 9+ / Future / Nice-to-Have)

### Performance - Historical

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| TD-003 | metadataHash Database Index | `schema.prisma` | 2h | Performance optimization for hash lookups |
| TD-004 | Baked Badge Caching | Badge service | 4-6h | OPT-001: Cache generated PNG badges |
| TD-005 | Test Data Factory Pattern | Test utils | 4h | Improve test maintainability |

### Feature - Historical

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| TD-007 | Badge PNG Generation | `badges.controller.ts` | 2d | `GET /api/badges/:id/download/png` currently placeholder |

### Frontend - Historical

| ID | Issue | Location | Effort | Notes |
|----|-------|----------|--------|-------|
| TD-008 | Tailwind CSS Modal Issues | Frontend components | 0.5d | Styling investigation needed |

**P3 Total: ~5 days**

---

## 📊 Consolidated Effort Summary

| Priority | Count | Effort | Target |
|----------|-------|--------|--------|
| **P0** | 8 | 15.25h | Sprint 7 (NOW) |
| **P1** | 17 | ~39.5h | Sprint 8 |
| **P2** | 17 | ~35h | Sprint 8-9 |
| **P3** | 8 | ~5d | Sprint 9+ |
| **Total** | **51** | **~130h** | - |

### By Category

| Category | P0 | P1 | P2 | P3 | Total |
|----------|----|----|----|----|-------|
| Security | 2.25h | 6h | 5.75h | - | 14h |
| Architecture | 1h | 6h | 5h | - | 12h |
| UX | 12h | 13.5h | 15h | - | 40.5h |
| Testing | - | 8-10h | 2-4h | 4h | ~16h |
| Infrastructure | - | - | 10h | - | 10h |
| Performance | - | - | - | 10-14h | ~12h |
| Feature | - | - | - | 2d | 2d |

---

## ⚠️ Risk Assessment

### No Historical P0 Issues Found ✅

经过检查，历史技术债务中**没有 P0 级别**的问题。所有 P0 都来自本次 Pre-UAT Review。

**结论：Sprint 7 Phase A 工作计划不需要调整。**

### High Risk Items (Must Address in Sprint 8)

1. **TD-001 (E2E Test Isolation)** - 45/71 并行测试失败，阻碍 CI/CD
2. **SEC-P1-004 (Rate Limiting)** - 暴力破解攻击风险
3. **SEC-P1-002 + SEC-P1-003 (Helmet + CORS)** - 安全头和跨域配置

---

## Sprint 8 Planning Recommendation

### Must Include (P1 - ~39.5h)

**Week 1 Priority:**
1. **TD-001** (E2E Test Isolation) - 8-10h - 解决并行测试问题
2. **SEC-P1-002 + SEC-P1-003** (Helmet + CORS) - 1h - 安全快速赢
3. **SEC-P1-004** (Rate limiting) - 2h - 防止暴力破解
4. **SEC-P1-001** (Evidence IDOR) - 1h - 授权修复

**Week 2 Priority:**
5. **ARCH-P1-001** (Token rotation) - 3h - 安全最佳实践
6. **UX-P1-001** (Celebration feedback) - 4h - 核心 UX 承诺
7. **UX-P1-002 to UX-P1-007** - 9.5h - A11y 和 UX 改进

### Recommended Sprint 8 Capacity Allocation

| Category | Hours | % of Sprint |
|----------|-------|-------------|
| New Features (Epic 10+) | 20h | 50% |
| P1 Technical Debt | 16h | 40% |
| Buffer/Bugs | 4h | 10% |
| **Total** | **40h** | 100% |

---

## References

- [Security Audit Report](../../security/security-audit-sprint-0-7.md)
- [Architecture Review](../sprint-1/architecture-review-retrospective.md)
- [UX Audit Report](../ux-audit-sprint-1-4.md)
- [Sprint 6 Technical Debt](../sprint-6/technical-debt.md) - Teams Channel Sharing
- [Health Audit Report](../../health-audit-report-2026-02-01.md) - TD-001 to TD-008
- [project-context.md](../../../../project-context.md) - TD tracking section

---

**Document Owner:** Scrum Master (Bob)  
**Next Review:** Sprint 8 Planning  
**Last Updated:** 2026-02-01  
**Version:** 2.0 (Consolidated with historical debt)
