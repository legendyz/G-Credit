# Sprint Version Manifest Template

> **Purpose:** Standard template for documenting exact technology versions in sprint planning documents  
> **Created:** 2026-01-25 (Action Item AI-1 from Sprint 0 Retrospective)  
> **Usage:** Copy this section into each sprint backlog document during sprint planning

---

## 🔧 Technology Version Manifest

> **Purpose:** Explicit version tracking to avoid dependency conflicts and version drift  
> **Last Verified:** [YYYY-MM-DD] (Sprint [N] Kickoff Preparation)  
> **Sprint Number:** Sprint [N]  
> **Action Item Reference:** [Link to retrospective action item if applicable]

### **Frontend Stack (Verified Versions)**
- **React:** `[X.Y.Z]` [✅/⏳/❌] [Installed & Verified / To Be Installed / Issues Found]
- **Vite:** `[X.Y.Z]` [Status]
- **TypeScript:** `[X.Y.Z]` [Status]
- **UI Framework:** [Framework Name] `[X.Y.Z]` [Status]
- **State Management:** [Library Name] `[X.Y.Z]` [Status]
- **Routing:** [Library Name] `[X.Y.Z]` [Status]
- **Node.js:** `[X.Y.Z LTS]` [Status] (Runtime Environment)
- **npm/yarn/pnpm:** `[X.Y.Z]` [Status] (Package Manager)

### **Backend Stack (Verified Versions)**
- **Framework:** [Framework Name] `[X.Y.Z]` [Status]
- **TypeScript:** `[X.Y.Z]` [Status]
- **ORM/Database Client:** [ORM Name] `[X.Y.Z]` [Status]
  - 🔒 **Version Lock Note:** [If locked, explain reason, e.g., "Breaking changes in v7"]
- **Node.js:** `[X.Y.Z LTS]` [Status] (Runtime Environment)
- **npm/yarn/pnpm:** `[X.Y.Z]` [Status] (Package Manager)

### **Database & Infrastructure (Deployed Versions)**
- **Database:** [Database Type & Version] [Status]
  - Provider: [e.g., Azure PostgreSQL Flexible Server, AWS RDS]
  - Instance: [Instance name/identifier]
  - Connection: [✅ Verified / ⏳ Pending / ❌ Issues]
- **Storage:** [Storage Service] [Status]
  - Provider: [e.g., Azure Blob Storage, AWS S3]
  - Account/Bucket: [Resource name]
  - Connection: [Status]
- **Cache:** [Cache Service] `[X.Y.Z]` [Status] (if applicable)
- **Message Queue:** [Queue Service] `[X.Y.Z]` [Status] (if applicable)

### **Sprint [N] New Dependencies (To Be Installed)**

#### **Backend Packages:**
```bash
# Install exact versions to avoid conflicts
npm install [package-1]@X.Y.Z [package-2]@X.Y.Z
npm install [dev-package-1]@X.Y.Z --save-dev

# Or using yarn
yarn add [package-1]@X.Y.Z [package-2]@X.Y.Z
yarn add -D [dev-package-1]@X.Y.Z
```

**Rationale for Version Choices:**
- `[package-1]@X.Y.Z`: [Reason, e.g., "Latest stable, compatible with NestJS 11"]
- `[package-2]@X.Y.Z`: [Reason, e.g., "Locked due to breaking changes in next major"]

#### **Frontend Packages:**
```bash
# Install exact versions
npm install [package-1]@X.Y.Z [package-2]@X.Y.Z
npm install [dev-package-1]@X.Y.Z --save-dev
```

**Rationale for Version Choices:**
- `[package-1]@X.Y.Z`: [Reason]
- `[package-2]@X.Y.Z`: [Reason]

### **Known Security Issues (From Previous Sprints)**
- ⚠️ **[Vulnerability Name]:** [Severity] severity issue in `[package-name]@[version]`
  - **Status:** [Risk accepted / Fix planned / Fixed]
  - **Fix:** [Remediation approach or reason for deferral]
  - **Re-evaluation:** [When to re-assess, e.g., "Before production deployment"]
  - **CVE/Advisory:** [Link to security advisory if applicable]

*(Delete this section if no known security issues)*

### **Version Management Best Practices**
1. ✅ **Use exact versions** in package.json (no `^` or `~` for critical packages)
2. ✅ **Lock major versions** when breaking changes are known (e.g., Prisma 6 vs 7)
3. ✅ **Test all npm installs** in dev environment before committing to main
4. ✅ **Run security audits** before sprint start: `npm audit` / `yarn audit`

🔗 **详细版本策略文档:** 参考 [docs/development/version-management-policy.md](../development/version-management-policy.md) (如需要，可创建)

### **Compatibility Matrix**
| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| [Package 1] | X.Y.Z | [Dependencies] | [Stability notes, known issues] |
| [Package 2] | X.Y.Z | [Dependencies] | [Stability notes, known issues] |
| [Package 3] | X.Y.Z | [Dependencies] | [Stability notes, known issues] |

**Legend:**
- ✅ = Verified working in current sprint
- 🔒 = Version locked (do not upgrade without team discussion)
- ⚠️ = Known issues, workaround documented
- 🆕 = New package added this sprint

---

## 📝 Version Verification Checklist

**Before Sprint Starts:**
- [ ] All versions in manifest match actual installed versions (`package.json`)
- [ ] Run `npm audit` (or `yarn audit`) to check for security vulnerabilities
- [ ] Test dev environment startup (backend + frontend)
- [ ] Verify Node.js version: `node -v` matches manifest
- [ ] Database connection working

**During Sprint (When Installing New Packages):**
- [ ] Check package version compatibility before installing
- [ ] Test in dev environment before committing
- [ ] Update this manifest with new package versions

**End of Sprint:**
- [ ] Update manifest with actual final versions (if any changes)
- [ ] Document any version-related issues encountered

---

## 🔄 Version Update Policy (Summary)

**Major Version Updates (X.0.0):**
- ❌ **Do NOT auto-upgrade** - Require spike/investigation before adoption
- ✅ Review changelog, test in isolated branch, get team approval

**Minor Version Updates (0.X.0):**
- ⚠️ **Review carefully** - May contain new features and minor breaking changes
- ✅ Review changelog, test in dev environment

**Patch Version Updates (0.0.X):**
- ✅ **Generally safe to upgrade** - Bug fixes and security patches
- ✅ Prioritize security patches (CVE fixes)

**Security Updates (Any Version):**
- ⚠️ **Immediate evaluation required** - Regardless of version bump type
- ✅ Critical/High: Fix immediately or document risk acceptance

🔗 **完整策略文档:** 参考 [docs/development/version-management-policy.md](../development/version-management-policy.md) (如需要)

---

## 📚 Additional Resources

- **Package Documentation:** [Links to official docs for key packages]
- **Changelog Tracking:** [Links to changelog pages for critical dependencies]
- **Security Advisories:** [Links to npm advisories, Snyk, GitHub Dependabot]
- **Previous Sprint Version Manifests:** [Links to previous sprint backlogs]
- **Architecture Decision Records:** [Links to ADRs related to version choices]

---

**Template Version:** 1.1  
**Created:** 2026-01-25  
**Last Updated:** 2026-01-29 (简化策略说明，保留核心内容)  
**Owner:** Product Manager / Tech Lead  
**Maintained By:** Development Team  
**Review Frequency:** Every sprint planning session
