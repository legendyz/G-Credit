# Security Notes - G-Credit Project

**Last Updated:** 2026-01-26  
**Project Phase:** Sprint 2 Development  
**Status:** Monitoring

---

## 📋 Known Security Vulnerabilities

### Current Status (2026-01-26)

**Total Vulnerabilities:** 5 (2 Moderate, 3 High)  
**Risk Level:** LOW (Development environment, minimal production impact)

---

## 🔴 High Severity Vulnerabilities (3)

### 1. bcrypt@5.1.1 (Indirect)

**Source:** npm audit  
**Discovered:** 2026-01-26 (Sprint 2, Story 3.2)  
**Direct Dependency:** Yes  
**Vulnerability Chain:** bcrypt → @mapbox/node-pre-gyp → tar

**Details:**
- **Affected Version:** 5.1.1 (current)
- **Safe Version:** 6.0.0+
- **Root Cause:** Dependency `@mapbox/node-pre-gyp@≤1.0.11` uses vulnerable `tar` package
- **Impact:** Build-time only, not runtime

**Risk Assessment:**
- **Production Impact:** ⚠️ LOW
- **Reason:** Vulnerability only affects npm package installation process, not application runtime
- **Attack Vector:** Requires compromised npm registry or malicious tarball during `npm install`

**Decision:**
- ✅ **Status:** ACCEPTED (Defer to Sprint 7)
- **Reason:** bcrypt@6.0.0 is a major version bump (potentially breaking changes)
- **Mitigation:** Use trusted npm registry, verify package integrity
- **Action Plan:** Upgrade during dedicated dependency maintenance sprint (Sprint 7)

---

### 2. tar@≤7.5.3 (Transitive Dependency)

**Source:** npm audit  
**CVE:** 
- CVE-1112255: Arbitrary File Overwrite via Path Traversal (CWE-22)
- CVE-1112329: Race Condition on macOS APFS (CWE-176)

**Details:**
- **CVSS Score:** 8.8/10 (High)
- **Affected Path:** bcrypt → @mapbox/node-pre-gyp → tar@7.5.3
- **Vulnerability:** Path sanitization issues allowing file overwrite

**Risk Assessment:**
- **Production Impact:** ⚠️ VERY LOW
- **Reason:** Only used during npm install/build process, never in application code
- **Attack Vector:** Malicious npm package containing crafted tarball

**Decision:**
- ✅ **Status:** ACCEPTED (Defer to Sprint 7)
- **Reason:** Not used in production runtime
- **Mitigation:** 
  - Use `package-lock.json` to lock versions
  - Use `npm ci` in production deployments
  - Verify package integrity with `npm audit signatures`

---

### 3. @mapbox/node-pre-gyp@≤1.0.11

**Source:** npm audit  
**Dependency of:** bcrypt@5.1.1

**Details:**
- **Version:** 1.0.11 (current)
- **Issue:** Depends on vulnerable tar package
- **Purpose:** Binary compilation helper for native Node.js addons

**Risk Assessment:**
- **Production Impact:** ⚠️ LOW
- **Reason:** Only invoked during bcrypt installation, not at runtime

**Decision:**
- ✅ **Status:** ACCEPTED (Defer to Sprint 7)
- **Reason:** Coupled with bcrypt upgrade decision

---

## 🟡 Moderate Severity Vulnerabilities (2)

### 4. lodash@4.17.21 (Transitive Dependency)

**Source:** npm audit  
**CVE:** GHSA-xxjr-mmjv-4gpg  
**Discovered:** 2026-01-26 (Sprint 2, Story 3.2)

**Details:**
- **CVSS Score:** 6.5/10 (Moderate)
- **Affected Functions:** `_.unset()`, `_.omit()`
- **Vulnerability:** Prototype Pollution (CWE-1321)
- **Dependency Path:** @nestjs/config@4.0.2 → lodash@4.17.21
- **Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:L

**Risk Assessment:**
- **Production Impact:** ⚠️ LOW-MODERATE
- **Reason:** 
  - lodash only used during config initialization (@nestjs/config)
  - Not directly exposed to user input
  - Prototype pollution requires specific attack patterns
- **Attack Vector:** Attacker would need to control config file contents

**Decision:**
- ✅ **Status:** ACCEPTED (Defer to Sprint 7)
- **Reason:** Limited attack surface, config files are server-controlled
- **Mitigation:**
  - Do not accept config from untrusted sources
  - Validate all environment variables
  - Use Object.freeze() on critical config objects

---

### 5. @nestjs/config@4.0.2 (Indirect)

**Source:** npm audit  
**Direct Dependency:** Yes

**Details:**
- **Version:** 4.0.2 (current)
- **Issue:** Depends on vulnerable lodash@4.17.21
- **Suggested Fix:** Downgrade to @nestjs/config@1.1.5 (major version regression)

**Risk Assessment:**
- **Production Impact:** ⚠️ LOW
- **Reason:** Flagged due to lodash dependency, not @nestjs/config itself

**Decision:**
- ✅ **Status:** ACCEPTED (Defer to Sprint 7)
- **Reason:** 
  - Downgrading to 1.x would lose features used in Sprint 1
  - Risk is from lodash, not @nestjs/config
- **Alternative:** Wait for @nestjs/config to update lodash dependency

---

## 📊 Vulnerability Summary Table

| Package | Version | Severity | CVSS | Direct? | Production Impact | Status |
|---------|---------|----------|------|---------|-------------------|--------|
| bcrypt | 5.1.1 | High | - | Yes | LOW | Accepted |
| tar | ≤7.5.3 | High | 8.8 | No | VERY LOW | Accepted |
| @mapbox/node-pre-gyp | ≤1.0.11 | High | - | No | LOW | Accepted |
| lodash | 4.17.21 | Moderate | 6.5 | No | LOW-MODERATE | Accepted |
| @nestjs/config | 4.0.2 | Moderate | - | Yes | LOW | Accepted |

---

## 🛡️ Mitigation Strategies

### Immediate Actions (Sprint 2-6)

1. **✅ Documentation**
   - Record all known vulnerabilities (this file)
   - Reference in Sprint Planning Checklist

2. **✅ Development Practices**
   - Use `npm ci` instead of `npm install` in production
   - Maintain `package-lock.json` integrity
   - Never expose npm/package management to public internet

3. **✅ Configuration Security**
   - Validate all environment variables
   - Use environment-specific .env files
   - Never accept config from untrusted sources

4. **✅ Monitoring**
   - Weekly `npm audit` checks
   - Track new CVEs for bcrypt and @nestjs/config

### Long-term Actions (Sprint 7+)

**Dedicated Dependency Maintenance Sprint (Sprint 7):**

```bash
# Upgrade Strategy
npm install bcrypt@^6.0.0
npm install @nestjs/config@latest

# Verify all tests pass
npm test
npm run test:e2e

# Re-run security audit
npm audit

# Update this document with results
```

**Testing Checklist:**
- [ ] All authentication flows work (bcrypt upgrade)
- [ ] Password hashing/comparison functions
- [ ] Config loading in all environments
- [ ] JWT token generation and validation
- [ ] All 40+ tests pass (Sprint 1 + Sprint 2)

---

## 🔍 Why These Vulnerabilities Exist

### Root Causes

1. **Dependency Chain Complexity**
   - Modern npm projects have 900+ packages
   - Transitive dependencies (dependencies of dependencies)
   - Limited control over sub-dependencies

2. **Version Pinning Strategy**
   - `^5.1.1` allows 5.x updates but not 6.x
   - Major version upgrades often have breaking changes
   - Conservative upgrade approach during active development

3. **Ecosystem Lag**
   - Security patches take time to propagate upstream
   - bcrypt@5.x still actively used despite 6.x availability
   - @nestjs ecosystem follows its own release cycle

4. **Build vs Runtime**
   - Many vulnerabilities affect build tools (tar, node-pre-gyp)
   - These never execute in production application
   - npm audit doesn't distinguish build-time vs runtime risk

---

## 📈 Historical Context

**Sprint 0-1:** Similar warnings encountered but not formally documented  
**Sprint 2 (2026-01-26):** First formal security audit during Story 3.2 development  
**Reason for Recording:** Establish baseline for future sprints

---

## 🎯 Decision Rationale

**Why Accept These Risks for Sprint 2-6?**

1. **Development Phase**
   - Still building core features
   - Breaking changes from dependency upgrades could delay delivery
   - Sprint 7 dedicated to technical debt is more appropriate

2. **Low Production Impact**
   - No production deployment until Sprint 7+
   - Development environment is isolated
   - Vulnerabilities mainly affect build process, not runtime

3. **Cost-Benefit Analysis**
   - Upgrading bcrypt to 6.x: 4-6 hours of testing
   - Current sprint velocity: Very high (3 stories in 2 hours)
   - Better to maintain momentum and batch upgrades

4. **Risk Management**
   - Using trusted npm registry (npmjs.com)
   - No public exposure of application yet
   - package-lock.json provides reproducible builds

---

## 🚀 Action Plan Timeline

| Sprint | Action | Owner | Status |
|--------|--------|-------|--------|
| Sprint 2-6 | Monitor vulnerabilities | Dev | ✅ Ongoing |
| Sprint 2-6 | Document new findings | Dev | ✅ Complete |
| Sprint 7 | Dedicated dependency upgrade sprint | Dev Team | ⏸️ Planned |
| Sprint 7 | Upgrade bcrypt to 6.x | Dev | ⏸️ Planned |
| Sprint 7 | Update @nestjs packages | Dev | ⏸️ Planned |
| Sprint 7 | Full regression testing | QA | ⏸️ Planned |
| Sprint 8+ | Automate security monitoring | DevOps | ⏸️ Planned |

---

## 📚 References

- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [bcrypt changelog](https://github.com/kelektiv/node.bcrypt.js/blob/master/CHANGELOG.md)
- [lodash security advisories](https://github.com/lodash/lodash/security/advisories)
- [GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg)

---

## 🔄 Update History

| Date | Sprint | Event | Action |
|------|--------|-------|--------|
| 2026-01-26 | Sprint 2 | Initial security audit | Created this document |
| 2026-01-26 | Sprint 2 | 5 vulnerabilities identified | Accepted all, defer to Sprint 7 |

---

**Next Review:** Sprint 7 Planning (estimated 2026-02-10)
