# Architecture Decision Record: lodash Security Risk Acceptance

**ADR Number:** 002  
**Title:** Accept lodash Prototype Pollution Vulnerability (Moderate) for MVP Development  
**Status:** ✅ Accepted  
**Date:** 2026-01-25  
**Decision Maker:** Product Manager / Tech Lead  
**Related Sprint:** Sprint 0 (discovered), Sprint 1 (documented)  
**Action Item:** AI-2 from Sprint 0 Retrospective

---

## Context

During Sprint 0, `npm audit` identified 2 moderate severity vulnerabilities in the `lodash` package (version 4.0.0 - 4.17.21):

**Vulnerability Details:**
- **Type:** Prototype Pollution in `_.unset` and `_.omit` functions
- **CVE/Advisory:** GHSA-xxjr-mmjv-4gpg
- **CWE:** CWE-1321 (Improperly Controlled Modification of Object Prototype Attributes)
- **CVSS Score:** 6.5 (Medium)
  - Attack Vector: Network (AV:N)
  - Attack Complexity: Low (AC:L)
  - Privileges Required: None (PR:N)
  - User Interaction: None (UI:N)
  - Confidentiality Impact: None (C:N)
  - Integrity Impact: Low (I:L)
  - Availability Impact: Low (A:L)

**Affected Dependency Chain:**
```
@nestjs/config@3.2.3 (direct dependency)
  └── lodash@4.17.21 (indirect dependency) ← VULNERABLE
```

**Fix Available:**
```bash
npm audit fix --force
# Downgrades: @nestjs/config 3.2.3 → 1.1.5 (BREAKING CHANGE)
```

---

## Decision

**We accept the moderate security risk posed by the lodash vulnerability during MVP development phase (Sprints 1-7).**

**Risk acceptance is valid under the following conditions:**
1. ✅ Development environment only (no production deployment)
2. ✅ No external network exposure (local development, Azure firewall rules)
3. ✅ Single developer, controlled environment
4. ✅ Test data only (no sensitive production data)
5. ✅ Documented with re-evaluation triggers
6. ✅ Monitored for severity escalation

**Risk will be re-evaluated before:**
- Production deployment (Sprint 8+)
- External pilot/beta testing
- Any public-facing environment deployment

---

## Alternatives Considered

### Option A: Accept Risk (CHOSEN) ✅
**Pros:**
- Zero disruption to Sprint 1 development
- Avoid breaking changes and regression testing (saves 2-4 hours)
- Moderate severity acceptable in isolated dev environment
- Clear re-evaluation timeline

**Cons:**
- Vulnerability remains in codebase temporarily
- Requires ongoing monitoring

**Effort:** 15 minutes (documentation only)

---

### Option B: Force Fix (REJECTED) ❌
**Command:** `npm audit fix --force`

**Pros:**
- Eliminates vulnerability immediately
- Clean audit report

**Cons:**
- **Breaking change:** Downgrades `@nestjs/config` from 3.2.3 to 1.1.5
- Requires extensive testing:
  - Environment variable loading (`.env` files)
  - ConfigService API compatibility
  - Database connection strings (PostgreSQL)
  - Azure Blob Storage configuration
  - All health check endpoints
- Risk of introducing new bugs from API changes
- May require code modifications if ConfigService API changed

**Effort:** 2-4 hours (testing + potential code changes + rollback plan)

**Risk Assessment:**
- **High Risk:** Potential regression in configuration management
- **Medium Complexity:** Need to verify all environment-dependent features
- **Uncertain Outcome:** May not fully resolve if newer packages reintroduce lodash

**Rejection Reason:** Cost (2-4h) > Benefit (marginal security gain in isolated dev env)

---

### Option C: Wait for NestJS Update (REJECTED) ❌
**Strategy:** Monitor `@nestjs/config` for new releases that remove lodash dependency

**Pros:**
- No immediate action required
- Non-breaking fix when available

**Cons:**
- Uncertain timeline (weeks to months)
- Current version (3.2.3) is already latest
- NestJS team must choose to address lodash dependency
- May never be resolved if lodash is core to ConfigModule

**Effort:** 5 minutes/week (monitoring)

**Rejection Reason:** Indefinite wait time, no guaranteed resolution

---

## Consequences

### Positive
1. ✅ **Sprint 1 can proceed without delay** - Zero impact on authentication development
2. ✅ **No regression risk** - Existing Sprint 0 infrastructure remains stable
3. ✅ **Time saved** - 2-4 hours reallocated to Sprint 1 feature work
4. ✅ **Documented technical debt** - Clear tracking and re-evaluation plan
5. ✅ **Learning captured** - Risk management process established for future

### Negative
1. ⚠️ **Moderate vulnerability persists** - Acceptable in current context but requires monitoring
2. ⚠️ **Deferred technical debt** - Must be addressed before production
3. ⚠️ **Audit report shows issues** - `npm audit` will continue reporting 2 moderate vulnerabilities

### Neutral
1. 📝 **Requires documentation maintenance** - Update Known Issues section in READMEs
2. 📝 **Monitoring obligation** - Weekly check for severity escalation or NestJS updates
3. 📝 **Decision checkpoint** - Sprint 8 (pre-production) must revisit this decision

---

## Risk Mitigation Measures

### Immediate Actions (Completed)
- [x] Document vulnerability details in this ADR
- [x] Add to "Known Issues" section in project READMEs
- [x] Record in Sprint 1 Backlog version manifest
- [x] Set re-evaluation triggers

### Ongoing Monitoring (Sprint 1-7)
- [x] **Weekly:** Check npm advisories for lodash severity escalation
- [x] **Bi-weekly:** Check `@nestjs/config` for new releases
- [x] **Each Sprint:** Verify vulnerability status hasn't changed (run `npm audit`)
- [x] **2026-01-25 Update:** Added tar/bcrypt vulnerabilities to monitoring scope (see below)

### Pre-Production Actions (Sprint 8)
- [ ] Re-run `npm audit` and assess current state
- [ ] Evaluate if vulnerability was patched by NestJS updates
- [ ] If still present, execute Option B (force fix) with full regression testing
- [ ] Consider alternative config libraries if lodash dependency unresolved

---

## Attack Vector Analysis

**Prototype Pollution Exploit Requirements:**
1. Attacker must send malicious payloads to application endpoints
2. Application must use `_.unset` or `_.omit` on user-controlled input
3. Polluted prototype must be exploitable in downstream code

**G-Credit Current Exposure:**
- ❌ **No external network access** - Development environment on localhost
- ❌ **No user input to lodash functions** - @nestjs/config uses lodash internally, not exposed to API
- ❌ **No production data** - Only test users and sample data
- ✅ **Azure firewall rules** - Database not publicly accessible
- ✅ **Local development only** - No deployment to public cloud yet

**Conclusion:** Attack surface is **minimal to non-existent** in current development phase.

---

## Update: Additional Vulnerabilities (2026-01-25)

During Story 2.2 (User Registration) implementation, installing bcrypt dependencies introduced additional vulnerabilities:

### tar Package - 2 High Severity
**Vulnerability:**
- **Severity:** High
- **Advisory:** GHSA-8qq5-rm4j-mr97, GHSA-r6q2-hw4h-h46w
- **Issue:** Arbitrary File Overwrite, Symlink Poisoning, Race Condition
- **Affected Range:** tar <= 7.5.3

**Dependency Chain:**
```
bcrypt@5.1.1 (direct, required for password hashing)
  └── @mapbox/node-pre-gyp <= 1.0.11
      └── tar <= 7.5.3 ← VULNERABLE
```

**Risk Assessment:** ✅ **ACCEPTED**
- `tar` is only used during `npm install` (build-time, not runtime)
- Exploitable only if malicious tar archives are processed
- We install from trusted npm registry (official source)
- No impact on running application security
- Waiting for upstream fix (bcrypt team to update node-pre-gyp)

### bcrypt - 1 High Severity (Indirect)
**Status:** This is not a bcrypt vulnerability itself, but inherited from tar via node-pre-gyp.

**Decision:** Same acceptance criteria as tar vulnerability above.

### Combined Risk Status (2026-01-25)
```
Total: 5 vulnerabilities (2 moderate, 3 high)
├── lodash (2 moderate) ✅ Accepted per original ADR-002
├── tar (2 high) ✅ Accepted - build-time only, trusted source
└── bcrypt indirect (1 high) ✅ Accepted - same as tar
```

**Detailed Analysis:** See `../../backend/docs/sprints/sprint-1/npm-warnings-analysis.md`

---

## References

- **GitHub Advisory:** https://github.com/advisories/GHSA-xxjr-mmjv-4gpg
- **Sprint 0 Retrospective:** `_bmad-output/implementation-artifacts/sprint-0-retrospective.md` (Action Item AI-2)
- **Sprint 1 Backlog:** `_bmad-output/implementation-artifacts/sprint-1-backlog.md` (Known Security Issues section)
- **CVSS Calculator:** https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator
- **NestJS Config GitHub:** https://github.com/nestjs/config

---

## Review History

| Date | Reviewer | Action | Notes |
|------|----------|--------|-------|
| 2026-01-25 | Product Manager | Initial Decision | Risk accepted for Sprint 1-7 MVP development |
| 2026-01-25 | Developer | Updated | Added tar/bcrypt vulnerabilities from Story 2.2 |
| [Future] | Tech Lead | Sprint 8 Review | Re-evaluate before production deployment |

---

## Decision Summary

**STATUS:** ✅ **ACCEPTED**  
**VALID UNTIL:** Sprint 8 (Pre-Production Deployment) or severity escalation  
**NEXT REVIEW:** 2026-03-01 (Estimated Sprint 8 start) or upon severity change  
**MONITORING FREQUENCY:** Weekly vulnerability check, bi-weekly dependency check

**Rationale in One Sentence:**  
The moderate-severity lodash vulnerability poses negligible risk in an isolated development environment, and deferring the fix avoids breaking changes while maintaining development velocity during MVP sprints.

---

**Created by:** Product Manager (AI-assisted)  
**Approved by:** [Team Lead Name]  
**Date:** 2026-01-25  
**ADR Format:** Based on Michael Nygard's ADR template
