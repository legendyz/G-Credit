# Sprint Version Manifest Template

> **Purpose:** Standard template for documenting exact technology versions in sprint planning documents  
> **Created:** 2026-01-25 (Action Item AI-1 from Sprint 0 Retrospective)  
> **Usage:** Copy this section into each sprint backlog document during sprint planning

---

## � 快速操作（推荐）

### **方法1：自动生成版本清单（最快！）**

在项目根目录运行自动化脚本：

```powershell
# 在 CODE/ 目录运行
.\gcredit-project\scripts\check-versions.ps1
```

**脚本会自动提取：**
- ✅ Frontend 所有关键依赖版本
- ✅ Backend 所有关键依赖版本
- ✅ Node.js / npm 版本
- ✅ Infrastructure 配置版本

**然后：**
1. 复制脚本输出
2. 粘贴到下方"Technology Version Manifest"部分
3. 根据需要添加注释和说明

**⏱️ 时间：** 30秒（vs 手动填写 10分钟）

---

### **方法2：手动运行 npm 命令**

```powershell
# Frontend 版本查看
cd gcredit-project/frontend
npm list --depth=0

# Backend 版本查看
cd gcredit-project/backend
npm list --depth=0
```

---

### **验证版本清单准确性（推荐在 Sprint Completion 时）**

创建 version manifest 后，运行验证脚本确保准确性：

```powershell
# 验证当前 Sprint 的版本清单
.\gcredit-project\scripts\verify-versions.ps1 -ManifestFile "docs/sprints/sprint-6/version-manifest.md"

# 输出示例：
# ✅ 版本清单完全准确！所有关键版本号匹配。
# 或
# ❌ Prisma: 不匹配！实际: 6.19.2 | Manifest: 7.0.0
```

**验证时机：**
- ✅ Sprint Planning 后（确认 manifest 填写准确）
- ✅ Sprint Completion 前（确认没有版本漂移）
- ✅ 安装新依赖后（确认 manifest 已更新）

---

## �🔧 Technology Version Manifest

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

**Template Version:** 1.2  
**Created:** 2026-01-25  
**Last Updated:** 2026-01-29 (添加自动化脚本 + BMad Agent集成)  
**Owner:** Product Manager / Tech Lead  
**Maintained By:** Development Team  
**Review Frequency:** Every sprint planning session

---

## 📌 自动化脚本说明

### **check-versions.ps1 - 自动提取版本号**
- **位置:** `gcredit-project/scripts/check-versions.ps1`
- **用途:** 从 package.json 自动提取所有依赖版本
- **执行方式:** 通过BMad Agent自动运行（推荐）或手动运行
- **输出:** 格式化的版本清单（可直接用于创建manifest）
- **时间:** 5秒

### **verify-versions.ps1 - 验证版本准确性**
- **位置:** `gcredit-project/scripts/verify-versions.ps1`
- **用途:** 对比 manifest 与实际 package.json，发现版本不匹配
- **执行方式:** 通过BMad Agent自动运行（推荐）或手动运行
- **输出:** 验证报告（通过 ✅ / 失败 ❌）
- **时间:** 5秒

**🤖 集成到BMad Agent工作流：**

| 阶段 | Agent命令 | 自动执行内容 |
|------|-----------|-------------|
| Sprint Planning | "创建Sprint N的版本清单" | 运行check-versions.ps1 → 创建manifest文档 |
| Sprint Completion | "验证Sprint N的版本清单" | 运行verify-versions.ps1 → 检查版本漂移 |
| 安装新依赖后 | "更新version manifest" | 重新运行check-versions.ps1 → 更新文档 |

**💡 BMad Agent工作原理：**
- Agent使用 `run_in_terminal` 工具执行PowerShell脚本
- 展示脚本输出给你review
- 在关键决策点询问确认（如：是否添加注释、是否修正不匹配）
- 自动创建或更新manifest文件
- 标记清单项完成
- **输出:** 验证报告（通过 ✅ / 失败 ❌）
- **时间:** 5秒

**🤖 集成到BMad Agent工作流：**

| 阶段 | Agent命令 | 自动执行内容 |
|------|-----------|-------------|
| Sprint Planning | "创建Sprint N的版本清单" | 运行check-versions.ps1 → 创建manifest文档 |
| Sprint Completion | "验证Sprint N的版本清单" | 运行verify-versions.ps1 → 检查版本漂移 |
| 安装新依赖后 | "更新version manifest" | 重新运行check-versions.ps1 → 更新文档 |

**💡 BMad Agent工作原理：**
- Agent使用 `run_in_terminal` 工具执行PowerShell脚本
- 展示脚本输出给你review
- 在关键决策点询问确认（如：是否添加注释、是否修正不匹配）
- 自动创建或更新manifest文件
- 标记清单项完成
